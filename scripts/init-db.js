const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function initDatabase() {
  try {
    console.log('Connecting to database...')
    
    // Read SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8')
    
    // Execute SQL
    await pool.query(sql)
    console.log('Database schema created successfully')
    
    // Hash default admin password
    const defaultPassword = 'Aakash@9353'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)
    
    // Insert default admin
    await pool.query(
      `INSERT INTO admins (email, password_hash, name) 
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      ['savantaakash322@gmail.com', hashedPassword, 'Aakash']
    )
    
    console.log('Default admin created successfully')
    console.log('Email: savantaakash322@gmail.com')
    console.log('Password: Aakash@9353')
    
    await pool.end()
    console.log('Database initialization complete!')
  } catch (error) {
    console.error('Database initialization error:', error)
    process.exit(1)
  }
}

initDatabase()

