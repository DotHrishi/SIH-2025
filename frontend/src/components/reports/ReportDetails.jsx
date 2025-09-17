const ReportDetails = ({ report, onBack }) => {
  if (!report) {
    return (
      <div className="text-center py-12">
        <span className="text-gray-500">No report selected</span>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-green-100 text-green-800 border-green-200',
      under_investigation: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-red-600 bg-red-50 border-red-200'
    };
    return priorityColors[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getTypeIcon = (type) => {
    const typeIcons = {
      water: '💧',
      patient: '🏥'
    };
    return typeIcons[type] || '📄';
  };

  // Mock detailed data - in real app, this would come from API
  const mockDetails = {
    description: report.type === 'water' 
      ? 'Comprehensive water quality analysis conducted at the downtown treatment facility. Testing revealed elevated chlorine levels exceeding recommended thresholds. Immediate action required to adjust treatment parameters.'
      : 'Patient presented with acute gastrointestinal symptoms consistent with waterborne illness. Symptoms include nausea, vomiting, and diarrhea. Patient reports consuming tap water from affected area.',
    
    attachments: [
      { name: 'test_results.pdf', size: '2.3 MB', type: 'application/pdf' },
      { name: 'location_photo.jpg', size: '1.8 MB', type: 'image/jpeg' }
    ],
    
    timeline: [
      {
        date: '2024-01-15T10:30:00Z',
        action: 'Report Submitted',
        user: report.submittedBy,
        description: 'Initial report submitted to surveillance system'
      },
      {
        date: '2024-01-15T11:15:00Z',
        action: 'Report Reviewed',
        user: 'System Administrator',
        description: 'Report passed initial validation checks'
      },
      {
        date: '2024-01-15T14:20:00Z',
        action: 'Investigation Started',
        user: 'Dr. Emily Rodriguez',
        description: 'Assigned to investigation team for detailed analysis'
      }
    ],
    
    metadata: {
      coordinates: '40.7128, -74.0060',
      testParameters: report.type === 'water' ? {
        'pH Level': '7.2',
        'Chlorine': '2.8 mg/L',
        'Turbidity': '0.5 NTU',
        'Bacteria Count': '< 1 CFU/100mL'
      } : {
        'Patient Age': '34',
        'Symptoms Duration': '3 days',
        'Severity': 'Moderate',
        'Treatment Status': 'Ongoing'
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Reports
        </button>
        
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(report.priority)}`}>
            {report.priority.toUpperCase()} PRIORITY
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(report.status)}`}>
            {report.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getTypeIcon(report.type)}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              <p className="text-gray-600 mt-1">Report ID: {report.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted By</h3>
            <p className="text-gray-900">{report.submittedBy}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
            <p className="text-gray-900">{report.location}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Date Submitted</h3>
            <p className="text-gray-900">{new Date(report.submittedDate).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
        <p className="text-gray-700 leading-relaxed">{mockDetails.description}</p>
      </div>

      {/* Test Parameters / Metadata */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {report.type === 'water' ? 'Test Parameters' : 'Case Details'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(mockDetails.metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-600">{key}:</span>
              <span className="text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
        <div className="space-y-3">
          {mockDetails.attachments.map((attachment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-3">
                  {attachment.type.includes('image') ? '🖼️' : '📄'}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{attachment.name}</p>
                  <p className="text-sm text-gray-500">{attachment.size}</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
        <div className="space-y-4">
          {mockDetails.timeline.map((event, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{event.action}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <p className="text-xs text-gray-500 mt-1">by {event.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;