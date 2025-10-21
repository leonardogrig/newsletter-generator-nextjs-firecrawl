import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      orderBy: { fetchedAt: "desc" },
      include: {
        searchTerm: {
          select: {
            term: true
          }
        }
      }
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
