'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Plus, Trash2, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

interface FixedExpenseItem {
  id: string
  name: string
  amount: string
  category: string
  dueDay: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Income, 2: Fixed expenses, 3: Savings & Mode
  const [monthlyIncome, setMonthlyIncome] = useState('100000')
  const [currency, setCurrency] = useState('INR')
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([
    { id: '1', name: 'Apartment Rent', amount: '25000', category: 'Bills', dueDay: '1' },
    { id: '2', name: 'Car Loan EMI', amount: '12000', category: 'Bills', dueDay: '5' },
    { id: '3', name: 'High-Speed Fiber WiFi', amount: '1500', category: 'Bills', dueDay: '10' },
  ])
  const [savingsGoalPercent, setSavingsGoalPercent] = useState('15')
  const [surplusMode, setSurplusMode] = useState<'CARRY_OVER' | 'SAVE'>('CARRY_OVER')
  const [submitting, setSubmitting] = useState(false)

  const addFixedExpense = () => {
    setFixedExpenses(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', amount: '', category: 'Bills', dueDay: '1' },
    ])
  }

  const removeFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(f => f.id !== id))
  }

  const updateFixedExpense = (id: string, field: keyof FixedExpenseItem, value: string) => {
    setFixedExpenses(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    )
  }

  const totalFixed = fixedExpenses.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0)
  const incomeNum = parseFloat(monthlyIncome) || 0
  const savingsNum = Math.round(incomeNum * ((parseFloat(savingsGoalPercent) || 0) / 100))
  const pool = Math.max(0, incomeNum - totalFixed - savingsNum)
  const daysInMonth = 30
  const dailyBudget = Math.round(pool / daysInMonth)

  const handleFinishSetup = async () => {
    try {
      setSubmitting(true)
      const res = await fetch('/api/budget/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome: incomeNum,
          currency,
          savingsGoalPercent: parseFloat(savingsGoalPercent) || 0,
          savingsGoalAmount: savingsNum,
          surplusMode,
          fixedExpenses: fixedExpenses.filter(f => f.name && parseFloat(f.amount) > 0),
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save budget settings')
      }

      router.push('/dashboard')
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
              <Coins className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-teal-600">DayBudget</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Set Up Your Daily Budget
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Step {step} of 3: {step === 1 ? 'Monthly Income' : step === 2 ? 'Fixed Expenses' : 'Savings & Mode'}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                How much do you earn each month?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your total monthly take-home salary or expected regular income.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Monthly Income (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(e.target.value)}
                    placeholder="100000"
                    className="w-full pl-10 pr-4 py-3 text-2xl font-bold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow flex items-center gap-2"
                >
                  <span>Next: Fixed Expenses</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    What are your fixed obligations?
                  </h2>
                  <p className="text-xs text-slate-500">
                    Rent, car EMIs, subscriptions, WiFi. We lock this money aside so you never fall short.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFixedExpense}
                  className="px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {fixedExpenses.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Rent, EMI"
                      value={item.name}
                      onChange={e => updateFixedExpense(item.id, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={e => updateFixedExpense(item.id, 'amount', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFixedExpense(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Total Fixed Commitments:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{totalFixed.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow flex items-center gap-2"
                >
                  <span>Next: Savings & Mode</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Savings Goal & Overspending Logic
                </h2>
                <p className="text-xs text-slate-500">
                  Decide your savings percentage and how you want daily surpluses handled.
                </p>
              </div>

              {/* Savings Goal Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Monthly Savings Target
                  </label>
                  <span className="text-sm font-bold text-teal-600">
                    {savingsGoalPercent}% (₹{savingsNum.toLocaleString('en-IN')})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={savingsGoalPercent}
                  onChange={e => setSavingsGoalPercent(e.target.value)}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Surplus Mode Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  When you spend less than your daily budget:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSurplusMode('CARRY_OVER')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      surplusMode === 'CARRY_OVER'
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Carry Over</span>
                      {surplusMode === 'CARRY_OVER' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Unspent surplus rolls over into the remaining days, increasing your daily budget.
                    </p>
                  </div>

                  <div
                    onClick={() => setSurplusMode('SAVE')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      surplusMode === 'SAVE'
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Add to Savings</span>
                      {surplusMode === 'SAVE' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Surplus is swept directly into your savings goals bucket. Daily budget stays disciplined.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 to-navy-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider">
                    Calculated Daily Budget
                  </span>
                  <div className="text-3xl font-black text-white">
                    ₹{dailyBudget.toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-teal-200"> / day</span>
                  </div>
                </div>
                <div className="text-right text-xs text-teal-200/80">
                  <div>Pool: ₹{pool.toLocaleString('en-IN')}</div>
                  <div>30 Days Available</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishSetup}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow flex items-center gap-2"
                >
                  <span>{submitting ? 'Activating...' : 'Activate DayBudget'}</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
