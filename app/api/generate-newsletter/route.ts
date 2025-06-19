import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { newsItems, previousNewsletters } = await request.json();

    if (!newsItems || newsItems.length === 0) {
      return NextResponse.json(
        { error: "News items are required" },
        { status: 400 }
      );
    }

    // Initialize OpenAI client (can be used with OpenRouter)
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENROUTER_API_KEY
        ? "https://openrouter.ai/api/v1"
        : undefined,
    });

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured" },
        { status: 500 }
      );
    }

    // Prepare context from previous newsletters
    let previousContext = "";
    if (previousNewsletters && previousNewsletters.length > 0) {
      previousContext = `
Previous newsletter contexts (for consistency and to avoid repeating similar content):
${previousNewsletters
  .map(
    (newsletter: any, index: number) =>
      `Newsletter ${index + 1} (${
        newsletter.generatedAt
      }): ${newsletter.content.substring(0, 500)}...`
  )
  .join("\n\n")}
`;
    }

    // Prepare news items for the prompt
    const newsContent = newsItems
      .map(
        (item: any, index: number) =>
          `${index + 1}. Title: ${item.title}
   Summary: ${item.summary}
   Source: ${item.sourceUrl}
   Date: ${item.publishedAt || "Recently"}
   URL: ${item.url}`
      )
      .join("\n\n");

    const prompt = `You are a professional newsletter writer. Create a newsletter from the following news articles using this EXACT structure and style:

${previousContext}

Current news articles to include:
${newsContent}

CRITICAL INSTRUCTIONS - Follow this structure EXACTLY:

Each news item must follow this precise format:
**[Engaging Hook/Title]**: [Objective description of the news]. [Additional context or details]. Source: [Source].

Between each news item, add a blank line (---)

EXAMPLE of the EXACT structure to follow:

Next-generation Xbox is being developed by Microsoft: The company, in partnership with AMD, aims to create a gaming experience that isn't restricted to a single store or device. Additionally, the company states that it is working closely with the Windows team to consolidate the operating system as the main platform for games. The information comes from The Verge.

---

For the first time, streaming surpasses combined audience of broadcast and cable TV in the U.S.: According to a report, streaming accounted for 44.8% of all consumption in May, compared to the combined 44.2% of broadcast TV (20.1%) and cable (24.1%). Since the same period in 2021, Netflix has seen a 27% increase in viewership, while YouTube grew by over 120% and accounted for 12.5% of total TV audience last month — the highest ever reached by a single platform. No data is available for other countries. The information comes from Nielsen.

REQUIREMENTS:
1. Start each item with an engaging hook/title followed by a colon
2. Follow with objective, factual description
3. Add relevant details and context
4. End with "The information comes from [Source]."
5. NO markdown headers, bullet points, or special formatting
6. Each news item should be a single paragraph
7. Separate each news item with a blank line
8. Write in a professional, objective tone
9. Focus on facts and details, not opinions

Do NOT include:
- Newsletter title or headers
- Introduction or conclusion
- Any markdown formatting
- Bullet points or numbered lists
- Editorial commentary or opinions
- Add any fake news or misinformation or even additional information that is not in the article

Just provide the news items in the exact format shown above.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_API_KEY
        ? "anthropic/claude-4.0-sonnet"
        : "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert newsletter writer who specializes in creating concise, factual news summaries. You excel at crafting engaging hooks followed by objective, informative descriptions. You always follow the exact format specified and maintain a professional, journalistic tone.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      // max_tokens: 4000,
      temperature: 0.7,
    });

    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { error: "Failed to generate newsletter content" },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: generatedContent });
  } catch (error) {
    console.error("Error generating newsletter:", error);
    return NextResponse.json(
      { error: "Failed to generate newsletter" },
      { status: 500 }
    );
  }
}
