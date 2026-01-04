require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
})

async function checkCloudinaryImages() {
  console.log('🔍 Checking Inventory Images in Database...\n')
  
  try {
    const result = await pool.query(`
      SELECT 
        id,
        dress_name,
        dress_code,
        image_url,
        product_images
      FROM inventory
      WHERE image_url IS NOT NULL 
         OR product_images IS NOT NULL
      ORDER BY id
    `)
    
    if (result.rows.length === 0) {
      console.log('❌ No images found in inventory')
      return
    }
    
    console.log(`Found ${result.rows.length} inventory items with images:\n`)
    console.log('='.repeat(80))
    
    let cloudinaryCount = 0
    let localCount = 0
    
    result.rows.forEach((row, index) => {
      console.log(`\n📦 Item #${row.id}: ${row.dress_name} (${row.dress_code})`)
      console.log('-'.repeat(80))
      
      // Check image_url
      if (row.image_url) {
        if (row.image_url.includes('cloudinary.com') || row.image_url.includes('res.cloudinary.com')) {
          console.log(`  ✅ image_url (Cloudinary):`)
          console.log(`     ${row.image_url}`)
          cloudinaryCount++
        } else if (row.image_url.startsWith('/uploads/')) {
          console.log(`  ⚠️  image_url (Local - needs migration):`)
          console.log(`     ${row.image_url}`)
          localCount++
        } else {
          console.log(`  ℹ️  image_url (Other URL):`)
          console.log(`     ${row.image_url}`)
        }
      }
      
      // Check product_images
      if (row.product_images) {
        let productImages = []
        try {
          productImages = typeof row.product_images === 'string' 
            ? JSON.parse(row.product_images) 
            : row.product_images
        } catch (e) {
          console.log(`  ⚠️  product_images (Parse error)`)
          return
        }
        
        if (Array.isArray(productImages) && productImages.length > 0) {
          console.log(`  📸 product_images (${productImages.length} images):`)
          productImages.forEach((imgUrl, idx) => {
            if (imgUrl) {
              if (imgUrl.includes('cloudinary.com') || imgUrl.includes('res.cloudinary.com')) {
                console.log(`     [${idx + 1}] ✅ Cloudinary: ${imgUrl}`)
                cloudinaryCount++
              } else if (imgUrl.startsWith('/uploads/')) {
                console.log(`     [${idx + 1}] ⚠️  Local: ${imgUrl}`)
                localCount++
              } else {
                console.log(`     [${idx + 1}] ℹ️  Other: ${imgUrl}`)
              }
            }
          })
        }
      }
    })
    
    console.log('\n' + '='.repeat(80))
    console.log('\n📊 Summary:')
    console.log(`   ✅ Cloudinary URLs: ${cloudinaryCount}`)
    console.log(`   ⚠️  Local paths (need migration): ${localCount}`)
    console.log(`   📦 Total items: ${result.rows.length}`)
    
    if (localCount > 0) {
      console.log('\n💡 To migrate local images to Cloudinary, run:')
      console.log('   npm run migrate-images-cloudinary')
    }
    
    // Show Cloudinary dashboard link
    if (cloudinaryCount > 0 && process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('\n🌐 View images in Cloudinary Dashboard:')
      console.log(`   https://console.cloudinary.com/console/c/${process.env.CLOUDINARY_CLOUD_NAME}/media_library/folders/lalitha_garments`)
    }
    
  } catch (error) {
    console.error('❌ Error checking images:', error)
  } finally {
    await pool.end()
  }
}

checkCloudinaryImages()

