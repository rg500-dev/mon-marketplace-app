import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">Marketplace</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/products" className="text-gray-700 hover:text-blue-600">
              Parcourir
            </Link>
            <Link to="/messages" className="text-gray-700 hover:text-blue-600">
              Messages
            </Link>
            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
