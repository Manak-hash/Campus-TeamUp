import { Link } from 'react-router-dom'

// Still basic like the homepage
function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Projects
        </h1>
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Home
        </Link>
      </div>
      <p className="text-gray-600">
        Projects will be loaded from the API.
      </p>
    </div>
  )
}

export default ProjectsPage
