import type { PartialMessages } from "./en";

export const zh: PartialMessages = {
  common: {
    appName: "古兰经与更多", loading: "加载中…", close: "关闭", retry: "重试", next: "下一个", prev: "上一个", save: "保存", cancel: "取消", remove: "移除", none: "无", open: "打开", share: "分享", copy: "复制", copied: "已复制",
    search: "搜索", more: "更多", back: "返回", language: "语言", uiLanguage: "界面语言", of: "/", ayah: "节", ayat: "节", surah: "章", juz: "卷", page: "页", hizb: "希兹卜", sajdah: "叩头", listen: "聆听", study: "研读",
    bookmark: "书签", bookmarked: "已保存", notes: "笔记", family: "家庭", player: "播放器", mushaf: "古兰经本", settings: "设置", unavailable: "不可用", today: "今天", tomorrow: "明天", days: "天", minutes: "分钟", done: "完成",
    start: "开始", again: "再来", poweredBy: "由 Quran Foundation API 提供支持", privacy: "隐私", terms: "条款", offline: "无法连接内容服务。请检查网络后重试。", noProfile: "请先在家庭页面选择一个档案",
    on: "开", off: "关", enable: "启用", disable: "停用", chooseLanguage: "选择界面语言",
  },
  nav: { home: "首页", search: "搜索", learn: "学习", hifz: "背诵", play: "游戏", ask: "提问", player: "播放器", mushaf: "经本", family: "家庭", azan: "宣礼", story: "每日一节" },
  home: {
    kicker: "尊贵的古兰经", title: "古兰经与更多", sub: "全家共享的古兰经体验：逐词同步的无间断诵读、官方字体的经本、所有语言的注释与译文，以及每位成员的专属档案。",
    startListening: "开始聆听", openMushaf: "打开经本",
    tiles: {
      player: { title: "播放器", sub: "在同一屏幕聆听、阅读、翻译与研读注释，任选诵读者" },
      mushaf: { title: "经本", sub: "使用官方字体与诵读规则经本逐页阅读" },
      family: { title: "家庭", sub: "从孩子到祖父母，每位成员一个档案" },
      search: { title: "搜索", sub: "在整部古兰经中查找任何词语、经节或章节" },
      study: { title: "研读", sub: "逐词释义、译文，以及最多三种注释并排对照" },
      learn: { title: "学习", sub: "Quranlingo 风格的词汇课程，含经验值与连续天数" },
      hifz: { title: "背诵", sub: "遮住、回忆、自评，配合间隔复习与麦克风检测" },
      play: { title: "游戏", sub: "哪一章？下一节？缺失的词？第几卷？" },
      ask: { title: "提问", sub: "答案仅来自经节与注释，逐字引用，待学者审核" },
      azan: { title: "宣礼", sub: "所在城市的礼拜时间、自选嗓音的宣礼，以及每次礼拜的提醒" },
      story: { title: "每日一节", sub: "每天一节全屏呈现，附含义与片刻省思" },
      kahf: { title: "山洞章", sub: "主麻日诵读" },
    },
  },
  player: {
    kicker: "尊贵的古兰经", title: "尊贵的古兰经", surahs: "章", reciter: "诵读者", translation: "译文", tafsir: "注释", settings: "设置", stations: "电台", play: "播放", pause: "暂停", nextAyah: "下一节", prevAyah: "上一节", nextSurah: "下一章",
    restart: "从头开始", retry: "重试", close: "关闭", none: "仅阿拉伯语原文", textSize: "文字大小", autoAdvance: "自动进入下一章", motion: "自动滚动与动效", small: "小", medium: "中", large: "大", ayah: "节", of: "/", basmala: "泰斯米",
    basmalaNote: "泰斯米不是本章的经节，因此此处没有注释。", loading: "加载中…", offline: "无法连接内容服务。请检查网络后重试。您的设置已保存。", unavailable: "不可用", listenWith: "诵读者", riwayah: "传述", allLanguages: "所有语言",
    search: "搜索章节或诵读者…", ended: "已完成章", playingStation: "正在播放", gapless: "逐词同步的无间断诵读", perAyah: "逐节诵读", repeat: "重复", repeatOff: "关", repeatAyah: "重复每一节", repeatRange: "重复范围", repeatSurah: "重复本章",
    times: "次", from: "起始节", to: "结束节", pauseBetween: "每节后停顿（秒）", speed: "速度", sleep: "睡眠定时", off: "关", minutes: "分钟", wordByWord: "点击词语查看含义", styleMurattal: "诵读体", styleMujawwad: "吟诵体", styleMuallim: "教学体",
    gaplessOnly: "无间断", ayahOnly: "逐节", both: "无间断 + 逐节", noSync: "整章 · 尚未同步", noSyncShort: "整章 · 自动词语同步", share: "分享", copied: "链接已复制", remaining: "剩余", wallpaper: "背景", autoNature: "自然，随章节变化",
    autoArt: "伊斯兰艺术，随章节变化", autoLive: "动态，随章节变化", plainBg: "无背景", fixedBg: "固定背景", internetBg: "网络图片 (Pexels)", internetOff: "在设置中添加 Pexels 密钥以显示网络图片", focusView: "单屏", listView: "列表", language: "界面语言",
    wbwLanguage: "词义语言", tafsirPick: "选择注释", nextUp: "下一节", credit: "图片", bookmark: "书签", bookmarked: "已保存", notes: "我的笔记", noteHint: "写下您对这一节的省思或笔记…", saveNote: "保存笔记", deleteNote: "删除", family: "家庭",
    noProfile: "请在家庭页面选择档案以保存书签和笔记", library: "已保存", repeatAyahShort: "重复",
  },
  mushaf: { title: "经本", surah: "章", juz: "卷", player: "播放器", family: "家庭", tryAgain: "重试", listenFromHere: "从这里聆听", bookmark: "书签", bookmarked: "已保存", tafsir: "注释", prev: "上一页", next: "下一页", page: "第", of: "/", layout: "版式" },
  family: {
    title: "家庭", sub: "一个家长账户，从孩子到祖父母每位成员一个档案。每个档案保留各自的字体、文字大小、书签、笔记与进度。",
    add: "添加成员", name: "姓名", role: "角色", gender: "性别", age: "年龄段", avatar: "头像", save: "保存", cancel: "取消", remove: "移除档案",
    roles: { parent: "家长", adult: "成人", child: "儿童", senior: "长者", teacher: "教师" }, genders: { male: "男", female: "女", unspecified: "未指定" },
    active: "当前档案", bookmarks: "书签", notes: "笔记", streak: "连续天数", minutes: "今日分钟", continue: "继续阅读", none: "暂无", open: "打开", mushaf: "经本", player: "播放器",
    noProfiles: "先添加第一位家庭成员。", edit: "编辑", femaleNote: "女性诵读者仅对女性档案显示。", signin: "使用家长的 Quran Foundation 账户登录，以便与 Quran.com 同步书签和笔记", delete: "删除",
  },
  search: {
    title: "搜索", placeholder: "搜索古兰经：词语、经节、章节或 2:255", go: "搜索", none: "没有结果", nav: "跳转到", verses: "经节", more: "更多", results: "条结果", exact: "精确匹配", study: "研读", play: "聆听", source: "来源",
    tip: "试试：慈悯 · 山洞章 · 36:1 · 坚忍", quick: "快速", advanced: "高级", hint: "一个词、一个短语或 2:255 这样的经节编号",
  },
  study: {
    title: "研读", words: "逐词", translations: "译文", tafsir: "注释", compare: "对照注释", hadith: "相关圣训", answers: "问答", reflections: "省思", info: "关于本章", prev: "上一节", next: "下一节", play: "聆听", bookmark: "书签", bookmarked: "已保存",
    share: "分享", copy: "复制", copied: "已复制", juz: "卷", page: "页", hizb: "希兹卜", sajdah: "叩头", none: "无", prodOnly: "Quran Foundation 正式账户启用后可用", loading: "加载中…", searchWord: "搜索此词", listenWord: "聆听此词",
    noProfile: "请先在家庭页面选择一个档案", occurrences: "出现位置", pick: "选择一种注释", surah: "第", ayah: "第", of: "/",
  },
  learn: {
    title: "学习", pick: "选择一章开始", start: "开始课程", xp: "经验", level: "等级", streak: "连续天数", check: "检查", next: "下一题", correct: "正确！", wrong: "不太对。答案：", done: "做得好！课程完成", earned: "您获得了", again: "新课程",
    meaning: "这个词是什么意思？", word: "哪个词的意思是：", hidden: "用缺失的词补全经节", order: "将经节的词语排序", reset: "重置", loading: "正在准备课程…", noProfile: "请在家庭页面选择档案以保存进度", lessonsDone: "课程完成", juz30: "第三十卷",
    all: "所有章", listen: "聆听", skip: "跳过", short: "短章", stage: "阶段", ayatInSurah: "节 本章共",
  },
  play: {
    title: "游戏", pick: "选择一个游戏", scope: "范围", all: "整部古兰经", juz30: "第三十卷", short: "短章", start: "开始", loading: "准备中…", score: "得分", time: "时间", next: "下一题", result: "结果", again: "再玩一次", home: "游戏", best: "最高分",
    correct: "正确", noProfile: "请在家庭页面选择档案以保存分数", study: "研读该节", nextIs: "下一节是", wrong: "错误。答案：", done: "本轮结束", of: "/", leaderboard: "家庭榜", nextQuestion: "下一节是哪一节？", juz: "第",
    games: { "guess-surah": { title: "哪一章？", sub: "读经节，选出所属章" }, "next-ayah": { title: "下一节", sub: "下一节是哪一节？" }, "missing-word": { title: "缺失的词", sub: "用正确的词补全经节" }, "which-juz": { title: "第几卷？", sub: "猜猜是第几卷" } },
  },
  hifz: {
    title: "背诵", pick: "选择章与节范围", from: "从", to: "到", start: "开始复习", reveal: "显示", hide: "隐藏", grade: "回忆得怎么样？", forgot: "忘了", hard: "困难", good: "良好", easy: "容易", due: "今日待复习", cards: "张卡片", listen: "聆听",
    mic: "麦克风检测", micStop: "停止", micUnsupported: "此浏览器不支持语音识别（请试试 Chrome）", accuracy: "准确率", heard: "听到", next: "下一节", done: "今日复习完成", again: "再来一轮", noProfile: "进度保存在本设备",
    methods: "背诵方法", method6446: "6446 法：每节分 4 组共重复 20 次", method3x3: "3×3 法：三节分别背诵，再连起来", reps: "次", chain: "连诵", schedule: "下次复习", today: "今天", tomorrow: "明天", days: "天", ayah: "节", loading: "加载中…",
  },
  ask: {
    title: "提问", placeholder: "询问某节的含义或古兰经中的某个主题…", ask: "提问", sources: "来源", retrieval: "相关经节与注释（不使用语言模型）", model: "模型回答，附逐字引用", tafsir: "注释", study: "研读", report: "举报", reported: "谢谢，已记录",
    pending: "待学者审核", intro: "答案仅基于来源中的经节与注释；经节逐字引用，绝不改动。不提供教法裁决。", examples: ["宝座节是什么意思？", "古兰经如何论述坚忍？", "山洞人的故事"],
    nokey: "在服务器上设置 ANTHROPIC_API_KEY 以启用撰写式回答；目前直接显示来源。", today: "每日一节", open: "打开经节",
  },
  azan: {
    title: "宣礼与礼拜时间", prayers: { fajr: "晨礼", sunrise: "日出", dhuhr: "晌礼", asr: "晡礼", maghrib: "昏礼", isha: "宵礼" }, nextPrayer: "下一次礼拜", inTime: "还有", now: "现在", location: "位置", useMyLocation: "使用我的位置", locating: "正在定位…",
    locationDenied: "未允许定位。请改为选择城市。", pickCity: "选择城市", country: "国家", city: "城市", method: "计算方法", methodAuto: "按国家自动", muezzin: "宣礼嗓音", preview: "播放宣礼", stop: "停止", notifications: "宣礼通知",
    notificationsHelp: "每次礼拜时间推送带宣礼声的通知，使用您选择的嗓音。点开即可查看每日一节。", enable: "开启通知", enabled: "通知已开启", disabled: "通知已关闭", unsupported: "此浏览器不支持通知", denied: "通知已在浏览器设置中被屏蔽",
    testNotification: "发送测试", todayTimes: "今日礼拜时间", tomorrowTimes: "明天", playAtAzan: "礼拜时间到时在应用内播放宣礼", silentPrayers: "静音礼拜", story: "每日一节", openStory: "打开今日经节", settingsSaved: "已保存", timezone: "时区",
    hijri: "伊斯兰历日期", asrHanafi: "晡礼（哈乃斐）", highLat: "高纬度规则", source: "时间由设备按您所在国家的标准天文方法计算；请以当地清真寺为准。",
  },
  story: {
    title: "每日一节", tapHint: "点击继续", reflect: "片刻省思", reflectPrompt: "今天这一节对您说了什么？", tafsir: "摘自注释", listen: "聆听", openStudy: "研读这一节", share: "分享", saveNote: "保存为笔记", noteSaved: "笔记已保存", nextAyah: "另一节",
    wallpaper: "更换背景", goodMorning: "早安", goodEvening: "晚安", forPrayer: "礼拜：",
  },
};
