# Browser Activity Tracker v2.0 - Demo Dashboard

React + TypeScript + Ant Design ile oluşturulmuş görselleştirilmiş demo dashboard.

## Özellikler

### 📊 Görsel Dashboard Bileşenleri

1. **Real-time Status Card**
   - Mevcut aktivite durumu (ACTIVE/INACTIVE)
   - Aktivite nedeni (20+ farklı reason)
   - Tab durumu (Aktif/Pasif)
   - Listener durumu (Çalışıyor/Durdu)

2. **İstatistik Kartları**
   - Toplam olay sayısı
   - Aktif/Hareketsiz süre
   - Fare, klavye, dokunma, scroll aktivite sayıları
   - Son durum değişikliği zamanı

3. **Detaylı Durum Görüntüleyici**
   - windowVisible, windowFocused, pageVisible
   - hasMouseActivity, hasKeyboardActivity
   - hasTouchActivity, hasScrollActivity
   - isScreenLocked, isNetworkOnline, isTabActive
   - Her aktivite türü için timestamp'ler

4. **Aktivite Grafikleri**
   - Zaman çizelgesi (Line chart)
   - Aktivite nedenleri dağılımı (Pie chart)
   - Real-time data güncelleme

5. **Aktivite Timeline**
   - Son 100 aktivite kaydı
   - Her olay için detaylı bilgi
   - Renkli etiketler ve göstergeler
   - Scroll edilebilir liste

6. **Multi-Tab Göstergesi**
   - Tab ID gösterimi
   - Aktif/Pasif tab durumu
   - Listener durumu
   - Multi-tab koordinasyon bilgisi

## Kurulum

```bash
# Demo app dizinine git
cd demo-app

# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev
```

Tarayıcınızda otomatik olarak `http://localhost:3000` açılacaktır.

## Kullanım

1. **Başlat** butonuna tıklayarak izlemeyi başlatın
2. Fareyi hareket ettirin, klavyeye basın veya sayfayı kaydırın
3. Real-time olarak aktivitelerinizi görün
4. İstatistikleri ve grafikleri inceleyin

### Multi-Tab Testi

1. Bu sayfayı yeni bir tab'de açın
2. Tab'ler arasında geçiş yapın
3. Sadece aktif tab'de listener'ların çalıştığını gözlemleyin
4. Pasif tab'lerin aktif tab'den güncelleme aldığını görün

## Test Senaryoları

### Aktivite Türleri

- **Fare Aktivitesi**: Fareyi hareket ettirin → `mouse_activity`
- **Klavye Aktivitesi**: Klavyeye basın → `keyboard_activity`
- **Scroll Aktivitesi**: Sayfayı kaydırın → `scroll_activity`
- **Dokunma Aktivitesi**: Mobil cihazda dokunun → `touch_activity`

### Pencere Durumu

- **Pencere Odağı**: Pencereyi tıklayın → `window_focus`
- **Pencere Blur**: Başka pencereye geçin → `window_blur`
- **Sayfa Gizli**: Başka tab'e geçin → `page_hidden`
- **Sayfa Görünür**: Tab'e geri dönün → `page_visible`

### Tab Koordinasyonu

- **Tab Aktif**: Bu tab'e odaklanın → `tab_activated`
- **Tab Pasif**: Başka tab'e geçin → `tab_deactivated`
- **Listener Durumu**: Tab durumuna göre otomatik başlar/durur

### Diğer

- **Hareketsizlik**: 10 saniye bekleyin → `inactivity_timeout`
- **Network Offline**: Ağ bağlantısını kesin → `network_offline`
- **Network Online**: Ağ bağlantısını açın → `network_online`

## Teknoloji Stack

- **React 18** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Vite** - Build tool
- **Ant Design 5** - UI component kütüphanesi
- **Recharts** - Grafik kütüphanesi
- **RxJS** - Reactive programming
- **dayjs** - Tarih/saat işlemleri

## Proje Yapısı

```
demo-app/
├── src/
│   ├── components/
│   │   ├── ActivityChart.tsx       # Grafikler
│   │   ├── ActivityTimeline.tsx    # Timeline
│   │   ├── DetailedStateViewer.tsx # Detaylı durum
│   │   ├── StatisticsCards.tsx     # İstatistik kartları
│   │   └── StatusCard.tsx          # Durum kartı
│   ├── hooks/
│   │   └── useActivityTracker.ts   # Custom hook
│   ├── App.tsx                     # Ana component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Build

Production build oluşturmak için:

```bash
npm run build
```

Build çıktısı `dist/` klasöründe oluşturulur.

## Preview

Production build'i önizlemek için:

```bash
npm run preview
```

## Geliştirme Notları

- Dashboard real-time olarak güncellenir
- Tüm aktivite değişiklikleri anında gösterilir
- Grafikler otomatik olarak yenilenir
- Multi-tab koordinasyonu otomatik çalışır
- Responsive tasarım (mobil uyumlu)

## Lisans

MIT
