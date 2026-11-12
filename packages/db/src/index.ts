import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { neon } from "@neondatabase/serverless";

import * as schema from "./schema";

export * from "./schema";
export { schema };

export type Db = ReturnType<typeof drizzleNeon<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

let cached: Db | null = null;

/**
 * Picks the driver from DATABASE_URL:
 *  - postgres:// or postgresql://  -> Neon serverless HTTP (production, Netlify DB)
 *  - pglite://<dir> or unset       -> embedded PGlite (local dev and tests)
 */
export const getDb = (): Db => {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    cached = drizzleNeon(neon(url), { schema });
  } else {
    const dir = url?.startsWith("pglite://") ? url.slice("pglite://".length) : undefined;
    cached = drizzlePglite(dir ?? "memory://", { schema });
  }
  return cached;
};

/** Fresh in-memory database for tests. */
export const createTestDb = () => drizzlePglite("memory://", { schema });
