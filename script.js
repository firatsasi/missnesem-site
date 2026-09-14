const i18n = {
  tr: {
    lang: 'tr', dir: 'ltr',
    slogan: 'Kadının Şıklığı, Toptan Adresi',
    wach_title: 'WhatsApp Kanalımız',
    wach_sub: 'Koleksiyonlar & Fırsatlar',
    tg_title: 'Telegram Kanalı',
    ig_title: 'Instagram',
    mail_title: 'E-posta',
    loc_title: 'Konumumuz',
    loc_sub: 'Mehmet Nesih Özmen Mh. Fatih Cd. Gülsever Sk. No:7/A D:15, Merter/İstanbul',
    cat_badge: 'YENİ',
    cat_eyebrow: 'YENİ SEZON · SONBAHAR KIŞ 2026',
    cat_title: 'Kataloğu Keşfet',
  },
  en: {
    lang: 'en', dir: 'ltr',
    slogan: 'Elegance for Every Woman, Wholesale',
    wach_title: 'WhatsApp Channel',
    wach_sub: 'Collections & Deals',
    tg_title: 'Telegram Channel',
    ig_title: 'Instagram',
    mail_title: 'E-mail',
    loc_title: 'Our Location',
    loc_sub: 'Mehmet Nesih Özmen Mh. Fatih Cd. Gülsever Sk. No:7/A D:15, Merter/Istanbul',
    cat_badge: 'NEW',
    cat_eyebrow: 'NEW SEASON · AUTUMN WINTER 2026',
    cat_title: 'Discover the Catalog',
  },
  ar: {
    lang: 'ar', dir: 'rtl',
    slogan: 'متجر الجملة للأناقة النسائية',
    wach_title: 'قناة واتساب',
    wach_sub: 'المجموعات والعروض',
    tg_title: 'قناة تيليغرام',
    ig_title: 'إنستغرام',
    mail_title: 'البريد الإلكتروني',
    loc_title: 'موقعنا',
    loc_sub: 'م. نصيح أوزمن، شارع الفاتح، زقاق غولسيفر رقم 7/أ - 15، مرتر/إسطنبول',
    cat_badge: 'جديد',
    cat_eyebrow: 'الموسم الجديد · خريف شتاء 2026',
    cat_title: 'اكتشف الكتالوج',
  },
  ru: {
    lang: 'ru', dir: 'ltr',
    slogan: 'Элегантность для каждой женщины, оптом',
    wach_title: 'Наш WhatsApp Канал',
    wach_sub: 'Коллекции и Предложения',
    tg_title: 'Телеграм Канал',
    ig_title: 'Instagram',
    mail_title: 'Эл. почта',
    loc_title: 'Наш Адрес',
    loc_sub: 'Мехмет Несих Озмен Мх., Фатих Дж., Гюльсевер Ск., No:7/A D:15, Мертер/Стамбул',
    cat_badge: 'НОВОЕ',
    cat_eyebrow: 'НОВЫЙ СЕЗОН · ОСЕНЬ-ЗИМА 2026',
    cat_title: 'Смотреть каталог',
  }
};

// Meta Pixel: WhatsApp butonlarından herhangi birine (numara linkleri + kanal linki)
// tıklanınca Contact event'i gönderilir. mnPixelTrack (index.html <head>'inde tanımlı)
// pixel yüklenemese/engellense bile sessizce no-op olur.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]').forEach(a => {
    a.addEventListener('click', () => {
      if (typeof mnPixelTrack === 'function') mnPixelTrack('Contact');
    });
  });
});

function setLang(code) {
  const t = i18n[code];
  if (!t) return;

  document.documentElement.lang = t.lang;
  document.documentElement.dir = t.dir;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === code);
  });
}
