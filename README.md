# 💰 DayBudget — Daily Budget & Expense Tracker

> **Take control of your daily spending.** DayBudget divides your available monthly income across the days of the month, helping you stay on track day-by-day with intelligent carry-over and overspend recalculation.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 🌟 The Core Idea

Most budgeting apps tell you what you spent *last month*. **DayBudget tells you what you can spend *today*.**

1. **Enter Your Monthly Baseline**: Set your monthly income, subtract fixed obligations (rent, EMIs, utilities), and choose an optional monthly savings goal (e.g. 15%).
2. **Instant Daily Budget**: The app calculates your discretionary allowance for the month and divides it evenly across all days:
   $$\text{Daily Budget} = \frac{\text{Monthly Income} - \text{Fixed Obligations} - \text{Savings Goal}}{\text{Days in Month}}$$
3. **Smart Carry-Over & Recalculation**:
   - **Under-budget**: Surplus rolls over to boost your daily allowance for remaining days (or sweeps to savings).
   - **Over-budget**: Deficit is automatically distributed across subsequent days, rebalancing your target without derailing your month.
4. **Emergency Spend Shield**: Critical unexpected costs (medical emergencies, urgent repairs) can be tagged with reasons and tracked separately so they don't unfairly penalize your everyday allowance.

---

## 🚀 Key Features

### 📊 1. Daily Budget Dashboard (`/dashboard`)
- **Today's Budget Card**: Prominent greeting card showing today's remaining allowance in real-time.
- **Dynamic Color States**: 
  - 🟢 **Green**: Safe (<80% of daily budget used)
  - 🟡 **Amber**: Caution (80%–100% used)
  - 🔴 **Red**: Over-budget (>100% used)
- **Month Overview**: Real-time counter of total spent, remaining discretionary pool, and days left in the billing cycle.

### 💳 2. Expense Logging & Categorization (`/expenses`)
- **Quick Logging**: Amount, category, payment method (UPI, Card, NetBanking, Cash), note, and date.
- **Emergency Spend Mode**: Tag sudden expenses with an emergency reason.
- **Undo Delete**: Accidental deletions can be restored within 5 seconds with an optimistic UI toast.
- **Custom Categories**: Create and color-code personalized spending categories.

### 🏦 3. Bank Account Linking & Aggregation (`/bank`)
- **Simulation Sandbox**: Connect simulated bank accounts (Demo Bank, State Bank of India, HDFC Bank, ICICI Bank, Axis Bank) with realistic masked accounts (`XXXX4829`).
- **Transaction Sync**: Pulls new simulated debits/credits automatically without duplicate creation.
- **Architecture Ready**: Uses a decoupled `BankProvider` interface ready to swap with Plaid or Account Aggregator (Setu / Finvu).

### 🔍 4. Transaction History & Re-Categorization (`/transactions`)
- **Interactive Table**: Search by merchant or description, filter by category or type (Debit/Credit).
- **Inline Re-categorization**: Change categories directly inside the table and watch analytics update immediately.
- **Multi-Format Statement Export**:
  - 📄 **Export CSV**: Instant spreadsheet download.
  - 🖨️ **Export PDF / Print**: Formatted HTML statement with financial summaries, print stylesheet, and auto-print trigger.

### 📈 5. Visual Analytics (`/analytics`)
- **Category Breakdown**: Interactive donut chart visualizing spending distribution across categories.
- **Daily Spend vs. Target**: Bar chart illustrating day-by-day expenditure compared to your daily budget ceiling.
- **Milestones & Streaks**: Tracks no-spend days streak and average daily expenditure.

### 🎯 6. Savings Goals (`/goals`)
- **Milestone Tracking**: Set targets for items like laptops, travel, or an emergency fund.
- **Fund Allocation**: Directly allocate daily surpluses toward active goals with live progress bars.
- **Goal Management**: Create, fund, and delete savings goals with complete state persistence.

### ⚙️ 7. Settings & Account Security (`/settings`)
- **Budget Tuning**: Reconfigure income, currency (₹ INR, $ USD, € EUR, £ GBP), and surplus mode.
- **Recurring Commitments**: Manage fixed expenses and due dates.
- **Security Controls**: Password change with current-password verification.
- **Danger Zone**: Irreversible account termination with cascading data cleanup.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database ORM**: [Prisma ORM 5](https://www.prisma.io/)
- **Database Engine**: [Supabase PostgreSQL](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Dark/Light Theme Support
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Authentication**: JWT Cookies + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) secure password hashing

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/likhithgp2006/DayBudget.git
cd DayBudget
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Authentication & URL
JWT_SECRET="your-secure-jwt-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Push Database Schema to Supabase
```bash
npx prisma db push
```

### 5. Run the Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

The repository contains automated unit and integration tests:

```bash
# Run Budget Engine & Overspend Logic Unit Tests
node tests/unit/budget_engine.test.js

# Run Full End-to-End API Suite
node tests/e2e/qa_runner.js
```

---

## 🚢 Deploy to Vercel

DayBudget is fully optimized for one-click deployment on [Vercel](https://vercel.com/):

1. Push your repository to GitHub.
2. Import the project in Vercel.
3. In the **Environment Variables** section, add:
   - `DATABASE_URL`: Your Supabase connection string.
   - `DIRECT_URL`: Your Supabase direct connection string.
   - `JWT_SECRET`: A long random string for cookie encryption.
   - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`).
4. Click **Deploy**! The `postinstall` hook will automatically execute `prisma generate`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
