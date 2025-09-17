import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { encryption } from "@/lib/encryption"

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  password: z.string().min(8).max(100),
  role: z.enum(["CLIENT", "PROVIDER"]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = registerSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { name, email, phone, password, role } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Encrypt sensitive data
    const encryptedEmail = await encryption.encryptField(email)
    const encryptedPhone = await encryption.encryptField(phone)
    const encryptedName = await encryption.encryptField(name)

    // Create user and related profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: encryptedName,
          email: encryptedEmail,
          phone: encryptedPhone,
          password: hashedPassword,
          role,
          status: "ACTIVE",
        },
      })

      // Create role-specific profile
      if (role === "CLIENT") {
        await tx.client.create({
          data: {
            userId: user.id,
            preferences: {},
            emergencyContact: null,
            medicalConditions: [],
            allergies: [],
          },
        })
      } else if (role === "PROVIDER") {
        await tx.provider.create({
          data: {
            userId: user.id,
            bio: "",
            specialties: [],
            experience: 0,
            hourlyRate: 0,
            availability: {},
            isVerified: false,
          },
        })
      }

      return user
    })

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: result.id,
          email: email, // Return unencrypted email for response
          name: name,   // Return unencrypted name for response
          role: result.role,
          status: result.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}