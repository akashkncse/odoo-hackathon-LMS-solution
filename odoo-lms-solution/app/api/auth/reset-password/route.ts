import { db } from "@/lib/db";
import { users, otpCodes } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth";
import { validatePassword } from "@/lib/validation";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.errors[0], errors: passwordCheck.errors },
        { status: 400 }
      );
    }

    // Find the most recent verified OTP for this email + password_reset
    const [otpRecord] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email.toLowerCase()),
          eq(otpCodes.type, "password_reset"),
          eq(otpCodes.code, otp),
          eq(otpCodes.verified, true)
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or unverified OTP. Please verify your OTP first." },
        { status: 400 }
      );
    }

    // Check if the OTP has expired (allow a grace window — 15 min after verification)
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find the user
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    // Hash the new password and update
    const passwordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Clean up — delete all OTP records for this email + password_reset
    await db
      .delete(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email.toLowerCase()),
          eq(otpCodes.type, "password_reset")
        )
      );

    return NextResponse.json({
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
