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
 * Aktivite değişikliği için olay verisi
 */
export interface ActivityEvent {
  /** Mevcut aktivite durumu */
  status: ActivityStatus;
  /** Olay zamanı */
  timestamp: Date;
  /** Son aktiviteden bu yana geçen süre (milisaniye) */
  timeSinceLastActivity?: number;
}

/**
 * BrowserActivityTracker yapılandırma seçenekleri
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
  useFocusEvents?: true;

  /**
   * Detaylı loglama aktif mi
   * Varsayılan: false
   */
  debug?: boolean;
}
