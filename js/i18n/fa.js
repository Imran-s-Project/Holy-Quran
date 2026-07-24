// ---------- UI translation: fa ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.fa = {
    app_name: 'قرآن کریم',
    nav_home: 'خانه', nav_planner: 'برنامه‌ریز', nav_topics: 'موضوعات', nav_library: 'کتابخانه', nav_stats: 'آمار',
    menu_goto_ayah: 'رفتن به آیه‌ای خاص', menu_prayer_times: 'اوقات نماز', menu_dictionary: 'واژه‌نامه',
    menu_other_apps: 'برنامه‌های دیگر ما', menu_settings: 'تنظیمات', menu_translation_help: 'کمک به ترجمه',
    menu_share: 'اشتراک‌گذاری برنامه', menu_help: 'راهنما و پشتیبانی', menu_feedback: 'ارسال بازخورد',
    menu_search_ph: 'جستجو در منو...',
    settings_title: 'تنظیمات', settings_language: 'زبان', settings_theme: 'پوسته', settings_theme_light: 'حالت روز',
    settings_theme_dark: 'حالت شب', settings_reciter: 'قاری پیش‌فرض', settings_font: 'اندازه فونت',
    settings_prayer_method: 'روش محاسبه اوقات نماز', settings_prayer_notify: 'اعلان اوقات نماز',
    settings_translation: 'زبان ترجمه قرآن',
    prayer_title: 'اوقات نماز', prayer_locating: 'در حال یافتن موقعیت شما...', prayer_next: 'نماز بعدی',
    prayer_manual: 'وارد کردن شهر به‌صورت دستی', prayer_manual_go: 'جستجو',
    dict_title: 'واژه‌نامه', dict_search_ph: 'جستجوی واژه...',
    help_title: 'راهنما و پشتیبانی',
    translation_picker_title: 'زبان ترجمه را انتخاب کنید', lang_search_ph: 'جستجوی زبان...'
};
