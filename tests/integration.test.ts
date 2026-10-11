// Database integration tests.
// These only run when RUN_DB_TESTS=1 is set and a database is reachable.
// They create real rows, assert real database constraints, and clean up after
// themselves in a finally block.

import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDb = process.env.RUN_DB_TESTS === "1";
const d = runDb ? describe : describe.skip;

d("database integration", () => {
  let client: PrismaClient | undefined;
  const db = (): PrismaClient => {
    if (!client) throw new Error("Database client not initialised");
    return client;
  };

  beforeAll(async () => {
    if (!runDb) return;
    const module = await import("../lib/db");
    client = module.db;
    await client.$connect();
  });

  afterAll(async () => {
    if (client) {
      await client.$disconnect();
    }
  });

  it("creates a user and deletes it", async () => {
    const email = `integration-${Date.now()}@aimt.edu`;
    let userId: string | undefined;
    try {
      const user = await db().user.create({
        data: {
          name: "Integration Test User",
          email,
          passwordHash: "not-a-real-hash",
          role: "STUDENT",
        },
      });
      userId = user.id;
      expect(user.email).toBe(email);
      const found = await db().user.findUnique({ where: { email } });
      expect(found?.id).toBe(user.id);
    } finally {
      if (userId) {
        await db().user.delete({ where: { id: userId } });
      }
    }
  });

  it("rejects a duplicate email (unique constraint)", async () => {
    const email = `unique-${Date.now()}@aimt.edu`;
    let userId: string | undefined;
    try {
      const user = await db().user.create({
        data: {
          name: "Unique Email User",
          email,
          passwordHash: "not-a-real-hash",
          role: "STUDENT",
        },
      });
      userId = user.id;
      await expect(
        db().user.create({
          data: {
            name: "Duplicate Email User",
            email,
            passwordHash: "not-a-real-hash",
            role: "STUDENT",
          },
        }),
      ).rejects.toThrow();
    } finally {
      if (userId) {
        await db().user.delete({ where: { id: userId } });
      }
    }
  });

  it("rejects a duplicate session tokenHash (unique constraint)", async () => {
    const email = `session-${Date.now()}@aimt.edu`;
    const { sha256Hex, generateOpaqueToken } = await import("../lib/tokens");
    let userId: string | undefined;
    try {
      const user = await db().user.create({
        data: {
          name: "Session Test User",
          email,
          passwordHash: "not-a-real-hash",
          role: "STUDENT",
        },
      });
      userId = user.id;
      const tokenHash = sha256Hex(generateOpaqueToken());
      await db().session.create({
        data: { tokenHash, userId, expiresAt: new Date(Date.now() + 60_000) },
      });
      await expect(
        db().session.create({
          data: { tokenHash, userId, expiresAt: new Date(Date.now() + 60_000) },
        }),
      ).rejects.toThrow();
    } finally {
      if (userId) {
        await db().user.delete({ where: { id: userId } });
      }
    }
  });
});
