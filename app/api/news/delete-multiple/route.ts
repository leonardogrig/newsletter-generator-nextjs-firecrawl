import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST - Delete multiple news items
export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty IDs array" },
        { status: 400 }
      );
    }

    // Delete all news items with the provided IDs
    await prisma.news.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error("Error deleting news items:", error);
    return NextResponse.json(
      { error: "Failed to delete news items" },
      { status: 500 }
    );
  }
}
