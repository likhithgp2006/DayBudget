export interface DailyBudgetCalculation {
  month: number
  year: number
  daysInMonth: number
  todayDay: number
  remainingDays: number
  
  monthlyIncome: number
  fixedExpensesTotal: number
  savingsGoalAmount: number
  discretionaryMonthlyPool: number
  baseDailyBudget: number
  
  spentToday: number
  todayBudget: number
  todayRemaining: number
  todayOverspent: boolean
  todaySpentPercentage: number
  
  totalSpentThisMonth: number
  monthRemainingPool: number
  adjustedFutureDailyBudget: number
  
  statusColor: 'green' | 'amber' | 'red' // safe, warning (>80%), over budget (>100%)
  surplusMode: 'CARRY_OVER' | 'SAVE'
  totalOverspentDeficit: number
  totalUnderspentSurplus: number
  noSpendDaysCount: number
}

export interface BankAccountDTO {
  id: string
  bankName: string
  accountType: string
  accountNumberMasked: string
  balance: number
  status: 'CONNECTED' | 'SYNCING' | 'DISCONNECTED'
  provider: string
  lastSyncedAt: string
}

export interface BankTransactionDTO {
  id: string
  bankAccountId: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  merchantName: string
  rawDescription: string
  date: string
  category: string
  isCategorized: boolean
  syncedToExpense: boolean
  expenseId?: string
}
