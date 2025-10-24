import { BehaviorSubject, Observable, fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime, distinctUntilChanged, filter } from 'rxjs/operators';
import {
  ActivityStatus,
  ActivityEvent,
  ActivityTrackerConfig,
  ActivityReason,
  DetailedActivityState,
  TabSyncMessage
} from './types';

/**
 * BrowserActivityTracker - Gelişmiş web tarayıcı aktivite izleyici
 *
 * Bu sınıf, kullanıcının web sayfası ile etkileşimde olup olmadığını detaylı bir şekilde izler:
 * - Fare, klavye, dokunma ve scroll aktiviteleri
 * - Pencere odağı ve görünürlük durumu
 * - Ekran kilidi durumu
 * - Ağ bağlantısı durumu
 * - Multi-tab koordinasyonu (sadece aktif tab'de listener'lar çalışır)
 * - Her aktivite değişikliği için detaylı neden bilgisi
 *
 * @example
 * ```typescript
 * const tracker = new BrowserActivityTracker({
 *   inactivityThreshold: 30000,
 *   useMultiTabSync: true
 * });
 *
 * tracker.activity$.subscribe(event => {
 *   console.log('Status:', event.status);
 *   console.log('Reason:', event.reason);
 *   console.log('Detailed State:', event.detailedState);
 * });
 *
 * tracker.start();
 * ```
 */
export class BrowserActivityTracker {
  private readonly config: Required<ActivityTrackerConfig>;
  private activitySubject: BehaviorSubject<ActivityEvent>;
  private inactivityTimer: number | null = null;

  // Detaylı state tracking
  private detailedState: DetailedActivityState;

  // Event subscriptions
  private mouseSubscription: Subscription | null = null;
  private keyboardSubscription: Subscription | null = null;
  private touchSubscription: Subscription | null = null;
  private scrollSubscription: Subscription | null = null;

  // Diğer event handler'lar
  private visibilityHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  // Multi-tab koordinasyonu
  private broadcastChannel: BroadcastChannel | null = null;
  private readonly tabId: string;
  private isCurrentTabActive = true;

  // Tracking durumu
  private isTracking = false;
  private areListenersActive = false;

  /**
   * Aktivite durumu değişikliklerini yayınlayan Observable
   */
  public readonly activity$: Observable<ActivityEvent>;

  /**
   * BrowserActivityTracker constructor
   *
   * @param config - Yapılandırma seçenekleri
   */
  constructor(config: ActivityTrackerConfig = {}) {
    // Varsayılan yapılandırmayı kullanıcı yapılandırmasıyla birleştir
    this.config = {
      inactivityThreshold: config.inactivityThreshold ?? 30000,
      throttleTime: config.throttleTime ?? 1000,
      useVisibilityApi: config.useVisibilityApi ?? true,
      useFocusEvents: config.useFocusEvents ?? true,
      trackMouseActivity: config.trackMouseActivity ?? true,
      trackKeyboardActivity: config.trackKeyboardActivity ?? true,
      trackTouchActivity: config.trackTouchActivity ?? true,
      trackScrollActivity: config.trackScrollActivity ?? true,
      trackScreenLock: config.trackScreenLock ?? true,
      trackNetworkStatus: config.trackNetworkStatus ?? true,
      useMultiTabSync: config.useMultiTabSync ?? true,
      syncChannelName: config.syncChannelName ?? 'browser_activity_tracker',
      pauseListenersOnInactiveTab: config.pauseListenersOnInactiveTab ?? true,
      emitDetailedState: config.emitDetailedState ?? true,
      debug: config.debug ?? false
    };

    // Benzersiz tab ID oluştur
    this.tabId = this.generateTabId();

    // İlk detaylı state'i oluştur
    this.detailedState = this.createInitialDetailedState();

    // İlk aktivite durumunu belirle
    const initialStatus = this.determineInitialStatus();
    const initialEvent = this.createActivityEvent(
      initialStatus,
      'initialization'
    );

    this.activitySubject = new BehaviorSubject<ActivityEvent>(initialEvent);

    // Observable'ı oluştur - durum değişikliklerini filtrele
    this.activity$ = this.activitySubject.asObservable().pipe(
      distinctUntilChanged((prev, curr) =>
        prev.status === curr.status &&
        prev.reason === curr.reason
      )
    );

    this.log('BrowserActivityTracker initialized', {
      tabId: this.tabId,
      config: this.config,
      initialState: this.detailedState
    });
  }

