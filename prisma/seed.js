const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding DayBudget database with realistic demo data...')

  // Clear existing data
  await prisma.notification.deleteMany()
  await prisma.bankTransaction.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.bankAccount.deleteMany()
  await prisma.savingsGoal.deleteMany()
  await prisma.fixedExpense.deleteMany()
  await prisma.category.deleteMany()
  await prisma.budgetProfile.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('Password123!', 10)

  // 1. Create Demo User
  const user = await prisma.user.create({
    data: {
      email: 'demo@daybudget.app',
      name: 'Arjun Sharma',
      passwordHash,
      currency: 'INR',
      surplusMode: 'CARRY_OVER',
    },
  })

  console.log('✅ Created demo user:', user.email)

  // 2. Create Budget Profile (Income ₹100,000, Savings Goal ₹15,000)
  const now = new Date()
  await prisma.budgetProfile.create({
    data: {
      userId: user.id,
      monthlyIncome: 100000,
      savingsGoalPercent: 15,
      savingsGoalAmount: 15000,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
  })

  // 3. Create Fixed Expenses (Total = ₹39,700)
  const fixedExpenses = [
    { name: 'Apartment Rent (Indiranagar)', amount: 25000, category: 'Bills', dueDay: 1 },
    { name: 'Car Loan EMI (HDFC)', amount: 12000, category: 'Bills', dueDay: 5 },
    { name: 'Airtel Xstream Fiber WiFi', amount: 1500, category: 'Bills', dueDay: 10 },
    { name: 'Netflix & Spotify Premium', amount: 1200, category: 'Entertainment', dueDay: 15 },
  ]

  for (const fe of fixedExpenses) {
    await prisma.fixedExpense.create({
      data: {
        userId: user.id,
        name: fe.name,
        amount: fe.amount,
        category: fe.category,
        dueDay: fe.dueDay,
        isRecurring: true,
      },
    })
  }

  // 4. Default & Custom Categories
  const categories = [
    { name: 'Food', icon: 'Utensils', color: '#10b981', isCustom: false },
    { name: 'Transport', icon: 'Car', color: '#3b82f6', isCustom: false },
    { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', isCustom: false },
    { name: 'Bills', icon: 'Receipt', color: '#f59e0b', isCustom: false },
    { name: 'Health', icon: 'HeartPulse', color: '#ef4444', isCustom: false },
    { name: 'Entertainment', icon: 'Film', color: '#8b5cf6', isCustom: false },
    { name: 'Education', icon: 'GraduationCap', color: '#06b6d4', isCustom: false },
    { name: 'Other', icon: 'MoreHorizontal', color: '#6b7280', isCustom: false },
    { name: 'Fitness & Gym', icon: 'Dumbbell', color: '#f97316', isCustom: true },
  ]

  for (const c of categories) {
    await prisma.category.create({
      data: {
        userId: user.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isCustom: c.isCustom,
      },
    })
  }

  // 5. Bank Accounts
  let runningBalanceHdfc = 74250
  const hdfc = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankName: 'Sample HDFC Bank',
      accountType: 'SAVINGS',
      accountNumberMasked: 'XXXX4829',
      balance: runningBalanceHdfc,
      status: 'CONNECTED',
      provider: 'MOCK_BANK',
      isMock: true,
    },
  })

  let runningBalanceIcici = 18400
  const icici = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankName: 'Mock ICICI Bank',
      accountType: 'CREDIT_CARD',
      accountNumberMasked: 'XXXX9104',
      balance: runningBalanceIcici,
      status: 'CONNECTED',
      provider: 'MOCK_BANK',
      isMock: true,
    },
  })

  // 6. Historical Expenses for the month (Days 1 to Today)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const todayDay = now.getDate()

  // Sample transactions data for realistic days
  const historicalSeed = [
    { day: 2, amount: 450, cat: 'Food', note: 'Swiggy Dinner Bowls', method: 'UPI' },
    { day: 2, amount: 240, cat: 'Transport', note: 'Uber Ride to Office', method: 'UPI' },
    { day: 3, amount: 620, cat: 'Food', note: 'Blinkit Fresh Veggies & Fruits', method: 'UPI' },
    { day: 4, amount: 180, cat: 'Food', note: 'Third Wave Coffee', method: 'UPI' },
    // Day 5 is a No-Spend day!
    { day: 6, amount: 1250, cat: 'Shopping', note: 'Amazon Desk Lamp', method: 'Credit Card' },
    { day: 7, amount: 890, cat: 'Food', note: 'Weekend Biryani Feast with Friends', method: 'UPI' },
    { day: 8, amount: 320, cat: 'Transport', note: 'Namma Metro Card Recharge', method: 'UPI' },
    { day: 9, amount: 499, cat: 'Entertainment', note: 'BookMyShow Movie Tickets', method: 'Credit Card' },
    { day: 10, amount: 280, cat: 'Food', note: 'Subway lunch', method: 'UPI' },
    // Day 11 is No-Spend!
    { day: 12, amount: 1650, cat: 'Shopping', note: 'Zara Cotton T-Shirt', method: 'Credit Card' },
    { day: 13, amount: 550, cat: 'Health', note: 'Apollo Pharmacy Multivitamins', method: 'Debit Card' },
    { day: 14, amount: 3500, cat: 'Health', note: 'Dental Clinic emergency tooth filling', method: 'Debit Card', isEmergency: true, reason: 'Sudden acute toothache & dental filling' },
    { day: 15, amount: 420, cat: 'Food', note: 'Zepto groceries & snacks', method: 'UPI' },
    { day: 16, amount: 780, cat: 'Food', note: 'Team Lunch Outing', method: 'UPI' },
    { day: 17, amount: 220, cat: 'Transport', note: 'Auto rickshaw via Rapido', method: 'UPI' },
    { day: 18, amount: 950, cat: 'Fitness & Gym', note: 'Whey Protein Supplement', method: 'Credit Card' },
    // Day 19 No-Spend
    { day: 20, amount: 2400, cat: 'Shopping', note: 'Winter Jacket Myntra', method: 'Credit Card' },
    { day: 21, amount: 380, cat: 'Food', note: 'Starbucks Caramel Macchiato', method: 'UPI' },
    { day: 22, amount: 520, cat: 'Food', note: 'Fresh to Home Fish & Prawns', method: 'UPI' },
    { day: 23, amount: 310, cat: 'Transport', note: 'Uber to Indiranagar Metro', method: 'UPI' },
    // Today's expenses (moderate, well below daily budget of ~1500)
    { day: todayDay, amount: 160, cat: 'Food', note: 'Morning Blue Tokai Coffee', method: 'UPI' },
    { day: todayDay, amount: 340, cat: 'Food', note: 'Healthy Salad Lunch via Swiggy', method: 'UPI' },
  ]

  for (const item of historicalSeed) {
    if (item.day <= todayDay) {
      const expDate = new Date(currentYear, currentMonth, item.day, 13, 30, 0)
      
      const isCard = item.method === 'Credit Card'
      const targetAcc = isCard ? icici : hdfc
      if (isCard) {
        runningBalanceIcici -= item.amount
      } else {
        runningBalanceHdfc -= item.amount
      }
      const balanceAfter = isCard ? runningBalanceIcici : runningBalanceHdfc

      const expense = await prisma.expense.create({
        data: {
          userId: user.id,
          amount: item.amount,
          categoryName: item.cat,
          note: item.note,
          date: expDate,
          paymentMethod: item.method,
          isEmergency: item.isEmergency || false,
          emergencyReason: item.reason || null,
          isMock: true,
        },
      })

      // Link to bank transaction
      await prisma.bankTransaction.create({
        data: {
          externalId: `seed_tx_${user.id}_${item.day}_${Math.random().toString(36).substring(7)}`,
          bankAccountId: targetAcc.id,
          userId: user.id,
          amount: item.amount,
          balanceAfter,
          type: 'DEBIT',
          paymentMethod: item.method === 'Credit Card' ? 'Card' : 'UPI',
          merchantName: item.note.split(' ')[0],
          rawDescription: `UPI/POS/${item.note}`,
          date: expDate,
          category: item.cat,
          isCategorized: true,
          syncedToExpense: true,
          expenseId: expense.id,
          isMock: true,
        },
      })
    }
  }

  // 7. Savings Goals
  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      title: 'MacBook Pro M3 Max',
      targetAmount: 160000,
      currentAmount: 85000,
      targetDate: new Date(2027, 2, 31),
      icon: 'Laptop',
      color: 'teal',
      isCompleted: false,
    },
  })

  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      title: 'Japan Cherry Blossom Trip',
      targetAmount: 120000,
      currentAmount: 45000,
      targetDate: new Date(2027, 3, 15),
      icon: 'Plane',
      color: 'indigo',
      isCompleted: false,
    },
  })

  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      title: 'Emergency Safety Net (6 Mo)',
      targetAmount: 300000,
      currentAmount: 180000,
      targetDate: new Date(2027, 11, 31),
      icon: 'ShieldCheck',
      color: 'emerald',
      isCompleted: false,
    },
  })

  // 8. Notifications
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Good morning, Arjun! ☀️',
      message: "Today's daily budget is ₹1,510. You have 3 no-spend days this month so far. Keep up the great pace!",
      type: 'MORNING_GREETING',
      isRead: false,
    },
  })

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'HDFC & ICICI Bank Accounts Linked 🏦',
      message: 'Your accounts are synced. Discretionary spending from UPI and cards is tracked automatically.',
      type: 'BANK_SYNC',
      isRead: true,
    },
  })

  console.log('🎉 Seeding successfully completed!')
}

main()
  .catch(e => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
