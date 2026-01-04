# Low Level Design (LLD)
## Lalitha Garments - Inventory & Sales Management System

**Version:** 1.0  
**Last Updated:** January 2025

---

## 1. Component-Level Design

### 1.1 Inventory Management Component

#### File: `app/admin/inventory/page.tsx`

**State Management:**
```typescript
- items: InventoryItem[]           // All inventory items
- showModal: boolean               // Add/Edit modal visibility
- formData: FormData              // Form state
- previewImages: string[]          // Image previews
- searchQuery: string              // Search filter
- showStockModal: boolean          // Stock adjustment modal
- bulkStockData: BulkStockData[]   // Bulk update data
```

**Key Functions:**
- `loadItems()`: Fetch inventory from API
- `handleSubmit()`: Create/update inventory item
- `handleImageUpload()`: Upload multiple images to Cloudinary
- `handleStockUpdate()`: Update stock for single item
- `handleBulkStockUpdate()`: Update stock for multiple items
- `exportToExcel()`: Export inventory to Excel

**API Interactions:**
- `GET /api/inventory` - Load items
- `POST /api/inventory` - Create item
- `PUT /api/inventory/[id]` - Update item
- `DELETE /api/inventory/[id]` - Delete item
- `POST /api/upload` - Upload images
- `POST /api/stock-movements` - Update stock

---

### 1.2 Purchase Order Component

#### File: `app/admin/purchases/page.tsx`

**State Management:**
```typescript
- orders: PurchaseOrder[]         // All purchase orders
- items: PurchaseOrderItem[]       // Form items array
- formData: FormData              // PO form state
- suppliers: Supplier[]           // Supplier list
- filterCategory: string           // Category filter
- searchQuery: string             // Search filter
```

**Key Functions:**
- `loadOrders()`: Fetch purchase orders from API
- `handleSubmit()`: Create/update PO with multiple items
- `calculateTotals()`: Calculate subtotal, GST, grand total
- `handleAddItem()`: Add product to PO
- `handleItemChange()`: Update item details
- `handleImageUpload()`: Upload product images
- `exportToExcel()`: Export POs to Excel

**GST Calculation Logic:**
```typescript
if (gstType === 'percentage') {
  gstAmount = (subtotal * gstPercentage) / 100
} else if (gstType === 'rupees') {
  gstAmount = gstAmountRupees
}
grandTotal = subtotal + gstAmount
```

**API Interactions:**
- `GET /api/purchases` - Load orders (with category filter)
- `POST /api/purchases` - Create order
- `PUT /api/purchases/[id]` - Update order
- `DELETE /api/purchases/[id]` - Delete order
- `POST /api/upload` - Upload images

---

### 1.3 Sales Component

#### File: `app/admin/sales/page.tsx`

**State Management:**
```typescript
- sales: Sale[]                   // All sales
- formData: FormData              // Sale form state
- showCamera: boolean             // Webcam modal
- capturedImage: string           // Captured image (base64)
- selectedSticker: string         // Selected sticker
```

**Key Functions:**
- `loadSales()`: Fetch sales from API
- `handleSubmit()`: Create sale with discount/GST calculation
- `startCamera()`: Initialize webcam
- `captureImage()`: Capture photo from webcam
- `addStickerToImage()`: Overlay sticker on image
- `calculateTotals()`: Calculate with discount and GST

**Total Calculation Logic:**
```typescript
// Calculate subtotal
subtotal = items.reduce((sum, item) => {
  const price = item.usePerMeter && item.meters
    ? item.pricePerMeter * item.meters
    : item.sellingPrice * item.quantity
  return sum + price
}, 0)

// Apply discount
discount = discountType === 'percentage'
  ? (subtotal * discountPercentage) / 100
  : discountAmount

amountAfterDiscount = subtotal - discount

// Apply GST
gst = gstType === 'percentage'
  ? (amountAfterDiscount * gstPercentage) / 100
  : gstAmount

finalTotal = amountAfterDiscount + gst
```

