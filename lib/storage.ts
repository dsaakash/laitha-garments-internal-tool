// Simple in-memory storage (can be replaced with database later)
// In production, use a proper database like PostgreSQL, MongoDB, etc.

export interface InventoryItem {
  id: string
  dressName: string
  dressType: string
  dressCode: string
  sizes: string[]
  wholesalePrice: number
  sellingPrice: number
  imageUrl?: string
  fabricType?: string
  supplierName?: string
  supplierAddress?: string
  supplierPhone?: string
  quantityIn?: number
  quantityOut?: number
  currentStock?: number
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  date: string
  partyName: string
  customerId?: string // Link to customer if exists
  billNumber: string
  items: SaleItem[]
  totalAmount: number
  paymentMode: string
  upiTransactionId?: string
  saleImage?: string // Image captured as proof of sale
  createdAt: string
}

export interface SaleItem {
  inventoryId: string
  dressName: string
  dressType: string
  dressCode: string
  size: string
  quantity: number
  purchasePrice: number
  sellingPrice: number
  profit: number
}

export interface BusinessProfile {
  businessName: string
  ownerName: string
  email: string
  phone: string
  address: string
  gstNumber?: string
  whatsappNumber: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export interface Catalogue {
  id: string
  name: string
  description?: string
  items: string[] // Array of inventory item IDs
  createdAt: string
  updatedAt: string
}

export interface SupplierContact {
  id?: string
  contactName: string
  phone: string
  whatsappNumber?: string
  isPrimary?: boolean
}

export interface Supplier {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  gstNumber?: string
  gstPercentage?: number
  gstAmountRupees?: number
  gstType?: 'percentage' | 'rupees'
  contacts?: SupplierContact[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id?: string
  productName: string
  category?: string
  sizes: string[]
  fabricType?: string
  quantity: number
  pricePerPiece: number
  totalAmount: number
  productImages?: string[]
}

export interface PurchaseOrder {
  id: string
  date: string
  supplierId: string
  supplierName: string
  customPoNumber?: string
  items: PurchaseOrderItem[] // Multiple products
  invoiceImage?: string
  subtotal: number
  gstAmount: number
  grandTotal: number
  gstType?: 'percentage' | 'rupees'
  gstPercentage?: number
  gstAmountRupees?: number
  notes?: string
  createdAt: string
  // Legacy fields for backward compatibility
  productName?: string
  productImage?: string
  sizes?: string[]
  fabricType?: string
  quantity?: number
  pricePerPiece?: number
  totalAmount?: number
}

// In-memory storage (will be lost on server restart)
// In production, replace with database
let inventory: InventoryItem[] = []
let sales: Sale[] = []
let businessProfile: BusinessProfile | null = null
let customers: Customer[] = []
let catalogues: Catalogue[] = []
let suppliers: Supplier[] = []
let purchaseOrders: PurchaseOrder[] = []

export const storage = {
  // Inventory
  getInventory: (): InventoryItem[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lalitha_inventory')
      return stored ? JSON.parse(stored) : []
    }
    return inventory
  },
  
