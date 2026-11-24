'use client'

import React, { useState } from 'react'
import {
  Wrench,
  X,
  Zap,
  Dice5,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'

export function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Custom Transaction Form State
  const [amount, setAmount] = useState('750')
  const [merchantName, setMerchantName] = useState('Weekend Cafe & Bakery')
  const [category, setCategory] = useState('Food')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT')

  const notifyDashboard = () => {
    window.dispatchEvent(new Event('daybudget:refresh'))
  }

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  // Action: Generate Random Transactions for Today
  const handleRandomToday = async () => {
    try {
      setLoadingAction('random_today')
      const res = await fetch('/api/mock-bank/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'random_today' }),
      })
      const data = await res.json()
      if (data.success) {
        showStatus(data.message)
        notifyDashboard()
      } else {
        showStatus(data.error || 'Failed to generate', 'error')
      }
    } catch (e: any) {
      showStatus(e.message || 'Error occurred', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  // Action: Simulate Big Overspend
  const handleBigOverspend = async () => {
    try {
      setLoadingAction('big_overspend')
      const res = await fetch('/api/mock-bank/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'big_overspend', amount: 5000 }),
      })
      const data = await res.json()
      if (data.success) {
        showStatus('🚨 Big Overspend simulated! Daily limit exceeded & deficit adjusted.', 'success')
        notifyDashboard()
      } else {
        showStatus(data.error || 'Failed to simulate overspend', 'error')
      }
    } catch (e: any) {
      showStatus(e.message || 'Error occurred', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  // Action: Sync Now
  const handleSyncNow = async () => {
    try {
      setLoadingAction('sync')
      const res = await fetch('/api/bank/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showStatus(data.message)
        notifyDashboard()
      } else {
        showStatus(data.error || 'Sync failed', 'error')
      }
    } catch (e: any) {
      showStatus(e.message || 'Error occurred', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  // Action: Reset Fake Data
  const handleResetData = async () => {
    if (!confirm('Reset all fake bank accounts and transactions to default 90-day baseline?')) return
    try {
      setLoadingAction('reset')
      const res = await fetch('/api/mock-bank/reset', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showStatus(data.message)
        notifyDashboard()
      } else {
        showStatus(data.error || 'Reset failed', 'error')
      }
    } catch (e: any) {
      showStatus(e.message || 'Error occurred', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  // Action: Submit Custom Transaction
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoadingAction('custom')
      const res = await fetch('/api/mock-bank/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom',
          amount: parseFloat(amount),
          merchantName,
          category,
          paymentMethod,
          type,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showStatus(data.message)
        setCustomModalOpen(false)
        notifyDashboard()
      } else {
        showStatus(data.error || 'Simulation failed', 'error')
      }
    } catch (e: any) {
      showStatus(e.message || 'Error occurred', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <>
      {/* Floating Pill / Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white font-bold text-xs shadow-xl shadow-teal-900/40 border border-teal-400/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Wrench className="w-4 h-4 animate-spin-slow" />
          <span>Fake Bank Dev Tools</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
        </button>
      </div>

      {/* Floating Flyout Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] rounded-3xl bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Fake Bank Sandbox Controls</h4>
                <p className="text-[10px] text-slate-400">Simulate transactions & test overspend logic</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toast / Status banner inside dev panel */}
          {statusMessage && (
            <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="leading-tight">{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons Grid */}
          <div className="space-y-2">
            <button
              onClick={() => setCustomModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center justify-between transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-200" />
                <span>Simulate Custom Transaction</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleRandomToday}
              disabled={loadingAction === 'random_today'}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Dice5 className="w-4 h-4 text-amber-400" />
                <span>Generate Random Spends for Today</span>
              </div>
              {loadingAction === 'random_today' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
              ) : (
                <span className="text-[10px] text-slate-400">+2 Items</span>
              )}
            </button>

            <button
              onClick={handleBigOverspend}
              disabled={loadingAction === 'big_overspend'}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/80 text-rose-300 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Simulate Big Overspend (₹5,000)</span>
              </div>
              {loadingAction === 'big_overspend' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <span className="text-[10px] text-rose-400 font-bold">TEST OVERSPEND</span>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSyncNow}
                disabled={loadingAction === 'sync'}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'sync' ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
                <span>Sync Now</span>
              </button>

              <button
                onClick={handleResetData}
                disabled={loadingAction === 'reset'}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingAction === 'reset' ? 'animate-spin' : ''}`} />
                <span>Reset Fake Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Transaction Simulation Modal */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Simulate Custom Transaction
                  </h3>
                  <p className="text-xs text-slate-500">Injects directly into fake bank & daily budget</p>
                </div>
              </div>
              <button onClick={() => setCustomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Merchant / Payee Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starbucks Indiranagar, Amazon India"
                  value={merchantName}
                  onChange={e => setMerchantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Bills">Bills</option>
                    <option value="Health">Health</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Card (Debit/Credit)</option>
                    <option value="NetBanking">NetBanking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('DEBIT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      type === 'DEBIT'
                        ? 'bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Debit (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('CREDIT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      type === 'CREDIT'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Credit (Income/Refund)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === 'custom'}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow"
                >
                  {loadingAction === 'custom' ? 'Injecting...' : 'Inject Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
