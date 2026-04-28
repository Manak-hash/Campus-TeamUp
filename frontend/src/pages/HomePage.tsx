import { Link } from 'react-router-dom'

// Still basic rn its only the setup
function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Campus TeamUp
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Find teammates for your university projects
      </p>
      <Link
        to="/projects"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Browse Projects
      </Link>
    </div>
  )
}

export default HomePage
