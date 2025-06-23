# 📧 AI Newsletter Generator

> Transform news websites into professional newsletters with AI-powered content processing and intelligent article curation.

A modern, intelligent newsletter generator that automatically crawls news websites, processes content with AI, and creates professional newsletters. Built with Next.js, it features drag-and-drop article management, AI-powered content generation, and a beautiful, responsive interface.

## ✨ Features

- **🌐 Smart Web Crawling**: Automatically crawl news websites using Firecrawl API
- **🤖 AI Content Processing**: Extract and structure articles with OpenRouter/OpenAI
- **📊 Brand Relevance Scoring**: AI rates articles based on your brand context (0-10 scale)
- **🎯 Intelligent Article Selection**: Click to select/deselect articles for newsletters
- **📱 Drag & Drop Interface**: Reorder articles by importance with intuitive controls
- **✏️ Markdown Editor**: Edit generated newsletters with live preview
- **📈 Context-Aware Generation**: Uses previous newsletters for consistency
- **🎨 Modern UI**: Beautiful interface built with Shadcn/UI and Tailwind CSS
- **💾 Database Persistence**: Stores all data in PostgreSQL with Prisma ORM

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Shadcn/UI, Tailwind CSS, Lucide React Icons
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: OpenRouter (Claude/GPT) or OpenAI for content generation
- **Web Scraping**: Firecrawl API for intelligent web crawling
- **Package Manager**: Yarn

## 📋 Prerequisites

Before you begin, you'll need:

