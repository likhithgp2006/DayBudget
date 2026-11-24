import React from 'react'

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-800 rounded-lg" />
        <div className="h-12 w-64 bg-slate-800 rounded-2xl" />
        <div className="h-4 w-48 bg-slate-800 rounded-lg" />
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full" />
      <div className="h-4 w-96 bg-slate-800 rounded-lg" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
