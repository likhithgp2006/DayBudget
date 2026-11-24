import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'DayBudget_Project_Report.html')
    const html = fs.readFileSync(filePath, 'utf8')

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
}
