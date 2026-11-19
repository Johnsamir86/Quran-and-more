import type { PartialMessages } from "./en";

/**
 * Core dictionaries for languages where we only translate navigation, common
 * actions, home tiles and prayer names; every other string falls back to English.
 */
const core = (
  c: Partial<NonNullable<PartialMessages["common"]>>,
  nav: NonNullable<PartialMessages["nav"]>,
  prayers: NonNullable<NonNullable<PartialMessages["azan"]>["prayers"]>,
  tiles?: Partial<Record<string, { title?: string; sub?: string }>>,
): PartialMessages => ({ common: c, nav, azan: { prayers }, home: tiles ? { tiles } : undefined });

export const tg = core(
  { appName: "Қуръон ва бештар", loading: "Бор мешавад…", close: "Пӯшидан", retry: "Бори дигар", next: "Баъдӣ", prev: "Қаблӣ", save: "Захира", cancel: "Бекор", search: "Ҷустуҷӯ", language: "Забон", uiLanguage: "Забони интерфейс", listen: "Гӯш кардан", ayah: "Оят", surah: "Сура", juz: "Ҷуз", page: "Саҳифа", today: "имрӯз", tomorrow: "фардо", settings: "Танзимот", family: "Оила", notes: "Қайдҳо", bookmark: "Хатчӯб" },
  { home: "Асосӣ", search: "Ҷустуҷӯ", learn: "Омӯзиш", hifz: "Ҳифз", play: "Бозӣ", ask: "Пурсиш", player: "Плеер", mushaf: "Мусҳаф", family: "Оила", azan: "Азон", story: "Ояти рӯз" },
  { fajr: "Бомдод", sunrise: "Тулӯи офтоб", dhuhr: "Пешин", asr: "Аср", maghrib: "Шом", isha: "Хуфтан" },
);
export const tt = core(
  { appName: "Коръән һәм күбрәк", loading: "Йөкләнә…", close: "Ябу", retry: "Кабат", next: "Киләсе", prev: "Алдагы", save: "Саклау", cancel: "Баш тарту", search: "Эзләү", language: "Тел", uiLanguage: "Интерфейс теле", listen: "Тыңлау", ayah: "Аять", surah: "Сүрә", juz: "Җүз", page: "Бит", today: "бүген", tomorrow: "иртәгә", settings: "Көйләүләр", family: "Гаилә", notes: "Язмалар", bookmark: "Кыстыргыч" },
  { home: "Баш бит", search: "Эзләү", learn: "Өйрәнү", hifz: "Ятлау", play: "Уен", ask: "Сорау", player: "Плеер", mushaf: "Мөсхәф", family: "Гаилә", azan: "Азан", story: "Көн аяте" },
  { fajr: "Иртәнге", sunrise: "Кояш чыгу", dhuhr: "Өйлә", asr: "Икенде", maghrib: "Ахшам", isha: "Ястү" },
);
export const km = core(
  { appName: "គម្ពីរគួរអាន និងច្រើនទៀត", loading: "កំពុងផ្ទុក…", close: "បិទ", retry: "ព្យាយាមម្តងទៀត", next: "បន្ទាប់", prev: "មុន", save: "រក្សាទុក", cancel: "បោះបង់", search: "ស្វែងរក", language: "ភាសា", uiLanguage: "ភាសាចំណុចប្រទាក់", listen: "ស្តាប់", ayah: "អាយ៉ះ", surah: "ស៊ូរ៉ោះ", juz: "ជូស", page: "ទំព័រ", today: "ថ្ងៃនេះ", tomorrow: "ថ្ងៃស្អែក", settings: "ការកំណត់", family: "គ្រួសារ", notes: "កំណត់ចំណាំ", bookmark: "ចំណាំ" },
  { home: "ទំព័រដើម", search: "ស្វែងរក", learn: "រៀន", hifz: "ទន្ទេញ", play: "លេង", ask: "សួរ", player: "កម្មវិធីចាក់", mushaf: "មូសហាហ្វ", family: "គ្រួសារ", azan: "អាហ្សាន", story: "អាយ៉ះប្រចាំថ្ងៃ" },
  { fajr: "ហ្វាជើរ", sunrise: "ថ្ងៃរះ", dhuhr: "ហ្ស៊ូហើរ", asr: "អាសើរ", maghrib: "ម៉ាហ្គរិប", isha: "អ៊ីស្ហា" },
);
export const sd = core(
  { appName: "قرآن ۽ وڌيڪ", loading: "لوڊ ٿي رهيو آهي…", close: "بند ڪريو", retry: "ٻيهر ڪوشش", next: "اڳيون", prev: "پويون", save: "محفوظ ڪريو", cancel: "رد ڪريو", search: "ڳولا", language: "ٻولي", uiLanguage: "انٽرفيس ٻولي", listen: "ٻڌو", ayah: "آيت", surah: "سورت", juz: "پارو", page: "صفحو", today: "اڄ", tomorrow: "سڀاڻي", settings: "سيٽنگون", family: "خاندان", notes: "نوٽس", bookmark: "نشان" },
  { home: "گهر", search: "ڳولا", learn: "سکو", hifz: "حفظ", play: "کيڏو", ask: "پڇو", player: "پليئر", mushaf: "مصحف", family: "خاندان", azan: "اذان", story: "اڄ جي آيت" },
  { fajr: "فجر", sunrise: "سج اڀرڻ", dhuhr: "ظهر", asr: "عصر", maghrib: "مغرب", isha: "عشاء" },
);
export const ug = core(
  { appName: "قۇرئان ۋە تېخىمۇ كۆپ", loading: "يۈكلىنىۋاتىدۇ…", close: "تاقاش", retry: "قايتا سىناش", next: "كېيىنكى", prev: "ئالدىنقى", save: "ساقلاش", cancel: "بىكار قىلىش", search: "ئىزدەش", language: "تىل", uiLanguage: "كۆرۈنمە يۈز تىلى", listen: "ئاڭلاش", ayah: "ئايەت", surah: "سۈرە", juz: "پارە", page: "بەت", today: "بۈگۈن", tomorrow: "ئەتە", settings: "تەڭشەكلەر", family: "ئائىلە", notes: "خاتىرىلەر", bookmark: "خەتكۈچ" },
  { home: "باش بەت", search: "ئىزدەش", learn: "ئۆگىنىش", hifz: "يادلاش", play: "ئويناش", ask: "سوراش", player: "قويغۇچ", mushaf: "مۇسھەپ", family: "ئائىلە", azan: "ئەزان", story: "بۈگۈنكى ئايەت" },
  { fajr: "بامدات", sunrise: "كۈن چىقىش", dhuhr: "پېشىن", asr: "ئەسىر", maghrib: "شام", isha: "خۇپتەن" },
);
export const om = core(
  { appName: "Qur'aana fi dabalata", loading: "Fe'amaa jira…", close: "Cufi", retry: "Irra deebi'ii yaali", next: "Itti aanu", prev: "Dura", save: "Olkaa'i", cancel: "Haqi", search: "Barbaadi", language: "Afaan", uiLanguage: "Afaan fuula", listen: "Dhaggeeffadhu", ayah: "Aayaa", surah: "Suuraa", juz: "Juz'ii", page: "Fuula", today: "har'a", tomorrow: "bor", settings: "Qindaa'ina", family: "Maatii", notes: "Yaadannoo", bookmark: "Mallattoo" },
  { home: "Mana", search: "Barbaadi", learn: "Baradhu", hifz: "Hifzii", play: "Taphadhu", ask: "Gaafadhu", player: "Taphachiisaa", mushaf: "Mushafa", family: "Maatii", azan: "Azaana", story: "Aayaa guyyaa" },
  { fajr: "Fajrii", sunrise: "Ba'iinsa aduu", dhuhr: "Zuhrii", asr: "Asrii", maghrib: "Magriiba", isha: "Ishaa'ii" },
);
export const rw = core(
  { appName: "Qur'an n'ibindi", loading: "Birimo gutangira…", close: "Funga", retry: "Ongera ugerageze", next: "Ibikurikira", prev: "Ibibanza", save: "Bika", cancel: "Hagarika", search: "Shakisha", language: "Ururimi", uiLanguage: "Ururimi rwa porogaramu", listen: "Umva", ayah: "Umurongo", surah: "Isura", juz: "Juz", page: "Urupapuro", today: "uyu munsi", tomorrow: "ejo", settings: "Igenamiterere", family: "Umuryango", notes: "Inyandiko", bookmark: "Akamenyetso" },
  { home: "Ahabanza", search: "Shakisha", learn: "Iga", hifz: "Fata mu mutwe", play: "Kina", ask: "Baza", player: "Igikinisho", mushaf: "Mushaf", family: "Umuryango", azan: "Adhan", story: "Umurongo w'umunsi" },
  { fajr: "Fajr", sunrise: "Izuba rirashe", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" },
);
export const lg = core(
  { appName: "Kur'ani n'ebirala", loading: "Etikka…", close: "Ggalawo", retry: "Ddamu ogezeeko", next: "Eddako", prev: "Esooka", save: "Tereka", cancel: "Sazaamu", search: "Noonya", language: "Olulimi", uiLanguage: "Olulimi lw'ekifo", listen: "Wuliriza", ayah: "Aya", surah: "Sura", juz: "Juz", page: "Olupapula", today: "leero", tomorrow: "enkya", settings: "Entegeka", family: "Amaka", notes: "Ebiwandiiko", bookmark: "Akabonero" },
  { home: "Awaka", search: "Noonya", learn: "Yiga", hifz: "Kwata mu mutwe", play: "Zannya", ask: "Buuza", player: "Ekizannyisa", mushaf: "Mushaf", family: "Amaka", azan: "Adhan", story: "Aya ey'olunaku" },
  { fajr: "Fajr", sunrise: "Enjuba evaayo", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" },
);
export const bm = core(
  { appName: "Kuranɛ ni fɛn wɛrɛw", loading: "A bɛ ka don…", close: "Datugu", retry: "A lajɛ kokura", next: "Nata", prev: "Tɛmɛnen", save: "Mara", cancel: "Dabila", search: "Ɲini", language: "Kan", uiLanguage: "Ɲɛfɔlan kan", listen: "Lamɛn", ayah: "Aya", surah: "Sura", juz: "Juz", page: "Ɲɛ", today: "bi", tomorrow: "sini", settings: "Labɛnw", family: "Denbaya", notes: "Sɛbɛnw", bookmark: "Taamasiyɛn" },
  { home: "So", search: "Ɲini", learn: "Kalan", hifz: "Kɔnɔlakalan", play: "Tulon", ask: "Ɲininka", player: "Fɔlikɛlan", mushaf: "Mushaf", family: "Denbaya", azan: "Seliwele", story: "Bi aya" },
  { fajr: "Fajiri", sunrise: "Tile bɔ", dhuhr: "Sɛlifana", asr: "Lansara", maghrib: "Fitiri", isha: "Safo" },
);
export const ce = core(
  { appName: "Къуръан а, кхин а", loading: "Чуйолуш ю…", close: "ДӀакъовла", retry: "Юха хьажа", next: "РогӀера", prev: "Хьалхара", save: "Ӏалашъе", cancel: "Юхатоха", search: "Лаха", language: "Мотт", uiLanguage: "Интерфейсан мотт", listen: "ЛадогӀа", ayah: "Аят", surah: "Сура", juz: "Жуз", page: "АгӀо", today: "тахана", tomorrow: "кхана", settings: "Гӏирсаш", family: "Доьзал", notes: "Билгалдахарш", bookmark: "Хаам" },
  { home: "Коьрта", search: "Лаха", learn: "Ӏама", hifz: "Хьифз", play: "Ловза", ask: "Хатта", player: "Плеер", mushaf: "МусхӀаф", family: "Доьзал", azan: "Азан", story: "Дийнан аят" },
  { fajr: "Ӏуьйренан", sunrise: "Малх схьакхетар", dhuhr: "Делкъенан", asr: "Маьлхан", maghrib: "Сарахьан", isha: "Пхьуьйренан" },
);
export const as = core(
  { appName: "কোৰআন আৰু অধিক", loading: "লোড হৈ আছে…", close: "বন্ধ কৰক", retry: "পুনৰ চেষ্টা", next: "পৰৱৰ্তী", prev: "পূৰ্বৱৰ্তী", save: "সংৰক্ষণ", cancel: "বাতিল", search: "সন্ধান", language: "ভাষা", uiLanguage: "ইণ্টাৰফেচৰ ভাষা", listen: "শুনক", ayah: "আয়াত", surah: "ছুৰা", juz: "পাৰা", page: "পৃষ্ঠা", today: "আজি", tomorrow: "কাইলৈ", settings: "ছেটিংছ", family: "পৰিয়াল", notes: "টোকা", bookmark: "বুকমাৰ্ক" },
  { home: "ঘৰ", search: "সন্ধান", learn: "শিকক", hifz: "হিফজ", play: "খেলক", ask: "সোধক", player: "প্লেয়াৰ", mushaf: "মুছহাফ", family: "পৰিয়াল", azan: "আজান", story: "আজিৰ আয়াত" },
  { fajr: "ফজৰ", sunrise: "সূৰ্যোদয়", dhuhr: "জোহৰ", asr: "আছৰ", maghrib: "মাগৰিব", isha: "ইছা" },
);
export const dv = core(
  { appName: "ޤުރުއާން އަދި އިތުރު", loading: "ލޯޑްވަނީ…", close: "ބަންދުކުރޭ", retry: "އަލުން މަސައްކަތްކުރޭ", next: "ދެން", prev: "ކުރީގެ", save: "ރައްކާކުރޭ", cancel: "ކެންސަލް", search: "ހޯދާ", language: "ބަސް", uiLanguage: "އިންޓަފޭސްގެ ބަސް", listen: "އަޑުއަހާ", ayah: "އާޔަތް", surah: "ސޫރަތް", juz: "ޖުޒް", page: "ޞަފްޙާ", today: "މިއަދު", tomorrow: "މާދަމާ", settings: "ސެޓިންގްސް", family: "ޢާއިލާ", notes: "ނޯޓްތައް", bookmark: "ބުކްމާކް" },
  { home: "ހޯމް", search: "ހޯދާ", learn: "ދަސްކުރޭ", hifz: "ހިފްޒު", play: "ކުޅޭ", ask: "އަހާ", player: "ޕްލޭޔަރ", mushaf: "މުޞްޙަފް", family: "ޢާއިލާ", azan: "ބަންގި", story: "މިއަދުގެ އާޔަތް" },
  { fajr: "ފަތިސް", sunrise: "އިރުއެރުން", dhuhr: "މެންދުރު", asr: "ޢަޞްރު", maghrib: "މަޣްރިބް", isha: "ޢިޝާ" },
);
export const zgh = core(
  { appName: "ⵍⵇⵓⵔⴰⵏ ⴷ ⵓⴳⴳⴰⵔ", loading: "ⴰⵙⵙⵉⴷⴼ…", close: "ⵔⴳⵍ", retry: "ⵄⴰⵡⴷ ⴰⵔⵎ", next: "ⴰⵎⴷⴼⴰⵔ", prev: "ⴰⵎⵣⵡⴰⵔⵓ", save: "ⵃⴹⵓ", cancel: "ⵙⵔ", search: "ⵔⵣⵓ", language: "ⵜⵓⵜⵍⴰⵢⵜ", uiLanguage: "ⵜⵓⵜⵍⴰⵢⵜ ⵏ ⵓⴳⵔⵓⴷⵎ", listen: "ⵙⴼⵍⴷ", ayah: "ⴰⵢⴰ", surah: "ⵙⵓⵔⴰ", juz: "ⵊⵓⵣ", page: "ⵜⴰⵙⵏⴰ", today: "ⴰⵙⵙⴰ", tomorrow: "ⴰⵙⴽⴽⴰ", settings: "ⵜⵉⵙⵖⴰⵍ", family: "ⵜⴰⵡⵊⴰ", notes: "ⵜⵉⵏⵏⴰⵢⵉⵏ", bookmark: "ⵜⴰⵎⴰⵜⴰⵔⵜ" },
  { home: "ⴰⵙⵏⵓⴱⴳ", search: "ⵔⵣⵓ", learn: "ⵍⵎⴷ", hifz: "ⵃⴼⴹ", play: "ⵓⵔⴰⵔ", ask: "ⵙⵇⵙⴰ", player: "ⴰⵎⵙⵙⵓⴼⵖ", mushaf: "ⵍⵎⵓⵚⵃⴰⴼ", family: "ⵜⴰⵡⵊⴰ", azan: "ⴰⴷⴰⵏ", story: "ⴰⵢⴰ ⵏ ⵡⴰⵙⵙ" },
  { fajr: "ⵍⴼⵊⵔ", sunrise: "ⴰⵏⵇⴰⵔ ⵏ ⵜⴰⴼⵓⴽⵜ", dhuhr: "ⴹⴹⵓⵀⵔ", asr: "ⵍⵄⴰⵚⵔ", maghrib: "ⵍⵎⵖⵔⵉⴱ", isha: "ⵍⵄⵉⵛⴰ" },
);
export const mrw = core(
  { appName: "Qur'an ago salakaw pen", loading: "Pekaloadan…", close: "Pinto", retry: "Pakitukawn", next: "Pagalapis", prev: "Miyaona", save: "Taroon", cancel: "Pakadaan", search: "Peloloba", language: "Basa", uiLanguage: "Basa o ikapoon", listen: "Pamakineg", ayah: "Ayat", surah: "Surah", juz: "Juz", page: "Pahina", today: "imanto", tomorrow: "amag", settings: "Kaatoran", family: "Pamilya", notes: "Mga sorat", bookmark: "Tanda" },
  { home: "Walay", search: "Peloloba", learn: "Ganad", hifz: "Hifz", play: "Dolaan", ask: "Iza", player: "Panonog", mushaf: "Mushaf", family: "Pamilya", azan: "Adhan", story: "Ayat o alongan" },
  { fajr: "Fajr", sunrise: "Kapakasebang", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" },
);
export const yuw = core(
  { appName: "Quran and more", search: "Search", language: "Language" },
  { home: "Home", search: "Search", learn: "Learn", hifz: "Memorise", play: "Play", ask: "Ask", player: "Player", mushaf: "Mushaf", family: "Family", azan: "Azan", story: "Ayah of the day" },
  { fajr: "Fajr", sunrise: "Sunrise", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" },
);
