# High Level Design (HLD)
## Lalitha Garments - Inventory & Sales Management System

**Version:** 1.0  
**Last Updated:** January 2025

---

## 1. System Overview

Lalitha Garments is a **monolithic Next.js application** with clear separation between:
- **Presentation Layer:** React components
- **Application Layer:** Next.js API routes
- **Data Layer:** PostgreSQL database
- **Storage Layer:** Cloudinary for images

---

## 2. System Components

### 2.1 Frontend Components

```
┌─────────────────────────────────────────────────┐
│           Frontend (React/Next.js)              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ Admin Pages  │  │ Public Pages │           │
│  │              │  │              │           │
│  │ - Dashboard  │  │ - Catalogue  │           │
│  │ - Inventory  │  │ - Inquiry    │           │
│  │ - Purchases  │  │              │           │
│  │ - Sales      │  │              │           │
│  │ - Suppliers  │  │              │           │
│  │ - Customers  │  │              │           │
│  │ - Workflows  │  │              │           │
│  └──────────────┘  └──────────────┘           │
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │      Shared Components               │     │
│  │  - AdminLayout (Sidebar)             │     │
│  │  - Forms, Modals, Tables             │     │
│  └──────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2.2 Backend Components

```
┌─────────────────────────────────────────────────┐
│         Backend (Next.js API Routes)             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  CRUD APIs   │  │  Utility APIs│            │
│  │              │  │              │            │
│  │ - Inventory  │  │ - Upload     │            │
│  │ - Purchases  │  │ - Auth       │            │
│  │ - Sales      │  │ - Business   │            │
│  │ - Suppliers  │  │ - Stock      │            │
│  │ - Customers  │  │ - Workflows  │            │
│  │ - Catalogues │  │              │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2.3 Data Layer

