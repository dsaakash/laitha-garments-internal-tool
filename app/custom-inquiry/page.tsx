'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CustomInquiryPage() {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    requirement: '',
    fabric: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create WhatsApp message
    const message = `Hello! I'm interested in a custom order.

Name: ${formData.name}
Mobile: ${formData.mobile}
Requirement: ${formData.requirement}
Fabric Preference: ${formData.fabric}

Please contact me to discuss further.`

    // Open WhatsApp with pre-filled message
    window.open(
      `https://wa.me/917204219541?text=${encodeURIComponent(message)}`,
      '_blank'
    )

    setSubmitted(true)
    // Reset form after a delay
    setTimeout(() => {
      setFormData({ name: '', mobile: '', requirement: '', fabric: '' })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-serif text-sage-800 font-semibold hover:text-primary-600 transition-colors">
            Lalitha Garments
          </Link>
          <Link
            href="/"
            className="text-sm sm:text-base text-sage-600 hover:text-primary-600 transition-colors font-medium flex items-center gap-1"
          >
            <span className="hidden sm:inline">←</span> Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-center text-sage-800 mb-3 sm:mb-4">
            Custom Order Inquiry
          </h1>
          <p className="text-center text-sage-600 mb-6 sm:mb-8 text-sm sm:text-base px-4">
            Tell us about your requirements and we'll create something perfect for you
          </p>

          {submitted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-semibold text-sage-800 mb-2">
                Thank You!
              </h2>
              <p className="text-sage-600">
                We've opened WhatsApp for you. Please send the message to complete your inquiry.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sage-800 font-semibold mb-2 text-sm sm:text-base"
                >
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base border-2 border-cream-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors bg-cream-50 min-h-[44px]"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="mobile"
                  className="block text-sage-800 font-semibold mb-2 text-sm sm:text-base"
                >
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base border-2 border-cream-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors bg-cream-50 min-h-[44px]"
                  placeholder="Enter your 10-digit mobile number"
                  pattern="[0-9]{10}"
                  maxLength={10}
                />
              </div>

              <div>
                <label
                  htmlFor="requirement"
                  className="block text-sage-800 font-semibold mb-2 text-sm sm:text-base"
                >
                  What are you looking for? *
                </label>
                <textarea
                  id="requirement"
                  name="requirement"
                  required
                  value={formData.requirement}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 text-base border-2 border-cream-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors bg-cream-50 resize-none min-h-[120px]"
                  placeholder="E.g., A kurta for office wear, size M, prefer cotton fabric, need it in 2 weeks..."
                />
              </div>

              <div>
                <label
                  htmlFor="fabric"
                  className="block text-sage-800 font-semibold mb-2 text-sm sm:text-base"
                >
                  Fabric Preference
                </label>
                <input
                  type="text"
                  id="fabric"
                  name="fabric"
                  value={formData.fabric}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base border-2 border-cream-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors bg-cream-50 min-h-[44px]"
                  placeholder="E.g., Cotton, Silk, Georgette, Chiffon..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px]"
              >
                Send Inquiry via WhatsApp
              </button>

              <p className="text-sm text-sage-600 text-center">
                * Required fields. We'll contact you on WhatsApp to discuss your requirements in detail.
              </p>
            </form>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-sage-800 mb-3">
            What happens next?
          </h3>
          <ul className="space-y-2 text-sage-600">
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>We'll review your requirements and get back to you within 24 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>We'll discuss fabric options, design details, and pricing</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>Once confirmed, we'll start creating your custom piece</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>We'll keep you updated throughout the process</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

