'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { storage, InventoryItem } from '@/lib/storage'

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
    imageUrl: '',
    supplierName: '',
    supplierAddress: '',
    supplierPhone: '',
  })
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = () => {
    setItems(storage.getInventory())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const sizesArray = formData.sizes.split(',').map(s => s.trim()).filter(Boolean)
    
    if (editingItem) {
      storage.updateInventory(editingItem.id, {
        dressName: formData.dressName,
        dressType: formData.dressType,
        dressCode: formData.dressCode,
        sizes: sizesArray,
        fabricType: formData.fabricType || undefined,
        wholesalePrice: parseFloat(formData.wholesalePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        imageUrl: formData.imageUrl || undefined,
        supplierName: formData.supplierName || undefined,
        supplierAddress: formData.supplierAddress || undefined,
        supplierPhone: formData.supplierPhone || undefined,
      })
    } else {
      storage.addInventory({
        dressName: formData.dressName,
        dressType: formData.dressType,
        dressCode: formData.dressCode,
        sizes: sizesArray,
        fabricType: formData.fabricType || undefined,
        wholesalePrice: parseFloat(formData.wholesalePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        imageUrl: formData.imageUrl || undefined,
        supplierName: formData.supplierName || undefined,
        supplierAddress: formData.supplierAddress || undefined,
        supplierPhone: formData.supplierPhone || undefined,
      })
    }
    
    resetForm()
    loadItems()
    setShowModal(false)
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
    setFormData({
      dressName: item.dressName,
      dressType: item.dressType,
      dressCode: item.dressCode,
      sizes: item.sizes.join(', '),
      fabricType: item.fabricType || '',
      wholesalePrice: item.wholesalePrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      imageUrl: item.imageUrl || '',
      supplierName: item.supplierName || '',
      supplierAddress: item.supplierAddress || '',
      supplierPhone: item.supplierPhone || '',
    })
    setPreviewImage(item.imageUrl || null)
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      storage.deleteInventory(id)
      loadItems()
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
      imageUrl: '',
      supplierName: '',
      supplierAddress: '',
      supplierPhone: '',
    })
    setEditingItem(null)
    setPreviewImage(null)
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ➕ Add New Item
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No inventory items yet. Add your first item!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dress Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sizes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wholesale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const profit = item.sellingPrice - item.wholesalePrice
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.dressName} 
                            className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowDetailModal(true)
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.dressName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dressType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dressCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sizes.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.wholesalePrice}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.sellingPrice}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">₹{profit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
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
                    {(previewImage || formData.imageUrl) && (
                      <div className="mt-2">
                        <img
                          src={previewImage || formData.imageUrl}
                          alt="Preview"
                          className="max-w-xs h-32 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, imageUrl: '' }))
                            setPreviewImage(null)
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Or enter image URL (optional):</p>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value })
                        setPreviewImage(e.target.value || null)
                      }}
                      placeholder="https://... or /uploads/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
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
                {/* Image Section */}
                <div>
                  {selectedItem.imageUrl ? (
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.dressName}
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
      </div>
    </AdminLayout>
  )
}

