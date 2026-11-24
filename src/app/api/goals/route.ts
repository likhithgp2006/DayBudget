import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, goals })
  } catch (error) {
    console.error('Fetch goals error:', error)
    return NextResponse.json({ error: 'Failed to fetch savings goals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, targetAmount, currentAmount = 0, targetDate, icon = 'Target', color = 'teal' } = await req.json()

    if (!title || !targetAmount || targetAmount <= 0) {
      return NextResponse.json({ error: 'Title and positive target amount are required' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: session.userId,
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
        icon,
        color,
        isCompleted: parseFloat(currentAmount) >= parseFloat(targetAmount),
      },
    })

    return NextResponse.json({ success: true, goal })
  } catch (error) {
    console.error('Create goal error:', error)
    return NextResponse.json({ error: 'Failed to create savings goal' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { goalId, addAmount, setAmount } = await req.json()

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId: session.userId },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    let newCurrent = goal.currentAmount
    if (addAmount !== undefined) {
      newCurrent = Math.max(0, newCurrent + parseFloat(addAmount))
    } else if (setAmount !== undefined) {
      newCurrent = Math.max(0, parseFloat(setAmount))
    }

    const isCompleted = newCurrent >= goal.targetAmount

    const updated = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: newCurrent,
        isCompleted,
      },
    })

    return NextResponse.json({ success: true, goal: updated })
  } catch (error) {
    console.error('Update goal error:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const goalId = searchParams.get('id')

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId: session.userId },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    await prisma.savingsGoal.delete({
      where: { id: goalId },
    })

    return NextResponse.json({ success: true, message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Delete goal error:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}

