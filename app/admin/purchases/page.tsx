'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { storage, PurchaseOrder, Supplier, InventoryItem } from '@/lib/storage'
import { format } from 'date-fns'

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    supplierId: '',
    productName: '',
    sizes: '',
    fabricType: '',
    quantity: '',
    pricePerPiece: '',
    productImage: '',
    notes: '',
  })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [filterSupplier, filterMonth, filterYear])

  const loadData = () => {
    setSuppliers(storage.getSuppliers())
    loadOrders()
  }

  const loadOrders = () => {
    let allOrders = storage.getPurchaseOrders()
    
    if (filterSupplier) {
      allOrders = allOrders.filter(order => order.supplierId === filterSupplier)
    }
    
    if (filterYear) {
      allOrders = allOrders.filter(order => {
        const orderYear = new Date(order.date).getFullYear().toString()
        return orderYear === filterYear
      })
    }
    
    if (filterMonth) {
      allOrders = allOrders.filter(order => {
        const orderMonth = (new Date(order.date).getMonth() + 1).toString().padStart(2, '0')
        return orderMonth === filterMonth
      })
    }
    
    allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setOrders(allOrders)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, productImage: data.url }))
        setPreviewImage(data.url)
      } else {
        alert(data.message || 'Failed to upload image')
      }
    } catch (error) {
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const supplier = suppliers.find(s => s.id === formData.supplierId)
    if (!supplier) {
      alert('Please select a supplier')
      return
    }

    const quantity = parseFloat(formData.quantity)
    const pricePerPiece = parseFloat(formData.pricePerPiece)
    const totalAmount = quantity * pricePerPiece
    const sizesArray = formData.sizes.split(',').map(s => s.trim()).filter(Boolean)

    if (sizesArray.length === 0) {
      alert('Please enter at least one size')
      return
    }

    if (editingOrder) {
      storage.updatePurchaseOrder(editingOrder.id, {
        date: formData.date,
        supplierId: formData.supplierId,
        supplierName: supplier.name,
        productName: formData.productName,
        productImage: formData.productImage || undefined,
        sizes: sizesArray,
        quantity,
        pricePerPiece,
        totalAmount,
        notes: formData.notes || undefined,
      })
    } else {
      const newOrder = storage.addPurchaseOrder({
        date: formData.date,
        supplierId: formData.supplierId,
        supplierName: supplier.name,
        productName: formData.productName,
        productImage: formData.productImage || undefined,
        sizes: sizesArray,
        quantity,
        pricePerPiece,
        totalAmount,
        notes: formData.notes || undefined,
      })

      // Automatically add to inventory
      const existingInventory = storage.getInventory()
      const existingItem = existingInventory.find(
        item => item.dressName.toLowerCase() === formData.productName.toLowerCase() &&
                item.dressCode === `PO-${newOrder.id.substring(0, 6)}`
      )

      if (existingItem) {
        // Update existing inventory item - merge sizes and update prices
        const mergedSizes = [...new Set([...existingItem.sizes, ...sizesArray])]
        storage.updateInventory(existingItem.id, {
          sizes: mergedSizes,
          wholesalePrice: pricePerPiece, // Update to latest purchase price
          sellingPrice: pricePerPiece * 2, // 2x markup as requested
          fabricType: formData.fabricType || existingItem.fabricType,
          supplierName: supplier.name,
          supplierPhone: supplier.phone,
          supplierAddress: supplier.address,
        })
        alert(`Purchase order added! Updated existing inventory item: ${formData.productName}`)
      } else {
        // Create new inventory item
        const dressCode = `PO-${newOrder.id.substring(0, 6)}`
        storage.addInventory({
          dressName: formData.productName,
          dressType: 'Purchase Order Item',
          dressCode: dressCode,
          sizes: sizesArray,
          wholesalePrice: pricePerPiece,
          sellingPrice: pricePerPiece * 2, // 2x markup as requested
          imageUrl: formData.productImage || undefined,
          fabricType: formData.fabricType || undefined,
          supplierName: supplier.name,
          supplierPhone: supplier.phone,
          supplierAddress: supplier.address,
        })
        alert(`Purchase order added! New inventory item created: ${formData.productName} with ${sizesArray.length} size(s)`)
      }
    }
    
    resetForm()
    loadOrders()
    setShowModal(false)
  }

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order)
    setFormData({
      date: order.date,
      supplierId: order.supplierId,
      productName: order.productName,
      sizes: (order.sizes && order.sizes.length > 0) ? order.sizes.join(', ') : '',
      fabricType: order.fabricType || '',
      quantity: order.quantity.toString(),
      pricePerPiece: order.pricePerPiece.toString(),
      productImage: order.productImage || '',
      notes: order.notes || '',
    })
    setPreviewImage(order.productImage || null)
    setShowModal(true)
  }

  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      storage.deletePurchaseOrder(id)
      loadOrders()
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      supplierId: '',
      productName: '',
      sizes: '',
      fabricType: '',
      quantity: '',
      pricePerPiece: '',
      productImage: '',
      notes: '',
    })
    setEditingOrder(null)
    setPreviewImage(null)
  }

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0
    const pricePerPiece = parseFloat(formData.pricePerPiece) || 0
    return quantity * pricePerPiece
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0)

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
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

        {suppliers.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
            Please add suppliers first before creating purchase orders. <a href="/admin/suppliers" className="underline">Go to Suppliers</a>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 items-end flex-wrap">
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
            {(filterSupplier || filterMonth || filterYear) && (
              <button
                onClick={() => {
                  setFilterSupplier('')
                  setFilterMonth('')
                  setFilterYear('')
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewDetails(order)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.productName}</h3>
                    <p className="text-sm text-gray-500">{order.supplierName}</p>
                  </div>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(order)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {order.productImage && (
                  <img
                    src={order.productImage}
                    alt={order.productName}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{format(new Date(order.date), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sizes:</span>
                    <span className="font-medium">{(order.sizes && order.sizes.length > 0) ? order.sizes.join(', ') : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{order.quantity} pieces</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per piece:</span>
                    <span className="font-medium">₹{order.pricePerPiece}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-900 font-bold">Total Amount:</span>
                    <span className="text-green-600 font-bold text-lg">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                  {order.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 text-xs">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingOrder ? 'Edit Purchase Order' : 'Add Purchase Order'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sizes * (comma-separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., M-38, L-40, XL-42, XXL-44"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">These sizes will be added to inventory</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Cotton, Silk, Polyester, Linen"
                    value={formData.fabricType}
                    onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                      value={formData.pricePerPiece}
                      onChange={(e) => setFormData({ ...formData, pricePerPiece: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                    <span className="text-xl font-bold text-purple-600">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image (optional)</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    />
                    {uploading && (
                      <p className="text-sm text-gray-500">Uploading...</p>
                    )}
                    {(previewImage || formData.productImage) && (
                      <div className="mt-2">
                        <img
                          src={previewImage || formData.productImage}
                          alt="Preview"
                          className="max-w-xs h-32 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, productImage: '' }))
                            setPreviewImage(null)
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Or enter image URL:</p>
                    <input
                      type="text"
                      value={formData.productImage}
                      onChange={(e) => {
                        setFormData({ ...formData, productImage: e.target.value })
                        setPreviewImage(e.target.value || null)
                      }}
                      placeholder="https://... or /uploads/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
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

                <div className="flex justify-end space-x-4 pt-4">
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
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Purchase Order Details</h2>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Section */}
                <div>
                  {selectedOrder.productImage ? (
                    <img
                      src={selectedOrder.productImage}
                      alt={selectedOrder.productName}
                      className="w-full h-96 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      No Image Available
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product Name</label>
                    <p className="text-lg font-bold text-gray-900">{selectedOrder.productName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier</label>
                    <p className="text-lg text-gray-900">{selectedOrder.supplierName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-lg text-gray-900">{format(new Date(selectedOrder.date), 'dd MMM yyyy')}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Sizes Purchased</label>
                    {selectedOrder.sizes && selectedOrder.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedOrder.sizes.map((size, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">No sizes specified</p>
                    )}
                  </div>

                  {selectedOrder.fabricType && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fabric Type</label>
                      <p className="text-lg text-gray-900">{selectedOrder.fabricType}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quantity</label>
                      <p className="text-xl font-bold text-gray-900">{selectedOrder.quantity} pieces</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Price per Piece</label>
                      <p className="text-xl font-bold text-gray-900">₹{selectedOrder.pricePerPiece}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="text-2xl font-bold text-green-600">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500">Expected Selling Price (2x markup)</label>
                    <p className="text-xl font-bold text-purple-600">₹{(selectedOrder.pricePerPiece * 2).toLocaleString()} per piece</p>
                    <p className="text-sm text-gray-500 mt-1">Total if all sold: ₹{(selectedOrder.pricePerPiece * 2 * selectedOrder.quantity).toLocaleString()}</p>
                  </div>

                  {selectedOrder.notes && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedOrder.notes}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm text-gray-600">
                      {format(new Date(selectedOrder.createdAt), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>

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
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

