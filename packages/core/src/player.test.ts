import { describe, expect, it } from "vitest";

import {
  DEFAULT_REPEAT,
  buildSegments,
  chooseEngine,
  decideAtSegmentEnd,
  locateInChapter,
  normaliseTimestamps,
  initialPlayerState,
  isLastSegment,
  nextSurahNumber,
  playerReducer,
  splitUthmaniWords,
  stripHtml,
  type PlayerAyah,
  type PlayerSurah,
} from "./player";

const surah = (n: number, hasBismillah = true): PlayerSurah => ({ number: n, arabicName: "س", latinName: "S", verseCount: 3, hasBismillah });
const ayah = (k: string): PlayerAyah => ({ number: Number(k.split(":")[1]), key: k, arabic: `آية ${k}`, translation: `t ${k}`, words: [{ position: 1, text: "آية" }], audioUrl: `https://a/${k}.mp3`, durationMs: 1000, ayahWordTimings: [[1, 0, 900]] });
const basmala = ayah("1:1");

describe("buildSegments", () => {
  it("prepends Basmala for ordinary surahs", () => {
    const s = buildSegments(surah(2), [ayah("2:1"), ayah("2:2")], basmala);
    expect(s.map((x) => x.key)).toEqual(["basmala", "2:1", "2:2"]);
    expect(s[0].ayah).toBeNull();
  });
  it("does not prepend Basmala for Al-Fatihah or At-Tawbah", () => {
    expect(buildSegments(surah(1), [ayah("1:1")], basmala)[0].key).toBe("1:1");
    expect(buildSegments(surah(9, false), [ayah("9:1")], basmala)[0].key).toBe("9:1");
  });
});

describe("playerReducer", () => {
  it("opens, loads, seeks and clamps", () => {
    let s = playerReducer(initialPlayerState(), { type: "open", surah: surah(2), play: true });
    expect(s.status).toBe("loading");
    s = playerReducer(s, { type: "loaded", segments: buildSegments(surah(2), [ayah("2:1"), ayah("2:2")], basmala) });
    expect(s.status).toBe("ready");
    expect(s.resume).toEqual({ surahNumber: 2, segment: 0 });
    s = playerReducer(s, { type: "seek", index: 99 });
    expect(s.index).toBe(2);
    expect(isLastSegment(s)).toBe(true);
    s = playerReducer(s, { type: "prev" });
    expect(s.index).toBe(1);
  });
  it("keeps index when reciter changes and closes the panel", () => {
    let s = playerReducer(initialPlayerState(), { type: "panel", panel: "reciter" });
    expect(s.panel).toBe("reciter");
    s = playerReducer(s, { type: "reciter", reciter: { id: "c7", chapterReciterId: 7, recitationId: 7, arabicName: "", latinName: "", riwayah: "", style: null, imageUrl: null, gender: "male" } });
    expect(s.panel).toBeNull();
    expect(s.reciter?.id).toBe("c7");
  });
  it("ended stops playback and toggle restarts", () => {
    let s = playerReducer(initialPlayerState({ isPlaying: true, status: "ready" }), { type: "ended" });
    expect(s.isPlaying).toBe(false);
    expect(s.status).toBe("ended");
    s = playerReducer(s, { type: "toggle" });
    expect(s.isPlaying).toBe(true);
    expect(s.status).toBe("ready");
  });
});

describe("helpers", () => {
  it("wraps surah numbers", () => {
    expect(nextSurahNumber(114)).toBe(1);
    expect(nextSurahNumber(3)).toBe(4);
  });
  it("strips html and footnotes", () => {
    expect(stripHtml("<p>Praise<sup foot_note=1>1</sup> be&nbsp;to God</p>")).toBe("Praise be to God");
    expect(stripHtml("<h2>Title</h2><p>Body text</p>")).toBe("Title\nBody text");
  });
});


describe("gapless timeline", () => {
  const ts = normaliseTimestamps([
    { verse_key: "2:1", timestamp_from: 5000, timestamp_to: 8000, segments: [[1, 5000, 6000], [1], [2, 6000, 8000]] },
    { verse_key: "2:2", timestamp_from: 8000, timestamp_to: 12000, segments: [[1, 8000, 12000]] },
  ]);
  const segs = buildSegments(surah(2), [ayah("2:1"), ayah("2:2")], basmala, ts);
  it("drops malformed word entries and maps the Basmala before the first ayah", () => {
    expect(ts[0].words).toEqual([[1, 5000, 6000], [2, 6000, 8000]]);
    expect(segs[0].key).toBe("basmala");
    expect(segs[0].fromMs).toBe(0);
    expect(segs[0].toMs).toBe(5000);
  });
  it("gives the Basmala a zero-length range when timestamps start at 0", () => {
    const ts0 = normaliseTimestamps([{ verse_key: "2:1", timestamp_from: 0, timestamp_to: 7000, segments: [[1, 0, 7000]] }]);
    const s0 = buildSegments(surah(2), [ayah("2:1")], basmala, ts0);
    expect(s0[0].key).toBe("basmala");
    expect([s0[0].fromMs, s0[0].toMs]).toEqual([0, 0]);
    expect(locateInChapter(s0, 100).index).toBe(1);
  });
  it("locates segment and word by time", () => {
    expect(locateInChapter(segs, 1000)).toEqual({ index: 0, wordPosition: null });
    expect(locateInChapter(segs, 6500)).toEqual({ index: 1, wordPosition: 2 });
    expect(locateInChapter(segs, 9000)).toEqual({ index: 2, wordPosition: 1 });
    expect(locateInChapter(segs, 20000).index).toBe(2);
  });
  it("chooses the gapless engine when timestamps exist", () => {
    expect(chooseEngine({ url: "u", durationMs: 1, hasTimestamps: true }, segs)).toBe("gapless");
    expect(chooseEngine({ url: "u", durationMs: 1, hasTimestamps: false }, segs)).toBe("ayah");
  });
});

