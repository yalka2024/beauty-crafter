import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface BusinessLocationData {
  providerId: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  isPrimary?: boolean
}

export interface BusinessStaffData {
  locationId: string
  userId: string
  role: 'manager' | 'stylist' | 'assistant' | 'receptionist'
  permissions: string[]
}

export interface StaffPermissions {
  canManageBookings: boolean
  canManageServices: boolean
  canManageStaff: boolean
  canViewAnalytics: boolean
  canManageInventory: boolean
  canHandlePayments: boolean
}

export class MultiLocationManager {
  /**
   * Create a new business location
   */
  async createBusinessLocation(data: BusinessLocationData): Promise<string> {
    try {
      const location = await prisma.businessLocation.create({
        data: {
          providerId: data.providerId,
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone,
          email: data.email,
          isPrimary: data.isPrimary || false
        }
      })

      return location.id
    } catch (error) {
      console.error('Error creating business location:', error)
      throw new Error('Failed to create business location')
    }
  }

  /**
   * Update business location
   */
  async updateBusinessLocation(
    locationId: string,
    updates: Partial<BusinessLocationData>
  ): Promise<void> {
    try {
      await prisma.businessLocation.update({
        where: { id: locationId },
        data: updates
      })
    } catch (error) {
      console.error('Error updating business location:', error)
      throw new Error('Failed to update business location')
    }
  }

  /**
   * Get business locations for a provider
   */
  async getProviderLocations(providerId: string) {
    try {
      const locations = await prisma.businessLocation.findMany({
        where: { providerId },
        include: {
          staff: {
            include: {
              user: {
                select: { name: true, email: true, avatar: true }
              }
            }
          }
        },
        orderBy: { isPrimary: 'desc' }
      })

      return locations
    } catch (error) {
      console.error('Error getting provider locations:', error)
      throw new Error('Failed to get provider locations')
    }
  }

  /**
   * Add staff member to location
   */
  async addStaffMember(data: BusinessStaffData): Promise<string> {
    try {
      // Check if user exists and is a provider
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: { provider: true }
      })

      if (!user || !user.provider) {
        throw new Error('User must be a provider to be added as staff')
      }

      // Check if user is already staff at this location
      const existingStaff = await prisma.businessStaff.findUnique({
        where: {
          locationId_userId: {
            locationId: data.locationId,
            userId: data.userId
          }
        }
      })

      if (existingStaff) {
        throw new Error('User is already staff at this location')
      }

      const staff = await prisma.businessStaff.create({
        data: {
          locationId: data.locationId,
          userId: data.userId,
          role: data.role,
          permissions: data.permissions
        }
      })

