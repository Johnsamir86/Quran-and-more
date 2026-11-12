import { NextRequest } from "next/server";

import { loadReaderData, parsePositiveInteger } from "@/lib/data";
import { getSession } from "@/lib/session";
import { withSessionJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chapterId: string }> },
) {
  const { chapterId: chapterIdParam } = await context.params;
  const sessionContext = await getSession(request);
  const chapterId = parsePositiveInteger(chapterIdParam);

  if (!chapterId || chapterId > 114) {
    return withSessionJson(
      sessionContext,
      {
        message: "Chapter id must be a number from 1 to 114.",
        ok: false,
      },
      400,
    );
  }

  const payload = await loadReaderData(sessionContext.session, String(chapterId));

  return withSessionJson(sessionContext, payload);
}
