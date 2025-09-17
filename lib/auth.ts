import { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/prisma"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"
import { verifyMFAToken, isMFAEnabled } from "./mfa"
import { JWTManager } from "./jwt-manager"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaToken: { label: "MFA Token", type: "text", optional: true }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            client: true,
            provider: true,
            admin: true
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        // Check if MFA is enabled for this user
        const mfaEnabled = await isMFAEnabled(user.id)
        
        if (mfaEnabled) {
          // If MFA is enabled but no token provided, return special indicator
          if (!credentials.mfaToken) {
            throw new Error("MFA_REQUIRED")
          }

          // Verify MFA token
          const mfaResult = await verifyMFAToken(user.id, credentials.mfaToken)
          if (!mfaResult.isValid) {
            throw new Error("INVALID_MFA_TOKEN")
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          mfaEnabled
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.role = user.role
        token.status = user.status
        token.id = user.id
        token.mfaEnabled = (user as any).mfaEnabled || false
      }
      
      // Check if token needs refresh
      if (trigger === "update" && token.id) {
        const now = Math.floor(Date.now() / 1000)
        const tokenAge = now - (token.iat || 0)
        const refreshThreshold = 15 * 60 // 15 minutes
        
        if (tokenAge > refreshThreshold) {
          // Generate new token pair
          const newTokens = await JWTManager.generateTokenPair(
            token.id as string,
            token.email as string,
            token.role as string
          )
          
          // Update token with new values
          token.accessToken = newTokens.accessToken
          token.refreshToken = newTokens.refreshToken
          token.iat = now
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as UserRole
        session.user.status = token.status
        session.user.id = token.id as string
        session.user.mfaEnabled = token.mfaEnabled as boolean
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Handle Google OAuth sign in
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Create new user with Google profile
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              emailVerified: new Date(),
              avatar: user.image,
              role: UserRole.CLIENT, // Default role
              status: "ACTIVE"
            }
          })
        }
      }
      return true
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request"
  },
  events: {
    async createUser({ user }) {
      // Create client profile for new users
      await prisma.client.create({
        data: {
          userId: user.id,
          preferences: {},
          medicalConditions: [],
          allergies: []
        }
      })
    }
  }
}

export default authOptions 