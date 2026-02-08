import { db } from "@/lib/db";
import { users, otpCodes } from "@/lib/db/schema";
import { sendOtpEmail } from "@/lib/email";
import { validatePassword } from "@/lib/validation";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, type, name, password } = body;

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email and type are required" },
        { status: 400 }
      );
    }

    if (type !== "signup" && type !== "password_reset") {
      return NextResponse.json(
        { error: "Invalid OTP type. Must be 'signup' or 'password_reset'." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // For signup: validate required fields and check if user already exists
    if (type === "signup") {
      if (!name || !password) {
        return NextResponse.json(
          { error: "Name and password are required for signup" },
          { status: 400 }
        );
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: passwordValidation.errors.join(" ") },
          { status: 400 }
        );
      }

      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail));

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
    }

    // For password reset: ensure user exists
    if (type === "password_reset") {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail));

      if (!existingUser) {
        // Return success even if user doesn't exist to prevent email enumeration
        return NextResponse.json({
          message: "If the email is registered, an OTP has been sent.",
        });
      }
    }

    // Rate limiting: check if an OTP was sent within the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const [recentOtp] = await db
      .select({ id: otpCodes.id })
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, normalizedEmail),
          eq(otpCodes.type, type),
          gt(otpCodes.createdAt, oneMinuteAgo)
        )
      );

    if (recentOtp) {
      return NextResponse.json(
        { error: "Please wait at least 60 seconds before requesting a new OTP." },
        { status: 429 }
      );
    }

    // Generate OTP and store it
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(otpCodes).values({
      email: normalizedEmail,
      code: otp,
      type,
      expiresAt,
    });

    // Send the OTP email
    await sendOtpEmail(normalizedEmail, otp, type);

    return NextResponse.json({
      message: "OTP sent successfully. Please check your email.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
