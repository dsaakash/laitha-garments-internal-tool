const { Pool } = require('pg')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
})

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table...\n')
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `)
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Users table does not exist!')
      console.log('📝 Creating users table...\n')
      
      // Create users table
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Create index
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `)
      
      console.log('✅ Users table created successfully!\n')
    } else {
      console.log('✅ Users table exists\n')
    }
    
    // Check table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Users table structure:')
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check if there are any users
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users')
    console.log(`\n📊 Total users: ${userCount.rows[0].count}`)
    
    await pool.end()
    console.log('\n✅ Check complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code) {
      console.error('   Error code:', error.code)
    }
    if (error.detail) {
      console.error('   Details:', error.detail)
    }
    await pool.end()
    process.exit(1)
  }
}

checkUsersTable()
