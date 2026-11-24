'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Coins,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DayItem {
  day: number
  date: string
  dailyAllowance: number
  spent: number
  remaining: number
  status: 'normal' | 'safe' | 'warning' | 'over' | 'no-spend'
  transactionCount: number
}

interface MonthItem {
  monthIndex: number
  monthName: string
  daysInMonth: number
  baseDailyBudget: number
  monthlyBudget: number
  totalSpent: number
  remainingBudget: number
  days: DayItem[]
}

interface AnnualSummary {
  annualIncome: number
  annualFixed: number
  annualSavings: number
  annualDiscretionary: number
  daysInYear: number
  averageDailyBudget: number
}

export default function CalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [data, setData] = useState<{
    annualSummary: AnnualSummary
    months: MonthItem[]
    currency: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<DayItem | null>(null)

  const fetchCalendarData = async (targetYear: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/calendar/year?year=${targetYear}`)
      const resData = await res.json()
      if (resData.success) {
        setData(resData)
      }
    } catch (e) {
      console.error('Error fetching calendar:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendarData(year)
  }, [year])

  const currency = data?.currency || 'INR'
  const currentMonthData = data?.months?.[selectedMonth]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Year Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-teal-600" />
              <span>Annual Budget Calendar ({year})</span>
            </h1>
            <p className="text-xs text-slate-500">
              Complete 365-day breakdown of your income, fixed commitments, and daily discretionary allowances
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear(prev => prev - 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 font-extrabold text-sm text-teal-700 dark:text-teal-300 min-w-[80px] text-center">
              {year}
            </span>
            <button
              onClick={() => setYear(prev => prev + 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Annual Split Overview Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Annual Income
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(data.annualSummary.annualIncome, currency)}
              </div>
              <span className="text-[10px] text-slate-500">12 Months Total</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Annual Fixed & Savings
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-500 mt-1">
                {formatCurrency(data.annualSummary.annualFixed + data.annualSummary.annualSavings, currency)}
              </div>
              <span className="text-[10px] text-slate-500">Rent, EMIs, Bills & Savings</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Discretionary Pool
              </span>
              <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
                {formatCurrency(data.annualSummary.annualDiscretionary, currency)}
              </div>
              <span className="text-[10px] text-slate-500">Available to spend freely</span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-tr from-teal-900 to-slate-900 text-white shadow-md">
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">
                Average Daily Budget
              </span>
              <div className="text-xl sm:text-2xl font-black mt-1">
                {formatCurrency(data.annualSummary.averageDailyBudget, currency)}
                <span className="text-xs font-normal text-teal-200"> / day</span>
              </div>
              <span className="text-[10px] text-teal-200/80">Across {data.annualSummary.daysInYear} days</span>
            </div>
          </div>
        )}

        {/* 12-Month Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {data?.months.map((m, idx) => {
            const isSelected = selectedMonth === idx
            return (
              <button
                key={m.monthName}
                onClick={() => setSelectedMonth(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{m.monthName.slice(0, 3)}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {formatCurrency(m.baseDailyBudget, currency)}/d
                </span>
              </button>
            )
          })}
        </div>

        {/* Selected Month Interactive Grid */}
        {currentMonthData && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{currentMonthData.monthName} {year}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {currentMonthData.daysInMonth} Days
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Monthly Discretionary Pool: {formatCurrency(currentMonthData.monthlyBudget, currency)} • Daily Base Target: {formatCurrency(currentMonthData.baseDailyBudget, currency)}
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Under Budget
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Caution (80%+)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Over Budget
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Planned Allowance
                </span>
              </div>
            </div>

            {/* Days Grid (7 Columns) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {currentMonthData.days.map(d => {
                const isHovered = hoveredDay?.day === d.day
                let badgeColor = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                let textBadge = 'text-slate-400'

                if (d.status === 'over') {
                  badgeColor = 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 ring-1 ring-rose-400'
                  textBadge = 'text-rose-600 dark:text-rose-400'
                } else if (d.status === 'warning') {
                  badgeColor = 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 ring-1 ring-amber-400'
                  textBadge = 'text-amber-600 dark:text-amber-400'
                } else if (d.spent > 0) {
                  badgeColor = 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                  textBadge = 'text-emerald-600 dark:text-emerald-400'
                }

                return (
                  <div
                    key={d.day}
                    onMouseEnter={() => setHoveredDay(d)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[95px] relative group hover:scale-[1.03] shadow-sm ${badgeColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        Day {d.day}
                      </span>
                      {d.spent > 0 ? (
                        <span className={`text-[10px] font-bold ${textBadge}`}>
                          {formatCurrency(d.spent, currency)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          -
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-0.5">
                      <div className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                        {formatCurrency(d.dailyAllowance, currency)}
                      </div>
                      <div className="text-[9px] text-slate-400 flex items-center justify-between">
                        <span>Target Allowance</span>
                        {d.transactionCount > 0 && (
                          <span className="font-semibold text-teal-600">{d.transactionCount} tx</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Hovered Day Details Card */}
            {hoveredDay && (
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-600 text-white font-black text-sm">
                    {hoveredDay.day}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentMonthData.monthName} {hoveredDay.day}, {year}
                    </span>
                    <p className="text-slate-500">
                      Daily Allowance: {formatCurrency(hoveredDay.dailyAllowance, currency)} • Spent: {formatCurrency(hoveredDay.spent, currency)} ({hoveredDay.remaining >= 0 ? `${formatCurrency(hoveredDay.remaining, currency)} surplus` : `${formatCurrency(Math.abs(hoveredDay.remaining), currency)} overspent`})
                    </p>
                  </div>
                </div>

                <div className="font-bold text-teal-700 dark:text-teal-300">
                  {hoveredDay.transactionCount} logged transaction(s)
                </div>
              </div>
            )}
          </div>
        )}

        {/* 12 Months High-Level Grid */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            12-Month Allocation Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.months.map((m, idx) => (
              <div
                key={m.monthName}
                onClick={() => setSelectedMonth(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 hover:border-teal-500 shadow-sm ${
                  selectedMonth === idx ? 'ring-2 ring-teal-500 border-teal-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{m.monthName}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{m.daysInMonth} Days</span>
                </div>
                <div className="text-lg font-black text-teal-600 dark:text-teal-400">
                  {formatCurrency(m.baseDailyBudget, currency)}
                  <span className="text-xs font-normal text-slate-400"> / day</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Pool: {formatCurrency(m.monthlyBudget, currency)}</span>
                  <span>Spent: {formatCurrency(m.totalSpent, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
