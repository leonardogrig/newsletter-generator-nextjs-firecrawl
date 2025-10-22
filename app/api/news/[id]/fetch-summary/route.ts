import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

// Use fallback values for build time (will be overridden at runtime)
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";

// Initialize OpenRouter client with fallback for build time
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY || "sk-dummy-key-for-build",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
  },
});

interface FirecrawlData {
  summary: string;
  metadata?: {
    publishedTime?: string;
    modifiedTime?: string;
    [key: string]: unknown;
  };
}

async function fetchSummaryFromUrl(url: string): Promise<FirecrawlData> {
  const firecrawlUrl = "https://api.firecrawl.dev/v2/scrape";
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: url,
      onlyMainContent: true,
      maxAge: 172800000,
      parsers: [],
      formats: ["summary"],
      waitFor: 5000,
    }),
  };

  const response = await fetch(firecrawlUrl, options);

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error("Firecrawl scrape failed");
  }

  return {
    summary: data.data.summary || "",
    metadata: data.data.metadata,
  };
}

async function scoreNews(
  title: string,
  summary: string,
  brandPersona: string
): Promise<number> {
  const prompt = `You are a news analysis assistant. Score this news item based on its relevance to the brand persona.

Brand Persona:
${brandPersona || "Not specified"}

News Item:
Title: ${title}
Summary: ${summary}

Provide a relevance score from 0 to 5:
- 0: Not relevant at all
- 1: Barely relevant
- 2: Somewhat relevant
- 3: Moderately relevant
- 4: Highly relevant
- 5: Perfect fit for the brand

Return ONLY a JSON object with a "score" field containing the numeric score.`;

  const response = await openrouter.chat.completions.create({
    model: OPENROUTER_MODEL,
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
    return parsed.score || 0;
  } catch (error) {
    console.error("Failed to parse LLM response:", content, error);
    return 0; // Default to 0 if parsing fails
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // 1. Get the news item
    const newsItem = await prisma.news.findUnique({
      where: { id },
    });

    if (!newsItem) {
      return NextResponse.json(
        { error: "News item not found" },
        { status: 404 }
      );
    }

    // 2. Get brand persona
    const brandPersona = await prisma.brandPersona.findFirst();
    const brandDescription = brandPersona?.description || "";

    // 3. Fetch summary and metadata from the URL
    console.log(`Fetching summary for: ${newsItem.url}`);
    const firecrawlData = await fetchSummaryFromUrl(newsItem.url);

    // 4. Score the news item
    console.log(`Scoring news item...`);
    const brandScore = await scoreNews(
      newsItem.title,
      firecrawlData.summary,
      brandDescription
    );

    // 5. Extract published date from metadata
    const publishedAt =
      firecrawlData.metadata?.publishedTime ||
      firecrawlData.metadata?.modifiedTime ||
      null;

    // 6. Update the news item with summary, score, and date
    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        summary: firecrawlData.summary,
        brandScore,
        publishedAt,
      },
    });

    return NextResponse.json({
      success: true,
      news: updatedNews,
    });
  } catch (error: unknown) {
    console.error("Error fetching summary:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch summary";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
