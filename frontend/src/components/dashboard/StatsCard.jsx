import { useState, useEffect } from 'react';

const StatsCard = ({ title, value, subtitle, color = 'blue', icon, loading = false }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mt-2 w-16"></div>
            </div>
          ) : (
            <p className={`text-3xl font-bold mt-2 ${colorClasses[color]}`}>
              {value !== null && value !== undefined ? value : '--'}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        {icon && (
          <div className={`text-2xl ${colorClasses[color]} opacity-60`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;