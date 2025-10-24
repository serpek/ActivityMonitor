/**
 * Browser Activity Tracker - Kullanım Örnekleri
 *
 * Bu dosya, BrowserActivityTracker sınıfının çeşitli kullanım senaryolarını gösterir.
 */

import { BrowserActivityTracker, ActivityStatus, ActivityEvent } from '../src';
import { filter, map, debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

// ============================================================================
// ÖRNEK 1: Temel Kullanım
// ============================================================================

function basicUsageExample() {
  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 30000, // 30 saniye
    throttleTime: 1000 // 1 saniye
  });

  // Aktivite değişikliklerine abone ol
  tracker.activity$.subscribe((event: ActivityEvent) => {
    console.log('Aktivite Durumu:', event.status);
    console.log('Zaman:', event.timestamp);
  });

  // İzlemeyi başlat
  tracker.start();

  // 5 dakika sonra durdur
  setTimeout(() => {
    tracker.stop();
    tracker.destroy();
  }, 300000);
}

// ============================================================================
// ÖRNEK 2: Otomatik Oturum Zaman Aşımı
// ============================================================================

function autoLogoutExample() {
  const SESSION_TIMEOUT = 900000; // 15 dakika

  const tracker = new BrowserActivityTracker({
    inactivityThreshold: SESSION_TIMEOUT
  });

  tracker.activity$.subscribe((event: ActivityEvent) => {
    if (event.status === ActivityStatus.INACTIVE) {
      console.log('Kullanıcı 15 dakika hareketsiz - oturum kapatılıyor...');
      // Oturum kapatma işlemini burada gerçekleştir
      logoutUser();
      tracker.destroy();
    }
  });

  tracker.start();

  function logoutUser() {
    // API çağrısı yaparak oturumu kapat
    console.log('Kullanıcı çıkış yaptırıldı');
  }
}

// ============================================================================
// ÖRNEK 3: Kullanım İstatistikleri Toplama
// ============================================================================

