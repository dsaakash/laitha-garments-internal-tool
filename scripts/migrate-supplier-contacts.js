require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrate-supplier-contacts.sql'), 'utf8')
    await pool.query(sql)
    console.log('✅ Supplier contacts migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()

