'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { storage, Catalogue, InventoryItem } from '@/lib/storage'

export default function CataloguesPage() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingCatalogue, setEditingCatalogue] = useState<Catalogue | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as string[],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setCatalogues(storage.getCatalogues())
    setInventory(storage.getInventory())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCatalogue) {
      storage.updateCatalogue(editingCatalogue.id, formData)
    } else {
      storage.addCatalogue(formData)
    }
    
    resetForm()
    loadData()
    setShowModal(false)
  }

  const handleEdit = (catalogue: Catalogue) => {
    setEditingCatalogue(catalogue)
    setFormData({
      name: catalogue.name,
      description: catalogue.description || '',
      items: catalogue.items,
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this catalogue?')) {
      storage.deleteCatalogue(id)
      loadData()
    }
  }

  const toggleItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.includes(itemId)
        ? prev.items.filter(id => id !== itemId)
        : [...prev.items, itemId],
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      items: [],
    })
    setEditingCatalogue(null)
  }

  const getCatalogueItems = (catalogue: Catalogue) => {
    return catalogue.items
      .map(id => inventory.find(item => item.id === id))
      .filter(Boolean) as InventoryItem[]
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Catalogue Management</h1>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            disabled={inventory.length === 0}
          >
            ➕ Create New Catalogue
          </button>
        </div>

        {inventory.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
            Please add inventory items first before creating catalogues. <a href="/admin/inventory" className="underline">Go to Inventory</a>
          </div>
        )}

        {catalogues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No catalogues yet. Create your first catalogue!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              disabled={inventory.length === 0}
            >
              Create Catalogue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogues.map((catalogue) => {
              const items = getCatalogueItems(catalogue)
              return (
                <div key={catalogue.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{catalogue.name}</h3>
                      {catalogue.description && (
                        <p className="text-gray-600 text-sm mt-1">{catalogue.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(catalogue)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(catalogue.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>{items.length}</strong> items in this catalogue
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowDetailModal(true)
                          }}
                        >
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.dressName} 
                              className="w-10 h-10 object-cover rounded hover:opacity-80 transition-opacity" 
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                              No Img
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.dressName}</p>
                            <p className="text-gray-500 text-xs">{item.dressCode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingCatalogue ? 'Edit Catalogue' : 'Create New Catalogue'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catalogue Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Items *</label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {inventory.length === 0 ? (
                      <p className="text-gray-500 text-sm">No inventory items available. Add items first.</p>
                    ) : (
                      <div className="space-y-2">
                        {inventory.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.items.includes(item.id)}
                              onChange={() => toggleItem(item.id)}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <div className="flex items-center space-x-3 flex-1">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.dressName} className="w-12 h-12 object-cover rounded" />
                              )}
                              <div>
                                <p className="font-medium text-sm">{item.dressName}</p>
                                <p className="text-xs text-gray-500">{item.dressType} - {item.dressCode}</p>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.items.length} item(s) selected
                  </p>
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
                    disabled={formData.items.length === 0}
                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingCatalogue ? 'Update' : 'Create'} Catalogue
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

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedItem(null)
                        window.location.href = '/admin/inventory'
                      }}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      📦 View in Inventory
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

