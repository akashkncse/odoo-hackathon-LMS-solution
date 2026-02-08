import { db } from "@/lib/db";
import { otpCodes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const { email, code, type } = await request.json();

    if (!email || !code || !type) {
      return NextResponse.json(
        { error: "Email, code, and type are required" },
        { status: 400 }
      );
    }

    if (!["signup", "password_reset"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid OTP type" },
        { status: 400 }
      );
    }

    // Find the most recent OTP for this email and type
    const [otpRecord] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email.toLowerCase()),
          eq(otpCodes.type, type),
          eq(otpCodes.verified, false)
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new code." },
        { status: 404 }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new code." },
        { status: 410 }
      );
    }

    // Increment attempt count
    await db
      .update(otpCodes)
      .set({ attempts: otpRecord.attempts + 1 })
      .where(eq(otpCodes.id, otpRecord.id));

    // Verify the code
    if (otpRecord.code !== code.trim()) {
      const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return NextResponse.json(
        {
          error:
            remainingAttempts > 0
              ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
              : "Too many failed attempts. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await db
      .update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, otpRecord.id));

    return NextResponse.json({
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
