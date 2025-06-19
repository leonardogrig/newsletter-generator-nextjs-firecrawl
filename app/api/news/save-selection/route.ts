import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { newsIds } = await request.json();

    if (!newsIds || !Array.isArray(newsIds)) {
      return NextResponse.json(
        { error: "News IDs are required" },
        { status: 400 }
      );
    }

    // Update all news items to unselected first
    await prisma.news.updateMany({
      data: { isSelected: false },
    });

    // Then select the specified ones
    await prisma.news.updateMany({
      where: { id: { in: newsIds } },
      data: { isSelected: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving news selection:", error);
    return NextResponse.json(
      { error: "Failed to save selection" },
      { status: 500 }
    );
  }
}
