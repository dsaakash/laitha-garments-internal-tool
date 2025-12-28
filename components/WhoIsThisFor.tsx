export default function WhoIsThisFor() {
  const audiences = [
    {
      icon: '💼',
      title: 'Working women',
      titleKn: 'ಉದ್ಯೋಗದಲ್ಲಿರುವ ಮಹಿಳೆಯರಿಗೆ',
    },
    {
      icon: '🏠',
      title: 'Homemakers',
      titleKn: 'ಗೃಹಿಣಿಯರಿಗೆ',
    },
    {
      icon: '👰',
      title: 'Brides & families',
      titleKn: 'ವಧು ಮತ್ತು ಕುಟುಂಬದವರಿಗೆ',
    },
    {
      icon: '✨',
      title: 'Quality seekers',
      titleKn: 'ಆರಾಮ ಮತ್ತು ಗುಣಮಟ್ಟ ಬಯಸುವವರಿಗೆ',
    },
    {
      icon: '🔄',
      title: 'Tired of poor quality',
      titleKn: 'ಕಡಿಮೆ ಗುಣಮಟ್ಟದ ಬಟ್ಟೆಗಳಿಂದ ಬೇಸತ್ತವರಿಗೆ',
    },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-center text-sage-800 mb-4 sm:mb-6 font-bold">
          ❤️ Who Is This For?
        </h2>
        <p className="text-center text-sage-600 mb-4 text-base sm:text-lg px-4">
          <strong>English:</strong> This is perfect for:
        </p>
        <p className="text-center text-sage-600 mb-8 sm:mb-12 text-base sm:text-lg px-4">
          <strong>Kannada:</strong> ಇದು ಯಾರಿಗೆ ಸೂಕ್ತ?
        </p>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-cream-50 to-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-cream-200"
            >
              <div className="text-3xl sm:text-4xl mb-3">{audience.icon}</div>
              <h3 className="text-lg sm:text-xl font-semibold text-sage-800 mb-2">{audience.title}</h3>
              <p className="text-sm sm:text-base text-sage-600">{audience.titleKn}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

