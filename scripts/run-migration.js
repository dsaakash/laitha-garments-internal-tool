const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables - try both .env and .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.error('Please make sure you have a .env or .env.local file with DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
})

async function runMigration() {
  const client = await pool.connect()
  try {
    console.log('🔄 Starting migration...')
    console.log('📝 Reading migration file...')
    
    await client.query('BEGIN')
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'add-roles-migration.sql'),
      'utf8'
    )
    
    console.log('⚙️  Executing migration SQL...')
    
    // Split SQL by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement)
      }
    }
    
    await client.query('COMMIT')
    console.log('✅ Migration completed successfully!')
    console.log('📋 Changes applied:')
    console.log('   - Added role column to admins table')
    console.log('   - Set first admin as superadmin')
    console.log('   - Created users table')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Migration failed:', error.message)
    if (error.code) {
      console.error('   Error code:', error.code)
    }
    if (error.detail) {
      console.error('   Details:', error.detail)
    }
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
