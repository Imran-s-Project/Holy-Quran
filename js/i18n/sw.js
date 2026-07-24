// ---------- UI translation: sw ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.sw = {
    app_name: "Qur'ani Tukufu",
    nav_home: 'Nyumbani', nav_planner: 'Mpangaji', nav_topics: 'Mada', nav_library: 'Maktaba', nav_stats: 'Takwimu',
    menu_goto_ayah: 'Nenda kwenye aya maalum', menu_prayer_times: 'Nyakati za sala', menu_dictionary: 'Kamusi',
    menu_other_apps: 'Programu zetu nyingine', menu_settings: 'Mipangilio', menu_translation_help: 'Saidia kutafsiri',
    menu_share: 'Shiriki programu hii', menu_help: 'Msaada na usaidizi', menu_feedback: 'Tuma maoni',
    menu_search_ph: 'Tafuta kwenye menyu...',
    settings_title: 'Mipangilio', settings_language: 'Lugha', settings_theme: 'Mandhari', settings_theme_light: 'Hali ya mchana',
    settings_theme_dark: 'Hali ya usiku', settings_reciter: 'Msomaji chaguomsingi', settings_font: 'Ukubwa wa fonti',
    settings_prayer_method: 'Njia ya kuhesabu nyakati za sala', settings_prayer_notify: 'Arifa za nyakati za sala',
    settings_translation: "Lugha ya tafsiri ya Qur'ani",
    prayer_title: 'Nyakati za Sala', prayer_locating: 'Inatafuta eneo lako...', prayer_next: 'Sala inayofuata',
    prayer_manual: 'Andika jiji mwenyewe', prayer_manual_go: 'Tafuta',
    dict_title: 'Kamusi', dict_search_ph: 'Tafuta neno...',
    help_title: 'Msaada na Usaidizi',
    translation_picker_title: 'Chagua lugha ya tafsiri', lang_search_ph: 'Tafuta lugha...'
};
