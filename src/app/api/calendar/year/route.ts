import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDailyBudget } from '@/lib/budget-engine'

export async function GET(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const yearParam = searchParams.get('year')
    const currentYear = yearParam ? parseInt(yearParam) : new Date().getFullYear()

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        budgetProfile: true,
        fixedExpenses: true,
        expenses: {
          where: {
            date: {
              gte: new Date(currentYear, 0, 1),
              lte: new Date(currentYear, 11, 31, 23, 59, 59),
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const monthlyIncome = user.budgetProfile?.monthlyIncome || 0
    const fixedTotal = user.fixedExpenses.reduce((sum, f) => sum + f.amount, 0)
    const savingsAmount = user.budgetProfile?.savingsGoalAmount || 0
    const monthlyDiscretionary = Math.max(0, monthlyIncome - fixedTotal - savingsAmount)
    const annualIncome = monthlyIncome * 12
    const annualFixed = fixedTotal * 12
    const annualSavings = savingsAmount * 12
    const annualDiscretionary = monthlyDiscretionary * 12

    const monthsData = []
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    for (let m = 0; m < 12; m++) {
      const daysInThisMonth = new Date(currentYear, m + 1, 0).getDate()
      const baseDaily = daysInThisMonth > 0 ? monthlyDiscretionary / daysInThisMonth : 0

      // Get expenses for this month
      const monthExpenses = user.expenses.filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === m && d.getFullYear() === currentYear
      })

      const spentTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
      const daysMap: { [day: number]: { spent: number; count: number } } = {}
      for (let day = 1; day <= daysInThisMonth; day++) {
        daysMap[day] = { spent: 0, count: 0 }
      }

      monthExpenses.forEach(e => {
        const day = new Date(e.date).getDate()
        if (daysMap[day]) {
          daysMap[day].spent += e.amount
          daysMap[day].count += 1
        }
      })

      const daysList = []
      for (let day = 1; day <= daysInThisMonth; day++) {
        const spent = daysMap[day].spent
        const remaining = baseDaily - spent
        let status = 'normal'
        if (spent > baseDaily) status = 'over'
        else if (spent > 0 && spent >= baseDaily * 0.8) status = 'warning'
        else if (spent === 0) status = 'no-spend'
        else status = 'safe'

        daysList.push({
          day,
          date: new Date(currentYear, m, day).toISOString(),
          dailyAllowance: Math.round(baseDaily),
          spent: Math.round(spent),
          remaining: Math.round(remaining),
          status,
          transactionCount: daysMap[day].count,
        })
      }

      monthsData.push({
        monthIndex: m,
        monthName: monthNames[m],
        daysInMonth: daysInThisMonth,
        baseDailyBudget: Math.round(baseDaily),
        monthlyBudget: Math.round(monthlyDiscretionary),
        totalSpent: Math.round(spentTotal),
        remainingBudget: Math.round(monthlyDiscretionary - spentTotal),
        days: daysList,
      })
    }

    return NextResponse.json({
      success: true,
      year: currentYear,
      currency: user.currency || 'INR',
      annualSummary: {
        annualIncome,
        annualFixed,
        annualSavings,
        annualDiscretionary,
        daysInYear: new Date(currentYear, 1, 29).getMonth() === 1 ? 366 : 365,
        averageDailyBudget: Math.round(annualDiscretionary / (new Date(currentYear, 1, 29).getMonth() === 1 ? 366 : 365)),
      },
      months: monthsData,
    })
  } catch (error) {
    console.error('Yearly calendar error:', error)
    return NextResponse.json({ error: 'Failed to generate yearly calendar' }, { status: 500 })
  }
}
