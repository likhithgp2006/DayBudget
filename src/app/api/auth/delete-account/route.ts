import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { confirmation } = await req.json()
    if (confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Please type DELETE to confirm account deletion' }, { status: 400 })
    }

    // Cascade delete user data
    await prisma.notification.deleteMany({ where: { userId: session.userId } })
    await prisma.bankTransaction.deleteMany({ where: { userId: session.userId } })
    await prisma.expense.deleteMany({ where: { userId: session.userId } })
    await prisma.bankAccount.deleteMany({ where: { userId: session.userId } })
    await prisma.savingsGoal.deleteMany({ where: { userId: session.userId } })
    await prisma.fixedExpense.deleteMany({ where: { userId: session.userId } })
    await prisma.category.deleteMany({ where: { userId: session.userId } })
    await prisma.budgetProfile.deleteMany({ where: { userId: session.userId } })
    await prisma.user.delete({ where: { id: session.userId } })

    // Clear session cookie
    cookies().delete('token')

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
