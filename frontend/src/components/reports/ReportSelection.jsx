import { useState } from 'react';

const ReportSelection = ({ onSelectReport }) => {
  const [selectedType, setSelectedType] = useState(null);

  const reportTypes = [
    {
      id: 'water',
      title: 'Water Quality Report',
      description: 'Submit water testing data and quality assessments',
      icon: '💧',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      fields: ['Location', 'Water Source', 'Testing Parameters', 'Images']
    },
    {
      id: 'patient',
      title: 'Patient Health Report',
      description: 'Report suspected waterborne disease cases',
      icon: '🏥',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
      fields: ['Patient Info', 'Symptoms', 'Water Source', 'Severity']
    }
  ];

  const handleSelectReport = (type) => {
    setSelectedType(type);
    if (onSelectReport) {
      onSelectReport(type);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Report Type</h2>
        <p className="text-gray-600">Choose the type of report you want to submit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {reportTypes.map((type) => (
          <div
            key={type.id}
            className={`
              border-2 rounded-lg p-6 cursor-pointer transition-all duration-200
              ${type.color}
              ${selectedType === type.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
            `}
            onClick={() => handleSelectReport(type.id)}
          >
            <div className="text-center">
              <div className={`text-4xl mb-4 ${type.iconColor}`}>
                {type.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {type.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {type.description}
              </p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Required Information:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {type.fields.map((field, index) => (
                    <span
                      key={index}
                      className="inline-block bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-600 border"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                className={`
                  mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors
                  ${selectedType === type.id 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {selectedType === type.id ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            You selected: <span className="font-medium">{reportTypes.find(t => t.id === selectedType)?.title}</span>
          </p>
          <button
            onClick={() => onSelectReport && onSelectReport(selectedType)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Continue to Form
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportSelection;