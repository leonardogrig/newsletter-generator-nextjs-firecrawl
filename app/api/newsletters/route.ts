import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const newsletters = await prisma.newsletter.findMany({
      orderBy: { generatedAt: "desc" },
      include: {
        news: {
          include: {
            news: true,
          },
        },
      },
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

export async function POST(request: Request) {
  try {
    const { content, newsIds, title } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Newsletter content is required" },
        { status: 400 }
      );
    }

    // Create the newsletter
    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        content,
        savedAt: new Date(),
      },
    });

    // Link the news items to the newsletter if provided
    if (newsIds && newsIds.length > 0) {
      await Promise.all(
        newsIds.map((newsId: string, index: number) =>
          prisma.newsletterNews.create({
            data: {
              newsletterId: newsletter.id,
              newsId,
              order: index,
            },
          })
        )
      );
    }

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error("Error saving newsletter:", error);
    return NextResponse.json(
      { error: "Failed to save newsletter" },
      { status: 500 }
    );
  }
}
