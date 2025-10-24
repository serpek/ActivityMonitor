# Browser Activity Tracker v2.0

Web tarayıcı penceresinde kullanıcı aktivitesini **detaylı** bir şekilde gözlemlemek ve izlemek için geliştirilmiş gelişmiş TypeScript kütüphanesi. RxJS Observable pattern kullanarak kullanıcının aktif veya hareketsiz durumunu reaktif bir şekilde yayınlar.

## 🎯 v2.0 Yeni Özellikler

- **Detaylı Aktivite Nedenleri**: Her aktivite değişikliği için specific reason (20+ farklı neden)
- **Granüler State Tracking**: windowVisible, windowFocused, pageVisible, hasMouseActivity, hasKeyboardActivity, hasTouchActivity, hasScrollActivity ve daha fazlası
- **Multi-Tab Koordinasyonu**: BroadcastChannel kullanarak tab'ler arası senkronizasyon
- **Akıllı Listener Yönetimi**: Sadece aktif tab'de listener'lar çalışır, performans optimizasyonu
- **Network Status Tracking**: Ağ bağlantısı durumunu izleme
- **Önceki Durum Takibi**: Her aktivite değişikliğinde previousStatus bilgisi

## Özellikler

### Kapsamlı Olay Dinleme
- **Fare Aktiviteleri**: mousemove, mousedown, mouseup, click, wheel
- **Klavye Aktiviteleri**: keydown, keyup, keypress
- **Dokunma Aktiviteleri**: touchstart, touchmove, touchend (mobil destek)
- **Scroll Aktiviteleri**: scroll olayları

### Detaylı Durum İzleme
- Pencere görünürlüğü (window visibility)
- Pencere odağı (window focus)
- Sayfa görünürlüğü (Visibility API)
- Ağ bağlantı durumu (online/offline)
- Tab aktiflik durumu
- Her aktivite türü için ayrı zaman damgası

### Aktivite Nedenleri (ActivityReason)
```typescript
type ActivityReason =
  | 'user_interaction'     // Genel kullanıcı etkileşimi
  | 'mouse_activity'       // Fare hareketi
  | 'keyboard_activity'    // Klavye girişi
  | 'touch_activity'       // Dokunma
  | 'scroll_activity'      // Scroll
  | 'window_focus'         // Pencere odak kazandı
  | 'window_blur'          // Pencere odak kaybetti
  | 'window_visible'       // Pencere görünür
  | 'window_hidden'        // Pencere gizli
  | 'page_visible'         // Sayfa görünür
  | 'page_hidden'          // Sayfa gizli
  | 'screen_lock'          // Ekran kilidi
  | 'screen_unlock'        // Ekran kilidi açıldı
  | 'system_idle'          // Sistem boşta
  | 'system_active'        // Sistem aktif
  | 'network_offline'      // Ağ bağlantısı kesildi
  | 'network_online'       // Ağ bağlantısı kuruldu
  | 'inactivity_timeout'   // Hareketsizlik süresi doldu
  | 'tab_activated'        // Tab aktif oldu
  | 'tab_deactivated'      // Tab pasif oldu
  | 'initialization';      // İlk başlatma
```

### Multi-Tab Koordinasyonu
- Birden fazla tab'de aynı site açıksa sadece aktif tab izleme yapar
- Aktif olmayan tab'lerde listener'lar otomatik durdurulur (performans)
- Tab değiştirme otomatik algılanır ve listener'lar dinamik başlatılır/durdurulur
- Aktif tab diğer tab'lere BroadcastChannel ile bilgi verir

### Gelişmiş API'ler
- Visibility API (sekme değiştirme tespiti)
- Focus/Blur olayları (pencere odağı takibi)
- Network Information API
- BroadcastChannel API (multi-tab sync)
- Cross-browser uyumlu

## Kurulum

```bash
npm install browser-activity-tracker
```

veya

```bash
yarn add browser-activity-tracker
```

## Temel Kullanım

```typescript
import { BrowserActivityTracker, ActivityStatus } from 'browser-activity-tracker';

// Tracker'ı oluştur
const tracker = new BrowserActivityTracker({
  inactivityThreshold: 30000, // 30 saniye
  throttleTime: 1000,         // 1 saniye
  useMultiTabSync: true       // Multi-tab koordinasyonu aktif
});

// Aktivite değişikliklerine abone ol
tracker.activity$.subscribe(event => {
  console.log('Status:', event.status);           // ACTIVE veya INACTIVE
  console.log('Reason:', event.reason);           // Detaylı neden
  console.log('Tab Active:', event.isCurrentTabActive);
  console.log('Detailed State:', event.detailedState);

  // Detaylı state bilgileri
  const state = event.detailedState;
  console.log('Window Focused:', state.windowFocused);
  console.log('Page Visible:', state.pageVisible);
  console.log('Has Mouse Activity:', state.hasMouseActivity);
  console.log('Has Keyboard Activity:', state.hasKeyboardActivity);
  console.log('Network Online:', state.isNetworkOnline);
});

// İzlemeyi başlat
tracker.start();

// İzlemeyi durdur
// tracker.stop();

// Kaynakları temizle
// tracker.destroy();
```

