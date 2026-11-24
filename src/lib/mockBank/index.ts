import { prisma } from '@/lib/prisma'
import { calculateDailyBudget } from '@/lib/budget-engine'

export interface BankInstitution {
  id: string
  name: string
  code: string
  icon: string
  color: string
  accountTypes: string[]
}

export interface BankAccountData {
  id: string
  userId: string
  bankName: string
  accountType: string
  accountNumberMasked: string
  balance: number
  isMock: boolean
  status: string
  lastSyncedAt: Date
  createdAt: Date
  transactionCount?: number
}

export interface BankTransactionData {
  id: string
  externalId: string | null
  bankAccountId: string
  userId: string
  amount: number
  balanceAfter: number
  type: 'DEBIT' | 'CREDIT'
  paymentMethod: string
  merchantName: string
  rawDescription: string
  date: Date
  category: string
  isCategorized: boolean
  syncedToExpense: boolean
  expenseId: string | null
  isMock: boolean
  createdAt: Date
  bankAccount?: {
    bankName: string
    accountNumberMasked: string
    accountType: string
  }
}

export interface LinkAccountInput {
  userId: string
  bankId: string
  accountType?: string
  initialBalance?: number
  credentials?: {
    username?: string
    password?: string
    otp?: string
  }
}

export interface SimulateTransactionInput {
  userId: string
  bankAccountId?: string
  amount: number
  type?: 'DEBIT' | 'CREDIT'
  merchantName: string
  category?: string
  paymentMethod?: string
  description?: string
  date?: Date
  isEmergency?: boolean
  emergencyReason?: string
}

export interface BankProvider {
  name: string
  getSupportedBanks(): Promise<BankInstitution[]>
  linkAccount(input: LinkAccountInput): Promise<BankAccountData>
  unlinkAccount(accountId: string, userId: string): Promise<boolean>
  getAccounts(userId: string): Promise<BankAccountData[]>
  getTransactions(accountId?: string, userId?: string, options?: { limit?: number; search?: string; category?: string }): Promise<BankTransactionData[]>
  getBalance(accountId: string): Promise<number>
  sync(userId: string): Promise<{ newTransactions: BankTransactionData[]; count: number }>
  simulateTransaction(input: SimulateTransactionInput): Promise<BankTransactionData>
  generateRandomTodayTransactions(userId: string): Promise<BankTransactionData[]>
  simulateBigOverspend(userId: string, amount?: number): Promise<BankTransactionData>
  resetFakeData(userId: string): Promise<void>
}

// Auto-categorize dictionary
export function autoCategorize(merchant: string, description: string = ''): { category: string; paymentMethod: string } {
  const text = `${merchant} ${description}`.toLowerCase()

  if (text.includes('swiggy') || text.includes('zomato') || text.includes('starbucks') ||
      text.includes('mcdonald') || text.includes('blinkit') || text.includes('zepto') ||
      text.includes('instamart') || text.includes('cafe') || text.includes('restaurant') ||
      text.includes('coffee') || text.includes('subway') || text.includes('bakery') || text.includes('food')) {
    return { category: 'Food', paymentMethod: 'UPI' }
  }

  if (text.includes('uber') || text.includes('ola') || text.includes('rapido') ||
      text.includes('fuel') || text.includes('petrol') || text.includes('metro') ||
      text.includes('indian oil') || text.includes('shell') || text.includes('fastag') || text.includes('transport')) {
    return { category: 'Transport', paymentMethod: 'UPI' }
  }

  if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') ||
      text.includes('zara') || text.includes('h&m') || text.includes('uniqlo') ||
      text.includes('apple') || text.includes('croma') || text.includes('ikea') || text.includes('shopping')) {
    return { category: 'Shopping', paymentMethod: 'Card' }
  }

  if (text.includes('bescom') || text.includes('electricity') || text.includes('airtel') ||
      text.includes('jio') || text.includes('bill') || text.includes('recharge') ||
      text.includes('wifi') || text.includes('rent') || text.includes('maintenance')) {
    return { category: 'Bills', paymentMethod: 'NetBanking' }
  }

  if (text.includes('netflix') || text.includes('spotify') || text.includes('prime') ||
      text.includes('bookmyshow') || text.includes('cinema') || text.includes('steam') ||
      text.includes('hotstar') || text.includes('movie')) {
    return { category: 'Entertainment', paymentMethod: 'Card' }
  }

  if (text.includes('apollo') || text.includes('pharmacy') || text.includes('cult.fit') ||
      text.includes('1mg') || text.includes('practo') || text.includes('hospital') ||
      text.includes('doctor') || text.includes('dental') || text.includes('clinic')) {
    return { category: 'Health', paymentMethod: 'Card' }
  }

  if (text.includes('udemy') || text.includes('coursera') || text.includes('books') ||
      text.includes('school') || text.includes('tuition')) {
    return { category: 'Education', paymentMethod: 'UPI' }
  }

  return { category: 'Other', paymentMethod: 'UPI' }
}

/**
 * Fully Simulated Fake Bank Provider
 */
export class FakeBankProvider implements BankProvider {
  name = 'Fake Bank Simulation Provider (Sandbox)'

  async getSupportedBanks(): Promise<BankInstitution[]> {
    return [
      { id: 'bank_demo', name: 'Demo Bank', code: 'DEMO', icon: '🏦', color: '#14b8a6', accountTypes: ['SAVINGS', 'CURRENT', 'CREDIT_CARD'] },
      { id: 'bank_sbi', name: 'Test SBI (State Bank of India)', code: 'TEST_SBI', icon: '🏛️', color: '#0284c7', accountTypes: ['SAVINGS', 'CURRENT'] },
      { id: 'bank_hdfc', name: 'Sample HDFC Bank', code: 'SAMPLE_HDFC', icon: '🏢', color: '#1e40af', accountTypes: ['SAVINGS', 'CREDIT_CARD'] },
      { id: 'bank_icici', name: 'Mock ICICI Bank', code: 'MOCK_ICICI', icon: '🏛️', color: '#ea580c', accountTypes: ['SAVINGS', 'CREDIT_CARD'] },
      { id: 'bank_axis', name: 'Sandbox Axis Bank', code: 'SANDBOX_AXIS', icon: '🏦', color: '#be185d', accountTypes: ['SAVINGS', 'CURRENT'] },
    ]
  }

  async linkAccount(input: LinkAccountInput): Promise<BankAccountData> {
    const banks = await this.getSupportedBanks()
    const found = banks.find(b => b.id === input.bankId) || banks[0]

    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    const initialBalance = input.initialBalance || 75000 + Math.floor(Math.random() * 25000)

    const account = await prisma.bankAccount.create({
      data: {
        userId: input.userId,
        bankName: found.name,
        accountType: input.accountType || 'SAVINGS',
        accountNumberMasked: `XXXX${randomSuffix}`,
        balance: initialBalance,
        status: 'CONNECTED',
        provider: 'MOCK_BANK',
        isMock: true,
      },
    })

    // Generate ~90 days of realistic historical transactions
    await this.generateHistorical90Days(account.id, input.userId, initialBalance)

    // Log notification
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: `${found.name} Linked Successfully 🏦`,
        message: `Account XXXX${randomSuffix} connected. 90 days of simulated transactions with salary, rent, and daily spending were imported.`,
        type: 'BANK_SYNC',
      },
    })

    return {
      id: account.id,
      userId: account.userId,
      bankName: account.bankName,
      accountType: account.accountType,
      accountNumberMasked: account.accountNumberMasked,
      balance: account.balance,
      isMock: account.isMock,
      status: account.status,
      lastSyncedAt: account.lastSyncedAt,
      createdAt: account.createdAt,
    }
  }

  async unlinkAccount(accountId: string, userId: string): Promise<boolean> {
    const existing = await prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    })

    if (!existing) return false

    // Cascade deletion removes linked bank transactions automatically via foreign key
    await prisma.bankAccount.delete({
      where: { id: accountId },
    })

    // Also remove any mock expenses tied to this account
    await prisma.expense.deleteMany({
      where: { userId, note: { contains: existing.accountNumberMasked } },
    })

    await prisma.notification.create({
      data: {
        userId,
        title: 'Bank Account Unlinked',
        message: `${existing.bankName} (${existing.accountNumberMasked}) has been unlinked and its mock data was cleaned up.`,
        type: 'SYSTEM',
      },
    })

    return true
  }

  async getAccounts(userId: string): Promise<BankAccountData[]> {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return accounts.map(a => ({
      id: a.id,
      userId: a.userId,
      bankName: a.bankName,
      accountType: a.accountType,
      accountNumberMasked: a.accountNumberMasked,
      balance: a.balance,
      isMock: a.isMock,
      status: a.status,
      lastSyncedAt: a.lastSyncedAt,
      createdAt: a.createdAt,
      transactionCount: a._count.transactions,
    }))
  }

  async getTransactions(
    accountId?: string,
    userId?: string,
    options?: { limit?: number; search?: string; category?: string }
  ): Promise<BankTransactionData[]> {
    const where: any = {}
    if (accountId) where.bankAccountId = accountId
    if (userId) where.userId = userId
    if (options?.category && options.category !== 'All') where.category = options.category
    if (options?.search) {
      where.OR = [
        { merchantName: { contains: options.search } },
        { rawDescription: { contains: options.search } },
      ]
    }

    const txs = await prisma.bankTransaction.findMany({
      where,
      include: {
        bankAccount: {
          select: { bankName: true, accountNumberMasked: true, accountType: true },
        },
      },
      orderBy: { date: 'desc' },
      take: options?.limit || 100,
    })

    return txs as BankTransactionData[]
  }

  async getBalance(accountId: string): Promise<number> {
    const acc = await prisma.bankAccount.findUnique({
      where: { id: accountId },
    })
    return acc ? acc.balance : 0
  }

  async sync(userId: string): Promise<{ newTransactions: BankTransactionData[]; count: number }> {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId, status: 'CONNECTED' },
    })

    if (!accounts.length) {
      return { newTransactions: [], count: 0 }
    }

    const imported: BankTransactionData[] = []

    for (const acc of accounts) {
      // Simulate 1 to 3 recent transactions
      const simulatedItems = [
        { merchant: 'Swiggy', desc: 'UPI/Swiggy Orders/Dinner delivery', amount: 380, method: 'UPI' },
        { merchant: 'Uber India', desc: 'UPI/Uber Technologies/Cab to office', amount: 240, method: 'UPI' },
        { merchant: 'Blinkit Grocery', desc: 'UPI/Blinkit/Fresh milk & eggs', amount: 450, method: 'UPI' },
        { merchant: 'Third Wave Coffee', desc: 'UPI/Third Wave Coffee Roasters', amount: 210, method: 'UPI' },
      ]

      const count = 1 + Math.floor(Math.random() * 2)
      for (let i = 0; i < count; i++) {
        const item = simulatedItems[(Date.now() + i) % simulatedItems.length]
        const externalId = `sim_sync_${acc.id}_${Date.now()}_${i}`

        // Calculate new balance
        const newBalance = Math.max(0, acc.balance - item.amount)

        const tx = await prisma.bankTransaction.create({
          data: {
            externalId,
            bankAccountId: acc.id,
            userId,
            amount: item.amount,
            balanceAfter: newBalance,
            type: 'DEBIT',
            paymentMethod: item.method,
            merchantName: item.merchant,
            rawDescription: item.desc,
            date: new Date(),
            category: 'Food',
            isCategorized: true,
            syncedToExpense: true,
            isMock: true,
          },
        })

        // Also create expense record to update daily budget
        const exp = await prisma.expense.create({
          data: {
            userId,
            amount: item.amount,
            categoryName: 'Food',
            note: `${item.merchant} (${acc.bankName} ${acc.accountNumberMasked})`,
            date: new Date(),
            paymentMethod: item.method,
            isEmergency: false,
            bankTransactionId: tx.id,
            isMock: true,
          },
        })

        await prisma.bankTransaction.update({
          where: { id: tx.id },
          data: { expenseId: exp.id },
        })

        await prisma.bankAccount.update({
          where: { id: acc.id },
          data: { balance: newBalance, lastSyncedAt: new Date() },
        })

        imported.push(tx as BankTransactionData)
      }
    }

    if (imported.length > 0) {
      await prisma.notification.create({
        data: {
          userId,
          title: 'Bank Accounts Synced 🔄',
          message: `Imported ${imported.length} new transactions from your fake bank accounts into today's budget.`,
          type: 'BANK_SYNC',
        },
      })
    }

    return { newTransactions: imported, count: imported.length }
  }

  async simulateTransaction(input: SimulateTransactionInput): Promise<BankTransactionData> {
    let account = input.bankAccountId 
      ? await prisma.bankAccount.findFirst({ where: { id: input.bankAccountId, userId: input.userId } })
      : await prisma.bankAccount.findFirst({ where: { userId: input.userId } })

    if (!account) {
      // Auto-create a demo account if none exists
      account = await prisma.bankAccount.create({
        data: {
          userId: input.userId,
          bankName: 'Demo Bank',
          accountType: 'SAVINGS',
          accountNumberMasked: 'XXXX7788',
          balance: 85000,
          status: 'CONNECTED',
          provider: 'MOCK_BANK',
          isMock: true,
        },
      })
    }

    const { category, paymentMethod } = autoCategorize(input.merchantName, input.description)
    const finalCategory = input.category || category
    const finalMethod = input.paymentMethod || paymentMethod
    const type = input.type || 'DEBIT'
    const date = input.date || new Date()

    const newBalance = type === 'DEBIT'
      ? Math.max(0, account.balance - input.amount)
      : account.balance + input.amount

    const tx = await prisma.bankTransaction.create({
      data: {
        externalId: `sim_custom_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        bankAccountId: account.id,
        userId: input.userId,
        amount: input.amount,
        balanceAfter: newBalance,
        type,
        paymentMethod: finalMethod,
        merchantName: input.merchantName,
        rawDescription: input.description || `${finalMethod}/${input.merchantName}/Simulated POS`,
        date,
        category: finalCategory,
        isCategorized: true,
        syncedToExpense: type === 'DEBIT',
        isMock: true,
      },
    })

    if (type === 'DEBIT') {
      const exp = await prisma.expense.create({
        data: {
          userId: input.userId,
          amount: input.amount,
          categoryName: finalCategory,
          note: `${input.merchantName} (${account.bankName} ${account.accountNumberMasked})`,
          date,
          paymentMethod: finalMethod,
          isEmergency: input.isEmergency || false,
          emergencyReason: input.isEmergency ? input.emergencyReason : null,
          bankTransactionId: tx.id,
          isMock: true,
        },
      })

      await prisma.bankTransaction.update({
        where: { id: tx.id },
        data: { expenseId: exp.id },
      })
    }

    await prisma.bankAccount.update({
      where: { id: account.id },
      data: { balance: newBalance, lastSyncedAt: new Date() },
    })

    return tx as BankTransactionData
  }

  async generateRandomTodayTransactions(userId: string): Promise<BankTransactionData[]> {
    const merchants = [
      { name: 'Swiggy Lunch Box', cat: 'Food', amount: 340, method: 'UPI' },
      { name: 'Uber Ride to Client Office', cat: 'Transport', amount: 260, method: 'UPI' },
      { name: 'Blue Tokai Specialty Coffee', cat: 'Food', amount: 220, method: 'UPI' },
      { name: 'Blinkit Instant Groceries', cat: 'Food', amount: 480, method: 'UPI' },
      { name: 'Amazon Express Essentials', cat: 'Shopping', amount: 890, method: 'Card' },
    ]

    const selected = merchants.sort(() => 0.5 - Math.random()).slice(0, 2)
    const results: BankTransactionData[] = []

    for (const item of selected) {
      const tx = await this.simulateTransaction({
        userId,
        amount: item.amount,
        merchantName: item.name,
        category: item.cat,
        paymentMethod: item.method,
        date: new Date(),
        type: 'DEBIT',
      })
      results.push(tx)
    }

    return results
  }

  async simulateBigOverspend(userId: string, amount: number = 4500): Promise<BankTransactionData> {
    return this.simulateTransaction({
      userId,
      amount,
      merchantName: 'Apple Store / Luxury Weekend Dining',
      category: 'Shopping',
      paymentMethod: 'Card',
      description: 'POS/High-End Retail Electronics/Overspend Simulation',
      date: new Date(),
      type: 'DEBIT',
      isEmergency: false,
    })
  }

  async resetFakeData(userId: string): Promise<void> {
    // Delete all mock transactions and bank accounts
    await prisma.bankTransaction.deleteMany({
      where: { userId, isMock: true },
    })

    await prisma.expense.deleteMany({
      where: { userId, isMock: true },
    })

    await prisma.bankAccount.deleteMany({
      where: { userId, isMock: true },
    })

    // Re-link a clean default Demo Bank
    await this.linkAccount({
      userId,
      bankId: 'bank_demo',
      accountType: 'SAVINGS',
      initialBalance: 85000,
    })
  }

  /**
   * Generates ~90 days of realistic transactions:
   * - Salary credit ₹100,000 on 1st of each month
   * - Rent debit ₹25,000 on 2nd
   * - Bills (WiFi, electricity, streaming)
   * - Everyday transactions (Swiggy, Uber, Blinkit, Amazon, Apollo Pharmacy, etc.)
   * - Keeps a continuous realistic running balanceAfter!
   */
  private async generateHistorical90Days(bankAccountId: string, userId: string, initialBalance: number): Promise<void> {
    const now = new Date()
    let currentBalance = initialBalance

    const transactionsToInsert = []

    // Step back 90 days
    for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
      const txDate = new Date(now.getTime() - dayOffset * 86400000)
      const dateNum = txDate.getDate()
      const isCurrentMonth = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()

      // 1. First of the month: Monthly Salary Credit of ₹100,000
      if (dateNum === 1) {
        currentBalance += 100000
        transactionsToInsert.push({
          externalId: `sal_${bankAccountId}_${txDate.getFullYear()}_${txDate.getMonth()}`,
          bankAccountId,
          userId,
          amount: 100000,
          balanceAfter: currentBalance,
          type: 'CREDIT',
          paymentMethod: 'NetBanking',
          merchantName: 'Tech Innovations Pvt Ltd',
          rawDescription: 'NEFT/SALARY/TECH INNOVATIONS PVT LTD/NOV2026',
          date: new Date(txDate.getFullYear(), txDate.getMonth(), 1, 9, 0, 0),
          category: 'Income',
          isCategorized: true,
          syncedToExpense: false,
          isMock: true,
        })
      }

      // 2. Second of the month: Apartment Rent Debit ₹25,000
      if (dateNum === 2) {
        currentBalance -= 25000
        transactionsToInsert.push({
          externalId: `rent_${bankAccountId}_${txDate.getFullYear()}_${txDate.getMonth()}`,
          bankAccountId,
          userId,
          amount: 25000,
          balanceAfter: currentBalance,
          type: 'DEBIT',
          paymentMethod: 'NetBanking',
          merchantName: 'Indiranagar Landlord Rent',
          rawDescription: 'NEFT/RENT/MONTHLY HOUSE RENT INDIRANAGAR',
          date: new Date(txDate.getFullYear(), txDate.getMonth(), 2, 10, 30, 0),
          category: 'Bills',
          isCategorized: true,
          syncedToExpense: isCurrentMonth,
          isMock: true,
        })
      }

      // 3. Fifth of the month: Electricity Bill
      if (dateNum === 5) {
        currentBalance -= 1850
        transactionsToInsert.push({
          externalId: `elec_${bankAccountId}_${txDate.getFullYear()}_${txDate.getMonth()}`,
          bankAccountId,
          userId,
          amount: 1850,
          balanceAfter: currentBalance,
          type: 'DEBIT',
          paymentMethod: 'NetBanking',
          merchantName: 'BESCOM Electricity Bill',
          rawDescription: 'BILLDESK/BESCOM/ELECTRICITY RECHARGE',
          date: new Date(txDate.getFullYear(), txDate.getMonth(), 5, 11, 0, 0),
          category: 'Bills',
          isCategorized: true,
          syncedToExpense: isCurrentMonth,
          isMock: true,
        })
      }

      // 4. Tenth of the month: Airtel Fiber Internet
      if (dateNum === 10) {
        currentBalance -= 1499
        transactionsToInsert.push({
          externalId: `wifi_${bankAccountId}_${txDate.getFullYear()}_${txDate.getMonth()}`,
          bankAccountId,
          userId,
          amount: 1499,
          balanceAfter: currentBalance,
          type: 'DEBIT',
          paymentMethod: 'NetBanking',
          merchantName: 'Airtel Xstream Fiber',
          rawDescription: 'NEFT/AIRTEL/FIBER BROADBAND MONTHLY',
          date: new Date(txDate.getFullYear(), txDate.getMonth(), 10, 14, 0, 0),
          category: 'Bills',
          isCategorized: true,
          syncedToExpense: isCurrentMonth,
          isMock: true,
        })
      }

      // 5. Fifteenth of the month: Streaming Subscriptions
      if (dateNum === 15) {
        currentBalance -= 1199
        transactionsToInsert.push({
          externalId: `stream_${bankAccountId}_${txDate.getFullYear()}_${txDate.getMonth()}`,
          bankAccountId,
          userId,
          amount: 1199,
          balanceAfter: currentBalance,
          type: 'DEBIT',
          paymentMethod: 'Card',
          merchantName: 'Netflix & Spotify Premium',
          rawDescription: 'POS/SUBSCRIPTION/NETFLIX RECURRING',
          date: new Date(txDate.getFullYear(), txDate.getMonth(), 15, 8, 30, 0),
          category: 'Entertainment',
          isCategorized: true,
          syncedToExpense: isCurrentMonth,
          isMock: true,
        })
      }

      // 6. Everyday transactions (every 1 to 2 days)
      if (dayOffset % 2 === 0 && dayOffset > 0) {
        const pool = [
          { merchant: 'Swiggy Gourmet Delivery', desc: 'UPI/Swiggy Orders/Dinner delivery', amount: 480, cat: 'Food', method: 'UPI' },
          { merchant: 'Uber Ride to Office', desc: 'UPI/Uber Technologies/Cab to Indiranagar', amount: 240, cat: 'Transport', method: 'UPI' },
          { merchant: 'Blinkit Instant Groceries', desc: 'UPI/Blinkit/Fresh veggies & pantry', amount: 650, cat: 'Food', method: 'UPI' },
          { merchant: 'Starbucks Coffee', desc: 'POS/Starbucks Indiranagar Reserve', amount: 390, cat: 'Food', method: 'Card' },
          { merchant: 'Indian Oil Petrol Station', desc: 'UPI/Indian Oil Corporation/Fuel refill', amount: 1800, cat: 'Transport', method: 'UPI' },
          { merchant: 'Amazon India Retail', desc: 'POS/Amazon Retail/Online Order', amount: 1299, cat: 'Shopping', method: 'Card' },
          { merchant: 'Apollo Pharmacy Store', desc: 'UPI/Apollo Pharmacy/Health essentials', amount: 520, cat: 'Health', method: 'UPI' },
        ]

        const chosen = pool[dayOffset % pool.length]
        currentBalance -= chosen.amount

        transactionsToInsert.push({
          externalId: `daily_${bankAccountId}_${dayOffset}`,
          bankAccountId,
          userId,
          amount: chosen.amount,
          balanceAfter: currentBalance,
          type: 'DEBIT',
          paymentMethod: chosen.method,
          merchantName: chosen.merchant,
          rawDescription: chosen.desc,
          date: new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate(), 13, Math.floor(Math.random() * 59), 0),
          category: chosen.cat,
          isCategorized: true,
          syncedToExpense: isCurrentMonth,
          isMock: true,
        })
      }
    }

    // Insert transactions into database
    for (const item of transactionsToInsert) {
      const btx = await prisma.bankTransaction.create({
        data: item,
      })

      // If syncedToExpense in current month, create expense record so daily budget reflects immediately
      if (item.syncedToExpense && item.type === 'DEBIT') {
        const exp = await prisma.expense.create({
          data: {
            userId,
            amount: item.amount,
            categoryName: item.category,
            note: `${item.merchantName} (${item.paymentMethod})`,
            date: item.date,
            paymentMethod: item.paymentMethod,
            isEmergency: false,
            bankTransactionId: btx.id,
            isMock: true,
          },
        })

        await prisma.bankTransaction.update({
          where: { id: btx.id },
          data: { expenseId: exp.id },
        })
      }
    }

    // Update account balance with the final calculated balance
    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { balance: Math.max(10000, currentBalance), lastSyncedAt: new Date() },
    })
  }
}

// Export singleton instance of default provider
export const mockBankProvider: BankProvider = new FakeBankProvider()
