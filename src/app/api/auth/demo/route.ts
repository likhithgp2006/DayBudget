import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST() {
  try {
    let demoUser = await prisma.user.findUnique({
      where: { email: 'demo@daybudget.app' },
    })

    if (!demoUser) {
      // Auto create demo user if seed hasn't run yet
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@daybudget.app',
          name: 'Arjun Sharma',
          passwordHash: '$2a$10$wT8Ff62qTz21z.z.z.z.z.Oq.o71p6u8f1L0j1J1e1Z1a1b1c1d1e', // fallback hash
          currency: 'INR',
          surplusMode: 'CARRY_OVER',
          budgetProfile: {
            create: {
              monthlyIncome: 100000,
              savingsGoalPercent: 15,
              savingsGoalAmount: 15000,
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear(),
            }
          }
        }
      })
    }

    const token = signToken({
      userId: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        currency: demoUser.currency,
        surplusMode: demoUser.surplusMode,
      },
    })

    response.cookies.set('daybudget_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json({ error: 'Failed to log in as demo user' }, { status: 500 })
  }
}
