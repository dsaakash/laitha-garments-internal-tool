'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { format } from 'date-fns'

interface CustomerEnquiry {
  id: number
  customer_name: string
  customer_phone: string
  product_id: number | null
  product_name: string
  product_code: string | null
  fabric_type: string | null
  enquiry_method: 'form' | 'whatsapp'
  status: 'pending' | 'contacted' | 'resolved' | 'closed'
  notes: string | null
  created_at: string
  updated_at: string
  product_dress_name?: string
  product_dress_code?: string
  product_image_url?: string
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomerEnquiry | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadEnquiries()
  }, [filterStatus])

  const loadEnquiries = async () => {
    try {
      const url = filterStatus 
        ? `/api/enquiries?status=${filterStatus}`
        : '/api/enquiries'
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setEnquiries(result.data)
      }
    } catch (error) {
      console.error('Failed to load enquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: number, status: string, notes?: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadEnquiries()
        if (selectedEnquiry?.id === id) {
          setSelectedEnquiry(result.data)
        }
      } else {
        alert('Failed to update enquiry status')
      }
    } catch (error) {
      console.error('Failed to update enquiry:', error)
      alert('Failed to update enquiry status')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return

    try {
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        await loadEnquiries()
        if (selectedEnquiry?.id === id) {
          setShowDetailModal(false)
          setSelectedEnquiry(null)
        }
      } else {
        alert('Failed to delete enquiry')
      }
    } catch (error) {
      console.error('Failed to delete enquiry:', error)
      alert('Failed to delete enquiry')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodIcon = (method: string) => {
    return method === 'whatsapp' ? '💬' : '📝'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading enquiries...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Enquiries</h1>
            <p className="text-gray-600 mt-1">Manage and track customer product enquiries</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            {filterStatus && (
              <button
                onClick={() => setFilterStatus('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Enquiries List */}
        {enquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No enquiries found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {enquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedEnquiry(enquiry)
                  setShowDetailModal(true)
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getMethodIcon(enquiry.enquiry_method)}</span>
                      <h3 className="text-lg font-bold text-gray-900">{enquiry.customer_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-1">📞 {enquiry.customer_phone}</p>
                    <p className="text-gray-700 font-medium mb-2">
                      Product: {enquiry.product_name}
                      {enquiry.product_code && ` (${enquiry.product_code})`}
                    </p>
                    {enquiry.fabric_type && (
                      <p className="text-sm text-gray-500">Fabric: {enquiry.fabric_type}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(enquiry.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`tel:${enquiry.customer_phone}`, '_self')
                      }}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
                      title="Call Customer"
                    >
                      📞 Call
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`https://wa.me/${enquiry.customer_phone.replace(/\D/g, '')}`, '_blank')
                      }}
                      className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm font-medium"
                      title="WhatsApp Customer"
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Enquiry Details</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedEnquiry(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.customer_phone}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`tel:${selectedEnquiry.customer_phone}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      📞 Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedEnquiry.customer_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Product Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Product Name</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.product_name}</p>
                    </div>
                    {selectedEnquiry.product_code && (
                      <div>
                        <p className="text-sm text-gray-500">Product Code</p>
                        <p className="font-medium text-gray-900">{selectedEnquiry.product_code}</p>
                      </div>
                    )}
                    {selectedEnquiry.fabric_type && (
                      <div>
                        <p className="text-sm text-gray-500">Preferred Fabric Type</p>
                        <p className="font-medium text-gray-900">{selectedEnquiry.fabric_type}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Enquiry Method</p>
                      <p className="font-medium text-gray-900">
                        {getMethodIcon(selectedEnquiry.enquiry_method)} {selectedEnquiry.enquiry_method === 'whatsapp' ? 'WhatsApp' : 'Form Submission'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex gap-2 flex-wrap">
                    {['pending', 'contacted', 'resolved', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(selectedEnquiry.id, status)}
                        disabled={updating || selectedEnquiry.status === status}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedEnquiry.status === status
                            ? getStatusColor(status) + ' cursor-default'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="text-gray-900">{format(new Date(selectedEnquiry.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="text-gray-900">{format(new Date(selectedEnquiry.updated_at), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleDelete(selectedEnquiry.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Delete Enquiry
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedEnquiry(null)
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
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
