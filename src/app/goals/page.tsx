'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import {
  Target,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  TrendingUp,
  X,
  Coins,
  ShieldCheck,
  Laptop,
  Plane,
  Trash2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('INR')

  // Create Goal Modal
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Add Funds Modal
  const [fundModalGoal, setFundModalGoal] = useState<any>(null)
  const [addFundsAmount, setAddFundsAmount] = useState('')
  const [funding, setFunding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteGoal = async (goalId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete goal "${title}"?`)) return
    try {
      setDeletingId(goalId)
      const res = await fetch(`/api/goals?id=${goalId}`, { method: 'DELETE' })
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/goals')
      const data = await res.json()
      if (data.goals) setGoals(data.goals)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user?.currency) setCurrency(d.user.currency)
      })
  }, [])

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !targetAmount) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        }),
      })

      if (res.ok) {
        setTitle('')
        setTargetAmount('')
        setCurrentAmount('')
        setTargetDate('')
        setCreateOpen(false)
        fetchGoals()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fundModalGoal || !addFundsAmount) return
    try {
      setFunding(true)
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: fundModalGoal.id,
          addAmount: parseFloat(addFundsAmount),
        }),
      })

      if (res.ok) {
        setFundModalGoal(null)
        setAddFundsAmount('')
        fetchGoals()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFunding(false)
    }
  }

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Savings Goals Tracker
            </h1>
            <p className="text-xs text-slate-500">
              Set ambitious milestones and allocate daily surpluses directly toward your dreams
            </p>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Goal</span>
          </button>
        </div>

        {/* Total Progress Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-navy-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Cumulative Goals Progress
            </span>
            <div className="text-3xl sm:text-4xl font-black">
              {formatCurrency(totalSaved, currency)}
              <span className="text-sm font-medium text-slate-400"> of {formatCurrency(totalTarget, currency)}</span>
            </div>
            <p className="text-xs text-teal-200/80">
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% of all milestone targets achieved
            </p>
          </div>

          <div className="w-full md:w-64 space-y-2">
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400">Loading goals...</div>
          ) : goals.length === 0 ? (
            <div className="col-span-full py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Target className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No savings goals created yet</p>
              <p className="text-xs text-slate-400">Add a goal like &ldquo;MacBook Pro&rdquo; or &ldquo;Vacation Trip&rdquo;.</p>
            </div>
          ) : (
            goals.map(goal => {
              const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

              return (
                <div
                  key={goal.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-bold">
                          {goal.title.includes('MacBook') || goal.title.includes('Laptop') ? (
                            <Laptop className="w-5 h-5" />
                          ) : goal.title.includes('Trip') || goal.title.includes('Vacation') ? (
                            <Plane className="w-5 h-5" />
                          ) : (
                            <ShieldCheck className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {goal.title}
                          </h3>
                          {goal.targetDate && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>By {new Date(goal.targetDate).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {goal.isCompleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                          {percent}%
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(goal.currentAmount, currency)}
                      </div>
                      <p className="text-xs text-slate-400">
                        Target: {formatCurrency(goal.targetAmount, currency)} • Remaining: {formatCurrency(remaining, currency)}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFundModalGoal(goal)
                        setAddFundsAmount('')
                      }}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-500" />
                      <span>Allocate Funds</span>
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id, goal.title)}
                      disabled={deletingId === goal.id}
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Create Goal Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Create Savings Goal
              </h3>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Laptop, Vacation Trip"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  placeholder="60000"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Initial Saved Amount (Optional)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={currentAmount}
                  onChange={e => setCurrentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                >
                  {submitting ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Funds Modal */}
      {fundModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add Funds: {fundModalGoal.title}
              </h3>
              <button onClick={() => setFundModalGoal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Amount to Allocate (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  placeholder="e.g. 5000"
                  value={addFundsAmount}
                  onChange={e => setAddFundsAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFundModalGoal(null)}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={funding}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                >
                  {funding ? 'Saving...' : 'Add to Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
