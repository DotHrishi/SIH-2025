import React, { useState } from 'react';
import PatientReportsList from './PatientReportsList';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('patient');

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Manage and view all system reports</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <TabButton
          id="patient"
          label="Patient Reports"
          icon="🏥"
          isActive={activeTab === 'patient'}
          onClick={setActiveTab}
        />
        <TabButton
          id="water"
          label="Water Reports"
          icon="💧"
          isActive={activeTab === 'water'}
          onClick={setActiveTab}
        />
        <TabButton
          id="analytics"
          label="Analytics"
          icon="📊"
          isActive={activeTab === 'analytics'}
          onClick={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'patient' && <PatientReportsList />}
        
        {activeTab === 'water' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-blue-600 text-6xl mb-4">💧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Water Reports</h3>
            <p className="text-gray-600 mb-4">Water quality reports management coming soon...</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
              View Water Reports
            </button>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-green-600 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600 mb-4">Advanced analytics and reporting tools coming soon...</p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
              View Analytics
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;