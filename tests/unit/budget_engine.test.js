const fs = require('fs');

function calculateDailyBudget(input) {
  const ref = input.referenceDate ? new Date(input.referenceDate) : new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const todayDay = ref.getDate();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - todayDay + 1);
  
  const discretionaryMonthlyPool = Math.max(0, input.monthlyIncome - input.fixedExpensesTotal - input.savingsGoalAmount);
  const baseDailyBudget = daysInMonth > 0 ? discretionaryMonthlyPool / daysInMonth : 0;
  
  const monthExpenses = input.expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  
  const regularMonthExpenses = monthExpenses.filter(e => !e.isEmergency);
  const totalSpentThisMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const pastExpenses = regularMonthExpenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getDate() < todayDay;
  });
  const pastSpentTotal = pastExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const todayExpenses = regularMonthExpenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getDate() === todayDay;
  });
  const spentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  let remainingPoolForMonth = discretionaryMonthlyPool - pastSpentTotal;
  let todayBudget = baseDailyBudget;
  
  if (input.surplusMode === 'CARRY_OVER') {
    todayBudget = remainingDays > 0 ? Math.max(0, remainingPoolForMonth / remainingDays) : 0;
  } else {
    const expectedPastBudget = (todayDay - 1) * baseDailyBudget;
    if (pastSpentTotal > expectedPastBudget) {
      todayBudget = remainingDays > 0 ? Math.max(0, remainingPoolForMonth / remainingDays) : 0;
    } else {
      todayBudget = baseDailyBudget;
    }
  }
  
  const todayRemaining = todayBudget - spentToday;
  const todayOverspent = spentToday > todayBudget;
  const todaySpentPercentage = todayBudget > 0 ? Math.min(200, Math.round((spentToday / todayBudget) * 100)) : 100;
  
  let statusColor = 'green';
  if (spentToday > todayBudget) {
    statusColor = 'red';
  } else if (todaySpentPercentage >= 80) {
    statusColor = 'amber';
  } else {
    statusColor = 'green';
  }
  
  const daysAfterToday = Math.max(1, daysInMonth - todayDay);
  const poolAfterToday = Math.max(0, remainingPoolForMonth - spentToday);
  const adjustedFutureDailyBudget = daysAfterToday > 0 ? poolAfterToday / daysAfterToday : 0;
  
  return {
    daysInMonth,
    remainingDays,
    discretionaryMonthlyPool,
    baseDailyBudget,
    todayBudget,
    spentToday,
    todayRemaining,
    todaySpentPercentage,
    todayOverspent,
    statusColor,
    adjustedFutureDailyBudget,
    totalSpentThisMonth,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

console.log('🧪 Running DayBudget Engine & Overspend Logic Unit Tests...\n');

// Test 1: Basic daily budget calculation with 30-day month
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [],
    referenceDate: new Date(2026, 10, 1),
  });
  assert(res.discretionaryMonthlyPool === 45000, `Pool should be 45000, got ${res.discretionaryMonthlyPool}`);
  assert(Math.round(res.baseDailyBudget) === 1500, `Base daily budget should be 1500, got ${res.baseDailyBudget}`);
  assert(Math.round(res.todayBudget) === 1500, `Day 1 budget should be 1500, got ${res.todayBudget}`);
  assert(res.statusColor === 'green', `Status color should be green with 0 spend`);
  console.log('✅ Test 1 Passed: Base Daily Budget Division (45,000 / 30 = 1,500/day)');
}

// Test 2: Month with 31 days (e.g. October)
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [],
    referenceDate: new Date(2026, 9, 1),
  });
  assert(res.daysInMonth === 31, `Oct must have 31 days, got ${res.daysInMonth}`);
  assert(Math.round(res.baseDailyBudget) === 1452, `Oct daily budget should be ~1452, got ${res.baseDailyBudget}`);
  console.log('✅ Test 2 Passed: 31-Day Month Calculation (45,000 / 31 = ~1,452/day)');
}

// Test 3: Month with 28 days (February non-leap year)
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [],
    referenceDate: new Date(2025, 1, 1),
  });
  assert(res.daysInMonth === 28, `Feb 2025 must have 28 days, got ${res.daysInMonth}`);
  assert(Math.round(res.baseDailyBudget) === 1607, `Feb daily budget should be ~1607, got ${res.baseDailyBudget}`);
  console.log('✅ Test 3 Passed: 28-Day Month Calculation (45,000 / 28 = ~1,607/day)');
}

// Test 4: Carry-over Surplus (Underspending carries forward)
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 500, date: new Date(2026, 10, 1), isEmergency: false },
    ],
    referenceDate: new Date(2026, 10, 2),
  });
  assert(Math.round(res.todayBudget) === 1534, `Nov 2 budget should be boosted to ~1534, got ${res.todayBudget}`);
  console.log('✅ Test 4 Passed: Surplus Carry-Over Boosts Subsequent Days (1,500 -> 1,534)');
}

// Test 5: Overspending Deficit (Deficit is deducted across future days)
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 4500, date: new Date(2026, 10, 1), isEmergency: false },
    ],
    referenceDate: new Date(2026, 10, 2),
  });
  assert(Math.round(res.todayBudget) === 1397, `Nov 2 budget should be reduced to ~1397, got ${res.todayBudget}`);
  console.log('✅ Test 5 Passed: Overspend Deficit Deducted Across Future Days (1,500 -> 1,397)');
}

// Test 6: Today's Overspend Progress Bar & Color States
{
  const amberRes = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 1250, date: new Date(2026, 10, 1), isEmergency: false },
    ],
    referenceDate: new Date(2026, 10, 1),
  });
  assert(amberRes.statusColor === 'amber', `Status should be amber at 83%, got ${amberRes.statusColor}`);

  const redRes = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 1800, date: new Date(2026, 10, 1), isEmergency: false },
    ],
    referenceDate: new Date(2026, 10, 1),
  });
  assert(redRes.statusColor === 'red', `Status should be red when over budget, got ${redRes.statusColor}`);
  assert(redRes.todayOverspent === true, `todayOverspent should be true`);
  assert(redRes.todayRemaining === -300, `todayRemaining should be -300`);
  console.log('✅ Test 6 Passed: Dynamic Color States (Green -> Amber -> Red) & Negative Remaining Balance');
}

// Test 7: Emergency Spend Isolation
{
  const res = calculateDailyBudget({
    monthlyIncome: 100000,
    fixedExpensesTotal: 40000,
    savingsGoalAmount: 15000,
    surplusMode: 'CARRY_OVER',
    expenses: [
      { amount: 5000, date: new Date(2026, 10, 1), isEmergency: true },
    ],
    referenceDate: new Date(2026, 10, 1),
  });
  assert(Math.round(res.todayBudget) === 1500, `Emergency spend should not reduce daily budget pool, got ${res.todayBudget}`);
  assert(res.totalSpentThisMonth === 5000, `Emergency spend is still reflected in monthly total spent`);
  console.log('✅ Test 7 Passed: Emergency Spend Tracked and Isolated from Daily Penalties');
}

console.log('\n🎉 ALL 7 BUDGET ENGINE UNIT TESTS PASSED WITH 100% SUCCESS!\n');
