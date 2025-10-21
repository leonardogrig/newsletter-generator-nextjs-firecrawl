import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all search terms
export async function GET() {
  try {
    const terms = await prisma.searchTerm.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { news: true }
        }
      }
    });

    return NextResponse.json(terms);
  } catch (error) {
    console.error("Error fetching search terms:", error);
    return NextResponse.json(
      { error: "Failed to fetch search terms" },
      { status: 500 }
    );
  }
}

// POST new search term
export async function POST(request: Request) {
  try {
    const { term } = await request.json();

    if (!term || typeof term !== "string" || term.trim() === "") {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 }
      );
    }

    const searchTerm = await prisma.searchTerm.create({
      data: { term: term.trim() },
    });

    return NextResponse.json(searchTerm);
  } catch (error: unknown) {
    console.error("Error creating search term:", error);

    // Handle unique constraint violation
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "Search term already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create search term" },
      { status: 500 }
    );
  }
}
