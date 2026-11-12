import { describe, expect, it } from "vitest";

import { activeProfile, familyReducer, initialFamilyState, isBookmarked, notesFor } from "./family-store";

const add = (s = initialFamilyState()) =>
  familyReducer(s, { type: "profile/add", input: { displayName: "Baba", role: "parent", gender: "male", ageBand: "18-59", locale: "ar" } });

describe("family store", () => {
  it("adds a profile and selects it; children get kids mode", () => {
    let s = add();
    expect(activeProfile(s)?.displayName).toBe("Baba");
    s = familyReducer(s, { type: "profile/add", input: { displayName: "Sara", role: "child", gender: "female", ageBand: "7-12", locale: "ar" } });
    const sara = s.profiles[1];
    expect(sara.settings.uiMode).toBe("kids");
    expect(s.activeProfileId).toBe(s.profiles[0].id);
    s = familyReducer(s, { type: "profile/select", id: sara.id });
    expect(activeProfile(s)?.displayName).toBe("Sara");
  });
  it("toggles bookmarks and saves notes per active profile", () => {
    let s = add();
    s = familyReducer(s, { type: "bookmark/toggle", verseKey: "2:255", page: 42 });
    expect(isBookmarked(s, "2:255")).toBe(true);
    s = familyReducer(s, { type: "bookmark/toggle", verseKey: "2:255" });
    expect(isBookmarked(s, "2:255")).toBe(false);
    s = familyReducer(s, { type: "note/save", verseKey: "1:5", body: "  تدبّر  " });
    const pid = s.activeProfileId!;
    expect(notesFor(s, pid)[0].body).toBe("تدبّر");
    s = familyReducer(s, { type: "note/save", verseKey: "1:5", body: "", id: notesFor(s, pid)[0].id });
    expect(notesFor(s, pid)).toHaveLength(0);
  });
  it("tracks daily progress and streaks", () => {
    let s = add();
    s = familyReducer(s, { type: "progress/record", verseKey: "1:1", seconds: 60, day: "2026-11-10" });
    s = familyReducer(s, { type: "progress/record", verseKey: "1:3", seconds: 30, day: "2026-11-10" });
    s = familyReducer(s, { type: "progress/record", verseKey: "1:4", seconds: 10, day: "2026-11-11" });
    const p = s.progress[s.activeProfileId!];
    expect(p.days["2026-11-10"]).toBe(90);
    expect(p.streak).toBe(2);
    s = familyReducer(s, { type: "progress/record", seconds: 10, day: "2026-11-15" });
    expect(s.progress[s.activeProfileId!].streak).toBe(1);
  });
  it("removing a profile removes its data and moves selection", () => {
    let s = add();
    const first = s.activeProfileId!;
    s = familyReducer(s, { type: "bookmark/toggle", verseKey: "2:1" });
    s = familyReducer(s, { type: "profile/add", input: { displayName: "Teta", role: "senior", gender: "female", ageBand: "60+", locale: "ar" } });
    s = familyReducer(s, { type: "profile/remove", id: first });
    expect(s.bookmarks).toHaveLength(0);
    expect(activeProfile(s)?.displayName).toBe("Teta");
    expect(activeProfile(s)?.settings.uiMode).toBe("senior");
  });
});
