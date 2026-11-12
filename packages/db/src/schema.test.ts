import { sql } from "drizzle-orm";
import { pushSchema } from "drizzle-kit/api";
import { describe, expect, it } from "vitest";

import { createTestDb, schema } from "./index";

describe("schema", () => {
  it("applies to an embedded Postgres and supports the family model", async () => {
    const db = createTestDb();
    const { apply } = await pushSchema(schema, db as never);
    await apply();

    const [account] = await db.insert(schema.accounts).values({ qfSub: "sub_123", displayName: "Parent" }).returning();
    const [family] = await db.insert(schema.families).values({ ownerAccountId: account.id, name: "Samir family" }).returning();
    await db.insert(schema.profiles).values([
      { familyId: family.id, accountId: account.id, role: "parent", displayName: "Parent", gender: "male", ageBand: "18-59" },
      { familyId: family.id, role: "child", displayName: "Child", gender: "female", ageBand: "7-12" },
      { familyId: family.id, role: "senior", displayName: "Grandma", gender: "female", ageBand: "60+" },
    ]);

    const rows = await db.select({ n: sql<number>`count(*)::int` }).from(schema.profiles);
    expect(rows[0].n).toBe(3);
  }, 60_000);
});
