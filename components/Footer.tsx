export default function Footer() {
  return (
    <footer className="bg-sage-800 text-cream-50 py-12 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h3 className="text-2xl font-serif mb-4">Lalitha Garments</h3>
        <p className="text-cream-200 mb-6 max-w-2xl mx-auto">
          We don&apos;t just sell clothes. We customize them based on your needs.
        </p>
        <div className="border-t border-sage-700 pt-6">
          <p className="text-cream-300 text-sm">
            © {new Date().getFullYear()} Lalitha Garments. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

