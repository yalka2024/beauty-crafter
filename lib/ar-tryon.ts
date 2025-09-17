import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ARSessionData {
  userId: string
  providerId?: string
  serviceId?: string
  sessionType: 'makeup' | 'hair' | 'nails'
  arData?: any
  beforeImage?: string
  afterImage?: string
  isPublic?: boolean
}

export interface ARFilter {
  id: string
  name: string
  category: string
  description: string
  filterUrl: string
  thumbnail: string
  isActive: boolean
}

export class ARTryOnManager {
  /**
   * Create a new AR session
   */
  async createARSession(data: ARSessionData): Promise<string> {
    try {
      const session = await prisma.aRSession.create({
        data: {
          userId: data.userId,
          providerId: data.providerId,
          serviceId: data.serviceId,
          sessionType: data.sessionType,
          arData: data.arData,
          beforeImage: data.beforeImage,
          afterImage: data.afterImage,
          isPublic: data.isPublic || false
        }
      })

      return session.id
    } catch (error) {
      console.error('Error creating AR session:', error)
      throw new Error('Failed to create AR session')
    }
  }

  /**
   * Update AR session with results
   */
  async updateARSession(
    sessionId: string,
    updates: {
      arData?: any
      beforeImage?: string
      afterImage?: string
      isPublic?: boolean
    }
  ): Promise<void> {
    try {
      await prisma.aRSession.update({
        where: { id: sessionId },
        data: updates
      })
    } catch (error) {
      console.error('Error updating AR session:', error)
      throw new Error('Failed to update AR session')
    }
  }

  /**
   * Get AR session details
   */
  async getARSession(sessionId: string) {
    try {
      const session = await prisma.aRSession.findUnique({
        where: { id: sessionId },
        include: {
          user: true,
          provider: {
            include: { user: true }
          },
          service: true
        }
      })

      return session
    } catch (error) {
      console.error('Error getting AR session:', error)
      throw new Error('Failed to get AR session')
    }
  }

