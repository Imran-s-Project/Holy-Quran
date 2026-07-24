// ---------- UI translation: ms ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.ms = {
    app_name: 'Al-Quran',
    nav_home: 'Utama', nav_planner: 'Perancang', nav_topics: 'Topik', nav_library: 'Perpustakaan', nav_stats: 'Statistik',
    menu_goto_ayah: 'Pergi ke ayat tertentu', menu_prayer_times: 'Waktu solat', menu_dictionary: 'Kamus',
    menu_other_apps: 'Aplikasi kami yang lain', menu_settings: 'Tetapan', menu_translation_help: 'Bantu menterjemah',
    menu_share: 'Kongsi aplikasi ini', menu_help: 'Bantuan & sokongan', menu_feedback: 'Hantar maklum balas',
    menu_search_ph: 'Cari dalam menu...',
    settings_title: 'Tetapan', settings_language: 'Bahasa', settings_theme: 'Tema', settings_theme_light: 'Mod terang',
    settings_theme_dark: 'Mod gelap', settings_reciter: 'Qari lalai', settings_font: 'Saiz fon',
    settings_prayer_method: 'Kaedah pengiraan waktu solat', settings_prayer_notify: 'Pemberitahuan waktu solat',
    settings_translation: 'Bahasa terjemahan Al-Quran',
    prayer_title: 'Waktu Solat', prayer_locating: 'Mengesan lokasi anda...', prayer_next: 'Solat seterusnya',
    prayer_manual: 'Masukkan bandar secara manual', prayer_manual_go: 'Cari',
    dict_title: 'Kamus', dict_search_ph: 'Cari perkataan...',
    help_title: 'Bantuan & Sokongan',
    translation_picker_title: 'Pilih bahasa terjemahan', lang_search_ph: 'Cari bahasa...'
};
