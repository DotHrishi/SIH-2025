import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                isActive(item.path)
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;