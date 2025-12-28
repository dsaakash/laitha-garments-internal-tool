'use client'

import Link from 'next/link'

export default function HeroSection() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/917204219541', '_blank')
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-primary-50/30 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary-100/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-sage-100/20 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto text-center z-10 relative">
        <div className="mb-4 sm:mb-6 animate-fade-in">
          <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            Quality Sarees, Dresses & Kurtis — Made for YOU
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-sage-800 mb-4 sm:mb-6 animate-fade-in leading-tight px-2">
          🌸 LALITHA GARMENTS
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-primary-600 mb-3 sm:mb-4 animate-fade-in font-medium px-4 italic">
          Clothes that fit your body, comfort, and lifestyle — not just trends.
        </p>
        <p className="text-base sm:text-lg md:text-xl font-serif text-sage-700 mb-4 sm:mb-6 animate-fade-in px-4 italic">
          ನಿಮ್ಮ ದೇಹಕ್ಕೆ, ಆರಾಮಕ್ಕೆ ಮತ್ತು ಜೀವನಶೈಲಿಗೆ ಹೊಂದುವ ಬಟ್ಟೆಗಳು — ಟ್ರೆಂಡ್‌ಗಳಿಗಷ್ಟೇ ಅಲ್ಲ.
        </p>
        <p className="text-sm sm:text-base md:text-lg text-sage-600 mb-8 sm:mb-10 max-w-2xl mx-auto animate-fade-in leading-relaxed px-4">
          Customized & Ready-to-Wear Sarees, Kurtis and Dresses — Quality You Can Feel.
          <br className="hidden sm:block" />
          <span className="block mt-2">ಕಸ್ಟಮೈಸ್ ಮತ್ತು ರೆಡಿಮೇಡ್ ಸೀರೆ, ಕುರ್ತಿ ಮತ್ತು ಡ್ರೆಸ್‌ಗಳು — ಗುಣಮಟ್ಟವನ್ನು ಸ್ಪರ್ಶಿಸಿ.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-fade-in px-4">
          <button
            onClick={handleWhatsApp}
            className="group bg-primary-500 hover:bg-primary-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-large transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden w-full sm:w-auto min-h-[44px]"
          >
            <span className="relative z-10">👉 Get Free Fabric Consultation</span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </button>
          <Link
            href="/catalogue"
            className="bg-white hover:bg-cream-50 text-primary-600 border-2 border-primary-500 px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-medium transform transition-all duration-300 hover:scale-105 hover:shadow-large w-full sm:w-auto min-h-[44px] flex items-center justify-center"
          >
            Explore Our Collection
          </Link>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none"></div>
    </section>
  )
}

