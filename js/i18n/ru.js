// ---------- UI translation: ru ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.ru = {
    app_name: 'Коран',
    nav_home: 'Главная', nav_planner: 'Планировщик', nav_topics: 'Темы', nav_library: 'Библиотека', nav_stats: 'Статистика',
    menu_goto_ayah: 'Перейти к аяту', menu_prayer_times: 'Время намаза', menu_dictionary: 'Словарь',
    menu_other_apps: 'Другие наши приложения', menu_settings: 'Настройки', menu_translation_help: 'Помочь с переводом',
    menu_share: 'Поделиться приложением', menu_help: 'Помощь и поддержка', menu_feedback: 'Отправить отзыв',
    menu_search_ph: 'Поиск в меню...',
    settings_title: 'Настройки', settings_language: 'Язык', settings_theme: 'Тема', settings_theme_light: 'Дневной режим',
    settings_theme_dark: 'Ночной режим', settings_reciter: 'Чтец по умолчанию', settings_font: 'Размер шрифта',
    settings_prayer_method: 'Метод расчёта времени намаза', settings_prayer_notify: 'Уведомления о времени намаза',
    settings_translation: 'Язык перевода Корана',
    prayer_title: 'Время Намаза', prayer_locating: 'Определение местоположения...', prayer_next: 'Следующий намаз',
    prayer_manual: 'Ввести город вручную', prayer_manual_go: 'Найти',
    dict_title: 'Словарь', dict_search_ph: 'Поиск слова...',
    help_title: 'Помощь и Поддержка',
    translation_picker_title: 'Выберите язык перевода', lang_search_ph: 'Поиск языка...'
};
