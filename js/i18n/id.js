// ---------- UI translation: id ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.id = {
    app_name: 'Al-Quran',
    nav_home: 'Beranda', nav_planner: 'Perencana', nav_topics: 'Topik', nav_library: 'Perpustakaan', nav_stats: 'Statistik',
    menu_goto_ayah: 'Buka ayat tertentu', menu_prayer_times: 'Waktu salat', menu_dictionary: 'Kamus',
    menu_other_apps: 'Aplikasi kami lainnya', menu_settings: 'Pengaturan', menu_translation_help: 'Bantu menerjemahkan',
    menu_share: 'Bagikan aplikasi ini', menu_help: 'Bantuan & dukungan', menu_feedback: 'Kirim masukan',
    menu_search_ph: 'Cari di menu...',
    settings_title: 'Pengaturan', settings_language: 'Bahasa', settings_theme: 'Tema', settings_theme_light: 'Mode terang',
    settings_theme_dark: 'Mode gelap', settings_reciter: 'Qari default', settings_font: 'Ukuran font',
    settings_prayer_method: 'Metode perhitungan waktu salat', settings_prayer_notify: 'Notifikasi waktu salat',
    settings_translation: 'Bahasa terjemahan Al-Quran',
    prayer_title: 'Waktu Salat', prayer_locating: 'Mendeteksi lokasi Anda...', prayer_next: 'Salat berikutnya',
    prayer_manual: 'Masukkan kota secara manual', prayer_manual_go: 'Cari',
    dict_title: 'Kamus', dict_search_ph: 'Cari kata...',
    help_title: 'Bantuan & Dukungan',
    translation_picker_title: 'Pilih bahasa terjemahan', lang_search_ph: 'Cari bahasa...'
};