**API Interactions:**
- `GET /api/sales` - Load sales (with date filters)
- `POST /api/sales` - Create sale
- `POST /api/upload` - Upload sale proof image

---

## 2. API Route Design

### 2.1 Inventory API

#### File: `app/api/inventory/route.ts`

**GET Endpoint:**
```typescript
- Query database for all inventory items
- Join with related data if needed
- Apply search filter (dress code, name, supplier)
- Transform snake_case to camelCase
- Return JSON response
```

**POST Endpoint:**
```typescript
- Validate input data
- Convert productImages array to JSONB
- Insert into inventory table
- Return created item with stock fields
```

**Stock Update Logic:**
```typescript
// On purchase order creation
UPDATE inventory SET
  quantity_in = quantity_in + newQuantity,
  current_stock = current_stock + newQuantity
WHERE id = inventoryId

// On sale creation
UPDATE inventory SET
  quantity_out = quantity_out + soldQuantity,
  current_stock = current_stock - soldQuantity
WHERE id = inventoryId
```

---

### 2.2 Purchase Orders API

#### File: `app/api/purchases/route.ts`

**GET Endpoint:**
```typescript
- Query purchase_orders table
- LEFT JOIN purchase_order_items
- Aggregate items into JSON array
- Apply category filter if provided
- Group by PO to handle multiple items
- Return formatted orders
```

**POST Endpoint:**
```typescript
1. Validate supplier and items
2. Calculate totals (subtotal, GST, grand total)
3. Insert into purchase_orders
4. Insert each item into purchase_order_items
5. For each item:
   - Find matching inventory item (fuzzy matching)
   - Update inventory stock (increase)
6. Return created order
```

**Fuzzy Matching Logic:**
```typescript
// Match purchase order item to inventory
1. Try exact dress_code match
2. Try exact product_name match
3. Try partial name match
4. Try normalized name match
5. If no match, log warning but continue
```

**PUT Endpoint:**
```typescript
1. Get existing order and items
2. Calculate stock difference (new qty - old qty)
3. Update purchase_orders table
4. Delete old purchase_order_items
5. Insert new purchase_order_items
6. Update inventory stock based on difference
```

---

### 2.3 Sales API

#### File: `app/api/sales/route.ts`

**POST Endpoint:**
```typescript
1. Validate sale data
2. Calculate totals (subtotal, discount, GST, final)
3. Insert into sales table
4. For each sale item:
   - Insert into sale_items
   - Update inventory stock (decrease)
   - Use meters if per meter pricing, else quantity
5. Return created sale
```

**Stock Decrease Logic:**
```typescript
quantityToDeduct = item.usePerMeter && item.meters
  ? item.meters
  : item.quantity

UPDATE inventory SET
  quantity_out = quantity_out + quantityToDeduct,
  current_stock = current_stock - quantityToDeduct
WHERE id = inventoryId
```

---

### 2.4 Upload API

#### File: `app/api/upload/route.ts`

**POST Endpoint:**
```typescript
1. Receive FormData with file
2. Validate file type (images only)
3. Validate file size (max 10MB)
4. Convert file to base64 data URI
5. Upload to Cloudinary with:
   - Folder: 'lalitha_garments'
   - Public ID: 'lalitha_garments/{timestamp}_{filename}'
   - Resource type: 'auto'
6. Return secure_url from Cloudinary
```

**Cloudinary Configuration:**
```typescript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
```

---

## 3. Database Schema Design

### 3.1 Inventory Table

