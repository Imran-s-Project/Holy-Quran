// ---------- UI translation: ar ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.ar = {
    app_name: 'القرآن الكريم',
    nav_home: 'الرئيسية', nav_planner: 'المخطط', nav_topics: 'المواضيع', nav_library: 'المكتبة', nav_stats: 'الإحصائيات',
    menu_goto_ayah: 'الذهاب إلى آية محددة', menu_prayer_times: 'مواقيت الصلاة', menu_dictionary: 'القاموس',
    menu_other_apps: 'تطبيقاتنا الأخرى', menu_settings: 'الإعدادات', menu_translation_help: 'المساعدة في الترجمة',
    menu_share: 'مشاركة التطبيق', menu_help: 'المساعدة والدعم', menu_feedback: 'إرسال ملاحظات',
    menu_search_ph: 'بحث في القائمة...',
    settings_title: 'الإعدادات', settings_language: 'اللغة', settings_theme: 'المظهر', settings_theme_light: 'الوضع النهاري',
    settings_theme_dark: 'الوضع الليلي', settings_reciter: 'القارئ الافتراضي', settings_font: 'حجم الخط',
    settings_prayer_method: 'طريقة حساب مواقيت الصلاة', settings_prayer_notify: 'إشعارات مواقيت الصلاة',
    settings_translation: 'لغة ترجمة القرآن',
    prayer_title: 'مواقيت الصلاة', prayer_locating: 'جارٍ تحديد موقعك...', prayer_next: 'الصلاة القادمة',
    prayer_manual: 'أدخل المدينة يدويًا', prayer_manual_go: 'بحث',
    dict_title: 'القاموس', dict_search_ph: 'ابحث عن كلمة...',
    help_title: 'المساعدة والدعم',
    translation_picker_title: 'اختر لغة الترجمة', lang_search_ph: 'ابحث عن لغة...'
};
