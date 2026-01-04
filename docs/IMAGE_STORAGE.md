# Image Storage Strategy

## Current Implementation

### ✅ Recommended Approach: Store URLs in PostgreSQL

**We store image URLs (strings) in PostgreSQL, NOT the actual image files.**

#### Why This is Better:
1. **Database Performance**: Storing binary data (images) in PostgreSQL makes the database large and slow
2. **Scalability**: URLs are small (few bytes) vs images (MBs)
3. **CDN Benefits**: Cloudinary provides global CDN for fast image delivery
4. **Storage Limits**: PostgreSQL databases have size limits, cloud storage doesn't
5. **Backup Speed**: Database backups are faster without binary data
6. **Best Practice**: Industry standard is to store URLs, not binary data

#### Database Schema:
- `inventory.image_url` → TEXT (stores Cloudinary URL)
- `inventory.product_images` → JSONB (stores array of Cloudinary URLs)
- `purchase_order_items.product_images` → TEXT[] (stores array of Cloudinary URLs)
- `purchase_orders.invoice_image` → TEXT (stores Cloudinary URL)
- `sales.sale_image` → TEXT (stores Cloudinary URL)

### ❌ Alternative: Storing Images in PostgreSQL (NOT Recommended)

PostgreSQL CAN store images using:
- `BYTEA` type (binary data)
- `BLOB` type (large binary objects)

**Why we DON'T do this:**
- Database becomes huge (GBs instead of MBs)
- Slow queries and backups
- Expensive database storage
- No CDN benefits
- Harder to manage and optimize images

## Image Upload Flow

1. **User uploads image** → Frontend sends to `/api/upload`
2. **API uploads to Cloudinary** → Gets secure HTTPS URL
3. **URL stored in PostgreSQL** → Only the URL string, not the image
4. **Frontend displays image** → Uses Cloudinary URL directly

## Migration Script

To migrate existing local images to Cloudinary:

```bash
npm run migrate-images-cloudinary
```

This script:
- Finds all local image paths (`/uploads/...`) in database
- Uploads them to Cloudinary
- Updates database records with Cloudinary URLs
- Handles inventory, purchase orders, and sales images

## Environment Variables Required

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
DATABASE_URL=your_postgresql_url
```