```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  dress_name VARCHAR(255) NOT NULL,
  dress_type VARCHAR(255) NOT NULL,
  dress_code VARCHAR(255) NOT NULL,
  sizes TEXT[] NOT NULL,
  wholesale_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  pricing_unit VARCHAR(20),              -- 'piece' or 'meter'
  price_per_piece DECIMAL(10, 2),
  price_per_meter DECIMAL(10, 2),
  image_url TEXT,                         -- Legacy single image
  product_images JSONB DEFAULT '[]',      -- Array of Cloudinary URLs
  fabric_type VARCHAR(255),
  supplier_name VARCHAR(255),
  supplier_address TEXT,
  supplier_phone VARCHAR(50),
  quantity_in INTEGER DEFAULT 0,
  quantity_out INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_inventory_dress_code` on `dress_code`

---

### 3.2 Purchase Orders Tables

```sql
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL,
  custom_po_number VARCHAR(255),
  invoice_image TEXT,                    -- Cloudinary URL
  subtotal DECIMAL(10, 2),
  gst_type VARCHAR(20),                  -- 'percentage' or 'rupees'
  gst_percentage DECIMAL(5, 2),
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  grand_total DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  sizes TEXT[],
  fabric_type VARCHAR(255),
  quantity INTEGER NOT NULL,
  price_per_piece DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  product_images TEXT[],                 -- Array of Cloudinary URLs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_purchase_order_items_po_id` on `purchase_order_id`
- `idx_purchase_orders_date` on `date`

---

### 3.3 Sales Tables

```sql
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  party_name VARCHAR(255) NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  bill_number VARCHAR(255) NOT NULL,
  subtotal DECIMAL(10, 2),
  discount_type VARCHAR(20),             -- 'percentage' or 'rupees'
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  gst_type VARCHAR(20),                   -- 'percentage' or 'rupees'
  gst_percentage DECIMAL(5, 2),
  gst_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2) NOT NULL,
  final_total DECIMAL(10, 2),
  payment_mode VARCHAR(50) NOT NULL,
  upi_transaction_id VARCHAR(255),
  sale_image TEXT,                        -- Cloudinary URL (base64 or URL)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  inventory_id INTEGER REFERENCES inventory(id),
  dress_name VARCHAR(255) NOT NULL,
  dress_type VARCHAR(255) NOT NULL,
  dress_code VARCHAR(255) NOT NULL,
  size VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  use_per_meter BOOLEAN DEFAULT FALSE,
  meters DECIMAL(10, 2),
  price_per_meter DECIMAL(10, 2),
  purchase_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL
);
```

**Indexes:**
- `idx_sales_date` on `date`
- `idx_sales_customer` on `customer_id`

---

## 4. Algorithm Design

### 4.1 Stock Matching Algorithm

**Purpose:** Match purchase order items to inventory items

```typescript
function matchInventoryItem(poItem, inventoryItems) {
  // Strategy 1: Exact dress code match
  const exactCodeMatch = inventoryItems.find(
    inv => inv.dressCode.toLowerCase() === poItem.productName.toLowerCase()
  )
  if (exactCodeMatch) return exactCodeMatch
  
  // Strategy 2: Exact product name match
  const exactNameMatch = inventoryItems.find(
    inv => inv.dressName.toLowerCase() === poItem.productName.toLowerCase()
  )
  if (exactNameMatch) return exactNameMatch
  
  // Strategy 3: Partial name match
  const partialMatch = inventoryItems.find(
    inv => inv.dressName.toLowerCase().includes(poItem.productName.toLowerCase()) ||
           poItem.productName.toLowerCase().includes(inv.dressName.toLowerCase())
  )
  if (partialMatch) return partialMatch
  
  // Strategy 4: Normalized match (remove special chars, spaces)
  const normalizedPO = poItem.productName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const normalizedMatch = inventoryItems.find(inv => {
    const normalizedInv = inv.dressName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    return normalizedInv === normalizedPO
  })
  if (normalizedMatch) return normalizedMatch
  
  return null // No match found
}
```

---

### 4.2 Total Calculation Algorithm

