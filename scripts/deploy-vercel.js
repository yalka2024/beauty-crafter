#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Beauty Crafter - Vercel Deployment Script')
console.log('=' .repeat(50))

// Pre-deployment checks
function runPreDeploymentChecks() {
  console.log('🔍 Running pre-deployment checks...')
  
  try {
    // Check if Vercel CLI is installed
    execSync('vercel --version', { stdio: 'pipe' })
    console.log('✅ Vercel CLI is installed')
  } catch (error) {
    console.log('❌ Vercel CLI not found. Installing...')
    execSync('npm install -g vercel', { stdio: 'inherit' })
  }
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found')
  }
  console.log('✅ package.json found')
  
  // Check if Next.js config exists
  if (!fs.existsSync('next.config.js') && !fs.existsSync('next.config.vercel.js')) {
    console.log('⚠️  No Next.js config found, using default')
  } else {
    console.log('✅ Next.js configuration found')
  }
  
  // Check if vercel.json exists
  if (!fs.existsSync('vercel.json')) {
    console.log('⚠️  vercel.json not found, using defaults')
  } else {
    console.log('✅ vercel.json configuration found')
  }
}

// Build optimization
function optimizeForProduction() {
  console.log('🔧 Optimizing for production...')
  
  try {
    // Use Vercel-optimized config if available
    if (fs.existsSync('next.config.vercel.js')) {
      if (fs.existsSync('next.config.js')) {
        fs.renameSync('next.config.js', 'next.config.backup.js')
      }
      fs.copyFileSync('next.config.vercel.js', 'next.config.js')
      console.log('✅ Using Vercel-optimized configuration')
    }
    
    // Run type checking
    console.log('🔍 Running type checking...')
    execSync('npm run type-check', { stdio: 'inherit' })
    console.log('✅ Type checking passed')
    
    // Run linting
    console.log('🔍 Running linting...')
    execSync('npm run lint', { stdio: 'inherit' })
    console.log('✅ Linting passed')
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message)
    throw error
  }
}

// Deploy to Vercel
function deployToVercel(environment = 'production') {
  console.log(`🚀 Deploying to Vercel (${environment})...`)
  
  try {
    let deployCommand = 'vercel'
    
    if (environment === 'production') {
      deployCommand += ' --prod'
    }
    
    // Add build command
    deployCommand += ' --build-env NODE_ENV=production'
    
    console.log(`Executing: ${deployCommand}`)
    execSync(deployCommand, { stdio: 'inherit' })
    
    console.log('✅ Deployment successful!')
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    throw error
  }
}

// Post-deployment validation
function validateDeployment() {
  console.log('🔍 Validating deployment...')
  
  try {
    // Get deployment URL
    const deploymentInfo = execSync('vercel ls --scope team', { encoding: 'utf8' })
    console.log('✅ Deployment information retrieved')
    
    // You could add more validation here like:
    // - Health check endpoint testing
    // - Performance testing
    // - Security header validation
    
  } catch (error) {
    console.log('⚠️  Could not validate deployment automatically')
    console.log('Please manually verify your deployment at: https://beauty-crafter.vercel.app')
  }
}

// Main deployment process
async function main() {
  try {
    const args = process.argv.slice(2)
    const environment = args.includes('--preview') ? 'preview' : 'production'
    
    console.log(`\n🎯 Target environment: ${environment}`)
    
    // Step 1: Pre-deployment checks
    runPreDeploymentChecks()
    
    // Step 2: Optimize for production
    optimizeForProduction()
    
    // Step 3: Deploy to Vercel
    deployToVercel(environment)
    
    // Step 4: Validate deployment
    validateDeployment()
    
    console.log('\n🎉 Deployment completed successfully!')
    console.log('🌍 Your app is now live worldwide on Vercel\'s global CDN')
    console.log('📊 View deployment: https://vercel.com/dashboard')
    console.log('🔗 Live URL: https://beauty-crafter.vercel.app')
    
    // Performance recommendations
    console.log('\n💡 Post-deployment recommendations:')
    console.log('1. Run load tests against the live URL')
    console.log('2. Monitor performance with Vercel Analytics')
    console.log('3. Set up monitoring alerts')
    console.log('4. Configure custom domain if needed')
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message)
    
    // Restore original config if needed
    if (fs.existsSync('next.config.backup.js')) {
      fs.renameSync('next.config.backup.js', 'next.config.js')
      console.log('✅ Original configuration restored')
    }
    
    process.exit(1)
  }
}

// Handle script execution
if (require.main === module) {
  main()
}

module.exports = {
  runPreDeploymentChecks,
  optimizeForProduction,
  deployToVercel,
  validateDeployment
}
