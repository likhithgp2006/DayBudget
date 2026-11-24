'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from 'lucide-react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  undoAction?: () => Promise<void> | void
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', undoAction?: () => Promise<void> | void) => void
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'success',
      undoAction?: () => Promise<void> | void
    ) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(4)
      const newToast: Toast = { id, message, type, undoAction, duration: 5000 }

      setToasts(prev => [...prev.slice(-3), newToast])

      setTimeout(() => {
        removeToast(id)
      }, 5000)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-slate-900/95 text-white border-teal-500/40'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-800'
                : 'bg-slate-900/95 text-slate-200 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-teal-400 shrink-0" />
              )}
              <span className="truncate leading-snug">{toast.message}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {toast.undoAction && (
                <button
                  type="button"
                  onClick={async () => {
                    await toast.undoAction!()
                    removeToast(toast.id)
                  }}
                  className="px-2 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
