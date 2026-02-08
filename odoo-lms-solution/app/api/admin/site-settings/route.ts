import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db.select().from(siteSettings).limit(1);

    if (rows.length === 0) {
      return NextResponse.json({
        settings: {
          id: null,
          platformName: null,
          logoUrl: null,
          heroImageUrl: null,
          featuredImageUrl: null,
          currency: "INR",
          footerTagline: null,
          footerLinks: null,
          testimonials: null,
          faqs: null,
        },
      });
    }

    return NextResponse.json({ settings: rows[0] });
  } catch (error) {
    console.error("Get site settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      platformName,
      logoUrl,
      heroImageUrl,
      featuredImageUrl,
      currency,
      footerTagline,
      footerLinks,
      testimonials,
      faqs,
    } = body;

    const updates: Record<string, unknown> = {};

    if (platformName !== undefined) {
      if (platformName !== null && typeof platformName !== "string") {
        return NextResponse.json(
          { error: "platformName must be a string or null" },
          { status: 400 },
        );
      }
      if (typeof platformName === "string" && platformName.length > 100) {
        return NextResponse.json(
          { error: "platformName must be 100 characters or less" },
          { status: 400 },
        );
      }
      updates.platformName = platformName?.trim() || null;
    }

    if (logoUrl !== undefined) {
      if (logoUrl !== null && typeof logoUrl !== "string") {
        return NextResponse.json(
          { error: "logoUrl must be a string or null" },
          { status: 400 },
        );
      }
      if (typeof logoUrl === "string" && logoUrl.length > 500) {
        return NextResponse.json(
          { error: "logoUrl must be 500 characters or less" },
          { status: 400 },
        );
      }
      updates.logoUrl = logoUrl || null;
    }

    if (heroImageUrl !== undefined) {
      if (heroImageUrl !== null && typeof heroImageUrl !== "string") {
        return NextResponse.json(
          { error: "heroImageUrl must be a string or null" },
          { status: 400 },
        );
      }
      if (typeof heroImageUrl === "string" && heroImageUrl.length > 500) {
        return NextResponse.json(
          { error: "heroImageUrl must be 500 characters or less" },
          { status: 400 },
        );
      }
      updates.heroImageUrl = heroImageUrl || null;
    }

    if (featuredImageUrl !== undefined) {
      if (featuredImageUrl !== null && typeof featuredImageUrl !== "string") {
        return NextResponse.json(
          { error: "featuredImageUrl must be a string or null" },
          { status: 400 },
        );
      }
      if (
        typeof featuredImageUrl === "string" &&
        featuredImageUrl.length > 500
      ) {
        return NextResponse.json(
          { error: "featuredImageUrl must be 500 characters or less" },
          { status: 400 },
        );
      }
      updates.featuredImageUrl = featuredImageUrl || null;
    }

    if (currency !== undefined) {
      if (currency !== null && typeof currency !== "string") {
        return NextResponse.json(
          { error: "currency must be a string or null" },
          { status: 400 },
        );
      }
      if (typeof currency === "string" && currency.length > 10) {
        return NextResponse.json(
          { error: "currency must be 10 characters or less" },
          { status: 400 },
        );
      }
      updates.currency = currency?.trim().toUpperCase() || "INR";
    }

    // Footer tagline
    if (footerTagline !== undefined) {
      if (footerTagline !== null && typeof footerTagline !== "string") {
        return NextResponse.json(
          { error: "footerTagline must be a string or null" },
          { status: 400 },
        );
      }
      if (typeof footerTagline === "string" && footerTagline.length > 500) {
        return NextResponse.json(
          { error: "footerTagline must be 500 characters or less" },
          { status: 400 },
        );
      }
      updates.footerTagline = footerTagline?.trim() || null;
    }

    // Footer links (JSON array)
    if (footerLinks !== undefined) {
      if (footerLinks !== null) {
        if (typeof footerLinks !== "object") {
          return NextResponse.json(
            { error: "footerLinks must be an object or null" },
            { status: 400 },
          );
        }
        // Validate structure: { platform: [{label, href}], resources: [{label, href}] }
        const { platform, resources } = footerLinks as {
          platform?: { label: string; href: string }[];
          resources?: { label: string; href: string }[];
        };
        if (platform && !Array.isArray(platform)) {
          return NextResponse.json(
            { error: "footerLinks.platform must be an array" },
            { status: 400 },
          );
        }
        if (resources && !Array.isArray(resources)) {
          return NextResponse.json(
            { error: "footerLinks.resources must be an array" },
            { status: 400 },
          );
        }
      }
      updates.footerLinks = footerLinks;
    }

    // Testimonials (JSON array)
    if (testimonials !== undefined) {
      if (testimonials !== null) {
        if (!Array.isArray(testimonials)) {
          return NextResponse.json(
            { error: "testimonials must be an array or null" },
            { status: 400 },
          );
        }
        if (testimonials.length > 20) {
          return NextResponse.json(
            { error: "Maximum 20 testimonials allowed" },
            { status: 400 },
          );
        }
        for (let i = 0; i < testimonials.length; i++) {
          const t = testimonials[i];
          if (!t.name || !t.text) {
            return NextResponse.json(
              {
                error: `Testimonial #${i + 1} must have at least a name and text`,
              },
              { status: 400 },
            );
          }
        }
      }
      updates.testimonials = testimonials;
    }

    // FAQs (JSON array)
    if (faqs !== undefined) {
      if (faqs !== null) {
        if (!Array.isArray(faqs)) {
          return NextResponse.json(
            { error: "faqs must be an array or null" },
            { status: 400 },
          );
        }
        if (faqs.length > 30) {
          return NextResponse.json(
            { error: "Maximum 30 FAQs allowed" },
            { status: 400 },
          );
        }
        for (let i = 0; i < faqs.length; i++) {
          const f = faqs[i];
          if (!f.question || !f.answer) {
            return NextResponse.json(
              {
                error: `FAQ #${i + 1} must have both a question and answer`,
              },
              { status: 400 },
            );
          }
        }
      }
      updates.faqs = faqs;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date();

    // Check if a settings row already exists
    const existing = await db.select().from(siteSettings).limit(1);

    let settings;

    if (existing.length === 0) {
      // Create the first settings row
      const [created] = await db
        .insert(siteSettings)
        .values({
          platformName: (updates.platformName as string | null) ?? null,
          logoUrl: (updates.logoUrl as string | null) ?? null,
          heroImageUrl: (updates.heroImageUrl as string | null) ?? null,
          featuredImageUrl: (updates.featuredImageUrl as string | null) ?? null,
          currency: (updates.currency as string | null) ?? "INR",
          footerTagline: (updates.footerTagline as string | null) ?? null,
          footerLinks: updates.footerLinks ?? null,
          testimonials: updates.testimonials ?? null,
          faqs: updates.faqs ?? null,
          updatedAt: updates.updatedAt as Date,
        })
        .returning();
      settings = created;
    } else {
      // Update the existing row
      const [updated] = await db
        .update(siteSettings)
        .set(updates)
        .where(eq(siteSettings.id, existing[0].id))
        .returning();
      settings = updated;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Update site settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
