#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Beauty Crafter Database...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Please create one from env.example');
  console.log('   Copy env.example to .env and update the DATABASE_URL\n');
  process.exit(1);
}

// Check if DATABASE_URL is set
require('dotenv').config();
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in .env file');
  console.log('   Please set DATABASE_URL in your .env file\n');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n🗄️  Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n🔄 Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('\n🌱 Seeding database...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n🔑 Test accounts created:');
  console.log('   Admin: admin@beautycrafter.com / admin123');
  console.log('   Provider: sarah@beautysalon.com / provider123');
  console.log('   Client: emma@email.com / client123');
  console.log('\n🚀 You can now run: npm run dev');
  
} catch (error) {
  console.error('\n❌ Error during database setup:', error.message);
  console.log('\n💡 Troubleshooting tips:');
  console.log('   1. Make sure PostgreSQL is running');
  console.log('   2. Check your DATABASE_URL in .env');
  console.log('   3. Ensure you have the right permissions');
  console.log('   4. Try running commands manually:\n');
  console.log('      npx prisma generate');
  console.log('      npx prisma migrate deploy');
  console.log('      npx tsx prisma/seed.ts');
  process.exit(1);
}
