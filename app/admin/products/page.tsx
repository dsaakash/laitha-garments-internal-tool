'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Image from 'next/image'

interface InventoryItem {
  id: string
  dressName: string
  dressType: string
  dressCode: string
  imageUrl?: string
  sizes: string[]
  fabricType?: string
  wholesalePrice: number
  sellingPrice: number
  supplierName?: string
  currentStock?: number
}

interface BusinessProfile {
  whatsappNumber: string
}

export default function ProductsPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [inventoryRes, businessRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/business'),
      ])
      
      const inventoryResult = await inventoryRes.json()
      const businessResult = await businessRes.json()
      
      if (inventoryResult.success) {
        setInventory(inventoryResult.data)
      }
      
      if (businessResult.success && businessResult.data) {
        setBusinessProfile(businessResult.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategory = (dressType: string): string => {
    const type = dressType.toLowerCase()
    if (type.includes('kurta') || type.includes('kurti')) return 'Kurtis'
    if (type.includes('dress') || type.includes('anarkali')) return 'Dresses'
    if (type.includes('saree') || type.includes('sari')) return 'Sarees'
    return 'Other'
  }

  const categories = ['All', 'Kurtis', 'Dresses', 'Sarees', 'Other']
  
  const filteredItems = selectedCategory === 'All'
    ? inventory
    : inventory.filter(item => getCategory(item.dressType) === selectedCategory)

  const handleWhatsApp = (item: InventoryItem) => {
    const whatsappNumber = businessProfile?.whatsappNumber || '917204219541'
    const message = `Hi, I'm interested in ${item.dressName} (${item.dressCode}). Can you provide more details about availability and pricing?`
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h1>
          <p className="text-gray-600">Browse all available products from inventory</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => {
                  setSelectedItem(item)
                  setShowDetailModal(true)
                }}
              >
                {/* Image Container */}
                <div className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.dressName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/95 backdrop-blur-sm text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-md">
                      {getCategory(item.dressType)}
                    </span>
                  </div>
                  {/* Stock Badge */}
                  {item.currentStock !== undefined && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                        (item.currentStock || 0) > 10
                          ? 'bg-green-500/90 text-white'
                          : (item.currentStock || 0) > 0
                          ? 'bg-yellow-500/90 text-white'
                          : 'bg-red-500/90 text-white'
                      }`}>
                        Stock: {item.currentStock || 0}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                    {item.dressName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {item.dressType} - {item.dressCode}
                  </p>
                  {item.fabricType && (
                    <p className="text-xs text-gray-400 mb-3">Fabric: {item.fabricType}</p>
                  )}
                  <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Price</p>
                      <p className="text-purple-600 font-bold text-lg">₹{item.sellingPrice}</p>
                    </div>
                    {item.sizes && item.sizes.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sizes</p>
                        <p className="text-sm text-gray-700 font-medium">{item.sizes.join(', ')}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleWhatsApp(item)
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    Contact on WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                {selectedItem.imageUrl && (
                  <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={selectedItem.imageUrl}
                      alt={selectedItem.dressName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                
                {/* Details */}
                <div className={selectedItem.imageUrl ? '' : 'md:col-span-2'}>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Product Name</span>
                      <p className="text-2xl font-bold text-gray-900">{selectedItem.dressName}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type</span>
                      <p className="text-lg text-gray-900">{selectedItem.dressType}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Product Code</span>
                      <p className="text-lg text-gray-900">{selectedItem.dressCode}</p>
                    </div>
                    
                    {selectedItem.fabricType && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fabric Type</span>
                        <p className="text-lg text-gray-900">{selectedItem.fabricType}</p>
                      </div>
                    )}
                    
                    {selectedItem.sizes && selectedItem.sizes.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Available Sizes</span>
                        <p className="text-lg text-gray-900">{selectedItem.sizes.join(', ')}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Selling Price</span>
                        <p className="text-2xl font-bold text-purple-600">₹{selectedItem.sellingPrice}</p>
                      </div>
                      {selectedItem.currentStock !== undefined && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Stock Available</span>
                          <p className={`text-2xl font-bold ${
                            (selectedItem.currentStock || 0) > 10
                              ? 'text-green-600'
                              : (selectedItem.currentStock || 0) > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {selectedItem.currentStock || 0}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {selectedItem.supplierName && (
                      <div className="pt-4 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-500">Supplier</span>
                        <p className="text-lg text-gray-900">{selectedItem.supplierName}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => handleWhatsApp(selectedItem)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-lg font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">💬</span>
                      Contact Lalitha Garments on WhatsApp
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Click to open WhatsApp and inquire about this product
                    </p>
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
