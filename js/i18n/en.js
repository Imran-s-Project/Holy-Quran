// ---------- UI translation: en ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.en = {
    app_name: 'Quran Bangla',
    nav_home: 'Home', nav_planner: 'Planner', nav_topics: 'Topics', nav_library: 'Library', nav_stats: 'Stats', nav_hadith: 'Hadith',
    menu_goto_ayah: 'Go to a specific ayah', menu_prayer_times: 'Prayer times', menu_dictionary: 'Dictionary',
    menu_other_apps: 'Our other apps', menu_settings: 'Settings', menu_translation_help: 'Help with translation',
    menu_share: 'Share this app', menu_help: 'Help & support', menu_feedback: 'Share feedback',
    menu_search_ph: 'Search the menu...',
    settings_title: 'Settings', settings_language: 'Language', settings_theme: 'Theme', settings_theme_light: 'Light mode',
    settings_theme_dark: 'Dark mode', settings_reciter: 'Default reciter', settings_font: 'Font size',
    settings_prayer_method: 'Prayer time calculation method', settings_prayer_notify: 'Prayer time notifications',
    settings_translation: 'Quran translation language',
    prayer_title: 'Prayer Times', prayer_locating: 'Detecting your location...', prayer_next: 'Next prayer',
    prayer_manual: 'Enter city manually', prayer_manual_go: 'Search',
    dict_title: 'Dictionary', dict_search_ph: 'Search a word...',
    help_title: 'Help & Support',
    translation_picker_title: 'Select translation language', lang_search_ph: 'Search language...',
    theme_picker_title: 'Choose a theme', settings_theme_pick: 'Choose a theme',
    theme_emerald: 'Emerald', theme_emerald_desc: 'Warm parchment, teal & gold — the original design',
    theme_night: 'Night', theme_night_desc: 'Deep teal background with soft gold — easy on the eyes',
    theme_royal: 'Royal', theme_royal_desc: 'Deep purple & gold, plush rounded design',
    theme_desert: 'Desert', theme_desert_desc: 'Warm sand & terracotta, crisp geometric corners',
    theme_ocean: 'Ocean', theme_ocean_desc: 'Calm blue-teal, soft glassy rounded design',
    theme_amoled: 'Midnight', theme_amoled_desc: 'True black background with vivid gold highlights',
    theme_rose: 'Rose Garden', theme_rose_desc: 'Soft blush pink glow, dreamy rounded design'
};
