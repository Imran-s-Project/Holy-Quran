// ---------- UI translation: zh ----------
// Loaded after js/data.js (which declares an empty `const I18N = {}`) and
// before js/menu.js, which reads from this object. Splitting each language
// into its own file keeps js/data.js itself small — important since
// sw.js loads data.js via importScripts() and does not need any UI text.
I18N.zh = {
    app_name: '古兰经',
    nav_home: '首页', nav_planner: '计划', nav_topics: '主题', nav_library: '资料库', nav_stats: '统计',
    menu_goto_ayah: '前往指定经文', menu_prayer_times: '礼拜时间', menu_dictionary: '词典',
    menu_other_apps: '我们的其他应用', menu_settings: '设置', menu_translation_help: '帮助翻译',
    menu_share: '分享此应用', menu_help: '帮助与支持', menu_feedback: '发送反馈',
    menu_search_ph: '搜索菜单...',
    settings_title: '设置', settings_language: '语言', settings_theme: '主题', settings_theme_light: '日间模式',
    settings_theme_dark: '夜间模式', settings_reciter: '默认诵读者', settings_font: '字体大小',
    settings_prayer_method: '礼拜时间计算方法', settings_prayer_notify: '礼拜时间通知',
    settings_translation: '古兰经翻译语言',
    prayer_title: '礼拜时间', prayer_locating: '正在定位...', prayer_next: '下一次礼拜',
    prayer_manual: '手动输入城市', prayer_manual_go: '搜索',
    dict_title: '词典', dict_search_ph: '搜索单词...',
    help_title: '帮助与支持',
    translation_picker_title: '选择翻译语言', lang_search_ph: '搜索语言...'
};