describe("repeat decisions", () => {
  const base = () => {
    let s = playerReducer(initialPlayerState(), { type: "open", surah: surah(2) });
    s = playerReducer(s, { type: "loaded", segments: buildSegments(surah(2), [ayah("2:1"), ayah("2:2"), ayah("2:3")], basmala) });
    return s;
  };
  it("repeats an ayah N times then continues", () => {
    let s = playerReducer(base(), { type: "repeat", settings: { mode: "ayah", count: 2 } });
    s = playerReducer(s, { type: "seek", index: 1 });
    expect(decideAtSegmentEnd(s)).toEqual({ action: "replay" });
    s = playerReducer(s, { type: "repeatConsumed" });
    expect(decideAtSegmentEnd(s)).toEqual({ action: "seek", index: 2 });
  });
  it("loops a range", () => {
    let s = playerReducer(base(), { type: "repeat", settings: { mode: "range", from: 1, to: 2, count: Infinity } });
    s = playerReducer(s, { type: "seek", index: 2 });
    expect(decideAtSegmentEnd(s)).toEqual({ action: "seek", index: 1 });
  });
  it("ends the surah with repeat off and loops with repeat surah", () => {
    let s = playerReducer(base(), { type: "seek", index: 3 });
    expect(decideAtSegmentEnd(s)).toEqual({ action: "ended" });
    s = playerReducer(s, { type: "repeat", settings: { ...DEFAULT_REPEAT, mode: "surah", count: Infinity } });
    expect(decideAtSegmentEnd(s)).toEqual({ action: "seek", index: 0 });
  });
});

describe("splitUthmaniWords", () => {
  it("merges standalone waqf signs into the previous word", () => {
    const words = splitUthmaniWords("ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ");
    expect(words.map((w) => w.text)).toEqual(["ذَٰلِكَ", "ٱلْكِتَـٰبُ", "لَا", "رَيْبَ ۛ", "فِيهِ ۛ", "هُدًى", "لِّلْمُتَّقِينَ"]);
    expect(words[6].position).toBe(7);
  });
  it("handles single-word and padded text", () => {
    expect(splitUthmaniWords("  الٓمٓ ")).toEqual([{ position: 1, text: "الٓمٓ" }]);
  });
});

describe("mushaf lines", () => {
  it("labels header and basmala lines above a surah's first line", async () => {
    const { buildMushafLines, MUSHAF_LAYOUTS } = await import("./mushaf");
    const layout = MUSHAF_LAYOUTS[0];
    const verses = [
      { verseKey: "2:1", words: [{ position: 1, lineNumber: 3, glyph: "ﱁ", text: "الٓمٓ" }, { position: 2, charTypeName: "end", lineNumber: 3, glyph: "ﱂ", text: "١" }] },
      { verseKey: "2:2", words: [{ position: 1, lineNumber: 4, glyph: "ﱃ", text: "ذَٰلِكَ" }] },
    ];
    const lines = buildMushafLines(layout, verses, new Map([["2:1", { number: 2, hasBasmala: true }]]));
    expect(lines).toHaveLength(15);
    expect(lines[0].kind).toBe("surah-header");
    expect(lines[1].kind).toBe("basmala");
    expect(lines[2].words.map((w) => w.glyph)).toEqual(["ﱁ", "ﱂ"]);
    expect(lines[2].words[1].isEndMarker).toBe(true);
  });
});

describe("wallpapers", () => {
  it("maps every surah to a wallpaper deterministically per family", async () => {
    const { wallpaperForSurah, themeForSurah } = await import("./wallpapers");
    expect(themeForSurah(55)).toBe("sea");
    expect(wallpaperForSurah(55, "nature").theme).toBe("sea");
    expect(wallpaperForSurah(67, "live").theme).toBe("stars");
    for (let s = 1; s <= 114; s += 1) expect(wallpaperForSurah(s, "art").id).toBeTruthy();
    expect(wallpaperForSurah(18, "nature")).toEqual(wallpaperForSurah(18, "nature"));
  });
});
