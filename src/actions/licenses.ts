"use server";

import { db, schema, ensureDatabaseSchema } from "@/db";
import { eq, desc, sql, ilike, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

const CreateLicenseSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(3, "Registration number must be at least 3 characters")
    .max(64, "Registration number cannot exceed 64 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "Only letters, numbers, hyphens, and underscores are allowed"),
  initialCredits: z.coerce.number().int().min(0, "Credits cannot be negative").default(0),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

const AdjustCreditsSchema = z.object({
  licenseId: z.string().min(1, "License ID is required"),
  mode: z.enum(["add", "deduct", "set"]),
  amount: z.coerce.number().int().min(0, "Amount cannot be negative"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(255),
});

export async function getDashboardStats() {
  await requireAdmin();
  await ensureDatabaseSchema();

  const allLicenses = await db.select().from(schema.licenses);

  const totalRegistrations = allLicenses.length;
  const activeRegistrations = allLicenses.filter((l) => l.status === "active").length;
  const disabledRegistrations = allLicenses.filter((l) => l.status === "disabled").length;
  const totalCreditsRemaining = allLicenses.reduce((acc, curr) => acc + curr.creditsRemaining, 0);

  // Total credits ever allocated from positive transactions
  const txRecords = await db.select().from(schema.creditTransactions);
  const totalTransactionsCount = txRecords.length;

  // Recent registrations
  const recentLicenses = await db
    .select()
    .from(schema.licenses)
    .orderBy(desc(schema.licenses.createdAt))
    .limit(5);

  // Recent credit activity
  const recentTransactions = await db
    .select({
      id: schema.creditTransactions.id,
      licenseId: schema.creditTransactions.licenseId,
      adminEmail: schema.creditTransactions.adminEmail,
      previousCredits: schema.creditTransactions.previousCredits,
      newCredits: schema.creditTransactions.newCredits,
      reason: schema.creditTransactions.reason,
      createdAt: schema.creditTransactions.createdAt,
      registrationNumber: schema.licenses.registrationNumber,
    })
    .from(schema.creditTransactions)
    .leftJoin(schema.licenses, eq(schema.creditTransactions.licenseId, schema.licenses.id))
    .orderBy(desc(schema.creditTransactions.createdAt))
    .limit(8);

  return {
    totalRegistrations,
    activeRegistrations,
    disabledRegistrations,
    totalCreditsRemaining,
    totalTransactionsCount,
    recentLicenses,
    recentTransactions,
  };
}

export async function getLicenses(query?: string, statusFilter?: string) {
  await requireAdmin();
  await ensureDatabaseSchema();

  const conditions = [];

  if (query && query.trim()) {
    conditions.push(ilike(schema.licenses.registrationNumber, `%${query.trim()}%`));
  }

  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(schema.licenses.status, statusFilter));
  }

  const result = await db
    .select()
    .from(schema.licenses)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.licenses.createdAt));

  return result;
}

export async function createLicense(formData: {
  registrationNumber: string;
  initialCredits: number;
  notes?: string;
}) {
  const admin = await requireAdmin();
  await ensureDatabaseSchema();

  const parsed = CreateLicenseSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { registrationNumber, initialCredits, notes } = parsed.data;
  const normalizedReg = registrationNumber.toUpperCase();

  // Check unique
  const existing = await db
    .select()
    .from(schema.licenses)
    .where(eq(schema.licenses.registrationNumber, normalizedReg))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: `Registration number "${normalizedReg}" already exists.` };
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(schema.licenses).values({
    id,
    registrationNumber: normalizedReg,
    creditsRemaining: initialCredits,
    status: "active",
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  });

  if (initialCredits > 0) {
    await db.insert(schema.creditTransactions).values({
      id: crypto.randomUUID(),
      licenseId: id,
      adminId: admin.id,
      adminEmail: admin.email,
      previousCredits: 0,
      newCredits: initialCredits,
      reason: `Initial balance allocation: +${initialCredits} credits`,
      createdAt: now,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/licenses");
  return { success: true, licenseId: id };
}

export async function adjustCredits(data: {
  licenseId: string;
  mode: "add" | "deduct" | "set";
  amount: number;
  reason: string;
}) {
  const admin = await requireAdmin();
  await ensureDatabaseSchema();

  const parsed = AdjustCreditsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { licenseId, mode, amount, reason } = parsed.data;

  const licenseRecord = await db
    .select()
    .from(schema.licenses)
    .where(eq(schema.licenses.id, licenseId))
    .limit(1);

  if (licenseRecord.length === 0) {
    return { success: false, error: "License not found" };
  }

  const license = licenseRecord[0];
  const previousCredits = license.creditsRemaining;
  let newCredits = previousCredits;

  if (mode === "add") {
    newCredits = previousCredits + amount;
  } else if (mode === "deduct") {
    newCredits = Math.max(0, previousCredits - amount);
  } else if (mode === "set") {
    newCredits = amount;
  }

  const now = new Date();

  await db
    .update(schema.licenses)
    .set({
      creditsRemaining: newCredits,
      updatedAt: now,
    })
    .where(eq(schema.licenses.id, licenseId));

  await db.insert(schema.creditTransactions).values({
    id: crypto.randomUUID(),
    licenseId,
    adminId: admin.id,
    adminEmail: admin.email,
    previousCredits,
    newCredits,
    reason: `${mode.toUpperCase()} (${reason})`,
    createdAt: now,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/licenses");
  revalidatePath("/dashboard/audit");
  return { success: true, newCredits };
}

export async function toggleLicenseStatus(licenseId: string) {
  await requireAdmin();
  await ensureDatabaseSchema();

  const record = await db
    .select()
    .from(schema.licenses)
    .where(eq(schema.licenses.id, licenseId))
    .limit(1);

  if (record.length === 0) {
    return { success: false, error: "License not found" };
  }

  const currentStatus = record[0].status;
  const newStatus = currentStatus === "active" ? "disabled" : "active";
  const now = new Date();

  await db
    .update(schema.licenses)
    .set({
      status: newStatus,
      updatedAt: now,
    })
    .where(eq(schema.licenses.id, licenseId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/licenses");
  return { success: true, status: newStatus };
}

export async function deleteLicense(licenseId: string) {
  await requireAdmin();
  await ensureDatabaseSchema();

  await db.delete(schema.licenses).where(eq(schema.licenses.id, licenseId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/licenses");
  revalidatePath("/dashboard/audit");
  return { success: true };
}

export async function getLicenseTransactions(licenseId?: string) {
  await requireAdmin();
  await ensureDatabaseSchema();

  const query = db
    .select({
      id: schema.creditTransactions.id,
      licenseId: schema.creditTransactions.licenseId,
      adminId: schema.creditTransactions.adminId,
      adminEmail: schema.creditTransactions.adminEmail,
      previousCredits: schema.creditTransactions.previousCredits,
      newCredits: schema.creditTransactions.newCredits,
      reason: schema.creditTransactions.reason,
      createdAt: schema.creditTransactions.createdAt,
      registrationNumber: schema.licenses.registrationNumber,
    })
    .from(schema.creditTransactions)
    .leftJoin(schema.licenses, eq(schema.creditTransactions.licenseId, schema.licenses.id))
    .orderBy(desc(schema.creditTransactions.createdAt));

  if (licenseId) {
    return await query.where(eq(schema.creditTransactions.licenseId, licenseId));
  }

  return await query.limit(100);
}
