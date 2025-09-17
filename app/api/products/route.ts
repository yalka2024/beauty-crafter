import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ecommerceModuleManager } from '@/lib/ecommerce-module'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  price: z.number(),
  currency: z.string().default('USD'),
  sku: z.string(),
  stock: z.number(),
  images: z.array(z.string()),
  specifications: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createProductSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid product data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const productId = await ecommerceModuleManager.createProduct(validationResult.data)

    return NextResponse.json({
      success: true,
      data: { productId },
      message: 'Product created successfully'
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true',
      searchTerm: searchParams.get('search') || undefined
    }

    const products = await ecommerceModuleManager.searchProducts(filters)

    return NextResponse.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Error getting products:', error)
    return NextResponse.json(
      { error: 'Failed to get products' },
      { status: 500 }
    )
  }
}
