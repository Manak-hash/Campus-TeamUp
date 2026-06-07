import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

const LandingPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Campus TeamUp
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with fellow students and build amazing projects together
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/explore">
            <Button variant="primary">Explore Projects</Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;