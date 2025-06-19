# Newsletter Generator

A modern, AI-powered newsletter generator built with Next.js that fetches news from multiple sources using Firecrawl and creates professional newsletters using OpenRouter/OpenAI.

## Features

- **URL Management**: Add and manage news source URLs
- **Intelligent News Crawling**: Uses Firecrawl's Crawl API to crawl news websites and extract articles
- **AI-Powered Content Processing**: Uses OpenRouter LLM to structure crawled content into news articles
- **AI-Powered Newsletter Generation**: Creates professional newsletters using OpenRouter/OpenAI
- **Interactive News Selection**: Click to select/deselect news items for inclusion
- **Drag & Drop Reordering**: Reorganize news items by importance
- **Markdown Editor**: Edit generated newsletters with a clean interface
- **Context-Aware Generation**: Uses previous newsletters for consistency
- **Modern UI**: Built with Shadcn/UI and Tailwind CSS
- **Database Persistence**: Stores URLs, news, and newsletters in PostgreSQL

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Shadcn/UI, Tailwind CSS, Lucide React
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: OpenRouter/OpenAI for newsletter generation
- **Web Crawling**: Firecrawl Crawl API
- **Package Manager**: Yarn

## Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL database
- Firecrawl API key
- OpenRouter API key (or OpenAI API key)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd newsletter-generator
yarn install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/newsletter_db"

# Firecrawl API (required)
FIRECRAWL_API_KEY="fc-your-firecrawl-api-key"

# OpenRouter API (required for content processing and newsletter generation)
OPENROUTER_API_KEY="sk-or-your-openrouter-key"

# Optional: Site URL for OpenRouter headers
SITE_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
yarn db:generate

# Push schema to database
yarn db:push

# Optional: Open Prisma Studio to view data
yarn db:studio
```

### 4. Run the Application

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the application.

## Usage Guide

### 1. Adding News Sources

1. Enter a news website URL in the "Manage News Sources" section
2. Optionally provide a friendly name for the source
3. Click "Add" to save the URL to your database

### 2. Crawling News

1. Set your desired date range (defaults to last 7 days)
2. Click "Start Crawl" to crawl articles from your sources
3. The system crawls each website using Firecrawl's Crawl API and processes content with OpenRouter LLM
4. You can cancel the crawl at any time using the "Cancel Crawl" button
5. News articles are saved to the database with AI-generated summaries

### 3. Selecting News for Newsletter

1. Browse the fetched news articles
2. Click on cards to select/deselect articles for your newsletter
3. Selected articles have a blue border and background
4. Use the X button to remove articles you don't want
5. Drag the grip icon to reorder articles

### 4. Generating Newsletter

1. Click "Save Selection" to persist your choices
2. Click "Generate Newsletter" to create AI-powered content
3. The system uses previous newsletters for context and consistency
4. Generated content appears in a markdown editor

### 5. Editing and Saving

1. Edit the generated newsletter in the markdown editor
2. Click "Save Newsletter" to store the final version
3. Previous newsletters are shown at the bottom for reference

## API Endpoints

- `GET /api/urls` - Fetch all saved URLs
- `POST /api/urls` - Add a new URL
- `DELETE /api/urls/[id]` - Remove a URL
- `GET /api/news` - Fetch all news items
- `POST /api/fetch-news` - Crawl news from URLs using Firecrawl and process with OpenRouter LLM
- `DELETE /api/fetch-news?jobId=<id>` - Cancel an active crawl job
- `POST /api/news/save-selection` - Save selected news items
- `GET /api/newsletters` - Fetch all newsletters
- `POST /api/newsletters` - Save a new newsletter
- `POST /api/generate-newsletter` - Generate newsletter content

## Database Schema

### URLs Table

- `id` - Unique identifier
- `url` - Website URL
- `name` - Optional friendly name
- `createdAt` - Creation timestamp

### News Table

- `id` - Unique identifier
- `title` - Article headline
- `summary` - AI-generated summary
- `url` - Direct article link
- `sourceUrl` - Source website URL
- `publishedAt` - Article publication date
- `scrapedAt` - When article was fetched
- `isSelected` - Selection status
- `order` - Display order

### Newsletters Table

- `id` - Unique identifier
- `title` - Newsletter title
- `content` - Generated content (markdown)
- `generatedAt` - Generation timestamp
- `savedAt` - Save timestamp

### Newsletter-News Junction Table

- Links newsletters to their source news articles
- Maintains article order within newsletters

## Configuration

### Firecrawl Crawl + OpenRouter Processing

The application uses a two-step process:

1. **Firecrawl Crawl API**: Crawls news websites to extract raw markdown content
2. **OpenRouter LLM Processing**: Uses AI to structure the content into articles with:
   - Article titles, summaries, and publication dates
   - Date range filtering
   - Content deduplication and quality filtering
   - Support for various news website formats

### AI Newsletter Generation

The newsletter generation uses:

- Context from previous newsletters to maintain consistency
- Custom prompts for professional newsletter formatting
- Markdown output for easy editing
- Configurable AI models via OpenRouter or OpenAI

## Customization

### Adding New UI Components

Use Shadcn/UI to add components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Modifying AI Prompts

Edit the prompt in `/app/api/generate-newsletter/route.ts` to change newsletter style and format.

### Extending Database Schema

1. Modify `prisma/schema.prisma`
2. Run `yarn db:push` to apply changes
3. Update TypeScript interfaces in components

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **API Key Issues**

   - Verify Firecrawl API key is valid
   - Check OpenRouter/OpenAI key permissions
   - Ensure environment variables are loaded

3. **News Fetching Failures**
   - Some websites may block automated scraping
   - Check Firecrawl rate limits
   - Verify URL accessibility

### Debugging

- Check browser console for frontend errors
- Monitor server logs for API issues
- Use Prisma Studio to inspect database data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review API documentation (Firecrawl, OpenRouter)
3. Open an issue on GitHub
