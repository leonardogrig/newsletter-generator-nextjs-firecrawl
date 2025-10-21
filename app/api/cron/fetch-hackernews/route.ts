import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize OpenRouter client
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
  },
});

interface HackerNewsItem {
  title: string;
  url: string;
}

async function scrapeHackerNews(): Promise<string> {
  const url = "https://api.firecrawl.dev/v2/scrape";
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://news.ycombinator.com/newest",
      onlyMainContent: true,
      maxAge: 172800000,
      parsers: [],
      formats: ["markdown"],
      waitFor: 5000,
    }),
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error("Firecrawl scrape failed");
  }

  return data.data.markdown;
}

async function extractNewsItems(markdown: string): Promise<HackerNewsItem[]> {
  const prompt = `You are a Hacker News parser. Extract all news items from the markdown content below.

For each news item, extract:
- title: The headline/title of the story
- url: The URL link to the story (NOT the HN comments link, but the actual story URL)

IMPORTANT:
- Only extract the main story links, not the comment links
- Skip any "Show HN", "Ask HN" or "Tell HN" posts
- Return up to 30 most recent news items

Markdown content:
${markdown}

Return a JSON object with a "news" array containing the extracted news items.`;

  const response = await openrouter.chat.completions.create({
    model: "anthropic/claude-sonnet-4.5",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from LLM");
  }

  try {
    // Remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleanedContent);
    return parsed.news || [];
  } catch (error) {
    console.error("Failed to parse LLM response:", content, error);
    throw new Error("Failed to parse news items from LLM response");
  }
}

async function deduplicateHackerNews(
  currentNews: HackerNewsItem[],
  storedNews: { title: string; url: string }[]
): Promise<HackerNewsItem[]> {
  if (currentNews.length === 0) {
    return [];
  }

  const shouldDeduplicate = storedNews.length > 0;

  const prompt = shouldDeduplicate
    ? `You are a news deduplication assistant. Your task is to remove duplicate news items.

Current Hacker News items:
${JSON.stringify(currentNews, null, 2)}

Already stored news (from the past week):
${JSON.stringify(storedNews, null, 2)}

DEDUPLICATION RULES (apply in this order):
1. INTERNAL DEDUPLICATION: Remove duplicate stories within current Hacker News items
   - If multiple articles report the same event/announcement/story, keep only ONE
   - Compare: titles, URLs, and core subject matter

2. EXTERNAL DEDUPLICATION: Remove current news that match stored news
   - Remove if same URL
   - Remove if very similar title (slight variations of the same story)
   - Remove if same event/story already stored

IMPORTANT: Be aggressive with deduplication. If articles cover the same story/event, keep ONLY the best one.

Return a JSON object with a "news" array containing ONLY the unique news items that are NOT duplicates.`
    : `You are a news deduplication assistant. Your task is to remove duplicate news items.

Hacker News items:
${JSON.stringify(currentNews, null, 2)}

TASK:
Remove duplicate stories within the news items:
- If multiple articles report the same event/announcement/story, keep only ONE
- Compare: titles, URLs, and core subject matter

IMPORTANT: Be aggressive with deduplication. If articles cover the same story/event, keep ONLY the best one.

Return a JSON object with a "news" array containing ONLY the unique news items.`;

  const response = await openrouter.chat.completions.create({
    model: "anthropic/claude-sonnet-4.5",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from LLM");
  }

  try {
    // Remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleanedContent);
    return parsed.news || [];
  } catch (error) {
    console.error("Failed to parse LLM deduplication response:", content, error);
    // If parsing fails, return the original current news to avoid losing data
    return currentNews;
  }
}

export async function POST(request: Request) {
  try {
    if (!FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    // 1. Scrape Hacker News
    console.log("Scraping Hacker News...");
    const markdown = await scrapeHackerNews();

    // 2. Extract news items using LLM
    console.log("Extracting news items from markdown...");
    const newsItems = await extractNewsItems(markdown);

    console.log(`Extracted ${newsItems.length} news items`);

    // 3. Get news from the past week for deduplication
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentNews = await prisma.news.findMany({
      where: {
        fetchedAt: {
          gte: oneWeekAgo,
        },
      },
      select: {
        title: true,
        url: true,
      },
      take: 200, // Limit to prevent huge prompts
    });

    console.log(`Found ${recentNews.length} news items from the past week for deduplication`);

    // 4. Deduplicate using LLM
    console.log("Deduplicating news items...");
    const uniqueNewsItems = await deduplicateHackerNews(newsItems, recentNews);

    console.log(`After deduplication: ${uniqueNewsItems.length} unique news items`);

    // 5. Store unique news items with HACKER_NEWS label and no search term
    let addedCount = 0;
    let skippedCount = 0;

    for (const newsItem of uniqueNewsItems) {
      try {
        await prisma.news.create({
          data: {
            title: newsItem.title,
            summary: "", // Empty summary initially
            url: newsItem.url,
            searchTermId: null, // No search term for Hacker News items
            brandScore: null,
            publishedAt: null,
            labels: ["HACKER_NEWS"],
          },
        });
        addedCount++;
      } catch (error: unknown) {
        // Skip if URL already exists (unique constraint)
        const prismaError = error as { code?: string };
        if (prismaError.code === "P2002") {
          console.log(`Skipping duplicate URL: ${newsItem.url}`);
          skippedCount++;
        } else {
          throw error;
        }
      }
    }

    console.log(`Added ${addedCount} new Hacker News items, skipped ${skippedCount} duplicates`);

    return NextResponse.json({
      message: "Hacker News fetch completed",
      totalAdded: addedCount,
      totalSkipped: skippedCount,
      totalExtracted: newsItems.length,
      totalUnique: uniqueNewsItems.length,
    });
  } catch (error: unknown) {
    console.error("Error in fetch-hackernews:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch Hacker News";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
