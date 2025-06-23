# Development Environment Setup Guide

This guide covers different approaches for setting up your development and production environments for the Splitwise Clone project.

## 🚀 Quick Start (Recommended for Development)

**Hybrid Development Setup** - Database in Docker, App running locally:

```bash
# 1. Start the database
docker-compose -f docker-compose.dev.yml up -d

# 2. Set up environment variables
cp .env.example .env.local

# 3. Install dependencies
bun install

# 4. Run database migrations (if any)
bun run db:push

# 5. Start development server
bun run dev
```

Your app will be available at `http://localhost:3000`

---

## 📋 Development Options

### Option 1: Hybrid Development (Recommended)

**Best for:** Daily development work, debugging, and fast iteration cycles.

This approach runs the database in Docker but your Next.js app locally for faster development.

#### Setup Steps:

1. **Start only the database:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Install dependencies:**
   ```bash
   bun install
   ```

4. **Run database migrations (if you have any):**
   ```bash
   bun run db:push
   ```

5. **Start the development server:**
   ```bash
   bun run dev
   ```

#### How Database Connection Works:
- Database runs in Docker container on port 5432
- Docker maps container port to `localhost:5432` on your machine
- Your local Next.js app connects to `DATABASE_URL=postgresql://postgres:password@localhost:5432/splitwise_db`
- ✅ **You CAN access the Docker database from your local app!**

#### Daily Development Workflow:
```bash
# Start your day
docker-compose -f docker-compose.dev.yml up -d
bun run dev

# Make code changes - they're reflected immediately with hot reload
# No need to rebuild Docker containers!

# End of day
docker-compose -f docker-compose.dev.yml down
```

#### Benefits:
- ✅ **Fast hot reload and development**
- ✅ **Direct debugging capabilities**
- ✅ **Consistent database environment**
- ✅ **Easy file editing and IDE integration**
- ✅ **No Docker rebuilds needed for code changes**

---

### Option 2: Full Docker Development

**Best for:** Testing production-like environment, team consistency, complete isolation.

Use the original `docker-compose.yml` to run everything in containers.

#### Setup Steps:

1. **Start everything (development mode):**
   ```bash
   docker-compose up --build
   ```

#### Development Workflow with Docker:
```bash
# After making code changes, you need to rebuild:
docker-compose down
docker-compose up --build

# Or rebuild specific service:
docker-compose build app
docker-compose up
```

#### Benefits:
- ✅ **Complete environment isolation**
- ✅ **Production-like setup**
- ✅ **Consistent across all team members**
- ✅ **No local dependencies needed**

#### Drawbacks:
- ❌ **Slower development cycle (rebuild needed for changes)**
- ❌ **More complex debugging**
- ❌ **File watching issues on some systems**
- ❌ **Higher resource usage**

---

### Option 3: Local Everything

**Best for:** Simple setup, no Docker dependencies, debugging database queries.

Install PostgreSQL locally and run everything on your machine.

#### Setup Steps:

1. **Install PostgreSQL locally** (Windows, macOS, or Linux)
2. **Create database:**
   ```sql
   CREATE DATABASE splitwise_db;
   CREATE USER postgres WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE splitwise_db TO postgres;
   ```
3. **Update .env.local:**
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/splitwise_db
   ```
4. **Install dependencies and run:**
   ```bash
   bun install
   bun run db:push
   bun run dev
   ```

#### Benefits:
- ✅ **Fastest development cycle**
- ✅ **Direct database access for debugging**
- ✅ **No Docker overhead**

#### Drawbacks:
- ❌ **Need to install PostgreSQL locally**
- ❌ **Less consistent across team members**
- ❌ **Database state not easily reset**

---

## 🏗️ Production Build & Deployment

### Local Production Build

Build optimized version locally:

```bash
# Create optimized production build
bun run build

# Test the production build locally
bun run start
```

### Docker Production Build

Build and run optimized version in Docker:

```bash
# Build and start production containers
docker-compose up --build

# Or build separately then start
docker-compose build
docker-compose up
```

#### Key Differences:
- **`bun run build`** = Creates optimized build locally (in `.next` folder)
- **`docker-compose up --build`** = Creates optimized build inside Docker container
- Both produce the same optimized production build, just in different environments

### Production Deployment Workflow:

```bash
# 1. Test your changes locally first (Option 1)
docker-compose -f docker-compose.dev.yml up -d
bun run dev

# 2. Create production build to test
bun run build
bun run start

# 3. Deploy with Docker (production)
docker-compose up --build -d
```

---

## 🛠️ Useful Commands

### Database Management:
```bash
# Start/stop database only
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down

# View database logs
docker-compose -f docker-compose.dev.yml logs db

# Connect to database directly
docker exec -it splitwise_clone-db-1 psql -U postgres -d splitwise_db
```

### Development:
```bash
# Install new packages
bun add package-name
bun add -d package-name  # dev dependency

# Database operations
bun run db:generate      # Generate migrations
bun run db:push         # Push schema to database
bun run db:studio       # Open Drizzle Studio

# Code quality
bun run lint            # Run ESLint
```

### Docker:
```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Remove containers and volumes
docker-compose down -v

# Rebuild specific service
docker-compose build app

# View logs
docker-compose logs app
docker-compose logs db
```

---

## 🎯 Recommended Workflow

**For Development:** Use **Option 1 (Hybrid)**
- Fast development cycles
- Easy debugging
- Consistent database

**For Production Testing:** Use **Option 2 (Full Docker)**
- Test complete containerized setup
- Verify production configuration

**Commands Summary:**
```bash
# Development (daily workflow)
docker-compose -f docker-compose.dev.yml up -d
bun run dev

# Production build testing
docker-compose up --build

# Production deployment
docker-compose up --build -d
```

This gives you the best of both worlds: **fast development** with **reliable production deployment**.
