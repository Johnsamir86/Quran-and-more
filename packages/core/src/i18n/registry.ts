import type { PartialMessages } from "./en";
import { am } from "./am";
import { az } from "./az";
import { bg } from "./bg";
import { bn } from "./bn";
import { bs } from "./bs";
import { cs } from "./cs";
import { de } from "./de";
import { es } from "./es";
import { fa } from "./fa";
import { fi } from "./fi";
import { fr } from "./fr";
import { gu } from "./gu";
import { ha } from "./ha";
import { he } from "./he";
import { hi } from "./hi";
import { id } from "./id";
import { it } from "./it";
import { ja } from "./ja";
import { kk } from "./kk";
import { kn } from "./kn";
import { ko } from "./ko";
import { ku } from "./ku";
import { ml } from "./ml";
import { mr } from "./mr";
import { ms } from "./ms";
import { ne } from "./ne";
import { nl } from "./nl";
import { no } from "./no";
import { pl } from "./pl";
import { ps } from "./ps";
import { pt } from "./pt";
import { ro } from "./ro";
import { ru } from "./ru";
import { si } from "./si";
import { so } from "./so";
import { sq } from "./sq";
import { sv } from "./sv";
import { sw } from "./sw";
import { ta } from "./ta";
import { te } from "./te";
import { th } from "./th";
import { tl } from "./tl";
import { tr } from "./tr";
import { uk } from "./uk";
import { ur } from "./ur";
import { uz } from "./uz";
import { vi } from "./vi";
import { yo } from "./yo";
import { zh } from "./zh";
import { as, bm, ce, dv, km, lg, mrw, om, rw, sd, tg, tt, ug, yuw, zgh } from "./small";

/**
 * UI dictionaries by locale code. Arabic lives in ./ar.ts; English is the base.
 * Full dictionaries: 49 languages. Core-only (navigation, common actions, prayer
 * names; the rest in English): tg tt km sd ug om rw lg bm ce as dv zgh mrw yuw.
 * Dari reuses the Persian dictionary.
 */
export const EXTRA_DICTIONARIES: Record<string, PartialMessages> = {
  am, az, bg, bn, bs, cs, de, es, fa, prs: fa, fi, fr, gu, ha, he, hi, id, it, ja, kk, kn, ko, ku, ml, mr, ms, ne, nl, no, pl, ps, pt, ro, ru, si, so, sq, sv, sw, ta, te, th, tl, tr, uk, ur, uz, vi, yo, zh,
  tg, tt, km, sd, ug, om, rw, lg, bm, ce, as, dv, zgh, mrw, yuw,
};
