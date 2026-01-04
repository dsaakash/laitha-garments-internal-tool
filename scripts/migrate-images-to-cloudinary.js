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

async function migrateInventoryImages() {
  console.log('\n📦 Migrating Inventory Images...')
  
  try {
    const result = await pool.query('SELECT id, image_url, product_images FROM inventory')
    let updated = 0
    let skipped = 0
    
    for (const row of result.rows) {
      const updates = {}
      
      // Migrate image_url if it's a local path
      if (row.image_url && row.image_url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'public', row.image_url)
        if (fs.existsSync(localPath)) {
          const filename = path.basename(row.image_url)
          const publicId = `lalitha_garments/inventory_${row.id}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          const cloudinaryUrl = await uploadToCloudinary(localPath, publicId)
          if (cloudinaryUrl) {
            updates.image_url = cloudinaryUrl
            console.log(`  ✓ Migrated inventory ${row.id} image_url`)
          }
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
          console.log(`  ⚠ Could not parse product_images for inventory ${row.id}`)
          continue
        }
        
        if (Array.isArray(productImages) && productImages.length > 0) {
          const migratedImages = []
          for (let i = 0; i < productImages.length; i++) {
            const imgUrl = productImages[i]
            if (imgUrl && imgUrl.startsWith('/uploads/')) {
              const localPath = path.join(process.cwd(), 'public', imgUrl)
              if (fs.existsSync(localPath)) {
                const filename = path.basename(imgUrl)
                const publicId = `lalitha_garments/inventory_${row.id}_product_${i}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                const cloudinaryUrl = await uploadToCloudinary(localPath, publicId)
                if (cloudinaryUrl) {
                  migratedImages.push(cloudinaryUrl)
                  console.log(`  ✓ Migrated inventory ${row.id} product image ${i + 1}`)
                } else {
                  migratedImages.push(imgUrl) // Keep original if upload fails
                }
              } else {
                migratedImages.push(imgUrl) // Keep original if file doesn't exist
              }
            } else {
              migratedImages.push(imgUrl) // Already a Cloudinary URL or external URL
            }
          }
          
          if (migratedImages.some((img, idx) => img !== productImages[idx])) {
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
      } else {
        skipped++
      }
    }
    
    console.log(`  ✅ Inventory: ${updated} updated, ${skipped} skipped`)
  } catch (error) {
    console.error('Error migrating inventory images:', error)
  }
}

