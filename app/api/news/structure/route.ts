import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { newsId } = await request.json();

    console.log("🤖 Structuring news item:", newsId);

    if (!newsId) {
      return NextResponse.json(
        { error: "News ID is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("❌ OpenRouter API key not configured");
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      console.error("❌ Firecrawl API key not configured");
      return NextResponse.json(
        { error: "Firecrawl API key not configured" },
        { status: 500 }
      );
    }

    // Get the news item from database
    const newsItem = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!newsItem) {
      return NextResponse.json(
        { error: "News item not found" },
        { status: 404 }
      );
    }

    console.log("🔥 Scraping fresh content for:", newsItem.url);

    // Use Firecrawl's single scrape to get fresh content
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: newsItem.url,
        formats: ["markdown"],
        onlyMainContent: true,
        removeBase64Images: true,
        blockAds: true,
        maxAge: 0, // Disable caching for fresh content
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error(
        "❌ Failed to scrape content:",
        scrapeResponse.status,
        errorText
      );
      return NextResponse.json(
        { error: "Failed to scrape fresh content" },
        { status: 500 }
      );
    }

    const scrapeResult = await scrapeResponse.json();

    if (!scrapeResult.success || !scrapeResult.data?.markdown) {
      console.error("❌ No content found in scrape result");
      return NextResponse.json(
        { error: "No content found at URL" },
        { status: 400 }
      );
    }

    const freshContent = scrapeResult.data.markdown;
    const metadata = scrapeResult.data.metadata || {};

    console.log("🤖 Processing fresh content with LLM...");

    // Use OpenRouter with structured outputs
    const llmResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "Newsletter Generator",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert news article analyzer and editor. Your job is to extract and structure news articles from website content with high precision.

INSTRUCTIONS:
1. Analyze the provided fresh content from the website
2. Extract the main article content (ignore navigation, ads, comments, etc.)
3. Generate a comprehensive, objective summary that covers ALL key points from the article
4. The summary should be detailed and thorough - aim for 200-400 words to capture the full story
5. Extract or infer the publication date with high accuracy
6. Identify the correct source/publication name
7. Clean and format the title appropriately
8. Extract breadcrumb information if available
9. If no meaningful article is found, mark as invalid

Focus on accuracy, completeness, and providing structured data that will be valuable for newsletter generation.`,
            },
            {
              role: "user",
              content: `Please analyze this fresh content and extract structured article data:

URL: ${newsItem.url}
Original Title: ${newsItem.title}

Fresh Scraped Content:
${freshContent}

Website Metadata:
- Title: ${metadata.title || "N/A"}
- Description: ${metadata.description || "N/A"}
- Language: ${metadata.language || "N/A"}
- Source URL: ${metadata.sourceURL || newsItem.url}

Please extract the structured article data in the specified JSON format.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "article_structure",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Clean, complete headline of the main article",
                  },
                  summary: {
                    type: "string",
                    description:
                      "Comprehensive 200-400 word objective summary covering all key points of the article",
                  },
                  fullContent: {
                    type: "string",
                    description:
                      "The complete extracted article text, cleaned of navigation and ads",
                  },
                  url: {
                    type: "string",
                    description:
                      "Direct URL to the article (use the provided URL)",
                  },
                  publishedAt: {
                    type: "string",
                    description:
                      "Publication date in YYYY-MM-DD format, or empty string if unknown",
                  },
                  source: {
                    type: "string",
                    description: "Publication or website name",
                  },
                  breadcrumb: {
                    type: "string",
                    description:
                      "Breadcrumb navigation if available, empty string otherwise",
                  },
                  category: {
                    type: "string",
                    description:
                      "Article category/topic (e.g., 'Technology', 'Business', 'Health')",
                  },
                  hasValidArticle: {
                    type: "boolean",
                    description:
                      "True if a meaningful article was found, false otherwise",
                  },
                },
                required: [
                  "title",
                  "summary",
                  "fullContent",
                  "url",
                  "publishedAt",
                  "source",
                  "breadcrumb",
                  "category",
                  "hasValidArticle",
                ],
                additionalProperties: false,
              },
            },
          },
          temperature: 0.1,
          max_tokens: 4000,
        }),
      }
    );

    if (!llmResponse.ok) {
      console.error(
        "❌ Failed to process content with LLM:",
        llmResponse.status
      );
      const errorText = await llmResponse.text();
      console.error("LLM Error:", errorText);
      return NextResponse.json(
        { error: "Failed to process content with LLM" },
        { status: 500 }
      );
    }

    const llmResult = await llmResponse.json();
    console.log("🤖 LLM processing completed");

    try {
      const content = llmResult.choices[0]?.message?.content;
      if (!content) {
        console.error("❌ No content from LLM response");
        return NextResponse.json(
          { error: "No content from LLM response" },
          { status: 500 }
        );
      }

      const structuredData = JSON.parse(content);

      console.log(
        `📰 Processed article: ${
          structuredData.hasValidArticle ? "Valid" : "Invalid"
        }`
      );

      if (!structuredData.hasValidArticle) {
        // Mark as processed but not valid
        const updatedNewsItem = await prisma.news.update({
          where: { id: newsId },
          data: {
            summary: "No valid article found in this content",
            isSelected: false,
            structured: true,
          },
        });

        return NextResponse.json({
          ...updatedNewsItem,
          structured: true,
          hasValidArticle: false,
        });
      }

      // Update with structured data and mark as active/selected
      const updatedNewsItem = await prisma.news.update({
        where: { id: newsId },
        data: {
          title: structuredData.title || newsItem.title,
          summary: structuredData.summary || newsItem.summary,
          fullContent: structuredData.fullContent || freshContent,
          url: structuredData.url || newsItem.url,
          sourceUrl: structuredData.source || new URL(newsItem.url).hostname,
          publishedAt: structuredData.publishedAt
            ? new Date(structuredData.publishedAt)
            : null,
          // brandScore is not updated here - it's set during fetch-news
          isSelected: true, // Mark as active/selected for newsletter generation
          structured: true, // Mark as structured
        },
      });

      console.log(
        `✅ Updated news item: ${structuredData.title?.substring(0, 50)}...`
      );

      // Return additional metadata for UI
      return NextResponse.json({
        ...updatedNewsItem,
        structured: true,
        hasValidArticle: true,
        breadcrumb: structuredData.breadcrumb,
        category: structuredData.category,
        // brandScore is preserved from initial fetch-news scoring
      });
    } catch (parseError) {
      console.error("❌ Failed to parse LLM response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse LLM response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error structuring news item:", error);
    return NextResponse.json(
      { error: "Failed to structure news item" },
      { status: 500 }
    );
  }
}
