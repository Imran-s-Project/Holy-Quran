// ---------- UI translation: es ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.es = {
    app_name: 'El Corán',
    nav_home: 'Inicio', nav_planner: 'Planificador', nav_topics: 'Temas', nav_library: 'Biblioteca', nav_stats: 'Estadísticas',
    menu_goto_ayah: 'Ir a una aleya específica', menu_prayer_times: 'Horarios de oración', menu_dictionary: 'Diccionario',
    menu_other_apps: 'Nuestras otras aplicaciones', menu_settings: 'Ajustes', menu_translation_help: 'Ayudar con la traducción',
    menu_share: 'Compartir la aplicación', menu_help: 'Ayuda y soporte', menu_feedback: 'Enviar comentarios',
    menu_search_ph: 'Buscar en el menú...',
    settings_title: 'Ajustes', settings_language: 'Idioma', settings_theme: 'Tema', settings_theme_light: 'Modo claro',
    settings_theme_dark: 'Modo oscuro', settings_reciter: 'Recitador predeterminado', settings_font: 'Tamaño de fuente',
    settings_prayer_method: 'Método de cálculo de horarios de oración', settings_prayer_notify: 'Notificaciones de horarios de oración',
    settings_translation: 'Idioma de traducción del Corán',
    prayer_title: 'Horarios de Oración', prayer_locating: 'Detectando tu ubicación...', prayer_next: 'Próxima oración',
    prayer_manual: 'Introducir ciudad manualmente', prayer_manual_go: 'Buscar',
    dict_title: 'Diccionario', dict_search_ph: 'Buscar una palabra...',
    help_title: 'Ayuda y Soporte',
    translation_picker_title: 'Elegir idioma de traducción', lang_search_ph: 'Buscar idioma...'
};
