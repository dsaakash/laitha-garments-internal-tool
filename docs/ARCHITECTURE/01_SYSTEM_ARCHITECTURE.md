# System Architecture
## Lalitha Garments - Inventory & Sales Management System

**Version:** 1.0  
**Last Updated:** January 2025

---

## 1. Architecture Overview

Lalitha Garments is built as a **full-stack Next.js application** with:
- **Frontend:** React with TypeScript
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **Image Storage:** Cloudinary
- **Deployment:** Serverless-ready (Vercel/Render compatible)

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admin UI   │  │  Public UI   │  │  Catalogue   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │      Next.js Application           │
          │  ┌──────────────────────────────┐  │
          │  │     API Routes (Backend)    │  │
          │  │  - /api/inventory            │  │
          │  │  - /api/purchases            │  │
          │  │  - /api/sales                │  │
          │  │  - /api/suppliers            │  │
          │  │  - /api/customers            │  │
          │  │  - /api/upload               │  │
          │  │  - /api/auth                 │  │
          │  └──────────────┬───────────────┘  │
          └─────────────────┼──────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │PostgreSQL │    │ Cloudinary │    │  File     │
    │ Database  │    │   (CDN)    │    │  System   │
    └───────────┘    └────────────┘    └───────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Icons:** SVG (inline)
- **Date Handling:** date-fns
- **Excel Export:** xlsx (SheetJS)
- **PDF Generation:** jspdf, jspdf-autotable

### 3.2 Backend
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Database Client:** pg (PostgreSQL)
- **Authentication:** bcryptjs (password hashing)
- **Session Management:** Cookies
- **Image Upload:** Cloudinary SDK

### 3.3 Database
- **Type:** PostgreSQL
- **Connection:** Connection pooling via `pg`
- **Schema:** Relational database with JSONB support

### 3.4 External Services
- **Image Storage:** Cloudinary
  - CDN delivery
  - Automatic optimization
  - Secure HTTPS URLs

---

## 4. Application Structure

```
clothing_lalitha_garments/
├── app/
│   ├── admin/              # Admin dashboard pages
│   │   ├── dashboard/      # Dashboard with statistics
│   │   ├── inventory/      # Inventory management
│   │   ├── purchases/      # Purchase orders
│   │   ├── sales/          # Sales recording
│   │   ├── suppliers/      # Supplier management
│   │   ├── customers/      # Customer management
│   │   ├── catalogues/    # Catalogue management
│   │   ├── invoices/       # Invoice viewing
│   │   ├── setup/          # Setup wizard
│   │   └── workflows/      # Custom workflows
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication
│   │   ├── inventory/     # Inventory CRUD
│   │   ├── purchases/      # Purchase orders CRUD
│   │   ├── sales/          # Sales CRUD
│   │   ├── suppliers/      # Suppliers CRUD
│   │   ├── customers/      # Customers CRUD
│   │   ├── catalogues/     # Catalogues CRUD
│   │   ├── business/       # Business profile
│   │   ├── upload/         # Image upload to Cloudinary
│   │   ├── stock-movements/# Stock tracking
│   │   └── workflows/      # Workflows CRUD
│   ├── catalogue/          # Public catalogue page
│   └── custom-inquiry/     # Public inquiry form
├── components/             # Reusable React components
│   ├── AdminLayout.tsx     # Admin sidebar layout
│   └── Footer.tsx          # Footer component
├── lib/                     # Utility libraries
│   ├── db.ts               # Database connection
│   ├── db-auth.ts          # Authentication logic
│   ├── storage.ts           # TypeScript interfaces
│   └── utils.ts             # Utility functions
├── scripts/                 # Database scripts
│   ├── init-db.sql         # Database schema
│   ├── init-db.js          # Database initialization
│   ├── migrate-*.sql       # Migration scripts
│   └── migrate-*.js        # Migration runners
├── public/                  # Static assets
│   └── uploads/            # Local uploads (legacy)
└── docs/                    # Documentation
```

---

## 5. Data Flow

### 5.1 Image Upload Flow
```
User Uploads Image
    ↓
Frontend: FormData → /api/upload
    ↓
API: Convert to base64 → Upload to Cloudinary
    ↓
Cloudinary: Store image → Return secure URL
    ↓
API: Return URL to Frontend
    ↓
Frontend: Store URL in form state
    ↓
Form Submit: Send URL to inventory/purchase/sales API
    ↓
API: Store URL in PostgreSQL (TEXT/JSONB column)
```

