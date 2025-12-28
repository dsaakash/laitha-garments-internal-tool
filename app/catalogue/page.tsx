'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PalaceBackground from './PalaceBackground'

// Catalogue data - using the two dress images
const catalogueItems = [
  {
    id: 1,
    name: 'Elegant Green Kurta Set',
    category: 'Kurtis',
    image: '/dress1.png',
    description: 'Beautiful lime green kurta with matching pants, perfect for daily wear',
    price: 'Custom Pricing',
  },
  {
    id: 2,
    name: 'Traditional Yellow Saree',
    category: 'Sarees',
    image: '/dress2.png',
    description: 'Vibrant yellow saree with pink floral motifs and palm tree border design',
    price: 'Custom Pricing',
  },
]

const categories = ['All', 'Kurtis', 'Dresses', 'Sarees']

export default function CataloguePage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

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
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4 sm:px-0">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="professional-card overflow-hidden group animate-fade-in"
              >
                <div className="image-container aspect-[3/4] relative overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-3 sm:p-4"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={item.id <= 2}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="p-5 sm:p-6 bg-white">
                  <div className="mb-3">
                    <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif text-sage-800 mb-2 sm:mb-3 font-semibold leading-tight">{item.name}</h3>
                  <p className="text-sage-600 mb-4 text-xs sm:text-sm leading-relaxed line-clamp-2">{item.description}</p>
                  <p className="text-primary-600 font-bold mb-4 sm:mb-5 text-base sm:text-lg">{item.price}</p>
                  <button
                    onClick={() => handleWhatsApp(item.name)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 shadow-medium hover:shadow-large transform hover:scale-[1.02] active:scale-95"
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
            Don't see what you're looking for?
          </h2>
          <p className="text-sage-600 mb-6 sm:mb-8 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4">
            We can create a custom piece just for you. Share your requirements and we'll make it happen.
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

