import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ecommerceModuleManager } from '@/lib/ecommerce-module'
import { z } from 'zod'

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1)
  })),
  shippingAddress: z.any(),
  billingAddress: z.any()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createOrderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid order data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { orderId, clientSecret } = await ecommerceModuleManager.createOrder({
      userId: session.user.id,
      ...validationResult.data
    })

    return NextResponse.json({
      success: true,
      data: { orderId, clientSecret },
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await ecommerceModuleManager.getUserOrders(session.user.id)

    return NextResponse.json({
      success: true,
      data: orders
    })
  } catch (error) {
    console.error('Error getting orders:', error)
    return NextResponse.json(
      { error: 'Failed to get orders' },
      { status: 500 }
    )
  }
}
