import { DailyBudgetCalculation } from './types'

export interface BudgetEngineInput {
  monthlyIncome: number
  fixedExpensesTotal: number
  savingsGoalAmount: number
  surplusMode: 'CARRY_OVER' | 'SAVE'
  expenses: {
    amount: number
    date: Date | string
    isEmergency?: boolean
  }[]
  referenceDate?: Date
}

export function calculateDailyBudget(input: BudgetEngineInput): DailyBudgetCalculation {
  const ref = input.referenceDate ? new Date(input.referenceDate) : new Date()
  const year = ref.getFullYear()
  const month = ref.getMonth() // 0-indexed (0 = Jan, 10 = Nov)
  const todayDay = ref.getDate()
  
  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const remainingDays = Math.max(1, daysInMonth - todayDay + 1)
  
  // Discretionary pool
  const discretionaryMonthlyPool = Math.max(0, input.monthlyIncome - input.fixedExpensesTotal - input.savingsGoalAmount)
  const baseDailyBudget = daysInMonth > 0 ? discretionaryMonthlyPool / daysInMonth : 0
  
  // Filter expenses for current month
  const monthExpenses = input.expenses.filter(exp => {
    const d = new Date(exp.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  
  // Separate emergency and regular expenses
  // Regular expenses count against the daily budget pool
  const regularMonthExpenses = monthExpenses.filter(e => !e.isEmergency)
  const totalSpentThisMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  // Expenses up to yesterday
  const pastExpenses = regularMonthExpenses.filter(exp => {
    const d = new Date(exp.date)
    return d.getDate() < todayDay
  })
  const pastSpentTotal = pastExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  // Expenses today
  const todayExpenses = regularMonthExpenses.filter(exp => {
    const d = new Date(exp.date)
    return d.getDate() === todayDay
  })
  const spentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  // Compute pool available for today and future days
  let remainingPoolForMonth = discretionaryMonthlyPool - pastSpentTotal
  let todayBudget = baseDailyBudget
  
  if (input.surplusMode === 'CARRY_OVER') {
    // Dynamically distributed over remaining days (today through end of month)
    todayBudget = remainingDays > 0 ? Math.max(0, remainingPoolForMonth / remainingDays) : 0
  } else {
    // Mode = SAVE:
    // If underspent in the past, surplus was saved, so daily budget stays at base.
    // If overspent in the past, deficit is deducted across remaining days!
    const expectedPastBudget = (todayDay - 1) * baseDailyBudget
    if (pastSpentTotal > expectedPastBudget) {
      // Overspent! Deficit must be recouped across remaining days
      todayBudget = remainingDays > 0 ? Math.max(0, remainingPoolForMonth / remainingDays) : 0
    } else {
      todayBudget = baseDailyBudget
    }
  }
  
  const todayRemaining = todayBudget - spentToday
  const todayOverspent = spentToday > todayBudget
  const todaySpentPercentage = todayBudget > 0 ? Math.min(200, Math.round((spentToday / todayBudget) * 100)) : 100
  
  // Status color determination
  let statusColor: 'green' | 'amber' | 'red' = 'green'
  if (spentToday > todayBudget) {
    statusColor = 'red'
  } else if (todaySpentPercentage >= 80) {
    statusColor = 'amber'
  } else {
    statusColor = 'green'
  }
  
  // Adjusted future daily budget (for days starting tomorrow)
  const daysAfterToday = Math.max(1, daysInMonth - todayDay)
  const poolAfterToday = Math.max(0, remainingPoolForMonth - spentToday)
  const adjustedFutureDailyBudget = daysAfterToday > 0 ? poolAfterToday / daysAfterToday : 0
  
  // Calculate total surplus or deficit across the month so far
  const totalDaysElapsed = todayDay
  const expectedSpendToDate = totalDaysElapsed * baseDailyBudget
  const actualSpendToDate = pastSpentTotal + spentToday
  
  const totalOverspentDeficit = actualSpendToDate > expectedSpendToDate ? actualSpendToDate - expectedSpendToDate : 0
  const totalUnderspentSurplus = expectedSpendToDate > actualSpendToDate ? expectedSpendToDate - actualSpendToDate : 0
  
  // Calculate no-spend days count
  const daysWithSpend = new Set(
    monthExpenses
      .filter(e => new Date(e.date).getDate() <= todayDay)
      .map(e => new Date(e.date).getDate())
  )
  const noSpendDaysCount = Math.max(0, todayDay - daysWithSpend.size)

  return {
    month: month + 1,
    year,
    daysInMonth,
    todayDay,
    remainingDays,
    monthlyIncome: input.monthlyIncome,
    fixedExpensesTotal: input.fixedExpensesTotal,
    savingsGoalAmount: input.savingsGoalAmount,
    discretionaryMonthlyPool,
    baseDailyBudget: Math.round(baseDailyBudget),
    spentToday: Math.round(spentToday),
    todayBudget: Math.round(todayBudget),
    todayRemaining: Math.round(todayRemaining),
    todayOverspent,
    todaySpentPercentage,
    totalSpentThisMonth: Math.round(totalSpentThisMonth),
    monthRemainingPool: Math.round(discretionaryMonthlyPool - totalSpentThisMonth),
    adjustedFutureDailyBudget: Math.round(adjustedFutureDailyBudget),
    statusColor,
    surplusMode: input.surplusMode,
    totalOverspentDeficit: Math.round(totalOverspentDeficit),
    totalUnderspentSurplus: Math.round(totalUnderspentSurplus),
    noSpendDaysCount,
  }
}
