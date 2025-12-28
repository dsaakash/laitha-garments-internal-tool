'use client'

export default function FreeConsultation() {
  const handleWhatsApp = () => {
    const message = 'Hello! I would like to get a free fabric and fit consultation.'
    window.open(`https://wa.me/917204219541?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-cream-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-5xl sm:text-6xl mb-4">🎁</div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-sage-800 mb-4 sm:mb-6 font-bold">
          🎁 Get This FREE From Us
        </h2>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 mb-6">
          <div className="text-4xl mb-4">👉</div>
          <h3 className="text-xl sm:text-2xl font-serif text-primary-600 mb-4 font-semibold">
            Free Fabric & Fit Consultation (10 minutes)
          </h3>
          <p className="text-base sm:text-lg text-sage-700 mb-3 leading-relaxed">
            <strong>English:</strong> Know which fabric, design, and style suits <strong>YOU</strong> before buying.
          </p>
          <p className="text-base sm:text-lg text-sage-700 mb-6 leading-relaxed">
            <strong>Kannada:</strong> ಖರೀದಿಸುವ ಮೊದಲು ನಿಮಗೆ ಯಾವ ಬಟ್ಟೆ ಸೂಕ್ತವೆಂದು ತಿಳಿಯಿರಿ.
          </p>
          <button
            onClick={handleWhatsApp}
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-large transform transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px]"
          >
            👉 Get Free Consultation on WhatsApp
            <br className="sm:hidden" />
            <span className="text-sm sm:text-base">👉 WhatsApp ನಲ್ಲಿ ಉಚಿತ ಸಲಹೆ ಪಡೆಯಿರಿ</span>
          </button>
        </div>
      </div>
    </section>
  )
}