### 5.2 Purchase Order Flow
```
Create Purchase Order
    ↓
Frontend: Collect items, supplier, GST info
    ↓
API: Calculate totals (subtotal, GST, grand total)
    ↓
Database: Insert into purchase_orders
    ↓
Database: Insert items into purchase_order_items
    ↓
Database: Update inventory (increase stock)
    ↓
Response: Return created PO with all details
```

### 5.3 Sales Flow
```
Record Sale
    ↓
Frontend: Collect items, customer, discount, GST
    ↓
API: Calculate totals (subtotal, discount, GST, final)
    ↓
Database: Insert into sales
    ↓
Database: Insert items into sale_items
    ↓
Database: Update inventory (decrease stock)
    ↓
Response: Return created sale
```

---

## 6. Database Architecture

### 6.1 Core Tables
- **admins:** Admin user accounts
- **business_profile:** Business information
- **suppliers:** Supplier details with contacts
- **customers:** Customer database
- **inventory:** Product inventory
- **purchase_orders:** Purchase orders header
- **purchase_order_items:** Purchase order line items
- **sales:** Sales header
- **sale_items:** Sales line items
- **catalogues:** Product catalogues
- **workflows:** Custom workflows
- **workflow_steps:** Workflow step definitions

### 6.2 Relationships
```
suppliers (1) ──→ (many) purchase_orders
purchase_orders (1) ──→ (many) purchase_order_items
inventory (1) ──→ (many) sale_items
customers (1) ──→ (many) sales
sales (1) ──→ (many) sale_items
workflows (1) ──→ (many) workflow_steps
```

---

## 7. Security Architecture

### 7.1 Authentication
- **Password Hashing:** bcryptjs (salt rounds: 10)
- **Session Management:** Cookie-based sessions
- **Session Token:** JWT-like token stored in cookie
- **Protected Routes:** Admin pages require authentication

### 7.2 Data Security
- **Input Validation:** All API endpoints validate input
- **SQL Injection Prevention:** Parameterized queries
- **XSS Prevention:** React's built-in escaping
- **Environment Variables:** Sensitive data in .env

---

## 8. Deployment Architecture

### 8.1 Recommended: Vercel/Render
- **Frontend:** Next.js static/SSR
- **API Routes:** Serverless functions
- **Database:** External PostgreSQL (Neon, Supabase, etc.)
- **Images:** Cloudinary (external CDN)

### 8.2 Environment Variables
```env
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 9. Scalability Considerations

### 9.1 Current Design
- **Stateless API:** All state in database
- **Connection Pooling:** Database connection pooling
- **CDN for Images:** Cloudinary provides global CDN
- **Serverless Ready:** API routes are serverless functions

### 9.2 Future Scaling
- **Database:** Can scale PostgreSQL (read replicas)
- **API:** Serverless auto-scales
- **Images:** Cloudinary handles scaling automatically
- **Caching:** Can add Redis for session/cache

---

## 10. Error Handling

### 10.1 Frontend
- Try-catch blocks for API calls
- User-friendly error messages
- Form validation before submission

### 10.2 Backend
- Try-catch in all API routes
- Database error handling
- Cloudinary error handling
- Proper HTTP status codes

---

## 11. Performance Optimizations

1. **Database Indexes:** On frequently queried columns
2. **Image Optimization:** Cloudinary automatic optimization
3. **Lazy Loading:** Images loaded on demand
4. **Pagination:** Can be added for large datasets
5. **Connection Pooling:** Efficient database connections

---

## 12. Monitoring & Logging

### 12.1 Current
- Console logging for errors
- Database query logging (development)

### 12.2 Recommended Additions
- Error tracking (Sentry)
- Performance monitoring
- Database query monitoring
- Cloudinary usage tracking

---

## 13. Backup & Recovery

### 13.1 Database
- PostgreSQL automated backups (managed service)
- Manual backup scripts available

### 13.2 Images
- Cloudinary automatic backups
- Version history in Cloudinary

---

## 14. API Design Principles

1. **RESTful:** Standard HTTP methods (GET, POST, PUT, DELETE)
2. **Consistent:** Uniform response format
3. **Error Handling:** Proper error messages
4. **Validation:** Input validation on all endpoints
5. **Security:** Authentication on protected routes

---

## 15. Code Organization

- **Separation of Concerns:** UI, API, Database layers
- **Type Safety:** TypeScript throughout
- **Reusability:** Shared components and utilities
- **Modularity:** Feature-based organization
- **Documentation:** Inline comments and docs

