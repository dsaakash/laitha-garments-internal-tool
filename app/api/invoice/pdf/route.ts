import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sale, businessProfile } = await request.json()

    if (!businessProfile || !sale) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      )
    }

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
    
    doc.text(`Bill Number: ${sale.billNumber}`, 14, yPos)
    yPos += 6
    doc.text(`Date: ${format(new Date(sale.date), 'dd MMM yyyy')}`, 14, yPos)
    yPos += 6
    doc.text(`Party Name: ${sale.partyName}`, 14, yPos)

    // Table data
    const tableData = sale.items.map((item: any) => [
      item.dressName,
      item.dressType,
      item.dressCode,
      item.size,
      item.quantity.toString(),
      `₹${item.sellingPrice}`,
      `₹${(item.sellingPrice * item.quantity).toLocaleString()}`,
    ])

    let finalY = yPos + 10

    // Try to use autoTable
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
      }
    } catch (tableError) {
      // Fallback: Create table manually
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
      
      sale.items.forEach((item: any) => {
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

    // Total
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

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice_${sale.billNumber}_${format(new Date(sale.date), 'yyyyMMdd')}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

