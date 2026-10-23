import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db, schema, ensureDatabaseSchema } from "./index";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function seedDatabase() {
  await ensureDatabaseSchema();

  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@kuro.local";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "KuroAdmin2026!";

  // 1. Check if admin user already exists
  const existingUsers = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, adminEmail))
    .limit(1);

  let adminId: string;

  if (existingUsers.length === 0) {
    adminId = crypto.randomUUID();
    const now = new Date();
    const hashedPassword = await hashPassword(adminPassword);

    await db.insert(schema.user).values({
      id: adminId,
      name: "Super Admin",
      email: adminEmail,
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: adminId, // Better Auth requires accountId === user.id for credentials provider
      providerId: "credential",
      userId: adminId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[SEED] Created default admin account: ${adminEmail}`);
  } else {
    adminId = existingUsers[0].id;
    console.log(`[SEED] Admin account ${adminEmail} already exists.`);
  }

  // 2. Check if licenses exist; if empty, seed initial sample registrations
  const existingLicenses = await db.select().from(schema.licenses).limit(1);
  if (existingLicenses.length === 0) {
    const sampleLicenses = [
      {
        id: crypto.randomUUID(),
        registrationNumber: "KURO-1001",
        creditsRemaining: 42,
        status: "active",
        notes: "Primary EXE Production Client",
      },
      {
        id: crypto.randomUUID(),
        registrationNumber: "KURO-1002",
        creditsRemaining: 150,
        status: "active",
        notes: "Enterprise Compute Cluster",
      },
      {
        id: crypto.randomUUID(),
        registrationNumber: "KURO-1003",
        creditsRemaining: 0,
        status: "active",
        notes: "Exhausted Trial License",
      },
      {
        id: crypto.randomUUID(),
        registrationNumber: "KURO-2049",
        creditsRemaining: 25,
        status: "disabled",
        notes: "Temporarily Suspended License",
      },
    ];

    for (const lic of sampleLicenses) {
      await db.insert(schema.licenses).values(lic);

      // Add initial transaction log
      await db.insert(schema.creditTransactions).values({
        id: crypto.randomUUID(),
        licenseId: lic.id,
        adminId: adminId,
        adminEmail: adminEmail,
        previousCredits: 0,
        newCredits: lic.creditsRemaining,
        reason: `Initial allocation: ${lic.creditsRemaining} credits`,
      });
    }

    console.log(`[SEED] Seeded ${sampleLicenses.length} initial licenses and credit audit logs.`);
  } else {
    console.log("[SEED] Licenses already exist, skipping license seed.");
  }

  return { adminEmail, adminPassword };
}

// Allow standalone execution
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("[SEED] Database seeding complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[SEED ERROR]", err);
      process.exit(1);
    });
}
