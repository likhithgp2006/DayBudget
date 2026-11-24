'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('DayBudget Runtime Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
        <AlertCircle className="w-8 h-8" />
      </div>

      <span className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">
        Something Went Wrong
      </span>
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
        Application Error
      </h1>
      <p className="mt-3 text-slate-500 max-w-md text-sm leading-relaxed">
        An unexpected error occurred while rendering this page. Our team has been notified.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  )
}
