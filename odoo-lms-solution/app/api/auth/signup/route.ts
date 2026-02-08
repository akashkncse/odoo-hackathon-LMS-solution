import { db } from "@/lib/db";
import { users, otpCodes } from "@/lib/db/schema";
import { hashPassword, createSession } from "@/lib/auth";
import { validatePassword } from "@/lib/validation";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, password, otp } = await request.json();

    if (!name || !email || !password || !otp) {
      return NextResponse.json(
        { error: "Name, email, password, and OTP are required" },
        { status: 400 },
      );
    }

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.errors[0], errors: passwordCheck.errors },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify the OTP was validated
    const [otpRecord] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, normalizedEmail),
          eq(otpCodes.type, "signup"),
          eq(otpCodes.code, otp),
          eq(otpCodes.verified, true),
        ),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or unverified OTP. Please verify your email first." },
        { status: 400 },
      );
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Check if user already exists (race condition guard)
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Create the user
    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        role: "learner",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    // Clean up all signup OTPs for this email
    await db
      .delete(otpCodes)
      .where(
        and(eq(otpCodes.email, normalizedEmail), eq(otpCodes.type, "signup")),
      );

    // Create session and log the user in
    await createSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
