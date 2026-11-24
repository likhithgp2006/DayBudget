import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { mockBankProvider } from '@/lib/mockBank'

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action = 'custom', amount, merchantName, category, paymentMethod, type = 'DEBIT' } = body

    if (action === 'random_today') {
      const generated = await mockBankProvider.generateRandomTodayTransactions(session.userId)
      return NextResponse.json({
        success: true,
        message: `Generated ${generated.length} random simulated transactions for today!`,
        transactions: generated,
      })
    }

    if (action === 'big_overspend') {
      const overspendAmount = amount ? parseFloat(amount) : 5000
      const tx = await mockBankProvider.simulateBigOverspend(session.userId, overspendAmount)
      return NextResponse.json({
        success: true,
        message: `Simulated big overspend of ₹${overspendAmount.toLocaleString()}! Daily budget exceeded.`,
        transaction: tx,
      })
    }

    // Default: Custom transaction
    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'A valid transaction amount is required' }, { status: 400 })
    }

    const tx = await mockBankProvider.simulateTransaction({
      userId: session.userId,
      amount: parseFloat(amount),
      merchantName: merchantName || 'Simulated Merchant',
      category,
      paymentMethod,
      type: type as 'DEBIT' | 'CREDIT',
      date: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `Simulated transaction of ₹${parseFloat(amount).toLocaleString()} (${tx.merchantName}) recorded!`,
      transaction: tx,
    })
  } catch (err: any) {
    console.error('Simulate transaction error:', err)
    return NextResponse.json({ error: err.message || 'Simulation failed' }, { status: 500 })
  }
}