  addInventory: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const items = storage.getInventory()
    items.push(newItem)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_inventory', JSON.stringify(items))
    } else {
      inventory = items
    }
    return newItem
  },
  
  updateInventory: (id: string, updates: Partial<InventoryItem>): InventoryItem | null => {
    const items = storage.getInventory()
    const index = items.findIndex(item => item.id === id)
    if (index === -1) return null
    
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_inventory', JSON.stringify(items))
    } else {
      inventory = items
    }
    return items[index]
  },
  
  deleteInventory: (id: string): boolean => {
    const items = storage.getInventory()
    const filtered = items.filter(item => item.id !== id)
    if (filtered.length === items.length) return false
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_inventory', JSON.stringify(filtered))
    } else {
      inventory = filtered
    }
    return true
  },
  
  // Sales
  getSales: (): Sale[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lalitha_sales')
      return stored ? JSON.parse(stored) : []
    }
    return sales
  },
  
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>): Sale => {
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    const allSales = storage.getSales()
    allSales.push(newSale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_sales', JSON.stringify(allSales))
    } else {
      sales = allSales
    }
    return newSale
  },
  
  // Business Profile
  getBusinessProfile: (): BusinessProfile | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lalitha_business_profile')
      return stored ? JSON.parse(stored) : null
    }
    return businessProfile
  },
  
  updateBusinessProfile: (profile: BusinessProfile): BusinessProfile => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_business_profile', JSON.stringify(profile))
    } else {
      businessProfile = profile
    }
    return profile
  },
  
  // Customers
  getCustomers: (): Customer[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lalitha_customers')
      return stored ? JSON.parse(stored) : []
    }
    return customers
  },
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const allCustomers = storage.getCustomers()
    allCustomers.push(newCustomer)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_customers', JSON.stringify(allCustomers))
    } else {
      customers = allCustomers
    }
    return newCustomer
  },
  
  updateCustomer: (id: string, updates: Partial<Customer>): Customer | null => {
    const allCustomers = storage.getCustomers()
    const index = allCustomers.findIndex(c => c.id === id)
    if (index === -1) return null
    
    allCustomers[index] = {
      ...allCustomers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_customers', JSON.stringify(allCustomers))
    } else {
      customers = allCustomers
    }
    return allCustomers[index]
  },
  
  deleteCustomer: (id: string): boolean => {
    const allCustomers = storage.getCustomers()
    const filtered = allCustomers.filter(c => c.id !== id)
    if (filtered.length === allCustomers.length) return false
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_customers', JSON.stringify(filtered))
    } else {
      customers = filtered
    }
    return true
  },
  
  // Catalogues
  getCatalogues: (): Catalogue[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lalitha_catalogues')
      return stored ? JSON.parse(stored) : []
    }
    return catalogues
  },
  
  addCatalogue: (catalogue: Omit<Catalogue, 'id' | 'createdAt' | 'updatedAt'>): Catalogue => {
    const newCatalogue: Catalogue = {
      ...catalogue,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const allCatalogues = storage.getCatalogues()
    allCatalogues.push(newCatalogue)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_catalogues', JSON.stringify(allCatalogues))
    } else {
      catalogues = allCatalogues
    }
    return newCatalogue
  },
  
  updateCatalogue: (id: string, updates: Partial<Catalogue>): Catalogue | null => {
    const allCatalogues = storage.getCatalogues()
    const index = allCatalogues.findIndex(c => c.id === id)
    if (index === -1) return null
    
    allCatalogues[index] = {
      ...allCatalogues[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_catalogues', JSON.stringify(allCatalogues))
    } else {
      catalogues = allCatalogues
    }
    return allCatalogues[index]
  },
  
  deleteCatalogue: (id: string): boolean => {
    const allCatalogues = storage.getCatalogues()
    const filtered = allCatalogues.filter(c => c.id !== id)
    if (filtered.length === allCatalogues.length) return false
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_catalogues', JSON.stringify(filtered))
    } else {
      catalogues = filtered
    }
    return true
  },
  
  // Suppliers
  getSuppliers: (): Supplier[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lalitha_suppliers')
      return stored ? JSON.parse(stored) : []
    }
    return suppliers
  },
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const allSuppliers = storage.getSuppliers()
    allSuppliers.push(newSupplier)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_suppliers', JSON.stringify(allSuppliers))
    } else {
      suppliers = allSuppliers
    }
    return newSupplier
  },
  
  updateSupplier: (id: string, updates: Partial<Supplier>): Supplier | null => {
    const allSuppliers = storage.getSuppliers()
    const index = allSuppliers.findIndex(s => s.id === id)
    if (index === -1) return null
    
    allSuppliers[index] = {
      ...allSuppliers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_suppliers', JSON.stringify(allSuppliers))
    } else {
      suppliers = allSuppliers
    }
    return allSuppliers[index]
  },
  
  deleteSupplier: (id: string): boolean => {
    const allSuppliers = storage.getSuppliers()
    const filtered = allSuppliers.filter(s => s.id !== id)
    if (filtered.length === allSuppliers.length) return false
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_suppliers', JSON.stringify(filtered))
    } else {
      suppliers = filtered
    }
    return true
  },
  
  // Purchase Orders
  getPurchaseOrders: (): PurchaseOrder[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lalitha_purchase_orders')
      const orders = stored ? JSON.parse(stored) : []
      // Migrate old orders without sizes field
      return orders.map((order: any) => ({
        ...order,
        sizes: order.sizes || ['Standard'], // Default for old orders
      }))
    }
    return purchaseOrders.map(order => ({
      ...order,
      sizes: order.sizes || ['Standard'],
    }))
  },
  
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt'>): PurchaseOrder => {
    const newOrder: PurchaseOrder = {
      ...order,
      sizes: order.sizes || ['Standard'], // Default sizes if not provided
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    const allOrders = storage.getPurchaseOrders()
    allOrders.push(newOrder)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_purchase_orders', JSON.stringify(allOrders))
    } else {
      purchaseOrders = allOrders
    }
    return newOrder
  },
  
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>): PurchaseOrder | null => {
    const allOrders = storage.getPurchaseOrders()
    const index = allOrders.findIndex(o => o.id === id)
    if (index === -1) return null
    
    // Recalculate total if quantity or price changes
    if (updates.quantity !== undefined || updates.pricePerPiece !== undefined) {
      const quantity = updates.quantity ?? allOrders[index].quantity ?? 0
      const pricePerPiece = updates.pricePerPiece ?? allOrders[index].pricePerPiece ?? 0
      updates.totalAmount = quantity * pricePerPiece
    }
    
    // Ensure sizes array exists for old orders
    const existingOrder = allOrders[index]
    if (!existingOrder.sizes || existingOrder.sizes.length === 0) {
      existingOrder.sizes = ['Standard'] // Default for old orders
    }
    
    allOrders[index] = {
      ...existingOrder,
      ...updates,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_purchase_orders', JSON.stringify(allOrders))
    } else {
      purchaseOrders = allOrders
    }
    return allOrders[index]
  },
  
  deletePurchaseOrder: (id: string): boolean => {
    const allOrders = storage.getPurchaseOrders()
    const filtered = allOrders.filter(o => o.id !== id)
    if (filtered.length === allOrders.length) return false
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalitha_purchase_orders', JSON.stringify(filtered))
    } else {
      purchaseOrders = filtered
    }
    return true
  },
}

