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
      take: 100,
    })

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DayBudget Expense Statement</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #0d9488; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; gap: 32px; }
    .summary-item { font-size: 14px; }
    .summary-value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-emergency { background: #ffe4e6; color: #e11d48; }
    .text-right { text-align: right; }
    @media print {
      body { margin: 20px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <h1>DayBudget</h1>
  <div class="subtitle">Expense History Statement & Summary • Generated on ${new Date().toLocaleDateString()}</div>

  <div class="summary-card">
    <div class="summary-item">
      <div>Total Recorded Expenses</div>
      <div class="summary-value">${expenses.length}</div>
    </div>
    <div class="summary-item">
      <div>Total Amount Spent</div>
      <div class="summary-value">₹${totalSpent.toLocaleString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description / Note</th>
        <th>Payment Method</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(e => `
        <tr>
          <td>${new Date(e.date).toLocaleDateString()}</td>
          <td><b>${e.categoryName}</b></td>
          <td>
            ${e.note || '-'}
            ${e.isEmergency ? `<br><span class="badge badge-emergency">Emergency: ${e.emergencyReason || 'Urgent spend'}</span>` : ''}
          </td>
          <td>${e.paymentMethod}</td>
          <td class="text-right font-bold">₹${e.amount.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      // Auto-prompt print to PDF in browser
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Export print/pdf error:', error)
    return NextResponse.json({ error: 'Failed to export document' }, { status: 500 })
  }
}