async function migratePurchaseOrderImages() {
  console.log('\n📋 Migrating Purchase Order Images...')
  
  try {
    // Migrate purchase_order_items product_images
    const itemsResult = await pool.query(`
      SELECT poi.id, poi.purchase_order_id, poi.product_images 
      FROM purchase_order_items poi 
      WHERE poi.product_images IS NOT NULL
    `)
    
    let updated = 0
    let skipped = 0
    
    for (const row of itemsResult.rows) {
      let productImages = []
      try {
        productImages = typeof row.product_images === 'string' 
          ? JSON.parse(row.product_images) 
          : row.product_images
      } catch (e) {
        console.log(`  ⚠ Could not parse product_images for PO item ${row.id}`)
        continue
      }
      
      if (Array.isArray(productImages) && productImages.length > 0) {
        const migratedImages = []
        for (let i = 0; i < productImages.length; i++) {
          const imgUrl = productImages[i]
          if (imgUrl && imgUrl.startsWith('/uploads/')) {
            const localPath = path.join(process.cwd(), 'public', imgUrl)
            if (fs.existsSync(localPath)) {
              const filename = path.basename(imgUrl)
              const publicId = `lalitha_garments/po_${row.purchase_order_id}_item_${row.id}_${i}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
              const cloudinaryUrl = await uploadToCloudinary(localPath, publicId)
              if (cloudinaryUrl) {
                migratedImages.push(cloudinaryUrl)
                console.log(`  ✓ Migrated PO ${row.purchase_order_id} item ${row.id} image ${i + 1}`)
              } else {
                migratedImages.push(imgUrl)
              }
            } else {
              migratedImages.push(imgUrl)
            }
          } else {
            migratedImages.push(imgUrl)
          }
        }
        
        if (migratedImages.some((img, idx) => img !== productImages[idx])) {
          await pool.query(
            'UPDATE purchase_order_items SET product_images = $1 WHERE id = $2',
            [JSON.stringify(migratedImages), row.id]
          )
          updated++
        } else {
          skipped++
        }
      }
    }
    
    // Migrate purchase_orders invoice_image
    const poResult = await pool.query(`
      SELECT id, invoice_image 
      FROM purchase_orders 
      WHERE invoice_image IS NOT NULL AND invoice_image != ''
    `)
    
    for (const row of poResult.rows) {
      if (row.invoice_image && row.invoice_image.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'public', row.invoice_image)
        if (fs.existsSync(localPath)) {
          const filename = path.basename(row.invoice_image)
          const publicId = `lalitha_garments/po_${row.id}_invoice_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          const cloudinaryUrl = await uploadToCloudinary(localPath, publicId)
          if (cloudinaryUrl) {
            await pool.query(
              'UPDATE purchase_orders SET invoice_image = $1 WHERE id = $2',
              [cloudinaryUrl, row.id]
            )
            console.log(`  ✓ Migrated PO ${row.id} invoice image`)
            updated++
          }
        }
      } else {
        skipped++
      }
    }
    
    console.log(`  ✅ Purchase Orders: ${updated} updated, ${skipped} skipped`)
  } catch (error) {
    console.error('Error migrating purchase order images:', error)
  }
}

async function migrateSalesImages() {
  console.log('\n💰 Migrating Sales Images...')
  
  try {
    const result = await pool.query(`
      SELECT id, sale_image 
      FROM sales 
      WHERE sale_image IS NOT NULL AND sale_image != ''
    `)
    
    let updated = 0
    let skipped = 0
    
    for (const row of result.rows) {
      // Check if it's a base64 data URI (from webcam capture)
      if (row.sale_image.startsWith('data:image/')) {
        // Upload base64 image to Cloudinary
        try {
          const result = await cloudinary.uploader.upload(row.sale_image, {
            public_id: `lalitha_garments/sale_${row.id}_proof`,
            folder: 'lalitha_garments',
            resource_type: 'image',
            overwrite: false,
          })
          
          await pool.query(
            'UPDATE sales SET sale_image = $1 WHERE id = $2',
            [result.secure_url, row.id]
          )
          console.log(`  ✓ Migrated sale ${row.id} proof image (base64)`)
          updated++
        } catch (error) {
          console.error(`  ✗ Failed to upload sale ${row.id} image:`, error.message)
          skipped++
        }
      } else if (row.sale_image.startsWith('/uploads/')) {
        // Local file path
        const localPath = path.join(process.cwd(), 'public', row.sale_image)
        if (fs.existsSync(localPath)) {
          const filename = path.basename(row.sale_image)
          const publicId = `lalitha_garments/sale_${row.id}_proof_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          const cloudinaryUrl = await uploadToCloudinary(localPath, publicId)
          if (cloudinaryUrl) {
            await pool.query(
              'UPDATE sales SET sale_image = $1 WHERE id = $2',
              [cloudinaryUrl, row.id]
            )
            console.log(`  ✓ Migrated sale ${row.id} proof image`)
            updated++
          } else {
            skipped++
          }
        } else {
          skipped++
        }
      } else {
        // Already a Cloudinary URL or external URL
        skipped++
      }
    }
    
    console.log(`  ✅ Sales: ${updated} updated, ${skipped} skipped`)
  } catch (error) {
    console.error('Error migrating sales images:', error)
  }
}

async function main() {
  console.log('🚀 Starting Image Migration to Cloudinary...\n')
  
  // Check Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Error: Cloudinary environment variables not set!')
    console.log('\nPlease add to your .env file:')
    console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name')
    console.log('CLOUDINARY_API_KEY=your_api_key')
    console.log('CLOUDINARY_API_SECRET=your_api_secret')
    process.exit(1)
  }
  
  try {
    await migrateInventoryImages()
    await migratePurchaseOrderImages()
    await migrateSalesImages()
    
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📝 Note: Local images in public/uploads/ are not deleted.')
    console.log('   You can manually delete them after verifying Cloudinary uploads.')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

