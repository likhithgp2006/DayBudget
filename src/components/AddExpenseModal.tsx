'use client'

import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Sparkles, Plus, ShieldAlert, Check } from 'lucide-react'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialEmergency?: boolean
}

export function AddExpenseModal({ isOpen, onClose, onSuccess, initialEmergency = false }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('')
  const [categoryName, setCategoryName] = useState('Food')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isEmergency, setIsEmergency] = useState(initialEmergency)
  const [emergencyReason, setEmergencyReason] = useState('')
  const [categories, setCategories] = useState<{ name: string; color: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsEmergency(initialEmergency)
  }, [initialEmergency])

  useEffect(() => {
    if (isOpen) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          if (data.categories) setCategories(data.categories)
        })
        .catch(console.error)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (isEmergency && !emergencyReason.trim()) {
      setError('Please provide a reason for this emergency expense')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          categoryName,
          note: note.trim(),
          date: new Date(date).toISOString(),
          paymentMethod,
          isEmergency,
          emergencyReason: isEmergency ? emergencyReason.trim() : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save expense')
      }

      // Reset form
      setAmount('')
      setNote('')
      setEmergencyReason('')
      setIsEmergency(false)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isEmergency ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600' : 'bg-teal-100 dark:bg-teal-950/60 text-teal-600'}`}>
              {isEmergency ? <ShieldAlert className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEmergency ? 'Log Emergency Spend' : 'Add Daily Expense'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEmergency ? 'Track extreme cases separately with reason' : 'Track spending against your daily target'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount input with large display */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-2xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {categories.length > 0 ? (
                  categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Bills">Bills</option>
                    <option value="Health">Health</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          {/* Note and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Note / Merchant
              </label>
              <input
                type="text"
                placeholder="e.g. Starbucks Indiranagar"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Emergency Spend Toggle */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isEmergency 
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${isEmergency ? 'text-rose-500' : 'text-slate-400'}`} />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Mark as Emergency Spend
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={e => setIsEmergency(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {isEmergency && (
              <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-900/50 space-y-2">
                <label className="block text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Emergency Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sudden car repair, emergency dentist visit"
                  value={emergencyReason}
                  onChange={e => setEmergencyReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  Emergency expenses are highlighted separately and exempt from punishing regular daily burn rate.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all flex items-center gap-2 ${
                isEmergency 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
              } disabled:opacity-50`}
            >
              {submitting ? 'Saving...' : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEmergency ? 'Record Emergency Spend' : 'Log Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
