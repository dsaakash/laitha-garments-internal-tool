'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Sale, BusinessProfile, Customer } from '@/lib/storage'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

export default function InvoicesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [salesRes, businessRes, customersRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/business'),
        fetch('/api/customers'),
      ])
      const salesResult = await salesRes.json()
      const businessResult = await businessRes.json()
      const customersResult = await customersRes.json()
      
      if (salesResult.success) {
        const allSales = salesResult.data
        allSales.sort((a: Sale, b: Sale) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setSales(allSales)
      }
      if (businessResult.success && businessResult.data) {
        setBusinessProfile(businessResult.data)
      }
      if (customersResult.success) {
        setCustomers(customersResult.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const getCustomer = (sale: Sale): Customer | null => {
    if (!sale.customerId) return null
    return customers.find(c => c.id === sale.customerId) || null
  }

  const generatePDF = (sale: Sale, returnBlob: boolean = false): Blob | void => {
    if (!businessProfile) {
      alert('Please set up your business profile first!')
      return
    }

    try {
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(businessProfile.businessName, 14, 20)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      let yPos = 28
      doc.text(businessProfile.address, 14, yPos)
      yPos += 6
      doc.text(`Phone: ${businessProfile.phone} | Email: ${businessProfile.email}`, 14, yPos)
      if (businessProfile.gstNumber) {
        yPos += 6
        doc.text(`GST: ${businessProfile.gstNumber}`, 14, yPos)
      }

      // Invoice Details
      yPos += 12
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', 14, yPos)
      
      yPos += 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const customer = getCustomer(sale)
      
      doc.text(`Bill Number: ${sale.billNumber}`, 14, yPos)
      yPos += 6
      doc.text(`Date: ${format(new Date(sale.date), 'dd MMM yyyy')}`, 14, yPos)
      yPos += 6
      doc.text(`Party Name: ${sale.partyName}`, 14, yPos)
      if (customer) {
        yPos += 6
        doc.text(`Phone: ${customer.phone}`, 14, yPos)
        if (customer.address) {
          yPos += 6
          doc.text(`Address: ${customer.address}`, 14, yPos)
        }
      }

      // Table data
      const tableData = sale.items.map(item => [
        item.dressName,
        item.dressType,
        item.dressCode,
        item.size,
        item.quantity.toString(),
        `₹${item.sellingPrice}`,
        `₹${(item.sellingPrice * item.quantity).toLocaleString()}`,
      ])

      let finalY = yPos + 10

      // Try to use autoTable, fallback to manual table if it fails
      try {
        if (typeof (doc as any).autoTable === 'function') {
          doc.autoTable({
            startY: yPos + 10,
            head: [['Dress Name', 'Type', 'Code', 'Size', 'Qty', 'Price', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [128, 0, 128], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9 },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 25 },
              2: { cellWidth: 25 },
              3: { cellWidth: 20 },
              4: { cellWidth: 15 },
              5: { cellWidth: 25 },
              6: { cellWidth: 25 },
            },
          })
          finalY = doc.lastAutoTable?.finalY || yPos + 10 + (tableData.length * 8)
        } else {
          throw new Error('autoTable not available')
        }
      } catch (tableError) {
        // Fallback: Create table manually
        console.warn('autoTable failed, using manual table:', tableError)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Dress Name', 14, finalY)
        doc.text('Type', 60, finalY)
        doc.text('Code', 90, finalY)
        doc.text('Size', 120, finalY)
        doc.text('Qty', 145, finalY)
        doc.text('Price', 160, finalY)
        doc.text('Total', 185, finalY)
        
        doc.setFont('helvetica', 'normal')
        finalY += 6
        
        sale.items.forEach((item, index) => {
          if (finalY > doc.internal.pageSize.height - 30) {
            doc.addPage()
            finalY = 20
          }
          doc.text(item.dressName.substring(0, 20), 14, finalY)
          doc.text(item.dressType, 60, finalY)
          doc.text(item.dressCode, 90, finalY)
          doc.text(item.size, 120, finalY)
          doc.text(item.quantity.toString(), 145, finalY)
          doc.text(`₹${item.sellingPrice}`, 160, finalY)
          doc.text(`₹${(item.sellingPrice * item.quantity).toLocaleString()}`, 185, finalY)
          finalY += 6
        })
      }
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total Amount: ₹${sale.totalAmount.toLocaleString()}`, 14, finalY + 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Payment Mode: ${sale.paymentMode}`, 14, finalY + 16)
      if (sale.upiTransactionId) {
        doc.text(`UPI Transaction ID: ${sale.upiTransactionId}`, 14, finalY + 22)
      }

      // Footer
      doc.setFontSize(8)
      doc.text('Thank you for your business!', 14, doc.internal.pageSize.height - 10)

      if (returnBlob) {
        return doc.output('blob') as Blob
      } else {
        // Save PDF
        doc.save(`Invoice_${sale.billNumber}_${format(new Date(sale.date), 'yyyyMMdd')}.pdf`)
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error details:', errorMessage, error)
      alert(`Error generating PDF: ${errorMessage}. Please check the console for details.`)
    }
  }

  const sendViaWhatsApp = async (sale: Sale) => {
    if (!businessProfile) {
      alert('Please set up your business profile first!')
      return
    }

    try {
      // Get customer phone number or use business WhatsApp number
      const customer = getCustomer(sale)
      let phoneNumber = ''
      
      if (customer && customer.phone) {
        phoneNumber = customer.phone.replace(/[^0-9]/g, '')
      } else {
        // If no customer, ask user to enter phone number
        const inputPhone = prompt('Enter customer WhatsApp number (with country code, e.g., 919876543210):')
        if (!inputPhone) return
        phoneNumber = inputPhone.replace(/[^0-9]/g, '')
      }

      if (!phoneNumber) {
        alert('Please enter a valid phone number')
        return
      }

      // Generate PDF on server and get shareable link
      const response = await fetch('/api/invoice/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sale,
          businessProfile,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Convert response to blob
      const pdfBlob = await response.blob()
      const fileName = `Invoice_${sale.billNumber}_${format(new Date(sale.date), 'yyyyMMdd')}.pdf`
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

      // Create invoice message
      let message = `*Invoice - ${businessProfile.businessName}*\n\n`
      message += `Bill Number: ${sale.billNumber}\n`
      message += `Date: ${format(new Date(sale.date), 'dd MMM yyyy')}\n`
      message += `Party: ${sale.partyName}\n\n`
      message += `*Items:*\n`
      
      sale.items.forEach((item, index) => {
        message += `${index + 1}. ${item.dressName} (${item.dressType})\n`
        message += `   Code: ${item.dressCode} | Size: ${item.size} | Qty: ${item.quantity}\n`
        message += `   Price: ₹${item.sellingPrice} | Total: ₹${(item.sellingPrice * item.quantity).toLocaleString()}\n\n`
      })
      
      message += `*Total Amount: ₹${sale.totalAmount.toLocaleString()}*\n`
      message += `Payment: ${sale.paymentMode}`
      if (sale.upiTransactionId) {
        message += ` (${sale.upiTransactionId})`
      }
      message += `\n\n📎 Please find the invoice PDF attached.\n\nThank you for your business!`

      // Try Web Share API first (works on mobile and some desktop browsers - can share files directly)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Invoice - ${sale.billNumber}`,
            text: message,
            files: [file],
          })
          // Successfully shared via Web Share API
          return
        } catch (shareError: any) {
          // User cancelled or share failed, fall through to WhatsApp method
          if (shareError.name !== 'AbortError') {
            console.log('Web Share API failed, using WhatsApp method:', shareError)
          }
        }
      }

      // Fallback: WhatsApp method with improved file sharing
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Open WhatsApp with message
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')

      // Show modal with PDF options (NO AUTO-DOWNLOAD)
      setTimeout(() => {
        const modal = document.createElement('div')
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        `
        
        const content = document.createElement('div')
        content.style.cssText = `
          background: white;
          padding: 32px;
          border-radius: 12px;
          max-width: 600px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `
        
        content.innerHTML = `
          <h2 style="margin-bottom: 16px; color: #25D366; font-size: 24px;">📱 Share Invoice via WhatsApp</h2>
          <p style="margin-bottom: 24px; color: #666;">WhatsApp is now open. Choose how to attach the PDF:</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #25D366;">
            <p style="font-weight: bold; margin-bottom: 12px; color: #25D366;">✨ Method 1: Drag & Drop (Recommended)</p>
            <p style="color: #666; margin-bottom: 16px; font-size: 14px;">Open the PDF in a new tab, then drag it directly into the WhatsApp chat window</p>
            <button id="openPdfBtn" style="
              background: #25D366;
              color: white;
              border: none;
              padding: 14px 28px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              width: 100%;
            ">📄 Open PDF in New Tab</button>
          </div>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-weight: bold; margin-bottom: 12px;">📥 Method 2: Download & Attach</p>
            <p style="color: #666; margin-bottom: 16px; font-size: 14px;">Download the PDF, then attach it using the 📎 icon in WhatsApp</p>
            <button id="downloadPdfBtn" style="
              background: #128C7E;
              color: white;
              border: none;
              padding: 14px 28px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              width: 100%;
            ">📥 Download PDF</button>
          </div>
          <button id="closeModalBtn" style="
            background: #e0e0e0;
            color: #333;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
          ">Close</button>
        `
        
        modal.appendChild(content)
        document.body.appendChild(modal)
        
        const openPdfBtn = document.getElementById('openPdfBtn')
        const downloadBtn = document.getElementById('downloadPdfBtn')
        const closeBtn = document.getElementById('closeModalBtn')
        
        openPdfBtn?.addEventListener('click', () => {
          window.open(pdfUrl, '_blank')
        })
        
        downloadBtn?.addEventListener('click', () => {
          const link = document.createElement('a')
          link.href = pdfUrl
          link.download = fileName
          link.click()
        })
        
        closeBtn?.addEventListener('click', () => {
          modal.remove()
          URL.revokeObjectURL(pdfUrl)
        })
        
        // Clean up after 10 minutes
        setTimeout(() => {
          if (document.body.contains(modal)) {
            modal.remove()
          }
          URL.revokeObjectURL(pdfUrl)
        }, 600000)
      }, 500)
    } catch (error) {
      console.error('WhatsApp send error:', error)
      alert('Error preparing invoice for WhatsApp. Please try again.')
    }
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Invoices</h1>

        {!businessProfile && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
            Please set up your business profile first to generate invoices. <a href="/admin/business" className="underline">Go to Business Setup</a>
          </div>
        )}

        {sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No sales recorded yet. Record a sale to generate invoices!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(sale.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {sale.billNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{sale.partyName}</p>
                        {getCustomer(sale) && (
                          <p className="text-xs text-gray-500">{getCustomer(sale)?.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₹{sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.paymentMode}
                      {sale.upiTransactionId && (
                        <span className="block text-xs text-gray-400">{sale.upiTransactionId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            try {
                              generatePDF(sale)
                            } catch (err) {
                              console.error('PDF generation failed:', err)
                              alert('Failed to generate PDF. Please try again.')
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download PDF"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={() => sendViaWhatsApp(sale)}
                          className="text-green-600 hover:text-green-900"
                          title="Send via WhatsApp"
                        >
                          💬 WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

