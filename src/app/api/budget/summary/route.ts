import { NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDailyBudget } from '@/lib/budget-engine'

export async function GET() {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        budgetProfile: true,
        fixedExpenses: true,
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.budgetProfile) {
      return NextResponse.json({
        hasSetupBudget: false,
        user: { name: user.name, currency: user.currency },
      })
    }

    const fixedExpensesTotal = user.fixedExpenses.reduce((sum, fe) => sum + fe.amount, 0)

    const calculation = calculateDailyBudget({
      monthlyIncome: user.budgetProfile.monthlyIncome,
      fixedExpensesTotal,
      savingsGoalAmount: user.budgetProfile.savingsGoalAmount,
      surplusMode: (user.surplusMode as 'CARRY_OVER' | 'SAVE') || 'CARRY_OVER',
      expenses: user.expenses.map(e => ({
        amount: e.amount,
        date: e.date,
        isEmergency: e.isEmergency,
      })),
    })

    // Today's expenses list
    const now = new Date()
    const todayExpenses = user.expenses.filter(e => {
      const d = new Date(e.date)
      return d.getDate() === now.getDate() &&
             d.getMonth() === now.getMonth() &&
             d.getFullYear() === now.getFullYear()
    })

    return NextResponse.json({
      hasSetupBudget: true,
      calculation,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        surplusMode: user.surplusMode,
      },
      fixedExpenses: user.fixedExpenses,
      todayExpenses,
    })
  } catch (error) {
    console.error('Budget summary error:', error)
    return NextResponse.json({ error: 'Failed to calculate budget summary' }, { status: 500 })
  }
}
