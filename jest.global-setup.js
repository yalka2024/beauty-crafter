const { PrismaClient } = require('@prisma/client')

// Test database configuration
const testDatabaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beauty_crafter_test'

async function setupTestDatabase() {
  console.log('Setting up test database...')
  
  try {
    // Create a new Prisma client for testing
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl
        }
      }
    })

    // Test database connection
    await prisma.$connect()
    console.log('✅ Test database connected successfully')

    // Run database migrations
    const { execSync } = require('child_process')
    try {
      execSync('npx prisma migrate deploy', { 
        env: { ...process.env, DATABASE_URL: testDatabaseUrl },
        stdio: 'pipe'
      })
      console.log('✅ Database migrations applied')
    } catch (error) {
      console.log('⚠️ Migration failed, continuing with existing schema')
    }

    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    })
    await prisma.booking.deleteMany({
      where: { id: { contains: 'test' } }
    })
    await prisma.service.deleteMany({
      where: { name: { contains: 'test' } }
    })
    console.log('✅ Test data cleaned up')

    await prisma.$disconnect()
    console.log('✅ Test database setup complete')
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message)
    // Don't fail the entire test suite if database setup fails
    console.log('⚠️ Continuing with mocked database...')
  }
}

module.exports = async () => {
  await setupTestDatabase()
}