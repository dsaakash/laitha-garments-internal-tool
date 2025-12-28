'use client'

import Link from 'next/link'

export default function WhatWeDo() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-center text-sage-800 mb-8 sm:mb-12 px-4">
          🌼 Our Core Collections
        </h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Sarees */}
          <div className="professional-card p-6 sm:p-8 bg-gradient-to-br from-cream-50 to-white border border-cream-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-2xl sm:text-3xl">
              🎀
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-sage-800 mb-3 sm:mb-4 font-semibold">Sarees</h3>
            <p className="text-sage-600 mb-2 leading-relaxed text-sm sm:text-base">
              <strong>English:</strong> Daily, Office, Festival, Function wear
            </p>
            <p className="text-sage-600 mb-5 sm:mb-6 leading-relaxed text-sm sm:text-base">
              <strong>Kannada:</strong> ದಿನನಿತ್ಯ, ಆಫೀಸ್, ಹಬ್ಬ, ಕಾರ್ಯಕ್ರಮ
            </p>
          </div>

          {/* Kurtis & Dresses */}
          <div className="professional-card p-6 sm:p-8 bg-gradient-to-br from-primary-50 to-white border border-primary-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-200 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-2xl sm:text-3xl">
              👗
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-sage-800 mb-3 sm:mb-4 font-semibold">Kurtis & Dresses</h3>
            <p className="text-sage-600 mb-2 leading-relaxed text-sm sm:text-base">
              <strong>English:</strong> Ready-made & Customized
            </p>
            <p className="text-sage-600 mb-5 sm:mb-6 leading-relaxed text-sm sm:text-base">
              <strong>Kannada:</strong> ರೆಡಿಮೇಡ್ ಮತ್ತು ಕಸ್ಟಮೈಸ್
            </p>
          </div>
        </div>
        <div className="mt-8 sm:mt-12 text-center px-4">
          <p className="text-base sm:text-lg text-sage-700 max-w-3xl mx-auto leading-relaxed mb-4">
            <strong>English:</strong> Lalitha Garments is a women-focused clothing brand offering high-quality sarees, kurtis, and dresses. We work on both customized stitching and catalogue-based ready designs, carefully selected based on customer comfort, fabric quality, and occasion needs.
          </p>
          <p className="text-base sm:text-lg text-sage-700 max-w-3xl mx-auto leading-relaxed">
            <strong>Kannada:</strong> ಲಲಿತಾ ಗಾರ್ಮೆಂಟ್ಸ್ ಮಹಿಳೆಯರಿಗಾಗಿ ವಿಶೇಷವಾಗಿ ರೂಪುಗೊಂಡ ಬಟ್ಟೆ ಅಂಗಡಿ. ನಾವು ಉನ್ನತ ಗುಣಮಟ್ಟದ ಸೀರೆ, ಕುರ್ತಿ ಮತ್ತು ಡ್ರೆಸ್‌ಗಳನ್ನು ಕಸ್ಟಮೈಸ್ ಸ್ಟಿಚಿಂಗ್ ಮತ್ತು ಕ್ಯಾಟಲಾಗ್ ಆಧಾರಿತ ರೆಡಿಮೇಡ್ ವಿನ್ಯಾಸಗಳಲ್ಲಿ ಒದಗಿಸುತ್ತೇವೆ.
          </p>
        </div>
      </div>
    </section>
  )
}

