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

async function fixRoles() {
  const client = await pool.connect()
  try {
    console.log('🔧 Fixing admin roles...\n')
    
    await client.query('BEGIN')
    
    // Temporarily drop the constraint
    console.log('📝 Temporarily dropping constraint...')
    await client.query(`
      ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check
    `)
    
    // Fix super_admin to superadmin
    const result1 = await client.query(`
      UPDATE admins 
      SET role = 'superadmin' 
      WHERE role = 'super_admin'
    `)
    console.log(`✅ Fixed ${result1.rowCount} admin(s) with 'super_admin' → 'superadmin'`)
    
    // Set first admin as superadmin if no superadmin exists
    const superadminCheck = await client.query(`
      SELECT COUNT(*) as count FROM admins WHERE role = 'superadmin'
    `)
    
    if (parseInt(superadminCheck.rows[0].count) === 0) {
      const result2 = await client.query(`
        UPDATE admins 
        SET role = 'superadmin' 
        WHERE id = (SELECT MIN(id) FROM admins)
      `)
      console.log(`✅ Set first admin as superadmin`)
    }
    
    // Set any NULL roles to 'admin'
    const result3 = await client.query(`
      UPDATE admins 
      SET role = 'admin' 
      WHERE role IS NULL
    `)
    console.log(`✅ Fixed ${result3.rowCount} admin(s) with NULL role → 'admin'`)
    
    // Re-add the constraint
    console.log('📝 Re-adding constraint...')
    await client.query(`
      ALTER TABLE admins 
      ADD CONSTRAINT admins_role_check 
      CHECK (role IN ('superadmin', 'admin', 'user'))
    `)
    
    await client.query('COMMIT')
    
    // Show final state
    const admins = await client.query(`
      SELECT id, email, name, role 
      FROM admins 
      ORDER BY id
    `)
    
    console.log('\n📋 Final admin roles:')
    admins.rows.forEach(admin => {
      console.log(`   ${admin.email}: ${admin.role}`)
    })
    
    client.release()
    await pool.end()
    console.log('\n✅ All roles fixed!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error:', error.message)
    client.release()
    await pool.end()
    process.exit(1)
  }
}

fixRoles()
