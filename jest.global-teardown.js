const { PrismaClient } = require('@prisma/client')

// Test database configuration
const testDatabaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beauty_crafter_test'

async function teardownTestDatabase() {
  console.log('Tearing down test database...')
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl
        }
      }
    })

    // Clean up all test data
    await prisma.booking.deleteMany({
      where: { id: { contains: 'test' } }
    })
    await prisma.service.deleteMany({
      where: { name: { contains: 'test' } }
    })
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    })
    await prisma.provider.deleteMany({
      where: { businessName: { contains: 'test' } }
    })
    await prisma.client.deleteMany({
      where: { id: { contains: 'test' } }
    })
    await prisma.payment.deleteMany({
      where: { id: { contains: 'test' } }
    })
    await prisma.review.deleteMany({
      where: { id: { contains: 'test' } }
    })

    console.log('✅ Test data cleaned up')

    await prisma.$disconnect()
    console.log('✅ Test database teardown complete')
  } catch (error) {
    console.error('❌ Test database teardown failed:', error.message)
    // Don't fail the entire test suite if teardown fails
  }
}

module.exports = async () => {
  await teardownTestDatabase()
}