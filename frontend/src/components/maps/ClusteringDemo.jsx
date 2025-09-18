import React, { useState, useEffect } from 'react';
import PatientClusterMap from './PatientClusterMap';

/**
 * Demo component to showcase patient case clustering functionality
 * Includes sample data and interactive controls
 */
const ClusteringDemo = () => {
  const [clusterRadius, setClusterRadius] = useState(1000);
  const [showDemo, setShowDemo] = useState(true);

  // Sample patient report data for demonstration
  const samplePatientReports = [
    {
      _id: '1',
      caseId: 'HC001',
      location: { coordinates: [77.2090, 28.6139] }, // Delhi
      severity: 'moderate',
      patientInfo: { ageGroup: '25-35', location: 'Delhi' },
      diseaseIdentification: { suspectedDisease: 'Cholera' },
      reportDate: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      _id: '2',
      caseId: 'HC002',
      location: { coordinates: [77.2190, 28.6239] }, // Near Delhi
      severity: 'severe',
      patientInfo: { ageGroup: '15-25', location: 'Delhi NCR' },
      diseaseIdentification: { suspectedDisease: 'Dysentery' },
      reportDate: '2024-01-16T14:30:00Z',
      createdAt: '2024-01-16T14:30:00Z'
    },
    {
      _id: '3',
      caseId: 'HC003',
      location: { coordinates: [77.2290, 28.6339] }, // Near Delhi
      severity: 'mild',
      patientInfo: { ageGroup: '35-45', location: 'Gurgaon' },
      diseaseIdentification: { suspectedDisease: 'Gastroenteritis' },
      reportDate: '2024-01-17T09:15:00Z',
      createdAt: '2024-01-17T09:15:00Z'
    },
    {
      _id: '4',
      caseId: 'HC004',
      location: { coordinates: [72.8777, 19.0760] }, // Mumbai
      severity: 'severe',
      patientInfo: { ageGroup: '5-15', location: 'Mumbai' },
      diseaseIdentification: { suspectedDisease: 'Cholera' },
      reportDate: '2024-01-18T16:45:00Z',
      createdAt: '2024-01-18T16:45:00Z'
    },
    {
      _id: '5',
      caseId: 'HC005',
      location: { coordinates: [72.8877, 19.0860] }, // Near Mumbai
      severity: 'moderate',
      patientInfo: { ageGroup: '25-35', location: 'Mumbai Suburbs' },
      diseaseIdentification: { suspectedDisease: 'Typhoid' },
      reportDate: '2024-01-19T11:20:00Z',
      createdAt: '2024-01-19T11:20:00Z'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Patient Case Clustering Demo
          </h1>
          <p className="text-gray-600">
            Interactive demonstration of geographic clustering for patient cases with real-time visualization
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Cluster Radius:
              </label>
              <select
                value={clusterRadius}
                onChange={(e) => setClusterRadius(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value={500}>500m</option>
                <option value={1000}>1km</option>
                <option value={2000}>2km</option>
                <option value={5000}>5km</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showDemo"
                checked={showDemo}
                onChange={(e) => setShowDemo(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showDemo" className="text-sm font-medium text-gray-700">
                Show Demo Data
              </label>
            </div>

            <div className="text-sm text-gray-600">
              Sample data includes {samplePatientReports.length} patient reports across Delhi and Mumbai
            </div>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900">Geographic Clustering</h3>
            </div>
            <p className="text-sm text-gray-600">
              Automatically groups nearby patient cases based on configurable radius
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900">Severity Color Coding</h3>
            </div>
            <p className="text-sm text-gray-600">
              Visual indicators: Green (mild), Yellow (moderate), Red (severe)
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900">Dynamic Sizing</h3>
            </div>
            <p className="text-sm text-gray-600">
              Circle radius increases proportionally with case density
            </p>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {showDemo ? (
            <PatientClusterMap
              center={[20.5937, 78.9629]} // Center of India
              zoom={5}
              height="600px"
              clusterRadius={clusterRadius}
              showOtherLayers={true}
              className="w-full"
            />
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">Demo disabled</p>
                <p className="text-sm">Enable "Show Demo Data" to view the clustering functionality</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on colored circles to view cluster details and case information</li>
            <li>• Use the severity filter in the left panel to show only specific severity levels</li>
            <li>• Adjust the minimum case count slider to filter small clusters</li>
            <li>• Change the cluster radius to see how grouping changes</li>
            <li>• Click "Create Alert" in cluster popups to generate alerts for high-risk areas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClusteringDemo;