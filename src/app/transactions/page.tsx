'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/AppLayout'
import {
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [currency, setCurrency] = useState('INR')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter !== 'All') params.set('category', categoryFilter)
      if (typeFilter !== 'All') params.set('type', typeFilter)

      const res = await fetch(`/api/bank/transactions?${params.toString()}`)
      const data = await res.json()
      if (data.transactions) setTransactions(data.transactions)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, typeFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        if (d.categories) setCategories(d.categories)
      })

    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user?.currency) setCurrency(d.user.currency)
      })
  }, [])

  // Inline Re-categorization handler
  const handleRecategorize = async (transactionId: string, newCategory: string) => {
    try {
      setUpdatingId(transactionId)
      const res = await fetch('/api/bank/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, category: newCategory }),
      })
      if (res.ok) {
        setTransactions(prev =>
          prev.map(t => t.id === transactionId ? { ...t, category: newCategory } : t)
        )
        window.dispatchEvent(new Event('daybudget:refresh'))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Transaction History
            </h1>
            <p className="text-xs text-slate-500">
              Aggregated transactions from your linked bank accounts with inline re-categorization
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export/csv"
              download
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </a>
            <a
              href="/api/export/pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Export PDF / Print</span>
            </a>
          </div>
        </div>

        {/* Filter controls */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search merchant or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Transactions (Debit & Credit)</option>
              <option value="DEBIT">Debits (Expenses)</option>
              <option value="CREDIT">Credits (Income)</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300">No transactions found</p>
              <p className="text-xs text-slate-400">Try syncing accounts or adjusting filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Merchant / Description</th>
                    <th className="px-6 py-3.5">Account & Method</th>
                    <th className="px-6 py-3.5">Category (Re-categorize)</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        <div>{new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg text-xs ${
                            tx.type === 'DEBIT' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {tx.type === 'DEBIT' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {tx.merchantName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {tx.rawDescription}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {tx.bankAccount?.bankName} ({tx.bankAccount?.accountNumberMasked})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Method: {tx.paymentMethod || 'UPI'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Inline Re-categorization Dropdown */}
                        <div className="relative inline-block">
                          <select
                            value={tx.category}
                            disabled={updatingId === tx.id}
                            onChange={e => handleRecategorize(tx.id, e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                          >
                            {categories.map(c => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${
                        tx.type === 'DEBIT' ? 'text-slate-900 dark:text-white' : 'text-emerald-500'
                      }`}>
                        {tx.type === 'DEBIT' ? '-' : '+'}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                        {tx.balanceAfter ? formatCurrency(tx.balanceAfter, currency) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
