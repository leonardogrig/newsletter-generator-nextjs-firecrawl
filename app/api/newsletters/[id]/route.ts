import { PrismaClient } from "@/app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log("🗑️ Deleting newsletter with ID:", id);

    // First delete related NewsletterNews entries
    await prisma.newsletterNews.deleteMany({
      where: { newsletterId: id },
    });

    // Then delete the newsletter
    await prisma.newsletter.delete({
      where: { id },
    });

    console.log("✅ Newsletter deleted successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting newsletter:", error);
    return NextResponse.json(
      { error: "Failed to delete newsletter" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