function usageStatisticsExample() {
  interface UsageStats {
    activeTime: number;
    inactiveTime: number;
    sessionStart: Date;
    lastActivityTime: Date;
  }

  const stats: UsageStats = {
    activeTime: 0,
    inactiveTime: 0,
    sessionStart: new Date(),
    lastActivityTime: new Date()
  };

  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 60000 // 1 dakika
  });

  tracker.activity$.subscribe((event: ActivityEvent) => {
    const now = new Date();
    const duration = now.getTime() - stats.lastActivityTime.getTime();

    if (event.status === ActivityStatus.ACTIVE) {
      stats.inactiveTime += duration;
      console.log(`Kullanıcı aktif hale geldi. Toplam hareketsiz süre: ${formatMs(stats.inactiveTime)}`);
    } else {
      stats.activeTime += duration;
      console.log(`Kullanıcı hareketsiz. Toplam aktif süre: ${formatMs(stats.activeTime)}`);
    }

    stats.lastActivityTime = now;

    // Her 5 dakikada bir istatistikleri kaydet
    const sessionDuration = now.getTime() - stats.sessionStart.getTime();
    if (sessionDuration % 300000 < 1000) {
      saveStatistics(stats);
    }
  });

  tracker.start();

  function formatMs(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}dk ${seconds}s`;
  }

  function saveStatistics(stats: UsageStats) {
    console.log('İstatistikler kaydediliyor:', stats);
    // API çağrısı ile istatistikleri kaydet
  }
}

// ============================================================================
// ÖRNEK 4: Video Oynatıcı Kontrolü
// ============================================================================

function videoPlayerControlExample() {
  const videoElement = document.querySelector('video') as HTMLVideoElement;

  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 120000 // 2 dakika
  });

  tracker.activity$.subscribe((event: ActivityEvent) => {
    if (event.status === ActivityStatus.INACTIVE && videoElement) {
      console.log('Kullanıcı hareketsiz - video duraklatılıyor');
      videoElement.pause();

      // Bildirim göster
      showNotification('Video duraklatıldı', 'Hareketsizlik nedeniyle video otomatik olarak duraklatıldı.');
    } else if (event.status === ActivityStatus.ACTIVE && videoElement && videoElement.paused) {
      console.log('Kullanıcı geri döndü - video devam ediyor');
      videoElement.play();
    }
  });

  tracker.start();

  function showNotification(title: string, message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }
}

// ============================================================================
// ÖRNEK 5: Form Otomatik Kaydetme
// ============================================================================

function autoSaveFormExample() {
  const formData = {
    title: '',
    content: '',
    lastSaved: null as Date | null
  };

  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 10000, // 10 saniye
    throttleTime: 2000 // 2 saniye
  });

  tracker.activity$.pipe(
    filter((event: ActivityEvent) => event.status === ActivityStatus.INACTIVE),
    debounceTime(2000) // Son değişiklikten 2 saniye sonra kaydet
  ).subscribe(() => {
    if (hasUnsavedChanges()) {
      console.log('Form otomatik kaydediliyor...');
      saveForm();
    }
  });

  tracker.start();

  function hasUnsavedChanges(): boolean {
    // Form değişikliklerini kontrol et
    return formData.title !== '' || formData.content !== '';
  }

  function saveForm() {
    formData.lastSaved = new Date();
    console.log('Form kaydedildi:', formData);
    // API çağrısı ile formu kaydet
  }
}

// ============================================================================
// ÖRNEK 6: Çoklu Tracker ile Farklı Eşik Değerleri
// ============================================================================

function multipleTrackersExample() {
  // Kısa süreli hareketsizlik için
  const shortInactivityTracker = new BrowserActivityTracker({
    inactivityThreshold: 10000 // 10 saniye
  });

  // Uzun süreli hareketsizlik için
  const longInactivityTracker = new BrowserActivityTracker({
    inactivityThreshold: 300000 // 5 dakika
  });

  // Kısa hareketsizlik - UI uyarısı göster
  shortInactivityTracker.activity$.pipe(
    filter((event: ActivityEvent) => event.status === ActivityStatus.INACTIVE)
  ).subscribe(() => {
    console.log('10 saniye hareketsizlik - uyarı gösteriliyor');
    showWarning('Hala burada mısınız?');
  });

  // Uzun hareketsizlik - oturumu kapat
  longInactivityTracker.activity$.pipe(
    filter((event: ActivityEvent) => event.status === ActivityStatus.INACTIVE)
  ).subscribe(() => {
    console.log('5 dakika hareketsizlik - oturum kapatılıyor');
    logoutUser();
  });

  shortInactivityTracker.start();
  longInactivityTracker.start();

  function showWarning(message: string) {
    console.log('Uyarı:', message);
  }

  function logoutUser() {
    console.log('Kullanıcı çıkış yaptırıldı');
  }
}

// ============================================================================
// ÖRNEK 7: RxJS Operatörleri ile İleri Seviye Kullanım
// ============================================================================

function advancedRxJSExample() {
  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 30000
  });

  const destroy$ = new Subject<void>();

  // Sadece ACTIVE durumlarını filtrele ve map et
  tracker.activity$.pipe(
    filter((event: ActivityEvent) => event.status === ActivityStatus.ACTIVE),
    map((event: ActivityEvent) => ({
      timestamp: event.timestamp,
      formattedTime: event.timestamp.toLocaleTimeString()
    })),
    takeUntil(destroy$)
  ).subscribe((data) => {
    console.log('Kullanıcı aktif oldu:', data.formattedTime);
  });

  // Hareketsizlik durumlarını 5 saniye debounce ile izle
  tracker.activity$.pipe(
    filter((event: ActivityEvent) => event.status === ActivityStatus.INACTIVE),
    debounceTime(5000),
    takeUntil(destroy$)
  ).subscribe((event: ActivityEvent) => {
    console.log('Kullanıcı 5 saniyeden fazla hareketsiz');
    console.log('Son aktiviteden bu yana:', event.timeSinceLastActivity, 'ms');
  });

  tracker.start();

  // 10 dakika sonra temizle
  setTimeout(() => {
    destroy$.next();
    destroy$.complete();
    tracker.destroy();
  }, 600000);
}

// ============================================================================
// ÖRNEK 8: Anlık Durum Sorgulama
// ============================================================================

function queryStatusExample() {
  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 30000
  });

  tracker.start();

  // Her 5 saniyede bir durumu kontrol et
  setInterval(() => {
    const currentStatus = tracker.getCurrentStatus();
    const lastActivity = tracker.getLastActivityTime();
    const isTracking = tracker.isCurrentlyTracking();

    console.log('Mevcut Durum:', {
      status: currentStatus,
      lastActivity: lastActivity.toLocaleTimeString(),
      isTracking
    });

    // Eğer kullanıcı 20 saniyeden fazla hareketsizse uyarı
    const timeSinceActivity = Date.now() - lastActivity.getTime();
    if (timeSinceActivity > 20000 && currentStatus === ActivityStatus.ACTIVE) {
      console.log('Uyarı: Kullanıcı yakında hareketsiz olarak işaretlenecek');
    }
  }, 5000);
}

// ============================================================================
// ÖRNEK 9: Koşullu İzleme (Sadece belirli sayfalarda)
// ============================================================================

function conditionalTrackingExample() {
  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 30000
  });

  // Sadece belirli sayfalarda izlemeyi aktif et
  const pagesWithTracking = ['/dashboard', '/editor', '/admin'];
  const currentPage = window.location.pathname;

  if (pagesWithTracking.includes(currentPage)) {
    console.log('Bu sayfa için aktivite izleme aktif');
    tracker.start();

    tracker.activity$.subscribe((event: ActivityEvent) => {
      // Sayfa bazlı aktivite kaydı
      logPageActivity(currentPage, event);
    });
  } else {
    console.log('Bu sayfa için aktivite izleme gerekli değil');
  }

  function logPageActivity(page: string, event: ActivityEvent) {
    console.log(`[${page}] Aktivite:`, event.status);
  }
}

// ============================================================================
// ÖRNEK 10: Bildirim ile Entegrasyon
// ============================================================================

async function notificationIntegrationExample() {
  // Bildirim iznini iste
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 180000 // 3 dakika
  });

  let inactivityNotificationShown = false;

  tracker.activity$.subscribe((event: ActivityEvent) => {
    if (event.status === ActivityStatus.INACTIVE && !inactivityNotificationShown) {
      showNotification(
        'Hareketsizlik Tespit Edildi',
        '3 dakikadır hareketsizsiniz. Oturumunuz yakında sonlandırılabilir.'
      );
      inactivityNotificationShown = true;
    } else if (event.status === ActivityStatus.ACTIVE) {
      inactivityNotificationShown = false;
      console.log('Kullanıcı geri döndü');
    }
  });

  tracker.start();

  function showNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon.png',
        badge: '/badge.png'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
}

// ============================================================================
// ÖRNEK 11: Debug Modu ile Detaylı Loglama
// ============================================================================

function debugModeExample() {
  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 30000,
    throttleTime: 1000,
    debug: true // Debug modunu aktif et
  });

  tracker.activity$.subscribe((event: ActivityEvent) => {
    console.log('=== Aktivite Değişikliği ===');
    console.log('Durum:', event.status);
    console.log('Zaman:', event.timestamp.toISOString());
    console.log('Son aktiviteden bu yana:', event.timeSinceLastActivity, 'ms');
    console.log('===========================');
  });

  tracker.start();

  // Her 10 saniyede bir mevcut durumu logla
  setInterval(() => {
    console.log('Tracker durumu:', {
      status: tracker.getCurrentStatus(),
      tracking: tracker.isCurrentlyTracking(),
      lastActivity: tracker.getLastActivityTime()
    });
  }, 10000);
}

// ============================================================================
// ÖRNEK 12: LocalStorage ile Aktivite Geçmişi Kaydetme
// ============================================================================

function localStorageHistoryExample() {
  interface ActivityRecord {
    status: ActivityStatus;
    timestamp: string;
    duration?: number;
  }

  const STORAGE_KEY = 'activity_history';
  const MAX_RECORDS = 100;

  const tracker = new BrowserActivityTracker({
    inactivityThreshold: 30000
  });

  tracker.activity$.subscribe((event: ActivityEvent) => {
    const record: ActivityRecord = {
      status: event.status,
      timestamp: event.timestamp.toISOString(),
      duration: event.timeSinceLastActivity
    };

    saveToHistory(record);
  });

  tracker.start();

  function saveToHistory(record: ActivityRecord) {
    const history = getHistory();
    history.push(record);

    // Maksimum kayıt sayısını aşma
    if (history.length > MAX_RECORDS) {
      history.shift();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    console.log('Aktivite kaydedildi:', record);
  }

  function getHistory(): ActivityRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  function getActivitySummary() {
    const history = getHistory();
    const activeCount = history.filter(r => r.status === ActivityStatus.ACTIVE).length;
    const inactiveCount = history.filter(r => r.status === ActivityStatus.INACTIVE).length;

    console.log('Aktivite Özeti:');
    console.log('Toplam kayıt:', history.length);
    console.log('Aktif durumlar:', activeCount);
    console.log('Hareketsiz durumlar:', inactiveCount);

    return { total: history.length, active: activeCount, inactive: inactiveCount };
  }

  // 1 dakikada bir özet göster
  setInterval(() => {
    getActivitySummary();
  }, 60000);
}

// ============================================================================
// Örnekleri çalıştırmak için fonksiyon çağrıları
// ============================================================================

// Kullanmak istediğiniz örneği uncomment edin:
// basicUsageExample();
// autoLogoutExample();
// usageStatisticsExample();
// videoPlayerControlExample();
// autoSaveFormExample();
// multipleTrackersExample();
// advancedRxJSExample();
// queryStatusExample();
// conditionalTrackingExample();
// notificationIntegrationExample();
// debugModeExample();
// localStorageHistoryExample();
