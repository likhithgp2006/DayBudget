import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { mockBankProvider } from '@/lib/mockBank'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params
    const success = await mockBankProvider.unlinkAccount(id, session.userId)

    if (!success) {
      return NextResponse.json({ error: 'Account not found or could not be unlinked' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Account and associated mock data unlinked successfully',
    })
  } catch (err: any) {
    console.error('Unlink account error:', err)
    return NextResponse.json({ error: 'Failed to unlink account' }, { status: 500 })
  }
}
