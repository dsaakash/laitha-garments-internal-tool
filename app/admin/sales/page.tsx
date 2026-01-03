'use client'

import React, { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Sale, InventoryItem, Customer } from '@/lib/storage'
import { format } from 'date-fns'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showModal, setShowModal] = useState(false)
  const [useCustomer, setUseCustomer] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    partyName: '',
    customerId: '',
    billNumber: '',
    paymentMode: 'Cash',
    upiTransactionId: '',
    saleImage: '',
    items: [] as Array<{
      inventoryId: string
      size: string
      quantity: number
    }>,
  })
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null)
  const [stickerPosition, setStickerPosition] = useState({ x: 50, y: 50 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear])

  const loadData = async () => {
    try {
      const [inventoryRes, customersRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/customers'),
      ])
      const inventoryResult = await inventoryRes.json()
      const customersResult = await customersRes.json()
      if (inventoryResult.success) {
        setInventory(inventoryResult.data)
      }
      if (customersResult.success) {
        setCustomers(customersResult.data)
      }
      await loadSales()
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadSales = async () => {
    try {
      const params = new URLSearchParams()
      if (filterYear) params.append('year', filterYear)
      if (filterMonth) params.append('month', filterMonth)
      
      const response = await fetch(`/api/sales?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setSales(result.data)
      }
    } catch (error) {
      console.error('Failed to load sales:', error)
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { inventoryId: '', size: '', quantity: 1 }],
    })
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  // Webcam functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    } catch (error) {
      console.error('Error stopping camera:', error)
    }
    setShowCamera(false)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        // Add sticker if selected
        if (selectedSticker) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.9)'
          ctx.font = `${Math.min(canvas.width, canvas.height) * 0.1}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            selectedSticker,
            (stickerPosition.x / 100) * canvas.width,
            (stickerPosition.y / 100) * canvas.height
          )
        }
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
        setFormData({ ...formData, saleImage: imageData })
        stopCamera()
      }
    }
  }

  const stickers = [
    '✅', '✓', '✓✓', 'SOLD', 'PAID', '✓ SOLD', 'DELIVERED', '✓✓✓'
  ]

  const addStickerToImage = (sticker: string) => {
    if (capturedImage) {
      const img = new Image()
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (ctx) {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            
            // Add text sticker
            ctx.fillStyle = 'rgba(34, 197, 94, 0.9)'
            ctx.font = `${Math.min(canvas.width, canvas.height) * 0.1}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(
              sticker,
              (stickerPosition.x / 100) * canvas.width,
              (stickerPosition.y / 100) * canvas.height
            )
            
            const imageData = canvas.toDataURL('image/jpeg', 0.9)
            setCapturedImage(imageData)
            setFormData({ ...formData, saleImage: imageData })
          }
        }
      }
      img.src = capturedImage
    } else {
      setSelectedSticker(sticker)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const saleItems = formData.items.map(itemForm => {
        const invItem = inventory.find(i => i.id === itemForm.inventoryId)
        if (!invItem) throw new Error('Inventory item not found')
        
        const purchasePrice = invItem.wholesalePrice
        const sellingPrice = invItem.sellingPrice
        const profit = (sellingPrice - purchasePrice) * itemForm.quantity
        
        return {
          inventoryId: itemForm.inventoryId,
          dressName: invItem.dressName,
          dressType: invItem.dressType,
          dressCode: invItem.dressCode,
          size: itemForm.size,
          quantity: itemForm.quantity,
          purchasePrice,
          sellingPrice,
          profit,
        }
      })
      
      const totalAmount = saleItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
      
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          partyName: formData.partyName,
          customerId: useCustomer && formData.customerId ? formData.customerId : undefined,
          billNumber: formData.billNumber,
          items: saleItems,
          totalAmount,
          paymentMode: formData.paymentMode,
          upiTransactionId: formData.upiTransactionId || undefined,
          saleImage: formData.saleImage || undefined,
        }),
      })
      
      const result = await response.json()
      if (!result.success) {
        alert('Failed to add sale')
        return
      }
      
      resetForm()
      await loadSales()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save sale:', error)
      alert('Failed to save sale')
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      partyName: '',
      customerId: '',
      billNumber: '',
      paymentMode: 'Cash',
      upiTransactionId: '',
      saleImage: '',
      items: [],
    })
    setUseCustomer(false)
    setCapturedImage(null)
    setShowCamera(false)
    setSelectedSticker(null)
    stopCamera()
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        partyName: customer.name,
      }))
    }
  }

  const getSelectedInventoryItem = (inventoryId: string) => {
    return inventory.find(item => item.id === inventoryId)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Tracking</h1>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record New Sale
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 items-end">
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
            {(filterMonth || filterYear) && (
              <button
                onClick={() => {
                  setFilterMonth('')
                  setFilterYear('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No sales recorded yet. Record your first sale!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => {
              const totalProfit = sale.items.reduce((sum, item) => sum + item.profit, 0)
              return (
                <div key={sale.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{sale.partyName}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(sale.date), 'dd MMM yyyy')} • Bill: {sale.billNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{sale.totalAmount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Profit: ₹{totalProfit.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-700">{sale.paymentMode}</span>
                      </div>
                      {sale.upiTransactionId && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 rounded">UPI: {sale.upiTransactionId}</span>
                        </div>
                      )}
                    </div>
                    {sale.saleImage && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-gray-700">Sale Proof Image</p>
                        </div>
                        <div className="relative group">
                          <img 
                            src={sale.saleImage} 
                            alt="Sale proof" 
                            className="max-w-xs rounded-xl border-2 border-gray-200 shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                            onClick={() => window.open(sale.saleImage, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-200 flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-lg">
                              Click to view full size
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                          <th className="pb-2">Dress</th>
                          <th className="pb-2">Code</th>
                          <th className="pb-2">Size</th>
                          <th className="pb-2">Qty</th>
                          <th className="pb-2">Price</th>
                          <th className="pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.items.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 text-sm">{item.dressName} ({item.dressType})</td>
                            <td className="py-2 text-sm text-gray-500">{item.dressCode}</td>
                            <td className="py-2 text-sm text-gray-500">{item.size}</td>
                            <td className="py-2 text-sm text-gray-500">{item.quantity}</td>
                            <td className="py-2 text-sm text-gray-500">₹{item.sellingPrice}</td>
                            <td className="py-2 text-sm font-medium">₹{(item.sellingPrice * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Record New Sale</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="overflow-y-auto flex-1 p-8">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.billNumber}
                      onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="useCustomer"
                      checked={useCustomer}
                      onChange={(e) => {
                        setUseCustomer(e.target.checked)
                        if (!e.target.checked) {
                          setFormData(prev => ({ ...prev, customerId: '', partyName: '' }))
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="useCustomer" className="text-sm font-medium text-gray-700">
                      Select from existing customers
                    </label>
                  </div>
                  {useCustomer ? (
                    <select
                      required
                      value={formData.customerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.partyName}
                      onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                      placeholder="Enter party/customer name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                  {customers.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No customers yet. <a href="/admin/customers" className="text-purple-600 hover:underline">Add customers</a> to use this feature.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                    <select
                      required
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI - GPay">UPI - GPay</option>
                      <option value="UPI - PhonePe">UPI - PhonePe</option>
                      <option value="UPI - Paytm">UPI - Paytm</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI Transaction ID (if UPI)</label>
                    <input
                      type="text"
                      value={formData.upiTransactionId}
                      onChange={(e) => setFormData({ ...formData, upiTransactionId: e.target.value })}
                      placeholder="TXN123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Items</h3>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      ➕ Add Item
                    </button>
                  </div>
                  
                  {formData.items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium mb-2">No items added yet</p>
                        <p className="text-gray-500 text-sm">Click &quot;Add Item&quot; to start adding products</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items.map((item, index) => {
                        const selectedItem = getSelectedInventoryItem(item.inventoryId)
                        return (
                          <div key={index} className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dress *</label>
                                <select
                                  required
                                  value={item.inventoryId}
                                  onChange={(e) => handleItemChange(index, 'inventoryId', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="">Select Dress</option>
                                  {inventory.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                      {inv.dressName} ({inv.dressType}) - {inv.dressCode}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                                <select
                                  required
                                  value={item.size}
                                  onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                                  disabled={!selectedItem}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                >
                                  <option value="">Select Size</option>
                                  {selectedItem?.sizes.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </div>
                            {selectedItem && (
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Price:</span>
                                  <span className="text-sm font-semibold text-gray-800">₹{selectedItem.sellingPrice}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Profit:</span>
                                  <span className="text-sm font-semibold text-green-600">₹{selectedItem.sellingPrice - selectedItem.wholesalePrice}/unit</span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                  <span className="text-xs font-medium text-gray-500">Total:</span>
                                  <span className="text-sm font-bold text-blue-600">₹{(selectedItem.sellingPrice * item.quantity).toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end mt-3">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-md transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Sale Image Capture Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Sale Proof Image</label>
                      <p className="text-xs text-gray-500">Capture an image as proof of sale (Optional)</p>
                    </div>
                    {capturedImage && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Image Captured
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {capturedImage ? (
                      <div className="relative group">
                        <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 shadow-lg">
                          <img 
                            src={capturedImage} 
                            alt="Captured sale proof" 
                            className="w-full h-auto max-h-96 object-contain bg-gray-50"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setCapturedImage(null)
                                setFormData({ ...formData, saleImage: '' })
                              }}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg transform hover:scale-105"
                            >
                              🗑️ Remove Image
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedImage(null)
                            setFormData({ ...formData, saleImage: '' })
                          }}
                          className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 md:hidden"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-400 transition-all duration-200">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-medium mb-2">No image captured yet</p>
                          <p className="text-gray-500 text-sm mb-4">Capture a photo as proof of sale</p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Capture Image
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Sticker Selection */}
                    {capturedImage && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="text-lg">🎨</span>
                          Add Verification Sticker
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {stickers.map((sticker) => (
                            <button
                              key={sticker}
                              type="button"
                              onClick={() => addStickerToImage(sticker)}
                              className="px-4 py-2.5 bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg text-xl font-medium transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-md"
                            >
                              {sticker}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">Click a sticker to add it to your image</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Camera Modal */}
                {showCamera && (
                  <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-white">Capture Sale Proof Image</h3>
                        </div>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Camera View */}
                      <div className="p-6">
                        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl mb-4">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-auto max-h-[60vh] object-cover"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                          {selectedSticker && (
                            <div
                              className="absolute text-7xl font-bold text-green-400 opacity-90 pointer-events-none drop-shadow-2xl"
                              style={{
                                left: `${stickerPosition.x}%`,
                                top: `${stickerPosition.y}%`,
                                transform: 'translate(-50%, -50%)',
                                textShadow: '0 0 20px rgba(0,0,0,0.8)',
                              }}
                            >
                              {selectedSticker}
                            </div>
                          )}
                          {/* Capture Frame Overlay */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-4 border-4 border-white border-dashed rounded-lg opacity-50"></div>
                          </div>
                        </div>
                        
                        {/* Sticker Selection for Live Preview */}
                        {!selectedSticker && (
                          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <span className="text-lg">🎨</span>
                              Add Sticker (Optional)
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {stickers.map((sticker) => (
                                <button
                                  key={sticker}
                                  type="button"
                                  onClick={() => setSelectedSticker(sticker)}
                                  className="px-5 py-3 bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg text-2xl font-medium transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-md"
                                >
                                  {sticker}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Select a sticker to overlay on the image</p>
                          </div>
                        )}

                        {selectedSticker && (
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{selectedSticker}</span>
                                <span className="text-sm font-medium text-blue-800">Sticker Selected</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedSticker(null)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200 hover:border-gray-400"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={captureImage}
                            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Capture Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200 hover:border-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formData.items.length === 0}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Record Sale
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

