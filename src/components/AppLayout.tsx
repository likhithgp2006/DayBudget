'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  ArrowLeftRight,
  Landmark,
  PieChart,
  Target,
  Settings,
  Bell,
  LogOut,
  Plus,
  ShieldAlert,
  Menu,
  X,
  Coins,
  MessageSquare,
  Calendar,
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { NotificationDrawer } from './NotificationDrawer'
import { AddExpenseModal } from './AddExpenseModal'
import { DevToolsPanel } from './DevToolsPanel'
import { FlaskConical } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(2)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [isEmergencyModal, setIsEmergencyModal] = useState(false)

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/calendar', label: 'Yearly Calendar', icon: Calendar },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/bank', label: 'Bank Accounts', icon: Landmark },
    { href: '/analytics', label: 'Analytics', icon: PieChart },
    { href: '/goals', label: 'Savings Goals', icon: Target },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/feedback', label: 'Feedback & Help', icon: MessageSquare },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (e) {
      console.error(e)
    }
  }

  const openLogExpense = (emergency = false) => {
    setIsEmergencyModal(emergency)
    setAddExpenseOpen(true)
  }

  React.useEffect(() => {
    const handleOpenLog = (e: any) => {
      openLogExpense(e?.detail?.emergency || false)
    }
    window.addEventListener('daybudget:open-log', handleOpenLog)
    return () => window.removeEventListener('daybudget:open-log', handleOpenLog)
  }, [])

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                DayBudget
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Daily Tracker
              </span>
            </div>
          </Link>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            PRO
          </span>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => openLogExpense(false)}
            className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>Log Expense</span>
          </button>
          <button
            onClick={() => openLogExpense(true)}
            className="w-full py-1.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency Spend</span>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setNotificationOpen(true)}
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-20 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Coins className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-teal-600">DayBudget</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openLogExpense(false)}
              className="p-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setNotificationOpen(true)}
              className="relative p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500" />
              )}
            </button>
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-2 z-20">
            {navLinks.map(link => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Demo Mode Fake Bank Banner */}
          <div className="p-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-indigo-500/10 border border-amber-500/20 dark:border-amber-400/20 text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <FlaskConical className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                  Demo Mode: Using Fake Bank Data
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Simulated bank provider is active. Real credentials are never requested. Use the floating Dev Tools to simulate transactions or test overspending!
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                SANDBOX
              </span>
            </div>
          </div>

          {children}
        </main>
      </div>

      {/* Dev Tools Testing Panel */}
      <DevToolsPanel />

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        onUpdateBadge={count => setUnreadCount(count)}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSuccess={() => {
          // Trigger refresh event
          window.dispatchEvent(new Event('daybudget:refresh'))
        }}
        initialEmergency={isEmergencyModal}
      />
    </div>
  )
}
