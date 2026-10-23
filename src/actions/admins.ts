"use server";

import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

const CreateAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function listAdmins() {
  await requireAdmin();

  const admins = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt));

  return admins;
}

export async function createAdminUser(formData: {
  name: string;
  email: string;
  password: string;
}) {
  await requireAdmin();

  const parsed = CreateAdminSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Check if user already exists
  const existing = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: "A user with this email already exists." };
  }

  const newAdminId = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);
  const now = new Date();

  await db.insert(schema.user).values({
    id: newAdminId,
    name,
    email: normalizedEmail,
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: newAdminId, // Better Auth requires accountId === user.id for credentials provider
    providerId: "credential",
    userId: newAdminId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/dashboard/admins");
  return { success: true };
}

export async function removeAdminUser(adminIdToRemove: string) {
  const currentAdmin = await requireAdmin();

  if (currentAdmin.id === adminIdToRemove) {
    return { success: false, error: "You cannot delete your own admin account." };
  }

  // Ensure there's at least one admin remaining
  const allAdmins = await db.select().from(schema.user);
  if (allAdmins.length <= 1) {
    return { success: false, error: "Cannot delete the last remaining administrator." };
  }

  await db.delete(schema.user).where(eq(schema.user.id, adminIdToRemove));

  revalidatePath("/dashboard/admins");
  return { success: true };
}
