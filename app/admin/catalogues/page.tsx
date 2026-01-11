'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Catalogue, InventoryItem } from '@/lib/storage'

export default function CataloguesPage() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingCatalogue, setEditingCatalogue] = useState<Catalogue | null>(null)
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as string[],
  })

  useEffect(() => {
    loadData()
    // Fetch user role
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.admin) {
          let role = (data.admin.role || 'admin').toLowerCase().trim()
          if (role === 'super_admin') role = 'superadmin'
          setUserRole(role as 'superadmin' | 'admin' | 'user')
        }
      })
      .catch(err => {
        console.error('Error fetching user role:', err)
        setUserRole('admin') // Default
      })
  }, [])

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDetailModal) {
          setShowDetailModal(false)
          setSelectedItem(null)
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
      const [cataloguesRes, inventoryRes] = await Promise.all([
        fetch('/api/catalogues'),
        fetch('/api/inventory'),
      ])
      const cataloguesResult = await cataloguesRes.json()
      const inventoryResult = await inventoryRes.json()
      if (cataloguesResult.success) {
        setCatalogues(cataloguesResult.data)
      }
      if (inventoryResult.success) {
        setInventory(inventoryResult.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCatalogue) {
        const response = await fetch(`/api/catalogues/${editingCatalogue.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to update catalogue')
          return
        }
      } else {
        const response = await fetch('/api/catalogues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to add catalogue')
          return
        }
      }
      
      resetForm()
      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save catalogue:', error)
      alert('Failed to save catalogue')
    }
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this catalogue?')) {
      try {
        const response = await fetch(`/api/catalogues/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to delete catalogue')
          return
        }
        await loadData()
      } catch (error) {
        console.error('Failed to delete catalogue:', error)
        alert('Failed to delete catalogue')
      }
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
          <h1 className="text-3xl font-bold text-gray-900">Catalogues</h1>
          {userRole !== 'user' && (
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              ➕ Create New Catalogue
            </button>
          )}
        </div>

        {catalogues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {userRole === 'user' ? 'No catalogues available yet.' : 'No catalogues yet. Create your first catalogue!'}
            </p>
            {userRole !== 'user' && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Create Catalogue
              </button>
            )}
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
                        <p className="text-sm text-gray-500 mt-1">{catalogue.description}</p>
                      )}
                    </div>
                    {userRole !== 'user' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(catalogue)}
                          className="text-purple-600 hover:text-purple-900 text-sm"
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
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {items.length} item{items.length !== 1 ? 's' : ''} in this catalogue
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {items.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowDetailModal(true)
                          }}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.dressName}
                              className="w-full h-24 object-cover rounded hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {items.length > 4 && (
                      <p className="text-xs text-gray-500 mt-2">+{items.length - 4} more items</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingCatalogue ? 'Edit Catalogue' : 'Create New Catalogue'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Items</label>
                  <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
                    {inventory.length === 0 ? (
                      <p className="text-gray-500 text-sm">No inventory items available</p>
                    ) : (
                      <div className="space-y-2">
                        {inventory.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.items.includes(item.id)}
                              onChange={() => toggleItem(item.id)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{item.dressName}</span>
                              <span className="text-xs text-gray-500 ml-2">({item.dressCode})</span>
                            </div>
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.dressName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.items.length} item{formData.items.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowModal(false)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    {editingCatalogue ? 'Update' : 'Create'} Catalogue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Item Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {selectedItem.imageUrl && (
                  <div>
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.dressName}
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                <div className={selectedItem.imageUrl ? '' : 'col-span-2'}>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Dress Name:</span>
                      <p className="text-lg font-semibold">{selectedItem.dressName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <p>{selectedItem.dressType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Code:</span>
                      <p>{selectedItem.dressCode}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Sizes:</span>
                      <p>{selectedItem.sizes.join(', ')}</p>
                    </div>
                    {selectedItem.fabricType && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fabric Type:</span>
                        <p>{selectedItem.fabricType}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Wholesale Price:</span>
                      <p>₹{selectedItem.wholesalePrice}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Selling Price:</span>
                      <p>₹{selectedItem.sellingPrice}</p>
                    </div>
                    {selectedItem.supplierName && (
                      <>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Supplier:</span>
                          <p>{selectedItem.supplierName}</p>
                        </div>
                        {selectedItem.supplierPhone && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Supplier Phone:</span>
                            <p>{selectedItem.supplierPhone}</p>
                          </div>
                        )}
                        {selectedItem.supplierAddress && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Supplier Address:</span>
                            <p>{selectedItem.supplierAddress}</p>
                          </div>
                        )}
                      </>
                    )}
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
