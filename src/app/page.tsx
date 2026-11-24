'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Coins,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Lock,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LandingPage() {
  const router = useRouter()
  const [income, setIncome] = useState(100000)
  const [fixed, setFixed] = useState(40000)
  const [savingsPercent, setSavingsPercent] = useState(15)
  const [demoLoading, setDemoLoading] = useState(false)

  // Quick live interactive preview
  const savingsAmount = Math.round(income * (savingsPercent / 100))
  const pool = Math.max(0, income - fixed - savingsAmount)
  const daysInMonth = 30
  const dailyBudget = Math.round(pool / daysInMonth)

  const handleDemoLogin = async () => {
    try {
      setDemoLoading(true)
      const res = await fetch('/api/auth/demo', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        window.location.href = '/dashboard'
      } else {
        alert(data.error || 'Failed to initialize demo account. Please check your database connection.')
      }
    } catch (e: any) {
      console.error(e)
      alert(e.message || 'Network error while launching demo')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 selection:bg-teal-500/30">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
              <Coins className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              DayBudget
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2"
            >
              Sign In
            </Link>
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/25 transition-all flex items-center gap-1.5"
            >
              {demoLoading ? 'Launching...' : '1-Click Live Demo'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Modern Daily-Budget Philosophy for Financial Freedom</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Stop worrying about monthly bills.{' '}
          <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Live within your daily budget.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Enter your income, subtract rent and savings, and unlock a crystal-clear daily allowance. Spend within today's limit, let surplus roll over, and handle overspending automatically.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-xl shadow-teal-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <span>{demoLoading ? 'Starting Demo...' : 'Explore Demo Account (₹100k/mo)'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold text-base transition-all"
          >
            Create Free Account
          </Link>
        </div>

        {/* Live Interactive Budget Calculator Preview */}
        <div className="mt-16 max-w-3xl mx-auto rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Live Daily Budget Calculator
              </h2>
              <p className="text-xs text-slate-500">
                Adjust the sliders below to see your daily target in real time
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              Instant Simulation
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monthly Income
              </label>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ₹{income.toLocaleString('en-IN')}
              </div>
              <input
                type="range"
                min="30000"
                max="300000"
                step="5000"
                value={income}
                onChange={e => setIncome(Number(e.target.value))}
                className="w-full mt-2 accent-teal-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Fixed (Rent, EMIs, Bills)
              </label>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ₹{fixed.toLocaleString('en-IN')}
              </div>
              <input
                type="range"
                min="10000"
                max="150000"
                step="5000"
                value={fixed}
                onChange={e => setFixed(Number(e.target.value))}
                className="w-full mt-2 accent-teal-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Savings Goal ({savingsPercent}%)
              </label>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ₹{savingsAmount.toLocaleString('en-IN')}
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={savingsPercent}
                onChange={e => setSavingsPercent(Number(e.target.value))}
                className="w-full mt-2 accent-teal-600"
              />
            </div>
          </div>

          {/* Calculator Output Highlight Card */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-teal-900 to-navy-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold tracking-wider uppercase text-teal-300">
                Your Calculated Daily Budget
              </span>
              <div className="text-4xl sm:text-5xl font-black text-white mt-1">
                ₹{dailyBudget.toLocaleString('en-IN')}
                <span className="text-lg font-medium text-teal-200"> / day</span>
              </div>
              <p className="text-xs text-teal-200/80 mt-1">
                Discretionary monthly pool: ₹{pool.toLocaleString('en-IN')} across 30 days
              </p>
            </div>
            <button
              onClick={handleDemoLogin}
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shrink-0"
            >
              Start Tracking Today
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Built for peace of mind, not complex accounting
          </h2>
          <p className="mt-2 text-slate-500 max-w-xl mx-auto text-sm">
            Everything you need to spend guilt-free without touching your rent, EMIs, or savings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Daily Morning Target Card
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every morning starts with one clear number: "Today's budget is ₹X". No mental math, no spreadsheets.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Smart Deficit Redistribution
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Overspent on dinner with friends? DayBudget automatically deducts the deficit evenly across your remaining days.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Bank Account Aggregator
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Connect HDFC, SBI, ICICI and cards via Account Aggregator. Transactions are auto-imported and categorized into food, transport, and bills.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 DayBudget Inc. Designed with care for financial discipline & freedom.</p>
      </footer>
    </div>
  )
}