  /**
   * Get user's AR sessions
   */
  async getUserARSessions(userId: string, sessionType?: string) {
    try {
      const whereClause: any = { userId }
      if (sessionType) {
        whereClause.sessionType = sessionType
      }

      const sessions = await prisma.aRSession.findMany({
        where: whereClause,
        include: {
          provider: {
            include: { user: true }
          },
          service: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return sessions
    } catch (error) {
      console.error('Error getting user AR sessions:', error)
      throw new Error('Failed to get AR sessions')
    }
  }

  /**
   * Get public AR sessions for inspiration
   */
  async getPublicARSessions(sessionType?: string, limit: number = 20) {
    try {
      const whereClause: any = { isPublic: true }
      if (sessionType) {
        whereClause.sessionType = sessionType
      }

      const sessions = await prisma.aRSession.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true, avatar: true }
          },
          provider: {
            include: { user: { select: { name: true, avatar: true } } }
          },
          service: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return sessions
    } catch (error) {
      console.error('Error getting public AR sessions:', error)
      throw new Error('Failed to get public AR sessions')
    }
  }

  /**
   * Get available AR filters for a session type
   */
  getAvailableFilters(sessionType: string): ARFilter[] {
    const filters: ARFilter[] = []

    switch (sessionType) {
      case 'makeup':
        filters.push(
          {
            id: 'natural-look',
            name: 'Natural Look',
            category: 'makeup',
            description: 'Subtle, everyday makeup look',
            filterUrl: '/ar-filters/natural-look.json',
            thumbnail: '/ar-filters/thumbnails/natural-look.jpg',
            isActive: true
          },
          {
            id: 'glam-look',
            name: 'Glam Look',
            category: 'makeup',
            description: 'Bold, evening makeup look',
            filterUrl: '/ar-filters/glam-look.json',
            thumbnail: '/ar-filters/thumbnails/glam-look.jpg',
            isActive: true
          },
          {
            id: 'smoky-eye',
            name: 'Smoky Eye',
            category: 'makeup',
            description: 'Dramatic smoky eye makeup',
            filterUrl: '/ar-filters/smoky-eye.json',
            thumbnail: '/ar-filters/thumbnails/smoky-eye.jpg',
            isActive: true
          }
        )
        break

      case 'hair':
        filters.push(
          {
            id: 'blonde-highlights',
            name: 'Blonde Highlights',
            category: 'hair',
            description: 'Add blonde highlights to your hair',
            filterUrl: '/ar-filters/blonde-highlights.json',
            thumbnail: '/ar-filters/thumbnails/blonde-highlights.jpg',
            isActive: true
          },
          {
            id: 'brunette-balayage',
            name: 'Brunette Balayage',
            category: 'hair',
            description: 'Try brunette balayage coloring',
            filterUrl: '/ar-filters/brunette-balayage.json',
            thumbnail: '/ar-filters/thumbnails/brunette-balayage.jpg',
            isActive: true
          },
          {
            id: 'red-tones',
            name: 'Red Tones',
            category: 'hair',
            description: 'Add warm red tones to your hair',
            filterUrl: '/ar-filters/red-tones.json',
            thumbnail: '/ar-filters/thumbnails/red-tones.jpg',
            isActive: true
          }
        )
        break

      case 'nails':
        filters.push(
          {
            id: 'french-manicure',
            name: 'French Manicure',
            category: 'nails',
            description: 'Classic French manicure style',
            filterUrl: '/ar-filters/french-manicure.json',
            thumbnail: '/ar-filters/thumbnails/french-manicure.jpg',
            isActive: true
          },
          {
            id: 'bold-colors',
            name: 'Bold Colors',
            category: 'nails',
            description: 'Try bold nail polish colors',
            filterUrl: '/ar-filters/bold-colors.json',
            thumbnail: '/ar-filters/thumbnails/bold-colors.jpg',
            isActive: true
          },
          {
            id: 'nail-art',
            name: 'Nail Art',
            category: 'nails',
            description: 'Decorative nail art designs',
            filterUrl: '/ar-filters/nail-art.json',
            thumbnail: '/ar-filters/thumbnails/nail-art.jpg',
            isActive: true
          }
        )
        break

      default:
        break
    }

    return filters.filter(filter => filter.isActive)
  }

  /**
   * Generate AR session share link
   */
  generateShareLink(sessionId: string): string {
    return `${process.env.NEXTAUTH_URL}/ar-session/${sessionId}`
  }

  /**
   * Save AR session image
   */
  async saveARSessionImage(
    sessionId: string,
    imageType: 'before' | 'after',
    imageUrl: string
  ): Promise<void> {
    try {
      const updateData = imageType === 'before' 
        ? { beforeImage: imageUrl }
        : { afterImage: imageUrl }

      await prisma.aRSession.update({
        where: { id: sessionId },
        data: updateData
      })
    } catch (error) {
      console.error('Error saving AR session image:', error)
      throw new Error('Failed to save AR session image')
    }
  }

  /**
   * Delete AR session
   */
  async deleteARSession(sessionId: string): Promise<void> {
    try {
      await prisma.aRSession.delete({
        where: { id: sessionId }
      })
    } catch (error) {
      console.error('Error deleting AR session:', error)
      throw new Error('Failed to delete AR session')
    }
  }

  /**
   * Get AR session analytics
   */
  async getARSessionAnalytics(userId: string) {
    try {
      const sessions = await prisma.aRSession.findMany({
        where: { userId },
        select: {
          sessionType: true,
          isPublic: true,
          createdAt: true
        }
      })

      const analytics = {
        totalSessions: sessions.length,
        sessionsByType: sessions.reduce((acc, session) => {
          acc[session.sessionType] = (acc[session.sessionType] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        publicSessions: sessions.filter(s => s.isPublic).length,
        recentSessions: sessions
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
      }

      return analytics
    } catch (error) {
      console.error('Error getting AR session analytics:', error)
      throw new Error('Failed to get AR session analytics')
    }
  }
}

export const arTryOnManager = new ARTryOnManager()
