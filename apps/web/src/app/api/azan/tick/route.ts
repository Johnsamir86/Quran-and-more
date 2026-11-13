import { NextResponse, type NextRequest } from "next/server";

import { cronAuthorized, tick } from "@/lib/azan-push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Called by netlify/functions/azan-tick.mts every 5 minutes (header x-cron-key: CRON_SECRET). */
export async function POST(request: NextRequest) {
  if (!(await cronAuthorized(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await tick(new Date());
  return NextResponse.json({ ok: true, at: new Date().toISOString(), ...summary });
}

export const GET = POST;
