# Product Requirements Document (PRD)
## Lalitha Garments - Inventory & Sales Management System

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production

---

## 1. Executive Summary

Lalitha Garments is a comprehensive inventory and sales management system designed for a clothing retail business. The system manages inventory, purchase orders, suppliers, customers, sales, and provides a public-facing product catalogue.

---

## 2. Product Overview

### 2.1 Purpose
A full-stack web application for managing:
- Product inventory with multiple images
- Purchase orders from suppliers
- Customer database
- Sales and invoicing
- Product catalogue for customers
- Business profile and settings

### 2.2 Target Users
- **Primary:** Business owners/administrators
- **Secondary:** Customers (public catalogue view)

---

## 3. Core Features

### 3.1 Inventory Management
- **Add/Edit/Delete** inventory items
- **Multiple images** per product
- **Pricing options:**
  - Standard pricing (wholesale/selling)
  - Optional: Price per piece
  - Optional: Price per meter
- **Product details:**
  - Dress name, type, code
  - Sizes (multiple)
  - Fabric type
  - Supplier information
- **Stock tracking:**
  - Quantity in/out
  - Current stock
  - Bulk stock updates
  - Individual stock adjustments
- **Search functionality:** By code, name, or supplier
- **Export to Excel:** Complete inventory data

### 3.2 Purchase Orders
- **Create purchase orders** with multiple products
- **Supplier management:**
  - Multiple contact persons per supplier
  - GST configuration (percentage or fixed amount)
  - Contact details (phone, WhatsApp)
- **Product details per order:**
  - Multiple products per PO
  - Product images
  - Category, sizes, fabric type
  - Quantity and price per piece
- **GST calculation:**
  - Percentage-based or fixed rupee amount
  - Auto-calculated in totals
- **Custom PO numbers:** Optional custom numbering
- **Invoice image upload:** Attach supplier invoices
- **Filtering:** By supplier, category, year, month
- **Search:** By supplier name
- **Export to Excel:** Complete purchase order data
- **Automatic stock updates:** Increases inventory stock on PO creation

### 3.3 Sales Management
- **Record sales** with multiple items
- **Customer selection:** Link to customer database or manual entry
- **Pricing options:**
  - Standard quantity-based pricing
  - Optional: Per meter pricing (for fabric/material items)
- **Discount options:**
  - Percentage-based discount
  - Fixed rupee amount discount
- **GST options:**
  - Percentage-based GST
  - Fixed rupee amount GST
- **Payment modes:** Cash, UPI (PhonePe, Paytm), Bank Transfer
- **Sale proof image:** Webcam capture with sticker overlay
- **Automatic stock updates:** Decreases inventory stock on sale
- **Profit calculation:** Automatic profit tracking per sale
- **Filtering:** By month and year

### 3.4 Supplier Management
- **Add/Edit/Delete** suppliers
- **Multiple contact persons:**
  - Name, phone, WhatsApp number
  - Primary contact designation
- **GST configuration:**
  - GST number
  - GST type (percentage or rupees)
  - GST percentage or fixed amount
- **Contact information:** Address, email, phone

### 3.5 Customer Management
- **Add/Edit/Delete** customers
- **Customer details:** Name, phone, email, address
- **Link to sales:** Track customer purchase history

### 3.6 Catalogue Management
- **Create catalogues:** Group products into collections
- **Public-facing:** Display products to customers
- **Category filters:** Filter by product type

### 3.7 Business Setup
- **Business profile:** Name, owner, contact details
- **GST number:** Business GST registration
- **WhatsApp integration:** Business WhatsApp number
- **Setup wizard:** Guided setup process

### 3.8 Custom Workflows
- **Create custom workflows:** Define business processes
- **Workflow steps:** Multiple steps with routes and descriptions
- **Visual canvas:** Drag-and-drop workflow builder
- **Operation connections:** Link workflow steps visually
- **Setup wizard integration:** Custom workflows appear in setup

### 3.9 Dashboard
- **Sales statistics:** Total sales, profit
- **Inventory overview:** Stock levels
- **Recent activity:** Latest sales and orders

### 3.10 Authentication
- **Admin login:** Secure authentication
- **Multiple admins:** Support for multiple admin accounts
- **Session management:** Cookie-based sessions

---

## 4. Technical Requirements

### 4.1 Image Storage
- **Cloudinary integration:** All images stored in Cloudinary
- **Multiple images:** Support for multiple product images
- **Automatic optimization:** Cloudinary CDN delivery
- **Secure URLs:** HTTPS image URLs

### 4.2 Data Storage
- **PostgreSQL database:** All data stored in PostgreSQL
- **URL storage:** Image URLs stored (not binary data)
- **JSONB support:** For arrays and complex data

### 4.3 Export Functionality
- **Excel export:** Inventory and purchase orders
- **Formatted data:** Column widths and formatting
- **Date-stamped filenames:** Automatic filename generation

---

## 5. User Stories

### 5.1 Inventory Manager
- As an admin, I want to add products with multiple images so customers can see all angles
- As an admin, I want to set pricing per piece or per meter depending on product type
- As an admin, I want to track stock levels automatically based on purchases and sales
- As an admin, I want to bulk update stock for multiple items at once

### 5.2 Purchase Manager
- As an admin, I want to create purchase orders with multiple products from the same supplier
- As an admin, I want to apply GST (percentage or fixed) to purchase orders
- As an admin, I want to upload invoice images for purchase orders
- As an admin, I want to see all purchase orders filtered by supplier, category, or date

### 5.3 Sales Manager
- As an admin, I want to record sales with discount and GST options
- As an admin, I want to use per meter pricing for fabric items
- As an admin, I want to capture sale proof images with webcam
- As an admin, I want to see profit calculations automatically

### 5.4 Business Owner
- As a business owner, I want to see dashboard statistics
- As a business owner, I want to export data to Excel for analysis
- As a business owner, I want to configure custom workflows for my business processes

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Fast page load times
- Efficient database queries
- Image optimization via Cloudinary CDN

### 6.2 Security
- Secure authentication
- Password hashing (bcrypt)
- Session management
- Input validation

### 6.3 Scalability
- Cloud-based image storage
- Database-backed data storage
- Support for multiple admins

### 6.4 Usability
- Responsive design (mobile-friendly)
- Intuitive UI/UX
- Clear navigation
- Search and filter capabilities

---

## 7. Future Enhancements (Out of Scope)

- Mobile app
- Barcode scanning
- Advanced reporting and analytics
- Email notifications
- SMS integration
- Multi-currency support
- Warehouse management
- Employee management

---

## 8. Success Metrics

- All inventory items have images
- Stock levels accurately tracked
- Sales recorded with proof images
- Purchase orders linked to inventory
- Export functionality working
- All images stored in Cloudinary

---

## 9. Dependencies

- Next.js 14
- PostgreSQL database
- Cloudinary for image storage
- React 18
- TypeScript
- Tailwind CSS

---

## 10. Approval

**Status:** ✅ Approved and Implemented  
**Version:** 1.0  
**Date:** January 2025

