// Try to load .env files from multiple locations
const path = require('path')
const fs = require('fs')

// Try .env.local first, then .env
const envLocalPath = path.join(__dirname, '../.env.local')
const envPath = path.join(__dirname, '../.env')

if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath })
} else if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath })
} else {
  // Try default dotenv behavior
  require('dotenv').config()
}

const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.error('   Please ensure DATABASE_URL is set in .env or .env.local file')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
})

async function runMigration() {
  try {
    console.log('🔍 Checking customer_enquiries table...\n')
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'customer_enquiries'
    `)
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ customer_enquiries table already exists\n')
      process.exit(0)
    }
    
    console.log('❌ customer_enquiries table does not exist!')
    console.log('📝 Creating customer_enquiries table...\n')
    
    // Read and execute migration SQL
    const sqlPath = path.join(__dirname, 'migrate-customer-enquiries.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0)
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement)
      }
    }
    
    console.log('✅ customer_enquiries table created successfully!\n')
    
    // Verify table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customer_enquiries'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Table structure:')
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
