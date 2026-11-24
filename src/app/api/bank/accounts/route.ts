import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { mockBankProvider } from '@/lib/mockBank'

export async function GET() {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const accounts = await mockBankProvider.getAccounts(session.userId)
    const supportedBanks = await mockBankProvider.getSupportedBanks()

    return NextResponse.json({
      success: true,
      accounts,
      supportedBanks,
      isDemoMode: true,
    })
  } catch (err: any) {
    console.error('Fetch bank accounts error:', err)
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { bankId = 'bank_demo', accountType = 'SAVINGS', initialBalance, credentials } = body

    const account = await mockBankProvider.linkAccount({
      userId: session.userId,
      bankId,
      accountType,
      initialBalance: initialBalance ? parseFloat(initialBalance) : undefined,
      credentials,
    })

    return NextResponse.json({
      success: true,
      message: `${account.bankName} linked successfully! Generated 90 days of simulated transactions.`,
      account,
    })
  } catch (err: any) {
    console.error('Link account error:', err)
    return NextResponse.json({ error: err.message || 'Failed to link account' }, { status: 500 })
  }
}
