/**
 * Browser Activity Tracker
 *
 * Web tarayıcı penceresinde kullanıcı aktivitesini detaylı gözlemlemek için TypeScript kütüphanesi.
 * RxJS Observable pattern kullanarak aktivite durumu değişikliklerini reaktif bir şekilde yayınlar.
 *
 * Özellikler:
 * - Detaylı aktivite izleme (fare, klavye, dokunma, scroll)
 * - Pencere odağı ve görünürlük kontrolü
 * - Ağ durumu izleme
 * - Multi-tab koordinasyonu (sadece aktif tab'de listener'lar çalışır)
 * - Her aktivite değişikliği için detaylı neden bilgisi
 *
 * @packageDocumentation
 */

export { BrowserActivityTracker } from './BrowserActivityTracker';
export {
  ActivityStatus,
  ActivityEvent,
  ActivityTrackerConfig,
  ActivityReason,
  DetailedActivityState,
  TabSyncMessage
} from './types';
