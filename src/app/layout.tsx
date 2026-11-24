import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ToastProvider } from '@/components/Toast'

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'DayBudget — Daily Budget Expense Tracker',
  description: 'Divide your monthly discretionary income across the days of the month. Aim to spend only today’s budget, handle overspending gracefully, and build long-term wealth.',
  manifest: '/manifest.json',
  authors: [{ name: 'DayBudget Team' }],
  keywords: ['daily budget', 'expense tracker', 'budget planner', 'fintech', 'money management', 'India personal finance'],
  openGraph: {
    title: 'DayBudget — Daily Budget Expense Tracker',
    description: 'Stop stressing about monthly bills. Master your finances one day at a time.',
    url: 'https://daybudget.app',
    siteName: 'DayBudget',
    locale: 'en_IN',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased selection:bg-teal-500/20 selection:text-teal-600">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
