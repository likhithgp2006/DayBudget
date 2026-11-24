import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await req.json()

    // Ensure the expense belongs to user
    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
        categoryName: body.categoryName,
        note: body.note,
        date: body.date ? new Date(body.date) : undefined,
        paymentMethod: body.paymentMethod,
        isEmergency: body.isEmergency,
        emergencyReason: body.emergencyReason,
      },
    })

    return NextResponse.json({ success: true, expense: updated })
  } catch (error) {
    console.error('Update expense error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params

    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Expense deleted' })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
