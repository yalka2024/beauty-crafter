import { PrismaClient } from '@prisma/client'
import { Twilio } from 'twilio'

const prisma = new PrismaClient()

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export interface VirtualConsultationData {
  clientId: string
  providerId: string
  serviceId?: string
  scheduledDate: Date
  duration: number
  notes?: string
}

export interface TwilioRoomData {
  roomId: string
  meetingUrl: string
  accessToken: string
}

export class VirtualConsultationManager {
  /**
   * Create a new virtual consultation
   */
  async createConsultation(data: VirtualConsultationData): Promise<string> {
    try {
      // Create Twilio room
      const roomData = await this.createTwilioRoom(data.duration)
      
      // Save consultation to database
      const consultation = await prisma.virtualConsultation.create({
        data: {
          clientId: data.clientId,
          providerId: data.providerId,
          serviceId: data.serviceId,
          scheduledDate: data.scheduledDate,
          duration: data.duration,
          status: 'scheduled',
          twilioRoomId: roomData.roomId,
          meetingUrl: roomData.meetingUrl,
          notes: data.notes
        }
      })

      // Send notifications
      await this.sendConsultationNotifications(consultation.id)

      return consultation.id
    } catch (error) {
      console.error('Error creating virtual consultation:', error)
      throw new Error('Failed to create virtual consultation')
    }
  }

  /**
   * Start a virtual consultation
   */
  async startConsultation(consultationId: string): Promise<TwilioRoomData> {
    try {
      const consultation = await prisma.virtualConsultation.findUnique({
        where: { id: consultationId }
      })

      if (!consultation) {
        throw new Error('Consultation not found')
      }

      if (consultation.status !== 'scheduled') {
        throw new Error('Consultation is not in scheduled status')
      }

      // Update status
      await prisma.virtualConsultation.update({
        where: { id: consultationId },
        data: { status: 'in_progress' }
      })

      // Generate access tokens for both participants
      const accessToken = await this.generateAccessToken(consultation.twilioRoomId!)

      return {
        roomId: consultation.twilioRoomId!,
        meetingUrl: consultation.meetingUrl!,
        accessToken
      }
    } catch (error) {
      console.error('Error starting virtual consultation:', error)
      throw new Error('Failed to start virtual consultation')
    }
  }

  /**
   * End a virtual consultation
   */
  async endConsultation(consultationId: string, notes?: string): Promise<void> {
    try {
      await prisma.virtualConsultation.update({
        where: { id: consultationId },
        data: {
          status: 'completed',
          notes: notes || undefined
        }
      })

      // Clean up Twilio room
      const consultation = await prisma.virtualConsultation.findUnique({
        where: { id: consultationId }
      })

      if (consultation?.twilioRoomId) {
        await this.cleanupTwilioRoom(consultation.twilioRoomId)
      }
    } catch (error) {
      console.error('Error ending virtual consultation:', error)
      throw new Error('Failed to end virtual consultation')
    }
  }

  /**
   * Cancel a virtual consultation
   */
  async cancelConsultation(consultationId: string, reason?: string): Promise<void> {
    try {
      await prisma.virtualConsultation.update({
        where: { id: consultationId },
        data: {
          status: 'cancelled',
          notes: reason || undefined
        }
      })

      // Clean up Twilio room
      const consultation = await prisma.virtualConsultation.findUnique({
        where: { id: consultationId }
      })

      if (consultation?.twilioRoomId) {
        await this.cleanupTwilioRoom(consultation.twilioRoomId)
      }
    } catch (error) {
      console.error('Error cancelling virtual consultation:', error)
      throw new Error('Failed to cancel virtual consultation')
    }
  }

  /**
   * Get consultation details
   */
  async getConsultation(consultationId: string) {
    try {
      const consultation = await prisma.virtualConsultation.findUnique({
        where: { id: consultationId },
        include: {
          client: {
            include: { user: true }
          },
          provider: {
            include: { user: true }
          },
          service: true
        }
      })

      return consultation
    } catch (error) {
      console.error('Error getting consultation:', error)
      throw new Error('Failed to get consultation details')
    }
  }

  /**
   * Get user's consultations
   */
  async getUserConsultations(userId: string, role: 'client' | 'provider') {
    try {
      const whereClause = role === 'client' 
        ? { client: { userId } }
        : { provider: { userId } }

      const consultations = await prisma.virtualConsultation.findMany({
        where: whereClause,
        include: {
          client: {
            include: { user: true }
          },
          provider: {
            include: { user: true }
          },
          service: true
        },
        orderBy: { scheduledDate: 'desc' }
      })

      return consultations
    } catch (error) {
      console.error('Error getting user consultations:', error)
      throw new Error('Failed to get consultations')
    }
  }

