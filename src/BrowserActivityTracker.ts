import { BehaviorSubject, Observable, fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime, map, distinctUntilChanged } from 'rxjs/operators';
import { ActivityStatus, ActivityEvent, ActivityTrackerConfig } from './types';

/**
 * BrowserActivityTracker - Web tarayıcı penceresinde kullanıcı aktivitesini gözlemleyen sınıf
 *
 * Bu sınıf, fare hareketleri, klavye girişleri, dokunma olayları ve pencere odağı gibi
 * çeşitli tarayıcı olaylarını dinleyerek kullanıcının aktif olup olmadığını belirler.
 *
 * Aktivite durumu değişiklikleri RxJS Observable pattern kullanılarak yayınlanır,
 * böylece tüketici kod reaktif bir şekilde bu değişikliklere abone olabilir.
 *
 * @example
 * ```typescript
 * const tracker = new BrowserActivityTracker({
 *   inactivityThreshold: 30000, // 30 saniye
 *   throttleTime: 1000 // 1 saniye
 * });
 *
 * // Aktivite değişikliklerine abone ol
 * tracker.activity$.subscribe(event => {
 *   console.log('Aktivite durumu:', event.status);
 * });
 *
 * // İzlemeyi başlat
 * tracker.start();
 *
 * // İzlemeyi durdur
 * // tracker.stop();
 * ```
 */
export class BrowserActivityTracker {
  private readonly config: Required<ActivityTrackerConfig>;
  private activitySubject: BehaviorSubject<ActivityEvent>;
  private inactivityTimer: number | null = null;
  private lastActivityTime: Date;
  private isTracking = false;
  private eventSubscription: Subscription | null = null;
  private boundEventHandler: (() => void) | null = null;

  /**
   * Aktivite durumu değişikliklerini yayınlayan Observable
   * Tüketici kod bu observable'a abone olarak aktivite güncellemeleri alabilir
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
      debug: config.debug ?? false
    };

    this.lastActivityTime = new Date();

    // İlk aktivite durumunu belirle
    const initialStatus = this.determineInitialStatus();

    this.activitySubject = new BehaviorSubject<ActivityEvent>({
      status: initialStatus,
      timestamp: this.lastActivityTime
    });

    this.activity$ = this.activitySubject.asObservable().pipe(
      distinctUntilChanged((prev, curr) => prev.status === curr.status)
    );

    this.log('BrowserActivityTracker initialized', this.config);
  }

  /**
   * İlk aktivite durumunu belirler (sayfa görünürlüğü ve odak durumuna göre)
   */
  private determineInitialStatus(): ActivityStatus {
    if (typeof document === 'undefined') {
      return ActivityStatus.ACTIVE;
    }

    // Visibility API kontrolü
    if (this.config.useVisibilityApi && document.hidden) {
      return ActivityStatus.INACTIVE;
    }

    // Focus durumu kontrolü
    if (this.config.useFocusEvents && !document.hasFocus()) {
      return ActivityStatus.INACTIVE;
    }

    return ActivityStatus.ACTIVE;
  }

  /**
   * Kullanıcı aktivite izlemeyi başlatır
   *
   * Bu metod çağrıldığında, tüm tarayıcı olayları dinlenmeye başlanır
   * ve aktivite durumu değişiklikleri activity$ observable üzerinden yayınlanır.
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

    this.setupEventListeners();
    this.startInactivityTimer();
  }

  /**
   * Kullanıcı aktivite izlemeyi durdurur
   *
   * Tüm olay dinleyicileri kaldırılır ve kaynaklar temizlenir.
   */
  public stop(): void {
    if (!this.isTracking) {
      this.log('Tracking not started');
      return;
    }

    this.isTracking = false;
    this.log('Stopping activity tracking');

    this.clearInactivityTimer();
    this.removeEventListeners();
  }

  /**
   * Mevcut aktivite durumunu döndürür
   */
  public getCurrentStatus(): ActivityStatus {
    return this.activitySubject.value.status;
  }

  /**
   * Son aktivite zamanını döndürür
   */
  public getLastActivityTime(): Date {
    return this.lastActivityTime;
  }

  /**
   * Tracker'ın şu anda izleme yapıp yapmadığını döndürür
   */
  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Kaynakları temizler ve tracker'ı kapatır
   * Bu metod çağrıldıktan sonra tracker kullanılamaz hale gelir
   */
  public destroy(): void {
    this.stop();
    this.activitySubject.complete();
    this.log('Tracker destroyed');
  }

