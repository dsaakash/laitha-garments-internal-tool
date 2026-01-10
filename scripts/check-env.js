const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '../.env')

console.log('Checking environment configuration...\n')

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file does not exist!')
  console.log('\nCreating .env file template...')
  
  const template = `# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Cloudinary Configuration (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Node Environment
NODE_ENV=development
`
  
  fs.writeFileSync(envPath, template)
  console.log('✅ Created .env file template')
  console.log('\n⚠️  Please edit .env file and add your actual DATABASE_URL')
  process.exit(1)
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8')
const lines = envContent.split('\n')

// Check for DATABASE_URL
const hasDatabaseUrl = lines.some(line => {
  const trimmed = line.trim()
  return trimmed.startsWith('DATABASE_URL=') && trimmed.length > 13
})

if (!hasDatabaseUrl) {
  console.log('❌ DATABASE_URL is not set in .env file')
  console.log('\nPlease add the following line to your .env file:')
  console.log('DATABASE_URL=postgresql://username:password@localhost:5432/database_name')
  console.log('\nFor remote databases:')
  console.log('DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require')
  process.exit(1)
}

// Check if it's a placeholder
const databaseUrlLine = lines.find(line => line.trim().startsWith('DATABASE_URL='))
if (databaseUrlLine && (databaseUrlLine.includes('username:password') || databaseUrlLine.includes('your_'))) {
  console.log('⚠️  DATABASE_URL appears to be a placeholder')
  console.log('Please replace it with your actual database connection string')
  process.exit(1)
}

console.log('✅ DATABASE_URL is set in .env file')
console.log('\n📝 Note: Make sure to restart your Next.js server after modifying .env file')
console.log('   Run: npm run dev')
