import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

// Import dashboard components
import OperationalDashboard from './components/dashboards/OperationalDashboard';
import AgentPerformanceDashboard from './components/dashboards/AgentPerformanceDashboard';
import TechnologyDashboard from './components/dashboards/TechnologyDashboard';
import BusinessImpactDashboard from './components/dashboards/BusinessImpactDashboard';

// Import configuration
import { loadDashboardConfig } from './utils/dataLoader';

const App = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const dashboardConfig = await loadDashboardConfig();
        setConfig(dashboardConfig);
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard configuration:', err);
        setError('Failed to load dashboard configuration. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Contact Center Dashboard...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Contact Center Analytics Dashboard
            </h1>
            <div className="text-sm text-gray-500">
              Last Updated: {config?.lastUpdated || 'Unknown'}
            </div>
          </div>
        </header>
        
        <nav className="bg-blue-600 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4">
              <NavLink to="/operational">Operational</NavLink>
              <NavLink to="/agent-performance">Agent Performance</NavLink>
              <NavLink to="/technology">Technology Impact</NavLink>
              <NavLink to="/business-impact">Business Impact</NavLink>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/operational" element={<OperationalDashboard />} />
            <Route path="/agent-performance" element={<AgentPerformanceDashboard />} />
            <Route path="/technology" element={<TechnologyDashboard />} />
            <Route path="/business-impact" element={<BusinessImpactDashboard />} />
            <Route path="/" element={<Navigate to="/operational" replace />} />
          </Routes>
        </main>
        
        <footer className="bg-white shadow-inner mt-8 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                Contact Center Analytics Dashboard | Data Period: {config?.dataTimePeriod || '3 months'}
              </p>
              <p className="text-gray-500 text-sm">
                Created by Contact Center Analytics Team
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

// NavLink component with active state styling
const NavLink = ({ to, children }) => {
  return (
    <Link
      to={to}
      className={({ isActive }) =>
        `px-3 py-3 text-sm font-medium flex items-center transition-colors ${
          isActive
            ? 'bg-blue-700 text-white'
            : 'text-blue-100 hover:bg-blue-500 hover:text-white'
        }`
      }
    >
      {children}
    </Link>
  );
};

export default App;
