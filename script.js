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
  },
  ku: {
    lang: 'ku', dir: 'ltr',
    slogan: 'Şîqliya jinê, navnîşana firotinê ya komî',
    wach_title: 'Kanala Me ya WhatsApp',
    wach_sub: 'Berhevok & Firsend',
    tg_title: 'Kanala Telegramê',
    ig_title: 'Instagram',
    mail_title: 'Posta-e',
    loc_title: 'Cihê Me',
    loc_sub: 'Mehmet Nesih Özmen Mh., Fatih Cd., Gülsever Sk., No:7/A D:15, Merter/Stenbol',
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
  }
};

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
