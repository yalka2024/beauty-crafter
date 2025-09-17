import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const location = searchParams.get("location")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const providerType = searchParams.get("providerType")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
      provider: {
        isAvailable: true,
        status: "ACTIVE",
      },
    }

    if (category && category !== "all") {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { provider: { user: { name: { contains: search, mode: "insensitive" } } } },
      ]
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (providerType && providerType !== "all") {
      where.provider = {
        ...where.provider,
        providerType: { has: providerType },
      }
    }

    // Fetch services with provider information
    const [services, totalCount] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
              reviews: {
                select: {
                  rating: true,
                },
              },
            },
          },
          addOns: {
            where: { isActive: true },
          },
        },
        orderBy: [
          { provider: { rating: "desc" } },
          { provider: { totalReviews: "desc" } },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.service.count({ where }),
    ])

    // Transform data for frontend
    const transformedServices = services.map((service) => {
      const averageRating = service.provider.reviews.length > 0
        ? service.provider.reviews.reduce((sum, review) => sum + review.rating, 0) / service.provider.reviews.length
        : 0

      return {
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        subcategory: service.subcategory,
        duration: service.duration,
        price: parseFloat(service.price.toString()),
        location: service.location,
        isActive: service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        provider: {
          id: service.provider.id,
          name: service.provider.user.name,
          avatar: service.provider.user.avatar,
          rating: parseFloat(averageRating.toFixed(1)),
          totalReviews: service.provider.totalReviews,
          businessName: service.provider.businessName,
          yearsOfExperience: service.provider.yearsOfExperience,
          specialties: service.provider.specialties,
          bio: service.provider.bio,
          hourlyRate: parseFloat(service.provider.hourlyRate.toString()),
          travelRadius: service.provider.travelRadius,
          acceptsHomeService: service.provider.acceptsHomeService,
          acceptsSalonService: service.provider.acceptsSalonService,
        },
        addOns: service.addOns.map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          description: addOn.description,
          price: parseFloat(addOn.price.toString()),
          duration: addOn.duration,
        })),
      }
    })

    return NextResponse.json({
      services: transformedServices,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "PROVIDER") {
      return NextResponse.json(
        { error: "Unauthorized. Only providers can create services." },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ["name", "description", "category", "duration", "price"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Get provider ID from session
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id },
    })

    if (!provider) {
      return NextResponse.json(
        { error: "Provider profile not found" },
        { status: 404 }
      )
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        providerId: provider.id,
        name: body.name,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory,
        duration: parseInt(body.duration),
        price: body.price,
        location: body.location || "BOTH",
        isActive: true,
      },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      { 
        message: "Service created successfully",
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          category: service.category,
          subcategory: service.subcategory,
          duration: service.duration,
          price: parseFloat(service.price.toString()),
          location: service.location,
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
          provider: {
            id: service.provider.id,
            name: service.provider.user.name,
            avatar: service.provider.user.avatar,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    )
  }
} 