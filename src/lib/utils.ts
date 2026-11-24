import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const symbolMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }
  const symbol = symbolMap[currency] || '₹'
  const rounded = Math.round(amount)
  
  if (currency === 'INR') {
    // Indian numbering format (e.g. 1,00,000)
    return `${symbol}${rounded.toLocaleString('en-IN')}`
  }
  return `${symbol}${rounded.toLocaleString('en-US')}`
}

export function getDaysInCurrentMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

export function getCurrentDayOfMonth(): number {
  return new Date().getDate()
}

export function getRemainingDaysInMonth(): number {
  const daysInMonth = getDaysInCurrentMonth()
  const today = getCurrentDayOfMonth()
  return Math.max(1, daysInMonth - today + 1)
}
