import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("📊 Fetching batch scrapes from database...");

    // Get all batch scrapes ordered by most recent first
    const batchScrapes = await prisma.batchScrape.findMany({
      orderBy: {
        startedAt: "desc",
      },
    });

    console.log(`✅ Found ${batchScrapes.length} batch scrapes in database`);

    return NextResponse.json({
      success: true,
      batchScrapes: batchScrapes.map((batchScrape) => ({
        id: batchScrape.id,
        jobId: batchScrape.jobId,
        urls: batchScrape.urls,
        status: batchScrape.status,
        startedAt: batchScrape.startedAt,
        completedAt: batchScrape.completedAt,
        errorMessage: batchScrape.errorMessage,
        totalPages: batchScrape.totalPages,
        pagesScraped: batchScrape.pagesScraped,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching batch scrapes:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch scrapes" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
