# Vote for Bella

An automated voting system built with Next.js that uses temporary email addresses to cast votes. Features a real-time dashboard and automated cron job voting.

## Features

- 🗳️ **Automated Voting**: Fully automated vote casting with email verification
- 📧 **Temporary Emails**: Uses Flash Temp Mail API for disposable email addresses  
- 🤖 **Puppeteer Automation**: Headless browser automation for form filling and verification
- ⏰ **Cron Jobs**: Automated voting every 5 minutes (10% chance)
- 📊 **Live Dashboard**: Real-time vote tracking and statistics
- 💾 **Redis Storage**: Persistent vote storage using Redis
- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS

## Architecture

### Vote Flow
1. Creates temporary email address via RapidAPI
2. Opens voting page with Puppeteer
3. Fills form and submits
4. Fetches verification code from email
5. Enters code and completes vote
6. Saves to Redis storage
7. Updates dashboard in real-time

### Cron Job
- Runs every 5 minutes via Vercel Cron
- 1 in 10 chance (10%) of triggering a vote
- Secured with `CRON_SECRET` authentication

## Getting Started

### Prerequisites
- Node.js 20+
- Redis server (local or hosted)
- Vercel account (for deployment)
- RapidAPI account (Flash Temp Mail API)

### Installation

```bash
npm install
```

### Environment Variables

Required variables:
- `RAPIDAPI_KEY` - Your RapidAPI key
- `RAPIDAPI_HOST` - flash-temp-mail.p.rapidapi.com
- `CRON_SECRET` - Secure random string for cron auth
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)

### Local Redis Setup

**Option 1: Docker**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Option 2: Install locally**
```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Production Redis

For Vercel deployment, use a hosted Redis service:
- **Upstash** (recommended): Free tier available, optimized for serverless
- **Redis Cloud**: Redis Labs managed service
- **AWS ElastiCache**: If using AWS infrastructure

Add the `REDIS_URL` to your Vercel environment variables.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
