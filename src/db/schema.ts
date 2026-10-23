import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";

// Better Auth: User table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").default("admin"),
  banned: boolean("banned").default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Better Auth: Session table
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
});

// Better Auth: Account table (stores hashed passwords)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Better Auth: Verification table
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Licenses table
export const licenses = pgTable("licenses", {
  id: text("id").primaryKey(),
  registrationNumber: text("registrationNumber").notNull().unique(),
  creditsRemaining: integer("creditsRemaining").notNull().default(0),
  status: text("status").notNull().default("active"), // "active" | "disabled"
  notes: text("notes"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("license_reg_num_idx").on(table.registrationNumber),
  index("license_status_idx").on(table.status),
]);

// Credit Transactions table (Audit Log)
export const creditTransactions = pgTable("creditTransactions", {
  id: text("id").primaryKey(),
  licenseId: text("licenseId").notNull().references(() => licenses.id, { onDelete: "cascade" }),
  adminId: text("adminId"),
  adminEmail: text("adminEmail"),
  previousCredits: integer("previousCredits").notNull(),
  newCredits: integer("newCredits").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("tx_license_id_idx").on(table.licenseId),
  index("tx_created_at_idx").on(table.createdAt),
]);

export type User = typeof user.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