- A computer running Windows, macOS, or Linux
- Internet connection
- A PostgreSQL database (we'll help you set this up)
- API keys for Firecrawl and OpenRouter/OpenAI (we'll guide you through this)

## 🚀 Installation Guide

### Step 1: Install Node.js and npm

Node.js is a JavaScript runtime that lets you run this application. npm comes bundled with Node.js.

#### Windows

1. Visit [Node.js official website](https://nodejs.org/)
2. Download the "LTS" version (recommended for most users)
3. Run the downloaded installer (.msi file)
4. Follow the installation wizard (accept all default settings)
5. Open Command Prompt and verify installation:
   ```cmd
   node --version
   npm --version
   ```

#### macOS

**Option 1: Direct Download**

1. Visit [Node.js official website](https://nodejs.org/)
2. Download the "LTS" version
3. Open the downloaded .pkg file and follow the installer

**Option 2: Using Homebrew (if you have it)**

```bash
brew install node
```

**Verification:**

```bash
node --version
npm --version
```

#### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

#### Linux (CentOS/RHEL/Fedora)

```bash
# For CentOS/RHEL
sudo yum install nodejs npm

# For Fedora
sudo dnf install nodejs npm

# Verify installation
node --version
npm --version
```

### Step 2: Install Yarn

Yarn is a package manager that's faster and more reliable than npm for this project.

#### All Platforms

```bash
npm install -g yarn
```

Verify installation:

```bash
yarn --version
```

### Step 3: Set Up PostgreSQL Database

You have several options for PostgreSQL:

#### Option A: Local Installation

**Windows:**

1. Download from [PostgreSQL official site](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Remember your password for the 'postgres' user
4. Default port is usually 5432

**macOS:**

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database
createdb newsletter_db
```

**Linux:**

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb newsletter_db
```

#### Option B: Cloud Database (Easier)

- **Supabase** (Free tier): [supabase.com](https://supabase.com/)
- **Railway** (Free tier): [railway.app](https://railway.app/)
- **Neon** (Free tier): [neon.tech](https://neon.tech/)
- **ElephantSQL** (Free tier): [elephantsql.com](https://elephantsql.com/)

Choose any of these, create an account, create a PostgreSQL database, and copy the connection string.

### Step 4: Get API Keys

#### Firecrawl API Key (Required)

1. Visit [Firecrawl](https://firecrawl.dev/)
2. Sign up for an account
3. Go to your dashboard
4. Copy your API key (starts with `fc-`)

#### OpenRouter API Key (Recommended)

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Go to "Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-or-`)

**Alternative: OpenAI API Key**

1. Visit [OpenAI](https://platform.openai.com/)
2. Sign up and add billing information
3. Go to API keys section
4. Create new key
5. Copy the key (starts with `sk-`)

### Step 5: Clone and Set Up the Project

1. **Download the project:**

   ```bash
   git clone <your-repo-url>
   cd newsletter-generator
   ```

   _If you don't have git, download the ZIP file from GitHub and extract it._

2. **Install dependencies:**

   ```bash
   yarn install
   ```

   _This will download all required packages. It may take a few minutes._

3. **Create environment file:**

   Create a file named `.env.local` in the project root folder with the following content:

   ```env
   # Database Connection
   DATABASE_URL="postgresql://username:password@localhost:5432/newsletter_db"

   # Replace with your actual values:
   # For local PostgreSQL: postgresql://postgres:yourpassword@localhost:5432/newsletter_db
   # For cloud database: use the connection string from your provider

   # API Keys
   FIRECRAWL_API_KEY="fc-your-firecrawl-api-key-here"
   OPENROUTER_API_KEY="sk-or-your-openrouter-key-here"

   # Optional: If using OpenAI instead of OpenRouter
   # OPENAI_API_KEY="sk-your-openai-key-here"

   # Optional: Your site URL (for API headers)
   SITE_URL="http://localhost:3000"
   ```

4. **Set up the database:**

   ```bash
   # Generate Prisma client
   yarn db:generate

   # Create database tables
   yarn db:push
   ```

5. **Start the application:**

   ```bash
   yarn dev
   ```

   The application will be available at: [http://localhost:3000](http://localhost:3000)

## 📚 How to Use

### 1. 🌐 Add News Sources

1. **Open the application** in your web browser
2. **Expand "Manage News Sources"** section
3. **Add URLs** of news websites you want to monitor:
   - Enter the main URL (e.g., `https://techcrunch.com`)
   - Optionally give it a friendly name
   - Click "Add URL"
4. **Examples of good news sources:**
   - Technology: `https://techcrunch.com`, `https://arstechnica.com`
   - Business: `https://reuters.com`, `https://bloomberg.com`
   - General: `https://bbc.com/news`, `https://cnn.com`

### 2. 🎯 Set Brand Context (Optional but Recommended)

1. **Expand "Brand Instructions"** section
2. **Describe your brand/interests:**
   ```
   Example: "Focus on AI and machine learning technologies,
   startup news, and tech industry trends. Particularly
   interested in B2B SaaS, developer tools, and enterprise AI."
   ```
3. **Save** your brand context
4. The AI will use this to score article relevance (0-10 scale)

### 3. 📅 Fetch News Articles

1. **Set date range** (defaults to last 7 days)
2. **Click "Start Crawl"** to begin fetching articles
3. **Monitor progress** in the dialog that appears
4. **Wait for completion** (usually 2-5 minutes depending on sources)
5. Articles will appear in the "Scraped Articles" section

### 4. ⚡ Process Articles with AI

1. **Browse the scraped articles** in the grid view
2. **Click "Structure"** on articles you're interested in
3. The AI will:
   - Extract clean titles and summaries
   - Determine publication dates
   - Score brand relevance (if context provided)
4. **Structured articles become "active"** and move to the top

### 5. 📝 Select Articles for Newsletter

1. **Active articles** (those processed by AI) appear first with green badges
2. **Click on article cards** to select/deselect them
3. **Selected articles** get blue borders and are included in generation
4. **Use sorting options:**
   - Date (Recent to Old / Old to Recent)
   - Brand Score (High to Low / Low to High)

### 6. 🤖 Generate Newsletter

1. **Ensure you have selected articles** (blue bordered cards)
2. **Click "Generate Newsletter"**
3. **Wait for AI processing** (30-60 seconds)
4. **Review generated content** in the markdown editor
5. **Edit if needed** - you can modify the content directly

### 7. 💾 Save and Manage

1. **Click "Save Newsletter"** to store the final version
2. **View previous newsletters** at the bottom of the page
3. **Copy content** to clipboard for external use
4. **Delete old newsletters** if needed

## ⚙️ Advanced Configuration

### Database Management

View your data using Prisma Studio:

```bash
yarn db:studio
```

This opens a web interface at [http://localhost:5555](http://localhost:5555) where you can:

- View all stored URLs, articles, and newsletters
- Edit data directly
- Monitor database performance

### API Configuration

The application supports both OpenRouter and OpenAI:

**OpenRouter (Recommended)**:

- More models available (Claude, GPT, etc.)
- Often cheaper than direct OpenAI
- Better for experimentation

**OpenAI Direct**:

- Direct access to GPT models
- Requires billing setup
- May have better response times

### Customizing the UI

The application uses Shadcn/UI components. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

Available components: button, card, dialog, input, select, textarea, etc.

## 🔧 Troubleshooting

### Common Issues

**Database Connection Errors:**

- Ensure PostgreSQL is running
- Check your `DATABASE_URL` in `.env.local`
- Verify database exists and credentials are correct

**API Key Issues:**

- Confirm API keys are correctly set in `.env.local`
- Check that keys haven't expired
- Ensure sufficient credits/quota

**Yarn Installation Problems:**

```bash
# Clear yarn cache
yarn cache clean

# Remove node_modules and reinstall
rm -rf node_modules
yarn install
```

**Port Already in Use:**

```bash
# Kill process on port 3000
npx kill-port 3000

# Or run on different port
yarn dev -p 3001
```

### Getting Help

1. **Check the browser console** (F12) for error messages
2. **Review the terminal output** where you ran `yarn dev`
3. **Verify all environment variables** are set correctly
4. **Test API keys** with simple curl commands
5. **Ensure database is accessible** and tables exist

## 📊 Database Schema

The application uses 6 main data models:

- **URLs**: Stores news source websites
- **News**: Individual articles with AI processing status
- **Newsletters**: Generated newsletter content
- **NewsletterNews**: Links articles to newsletters
- **BatchScrape**: Tracks crawling operations
- **BrandContext**: Stores brand instructions for AI scoring

## 🚀 Deployment

### Local Production Build

```bash
# Build for production
yarn build

# Start production server
yarn start
```

### Cloud Deployment

The application can be deployed to:

- **Vercel**: [vercel.com](https://vercel.com/) (Recommended for Next.js)
- **Netlify**: [netlify.com](https://netlify.com/)
- **Railway**: [railway.app](https://railway.app/)
- **Heroku**: [heroku.com](https://heroku.com/)

Remember to:

1. Set environment variables in your hosting platform
2. Ensure your database is accessible from the cloud
3. Update `SITE_URL` to your domain

## 📄 Available Scripts

```bash
# Development
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run code linting

# Database
yarn db:generate  # Generate Prisma client
yarn db:push      # Apply schema changes
yarn db:studio    # Open database browser
```

## 🤝 Support

If you encounter issues:

1. **Check this README** for common solutions
2. **Verify all prerequisites** are properly installed
3. **Ensure API keys and database** are correctly configured
4. **Check the application logs** for specific error messages

## 📈 Tips for Best Results

1. **Choose quality news sources** with consistent formatting
2. **Write detailed brand context** for better AI scoring
3. **Process articles regularly** to build a good content library
4. **Review and edit** AI-generated content before publishing
5. **Use date ranges strategically** to avoid duplicate content
6. **Monitor API usage** to stay within limits

---

**Ready to create amazing newsletters?** Follow the installation steps above and start building your AI-powered newsletter generator today! 🚀
