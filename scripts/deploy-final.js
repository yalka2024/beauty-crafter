#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🚀 Final Production Deployment')
console.log('=' .repeat(50))

async function finalDeployment() {
  try {
    console.log('🔧 Step 1: Prepare for deployment...')
    
    // Use production-ready config
    if (fs.existsSync('next.config.production-ready.js')) {
      if (fs.existsSync('next.config.js')) {
        fs.renameSync('next.config.js', 'next.config.backup.js')
      }
      fs.copyFileSync('next.config.production-ready.js', 'next.config.js')
      console.log('✅ Production configuration active')
    }
    
    console.log('🔧 Step 2: Verify Vercel CLI...')
    try {
      const version = execSync('vercel --version', { encoding: 'utf8' })
      console.log(`✅ Vercel CLI: ${version.trim()}`)
    } catch (error) {
      console.error('❌ Vercel CLI not found. Install: npm install -g vercel')
      process.exit(1)
    }
    
    console.log('🔧 Step 3: Check environment variables...')
    console.log('⚠️  Make sure these are set in Vercel Dashboard:')
    console.log('   - NEXTAUTH_SECRET')
    console.log('   - NEXTAUTH_URL')
    console.log('   - NEXT_PUBLIC_APP_URL')
    console.log('   - DATABASE_URL (if using database features)')
    
    console.log('🔧 Step 4: Deploy to production...')
    try {
      execSync('vercel --prod --force', { stdio: 'inherit' })
      console.log('✅ Deployment successful!')
      
      console.log('')
      console.log('🎉 PRODUCTION DEPLOYMENT COMPLETE!')
      console.log('🌍 Your Beauty Crafter platform is now live worldwide!')
      console.log('')
      console.log('🔗 Your live URLs:')
      console.log('   Primary: https://beauty-crafter.vercel.app')
      console.log('   Custom: https://beauty-crafter.com (if DNS configured)')
      console.log('')
      console.log('🧪 Test your live platform:')
      console.log('   1. Visit the URLs above')
      console.log('   2. Test user registration/login')
      console.log('   3. Test booking flow')
      console.log('   4. Test from different countries')
      console.log('')
      console.log('📊 Monitor performance:')
      console.log('   - Vercel Dashboard > Analytics')
      console.log('   - https://beauty-crafter.vercel.app/performance')
      console.log('')
      console.log('🎯 Next steps:')
      console.log('   1. Configure custom domain (optional)')
      console.log('   2. Set up monitoring alerts')
      console.log('   3. Run load tests on live URL')
      console.log('   4. Launch marketing!')
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message)
      
      // Restore original config
      if (fs.existsSync('next.config.backup.js')) {
        fs.renameSync('next.config.backup.js', 'next.config.js')
        console.log('✅ Original configuration restored')
      }
      
      console.log('')
      console.log('🔧 Troubleshooting:')
      console.log('1. Check environment variables in Vercel Dashboard')
      console.log('2. Verify DATABASE_URL is set (if using database)')
      console.log('3. Ensure no build errors')
      console.log('4. Try: vercel --prod --debug for more info')
      
      throw error
    }
    
  } catch (error) {
    console.error('❌ Final deployment failed:', error)
    process.exit(1)
  }
}

// Run deployment
finalDeployment()
