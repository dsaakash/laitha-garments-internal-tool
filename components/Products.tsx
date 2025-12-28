export default function Products() {
  const products = [
    {
      name: 'Kurtis',
      description: 'Perfect for daily wear and office. Comfortable, stylish, and versatile.',
      categories: ['Daily Wear', 'Office Wear'],
    },
    {
      name: 'Dresses & Sets',
      description: 'Elegant dresses and coordinated sets for every occasion.',
      categories: ['Casual', 'Formal', 'Party Wear'],
    },
    {
      name: 'Sarees',
      description: 'Traditional and contemporary sarees for daily and festive occasions.',
      categories: ['Daily Wear', 'Festive', 'Wedding'],
    },
  ]

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-serif text-center text-sage-800 mb-4">
          Our Products
        </h2>
        <p className="text-center text-sage-600 mb-12 text-lg">
          Explore our range of beautifully crafted clothing
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-cream-50 to-primary-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <h3 className="text-2xl font-serif text-sage-800 mb-3">{product.name}</h3>
              <p className="text-sage-600 mb-4">{product.description}</p>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category, catIndex) => (
                  <span
                    key={catIndex}
                    className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

