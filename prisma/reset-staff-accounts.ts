/**
 * Creates or resets the two staff accounts used to administer the portal.
 * Required variables: DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD,
 * MANAGEMENT_EMAIL, MANAGEMENT_PASSWORD.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const required = ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "MANAGEMENT_EMAIL", "MANAGEMENT_PASSWORD"] as const;
for (const key of required) {
  if (!process.env[key]?.trim()) throw new Error(`${key} must be set before resetting staff accounts.`);
}

const adminEmail = process.env.ADMIN_EMAIL!.trim().toLowerCase();
const managementEmail = process.env.MANAGEMENT_EMAIL!.trim().toLowerCase();
if (adminEmail === managementEmail) throw new Error("ADMIN_EMAIL and MANAGEMENT_EMAIL must be different accounts.");

const db = new PrismaClient();

async function main() {
  const [adminPasswordHash, managementPasswordHash] = await Promise.all([
    bcrypt.hash(process.env.ADMIN_PASSWORD!, 12),
    bcrypt.hash(process.env.MANAGEMENT_PASSWORD!, 12),
  ]);
  await db.$transaction([
    db.user.upsert({
      where: { email: adminEmail },
      update: { name: "Administrator", passwordHash: adminPasswordHash, role: "ADMIN", status: "ACTIVE" },
      create: { name: "Administrator", email: adminEmail, passwordHash: adminPasswordHash, role: "ADMIN", status: "ACTIVE" },
    }),
    db.user.upsert({
      where: { email: managementEmail },
      update: { name: "Management", passwordHash: managementPasswordHash, role: "MANAGEMENT", status: "ACTIVE" },
      create: { name: "Management", email: managementEmail, passwordHash: managementPasswordHash, role: "MANAGEMENT", status: "ACTIVE" },
    }),
  ]);
  console.log("Admin and management accounts are active and their passwords were reset.");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
