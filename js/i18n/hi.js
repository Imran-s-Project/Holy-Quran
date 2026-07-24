// ---------- UI translation: hi ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.hi = {
    app_name: 'क़ुरआन',
    nav_home: 'होम', nav_planner: 'प्लानर', nav_topics: 'विषय', nav_library: 'लाइब्रेरी', nav_stats: 'आँकड़े',
    menu_goto_ayah: 'किसी विशेष आयत पर जाएँ', menu_prayer_times: 'नमाज़ के समय', menu_dictionary: 'शब्दकोश',
    menu_other_apps: 'हमारे अन्य ऐप्स', menu_settings: 'सेटिंग्स', menu_translation_help: 'अनुवाद में मदद करें',
    menu_share: 'ऐप शेयर करें', menu_help: 'सहायता और समर्थन', menu_feedback: 'फ़ीडबैक भेजें',
    menu_search_ph: 'मेनू में खोजें...',
    settings_title: 'सेटिंग्स', settings_language: 'भाषा', settings_theme: 'थीम', settings_theme_light: 'दिन मोड',
    settings_theme_dark: 'रात मोड', settings_reciter: 'डिफ़ॉल्ट क़ारी', settings_font: 'फ़ॉन्ट आकार',
    settings_prayer_method: 'नमाज़ समय गणना विधि', settings_prayer_notify: 'नमाज़ समय सूचनाएं',
    settings_translation: 'क़ुरआन अनुवाद भाषा',
    prayer_title: 'नमाज़ के समय', prayer_locating: 'आपका स्थान पता लगाया जा रहा है...', prayer_next: 'अगली नमाज़',
    prayer_manual: 'शहर मैन्युअल रूप से लिखें', prayer_manual_go: 'खोजें',
    dict_title: 'शब्दकोश', dict_search_ph: 'शब्द खोजें...',
    help_title: 'सहायता और समर्थन',
    translation_picker_title: 'अनुवाद भाषा चुनें', lang_search_ph: 'भाषा खोजें...'
};
