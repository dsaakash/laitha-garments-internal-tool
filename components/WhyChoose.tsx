export default function WhyChoose() {
  const features = [
    {
      icon: '🎨',
      title: 'Fabric-first approach',
      titleKn: 'ಫ್ಯಾಬ್ರಿಕ್ ಗುಣಮಟ್ಟಕ್ಕೆ ಮೊದಲ ಆದ್ಯತೆ',
      description: 'No compromise on quality',
      descriptionKn: 'ಗುಣಮಟ್ಟದಲ್ಲಿ ಯಾವುದೇ ರಾಜಿ ಇಲ್ಲ',
    },
    {
      icon: '💬',
      title: 'Personalized guidance',
      titleKn: 'ವೈಯಕ್ತಿಕ ಸಲಹೆ',
      description: 'Before purchase consultation',
      descriptionKn: 'ಖರೀದಿಗೆ ಮೊದಲು ಸಲಹೆ',
    },
    {
      icon: '📏',
      title: 'Perfect fitting',
      titleKn: 'ಸೂಕ್ತ ಫಿಟ್',
      description: 'For customized wear',
      descriptionKn: 'ಕಸ್ಟಮೈಸ್ ಬಟ್ಟೆಗಳಿಗೆ',
    },
    {
      icon: '💎',
      title: 'Honest pricing',
      titleKn: 'ನಿಷ್ಠಾವಂತ ಬೆಲೆ',
      description: 'Transparent suggestions',
      descriptionKn: 'ಸ್ಪಷ್ಟ ಮಾರ್ಗದರ್ಶನ',
    },
    {
      icon: '🏢',
      title: 'Suitable for all occasions',
      titleKn: 'ಎಲ್ಲಾ ಸಂದರ್ಭಗಳಿಗೆ ಸೂಕ್ತ',
      description: 'Office, daily wear & functions',
      descriptionKn: 'ದಿನನಿತ್ಯ, ಆಫೀಸ್ ಮತ್ತು ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ',
    },
  ]

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-sage-50 to-cream-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-center text-sage-800 mb-4 px-4">
          💎 What Makes Us Different
        </h2>
        <p className="text-center text-sage-600 mb-8 sm:mb-12 text-base sm:text-lg px-4">
          ✔ Why Choose Lalitha Garments?
        </p>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
              <h3 className="text-lg sm:text-xl font-semibold text-sage-800 mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-sage-600 mb-2">{feature.description}</p>
              <p className="text-sm sm:text-base text-sage-700 font-medium">{feature.titleKn}</p>
              <p className="text-sm text-sage-600">{feature.descriptionKn}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