**Purchase Orders:**
```typescript
function calculatePOTotals(items, gstType, gstValue) {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.pricePerPiece * item.quantity)
  }, 0)
  
  // Calculate GST
  let gstAmount = 0
  if (gstType === 'percentage') {
    gstAmount = (subtotal * gstValue) / 100
  } else if (gstType === 'rupees') {
    gstAmount = gstValue
  }
  
  // Calculate grand total
  const grandTotal = subtotal + gstAmount
  
  return { subtotal, gstAmount, grandTotal }
}
```

**Sales:**
```typescript
function calculateSaleTotals(items, discountType, discountValue, gstType, gstValue) {
  // Calculate subtotal (with per meter pricing support)
  const subtotal = items.reduce((sum, item) => {
    const price = item.usePerMeter && item.meters
      ? item.pricePerMeter * item.meters
      : item.sellingPrice * item.quantity
    return sum + price
  }, 0)
  
  // Apply discount
  let discount = 0
  if (discountType === 'percentage') {
    discount = (subtotal * discountValue) / 100
  } else if (discountType === 'rupees') {
    discount = discountValue
  }
  
  const amountAfterDiscount = subtotal - discount
  
  // Apply GST
  let gst = 0
  if (gstType === 'percentage') {
    gst = (amountAfterDiscount * gstValue) / 100
  } else if (gstType === 'rupees') {
    gst = gstValue
  }
  
  const finalTotal = amountAfterDiscount + gst
  
  return { subtotal, discount, amountAfterDiscount, gst, finalTotal }
}
```

---

## 5. Data Transformation

### 5.1 Database to Frontend

**Snake_case to camelCase:**
```typescript
function transformInventoryRow(row) {
  return {
    id: row.id.toString(),
    dressName: row.dress_name,
    dressType: row.dress_type,
    dressCode: row.dress_code,
    sizes: row.sizes || [],
    wholesalePrice: parseFloat(row.wholesale_price),
    sellingPrice: parseFloat(row.selling_price),
    pricingUnit: row.pricing_unit || undefined,
    pricePerPiece: row.price_per_piece ? parseFloat(row.price_per_piece) : undefined,
    pricePerMeter: row.price_per_meter ? parseFloat(row.price_per_meter) : undefined,
    productImages: row.product_images 
      ? (Array.isArray(row.product_images) 
          ? row.product_images 
          : JSON.parse(row.product_images))
      : (row.image_url ? [row.image_url] : []),
    // ... other fields
  }
}
```

### 5.2 Frontend to Database

**camelCase to snake_case:**
```typescript
function prepareInventoryInsert(body) {
  return {
    dress_name: body.dressName,
    dress_type: body.dressType,
    dress_code: body.dressCode,
    sizes: body.sizes || [],
    wholesale_price: body.wholesalePrice,
    selling_price: body.sellingPrice,
    pricing_unit: body.pricingUnit || null,
    price_per_piece: body.pricePerPiece || null,
    price_per_meter: body.pricePerMeter || null,
    product_images: body.productImages && body.productImages.length > 0
      ? JSON.stringify(body.productImages)
      : null,
    // ... other fields
  }
}
```

---

## 6. Error Handling Patterns

### 6.1 API Error Handling

```typescript
try {
  // Database operation
  const result = await query(...)
  
  if (result.rows.length === 0) {
    return NextResponse.json(
      { success: false, message: 'Item not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ success: true, data: result.rows[0] })
} catch (error) {
  console.error('Operation error:', error)
  return NextResponse.json(
    { success: false, message: 'Operation failed' },
    { status: 500 }
  )
}
```

### 6.2 Frontend Error Handling

```typescript
try {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  
  const result = await response.json()
  if (!result.success) {
    alert(result.message || 'Operation failed')
    return
  }
  
  // Success handling
} catch (error) {
  console.error('Error:', error)
  alert('Failed to save. Please try again.')
}
```

---

## 7. State Management Patterns

### 7.1 Form State

```typescript
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
  // ... all form fields
})

// Update single field
setFormData(prev => ({ ...prev, field1: newValue }))

// Update multiple fields
setFormData(prev => ({ ...prev, ...updates }))
```

