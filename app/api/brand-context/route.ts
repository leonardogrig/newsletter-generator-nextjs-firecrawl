import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Retrieve the latest brand context
export async function GET() {
  try {
    const brandContext = await prisma.brandContext.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      instructions: brandContext?.instructions || "",
    });
  } catch (error) {
    console.error("❌ Error fetching brand context:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand context" },
      { status: 500 }
    );
  }
}

// POST - Save brand context
export async function POST(request: Request) {
  try {
    const { instructions } = await request.json();

    if (typeof instructions !== "string") {
      return NextResponse.json(
        { error: "Instructions must be a string" },
        { status: 400 }
      );
    }

    // Check if there's an existing brand context
    const existingContext = await prisma.brandContext.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    let brandContext;
    if (existingContext) {
      // Update existing context
      brandContext = await prisma.brandContext.update({
        where: { id: existingContext.id },
        data: { instructions },
      });
    } else {
      // Create new context
      brandContext = await prisma.brandContext.create({
        data: { instructions },
      });
    }

    return NextResponse.json({
      success: true,
      instructions: brandContext.instructions,
    });
  } catch (error) {
    console.error("❌ Error saving brand context:", error);
    return NextResponse.json(
      { error: "Failed to save brand context" },
      { status: 500 }
    );
  }
}
