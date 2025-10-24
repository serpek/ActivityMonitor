/**
 * Kullanıcı aktivite durumunu temsil eden enum
 * ACTIVE: Kullanıcı şu anda pencereyle etkileşim halinde
 * INACTIVE: Kullanıcı belirli bir süre hareketsiz veya pencere odakta değil
 */
export enum ActivityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/**
 * Aktivite değişikliği nedenlerini temsil eden type
 */
export type ActivityReason =
  | 'user_interaction'       // Genel kullanıcı etkileşimi
  | 'mouse_activity'         // Fare hareketi tespit edildi
  | 'keyboard_activity'      // Klavye aktivitesi tespit edildi
  | 'touch_activity'         // Dokunma aktivitesi tespit edildi
  | 'scroll_activity'        // Scroll aktivitesi tespit edildi
  | 'window_focus'           // Pencere odak kazandı
  | 'window_blur'            // Pencere odak kaybetti
  | 'window_visible'         // Pencere görünür hale geldi
  | 'window_hidden'          // Pencere gizlendi
  | 'page_visible'           // Sayfa görünür (visibility API)
  | 'page_hidden'            // Sayfa gizli (visibility API)
  | 'screen_lock'            // Ekran kilidi
  | 'screen_unlock'          // Ekran kilidi açıldı
  | 'system_idle'            // Sistem boşta
  | 'system_active'          // Sistem aktif
  | 'network_offline'        // Ağ bağlantısı kesildi
  | 'network_online'         // Ağ bağlantısı kuruldu
  | 'inactivity_timeout'     // Hareketsizlik süresi doldu
  | 'tab_activated'          // Tab aktif hale geldi
  | 'tab_deactivated'        // Tab pasif hale geldi
  | 'initialization';        // İlk başlatma

/**
 * Detaylı aktivite durumu bilgileri
 */
export interface DetailedActivityState {
  /** Pencere görünür mü? */
  windowVisible: boolean;

  /** Pencere odakta mı? */
  windowFocused: boolean;

  /** Sayfa görünür mü? (Visibility API) */
  pageVisible: boolean;

  /** Fare aktivitesi var mı? */
  hasMouseActivity: boolean;

  /** Klavye aktivitesi var mı? */
  hasKeyboardActivity: boolean;

  /** Dokunma aktivitesi var mı? */
  hasTouchActivity: boolean;

  /** Scroll aktivitesi var mı? */
  hasScrollActivity: boolean;

  /** Ekran kilitli mi? */
  isScreenLocked: boolean;

  /** Ağ bağlantısı var mı? */
  isNetworkOnline: boolean;

  /** Tab aktif mi? */
  isTabActive: boolean;

  /** Son aktivite zamanı */
  lastActivityTime: Date;

  /** Son fare aktivitesi zamanı */
  lastMouseActivityTime?: Date;

  /** Son klavye aktivitesi zamanı */
  lastKeyboardActivityTime?: Date;

  /** Son dokunma aktivitesi zamanı */
  lastTouchActivityTime?: Date;

  /** Son scroll aktivitesi zamanı */
  lastScrollActivityTime?: Date;
}

/**
 * Aktivite değişikliği için gelişmiş olay verisi
 */
export interface ActivityEvent {
  /** Mevcut aktivite durumu */
  status: ActivityStatus;

  /** Aktivite değişikliği nedeni */
  reason: ActivityReason;

  /** Olay zamanı */
  timestamp: Date;

  /** Son aktiviteden bu yana geçen süre (milisaniye) */
  timeSinceLastActivity?: number;

  /** Detaylı aktivite durumu */
  detailedState: DetailedActivityState;

  /** Bu tab aktif mi? */
  isCurrentTabActive: boolean;

  /** Aktivite değişikliği önceki durum */
  previousStatus?: ActivityStatus;
}

/**
 * Tab'ler arası iletişim mesaj türü
 */
export interface TabSyncMessage {
  /** Mesaj türü */
  type: 'activity_update' | 'tab_activated' | 'tab_deactivated' | 'state_request' | 'state_response';

  /** Tab benzersiz kimliği */
  tabId: string;

  /** Zaman damgası */
  timestamp: number;

  /** Aktivite durumu (varsa) */
  activityState?: {
    status: ActivityStatus;
    reason: ActivityReason;
    detailedState: DetailedActivityState;
  };

  /** İstek ID'si (state_request/response için) */
  requestId?: string;
}

/**
 * BrowserActivityTracker gelişmiş yapılandırma seçenekleri
 */
export interface ActivityTrackerConfig {
  /**
   * Kullanıcının hareketsiz kabul edilmesi için geçmesi gereken süre (milisaniye)
   * Varsayılan: 30000 (30 saniye)
   */
  inactivityThreshold?: number;

  /**
   * Throttle süresi - olayların ne sıklıkla işleneceği (milisaniye)
   * Varsayılan: 1000 (1 saniye)
   */
  throttleTime?: number;

  /**
   * Visibility API'yi kullanıp kullanmayacağını belirtir
   * Varsayılan: true
   */
  useVisibilityApi?: boolean;

  /**
   * Odaklanma olaylarını dinleyip dinlemeyeceğini belirtir
   * Varsayılan: true
   */
  useFocusEvents?: boolean;

  /**
   * Fare aktivitelerini izle
   * Varsayılan: true
   */
  trackMouseActivity?: boolean;

  /**
   * Klavye aktivitelerini izle
   * Varsayılan: true
   */
  trackKeyboardActivity?: boolean;

  /**
   * Dokunma aktivitelerini izle
   * Varsayılan: true
   */
  trackTouchActivity?: boolean;

  /**
   * Scroll aktivitelerini izle
   * Varsayılan: true
   */
  trackScrollActivity?: boolean;

  /**
   * Ekran kilidi durumunu izle (Screen Wake Lock API)
   * Varsayılan: true
   */
  trackScreenLock?: boolean;

  /**
   * Ağ durumunu izle
   * Varsayılan: true
   */
  trackNetworkStatus?: boolean;

  /**
   * Multi-tab koordinasyonu kullan
   * Varsayılan: true
   */
  useMultiTabSync?: boolean;

  /**
   * Multi-tab koordinasyonu için kanal adı
   * Varsayılan: 'browser_activity_tracker'
   */
  syncChannelName?: string;

  /**
   * Aktif olmayan tab'lerde listener'ları durdur
   * Varsayılan: true
   */
  pauseListenersOnInactiveTab?: boolean;

  /**
   * Detaylı aktivite durumunu yayınla
   * Varsayılan: true
   */
  emitDetailedState?: boolean;

  /**
   * Detaylı loglama aktif mi
   * Varsayılan: false
   */
  debug?: boolean;
}
