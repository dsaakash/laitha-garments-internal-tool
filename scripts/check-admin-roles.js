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

async function checkRoles() {
  try {
    console.log('🔍 Checking admin roles in database...\n')
    
    // Check if role column exists
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admins' AND column_name = 'role'
    `)
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ Role column does not exist in admins table!')
      console.log('   Please run: npm run migrate-roles')
      process.exit(1)
    }
    
    console.log('✅ Role column exists in admins table')
    
    // Get all admins with their roles
    const admins = await pool.query(`
      SELECT id, email, name, role, created_at 
      FROM admins 
      ORDER BY id
    `)
    
    console.log(`\n📋 Found ${admins.rows.length} admin(s):\n`)
    
    admins.rows.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`)
      console.log(`   ID: ${admin.id}`)
      console.log(`   Name: ${admin.name || 'N/A'}`)
      console.log(`   Role: ${admin.role || 'NULL (needs to be set!)'}`)
      console.log(`   Created: ${new Date(admin.created_at).toLocaleDateString()}`)
      console.log('')
    })
    
    // Check for admins without roles
    const adminsWithoutRole = admins.rows.filter(a => !a.role)
    if (adminsWithoutRole.length > 0) {
      console.log('⚠️  Warning: Some admins don\'t have a role set!')
      console.log('   These admins need to be updated manually or re-created.\n')
    }
    
    // Check if there's at least one superadmin
    const superadmins = admins.rows.filter(a => a.role === 'superadmin')
    if (superadmins.length === 0) {
      console.log('⚠️  Warning: No superadmin found!')
      console.log('   Setting first admin as superadmin...\n')
      
      if (admins.rows.length > 0) {
        await pool.query(`
          UPDATE admins 
          SET role = 'superadmin' 
          WHERE id = (SELECT MIN(id) FROM admins)
        `)
        console.log('✅ First admin set as superadmin')
      }
    } else {
      console.log(`✅ Found ${superadmins.length} superadmin(s)`)
    }
    
    await pool.end()
    console.log('\n✅ Check complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkRoles()
