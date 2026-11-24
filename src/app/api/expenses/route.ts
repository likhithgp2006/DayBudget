import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDailyBudget } from '@/lib/budget-engine'
import { cleanText } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const paymentMethod = searchParams.get('paymentMethod')
    const isEmergency = searchParams.get('isEmergency')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build Prisma where clause
    const where: any = { userId: session.userId }

    if (category && category !== 'All') {
      where.categoryName = category
    }

    if (paymentMethod && paymentMethod !== 'All') {
      where.paymentMethod = paymentMethod
    }

    if (isEmergency !== null && isEmergency !== undefined && isEmergency !== '') {
      where.isEmergency = isEmergency === 'true'
    }

    if (search) {
      where.OR = [
        { note: { contains: search } },
        { categoryName: { contains: search } },
        { paymentMethod: { contains: search } },
        { emergencyReason: { contains: search } },
      ]
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.date.lte = end
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, expenses })
  } catch (error) {
    console.error('Fetch expenses error:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const {
      amount,
      categoryName = 'Other',
      note = '',
      date = new Date().toISOString(),
      paymentMethod = 'UPI',
      isEmergency = false,
      emergencyReason = '',
      isRecurring = false,
      recurringFrequency = null,
    } = await req.json()

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'A valid positive amount is required' }, { status: 400 })
    }

    if (parsedAmount > 100000000) {
      return NextResponse.json({ error: 'Amount exceeds maximum allowable limit' }, { status: 400 })
    }

    const cleanNote = cleanText(note, 250)
    const cleanReason = isEmergency ? cleanText(emergencyReason, 300) : null

    if (isEmergency && (!cleanReason || cleanReason.length < 3)) {
      return NextResponse.json({ error: 'Please provide a valid emergency reason (at least 3 characters)' }, { status: 400 })
    }

    let expenseDate = new Date(date)
    if (isNaN(expenseDate.getTime())) {
      expenseDate = new Date()
    }

    const expense = await prisma.expense.create({
      data: {
        userId: session.userId,
        amount: parsedAmount,
        categoryName: cleanText(categoryName, 50) || 'Other',
        note: cleanNote,
        date: expenseDate,
        paymentMethod: cleanText(paymentMethod, 30) || 'UPI',
        isEmergency,
        emergencyReason: cleanReason,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : null,
      },
    })

    // Now check if budget threshold notifications should be created
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        budgetProfile: true,
        fixedExpenses: true,
        expenses: true,
      },
    })

    if (user && user.budgetProfile) {
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

      const symbol = user.currency === 'INR' ? '₹' : '$'

      if (calculation.todayOverspent) {
        await prisma.notification.create({
          data: {
            userId: session.userId,
            title: '⚠️ Daily Budget Exceeded!',
            message: `You spent ${symbol}${calculation.spentToday.toLocaleString()} today, exceeding your ${symbol}${calculation.todayBudget.toLocaleString()} daily target by ${symbol}${Math.abs(calculation.todayRemaining).toLocaleString()}. The deficit has been adjusted across your remaining days.`,
            type: 'THRESHOLD_100',
          },
        })
      } else if (calculation.todaySpentPercentage >= 80) {
        await prisma.notification.create({
          data: {
            userId: session.userId,
            title: '⚡ 80% Daily Budget Alert',
            message: `You have used ${calculation.todaySpentPercentage}% of today's budget (${symbol}${calculation.spentToday.toLocaleString()} of ${symbol}${calculation.todayBudget.toLocaleString()}). Only ${symbol}${calculation.todayRemaining.toLocaleString()} remaining today.`,
            type: 'THRESHOLD_80',
          },
        })
      }
    }

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
