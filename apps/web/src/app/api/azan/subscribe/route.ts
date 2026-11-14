import { NextResponse, type NextRequest } from "next/server";

import { deleteSubscription, getSubscription, subscriptionId, upsertFromRequest, vapid } from "@/lib/azan-push";

export const dynamic = "force-dynamic";

/** GET: the VAPID public key the browser needs to subscribe (and whether push is configured). */
export async function GET() {
  const v = await vapid();
  return NextResponse.json({ publicKey: v.publicKey, configured: v.configured });
}

/** POST { subscription, settings, locale }: create or update this browser's azan subscription. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Parameters<typeof upsertFromRequest>[0];
    const sub = await upsertFromRequest(body);
    return NextResponse.json({ ok: true, id: sub.id, prayers: sub.settings.prayers, city: sub.settings.city });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 400 });
  }
}

/** DELETE { endpoint }: stop notifications for this browser. */
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = (await request.json()) as { endpoint?: string };
    if (!endpoint) return NextResponse.json({ ok: false }, { status: 400 });
    const id = subscriptionId(endpoint);
    if (await getSubscription(id)) await deleteSubscription(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
