export default function CustomizationProcess() {
  const steps = [
    {
      number: '1',
      title: 'Contact Us',
      description: 'Reach out via WhatsApp or call to discuss your requirements.',
    },
    {
      number: '2',
      title: 'Share Your Requirement',
      description: 'Tell us about your style preferences, occasion, and any specific needs.',
    },
    {
      number: '3',
      title: 'Fabric & Design Suggestions',
      description: 'We provide personalized recommendations based on your requirements.',
    },
    {
      number: '4',
      title: 'Customization',
      description: 'We create your piece with attention to every detail and measurement.',
    },
    {
      number: '5',
      title: 'Dispatch',
      description: 'Your custom piece is carefully packaged and delivered across India.',
    },
  ]

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary-50 to-cream-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-serif text-center text-sage-800 mb-4">
          Custom Order Process
        </h2>
        <p className="text-center text-sage-600 mb-12 text-lg">
          Simple steps to get your perfect custom piece
        </p>
        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-sage-800 mb-3">{step.title}</h3>
              <p className="text-sage-600 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-lg text-sage-700">
            Orders are taken via WhatsApp or Call • Delivery available across India
          </p>
        </div>
      </div>
    </section>
  )
}

