# Browser Activity Tracker

Web tarayıcı penceresinde kullanıcı aktivitesini gözlemlemek ve izlemek için geliştirilmiş TypeScript kütüphanesi. RxJS Observable pattern kullanarak kullanıcının aktif veya hareketsiz durumunu reaktif bir şekilde yayınlar.

## Özellikler

- **Kapsamlı Olay Dinleme**: Fare hareketleri, klavye girişleri, dokunma olayları, scroll ve daha fazlası
- **Visibility API Desteği**: Sekme değiştirme ve pencere minimize etme durumlarını tespit eder
- **Focus/Blur Takibi**: Pencere odağı değişikliklerini izler
- **Observable Pattern**: RxJS kullanarak reaktif programlama desteği
- **Yapılandırılabilir**: Hareketsizlik süresi, throttle zamanı ve diğer ayarlar özelleştirilebilir
- **Tarayıcılar Arası Uyumlu**: Tüm modern web tarayıcılarıyla uyumlu
- **TypeScript Desteği**: Tam tip güvenliği ve IntelliSense desteği
- **Hafif ve Performanslı**: Tarayıcı performansını etkilemeyecek şekilde optimize edilmiş

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
  inactivityThreshold: 30000, // 30 saniye hareketsizlik
  throttleTime: 1000 // 1 saniyede bir olay işle
});

// Aktivite değişikliklerine abone ol
tracker.activity$.subscribe(event => {
  console.log('Aktivite Durumu:', event.status);
  console.log('Zaman:', event.timestamp);
  console.log('Son aktiviteden bu yana:', event.timeSinceLastActivity, 'ms');

  if (event.status === ActivityStatus.ACTIVE) {
    console.log('Kullanıcı aktif!');
  } else {
    console.log('Kullanıcı hareketsiz veya pencere odakta değil.');
  }
});

// İzlemeyi başlat
tracker.start();

// İhtiyaç olduğunda izlemeyi durdur
// tracker.stop();

// Kaynakları tamamen temizle
// tracker.destroy();
```

## Yapılandırma Seçenekleri

```typescript
interface ActivityTrackerConfig {
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
   * Detaylı loglama aktif mi
   * Varsayılan: false
   */
  debug?: boolean;
}
```

## API Referansı

### BrowserActivityTracker

#### Constructor

```typescript
new BrowserActivityTracker(config?: ActivityTrackerConfig)
```

#### Özellikler

- `activity$: Observable<ActivityEvent>` - Aktivite durumu değişikliklerini yayınlayan observable

#### Metodlar

- `start(): void` - Aktivite izlemeyi başlatır
- `stop(): void` - Aktivite izlemeyi durdurur
- `getCurrentStatus(): ActivityStatus` - Mevcut aktivite durumunu döndürür
- `getLastActivityTime(): Date` - Son aktivite zamanını döndürür
- `isCurrentlyTracking(): boolean` - İzlemenin aktif olup olmadığını döndürür
- `destroy(): void` - Tüm kaynakları temizler ve tracker'ı kapatır

### ActivityStatus (Enum)

```typescript
enum ActivityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
```

### ActivityEvent (Interface)

```typescript
interface ActivityEvent {
  status: ActivityStatus;
  timestamp: Date;
  timeSinceLastActivity?: number; // milisaniye
}
```

## Gelişmiş Kullanım Örnekleri

### Örnek 1: Otomatik Oturum Zaman Aşımı

```typescript
import { BrowserActivityTracker, ActivityStatus } from 'browser-activity-tracker';

const tracker = new BrowserActivityTracker({
  inactivityThreshold: 300000 // 5 dakika
});

tracker.activity$.subscribe(event => {
  if (event.status === ActivityStatus.INACTIVE) {
    // Kullanıcı 5 dakika hareketsiz, oturumu kapat
    logoutUser();
  }
});

tracker.start();
```

### Örnek 2: Kullanım İstatistikleri Toplama

```typescript
import { BrowserActivityTracker, ActivityStatus } from 'browser-activity-tracker';

let activeTime = 0;
let inactiveTime = 0;
let lastChangeTime = new Date();

const tracker = new BrowserActivityTracker({
  inactivityThreshold: 60000 // 1 dakika
});

tracker.activity$.subscribe(event => {
  const now = new Date();
  const duration = now.getTime() - lastChangeTime.getTime();

  if (event.status === ActivityStatus.ACTIVE) {
    inactiveTime += duration;
    console.log(`Toplam aktif süre: ${activeTime}ms`);
    console.log(`Toplam hareketsiz süre: ${inactiveTime}ms`);
  } else {
    activeTime += duration;
  }

  lastChangeTime = now;
});

