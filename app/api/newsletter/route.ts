import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const newsletters = await prisma.newsletter.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(newsletters);
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletters" },
      { status: 500 }
    );
  }
}
