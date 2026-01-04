require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
})

async function listAllImages() {
  console.log('📸 Complete Image Location Report\n')
  console.log('='.repeat(80))
  
  try {
    // Check database images
    console.log('\n🗄️  IMAGES IN DATABASE (PostgreSQL):\n')
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
    
    const imageLocations = {
      cloudinary: [],
      localStatic: [],
      localUploads: [],
      other: []
    }
    
    result.rows.forEach(row => {
      // Check image_url
      if (row.image_url) {
        if (row.image_url.includes('cloudinary.com')) {
          imageLocations.cloudinary.push({
            item: `${row.dress_name} (${row.dress_code})`,
            url: row.image_url,
            type: 'image_url'
          })
        } else if (row.image_url.startsWith('/uploads/')) {
          imageLocations.localUploads.push({
            item: `${row.dress_name} (${row.dress_code})`,
            path: row.image_url,
            type: 'image_url'
          })
        } else if (row.image_url.startsWith('/')) {
          imageLocations.localStatic.push({
            item: `${row.dress_name} (${row.dress_code})`,
            path: row.image_url,
            type: 'image_url'
          })
        } else {
          imageLocations.other.push({
            item: `${row.dress_name} (${row.dress_code})`,
            url: row.image_url,
            type: 'image_url'
          })
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
          return
        }
        
        if (Array.isArray(productImages)) {
          productImages.forEach((imgUrl, idx) => {
            if (imgUrl) {
              if (imgUrl.includes('cloudinary.com')) {
                imageLocations.cloudinary.push({
                  item: `${row.dress_name} (${row.dress_code})`,
                  url: imgUrl,
                  type: `product_images[${idx}]`
                })
              } else if (imgUrl.startsWith('/uploads/')) {
                imageLocations.localUploads.push({
                  item: `${row.dress_name} (${row.dress_code})`,
                  path: imgUrl,
                  type: `product_images[${idx}]`
                })
              } else if (imgUrl.startsWith('/')) {
                imageLocations.localStatic.push({
                  item: `${row.dress_name} (${row.dress_code})`,
                  path: imgUrl,
                  type: `product_images[${idx}]`
                })
              } else {
                imageLocations.other.push({
                  item: `${row.dress_name} (${row.dress_code})`,
                  url: imgUrl,
                  type: `product_images[${idx}]`
                })
              }
            }
          })
        }
      }
    })
    
    // Display Cloudinary images
    if (imageLocations.cloudinary.length > 0) {
      console.log(`\n☁️  CLOUDINARY IMAGES (${imageLocations.cloudinary.length}):`)
      console.log('   These are stored in Cloudinary cloud storage\n')
      imageLocations.cloudinary.forEach((img, idx) => {
        console.log(`   ${idx + 1}. ${img.item}`)
        console.log(`      Type: ${img.type}`)
        console.log(`      URL: ${img.url}`)
        console.log('')
      })
    }
    
    // Display local static images
    if (imageLocations.localStatic.length > 0) {
      console.log(`\n📁 LOCAL STATIC IMAGES (${imageLocations.localStatic.length}):`)
      console.log('   These are in the public/ folder (static assets)\n')
      imageLocations.localStatic.forEach((img, idx) => {
        const fullPath = path.join(process.cwd(), 'public', img.path)
        const exists = fs.existsSync(fullPath)
        console.log(`   ${idx + 1}. ${img.item}`)
        console.log(`      Type: ${img.type}`)
        console.log(`      Path: ${img.path}`)
        console.log(`      Full Path: ${fullPath}`)
        console.log(`      Exists: ${exists ? '✅ Yes' : '❌ No'}`)
        console.log('')
      })
    }
    
    // Display local uploads
    if (imageLocations.localUploads.length > 0) {
      console.log(`\n📤 LOCAL UPLOADED IMAGES (${imageLocations.localUploads.length}):`)
      console.log('   These are in public/uploads/ folder (need migration to Cloudinary)\n')
      imageLocations.localUploads.forEach((img, idx) => {
        const fullPath = path.join(process.cwd(), 'public', img.path)
        const exists = fs.existsSync(fullPath)
        console.log(`   ${idx + 1}. ${img.item}`)
        console.log(`      Type: ${img.type}`)
        console.log(`      Path: ${img.path}`)
        console.log(`      Full Path: ${fullPath}`)
        console.log(`      Exists: ${exists ? '✅ Yes' : '❌ No'}`)
        console.log('')
      })
    }
    
    // Display other URLs
    if (imageLocations.other.length > 0) {
      console.log(`\n🔗 OTHER URLS (${imageLocations.other.length}):`)
      imageLocations.other.forEach((img, idx) => {
        console.log(`   ${idx + 1}. ${img.item} - ${img.url}`)
      })
    }
    
    // Check physical files
    console.log('\n' + '='.repeat(80))
    console.log('\n📂 PHYSICAL FILES ON DISK:\n')
    
    const publicDir = path.join(process.cwd(), 'public')
    const uploadsDir = path.join(publicDir, 'uploads')
    
    // List static images in public/
    console.log('📁 Static Images in public/ folder:')
    const staticFiles = fs.readdirSync(publicDir)
      .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
      .map(file => path.join(publicDir, file))
    
    if (staticFiles.length > 0) {
      staticFiles.forEach((file, idx) => {
        const stats = fs.statSync(file)
        const sizeKB = (stats.size / 1024).toFixed(2)
        console.log(`   ${idx + 1}. ${path.basename(file)} (${sizeKB} KB)`)
      })
    } else {
      console.log('   (No static images found)')
    }
    
    // List uploaded images in public/uploads/
    console.log('\n📤 Uploaded Images in public/uploads/ folder:')
    if (fs.existsSync(uploadsDir)) {
      const uploadFiles = fs.readdirSync(uploadsDir)
        .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
        .map(file => path.join(uploadsDir, file))
      
      if (uploadFiles.length > 0) {
        uploadFiles.forEach((file, idx) => {
          const stats = fs.statSync(file)
          const sizeKB = (stats.size / 1024).toFixed(2)
          console.log(`   ${idx + 1}. ${path.basename(file)} (${sizeKB} KB)`)
        })
      } else {
        console.log('   (No uploaded images found)')
      }
    } else {
      console.log('   (uploads/ folder does not exist)')
    }
    
    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('\n📊 SUMMARY:\n')
    console.log(`   ☁️  Cloudinary: ${imageLocations.cloudinary.length} images`)
    console.log(`   📁 Local Static: ${imageLocations.localStatic.length} images`)
    console.log(`   📤 Local Uploads: ${imageLocations.localUploads.length} images`)
    console.log(`   🔗 Other URLs: ${imageLocations.other.length} images`)
    console.log(`   📂 Physical Files: ${staticFiles.length} static + ${fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f)).length : 0} uploaded`)
    
    if (imageLocations.localUploads.length > 0) {
      console.log('\n💡 To migrate local uploads to Cloudinary:')
      console.log('   npm run migrate-images-cloudinary')
    }
    
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('\n🌐 View Cloudinary Dashboard:')
      console.log(`   https://console.cloudinary.com/console/c/${process.env.CLOUDINARY_CLOUD_NAME}/media_library/folders/lalitha_garments`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

listAllImages()