  /**
   * Benzersiz tab ID oluştur
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * İlk detaylı state'i oluştur
   */
  private createInitialDetailedState(): DetailedActivityState {
    const now = new Date();

    return {
      windowVisible: typeof document !== 'undefined' ? !document.hidden : true,
      windowFocused: typeof document !== 'undefined' ? document.hasFocus() : true,
      pageVisible: typeof document !== 'undefined' ? !document.hidden : true,
      hasMouseActivity: false,
      hasKeyboardActivity: false,
      hasTouchActivity: false,
      hasScrollActivity: false,
      isScreenLocked: false,
      isNetworkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isTabActive: true,
      lastActivityTime: now
    };
  }

  /**
   * İlk aktivite durumunu belirle
   */
  private determineInitialStatus(): ActivityStatus {
    if (typeof document === 'undefined') {
      return ActivityStatus.ACTIVE;
    }

    // Sayfa gizli veya odakta değilse INACTIVE
    if (this.config.useVisibilityApi && document.hidden) {
      return ActivityStatus.INACTIVE;
    }

    if (this.config.useFocusEvents && !document.hasFocus()) {
      return ActivityStatus.INACTIVE;
    }

    return ActivityStatus.ACTIVE;
  }

  /**
   * Kullanıcı aktivite izlemeyi başlat
   */
  public start(): void {
    if (this.isTracking) {
      this.log('Tracking already started');
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('BrowserActivityTracker: Browser environment not detected');
      return;
    }

    this.isTracking = true;
    this.log('Starting activity tracking');

    // Multi-tab koordinasyonu başlat
    if (this.config.useMultiTabSync) {
      this.setupMultiTabSync();
    }

    // Tab'ın aktif olup olmadığını kontrol et
    this.checkTabActiveState();

    // Listener'ları başlat (tab aktifse)
    if (this.isCurrentTabActive || !this.config.pauseListenersOnInactiveTab) {
      this.startListeners();
    }

    // Hareketsizlik timer'ını başlat
    this.startInactivityTimer();
  }

  /**
   * Kullanıcı aktivite izlemeyi durdur
   */
  public stop(): void {
    if (!this.isTracking) {
      this.log('Tracking not started');
      return;
    }

    this.isTracking = false;
    this.log('Stopping activity tracking');

    this.stopListeners();
    this.clearInactivityTimer();

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }

  /**
   * Event listener'ları başlat
   */
  private startListeners(): void {
    if (this.areListenersActive) {
      return;
    }

    this.areListenersActive = true;
    this.log('Starting event listeners');

    // Fare aktiviteleri
    if (this.config.trackMouseActivity) {
      this.setupMouseListeners();
    }

    // Klavye aktiviteleri
    if (this.config.trackKeyboardActivity) {
      this.setupKeyboardListeners();
    }

    // Dokunma aktiviteleri
    if (this.config.trackTouchActivity) {
      this.setupTouchListeners();
    }

    // Scroll aktiviteleri
    if (this.config.trackScrollActivity) {
      this.setupScrollListeners();
    }

    // Visibility API
    if (this.config.useVisibilityApi) {
      this.setupVisibilityListener();
    }

    // Focus/Blur events
    if (this.config.useFocusEvents) {
      this.setupFocusListeners();
    }

    // Network status
    if (this.config.trackNetworkStatus) {
      this.setupNetworkListeners();
    }
  }

  /**
   * Event listener'ları durdur
   */
  private stopListeners(): void {
    if (!this.areListenersActive) {
      return;
    }

    this.areListenersActive = false;
    this.log('Stopping event listeners');

    // Tüm subscriptions'ları iptal et
    if (this.mouseSubscription) {
      this.mouseSubscription.unsubscribe();
      this.mouseSubscription = null;
    }

    if (this.keyboardSubscription) {
      this.keyboardSubscription.unsubscribe();
      this.keyboardSubscription = null;
    }

    if (this.touchSubscription) {
      this.touchSubscription.unsubscribe();
      this.touchSubscription = null;
    }

    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
      this.scrollSubscription = null;
    }