### 7.2 Array State (Multiple Items)

```typescript
const [items, setItems] = useState<Item[]>([])

// Add item
setItems(prev => [...prev, newItem])

// Update item at index
setItems(prev => {
  const newItems = [...prev]
  newItems[index] = { ...newItems[index], ...updates }
  return newItems
})

// Remove item
setItems(prev => prev.filter((_, i) => i !== index))
```

---

## 8. Image Handling Patterns

### 8.1 Multiple Image Upload

```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || [])
  
  // Upload all files in parallel
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    return data.url
  })
  
  const uploadedUrls = await Promise.all(uploadPromises)
  setFormData(prev => ({
    ...prev,
    productImages: [...prev.productImages, ...uploadedUrls]
  }))
}
```

### 8.2 Image Preview

```typescript
// Store preview URLs in state
const [previewImages, setPreviewImages] = useState<string[]>([])

// Update preview when images change
useEffect(() => {
  setPreviewImages(formData.productImages)
}, [formData.productImages])
```

---

## 9. Excel Export Implementation

### 9.1 Data Preparation

```typescript
const exportData = items.map(item => ({
  'Dress Name': item.dressName,
  'Dress Code': item.dressCode,
  'Selling Price (₹)': item.sellingPrice,
  'Current Stock': item.currentStock,
  // ... all fields with user-friendly headers
}))
```

### 9.2 Workbook Creation

```typescript
import * as XLSX from 'xlsx'

const ws = XLSX.utils.json_to_sheet(exportData)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Sheet Name')

// Set column widths
ws['!cols'] = [
  { wch: 20 }, // Column 1 width
  { wch: 15 }, // Column 2 width
  // ...
]

// Generate filename
const filename = `Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

// Download
XLSX.writeFile(wb, filename)
```

---

## 10. Webcam Capture Implementation

### 10.1 Camera Initialization

```typescript
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    })
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      streamRef.current = stream
    }
  } catch (error) {
    console.error('Camera error:', error)
  }
}
```

### 10.2 Image Capture

```typescript
const captureImage = () => {
  if (videoRef.current && canvasRef.current) {
    const canvas = canvasRef.current
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    stopCamera()
  }
}
```

### 10.3 Sticker Overlay

```typescript
const addStickerToImage = (sticker: string) => {
  if (capturedImage && canvasRef.current) {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Draw sticker at position
      ctx.font = '48px Arial'
      ctx.fillText(sticker, stickerPosition.x, stickerPosition.y)
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setFormData(prev => ({ ...prev, saleImage: imageData }))
    }
    img.src = capturedImage
  }
}
```

---

## 11. Database Query Patterns

### 11.1 Complex Join Query

```typescript
const query = `
  SELECT 
    po.*,
    json_agg(
      json_build_object(
        'id', poi.id,
        'productName', poi.product_name,
        'quantity', poi.quantity,
        'pricePerPiece', poi.price_per_piece
      )
    ) FILTER (WHERE poi.id IS NOT NULL) as items
  FROM purchase_orders po
  LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
  GROUP BY po.id
  ORDER BY po.date DESC
`
```

### 11.2 Search Query

```typescript
const searchQuery = `
  SELECT * FROM inventory
  WHERE 
    LOWER(dress_code) LIKE LOWER($1) OR
    LOWER(dress_name) LIKE LOWER($1) OR
    LOWER(supplier_name) LIKE LOWER($1)
  ORDER BY created_at DESC
`
const params = [`%${searchTerm}%`]
```

---

## 12. Type Definitions

### 12.1 Core Interfaces

```typescript
// lib/storage.ts

export interface InventoryItem {
  id: string
  dressName: string
  dressType: string
  dressCode: string
  sizes: string[]
  wholesalePrice: number
  sellingPrice: number
  pricingUnit?: 'piece' | 'meter'
  pricePerPiece?: number
  pricePerMeter?: number
  productImages?: string[]
  quantityIn?: number
  quantityOut?: number
  currentStock?: number
}

export interface PurchaseOrder {
  id: string
  date: string
  supplierId: string
  supplierName: string
  customPoNumber?: string
  items: PurchaseOrderItem[]
  subtotal?: number
  gstType?: 'percentage' | 'rupees'
  gstAmount?: number
  grandTotal?: number
  invoiceImage?: string
}

export interface Sale {
  id: string
  date: string
  partyName: string
  items: SaleItem[]
  subtotal?: number
  discountType?: 'percentage' | 'rupees'
  discountAmount?: number
  gstType?: 'percentage' | 'rupees'
  gstAmount?: number
  totalAmount: number
  saleImage?: string
}
```

---

## 13. Utility Functions

### 13.1 Database Connection

```typescript
// lib/db.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false },
})

export async function query(text: string, params?: any[]) {
  return pool.query(text, params)
}
```

### 13.2 Authentication

```typescript
// lib/db-auth.ts
export async function verifyAdmin(email: string, password: string) {
  const result = await query(
    'SELECT * FROM admins WHERE email = $1',
    [email]
  )
  
  if (result.rows.length === 0) return null
  
  const admin = result.rows[0]
  const isValid = await bcrypt.compare(password, admin.password_hash)
  
  return isValid ? admin : null
}
```

---

## 14. Component Patterns

### 14.1 Modal Pattern

```typescript
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50">
    <div className="modal-content">
      {/* Modal content */}
      <button onClick={() => setShowModal(false)}>Close</button>
    </div>
  </div>
)}
```

### 14.2 Form Pattern

```typescript
<form onSubmit={handleSubmit}>
  <input
    value={formData.field}
    onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
  />
  <button type="submit">Submit</button>
</form>
```

---

## 15. Testing Considerations

### 15.1 Unit Testing
- Test calculation functions (totals, GST, discounts)
- Test data transformation functions
- Test matching algorithms

### 15.2 Integration Testing
- Test API endpoints
- Test database operations
- Test Cloudinary uploads

### 15.3 E2E Testing
- Test complete user flows
- Test form submissions
- Test image uploads

---

## 16. Performance Optimizations

1. **Database:**
   - Indexes on frequently queried columns
   - Efficient JOIN queries
   - Connection pooling

2. **Frontend:**
   - React.memo for expensive components
   - Lazy loading for images
   - Debounced search

3. **Images:**
   - Cloudinary automatic optimization
   - CDN delivery
   - Lazy loading

---

## 17. Security Implementation

### 17.1 Password Hashing

```typescript
import bcrypt from 'bcryptjs'

const saltRounds = 10
const hash = await bcrypt.hash(password, saltRounds)
```

### 17.2 Session Management

```typescript
// Create session
const token = Buffer.from(JSON.stringify({ adminId, email })).toString('base64')
response.cookies.set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 days
})

// Verify session
const session = request.cookies.get('session')?.value
const decoded = JSON.parse(Buffer.from(session, 'base64').toString())
```

---

## 18. Migration Scripts

### 18.1 Database Migration Pattern

```typescript
// scripts/migrate-*.js
require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function migrate() {
  const sql = fs.readFileSync('migrate-*.sql', 'utf8')
  await pool.query(sql)
  console.log('Migration completed')
  process.exit(0)
}

migrate()
```

---

## 19. Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Cloudinary credentials set
- [ ] Admin account created
- [ ] Images migrated to Cloudinary
- [ ] Build passes without errors
- [ ] All API endpoints tested
- [ ] Export functionality tested

---

## 20. Maintenance Guidelines

1. **Regular Backups:** Database backups
2. **Monitor Cloudinary:** Usage and costs
3. **Update Dependencies:** Security patches
4. **Database Maintenance:** Index optimization
5. **Error Monitoring:** Track and fix errors

