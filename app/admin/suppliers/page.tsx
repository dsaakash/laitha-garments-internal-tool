'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Supplier } from '@/lib/storage'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    gstPercentage: 0,
    gstAmountRupees: 0,
    gstType: 'percentage' as 'percentage' | 'rupees',
    contacts: [] as Array<{
      contactName: string
      phone: string
      whatsappNumber: string
      isPrimary: boolean
    }>,
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const result = await response.json()
      if (result.success) {
        setSuppliers(result.data)
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingSupplier) {
        const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to update supplier')
          return
        }
      } else {
        const response = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to add supplier')
          return
        }
      }
      
      resetForm()
      await loadSuppliers()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save supplier:', error)
      alert('Failed to save supplier')
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      gstNumber: supplier.gstNumber || '',
      gstPercentage: supplier.gstPercentage || 0,
      gstAmountRupees: supplier.gstAmountRupees || 0,
      gstType: supplier.gstType || 'percentage',
      contacts: (supplier.contacts || []).map(contact => ({
        contactName: contact.contactName,
        phone: contact.phone,
        whatsappNumber: contact.whatsappNumber || '',
        isPrimary: contact.isPrimary || false,
      })),
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        const response = await fetch(`/api/suppliers/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to delete supplier')
          return
        }
        await loadSuppliers()
      } catch (error) {
        console.error('Failed to delete supplier:', error)
        alert('Failed to delete supplier')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: '',
      gstPercentage: 0,
      gstAmountRupees: 0,
      gstType: 'percentage',
      contacts: [],
    })
    setEditingSupplier(null)
  }

  const handleAddContact = () => {
    setFormData({
      ...formData,
      contacts: [
        ...formData.contacts,
        {
          contactName: '',
          phone: '',
          whatsappNumber: '',
          isPrimary: formData.contacts.length === 0, // First contact is primary by default
        },
      ],
    })
  }

  const handleRemoveContact = (index: number) => {
    setFormData({
      ...formData,
      contacts: formData.contacts.filter((_, i) => i !== index),
    })
  }

  const handleContactChange = (index: number, field: string, value: string | boolean) => {
    const newContacts = [...formData.contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    
    // If setting as primary, unset others
    if (field === 'isPrimary' && value === true) {
      newContacts.forEach((contact, i) => {
        if (i !== index) {
          contact.isPrimary = false
        }
      })
    }
    
    setFormData({ ...formData, contacts: newContacts })
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ➕ Add New Supplier
          </button>
        </div>

        {suppliers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No suppliers yet. Add your first supplier!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Add Supplier
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="table-wrapper">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => {
                  const primaryContact = supplier.contacts?.find(c => c.isPrimary) || supplier.contacts?.[0]
                  return (
                    <tr 
                      key={supplier.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSupplier(supplier)
                        setShowDetailModal(true)
                      }}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                          {supplier.contacts && supplier.contacts.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {supplier.contacts.length} contact{supplier.contacts.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {primaryContact ? (
                            <div>
                              <div className="font-medium">{primaryContact.contactName}</div>
                              <div className="text-xs text-gray-400">{primaryContact.phone}</div>
                              {primaryContact.whatsappNumber && (
                                <div className="text-xs text-green-600">📱 {primaryContact.whatsappNumber}</div>
                              )}
                            </div>
                          ) : (
                            supplier.phone
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{supplier.email || '-'}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {supplier.gstPercentage ? `${supplier.gstPercentage}%` : '-'}
                      </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="px-2 py-1.5 sm:px-3 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 rounded-md text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md border border-purple-200 min-w-[50px] sm:min-w-[60px] whitespace-nowrap"
                          title="Edit"
                        >
                          <span className="hidden sm:inline">✏️ </span>Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[95vh] flex flex-col overflow-hidden my-auto">
              {/* Header - Fixed */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowModal(false)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6 min-h-0" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" id="supplier-form">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Number (optional)</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g., 27AABCU9603R1ZX"
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Type</label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3">
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
                  
                  {formData.gstType === 'percentage' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Percentage (optional)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.gstPercentage}
                        onChange={(e) => setFormData({ ...formData, gstPercentage: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 18 for 18%"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter GST percentage (e.g., 18 for 18%). This will be automatically applied to purchase orders.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Amount in Rupees (optional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.gstAmountRupees}
                        onChange={(e) => setFormData({ ...formData, gstAmountRupees: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 500 for ₹500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter fixed GST amount in rupees. This will be automatically added to purchase orders.</p>
                    </div>
                  )}
                </div>

                {/* Contact Persons Section */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Contact Persons</label>
                      <p className="text-xs text-gray-500">Add multiple contact persons with phone and WhatsApp numbers</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddContact}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Contact
                    </button>
                  </div>

                  {formData.contacts.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                      <p className="text-gray-500 text-sm">No contact persons added. Click &quot;Add Contact&quot; to add one.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.contacts.map((contact, index) => (
                        <div key={index} className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Contact {index + 1}</span>
                              {contact.isPrimary && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={contact.isPrimary}
                                  onChange={(e) => handleContactChange(index, 'isPrimary', e.target.checked)}
                                  className="rounded"
                                />
                                Primary
                              </label>
                              {formData.contacts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveContact(index)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name *</label>
                              <input
                                type="text"
                                required
                                value={contact.contactName}
                                onChange={(e) => handleContactChange(index, 'contactName', e.target.value)}
                                placeholder="e.g., John Doe"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                              <input
                                type="tel"
                                required
                                value={contact.phone}
                                onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                placeholder="e.g., +91 9876543210"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Number</label>
                              <input
                                type="tel"
                                value={contact.whatsappNumber}
                                onChange={(e) => handleContactChange(index, 'whatsappNumber', e.target.value)}
                                placeholder="e.g., +91 9876543210"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                </form>
              </div>
              
              {/* Footer - Fixed */}
              <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 sm:py-5 rounded-b-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowModal(false)
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="supplier-form"
                    className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors"
                  >
                    {editingSupplier ? 'Update' : 'Add'} Supplier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Detail Modal */}
        {showDetailModal && selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] sm:max-h-[95vh] flex flex-col overflow-hidden my-auto">
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 sm:px-6 py-4 sm:py-5 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl">🏭</span>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">{selectedSupplier.name}</h2>
                      <p className="text-sm text-purple-100 mt-1">Supplier Details</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedSupplier(null)
                    }}
                    className="text-white hover:text-gray-200 text-2xl leading-none w-8 h-8 flex items-center justify-center bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6 min-h-0" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📋</span> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                        <p className="text-sm font-medium text-gray-900">{selectedSupplier.name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                        <p className="text-sm text-gray-900">{selectedSupplier.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                        <p className="text-sm text-gray-900">{selectedSupplier.email || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedSupplier.address || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* GST Information */}
                  {(selectedSupplier.gstNumber || selectedSupplier.gstPercentage || selectedSupplier.gstAmountRupees) && (
                    <div className="bg-blue-50 rounded-lg p-4 sm:p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>🧾</span> GST Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedSupplier.gstNumber && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">GST Number</label>
                            <p className="text-sm font-medium text-gray-900">{selectedSupplier.gstNumber}</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">GST Type</label>
                          <p className="text-sm text-gray-900 capitalize">{selectedSupplier.gstType || 'Not Set'}</p>
                        </div>
                        {selectedSupplier.gstType === 'percentage' && selectedSupplier.gstPercentage !== undefined && selectedSupplier.gstPercentage > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">GST Percentage</label>
                            <p className="text-sm font-medium text-gray-900">{selectedSupplier.gstPercentage}%</p>
                          </div>
                        )}
                        {selectedSupplier.gstType === 'rupees' && selectedSupplier.gstAmountRupees !== undefined && selectedSupplier.gstAmountRupees > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">GST Amount</label>
                            <p className="text-sm font-medium text-gray-900">₹{selectedSupplier.gstAmountRupees}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Persons */}
                  {selectedSupplier.contacts && selectedSupplier.contacts.length > 0 ? (
                    <div className="bg-green-50 rounded-lg p-4 sm:p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>👥</span> Contact Persons ({selectedSupplier.contacts.length})
                      </h3>
                      <div className="space-y-3">
                        {selectedSupplier.contacts.map((contact, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">Contact {index + 1}</span>
                                {contact.isPrimary && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    Primary
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                <p className="text-sm text-gray-900">{contact.contactName}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                                <p className="text-sm text-gray-900">{contact.phone}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
                                <p className="text-sm text-gray-900">{contact.whatsappNumber || '-'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <span>👥</span> Contact Persons
                      </h3>
                      <p className="text-sm text-gray-500">No contact persons added</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 sm:py-5 rounded-b-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedSupplier(null)
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false)
                      handleEdit(selectedSupplier)
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors"
                  >
                    ✏️ Edit Supplier
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
