// ---------- UI translation: fr ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.fr = {
    app_name: 'Le Coran',
    nav_home: 'Accueil', nav_planner: 'Planificateur', nav_topics: 'Thèmes', nav_library: 'Bibliothèque', nav_stats: 'Statistiques',
    menu_goto_ayah: 'Aller à un verset précis', menu_prayer_times: 'Heures de prière', menu_dictionary: 'Dictionnaire',
    menu_other_apps: 'Nos autres applications', menu_settings: 'Paramètres', menu_translation_help: 'Aider à la traduction',
    menu_share: "Partager l'application", menu_help: 'Aide et support', menu_feedback: 'Envoyer un avis',
    menu_search_ph: 'Rechercher dans le menu...',
    settings_title: 'Paramètres', settings_language: 'Langue', settings_theme: 'Thème', settings_theme_light: 'Mode clair',
    settings_theme_dark: 'Mode sombre', settings_reciter: 'Récitateur par défaut', settings_font: 'Taille de police',
    settings_prayer_method: 'Méthode de calcul des heures de prière', settings_prayer_notify: 'Notifications des heures de prière',
    settings_translation: 'Langue de traduction du Coran',
    prayer_title: 'Heures de Prière', prayer_locating: 'Localisation en cours...', prayer_next: 'Prochaine prière',
    prayer_manual: 'Saisir la ville manuellement', prayer_manual_go: 'Rechercher',
    dict_title: 'Dictionnaire', dict_search_ph: 'Rechercher un mot...',
    help_title: 'Aide et Support',
    translation_picker_title: 'Choisir la langue de traduction', lang_search_ph: 'Rechercher une langue...'
};
