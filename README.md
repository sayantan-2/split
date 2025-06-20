# Split - Bill Splitting App 💰

A web app for splitting bills and expenses with friends. Built with Next.js, PostgreSQL, and AI-powered receipt processing.

## Features

- **Authentication** - Email/password login and Google OAuth
- **Friends system** - Add friends and manage friend requests
- **Smart bill splitting** - AI receipt scanning with multiple split options
- **Responsive design** - Works on mobile and desktop

## Tech Stack

Next.js, PostgreSQL, NextAuth.js, Google Gemini AI, Tailwind CSS

## Quick Setup

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL
- Git

### Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd split
   bun install  # or npm install
   ```

2. **Start database**
   ```bash
   docker-compose up -d
   ```

3. **Environment setup**
   Create `.env.local`:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=myuser
   POSTGRES_PASSWORD=mypassword
   POSTGRES_DB=mydatabase

   # Optional
   GOOGLE_API_KEY=your-google-api-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Setup database**
   ```bash
   bun run scripts/setup-db.js
   bun run scripts/create-test-users.js  # Optional test data
   ```

5. **Start development server**
   ```bash
   bun dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── components/     # UI components
├── lib/           # Auth & database config
├── pages/         # Next.js pages & API routes
│   ├── api/       # Backend endpoints
│   ├── auth/      # Login/signup pages
│   └── friends/   # Friend management
└── styles/        # Tailwind CSS
```

## Available Scripts

```bash
bun dev          # Start dev server
bun run build    # Build for production
bun start        # Start production server
bun run lint     # Run linting
```

## Key API Endpoints

- `POST /api/auth/signup` - User registration
- `GET /api/friends` - Get friends list
- `POST /api/friends/add` - Send friend request
- `POST /api/ai/process-gemini` - Process receipt with AI

## Troubleshooting

**Database connection issues:**
```bash
docker-compose ps  # Check if PostgreSQL is running
```

**Port 3000 already in use:**
```bash
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
```

**Missing environment variables:**
- Make sure `.env.local` exists with all required variables
- Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

---

Built with Next.js, PostgreSQL, and modern web technologies.
