# InsightDash Deployment Guide

## Production Stack

| Component      | Service          | Plan   | Notes                           |
|----------------|------------------|--------|---------------------------------|
| Web Service    | Render.com       | Free   | Node.js, auto-deploy from GitHub |
| Database       | Render PostgreSQL | Free   | 1 GB storage, 30-day expiry     |
| Source Code    | GitHub           | Public | AI-Ying/insightdash              |

## Live URL

- **Production**: https://insightdash-faa2.onrender.com
- **Repository**: https://github.com/AI-Ying/insightdash

## Environment Variables

The following environment variables must be configured in the Render dashboard:

| Variable          | Description                          | Example                                      |
|-------------------|--------------------------------------|----------------------------------------------|
| `DATABASE_URL`    | PostgreSQL connection string (internal) | `postgresql://user:pass@host/dbname`        |
| `NEXTAUTH_SECRET` | JWT signing secret                   | `openssl rand -base64 32`                    |
| `NEXTAUTH_URL`    | Public URL of the application        | `https://insightdash-faa2.onrender.com`      |
| `PORT`            | Application port (auto-set by Render) | `10000`                                     |

Optional (for OAuth):

| Variable              | Description              |
|-----------------------|--------------------------|
| `GITHUB_CLIENT_ID`    | GitHub OAuth App ID      |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret |

## Build & Start Commands

Configured in Render Web Service settings:

- **Build Command**: `npm install; npm run build`
- **Start Command**: `npm run start`

The `npm run build` script runs:
```
prisma generate && prisma db push && next build
```

This ensures:
1. Prisma Client is generated
2. Database schema is pushed (tables created/updated)
3. Next.js application is built

## Deployment Flow

### Initial Setup

1. Create a PostgreSQL database on Render (Free tier)
2. Create a Web Service on Render, connect to the GitHub repo (Public Git Repository)
3. Set environment variables (DATABASE_URL using Internal Database URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
4. Deploy - Render will clone, build, and start the application

### Auto-Deploy

Since we use Public Git Repository mode, auto-deploy is not available. Use **Manual Deploy** in the Render dashboard after pushing to GitHub, or set up a Blueprint for auto-deploy.

### Manual Deploy Steps

1. Push code to GitHub: `git push origin master`
2. Go to Render dashboard > insightdash service
3. Click "Manual Deploy" > "Deploy latest commit"

## Local Development

```bash
# Install dependencies
npm install

# Set up local environment
cp .env.example .env.local
# Edit .env.local with your database URL

# Push database schema
npx prisma db push

# Start dev server
npm run dev
```

For local development, you can use either:
- A local PostgreSQL instance
- The Render external database URL (for shared dev)

## Important Notes

- **Free tier spin-down**: Render free instances spin down after 15 minutes of inactivity. First request after spin-down takes ~50 seconds.
- **Database expiry**: Free PostgreSQL databases expire after 30 days. Upgrade to a paid plan for persistence.
- **Database URL**: Use the **Internal Database URL** for the web service (faster, same-region communication). Use **External Database URL** only for local development or external tools.
