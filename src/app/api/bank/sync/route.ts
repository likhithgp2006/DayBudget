import { NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { mockBankProvider } from '@/lib/mockBank'

export async function POST() {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await mockBankProvider.sync(session.userId)

    return NextResponse.json({
      success: true,
      importedCount: result.count,
      message: `Sync complete. ${result.count} new simulated transactions pulled and auto-categorized.`,
      transactions: result.newTransactions,
    })
  } catch (err: any) {
    console.error('Bank sync error:', err)
    return NextResponse.json({ error: 'Failed to sync bank accounts' }, { status: 500 })
  }
}
