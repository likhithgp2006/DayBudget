'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import {
  Landmark,
  Plus,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  ExternalLink,
  Lock,
  X,
  CreditCard,
  AlertCircle,
  Trash2,
  KeyRound,
  FlaskConical,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [supportedBanks, setSupportedBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [currency, setCurrency] = useState('INR')
  const [syncMessage, setSyncMessage] = useState('')

  // Fake Bank Linking Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState(1) // 1: Bank selection & Customer ID, 2: Fake Password & OTP
  const [selectedBankId, setSelectedBankId] = useState('bank_demo')
  const [accountType, setAccountType] = useState('SAVINGS')
  const [customerId, setCustomerId] = useState('user_test_99')
  const [fakePassword, setFakePassword] = useState('secret123')
  const [otp, setOtp] = useState('123456')
  const [linking, setLinking] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

  const fetchBankData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/bank/accounts')
      const data = await res.json()
      if (data.accounts) setAccounts(data.accounts)
      if (data.supportedBanks) setSupportedBanks(data.supportedBanks)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBankData()
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user?.currency) setCurrency(d.user.currency)
      })

    const handleRefresh = () => fetchBankData()
    window.addEventListener('daybudget:refresh', handleRefresh)
    return () => window.removeEventListener('daybudget:refresh', handleRefresh)
  }, [])

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      setSyncMessage('')
      const res = await fetch('/api/bank/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSyncMessage(data.message)
        fetchBankData()
        window.dispatchEvent(new Event('daybudget:refresh'))
        setTimeout(() => setSyncMessage(''), 5000)
      } else {
        setSyncMessage(data.error || 'Sync failed')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(false)
    }
  }

  const handleUnlink = async (accountId: string, bankName: string) => {
    if (!confirm(`Are you sure you want to unlink ${bankName}? Associated simulated transactions will be cleaned up.`)) {
      return
    }

    try {
      setUnlinkingId(accountId)
      const res = await fetch(`/api/bank/accounts/${accountId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setAccounts(prev => prev.filter(a => a.id !== accountId))
        setSyncMessage(`${bankName} unlinked successfully`)
        window.dispatchEvent(new Event('daybudget:refresh'))
        setTimeout(() => setSyncMessage(''), 4000)
      } else {
        alert(data.error || 'Failed to unlink account')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUnlinkingId(null)
    }
  }

  const handleConnectBank = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLinking(true)
      const res = await fetch('/api/bank/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: selectedBankId,
          accountType,
          credentials: {
            username: customerId,
            password: fakePassword,
            otp,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        setModalOpen(false)
        setModalStep(1)
        fetchBankData()
        setSyncMessage(data.message)
        window.dispatchEvent(new Event('daybudget:refresh'))
        setTimeout(() => setSyncMessage(''), 6000)
      } else {
        alert(data.error || 'Failed to link account')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLinking(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Bank Accounts
            </h1>
            <p className="text-xs text-slate-500">
              Fully simulated fake banks for risk-free testing of transactions, budgeting, and overspending
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-teal-600' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Transactions'}</span>
            </button>
            <button
              onClick={() => {
                setModalStep(1)
                setModalOpen(true)
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Fake Bank Account</span>
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-700 dark:text-teal-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Fake Bank Architecture Explainer Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-950/30 to-slate-900 border border-teal-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 shrink-0">
              <FlaskConical className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Fake Bank Provider Architecture</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-teal-900/60 text-teal-300 border border-teal-700/60">
                  MOCK PROVIDER
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Operates behind the clean <code className="text-teal-300 font-mono">BankProvider</code> interface. Linking generates ~90 days of simulated transactions (monthly salary of ₹100,000, rent, groceries, shopping, and everyday UPI payments) with accurate running balances.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 shrink-0">
            <Lock className="w-4 h-4 text-teal-400" />
            <span>Safe Trial & Error Sandbox</span>
          </div>
        </div>

        {/* Connected Accounts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Linked Accounts ({accounts.length})
            </h2>
            <span className="text-xs text-slate-500">
              Multiple fake accounts supported
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No bank accounts linked yet</p>
              <p className="text-xs text-slate-400">Click &ldquo;Link Fake Bank Account&rdquo; to test the simulated linking flow.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center text-2xl shrink-0">
                        {acc.bankName.includes('SBI') ? '🏛️' : acc.bankName.includes('HDFC') ? '🏢' : acc.bankName.includes('ICICI') ? '🏛️' : '🏦'}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">
                          {acc.bankName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {acc.accountType} • <strong className="font-mono text-slate-700 dark:text-slate-300">{acc.accountNumberMasked}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                        SIMULATED
                      </span>
                      <button
                        onClick={() => handleUnlink(acc.id, acc.bankName)}
                        disabled={unlinkingId === acc.id}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Unlink Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Current Balance
                      </span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(acc.balance, currency)}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last Synced</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium">
                        {new Date(acc.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                        ~{acc.transactionCount || 50}+ transactions
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fake Bank Account Linking Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Link Fake Bank Account
                  </h3>
                  <p className="text-xs text-slate-500">Step {modalStep} of 2: {modalStep === 1 ? 'Choose Bank' : 'Credentials & OTP'}</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectBank} className="space-y-4">
              {modalStep === 1 ? (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select a simulated bank from the test list. Any account linked here will automatically receive 90 days of realistic dummy transactions.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Choose Simulated Bank
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={e => setSelectedBankId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                    >
                      {supportedBanks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.icon} {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Account Type
                    </label>
                    <select
                      value={accountType}
                      onChange={e => setAccountType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    >
                      <option value="SAVINGS">Savings Account</option>
                      <option value="CURRENT">Current Account</option>
                      <option value="CREDIT_CARD">Credit Card Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Customer ID / Mobile (Sandbox)
                    </label>
                    <input
                      type="text"
                      value={customerId}
                      onChange={e => setCustomerId(e.target.value)}
                      placeholder="e.g. user_test_99"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setModalStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow flex items-center gap-2"
                    >
                      <span>Proceed to Fake Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-700 dark:text-teal-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Sandbox Credentials Accepted</span>
                    </div>
                    <p className="text-[11px] text-teal-600 dark:text-teal-400">
                      Enter any password and any 6-digit OTP (e.g. <strong>123456</strong>). No real bank credentials will be contacted.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Internet Banking Password
                    </label>
                    <input
                      type="password"
                      value={fakePassword}
                      onChange={e => setFakePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      One-Time Password (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="px-4 py-2 rounded-xl border text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={linking}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow flex items-center gap-2"
                    >
                      <span>{linking ? 'Generating 90-day Data...' : 'Verify & Link Account'}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
