# 💰 Splitwise Clone

A modern expense splitting application built with Next.js, allowing you to easily track shared expenses and settle up with friends, family, and roommates.

## ✨ Features

- 👥 **Group Management** - Create and manage expense groups
- 💸 **Split Expenses** - Split bills equally or by custom amounts
- 📊 **Balance Tracking** - Keep track of who owes what
- 🔐 **Secure Authentication** - User registration and login
- 📱 **Responsive Design** - Works on desktop and mobile
- 🐳 **Docker Ready** - Easy deployment with Docker

## 🚀 Quick Start (5 minutes)

```bash
# 1. Clone and setup
git clone https://github.com/sayantan-2/split.git
cd splitwise-clone
cp .env.example .env

# 2. Start database
docker-compose -f docker-compose.dev.yml up -d

# 3. Install and run
bun install
bun run db:push
bun run dev
```

Visit `http://localhost:3000` and start splitting expenses! 🎉

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, NextAuth.js
- **Database:** PostgreSQL with Drizzle ORM
- **Runtime:** Bun
- **Deployment:** Docker & Docker Compose

## 📖 Documentation

For detailed setup instructions, deployment guides, and development options:

👉 **[Read the Setup Guide](./Docs/SETUP.md)**

The setup guide covers:
- Multiple development environments (hybrid, Docker, local)
- Production deployment
- Database management
- Troubleshooting tips

## 🔧 Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Create production build
bun run start        # Start production server
bun run lint         # Run ESLint
bun run db:push      # Push database schema
bun run db:studio    # Open Drizzle Studio
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License - see the [LICENSE](LICENSE) file for details.

**Note:** This project is for educational and personal use only. Commercial use is not permitted.

## 🙏 Acknowledgments

- Inspired by [Splitwise](https://www.splitwise.com/)
- Built with [Next.js](https://nextjs.org/)
- Database powered by [Drizzle ORM](https://orm.drizzle.team/)

---

**Need help?** Check out the [Setup Guide](./SETUP.md) or open an issue!
