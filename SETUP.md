# Development Environment Setup Guide

Simple guide to get your Splitwise Clone project running locally and in production.

## 🚀 Quick Start (5 minutes)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start database
docker-compose -f docker-compose.dev.yml up -d

# 3. Install dependencies and run
bun install
bun run db:push
bun run dev
```

Your app will be available at `http://localhost:3000` ✨

---

## 📋 Choose Your Setup

<details>
<summary><strong>🔧 Option 1: Hybrid Development (Recommended)</strong></summary>

**Best for:** Daily development work and fast iteration.

Database runs in Docker, your app runs locally for hot reload.

### Setup:
```bash
# 1. Environment
cp .env.example .env

# 2. Start database only
docker-compose -f docker-compose.dev.yml up -d

# 3. Install and run
bun install
bun run db:push
bun run dev
```

### Optional - Database Management:
```bash
# In another terminal
bun run db:studio
# Access at http://localhost:4983
```

### Daily workflow:
```bash
# Start your day
docker-compose -f docker-compose.dev.yml up -d
bun run dev

# End your day
docker-compose -f docker-compose.dev.yml down
```

**✅ Benefits:** Fast hot reload, easy debugging, no rebuilds needed

</details>

<details>
<summary><strong>🐳 Option 2: Full Docker</strong></summary>

**Best for:** Production-like testing and team consistency.

Everything runs in Docker containers.

### Setup:
```bash
# 1. Environment
cp .env.example .env
# Edit .env with your values

# 2. Run everything
docker-compose up --build
```

### After code changes:
```bash
docker-compose down
docker-compose up --build
```

### Database Management:
```bash
# Option A: Run Drizzle Studio locally (recommended)
bun run db:studio
# Access at http://localhost:4983

# Option B: Direct database access
docker exec -it splitwise_clone-db-1 psql -U postgres -d splitwise_db
```

**✅ Benefits:** Complete isolation, production-like environment
**❌ Drawbacks:** Slower development, rebuilds needed for changes

</details>

<details>
<summary><strong>💻 Option 3: Local Everything</strong></summary>

**Best for:** No Docker dependencies, fastest development.

PostgreSQL and app both run locally.

### Setup:
```bash
# 1. Install PostgreSQL locally
# Windows: Download from postgresql.org
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql

# 2. Create database
psql -U postgres
CREATE DATABASE splitwise_db;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE splitwise_db TO postgres;
\q

# 3. Environment and run
cp .env.example .env
# Edit DATABASE_URL if needed
bun install
bun run db:push
bun run dev
```

**✅ Benefits:** Fastest development, no Docker overhead
**❌ Drawbacks:** Need PostgreSQL installed, less consistent setup

</details>

---

## 🚀 Production Deployment

<details>
<summary><strong>🏗️ Production Build & Deploy</strong></summary>

### Local Production Test:
```bash
# Test production build locally
bun run build
bun run start
```

### Docker Production Deploy:
```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with production values:
# - NODE_ENV=production
# - Real NEXTAUTH_SECRET
# - Production NEXTAUTH_URL
# - Production DATABASE_URL

# 2. Deploy
docker-compose up --build -d
```

### Environment Variables for Production:
```bash
# Required production values in .env:
DATABASE_URL=postgresql://postgres:password@db:5432/splitwise_db
NODE_ENV=production
NEXTAUTH_SECRET=your-real-secret-here-64-chars-long
NEXTAUTH_URL=https://yourdomain.com
```

</details>

---

## 🛠️ Useful Commands

<details>
<summary><strong>📊 Database Commands</strong></summary>

```bash
# Database operations
bun run db:generate    # Generate migrations
bun run db:push       # Push schema changes
bun run db:studio     # Open Drizzle Studio

# Docker database
docker-compose -f docker-compose.dev.yml up -d    # Start DB
docker-compose -f docker-compose.dev.yml down     # Stop DB
docker-compose -f docker-compose.dev.yml logs db  # View logs

# Direct database access
docker exec -it splitwise_clone-db-1 psql -U postgres -d splitwise_db
```

</details>

<details>
<summary><strong>🐳 Docker Commands</strong></summary>

```bash
# Container management
docker ps                    # View running containers
docker ps -a                 # View all containers
docker-compose down -v       # Stop and remove volumes
docker-compose logs app      # View app logs
docker-compose logs db       # View database logs

# Rebuilding
docker-compose build app     # Rebuild app only
docker-compose up --build    # Rebuild and start
```

</details>

<details>
<summary><strong>📦 Development Commands</strong></summary>

```bash
# Package management
bun add package-name         # Install package
bun add -d package-name      # Install dev dependency
bun install                  # Install all dependencies

# Code quality
bun run lint                 # Run ESLint
bun run build               # Create production build
bun run start               # Start production server
```

</details>

---

## 🎯 Which Option Should I Choose?

- **New to project?** → Start with **Option 1 (Hybrid)**
- **Team development?** → Use **Option 1 (Hybrid)** for daily work
- **Testing deployment?** → Use **Option 2 (Full Docker)**
- **No Docker?** → Use **Option 3 (Local Everything)**

**Most developers use Option 1 for development and Option 2 for production testing.** 🚀
