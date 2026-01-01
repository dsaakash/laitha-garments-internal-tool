require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
})

const collectionItems = [
  {
    dressName: 'Mustard Yellow Embroidered Kurta',
    dressType: 'Kurti',
    dressCode: 'COL-001',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 800,
    sellingPrice: 1600,
    imageUrl: '/kurti_yellow.png',
    fabricType: 'Cotton',
    description: 'Beautiful mustard yellow kurta with intricate floral and geometric embroidery in pink, maroon, gold, and white with mirror work',
  },
  {
    dressName: 'Olive Green Mandala Kurta',
    dressType: 'Kurti',
    dressCode: 'COL-002',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 850,
    sellingPrice: 1700,
    imageUrl: '/kurti_green.png',
    fabricType: 'Cotton',
    description: 'Elegant olive green kurta with mandala-style circular embroidery and white floral patterns',
  },
  {
    dressName: 'Mustard Yellow Traditional Kurta',
    dressType: 'Kurti',
    dressCode: 'COL-003',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 900,
    sellingPrice: 1800,
    imageUrl: '/kurti_yellow_1.png',
    fabricType: 'Cotton',
    description: 'Traditional mustard yellow kurta with elaborate embroidery around neckline and cuffs in pink, purple, blue, and gold',
  },
  {
    dressName: 'Pink Floral Kurta',
    dressType: 'Kurti',
    dressCode: 'COL-004',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 750,
    sellingPrice: 1500,
    imageUrl: '/kurti_pink.png',
    fabricType: 'Cotton',
    description: 'Vibrant pink kurta with white floral and leaf patterns, perfect for casual and festive occasions',
  },
  {
    dressName: 'Pink Embroidered Kurta',
    dressType: 'Kurti',
    dressCode: 'COL-005',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 800,
    sellingPrice: 1600,
    imageUrl: '/kurti_pink1.png',
    fabricType: 'Cotton',
    description: 'Elegant pink kurta with intricate embroidery and floral designs',
  },
  {
    dressName: 'Pink Patterned Kurta',
    dressType: 'Kurti',
    dressCode: 'COL-006',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 850,
    sellingPrice: 1700,
    imageUrl: '/kurti_pink_2.png',
    fabricType: 'Cotton',
    description: 'Beautiful pink kurta with detailed patterns and traditional designs',
  },
  {
    dressName: 'Green Floral Kurta',
    dressType: 'Kurti',
    dressCode: 'COL-007',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 800,
    sellingPrice: 1600,
    imageUrl: '/kurti_green1.png',
    fabricType: 'Cotton',
    description: 'Elegant light green kurta with large white floral patterns, perfect for daily wear and special occasions',
  },
  {
    dressName: 'Traditional Kurta Set',
    dressType: 'Kurti',
    dressCode: 'COL-008',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 900,
    sellingPrice: 1800,
    imageUrl: '/kurti_1.png',
    fabricType: 'Cotton',
    description: 'Classic traditional kurta with beautiful embroidery and patterns',
  },
  {
    dressName: 'Embroidered Kurta',
    dressType: 'Kurti',
    dressCode: 'COL-009',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 950,
    sellingPrice: 1900,
    imageUrl: '/kurti_2.png',
    fabricType: 'Cotton',
    description: 'Stunning embroidered kurta with intricate traditional designs',
  },
  {
    dressName: 'Elegant Green Kurta Set',
    dressType: 'Kurtis',
    dressCode: 'COL-010',
    sizes: ['S', 'M', 'L', 'XL'],
    wholesalePrice: 850,
    sellingPrice: 1700,
    imageUrl: '/dress1.png',
    fabricType: 'Cotton',
    description: 'Beautiful lime green kurta with matching pants, perfect for daily wear',
  },
  {
    dressName: 'Traditional Yellow Saree',
    dressType: 'Sarees',
    dressCode: 'COL-011',
    sizes: ['Free Size'],
    wholesalePrice: 1000,
    sellingPrice: 2000,
    imageUrl: '/dress2.png',
    fabricType: 'Cotton',
    description: 'Vibrant yellow saree with pink floral motifs and palm tree border design',
  },
]

async function addCollectionItems() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    for (const item of collectionItems) {
      // Check if item already exists
      const existing = await client.query(
        'SELECT id FROM inventory WHERE dress_code = $1',
        [item.dressCode]
      )
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipped (already exists): ${item.dressName}`)
        continue
      }
      
      await client.query(
        `INSERT INTO inventory 
         (dress_name, dress_type, dress_code, sizes, wholesale_price, selling_price, 
          image_url, fabric_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.dressName,
          item.dressType,
          item.dressCode,
          item.sizes,
          item.wholesalePrice,
          item.sellingPrice,
          item.imageUrl,
          item.fabricType,
        ]
      )
      console.log(`✅ Added: ${item.dressName}`)
    }
    
    await client.query('COMMIT')
    console.log('\n✅ All collection items processed successfully!')
    console.log(`\n📊 Total items added: ${collectionItems.length}`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error adding collection items:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

addCollectionItems()

