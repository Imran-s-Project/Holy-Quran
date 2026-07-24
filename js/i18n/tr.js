// ---------- UI translation: tr ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.tr = {
    app_name: "Kur'an-ı Kerim",
    nav_home: 'Ana Sayfa', nav_planner: 'Planlayıcı', nav_topics: 'Konular', nav_library: 'Kitaplık', nav_stats: 'İstatistikler',
    menu_goto_ayah: 'Belirli bir ayete git', menu_prayer_times: 'Namaz vakitleri', menu_dictionary: 'Sözlük',
    menu_other_apps: 'Diğer uygulamalarımız', menu_settings: 'Ayarlar', menu_translation_help: 'Çeviriye yardım edin',
    menu_share: 'Uygulamayı paylaş', menu_help: 'Yardım ve destek', menu_feedback: 'Geri bildirim gönder',
    menu_search_ph: 'Menüde ara...',
    settings_title: 'Ayarlar', settings_language: 'Dil', settings_theme: 'Tema', settings_theme_light: 'Gündüz modu',
    settings_theme_dark: 'Gece modu', settings_reciter: 'Varsayılan kari', settings_font: 'Yazı boyutu',
    settings_prayer_method: 'Namaz vakti hesaplama yöntemi', settings_prayer_notify: 'Namaz vakti bildirimleri',
    settings_translation: "Kur'an çeviri dili",
    prayer_title: 'Namaz Vakitleri', prayer_locating: 'Konumunuz belirleniyor...', prayer_next: 'Sıradaki namaz',
    prayer_manual: 'Şehri manuel girin', prayer_manual_go: 'Ara',
    dict_title: 'Sözlük', dict_search_ph: 'Kelime ara...',
    help_title: 'Yardım ve Destek',
    translation_picker_title: 'Çeviri dilini seçin', lang_search_ph: 'Dil ara...'
};