    // Diğer event listener'ları kaldır
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.focusHandler && this.blurHandler) {
      window.removeEventListener('focus', this.focusHandler);
      window.removeEventListener('blur', this.blurHandler);
      this.focusHandler = null;
      this.blurHandler = null;
    }

    if (this.onlineHandler && this.offlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
      this.onlineHandler = null;
      this.offlineHandler = null;
    }
  }

  /**
   * Fare event listener'larını kur
   */
  private setupMouseListeners(): void {
    const mouseEvents = [
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'mouseup'),
      fromEvent(document, 'click'),
      fromEvent(window, 'wheel', { passive: true })
    ];

    this.mouseSubscription = merge(...mouseEvents)
      .pipe(throttleTime(this.config.throttleTime))
      .subscribe(() => {
        this.handleMouseActivity();
      });
  }

  /**
   * Klavye event listener'larını kur
   */
  private setupKeyboardListeners(): void {
    const keyboardEvents = [
      fromEvent(document, 'keydown'),
      fromEvent(document, 'keyup'),
      fromEvent(document, 'keypress')
    ];

    this.keyboardSubscription = merge(...keyboardEvents)
      .pipe(throttleTime(this.config.throttleTime))
      .subscribe(() => {
        this.handleKeyboardActivity();
      });
  }

  /**
   * Dokunma event listener'larını kur
   */
  private setupTouchListeners(): void {
    const touchEvents = [
      fromEvent(document, 'touchstart', { passive: true }),
      fromEvent(document, 'touchmove', { passive: true }),
      fromEvent(document, 'touchend', { passive: true })
    ];

    this.touchSubscription = merge(...touchEvents)
      .pipe(throttleTime(this.config.throttleTime))
      .subscribe(() => {
        this.handleTouchActivity();
      });
  }

  /**
   * Scroll event listener'larını kur
   */
  private setupScrollListeners(): void {
    this.scrollSubscription = fromEvent(document, 'scroll', { passive: true })
      .pipe(throttleTime(this.config.throttleTime))
      .subscribe(() => {
        this.handleScrollActivity();
      });
  }

  /**
   * Visibility API listener'ını kur
   */
  private setupVisibilityListener(): void {
    this.visibilityHandler = () => {
      this.handleVisibilityChange();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Focus/Blur listener'larını kur
   */
  private setupFocusListeners(): void {
    this.focusHandler = () => {
      this.handleWindowFocus();
    };
    this.blurHandler = () => {
      this.handleWindowBlur();
    };

    window.addEventListener('focus', this.focusHandler);
    window.addEventListener('blur', this.blurHandler);
  }

  /**
   * Network status listener'larını kur
   */
  private setupNetworkListeners(): void {
    this.onlineHandler = () => {
      this.handleNetworkOnline();
    };
    this.offlineHandler = () => {
      this.handleNetworkOffline();
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  /**
   * Fare aktivitesi işle
   */
  private handleMouseActivity(): void {
    this.log('Mouse activity detected');

    const now = new Date();
    this.detailedState.hasMouseActivity = true;
    this.detailedState.lastMouseActivityTime = now;
    this.detailedState.lastActivityTime = now;

    this.handleUserActivity('mouse_activity');
  }

  /**
   * Klavye aktivitesi işle
   */
  private handleKeyboardActivity(): void {
    this.log('Keyboard activity detected');

    const now = new Date();
    this.detailedState.hasKeyboardActivity = true;
    this.detailedState.lastKeyboardActivityTime = now;
    this.detailedState.lastActivityTime = now;

    this.handleUserActivity('keyboard_activity');
  }

  /**
   * Dokunma aktivitesi işle
   */
  private handleTouchActivity(): void {
    this.log('Touch activity detected');

    const now = new Date();
    this.detailedState.hasTouchActivity = true;
    this.detailedState.lastTouchActivityTime = now;
    this.detailedState.lastActivityTime = now;

    this.handleUserActivity('touch_activity');
  }

  /**
   * Scroll aktivitesi işle
   */
  private handleScrollActivity(): void {
    this.log('Scroll activity detected');

    const now = new Date();
    this.detailedState.hasScrollActivity = true;
    this.detailedState.lastScrollActivityTime = now;
    this.detailedState.lastActivityTime = now;

    this.handleUserActivity('scroll_activity');
  }

  /**
   * Genel kullanıcı aktivitesi işle
   */
  private handleUserActivity(reason: ActivityReason): void {
    const wasInactive = this.activitySubject.value.status === ActivityStatus.INACTIVE;

    this.startInactivityTimer();

    if (wasInactive) {
      this.setActivityStatus(ActivityStatus.ACTIVE, reason);
      this.log('User became active', { reason });
    }
  }

  /**
   * Visibility değişikliğini işle
   */
  private handleVisibilityChange(): void {
    const isHidden = document.hidden;

    this.detailedState.pageVisible = !isHidden;

    if (isHidden) {
      this.log('Page hidden');
      this.setActivityStatus(ActivityStatus.INACTIVE, 'page_hidden');
      this.clearInactivityTimer();
    } else {
      this.log('Page visible');
      this.detailedState.lastActivityTime = new Date();
      this.setActivityStatus(ActivityStatus.ACTIVE, 'page_visible');
      this.startInactivityTimer();
    }
  }

  /**
   * Window odak kazandığında işle
   */
  private handleWindowFocus(): void {
    this.log('Window focused');

    this.detailedState.windowFocused = true;
    this.detailedState.windowVisible = true;
    this.detailedState.lastActivityTime = new Date();

    this.setActivityStatus(ActivityStatus.ACTIVE, 'window_focus');
    this.startInactivityTimer();
  }

  /**
   * Window odak kaybettiğinde işle
   */
  private handleWindowBlur(): void {
    this.log('Window blurred');

    this.detailedState.windowFocused = false;

    this.setActivityStatus(ActivityStatus.INACTIVE, 'window_blur');
    this.clearInactivityTimer();
  }

  /**
   * Network online olduğunda işle
   */
  private handleNetworkOnline(): void {
    this.log('Network online');

    this.detailedState.isNetworkOnline = true;
    this.setActivityStatus(ActivityStatus.ACTIVE, 'network_online');
  }

  /**
   * Network offline olduğunda işle
   */
  private handleNetworkOffline(): void {
    this.log('Network offline');

    this.detailedState.isNetworkOnline = false;
    this.setActivityStatus(ActivityStatus.INACTIVE, 'network_offline');
  }

  /**
   * Hareketsizlik timer'ını başlat
   */
  private startInactivityTimer(): void {
    this.clearInactivityTimer();

    this.inactivityTimer = window.setTimeout(() => {
      this.log('Inactivity threshold reached');
      this.setActivityStatus(ActivityStatus.INACTIVE, 'inactivity_timeout');
    }, this.config.inactivityThreshold);
  }

  /**
   * Hareketsizlik timer'ını temizle
   */
  private clearInactivityTimer(): void {
    if (this.inactivityTimer !== null) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Aktivite durumunu güncelle
   */
  private setActivityStatus(status: ActivityStatus, reason: ActivityReason): void {
    const currentStatus = this.activitySubject.value.status;
    const currentReason = this.activitySubject.value.reason;

    // Aynı durum ve neden ise skip et
    if (currentStatus === status && currentReason === reason) {
      return;
    }

    const event = this.createActivityEvent(status, reason, currentStatus);
    this.activitySubject.next(event);

    // Multi-tab sync varsa diğer tab'lere bildir
    if (this.config.useMultiTabSync && this.broadcastChannel) {
      this.broadcastActivityUpdate(event);
    }
  }

  /**
   * ActivityEvent oluştur
   */
  private createActivityEvent(
    status: ActivityStatus,
    reason: ActivityReason,
    previousStatus?: ActivityStatus
  ): ActivityEvent {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.detailedState.lastActivityTime.getTime();

    return {
      status,
      reason,
      timestamp: now,
      timeSinceLastActivity,
      detailedState: { ...this.detailedState },
      isCurrentTabActive: this.isCurrentTabActive,
      previousStatus
    };
  }

  /**
   * Multi-tab koordinasyonu kur
   */
  private setupMultiTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') {
      this.log('BroadcastChannel not supported');
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel(this.config.syncChannelName);

      this.broadcastChannel.onmessage = (event: MessageEvent<TabSyncMessage>) => {
        this.handleTabSyncMessage(event.data);
      };

      // Diğer tab'lere bu tab'ın aktif olduğunu bildir
      this.broadcastTabActivation();

      this.log('Multi-tab sync initialized', { channel: this.config.syncChannelName });
    } catch (error) {
      console.error('Failed to setup BroadcastChannel:', error);
    }
  }

  /**
   * Tab'ler arası mesaj işle
   */
  private handleTabSyncMessage(message: TabSyncMessage): void {
    // Kendi mesajlarını ignore et
    if (message.tabId === this.tabId) {
      return;
    }

    this.log('Received tab sync message', message);

    switch (message.type) {
      case 'tab_activated':
        // Başka bir tab aktif oldu, bu tab pasif
        if (this.isCurrentTabActive) {
          this.handleTabDeactivation();
        }
        break;

      case 'tab_deactivated':
        // Başka bir tab deaktif oldu
        break;

      case 'activity_update':
        // Başka tab'den aktivite güncellemesi
        if (message.activityState && !this.isCurrentTabActive) {
          // Pasif tab ise aktif tab'den gelen state'i kullan
          this.log('Received activity update from active tab', message.activityState);
        }
        break;

      case 'state_request':
        // State isteği aldı, cevap gönder
        if (this.isCurrentTabActive) {
          this.broadcastStateResponse(message.requestId);
        }
        break;

      case 'state_response':
        // State cevabı aldı
        break;
    }
  }

  /**
   * Tab aktif mi kontrol et
   */
  private checkTabActiveState(): void {
    // İlk başlangıçta sayfa görünürse ve odaktaysa bu tab aktif
    const isVisible = !document.hidden;
    const hasFocus = document.hasFocus();

    this.isCurrentTabActive = isVisible && hasFocus;
    this.detailedState.isTabActive = this.isCurrentTabActive;

    this.log('Tab active state checked', {
      isActive: this.isCurrentTabActive,
      isVisible,
      hasFocus
    });
  }

  /**
   * Tab aktif olduğunu bildir
   */
  private broadcastTabActivation(): void {
    if (!this.broadcastChannel) return;

    const message: TabSyncMessage = {
      type: 'tab_activated',
      tabId: this.tabId,
      timestamp: Date.now()
    };

    this.broadcastChannel.postMessage(message);
    this.log('Broadcasted tab activation');
  }

  /**
   * Tab deaktif olduğunu işle
   */
  private handleTabDeactivation(): void {
    this.log('Tab deactivated');

    this.isCurrentTabActive = false;
    this.detailedState.isTabActive = false;

    // Listener'ları durdur
    if (this.config.pauseListenersOnInactiveTab) {
      this.stopListeners();
    }

    this.setActivityStatus(ActivityStatus.INACTIVE, 'tab_deactivated');
  }

  /**
   * Aktivite güncellemesini broadcast et
   */
  private broadcastActivityUpdate(event: ActivityEvent): void {
    if (!this.broadcastChannel || !this.isCurrentTabActive) return;

    const message: TabSyncMessage = {
      type: 'activity_update',
      tabId: this.tabId,
      timestamp: Date.now(),
      activityState: {
        status: event.status,
        reason: event.reason,
        detailedState: event.detailedState
      }
    };

    this.broadcastChannel.postMessage(message);
  }

  /**
   * State response broadcast et
   */
  private broadcastStateResponse(requestId?: string): void {
    if (!this.broadcastChannel) return;

    const currentEvent = this.activitySubject.value;

    const message: TabSyncMessage = {
      type: 'state_response',
      tabId: this.tabId,
      timestamp: Date.now(),
      requestId,
      activityState: {
        status: currentEvent.status,
        reason: currentEvent.reason,
        detailedState: currentEvent.detailedState
      }
    };

    this.broadcastChannel.postMessage(message);
  }

  /**
   * Mevcut aktivite durumunu al
   */
  public getCurrentStatus(): ActivityStatus {
    return this.activitySubject.value.status;
  }

  /**
   * Mevcut aktivite nedenini al
   */
  public getCurrentReason(): ActivityReason {
    return this.activitySubject.value.reason;
  }

  /**
   * Detaylı aktivite durumunu al
   */
  public getDetailedState(): DetailedActivityState {
    return { ...this.detailedState };
  }

  /**
   * Son aktivite zamanını al
   */
  public getLastActivityTime(): Date {
    return this.detailedState.lastActivityTime;
  }

  /**
   * Tab'ın aktif olup olmadığını al
   */
  public isTabActive(): boolean {
    return this.isCurrentTabActive;
  }

  /**
   * İzleme durumunu al
   */
  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Listener'ların aktif olup olmadığını al
   */
  public areListenersCurrentlyActive(): boolean {
    return this.areListenersActive;
  }

  /**
   * Tab ID'sini al
   */
  public getTabId(): string {
    return this.tabId;
  }

  /**
   * Kaynakları temizle ve tracker'ı kapat
   */
  public destroy(): void {
    this.stop();
    this.activitySubject.complete();
    this.log('Tracker destroyed');
  }

  /**
   * Debug log
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      const logData = data ? data : '';
      console.log(`[BrowserActivityTracker:${this.tabId}] ${message}`, logData);
    }
  }
}