## Yapılandırma Seçenekleri

```typescript
interface ActivityTrackerConfig {
  // Temel ayarlar
  inactivityThreshold?: number;      // Varsayılan: 30000 (30 saniye)
  throttleTime?: number;             // Varsayılan: 1000 (1 saniye)

  // İzleme seçenekleri
  useVisibilityApi?: boolean;        // Varsayılan: true
  useFocusEvents?: boolean;          // Varsayılan: true
  trackMouseActivity?: boolean;      // Varsayılan: true
  trackKeyboardActivity?: boolean;   // Varsayılan: true
  trackTouchActivity?: boolean;      // Varsayılan: true
  trackScrollActivity?: boolean;     // Varsayılan: true
  trackScreenLock?: boolean;         // Varsayılan: true
  trackNetworkStatus?: boolean;      // Varsayılan: true

  // Multi-tab ayarları
  useMultiTabSync?: boolean;         // Varsayılan: true
  syncChannelName?: string;          // Varsayılan: 'browser_activity_tracker'
  pauseListenersOnInactiveTab?: boolean;  // Varsayılan: true

  // Diğer
  emitDetailedState?: boolean;       // Varsayılan: true
  debug?: boolean;                   // Varsayılan: false
}
```

## API Referansı

### BrowserActivityTracker

#### Constructor
```typescript
new BrowserActivityTracker(config?: ActivityTrackerConfig)
```

#### Public Properties
- `activity$: Observable<ActivityEvent>` - Aktivite durumu değişikliklerini yayınlayan observable

#### Public Methods

**Kontrol Metodları:**
- `start(): void` - Aktivite izlemeyi başlat
- `stop(): void` - Aktivite izlemeyi durdur
- `destroy(): void` - Tüm kaynakları temizle

**Getter Metodları:**
- `getCurrentStatus(): ActivityStatus` - Mevcut aktivite durumu
- `getCurrentReason(): ActivityReason` - Mevcut aktivite nedeni
- `getDetailedState(): DetailedActivityState` - Detaylı aktivite durumu
- `getLastActivityTime(): Date` - Son aktivite zamanı
- `isTabActive(): boolean` - Tab aktif mi?
- `isCurrentlyTracking(): boolean` - İzleme aktif mi?
- `areListenersCurrentlyActive(): boolean` - Listener'lar aktif mi?
- `getTabId(): string` - Tab benzersiz kimliği

### ActivityEvent Interface

```typescript
interface ActivityEvent {
  status: ActivityStatus;              // ACTIVE veya INACTIVE
  reason: ActivityReason;              // Aktivite değişikliği nedeni
  timestamp: Date;                     // Olay zamanı
  timeSinceLastActivity?: number;      // Son aktiviteden bu yana (ms)
  detailedState: DetailedActivityState; // Detaylı durum
  isCurrentTabActive: boolean;         // Bu tab aktif mi?
  previousStatus?: ActivityStatus;     // Önceki durum
}
```

### DetailedActivityState Interface

```typescript
interface DetailedActivityState {
  windowVisible: boolean;               // Pencere görünür mü?
  windowFocused: boolean;               // Pencere odakta mı?
  pageVisible: boolean;                 // Sayfa görünür mü?
  hasMouseActivity: boolean;            // Fare aktivitesi var mı?
  hasKeyboardActivity: boolean;         // Klavye aktivitesi var mı?
  hasTouchActivity: boolean;            // Dokunma aktivitesi var mı?
  hasScrollActivity: boolean;           // Scroll aktivitesi var mı?
  isScreenLocked: boolean;              // Ekran kilitli mi?
  isNetworkOnline: boolean;             // Ağ bağlantısı var mı?
  isTabActive: boolean;                 // Tab aktif mi?
  lastActivityTime: Date;               // Son aktivite zamanı
  lastMouseActivityTime?: Date;         // Son fare aktivitesi
  lastKeyboardActivityTime?: Date;      // Son klavye aktivitesi
  lastTouchActivityTime?: Date;         // Son dokunma aktivitesi
  lastScrollActivityTime?: Date;        // Son scroll aktivitesi
}
```

## Kullanım Örnekleri

### Örnek 1: Detaylı Aktivite İzleme

