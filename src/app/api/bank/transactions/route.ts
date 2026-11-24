import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const bankAccountId = searchParams.get('bankAccountId')
    const type = searchParams.get('type') // DEBIT or CREDIT
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = { userId: session.userId }

    if (category && category !== 'All') {
      where.category = category
    }

    if (bankAccountId && bankAccountId !== 'All') {
      where.bankAccountId = bankAccountId
    }

    if (type && type !== 'All') {
      where.type = type
    }

    if (search) {
      where.OR = [
        { merchantName: { contains: search } },
        { rawDescription: { contains: search } },
        { category: { contains: search } },
      ]
    }

    const orderBy: any = {}
    if (sortBy === 'amount') {
      orderBy.amount = sortOrder === 'asc' ? 'asc' : 'desc'
    } else {
      orderBy.date = sortOrder === 'asc' ? 'asc' : 'desc'
    }

    const transactions = await prisma.bankTransaction.findMany({
      where,
      include: {
        bankAccount: {
          select: { bankName: true, accountNumberMasked: true, accountType: true },
        },
      },
      orderBy,
    })

    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    console.error('Fetch transactions error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { transactionId, category } = await req.json()

    if (!transactionId || !category) {
      return NextResponse.json({ error: 'transactionId and category are required' }, { status: 400 })
    }

    const btx = await prisma.bankTransaction.findFirst({
      where: { id: transactionId, userId: session.userId },
    })

    if (!btx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const updated = await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: { category },
    })

    // If an associated expense exists, update that category too!
    if (btx.expenseId) {
      await prisma.expense.update({
        where: { id: btx.expenseId },
        data: { categoryName: category },
      })
    }

    return NextResponse.json({ success: true, transaction: updated })
  } catch (error) {
    console.error('Update transaction category error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}
