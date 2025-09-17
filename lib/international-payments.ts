import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export interface PaymentMethodData {
  userId: string
  type: 'card' | 'bank_account' | 'paypal' | 'alipay' | 'wechat'
  provider: 'stripe' | 'paypal' | 'alipay' | 'wechat'
  details: any
  isDefault: boolean
}

export interface CurrencyData {
  code: string
  name: string
  symbol: string
  rate: number
  isActive: boolean
}

export class InternationalPaymentsManager {
  private supportedCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, isActive: true },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85, isActive: true },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73, isActive: true },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25, isActive: true },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.35, isActive: true },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0, isActive: true },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1200.0, isActive: true },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 6.45, isActive: true },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 75.0, isActive: true },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.2, isActive: true },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', rate: 20.0, isActive: true },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 75.0, isActive: true }
  ]

  private paymentProviders = {
    stripe: {
      supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'DK', 'FI', 'IE', 'LU', 'NO', 'PT', 'SE', 'SG', 'JP', 'HK', 'NZ'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'HKD', 'NZD', 'CHF', 'DKK', 'NOK', 'SEK']
    },
    paypal: {
      supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'DK', 'FI', 'IE', 'LU', 'NO', 'PT', 'SE', 'SG', 'JP', 'HK', 'NZ', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'VE'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'HKD', 'NZD', 'CHF', 'DKK', 'NOK', 'SEK', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VES']
    },
    alipay: {
      supportedCountries: ['CN', 'HK', 'TW', 'SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'KR', 'JP'],
      supportedCurrencies: ['CNY', 'HKD', 'TWD', 'SGD', 'MYR', 'THB', 'IDR', 'PHP', 'VND', 'KRW', 'JPY']
    },
    wechat: {
      supportedCountries: ['CN', 'HK', 'TW', 'SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'KR', 'JP'],
      supportedCurrencies: ['CNY', 'HKD', 'TWD', 'SGD', 'MYR', 'THB', 'IDR', 'PHP', 'VND', 'KRW', 'JPY']
    }
  }

  /**
   * Initialize supported currencies
   */
  async initializeCurrencies(): Promise<void> {
    try {
      for (const currency of this.supportedCurrencies) {
        await prisma.currency.upsert({
          where: { code: currency.code },
          update: currency,
          create: currency
        })
      }
    } catch (error) {
      console.error('Error initializing currencies:', error)
      throw new Error('Failed to initialize currencies')
    }
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies() {
    try {
      const currencies = await prisma.currency.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      })

      return currencies
    } catch (error) {
      console.error('Error getting supported currencies:', error)
      throw new Error('Failed to get supported currencies')
    }
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    try {
      if (fromCurrency === toCurrency) return amount

      const fromRate = await this.getCurrencyRate(fromCurrency)
      const toRate = await this.getCurrencyRate(toCurrency)

      // Convert to USD first, then to target currency
      const usdAmount = amount / fromRate
      const convertedAmount = usdAmount * toRate

      return Math.round(convertedAmount * 100) / 100 // Round to 2 decimal places
    } catch (error) {
      console.error('Error converting currency:', error)
      throw new Error('Failed to convert currency')
    }
  }

  /**
   * Get currency rate
   */
  private async getCurrencyRate(currencyCode: string): Promise<number> {
    try {
      const currency = await prisma.currency.findUnique({
        where: { code: currencyCode }
      })

      if (!currency) {
        throw new Error(`Currency ${currencyCode} not found`)
      }

      return currency.rate
    } catch (error) {
      console.error('Error getting currency rate:', error)
      throw new Error('Failed to get currency rate')
    }
  }

  /**
   * Get available payment methods for country
   */
  getAvailablePaymentMethods(countryCode: string): string[] {
    const methods: string[] = []

    for (const [provider, config] of Object.entries(this.paymentProviders)) {
      if (config.supportedCountries.includes(countryCode)) {
        methods.push(provider)
      }
    }

    return methods
  }

  /**
   * Get supported currencies for country
   */
  getSupportedCurrenciesForCountry(countryCode: string): string[] {
    const currencies: string[] = []

    for (const [provider, config] of Object.entries(this.paymentProviders)) {
      if (config.supportedCountries.includes(countryCode)) {
        currencies.push(...config.supportedCurrencies)
      }
    }

    return [...new Set(currencies)] // Remove duplicates
  }

  /**
   * Create payment intent with international support
   */
  async createInternationalPaymentIntent(
    amount: number,
    currency: string,
    countryCode: string,
    paymentMethod?: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      // Validate currency support for country
      const supportedCurrencies = this.getSupportedCurrenciesForCountry(countryCode)
      if (!supportedCurrencies.includes(currency)) {
        throw new Error(`Currency ${currency} not supported in ${countryCode}`)
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          country: countryCode,
          payment_method: paymentMethod || 'auto'
        }
      })

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id
      }
    } catch (error) {
      console.error('Error creating international payment intent:', error)
      throw new Error('Failed to create payment intent')
    }
  }

  /**
   * Handle payment method setup for international users
   */
  async setupInternationalPaymentMethod(
    userId: string,
    countryCode: string,
    paymentMethodType: string
  ): Promise<{ setupIntentId: string; clientSecret: string }> {
    try {
      const availableMethods = this.getAvailablePaymentMethods(countryCode)
      if (!availableMethods.includes(paymentMethodType)) {
        throw new Error(`Payment method ${paymentMethodType} not available in ${countryCode}`)
      }

      // Create Stripe setup intent
      const setupIntent = await stripe.setupIntents.create({
        payment_method_types: [paymentMethodType],
        usage: 'off_session',
        metadata: {
          userId,
          country: countryCode
        }
      })

      return {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret!
      }
    } catch (error) {
      console.error('Error setting up international payment method:', error)
      throw new Error('Failed to setup payment method')
    }
  }

  /**
   * Get localized pricing for service
   */
  async getLocalizedPricing(
    serviceId: string,
    currency: string,
    countryCode: string
  ): Promise<{ amount: number; currency: string; formatted: string }> {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      })

      if (!service) {
        throw new Error('Service not found')
      }

      const originalAmount = Number(service.price)
      const convertedAmount = await this.convertCurrency(
        originalAmount,
        'USD', // Assuming original price is in USD
        currency
      )

      const formatted = this.formatCurrency(convertedAmount, currency)

      return {
        amount: convertedAmount,
        currency,
        formatted
      }
    } catch (error) {
      console.error('Error getting localized pricing:', error)
      throw new Error('Failed to get localized pricing')
    }
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string): string {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'KRW': '₩',
      'CNY': '¥',
      'INR': '₹',
      'BRL': 'R$',
      'MXN': '$',
      'RUB': '₽'
    }

    const symbol = currencySymbols[currency] || currency
    return `${symbol}${amount.toFixed(2)}`
  }

  /**
   * Get payment analytics by region
   */
  async getPaymentAnalyticsByRegion() {
    try {
      const analytics = await prisma.payment.groupBy({
        by: ['currency'],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })

      return analytics.map(stat => ({
        currency: stat.currency,
        totalAmount: Number(stat._sum.amount) || 0,
        transactionCount: stat._count.id,
        averageAmount: stat._count.id > 0 ? Number(stat._sum.amount) / stat._count.id : 0
      }))
    } catch (error) {
      console.error('Error getting payment analytics by region:', error)
      throw new Error('Failed to get payment analytics')
    }
  }

  /**
   * Update currency rates
   */
  async updateCurrencyRates(rates: Record<string, number>): Promise<void> {
    try {
      for (const [currency, rate] of Object.entries(rates)) {
        await prisma.currency.updateMany({
          where: { code: currency },
          data: { rate }
        })
      }
    } catch (error) {
      console.error('Error updating currency rates:', error)
      throw new Error('Failed to update currency rates')
    }
  }

  /**
   * Get payment method preferences by region
   */
  getPaymentMethodPreferencesByRegion(): Record<string, string[]> {
    return {
      'US': ['stripe', 'paypal'],
      'CA': ['stripe', 'paypal'],
      'GB': ['stripe', 'paypal'],
      'AU': ['stripe', 'paypal'],
      'DE': ['stripe', 'paypal'],
      'FR': ['stripe', 'paypal'],
      'IT': ['stripe', 'paypal'],
      'ES': ['stripe', 'paypal'],
      'CN': ['alipay', 'wechat'],
      'HK': ['stripe', 'alipay', 'wechat'],
      'TW': ['stripe', 'alipay'],
      'SG': ['stripe', 'alipay'],
      'MY': ['stripe', 'alipay'],
      'TH': ['stripe', 'alipay'],
      'ID': ['stripe', 'alipay'],
      'PH': ['stripe', 'alipay'],
      'VN': ['stripe', 'alipay'],
      'KR': ['stripe', 'alipay'],
      'JP': ['stripe', 'alipay'],
      'MX': ['stripe', 'paypal'],
      'BR': ['stripe', 'paypal'],
      'AR': ['stripe', 'paypal'],
      'CL': ['stripe', 'paypal'],
      'CO': ['stripe', 'paypal'],
      'PE': ['stripe', 'paypal'],
      'UY': ['stripe', 'paypal'],
      'VE': ['stripe', 'paypal'],
      'RU': ['stripe'],
      'IN': ['stripe', 'paypal']
    }
  }
}

export const internationalPaymentsManager = new InternationalPaymentsManager()
