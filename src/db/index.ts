import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

import path from "path";

const databaseUrl = process.env.DATABASE_URL?.trim();

// Global singletons for development hot reload prevention
declare global {
  // eslint-disable-next-line no-var
  var __kuroDb: NeonHttpDatabase<typeof schema> | PgliteDatabase<typeof schema> | undefined;
  // eslint-disable-next-line no-var
  var __kuroPglite: PGlite | undefined;
}

let db: NeonHttpDatabase<typeof schema> | PgliteDatabase<typeof schema>;

if (databaseUrl && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
  if (!globalThis.__kuroDb) {
    const client = neon(databaseUrl);
    globalThis.__kuroDb = drizzleNeon(client, { schema });
  }
  db = globalThis.__kuroDb;
} else {
  // Offline / local development mode with embedded PostgreSQL (PGlite)
  if (!globalThis.__kuroDb) {
    const pglitePath = path.resolve(process.cwd(), ".pgdata");
    const pglite = new PGlite(pglitePath);
    globalThis.__kuroPglite = pglite;
    globalThis.__kuroDb = drizzlePglite(pglite, { schema });
  }
  db = globalThis.__kuroDb;
}

export { db, schema };

export const INIT_SQL = `
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "role" text DEFAULT 'admin',
  "banned" boolean DEFAULT false,
  "banReason" text,
  "banExpires" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "impersonatedBy" text
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "licenses" (
  "id" text PRIMARY KEY,
  "registrationNumber" text NOT NULL UNIQUE,
  "creditsRemaining" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'active',
  "notes" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "creditTransactions" (
  "id" text PRIMARY KEY,
  "licenseId" text NOT NULL REFERENCES "licenses"("id") ON DELETE CASCADE,
  "adminId" text,
  "adminEmail" text,
  "previousCredits" integer NOT NULL,
  "newCredits" integer NOT NULL,
  "reason" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "license_reg_num_idx" ON "licenses" ("registrationNumber");
CREATE INDEX IF NOT EXISTS "license_status_idx" ON "licenses" ("status");
CREATE INDEX IF NOT EXISTS "tx_license_id_idx" ON "creditTransactions" ("licenseId");
CREATE INDEX IF NOT EXISTS "tx_created_at_idx" ON "creditTransactions" ("createdAt");
`;

let schemaInitialized = false;

export async function ensureDatabaseSchema() {
  if (schemaInitialized) return;

  try {
    if (globalThis.__kuroPglite) {
      await globalThis.__kuroPglite.exec(INIT_SQL);
    } else {
      await db.execute(sql.raw(INIT_SQL));
    }
    schemaInitialized = true;
  } catch (error) {
    console.error("Failed to auto-ensure database schema:", error);
  }
}
