import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsService } from '../services/projects.service';
import ProjectCard, { Project } from '../components/ProjectCard';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import Spinner from '../components/Spinner';

export const LandingPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        setProjectsLoading(true);
        // Fetch the 3 most recent open projects
        const data = await projectsService.getProjects({ limit: 3, status: 'open' });
        setProjects(data.projects || []);
      } catch (err: any) {
        console.error('Failed to load featured projects:', err);
        setError('Could not load recent projects.');
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  // Popular skills on the platform
  const popularSkills = [
    'React', 'TypeScript', 'PHP', 'JavaScript', 'Python',
    'SQLite', 'HTML/CSS', 'Node.js', 'UI/UX Design', 'Git',
    'Docker', 'REST APIs', 'Tailwind CSS', 'Figma'
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Spinner />
          <p className="text-sm font-semibold text-gray-500">Loading Campus TeamUp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col justify-between">
      {/* Main Container */}
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 bg-white border-b border-gray-150">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-50/40 via-transparent to-transparent opacity-70" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl" />
          
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center space-y-6 md:space-y-8">
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
              Build Amazing Projects with <span className="text-primary-600">Your Campus Peer Teams</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-650 max-w-2xl mx-auto font-medium leading-relaxed">
              Find open projects, apply with your skills, or post your own ideas to find talented developers and designers at your university.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Link to="/explore" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
                  Find a Project
                </Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto hover:bg-gray-50">
                  Post a Project
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">How It Works</h2>
            <p className="text-base text-gray-500 max-w-lg mx-auto">
              Campus TeamUp matches your talent with ambitious projects in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-150 relative hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Post or Find</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Creators post project summaries detailing specifications, goals, and required skills. Builders browse and filter to discover projects matching their stack.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-150 relative hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Apply with Motivation</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Submit a join request specifying your motivation and what you bring to the table. See how well your skills match using the platform alignment algorithm.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-150 relative hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Form Team & Build</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Once approved, join the team member list and gain workspace coordinates. Collaborate with peer students and launch outstanding software together.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Projects Section */}
        <section className="py-20 bg-white border-t border-b border-gray-150">
          <div className="max-w-7xl mx-auto px-4 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-3">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Featured Open Projects</h2>
                <p className="text-base text-gray-500 max-w-md">
                  Explore recent student-led initiatives looking for team members.
                </p>
              </div>
              <Link to="/explore">
                <Button variant="secondary" className="shrink-0 hover:bg-gray-50">
                  View All Projects
                </Button>
              </Link>
            </div>

            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-gray-500 text-sm">{error}</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm font-semibold">
                No active open projects found. Check back soon or register to start yours!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="h-full">
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Skills Showcase Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 text-center space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Popular Campus Skills</h2>
            <p className="text-base text-gray-500 max-w-lg mx-auto">
              Find teammates skilled in these major developer and designer stacks on campus.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {popularSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-white text-gray-800 border border-gray-200 shadow-sm hover:scale-105 hover:border-primary-400 hover:text-primary-600 transition-all duration-200 cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-white text-lg font-bold">Campus TeamUp</h3>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Matching university developers, designers, and creators with collaborative open-source or academic projects on campus.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Find Projects
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider">GitHub Project</h3>
            <p className="text-sm leading-relaxed">
              Check out our code repositories and contribute to the development of the platform.
            </p>
            <a
              href="https://github.com/Manak-hash/Campus-TeamUp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Campus TeamUp. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;