```
┌─────────────────────────────────────────────────┐
│         PostgreSQL Database                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Core Tables:                                   │
│  - admins, business_profile                     │
│  - suppliers, customers                         │
│  - inventory                                    │
│  - purchase_orders, purchase_order_items       │
│  - sales, sale_items                           │
│  - catalogues                                  │
│  - workflows, workflow_steps                    │
│                                                 │
│  Relationships:                                 │
│  - Foreign keys for data integrity              │
│  - JSONB for flexible data (images, arrays)     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 3. Module Design

### 3.1 Inventory Module

**Purpose:** Manage product inventory

**Components:**
- Inventory List Page
- Add/Edit Inventory Form
- Stock Management (Individual & Bulk)
- Search & Filter
- Export to Excel

**Data Flow:**
```
User Action → Form Submit → API Route → Database → Response → UI Update
```

**Key Features:**
- Multiple images per product
- Pricing options (piece/meter)
- Stock tracking (in/out)
- Supplier linking

### 3.2 Purchase Order Module

**Purpose:** Manage supplier purchase orders

**Components:**
- Purchase Order List
- Add/Edit PO Form (Multiple Products)
- PO Detail View
- Filter & Search
- Export to Excel

**Data Flow:**
```
Create PO → Validate → Calculate Totals → Insert PO → Insert Items → Update Inventory Stock → Return Response
```

**Key Features:**
- Multiple products per order
- GST calculation (percentage/rupees)
- Invoice image upload
- Custom PO numbers
- Automatic stock increase

### 3.3 Sales Module

**Purpose:** Record and manage sales

**Components:**
- Sales List
- Record Sale Form
- Sale Detail View
- Filter by Date
- Webcam Capture

**Data Flow:**
```
Record Sale → Calculate Totals (with discount/GST) → Insert Sale → Insert Items → Update Inventory Stock → Return Response
```

**Key Features:**
- Multiple items per sale
- Discount (percentage/rupees)
- GST (percentage/rupees)
- Per meter pricing option
- Sale proof image (webcam)
- Automatic stock decrease
- Profit calculation

### 3.4 Supplier Module

**Purpose:** Manage supplier information

**Components:**
- Supplier List
- Add/Edit Supplier Form
- Contact Management

**Key Features:**
- Multiple contact persons
- GST configuration
- Contact details (phone, WhatsApp)

### 3.5 Authentication Module

**Purpose:** Secure admin access

**Components:**
- Login Page
- Session Management
- Protected Routes

**Flow:**
```
Login → Validate Credentials → Create Session → Set Cookie → Redirect to Dashboard
```

---

## 4. Data Models

### 4.1 Inventory Item
```typescript
{
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
  productImages?: string[]  // Cloudinary URLs
  fabricType?: string
  supplierName?: string
  quantityIn: number
  quantityOut: number
  currentStock: number
}
```

### 4.2 Purchase Order
```typescript
{
  id: string
  date: string
  supplierId: string
  supplierName: string
  customPoNumber?: string
  items: PurchaseOrderItem[]
  subtotal: number
  gstType?: 'percentage' | 'rupees'
  gstPercentage?: number
  gstAmount?: number
  grandTotal: number
  invoiceImage?: string  // Cloudinary URL
}
```

### 4.3 Sale
```typescript
{
  id: string
  date: string
  partyName: string
  customerId?: string
  billNumber: string
  items: SaleItem[]
  subtotal: number
  discountType?: 'percentage' | 'rupees'
  discountAmount?: number
  gstType?: 'percentage' | 'rupees'
  gstAmount?: number
  totalAmount: number
  saleImage?: string  // Cloudinary URL
}
```

---

## 5. API Design

### 5.1 RESTful Endpoints

**Inventory:**
- `GET /api/inventory` - List all items (with search)
- `POST /api/inventory` - Create item
- `PUT /api/inventory/[id]` - Update item
- `DELETE /api/inventory/[id]` - Delete item

**Purchase Orders:**
- `GET /api/purchases` - List all orders (with filters)
- `POST /api/purchases` - Create order
- `PUT /api/purchases/[id]` - Update order
- `DELETE /api/purchases/[id]` - Delete order

**Sales:**
- `GET /api/sales` - List all sales (with filters)
- `POST /api/sales` - Create sale

**Upload:**
- `POST /api/upload` - Upload image to Cloudinary

### 5.2 Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

---

## 6. Security Design

### 6.1 Authentication Flow
```
1. User enters credentials
2. Backend validates against database
3. Create session token
4. Set HTTP-only cookie
5. Validate on each protected route
```

### 6.2 Authorization
- All admin routes require authentication
- Session validation on API routes
- No role-based access (all admins have same permissions)

---

## 7. Image Storage Design

### 7.1 Upload Flow
```
1. User selects image(s)
2. Frontend sends to /api/upload
3. API converts to base64
4. Upload to Cloudinary
5. Return secure URL
6. Store URL in database
```

### 7.2 Storage Strategy
- **Primary:** Cloudinary (cloud storage)
- **Database:** Store URLs only (TEXT/JSONB)
- **No local storage:** All images in Cloudinary

---

## 8. Stock Management Design

### 8.1 Stock Updates
- **Purchase Orders:** Increase `quantity_in` and `current_stock`
- **Sales:** Increase `quantity_out` and decrease `current_stock`
- **Manual Adjustments:** Direct stock updates via API

### 8.2 Stock Tracking
- `quantity_in`: Total quantity received
- `quantity_out`: Total quantity sold
- `current_stock`: Current available stock (calculated)

---

## 9. Workflow System Design

### 9.1 Custom Workflows
- **Definition:** Workflow with multiple steps
- **Steps:** Each step has route, description, icon
- **Connections:** Steps can be connected (visual flow)
- **Integration:** Workflows appear in setup wizard

### 9.2 Visual Canvas
- **Drag-and-drop:** Operations from palette
- **Node-based:** Each operation is a node
- **Connections:** Visual connections between nodes
- **Storage:** Connections saved in `widgetConfig`

---

## 10. Export Functionality

### 10.1 Excel Export
- **Library:** xlsx (SheetJS)
- **Format:** .xlsx files
- **Features:**
  - Column width optimization
  - Date-stamped filenames
  - All relevant data included

---

## 11. UI/UX Design Principles

1. **Responsive:** Mobile-first design
2. **Intuitive:** Clear navigation and labels
3. **Consistent:** Uniform styling and components
4. **Accessible:** Proper form labels and structure
5. **Fast:** Optimized loading and interactions

---

## 12. Error Handling Strategy

### 12.1 Frontend
- Try-catch for API calls
- User-friendly error messages
- Form validation before submission

### 12.2 Backend
- Try-catch in all routes
- Proper HTTP status codes
- Detailed error logging
- Safe error messages to client

---

## 13. Performance Considerations

1. **Database:** Indexed columns for fast queries
2. **Images:** CDN delivery via Cloudinary
3. **API:** Efficient queries with proper joins
4. **Frontend:** Optimized React rendering

---

## 14. Scalability Design

### 14.1 Current Architecture
- Stateless API routes
- External database
- External image storage
- Serverless-ready

### 14.2 Future Enhancements
- Caching layer (Redis)
- Read replicas for database
- API rate limiting
- Background job processing

---

## 15. Integration Points

1. **Cloudinary:** Image upload and storage
2. **PostgreSQL:** All data persistence
3. **Browser APIs:** Webcam, File API, Web Share API
4. **External Services:** Ready for WhatsApp integration