```typescript
const tracker = new BrowserActivityTracker({
  inactivityThreshold: 30000,
  debug: true
});

tracker.activity$.subscribe(event => {
  console.log(`[${event.reason}] ${event.status}`);

  // Specific nedene göre işlem
  switch (event.reason) {
    case 'mouse_activity':
      console.log('Fare hareketi tespit edildi');
      break;
    case 'keyboard_activity':
      console.log('Klavye girişi tespit edildi');
      break;
    case 'page_hidden':
      console.log('Kullanıcı başka tab\'e geçti');
      break;
    case 'window_blur':
      console.log('Pencere odak kaybetti');
      break;
    case 'inactivity_timeout':
      console.log('Kullanıcı 30 saniyedir hareketsiz');
      break;
  }
});

tracker.start();
```

### Örnek 2: Multi-Tab Farkındalığı

```typescript
const tracker = new BrowserActivityTracker({
  useMultiTabSync: true,
  pauseListenersOnInactiveTab: true
});

tracker.activity$.subscribe(event => {
  if (event.isCurrentTabActive) {
    console.log('Bu tab aktif - listener\'lar çalışıyor');
    console.log('Listener durumu:', tracker.areListenersCurrentlyActive());
  } else {
    console.log('Bu tab pasif - listener\'lar durdu (performans optimizasyonu)');
  }

  console.log('Tab ID:', tracker.getTabId());
});

tracker.start();
```

### Örnek 3: Aktivite Türlerine Göre İşlem

```typescript
const tracker = new BrowserActivityTracker({
  trackMouseActivity: true,
  trackKeyboardActivity: true,
  trackScrollActivity: true
});

tracker.activity$.subscribe(event => {
  const state = event.detailedState;

  if (state.hasMouseActivity && state.lastMouseActivityTime) {
    console.log('Son fare aktivitesi:', state.lastMouseActivityTime);
  }

  if (state.hasKeyboardActivity && state.lastKeyboardActivityTime) {
    console.log('Son klavye aktivitesi:', state.lastKeyboardActivityTime);
  }

  if (state.hasScrollActivity && state.lastScrollActivityTime) {
    console.log('Son scroll aktivitesi:', state.lastScrollActivityTime);
  }
});

tracker.start();
```

### Örnek 4: Network Durumu İzleme

```typescript
const tracker = new BrowserActivityTracker({
  trackNetworkStatus: true
});

tracker.activity$.subscribe(event => {
  if (event.reason === 'network_offline') {
    console.log('İnternet bağlantısı kesildi!');
    showOfflineWarning();
  } else if (event.reason === 'network_online') {
    console.log('İnternet bağlantısı geri geldi!');
    hideOfflineWarning();
    syncPendingData();
  }

  console.log('Network durumu:', event.detailedState.isNetworkOnline);
});

tracker.start();
```

### Örnek 5: Otomatik Oturum Zaman Aşımı

```typescript
const tracker = new BrowserActivityTracker({
  inactivityThreshold: 900000 // 15 dakika
});

tracker.activity$.subscribe(event => {
  if (event.reason === 'inactivity_timeout') {
    console.log('15 dakika hareketsizlik - oturum kapatılıyor');
    logoutUser();
  }

  // Her aktivitede session timestamp'i güncelle
  if (event.status === 'ACTIVE') {
    updateSessionTimestamp();
  }
});

tracker.start();
```

### Örnek 6: Seçici İzleme (Sadece Belirli Aktiviteler)

```typescript
const tracker = new BrowserActivityTracker({
  trackMouseActivity: false,      // Fare izlenmeyecek
  trackKeyboardActivity: true,    // Sadece klavye
  trackScrollActivity: false,     // Scroll izlenmeyecek
  trackTouchActivity: true        // ve dokunma izlenecek
});

tracker.activity$.subscribe(event => {
  const state = event.detailedState;
  console.log('Sadece klavye ve dokunma izleniyor');
  console.log('Klavye aktivitesi:', state.hasKeyboardActivity);
  console.log('Dokunma aktivitesi:', state.hasTouchActivity);
});

tracker.start();
```

### Örnek 7: Önceki Durum Takibi

```typescript
const tracker = new BrowserActivityTracker({
  inactivityThreshold: 30000
});

tracker.activity$.subscribe(event => {
  if (event.previousStatus) {
    console.log(`Durum değişti: ${event.previousStatus} → ${event.status}`);
    console.log(`Neden: ${event.reason}`);

    if (event.previousStatus === 'ACTIVE' && event.status === 'INACTIVE') {
      console.log('Kullanıcı pasif hale geldi');
      pauseBackgroundTasks();
    } else if (event.previousStatus === 'INACTIVE' && event.status === 'ACTIVE') {
      console.log('Kullanıcı geri döndü');
      resumeBackgroundTasks();
    }
  }
});

tracker.start();
```

## Multi-Tab Koordinasyonu Detayları

### Nasıl Çalışır?

