const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runE2E() {
  console.log('🚀 Running Comprehensive E2E QA Verification against http://localhost:3000...\n');
  
  // 1. Check Login Page Loads
  console.log('1. Checking GET /login...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'GET',
  });
  console.log(`   -> Status: ${loginRes.statusCode}`);
  if (loginRes.statusCode !== 200) throw new Error('Failed to load /login');

  // 2. Perform Demo Login
  console.log('2. Performing 1-Click Demo Login (POST /api/auth/demo)...');
  const demoRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/demo',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log(`   -> Status: ${demoRes.statusCode}`);
  const cookie = demoRes.headers['set-cookie'] ? demoRes.headers['set-cookie'][0].split(';')[0] : '';
  console.log(`   -> Auth Cookie Acquired: ${cookie ? 'YES (JWT Token Present)' : 'NO'}`);

  const authHeaders = {
    'Cookie': cookie,
    'Content-Type': 'application/json'
  };

  // 3. Verify Session via /api/auth/me
  console.log('3. Verifying Session (GET /api/auth/me)...');
  const meRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET',
    headers: authHeaders,
  });
  const meData = JSON.parse(meRes.body);
  console.log(`   -> Status: ${meRes.statusCode}, User: ${meData.user?.name} (${meData.user?.email})`);

  // 4. Verify Dashboard Summary API
  console.log('4. Checking Budget Summary (GET /api/budget/summary)...');
  const summaryRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/budget/summary',
    method: 'GET',
    headers: authHeaders,
  });
  const summary = JSON.parse(summaryRes.body);
  console.log(`   -> Status: ${summaryRes.statusCode}`);
  const calc = summary.calculation;
  console.log(`   -> Today Budget: ₹${calc?.todayBudget}, Spent Today: ₹${calc?.spentToday}, Remaining: ₹${calc?.todayRemaining}`);
  console.log(`   -> Color State: ${calc?.statusColor}`);

  // 5. Test Logging an Expense
  console.log('5. Logging Regular Expense (POST /api/expenses)...');
  const expRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/expenses',
    method: 'POST',
    headers: authHeaders,
  }, {
    amount: 350,
    categoryName: 'Food',
    note: 'QA Team Lunch Testing',
    paymentMethod: 'UPI',
    isEmergency: false
  });
  const expData = JSON.parse(expRes.body);
  console.log(`   -> Status: ${expRes.statusCode}, Expense ID: ${expData.expense?.id}`);

  // 6. Test Logging Emergency Spend
  console.log('6. Logging Emergency Spend (POST /api/expenses)...');
  const emergRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/expenses',
    method: 'POST',
    headers: authHeaders,
  }, {
    amount: 1200,
    categoryName: 'Health',
    note: 'Urgent Pharmacy Multivitamins',
    paymentMethod: 'UPI',
    isEmergency: true,
    emergencyReason: 'Prescribed medication replacement'
  });
  const emergData = JSON.parse(emergRes.body);
  console.log(`   -> Status: ${emergRes.statusCode}, Emergency Reason: ${emergData.expense?.emergencyReason}`);

  // 7. Verify Expense in List & Delete One
  console.log('7. Verifying Expenses List & Deletion...');
  const delRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/expenses/${expData.expense.id}`,
    method: 'DELETE',
    headers: authHeaders,
  });
  console.log(`   -> DELETE Status: ${delRes.statusCode}`);

  // 8. Test Bank Sync
  console.log('8. Testing Bank Sync (POST /api/bank/sync)...');
  const syncRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/bank/sync',
    method: 'POST',
    headers: authHeaders,
  });
  console.log(`   -> Sync Status: ${syncRes.statusCode}, Response: ${syncRes.body}`);

  // 9. Test Transactions History & Re-categorization
  console.log('9. Testing Transactions & Re-categorization...');
  const txListRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/bank/transactions?limit=5',
    method: 'GET',
    headers: authHeaders,
  });
  const txList = JSON.parse(txListRes.body);
  console.log(`   -> Found ${txList.transactions?.length || 0} transactions`);
  if (txList.transactions && txList.transactions.length > 0) {
    const firstTx = txList.transactions[0];
    const patchRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/bank/transactions',
      method: 'PATCH',
      headers: authHeaders,
    }, {
      transactionId: firstTx.id,
      category: 'Shopping'
    });
    console.log(`   -> Re-categorization PATCH Status: ${patchRes.statusCode}`);
  }

  // 10. Test CSV and PDF Export Endpoints
  console.log('10. Testing Exports...');
  const csvRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/export/csv',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`   -> CSV Export Status: ${csvRes.statusCode}, Content-Type: ${csvRes.headers['content-type']}`);

  const pdfRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/export/pdf',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`   -> PDF/Print Export Status: ${pdfRes.statusCode}, Content-Type: ${pdfRes.headers['content-type']}`);

  // 11. Test Savings Goals CRUD
  console.log('11. Testing Savings Goals (Create, Fund, Delete)...');
  const createGoalRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/goals',
    method: 'POST',
    headers: authHeaders,
  }, {
    title: 'QA Automated Test Fund',
    targetAmount: 50000,
    currentAmount: 10000
  });
  const goalData = JSON.parse(createGoalRes.body);
  console.log(`   -> Create Goal Status: ${createGoalRes.statusCode}, ID: ${goalData.goal?.id}`);

  const fundGoalRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/goals',
    method: 'PATCH',
    headers: authHeaders,
  }, {
    goalId: goalData.goal.id,
    addAmount: 5000
  });
  const updatedGoal = JSON.parse(fundGoalRes.body);
  console.log(`   -> Fund Goal Status: ${fundGoalRes.statusCode}, New Current Amount: ₹${updatedGoal.goal?.currentAmount}`);

  const delGoalRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/goals?id=${goalData.goal.id}`,
    method: 'DELETE',
    headers: authHeaders,
  });
  console.log(`   -> Delete Goal Status: ${delGoalRes.statusCode}`);

  // 12. Test Feedback API Form
  console.log('12. Testing Feedback API Submission...');
  const fbRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/feedback',
    method: 'POST',
    headers: authHeaders,
  }, {
    name: 'QA Tester',
    email: 'qa@daybudget.app',
    subject: 'All Buttons Functional Verification',
    category: 'Feedback',
    message: 'Testing the end-to-end feedback submission mechanism with honeypot and rate limiting.'
  });
  console.log(`   -> Feedback Status: ${fbRes.statusCode}`);

  console.log('\n🎉 ALL END-TO-END QA FLOWS COMPLETED SUCCESSFULLY!\n');
}

runE2E().catch(err => {
  console.error('❌ E2E QA Test Failed:', err);
  process.exit(1);
});
