import { NextResponse, type NextRequest } from "next/server";

import { buildPayload, getSubscription, sendPush, subscriptionId } from "@/lib/azan-push";

export const dynamic = "force-dynamic";

/** POST { endpoint }: send a test azan notification to this browser's own subscription. */
export async function POST(request: NextRequest) {
  try {
    const { endpoint } = (await request.json()) as { endpoint?: string };
    const sub = endpoint ? await getSubscription(subscriptionId(endpoint)) : null;
    if (!sub) return NextResponse.json({ ok: false, error: "not subscribed" }, { status: 404 });
    const result = await sendPush(sub, buildPayload(sub, "dhuhr", new Date(), true));
    return NextResponse.json({ ok: result === "sent", result });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
