'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/AppLayout'
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  ShieldAlert,
  Calendar,
  CreditCard,
  Tag,
  AlertCircle,
  X,
  Check,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import { SkeletonTable } from '@/components/SkeletonLoader'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedMethod, setSelectedMethod] = useState('All')
  const [emergencyFilter, setEmergencyFilter] = useState('All')
  const [currency, setCurrency] = useState('INR')
  const { showToast } = useToast()

  // Custom Category Modal
  const [newCatOpen, setNewCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)

  // Edit Expense Modal
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editMethod, setEditMethod] = useState('')
  const [editEmergency, setEditEmergency] = useState(false)
  const [editReason, setEditReason] = useState('')

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      if (selectedMethod !== 'All') params.set('paymentMethod', selectedMethod)
      if (emergencyFilter !== 'All') params.set('isEmergency', emergencyFilter === 'Emergency' ? 'true' : 'false')

      const res = await fetch(`/api/expenses?${params.toString()}`)
      const data = await res.json()
      if (data.expenses) {
        setExpenses(data.expenses)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory, selectedMethod, emergencyFilter])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

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

  const handleDelete = async (expense: any) => {
    try {
      // Optimistic update
      setExpenses(prev => prev.filter(e => e.id !== expense.id))

      const res = await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Rollback on error
        setExpenses(prev => [expense, ...prev])
        showToast('Failed to delete expense', 'error')
        return
      }

      window.dispatchEvent(new Event('daybudget:refresh'))

      // Offer Undo in Toast
      showToast(
        `Deleted "${expense.note || expense.categoryName}" (₹${expense.amount})`,
        'info',
        async () => {
          // Restore expense
          await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: expense.amount,
              categoryName: expense.categoryName,
              note: expense.note,
              date: expense.date,
              paymentMethod: expense.paymentMethod,
              isEmergency: expense.isEmergency,
              emergencyReason: expense.emergencyReason,
            }),
          })
          fetchExpenses()
          window.dispatchEvent(new Event('daybudget:refresh'))
          showToast('Expense restored', 'success')
        }
      )
    } catch (e) {
      console.error(e)
      showToast('Error deleting expense', 'error')
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      setCreatingCat(true)
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), icon: 'Tag', color: '#14b8a6' }),
      })
      const data = await res.json()
      if (data.success) {
        setCategories(prev => [...prev, data.category])
        setNewCatName('')
        setNewCatOpen(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCreatingCat(false)
    }
  }

  const startEdit = (expense: any) => {
    setEditingExpense(expense)
    setEditAmount(expense.amount.toString())
    setEditCategory(expense.categoryName)
    setEditNote(expense.note || '')
    setEditMethod(expense.paymentMethod)
    setEditEmergency(expense.isEmergency)
    setEditReason(expense.emergencyReason || '')
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          categoryName: editCategory,
          note: editNote,
          paymentMethod: editMethod,
          isEmergency: editEmergency,
          emergencyReason: editEmergency ? editReason : null,
        }),
      })

      if (res.ok) {
        setEditingExpense(null)
        fetchExpenses()
        window.dispatchEvent(new Event('daybudget:refresh'))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const totalFiltered = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Expense Tracker
            </h1>
            <p className="text-xs text-slate-500">
              Manage your daily spending, categorized logs, and recurring commitments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewCatOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-teal-500" />
              <span>+ Custom Category</span>
            </button>
            <a
              href="/api/export/csv"
              download
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search note or merchant..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Payment Method */}
            <select
              value={selectedMethod}
              onChange={e => setSelectedMethod(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Net Banking">Net Banking</option>
            </select>

            {/* Emergency Filter */}
            <select
              value={emergencyFilter}
              onChange={e => setEmergencyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Types (Regular & Emergency)</option>
              <option value="Regular">Regular Spend Only</option>
              <option value="Emergency">Emergency Spend Only</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900 dark:text-white">{expenses.length}</strong> expenses
            </span>
            <span className="text-slate-500">
              Total Filtered: <strong className="text-teal-600 dark:text-teal-400 font-bold">{formatCurrency(totalFiltered, currency)}</strong>
            </span>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonTable />
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300">No expenses found</p>
              <p className="text-xs text-slate-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Note / Details</th>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          e.isEmergency
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                            : 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300'
                        }`}>
                          {e.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {e.note || 'Expense'}
                        </div>
                        {e.isEmergency && e.emergencyReason && (
                          <div className="text-xs text-rose-500 flex items-center gap-1 mt-0.5">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Reason: {e.emergencyReason}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {e.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(e.amount, currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(e)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete with Undo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Custom Category Modal */}
      {newCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Custom Category</h3>
              <button onClick={() => setNewCatOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pet Care, Photography"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCatOpen(false)}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCat}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                >
                  {creatingCat ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Expense</h3>
              <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={editMethod}
                  onChange={e => setEditMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
