import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema, ensureDatabaseSchema } from "@/db";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

const AuthorizeRequestSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number cannot be empty")
    .max(100),
  consumeCredits: z.number().int().min(0).optional().default(0),
  reason: z.string().max(255).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();

    // 1. IP & Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = checkRateLimit(`auth:${ip}`, 100, 2); // 100 max bucket, 2 tokens/sec
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          authorized: false,
          message: "Rate limit exceeded. Please slow down your requests.",
        },
        { status: 429 }
      );
    }

    // 2. Optional Server-Configured Client API Key Security
    const configuredApiKey = process.env.KURO_CLIENT_API_KEY?.trim();
    if (configuredApiKey) {
      const clientApiKey = req.headers.get("x-kuro-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
      if (clientApiKey !== configuredApiKey) {
        return NextResponse.json(
          {
            authorized: false,
            message: "Unauthorized: Invalid or missing client API key",
          },
          { status: 401 }
        );
      }
    }

    // 3. Parse & Validate Payload
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          authorized: false,
          message: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

    const parseResult = AuthorizeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json(
        {
          authorized: false,
          message: `Validation error: ${issues}`,
        },
        { status: 400 }
      );
    }

    const { registrationNumber, consumeCredits, reason } = parseResult.data;

    // 4. Query Registration from Database
    const records = await db
      .select()
      .from(schema.licenses)
      .where(eq(schema.licenses.registrationNumber, registrationNumber))
      .limit(1);

    if (records.length === 0) {
      return NextResponse.json(
        {
          authorized: false,
          message: "Registration not found",
        },
        { status: 404 }
      );
    }

    const license = records[0];

    // 5. Check if License is Active
    if (license.status !== "active") {
      return NextResponse.json(
        {
          authorized: false,
          message: "Registration is disabled",
          status: license.status,
        },
        { status: 403 }
      );
    }

    // 6. Handle Credit Deduction if Requested
    if (consumeCredits > 0) {
      if (license.creditsRemaining < consumeCredits) {
        return NextResponse.json(
          {
            authorized: false,
            creditsRemaining: license.creditsRemaining,
            message: `Insufficient credits. Required: ${consumeCredits}, Remaining: ${license.creditsRemaining}`,
          },
          { status: 402 }
        );
      }

      const previousCredits = license.creditsRemaining;
      const newCredits = previousCredits - consumeCredits;
      const now = new Date();

      // Update balance & record audit log (compatible with Neon HTTP serverless)
      await db
        .update(schema.licenses)
        .set({
          creditsRemaining: newCredits,
          updatedAt: now,
        })
        .where(eq(schema.licenses.id, license.id));

      await db.insert(schema.creditTransactions).values({
        id: crypto.randomUUID(),
        licenseId: license.id,
        adminId: null,
        adminEmail: "EXE Client",
        previousCredits,
        newCredits,
        reason: reason || `EXE Client consumed ${consumeCredits} credit(s)`,
        createdAt: now,
      });

      return NextResponse.json({
        authorized: true,
        creditsRemaining: newCredits,
      });
    }

    // 7. Standard Authorization Query Success
    return NextResponse.json({
      authorized: true,
      creditsRemaining: license.creditsRemaining,
    });
  } catch (error) {
    console.error("[API/AUTHORIZE ERROR]", error);
    return NextResponse.json(
      {
        authorized: false,
        message: "Internal server error during authorization",
      },
      { status: 500 }
    );
  }
}
