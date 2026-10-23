import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db, schema } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Disable public signup to ensure only authenticated admins or initial seeds exist
  },
  plugins: [
    admin({
      defaultRole: "admin",
      adminRole: "admin",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days session duration
    updateAge: 60 * 60 * 24, // 1 day update window
  },
  secret: process.env.BETTER_AUTH_SECRET || "kuro-manager-super-secure-session-secret-key-32-chars",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

export type Session = typeof auth.$Infer.Session;
