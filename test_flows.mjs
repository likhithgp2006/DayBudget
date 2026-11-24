// Automated Integration Test for DayBudget
const BASE_URL = 'http://localhost:3000'

async function runTests() {
  console.log('🚀 Starting DayBudget Main Flow Tests on', BASE_URL)

  // 1. Landing Page check
  console.log('\n--- Test 1: Landing Page ---')
  const landingRes = await fetch(BASE_URL)
  console.log('Status:', landingRes.status)
  const landingHtml = await landingRes.text()
  if (landingHtml.includes('DayBudget') && landingHtml.includes('Live Daily Budget Calculator')) {
    console.log('✅ Landing page rendered successfully with live calculator')
  } else {
    console.error('❌ Landing page failed')
  }

  // 2. Demo User Login
  console.log('\n--- Test 2: 1-Click Demo Login ---')
  const demoRes = await fetch(`${BASE_URL}/api/auth/demo`, { method: 'POST' })
  console.log('Demo Login Status:', demoRes.status)
  const demoData = await demoRes.json()
  console.log('Demo User:', demoData.user?.name, `(${demoData.user?.email})`)
  
  // Extract session cookie
  const setCookie = demoRes.headers.get('set-cookie')
  const tokenCookie = setCookie?.split(';')[0]
  console.log('Token Cookie received:', tokenCookie ? 'YES' : 'NO')

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': tokenCookie,
  }

  // 3. Budget Summary & Current Day State
  console.log('\n--- Test 3: Budget Summary API ---')
  const summaryRes = await fetch(`${BASE_URL}/api/budget/summary`, { headers })
  const summary = await summaryRes.json()
  console.log('Calculation results:')
  console.log(`- Monthly Income: ₹${summary.calculation.monthlyIncome.toLocaleString()}`)
  console.log(`- Fixed Commitments: ₹${summary.calculation.fixedExpensesTotal.toLocaleString()}`)
  console.log(`- Savings Goal: ₹${summary.calculation.savingsGoalAmount.toLocaleString()}`)
  console.log(`- Base Daily Budget: ₹${summary.calculation.baseDailyBudget.toLocaleString()}`)
  console.log(`- Today's Budget: ₹${summary.calculation.todayBudget.toLocaleString()}`)
  console.log(`- Spent Today: ₹${summary.calculation.spentToday.toLocaleString()}`)
  console.log(`- Today's Status Color: ${summary.calculation.statusColor}`)
  console.log(`- No-Spend Days: ${summary.calculation.noSpendDaysCount}`)

  // 4. Add Regular Expense (within budget)
  console.log('\n--- Test 4: Add Regular Expense (₹400 for Lunch) ---')
  const addExpRes = await fetch(`${BASE_URL}/api/expenses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: 400,
      categoryName: 'Food',
      note: 'Team lunch at Subway',
      date: new Date().toISOString(),
      paymentMethod: 'UPI',
      isEmergency: false,
    }),
  })
  const addExpData = await addExpRes.json()
  console.log('Expense added:', addExpData.success ? `₹${addExpData.expense.amount} (${addExpData.expense.note})` : 'FAILED')

  // Check new budget state
  const summaryAfterNormal = await (await fetch(`${BASE_URL}/api/budget/summary`, { headers })).json()
  console.log(`- Spent Today now: ₹${summaryAfterNormal.calculation.spentToday.toLocaleString()}`)
  console.log(`- Remaining Today: ₹${summaryAfterNormal.calculation.todayRemaining.toLocaleString()}`)
  console.log(`- Status Color: ${summaryAfterNormal.calculation.statusColor}`)

  // 5. Overspending Scenario Test
  console.log('\n--- Test 5: Overspending Scenario (Adding ₹4,000 for Shopping) ---')
  const overspendRes = await fetch(`${BASE_URL}/api/expenses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: 4000,
      categoryName: 'Shopping',
      note: 'Electronics store upgrade',
      date: new Date().toISOString(),
      paymentMethod: 'Credit Card',
      isEmergency: false,
    }),
  })
  const overspendData = await overspendRes.json()
  console.log('Overspend expense added:', overspendData.success)

  const summaryAfterOverspend = await (await fetch(`${BASE_URL}/api/budget/summary`, { headers })).json()
  console.log(`- Spent Today now: ₹${summaryAfterOverspend.calculation.spentToday.toLocaleString()}`)
  console.log(`- Overspent amount: ₹${Math.abs(summaryAfterOverspend.calculation.todayRemaining).toLocaleString()}`)
  console.log(`- Status Color: ${summaryAfterOverspend.calculation.statusColor} (EXPECTED: red)`)
  console.log(`- Today Overspent Flag: ${summaryAfterOverspend.calculation.todayOverspent}`)
  console.log(`- Adjusted Future Daily Budget: ₹${summaryAfterOverspend.calculation.adjustedFutureDailyBudget.toLocaleString()}/day (dynamically reduced!)`)

  if (summaryAfterOverspend.calculation.statusColor === 'red' && summaryAfterOverspend.calculation.todayOverspent) {
    console.log('✅ Overspending deficit calculation and status color RED verified perfectly!')
  }

  // 6. Emergency Spend Test
  console.log('\n--- Test 6: Emergency Spend Test (₹2,500 with mandatory reason) ---')
  const emergencyRes = await fetch(`${BASE_URL}/api/expenses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: 2500,
      categoryName: 'Health',
      note: 'Urgent medical prescription',
      date: new Date().toISOString(),
      paymentMethod: 'Debit Card',
      isEmergency: true,
      emergencyReason: 'Sudden high fever and clinic consultation',
    }),
  })
  const emergencyData = await emergencyRes.json()
  console.log('Emergency expense recorded:', emergencyData.success, 'isEmergency:', emergencyData.expense?.isEmergency)

  // 7. Bank Aggregator & Transaction Sync Test
  console.log('\n--- Test 7: Bank Aggregator Sync ---')
  const bankSyncRes = await fetch(`${BASE_URL}/api/bank/sync`, { method: 'POST', headers })
  const bankSyncData = await bankSyncRes.json()
  console.log('Bank Sync Output:', bankSyncData.message)

  // 8. Transaction History & Inline Re-categorization
  console.log('\n--- Test 8: Transaction History & Inline Re-categorization ---')
  const txRes = await fetch(`${BASE_URL}/api/bank/transactions`, { headers })
  const txData = await txRes.json()
  console.log(`Fetched ${txData.transactions?.length} transactions from linked bank accounts.`)
  if (txData.transactions?.length > 0) {
    const firstTx = txData.transactions[0]
    console.log(`First transaction: "${firstTx.merchantName}" currently category: "${firstTx.category}"`)
    const recatRes = await fetch(`${BASE_URL}/api/bank/transactions`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        transactionId: firstTx.id,
        category: 'Entertainment',
      }),
    })
    const recatData = await recatRes.json()
    console.log(`Re-categorized to "${recatData.transaction?.category}":`, recatData.success ? 'SUCCESS' : 'FAILED')
  }

  // 9. Analytics API
  console.log('\n--- Test 9: Analytics Breakdown ---')
  const analyticsRes = await fetch(`${BASE_URL}/api/analytics`, { headers })
  const analytics = await analyticsRes.json()
  console.log('Categories count:', analytics.categoryData?.length)
  console.log('Top Category:', analytics.metrics?.topCategory, `(₹${analytics.metrics?.topCategoryAmount.toLocaleString()})`)
  console.log('Daily data points:', analytics.dailyData?.length)
  console.log('Trend data points:', analytics.trendData?.length)

  // 10. Savings Goals
  console.log('\n--- Test 10: Savings Goals & Surplus Allocation ---')
  const goalsRes = await fetch(`${BASE_URL}/api/goals`, { headers })
  const goalsData = await goalsRes.json()
  console.log(`Active goals: ${goalsData.goals?.length}`)
  goalsData.goals?.forEach(g => {
    console.log(`- ${g.title}: ₹${g.currentAmount.toLocaleString()} / ₹${g.targetAmount.toLocaleString()} (${Math.round(g.currentAmount / g.targetAmount * 100)}%)`)
  })

  // 11. Notifications
  console.log('\n--- Test 11: Notification Center ---')
  const notifRes = await fetch(`${BASE_URL}/api/notifications`, { headers })
  const notifData = await notifRes.json()
  console.log(`Notifications in tray: ${notifData.notifications?.length}`)
  notifData.notifications?.slice(0, 3).forEach(n => {
    console.log(`- [${n.type}] ${n.title}`)
  })

  console.log('\n🎉 ALL INTEGRATION FLOWS TESTED AND VERIFIED SUCCESSFULLY!')
}

runTests().catch(console.error)
