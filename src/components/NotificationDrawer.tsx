'use client'

import React, { useEffect, useState } from 'react'
import { X, Bell, Check, Clock, AlertTriangle, ShieldAlert, Sparkles, Building2 } from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
  onUpdateBadge?: (count: number) => void
}

export function NotificationDrawer({ isOpen, onClose, onUpdateBadge }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications)
        const unread = data.notifications.filter((n: NotificationItem) => !n.isRead).length
        onUpdateBadge?.(unread)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      onUpdateBadge?.(0)
    } catch (e) {
      console.error(e)
    }
  }

  const markSingleRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      const remainingUnread = notifications.filter(n => n.id !== id && !n.isRead).length
      onUpdateBadge?.(remainingUnread)
    } catch (e) {
      console.error(e)
    }
  }

  if (!isOpen) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'MORNING_GREETING':
        return <Sparkles className="w-5 h-5 text-amber-500" />
      case 'THRESHOLD_80':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'THRESHOLD_100':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />
      case 'BANK_SYNC':
        return <Building2 className="w-5 h-5 text-teal-500" />
      default:
        return <Bell className="w-5 h-5 text-teal-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllRead}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium px-2 py-1"
              >
                Mark all read
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">All caught up!</p>
                <p className="text-xs text-slate-400">No new alerts or budget reminders.</p>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markSingleRead(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    item.isRead
                      ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 opacity-75'
                      : 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{getIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
