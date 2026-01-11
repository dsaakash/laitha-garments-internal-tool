'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import { PurchaseOrder, PurchaseOrderItem, Supplier } from '@/lib/storage'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    supplierId: '',
    customPoNumber: '',
    useCustomPo: false,
    invoiceImage: '',
    notes: '',
    gstType: 'percentage' as 'percentage' | 'rupees',
    gstPercentage: 0,
    gstAmountRupees: 0,
  })
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      productName: '',
      category: '',
      sizes: [],
      fabricType: '',
      quantity: 0,
      pricePerPiece: 0,
      totalAmount: 0,
      productImages: [],
    }
  ])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadingInvoice, setUploadingInvoice] = useState(false)
  const invoiceFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSupplier, filterCategory, filterMonth, filterYear])

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDetailModal) {
          setShowDetailModal(false)
          setSelectedOrder(null)
        } else if (showModal) {
          setShowModal(false)
          resetForm()
        }
      }
    }

    if (showModal || showDetailModal) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [showModal, showDetailModal])

  const loadData = async () => {
    try {
      const [suppliersRes, ordersRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/purchases')
      ])
      
      const suppliersResult = await suppliersRes.json()
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data)
      }
      
      const ordersResult = await ordersRes.json()
      if (ordersResult.success) {
        setCategories(ordersResult.categories || ['All'])
        await loadOrders()
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadOrders = async () => {
    try {
      const url = new URL('/api/purchases', window.location.origin)
      if (filterCategory && filterCategory !== 'All') {
        url.searchParams.set('category', filterCategory)
      }
      
      const response = await fetch(url.toString())
      const result = await response.json()
      
      if (!result.success) {
        console.error('API error:', result.message || result.error)
        alert(`Failed to load purchase orders: ${result.message || 'Unknown error'}`)
        return
      }
      
      if (result.data && Array.isArray(result.data)) {
        let allOrders = result.data
        
        if (filterSupplier) {
          allOrders = allOrders.filter((order: PurchaseOrder) => order.supplierId === filterSupplier)
        }
        
        if (filterYear) {
          allOrders = allOrders.filter((order: PurchaseOrder) => {
            const orderYear = new Date(order.date).getFullYear().toString()
            return orderYear === filterYear
          })
        }
        
        if (filterMonth) {
          allOrders = allOrders.filter((order: PurchaseOrder) => {
            const orderMonth = (new Date(order.date).getMonth() + 1).toString().padStart(2, '0')
            return orderMonth === filterMonth
          })
        }
        
        // Search by supplier name
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          allOrders = allOrders.filter((order: PurchaseOrder) => 
            order.supplierName.toLowerCase().includes(query) ||
            (order.customPoNumber && order.customPoNumber.toLowerCase().includes(query)) ||
            (order.items && order.items.some(item => item.productName.toLowerCase().includes(query))) ||
            (order.productName && order.productName.toLowerCase().includes(query))
          )
        }
        
        allOrders.sort((a: PurchaseOrder, b: PurchaseOrder) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setOrders(allOrders)
        console.log(`Loaded ${allOrders.length} purchase orders`)
      } else {
        console.error('Invalid data format:', result)
        setOrders([])
      }
    } catch (error) {
      console.error('Failed to load purchase orders:', error)
      alert('Failed to load purchase orders. Please check the console for details.')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingIndex(itemIndex)
    try {
      const uploadedUrls: string[] = []
      
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          alert('Please select image files only')
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max size is 5MB`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        if (data.success) {
          uploadedUrls.push(data.url)
        }
      }
      
      if (uploadedUrls.length > 0) {
        setItems(prev => {
          const newItems = [...prev]
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            productImages: [...(newItems[itemIndex].productImages || []), ...uploadedUrls]
          }
          return newItems
        })
      }
    } catch (error) {
      alert('Failed to upload images. Please try again.')
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadingInvoice(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, invoiceImage: data.url }))
      } else {
        alert(data.message || 'Failed to upload invoice')
      }
    } catch (error) {
      alert('Failed to upload invoice. Please try again.')
    } finally {
      setUploadingInvoice(false)
    }
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      productName: '',
      category: '',
      sizes: [],
      fabricType: '',
      quantity: 0,
      pricePerPiece: 0,
      totalAmount: 0,
      productImages: [],
    }])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev]
      const item = { ...newItems[index] }
      
      if (field === 'sizes') {
        item.sizes = typeof value === 'string' 
          ? value.split(',').map(s => s.trim()).filter(Boolean)
          : value
      } else {
        (item as any)[field] = value
      }
      
      // Recalculate total
      if (field === 'quantity' || field === 'pricePerPiece') {
        item.totalAmount = item.quantity * item.pricePerPiece
      }
      
      newItems[index] = item
      return newItems
    })
  }

  const removeImage = (itemIndex: number, imageIndex: number) => {
    setItems(prev => {
      const newItems = [...prev]
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        productImages: newItems[itemIndex].productImages?.filter((_, i) => i !== imageIndex) || []
      }
      return newItems
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const supplier = suppliers.find(s => s.id === formData.supplierId)
    if (!supplier) {
      alert('Please select a supplier')
      return
    }

    // Validate items
    const validItems = items.filter(item => 
      item.productName && item.quantity > 0 && item.pricePerPiece > 0
    )

    if (validItems.length === 0) {
      alert('Please add at least one valid product')
      return
    }

    // Validate custom PO number if enabled
    if (formData.useCustomPo && !formData.customPoNumber.trim()) {
      alert('Please enter a custom PO number')
      return
    }

    try {
      const totals = calculateTotals()
      
      const payload = {
        date: formData.date,
        supplierId: formData.supplierId,
        supplierName: supplier.name,
        customPoNumber: formData.useCustomPo ? formData.customPoNumber : undefined,
        invoiceImage: formData.invoiceImage || undefined,
        items: validItems.map(item => ({
          productName: item.productName,
          category: item.category || 'Custom',
          sizes: item.sizes || [],
          fabricType: item.fabricType || undefined,
          quantity: Number(item.quantity) || 0, // Ensure quantity is an integer
          pricePerPiece: Number(item.pricePerPiece) || 0,
          totalAmount: Number(item.totalAmount) || 0,
          productImages: item.productImages || [],
        })),
        gstType: totals.gstType,
        gstPercentage: totals.gstPercentage || undefined,
        gstAmountRupees: totals.gstAmountRupees || undefined,
        notes: formData.notes || undefined,
      }

      let response
      if (editingOrder) {
        response = await fetch(`/api/purchases/${editingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      
      const result = await response.json()
      if (!result.success) {
        alert(`Failed to ${editingOrder ? 'update' : 'add'} purchase order: ${result.message || 'Unknown error'}`)
        return
      }
      
      alert(`Purchase order ${editingOrder ? 'updated' : 'added'}! Inventory updated automatically.`)
      
      resetForm()
      await loadOrders()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save purchase order:', error)
      alert('Failed to save purchase order')
    }
  }

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order)
    setFormData({
      date: order.date,
      supplierId: order.supplierId,
      customPoNumber: order.customPoNumber || '',
      useCustomPo: !!order.customPoNumber,
      invoiceImage: order.invoiceImage || '',
      notes: order.notes || '',
      gstType: order.gstType || 'percentage',
      gstPercentage: order.gstPercentage || 0,
      gstAmountRupees: order.gstAmountRupees || 0,
    })
    
    // Convert order to items format
    if (order.items && order.items.length > 0) {
      setItems(order.items.map(item => ({
        productName: item.productName,
        category: item.category || '',
        sizes: item.sizes || [],
        fabricType: item.fabricType || '',
        quantity: item.quantity,
        pricePerPiece: item.pricePerPiece,
        totalAmount: item.totalAmount,
        productImages: item.productImages || [],
      })))
    } else {
      // Legacy format
      setItems([{
        productName: order.productName || '',
        category: 'Custom',
        sizes: order.sizes || [],
        fabricType: order.fabricType || '',
        quantity: order.quantity || 0,
        pricePerPiece: order.pricePerPiece || 0,
        totalAmount: order.totalAmount || 0,
        productImages: order.productImage ? [order.productImage] : [],
      }])
    }
    
    setShowModal(true)
  }

  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      try {
        const response = await fetch(`/api/purchases/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to delete purchase order')
          return
        }
        await loadOrders()
      } catch (error) {
        console.error('Failed to delete purchase order:', error)
        alert('Failed to delete purchase order')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      supplierId: '',
      customPoNumber: '',
      useCustomPo: false,
      invoiceImage: '',
      notes: '',
      gstType: 'percentage',
      gstPercentage: 0,
      gstAmountRupees: 0,
    })
    setItems([{
      productName: '',
      category: '',
      sizes: [],
      fabricType: '',
      quantity: 0,
      pricePerPiece: 0,
      totalAmount: 0,
      productImages: [],
    }])
    setEditingOrder(null)
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0)
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)
    
    let gstAmount = 0
    let gstPercentage = 0
    let gstAmountRupees = 0
    let gstType: 'percentage' | 'rupees' = 'percentage'
    
    // Check if manual GST override is set
    if (formData.gstType === 'rupees' && formData.gstAmountRupees > 0) {
      gstType = 'rupees'
      gstAmountRupees = formData.gstAmountRupees
      gstAmount = gstAmountRupees
    } else if (formData.gstType === 'percentage' && formData.gstPercentage > 0) {
      gstType = 'percentage'
      gstPercentage = formData.gstPercentage
      gstAmount = (subtotal * gstPercentage) / 100
    } else if (selectedSupplier) {
      // Use supplier's GST settings
      if (selectedSupplier.gstType === 'rupees' && selectedSupplier.gstAmountRupees) {
        gstType = 'rupees'
        gstAmountRupees = selectedSupplier.gstAmountRupees
        gstAmount = gstAmountRupees
      } else if (selectedSupplier.gstPercentage) {
        gstType = 'percentage'
        gstPercentage = selectedSupplier.gstPercentage
        gstAmount = (subtotal * gstPercentage) / 100
      }
    }
    
    const grandTotal = subtotal + gstAmount
    
    return { subtotal, gstAmount, grandTotal, gstPercentage, gstAmountRupees, gstType }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const totals = calculateTotals()
  const totalAmount = orders.reduce((sum, order) => sum + (order.grandTotal || order.totalAmount || 0), 0)

  // Get available categories from inventory
  const availableCategories = ['Custom', 'Kurtis', 'Dresses', 'Sarees', 'Tops', 'Bottoms']

  const exportToExcel = () => {
    try {
      // Prepare data for export - flatten purchase orders with their items
      const exportData: any[] = []
      
      orders.forEach(order => {
        if (order.items && order.items.length > 0) {
          // If order has multiple items, create a row for each item
          order.items.forEach((item, index) => {
            exportData.push({
              'PO Number': order.customPoNumber || `PO-${order.id}`,
              'Date': format(new Date(order.date), 'dd/MM/yyyy'),
              'Supplier Name': order.supplierName,
              'Product Name': item.productName,
              'Category': item.category || '',
              'Sizes': Array.isArray(item.sizes) ? item.sizes.join(', ') : '',
              'Fabric Type': item.fabricType || '',
              'Quantity': item.quantity,
              'Price Per Piece (₹)': item.pricePerPiece,
              'Item Total (₹)': item.totalAmount,
              'Subtotal (₹)': order.subtotal || order.totalAmount,
              'GST Type': order.gstType || '',
              'GST Percentage': order.gstPercentage || '',
              'GST Amount (₹)': order.gstAmount || '',
              'Grand Total (₹)': order.grandTotal || order.totalAmount,
              'Notes': order.notes || '',
              'Created At': new Date(order.createdAt).toLocaleDateString(),
            })
          })
        } else {
          // Legacy single-item order
          exportData.push({
            'PO Number': order.customPoNumber || `PO-${order.id}`,
            'Date': format(new Date(order.date), 'dd/MM/yyyy'),
            'Supplier Name': order.supplierName,
            'Product Name': order.productName || '',
            'Category': '',
            'Sizes': Array.isArray(order.sizes) ? order.sizes.join(', ') : '',
            'Fabric Type': order.fabricType || '',
            'Quantity': order.quantity || 0,
            'Price Per Piece (₹)': order.pricePerPiece || 0,
            'Item Total (₹)': order.totalAmount,
            'Subtotal (₹)': order.subtotal || order.totalAmount,
            'GST Type': order.gstType || '',
            'GST Percentage': order.gstPercentage || '',
            'GST Amount (₹)': order.gstAmount || '',
            'Grand Total (₹)': order.grandTotal || order.totalAmount,
            'Notes': order.notes || '',
            'Created At': new Date(order.createdAt).toLocaleDateString(),
          })
        }
      })

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders')

      // Set column widths
      const colWidths = [
        { wch: 15 }, // PO Number
        { wch: 12 }, // Date
        { wch: 20 }, // Supplier Name
        { wch: 25 }, // Product Name
        { wch: 15 }, // Category
        { wch: 20 }, // Sizes
        { wch: 15 }, // Fabric Type
        { wch: 10 }, // Quantity
        { wch: 18 }, // Price Per Piece
        { wch: 15 }, // Item Total
        { wch: 15 }, // Subtotal
        { wch: 12 }, // GST Type
        { wch: 15 }, // GST Percentage
        { wch: 15 }, // GST Amount
        { wch: 15 }, // Grand Total
        { wch: 30 }, // Notes
        { wch: 12 }, // Created At
      ]
      ws['!cols'] = colWidths

      // Generate filename with current date
      const filename = `Purchase_Orders_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              disabled={suppliers.length === 0}
            >
              ➕ Add Purchase Order
            </button>
          </div>
        </div>

        {suppliers.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
            Please add suppliers first before creating purchase orders. <a href="/admin/suppliers" className="underline">Go to Suppliers</a>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Purchase Orders</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by supplier name, PO number, or product name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Supplier</label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            {(filterSupplier || filterCategory !== 'All' || filterMonth || filterYear || searchQuery) && (
              <button
                onClick={() => {
                  setFilterSupplier('')
                  setFilterCategory('All')
                  setFilterMonth('')
                  setFilterYear('')
                  setSearchQuery('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
            )}
          </div>
          {orders.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-lg font-bold text-green-600">
                Total Amount: ₹{totalAmount.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No purchase orders yet. Add your first purchase order!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-lg shadow-md p-4 lg:p-6 cursor-pointer hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-purple-200 relative"
                onClick={() => handleViewDetails(order)}
              >
                <div className="flex justify-between items-start mb-4 relative">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {order.customPoNumber || `PO-${order.id}`}
                      {(() => {
                        // Get product name(s)
                        let productName = ''
                        if (order.items && order.items.length > 0) {
                          const names = order.items.map(item => item.productName).filter(Boolean)
                          if (names.length === 1) {
                            productName = names[0]
                          } else if (names.length > 1) {
                            productName = `${names[0]}${names.length > 1 ? ` +${names.length - 1} more` : ''}`
                          }
                        } else if (order.productName) {
                          productName = order.productName
                        }
                        return productName ? ` - ${productName}` : ''
                      })()}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{order.supplierName}</p>
                    {order.items && order.items.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {order.items.length} product{order.items.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1 flex-shrink-0 z-10 relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(order)
                      }}
                      className="px-2 py-1.5 sm:px-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 rounded-md text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md border border-blue-200 min-w-[50px] sm:min-w-[60px] whitespace-nowrap"
                      title="Edit"
                    >
                      <span className="hidden sm:inline">✏️ </span>Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(order.id)
                      }}
                      className="px-2 py-1.5 sm:px-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 rounded-md text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md border border-red-200 min-w-[50px] sm:min-w-[60px] whitespace-nowrap"
                      title="Delete"
                    >
                      <span className="hidden sm:inline">🗑️ </span>Delete
                    </button>
                  </div>
                </div>
                
                {order.items && order.items.length > 0 && order.items[0].productImages && order.items[0].productImages.length > 0 ? (
                  <div className="relative w-full h-48 mb-4">
                    <Image
                      src={order.items[0].productImages[0]}
                      alt={order.items[0].productName}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ) : order.productImage ? (
                  <div className="relative w-full h-48 mb-4">
                    <Image
                      src={order.productImage}
                      alt={order.productName || 'Product'}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ) : null}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{format(new Date(order.date), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-700 font-medium">
                      ₹{(order.subtotal || order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  {order.gstAmount != null && order.gstAmount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">GST:</span>
                      <span className="text-gray-600">₹{order.gstAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t">
                    <span className="text-gray-900 font-bold">Total Amount:</span>
                    <span className="text-green-600 font-bold text-lg">
                      ₹{(order.grandTotal || order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingOrder ? 'Edit Purchase Order' : 'Add Purchase Order'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <select
                      required
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} {supplier.gstPercentage ? `(GST: ${supplier.gstPercentage}%)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomPo"
                    checked={formData.useCustomPo}
                    onChange={(e) => setFormData({ ...formData, useCustomPo: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="useCustomPo" className="text-sm font-medium text-gray-700">
                    Use Custom PO Number
                  </label>
                </div>

                {formData.useCustomPo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom PO Number *</label>
                    <input
                      type="text"
                      required={formData.useCustomPo}
                      value={formData.customPoNumber}
                      onChange={(e) => setFormData({ ...formData, customPoNumber: e.target.value })}
                      placeholder="e.g., PO-2024-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Products Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Products</h3>
                  </div>

                  {items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-700">Product {index + 1}</h4>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                          <input
                            type="text"
                            required
                            value={item.productName}
                            onChange={(e) => updateItem(index, 'productName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Category</option>
                            {availableCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type</label>
                          <input
                            type="text"
                            value={item.fabricType || ''}
                            onChange={(e) => updateItem(index, 'fabricType', e.target.value)}
                            placeholder="e.g., Cotton, Silk"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma-separated)</label>
                          <input
                            type="text"
                            value={item.sizes?.join(', ') || ''}
                            onChange={(e) => updateItem(index, 'sizes', e.target.value)}
                            placeholder="M, L, XL"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price per Piece (₹) *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.pricePerPiece}
                            onChange={(e) => updateItem(index, 'pricePerPiece', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (multiple allowed)</label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(e, index)}
                            disabled={uploadingIndex === index}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                          />
                          {uploadingIndex === index && (
                            <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                          )}
                          {item.productImages && item.productImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.productImages.map((img, imgIndex) => (
                                <div key={imgIndex} className="relative w-20 h-20">
                                  <Image
                                    src={img}
                                    alt={`Product ${index + 1} - Image ${imgIndex + 1}`}
                                    fill
                                    className="object-cover rounded border"
                                    sizes="80px"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index, imgIndex)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs z-10"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 bg-purple-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">Item Total:</span>
                            <span className="text-lg font-bold text-purple-600">₹{item.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* GST Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold mb-4">GST Settings</h3>
                  {(() => {
                    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)
                    return (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">GST Type</label>
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="percentage"
                                checked={formData.gstType === 'percentage'}
                                onChange={(e) => setFormData({ ...formData, gstType: 'percentage' as const, gstAmountRupees: 0 })}
                                className="mr-2"
                              />
                              Percentage (%)
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="rupees"
                                checked={formData.gstType === 'rupees'}
                                onChange={(e) => setFormData({ ...formData, gstType: 'rupees' as const, gstPercentage: 0 })}
                                className="mr-2"
                              />
                              Fixed Amount (₹)
                            </label>
                          </div>
                        </div>

                        {formData.gstType === 'percentage' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              GST Percentage {selectedSupplier?.gstPercentage ? `(Default: ${selectedSupplier.gstPercentage}%)` : ''}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={formData.gstPercentage || selectedSupplier?.gstPercentage || ''}
                              onChange={(e) => setFormData({ ...formData, gstPercentage: parseFloat(e.target.value) || 0 })}
                              placeholder={selectedSupplier?.gstPercentage ? `${selectedSupplier.gstPercentage}` : 'Enter GST %'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to use supplier&apos;s default GST percentage</p>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              GST Amount (₹) {selectedSupplier?.gstAmountRupees ? `(Default: ₹${selectedSupplier.gstAmountRupees})` : ''}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.gstAmountRupees || selectedSupplier?.gstAmountRupees || ''}
                              onChange={(e) => setFormData({ ...formData, gstAmountRupees: parseFloat(e.target.value) || 0 })}
                              placeholder={selectedSupplier?.gstAmountRupees ? `${selectedSupplier.gstAmountRupees}` : 'Enter GST amount'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to use supplier&apos;s default GST amount</p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Invoice Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Image (optional)</label>
                  <input
                    ref={invoiceFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInvoiceUpload}
                    disabled={uploadingInvoice}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                  {uploadingInvoice && (
                    <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                  )}
                  {formData.invoiceImage && (
                    <div className="mt-2">
                      <div className="relative inline-block max-w-xs">
                        <div className="relative w-full h-32">
                          <Image
                            src={formData.invoiceImage}
                            alt="Invoice"
                            fill
                            className="object-cover rounded border"
                            sizes="(max-width: 768px) 100vw, 384px"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, invoiceImage: '' }))
                              // Reset the file input
                              if (invoiceFileInputRef.current) {
                                invoiceFileInputRef.current.value = ''
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                            title="Remove Invoice"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="bg-purple-50 p-4 rounded-lg border-t-2 border-purple-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                      <span className="text-lg font-bold text-gray-900">₹{totals.subtotal.toLocaleString()}</span>
                    </div>
                    {totals.gstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          GST {totals.gstType === 'percentage' ? `(${totals.gstPercentage}%)` : '(Fixed)'}:
                        </span>
                        <span className="text-lg font-bold text-gray-900">₹{totals.gstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-purple-300">
                      <span className="text-xl font-bold text-gray-900">Grand Total:</span>
                      <span className="text-2xl font-bold text-purple-600">₹{totals.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <span>+</span>
                    <span>Add Product</span>
                  </button>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      {editingOrder ? 'Update' : 'Add'} Order
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Purchase Order: {selectedOrder.customPoNumber || `PO-${selectedOrder.id}`}
                  {(() => {
                    // Get product name(s)
                    let productName = ''
                    if (selectedOrder.items && selectedOrder.items.length > 0) {
                      const names = selectedOrder.items.map(item => item.productName).filter(Boolean)
                      if (names.length === 1) {
                        productName = names[0]
                      } else if (names.length > 1) {
                        productName = `${names[0]}${names.length > 1 ? ` +${names.length - 1} more` : ''}`
                      }
                    } else if (selectedOrder.productName) {
                      productName = selectedOrder.productName
                    }
                    return productName ? ` - ${productName}` : ''
                  })()}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedOrder(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier</label>
                    <p className="text-lg text-gray-900">{selectedOrder.supplierName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-lg text-gray-900">{format(new Date(selectedOrder.date), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                {/* Products List */}
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Products</h3>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900">{item.productName}</h4>
                          <span className="text-sm text-gray-500">{item.category}</span>
                        </div>
                        {item.productImages && item.productImages.length > 0 && (
                          <div className="flex gap-2 mb-2">
                            {item.productImages.map((img, imgIndex) => (
                              <div key={imgIndex} className="relative w-24 h-24">
                                <Image
                                  src={img}
                                  alt={`${item.productName} - Image ${imgIndex + 1}`}
                                  fill
                                  className="object-cover rounded border"
                                  sizes="96px"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Sizes: </span>
                            <span className="font-medium">{item.sizes?.join(', ') || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Fabric: </span>
                            <span className="font-medium">{item.fabricType || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Quantity: </span>
                            <span className="font-medium">{item.quantity} pieces</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Price: </span>
                            <span className="font-medium">₹{item.pricePerPiece} per piece</span>
                          </div>
                          <div className="col-span-2 pt-2 border-t">
                            <span className="text-gray-600">Item Total: </span>
                            <span className="font-bold text-green-600">₹{item.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold text-gray-900">{selectedOrder.productName || 'Product'}</h4>
                    {selectedOrder.productImage && (
                      <div className="relative w-full h-64 my-4">
                        <Image
                          src={selectedOrder.productImage}
                          alt={selectedOrder.productName || 'Product'}
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">Sizes: </span>
                        <span className="font-medium">{(selectedOrder.sizes || []).join(', ') || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantity: </span>
                        <span className="font-medium">{selectedOrder.quantity} pieces</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Image */}
                {selectedOrder.invoiceImage && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Invoice</label>
                    <div className="relative w-full max-w-md aspect-auto">
                      <Image
                        src={selectedOrder.invoiceImage}
                        alt="Invoice"
                        fill
                        className="object-contain rounded-lg border"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    {selectedOrder.gstAmount && selectedOrder.gstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">GST:</span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{selectedOrder.gstAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-purple-300">
                      <span className="text-xl font-bold text-gray-900">Grand Total:</span>
                      <span className="text-2xl font-bold text-purple-600">
                        ₹{(selectedOrder.grandTotal || selectedOrder.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      handleEdit(selectedOrder)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ✏️ Edit Order
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedOrder(null)
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
