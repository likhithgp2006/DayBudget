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
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!user || !user.budgetProfile) {
      return NextResponse.json({ error: 'Budget setup not completed' }, { status: 400 })
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed
    const todayDate = now.getDate()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    const fixedTotal = user.fixedExpenses.reduce((sum, f) => sum + f.amount, 0)
    const calculation = calculateDailyBudget({
      monthlyIncome: user.budgetProfile.monthlyIncome,
      fixedExpensesTotal: fixedTotal,
      savingsGoalAmount: user.budgetProfile.savingsGoalAmount,
      surplusMode: (user.surplusMode as 'CARRY_OVER' | 'SAVE') || 'CARRY_OVER',
      expenses: user.expenses.map(e => ({
        amount: e.amount,
        date: e.date,
        isEmergency: e.isEmergency,
      })),
    })

    // 1. Category Breakdown (Pie / Donut chart)
    const categoryTotals: Record<string, number> = {}
    let emergencyTotal = 0

    const currentMonthExpenses = user.expenses.filter(e => {
      const d = new Date(e.date)
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth
    })

    for (const exp of currentMonthExpenses) {
      categoryTotals[exp.categoryName] = (categoryTotals[exp.categoryName] || 0) + exp.amount
      if (exp.isEmergency) {
        emergencyTotal += exp.amount
      }
    }

    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value),
    })).sort((a, b) => b.value - a.value)

    // 2. Daily Spending vs Budget (Bar Chart for Day 1 to Today)
    const dailyData = []
    const baseDailyTarget = calculation.baseDailyBudget

    for (let day = 1; day <= Math.min(todayDate, daysInMonth); day++) {
      const dayExpenses = currentMonthExpenses.filter(e => new Date(e.date).getDate() === day)
      const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      const isEmergencyDay = dayExpenses.some(e => e.isEmergency)

      dailyData.push({
        day: `Day ${day}`,
        dayNumber: day,
        spent: Math.round(dayTotal),
        budget: baseDailyTarget,
        isOver: dayTotal > baseDailyTarget,
        isEmergency: isEmergencyDay,
      })
    }

    // 3. Monthly Cumulative Trend Line (Actual vs Ideal pace)
    const trendData = []
    let cumulativeActual = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const dayExpenses = currentMonthExpenses.filter(e => new Date(e.date).getDate() === day)
      const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      
      const idealCumulative = Math.round(day * baseDailyTarget)

      if (day <= todayDate) {
        cumulativeActual += dayTotal
        trendData.push({
          day: `${day}`,
          actual: Math.round(cumulativeActual),
          ideal: idealCumulative,
        })
      } else {
        trendData.push({
          day: `${day}`,
          ideal: idealCumulative,
        })
      }
    }

    // 4. Key Metrics
    const totalDaysElapsed = Math.max(1, todayDate)
    const averageDailySpend = Math.round(calculation.totalSpentThisMonth / totalDaysElapsed)
    const topCategory = categoryData[0]?.name || 'None'
    const topCategoryAmount = categoryData[0]?.value || 0

    return NextResponse.json({
      success: true,
      calculation,
      metrics: {
        averageDailySpend,
        topCategory,
        topCategoryAmount,
        emergencyTotal: Math.round(emergencyTotal),
        noSpendDaysCount: calculation.noSpendDaysCount,
        discretionaryPool: calculation.discretionaryMonthlyPool,
        totalSpent: calculation.totalSpentThisMonth,
        remainingPool: calculation.monthRemainingPool,
      },
      categoryData,
      dailyData,
      trendData,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 })
  }
}
