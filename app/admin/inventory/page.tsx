'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { InventoryItem } from '@/lib/storage'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    dressName: '',
    dressType: '',
    dressCode: '',
    sizes: '',
    fabricType: '',
    wholesalePrice: '',
    sellingPrice: '',
    pricingUnit: '' as '' | 'piece' | 'meter',
    pricePerPiece: '',
    pricePerMeter: '',
    imageUrl: '',
    productImages: [] as string[],
    supplierName: '',
    supplierAddress: '',
    supplierPhone: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showStockModal, setShowStockModal] = useState(false)
  const [showBulkStockModal, setShowBulkStockModal] = useState(false)
  const [stockFormData, setStockFormData] = useState({
    itemId: '',
    type: 'in' as 'in' | 'out',
    quantity: '',
    notes: '',
  })
  const [bulkStockData, setBulkStockData] = useState<{
    itemId: string
    quantity: string
    type: 'in' | 'out' | 'set'
  }[]>([])

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const loadItems = async () => {
    try {
      const response = await fetch('/api/inventory')
      const result = await response.json()
      if (result.success) {
        let filteredItems = result.data
        
        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          filteredItems = filteredItems.filter((item: InventoryItem) => 
            item.dressCode.toLowerCase().includes(query) ||
            item.dressName.toLowerCase().includes(query) ||
            (item.supplierName && item.supplierName.toLowerCase().includes(query))
          )
        }
        
        setItems(filteredItems)
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const sizesArray = formData.sizes.split(',').map(s => s.trim()).filter(Boolean)
    
    try {
      if (editingItem) {
        const response = await fetch(`/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dressName: formData.dressName,
            dressType: formData.dressType,
            dressCode: formData.dressCode,
            sizes: sizesArray,
            fabricType: formData.fabricType || undefined,
            wholesalePrice: parseFloat(formData.wholesalePrice),
            sellingPrice: parseFloat(formData.sellingPrice),
            pricingUnit: formData.pricingUnit || undefined,
            pricePerPiece: formData.pricePerPiece ? parseFloat(formData.pricePerPiece) : undefined,
            pricePerMeter: formData.pricePerMeter ? parseFloat(formData.pricePerMeter) : undefined,
            imageUrl: formData.imageUrl || undefined,
            productImages: formData.productImages.length > 0 ? formData.productImages : undefined,
            supplierName: formData.supplierName || undefined,
            supplierAddress: formData.supplierAddress || undefined,
            supplierPhone: formData.supplierPhone || undefined,
          }),
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to update item')
          return
        }
      } else {
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dressName: formData.dressName,
            dressType: formData.dressType,
            dressCode: formData.dressCode,
            sizes: sizesArray,
            fabricType: formData.fabricType || undefined,
            wholesalePrice: parseFloat(formData.wholesalePrice),
            sellingPrice: parseFloat(formData.sellingPrice),
            pricingUnit: formData.pricingUnit || undefined,
            pricePerPiece: formData.pricePerPiece ? parseFloat(formData.pricePerPiece) : undefined,
            pricePerMeter: formData.pricePerMeter ? parseFloat(formData.pricePerMeter) : undefined,
            imageUrl: formData.imageUrl || undefined,
            productImages: formData.productImages.length > 0 ? formData.productImages : undefined,
            supplierName: formData.supplierName || undefined,
            supplierAddress: formData.supplierAddress || undefined,
            supplierPhone: formData.supplierPhone || undefined,
          }),
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to add item')
          return
        }
      }
      
      resetForm()
      await loadItems()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save item:', error)
      alert('Failed to save item')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
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
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
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

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    const images = item.productImages && item.productImages.length > 0 
      ? item.productImages 
      : (item.imageUrl ? [item.imageUrl] : [])
    setFormData({
      dressName: item.dressName,
      dressType: item.dressType,
      dressCode: item.dressCode,
      sizes: item.sizes.join(', '),
      fabricType: item.fabricType || '',
      wholesalePrice: item.wholesalePrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      pricingUnit: item.pricingUnit || '',
      pricePerPiece: item.pricePerPiece?.toString() || '',
      pricePerMeter: item.pricePerMeter?.toString() || '',
      imageUrl: item.imageUrl || '',
      productImages: images,
      supplierName: item.supplierName || '',
      supplierAddress: item.supplierAddress || '',
      supplierPhone: item.supplierPhone || '',
    })
    setPreviewImages(images)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/api/inventory/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to delete item')
          return
        }
        await loadItems()
      } catch (error) {
        console.error('Failed to delete item:', error)
        alert('Failed to delete item')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      dressName: '',
      dressType: '',
      dressCode: '',
      sizes: '',
      fabricType: '',
      wholesalePrice: '',
      sellingPrice: '',
      pricingUnit: '' as '' | 'piece' | 'meter',
      pricePerPiece: '',
      pricePerMeter: '',
      imageUrl: '',
      productImages: [],
      supplierName: '',
      supplierAddress: '',
      supplierPhone: '',
    })
    setEditingItem(null)
    setPreviewImages([])
  }

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const quantity = parseInt(stockFormData.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    try {
      const response = await fetch(`/api/inventory/${stockFormData.itemId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: stockFormData.type,
          quantity,
          notes: stockFormData.notes || undefined,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        alert('Failed to update stock')
        return
      }

      alert(`Stock ${stockFormData.type === 'in' ? 'added' : 'removed'} successfully!`)
      setShowStockModal(false)
      setStockFormData({
        itemId: '',
        type: 'in',
        quantity: '',
        notes: '',
      })
      await loadItems()
    } catch (error) {
      console.error('Failed to update stock:', error)
      alert('Failed to update stock')
    }
  }

  const openStockModal = (item: InventoryItem, type: 'in' | 'out') => {
    setStockFormData({
      itemId: item.id,
      type,
      quantity: '',
      notes: '',
    })
    setShowStockModal(true)
  }

  const openBulkStockModal = () => {
    // Initialize bulk stock data with all items
    setBulkStockData(
      items.map(item => ({
        itemId: item.id,
        quantity: (item.currentStock || 0).toString(),
        type: 'set' as 'in' | 'out' | 'set',
      }))
    )
    setShowBulkStockModal(true)
  }

  const handleBulkStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let successCount = 0
      let errorCount = 0

      for (const itemData of bulkStockData) {
        const quantity = parseInt(itemData.quantity)
        if (isNaN(quantity) || quantity < 0) {
          continue
        }

        try {
          const item = items.find(i => i.id === itemData.itemId)
          if (!item) continue

          if (itemData.type === 'set') {
            // Set absolute stock value - calculate difference
            const currentStock = item.currentStock || 0
            const stockDifference = quantity - currentStock

            if (stockDifference === 0) continue

            const response = await fetch(`/api/inventory/${itemData.itemId}/stock`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: stockDifference > 0 ? 'in' : 'out',
                quantity: Math.abs(stockDifference),
                notes: 'Bulk stock update - set value',
              }),
            })

            if (response.ok) {
              successCount++
            } else {
              errorCount++
            }
          } else {
            // Add or remove stock
            const response = await fetch(`/api/inventory/${itemData.itemId}/stock`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: itemData.type,
                quantity: quantity,
                notes: 'Bulk stock update',
              }),
            })

            if (response.ok) {
              successCount++
            } else {
              errorCount++
            }
          }
        } catch (error) {
          console.error(`Error updating stock for item ${itemData.itemId}:`, error)
          errorCount++
        }
      }

      alert(`Bulk update completed! Success: ${successCount}, Errors: ${errorCount}`)
      setShowBulkStockModal(false)
      setBulkStockData([])
      await loadItems()
    } catch (error) {
      console.error('Bulk stock update error:', error)
      alert('Failed to update stock')
    }
  }

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = items.map(item => ({
        'Dress Name': item.dressName,
        'Dress Type': item.dressType,
        'Dress Code': item.dressCode,
        'Sizes': item.sizes.join(', '),
        'Fabric Type': item.fabricType || '',
        'Wholesale Price (₹)': item.wholesalePrice,
        'Selling Price (₹)': item.sellingPrice,
        'Pricing Unit': item.pricingUnit || '',
        'Price Per Piece (₹)': item.pricePerPiece || '',
        'Price Per Meter (₹)': item.pricePerMeter || '',
        'Supplier Name': item.supplierName || '',
        'Supplier Address': item.supplierAddress || '',
        'Supplier Phone': item.supplierPhone || '',
        'Quantity In': item.quantityIn || 0,
        'Quantity Out': item.quantityOut || 0,
        'Current Stock': item.currentStock || 0,
        'Created At': new Date(item.createdAt).toLocaleDateString(),
        'Updated At': new Date(item.updatedAt).toLocaleDateString(),
      }))

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory')

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Dress Name
        { wch: 15 }, // Dress Type
        { wch: 15 }, // Dress Code
        { wch: 20 }, // Sizes
        { wch: 15 }, // Fabric Type
        { wch: 18 }, // Wholesale Price
        { wch: 18 }, // Selling Price
        { wch: 15 }, // Pricing Unit
        { wch: 20 }, // Price Per Piece
        { wch: 20 }, // Price Per Meter
        { wch: 20 }, // Supplier Name
        { wch: 30 }, // Supplier Address
        { wch: 15 }, // Supplier Phone
        { wch: 12 }, // Quantity In
        { wch: 12 }, // Quantity Out
        { wch: 12 }, // Current Stock
        { wch: 12 }, // Created At
        { wch: 12 }, // Updated At
      ]
      ws['!cols'] = colWidths

      // Generate filename with current date
      const filename = `Inventory_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
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
            >
              ➕ Add New Item
            </button>
            <button
              onClick={openBulkStockModal}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📦 Bulk Stock Update
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Inventory</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by dress code, dress name, or supplier name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No inventory items yet. Add your first item!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="table-wrapper">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dress Name</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Code</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Sizes</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Supplier</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wholesale</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Profit</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const profit = item.sellingPrice - item.wholesalePrice
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        {(item.productImages && item.productImages.length > 0) || item.imageUrl ? (
                          <img 
                            src={item.productImages && item.productImages.length > 0 ? item.productImages[0] : item.imageUrl} 
                            alt={item.dressName} 
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowDetailModal(true)
                            }}
                            title={item.productImages && item.productImages.length > 1 ? `${item.productImages.length} images` : ''}
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.dressName}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{item.dressType}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{item.dressCode}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{item.sizes.join(', ')}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        {item.supplierName ? (
                          <div>
                            <p className="font-medium">{item.supplierName}</p>
                            {item.supplierPhone && (
                              <p className="text-xs text-gray-400">{item.supplierPhone}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.wholesalePrice}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.sellingPrice}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 hidden sm:table-cell">₹{profit}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${
                              (item.currentStock || 0) > 10 ? 'text-green-600' :
                              (item.currentStock || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              Stock: {item.currentStock || 0}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            <div>In: {item.quantityIn || 0}</div>
                            <div>Out: {item.quantityOut || 0}</div>
                          </div>
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => openStockModal(item, 'in')}
                              className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs font-medium border border-green-200"
                              title="Add Stock"
                            >
                              +In
                            </button>
                            <button
                              onClick={() => openStockModal(item, 'out')}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-medium border border-red-200"
                              title="Remove Stock"
                            >
                              -Out
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-2 py-1.5 sm:px-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 rounded-md text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md border border-blue-200 min-w-[50px] sm:min-w-[60px] whitespace-nowrap"
                            title="Edit"
                          >
                            <span className="hidden sm:inline">✏️ </span>Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-2 py-1.5 sm:px-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 rounded-md text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md border border-red-200 min-w-[50px] sm:min-w-[60px] whitespace-nowrap"
                            title="Delete"
                          >
                            <span className="hidden sm:inline">🗑️ </span>Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dress Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.dressName}
                    onChange={(e) => setFormData({ ...formData, dressName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dress Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2-PC, 3-PC, Kurta"
                    value={formData.dressType}
                    onChange={(e) => setFormData({ ...formData, dressType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dress Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., RJ-1/12"
                    value={formData.dressCode}
                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sizes * (comma-separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., M-38, L-40, XL-42"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.wholesalePrice}
                      onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                {/* Pricing Unit Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Unit (Optional)</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="piece"
                        checked={formData.pricingUnit === 'piece'}
                        onChange={(e) => setFormData({ ...formData, pricingUnit: 'piece' as const, pricePerMeter: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm">By Piece</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="meter"
                        checked={formData.pricingUnit === 'meter'}
                        onChange={(e) => setFormData({ ...formData, pricingUnit: 'meter' as const, pricePerPiece: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm">By Meter</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value=""
                        checked={formData.pricingUnit === ''}
                        onChange={(e) => setFormData({ ...formData, pricingUnit: '' as const, pricePerPiece: '', pricePerMeter: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm">None</span>
                    </label>
                  </div>
                  
                  {formData.pricingUnit === 'piece' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Piece (₹) (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricePerPiece}
                        onChange={(e) => setFormData({ ...formData, pricePerPiece: e.target.value })}
                        placeholder="e.g., 500 for ₹500 per piece"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set price per piece if selling by individual pieces</p>
                    </div>
                  )}
                  
                  {formData.pricingUnit === 'meter' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Meter (₹) (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricePerMeter}
                        onChange={(e) => setFormData({ ...formData, pricePerMeter: e.target.value })}
                        placeholder="e.g., 150 for ₹150 per meter"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set price per meter if selling by meter length</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (optional)</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e)}
                      disabled={uploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    />
                    {uploading && (
                      <p className="text-sm text-gray-500">Uploading...</p>
                    )}
                    {previewImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                        {previewImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              ×
                            </button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, index)}
                              disabled={uploadingIndex === index}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              title="Replace image"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">You can upload multiple images. Click on an image to replace it.</p>
                  </div>
                </div>

                {/* Supplier Information Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Supplier Information (Optional)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier/Party Name</label>
                      <input
                        type="text"
                        value={formData.supplierName}
                        onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                        placeholder="Enter supplier name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Phone Number</label>
                      <input
                        type="tel"
                        value={formData.supplierPhone}
                        onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                        placeholder="Enter supplier phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Address</label>
                      <textarea
                        rows={3}
                        value={formData.supplierAddress}
                        onChange={(e) => setFormData({ ...formData, supplierAddress: e.target.value })}
                        placeholder="Enter supplier address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
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
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Inventory Item Details</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedItem(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images Section */}
                <div>
                  {(selectedItem.productImages && selectedItem.productImages.length > 0) || selectedItem.imageUrl ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {((selectedItem.productImages && selectedItem.productImages.length > 0) ? selectedItem.productImages : [selectedItem.imageUrl]).map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <img
                              src={imageUrl}
                              alt={`${selectedItem.dressName} - Image ${index + 1}`}
                              className="w-full h-96 object-cover rounded-lg border-2 border-gray-200"
                            />
                          </div>
                        ))}
                      </div>
                      {selectedItem.productImages && selectedItem.productImages.length > 1 && (
                        <p className="text-sm text-gray-500 text-center">
                          {selectedItem.productImages.length} images
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      No Image Available
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dress Name</label>
                    <p className="text-lg font-bold text-gray-900">{selectedItem.dressName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Dress Type</label>
                    <p className="text-lg text-gray-900">{selectedItem.dressType}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Dress Code</label>
                    <p className="text-lg text-gray-900 font-mono">{selectedItem.dressCode}</p>
                  </div>

                  {selectedItem.fabricType && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fabric Type</label>
                      <p className="text-lg text-gray-900">{selectedItem.fabricType}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Available Sizes</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedItem.sizes.map((size, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Wholesale Price</label>
                      <p className="text-xl font-bold text-gray-900">₹{selectedItem.wholesalePrice}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Selling Price</label>
                      <p className="text-xl font-bold text-green-600">₹{selectedItem.sellingPrice}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500">Profit per Unit</label>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{selectedItem.sellingPrice - selectedItem.wholesalePrice}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Stock Information</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-400">Current Stock</label>
                        <p className={`text-xl font-bold ${
                          (selectedItem.currentStock || 0) > 10 ? 'text-green-600' :
                          (selectedItem.currentStock || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {selectedItem.currentStock || 0}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400">Quantity In</label>
                        <p className="text-xl font-bold text-blue-600">
                          {selectedItem.quantityIn || 0}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400">Quantity Out</label>
                        <p className="text-xl font-bold text-orange-600">
                          {selectedItem.quantityOut || 0}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          openStockModal(selectedItem, 'in')
                        }}
                        className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm font-medium border border-green-200"
                      >
                        + Add Stock
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          openStockModal(selectedItem, 'out')
                        }}
                        className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded text-sm font-medium border border-red-200"
                      >
                        - Remove Stock
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedItem.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {(selectedItem.supplierName || selectedItem.supplierPhone || selectedItem.supplierAddress) && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Supplier Information</label>
                      {selectedItem.supplierName && (
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-medium">Name:</span> {selectedItem.supplierName}
                        </p>
                      )}
                      {selectedItem.supplierPhone && (
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-medium">Phone:</span> {selectedItem.supplierPhone}
                        </p>
                      )}
                      {selectedItem.supplierAddress && (
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Address:</span> {selectedItem.supplierAddress}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        handleEdit(selectedItem)
                      }}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Edit Item
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedItem(null)
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

        {/* Stock Update Modal */}
        {showStockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">
                {stockFormData.type === 'in' ? 'Add Stock' : 'Remove Stock'}
              </h2>
              <form onSubmit={handleStockUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity {stockFormData.type === 'in' ? 'In' : 'Out'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockFormData.quantity}
                    onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={stockFormData.notes}
                    onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Add any notes about this stock transaction..."
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStockModal(false)
                      setStockFormData({
                        itemId: '',
                        type: 'in',
                        quantity: '',
                        notes: '',
                      })
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors ${
                      stockFormData.type === 'in'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {stockFormData.type === 'in' ? 'Add Stock' : 'Remove Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Stock Update Modal */}
        {showBulkStockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Bulk Stock Update</h2>
              <form onSubmit={handleBulkStockUpdate} className="space-y-4">
                <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bulkStockData.map((itemData, idx) => {
                        const item = items.find(i => i.id === itemData.itemId)
                        if (!item) return null
                        return (
                          <tr key={itemData.itemId}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.dressName}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.currentStock || 0}</td>
                            <td className="px-4 py-3">
                              <select
                                value={itemData.type}
                                onChange={(e) => {
                                  const newData = [...bulkStockData]
                                  newData[idx].type = e.target.value as 'in' | 'out' | 'set'
                                  setBulkStockData(newData)
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="set">Set Stock</option>
                                <option value="in">Add Stock</option>
                                <option value="out">Remove Stock</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={itemData.quantity}
                                onChange={(e) => {
                                  const newData = [...bulkStockData]
                                  newData[idx].quantity = e.target.value
                                  setBulkStockData(newData)
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
                                placeholder="Qty"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkStockModal(false)
                      setBulkStockData([])
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Update All Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

