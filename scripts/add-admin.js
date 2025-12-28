const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function addAdmin() {
  try {
    const email = 'admin'
    const password = 'admin'
    const name = 'Admin'
    
    console.log('Creating admin account...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Insert admin
    const result = await pool.query(
      `INSERT INTO admins (email, password_hash, name) 
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3
       RETURNING id, email, name`,
      [email, hashedPassword, name]
    )
    
    console.log('Admin created successfully!')
    console.log('Email:', result.rows[0].email)
    console.log('Name:', result.rows[0].name)
    console.log('Password: admin')
    
    await pool.end()
  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  }
}

addAdmin()

