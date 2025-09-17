import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { internationalPaymentsManager } from '@/lib/international-payments'
import { z } from 'zod'

const createPaymentIntentSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  countryCode: z.string(),
  paymentMethod: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createPaymentIntentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { clientSecret, paymentIntentId } = await internationalPaymentsManager.createInternationalPaymentIntent(
      validationResult.data.amount,
      validationResult.data.currency,
      validationResult.data.countryCode,
      validationResult.data.paymentMethod
    )

    return NextResponse.json({
      success: true,
      data: { clientSecret, paymentIntentId }
    })
  } catch (error) {
    console.error('Error creating international payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = searchParams.get('country') || 'US'

    const [currencies, paymentMethods] = await Promise.all([
      internationalPaymentsManager.getSupportedCurrencies(),
      internationalPaymentsManager.getAvailablePaymentMethods(countryCode)
    ])

    return NextResponse.json({
      success: true,
      data: {
        currencies,
        paymentMethods,
        supportedCurrencies: internationalPaymentsManager.getSupportedCurrenciesForCountry(countryCode)
      }
    })
  } catch (error) {
    console.error('Error getting international payment options:', error)
    return NextResponse.json(
      { error: 'Failed to get payment options' },
      { status: 500 }
    )
  }
}
