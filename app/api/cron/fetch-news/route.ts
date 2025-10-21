import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";

// Initialize OpenRouter client
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
  },
});

interface FirecrawlSearchResult {
  title: string;
  description?: string;
  url: string;
  summary?: string;
  date?: string; // e.g., "4 minutes ago"
}

interface FirecrawlResponse {
  success: boolean;
  data: {
    web?: FirecrawlSearchResult[];
    news?: FirecrawlSearchResult[];
    images?: unknown[];
  };
  warning?: string;
}

interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt?: string;
  brandScore?: number;
  labels?: string[];
}

async function searchWithFirecrawl(
  query: string,
  timeRange: string
): Promise<FirecrawlSearchResult[]> {
  // Convert timeRange to Firecrawl tbs format
  // qdr:h = past hour
  // qdr:d = past day
  // qdr:w = past week
  // For custom ranges, we use qdr:h for hour-based, qdr:d for day-based
  let tbsValue: string;
  switch (timeRange) {
    case "1h":
      tbsValue = "qdr:h"; // Last hour
      break;
    case "12h":
      tbsValue = "qdr:h12"; // Last 12 hours
      break;
    case "24h":
      tbsValue = "qdr:d"; // Last day
      break;
    case "48h":
      tbsValue = "qdr:d2"; // Last 2 days
      break;
    case "72h":
      tbsValue = "qdr:d3"; // Last 3 days
      break;
    default:
      tbsValue = "qdr:h"; // Default to last hour
  }

  const url = "https://api.firecrawl.dev/v2/search";
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      sources: ["news"],
      categories: [],
      tbs: tbsValue, 
      limit: 30,
      scrapeOptions: {
        onlyMainContent: true,
        maxAge: 172800000,
        parsers: [],
        formats: ["summary"],
      },
    }),
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.statusText}`);
  }

  const data: FirecrawlResponse = await response.json();

  if (!data.success) {
    throw new Error("Firecrawl search failed");
  }

  // Combine web and news results
  return [...(data.data.web || []), ...(data.data.news || [])];
}

async function deduplicateAndScoreNews(
  currentNews: NewsItem[],
  storedNews: NewsItem[],
  brandPersona: string
): Promise<NewsItem[]> {
  if (currentNews.length === 0) {
    return [];
  }

  // If no stored news, just score the current news
  const shouldDeduplicate = storedNews.length > 0;

  const prompt = shouldDeduplicate
    ? `You are a news analysis assistant. Your task is to deduplicate and score news items.

Brand Persona:
${brandPersona || "Not specified"}

Current news:
${JSON.stringify(currentNews, null, 2)}

Already stored news:
${JSON.stringify(storedNews, null, 2)}

DEDUPLICATION RULES (apply in this order):
1. INTERNAL DEDUPLICATION: Remove duplicate stories within current news
   - If multiple articles report the same event/announcement/story, keep only ONE (the most comprehensive or recent)
   - Example: 3 articles about "OpenAI launches new browser" = keep only 1
   - Compare: titles, summaries, and core subject matter

2. EXTERNAL DEDUPLICATION: Remove current news that match stored news
   - Remove if same URL, very similar title, or same event already stored

3. SCORING: For each remaining unique news item, add "brandScore" (0-5):
   - 0: Not relevant at all
   - 1: Barely relevant
   - 2: Somewhat relevant
   - 3: Moderately relevant
   - 4: Highly relevant
   - 5: Perfect fit for the brand

4. LABELING: For each news item, identify applicable labels from this list (can have multiple):
   - innovation: New inventions, breakthroughs, novel approaches, or creative solutions
   - tool: Software, applications, platforms, frameworks, or utilities
   - study: Research findings, academic papers, scientific studies, or data analysis
   - report: Industry reports, surveys, statistics, market analysis, or trends
   - gossip: Rumors, speculation, unconfirmed news, or opinion pieces

IMPORTANT: Be aggressive with deduplication. If articles cover the same story/event, keep ONLY the best one.

Return a JSON object with a "news" array containing the unique, scored, and labeled news items.`
    : `You are a news analysis assistant. Your task is to deduplicate and score news items.

Brand Persona:
${brandPersona || "Not specified"}

News items:
${JSON.stringify(currentNews, null, 2)}

TASKS:
1. DEDUPLICATION: Remove duplicate stories within the news items
   - If multiple articles report the same event/announcement/story, keep only ONE (the most comprehensive or recent)
   - Example: 3 articles about "OpenAI launches new browser" = keep only 1
   - Compare: titles, summaries, and core subject matter

2. SCORING: For each unique news item, add "brandScore" (0-5):
   - 0: Not relevant at all
   - 1: Barely relevant
   - 2: Somewhat relevant
   - 3: Moderately relevant
   - 4: Highly relevant
   - 5: Perfect fit for the brand

3. LABELING: For each news item, identify applicable labels from this list (can have multiple):
   - innovation: New inventions, breakthroughs, novel approaches, or creative solutions
   - tool: Software, applications, platforms, frameworks, or utilities
   - study: Research findings, academic papers, scientific studies, or data analysis
   - report: Industry reports, surveys, statistics, market analysis, or trends
   - gossip: Rumors, speculation, unconfirmed news, or opinion pieces

