import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, subtitle } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const newsletter = await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        title,
        subtitle,
      },
    });

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error("Error updating newsletter:", error);
    return NextResponse.json(
      { error: "Failed to update newsletter" },
      { status: 500 }
    );
  }
}