tracker.start();
```

### Örnek 3: Video Oynatıcı Kontrolü

```typescript
import { BrowserActivityTracker, ActivityStatus } from 'browser-activity-tracker';

const videoElement = document.querySelector('video');
const tracker = new BrowserActivityTracker({
  inactivityThreshold: 120000 // 2 dakika
});

tracker.activity$.subscribe(event => {
  if (event.status === ActivityStatus.INACTIVE) {
    // Kullanıcı 2 dakika hareketsiz, videoyu duraklat
    videoElement?.pause();
    console.log('Video duraklatıldı - kullanıcı hareketsiz');
  }
});

tracker.start();
```

### Örnek 4: Çoklu Tracker ile Farklı Eşik Değerleri

```typescript
import { BrowserActivityTracker, ActivityStatus } from 'browser-activity-tracker';

// Kısa süreli hareketsizlik takibi
const shortTracker = new BrowserActivityTracker({
  inactivityThreshold: 10000 // 10 saniye
});

// Uzun süreli hareketsizlik takibi
const longTracker = new BrowserActivityTracker({
  inactivityThreshold: 300000 // 5 dakika
});

shortTracker.activity$.subscribe(event => {
  if (event.status === ActivityStatus.INACTIVE) {
    console.log('Kısa süreli hareketsizlik tespit edildi');
    // Örneğin, UI'da bir uyarı göster
  }
});

longTracker.activity$.subscribe(event => {
  if (event.status === ActivityStatus.INACTIVE) {
    console.log('Uzun süreli hareketsizlik tespit edildi');
    // Örneğin, oturumu kapat
  }
});

shortTracker.start();
longTracker.start();
```

### Örnek 5: RxJS Operatörleri ile İleri Seviye Kullanım

```typescript
import { BrowserActivityTracker, ActivityStatus } from 'browser-activity-tracker';
import { filter, map, debounceTime } from 'rxjs/operators';

const tracker = new BrowserActivityTracker({
  inactivityThreshold: 30000
});

// Sadece INACTIVE durumlarını filtrele
tracker.activity$.pipe(
  filter(event => event.status === ActivityStatus.INACTIVE),
  debounceTime(5000) // 5 saniye debounce
).subscribe(event => {
  console.log('Kullanıcı 5 saniyeden fazla süredir hareketsiz');
});

// Aktivite sürelerini hesapla
tracker.activity$.pipe(
  map(event => ({
    status: event.status,
    duration: event.timeSinceLastActivity || 0
  }))
).subscribe(data => {
  console.log(`Durum: ${data.status}, Süre: ${data.duration}ms`);
});

tracker.start();
```

## Tarayıcı Uyumluluğu

Bu kütüphane aşağıdaki tarayıcılarla uyumludur:

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Opera 47+
- Modern mobil tarayıcılar (iOS Safari, Chrome Mobile)

## İzlenen Olaylar

BrowserActivityTracker aşağıdaki tarayıcı olaylarını izler:

- `mousemove` - Fare hareketi
- `mousedown` - Fare tuşuna basma
- `keydown` - Klavye tuşuna basma
- `keyup` - Klavye tuşunu bırakma
- `keypress` - Klavye tuş vuruşu
- `scroll` - Sayfa kaydırma
- `touchstart` - Dokunma başlangıcı (mobil)
- `touchmove` - Dokunma hareketi (mobil)
- `click` - Tıklama
- `wheel` - Fare tekerleği
- `visibilitychange` - Sayfa görünürlük değişimi
- `focus` - Pencere odaklanma
- `blur` - Pencere odak kaybı

## Performans Notları

- **Throttling**: Olaylar varsayılan olarak 1 saniye throttle edilir, böylece yüksek frekanslı olaylar (örn. mousemove) performansı etkilemez.
- **Passive Listeners**: Scroll ve touch olayları passive listener olarak kaydedilir, böylece sayfa kaydırma performansı etkilenmez.
- **Bellek Yönetimi**: `destroy()` metodunu çağırarak tüm event listener'ları ve kaynakları düzgün bir şekilde temizleyebilirsiniz.

## Test Etme

```bash
# Testleri çalıştır
npm test

# Test coverage raporu
npm test -- --coverage

# Watch modunda test
npm run test:watch
```

## Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# TypeScript derle
npm run build

# Lint kontrolü
npm run lint
```

## Lisans

MIT

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir issue açın veya pull request gönderin.

## Yazar

Browser Activity Tracker

## Changelog

### v1.0.0
- İlk sürüm
- Temel aktivite izleme
- RxJS Observable desteği
- Visibility API entegrasyonu
- Focus/Blur olay desteği
- Tam TypeScript desteği
- Kapsamlı test coverage
