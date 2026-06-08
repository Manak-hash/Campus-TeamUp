import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Campus TeamUp
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/explore" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Explore
            </Link>
            {user ? (
              <div className="flex items-center space-x-3">
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/profile" className="flex items-center space-x-2">
                  <Avatar
                    src={user.avatar_url || undefined}
                    alt={user.name}
                    name={user.name}
                    size="sm"
                  />
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
};

export default PublicLayout;