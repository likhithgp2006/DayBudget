'use client'

import React from 'react'
import Link from 'next/link'
import { Coins, ArrowLeft, Home, HelpCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-6 shadow-xl shadow-teal-500/10">
        <Coins className="w-8 h-8" />
      </div>

      <span className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2">
        Error 404
      </span>
      <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
        Page Not Found
      </h1>
      <p className="mt-3 text-slate-500 max-w-md text-sm leading-relaxed">
        The page you are looking for doesn’t exist or has been moved. Check the URL or return to your dashboard.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
        <Link
          href="/feedback"
          className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Contact Support</span>
        </Link>
      </div>
    </div>
  )
}
