import { NextResponse } from 'next/server'
import { getCurrentUserSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getCurrentUserSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: session.userId },
      orderBy: { date: 'desc' },
    })

    const headers = ['Date', 'Category', 'Amount', 'Payment Method', 'Is Emergency', 'Emergency Reason', 'Note']
    const rows = expenses.map(e => {
      const dateStr = new Date(e.date).toISOString().split('T')[0]
      const noteClean = (e.note || '').replace(/"/g, '""')
      const reasonClean = (e.emergencyReason || '').replace(/"/g, '""')
      return [
        dateStr,
        `"${e.categoryName}"`,
        e.amount,
        `"${e.paymentMethod}"`,
        e.isEmergency ? 'Yes' : 'No',
        `"${reasonClean}"`,
        `"${noteClean}"`,
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="daybudget_expenses_${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export CSV error:', error)
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 })
  }
}
