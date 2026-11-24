import { NextRequest, NextResponse } from 'next/server'
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
        expenses: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if a morning greeting already exists for today
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const existingGreeting = user.notifications.find(
      n => n.type === 'MORNING_GREETING' && new Date(n.createdAt) >= startOfToday
    )

    if (!existingGreeting && user.budgetProfile) {
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
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `Good morning, ${user.name.split(' ')[0]}! ☀️`,
          message: `Today's budget is ${symbol}${calculation.todayBudget.toLocaleString()}. Aim to stay within this limit to hit your monthly goals!`,
          type: 'MORNING_GREETING',
        },
      })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { notificationId, markAllRead } = await req.json()

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'All marked as read' })
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'Notification marked as read' })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
