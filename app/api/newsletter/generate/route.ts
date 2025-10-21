import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize OpenRouter client
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
  },
});

export async function POST(request: Request) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { newsIds } = await request.json();

    if (!Array.isArray(newsIds) || newsIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty news IDs array" },
        { status: 400 }
      );
    }

    // Fetch the selected news items
    const newsItems = await prisma.news.findMany({
      where: {
        id: {
          in: newsIds,
        },
      },
      include: {
        searchTerm: {
          select: {
            term: true,
          },
        },
      },
    });

    if (newsItems.length === 0) {
      return NextResponse.json(
        { error: "No news items found with the provided IDs" },
        { status: 404 }
      );
    }

    // Create prompt for newsletter generation
    const prompt = `I'm creating a newsletter, and I need it in this format:
**[headline/hook in bold]**
[objective text in a journalism style]
["Source: "the source]

Example:
---
**Anthropic Offers Its AI to the U.S. Government for Just $1.** The creator of the Claude chatbot will provide its AI model to U.S. federal agencies for only $1 as part of a strategy to secure future contracts. The offer is framed as support for government access to the best AI tools available. Similar moves by companies like OpenAI aim to establish a foothold in the public sector as AI adoption expands. Source: Reuters.

---

**Perplexity has made a $34.5 billion bid to acquire Chrome.** Nearly twice its own market valuation, estimated at around $18 billion. This is considered an "unsolicited offer," meaning a purchase proposal made without the target company actively seeking a buyer. According to Perplexity, major investment funds have already committed to fully financing the transaction. If the deal were approved, the company plans to invest over $3 billion in the browser and the Chromium project over the next two years. Source: The Verge.

---

Important formatting rules:
* The first sentence (headline/hook) MUST be wrapped in **bold** using markdown (**text**)
* Each news item MUST be separated by a markdown horizontal line (---)
* Use proper paragraph spacing with blank lines
* NEVER use em dashes (" — ") in the text content

I've sent some complete context of other news I'd like to be added in the same format to my newsletter, please shrink the news down to this format.

News items to include:
${newsItems.map((item, index) => `
${index + 1}. Title: ${item.title}
   Summary: ${item.summary}
   URL: ${item.url}
`).join('\n')}

Please generate the newsletter content with all these news items in the specified format. Remember:
- First sentence in **bold**
- Separate each news item with ---`;

    // Generate newsletter using LLM
    const response = await openrouter.chat.completions.create({
      model: "anthropic/claude-sonnet-4.5",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from LLM");
    }

    // Generate title and subtitle suggestions based on the newsletter content
    const suggestionsPrompt = `Based on my newsletter below, please generate 5 suggestions for both titles and subtitles. They should be short and just point with few words the hot news of the day.

The subtitle should probably contain the news period.

Example title: "AWS CEO: Replacing juniors with AI is "dumbest" move / 300k Grok chats leaked / China retaliates on chips"

Example subtitle: "Nearly 300k private AI conversations leaked online, Chinese regulators strike back at "insulting" US chip comments, plus why 87% of game developers now rely on AI agents"

Newsletter content:
${content}

Please provide exactly 5 title suggestions and 5 subtitle suggestions.`;

    const suggestionsResponse = await openrouter.chat.completions.create({
      model: "anthropic/claude-sonnet-4.5",
      messages: [
        {
          role: "user",
          content: suggestionsPrompt,
        },
      ],
      temperature: 0.7,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "newsletter_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              titles: {
                type: "array",
                description: "Array of 5 title suggestions",
                items: {
                  type: "string",
                },
                minItems: 5,
                maxItems: 5,
              },
              subtitles: {
                type: "array",
                description: "Array of 5 subtitle suggestions",
                items: {
                  type: "string",
                },
                minItems: 5,
                maxItems: 5,
              },
            },
            required: ["titles", "subtitles"],
            additionalProperties: false,
          },
        },
      },
    });

    const suggestionsContent = suggestionsResponse.choices[0]?.message?.content;

    if (!suggestionsContent) {
      throw new Error("No suggestions response from LLM");
    }

    const suggestions = JSON.parse(suggestionsContent);

    // Store newsletter in database with temporary title
    const newsletter = await prisma.newsletter.create({
      data: {
        title: "Untitled Newsletter",
        subtitle: null,
        content,
        newsIds,
      },
    });

    return NextResponse.json({
      success: true,
      newsletter,
      suggestions: {
        titles: suggestions.titles,
        subtitles: suggestions.subtitles,
      },
    });
  } catch (error: unknown) {
    console.error("Error generating newsletter:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate newsletter";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
