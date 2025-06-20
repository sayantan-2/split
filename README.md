# Split - Smart Bill Splitting App 💰

A modern, full-stack web application for splitting bills and managing shared expenses with friends. Built with Next.js, PostgreSQL, and powered by AI for intelligent receipt processing.

## 🚀 Features

### 🔐 Authentication & User Management
- **Secure Authentication** with NextAuth.js
- **Email/Password** registration and login
- **Google OAuth** integration (optional)
- **Username system** for easy friend discovery
- **Profile management** with customizable settings

### 👥 Friends & Social Features
- **Friend system** - Add friends by username or email
- **Friend requests** with accept/decline functionality
- **Friend search** with real-time results
- **User profiles** with avatars and activity history

### 📄 Smart Bill Processing
- **AI-powered receipt scanning** using Google Gemini
- **Intelligent expense categorization**
- **Multiple splitting methods**:
  - Split equally among friends
  - Split by custom amounts
  - Split by percentages
  - Split by shares/portions
- **Multi-currency support**
- **Tax and discount handling**

### 💻 Modern UI/UX
- **Responsive design** optimized for mobile and desktop
- **Beautiful Tailwind CSS** interface
- **Real-time updates** and interactions
- **Intuitive navigation** with bottom tab bar
- **Dark mode support** (coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, PostgreSQL
- **Authentication**: NextAuth.js with JWT sessions
- **AI**: Google Gemini API for receipt processing
- **Database**: PostgreSQL with connection pooling
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **Runtime**: Bun (recommended) or Node.js

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) or **Bun** (recommended)
- **PostgreSQL** (v12 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd split
```

### 2. Install Dependencies

Using Bun (recommended):
```bash
bun install
```

Using npm:
```bash
npm install
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d

# This will create a PostgreSQL instance with:
# - Host: localhost
# - Port: 5432
# - User: myuser
# - Password: mypassword
# - Database: mydatabase
# - Adminer UI: http://localhost:8080
```

#### Option B: Local PostgreSQL Installation
If you have PostgreSQL installed locally, create a database:
```sql
CREATE DATABASE mydatabase;
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;
```

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-key-change-this-in-production

# PostgreSQL Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydatabase

# Google Gemini AI (Optional - for receipt processing)
GOOGLE_API_KEY=your-google-gemini-api-key

# Google OAuth (Optional - for Google sign-in)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

**🔑 Important**:
- Generate a secure `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
- Get Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- For Google OAuth, create credentials at [Google Cloud Console](https://console.cloud.google.com/)

### 5. Database Schema Setup

Run the database setup script to create all required tables:

```bash
# Using Bun
bun run scripts/setup-db.js

# Using Node.js
node scripts/setup-db.js
```

This will create:
- **Users table** with username support
- **Authentication tables** for NextAuth.js
- **Friends system tables** (friendships, requests)
- **Bills and splitting tables**
- **Proper indexes** for performance

### 6. Create Test Users (Optional)

To get started quickly with sample data:

```bash
# Using Bun
bun run scripts/create-test-users.js

# Using Node.js
node scripts/create-test-users.js
```

This creates test users:
- alice@example.com / password123
- bob@example.com / password123
- carol@example.com / password123
- david@example.com / password123

### 7. Start the Development Server

```bash
# Using Bun (with Turbopack for faster builds)
bun dev

# Using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage Guide

### Getting Started
1. **Sign Up**: Create an account with email/password or Google OAuth
2. **Complete Profile**: Add your name and choose a unique username
3. **Add Friends**: Search for friends by username or email
4. **Start Splitting**: Create bills and split expenses intelligently

### Key Features

#### 🤖 AI Receipt Processing
1. Navigate to the payment section
2. Upload a receipt image or enter bill details
3. AI automatically extracts items, prices, and suggests splits
4. Review and adjust the split as needed
5. Send to friends for confirmation

#### 👥 Friend Management
- **Add Friends**: Use the search function to find friends by username
- **Manage Requests**: Accept or decline incoming friend requests
- **View History**: See past bills and transactions with each friend

#### 💰 Bill Splitting Options
- **Equal Split**: Divide the bill equally among all participants
- **Custom Amounts**: Assign specific amounts to each person
- **Percentage Split**: Split based on custom percentages
- **Share-based**: Assign shares/portions (e.g., 2 shares for John, 1 for Jane)

## 🗂️ Project Structure

```
split/
├── src/
│   ├── components/          # Reusable UI components
│   ├── lib/                # Utility functions and configurations
│   │   ├── auth.js         # Authentication helpers
│   │   ├── auth-config.js  # NextAuth.js configuration
│   │   └── db.js           # Database connection
│   ├── pages/              # Next.js pages and API routes
│   │   ├── api/            # Backend API endpoints
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── friends/    # Friend management API
│   │   │   └── ai/         # AI processing endpoints
│   │   ├── auth/           # Authentication pages
│   │   ├── friends/        # Friend management pages
│   │   └── account/        # User account pages
│   └── styles/             # Global styles and Tailwind config
├── database/               # Database schemas and migrations
├── scripts/                # Utility scripts for setup
├── doc/                    # Documentation files
└── public/                 # Static assets
```

## 🔧 Available Scripts

```bash
# Development
bun dev          # Start development server with Turbopack
npm run dev      # Start development server

# Production
bun run build    # Build for production
bun start        # Start production server

# Database
bun run scripts/setup-db.js           # Setup database schema
bun run scripts/create-test-users.js  # Create sample users
bun run scripts/test-complete-friends-workflow.js  # Test friends system

# Linting
bun run lint     # Run ESLint
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Friends Management
- `GET /api/friends` - Get user's friends list
- `POST /api/friends/add` - Send friend request
- `GET /api/friends/requests` - Get pending requests
- `GET /api/friends/search` - Search for users
- `GET /api/friends/[username]` - Get friend details

### AI Processing
- `POST /api/ai/process-gemini` - Process receipt with AI

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Sessions**: Secure session management
- **CSRF Protection**: Built-in CSRF tokens
- **Input Validation**: Server-side validation for all inputs
- **Route Protection**: Middleware for authenticated routes
- **SQL Injection Prevention**: Parameterized queries

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Manual Deployment
```bash
# Build the application
bun run build

# Start production server
bun start
```

**Important**: Ensure your production database is configured and accessible.

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check if PostgreSQL is running
docker-compose ps  # For Docker setup
pg_isready -h localhost -p 5432  # For local installation

# Test database connection
psql -h localhost -p 5432 -U myuser -d mydatabase
```

#### Missing Environment Variables
- Ensure `.env.local` file exists and contains all required variables
- Check that `NEXTAUTH_SECRET` is set and secure

#### Port Already in Use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

### Performance Tips
- Use Bun instead of npm for faster package management
- Enable Turbopack with `bun dev` for faster development builds
- Consider connection pooling for high-traffic deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [PostgreSQL](https://www.postgresql.org/) - The world's most advanced open source database
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI for intelligent receipt processing
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit

---

Built with ❤️ using Next.js and modern web technologies.
