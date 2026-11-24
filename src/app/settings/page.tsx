'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import {
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldCheck,
  Sparkles,
  Lock,
  UserX,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FixedExpenseItem {
  id?: string
  name: string
  amount: string
  category: string
  dueDay: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  // Password Change
  const [currPassword, setCurrPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState({ text: '', isError: false })
  const [pwdLoading, setPwdLoading] = useState(false)

  // Account Deletion
  const [delConfirm, setDelConfirm] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [delError, setDelError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg({ text: '', isError: false })
    setPwdLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwdMsg({ text: 'Password updated successfully!', isError: false })
        setCurrPassword('')
        setNewPassword('')
      } else {
        setPwdMsg({ text: data.error || 'Failed to update password', isError: true })
      }
    } catch (e: any) {
      setPwdMsg({ text: e.message || 'Error updating password', isError: true })
    } finally {
      setPwdLoading(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (delConfirm !== 'DELETE') return
    if (!confirm('This action is irreversible. All your transactions, budgets and profile data will be erased immediately. Continue?')) return

    setDelLoading(true)
    setDelError('')
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: delConfirm }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = '/login'
      } else {
        setDelError(data.error || 'Failed to delete account')
      }
    } catch (e: any) {
      setDelError(e.message || 'Error deleting account')
    } finally {
      setDelLoading(false)
    }
  }

  const [monthlyIncome, setMonthlyIncome] = useState('100000')
  const [savingsGoalPercent, setSavingsGoalPercent] = useState('15')
  const [currency, setCurrency] = useState('INR')
  const [surplusMode, setSurplusMode] = useState<'CARRY_OVER' | 'SAVE'>('CARRY_OVER')
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (d.user.currency) setCurrency(d.user.currency)
          if (d.user.surplusMode) setSurplusMode(d.user.surplusMode)
          if (d.user.budgetProfile) {
            setMonthlyIncome(d.user.budgetProfile.monthlyIncome.toString())
            setSavingsGoalPercent(d.user.budgetProfile.savingsGoalPercent.toString())
          }
          if (d.user.fixedExpenses) {
            setFixedExpenses(
              d.user.fixedExpenses.map((fe: any) => ({
                id: fe.id,
                name: fe.name,
                amount: fe.amount.toString(),
                category: fe.category,
                dueDay: fe.dueDay.toString(),
              }))
            )
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const addFixedExpense = () => {
    setFixedExpenses(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', amount: '', category: 'Bills', dueDay: '1' },
    ])
  }

  const removeFixedExpense = (index: number) => {
    setFixedExpenses(prev => prev.filter((_, i) => i !== index))
  }

  const updateFixed = (index: number, field: keyof FixedExpenseItem, val: string) => {
    setFixedExpenses(prev =>
      prev.map((item, i) => i === index ? { ...item, [field]: val } : item)
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaveSuccess(false)
    setSaving(true)

    const incomeNum = parseFloat(monthlyIncome)
    if (isNaN(incomeNum) || incomeNum <= 0) {
      setError('Please provide a valid monthly income')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/budget/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome: incomeNum,
          savingsGoalPercent: parseFloat(savingsGoalPercent) || 0,
          currency,
          surplusMode,
          fixedExpenses: fixedExpenses
            .filter(f => f.name.trim() && parseFloat(f.amount) > 0)
            .map(f => ({
              name: f.name.trim(),
              amount: parseFloat(f.amount),
              category: f.category || 'Bills',
              dueDay: parseInt(f.dueDay) || 1,
            })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }

      setSaveSuccess(true)
      window.dispatchEvent(new Event('daybudget:refresh'))
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: any) {
      setError(err.message || 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const incomeNum = parseFloat(monthlyIncome) || 0
  const totalFixed = fixedExpenses.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0)
  const savingsAmount = Math.round(incomeNum * ((parseFloat(savingsGoalPercent) || 0) / 100))
  const pool = Math.max(0, incomeNum - totalFixed - savingsAmount)
  const dailyEstimate = Math.round(pool / 30)

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Budget Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure your monthly baseline income, fixed commitments, and daily carry-over preferences
          </p>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Settings saved successfully! Your daily budget has been updated.</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Income and Currency */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Income & Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Monthly Income
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    {currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="number"
                    required
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </select>
              </div>
            </div>

            {/* Savings Goal Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Monthly Savings Goal
                </label>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  {savingsGoalPercent}% ({formatCurrency(savingsAmount, currency)})
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

            {/* Surplus Mode Options */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Daily Surplus Strategy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSurplusMode('CARRY_OVER')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    surplusMode === 'CARRY_OVER'
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Carry Over (Recommended)</span>
                    {surplusMode === 'CARRY_OVER' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Unspent money carries over to boost the remaining days of the month.
                  </p>
                </div>

                <div
                  onClick={() => setSurplusMode('SAVE')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    surplusMode === 'SAVE'
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Sweep to Savings</span>
                    {surplusMode === 'SAVE' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Surplus is saved immediately. Daily allowance remains constant.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Fixed Expenses List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Fixed Obligations (Rent, EMIs, Subscriptions)
                </h2>
                <p className="text-xs text-slate-500">
                  Total fixed: {formatCurrency(totalFixed, currency)} / month
                </p>
              </div>

              <button
                type="button"
                onClick={addFixedExpense}
                className="px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {fixedExpenses.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Expense Name (e.g. Rent)"
                    value={item.name}
                    onChange={e => updateFixed(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {currency === 'INR' ? '₹' : '$'}
                    </span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={e => updateFixed(idx, 'amount', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFixedExpense(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Calculated Output Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-900 to-navy-900 text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                New Base Daily Target
              </span>
              <div className="text-3xl font-black">
                {formatCurrency(dailyEstimate, currency)}
                <span className="text-xs font-normal text-teal-200"> / day</span>
              </div>
            </div>
            <div className="text-right text-xs text-teal-200/80">
              <div>Monthly Discretionary: {formatCurrency(pool, currency)}</div>
              <div>Divided by 30 days</div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 transition-all flex items-center gap-2"
            >
              <span>{saving ? 'Saving changes...' : 'Save Budget Settings'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Security & Password Section */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Security & Password
            </h2>
          </div>

          {pwdMsg.text && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              pwdMsg.isError ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40' : 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40'
            }`}>
              {pwdMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currPassword}
                onChange={e => setCurrPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                New Password (minimum 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {pwdLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">
              Danger Zone
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Permanently delete your account, expenses, linked accounts, and transactions.
          </p>

          {delError && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
              {delError}
            </div>
          )}

          <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Type <span className="font-mono font-bold text-rose-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                required
                value={delConfirm}
                onChange={e => setDelConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={delLoading || delConfirm !== 'DELETE'}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-40"
            >
              {delLoading ? 'Deleting Account...' : 'Permanently Delete Account'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
