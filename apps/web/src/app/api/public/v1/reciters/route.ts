import type { NextRequest } from "next/server";

import { filterRecitersForProfile, type Gender } from "@qam/core";

import { listReciters } from "@/lib/player-api";
import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/reciters?profileGender=female  (female reciters are only returned for female profiles) */
export async function GET(request: NextRequest) {
  const g = request.nextUrl.searchParams.get("profileGender");
  const profileGender: Gender = g === "female" ? "female" : g === "male" ? "male" : "unspecified";
  try {
    const reciters = filterRecitersForProfile({ gender: profileGender }, await listReciters());
    return publicJson({ reciters }, { maxAgeSeconds: 86400 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load reciters", 502);
  }
}
