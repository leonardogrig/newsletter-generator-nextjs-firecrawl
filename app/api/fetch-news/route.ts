import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Function to create posts from scraped content using LLM
async function createPostsFromContent(
  scrapedData: any[],
  dateRange?: any,
  brandInstructions?: string
): Promise<any[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  console.log("🤖 Processing scraped content with LLM to create posts...");

  // Prepare content for LLM processing
  const preparedContent = scrapedData
    .map((page, index) => {
      return {
        index: index + 1,
        title: page.metadata?.title || "Untitled",
        url: page.metadata?.sourceURL || page.metadata?.url || "",
        content: page.markdown, // Limit content length
        metadata: page.metadata,
      };
    })
    .filter((item) => item.content.length > 100); // Filter out pages with little content

  if (preparedContent.length === 0) {
    throw new Error("No meaningful content found in scraped data");
  }

  console.log(`📄 Processing ${preparedContent.length} pages with LLM...`);

  // Use OpenRouter to extract news articles
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
            content: `You are an expert content analyzer. Your job is to identify and extract news articles, blog posts, and informative content from web pages.

INSTRUCTIONS:
1. Analyze each provided web page content (typically blog listing pages)
2. Extract all article links/titles that fall within the specified date range
3. For each article found, extract:
   - A clean, descriptive title
   - The article URL (if different from the page URL)
   - The publication date (if visible on the listing page)
   - Brand relevance score (0-10) if brand context is provided, null otherwise
4. IMPORTANT: Only include articles that are published within the specified date range
5. This is just for discovering available articles - detailed content extraction happens later

Focus on finding articles within the date range that would be valuable for a newsletter.${
              brandInstructions
                ? " Score each article's relevance to the provided brand context."
                : ""
            }`,
          },
          {
            role: "user",
            content: `Please analyze the following web page and extract article titles/links that fall within the date range: ${
              dateRange?.from ? new Date(dateRange.from).toDateString() : "Any"
            } to ${
              dateRange?.to ? new Date(dateRange.to).toDateString() : "Any"
            }

${
  brandInstructions
    ? `Brand Context for Relevance Scoring:
${brandInstructions}

`
    : ""
}${preparedContent
              .map(
                (item) => `
PAGE ${item.index}:
URL: ${item.url}
Markdown: ${item.content}
---`
              )
              .join("\n")}

Please extract articles within the specified date range in the JSON format.${
              brandInstructions
                ? " Score each article's relevance to the brand context on a scale of 0-10."
                : " Set brandScore to null for all articles since no brand context was provided."
            }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "articles_extraction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                articles: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "Clean, descriptive title of the article",
                      },
                      url: {
                        type: "string",
                        description: "URL of the article",
                      },
                      publishedDate: {
                        type: "string",
                        description:
                          "Publication date in YYYY-MM-DD format if visible on the listing page, empty string if not found",
                      },
                      brandScore: {
                        type: ["number", "null"],
                        description:
                          "Relevance score to brand context (0-10 scale, where 10 is extremely relevant). Null if no brand context provided.",
                      },
                    },
                    required: ["title", "url", "publishedDate", "brandScore"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["articles"],
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
    const errorText = await llmResponse.text();
    console.error("❌ LLM processing failed:", errorText);
    throw new Error("Failed to process content with LLM");
  }

  const llmResult = await llmResponse.json();
  const content = llmResult.choices[0]?.message?.content;

  console.log("🤖 LLM Raw response:", content);

  if (!content) {
    throw new Error("No content from LLM response");
  }

  const extractedData = JSON.parse(content);
  console.log("📊 Parsed articles:", extractedData.articles.length);

  const validArticles = extractedData.articles; // No filtering needed since we removed isValid

  console.log("✅ Articles to process:", validArticles.length);

  console.log(
    `✅ LLM extracted ${validArticles.length} articles from ${preparedContent.length} pages`
  );

  // Create basic news items for discovered articles
  const newsItems = [];
  console.log("🔄 Processing", validArticles.length, "discovered articles...");

  for (const article of validArticles) {
    console.log(`📝 Processing article: "${article.title}"`);

    try {
      const sourceUrl = (() => {
        try {
          return new URL(article.url).hostname;
        } catch {
          return article.url;
        }
      })();

      console.log(`💾 Creating database entry for: "${article.title}"`);

      // Check if article with this URL already exists
      const existingArticle = await prisma.news.findFirst({
        where: { url: article.url },
      });

      if (existingArticle) {
        console.log(`⚠️ Article already exists, skipping: "${article.title}"`);
        continue;
      }

      const newsItem = await prisma.news.create({
        data: {
          title: article.title,
          summary: "", // Empty - will be filled during structure process
          fullContent: "", // Empty - will be filled during structure process
          url: article.url,
          sourceUrl: sourceUrl,
          publishedAt: article.publishedDate
            ? new Date(article.publishedDate)
            : null, // Set from discovery, can be updated during structure process
          brandScore:
            brandInstructions && brandInstructions.trim()
              ? article.brandScore
              : null, // Only save score if brand instructions provided
          scrapedAt: new Date(),
          isSelected: false, // Not selected by default
          structured: false, // Not structured yet - needs structure button click
        },
      });
      newsItems.push(newsItem);
      console.log(
        `✅ Successfully created news item: "${article.title}" (ID: ${newsItem.id})`
      );
    } catch (error) {
      console.error(
        "❌ Failed to create news item for article:",
        article.title,
        error
      );
    }
  }

  console.log("📊 Final newsItems count before return:", newsItems.length);
  return newsItems;
}

export async function POST(request: Request) {
  try {
    const { urls, dateRange, brandInstructions } = await request.json();

    console.log("🔥 Starting batch scrape for URLs:", urls.length);

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: "URLs are required" }, { status: 400 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      console.error("❌ Firecrawl API key not configured");
      return NextResponse.json(
        { error: "Firecrawl API key not configured" },
        { status: 500 }
      );
    }

    console.log("🚀 Starting Firecrawl batch scrape...");

    // Start Firecrawl batch scrape first
    const batchScrapeResponse = await fetch(
      "https://api.firecrawl.dev/v1/batch/scrape",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          urls: urls,
          formats: ["markdown"],
          onlyMainContent: true,
          removeBase64Images: true,
          blockAds: true,
        }),
      }
    );

    if (!batchScrapeResponse.ok) {
      const errorText = await batchScrapeResponse.text();

      console.log("Website atempted now: ", urls);

      console.error("❌ Failed to start batch scrape:", errorText);
      return NextResponse.json(
        { error: "Failed to start batch scrape" },
        { status: 500 }
      );
    }

    const batchScrapeResult = await batchScrapeResponse.json();

    if (!batchScrapeResult.success) {
      console.error("❌ Batch scrape failed:", batchScrapeResult);
      return NextResponse.json(
        { error: "Batch scrape failed" },
        { status: 500 }
      );
    }

    console.log(
      "✅ Firecrawl batch scrape started with ID:",
      batchScrapeResult.id
    );

    console.log("📝 Firecrawl job started:", batchScrapeResult.id);

    // Poll for completion (simplified version)
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;

      console.log(
        `⏳ Checking batch scrape status (attempt ${attempts}/${maxAttempts})`
      );

      const statusResponse = await fetch(
        `https://api.firecrawl.dev/v1/batch/scrape/${batchScrapeResult.id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error("❌ Failed to check batch scrape status");
        break;
      }

      const statusResult = await statusResponse.json();

      if (statusResult.status === "completed") {
        completed = true;
        console.log("✅ Batch scrape completed");

        // Batch scrape completed successfully

        // Process scraped content with LLM to extract articles
        const validScrapedData = statusResult.data.filter(
          (item: any) => item.markdown && item.markdown.trim().length > 0
        );

        let newsItems = [];
        if (validScrapedData.length > 0) {
          try {
            newsItems = await createPostsFromContent(
              validScrapedData,
              dateRange,
              brandInstructions
            );
          } catch (error) {
            console.error("❌ Failed to process content with LLM:", error);
            // Fallback: create basic news items without LLM processing
            for (const item of validScrapedData) {
              try {
                const title = item.metadata?.title || "Untitled Article";
                const url = item.metadata?.sourceURL || item.url || "";
                const sourceUrl = (() => {
                  try {
                    return new URL(url).hostname;
                  } catch {
                    return url;
                  }
                })();

                // Check if article with this URL already exists
                const existingArticle = await prisma.news.findFirst({
                  where: { url: url },
                });

                if (existingArticle) {
                  console.log(
                    `⚠️ Article already exists, skipping: "${title}"`
                  );
                  continue;
                }

                const newsItem = await prisma.news.create({
                  data: {
                    title: title,
                    url: url,
                    sourceUrl: sourceUrl,
                    summary: "", // Empty until structured
                    fullContent: item.markdown.substring(0, 5000),
                    isSelected: false,
                    structured: false,
                    scrapedAt: new Date(),
                  },
                });

                newsItems.push(newsItem);
              } catch (error) {
                console.error("❌ Failed to create fallback news item:", error);
              }
            }
          }
        }

        console.log(`📰 Created ${newsItems.length} news items`);

        return NextResponse.json({
          success: true,
          articleCount: newsItems.length,
        });
      } else if (statusResult.status === "failed") {
        console.error("❌ Batch scrape failed");

        // Batch scrape failed

        return NextResponse.json(
          { error: "Batch scrape failed" },
          { status: 500 }
        );
      }

      console.log(`⏳ Batch scrape status: ${statusResult.status}`);
    }

    if (!completed) {
      console.log("⏰ Batch scrape timed out, but may still be processing");
      return NextResponse.json({
        success: true,
        message:
          "Batch scrape started but timed out waiting for completion. Check back later.",
      });
    }
  } catch (error) {
    console.error("❌ Error in batch scrape:", error);
    return NextResponse.json(
      { error: "Failed to process batch scrape" },
      { status: 500 }
    );
  }
}
