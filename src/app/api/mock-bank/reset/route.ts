import { NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { mockBankProvider } from '@/lib/mockBank'

export async function POST() {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await mockBankProvider.resetFakeData(session.userId)
    return NextResponse.json({
      success: true,
      message: 'Fake bank data successfully reset to clean default state with 90-day history.',
    })
  } catch (err: any) {
    console.error('Reset mock bank error:', err)
    return NextResponse.json({ error: err.message || 'Reset failed' }, { status: 500 })
  }
}
