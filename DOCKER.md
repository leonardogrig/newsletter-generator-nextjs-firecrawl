# Docker Setup Guide

This guide explains how to run the Newsletter Generator using Docker, which eliminates the need to manually install PostgreSQL or manage database configurations.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)
- API keys for Firecrawl and OpenRouter

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd newsletter-generator-nextjs-firecrawl
```

### 2. Set Up Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API keys:

```env
# Required API Keys
FIRECRAWL_API_KEY="fc-your-firecrawl-api-key-here"
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-api-key-here"

# Optional (defaults shown)
OPENROUTER_MODEL="anthropic/claude-sonnet-4.5"
SITE_URL="http://localhost:3000"
```

**Note:** When using Docker, you DON'T need to set `DATABASE_URL` in the `.env` file. It's automatically configured in `docker-compose.yml`.

### 3. Start the Application

Start both the database and application with a single command:

```bash
docker-compose up -d
```

This will:
- Pull the PostgreSQL image
- Build your Next.js application
- Start both services
- Run database migrations automatically

### 4. Access the Application

- **Application**: http://localhost:3000
- **Database**: localhost:5544
  - User: `postgres`
  - Password: `postgres`
  - Database: `newsletter_generator`

## Common Commands

### View Logs

```bash
# View all logs
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# View database logs only
docker-compose logs -f db
```

### Stop the Application

```bash
# Stop services (keeps data)
docker-compose down

# Stop services and remove volumes (deletes all data)
docker-compose down -v
```

### Restart the Application

```bash
docker-compose restart
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

### Run Database Commands

```bash
# Generate Prisma Client
docker-compose exec app npx prisma generate

# Push schema changes to database
docker-compose exec app npx prisma db push

# Open Prisma Studio
docker-compose exec app npx prisma studio
```

## Database Access

The PostgreSQL database is exposed on port `5544` of your host machine. You can connect to it using any PostgreSQL client:

- **Host**: localhost
- **Port**: 5544
- **User**: postgres
- **Password**: postgres
- **Database**: newsletter_generator

### Using psql

```bash
psql -h localhost -p 5544 -U postgres -d newsletter_generator
```

### Using GUI Tools

You can use tools like:
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)
- [TablePlus](https://tableplus.com/)

## Troubleshooting

### Port Already in Use

If you get an error about ports 3000 or 5544 being in use:

1. **Find what's using the port:**
   ```bash
   # On macOS/Linux
   lsof -i :3000
   lsof -i :5544

   # On Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :5544
   ```

2. **Change the port in docker-compose.yml:**
   ```yaml
   ports:
     - "3001:3000"  # Use port 3001 instead of 3000
     - "5545:5432"  # Use port 5545 instead of 5544
   ```

### Database Connection Issues

If the app can't connect to the database:

1. Check if the database is healthy:
   ```bash
   docker-compose ps
   ```

2. View database logs:
   ```bash
   docker-compose logs db
   ```

3. Restart the services:
   ```bash
   docker-compose restart
   ```

### Reset Everything

To completely reset and start fresh:

```bash
# Stop and remove everything
docker-compose down -v

# Remove the built images
docker-compose rm -f

# Rebuild and start
docker-compose up -d --build
```

## Data Persistence

Your database data is stored in a Docker volume named `newsletter-generator-nextjs-firecrawl_postgres_data`. This means:

- Data persists across container restarts
- Data survives `docker-compose down`
- Data is only deleted with `docker-compose down -v`

## Production Deployment

For production deployment, you should:

1. Change the database password in `docker-compose.yml`
2. Use environment-specific `.env` files
3. Enable SSL for the database connection
4. Set up proper backup strategies
5. Consider using managed database services (AWS RDS, Supabase, etc.)

## Architecture

```
┌─────────────────────────────────────┐
│  Host Machine                       │
│                                     │
│  localhost:3000 ──────┐            │
│  localhost:5544 ───┐  │            │
└────────────────────┼──┼─────────────┘
                     │  │
         ┌───────────┘  └──────────┐
         │                         │
    ┌────▼─────┐            ┌──────▼──────┐
    │   db     │            │     app     │
    │          │◄───────────┤             │
    │ Postgres │  port 5432 │  Next.js    │
    │          │            │             │
    └──────────┘            └─────────────┘
         │
         │
    ┌────▼──────────┐
    │  postgres_data│
    │    (volume)   │
    └───────────────┘
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
