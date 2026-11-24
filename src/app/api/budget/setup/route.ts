import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const {
      monthlyIncome,
      savingsGoalPercent = 0,
      savingsGoalAmount = 0,
      surplusMode = 'CARRY_OVER',
      currency = 'INR',
      fixedExpenses = [], // array of { name, amount, category, dueDay }
    } = await req.json()

    if (!monthlyIncome || monthlyIncome <= 0) {
      return NextResponse.json({ error: 'Monthly income is required and must be positive' }, { status: 400 })
    }

    const calculatedSavingsAmount = savingsGoalAmount > 0 
      ? savingsGoalAmount 
      : (monthlyIncome * (savingsGoalPercent / 100))

    // Update user profile settings
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        surplusMode,
        currency,
      },
    })

    const now = new Date()
    // Upsert budget profile
    const profile = await prisma.budgetProfile.upsert({
      where: { userId: session.userId },
      update: {
        monthlyIncome,
        savingsGoalPercent,
        savingsGoalAmount: calculatedSavingsAmount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      create: {
        userId: session.userId,
        monthlyIncome,
        savingsGoalPercent,
        savingsGoalAmount: calculatedSavingsAmount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    })

    // Replace or add fixed expenses
    if (Array.isArray(fixedExpenses) && fixedExpenses.length > 0) {
      await prisma.fixedExpense.deleteMany({
        where: { userId: session.userId },
      })

      for (const item of fixedExpenses) {
        if (item.name && item.amount > 0) {
          await prisma.fixedExpense.create({
            data: {
              userId: session.userId,
              name: item.name,
              amount: parseFloat(item.amount),
              category: item.category || 'Bills',
              dueDay: item.dueDay ? parseInt(item.dueDay) : 1,
              isRecurring: true,
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Budget setup error:', error)
    return NextResponse.json({ error: 'Failed to save budget settings' }, { status: 500 })
  }
}