      return staff.id
    } catch (error) {
      console.error('Error adding staff member:', error)
      throw new Error('Failed to add staff member')
    }
  }

  /**
   * Update staff member
   */
  async updateStaffMember(
    staffId: string,
    updates: {
      role?: string
      permissions?: string[]
      isActive?: boolean
    }
  ): Promise<void> {
    try {
      await prisma.businessStaff.update({
        where: { id: staffId },
        data: updates
      })
    } catch (error) {
      console.error('Error updating staff member:', error)
      throw new Error('Failed to update staff member')
    }
  }

  /**
   * Remove staff member from location
   */
  async removeStaffMember(staffId: string): Promise<void> {
    try {
      await prisma.businessStaff.update({
        where: { id: staffId },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error removing staff member:', error)
      throw new Error('Failed to remove staff member')
    }
  }

  /**
   * Get staff members for a location
   */
  async getLocationStaff(locationId: string) {
    try {
      const staff = await prisma.businessStaff.findMany({
        where: { 
          locationId,
          isActive: true
        },
        include: {
          user: {
            select: { name: true, email: true, avatar: true, phone: true }
          }
        },
        orderBy: { joinedAt: 'desc' }
      })

      return staff
    } catch (error) {
      console.error('Error getting location staff:', error)
      throw new Error('Failed to get location staff')
    }
  }

  /**
   * Get user's staff roles across all locations
   */
  async getUserStaffRoles(userId: string) {
    try {
      const staffRoles = await prisma.businessStaff.findMany({
        where: { 
          userId,
          isActive: true
        },
        include: {
          location: {
            select: { name: true, address: true, city: true, state: true }
          }
        }
      })

      return staffRoles
    } catch (error) {
      console.error('Error getting user staff roles:', error)
      throw new Error('Failed to get user staff roles')
    }
  }

  /**
   * Check if user has permission at location
   */
  async checkStaffPermission(
    userId: string,
    locationId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const staff = await prisma.businessStaff.findUnique({
        where: {
          locationId_userId: {
            locationId,
            userId
          }
        }
      })

      if (!staff || !staff.isActive) {
        return false
      }

      return staff.permissions.includes(permission)
    } catch (error) {
      console.error('Error checking staff permission:', error)
      return false
    }
  }

  /**
   * Get location analytics
   */
  async getLocationAnalytics(locationId: string, dateRange?: { start: Date; end: Date }) {
    try {
      const now = new Date()
      const startDate = dateRange?.start || new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = dateRange?.end || now

      const [bookings, revenue, staff] = await Promise.all([
        this.getLocationBookings(locationId, startDate, endDate),
        this.getLocationRevenue(locationId, startDate, endDate),
        this.getLocationStaff(locationId)
      ])

      const totalBookings = bookings.length
      const totalRevenue = revenue.reduce((sum, payment) => sum + Number(payment.amount), 0)
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

      return {
        totalBookings,
        totalRevenue,
        averageBookingValue,
        staffCount: staff.length,
        bookingsByDay: this.groupBookingsByDay(bookings),
        revenueByDay: this.groupRevenueByDay(revenue)
      }
    } catch (error) {
      console.error('Error getting location analytics:', error)
      throw new Error('Failed to get location analytics')
    }
  }

  /**
   * Set primary location
   */
  async setPrimaryLocation(providerId: string, locationId: string): Promise<void> {
    try {
      // Remove primary status from all locations
      await prisma.businessLocation.updateMany({
        where: { providerId },
        data: { isPrimary: false }
      })

      // Set new primary location
      await prisma.businessLocation.update({
        where: { id: locationId },
        data: { isPrimary: true }
      })
    } catch (error) {
      console.error('Error setting primary location:', error)
      throw new Error('Failed to set primary location')
    }
  }

  /**
   * Get available time slots for location
   */
  async getLocationAvailability(locationId: string, date: Date) {
    try {
      const location = await prisma.businessLocation.findUnique({
        where: { id: locationId },
        include: {
          provider: true
        }
      })

      if (!location) {
        throw new Error('Location not found')
      }

      // Get provider's availability for the day
      const dayOfWeek = date.getDay()
      const availability = await prisma.availability.findFirst({
        where: {
          providerId: location.providerId,
          dayOfWeek,
          isAvailable: true
        }
      })

      if (!availability) {
        return []
      }

      // Get existing bookings for the day
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const existingBookings = await prisma.booking.findMany({
        where: {
          businessLocationId: locationId,
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
          }
        }
      })

      // Generate available time slots
      const timeSlots = []
      const startTime = this.parseTime(availability.startTime)
      const endTime = this.parseTime(availability.endTime)

      for (let time = startTime; time < endTime; time += 30) {
        const slotTime = new Date(date)
        slotTime.setHours(Math.floor(time / 60), time % 60, 0, 0)

        const isBooked = existingBookings.some(booking => {
          const bookingTime = new Date(booking.scheduledDate)
          return Math.abs(bookingTime.getTime() - slotTime.getTime()) < 30 * 60 * 1000
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
      console.error('Error getting location availability:', error)
      throw new Error('Failed to get location availability')
    }
  }

  /**
   * Helper methods
   */
  private async getLocationBookings(locationId: string, startDate: Date, endDate: Date) {
    return await prisma.booking.findMany({
      where: {
        businessLocationId: locationId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  }

  private async getLocationRevenue(locationId: string, startDate: Date, endDate: Date) {
    return await prisma.payment.findMany({
      where: {
        booking: {
          businessLocationId: locationId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      }
    })
  }

  private groupBookingsByDay(bookings: any[]) {
    const grouped: Record<string, number> = {}
    
    bookings.forEach(booking => {
      const day = booking.createdAt.toISOString().split('T')[0]
      grouped[day] = (grouped[day] || 0) + 1
    })

    return grouped
  }

  private groupRevenueByDay(payments: any[]) {
    const grouped: Record<string, number> = {}
    
    payments.forEach(payment => {
      const day = payment.createdAt.toISOString().split('T')[0]
      grouped[day] = (grouped[day] || 0) + Number(payment.amount)
    })

    return grouped
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Get default staff permissions based on role
   */
  getDefaultPermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      manager: [
        'canManageBookings',
        'canManageServices',
        'canManageStaff',
        'canViewAnalytics',
        'canManageInventory',
        'canHandlePayments'
      ],
      stylist: [
        'canManageBookings',
        'canViewAnalytics'
      ],
      assistant: [
        'canManageBookings'
      ],
      receptionist: [
        'canManageBookings',
        'canHandlePayments'
      ]
    }

    return permissions[role] || []
  }
}

export const multiLocationManager = new MultiLocationManager()
