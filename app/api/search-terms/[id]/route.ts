import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE search term
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.searchTerm.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting search term:", error);

    const prismaError = error as { code?: string };
    if (prismaError.code === "P2025") {
      return NextResponse.json(
        { error: "Search term not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete search term" },
      { status: 500 }
    );
  }
}
