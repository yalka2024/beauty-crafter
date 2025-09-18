#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

console.log('🗄️ Setting up Production Database')
console.log('=' .repeat(40))

async function setupProductionDatabase() {
  try {
    console.log('📋 Database Setup Options:')
    console.log('')
    console.log('1. 🌟 Vercel Postgres (Recommended)')
    console.log('   - Go to Vercel Dashboard > Storage > Create Database')
    console.log('   - Select PostgreSQL')
    console.log('   - Copy connection string to DATABASE_URL')
    console.log('')
    console.log('2. 🆓 Supabase (Free Option)')
    console.log('   - Go to supabase.com > New Project')
    console.log('   - Get connection string from Settings > Database')
    console.log('   - Use: postgresql://postgres.[ref]:[password]@[host]:5432/postgres')
    console.log('')
    console.log('3. 🌍 PlanetScale (Global MySQL)')
    console.log('   - Go to planetscale.com > New Database')
    console.log('   - Get connection string from Connect tab')
    console.log('   - Use: mysql://[username]:[password]@[host]/[database]?sslaccept=strict')
    console.log('')
    
    // Check if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL is configured')
      console.log('🔍 Testing database connection...')
      
      try {
        const prisma = new PrismaClient()
        await prisma.$connect()
        console.log('✅ Database connection successful')
        
        // Run migrations
        console.log('🔄 Running database migrations...')
        execSync('npx prisma migrate deploy', { stdio: 'inherit' })
        console.log('✅ Migrations completed')
        
        // Generate Prisma client
        console.log('🔄 Generating Prisma client...')
        execSync('npx prisma generate', { stdio: 'inherit' })
        console.log('✅ Prisma client generated')
        
        await prisma.$disconnect()
        console.log('✅ Database setup complete!')
        
      } catch (error) {
        console.error('❌ Database connection failed:', error.message)
        console.log('')
        console.log('💡 Fix options:')
        console.log('1. Check DATABASE_URL format')
        console.log('2. Verify database credentials')
        console.log('3. Ensure database server is running')
        console.log('4. Check network connectivity')
      }
    } else {
      console.log('⚠️  DATABASE_URL not configured')
      console.log('')
      console.log('🎯 Next steps:')
      console.log('1. Choose a database option above')
      console.log('2. Set DATABASE_URL in Vercel environment variables')
      console.log('3. Run this script again to test connection')
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
  }
}

// Run setup
setupProductionDatabase()
