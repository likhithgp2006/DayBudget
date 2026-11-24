'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Sparkles,
  Flame,
  ShieldAlert,
  Calendar,
  Wallet,
  Coins,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = [
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#ef4444', // red
  '#6b7280', // gray
]

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('INR')

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user?.currency) setCurrency(d.user.currency)
      })
  }, [])

  if (loading || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      </AppLayout>
    )
  }

  const { metrics, categoryData, dailyData, trendData } = data

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Analytics & Spending Reports
          </h1>
          <p className="text-xs text-slate-500">
            Insights on daily burn rate, category distribution, pace, and streaks
          </p>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Average Daily Spend</span>
              <TrendingUp className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(metrics.averageDailySpend, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              Per day actual average
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Top Category</span>
              <PieChartIcon className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
              {metrics.topCategory}
            </div>
            <p className="text-[11px] text-slate-400">
              {formatCurrency(metrics.topCategoryAmount, currency)} spent
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>No-Spend Streak</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-500">
              {metrics.noSpendDaysCount} Days
            </div>
            <p className="text-[11px] text-slate-400">
              Days with ₹0 discretionary spend
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Emergency Spend</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(metrics.emergencyTotal, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              Tracked separately from regular pool
            </p>
          </div>
        </div>

        {/* Charts Row 1: Category Donut & Monthly Trend Line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Donut Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Spending by Category
              </h3>
              <p className="text-xs text-slate-500">
                Discretionary breakdown for the current month
              </p>
            </div>

            <div className="h-64 w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No spending data to display
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {categoryData.slice(0, 4).map((c: any, i: number) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Cumulative Pace Line Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Spending Pace (Actual vs Ideal)
              </h3>
              <p className="text-xs text-slate-500">
                Linear budget trajectory vs cumulative actual burn rate
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val, currency), '']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    name="Ideal Pace (Linear)"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Spend"
                    stroke="#14b8a6"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart Row 2: Daily Spending vs Budget Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Spending vs Target (Day 1 to Today)
              </h3>
              <p className="text-xs text-slate-500">
                Green bars stay within target; red bars highlight days you overspent.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-teal-500" />
                <span className="text-slate-600 dark:text-slate-400">Within Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-400">Over Target</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="spent" name="Spent Amount" radius={[6, 6, 0, 0]}>
                  {dailyData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isOver ? '#ef4444' : '#14b8a6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
