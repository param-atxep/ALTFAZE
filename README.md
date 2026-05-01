<img src="https://altfaze.in/logo.png" alt="ALTFaze Logo" width="50" height="50">

# ALTFaze - Global Freelancer Marketplace

A modern, production-ready freelancer marketplace for developers, designers, and businesses. Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🌟 About ALTFaze

ALTFaze connects businesses with top freelance talent from around the world. Whether you're a startup, agency, or enterprise, find the perfect freelancers for your projects. If you're a freelancer, showcase your skills and build your career on a trusted global platform.

## 🚀 Features

- **Hire Top Talent:** Post projects and receive proposals from verified freelancers worldwide
- **Premium Templates Marketplace:** Browse and purchase high-quality website templates
- **Secure Escrow Payments:** Milestone-based payment system with automatic fund protection
- **Real-time Collaboration:** Built-in messaging and project management tools
- **Verified Profiles:** Browse portfolios, ratings, and verified credentials
- **Secure Authentication:** NextAuth.js with email and OAuth integration
- **Advanced Search:** Filter freelancers by skills, experience, and ratings
- **Wallet System:** Manage funds with transparent transaction history
- **Project Analytics:** Track project progress and completion metrics

## 🛠️ Tech Stack

* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript (Strict mode)
* **Styling:** Tailwind CSS
* **Database:** PostgreSQL with Prisma ORM
* **Authentication:** NextAuth.js
* **UI Components:** Shadcn/ui, Magic UI, Aceternity UI
* **Forms:** React Hook Form
* **State Management:** React Context, Server Components
* **Validation:** Zod

## 📋 Installation

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Git

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/param-atxep/altfaze.git
   cd altfaze
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables (.env.local):**
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/altfaze"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # App
   NEXT_PUBLIC_APP_NAME="ALTFaze"
   NEXT_PUBLIC_APP_DOMAIN="altfaze.in"
   
   # OAuth (Optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database:**
   ```bash
   npx prisma migrate dev
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (main)/         # Main marketplace routes
│   ├── (marketing)/    # Public marketing pages
│   ├── auth/           # Authentication pages
│   └── api/            # API routes
├── components/         # Reusable React components
├── lib/               # Utilities and helpers
├── actions/           # Server actions
├── types/             # TypeScript type definitions
└── styles/            # Global styles
prisma/                 # Database schema
```

## 🔐 Authentication

ALTFaze uses **NextAuth.js** for authentication supporting:

- **Email/Password:** Secure credential-based login
- **Google OAuth:** One-click sign-in with Google
- **Password Reset:** Secure token-based password recovery

## 👥 User Roles

### Client
- Post projects and manage them
- Browse and hire freelancers
- Access project dashboard
- Make payments securely

### Freelancer
- Browse available projects
- Submit proposals with custom bids
- Showcase portfolio and skills
- Track earnings and ratings

## 💳 Payment System

- **Escrow Protection:** Funds held securely until project completion
- **Milestone Payments:** Release funds for completed milestones
- **Wallet System:** Manage account balance and transactions
- **Transparent Fees:** Clear fee structure with no hidden charges

## 📊 Database Schema

Key models:
- **User:** User accounts with roles and profiles
- **Project:** Project listings created by clients
- **Proposal:** Freelancer bids on projects
- **Order:** Accepted project engagements
- **Wallet:** User fund management
- **Transaction:** Payment history

## 🔗 Important Links

- **Website:** [altfaze.in](https://altfaze.in)
- **GitHub:** [github.com/param-atxep/altfaze](https://github.com/param-atxep/altfaze)
- **Support Email:** support@altfaze.in

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Param Shelke - ALTFaze

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Bug Reports & Feature Requests

Please use [GitHub Issues](https://github.com/param-atxep/altfaze/issues) to report bugs or request features.

## 📧 Contact

- **Email:** support@altfaze.in
- **GitHub:** [@param-atxep](https://github.com/param-atxep)

---

Built with ❤️ by **Param Shelke**  
ALTFaze - Connect. Collaborate. Create.
