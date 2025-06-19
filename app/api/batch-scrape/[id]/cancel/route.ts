import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const batchScrapeId = params.id;

    if (!batchScrapeId) {
      return NextResponse.json(
        { error: "Batch scrape ID required" },
        { status: 400 }
      );
    }

    console.log("🛑 Cancelling batch scrape:", batchScrapeId);

    // Get batch scrape from database first
    const batchScrape = await prisma.batchScrape.findUnique({
      where: { id: batchScrapeId },
    });

    if (!batchScrape) {
      return NextResponse.json(
        { error: "Batch scrape not found" },
        { status: 404 }
      );
    }

    // Check if batch scrape is in a cancellable state
    if (batchScrape.status !== "PENDING" && batchScrape.status !== "SCRAPING") {
      return NextResponse.json(
        {
          error: `Cannot cancel batch scrape with status: ${batchScrape.status}`,
        },
        { status: 400 }
      );
    }

    // Try to cancel on Firecrawl first
    if (process.env.FIRECRAWL_API_KEY && batchScrape.jobId) {
      try {
        console.log("🛑 Cancelling Firecrawl job:", batchScrape.jobId);

        const cancelResponse = await fetch(
          `https://api.firecrawl.dev/v1/batch/scrape/${batchScrape.jobId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            },
          }
        );

        if (!cancelResponse.ok) {
          console.warn(
            `⚠️ Failed to cancel Firecrawl job ${batchScrape.jobId}:`,
            cancelResponse.status
          );
          // Continue with database update even if Firecrawl cancellation fails
        } else {
          console.log("✅ Successfully cancelled Firecrawl job");
        }
      } catch (error) {
        console.warn(
          "⚠️ Error cancelling Firecrawl job, but continuing with database update:",
          error
        );
      }
    }

    // Update status in database
    await prisma.batchScrape.update({
      where: { id: batchScrapeId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });

    console.log("✅ Batch scrape cancelled successfully");

    return NextResponse.json({ success: true, status: "cancelled" });
  } catch (error) {
    console.error("❌ Error cancelling batch scrape:", error);
    return NextResponse.json(
      { error: "Failed to cancel batch scrape" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
