import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  await prisma.$transaction([
    prisma.booking.deleteMany(),
    prisma.review.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.message.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.service.deleteMany(),
    prisma.provider.deleteMany(),
    prisma.client.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.address.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ])

  console.log('🧹 Cleared existing data')

  // Create sample users
  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@beautycrafter.com',
        name: 'Admin User',
        password: createHash('sha256').update('admin123').digest('hex'),
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        admin: {
          create: {
            permissions: ['ALL'],
            department: 'Management',
            employeeId: 'ADM001'
          }
        }
      }
    }),

    // Provider users
    prisma.user.create({
      data: {
        email: 'sarah@beautysalon.com',
        name: 'Sarah Johnson',
        password: createHash('sha256').update('provider123').digest('hex'),
        role: 'PROVIDER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        phone: '+1-555-0101',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        provider: {
          create: {
            businessName: 'Sarah\'s Beauty Studio',
            providerType: 'HAIR_STYLIST',
            specialties: ['Hair Coloring', 'Haircuts', 'Styling'],
            experience: 8,
            hourlyRate: 75.00,
            serviceLocation: 'SALON',
            isVerified: true,
            isAvailable: true,
            rating: 4.8,
            totalReviews: 127,
            licenseNumber: 'CA-12345',
            licenseExpiry: new Date('2025-12-31'),
            insuranceProvider: 'BeautyPro Insurance',
            insuranceExpiry: new Date('2025-06-30'),
            backgroundCheckStatus: 'CLEAR',
            backgroundCheckExpiry: new Date('2026-01-15'),
            continuingEducationHours: 45,
            continuingEducationExpiry: new Date('2025-12-31'),
            safetyCertifications: ['CPR', 'First Aid', 'Sanitation'],
            safetyCertificationExpiry: new Date('2025-08-20'),
            complianceStatus: 'COMPLIANT',
            lastComplianceCheck: new Date('2024-12-01'),
            nextComplianceCheck: new Date('2025-06-01'),
            businessHours: {
              monday: { open: '09:00', close: '18:00' },
              tuesday: { open: '09:00', close: '18:00' },
              wednesday: { open: '09:00', close: '18:00' },
              thursday: { open: '09:00', close: '18:00' },
              friday: { open: '09:00', close: '18:00' },
              saturday: { open: '10:00', close: '16:00' },
              sunday: { open: '10:00', close: '16:00' }
            },
            serviceArea: {
              radius: 25,
              zipCodes: ['90210', '90211', '90212', '90213', '90214']
            }
          }
        },
        address: {
          create: {
            street: '123 Beauty Lane',
            city: 'Beverly Hills',
            state: 'CA',
            zipCode: '90210',
            country: 'US',
            latitude: 34.0736,
            longitude: -118.4004,
            isDefault: true
          }
        }
      }
    }),

    prisma.user.create({
      data: {
        email: 'mike@nailart.com',
        name: 'Mike Chen',
        password: createHash('sha256').update('provider123').digest('hex'),
        role: 'PROVIDER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        phone: '+1-555-0102',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        provider: {
          create: {
            businessName: 'Mike\'s Nail Art Studio',
            providerType: 'NAIL_TECHNICIAN',
            specialties: ['Gel Nails', 'Acrylic Nails', 'Nail Art', 'Manicures', 'Pedicures'],
            experience: 12,
            hourlyRate: 65.00,
            serviceLocation: 'BOTH',
            isVerified: true,
            isAvailable: true,
            rating: 4.9,
            totalReviews: 203,
            licenseNumber: 'CA-67890',
            licenseExpiry: new Date('2026-03-15'),
            insuranceProvider: 'NailTech Insurance',
            insuranceExpiry: new Date('2025-09-30'),
            backgroundCheckStatus: 'CLEAR',
            backgroundCheckExpiry: new Date('2026-02-20'),
            continuingEducationHours: 52,
            continuingEducationExpiry: new Date('2025-12-31'),
            safetyCertifications: ['CPR', 'First Aid', 'Sanitation', 'Bloodborne Pathogens'],
            safetyCertificationExpiry: new Date('2025-10-15'),
            complianceStatus: 'COMPLIANT',
            lastComplianceCheck: new Date('2024-11-15'),
            nextComplianceCheck: new Date('2025-05-15'),
            businessHours: {
              monday: { open: '10:00', close: '19:00' },
              tuesday: { open: '10:00', close: '19:00' },
              wednesday: { open: '10:00', close: '19:00' },
              thursday: { open: '10:00', close: '19:00' },
              friday: { open: '10:00', close: '19:00' },
              saturday: { open: '09:00', close: '17:00' },
              sunday: { open: '11:00', close: '16:00' }
            },
            serviceArea: {
              radius: 30,
              zipCodes: ['90210', '90211', '90212', '90213', '90214', '90215']
            }
          }
        },
        address: {
          create: {
            street: '456 Nail Street',
            city: 'Beverly Hills',
            state: 'CA',
            zipCode: '90211',
            country: 'US',
            latitude: 34.0669,
            longitude: -118.3834,
            isDefault: true
          }
        }
      }
    }),

    // Client users
    prisma.user.create({
      data: {
        email: 'emma@email.com',
        name: 'Emma Wilson',
        password: createHash('sha256').update('client123').digest('hex'),
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: new Date(),
        phone: '+1-555-0201',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'Female',
        client: {
          create: {
            preferences: {
              preferredProviders: [],
              preferredServices: ['Hair Styling', 'Manicures'],
              preferredTimes: ['morning', 'afternoon'],
              preferredDays: ['weekdays'],
              budget: { min: 50, max: 200 },
              accessibility: ['wheelchair_accessible'],
              languages: ['English', 'Spanish']
            },
            emergencyContact: '+1-555-9999',
            medicalConditions: [],
            allergies: ['Latex', 'Certain fragrances']
          }
        },
        address: {
          create: {
            street: '789 Client Avenue',
            city: 'Beverly Hills',
            state: 'CA',
            zipCode: '90212',
            country: 'US',
            latitude: 34.0750,
            longitude: -118.3950,
            isDefault: true
          }
        }
      }
    }),

    prisma.user.create({
      data: {
        email: 'james@email.com',
        name: 'James Brown',
        password: createHash('sha256').update('client123').digest('hex'),
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: new Date(),
        phone: '+1-555-0202',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        dateOfBirth: new Date('1985-08-22'),
        gender: 'Male',
        client: {
          create: {
            preferences: {
              preferredProviders: [],
              preferredServices: ['Haircuts', 'Beard Trimming', 'Massage'],
              preferredTimes: ['evening'],
              preferredDays: ['weekends'],
              budget: { min: 30, max: 150 },
              accessibility: [],
              languages: ['English']
            },
            emergencyContact: '+1-555-8888',
            medicalConditions: [],
            allergies: []
          }
        },
        address: {
          create: {
            street: '321 Client Street',
            city: 'Beverly Hills',
            state: 'CA',
            zipCode: '90213',
            country: 'US',
            latitude: 34.0700,
            longitude: -118.3900,
            isDefault: true
          }
        }
      }
    })
  ])

  console.log('👥 Created users')

  const [adminUser, sarahProvider, mikeProvider, emmaClient, jamesClient] = users

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        providerId: sarahProvider.provider!.id,
        name: 'Haircut & Styling',
        description: 'Professional haircut with styling consultation',
        category: 'Hair',
        subcategory: 'Haircuts',
        duration: 60,
        price: 75.00,
        isActive: true,
        requiresConsultation: false,
        maxAdvanceBooking: 30,
        cancellationPolicy: '24 hours notice required',
        preparationNotes: 'Come with clean, dry hair',
        aftercareInstructions: 'Avoid washing for 24 hours',
        images: [
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
          'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400'
        ],
        tags: ['Haircut', 'Styling', 'Consultation'],
        availability: {
          monday: { slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
          tuesday: { slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
          wednesday: { slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
          thursday: { slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
          friday: { slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
          saturday: { slots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'] }
        }
      }
    }),

    prisma.service.create({
      data: {
        providerId: sarahProvider.provider!.id,
        name: 'Hair Coloring',
        description: 'Professional hair coloring with premium products',
        category: 'Hair',
        subcategory: 'Coloring',
        duration: 120,
        price: 150.00,
        isActive: true,
        requiresConsultation: true,
        maxAdvanceBooking: 30,
        cancellationPolicy: '48 hours notice required',
        preparationNotes: 'Come with unwashed hair',
        aftercareInstructions: 'Use color-safe shampoo and conditioner',
        images: [
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
          'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400'
        ],
        tags: ['Hair Color', 'Professional', 'Consultation'],
        availability: {
          monday: { slots: ['09:00', '14:00'] },
          tuesday: { slots: ['09:00', '14:00'] },
          wednesday: { slots: ['09:00', '14:00'] },
          thursday: { slots: ['09:00', '14:00'] },
          friday: { slots: ['09:00', '14:00'] }
        }
      }
    }),

    prisma.service.create({
      data: {
        providerId: mikeProvider.provider!.id,
        name: 'Gel Manicure',
        description: 'Long-lasting gel manicure with nail art options',
        category: 'Nails',
        subcategory: 'Manicures',
        duration: 45,
        price: 45.00,
        isActive: true,
        requiresConsultation: false,
        maxAdvanceBooking: 30,
        cancellationPolicy: '2 hours notice required',
        preparationNotes: 'Remove any existing polish',
        aftercareInstructions: 'Avoid harsh chemicals and wear gloves for cleaning',
        images: [
          'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
          'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'
        ],
        tags: ['Gel', 'Manicure', 'Nail Art'],
        availability: {
          monday: { slots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
          tuesday: { slots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
          wednesday: { slots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
          thursday: { slots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
          friday: { slots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
          saturday: { slots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'] },
          sunday: { slots: ['11:00', '12:00', '13:00', '14:00', '15:00'] }
        }
      }
    }),

    prisma.service.create({
      data: {
        providerId: mikeProvider.provider!.id,
        name: 'Acrylic Nails',
        description: 'Full set of acrylic nails with custom design',
        category: 'Nails',
        subcategory: 'Acrylics',
        duration: 90,
        price: 85.00,
        isActive: true,
        requiresConsultation: true,
        maxAdvanceBooking: 30,
        cancellationPolicy: '4 hours notice required',
        preparationNotes: 'Come with clean, natural nails',
        aftercareInstructions: 'Avoid excessive water exposure and use cuticle oil',
        images: [
          'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
          'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'
        ],
        tags: ['Acrylic', 'Full Set', 'Custom Design'],
        availability: {
          monday: { slots: ['10:00', '14:00'] },
          tuesday: { slots: ['10:00', '14:00'] },
          wednesday: { slots: ['10:00', '14:00'] },
          thursday: { slots: ['10:00', '14:00'] },
          friday: { slots: ['10:00', '14:00'] },
          saturday: { slots: ['09:00', '13:00'] }
        }
      }
    })
  ])

  console.log('💇‍♀️ Created services')

  // Create sample bookings
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        clientId: emmaClient.client!.id,
        providerId: sarahProvider.provider!.id,
        serviceId: services[0].id, // Haircut & Styling
        scheduledAt: new Date('2024-12-20T10:00:00Z'),
        duration: 60,
        status: 'CONFIRMED',
        totalAmount: 75.00,
        notes: 'First time client, prefers natural look',
        specialRequests: 'Please use organic products if possible',
        cancellationReason: null,
        cancellationPolicy: '24 hours notice required',
        reminderSent: false,
        followUpSent: false
      }
    }),

    prisma.booking.create({
      data: {
        clientId: jamesClient.client!.id,
        providerId: mikeProvider.provider!.id,
        serviceId: services[2].id, // Gel Manicure
        scheduledAt: new Date('2024-12-21T14:00:00Z'),
        duration: 45,
        status: 'CONFIRMED',
        totalAmount: 45.00,
        notes: 'Regular client, prefers dark colors',
        specialRequests: 'Simple nail art design',
        cancellationReason: null,
        cancellationPolicy: '2 hours notice required',
        reminderSent: false,
        followUpSent: false
      }
    })
  ])

  console.log('📅 Created bookings')

  // Create sample reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        clientId: emmaClient.client!.id,
        providerId: sarahProvider.provider!.id,
        serviceId: services[0].id,
        rating: 5,
        comment: 'Sarah is amazing! She really listened to what I wanted and delivered exactly that. The haircut is perfect and she was so professional.',
        isAnonymous: false,
        isVerified: true,
        helpfulCount: 3,
        reportCount: 0,
        status: 'ACTIVE'
      }
    }),

    prisma.review.create({
      data: {
        clientId: jamesClient.client!.id,
        providerId: mikeProvider.provider!.id,
        serviceId: services[2].id,
        rating: 5,
        comment: 'Mike does incredible nail work! The gel manicure lasted for weeks and the design was exactly what I wanted.',
        isAnonymous: false,
        isVerified: true,
        helpfulCount: 2,
        reportCount: 0,
        status: 'ACTIVE'
      }
    })
  ])

  console.log('⭐ Created reviews')

  // Create sample payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        clientId: emmaClient.client!.id,
        providerId: sarahProvider.provider!.id,
        bookingId: bookings[0].id,
        amount: 75.00,
        currency: 'USD',
        status: 'COMPLETED',
        paymentMethod: 'CREDIT_CARD',
        transactionId: 'txn_123456789',
        stripePaymentIntentId: 'pi_123456789',
        platformFee: 11.25,
        providerAmount: 63.75,
        refundedAmount: 0,
        refundReason: null,
        metadata: {
          service: 'Haircut & Styling',
          provider: 'Sarah Johnson'
        }
      }
    }),

    prisma.payment.create({
      data: {
        clientId: jamesClient.client!.id,
        providerId: mikeProvider.provider!.id,
        bookingId: bookings[1].id,
        amount: 45.00,
        currency: 'USD',
        status: 'COMPLETED',
        paymentMethod: 'CREDIT_CARD',
        transactionId: 'txn_987654321',
        stripePaymentIntentId: 'pi_987654321',
        platformFee: 6.75,
        providerAmount: 38.25,
        refundedAmount: 0,
        refundReason: null,
        metadata: {
          service: 'Gel Manicure',
          provider: 'Mike Chen'
        }
      }
    })
  ])

  console.log('💳 Created payments')

  // Create sample notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: emmaClient.id,
        type: 'BOOKING_CONFIRMATION',
        title: 'Booking Confirmed',
        message: 'Your appointment with Sarah Johnson for Haircut & Styling on Dec 20 at 10:00 AM has been confirmed.',
        isRead: false,
        priority: 'NORMAL',
        metadata: {
          bookingId: bookings[0].id,
          providerName: 'Sarah Johnson',
          serviceName: 'Haircut & Styling',
          appointmentTime: '2024-12-20T10:00:00Z'
        }
      }
    }),

    prisma.notification.create({
      data: {
        userId: jamesClient.id,
        type: 'BOOKING_REMINDER',
        title: 'Appointment Reminder',
        message: 'Reminder: You have an appointment with Mike Chen for Gel Manicure tomorrow at 2:00 PM.',
        isRead: false,
        priority: 'HIGH',
        metadata: {
          bookingId: bookings[1].id,
          providerName: 'Mike Chen',
          serviceName: 'Gel Manicure',
          appointmentTime: '2024-12-21T14:00:00Z'
        }
      }
    })
  ])

  console.log('🔔 Created notifications')

  // Create sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        senderId: emmaClient.id,
        receiverId: sarahProvider.id,
        content: 'Hi Sarah! I\'m really looking forward to my appointment tomorrow. I was wondering if you could recommend any products for my hair type?',
        messageType: 'TEXT',
        isRead: false,
        metadata: {
          bookingId: bookings[0].id,
          serviceName: 'Haircut & Styling'
        }
      }
    }),

    prisma.message.create({
      data: {
        senderId: sarahProvider.id,
        receiverId: emmaClient.id,
        content: 'Hi Emma! I\'m excited to work with you tomorrow. Based on your hair type, I\'d recommend our organic line. I\'ll bring some samples to show you during your appointment.',
        messageType: 'TEXT',
        isRead: false,
        metadata: {
          bookingId: bookings[0].id,
          serviceName: 'Haircut & Styling'
        }
      }
    })
  ])

  console.log('💬 Created messages')

  // Create sample favorites
  const favorites = await Promise.all([
    prisma.favorite.create({
      data: {
        clientId: emmaClient.client!.id,
        providerId: sarahProvider.provider!.id,
        createdAt: new Date()
      }
    }),

    prisma.favorite.create({
      data: {
        clientId: jamesClient.client!.id,
        providerId: mikeProvider.provider!.id,
        createdAt: new Date()
      }
    })
  ])

  console.log('❤️ Created favorites')

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Sample data created:')
  console.log(`   👥 Users: ${users.length}`)
  console.log(`   💇‍♀️ Services: ${services.length}`)
  console.log(`   📅 Bookings: ${bookings.length}`)
  console.log(`   ⭐ Reviews: ${reviews.length}`)
  console.log(`   💳 Payments: ${payments.length}`)
  console.log(`   🔔 Notifications: ${notifications.length}`)
  console.log(`   💬 Messages: ${messages.length}`)
  console.log(`   ❤️ Favorites: ${favorites.length}`)
  console.log('\n🔑 Test accounts:')
  console.log('   Admin: admin@beautycrafter.com / admin123')
  console.log('   Provider: sarah@beautysalon.com / provider123')
  console.log('   Client: emma@email.com / client123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
