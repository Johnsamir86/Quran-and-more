import { createServerClient } from "@quranjs/api/server";

import { resolveQfEnvironment } from "./env";

export interface QfServerOptions {
  clientId: string;
  clientSecret: string;
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
}

/**
 * App-level (client credentials) client. SERVER ONLY. Never import this from
 * browser or mobile code; the client secret must not leave the backend.
 */
export const createQfServerClient = (options: QfServerOptions) => {
  const { oauth2BaseUrl, gatewayUrl } = resolveQfEnvironment(options.env ?? process.env);
  return createServerClient({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    contentScopeMode: "granular",
    fetch: options.fetch,
    services: { gatewayUrl, oauth2BaseUrl },
  });
};

export type QfServerClient = ReturnType<typeof createQfServerClient>;

let cached: QfServerClient | null = null;

/** Process-wide singleton so the access token cache is shared. */
export const getQfServerClient = (): QfServerClient => {
  if (cached) return cached;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("CLIENT_ID and CLIENT_SECRET are required for the Quran Foundation server client.");
  }
  cached = createQfServerClient({ clientId, clientSecret });
  return cached;
};