  /**
   * Create Twilio room for consultation
   */
  private async createTwilioRoom(duration: number): Promise<{ roomId: string; meetingUrl: string }> {
    try {
      const roomName = `consultation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const room = await twilioClient.video.rooms.create({
        uniqueName: roomName,
        type: 'group',
        maxParticipants: 2,
        statusCallback: `${process.env.NEXTAUTH_URL}/api/virtual-consultations/webhook`,
        recordParticipantsOnConnect: true,
        mediaRegion: 'us1'
      })

      const meetingUrl = `${process.env.NEXTAUTH_URL}/virtual-consultation/${room.sid}`

      return {
        roomId: room.sid,
        meetingUrl
      }
    } catch (error) {
      console.error('Error creating Twilio room:', error)
      throw new Error('Failed to create video room')
    }
  }

  /**
   * Generate access token for Twilio room
   */
  private async generateAccessToken(roomId: string): Promise<string> {
    try {
      const AccessToken = require('twilio').jwt.AccessToken
      const VideoGrant = AccessToken.VideoGrant

      const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_API_KEY!,
        process.env.TWILIO_API_SECRET!,
        { identity: `user_${Date.now()}` }
      )

      const videoGrant = new VideoGrant({
        room: roomId
      })

      token.addGrant(videoGrant)

      return token.toJwt()
    } catch (error) {
      console.error('Error generating access token:', error)
      throw new Error('Failed to generate access token')
    }
  }

  /**
   * Clean up Twilio room
   */
  private async cleanupTwilioRoom(roomId: string): Promise<void> {
    try {
      await twilioClient.video.rooms(roomId).update({ status: 'completed' })
    } catch (error) {
      console.error('Error cleaning up Twilio room:', error)
      // Don't throw error as this is cleanup
    }
  }

  /**
   * Send consultation notifications
   */
  private async sendConsultationNotifications(consultationId: string): Promise<void> {
    try {
      const consultation = await this.getConsultation(consultationId)
      if (!consultation) return

      // Send notification to client
      await prisma.notification.create({
        data: {
          userId: consultation.client.userId,
          title: 'Virtual Consultation Scheduled',
          message: `Your virtual consultation with ${consultation.provider.user.name} is scheduled for ${consultation.scheduledDate.toLocaleString()}`,
          type: 'consultation_scheduled',
          data: {
            consultationId,
            providerName: consultation.provider.user.name,
            scheduledDate: consultation.scheduledDate
          }
        }
      })

      // Send notification to provider
      await prisma.notification.create({
        data: {
          userId: consultation.provider.userId,
          title: 'Virtual Consultation Scheduled',
          message: `You have a virtual consultation with ${consultation.client.user.name} scheduled for ${consultation.scheduledDate.toLocaleString()}`,
          type: 'consultation_scheduled',
          data: {
            consultationId,
            clientName: consultation.client.user.name,
            scheduledDate: consultation.scheduledDate
          }
        }
      })
    } catch (error) {
      console.error('Error sending consultation notifications:', error)
      // Don't throw error as this is notification
    }
  }

  /**
   * Get available time slots for a provider
   */
  async getAvailableTimeSlots(providerId: string, date: Date) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      // Get existing consultations for the day
      const existingConsultations = await prisma.virtualConsultation.findMany({
        where: {
          providerId,
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ['scheduled', 'in_progress']
          }
        }
      })

      // Get provider availability
      const dayOfWeek = date.getDay()
      const availability = await prisma.availability.findFirst({
        where: {
          providerId,
          dayOfWeek,
          isAvailable: true
        }
      })

      if (!availability) {
        return []
      }

      // Generate time slots (30-minute intervals)
      const timeSlots = []
      const startTime = this.parseTime(availability.startTime)
      const endTime = this.parseTime(availability.endTime)

      for (let time = startTime; time < endTime; time += 30) {
        const slotTime = new Date(date)
        slotTime.setHours(Math.floor(time / 60), time % 60, 0, 0)

        // Check if slot is available
        const isBooked = existingConsultations.some(consultation => {
          const consultationTime = new Date(consultation.scheduledDate)
          return Math.abs(consultationTime.getTime() - slotTime.getTime()) < 30 * 60 * 1000 // 30 minutes
        })

        if (!isBooked) {
          timeSlots.push({
            time: slotTime,
            available: true
          })
        }
      }

      return timeSlots
    } catch (error) {
      console.error('Error getting available time slots:', error)
      throw new Error('Failed to get available time slots')
    }
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }
}

export const virtualConsultationManager = new VirtualConsultationManager()
