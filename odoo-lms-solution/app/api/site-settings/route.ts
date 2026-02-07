import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await db.select().from(siteSettings).limit(1);

    if (rows.length === 0) {
      return NextResponse.json({
        settings: {
          platformName: null,
          logoUrl: null,
          heroImageUrl: null,
          featuredImageUrl: null,
          currency: "INR",
        },
      });
    }

    const settings = rows[0];

    return NextResponse.json({
      settings: {
        platformName: settings.platformName,
        logoUrl: settings.logoUrl,
        heroImageUrl: settings.heroImageUrl,
        featuredImageUrl: settings.featuredImageUrl,
        currency: settings.currency || "INR",
      },
    });
  } catch (error) {
    console.error("Get site settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
