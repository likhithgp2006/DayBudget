import { NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      budgetProfile: true,
      fixedExpenses: true,
    },
  })

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 404 })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
      surplusMode: user.surplusMode,
      emergencyBuffer: user.emergencyBuffer,
      budgetProfile: user.budgetProfile,
      fixedExpenses: user.fixedExpenses,
    },
  })
}

export async function PATCH(req: Request) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await req.json()
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        currency: data.currency,
        surplusMode: data.surplusMode,
        name: data.name,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (err) {
    console.error('Update profile error:', err)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
