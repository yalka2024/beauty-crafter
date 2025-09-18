#!/usr/bin/env node

console.log('🔑 Production Environment Configuration')
console.log('=' .repeat(50))

const requiredEnvVars = [
  {
    name: 'DATABASE_URL',
    description: 'Production database connection string',
    example: 'postgresql://username:password@host:port/database',
    required: true,
    category: 'Database'
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'Secure authentication secret',
    example: '33e797d0d7ff4a1f4fa160480f2e2907ba879a7c3e6301d6e0e2406ff7a6258a',
    required: true,
    category: 'Authentication'
  },
  {
    name: 'NEXTAUTH_URL',
    description: 'Production URL for authentication',
    example: 'https://beauty-crafter.vercel.app',
    required: true,
    category: 'Authentication'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    description: 'Public application URL',
    example: 'https://beauty-crafter.vercel.app',
    required: true,
    category: 'Application'
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    description: 'Stripe publishable key for payments',
    example: 'pk_live_...',
    required: false,
    category: 'Payments'
  },
  {
    name: 'STRIPE_SECRET_KEY',
    description: 'Stripe secret key for payments',
    example: 'sk_live_...',
    required: false,
    category: 'Payments'
  },
  {
    name: 'SENDGRID_API_KEY',
    description: 'SendGrid API key for emails',
    example: 'SG.xxx',
    required: false,
    category: 'Communications'
  },
  {
    name: 'TWILIO_ACCOUNT_SID',
    description: 'Twilio Account SID for SMS',
    example: 'ACxxx',
    required: false,
    category: 'Communications'
  }
]

function checkEnvironmentVariables() {
  console.log('🔍 Checking current environment variables...')
  console.log('')
  
  const missing = []
  const configured = []
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar.name]) {
      configured.push(envVar)
      console.log(`✅ ${envVar.name}: Configured`)
    } else {
      missing.push(envVar)
      console.log(`❌ ${envVar.name}: Missing${envVar.required ? ' (REQUIRED)' : ' (Optional)'}`)
    }
  })
  
  console.log('')
  console.log('📊 Summary:')
  console.log(`✅ Configured: ${configured.length}`)
  console.log(`❌ Missing: ${missing.length}`)
  
  const requiredMissing = missing.filter(env => env.required)
  if (requiredMissing.length > 0) {
    console.log('')
    console.log('🚨 CRITICAL: Missing required environment variables:')
    requiredMissing.forEach(env => {
      console.log(`   - ${env.name}: ${env.description}`)
      console.log(`     Example: ${env.example}`)
    })
    
    console.log('')
    console.log('🎯 To fix:')
    console.log('1. Go to Vercel Dashboard > Project > Settings > Environment Variables')
    console.log('2. Add each missing required variable')
    console.log('3. Redeploy your application')
    
    return false
  }
  
  console.log('')
  console.log('✅ All required environment variables are configured!')
  return true
}

function generateEnvTemplate() {
  console.log('')
  console.log('📋 Environment Variables Template for Vercel:')
  console.log('=' .repeat(50))
  
  const categories = [...new Set(requiredEnvVars.map(env => env.category))]
  
  categories.forEach(category => {
    console.log(`\n# ${category}`)
    requiredEnvVars
      .filter(env => env.category === category)
      .forEach(env => {
        console.log(`${env.name}=${env.example}`)
        console.log(`# ${env.description}${env.required ? ' (REQUIRED)' : ' (Optional)'}`)
      })
  })
  
  console.log('')
  console.log('💡 Copy these to Vercel Dashboard > Environment Variables')
}

// Main execution
function main() {
  const isConfigured = checkEnvironmentVariables()
  
  if (!isConfigured) {
    generateEnvTemplate()
    process.exit(1)
  }
  
  console.log('🚀 Environment configuration is ready for production!')
}

main()