1. **Tab Aktivasyonu**: Bir tab açıldığında veya odak kazandığında diğer tab'lere `tab_activated` mesajı gönderir
2. **Listener Yönetimi**: Aktif olmayan tab'lerde listener'lar otomatik durdurulur, performans optimizasyonu sağlanır
3. **State Senkronizasyonu**: Aktif tab, aktivite güncellemelerini diğer tab'lere broadcast eder
4. **Automatic Reactivation**: Pasif tab tekrar aktif olduğunda listener'lar otomatik başlatılır

### BroadcastChannel Kullanımı

```typescript
// Tab 1 (Aktif)
tracker1.start(); // Listener'lar çalışıyor, aktivite izleniyor

// Tab 2 (Pasif)
tracker2.start(); // Listener'lar durduruldu, Tab 1'den gelen mesajları dinliyor

// Kullanıcı Tab 2'ye geçtiğinde:
// - Tab 2: Listener'lar başlar, "tab_activated" mesajı gönderir
// - Tab 1: "tab_activated" mesajını alır, listener'larını durdurur
```

### Performans Avantajları

- Sadece aktif tab'de event listener'lar çalışır
- Hafıza kullanımı optimize edilir
- CPU kullanımı azalır
- Gereksiz event processing önlenir

## Tarayıcı Uyumluluğu

| Özellik | Chrome | Firefox | Safari | Edge | Opera |
|---------|--------|---------|--------|------|-------|
| Basic Tracking | 60+ | 55+ | 11+ | 79+ | 47+ |
| Visibility API | 33+ | 18+ | 7+ | 79+ | 20+ |
| BroadcastChannel | 54+ | 38+ | 15.4+ | 79+ | 41+ |
| Network Info | 61+ | ❌ | ❌ | 79+ | 48+ |

**Not**: BroadcastChannel desteklenmezse multi-tab koordinasyonu çalışmaz ama tracker normal olarak çalışmaya devam eder.

## Performans Notları

- **Throttling**: Olaylar varsayılan 1 saniye throttle edilir, yüksek frekanslı olayların performans etkisi minimize edilir
- **Passive Listeners**: Scroll ve touch olayları passive listener olarak kaydedilir
- **Multi-Tab Optimization**: Pasif tab'lerde listener'lar durdurulur
- **Memory Management**: `destroy()` metodunu çağırarak tüm kaynakları temizleyebilirsiniz
- **Minimal Bundle Size**: RxJS hariç ~15KB (minified + gzipped)

## Test Etme

```bash
# Testleri çalıştır
npm test

# Test coverage raporu
npm test -- --coverage

# Watch modunda test
npm run test:watch
```

## Migration Guide (v1.x → v2.0)

### Breaking Changes

1. **ActivityEvent Yapısı Değişti**:
```typescript
// v1.x
interface ActivityEvent {
  status: ActivityStatus;
  timestamp: Date;
  timeSinceLastActivity?: number;
}

// v2.0
interface ActivityEvent {
  status: ActivityStatus;
  reason: ActivityReason;              // YENİ
  timestamp: Date;
  timeSinceLastActivity?: number;
  detailedState: DetailedActivityState; // YENİ
  isCurrentTabActive: boolean;          // YENİ
  previousStatus?: ActivityStatus;      // YENİ
}
```

2. **Yeni Config Seçenekleri**:
```typescript
// v2.0'da eklenen yeni ayarlar
{
  trackMouseActivity: true,
  trackKeyboardActivity: true,
  trackTouchActivity: true,
  trackScrollActivity: true,
  trackScreenLock: true,
  trackNetworkStatus: true,
  useMultiTabSync: true,
  syncChannelName: 'browser_activity_tracker',
  pauseListenersOnInactiveTab: true,
  emitDetailedState: true
}
```

3. **Yeni Public Metodlar**:
```typescript
tracker.getCurrentReason();           // YENİ
tracker.getDetailedState();          // YENİ
tracker.isTabActive();               // YENİ
tracker.areListenersCurrentlyActive(); // YENİ
tracker.getTabId();                  // YENİ
```

## Lisans

MIT

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir issue açın veya pull request gönderin.

## Changelog

### v2.0.0 (Current)
- ✨ **Major**: Detaylı aktivite nedenleri (20+ reason type)
- ✨ **Major**: Granüler state tracking (windowVisible, hasMouseActivity, vb.)
- ✨ **Major**: Multi-tab koordinasyonu ile BroadcastChannel
- ✨ **Major**: Akıllı listener yönetimi (sadece aktif tab'de çalışır)
- ✨ Network status tracking
- ✨ Previous status tracking
- ✨ Tab-specific activity monitoring
- ⚡ Performans optimizasyonları
- 📝 Gelişmiş dokümantasyon

### v1.0.0
- İlk sürüm
- Temel aktivite izleme
- RxJS Observable desteği
- Visibility API entegrasyonu
- Focus/Blur olay desteği
