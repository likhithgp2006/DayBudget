export interface SupportedBank {
  id: string
  name: string
  code: string
  logo: string
  accountTypes: string[]
}

export interface AggregatorAccount {
  accountId: string
  bankName: string
  accountNumberMasked: string
  accountType: 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD'
  balance: number
  currency: string
}

export interface AggregatedTransaction {
  externalId: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  merchantName: string
  rawDescription: string
  date: Date
  suggestedCategory: string
  paymentMethod: string
}

export interface IBankAggregatorProvider {
  name: string
  getSupportedBanks(): Promise<SupportedBank[]>
  createConsentSession(bankId: string, mobileNumber: string): Promise<{ sessionId: string; status: string }>
  verifyOtpAndLink(sessionId: string, otp: string): Promise<{ success: boolean; accounts: AggregatorAccount[] }>
  fetchTransactions(accountId: string, fromDate: Date, toDate: Date): Promise<AggregatedTransaction[]>
}

// Auto-categorization dictionary
export function autoCategorizeMerchant(description: string, merchant: string): { category: string; paymentMethod: string } {
  const text = `${merchant} ${description}`.toLowerCase()

  if (text.includes('swiggy') || text.includes('zomato') || text.includes('starbucks') || 
      text.includes('mcdonald') || text.includes('blinkit') || text.includes('zepto') || 
      text.includes('instamart') || text.includes('cafe') || text.includes('restaurant') || text.includes('bakery')) {
    return { category: 'Food', paymentMethod: 'UPI' }
  }

  if (text.includes('uber') || text.includes('ola') || text.includes('rapido') || 
      text.includes('petrol') || text.includes('fuel') || text.includes('metro') || 
      text.includes('indian oil') || text.includes('shell') || text.includes('fastag')) {
    return { category: 'Transport', paymentMethod: 'UPI' }
  }

  if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || 
      text.includes('zara') || text.includes('h&m') || text.includes('uniqlo') || 
      text.includes('apple') || text.includes('croma') || text.includes('ikea')) {
    return { category: 'Shopping', paymentMethod: 'Credit Card' }
  }

  if (text.includes('electricity') || text.includes('airtel') || text.includes('jio') || 
      text.includes('bescom') || text.includes('bill') || text.includes('recharge') || 
      text.includes('wifi') || text.includes('rent') || text.includes('maintenance')) {
    return { category: 'Bills', paymentMethod: 'Net Banking' }
  }

  if (text.includes('netflix') || text.includes('spotify') || text.includes('prime') || 
      text.includes('bookmyshow') || text.includes('cinema') || text.includes('steam') || 
      text.includes('hotstar') || text.includes('youtube')) {
    return { category: 'Entertainment', paymentMethod: 'Credit Card' }
  }

  if (text.includes('apollo') || text.includes('pharmacy') || text.includes('cult.fit') || 
      text.includes('1mg') || text.includes('practo') || text.includes('hospital') || 
      text.includes('doctor') || text.includes('dental')) {
    return { category: 'Health', paymentMethod: 'Debit Card' }
  }

  if (text.includes('udemy') || text.includes('coursera') || text.includes('books') || 
      text.includes('school') || text.includes('college') || text.includes('tuition')) {
    return { category: 'Education', paymentMethod: 'UPI' }
  }

  return { category: 'Other', paymentMethod: 'UPI' }
}

// Mock Sandbox Provider simulating Setu / Finvu Account Aggregator / Plaid
export class MockBankAggregatorProvider implements IBankAggregatorProvider {
  name = 'MockAccountAggregator (Setu / Finvu / Plaid Sandbox)'

  async getSupportedBanks(): Promise<SupportedBank[]> {
    return [
      { id: 'bank_hdfc', name: 'HDFC Bank', code: 'HDFC', logo: '🏛️', accountTypes: ['SAVINGS', 'CURRENT', 'CREDIT_CARD'] },
      { id: 'bank_sbi', name: 'State Bank of India', code: 'SBI', logo: '🏦', accountTypes: ['SAVINGS', 'CURRENT'] },
      { id: 'bank_icici', name: 'ICICI Bank', code: 'ICICI', logo: '🏛️', accountTypes: ['SAVINGS', 'CURRENT', 'CREDIT_CARD'] },
      { id: 'bank_axis', name: 'Axis Bank', code: 'AXIS', logo: '🏦', accountTypes: ['SAVINGS', 'CREDIT_CARD'] },
      { id: 'bank_kotak', name: 'Kotak Mahindra Bank', code: 'KOTAK', logo: '🏦', accountTypes: ['SAVINGS', 'CURRENT'] },
    ]
  }

  async createConsentSession(bankId: string, mobileNumber: string): Promise<{ sessionId: string; status: string }> {
    return {
      sessionId: `consent_${bankId}_${Date.now()}`,
      status: 'AWAITING_OTP',
    }
  }

  async verifyOtpAndLink(sessionId: string, otp: string): Promise<{ success: boolean; accounts: AggregatorAccount[] }> {
    // In sandbox, any 4 or 6 digit OTP (e.g. 1234, 123456) succeeds
    const bankName = sessionId.includes('hdfc') ? 'HDFC Bank' 
      : sessionId.includes('sbi') ? 'State Bank of India'
      : sessionId.includes('icici') ? 'ICICI Bank'
      : sessionId.includes('axis') ? 'Axis Bank'
      : 'Kotak Mahindra Bank'

    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const randomBalance = Math.floor(25000 + Math.random() * 85000)

    return {
      success: true,
      accounts: [
        {
          accountId: `acc_${Date.now()}_1`,
          bankName,
          accountNumberMasked: `•••• ${randomSuffix}`,
          accountType: 'SAVINGS',
          balance: randomBalance,
          currency: 'INR',
        }
      ]
    }
  }

  async fetchTransactions(accountId: string, fromDate: Date, toDate: Date): Promise<AggregatedTransaction[]> {
    const merchants = [
      { name: 'Swiggy', desc: 'UPI/Swiggy Orders/Bangalore', cat: 'Food', amount: 340, method: 'UPI' },
      { name: 'Uber India', desc: 'UPI/Uber Technologies/Ride', cat: 'Transport', amount: 220, method: 'UPI' },
      { name: 'Blinkit Grocery', desc: 'UPI/Blinkit/Fresh veggies & milk', cat: 'Food', amount: 480, method: 'UPI' },
      { name: 'Amazon India', desc: 'POS/Amazon Retail/Online Purchase', cat: 'Shopping', amount: 1199, method: 'Credit Card' },
      { name: 'Starbucks Coffee', desc: 'POS/Starbucks Reserve Indiranagar', cat: 'Food', amount: 420, method: 'Credit Card' },
      { name: 'Airtel Broadband', desc: 'NEFT/Airtel Xstream Monthly', cat: 'Bills', amount: 999, method: 'Net Banking' },
      { name: 'Apollo Pharmacy', desc: 'UPI/Apollo Pharmacy Store', cat: 'Health', amount: 550, method: 'UPI' },
      { name: 'BookMyShow', desc: 'UPI/BigTree Entertainment/Movie Tickets', cat: 'Entertainment', amount: 700, method: 'UPI' },
    ]

    const result: AggregatedTransaction[] = []
    const now = new Date()

    // Generate recent transactions
    for (let i = 0; i < 5; i++) {
      const item = merchants[Math.floor(Math.random() * merchants.length)]
      const txDate = new Date(now.getTime() - i * 14 * 3600 * 1000)
      result.push({
        externalId: `tx_mock_${Date.now()}_${i}`,
        amount: item.amount,
        type: 'DEBIT',
        merchantName: item.name,
        rawDescription: item.desc,
        date: txDate,
        suggestedCategory: item.cat,
        paymentMethod: item.method,
      })
    }

    return result
  }
}

// Export singleton instance of default provider
export const bankAggregatorProvider: IBankAggregatorProvider = new MockBankAggregatorProvider()
