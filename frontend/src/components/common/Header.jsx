import { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [alertCount] = useState(3); // Placeholder for alert count

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold">
              Water Health Surveillance
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Alert notifications */}
            <div className="relative">
              <Link 
                to="/alerts" 
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full text-sm transition-colors"
              >
                <span>🚨</span>
                <span>Alerts</span>
                {alertCount > 0 && (
                  <span className="bg-white text-red-500 rounded-full px-2 py-0.5 text-xs font-bold">
                    {alertCount}
                  </span>
                )}
              </Link>
            </div>
            
            {/* User menu placeholder */}
            <div className="flex items-center space-x-2">
              <span className="text-sm">Admin User</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">A</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;