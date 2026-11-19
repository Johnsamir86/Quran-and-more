/* Generated from two MIT-licensed datasets of Hisn al-Muslim (Saʿid ibn ʿAli ibn Wahf al-Qahtani):
 * morning and evening: Seen-Arabic/Morning-And-Evening-Adhkar-DB (Arabic, English, transliteration, counts, virtues);
 * waking, after prayer and sleep: asellam/HisnElMuslim (Arabic, counts, references), English by Quran and More.
 * The Arabic text is reproduced exactly as published; references point to the hadith sources given in the book. */
export type AdhkarCategory = "morning" | "evening" | "afterPrayer" | "sleep" | "waking";
export interface Dhikr { id: string; cats: AdhkarCategory[]; ar: string; en: string; tr: string; count: number; ref: string; virtue: string; refAr: string; virtueAr: string }
export const ADHKAR: Dhikr[] = [
 {
  "id": "me-1",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "الْحَمْدُ لِلَّهِ وَحْدَهُ، وَالصَّلاَةُ وَالسَّلاَمُ عَلَى مَنْ لاَ نَبِيَّ بَعْدَهُ",
  "en": "All praise is due to Allah alone, and peace and blessings be upon him after whom there is no other Prophet.",
  "tr": "Alḥamdulillahi waḥdah waṣ-ṣalatu was-salam `alā man lā nabiyya ba`dah.",
  "count": 1,
  "ref": "Anas (RA) said that he heard the Prophet (ﷺ) say: \"That I sit with people remembering Almighty Allah from the morning (Fajr) prayer until sunrise is more belove",
  "virtue": "The recommendation to begin supplication with praise to Allah the Exalted and extolling Him, followed by prayers upon the Messenger of Allah ﷺ.",
  "refAr": "عن أنس يرفعه: ((لأن أقعد مع قوم يذكرون اللَّه تعالى من صلاة الغداة حتى تطلع الشمس أحبُّ إليَّ من أن أُعتق أربعة من ولد إسماعيل، ولأن أقعد مع قوم يذكرون اللَّه م",
  "virtueAr": "استحباب ابتداء الدعاء بالحمد لله -تعالى- والثناء، ثم الصلاة على رسول الله ﷺ"
 },
 {
  "id": "me-2",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "أَعُوذُ بِاللَّهِ مِنَ الشَّيطَانِ الرَّجِيمِ ﴿اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَوَاتِ وَالْأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾",
  "en": "Allah! There is none worthy of worship but He, the Ever-Living, the One Who sustains and protects all that exists. Neither slumber nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on the earth. Who is he that can intercede with Him except with His Permission? He knows what happens to them in this world, and what will happen to them in the Hereafter. And they will never encompass anything of His Knowledge except that which He wills. His Throne extends over the heavens and the earth, and He feels no fatigue in guarding and preserving them. And He is the Most High, the Most Great.",
  "tr": "(A`ūdhu billāhi min ash-shaytāni 'r-rajīm)\nAllāhu lā ilāha illā huwa ‘l-Ḥayyul-Qayyūm,\nlā ta'khudhuhu sinatun wa lā nawm,\nlahu mā fis-samāwāti wa māfil-arḍ,\nman dhal-ladhī yashfa`u `indahu illā bi'idhnih,\nya`lamu mā bayna aydīhim wa mā khalfahum,\nwa lā yuḥīṭūna bishay'im-min `ilmihi illā bimā shā',\nwasi`a kursiyyuhus-samāwāti wal-arḍ,\nwa lā ya'ūduhu hifẓuhumā,\nwa huwal-`Aliyyu‘l-`Aẓīm.",
  "count": 1,
  "ref": "It was reported by Al-Hakim 1 / 562, Al-Albani graded it as authentic in Sahihut-Targhib wat-Tarhib 1/273, and traces it to An-Nasa'i and At-Tabarani. He says t",
  "virtue": "(Ayat al-Kursi; Al-Qur'an 2:255) Whoever says this when he rises in the morning will be protected from jinns until he retires in the evening, and whoever says it when retiring in the evening will be protected from them until he rises in the morning.",
  "refAr": "أخرجه الحاكم، 1/562، وصححه الألباني في صحيح الترغيب والترهيب، 1/273، وعزاه إلى النسائي، والطبراني، وقال: ((إسناد الطبراني جيد)).",
  "virtueAr": "[سورة البقرة، الآية: 255] من قالها حين يصبح أُجير من الجن حتى يمسي، ومن قالها حين يمسي أُجير منهم حتى يصبح"
 },
 {
  "id": "me-3",
  "cats": [
   "evening"
  ],
  "ar": "أَعُوذُ بِاللَّهِ مِنَ الشَّيطَانِ الرَّجِيمِ ﴿آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلآئِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لاَ نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُواْ سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ* لاَ يُكَلِّفُ اللَّهُ نَفْساً إِلاَّ وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لاَ تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلاَ تَحْمِلْ عَلَيْنَا إِصْراً كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلاَ تُحَمِّلْنَا مَا لاَ طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَآ أَنتَ مَوْلاَنَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ﴾. [البقرة 285 - 286]",
  "en": "(285) The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allah and His angels and His books and His messengers, [saying], We make no distinction between any of His messengers. And they say, We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the [final] destination. (286) Allah does not charge a soul except [with that within] its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.",
  "tr": "Aamanar-Rasoolu bimaaa unzila ilaihi mir-Rabbihee walmu'minoon; kullun aamana billaahi wa Malaaa'ikathihee wa Kutubhihee wa Rusulihee laa nufarriqu baina ahadim-mir-Rusulih wa qaaloo sami'naa wa ata'naa ghufraanaka Rabbanaa wa ilaikal-maseer (285)\nLaa yukalliful-laahu nafsan illaa wus'ahaa; lahaa maa kasabat wa 'alaihaa maktasabat; Rabbanaa laa tu'aakhiznaaa in naseenaaa aw akhtaanaa; Rabbanaa wa laa tahmil-'alainaaa isran kamaa hamaltahoo 'alal-lazeena min qablinaa; Rabbanaa wa laa tuhammilnaa maa laa taaqata lanaa bih; wa'fu 'annaa waghfir lanaa warhamnaa; Anta mawlaanaa fansurnaa 'alal qawmil kaafireen (286)",
  "count": 1,
  "ref": "It was narrated by Al-Bukhari, No. 4008, and Muslim, No. 807.",
  "virtue": "Al-Baqarah 2:285-6. These two Verses will be sufficient for anyone who recites them at night before sleeping.",
  "refAr": "أخرجه البخاري (4008)، ومسلم (807).",
  "virtueAr": "من قرأ آيتين من آخر سورة البقرة في ليلة كفتاه."
 },
 {
  "id": "me-4",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "قُلْ هُوَ ٱللَّهُ أَحَدٌ، ٱللَّهُ ٱلصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
  "en": "(1) Say, He is Allah, [who is] One, (2) Allah, the Eternal Refuge.(3) He neither begets nor is born,(4) Nor is there to Him any equivalent.",
  "tr": "Bismillaahir Rahmaanir Raheem \"Qul huwal laahu ahad (1) Allah hus-samad (2) Lam yalid wa lam yoolad (3) Wa lam yakul-lahoo kufuwan ahad (4)",
  "count": 3,
  "ref": "The Hadith was reported by Abu Dawud 4/322, and At-Tirmidhi 5/567. See Al-Albani's Sahih At-Tirmidhi 3/182.",
  "virtue": "Al-Ikhlas 112:1-4, Al-Falaq 113:1-5, An-Nas 114:1-6. Whoever recites these three times in the morning and in the evening, they will suffice him (as a protection) against everything.",
  "refAr": "أخرجه أبو داود، 4/ 322، برقم 5082، والترمذي، 5/ 567، برقم 3575، وانظر: صحيح الترمذي، 3/182.",
  "virtueAr": "من قالها ثلاث مرات حين يصبح وحين يمسي كفته من كل شيء"
 },
 {
  "id": "me-5",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
  "en": "(1) Say, I seek refuge in the Lord of daybreak (2) From the evil of that which He created (3) And from the evil of darkness when it settles (4) And from the evil of the blowers in knots (5) And from the evil of an envier when he envies.",
  "tr": "Bismillaahir Rahmaanir Raheem \"Qul a'oozu bi rabbil-falaq (1) Min sharri maa khalaq (2) Wa min sharri ghaasiqin izaa waqab (3) Wa min sharrin-naffaa-taati fil 'uqad (4) Wa min sharri haasidin izaa hasad (5)",
  "count": 3,
  "ref": "The Hadith was reported by Abu Dawud 4/322, and At-Tirmidhi 5/567. See Al-Albani's Sahih At-Tirmidhi 3/182.",
  "virtue": "Al-Ikhlas 112:1-4, Al-Falaq 113:1-5, An-Nas 114:1-6. Whoever recites these three times in the morning and in the evening, they will suffice him (as a protection) against everything.",
  "refAr": "أخرجه أبو داود، 4/ 322، برقم 5082، والترمذي، 5/ 567، برقم 3575، وانظر: صحيح الترمذي، 3/182.",
  "virtueAr": "من قالها ثلاث مرات حين يصبح وحين يمسي كفته من كل شيء"
 },
 {
  "id": "me-6",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ، مَلِكِ ٱلنَّاسِ، إِلَٰهِ ٱلنَّاسِ، مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ، ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ، مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
  "en": "(1) Say, I seek refuge in the Lord of mankind (2) The Sovereign of mankind (3) The God of mankind (4) From the evil of the retreating whisperer (5) Who whispers [evil] into the breasts of mankind (6) From among the jinn and mankind.",
  "tr": "Bismillaahir Rahmaanir Raheem \"Qul a'oozu birabbin naas (1)\nMalikin naas (2)\nIlaahin naas (3)\nMin sharril waswaasil khannaas (4)\nAllazee yuwaswisu fee sudoorin naas (5)\nMinal jinnati wannaas (6)",
  "count": 3,
  "ref": "The Hadith was reported by Abu Dawud 4/322, and At-Tirmidhi 5/567. See Al-Albani's Sahih At-Tirmidhi 3/182.",
  "virtue": "Al-Ikhlas 112:1-4, Al-Falaq 113:1-5, An-Nas 114:1-6. Whoever recites these three times in the morning and in the evening, they will suffice him (as a protection) against everything.",
  "refAr": "أخرجه أبو داود، 4/ 322، برقم 5082، والترمذي، 5/ 567، برقم 3575، وانظر: صحيح الترمذي، 3/182.",
  "virtueAr": "من قالها ثلاث مرات حين يصبح وحين يمسي كفته من كل شيء"
 },
 {
  "id": "me-7",
  "cats": [
   "evening"
  ],
  "ar": "أَصْبَحْنَا وَأَصْبَحَ الْملْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْملْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
  "en": "We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise, and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it and I take refuge in You from the evil of this day and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.",
  "tr": "Asbahna wa-asbahal-mulku lillah, walhamdu lillah, la ilaha illal-lah, wahdahu la shareeka lah, lahul-mulku walahul-hamd, wahuwa AAala kulli shayin qadeer, rabbi as-aluka khayra ma fee hathal-yawm, wakhayra ma baAAdahu, wa-aAAoothu bika min sharri hathal-yawm, washarri ma baAAdahu, rabbi aAAoothu bika minal-kasal, wasoo-il kibar, rabbi aAAoothu bika min AAathabin fin-nar, waAAathabin fil-qabr.",
  "count": 1,
  "ref": "Muslim, 4/2088, No. 2723.",
  "virtue": "",
  "refAr": "مسلم، 4/ 2088، برقم 2723.",
  "virtueAr": ""
 },
 {
  "id": "me-8",
  "cats": [
   "evening"
  ],
  "ar": "أمسينا وأمسى الملك للَّه، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رب أسألك خير ما في هذه الليلة، وخير ما بعدها، وأعوذ بك من شر ما في هذه الليلة، وشر ما بعدها، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
  "en": "We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise, and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it and I take refuge in You from the evil of this night and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.",
  "tr": "Amsayna wa-amsal-mulku lillah, walhamdu lillah, la ilaha illal-lah, wahdahu la shareeka lah, lahul-mulku walahul-hamd, wahuwa AAala kulli shayin qadeer, rabbi as-aluka khayra ma fee hathihil-laylah, wakhayra ma baAAdaha, wa-aAAoothu bika min sharri hathihil-laylah, washarri ma baAAdaha, rabbi aAAoothu bika minal-kasal, wasoo-il kibar, rabbi aAAoothu bika min AAathabin fin-nar, waAAathabin fil-qabr.",
  "count": 1,
  "ref": "Muslim, 4/2088, No. 2723.",
  "virtue": "",
  "refAr": "مسلم، 4/ 2088، برقم 2723.",
  "virtueAr": ""
 },
 {
  "id": "me-9",
  "cats": [
   "evening"
  ],
  "ar": "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
  "en": "O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection",
  "tr": "Allahumma bika asbahna, wabika amsayna, wabika nahya, wabika namootu wa-ilaykan-nushoor.",
  "count": 1,
  "ref": "Al-Tirmidhi, 5/466, No. 3391, and see: Sahih Al-Tirmidhi 3/142.",
  "virtue": "",
  "refAr": "الترمذي، 5/ 466، برقم 3391، وانظر: صحيح الترمذي 3/142.",
  "virtueAr": ""
 },
 {
  "id": "me-10",
  "cats": [
   "evening"
  ],
  "ar": "اللَّهمَّ بِكَ أمسَينا وبِكَ أصبَحنا وبِكَ نَحيا وبِكَ نموتُ، وإليكَ المصيرُ",
  "en": "O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.",
  "tr": "Allahumma bika amsayna, wabika asbahna, wabika nahya, wabika namootu wa-ilaykal-maseer.",
  "count": 1,
  "ref": "Al-Tirmidhi, 5/466, No. 3391, and see: Sahih Al-Tirmidhi 3/142.",
  "virtue": "",
  "refAr": "الترمذي، 5/ 466، برقم 3391، وانظر: صحيح الترمذي 3/142.",
  "virtueAr": ""
 },
 {
  "id": "me-11",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنوبَ إِلاَّ أَنْتَ",
  "en": "O Allah, You are my Lord, none has the right to be worshipped except You, You created me and I am Your servant and I abide to Your covenant and promise as best I can, I take refuge in You from the evil of which I have committed.  I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for verily none can forgive sin except You.",
  "tr": "Allahumma anta rabbee la ilaha illa ant, khalaqtanee wa-ana AAabduk, wa-ana AAala AAahdika wawaAAdika mas-tataAAt, aAAoothu bika min sharri ma sanaAAt, aboo-o laka biniAAmatika AAalay, wa-aboo-o bithanbee, faghfir lee fa-innahu la yaghfiruth-thunooba illa ant.",
  "count": 1,
  "ref": "Narrated by Al-Bukhari, 7/150, No. 6306.",
  "virtue": "Whoever recites this with conviction in the evening and dies during that night shall enter Paradise, and whoever recites it with conviction in the morning and dies during that day shall enter Paradise",
  "refAr": "أخرجه البخاري، 7/ 150، برقم 6306.",
  "virtueAr": "وَمَنْ قَالَهَا مِنَ النَّهَارِ مُوقِنًا بِهَا، فَمَاتَ مِنْ يَوْمِهِ قَبْلَ أَنْ يُمْسِيَ، فَهُوَ مِنْ أَهْلِ الْجَنَّةِ، وَمَنْ قَالَهَا مِنَ اللَّيْلِ وَهُوَ مُوقِنٌ بِهَا، فَمَاتَ قَبْلَ أَنْ يُصْبِحَ، فَهُوَ مِنْ أَهْلِ الْجَنَّةِ"
 },
 {
  "id": "me-12",
  "cats": [
   "evening"
  ],
  "ar": "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلاَّ أَنْتَ وَحْدَكَ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ",
  "en": "O Allah, verily I have reached the morning and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You, alone, without partner, and that Muhammad is Your Servant and Messenger.",
  "tr": "Allahumma innee asbahtu oshhiduka, wa-osshidu hamalata AAarshika, wamala-ikatika, wajameeAAa khalqika, annaka antal-lahu la ilaha illa ant, wahdaka la shareeka lak, wa-anna Muhammadan AAabduka warasooluka.",
  "count": 4,
  "ref": "It was narrated by Abu Dawood, 4/317, No. 5069, and by Al-Bukhari in Al-Adab Al-Mufrad, No. 1201, and by Al-Nasa'i in 'Amal Al-Yawm wal-Laylah, No. 9, and by Ib",
  "virtue": "Allah will spare whoever says this four times in the morning or evening from the fire of Hell.",
  "refAr": "أخرجه أبو داود، 4/ 317، برقم 5069، والبخاري في الأدب المفرد، برقم 1201، والنسائي في عمل اليوم والليلة، برقم 9، وابن السني، برقم 70، وحسّن سماحة الشيخ ابن باز ‘ ",
  "virtueAr": "من قالها حين يصبح، أو يمسي أربع مرات، أعتقه اللَّه من النار"
 },
 {
  "id": "me-13",
  "cats": [
   "evening"
  ],
  "ar": "اللَّهم إني أمسيت أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلاَّ أَنْتَ وَحْدَكَ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ",
  "en": "O Allah, verily I have reached the evening and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You, alone, without partner, and that Muhammad is Your Servant and Messenger.",
  "tr": "Allahumma innee amsaytu oshhiduka, wa-osshidu hamalata AAarshika, wamala-ikatika, wajameeAAa khalqika, annaka antal-lahu la ilaha illa ant, wahdaka la shareeka lak, wa-anna Muhammadan AAabduka warasooluka.",
  "count": 4,
  "ref": "It was narrated by Abu Dawood, 4/317, No. 5069, and by Al-Bukhari in Al-Adab Al-Mufrad, No. 1201, and by Al-Nasa'i in 'Amal Al-Yawm wal-Laylah, No. 9, and by Ib",
  "virtue": "Allah will spare whoever says this four times in the morning or evening from the fire of Hell.",
  "refAr": "أخرجه أبو داود، 4/ 317، برقم 5069، والبخاري في الأدب المفرد، برقم 1201، والنسائي في عمل اليوم والليلة، برقم 9، وابن السني، برقم 70، وحسّن سماحة الشيخ ابن باز ‘ ",
  "virtueAr": "من قالها حين يصبح، أو يمسي أربع مرات، أعتقه اللَّه من النار"
 },
 {
  "id": "me-14",
  "cats": [
   "evening"
  ],
  "ar": "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
  "en": "O Allah, what blessing I or any of Your creation have risen upon is from You alone, without partner. So for You is all praise and unto You all thanks.",
  "tr": "Allahumma ma asbaha bee min niAAmatin, aw bi-ahadin min khalqika, faminka wahdaka la shareeka lak, falakal-hamdu walakash-shukr.",
  "count": 1,
  "ref": "It was narrated by Abu Dawood, 4/318, No. 5073, and by Al-Nasa'i in 'Amal Al-Yawm wal-Laylah, No. 7, and by Ibn Al-Sunni, No. 41, and by Ibn Hibban in Mawarid, ",
  "virtue": "Whoever recites this in the morning, has completed his obligation to thank Allah for that day; and whoever says it in the evening, has completed his obligation for that night.",
  "refAr": "أخرجه أبو داود، 4/ 318، برقم 5073، والنسائي في عمل اليوم والليلة، برقم 7، وابن السني، برقم 41، وابن حبان، ((موارد)) برقم 2361، وحسّن ابن باز ‘ إسناده في تحفة ال",
  "virtueAr": "من قالها حين يصبح فقد أدَّى شكر يومه، ومن قالها حين يمسي فقد أدَّى شكر ليلته"
 },
 {
  "id": "me-15",
  "cats": [
   "evening"
  ],
  "ar": "اللَّهم ما أمسى بي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
  "en": "O Allah, what blessing I or any of Your creation have reached the evening upon is from You alone, without partner. So for You is all praise and unto You all thanks",
  "tr": "Allahumma ma amsa bee min niAAmatin, aw bi-ahadin min khalqika, faminka wahdaka la shareeka lak, falakal-hamdu walakash-shukr.",
  "count": 1,
  "ref": "It was narrated by Abu Dawood, 4/318, No. 5073, and by Al-Nasa'i in 'Amal Al-Yawm wal-Laylah, No. 7, and by Ibn Al-Sunni, No. 41, and by Ibn Hibban in Mawarid, ",
  "virtue": "Whoever recites this in the morning, has completed his obligation to thank Allah for that day; and whoever says it in the evening, has completed his obligation for that night.",
  "refAr": "أخرجه أبو داود، 4/ 318، برقم 5073، والنسائي في عمل اليوم والليلة، برقم 7، وابن السني، برقم 41، وابن حبان، ((موارد)) برقم 2361، وحسّن ابن باز ‘ إسناده في تحفة ال",
  "virtueAr": "من قالها حين يصبح فقد أدَّى شكر يومه، ومن قالها حين يمسي فقد أدَّى شكر ليلته"
 },
 {
  "id": "me-16",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ القَبْرِ، لاَ إِلَهَ إِلاَّ أَنْتَ",
  "en": "(O Allah, grant my body health, O Allah, grant my hearing health, O Allah, grant my sight health.  None has the right to be worshipped except You.) (O Allah, I take refuge with You from disbelief and poverty, and I take refuge with You from the punishment of the grave.  None has the right to be worshipped except You.)",
  "tr": "(Allahumma AAafinee fee badanee, allahumma AAafinee fee samAAee, allahumma AAafinee fee basaree, la ilaha illa ant.) (Allahumma innee aAAoothu bika minal-kufr, walfaqr, wa-aAAoothu bika min AAathabil-qabr, la ilaha illa ant.)",
  "count": 3,
  "ref": "Abu Dawud 4/324, Ahmad 5/42, An-Nasa'i, 'Amalul-Yawm wal-Laylah (No. 22), Ibn As-Sunni (No. 69), Al-Bukhari Al-'Adab Al-Mufrad. Its chain of transmission is goo",
  "virtue": "",
  "refAr": "أبو داود، 4/ 324، برقم 5090، وأحمد، 5/ 42، برقم 20430، والنسائي في عمل اليوم والليلة، برقم 22، وابن السني، برقم 69، والبخاري في الأدب المفرد، برقم 701، وحسّن ال",
  "virtueAr": ""
 },
 {
  "id": "me-17",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
  "en": "Allah is Sufficient for me, none has the right to be worshipped except Him, upon Him I rely and He is Lord of the exalted throne.",
  "tr": "Hasbiyal-lahu la ilaha illa huwa, AAalayhi tawakkalt, wahuwa rabbul-AAarshil-AAatheem",
  "count": 7,
  "ref": "It was narrated by Ibn As-Sunni, No. 71, attributed directly to the Prophet (Marfu'), and by Abu Dawud as a statement of a Companion (Mawquf), 4/321, No. 5081. ",
  "virtue": "Allah will grant whoever recites this seven times in the morning or evening whatever he desires from this world or the next",
  "refAr": "أخرجه ابن السني، برقم 71 مرفوعاً، وأبو داود موقوفاً، 4/ 321، برقم 5081، وصحّح إسناده شعيب وعبدالقادر الأرناؤوط. انظر: زاد المعاد 2/376.",
  "virtueAr": "من قالها حين يصبح وحين يمسي سبع مرات كفاه اللَّه ما أهمّه من أمر الدنيا والآخرة"
 },
 {
  "id": "me-18",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ: فِي دِينِي وَدُنْيَايَ وَأَهْلِي، وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَينِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي",
  "en": "O Allah, I ask You for pardon and well-being in this life and the next. O Allah, I ask You for pardon and well-being in my religious and worldly affairs, and my family and my wealth. O Allah, veil my weaknesses and set at ease my dismay. O Allah, preserve me from the front and from behind and on my right and on my left and from above, and I take refuge with You lest I be swallowed up by the earth.",
  "tr": "Allahumma innee as-alukal-AAafwa walAAafiyah, fid-dunya wal-akhirah, allahumma innee as-alukal-AAafwa walAAafiyah fee deenee, wadunyaya wa-ahlee, wamalee, allahummas-tur AAawratee, wa-amin rawAAatee, allahummah-fathnee min bayni yaday, wamin khalfee, waAAan yameenee, waAAan shimalee, wamin fawqee, wa-aAAoothu biAAathamatika an oghtala min tahtee.",
  "count": 1,
  "ref": "Abu Dawood, No. 5074, and Ibn Majah, No. 3871. See: Sahih Ibn Majah, 2/332.",
  "virtue": "",
  "refAr": "أبو داود، برقم 5074، وابن ماجه، برقم 3871، وانظر: صحيح ابن ماجه، 2/332.",
  "virtueAr": ""
 },
 {
  "id": "me-19",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "اللَّهُمَّ عَالِمَ الغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطانِ وَشَرَكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءاً، أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ",
  "en": "(O Allah, Knower of the unseen and the seen, Creator of the heavens and the Earth, Lord and Sovereign of all things, I bear witness that none has the right to be worshipped except You. I take refuge in You from the evil of my soul and from the evil and shirk of the devil, and from committing wrong against my soul or bringing such upon another Muslim.)(shirk: to associate others with Allah in those things which are specific to Him.  This can occur in (1) belief, e.g. to believe that other than Allah has the power to benefit or harm, (2) speech, e.g. to swear by other than Allah and (3) action, e.g. to bow or prostrate to other than Allah.)",
  "tr": "Allahumma AAalimal-ghaybi washshahadah, fatiras-samawati wal-ard, rabba kulli shayin wamaleekah, ashhadu an la ilaha illa ant, aAAoothu bika min sharri nafsee wamin sharrish-shaytani washirkih, waan aqtarifa AAala nafsee soo-an aw ajurrahu ila muslim.",
  "count": 1,
  "ref": "Al-Tirmidhi, No. 3392, and Abu Dawood, No. 5067. See: Sahih Al-Tirmidhi, 3/142.",
  "virtue": "",
  "refAr": "الترمذي، برقم 3392، وأبو داود، برقم 5067،. وانظر: صحيح الترمذي، 3/142.",
  "virtueAr": ""
 },
 {
  "id": "me-20",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلاَ فِي السّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
  "en": "In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is The All-Seeing, The All-Knowing.",
  "tr": "Bismil-lahil-lathee la yadurru maAAas-mihi shay-on fil-ardi wala fis-sama-i wahuwas-sameeAAul-AAaleem.",
  "count": 3,
  "ref": "It was narrated by Abu Dawood, 4/323, No. 5088, Al-Tirmidhi, 5/465, No. 3388, Ibn Majah, No. 3869, and Ahmad, No. 446. See: Sahih Ibn Majah, 2/332. Sheikh Ibn B",
  "virtue": "Whoever recites it three times in the morning will not be afflicted by any calamity before evening, and whoever recites it three times in the evening will not be overtaken by any calamity before morning.",
  "refAr": "أخرجه أبو داود، 4/ 323، برقم، 5088، والترمذي، 5/ 465، برقم 3388، وابن ماجه، برقم 3869، وأحمد، برقم 446. وانظر: صحيح ابن ماجه، 2/332، وحسّن إسناده العلامة ابن با",
  "virtueAr": "من قالها ثلاثاً إذا أصبح، وثلاثاً إذا أمسى لم يضره شيء"
 },
 {
  "id": "me-21",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالْإِسْلاَمِ دِيناً، وَبِمُحَمَّدٍ ﷺ نَبِيًّا",
  "en": "I am pleased with Allah as a Lord, and Islam as a religion and Muhammad  as a Prophet.",
  "tr": "Radeetu billahi rabban wabil-islami deenan wabiMuhammadin nabiyya.",
  "count": 3,
  "ref": "Ahmad, 4/337, No. 18967, Al-Nasa'i in 'Amal Al-Yawm wal-Laylah, No. 4, Ibn Al-Sunni, No. 68, Abu Dawood, 4/318, No. 1531, and Al-Tirmidhi, 5/465, No. 3389. Shei",
  "virtue": "Allah has promised that anyone who says this three times every morning or evening will be pleased on the Day of Resurrection.",
  "refAr": "أحمد، 4/ 337، برقم 18967، والنسائي في عمل اليوم والليلة، برقم 4، وابن السني، برقم 68، وأبو داود، 4/ 318، برقم 1531، والترمذي، 5/ 465، برقم، 3389، وحسّنه ابن باز",
  "virtueAr": "من قالها ثلاثاً حين يصبح وثلاثاً حين يمسي كان حقاً على اللَّه أن يرضيه يوم القيامة"
 },
 {
  "id": "me-22",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغيثُ أَصْلِحْ لِي شَأْنِيَ كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
  "en": "O Ever Living, O Self-Subsisting and Supporter of all, by Your mercy I seek assistance, rectify for me all of my affairs and do not leave me to myself, even for the blink of an eye.",
  "tr": "Ya hayyu ya qayyoom, birahmatika astagheeth, aslih lee sha/nee kullah, wala takilnee ila nafsee tarfata AAayn.",
  "count": 1,
  "ref": "Its chain of transmission is sound (Sahih), Al-Hakim 1/545, see Albani, Sahihut-Targhib wat-Tarhib, 1/273.",
  "virtue": "",
  "refAr": "الحاكم وصححه، ووافقه الذهبي، 1/545، وانظر: صحيح الترغيب والترهيب، 1/273.",
  "virtueAr": ""
 },
 {
  "id": "me-23",
  "cats": [
   "evening"
  ],
  "ar": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ: فَتْحَهُ، وَنَصْرَهُ، وَنورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ",
  "en": "We have reached the morning and at this very time all sovereignty belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this day, its triumphs and its victories, its light and its blessings and its guidance, and I take refuge in You from the evil of this day and the evil that follows it.",
  "tr": "Asbahna wa-asbahal-mulku lillahi rabbil-AAalameen, allahumma innee as-aluka khayra hathal-yawm, fat-hahu, wanasrahu, wanoorahu, wabarakatahu, wahudahu, wa-aAAoothu bika min sharri ma feehi, washarri ma baAAdah.",
  "count": 1,
  "ref": "Abu Dawud 4/322. Its transmission chain is good (Hasan). See also Ibn Al-Qayyim, Zadul- Ma'ad 2/273.",
  "virtue": "",
  "refAr": "أبو داود، 4/ 322، برقم 5084، وحسن إسناده شعيب وعبد القادر الأرناؤوط في تحقيق زاد المعاد، 2/373.",
  "virtueAr": ""
 },
 {
  "id": "me-24",
  "cats": [
   "evening"
  ],
  "ar": "أَمْسَيْنا وَأَمْسَى الْمُلْكُ للهِ رَبِّ الْعَالَمَيْنِ، اللَّهُمَّ إِنَّي أسْأَلُكَ خَيْرَ هَذَه اللَّيْلَةِ فَتْحَهَا ونَصْرَهَا، ونُوْرَهَا وبَرَكَتهَا، وَهُدَاهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فيهِا وَشَرَّ مَا بَعْدَهَا",
  "en": "We have reached the evening and at this very time all sovereignty belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of tonight, its triumphs and its victories, its light and its blessings and its guidance, and I take refuge in You from the evil of tonight and the evil that follows it.",
  "tr": "Amsayna wa-amsal-mulku lillahi rabbil-AAalameen, allahumma innee as-aluka khayra hathihil-laylah, fat-haha, wanasraha, wanooraha, wabarakataha, wahudaha, wa-aAAoothu bika min sharri ma feeha, washarri ma baAAdaha.",
  "count": 1,
  "ref": "Abu Dawud 4/322. Its transmission chain is good (Hasan). See also Ibn Al-Qayyim, Zadul- Ma'ad 2/273.",
  "virtue": "",
  "refAr": "أبو داود، 4/ 322، برقم 5084، وحسن إسناده شعيب وعبد القادر الأرناؤوط في تحقيق زاد المعاد، 2/373.",
  "virtueAr": ""
 },
 {
  "id": "me-25",
  "cats": [
   "evening"
  ],
  "ar": "أَصْبَحْنا عَلَى فِطْرَةِ الْإِسْلاَمِ، وَعَلَى كَلِمَةِ الْإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ، حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ الْمُشرِكِينَ",
  "en": "We rise upon the fitrah of Islam, and the word of pure faith, and upon the religion of our Prophet Muhammad ﷺ, and the religion of our forefather Ibraheem, who was a Muslim and of true faith and was not of those who associate others with Allah.",
  "tr": "Asbahna AAala fitratil-islam, waAAala kalimatil-ikhlas, waAAala deeni nabiyyina Muhammad ﷺ, waAAala millati abeena Ibraheem, haneefan musliman wama kana minal-mushrikeen.",
  "count": 1,
  "ref": "Ahmad, 3/406 and 407, nos. 15360 and 15563, and Ibn Al-Sunni in 'Amal Al-Yawm wal-Laylah, No. 34. See: Sahih Al-Jami', 4/209.",
  "virtue": "",
  "refAr": "أحمد، 3/ 406، و407، برقم 15360، ورقم 15563، وابن السني في عمل اليوم والليلة، برقم 34، وانظر: صحيح الجامع، 4/209.",
  "virtueAr": ""
 },
 {
  "id": "me-26",
  "cats": [
   "evening"
  ],
  "ar": "أمسينا على فطرة الإسلام، وَعَلَى كَلِمَةِ الْإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ، حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ الْمُشرِكِينَ",
  "en": "We have entered the evening upon the fitrah of Islam, and the word of pure faith, and upon the religion of our Prophet Muhammad ﷺ, and the religion of our forefather Ibraheem, who was a Muslim and of true faith and was not of those who associate others with Allah.",
  "tr": "Amsayna AAala fitratil-islam, waAAala kalimatil-ikhlas, waAAala deeni nabiyyina Muhammad ﷺ, waAAala millati abeena Ibraheem, haneefan musliman wama kana minal-mushrikeen.",
  "count": 1,
  "ref": "Ahmad, 3/406 and 407, nos. 15360 and 15563, and Ibn Al-Sunni in 'Amal Al-Yawm wal-Laylah, No. 34. See: Sahih Al-Jami', 4/209.",
  "virtue": "",
  "refAr": "أحمد، 3/ 406، و407، برقم 15360، ورقم 15563، وابن السني في عمل اليوم والليلة، برقم 34، وانظر: صحيح الجامع، 4/209.",
  "virtueAr": ""
 },
 {
  "id": "me-27",
  "cats": [
   "evening"
  ],
  "ar": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْماً نَافِعاً، وَرِزْقاً طَيِّباً، وَعَمَلاً مُتَقَبَّلاً",
  "en": "O Allah, I ask You for knowledge which is beneficial and sustenance which is good, and deeds which are acceptable.",
  "tr": "Allahumma innee as-aluka AAilman nafiAAan, warizqan tayyiban, waAAamalan mutaqabbalan.",
  "count": 1,
  "ref": "It was narrated by Ibn Al-Sunni in 'Amal Al-Yawm wal-Laylah, No. 54, and by Ibn Majah, No. 925. The chain of transmission was classified as hasan by 'Abd al-Qad",
  "virtue": "",
  "refAr": "أخرجه ابن السني في ((عمل اليوم والليلة)) برقم (54)، وابن ماجة برقم (925)، وحسن إسناده عبدالقادر وشعيب الأرناؤوط، في تحقيق ((زاد المعاد)) (2/375).",
  "virtueAr": ""
 },
 {
  "id": "me-28",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "لاَ إِلَهَ إِلاَّ اللَّهُ، وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
  "en": "None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise, and He is over all things omnipotent.",
  "tr": "La ilaha illal-lah, wahdahu la shareeka lah, lahul-mulku walahul-hamd, wahuwa AAala kulli shay-in qadeer.",
  "count": 10,
  "ref": "Sahih Al-Bukhari: 6404, Sahih Muslim: 2693, Al-Nasa'i in 'Amal Al-Yawm wal-Laylah, No. 24. See: Sahih Al-Targhib wal-Tarhib, 1/272, Tuhfat Al-Akhyar by Ibn Baz,",
  "virtue": "Ten times or once when feeling lazy, and whoever says it ten times, it is as if he has freed four souls from the descendants of Isma'il.",
  "refAr": "صحيح البخاري: 6404، صحيح مسلم: 2693، النسائي في عمل اليوم والليلة، برقم 24، وانظر: صحيح الترغيب والترهيب، 1/272، وتحفة الأخيار لابن باز ‘، ص44، وانظر فضلها في: ",
  "virtueAr": "عشرَ مرَّات أَوْ مرَّةً واحدةً عندَ الكَسَلِ، ومن قالها عَشْرَ مِرَارٍ كَانَ كَمَنْ أَعْتَقَ أَرْبَعَةَ أَنْفُسٍ مِنْ وَلَدِ إِسْمَاعِيلَ."
 },
 {
  "id": "me-29",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبَيِّنَا مُحَمَّدٍ",
  "en": "O Allaah, send prayers and peace upon our Prophet Muhammad.",
  "tr": "Allaahumma salli wa sallim 'alaa Nabiyyinaa Muhammadin",
  "count": 10,
  "ref": "It was narrated by Al-Tabarani with two isnads, one of which is good. See: Majma' Al-Zawa'id, 10/120, and Sahih Al-Targhib wal-Tarhib, 1/273 [No. 656], and Da'i",
  "virtue": "The Prophet (ﷺ) said: \"Who recites blessings upon me ten times in the morning and ten times in the evening will obtain my intercession on the Day of Resurrection.",
  "refAr": "أخرجه الطبراني بإسنادين أحدهما جيد، انظر: مجمع الزوائد (10/120)، وصحيح الترغيب والترهيب (1/273) [برقم (656)]، وضعيف الترغيب والترهيب برقم: 396. وفي السلسلة الضع",
  "virtueAr": "من صلّى عليَّ حين يصبح عشراً، وحين يمسي عشراً، أدركته شفاعتي يوم القيامة"
 },
 {
  "id": "me-30",
  "cats": [
   "evening"
  ],
  "ar": "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
  "en": "I take refuge in Allah’s perfect words from the evil He has created.",
  "tr": "aAAoothu bikalimatil-lahit-tammati min sharri ma khalaq.",
  "count": 3,
  "ref": "Ahmad 2/ 290, An-Nasa'i, 'Amalul-Yawm wal-Laylah No. 590, At-Tirmidhi 3/187, Ibn As-Sunni No. 68. According to Al-Albani, Ibn Majah's (2/266) chain of transmiss",
  "virtue": "Whoever recites this three times in the evening will be protected from insect stings",
  "refAr": "، أخرجه أحمد، 2/ 290، برقم 7898، والنسائي في عمل اليوم والليلة، برقم 590، وابن السني، برقم 68، وانظر: صحيح الترمذي، 3/187، وصحيح ابن ماجه، 2/266، وتحفة الأخيار ",
  "virtueAr": "من قالها حين يمسي ثلاث مرات لم تضرّه حُمَة تلك الليلة"
 },
 {
  "id": "me-31",
  "cats": [
   "evening"
  ],
  "ar": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
  "en": "How perfect Allah is and I praise Him by the number of His creation and His pleasure, and by the weight of His throne, and the ink of His words.",
  "tr": "Subhanal-lahi wabihamdih, AAadada khalqihi warida nafsih, wazinata AAarshih, wamidada kalimatih.",
  "count": 3,
  "ref": "Muslim 4/2090, No. 2726.",
  "virtue": "",
  "refAr": "مسلم، 4/ 2090، برقم 2726.",
  "virtueAr": ""
 },
 {
  "id": "me-32",
  "cats": [
   "evening"
  ],
  "ar": "لاَ إِلَهَ إِلاَّ اللَّهُ، وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
  "en": "None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise, and He is over all things omnipotent.",
  "tr": "La ilaha illal-lah, wahdahu la shareeka lah, lahul-mulku walahul-hamd, wahuwa AAala kulli shay-in qadeer.",
  "count": 100,
  "ref": "Al-Bukhari, 4/95, No. 3293, and Muslim, 4/2071, No. 2691. Ten times: Al-Nasa'i in 'Amal Al-Yawm wal-Laylah, No. 24. See: Sahih Al-Targhib wal-Tarhib, 1/272, and",
  "virtue": "Whoever recites this one hundred times a day will have the reward of freeing ten slaves. One hundred Hasanaat (rewards) will be written for him and one hundred misdeeds will be washed away. He will be shielded from Satan until the evening. No one will be able to present anything better than this exc",
  "refAr": "البخاري، 4/ 95، برقم 3293، ومسلم، 4/ 2071، برقم 2691\nعشرَ مرَّات: النسائي في عمل اليوم والليلة، برقم 24، وانظر: صحيح الترغيب والترهيب، 1/272، وتحفة الأخيار لابن",
  "virtueAr": "من قالها مائة مرة في يوم كانت له عدل عشر رقاب، وكُتِبَ له مائة حسنة، ومُحيت عنه مائة سيئة، وكانت له حرزاً من الشيطان يومه ذلك حتى يمسي، ولم يأت أحد بأفضل مما جاء به إلا أحد عمل أكثر من ذلك"
 },
 {
  "id": "me-33",
  "cats": [
   "evening"
  ],
  "ar": "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
  "en": "I seek Allaah’s forgiveness and I turn to Him in repentance.",
  "tr": "Astaghfirullaaha wa 'atoobu 'ilayhi",
  "count": 100,
  "ref": "Al-Bukhari with Al-Fath, 11/101 [No. 6307], and Muslim, 4/2075 [No. 2702].",
  "virtue": "",
  "refAr": "البخاري مع ((الفتح)) (11/101) [برقم (6307)]، ومسلم (4/2075) [برقم (2702)].",
  "virtueAr": ""
 },
 {
  "id": "me-34",
  "cats": [
   "morning",
   "evening"
  ],
  "ar": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
  "en": "How perfect Allah is and I praise Him.",
  "tr": "Subhanal-lahi wabihamdih.",
  "count": 100,
  "ref": "Muslim 2692.",
  "virtue": "Whoever recites this one hundred times in the morning and in the evening will not be surpassed on the Day of Resurrection by anyone having done better than this except for someone who had recited it more.",
  "refAr": "مسلم، 4/ 2071 برقم 2692.",
  "virtueAr": "من قالها مائة مرة حين يصبح وحين يمسي لم يأت أحد يوم القيامة بأفضل مما جاء به إلا أحد قال مثل ما قال أو زاد عليه"
 },
 {
  "id": "hm-0-0",
  "cats": [
   "waking"
  ],
  "ar": "الحَمْدُ لِلَّهِ الذِي أَحْيَانَا بَعْدَمَا أَمَاتَنَا، وَإِلَيْهِ النُّشُّورُ",
  "en": "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.",
  "tr": "",
  "count": 1,
  "ref": "البخاري مع الفتح 11/ 113 ومسلم 4/ 2083",
  "virtue": "",
  "refAr": "البخاري مع الفتح 11/ 113 ومسلم 4/ 2083",
  "virtueAr": ""
 },
 {
  "id": "hm-0-1",
  "cats": [
   "waking"
  ],
  "ar": "الحَمْدُ لِلَّهِ الذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ",
  "en": "All praise is for Allah who restored to me my health and returned my soul, and has allowed me to remember Him.",
  "tr": "",
  "count": 1,
  "ref": "التّرمذي 5/ 473 وانظر صحيح التّرمذي 3/ 144",
  "virtue": "",
  "refAr": "التّرمذي 5/ 473 وانظر صحيح التّرمذي 3/ 144",
  "virtueAr": ""
 },
 {
  "id": "hm-0-2",
  "cats": [
   "waking"
  ],
  "ar": "(لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللَّهِ، وَالحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّه، وَاللَّه أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ العَلِّي العَظِيمِ، رَبِّ اغْفِرْ لِي). أَوْ دَعَا اسْتُجِيبَ لَهُ فَإِنْ تَوَضَّأَ وَصَلَّى قُبِلَتْ صَلَاتَهُ",
  "en": "None has the right to be worshipped except Allah, alone, without partner; to Him belongs all sovereignty and praise, and He is over all things omnipotent. How perfect Allah is, and all praise is for Allah, and none has the right to be worshipped except Allah, and Allah is the greatest, and there is no might nor power except with Allah, the Most High, the Supreme. My Lord, forgive me. (Whoever says this is forgiven, and if he supplicates he is answered; if he performs ablution and prays, his prayer is accepted.)",
  "tr": "",
  "count": 1,
  "ref": "البخاري مع الفتح 3/ 144 وغيرها واللفظ لابن ماجه انظر صحيح ابن ماجه 2/ 335",
  "virtue": "",
  "refAr": "البخاري مع الفتح 3/ 144 وغيرها واللفظ لابن ماجه انظر صحيح ابن ماجه 2/ 335",
  "virtueAr": ""
 },
 {
  "id": "hm-0-3",
  "cats": [
   "waking"
  ],
  "ar": "{إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِأُولِي الْأَلْبَابِ (190) الَّذِينَ يَذْكُرُونَ اللَّهَ قِيَامًا وَقُعُودًا وَعَلَى جُنُوبِهِمْ وَيَتَفَكَّرُونَ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ رَبَّنَا مَا خَلَقْتَ هَذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ (191) رَبَّنَا إِنَّكَ مَنْ تُدْخِلِ النَّارَ فَقَدْ أَخْزَيْتَهُ وَمَا لِلظَّالِمِينَ مِنْ أَنْصَارٍ (192) رَبَّنَا إِنَّنَا سَمِعْنَا مُنَادِيًا يُنَادِي لِلْإِيمَانِ أَنْ آمِنُوا بِرَبِّكُمْ فَآمَنَّا رَبَّنَا فَاغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّئَاتِنَا وَتَوَفَّنَا مَعَ الْأَبْرَارِ (193) رَبَّنَا وَآتِنَا مَا وَعَدْتَنَا عَلَى رُسُلِكَ وَلَا تُخْزِنَا يَوْمَ الْقِيَامَةِ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ (194) فَاسْتَجَابَ لَهُمْ رَبُّهُمْ أَنِّي لَا أُضِيعُ عَمَلَ عَامِلٍ مِنْكُمْ مِنْ ذَكَرٍ أَوْ أُنْثَى بَعْضُكُمْ مِنْ بَعْضٍ فَالَّذِينَ هَاجَرُوا وَأُخْرِجُوا مِنْ دِيَارِهِمْ وَأُوذُوا فِي سَبِيلِي وَقَاتَلُوا وَقُتِلُوا لَأُكَفِّرَنَّ عَنْهُمْ سَيِّئَاتِهِمْ وَلَأُدْخِلَنَّهُمْ جَنَّاتٍ تَجْرِي مِنْ تَحْتِهَا الْأَنْهَارُ ثَوَابًا مِنْ عِنْدِ اللَّهِ وَاللَّهُ عِنْدَهُ حُسْنُ الثَّوَابِ (195) لَا يَغُرَّنَّكَ تَقَلُّبُ الَّذِينَ كَفَرُوا فِي الْبِلَادِ (196) مَتَاعٌ قَلِيلٌ ثُمَّ مَأْوَاهُمْ جَهَنَّمُ وَبِئْسَ الْمِهَادُ (197) لَكِنِ الَّذِينَ اتَّقَوْا رَبَّهُمْ لَهُمْ جَنَّاتٌ تَجْرِي مِنْ تَحْتِهَا الْأَنْهَارُ خَالِدِينَ فِيهَا نُزُلًا مِنْ عِنْدِ اللَّهِ وَمَا عِنْدَ اللَّهِ خَيْرٌ لِلْأَبْرَارِ (198) وَإِنَّ مِنْ أَهْلِ الْكِتَابِ لَمَنْ يُؤْمِنُ بِاللَّهِ وَمَا أُنْزِلَ إِلَيْكُمْ وَمَا أُنْزِلَ إِلَيْهِمْ خَاشِعِينَ لِلَّهِ لَا يَشْتَرُونَ بِآيَاتِ اللَّهِ ثَمَنًا قَلِيلًا أُولَئِكَ لَهُمْ أَجْرُهُمْ عِنْدَ رَبِّهِمْ إِنَّ اللَّهَ سَرِيعُ الْحِسَابِ (199) يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا وَاتَّقُوا اللَّهَ لَعَلَّكُمْ تُفْلِحُونَ (200)}\nسورة آل عمران، 190 – 200",
  "en": "Indeed, in the creation of the heavens and the earth and the alternation of the night and the day are signs for those of understanding… (Al ʿImran 3:190–200).",
  "tr": "",
  "count": 1,
  "ref": "البخاري مع الفتح 8/ 238 ومسلم 1/ 530",
  "virtue": "",
  "refAr": "البخاري مع الفتح 8/ 238 ومسلم 1/ 530",
  "virtueAr": ""
 },
 {
  "id": "hm-24-0",
  "cats": [
   "afterPrayer"
  ],
  "ar": "أَسْتَغْفِرُ اللَّهَ (ثَلَاثًا)، اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ",
  "en": "I seek Allah's forgiveness (three times). O Allah, You are As-Salam and from You is all peace; blessed are You, O Possessor of majesty and honour.",
  "tr": "",
  "count": 1,
  "ref": "مسلم 1/ 414",
  "virtue": "",
  "refAr": "مسلم 1/ 414",
  "virtueAr": ""
 },
 {
  "id": "hm-24-1",
  "cats": [
   "afterPrayer"
  ],
  "ar": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
  "en": "None has the right to be worshipped except Allah, alone, without partner; to Him belongs all sovereignty and praise and He is over all things omnipotent. O Allah, none can prevent what You have willed to bestow and none can bestow what You have willed to prevent, and no wealth or majesty can benefit anyone, as from You is all wealth and majesty.",
  "tr": "",
  "count": 1,
  "ref": "البخاري 1/ 255 ومسلم 1/ 414",
  "virtue": "",
  "refAr": "البخاري 1/ 255 ومسلم 1/ 414",
  "virtueAr": ""
 },
 {
  "id": "hm-24-2",
  "cats": [
   "afterPrayer"
  ],
  "ar": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، لَا إِلَهَ إِلَّا اللَّهُ، وَلَا نَعْبُدُ إِلَّا إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الفَضْلُ، وَلَهُ الثَّنَاءُ الحَسَنُ، لَا إِلَهَ إِلَّا اللَّهُ مُخْلِصِينَ لَهُ الدِّينَ وَلَوْ كَرِهَ الكَافِرُونَ",
  "en": "None has the right to be worshipped except Allah, alone, without partner; to Him belongs all sovereignty and praise and He is over all things omnipotent. There is no might nor power except with Allah; none has the right to be worshipped except Allah, and we worship none except Him. For Him is all favour, grace and glorious praise. None has the right to be worshipped except Allah; we are sincere in faith and devotion to Him although the disbelievers detest it.",
  "tr": "",
  "count": 1,
  "ref": "مسلم 1/ 415",
  "virtue": "",
  "refAr": "مسلم 1/ 415",
  "virtueAr": ""
 },
 {
  "id": "hm-24-3",
  "cats": [
   "afterPrayer"
  ],
  "ar": "سُبْحَانَ اللَّهُ، وَالحَمْدُ لِلَّهِ، وَاللَّهُ أَكْبَرُ (ثَلَاثًا وَثَلَاثِينَ مَرَّةً)\nلَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ (مَرَّةً وَاحِدَةً)",
  "en": "How perfect Allah is, all praise is for Allah, and Allah is the greatest (thirty-three times each). Then once: none has the right to be worshipped except Allah, alone, without partner; to Him belongs all sovereignty and praise and He is over all things omnipotent.",
  "tr": "",
  "count": 1,
  "ref": "\"من قال ذلك دبر كل صلاة غفرت خطاياه وإن كانت مثل زبد البحر\"مسلم 1/ 418",
  "virtue": "",
  "refAr": "\"من قال ذلك دبر كل صلاة غفرت خطاياه وإن كانت مثل زبد البحر\"مسلم 1/ 418",
  "virtueAr": ""
 },
 {
  "id": "hm-24-4",
  "cats": [
   "afterPrayer"
  ],
  "ar": "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\n{قُلْ هُوَ اللَّهُ أَحَدٌ * اللَّهُ الصَّمَدُ * لَمْ يَلِدْ وَلَمْ يُولَدْ * وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ}\nبِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\n{قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ * مِن شَرِّ مَا خَلَقَ * وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ * وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ * وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ}\nبِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\n{قُلْ أَعُوذُ بِرَبِّ النَّاسِ * مَلِكِ النَّاسِ * إِلَهِ النَّاسِ * مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ * الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ * مِنَ الْجِنَّةِ وَالنَّاسِ}",
  "en": "Surah Al-Ikhlas, Surah Al-Falaq and Surah An-Nas (once after each prayer; three times after Fajr and Maghrib).",
  "tr": "",
  "count": 1,
  "ref": "أبو داود 2/ 86 والنسائي 3/ 68 وانظر صحيح التّرمذي 2/ 8 والسور الثلاث يقال لها المعوذات وانظر فتح الباري 9/ 62",
  "virtue": "",
  "refAr": "أبو داود 2/ 86 والنسائي 3/ 68 وانظر صحيح التّرمذي 2/ 8 والسور الثلاث يقال لها المعوذات وانظر فتح الباري 9/ 62",
  "virtueAr": ""
 },
 {
  "id": "hm-24-5",
  "cats": [
   "afterPrayer"
  ],
  "ar": "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\n{اللّهُ لاَ إِلَـهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ}",
  "en": "Ayat al-Kursi (Al-Baqarah 2:255): Allah, there is no god but He, the Ever-Living, the Sustainer of all existence…",
  "tr": "",
  "count": 1,
  "ref": "من قرأها دبر كل صلاة لم يمنعه من دخول الجنة إلا أن يموت . والنسائي في عمل اليوم والليلة برقم 100، وابن السني برقم 121 وصححه الجامع 5/ 339 وسلسلة الأحاديث الصحيح",
  "virtue": "",
  "refAr": "من قرأها دبر كل صلاة لم يمنعه من دخول الجنة إلا أن يموت . والنسائي في عمل اليوم والليلة برقم 100، وابن السني برقم 121 وصححه الجامع 5/ 339 وسلسلة الأحاديث الصحيح",
  "virtueAr": ""
 },
 {
  "id": "hm-24-6",
  "cats": [
   "afterPrayer"
  ],
  "ar": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ\n(بَعْدَ صَلَاةِ المَغْرِبِ وَالصُّبْحِ)",
  "en": "None has the right to be worshipped except Allah, alone, without partner; to Him belongs all sovereignty and praise. He gives life and causes death, and He is over all things omnipotent. (Ten times after Maghrib and Fajr.)",
  "tr": "",
  "count": 10,
  "ref": "رواه التّرمذي 5/ 515 وأحمد 4/ 227 وانظر تخريجه في زاد المعاد 1/ 300",
  "virtue": "",
  "refAr": "رواه التّرمذي 5/ 515 وأحمد 4/ 227 وانظر تخريجه في زاد المعاد 1/ 300",
  "virtueAr": ""
 },
 {
  "id": "hm-24-7",
  "cats": [
   "afterPrayer"
  ],
  "ar": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وعَمَلًا مُتَقَبَّلًا\n(بَعْدَ السَّلَامِ مِنْ صَلَاةِ الفَجْرِ)",
  "en": "O Allah, I ask You for knowledge which is beneficial, provision which is good, and deeds which are accepted. (After the salam of the Fajr prayer.)",
  "tr": "",
  "count": 1,
  "ref": "ابن ماجه وغيره وانظر صحيح ابن ماجة 1/ 152 ومجمع الزوائد 10/ 111",
  "virtue": "",
  "refAr": "ابن ماجه وغيره وانظر صحيح ابن ماجة 1/ 152 ومجمع الزوائد 10/ 111",
  "virtueAr": ""
 },
 {
  "id": "hm-28-0",
  "cats": [
   "sleep"
  ],
  "ar": "يَجْمَعُ كَفَّيْهِ ثُمَّ يَنْفُثُ فِيهِمَا، فَيَقْرَأُ فِيهِمَا:\nبِسْمِ اللَّهِ الرَّحْمِنِ الرَّحِيمِ\n{قُلْ هُوَ اللَّهُ أَحَدٌ * اللَّهُ الصَّمَدُ * لَمْ يَلِدْ وَلَمْ يُولَدْ * وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ}\nبِسْمِ اللَّهِ الرَّحْمِنِ الرَّحِيمِ\n{قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ * مِن شَرِّ مَا خَلَقَ * وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ * وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ * وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ}\nبِسْمِ اللَّهِ الرَّحْمِنِ الرَّحِيمِ\n{قُلْ أَعُوذُ بِرَبِّ النَّاسِ * مَلِكِ النَّاسِ * إِلَهِ النَّاسِ * مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ * الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ * مِنَ الْجِنَّةِ وَالنَّاسِ}\nثُمَّ يَمْسَحُ بِهِمَا مَا اسْتَطَاعَ مِنْ جَسَدِهِ يَبْدَأُ بِهِمَا عَلَى رَأْسِهِ وَوَجْهِهِ وَمَا أَقْبَلَ مِنْ جَسَدِهِ",
  "en": "Cup the palms together, blow lightly into them, and recite Surah Al-Ikhlas, Surah Al-Falaq and Surah An-Nas; then wipe over as much of the body as possible, beginning with the head, the face and the front of the body. (Three times.)",
  "tr": "",
  "count": 3,
  "ref": "البخاري مع الفتح 9/ 62 ومسلم 4/ 1723",
  "virtue": "",
  "refAr": "البخاري مع الفتح 9/ 62 ومسلم 4/ 1723",
  "virtueAr": ""
 },
 {
  "id": "hm-28-1",
  "cats": [
   "sleep"
  ],
  "ar": "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\n{اللّهُ لاَ إِلَـهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ}",
  "en": "Ayat al-Kursi (Al-Baqarah 2:255). Whoever recites it when retiring to bed will have a guardian from Allah who remains with him, and no devil will come near him until morning.",
  "tr": "",
  "count": 1,
  "ref": "من قرأها إذا أوى إلى فراشه فإنه لن يزال عليه من الله حافظ ولا يقربه شيطان حتى يصبح البخاري مع الفتح 4/ 487",
  "virtue": "",
  "refAr": "من قرأها إذا أوى إلى فراشه فإنه لن يزال عليه من الله حافظ ولا يقربه شيطان حتى يصبح البخاري مع الفتح 4/ 487",
  "virtueAr": ""
 },
 {
  "id": "hm-28-2",
  "cats": [
   "sleep"
  ],
  "ar": "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\n{آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللّهِ وَمَلآئِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لاَ نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُواْ سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ * لاَ يُكَلِّفُ اللّهُ نَفْسًا إِلاَّ وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لاَ تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلاَ تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلاَ تُحَمِّلْنَا مَا لاَ طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلاَنَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ}",
  "en": "The last two ayat of Surah Al-Baqarah (2:285–286): the Messenger has believed in what was revealed to him from his Lord, and so have the believers… Whoever recites them at night, they suffice him.",
  "tr": "",
  "count": 1,
  "ref": "من قرأهما في ليلة كفتاه، البخاري مع الفتح 9/ 94 ومسلم 1/ 554، والآيتان من سورة البقرة، 285 – 286",
  "virtue": "",
  "refAr": "من قرأهما في ليلة كفتاه، البخاري مع الفتح 9/ 94 ومسلم 1/ 554، والآيتان من سورة البقرة، 285 – 286",
  "virtueAr": ""
 },
 {
  "id": "hm-28-3",
  "cats": [
   "sleep"
  ],
  "ar": "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ",
  "en": "In Your name, my Lord, I lie down, and in Your name I rise. If You should take my soul then have mercy upon it, and if You should return my soul then protect it in the manner You protect Your righteous servants.",
  "tr": "",
  "count": 1,
  "ref": "إذا قام أحدكم من فراشه ثم رجع إليه فلينفض بصنفة  إزاره ثلاث مرات وليسم الله  فإنه لا يدري ماذا خلفه عليه بعده وإذا اضطجع فليقل ... (الحديث)\n البخاري 11/ 126. وم",
  "virtue": "",
  "refAr": "إذا قام أحدكم من فراشه ثم رجع إليه فلينفض بصنفة  إزاره ثلاث مرات وليسم الله  فإنه لا يدري ماذا خلفه عليه بعده وإذا اضطجع فليقل ... (الحديث)\n البخاري 11/ 126. وم",
  "virtueAr": ""
 },
 {
  "id": "hm-28-4",
  "cats": [
   "sleep"
  ],
  "ar": "اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا، اللَّهُمَّ إِنِّي أَسْأَلُكَ العَافِيَةَ",
  "en": "O Allah, You created my soul and You take it back; unto You is its death and its life. If You give it life then protect it, and if You cause it to die then forgive it. O Allah, I ask You for well-being.",
  "tr": "",
  "count": 1,
  "ref": "أخرجه مسلم 4/ 2083 وأحمد بلفظه 2/ 79",
  "virtue": "",
  "refAr": "أخرجه مسلم 4/ 2083 وأحمد بلفظه 2/ 79",
  "virtueAr": ""
 },
 {
  "id": "hm-28-5",
  "cats": [
   "sleep"
  ],
  "ar": "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
  "en": "O Allah, protect me from Your punishment on the day You resurrect Your servants. (Three times.)",
  "tr": "",
  "count": 3,
  "ref": "كان رسول الله صلى الله عليه وسلم إذا أراد أن يرقد وضع يده اليمنى تحت خده ثم يقول ... (الحديث)\nأبو داود بلفظه 4/ 311 وانظر صحيح التّرمذي 3/ 143",
  "virtue": "",
  "refAr": "كان رسول الله صلى الله عليه وسلم إذا أراد أن يرقد وضع يده اليمنى تحت خده ثم يقول ... (الحديث)\nأبو داود بلفظه 4/ 311 وانظر صحيح التّرمذي 3/ 143",
  "virtueAr": ""
 },
 {
  "id": "hm-28-6",
  "cats": [
   "sleep"
  ],
  "ar": "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
  "en": "In Your name, O Allah, I die and I live.",
  "tr": "",
  "count": 1,
  "ref": "البخاري مع الفتح 11/ 113 ومسلم 4/ 2083",
  "virtue": "",
  "refAr": "البخاري مع الفتح 11/ 113 ومسلم 4/ 2083",
  "virtueAr": ""
 },
 {
  "id": "hm-28-7",
  "cats": [
   "sleep"
  ],
  "ar": "سُبْحَانَ اللَّهِ",
  "en": "How perfect Allah is. (Thirty-three times.)",
  "tr": "",
  "count": 33,
  "ref": "من قال ذلك عندما يأوي إلى فراشه كان خيرًا له من خادم. البخاري مع الفتح 7/ 71 ومسلم 4/ 2091",
  "virtue": "",
  "refAr": "من قال ذلك عندما يأوي إلى فراشه كان خيرًا له من خادم. البخاري مع الفتح 7/ 71 ومسلم 4/ 2091",
  "virtueAr": ""
 },
 {
  "id": "hm-28-8",
  "cats": [
   "sleep"
  ],
  "ar": "الحَمْدُ لِلَّهِ",
  "en": "All praise is for Allah. (Thirty-three times.)",
  "tr": "",
  "count": 33,
  "ref": "من قال ذلك عندما يأوي إلى فراشه كان خيرًا له من خادم. البخاري مع الفتح 7/ 71 ومسلم 4/ 2091",
  "virtue": "",
  "refAr": "من قال ذلك عندما يأوي إلى فراشه كان خيرًا له من خادم. البخاري مع الفتح 7/ 71 ومسلم 4/ 2091",
  "virtueAr": ""
 },
 {
  "id": "hm-28-9",
  "cats": [
   "sleep"
  ],
  "ar": "اللَّهُ أَكْبَرُ",
  "en": "Allah is the greatest. (Thirty-four times.)",
  "tr": "",
  "count": 34,
  "ref": "من قال ذلك عندما يأوي إلى فراشه كان خيرًا له من خادم. البخاري مع الفتح 7/ 71 ومسلم 4/ 2091",
  "virtue": "",
  "refAr": "من قال ذلك عندما يأوي إلى فراشه كان خيرًا له من خادم. البخاري مع الفتح 7/ 71 ومسلم 4/ 2091",
  "virtueAr": ""
 },
 {
  "id": "hm-28-10",
  "cats": [
   "sleep"
  ],
  "ar": "اللَّهُمَّ رَبَّ السَّمَوَاتِ السَّبْعِ وَرَبَّ الأَرْضِ، وَرَبَّ العَرْشِ العَظِيمِ، رَبَّنَا وَرَبَّ كُلَّ شَيْءٍ، فَالِقَ الحَبِّ وَالنَّوَى، وَمُنْزِلَ التَّوْرَاةِ وَالِإنْجِيلِ، وَالفُرْقَانِ، أَعُوذُ بِكَ مِنْ شَرِّ كُلِّ شَيْءٍ أَنْتَ آخِذٌ بِنَاصِيَتِهِ، اللَّهُمَّ أَنْتَ الأَوَّلُ فَلَيْسَ قَبْلَكَ شَيْءٌ، وَأَنْتَ الآخِرُ فَلَيْسَ بَعْدَكَ شَيْءٌ، وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَيْءٌ، وَأَنْتَ البَاطِنُ فَلَيْسَ دُونَكَ شَيْءٌ، اقْضِ عَنَّا الدَّيْنَ وَاغْنِنَا مِنَ الفَقْرِ",
  "en": "O Allah, Lord of the seven heavens and the earth, Lord of the Mighty Throne, our Lord and Lord of all things, Splitter of the seed and the date stone, Revealer of the Torah, the Gospel and the Criterion: I take refuge in You from the evil of all things You shall seize by the forelock. O Allah, You are the First so there is nothing before You, and You are the Last so there is nothing after You; You are the Most High so there is nothing above You, and You are the Most Near so there is nothing closer than You. Settle our debt for us and spare us from poverty.",
  "tr": "",
  "count": 1,
  "ref": "مسلم 4/ 2084",
  "virtue": "",
  "refAr": "مسلم 4/ 2084",
  "virtueAr": ""
 },
 {
  "id": "hm-28-11",
  "cats": [
   "sleep"
  ],
  "ar": "الحَمْدُ لِلَّهِ الذِي أَطْعَمَنَا وَسَقَانَا وَكَفَانَا وَآوَانَا فَكَمْ مِمَّنْ لَا كَافِيَ لَهُ وَلَا مُؤْوِي",
  "en": "All praise is for Allah who fed us and gave us drink, and who is sufficient for us and has sheltered us; how many have none to suffice them or shelter them.",
  "tr": "",
  "count": 1,
  "ref": "مسلم 4/ 2085",
  "virtue": "",
  "refAr": "مسلم 4/ 2085",
  "virtueAr": ""
 },
 {
  "id": "hm-28-12",
  "cats": [
   "sleep"
  ],
  "ar": "اللَّهُمَّ عَالِمَ الغَيْبِ وَالشَّهَادَةِ، فَاطِرَ السَّمَوَاتِ وَالأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطَانِ وَشَرَكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا أَوْ أَجُرَّه إِلَى مُسْلِمٍ",
  "en": "O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord and Sovereign of all things: I bear witness that none has the right to be worshipped except You. I take refuge in You from the evil of my soul and from the evil and shirk of the devil, and from committing wrong against my soul or bringing it upon another Muslim.",
  "tr": "",
  "count": 1,
  "ref": "أبو داود 4/ 317 وانظر صحيح سنن التّرمذي 3/ 142",
  "virtue": "",
  "refAr": "أبو داود 4/ 317 وانظر صحيح سنن التّرمذي 3/ 142",
  "virtueAr": ""
 },
 {
  "id": "hm-28-13",
  "cats": [
   "sleep"
  ],
  "ar": "يَقْرَأُ {ألم * تَنْزِيل ...} (سُورَةُ السَّجْدَة)\nوَ{تَبَارَكَ الذِي بِيَدِهِ المُلْكُ ...} (سُورَةُ المُلْكِ)",
  "en": "Recite Surah As-Sajdah and Surah Al-Mulk.",
  "tr": "",
  "count": 1,
  "ref": "التّرمذي والنسائي وانظر صحيح الجامع 4/ 255",
  "virtue": "",
  "refAr": "التّرمذي والنسائي وانظر صحيح الجامع 4/ 255",
  "virtueAr": ""
 },
 {
  "id": "hm-28-14",
  "cats": [
   "sleep"
  ],
  "ar": "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَهْبَةً وَرَغْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الذِي أَنْزَلْتَ وَبِنَبِيِّكَ الذِي أَرْسَلْتَ",
  "en": "O Allah, I submit my soul unto You, and I entrust my affair unto You, and I turn my face towards You, and I totally rely on You, in hope and fear of You. Verily there is no refuge nor safe haven from You except with You. I believe in Your Book which You have revealed and in Your Prophet whom You have sent. (Said after ablution, lying on the right side; if you die that night you die upon the fitrah.)",
  "tr": "",
  "count": 1,
  "ref": "إذا أخذت مضجعك فتوضأ وضوءك للصلاة ثم اضطجع على شقك الأيمن، وقل: ... (الحديث)  قال صلى الله عليه وسلم لمن قال ذلك: فإن متَّ، متَّ على الفطرة البخاري مع الفتح 11/",
  "virtue": "",
  "refAr": "إذا أخذت مضجعك فتوضأ وضوءك للصلاة ثم اضطجع على شقك الأيمن، وقل: ... (الحديث)  قال صلى الله عليه وسلم لمن قال ذلك: فإن متَّ، متَّ على الفطرة البخاري مع الفتح 11/",
  "virtueAr": ""
 }
];
