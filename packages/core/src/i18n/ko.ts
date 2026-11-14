import type { PartialMessages } from "./en";

export const ko: PartialMessages = {
  common: {
    appName: "꾸란 그 이상", loading: "불러오는 중…", close: "닫기", retry: "다시 시도", next: "다음", prev: "이전", save: "저장", cancel: "취소", remove: "삭제", none: "없음", open: "열기", share: "공유", copy: "복사", copied: "복사됨",
    search: "검색", more: "더 보기", back: "뒤로", language: "언어", uiLanguage: "인터페이스 언어", of: "/", ayah: "절", ayat: "절", surah: "장", juz: "주즈", page: "쪽", hizb: "히즈브", sajdah: "사즈다", listen: "듣기", study: "공부",
    bookmark: "책갈피", bookmarked: "저장됨", notes: "메모", family: "가족", player: "플레이어", mushaf: "무스하프", settings: "설정", unavailable: "사용할 수 없음", today: "오늘", tomorrow: "내일", days: "일", minutes: "분", done: "완료",
    start: "시작", again: "다시", poweredBy: "Quran Foundation API 기반", privacy: "개인정보", terms: "약관", offline: "콘텐츠 서비스에 연결할 수 없습니다. 연결을 확인하고 다시 시도하세요.", noProfile: "먼저 가족 페이지에서 프로필을 선택하세요",
    on: "켜짐", off: "꺼짐", enable: "사용", disable: "사용 안 함", chooseLanguage: "인터페이스 언어 선택",
  },
  nav: { home: "홈", search: "검색", learn: "학습", hifz: "암기", play: "게임", ask: "질문", player: "플레이어", mushaf: "무스하프", family: "가족", azan: "아잔", story: "오늘의 구절" },
  home: {
    kicker: "성 꾸란", title: "꾸란 그 이상", sub: "온 가족을 위한 하나의 꾸란 경험: 단어 동기화 연속 낭송, 공식 서체의 무스하프, 모든 언어의 타프시르와 번역, 그리고 구성원마다의 프로필.",
    startListening: "듣기 시작", openMushaf: "무스하프 열기",
    tiles: {
      player: { title: "플레이어", sub: "한 화면에서 듣고, 읽고, 번역하고, 타프시르를 공부하세요. 낭송자는 자유롭게" },
      mushaf: { title: "무스하프", sub: "공식 글꼴과 타지위드 무스하프로 한 쪽씩" },
      family: { title: "가족", sub: "아이부터 조부모까지 구성원마다 프로필" },
      search: { title: "검색", sub: "꾸란 전체에서 단어, 구절, 장을 찾기" },
      study: { title: "공부", sub: "단어별 뜻, 번역, 최대 세 가지 타프시르 비교" },
      learn: { title: "학습", sub: "XP와 연속 기록이 있는 Quranlingo 방식 어휘 수업" },
      hifz: { title: "암기", sub: "가리고, 떠올리고, 스스로 평가. 간격 복습과 마이크 확인" },
      play: { title: "게임", sub: "어느 장? 다음 구절? 빠진 단어? 몇 번째 주즈?" },
      ask: { title: "질문", sub: "구절과 타프시르만으로 답변, 원문 그대로 인용, 학자 검토 대기 중" },
      azan: { title: "아잔", sub: "내 도시의 예배 시간, 원하는 목소리의 아잔, 예배마다 알림" },
      story: { title: "오늘의 구절", sub: "매일 한 구절을 전체 화면으로, 의미와 묵상의 시간과 함께" },
      kahf: { title: "동굴 장", sub: "금요일에 읽습니다" },
    },
  },
  player: {
    kicker: "성 꾸란", title: "성 꾸란", surahs: "장", reciter: "낭송자", translation: "번역", tafsir: "타프시르", settings: "설정", stations: "라디오", play: "재생", pause: "일시정지", nextAyah: "다음 구절", prevAyah: "이전 구절", nextSurah: "다음 장",
    restart: "처음부터", retry: "다시 시도", close: "닫기", none: "아랍어 원문만", textSize: "글자 크기", autoAdvance: "다음 장으로 자동 이동", motion: "자동 스크롤과 움직임", small: "작게", medium: "보통", large: "크게", ayah: "절", of: "/", basmala: "바스말라",
    basmalaNote: "바스말라는 이 장의 구절이 아니므로 여기에는 타프시르가 없습니다.", loading: "불러오는 중…", offline: "콘텐츠 서비스에 연결할 수 없습니다. 연결을 확인하고 다시 시도하세요. 설정은 저장되어 있습니다.", unavailable: "사용할 수 없음",
    listenWith: "낭송", riwayah: "리와야", allLanguages: "모든 언어", search: "장 또는 낭송자 검색…", ended: "장 완료", playingStation: "재생 중", gapless: "단어 동기화 연속 낭송", perAyah: "구절별 낭송", repeat: "반복", repeatOff: "끔", repeatAyah: "각 구절 반복",
    repeatRange: "범위 반복", repeatSurah: "장 반복", times: "회", from: "시작 구절", to: "끝 구절", pauseBetween: "구절마다 멈춤(초)", speed: "속도", sleep: "취침 타이머", off: "끔", minutes: "분", wordByWord: "단어를 눌러 뜻 보기", styleMurattal: "무랏탈",
    styleMujawwad: "무자와드", styleMuallim: "무알림", gaplessOnly: "연속", ayahOnly: "구절별", both: "연속 + 구절별", noSync: "전체 장 · 아직 동기화되지 않음", noSyncShort: "전체 장 · 자동 단어 동기화", share: "공유", copied: "링크 복사됨", remaining: "남음",
    wallpaper: "배경", autoNature: "자연, 장에 따라 변경", autoArt: "이슬람 예술, 장에 따라 변경", autoLive: "라이브, 장에 따라 변경", plainBg: "배경 없음", fixedBg: "고정 배경", internetBg: "인터넷 사진 (Pexels)", internetOff: "인터넷 사진을 보려면 설정에서 Pexels 키를 추가하세요",
    focusView: "한 화면", listView: "목록", language: "인터페이스 언어", wbwLanguage: "단어 뜻 언어", tafsirPick: "타프시르 선택", nextUp: "다음", credit: "사진", bookmark: "책갈피", bookmarked: "저장됨", notes: "내 메모", noteHint: "이 구절에 대한 묵상이나 메모를 적으세요…",
    saveNote: "메모 저장", deleteNote: "삭제", family: "가족", noProfile: "책갈피와 메모를 저장하려면 가족 페이지에서 프로필을 선택하세요", library: "저장됨", repeatAyahShort: "반복",
  },
  mushaf: { title: "무스하프", surah: "장", juz: "주즈", player: "플레이어", family: "가족", tryAgain: "다시 시도", listenFromHere: "여기서부터 듣기", bookmark: "책갈피", bookmarked: "저장됨", tafsir: "타프시르", prev: "이전", next: "다음", page: "쪽", of: "/", layout: "레이아웃" },
  family: {
    title: "가족", sub: "보호자 계정 하나에 아이부터 조부모까지 구성원마다 프로필. 각 프로필은 글꼴, 글자 크기, 책갈피, 메모, 진행 상황을 따로 보관합니다.",
    add: "구성원 추가", name: "이름", role: "역할", gender: "성별", age: "연령대", avatar: "아바타", save: "저장", cancel: "취소", remove: "프로필 삭제",
    roles: { parent: "보호자", adult: "성인", child: "어린이", senior: "어르신", teacher: "교사" }, genders: { male: "남성", female: "여성", unspecified: "지정 안 함" },
    active: "현재 프로필", bookmarks: "책갈피", notes: "메모", streak: "연속 일수", minutes: "오늘 분", continue: "이어서 읽기", none: "아직 없음", open: "열기", mushaf: "무스하프", player: "플레이어",
    noProfiles: "먼저 첫 가족 구성원을 추가하세요.", edit: "편집", femaleNote: "여성 낭송자는 여성 프로필에만 표시됩니다.", signin: "보호자의 Quran Foundation 계정으로 로그인하여 책갈피와 메모를 Quran.com과 동기화", delete: "삭제",
  },
  search: {
    title: "검색", placeholder: "꾸란 검색: 단어, 구절, 장 또는 2:255", go: "검색", none: "결과 없음", nav: "이동", verses: "구절", more: "더 보기", results: "건", exact: "정확히 일치", study: "공부", play: "듣기", source: "출처",
    tip: "예: 자비 · 동굴 장 · 36:1 · 인내", quick: "빠른", advanced: "고급", hint: "단어, 구절 또는 2:255 같은 구절 번호",
  },
  study: {
    title: "공부", words: "단어별", translations: "번역", tafsir: "타프시르", compare: "타프시르 비교", hadith: "관련 하디스", answers: "질문과 답변", reflections: "묵상", info: "이 장에 대해", prev: "이전", next: "다음", play: "듣기", bookmark: "책갈피",
    bookmarked: "저장됨", share: "공유", copy: "복사", copied: "복사됨", juz: "주즈", page: "쪽", hizb: "히즈브", sajdah: "사즈다", none: "없음", prodOnly: "Quran Foundation 운영 계정이 활성화되면 이용 가능", loading: "불러오는 중…", searchWord: "이 단어 검색",
    listenWord: "단어 듣기", noProfile: "먼저 가족 페이지에서 프로필을 선택하세요", occurrences: "출현 위치", pick: "타프시르 선택", surah: "장", ayah: "절", of: "/",
  },
  learn: {
    title: "학습", pick: "시작할 장을 선택", start: "수업 시작", xp: "XP", level: "레벨", streak: "일 연속", check: "확인", next: "다음", correct: "정답!", wrong: "아쉽네요. 정답:", done: "잘했어요! 수업 완료", earned: "획득", again: "새 수업",
    meaning: "이 단어의 뜻은?", word: "다음 뜻의 단어는:", hidden: "빠진 단어로 구절 완성하기", order: "구절의 단어를 순서대로 배열", reset: "초기화", loading: "수업 준비 중…", noProfile: "진행 상황을 저장하려면 가족 페이지에서 프로필을 선택하세요",
    lessonsDone: "수업 완료", juz30: "주즈 암마", all: "모든 장", listen: "듣기", skip: "건너뛰기", short: "짧은 장", stage: "단계", ayatInSurah: "절 (이 장)",
  },
  play: {
    title: "게임", pick: "게임 선택", scope: "범위", all: "꾸란 전체", juz30: "주즈 암마", short: "짧은 장", start: "시작", loading: "준비 중…", score: "점수", time: "시간", next: "다음", result: "결과", again: "다시 하기", home: "게임", best: "최고 점수",
    correct: "정답", noProfile: "점수를 저장하려면 가족 페이지에서 프로필을 선택하세요", study: "구절 공부", nextIs: "다음 구절은", wrong: "오답. 정답:", done: "라운드 종료", of: "/", leaderboard: "가족 순위", nextQuestion: "다음 구절은?", juz: "주즈",
    games: { "guess-surah": { title: "어느 장?", sub: "구절을 읽고 장을 고르세요" }, "next-ayah": { title: "다음 구절", sub: "다음 구절은?" }, "missing-word": { title: "빠진 단어", sub: "알맞은 단어로 구절 완성" }, "which-juz": { title: "몇 번째 주즈?", sub: "주즈를 맞혀 보세요" } },
  },
  hifz: {
    title: "암기", pick: "장과 구절 범위 선택", from: "시작", to: "끝", start: "복습 시작", reveal: "보기", hide: "숨기기", grade: "얼마나 기억났나요?", forgot: "잊음", hard: "어려움", good: "좋음", easy: "쉬움", due: "오늘 복습", cards: "카드", listen: "듣기",
    mic: "마이크 확인", micStop: "중지", micUnsupported: "이 브라우저는 음성 인식을 지원하지 않습니다 (Chrome 사용)", accuracy: "정확도", heard: "인식됨", next: "다음", done: "오늘 라운드 완료", again: "한 라운드 더", noProfile: "진행 상황은 이 기기에 저장됩니다",
    methods: "암기 방법", method6446: "6446 방법: 각 구절을 4세트로 20번 반복", method3x3: "3×3 방법: 세 구절을 따로, 그다음 이어서", reps: "회", chain: "연결", schedule: "다음 복습", today: "오늘", tomorrow: "내일", days: "일", ayah: "절", loading: "불러오는 중…",
  },
  ask: {
    title: "질문", placeholder: "구절의 뜻이나 꾸란의 주제에 대해 질문하세요…", ask: "질문", sources: "출처", retrieval: "관련 구절과 타프시르 (언어 모델 없음)", model: "원문 인용이 포함된 모델 답변", tafsir: "타프시르", study: "공부", report: "신고", reported: "감사합니다. 신고가 접수되었습니다",
    pending: "학자 검토 대기 중", intro: "답변은 출처의 구절과 타프시르만으로 구성됩니다. 구절은 원문 그대로 인용되며 절대 바뀌지 않습니다. 파트와는 제공하지 않습니다.",
    examples: ["왕좌의 구절의 뜻은?", "꾸란은 인내에 대해 뭐라고 하나요?", "동굴 사람들의 이야기"], nokey: "서버에 ANTHROPIC_API_KEY를 설정하면 작성형 답변이 활성화됩니다. 지금은 출처를 바로 표시합니다.", today: "오늘의 구절", open: "구절 열기",
  },
  azan: {
    title: "아잔과 예배 시간", prayers: { fajr: "파즈르", sunrise: "일출", dhuhr: "주흐르", asr: "아스르", maghrib: "마그립", isha: "이샤" }, nextPrayer: "다음 예배", inTime: "남음", now: "지금", location: "위치", useMyLocation: "내 위치 사용", locating: "위치 찾는 중…",
    locationDenied: "위치가 허용되지 않았습니다. 도시를 선택하세요.", pickCity: "도시 선택", country: "국가", city: "도시", method: "계산 방법", methodAuto: "국가별 자동", muezzin: "아잔 목소리", preview: "아잔 재생", stop: "중지", notifications: "아잔 알림",
    notificationsHelp: "예배 시간마다 선택한 목소리의 아잔과 함께 알림이 옵니다. 알림에서 오늘의 구절이 열립니다.", enable: "알림 켜기", enabled: "알림 켜짐", disabled: "알림 꺼짐", unsupported: "이 브라우저는 알림을 지원하지 않습니다", denied: "브라우저 설정에서 알림이 차단되었습니다",
    testNotification: "테스트 보내기", todayTimes: "오늘의 예배 시간", tomorrowTimes: "내일", playAtAzan: "예배 시간에 앱에서 아잔 재생", silentPrayers: "무음 예배", story: "오늘의 구절", openStory: "오늘의 구절 열기", settingsSaved: "저장됨", timezone: "시간대",
    hijri: "히즈라력 날짜", asrHanafi: "아스르 (하나피)", highLat: "고위도 규칙", source: "시간은 해당 국가의 표준 천문 방식으로 기기에서 계산됩니다. 항상 지역 모스크에서 확인하세요.",
  },
  story: {
    title: "오늘의 구절", tapHint: "탭하여 계속", reflect: "묵상의 시간", reflectPrompt: "이 구절은 오늘 당신에게 무엇을 말하나요?", tafsir: "타프시르에서", listen: "듣기", openStudy: "이 구절 공부", share: "공유", saveNote: "메모로 저장", noteSaved: "메모 저장됨",
    nextAyah: "다른 구절", wallpaper: "배경 변경", goodMorning: "좋은 아침", goodEvening: "좋은 저녁", forPrayer: "예배:",
  },
};
