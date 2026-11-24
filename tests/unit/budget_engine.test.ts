import { calculateDailyBudget } from '../src/lib/budget-engine'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`)
  }
}

console.log('🧪 Running DayBudget Engine & Overspend Logic Unit Tests...\n')

// Test 1: Basic daily budget calculation with 30-day month
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [],
    referenceDate: new Date(2026, 10, 1), // Nov 1 (30 days total)
  })

  // Discretionary pool = 100000 - 40000 - 15000 = 45000
  // Nov has 30 days: 45000 / 30 = 1500/day
  assert(res.discretionaryMonthlyPool === 45000, `Pool should be 45000, got ${res.discretionaryMonthlyPool}`)
  assert(Math.round(res.baseDailyBudget) === 1500, `Base daily budget should be 1500, got ${res.baseDailyBudget}`)
  assert(Math.round(res.todayBudget) === 1500, `Day 1 budget should be 1500, got ${res.todayBudget}`)
  assert(res.statusColor === 'green', `Status color should be green with 0 spend`)
  console.log('✅ Test 1 Passed: Base Daily Budget Division (45,000 / 30 = 1,500/day)')
}

// Test 2: Month with 31 days (e.g. October)
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [],
    referenceDate: new Date(2026, 9, 1), // Oct 1 (31 days)
  })
  // 45000 / 31 = ~1451.61
  assert(res.daysInMonth === 31, `Oct must have 31 days, got ${res.daysInMonth}`)
  assert(Math.round(res.baseDailyBudget) === 1452, `Oct daily budget should be ~1452, got ${res.baseDailyBudget}`)
  console.log('✅ Test 2 Passed: 31-Day Month Calculation (45,000 / 31 = ~1,452/day)')
}

// Test 3: Month with 28 days (February non-leap year)
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [],
    referenceDate: new Date(2025, 1, 1), // Feb 1, 2025 (28 days)
  })
  // 45000 / 28 = ~1607.14
  assert(res.daysInMonth === 28, `Feb 2025 must have 28 days, got ${res.daysInMonth}`)
  assert(Math.round(res.baseDailyBudget) === 1607, `Feb daily budget should be ~1607, got ${res.baseDailyBudget}`)
  console.log('✅ Test 3 Passed: 28-Day Month Calculation (45,000 / 28 = ~1,607/day)')
}

// Test 4: Carry-over Surplus (Underspending carries forward)
{
  // Nov 1 to 5: Base is 1500/day.
  // Suppose on Nov 1 user spent 500 (surplus = 1000)
  // On Nov 2, remaining days = 29. Pool = 45000 - 500 = 44500.
  // Today's budget on Nov 2 should be 44500 / 29 = ~1534.48 (boosted!)
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 500, date: new Date(2026, 10, 1), isEmergency: false },
    ],
    referenceDate: new Date(2026, 10, 2), // Nov 2
  })

  assert(Math.round(res.todayBudget) === 1534, `Nov 2 budget should be boosted to ~1534, got ${res.todayBudget}`)
  console.log('✅ Test 4 Passed: Surplus Carry-Over Boosts Subsequent Days (1,500 -> 1,534)')
}

// Test 5: Overspending Deficit (Deficit is deducted across future days)
{
  // Nov 1: Base is 1500. User overspends by spending 4500 (deficit = 3000).
  // On Nov 2, remaining days = 29. Pool = 45000 - 4500 = 40500.
  // Nov 2 budget = 40500 / 29 = ~1396.55 (reduced to recoup deficit).
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 4500, date: new Date(2026, 10, 1), isEmergency: false },
    ],
    referenceDate: new Date(2026, 10, 2), // Nov 2
  })

  assert(Math.round(res.todayBudget) === 1397, `Nov 2 budget should be reduced to ~1397, got ${res.todayBudget}`)
  console.log('✅ Test 5 Passed: Overspend Deficit Deducted Across Future Days (1,500 -> 1,397)')
}

// Test 6: Today's Overspend Progress Bar & Color States
{
  // Budget is 1500.
  // Spend 1250 (83% -> Amber)
  const amberRes = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 1250, date: new Date(2026, 10, 1), isEmergency: false },
    ],
    referenceDate: new Date(2026, 10, 1),
  })
  assert(amberRes.statusColor === 'amber', `Status should be amber at 83%, got ${amberRes.statusColor}`)

  // Spend 1800 (>100% -> Red)
  const redRes = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 1800, date: new Date(2026, 10, 1), isEmergency: false },
    ],
    referenceDate: new Date(2026, 10, 1),
  })
  assert(redRes.statusColor === 'red', `Status should be red when over budget, got ${redRes.statusColor}`)
  assert(redRes.todayOverspent === true, `todayOverspent should be true`)
  assert(redRes.todayRemaining === -300, `todayRemaining should be -300`)
  console.log('✅ Test 6 Passed: Dynamic Color States (Green -> Amber -> Red) & Negative Remaining Balance')
}

// Test 7: Emergency Spend Isolation
{
  // Emergency expenses (e.g. medical surgery) are tagged isEmergency: true
  // They are tracked in monthly total spend, but isolated from daily budget pool penalty
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 5000, date: new Date(2026, 10, 1), isEmergency: true },
    ],
    referenceDate: new Date(2026, 10, 1),
  })

  assert(Math.round(res.todayBudget) === 1500, `Emergency spend should not reduce daily budget pool, got ${res.todayBudget}`)
  assert(res.totalSpentThisMonth === 5000, `Emergency spend is still reflected in monthly total spent`)
  console.log('✅ Test 7 Passed: Emergency Spend Tracked and Isolated from Daily Penalties')
}

console.log('\n🎉 ALL 7 BUDGET ENGINE UNIT TESTS PASSED WITH 100% SUCCESS!\n')
