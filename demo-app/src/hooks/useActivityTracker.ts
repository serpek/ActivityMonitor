import { useState, useEffect, useRef } from 'react';
import { BrowserActivityTracker } from 'browser-activity-tracker';
import type { ActivityEvent, ActivityStatus, ActivityReason, DetailedActivityState } from 'browser-activity-tracker';

export interface ActivityStats {
  totalEvents: number;
  activeTime: number;
  inactiveTime: number;
  mouseActivityCount: number;
  keyboardActivityCount: number;
  touchActivityCount: number;
  scrollActivityCount: number;
  lastStatusChange: Date | null;
}

export interface ActivityLog {
  id: string;
  event: ActivityEvent;
  timestamp: Date;
}

export interface UseActivityTrackerReturn {
  tracker: BrowserActivityTracker | null;
  currentStatus: ActivityStatus;
  currentReason: ActivityReason;
  detailedState: DetailedActivityState | null;
  isTracking: boolean;
  isTabActive: boolean;
  areListenersActive: boolean;
  stats: ActivityStats;
  logs: ActivityLog[];
  tabId: string;
  start: () => void;
  stop: () => void;
  clearLogs: () => void;
}

const initialStats: ActivityStats = {
  totalEvents: 0,
  activeTime: 0,
  inactiveTime: 0,
  mouseActivityCount: 0,
  keyboardActivityCount: 0,
  touchActivityCount: 0,
  scrollActivityCount: 0,
  lastStatusChange: null
};

export const useActivityTracker = (config?: any): UseActivityTrackerReturn => {
  const trackerRef = useRef<BrowserActivityTracker | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ActivityStatus>('ACTIVE' as ActivityStatus);
  const [currentReason, setCurrentReason] = useState<ActivityReason>('initialization');
  const [detailedState, setDetailedState] = useState<DetailedActivityState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const [areListenersActive, setAreListenersActive] = useState(false);
  const [stats, setStats] = useState<ActivityStats>(initialStats);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tabId, setTabId] = useState('');

  const lastStatusChangeTime = useRef<Date>(new Date());

  useEffect(() => {
    // Tracker oluştur
    const tracker = new BrowserActivityTracker({
      inactivityThreshold: 10000, // 10 saniye (demo için kısa)
      throttleTime: 500,
      useMultiTabSync: true,
      pauseListenersOnInactiveTab: true,
      trackMouseActivity: true,
      trackKeyboardActivity: true,
      trackTouchActivity: true,
      trackScrollActivity: true,
      trackNetworkStatus: true,
      debug: true,
      ...config
    });

    trackerRef.current = tracker;
    setTabId(tracker.getTabId());

    // Subscribe to activity changes
    const subscription = tracker.activity$.subscribe((event: ActivityEvent) => {
      console.log('Activity Event:', event);

      setCurrentStatus(event.status);
      setCurrentReason(event.reason);
      setDetailedState(event.detailedState);
      setIsTabActive(event.isCurrentTabActive);

      // Update stats
      const now = new Date();
      const timeDiff = now.getTime() - lastStatusChangeTime.current.getTime();

      setStats(prev => {
        const newStats = {
          ...prev,
          totalEvents: prev.totalEvents + 1,
          lastStatusChange: now
        };

        // Update time stats
        if (event.previousStatus === 'ACTIVE') {
          newStats.activeTime = prev.activeTime + timeDiff;
        } else if (event.previousStatus === 'INACTIVE') {
          newStats.inactiveTime = prev.inactiveTime + timeDiff;
        }

        // Update activity counts
        switch (event.reason) {
          case 'mouse_activity':
            newStats.mouseActivityCount = prev.mouseActivityCount + 1;
            break;
          case 'keyboard_activity':
            newStats.keyboardActivityCount = prev.keyboardActivityCount + 1;
            break;
          case 'touch_activity':
            newStats.touchActivityCount = prev.touchActivityCount + 1;
            break;
          case 'scroll_activity':
            newStats.scrollActivityCount = prev.scrollActivityCount + 1;
            break;
        }

        return newStats;
      });

      lastStatusChangeTime.current = now;

      // Add to logs (keep last 100)
      setLogs(prev => {
        const newLog: ActivityLog = {
          id: `${Date.now()}_${Math.random()}`,
          event,
          timestamp: now
        };
        return [newLog, ...prev].slice(0, 100);
      });
    });

    return () => {
      subscription.unsubscribe();
      tracker.destroy();
    };
  }, []);

  const start = () => {
    if (trackerRef.current) {
      trackerRef.current.start();
      setIsTracking(true);
      setAreListenersActive(trackerRef.current.areListenersCurrentlyActive());
    }
  };

  const stop = () => {
    if (trackerRef.current) {
      trackerRef.current.stop();
      setIsTracking(false);
      setAreListenersActive(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStats(initialStats);
  };

  // Update listeners active state periodically
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      if (trackerRef.current) {
        setAreListenersActive(trackerRef.current.areListenersCurrentlyActive());
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isTracking]);

  return {
    tracker: trackerRef.current,
    currentStatus,
    currentReason,
    detailedState,
    isTracking,
    isTabActive,
    areListenersActive,
    stats,
    logs,
    tabId,
    start,
    stop,
    clearLogs
  };
};
