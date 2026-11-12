import { describe, expect, it } from "vitest";

import {
  buildSegments,
  initialPlayerState,
  isLastSegment,
  nextSurahNumber,
  playerReducer,
  stripHtml,
  type PlayerAyah,
  type PlayerSurah,
} from "./player";

const surah = (n: number, hasBismillah = true): PlayerSurah => ({ number: n, arabicName: "س", latinName: "S", verseCount: 3, hasBismillah });
const ayah = (k: string): PlayerAyah => ({ number: Number(k.split(":")[1]), key: k, arabic: `آية ${k}`, translation: `t ${k}`, audioUrl: `https://a/${k}.mp3`, durationMs: 1000 });
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
    s = playerReducer(s, { type: "reciter", reciter: { id: 7, arabicName: "", latinName: "", riwayah: "", style: null, imageUrl: null, gender: "male" } });
    expect(s.panel).toBeNull();
    expect(s.reciter?.id).toBe(7);
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
