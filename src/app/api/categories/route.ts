import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const customCategories = await prisma.category.findMany({
    where: { userId: session.userId },
  })

  // Combine defaults and custom categories
  const allNames = new Set(defaultCategories.map(c => c.name))
  const filteredCustom = customCategories.filter(c => !allNames.has(c.name))

  return NextResponse.json({
    categories: [...defaultCategories, ...filteredCustom],
  })
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, icon = 'Tag', color = '#14b8a6' } = await req.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        icon,
        color,
        isCustom: true,
      },
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
