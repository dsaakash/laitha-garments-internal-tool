import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Cloudinary is not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert buffer to base64 data URI
    const base64 = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64}`

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const publicId = `lalitha_garments/${timestamp}_${sanitizedName}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      public_id: publicId,
      folder: 'lalitha_garments',
      resource_type: 'auto',
      overwrite: false,
      invalidate: true,
    })

    // Return Cloudinary URL
    return NextResponse.json({ 
      success: true, 
      url: result.secure_url // Use secure_url for HTTPS
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    )
  }
}

