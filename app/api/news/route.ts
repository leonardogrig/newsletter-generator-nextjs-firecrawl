import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Function to extract dates from markdown content using various patterns
function extractDateFromContent(content: string): Date | null {
  if (!content) return null;

  // Clean content for better date matching
  const cleanContent = content.substring(0, 2000); // Only check first 2000 chars for performance

  // Date patterns (ordered by specificity/reliability)
  const datePatterns = [
    // Full date with month names: "May 20, 2025", "December 3rd, 2024"
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi,

    // Short month names: "Jan 20, 2025", "Dec 3rd, 2024"
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi,

    // ISO format: "2025-05-20"
    /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,

    // US format: "05/20/2025", "5/20/2025"
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,

    // European format: "20.05.2025", "20-05-2025"
    /\b(\d{1,2})[-.](\d{1,2})[-.](\d{4})\b/g,

    // Reverse format: "20 May 2025"
    /\b(\d{1,2})\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,

    // Published/Posted patterns: "Published: May 20, 2025", "Posted on 2025-05-20"
    /(?:published|posted|date)[\s:]+(?:on\s+)?([A-Za-z]+ \d{1,2},? \d{4}|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4})/gi,

    // Year only as fallback: "2025", "2024" (only recent years)
    /\b(202[0-9])\b/g,
  ];

  const monthNames = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sep: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
  };

  let foundDates: Date[] = [];

  // Try each pattern
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(cleanContent)) !== null) {
      let date: Date | null = null;

      try {
        const fullMatch = match[0].toLowerCase();

        // Handle month name patterns
        if (
          fullMatch.includes("january") ||
          fullMatch.includes("jan") ||
          fullMatch.includes("february") ||
          fullMatch.includes("feb") ||
          fullMatch.includes("march") ||
          fullMatch.includes("mar") ||
          fullMatch.includes("april") ||
          fullMatch.includes("apr") ||
          fullMatch.includes("may") ||
          fullMatch.includes("june") ||
          fullMatch.includes("jun") ||
          fullMatch.includes("july") ||
          fullMatch.includes("jul") ||
          fullMatch.includes("august") ||
          fullMatch.includes("aug") ||
          fullMatch.includes("september") ||
          fullMatch.includes("sep") ||
          fullMatch.includes("october") ||
          fullMatch.includes("oct") ||
          fullMatch.includes("november") ||
          fullMatch.includes("nov") ||
          fullMatch.includes("december") ||
          fullMatch.includes("dec")
        ) {
          // Extract month name, day, and year
          const monthMatch = fullMatch.match(
            /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?/
          );
          const dayMatch = fullMatch.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
          const yearMatch = fullMatch.match(/\b(\d{4})\b/);

          if (monthMatch && yearMatch) {
            const month =
              monthNames[
                monthMatch[0].replace(".", "") as keyof typeof monthNames
              ];
            const day = dayMatch ? parseInt(dayMatch[1]) : 1;
            const year = parseInt(yearMatch[1]);

            if (month !== undefined && year >= 2020 && year <= 2030) {
              date = new Date(year, month, day);
            }
          }
        }
        // Handle ISO format: YYYY-MM-DD
        else if (match[1] && match[2] && match[3] && match[1].length === 4) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // Month is 0-indexed
          const day = parseInt(match[3]);

          if (
            year >= 2020 &&
            year <= 2030 &&
            month >= 0 &&
            month <= 11 &&
            day >= 1 &&
            day <= 31
          ) {
            date = new Date(year, month, day);
          }
        }
        // Handle MM/DD/YYYY or DD/MM/YYYY
        else if (match[1] && match[2] && match[3] && match[3].length === 4) {
          const year = parseInt(match[3]);
          const first = parseInt(match[1]);
          const second = parseInt(match[2]);

          if (year >= 2020 && year <= 2030) {
            // Try MM/DD/YYYY first (US format)
            if (first >= 1 && first <= 12 && second >= 1 && second <= 31) {
              date = new Date(year, first - 1, second);
            }
            // If that doesn't work, try DD/MM/YYYY (European)
            else if (second >= 1 && second <= 12 && first >= 1 && first <= 31) {
              date = new Date(year, second - 1, first);
            }
          }
        }
        // Handle year only
        else if (match[1] && match[1].length === 4) {
          const year = parseInt(match[1]);
          if (year >= 2020 && year <= 2030) {
            date = new Date(year, 0, 1); // January 1st of that year
          }
        }

        // Validate the date and add to found dates
        if (
          date &&
          !isNaN(date.getTime()) &&
          date > new Date("2020-01-01") &&
          date < new Date("2030-12-31")
        ) {
          foundDates.push(date);
        }
      } catch (error) {
        // Skip invalid dates
        continue;
      }
    }
  }

  // Return the most recent reasonable date (but not future dates beyond 1 year)
  if (foundDates.length > 0) {
    const now = new Date();
    const oneYearFromNow = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate()
    );

    // Filter out dates too far in the future
    const validDates = foundDates.filter((date) => date <= oneYearFromNow);

    if (validDates.length > 0) {
      // Return the most recent valid date
      return validDates.sort((a, b) => b.getTime() - a.getTime())[0];
    }
  }

  return null;
}

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      orderBy: { scrapedAt: "desc" },
      take: 50, // Limit to last 50 news items
    });

    // Add extracted date as temporary field
    const newsWithExtractedDates = news.map((item) => {
      const extractedDate = extractDateFromContent(item.fullContent || "");
      return {
        ...item,
        extractedDate: extractedDate ? extractedDate.toISOString() : null,
      };
    });

    return NextResponse.json(newsWithExtractedDates);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
