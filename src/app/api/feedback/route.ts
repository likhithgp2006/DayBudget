import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { cleanText } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    // Rate limit: 5 submissions per 10 minutes
    const rateCheck = checkRateLimit(`feedback_${ip}`, 5, 10 * 60 * 1000)
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many submissions. Please wait ${Math.ceil(rateCheck.resetIn / 60000)} minutes before sending another message.` },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { name, email, category = 'General', subject, message, rating = 5, honeypot } = body

    // 1. Honeypot check: Bots fill hidden fields; real users don't see it
    if (honeypot && honeypot.trim().length > 0) {
      console.warn(`[SPAM BLOCKED] Honeypot triggered by IP ${ip}:`, honeypot)
      // Return 200 silently so bots believe they succeeded
      return NextResponse.json({
        success: true,
        message: 'Thank you for your feedback! Your message has been received.',
      })
    }

    // 2. Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Please enter your name' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    if (!subject || subject.trim().length < 3) {
      return NextResponse.json({ error: 'Subject must be at least 3 characters' }, { status: 400 })
    }

    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 })
    }

    // Optional user session
    const session = await getCurrentUserSession()

    // 3. Clean and store
    const cleanedName = cleanText(name, 100)
    const cleanedEmail = cleanText(email, 150).toLowerCase()
    const cleanedCategory = cleanText(category, 50)
    const cleanedSubject = cleanText(subject, 200)
    const cleanedMessage = cleanText(message, 3000)
    const parsedRating = Math.min(5, Math.max(1, parseInt(rating) || 5))

    const feedback = await prisma.feedback.create({
      data: {
        name: cleanedName,
        email: cleanedEmail,
        category: cleanedCategory,
        subject: cleanedSubject,
        message: cleanedMessage,
        rating: parsedRating,
        userId: session?.userId || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! Our engineering team will review it.',
      feedbackId: feedback.id,
    })
  } catch (error: any) {
    console.error('Feedback submission error:', error)
    return NextResponse.json({ error: 'Failed to submit feedback. Please try again later.' }, { status: 500 })
  }
}
