require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
})

async function migrate() {
  const client = await pool.connect()
  
  try {
    console.log('Starting GST rupees migration...')
    
    // Read migration SQL file
    const sqlPath = path.join(__dirname, 'migrate-gst-rupees.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute migration
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    
    console.log('✅ GST rupees migration completed successfully!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()

