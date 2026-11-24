'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/AppLayout'
import {
  Sparkles,
  Plus,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet,
  Clock,
  TrendingDown,
  TrendingUp,
  Landmark,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Receipt,
  Trash2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncingBank, setSyncingBank] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/budget/summary')
      const json = await res.json()

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!json.hasSetupBudget) {
        router.push('/onboarding')
        return
      }

      setData(json)
    } catch (err: any) {
      console.error(err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchDashboardData()

    const handleRefresh = () => {
      fetchDashboardData()
    }
    window.addEventListener('daybudget:refresh', handleRefresh)
    return () => window.removeEventListener('daybudget:refresh', handleRefresh)
  }, [fetchDashboardData])

  const handleBankSync = async () => {
    try {
      setSyncingBank(true)
      setSyncMessage('')
      const res = await fetch('/api/bank/sync', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setSyncMessage(json.message)
        fetchDashboardData()
        setTimeout(() => setSyncMessage(''), 4000)
      } else {
        setSyncMessage(json.error || 'Sync failed')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSyncingBank(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchDashboardData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-rose-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error || 'Unable to load dashboard'}</p>
        </div>
      </AppLayout>
    )
  }

  const { calculation, user, todayExpenses = [] } = data
  const currency = user.currency || 'INR'

  // Progress Bar styling based on statusColor:
  // green: safe (<80%), amber: warning (80-100%), red: over budget (>100%)
  const statusColor = calculation.statusColor
  const progressPercent = Math.min(100, calculation.todaySpentPercentage)

  const getStatusBadge = () => {
    if (statusColor === 'red') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <AlertCircle className="w-3.5 h-3.5" />
          OVER DAILY LIMIT
        </span>
      )
    }
    if (statusColor === 'amber') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <AlertCircle className="w-3.5 h-3.5" />
          80%+ USED
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5" />
        SAFE PACE
      </span>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Morning Greeting & Bank Sync Notice Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Good morning, {user.name.split(' ')[0]}! ☀️
              </h2>
              <p className="text-xs text-slate-500">
                Today is Day {calculation.todayDay} of {calculation.daysInMonth}. You have {calculation.remainingDays} days left this month.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncMessage && (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                {syncMessage}
              </span>
            )}
            <button
              onClick={handleBankSync}
              disabled={syncingBank}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingBank ? 'animate-spin text-teal-600' : ''}`} />
              <span>{syncingBank ? 'Syncing...' : 'Sync Banks'}</span>
            </button>
          </div>
        </div>

        {/* HERO DAILY BUDGET CARD */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          statusColor === 'red'
            ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40'
            : statusColor === 'amber'
            ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/40'
            : 'bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border-teal-500/30'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Today's Targeted Allowance
                </span>
                {getStatusBadge()}
              </div>

              <div className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                {formatCurrency(calculation.todayBudget, currency)}
                <span className="text-lg font-medium text-slate-400"> for today</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                <span>Spent today: <strong className="text-white">{formatCurrency(calculation.spentToday, currency)}</strong></span>
                <span>•</span>
                <span>
                  {calculation.todayRemaining >= 0 ? (
                    <>Remaining: <strong className="text-emerald-400">{formatCurrency(calculation.todayRemaining, currency)}</strong></>
                  ) : (
                    <>Overspent: <strong className="text-rose-400">{formatCurrency(Math.abs(calculation.todayRemaining), currency)}</strong></>
                  )}
                </span>
              </p>
            </div>

            {/* Quick Action CTA inside hero */}
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              <button
                onClick={() => {
                  const ev = new CustomEvent('daybudget:open-log', { detail: { emergency: false } })
                  window.dispatchEvent(ev)
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log Today's Spend</span>
              </button>
              <button
                onClick={() => router.push('/expenses')}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-all text-center"
              >
                View All Expenses
              </button>
            </div>
          </div>

          {/* Progress Bar Spent vs Budget */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{calculation.todaySpentPercentage}% of today's target spent</span>
              <span>Target: {formatCurrency(calculation.todayBudget, currency)}</span>
            </div>

            <div className="w-full bg-slate-800/80 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  statusColor === 'red'
                    ? 'bg-gradient-to-r from-rose-500 to-red-500'
                    : statusColor === 'amber'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Overspending / Surplus Redistribution Insight Card */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              {calculation.todayOverspent ? (
                <div className="p-1 rounded bg-rose-900/60 text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 rounded bg-teal-900/60 text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              )}
              <span>
                {calculation.todayOverspent
                  ? `Over budget! Future daily target starting tomorrow adjusts to ${formatCurrency(calculation.adjustedFutureDailyBudget, currency)}/day.`
                  : calculation.surplusMode === 'CARRY_OVER'
                  ? `Any surplus remaining tonight rolls over to boost future days from ${formatCurrency(calculation.baseDailyBudget, currency)} to ~${formatCurrency(calculation.adjustedFutureDailyBudget, currency)}.`
                  : `Surplus mode: Underspent funds sweep automatically into your savings goal.`}
              </span>
            </div>

            <div className="shrink-0 text-slate-400">
              Mode: <strong className="text-white">{calculation.surplusMode === 'CARRY_OVER' ? 'Carry Over' : 'Auto-Save'}</strong>
            </div>
          </div>
        </div>

        {/* 4-Stat Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Spent (Month)</span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(calculation.totalSpentThisMonth, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              Pool: {formatCurrency(calculation.discretionaryMonthlyPool, currency)}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Remaining in Pool</span>
              <Wallet className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
              {formatCurrency(calculation.monthRemainingPool, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              Across {calculation.remainingDays} days left
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Base Daily Target</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(calculation.baseDailyBudget, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              Initial pace for 30-day month
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>No-Spend Days</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-500">
              {calculation.noSpendDaysCount} Days
            </div>
            <p className="text-[11px] text-slate-400">
              Zero burn streak this month
            </p>
          </div>
        </div>

        {/* Today's Activity & Quick Log Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Expenses List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Today's Spending Log
                </h3>
                <p className="text-xs text-slate-500">
                  All expenses recorded for today ({calculation.month}/{calculation.todayDay}/{calculation.year})
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {todayExpenses.length} items
              </span>
            </div>

            {todayExpenses.length === 0 ? (
              <div className="text-center py-12 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  No expenses logged yet today!
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Your full daily allowance of {formatCurrency(calculation.todayBudget, currency)} is completely untouched.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {todayExpenses.map((exp: any) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        exp.isEmergency
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                          : 'bg-teal-100 dark:bg-teal-950 text-teal-600'
                      }`}>
                        {exp.categoryName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {exp.note || exp.categoryName}
                          </p>
                          {exp.isEmergency && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600">
                              EMERGENCY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {exp.categoryName} • {exp.paymentMethod} • {new Date(exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(exp.amount, currency)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts & Bank Status */}
          <div className="space-y-6">
            {/* Bank status widget */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-teal-600" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bank Accounts
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aggregator automatically syncs transactions from HDFC, SBI, ICICI and credit cards.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/bank')}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span>Manage Bank Accounts</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => router.push('/transactions')}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span>View Transaction History</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Savings Goal Quick Peek */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-900/40 shadow-sm space-y-3">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Monthly Savings Target
              </span>
              <div className="text-2xl font-black text-white">
                {formatCurrency(calculation.savingsGoalAmount, currency)}
              </div>
              <p className="text-xs text-slate-400">
                Locket away from monthly income of {formatCurrency(calculation.monthlyIncome, currency)} to build long-term wealth.
              </p>
              <button
                onClick={() => router.push('/goals')}
                className="text-xs font-bold text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>View Savings Goals</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function ArrowRightIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}
