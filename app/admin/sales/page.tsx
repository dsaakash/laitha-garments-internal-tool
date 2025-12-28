'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { storage, Sale, InventoryItem, Customer } from '@/lib/storage'
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
    items: [] as Array<{
      inventoryId: string
      size: string
      quantity: number
    }>,
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear])

  const loadData = () => {
    setInventory(storage.getInventory())
    setCustomers(storage.getCustomers())
    loadSales()
  }

  const loadSales = () => {
    let allSales = storage.getSales()
    
    if (filterYear) {
      allSales = allSales.filter(sale => {
        const saleYear = new Date(sale.date).getFullYear().toString()
        return saleYear === filterYear
      })
    }
    
    if (filterMonth) {
      allSales = allSales.filter(sale => {
        const saleMonth = (new Date(sale.date).getMonth() + 1).toString().padStart(2, '0')
        return saleMonth === filterMonth
      })
    }
    
    // Sort by date descending
    allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setSales(allSales)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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
    
    storage.addSale({
      date: formData.date,
      partyName: formData.partyName,
      customerId: useCustomer && formData.customerId ? formData.customerId : undefined,
      billNumber: formData.billNumber,
      items: saleItems,
      totalAmount,
      paymentMode: formData.paymentMode,
      upiTransactionId: formData.upiTransactionId || undefined,
    })
    
    resetForm()
    loadSales()
    setShowModal(false)
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      partyName: '',
      customerId: '',
      billNumber: '',
      paymentMode: 'Cash',
      upiTransactionId: '',
      items: [],
    })
    setUseCustomer(false)
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
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Record New Sale
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
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Payment: <span className="font-medium">{sale.paymentMode}</span>
                      {sale.upiTransactionId && (
                        <span className="ml-2 text-gray-500">• UPI: {sale.upiTransactionId}</span>
                      )}
                    </p>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Record New Sale</h2>
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
                    <p className="text-gray-500 text-sm">No items added. Click &quot;Add Item&quot; to start.</p>
                  ) : (
                    <div className="space-y-4">
                      {formData.items.map((item, index) => {
                        const selectedItem = getSelectedInventoryItem(item.inventoryId)
                        return (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
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
                              <div className="text-sm text-gray-600 mb-2">
                                Price: ₹{selectedItem.sellingPrice} • Profit: ₹{selectedItem.sellingPrice - selectedItem.wholesalePrice} per unit
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
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
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Record Sale
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

