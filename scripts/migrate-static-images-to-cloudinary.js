require('dotenv').config()
const { Pool } = require('pg')
const { v2: cloudinary } = require('cloudinary')
const fs = require('fs')
const path = require('path')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
})

async function uploadToCloudinary(filePath, publicId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: 'lalitha_garments',
      resource_type: 'auto',
      overwrite: false,
    })
    return result.secure_url
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message)
    return null
  }
}

async function migrateStaticImages() {
  console.log('🚀 Migrating Static Images from public/ to Cloudinary...\n')
  
  // Check Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Error: Cloudinary environment variables not set!')
    process.exit(1)
  }
  
  try {
    // Get all inventory items with static image paths
    const result = await pool.query(`
      SELECT 
        id,
        dress_name,
        dress_code,
        image_url,
        product_images
      FROM inventory
      WHERE (image_url LIKE '/%' AND image_url NOT LIKE '/uploads/%' AND image_url NOT LIKE 'http%')
         OR (product_images::text LIKE '%"/%' AND product_images::text NOT LIKE '%"/uploads/%' AND product_images::text NOT LIKE '%"http%')
      ORDER BY id
    `)
    
    if (result.rows.length === 0) {
      console.log('✅ No static images found to migrate')
      return
    }
    
    console.log(`Found ${result.rows.length} items with static images\n`)
    console.log('='.repeat(80))
    
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const row of result.rows) {
      console.log(`\n📦 Processing: ${row.dress_name} (${row.dress_code})`)
      const updates = {}
      
      // Migrate image_url if it's a static path
      if (row.image_url && row.image_url.startsWith('/') && !row.image_url.startsWith('/uploads/') && !row.image_url.startsWith('http')) {
        const localPath = path.join(process.cwd(), 'public', row.image_url)
        if (fs.existsSync(localPath)) {
          const filename = path.basename(row.image_url, path.extname(row.image_url))
          const publicId = `lalitha_garments/inventory_${row.id}_${filename}`
          const cloudinaryUrl = await uploadToCloudinary(localPath, publicId)
          if (cloudinaryUrl) {
            updates.image_url = cloudinaryUrl
            console.log(`  ✅ Migrated image_url: ${row.image_url} → Cloudinary`)
          } else {
            console.log(`  ❌ Failed to upload: ${row.image_url}`)
            errors++
          }
        } else {
          console.log(`  ⚠️  File not found: ${localPath}`)
          skipped++
        }
      }
      
      // Migrate product_images (JSONB array)
      if (row.product_images) {
        let productImages = []
        try {
          productImages = typeof row.product_images === 'string' 
            ? JSON.parse(row.product_images) 
            : row.product_images
        } catch (e) {
          console.log(`  ⚠️  Could not parse product_images`)
          continue
        }
        
        if (Array.isArray(productImages) && productImages.length > 0) {
          const migratedImages = []
          let hasChanges = false
          
          for (let i = 0; i < productImages.length; i++) {
            const imgUrl = productImages[i]
            if (imgUrl && imgUrl.startsWith('/') && !imgUrl.startsWith('/uploads/') && !imgUrl.startsWith('http')) {
              const localPath = path.join(process.cwd(), 'public', imgUrl)
              if (fs.existsSync(localPath)) {
                const filename = path.basename(imgUrl, path.extname(imgUrl))
                const publicId = `lalitha_garments/inventory_${row.id}_product_${i}_${filename}`
                const cloudinaryUrl = await uploadToCloudinary(localPath, publicId)
                if (cloudinaryUrl) {
                  migratedImages.push(cloudinaryUrl)
                  console.log(`  ✅ Migrated product_images[${i}]: ${imgUrl} → Cloudinary`)
                  hasChanges = true
                } else {
                  migratedImages.push(imgUrl) // Keep original if upload fails
                  errors++
                }
              } else {
                migratedImages.push(imgUrl) // Keep original if file doesn't exist
                console.log(`  ⚠️  File not found: ${localPath}`)
              }
            } else {
              migratedImages.push(imgUrl) // Already Cloudinary URL or external URL
            }
          }
          
          if (hasChanges) {
            updates.product_images = JSON.stringify(migratedImages)
          }
        }
      }
      
      // Update database if there are changes
      if (Object.keys(updates).length > 0) {
        const setClause = Object.keys(updates).map((key, idx) => `${key} = $${idx + 1}`).join(', ')
        const values = Object.values(updates)
        values.push(row.id)
        
        await pool.query(
          `UPDATE inventory SET ${setClause} WHERE id = $${values.length}`,
          values
        )
        updated++
        console.log(`  ✅ Updated database record`)
      } else {
        skipped++
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Updated: ${updated} items`)
    console.log(`   ⏭️  Skipped: ${skipped} items`)
    console.log(`   ❌ Errors: ${errors} uploads`)
    console.log('\n✅ Migration completed!')
    
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('\n🌐 View images in Cloudinary Dashboard:')
      console.log(`   https://console.cloudinary.com/console/c/${process.env.CLOUDINARY_CLOUD_NAME}/media_library/folders/lalitha_garments`)
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrateStaticImages()

