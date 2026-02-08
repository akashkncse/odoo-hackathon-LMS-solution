import { db } from "@/lib/db";
import { users, otpCodes } from "@/lib/db/schema";
import { sendOtpEmail } from "@/lib/email";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    // Rate limit: check if an unexpired OTP was sent in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const [recentOtp] = await db
      .select({ id: otpCodes.id })
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, normalizedEmail),
          eq(otpCodes.type, "password_reset"),
          gt(otpCodes.createdAt, oneMinuteAgo)
        )
      );

    if (recentOtp) {
      return NextResponse.json(
        { error: "Please wait at least 60 seconds before requesting a new code." },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await db.insert(otpCodes).values({
      email: normalizedEmail,
      code: otp,
      type: "password_reset",
      expiresAt,
    });

    // Send email
    await sendOtpEmail(normalizedEmail, otp, "password_reset");

    return NextResponse.json({
      message: "If an account with that email exists, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
