import React, { useState } from 'react';
import ComprehensiveMap from './ComprehensiveMap.jsx';

// Sample data for testing
const sampleData = {
  waterBodies: [
    {
      id: 1,
      name: 'Ganges River - Varanasi',
      type: 'River',
      lat: 25.3176,
      lng: 82.9739,
      status: 'contaminated',
      lastTested: '2024-01-15',
      reports: 5
    },
    {
      id: 2,
      name: 'Yamuna River - Delhi',
      type: 'River',
      lat: 28.6139,
      lng: 77.2090,
      status: 'contaminated',
      lastTested: '2024-01-10',
      reports: 8
    },
    {
      id: 3,
      name: 'Local Well - Rajasthan',
      type: 'Well',
      lat: 26.9124,
      lng: 75.7873,
      status: 'safe',
      lastTested: '2024-01-12',
      reports: 2
    }
  ],
  outbreakAreas: [
    {
      id: 1,
      name: 'Cholera Outbreak - Mumbai',
      lat: 19.0760,
      lng: 72.8777,
      riskLevel: 'high',
      cases: 45,
      disease: 'Cholera',
      radius: 2000,
      lastUpdated: '2024-01-14'
    },
    {
      id: 2,
      name: 'Diarrhea Cluster - Kolkata',
      lat: 22.5726,
      lng: 88.3639,
      riskLevel: 'medium',
      cases: 23,
      disease: 'Diarrhea',
      radius: 1500,
      lastUpdated: '2024-01-13'
    }
  ],
  facilities: [
    {
      id: 1,
      name: 'All India Institute of Medical Sciences',
      type: 'hospital',
      lat: 28.5672,
      lng: 77.2100,
      contact: '+91-11-26588500',
      capacity: 2500,
      status: 'operational',
      services: ['Emergency Care', 'Infectious Disease', 'Pediatrics']
    },
    {
      id: 2,
      name: 'Primary Health Center - Gurgaon',
      type: 'clinic',
      lat: 28.4595,
      lng: 77.0266,
      contact: '+91-124-2345678',
      capacity: 50,
      status: 'operational',
      services: ['General Medicine', 'Vaccination']
    }
  ],
  ngos: [
    {
      id: 1,
      name: 'Water Aid India',
      lat: 28.6139,
      lng: 77.2090,
      leadWorker: 'Dr. Priya Sharma',
      contact: '+91-11-98765432',
      coverage: '5 districts',
      status: 'active',
      services: ['Water Quality Testing', 'Community Health', 'Sanitation']
    },
    {
      id: 2,
      name: 'Rural Health Mission',
      lat: 26.9124,
      lng: 75.7873,
      leadWorker: 'Mr. Rajesh Kumar',
      contact: '+91-141-87654321',
      coverage: '3 districts',
      status: 'active',
      services: ['Health Education', 'Disease Prevention', 'Emergency Response']
    }
  ]
};

const MapDemo = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Water Health Surveillance Map
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Interactive Map Demo</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on the map to select a location. Toggle layers using the controls.
          </p>
        </div>
        
        <div className="relative">
          <ComprehensiveMap
            center={[20.5937, 78.9629]}
            zoom={5}
            height="600px"
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
            data={sampleData}
            showControls={true}
            showLayerControls={true}
          />
        </div>
        
        {selectedLocation && (
          <div className="p-4 bg-blue-50 border-t">
            <h3 className="font-medium text-blue-900">Selected Location</h3>
            <p className="text-sm text-blue-700">
              Latitude: {selectedLocation.lat.toFixed(6)}, 
              Longitude: {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDemo;