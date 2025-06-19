import { PrismaClient } from "@/app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log("🗑️ Deleting news item with ID:", id);

    // Delete the news item
    await prisma.news.delete({
      where: { id },
    });

    console.log("✅ News item deleted successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting news item:", error);
    return NextResponse.json(
      { error: "Failed to delete news item" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
