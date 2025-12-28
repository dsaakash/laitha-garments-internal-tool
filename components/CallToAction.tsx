'use client'

export default function CallToAction() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/917204219541', '_blank')
  }

  const handleCall = () => {
    window.location.href = 'tel:+917204219541'
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 sm:mb-6 font-bold">
          ✨ Ready to Wear Confidence, Comfort & Quality?
        </h2>
        <p className="text-base sm:text-lg md:text-xl mb-3 opacity-90">
          <strong>English:</strong> Message us today and experience garments made with care, not compromise.
        </p>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90">
          <strong>Kannada:</strong> ಇಂದೇ ಸಂಪರ್ಕಿಸಿ — ಆರಾಮ, ಗುಣಮಟ್ಟ ಮತ್ತು ನಂಬಿಕೆಯಿಂದ ಮಾಡಿದ ಬಟ್ಟೆಗಳನ್ನು ಅನುಭವಿಸಿ.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={handleWhatsApp}
            className="bg-white text-primary-600 hover:bg-cream-50 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px] w-full sm:w-auto"
          >
            👉 Chat on WhatsApp
          </button>
          <button
            onClick={handleCall}
            className="bg-primary-500 hover:bg-primary-400 text-white border-2 border-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px] w-full sm:w-auto"
          >
            Call Us: +91 7204219541
          </button>
        </div>
      </div>
    </section>
  )
}

