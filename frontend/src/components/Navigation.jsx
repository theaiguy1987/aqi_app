import { Link } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav className="bg-white shadow-md mb-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-indigo-600">
              AQI Calculator
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-indigo-600 transition-colors font-medium"
              >
                Calculator
              </Link>
              <Link 
                to="/blog" 
                className="text-gray-700 hover:text-indigo-600 transition-colors font-medium"
              >
                Blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
