import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SocialPostData {
  userId: string
  providerId?: string
  bookingId?: string
  platform: 'instagram' | 'tiktok' | 'facebook' | 'twitter'
  content: string
  mediaUrls: string[]
  hashtags: string[]
  isPublished?: boolean
}

export interface InfluencerData {
  userId: string
  platform: string
  handle: string
  followers: number
  engagementRate: number
  categories: string[]
  isVerified?: boolean
  commissionRate?: number
}

export interface InfluencerPartnershipData {
  influencerId: string
  providerId: string
  startDate: Date
  endDate?: Date
  terms: any
  commission: number
}

export class SocialIntegrationManager {
  /**
   * Create a social post
   */
  async createSocialPost(data: SocialPostData): Promise<string> {
    try {
      const post = await prisma.socialPost.create({
        data: {
          userId: data.userId,
          providerId: data.providerId,
          bookingId: data.bookingId,
          platform: data.platform,
          content: data.content,
          mediaUrls: data.mediaUrls,
          hashtags: data.hashtags,
          isPublished: data.isPublished || false
        }
      })

      return post.id
    } catch (error) {
      console.error('Error creating social post:', error)
      throw new Error('Failed to create social post')
    }
  }

  /**
   * Publish social post to platform
   */
  async publishSocialPost(postId: string): Promise<void> {
    try {
      const post = await prisma.socialPost.findUnique({
        where: { id: postId }
      })

      if (!post) {
        throw new Error('Post not found')
      }

      // Here you would integrate with actual social media APIs
      // For now, we'll just mark it as published
      await prisma.socialPost.update({
        where: { id: postId },
        data: {
          isPublished: true,
          publishedAt: new Date()
        }
      })

      // Track engagement (mock data for now)
      await this.trackEngagement(postId)
    } catch (error) {
      console.error('Error publishing social post:', error)
      throw new Error('Failed to publish social post')
    }
  }

  /**
   * Get user's social posts
   */
  async getUserSocialPosts(userId: string, platform?: string) {
    try {
      const whereClause: any = { userId }
      if (platform) {
        whereClause.platform = platform
      }

      const posts = await prisma.socialPost.findMany({
        where: whereClause,
        include: {
          provider: {
            include: { user: true }
          },
          booking: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return posts
    } catch (error) {
      console.error('Error getting user social posts:', error)
      throw new Error('Failed to get social posts')
    }
  }

  /**
   * Get public social posts for inspiration
   */
  async getPublicSocialPosts(platform?: string, limit: number = 20) {
    try {
      const whereClause: any = { isPublished: true }
      if (platform) {
        whereClause.platform = platform
      }

      const posts = await prisma.socialPost.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true, avatar: true }
          },
          provider: {
            include: { user: { select: { name: true, avatar: true } } }
          }
        },
        orderBy: { publishedAt: 'desc' },
        take: limit
      })

