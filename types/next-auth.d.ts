import { UserRole } from "@prisma/client"
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      status: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    status: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    status: string
  }
} 