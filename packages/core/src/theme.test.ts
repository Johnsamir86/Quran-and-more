import { describe, expect, it } from "vitest";

import { THEMES, THEME_IDS, contrastRatio, themeCssVars } from "./theme";

describe("themes", () => {
  it("every theme meets WCAG AA for text on background, card, surface and accent", () => {
    for (const id of THEME_IDS) for (const scheme of ["light", "dark"] as const) {
      const t = THEMES[id][scheme];
      const label = `${id}/${scheme}`;
      expect(contrastRatio(t.ink, t.bg), `${label} ink/bg`).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(t.ink, t.card), `${label} ink/card`).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(t.muted, t.card), `${label} muted/card`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.muted, t.bg), `${label} muted/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.onAccent, t.accent), `${label} onAccent/accent`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.accent, t.card), `${label} accent as text on card`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(t.bad, t.card), `${label} bad/card`).toBeGreaterThanOrEqual(3);
    }
  });
  it("exposes css variables with radius", () => {
    const v = themeCssVars("night", "dark");
    expect(v["--bg"]).toBe("#0b1020");
    expect(v["--r-lg"]).toBe("24px");
  });
});
