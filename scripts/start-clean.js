#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Beauty Crafter - Clean Startup')
console.log('=' .repeat(40))

// Step 1: Kill any existing Node processes
function killExistingProcesses() {
  console.log('🧹 Cleaning up existing processes...')
  
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM node.exe', { stdio: 'ignore' })
    } else {
      execSync('pkill -f node', { stdio: 'ignore' })
    }
    console.log('✅ Existing processes cleaned')
  } catch (error) {
    console.log('ℹ️  No existing processes to clean')
  }
}

// Step 2: Use simplified configuration
function useSimpleConfig() {
  console.log('🔧 Setting up simplified configuration...')
  
  const originalConfig = 'next.config.js'
  const simpleConfig = 'next.config.simple.js'
  
  if (fs.existsSync(originalConfig)) {
    fs.renameSync(originalConfig, 'next.config.backup.js')
    console.log('✅ Backed up original config')
  }
  
  if (fs.existsSync(simpleConfig)) {
    fs.copyFileSync(simpleConfig, originalConfig)
    console.log('✅ Using simplified configuration')
  }
}

// Step 3: Start the server
function startServer() {
  console.log('🚀 Starting development server...')
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  })
  
  serverProcess.on('error', (error) => {
    console.error('❌ Server startup failed:', error)
    process.exit(1)
  })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...')
    serverProcess.kill('SIGTERM')
    
    // Restore original config
    if (fs.existsSync('next.config.backup.js')) {
      fs.renameSync('next.config.backup.js', 'next.config.js')
      console.log('✅ Original configuration restored')
    }
    
    process.exit(0)
  })
  
  // Show startup message
  setTimeout(() => {
    console.log('\n🌟 Server should be starting...')
    console.log('📱 Check these URLs in your browser:')
    console.log('   🏠 Home: http://localhost:3000')
    console.log('   🔧 Health: http://localhost:3000/api/health')
    console.log('   📊 Status: http://localhost:3000/api/status')
    console.log('\n💡 Press Ctrl+C to stop the server')
  }, 3000)
}

// Step 4: Verify dependencies
function verifyDependencies() {
  console.log('📦 Verifying dependencies...')
  
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found')
    process.exit(1)
  }
  
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...')
    execSync('npm install', { stdio: 'inherit' })
  }
  
  console.log('✅ Dependencies verified')
}

// Main execution
async function main() {
  try {
    killExistingProcesses()
    verifyDependencies()
    useSimpleConfig()
    startServer()
  } catch (error) {
    console.error('❌ Startup failed:', error)
    process.exit(1)
  }
}

// Run if script is executed directly
if (require.main === module) {
  main()
}

module.exports = { main }