      return posts
    } catch (error) {
      console.error('Error getting public social posts:', error)
      throw new Error('Failed to get public social posts')
    }
  }

  /**
   * Register as influencer
   */
  async registerInfluencer(data: InfluencerData): Promise<string> {
    try {
      const influencer = await prisma.influencer.create({
        data: {
          userId: data.userId,
          platform: data.platform,
          handle: data.handle,
          followers: data.followers,
          engagementRate: data.engagementRate,
          categories: data.categories,
          isVerified: data.isVerified || false,
          commissionRate: data.commissionRate
        }
      })

      return influencer.id
    } catch (error) {
      console.error('Error registering influencer:', error)
      throw new Error('Failed to register as influencer')
    }
  }

  /**
   * Get influencer profile
   */
  async getInfluencerProfile(userId: string) {
    try {
      const influencer = await prisma.influencer.findUnique({
        where: { userId },
        include: {
          user: {
            select: { name: true, avatar: true, email: true }
          }
        }
      })

      return influencer
    } catch (error) {
      console.error('Error getting influencer profile:', error)
      throw new Error('Failed to get influencer profile')
    }
  }

  /**
   * Search influencers
   */
  async searchInfluencers(filters: {
    platform?: string
    categories?: string[]
    minFollowers?: number
    maxFollowers?: number
    minEngagementRate?: number
    isVerified?: boolean
  }) {
    try {
      const whereClause: any = { isActive: true }

      if (filters.platform) {
        whereClause.platform = filters.platform
      }

      if (filters.categories && filters.categories.length > 0) {
        whereClause.categories = {
          hasSome: filters.categories
        }
      }

      if (filters.minFollowers) {
        whereClause.followers = { gte: filters.minFollowers }
      }

      if (filters.maxFollowers) {
        whereClause.followers = { ...whereClause.followers, lte: filters.maxFollowers }
      }

      if (filters.minEngagementRate) {
        whereClause.engagementRate = { gte: filters.minEngagementRate }
      }

      if (filters.isVerified !== undefined) {
        whereClause.isVerified = filters.isVerified
      }

      const influencers = await prisma.influencer.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true, avatar: true }
          }
        },
        orderBy: { followers: 'desc' }
      })

      return influencers
    } catch (error) {
      console.error('Error searching influencers:', error)
      throw new Error('Failed to search influencers')
    }
  }

  /**
   * Create influencer partnership
   */
  async createInfluencerPartnership(data: InfluencerPartnershipData): Promise<string> {
    try {
      const partnership = await prisma.influencerPartnership.create({
        data: {
          influencerId: data.influencerId,
          providerId: data.providerId,
          status: 'pending',
          startDate: data.startDate,
          endDate: data.endDate,
          terms: data.terms,
          commission: data.commission
        }
      })

      // Send notifications
      await this.sendPartnershipNotifications(partnership.id)

      return partnership.id
    } catch (error) {
      console.error('Error creating influencer partnership:', error)
      throw new Error('Failed to create influencer partnership')
    }
  }

  /**
   * Update partnership status
   */
  async updatePartnershipStatus(
    partnershipId: string,
    status: 'pending' | 'active' | 'completed' | 'cancelled'
  ): Promise<void> {
    try {
      await prisma.influencerPartnership.update({
        where: { id: partnershipId },
        data: { status }
      })

      // Send status update notification
      await this.sendPartnershipStatusNotification(partnershipId, status)
    } catch (error) {
      console.error('Error updating partnership status:', error)
      throw new Error('Failed to update partnership status')
    }
  }

  /**
   * Get provider's partnerships
   */
  async getProviderPartnerships(providerId: string) {
    try {
      const partnerships = await prisma.influencerPartnership.findMany({
        where: { providerId },
        include: {
          influencer: {
            include: {
              user: {
                select: { name: true, avatar: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return partnerships
    } catch (error) {
      console.error('Error getting provider partnerships:', error)
      throw new Error('Failed to get provider partnerships')
    }
  }

  /**
   * Get influencer's partnerships
   */
  async getInfluencerPartnerships(influencerId: string) {
    try {
      const partnerships = await prisma.influencerPartnership.findMany({
        where: { influencerId },
        include: {
          provider: {
            include: {
              user: {
                select: { name: true, avatar: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return partnerships
    } catch (error) {
      console.error('Error getting influencer partnerships:', error)
      throw new Error('Failed to get influencer partnerships')
    }
  }

  /**
   * Generate social media content suggestions
   */
  async generateContentSuggestions(bookingId: string): Promise<string[]> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: true,
          provider: {
            include: { user: true }
          },
          client: {
            include: { user: true }
          }
        }
      })

      if (!booking) {
        return []
      }

      const suggestions = [
        `Just had an amazing ${booking.service.name} with ${booking.provider.user.name}! ✨ #BeautyCrafter #${booking.service.category}`,
        `Transformation Tuesday! Check out this ${booking.service.name} by ${booking.provider.user.name} 🎨 #BeautyTransformation #BeautyCrafter`,
        `Booked through Beauty Crafter and couldn't be happier! ${booking.service.name} was perfect 💅 #BeautyCrafter #Booked`,
        `Shoutout to ${booking.provider.user.name} for the incredible ${booking.service.name}! #BeautyCrafter #LocalBeauty`,
        `Why I love Beauty Crafter: Easy booking, amazing results! ${booking.service.name} was everything I hoped for ✨ #BeautyCrafter #BeautyApp`
      ]

      return suggestions
    } catch (error) {
      console.error('Error generating content suggestions:', error)
      return []
    }
  }

  /**
   * Track social media engagement
   */
  async trackEngagement(postId: string): Promise<void> {
    try {
      // Mock engagement data - in real implementation, this would come from social media APIs
      const mockEngagement = {
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50)
      }

      await prisma.socialPost.update({
        where: { id: postId },
        data: { engagement: mockEngagement }
      })
    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  }

  /**
   * Get social media analytics
   */
  async getSocialAnalytics(userId: string) {
    try {
      const posts = await prisma.socialPost.findMany({
        where: { userId },
        select: {
          platform: true,
          engagement: true,
          publishedAt: true,
          isPublished: true
        }
      })

      const analytics = {
        totalPosts: posts.length,
        publishedPosts: posts.filter(p => p.isPublished).length,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        platformBreakdown: {} as Record<string, number>,
        engagementTrends: [] as Array<{ date: string; engagement: number }>
      }

      posts.forEach(post => {
        if (post.engagement) {
          const engagement = post.engagement as any
          analytics.totalLikes += engagement.likes || 0
          analytics.totalComments += engagement.comments || 0
          analytics.totalShares += engagement.shares || 0
        }

        analytics.platformBreakdown[post.platform] = (analytics.platformBreakdown[post.platform] || 0) + 1
      })

      return analytics
    } catch (error) {
      console.error('Error getting social analytics:', error)
      throw new Error('Failed to get social analytics')
    }
  }

  /**
   * Send partnership notifications
   */
  private async sendPartnershipNotifications(partnershipId: string): Promise<void> {
    try {
      const partnership = await prisma.influencerPartnership.findUnique({
        where: { id: partnershipId },
        include: {
          influencer: { include: { user: true } },
          provider: { include: { user: true } }
        }
      })

      if (!partnership) return

      // Notify influencer
      await prisma.notification.create({
        data: {
          userId: partnership.influencer.userId,
          title: 'New Partnership Request',
          message: `${partnership.provider.user.name} wants to partner with you!`,
          type: 'partnership_request',
          data: { partnershipId }
        }
      })

      // Notify provider
      await prisma.notification.create({
        data: {
          userId: partnership.provider.userId,
          title: 'Partnership Request Sent',
          message: `Partnership request sent to ${partnership.influencer.user.name}`,
          type: 'partnership_sent',
          data: { partnershipId }
        }
      })
    } catch (error) {
      console.error('Error sending partnership notifications:', error)
    }
  }

  /**
   * Send partnership status notification
   */
  private async sendPartnershipStatusNotification(
    partnershipId: string,
    status: string
  ): Promise<void> {
    try {
      const partnership = await prisma.influencerPartnership.findUnique({
        where: { id: partnershipId },
        include: {
          influencer: { include: { user: true } },
          provider: { include: { user: true } }
        }
      })

      if (!partnership) return

      const statusMessages = {
        active: 'Partnership is now active!',
        completed: 'Partnership has been completed.',
        cancelled: 'Partnership has been cancelled.'
      }

      const message = statusMessages[status as keyof typeof statusMessages] || 'Partnership status updated.'

      // Notify both parties
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: partnership.influencer.userId,
            title: 'Partnership Status Update',
            message,
            type: 'partnership_update',
            data: { partnershipId, status }
          }
        }),
        prisma.notification.create({
          data: {
            userId: partnership.provider.userId,
            title: 'Partnership Status Update',
            message,
            type: 'partnership_update',
            data: { partnershipId, status }
          }
        })
      ])
    } catch (error) {
      console.error('Error sending partnership status notification:', error)
    }
  }
}

export const socialIntegrationManager = new SocialIntegrationManager()
