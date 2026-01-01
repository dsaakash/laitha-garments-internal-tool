'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PalaceBackground from './PalaceBackground'

interface CatalogueItem {
  id: string
  name: string
  category: string
  image: string
  description: string
  price: string
}

const categories = ['All', 'Kurtis', 'Dresses', 'Sarees']

// Map dress types to categories
const getCategory = (dressType: string): string => {
  const type = dressType.toLowerCase()
  if (type.includes('kurta') || type.includes('kurti')) return 'Kurtis'
  if (type.includes('dress') || type.includes('anarkali')) return 'Dresses'
  if (type.includes('saree') || type.includes('sari')) return 'Sarees'
  return 'Kurtis' // default
}

export default function CataloguePage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCatalogueItems()
  }, [])

  const loadCatalogueItems = async () => {
    try {
      const response = await fetch('/api/inventory')
      const result = await response.json()
      if (result.success) {
        const items: CatalogueItem[] = result.data.map((item: any) => ({
          id: item.id,
          name: item.dressName,
          category: getCategory(item.dressType),
          image: item.imageUrl || '/dress1.png',
          description: `${item.dressType} - ${item.dressCode || ''}`,
          price: 'Custom Pricing',
        }))
        setCatalogueItems(items)
      }
    } catch (error) {
      console.error('Failed to load catalogue items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems =
    selectedCategory === 'All'
      ? catalogueItems
      : catalogueItems.filter((item) => item.category === selectedCategory)

  const handleWhatsApp = (itemName: string) => {
    const message = `Hi, I'm interested in ${itemName}. Can you provide more details?`
    window.open(`https://wa.me/917204219541?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Jaipur Palace Scene Background */}
      <PalaceBackground />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-white/80 via-white/70 to-white/80 backdrop-blur-[0.5px]"></div>
      
      {/* Content */}
      <div className="relative z-10">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-center text-sage-800 mb-3 sm:mb-4 font-bold">
              Our Collection
            </h1>
            <p className="text-center text-sage-600 mb-4 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
              Browse our curated ready-made collections
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-primary-600 mx-auto rounded-full"></div>
          </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white shadow-lg scale-105'
                  : 'bg-white/90 backdrop-blur-sm text-sage-700 hover:bg-white hover:shadow-md border border-cream-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Catalogue Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sage-600 text-lg">Loading collection...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 px-4 sm:px-0">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in"
              >
                {/* Image Container - Full Coverage */}
                <div className="relative w-full h-[450px] sm:h-[500px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={item.id <= 2}
                  />
                  {/* Category Badge Overlay */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/95 backdrop-blur-sm text-primary-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-md">
                      {item.category}
                    </span>
                  </div>
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                
                {/* Content Section */}
                <div className="p-6 sm:p-7 bg-white">
                  <h3 className="text-2xl sm:text-2xl font-serif text-gray-900 mb-2 font-bold leading-tight line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-500 mb-1 text-sm font-medium">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 mb-5 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Price</p>
                      <p className="text-primary-600 font-bold text-lg">{item.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWhatsApp(item.name)}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-100"
                  >
                    Inquire on WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sage-600 text-lg">No items found in this category.</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center professional-card p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-cream-50/95 to-white/95 backdrop-blur-sm mx-4 sm:mx-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-sage-800 mb-3 sm:mb-4 font-semibold px-4">
            Don&apos;t see what you&apos;re looking for?
          </h2>
          <p className="text-sage-600 mb-6 sm:mb-8 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4">
            We can create a custom piece just for you. Share your requirements and we&apos;ll make it happen.
          </p>
          <Link
            href="/custom-inquiry"
            className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 shadow-medium hover:shadow-large transform hover:scale-105 active:scale-95"
          >
            Request Custom Order
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}

