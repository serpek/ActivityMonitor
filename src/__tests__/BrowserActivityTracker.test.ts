import { BrowserActivityTracker } from '../BrowserActivityTracker';
import { ActivityStatus, ActivityEvent, ActivityReason } from '../types';

// Mock timers
jest.useFakeTimers();

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  postMessage(message: any) {
    // Mock implementation
  }

  close() {
    // Mock implementation
  }
}

(global as any).BroadcastChannel = MockBroadcastChannel;

describe('BrowserActivityTracker', () => {
  let tracker: BrowserActivityTracker;

  afterEach(() => {
    if (tracker) {
      tracker.destroy();
    }
    jest.clearAllTimers();
  });

  describe('Constructor ve Initialization', () => {
    it('varsayılan yapılandırma ile oluşturulabilmeli', () => {
      tracker = new BrowserActivityTracker();
      expect(tracker).toBeInstanceOf(BrowserActivityTracker);
      expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);
    });

    it('özel yapılandırma ile oluşturulabilmeli', () => {
      tracker = new BrowserActivityTracker({
        inactivityThreshold: 5000,
        throttleTime: 500,
        trackMouseActivity: true,
        trackKeyboardActivity: true,
        useMultiTabSync: false,
        debug: true
      });
      expect(tracker).toBeInstanceOf(BrowserActivityTracker);
    });

    it('activity$ observable doğru yapıda event yayınlamalı', (done) => {
      tracker = new BrowserActivityTracker();
      tracker.activity$.subscribe((event: ActivityEvent) => {
        expect(event).toHaveProperty('status');
        expect(event).toHaveProperty('reason');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('detailedState');
        expect(event).toHaveProperty('isCurrentTabActive');
        expect(event.timestamp).toBeInstanceOf(Date);
        done();
      });
    });

    it('benzersiz tab ID oluşturmalı', () => {
      tracker = new BrowserActivityTracker();
      const tabId = tracker.getTabId();
      expect(tabId).toBeTruthy();
      expect(tabId).toMatch(/^tab_/);
    });

    it('ilk reason initialization olmalı', (done) => {
      tracker = new BrowserActivityTracker();
      tracker.activity$.subscribe((event: ActivityEvent) => {
        expect(event.reason).toBe('initialization');
        done();
      });
    });
  });

  describe('Detaylı State Tracking', () => {
    it('detaylı state döndürebilmeli', () => {
      tracker = new BrowserActivityTracker();
      const state = tracker.getDetailedState();

      expect(state).toHaveProperty('windowVisible');
      expect(state).toHaveProperty('windowFocused');
      expect(state).toHaveProperty('pageVisible');
      expect(state).toHaveProperty('hasMouseActivity');
      expect(state).toHaveProperty('hasKeyboardActivity');
      expect(state).toHaveProperty('hasTouchActivity');
      expect(state).toHaveProperty('hasScrollActivity');
      expect(state).toHaveProperty('isScreenLocked');
      expect(state).toHaveProperty('isNetworkOnline');
      expect(state).toHaveProperty('isTabActive');
      expect(state).toHaveProperty('lastActivityTime');
    });

    it('başlangıçta doğru state değerleri olmalı', () => {
      tracker = new BrowserActivityTracker();
      const state = tracker.getDetailedState();

      expect(state.hasMouseActivity).toBe(false);
      expect(state.hasKeyboardActivity).toBe(false);
      expect(state.hasTouchActivity).toBe(false);
      expect(state.hasScrollActivity).toBe(false);
      expect(state.isTabActive).toBe(true);
      expect(state.lastActivityTime).toBeInstanceOf(Date);
    });
  });

  describe('Activity Reason Tracking', () => {
    it('fare aktivitesi doğru reason ile yayınlanmalı', (done) => {
      tracker = new BrowserActivityTracker({
        inactivityThreshold: 10000,
        throttleTime: 100
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          // İkinci event fare aktivitesi olmalı
          expect(['mouse_activity', 'user_interaction']).toContain(event.reason);
          done();
        }
      });

      tracker.start();

      const mouseEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(mouseEvent);

      jest.advanceTimersByTime(200);
    });

    it('klavye aktivitesi doğru reason ile yayınlanmalı', (done) => {
      tracker = new BrowserActivityTracker({
        throttleTime: 100
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(['keyboard_activity', 'user_interaction']).toContain(event.reason);
          done();
        }
      });

      tracker.start();

      const keyEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'a'
      });
      document.dispatchEvent(keyEvent);

      jest.advanceTimersByTime(200);
    });

    it('visibility değişikliği doğru reason ile yayınlanmalı', (done) => {
      tracker = new BrowserActivityTracker({
        useVisibilityApi: true
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event.reason).toBe('page_hidden');
          done();
        }
      });

      tracker.start();

      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });

      const visibilityEvent = new Event('visibilitychange');
      document.dispatchEvent(visibilityEvent);
    });

    it('inactivity timeout doğru reason ile yayınlanmalı', (done) => {
      const threshold = 5000;
      tracker = new BrowserActivityTracker({
        inactivityThreshold: threshold
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event.reason).toBe('inactivity_timeout');
          expect(event.status).toBe(ActivityStatus.INACTIVE);
          done();
        }
      });

      tracker.start();
      jest.advanceTimersByTime(threshold + 100);
    });
  });

  describe('start() ve stop()', () => {
    it('start() çağrıldığında izleme başlamalı', () => {
      tracker = new BrowserActivityTracker();
      tracker.start();
      expect(tracker.isCurrentlyTracking()).toBe(true);
    });

    it('stop() çağrıldığında izleme ve listener'lar durmalı', () => {
      tracker = new BrowserActivityTracker();
      tracker.start();
      tracker.stop();
      expect(tracker.isCurrentlyTracking()).toBe(false);
      expect(tracker.areListenersCurrentlyActive()).toBe(false);
    });

    it('birden fazla start() çağrısı sorun çıkarmamalı', () => {
      tracker = new BrowserActivityTracker({ debug: false });
      tracker.start();
      tracker.start();
      expect(tracker.isCurrentlyTracking()).toBe(true);
    });
  });

  describe('Multi-Activity Type Tracking', () => {
    it('fare aktivitesi detaylı state güncellenmeli', (done) => {
      tracker = new BrowserActivityTracker({
        trackMouseActivity: true,
        throttleTime: 100
      });

      tracker.start();

      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(mouseEvent);

      setTimeout(() => {
        const state = tracker.getDetailedState();
        expect(state.hasMouseActivity).toBe(true);
        expect(state.lastMouseActivityTime).toBeInstanceOf(Date);
        done();
      }, 200);

      jest.advanceTimersByTime(200);
    });

    it('scroll aktivitesi detaylı state güncellenmeli', (done) => {
      tracker = new BrowserActivityTracker({
        trackScrollActivity: true,
        throttleTime: 100
      });

      tracker.start();

      const scrollEvent = new Event('scroll', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(scrollEvent);

      setTimeout(() => {
        const state = tracker.getDetailedState();
        expect(state.hasScrollActivity).toBe(true);
        expect(state.lastScrollActivityTime).toBeInstanceOf(Date);
        done();
      }, 200);

      jest.advanceTimersByTime(200);
    });
  });

  describe('Window Focus/Blur', () => {
    it('window blur olduğunda INACTIVE ve doğru reason olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        useFocusEvents: true
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event.status).toBe(ActivityStatus.INACTIVE);
          expect(event.reason).toBe('window_blur');
          done();
        }
      });

      tracker.start();

      const blurEvent = new Event('blur');
      window.dispatchEvent(blurEvent);
    });

    it('window focus olduğunda ACTIVE ve doğru reason olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        useFocusEvents: true
      });

      tracker.start();

      // Önce blur
      const blurEvent = new Event('blur');
      window.dispatchEvent(blurEvent);

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event.status).toBe(ActivityStatus.ACTIVE);
          expect(event.reason).toBe('window_focus');
          done();
        }
      });

      // Sonra focus
      const focusEvent = new Event('focus');
      window.dispatchEvent(focusEvent);
    });
  });

  describe('Network Status Tracking', () => {
    it('ağ durumunu takip etmeli', () => {
      tracker = new BrowserActivityTracker({
        trackNetworkStatus: true
      });

      const state = tracker.getDetailedState();
      expect(state).toHaveProperty('isNetworkOnline');
      expect(typeof state.isNetworkOnline).toBe('boolean');
    });

    it('offline olduğunda INACTIVE olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        trackNetworkStatus: true
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event.reason).toBe('network_offline');
          expect(event.status).toBe(ActivityStatus.INACTIVE);
          done();
        }
      });

      tracker.start();

      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);
    });
  });

  describe('Tab Active State', () => {
    it('tab aktif durumunu raporlamalı', () => {
      tracker = new BrowserActivityTracker();
      tracker.start();
      expect(tracker.isTabActive()).toBe(true);
    });

    it('event\'de tab aktif durumu bulunmalı', (done) => {
      tracker = new BrowserActivityTracker();
      tracker.activity$.subscribe((event: ActivityEvent) => {
        expect(event).toHaveProperty('isCurrentTabActive');
        expect(typeof event.isCurrentTabActive).toBe('boolean');
        done();
      });
    });
  });

  describe('Getter Metodları', () => {
    it('getCurrentStatus() doğru durumu dönmeli', () => {
      tracker = new BrowserActivityTracker();
      tracker.start();
      expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);
    });

    it('getCurrentReason() doğru nedeni dönmeli', () => {
      tracker = new BrowserActivityTracker();
      const reason = tracker.getCurrentReason();
      expect(reason).toBe('initialization');
    });

    it('getLastActivityTime() geçerli bir Date dönmeli', () => {
      tracker = new BrowserActivityTracker();
      const lastActivityTime = tracker.getLastActivityTime();
      expect(lastActivityTime).toBeInstanceOf(Date);
      expect(lastActivityTime.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('isTabActive() boolean dönmeli', () => {
      tracker = new BrowserActivityTracker();
      expect(typeof tracker.isTabActive()).toBe('boolean');
    });

    it('areListenersCurrentlyActive() doğru değeri dönmeli', () => {
      tracker = new BrowserActivityTracker();
      expect(tracker.areListenersCurrentlyActive()).toBe(false);
      tracker.start();
      expect(tracker.areListenersCurrentlyActive()).toBe(true);
    });
  });

  describe('Throttling', () => {
    it('olaylar throttle edilmeli', (done) => {
      tracker = new BrowserActivityTracker({
        throttleTime: 1000
      });

      let eventCount = 0;
      tracker.activity$.subscribe(() => {
        eventCount++;
      });

      tracker.start();

      // Hızlıca birden fazla olay gönder
      for (let i = 0; i < 10; i++) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(clickEvent);
      }

      setTimeout(() => {
        // Throttle nedeniyle olaylar sınırlı olmalı
        expect(eventCount).toBeLessThan(5);
        done();
      }, 1500);

      jest.advanceTimersByTime(1500);
    });
  });

  describe('destroy()', () => {
    it('destroy() sonrası izleme durdurulmalı', () => {
      tracker = new BrowserActivityTracker();
      tracker.start();
      tracker.destroy();
      expect(tracker.isCurrentlyTracking()).toBe(false);
    });

    it('destroy() sonrası observable complete olmalı', (done) => {
      tracker = new BrowserActivityTracker();
      tracker.activity$.subscribe({
        complete: () => {
          done();
        }
      });
      tracker.destroy();
    });
  });

  describe('previousStatus Tracking', () => {
    it('event previousStatus içermeli', (done) => {
      const threshold = 2000;
      tracker = new BrowserActivityTracker({
        inactivityThreshold: threshold
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event).toHaveProperty('previousStatus');
          expect(event.previousStatus).toBe(ActivityStatus.ACTIVE);
          done();
        }
      });

      tracker.start();
      jest.advanceTimersByTime(threshold + 100);
    });
  });

  describe('Configuration Options', () => {
    it('trackMouseActivity false olduğunda fare olayları izlenmemeli', () => {
      tracker = new BrowserActivityTracker({
        trackMouseActivity: false
      });

      tracker.start();

      const mouseEvent = new MouseEvent('click', { bubbles: true });
      document.dispatchEvent(mouseEvent);

      jest.advanceTimersByTime(200);

      const state = tracker.getDetailedState();
      expect(state.hasMouseActivity).toBe(false);
    });

    it('useMultiTabSync false olduğunda BroadcastChannel kullanılmamalı', () => {
      tracker = new BrowserActivityTracker({
        useMultiTabSync: false
      });

      tracker.start();
      // BroadcastChannel kullanılmadığını test et
      // (detaylı test için mock kontrolü gerekir)
      expect(tracker.isCurrentlyTracking()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('browser environment olmadığında uyarı vermeli', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const originalWindow = global.window;
      const originalDocument = global.document;

      // @ts-ignore
      delete global.window;
      // @ts-ignore
      delete global.document;

      tracker = new BrowserActivityTracker();
      tracker.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        'BrowserActivityTracker: Browser environment not detected'
      );

      // Restore
      global.window = originalWindow;
      global.document = originalDocument;
      consoleSpy.mockRestore();
    });

    it('aynı durum ve neden tekrar set edilirse emit etmemeli', (done) => {
      tracker = new BrowserActivityTracker();

      let eventCount = 0;
      tracker.activity$.subscribe(() => {
        eventCount++;
      });

      tracker.start();

      // Aynı aktiviteyi birden fazla kez tetikle
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      document.dispatchEvent(clickEvent1);

      setTimeout(() => {
        const clickEvent2 = new MouseEvent('click', { bubbles: true });
        document.dispatchEvent(clickEvent2);
      }, 200);

      setTimeout(() => {
        // distinctUntilChanged sayesinde sadece ilk event emit edilmeli
        expect(eventCount).toBe(1);
        done();
      }, 500);

      jest.advanceTimersByTime(500);
    });
  });
});
