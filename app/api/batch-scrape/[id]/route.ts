import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(
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

    console.log("🗑️ Deleting batch scrape:", batchScrapeId);

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

    // If batch scrape is still running, try to cancel it on Firecrawl first
    if (batchScrape.status === "PENDING" || batchScrape.status === "SCRAPING") {
      if (process.env.FIRECRAWL_API_KEY) {
        try {
          console.log(
            "🛑 Attempting to cancel running batch scrape job:",
            batchScrape.jobId
          );

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
              `⚠️ Failed to cancel Firecrawl job ${batchScrape.jobId}, but continuing with deletion`
            );
          } else {
            console.log("✅ Successfully cancelled Firecrawl job");
          }
        } catch (error) {
          console.warn(
            "⚠️ Error cancelling Firecrawl job, but continuing with deletion:",
            error
          );
        }
      }
    }

    // Delete from database
    await prisma.batchScrape.delete({
      where: { id: batchScrapeId },
    });

    console.log("✅ Batch scrape deleted successfully:", batchScrapeId);

    return NextResponse.json({
      success: true,
      message: "Batch scrape deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting batch scrape:", error);
    return NextResponse.json(
      { error: "Failed to delete batch scrape" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