IMPORTANT: Be aggressive with deduplication. If articles cover the same story/event, keep ONLY the best one.

Return a JSON object with a "news" array containing the unique, scored, and labeled news items.`;

  const response = await openrouter.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "news_deduplication",
        strict: true,
        schema: {
          type: "object",
          properties: {
            news: {
              type: "array",
              description: "Array of unique, scored news items",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "News article title",
                  },
                  summary: {
                    type: "string",
                    description: "News article summary or description",
                  },
                  url: {
                    type: "string",
                    description: "URL to the news article",
                  },
                  publishedAt: {
                    type: ["string", "null"],
                    description:
                      "Publication date string (e.g., '4 minutes ago')",
                  },
                  brandScore: {
                    type: "number",
                    description: "Brand relevance score from 0 to 5",
                    minimum: 0,
                    maximum: 5,
                  },
                  labels: {
                    type: "array",
                    description: "Category labels for the news item",
                    items: {
                      type: "string",
                      enum: ["innovation", "tool", "study", "report", "gossip"],
                    },
                  },
                },
                required: ["title", "summary", "url", "brandScore", "labels"],
                additionalProperties: false,
              },
            },
          },
          required: ["news"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from LLM");
  }

  // Parse the structured JSON response
  try {
    // Remove markdown code blocks if present (fallback for when strict mode doesn't work)
    let jsonStr = content.trim();
    const markdownMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonStr = markdownMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    // Structured output returns { news: [...] }
    return parsed.news || [];
  } catch (error) {
    console.error("Failed to parse LLM response:", content, error);
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

    // Get time range from request body (default to 1h)
    const body = await request.json().catch(() => ({}));
    const timeRange = body.timeRange || "1h";

    // 1. Get brand persona
    const brandPersona = await prisma.brandPersona.findFirst();
    const brandDescription = brandPersona?.description || "";

    // 2. Get all search terms from database
    const searchTerms = await prisma.searchTerm.findMany();

    if (searchTerms.length === 0) {
      return NextResponse.json({
        message: "No search terms found",
        added: 0,
      });
    }

    let totalAdded = 0;
    const results: Record<string, { added: number; duplicates: number }> = {};

    // 3. For each search term, fetch news
    for (const searchTerm of searchTerms) {
      try {
        console.log(`Fetching news for term: ${searchTerm.term} (${timeRange})`);

        // 4. Call Firecrawl search API
        const searchResults = await searchWithFirecrawl(searchTerm.term, timeRange);

        if (searchResults.length === 0) {
          results[searchTerm.term] = { added: 0, duplicates: 0 };
          continue;
        }

        // 5. Transform to NewsItem format
        const currentNews: NewsItem[] = searchResults.map((result) => ({
          title: result.title,
          summary: result.summary || result.description || "",
          url: result.url,
          publishedAt: result.date,
        }));

        // 6. Get previously stored news for this search term
        const storedNewsRecords = await prisma.news.findMany({
          where: { searchTermId: searchTerm.id },
          select: {
            title: true,
            summary: true,
            url: true,
          },
          take: 100, // Limit to last 100 to avoid huge prompts
        });

        const storedNews: NewsItem[] = storedNewsRecords;

        // 6. Use LLM to deduplicate and score
        console.log(
          `Deduplicating and scoring ${currentNews.length} current news against ${storedNews.length} stored news...`
        );
        const uniqueNews = await deduplicateAndScoreNews(
          currentNews,
          storedNews,
          brandDescription
        );

        console.log(`Found ${uniqueNews.length} unique news items`);

        // 7. Store new unique news to database
        let addedCount = 0;
        for (const newsItem of uniqueNews) {
          try {
            await prisma.news.create({
              data: {
                title: newsItem.title,
                summary: newsItem.summary,
                url: newsItem.url,
                searchTermId: searchTerm.id,
                brandScore: newsItem.brandScore || null,
                publishedAt: newsItem.publishedAt || null,
                labels: newsItem.labels || [],
              },
            });
            addedCount++;
          } catch (error: unknown) {
            // Skip if URL already exists (unique constraint)
            const prismaError = error as { code?: string };
            if (prismaError.code === "P2002") {
              console.log(`Skipping duplicate URL: ${newsItem.url}`);
            } else {
              throw error;
            }
          }
        }

        totalAdded += addedCount;
        results[searchTerm.term] = {
          added: addedCount,
          duplicates: currentNews.length - uniqueNews.length,
        };

        console.log(
          `Added ${addedCount} news items for "${searchTerm.term}"`
        );
      } catch (error) {
        console.error(`Error processing term "${searchTerm.term}":`, error);
        results[searchTerm.term] = { added: 0, duplicates: 0 };
      }
    }

    return NextResponse.json({
      message: "News fetch completed",
      totalAdded,
      results,
    });
  } catch (error: unknown) {
    console.error("Error in fetch-news cron:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch news";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
