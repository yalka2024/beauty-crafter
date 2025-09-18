#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🏗️ Production Build Script')
console.log('=' .repeat(40))

async function buildForProduction() {
  try {
    console.log('🔧 Step 1: Prepare production configuration...')
    
    // Use production-ready config
    if (fs.existsSync('next.config.js')) {
      fs.renameSync('next.config.js', 'next.config.backup.js')
    }
    
    if (fs.existsSync('next.config.production-ready.js')) {
      fs.copyFileSync('next.config.production-ready.js', 'next.config.js')
      console.log('✅ Using production-ready configuration')
    }
    
    console.log('🔧 Step 2: Install missing dependencies...')
    try {
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit' })
      console.log('✅ Dependencies installed')
    } catch (error) {
      console.log('⚠️ Some dependency issues, continuing...')
    }
    
    console.log('🔧 Step 3: Generate Prisma client...')
    try {
      execSync('npx prisma generate', { stdio: 'inherit' })
      console.log('✅ Prisma client generated')
    } catch (error) {
      console.log('⚠️ Prisma generation issues, continuing...')
    }
    
    console.log('🔧 Step 4: Build application...')
    try {
      execSync('npm run build', { stdio: 'inherit' })
      console.log('✅ Build successful!')
      
      console.log('')
      console.log('🎉 Production build completed!')
      console.log('🚀 Ready for deployment to Vercel')
      
    } catch (error) {
      console.error('❌ Build failed:', error.message)
      
      // Restore original config
      if (fs.existsSync('next.config.backup.js')) {
        fs.renameSync('next.config.backup.js', 'next.config.js')
        console.log('✅ Original configuration restored')
      }
      
      throw error
    }
    
  } catch (error) {
    console.error('❌ Production build failed:', error)
    process.exit(1)
  }
}

// Run build
buildForProduction()
