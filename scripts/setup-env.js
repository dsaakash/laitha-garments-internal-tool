const fs = require('fs')
const path = require('path')
const readline = require('readline')

const envPath = path.join(__dirname, '../.env')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupEnv() {
  console.log('🔧 Environment Setup for Laitha Garments\n')
  
  let envContent = ''
  
  // Check if .env exists and read it
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
    console.log('📝 Found existing .env file\n')
  }
  
  // Get DATABASE_URL
  console.log('Please provide your database connection details:')
  console.log('(You can get this from your database provider: Neon, Supabase, Railway, etc.)\n')
  
  const databaseUrl = await question('Enter DATABASE_URL (or press Enter to skip): ')
  
  if (!databaseUrl.trim()) {
    console.log('\n⚠️  Skipping DATABASE_URL setup')
    console.log('You can add it manually to your .env file later')
  } else {
    // Update or add DATABASE_URL
    const lines = envContent.split('\n')
    let found = false
    const updatedLines = lines.map(line => {
      if (line.trim().startsWith('DATABASE_URL=')) {
        found = true
        return `DATABASE_URL=${databaseUrl.trim()}`
      }
      return line
    })
    
    if (!found) {
      updatedLines.push(`DATABASE_URL=${databaseUrl.trim()}`)
    }
    
    envContent = updatedLines.join('\n')
    
    // Ensure it ends with newline
    if (!envContent.endsWith('\n')) {
      envContent += '\n'
    }
  }
  
  // Write to .env file
  fs.writeFileSync(envPath, envContent)
  console.log('\n✅ .env file updated successfully!')
  console.log('\n📝 Next steps:')
  console.log('   1. Restart your Next.js development server (stop and run "npm run dev" again)')
  console.log('   2. Try signing in again')
  console.log('\n💡 You can verify your setup by running: npm run check-env')
  
  rl.close()
}

setupEnv().catch(err => {
  console.error('Error:', err)
  rl.close()
  process.exit(1)
})
