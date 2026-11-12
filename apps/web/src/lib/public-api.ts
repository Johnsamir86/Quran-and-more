import "server-only";

import { NextResponse } from "next/server";

import { isLocaleCode } from "@qam/core";
import { getQfServerClient } from "@qam/core/server";

/**
 * Public API v1 (for integrations such as VOD platforms).
 *
 * Quran content endpoints are open and cached. Endpoints that touch family
 * or profile data will require an API key (see packages/db apiKeys).
 */
export const PUBLIC_API_VERSION = "1";

export const publicJson = (body: unknown, init?: { status?: number; maxAgeSeconds?: number }) =>
  NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      "x-api-version": PUBLIC_API_VERSION,
      "access-control-allow-origin": "*",
      "cache-control": `public, s-maxage=${init?.maxAgeSeconds ?? 3600}, stale-while-revalidate=86400`,
    },
  });

export const publicError = (message: string, status = 400) =>
  publicJson({ error: { message, status } }, { status, maxAgeSeconds: 0 });

export const parseLanguage = (value: string | null): string =>
  value && isLocaleCode(value) ? value : "en";

/** App-level content client (client credentials). No user session involved. */
export const getContentClient = async () => getQfServerClient();
