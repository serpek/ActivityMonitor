import { BrowserActivityTracker } from '../BrowserActivityTracker';
import { ActivityStatus, ActivityEvent } from '../types';

// Mock timers kullanarak zamana bağlı testleri kontrol edelim
jest.useFakeTimers();

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
        debug: true
      });
      expect(tracker).toBeInstanceOf(BrowserActivityTracker);
    });

    it('activity$ observable doğru şekilde başlatılmalı', (done) => {
      tracker = new BrowserActivityTracker();
      tracker.activity$.subscribe((event: ActivityEvent) => {
        expect(event).toHaveProperty('status');
        expect(event).toHaveProperty('timestamp');
        expect(event.timestamp).toBeInstanceOf(Date);
        done();
      });
    });

    it('sayfa hidden olduğunda INACTIVE durumunda başlamalı', () => {
      // document.hidden mock'u
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });

      tracker = new BrowserActivityTracker();
      expect(tracker.getCurrentStatus()).toBe(ActivityStatus.INACTIVE);

      // Cleanup
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
    });
  });

  describe('start() ve stop() metodları', () => {
    it('start() çağrıldığında izleme başlamalı', () => {
      tracker = new BrowserActivityTracker();
      tracker.start();
      expect(tracker.isCurrentlyTracking()).toBe(true);
    });

    it('stop() çağrıldığında izleme durmalı', () => {
      tracker = new BrowserActivityTracker();
      tracker.start();
      tracker.stop();
      expect(tracker.isCurrentlyTracking()).toBe(false);
    });

    it('birden fazla start() çağrısı sorun çıkarmamalı', () => {
      tracker = new BrowserActivityTracker({ debug: false });
      tracker.start();
      tracker.start();
      expect(tracker.isCurrentlyTracking()).toBe(true);
    });

    it('start() çağrılmadan stop() çağrılabilmeli', () => {
      tracker = new BrowserActivityTracker({ debug: false });
      expect(() => tracker.stop()).not.toThrow();
    });
  });

  describe('Kullanıcı Aktivite Tespiti', () => {
    it('mousemove olayında kullanıcı aktif olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        inactivityThreshold: 10000,
        throttleTime: 100
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 1) {
          // İlk olay başlangıç durumu
          expect(event.status).toBe(ActivityStatus.ACTIVE);
        }
      });

      tracker.start();

      // Fare hareketi simüle et
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      document.dispatchEvent(mouseMoveEvent);

      // Throttle süresinden sonra kontrol et
      setTimeout(() => {
        expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);
        done();
      }, 200);

      jest.advanceTimersByTime(200);
    });

    it('keydown olayında kullanıcı aktif olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        throttleTime: 100
      });

      tracker.start();

      const keydownEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'a'
      });
      document.dispatchEvent(keydownEvent);

      setTimeout(() => {
        expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);
        done();
      }, 200);

      jest.advanceTimersByTime(200);
    });

    it('click olayında kullanıcı aktif olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        throttleTime: 100
      });

      tracker.start();

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      document.dispatchEvent(clickEvent);

      setTimeout(() => {
        expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);
        done();
      }, 200);

      jest.advanceTimersByTime(200);
    });

    it('scroll olayında kullanıcı aktif olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        throttleTime: 100
      });

      tracker.start();

      const scrollEvent = new Event('scroll', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(scrollEvent);

      setTimeout(() => {
        expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);
        done();
      }, 200);

      jest.advanceTimersByTime(200);
    });

    it('touchstart olayında kullanıcı aktif olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        throttleTime: 100
      });

      tracker.start();

      const touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(touchEvent);

      setTimeout(() => {
        expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);
        done();
      }, 200);

      jest.advanceTimersByTime(200);
    });
  });

  describe('Hareketsizlik (Inactivity) Tespiti', () => {
    it('hareketsizlik süresi dolduğunda INACTIVE durumuna geçmeli', (done) => {
      const inactivityThreshold = 5000;
      tracker = new BrowserActivityTracker({
        inactivityThreshold,
        throttleTime: 100
      });

      let statusChanges = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        statusChanges++;
        if (statusChanges === 2) {
          // İkinci değişiklik INACTIVE olmalı
          expect(event.status).toBe(ActivityStatus.INACTIVE);
          done();
        }
      });

      tracker.start();

      // Hareketsizlik süresini geç
      jest.advanceTimersByTime(inactivityThreshold + 100);
    });

    it('aktiviteden sonra timer sıfırlanmalı', (done) => {
      const inactivityThreshold = 5000;
      tracker = new BrowserActivityTracker({
        inactivityThreshold,
        throttleTime: 100
      });

      tracker.start();

      // İlk aktivite
      const clickEvent1 = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(clickEvent1);

      // Yarı süre geç
      jest.advanceTimersByTime(inactivityThreshold / 2);

      // İkinci aktivite - timer sıfırlanmalı
      const clickEvent2 = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(clickEvent2);

      // Throttle süresini geç
      jest.advanceTimersByTime(200);

      // Yarı süre daha geç (toplam: threshold/2 + 200 + threshold/2 < threshold)
      jest.advanceTimersByTime(inactivityThreshold / 2);

      // Hala aktif olmalı
      expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);

      // Threshold'u geçtikten sonra inactive olmalı
      jest.advanceTimersByTime(inactivityThreshold / 2 + 100);
      expect(tracker.getCurrentStatus()).toBe(ActivityStatus.INACTIVE);

      done();
    });
  });

  describe('Visibility API', () => {
    it('sayfa gizlendiğinde INACTIVE olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        useVisibilityApi: true
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event.status).toBe(ActivityStatus.INACTIVE);
          done();
        }
      });

      tracker.start();

      // Sayfayı gizle
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });

      const visibilityEvent = new Event('visibilitychange');
      document.dispatchEvent(visibilityEvent);

      // Cleanup
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
    });

    it('sayfa görünür hale geldiğinde ACTIVE olmalı', (done) => {
      // Başlangıçta gizli
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });

      tracker = new BrowserActivityTracker({
        useVisibilityApi: true
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 1) {
          expect(event.status).toBe(ActivityStatus.INACTIVE);
        } else if (eventCount === 2) {
          expect(event.status).toBe(ActivityStatus.ACTIVE);
          done();
        }
      });

      tracker.start();

      // Sayfayı görünür yap
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });

      const visibilityEvent = new Event('visibilitychange');
      document.dispatchEvent(visibilityEvent);
    });
  });

  describe('Focus/Blur Olayları', () => {
    it('pencere blur olduğunda INACTIVE olmalı', (done) => {
      tracker = new BrowserActivityTracker({
        useFocusEvents: true
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event.status).toBe(ActivityStatus.INACTIVE);
          done();
        }
      });

      tracker.start();

      const blurEvent = new Event('blur');
      window.dispatchEvent(blurEvent);
    });

    it('pencere focus olduğunda ACTIVE olmalı', (done) => {
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
          done();
        }
      });

      // Sonra focus
      const focusEvent = new Event('focus');
      window.dispatchEvent(focusEvent);
    });
  });

  describe('Getter Metodları', () => {
    it('getCurrentStatus() doğru durumu dönmeli', () => {
      tracker = new BrowserActivityTracker();
      tracker.start();
      expect(tracker.getCurrentStatus()).toBe(ActivityStatus.ACTIVE);
    });

    it('getLastActivityTime() geçerli bir Date dönmeli', () => {
      tracker = new BrowserActivityTracker();
      const lastActivityTime = tracker.getLastActivityTime();
      expect(lastActivityTime).toBeInstanceOf(Date);
      expect(lastActivityTime.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('isCurrentlyTracking() doğru değeri dönmeli', () => {
      tracker = new BrowserActivityTracker();
      expect(tracker.isCurrentlyTracking()).toBe(false);
      tracker.start();
      expect(tracker.isCurrentlyTracking()).toBe(true);
      tracker.stop();
      expect(tracker.isCurrentlyTracking()).toBe(false);
    });
  });

  describe('destroy() Metodu', () => {
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

      // Throttle süresi kadar bekle
      setTimeout(() => {
        // İlk olay + throttle sonrası maksimum 1-2 olay işlenmeli
        expect(eventCount).toBeLessThan(5);
        done();
      }, 1500);

      jest.advanceTimersByTime(1500);
    });
  });

  describe('ActivityEvent Özellikleri', () => {
    it('ActivityEvent timeSinceLastActivity içermeli', (done) => {
      tracker = new BrowserActivityTracker({
        inactivityThreshold: 2000
      });

      let eventCount = 0;
      tracker.activity$.subscribe((event: ActivityEvent) => {
        eventCount++;
        if (eventCount === 2) {
          expect(event.timeSinceLastActivity).toBeDefined();
          expect(typeof event.timeSinceLastActivity).toBe('number');
          expect(event.timeSinceLastActivity).toBeGreaterThanOrEqual(0);
          done();
        }
      });

      tracker.start();

      // Hareketsizlik süresini geçir
      jest.advanceTimersByTime(2100);
    });
  });

  describe('Edge Cases', () => {
    it('browser environment olmadığında uyarı vermeli', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // window ve document'i geçici olarak undefined yap
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

    it('aynı durum tekrar set edilirse observable emit etmemeli', (done) => {
      tracker = new BrowserActivityTracker();

      let eventCount = 0;
      tracker.activity$.subscribe(() => {
        eventCount++;
      });

      tracker.start();

      // İlk durum zaten ACTIVE, birden fazla aktivite olayı gönder
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      document.dispatchEvent(clickEvent1);

      setTimeout(() => {
        const clickEvent2 = new MouseEvent('click', { bubbles: true });
        document.dispatchEvent(clickEvent2);
      }, 200);

      setTimeout(() => {
        // Sadece ilk durum emit edilmiş olmalı (distinctUntilChanged sayesinde)
        expect(eventCount).toBe(1);
        done();
      }, 500);

      jest.advanceTimersByTime(500);
    });
  });
});
