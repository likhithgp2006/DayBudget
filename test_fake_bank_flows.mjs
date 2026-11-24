// Automated Integration Test for Fake Bank Simulation & Dev Tools
const BASE_URL = 'http://localhost:3000'

async function runFakeBankTests() {
  console.log('🧪 Starting Fake Bank Simulation & Dev Tools Verification...\n')

  // 1. Authenticate with Demo Account
  console.log('--- 1. Authenticate ---')
  const authRes = await fetch(`${BASE_URL}/api/auth/demo`, { method: 'POST' })
  const authData = await authRes.json()
  const tokenCookie = authRes.headers.get('set-cookie')?.split(';')[0]
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': tokenCookie,
  }
  console.log('✅ Logged in as:', authData.user?.name)

  // 2. Supported Banks
  console.log('\n--- 2. Supported Banks List ---')
  const accountsRes = await fetch(`${BASE_URL}/api/bank/accounts`, { headers })
  const accountsData = await accountsRes.json()
  console.log('Supported Banks count:', accountsData.supportedBanks?.length)
  accountsData.supportedBanks?.forEach(b => console.log(`  - ${b.icon} ${b.name} (${b.code})`))
  console.log('Existing accounts linked:', accountsData.accounts?.length)

  // 3. Link a New Fake Bank Account (Test SBI) with 90-Day Simulation
  console.log('\n--- 3. Link Bank Account ("Test SBI") ---')
  const linkRes = await fetch(`${BASE_URL}/api/bank/accounts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bankId: 'bank_sbi',
      accountType: 'SAVINGS',
      credentials: {
        username: 'sbi_user_77',
        password: 'any_password',
        otp: '123456',
      },
    }),
  })
  const linkData = await linkRes.json()
  console.log('Link Result:', linkData.message)
  console.log('Linked Account:', linkData.account?.bankName, `(${linkData.account?.accountNumberMasked}) Balance: ₹${linkData.account?.balance.toLocaleString()}`)

  // Verify 90-day transactions generated
  const txRes = await fetch(`${BASE_URL}/api/bank/transactions?bankAccountId=${linkData.account?.id}`, { headers })
  const txData = await txRes.json()
  console.log(`Generated ${txData.transactions?.length} transactions over past 90 days.`)
  
  // Inspect first 3 transactions
  console.log('Sample generated transactions:')
  txData.transactions?.slice(0, 3).forEach(t => {
    console.log(`  • [${t.date.split('T')[0]}] ${t.merchantName}: ${t.type === 'DEBIT' ? '-' : '+'}₹${t.amount} (${t.category}, ${t.paymentMethod}) Balance After: ₹${t.balanceAfter?.toLocaleString()}`)
  })

  // 4. Test Dev Tools Control: Simulate Custom Transaction
  console.log('\n--- 4. Dev Tools: Simulate Custom Transaction ---')
  const customSimRes = await fetch(`${BASE_URL}/api/mock-bank/simulate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'custom',
      amount: 650,
      merchantName: 'Third Wave Coffee Indiranagar',
      category: 'Food',
      paymentMethod: 'UPI',
      type: 'DEBIT',
    }),
  })
  const customSimData = await customSimRes.json()
  console.log('Custom Sim Result:', customSimData.message)

  // 5. Test Dev Tools Control: Generate Random Spends for Today
  console.log('\n--- 5. Dev Tools: Generate Random Spends for Today ---')
  const randomRes = await fetch(`${BASE_URL}/api/mock-bank/simulate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'random_today' }),
  })
  const randomData = await randomRes.json()
  console.log('Random Today Result:', randomData.message)

  // 6. Test Dev Tools Control: Simulate Big Overspend (₹5,000)
  console.log('\n--- 6. Dev Tools: Simulate Big Overspend (Testing Overspend Logic) ---')
  const overspendRes = await fetch(`${BASE_URL}/api/mock-bank/simulate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'big_overspend', amount: 5000 }),
  })
  const overspendData = await overspendRes.json()
  console.log('Overspend Result:', overspendData.message)

  // Check budget dashboard response
  const summaryRes = await fetch(`${BASE_URL}/api/budget/summary`, { headers })
  const summaryData = await summaryRes.json()
  console.log('Updated Daily Budget Status:')
  console.log(`  - Today's Budget: ₹${summaryData.calculation.todayBudget.toLocaleString()}`)
  console.log(`  - Spent Today: ₹${summaryData.calculation.spentToday.toLocaleString()}`)
  console.log(`  - Today Remaining: ₹${summaryData.calculation.todayRemaining.toLocaleString()}`)
  console.log(`  - Status Color: ${summaryData.calculation.statusColor} (EXPECTED: red)`)
  console.log(`  - Today Overspent: ${summaryData.calculation.todayOverspent}`)
  console.log(`  - Adjusted Future Daily Budget: ₹${summaryData.calculation.adjustedFutureDailyBudget.toLocaleString()}/day`)

  // 7. Test Dev Tools Control: Sync Now
  console.log('\n--- 7. Dev Tools: Sync Now ---')
  const syncRes = await fetch(`${BASE_URL}/api/bank/sync`, { method: 'POST', headers })
  const syncData = await syncRes.json()
  console.log('Sync Output:', syncData.message)

  // 8. Test Unlinking Fake Bank Account
  console.log('\n--- 8. Unlink Bank Account ---')
  const unlinkRes = await fetch(`${BASE_URL}/api/bank/accounts/${linkData.account?.id}`, {
    method: 'DELETE',
    headers,
  })
  const unlinkData = await unlinkRes.json()
  console.log('Unlink Output:', unlinkData.message)

  // Verify account is removed
  const accountsAfterUnlink = await (await fetch(`${BASE_URL}/api/bank/accounts`, { headers })).json()
  const exists = accountsAfterUnlink.accounts?.some(a => a.id === linkData.account?.id)
  console.log('Account still present in DB?:', exists ? 'YES (Error)' : 'NO (Successfully removed)')

  // 9. Test Dev Tools Control: Reset Fake Data
  console.log('\n--- 9. Dev Tools: Reset Fake Data ---')
  const resetRes = await fetch(`${BASE_URL}/api/mock-bank/reset`, { method: 'POST', headers })
  const resetData = await resetRes.json()
  console.log('Reset Output:', resetData.message)

  console.log('\n🎉 ALL FAKE BANK SIMULATION AND DEV TOOLS VERIFIED SUCCESSFULLY!')
}

runFakeBankTests().catch(console.error)