  /**
   * Tüm kullanıcı etkileşim olaylarını dinlemek için event listener'ları kurar
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Tüm aktivite olaylarını bir araya getir
    const activityEvents: Observable<Event>[] = [
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'keyup'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'scroll', { passive: true }),
      fromEvent(document, 'touchstart', { passive: true }),
      fromEvent(document, 'touchmove', { passive: true }),
      fromEvent(document, 'click'),
      fromEvent(window, 'wheel', { passive: true })
    ];

    // Tüm olayları birleştir ve throttle uygula
    this.eventSubscription = merge(...activityEvents)
      .pipe(
        throttleTime(this.config.throttleTime),
        map(() => this.createActivityEvent())
      )
      .subscribe(() => {
        this.handleUserActivity();
      });

    // Visibility API event listener'ı
    if (this.config.useVisibilityApi) {
      this.boundEventHandler = this.handleVisibilityChange.bind(this);
      document.addEventListener('visibilitychange', this.boundEventHandler);
    }

    // Focus/Blur event listener'ları
    if (this.config.useFocusEvents) {
      window.addEventListener('focus', this.handleFocus.bind(this));
      window.addEventListener('blur', this.handleBlur.bind(this));
    }

    this.log('Event listeners set up');
  }

  /**
   * Tüm event listener'ları kaldırır
   */
  private removeEventListeners(): void {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
      this.eventSubscription = null;
    }

    if (this.boundEventHandler && this.config.useVisibilityApi) {
      document.removeEventListener('visibilitychange', this.boundEventHandler);
      this.boundEventHandler = null;
    }

    if (this.config.useFocusEvents) {
      window.removeEventListener('focus', this.handleFocus.bind(this));
      window.removeEventListener('blur', this.handleBlur.bind(this));
    }

    this.log('Event listeners removed');
  }

  /**
   * Kullanıcı aktivitesi tespit edildiğinde çağrılır
   */
  private handleUserActivity(): void {
    const wasInactive = this.activitySubject.value.status === ActivityStatus.INACTIVE;

    this.lastActivityTime = new Date();
    this.startInactivityTimer();

    if (wasInactive) {
      this.setActivityStatus(ActivityStatus.ACTIVE);
      this.log('User became active');
    }
  }

  /**
   * Sayfa görünürlük değişikliğini işler (Visibility API)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.setActivityStatus(ActivityStatus.INACTIVE);
      this.clearInactivityTimer();
      this.log('Page hidden - user inactive');
    } else {
      this.setActivityStatus(ActivityStatus.ACTIVE);
      this.lastActivityTime = new Date();
      this.startInactivityTimer();
      this.log('Page visible - user active');
    }
  }

  /**
   * Pencere odağını kazandığında çağrılır
   */
  private handleFocus(): void {
    this.setActivityStatus(ActivityStatus.ACTIVE);
    this.lastActivityTime = new Date();
    this.startInactivityTimer();
    this.log('Window focused - user active');
  }

  /**
   * Pencere odağını kaybettiğinde çağrılır
   */
  private handleBlur(): void {
    this.setActivityStatus(ActivityStatus.INACTIVE);
    this.clearInactivityTimer();
    this.log('Window blurred - user inactive');
  }

  /**
   * Hareketsizlik zamanlayıcısını başlatır veya sıfırlar
   */
  private startInactivityTimer(): void {
    this.clearInactivityTimer();

    this.inactivityTimer = window.setTimeout(() => {
      this.setActivityStatus(ActivityStatus.INACTIVE);
      this.log('Inactivity threshold reached - user inactive');
    }, this.config.inactivityThreshold);
  }

  /**
   * Hareketsizlik zamanlayıcısını temizler
   */
  private clearInactivityTimer(): void {
    if (this.inactivityTimer !== null) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Aktivite durumunu günceller ve observable üzerinden yayınlar
   */
  private setActivityStatus(status: ActivityStatus): void {
    const currentStatus = this.activitySubject.value.status;

    if (currentStatus !== status) {
      const event = this.createActivityEvent(status);
      this.activitySubject.next(event);
    }
  }

  /**
   * ActivityEvent nesnesi oluşturur
   */
  private createActivityEvent(status?: ActivityStatus): ActivityEvent {
    const currentStatus = status ?? this.activitySubject.value.status;
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.lastActivityTime.getTime();

    return {
      status: currentStatus,
      timestamp: now,
      timeSinceLastActivity
    };
  }

  /**
   * Debug modu aktifse log mesajı yazdırır
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[BrowserActivityTracker] ${message}`, data ?? '');
    }
  }
}
