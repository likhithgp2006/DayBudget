import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { cleanText } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rateCheck = checkRateLimit(`register_${ip}`, 5, 60000)
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please wait ${Math.ceil(rateCheck.resetIn / 1000)} seconds.` },
        { status: 429 }
      )
    }

    const { email, password, name, currency = 'INR' } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cleanedName = cleanText(name, 100)
    if (cleanedName.length < 2) {
      return NextResponse.json({ error: 'Please provide a valid full name' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: cleanedName,
        passwordHash,
        currency,
        surplusMode: 'CARRY_OVER',
      },
    })

    // Seed default categories for new user
    const defaultCategories = [
      { name: 'Food', icon: 'Utensils', color: '#10b981' },
      { name: 'Transport', icon: 'Car', color: '#3b82f6' },
      { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
      { name: 'Bills', icon: 'Receipt', color: '#f59e0b' },
      { name: 'Health', icon: 'HeartPulse', color: '#ef4444' },
      { name: 'Entertainment', icon: 'Film', color: '#8b5cf6' },
      { name: 'Education', icon: 'GraduationCap', color: '#06b6d4' },
      { name: 'Other', icon: 'MoreHorizontal', color: '#6b7280' },
    ]

    for (const cat of defaultCategories) {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isCustom: false,
        },
      })
    }

    // Create initial welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to DayBudget! 🎉',
        message: 'Complete your monthly income & fixed expenses setup to activate your personalized daily budget.',
        type: 'SYSTEM',
      },
    })

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    })

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, currency: user.currency },
    })

    response.cookies.set('daybudget_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
