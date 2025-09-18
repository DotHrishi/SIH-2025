# Design Document

## Overview

The Water Quality and Health Surveillance System is a full-stack MERN application designed for government health officials to monitor waterborne diseases and water quality issues. The system provides real-time monitoring, data analytics, reporting, and emergency response coordination capabilities.

The application follows a modern web architecture with React frontend, Node.js/Express backend, and MongoDB database, utilizing Leaflet for interactive mapping and Tailwind CSS for responsive design.

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   MongoDB       │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   Database      │
│                 │    │                 │    │                 │
│ - Components    │    │ - Routes        │    │ - Collections   │
│ - State Mgmt    │    │ - Controllers   │    │ - Indexes       │
│ - Leaflet Maps  │    │ - Middleware    │    │ - Aggregations  │
│ - Tailwind CSS  │    │ - Models        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet Maps
- **Backend**: Node.js, Express 5, Mongoose ODM
- **Database**: MongoDB Atlas
- **File Storage**: GridFS (for image uploads)

- **Maps**: Leaflet.js with OpenStreetMap tiles

## Components and Interfaces

### Frontend Component Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Navigation.jsx
│   │   ├── Layout.jsx
│   │   └── LoadingSpinner.jsx
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── StatsCard.jsx
│   │   └── RecentActivity.jsx
│   ├── reports/
│   │   ├── ReportSelection.jsx
│   │   ├── WaterQualityForm.jsx
│   │   ├── PatientReportForm.jsx
│   │   ├── ReportLibrary.jsx
│   │   └── ImageUpload.jsx
│   ├── analytics/
│   │   ├── AnalyticsHub.jsx
│   │   ├── DataExplorer.jsx
│   │   ├── TrendAnalysis.jsx
│   │   └── FilterPanel.jsx
│   ├── alerts/
│   │   ├── AlertsHub.jsx
│   │   ├── AlertCard.jsx
│   │   └── AlertActions.jsx
│   ├── directory/
│   │   ├── DirectoryHub.jsx
│   │   ├── CenterCard.jsx
│   │   └── ContactInfo.jsx
│   ├── maps/
│   │   ├── InteractiveMap.jsx
│   │   ├── MapLayers.jsx
│   │   ├── MapControls.jsx
│   │   ├── PatientCaseCircles.jsx
│   │   └── CaseClusterPopup.jsx
│   └── auth/
│       ├── Login.jsx
│       └── ProtectedRoute.jsx
├── hooks/
│   ├── useApi.js
│   ├── useMap.js
│   └── usePatientClusters.js
├── services/
│   ├── api.js
│   ├── mapService.js
│   └── clusterService.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   ├── validation.js
│   └── geoUtils.js
└── styles/
    └── globals.css
```

### Backend API Structure
```
src/
├── controllers/
│   ├── dashboardController.js
│   ├── waterReportController.js
│   ├── patientReportController.js
│   ├── analyticsController.js
│   ├── alertsController.js
│   ├── directoryController.js
│   └── mapController.js
├── models/
│   ├── WaterReport.js
│   ├── PatientReport.js
│   ├── Alert.js
│   ├── HealthCenter.js
│   └── NGOPartner.js
├── routes/
│   ├── dashboard.js
│   ├── reports.js
│   ├── analytics.js
│   ├── alerts.js
│   ├── directory.js
│   └── maps.js
├── middleware/
│   ├── validation.js
│   ├── upload.js
│   └── errorHandler.js
├── utils/
│   ├── database.js
│   ├── fileUpload.js
│   ├── alertSystem.js
│   └── geoCluster.js
└── config/
    └── database.js
```

## Patient Case Clustering and Visualization

### Geographic Clustering Algorithm
The system implements a geographic clustering algorithm to group patient cases by location and visualize them as circles with radius proportional to case density.

#### Clustering Logic
```javascript
// Cluster patient cases within a specified radius (e.g., 1km)
const clusterRadius = 1000; // meters
const clusters = [];

patientReports.forEach(report => {
  const existingCluster = clusters.find(cluster => 
    calculateDistance(cluster.center, report.location) <= clusterRadius
  );
  
  if (existingCluster) {
    existingCluster.cases.push(report);
    existingCluster.center = calculateCentroid(existingCluster.cases);
  } else {
    clusters.push({
      center: report.location,
      cases: [report],
      severity: calculateClusterSeverity(cases)
    });
  }
});
```

#### Circle Visualization Parameters
- **Base Radius**: 50 pixels minimum
- **Scale Factor**: radius = baseRadius + (caseCount * 15)
- **Color Coding**: 
  - Green (#10B981): Predominantly mild cases
  - Yellow (#F59E0B): Mixed or moderate cases
  - Red (#EF4444): Severe cases or high density
- **Opacity**: 0.6 for filled circles, 0.8 for borders

#### Real-time Updates
- WebSocket connection for live patient report updates
- Automatic cluster recalculation on new case submissions
- Smooth animation transitions for circle size changes

## Data Models

### Water Report Model
```javascript
{
  _id: ObjectId,
  reportId: String, // Auto-generated unique ID
  submittedBy: String, // Name of submitter
  location: {
    coordinates: [Number], // [longitude, latitude]
    address: String,
    district: String,
    waterSource: String
  },
  testingParameters: {
    pH: Number,
    turbidity: Number,
    dissolvedOxygen: Number,
    temperature: Number,
    conductivity: Number,
    totalDissolvedSolids: Number
  },
  sampleCollection: {
    collectionDate: Date,
    collectionTime: String,
    collectorName: String,
    sampleId: String
  },
  images: [{
    filename: String,
    originalName: String,
    fileId: ObjectId, // GridFS file ID
    uploadDate: Date
  }],
  status: String, // 'pending', 'reviewed', 'action_required'
  createdAt: Date,
  updatedAt: Date
}
```

### Patient Report Model
```javascript
{
  _id: ObjectId,
  caseId: String, // Auto-generated case ID (e.g., HC001, HC002)
  submittedBy: String, // Name of submitter
  patientInfo: {
    age: Number,
    ageGroup: String, // '0-5', '5-15', '15-25', '25-35', '35-45', '45+'
    gender: String,
    location: String,
    contactNumber: String
  },
  symptoms: [String], // Array of symptoms
  severity: String, // 'mild', 'moderate', 'severe'
  suspectedWaterSource: {
    source: String,
    location: String,
    relatedWaterReport: ObjectId // Optional reference
  },
  diseaseIdentification: {
    suspectedDisease: String,
    confirmationStatus: String // 'suspected', 'confirmed', 'ruled_out'
  },
  emergencyAlert: Boolean,
  reportDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Alert Model
```javascript
{
  _id: ObjectId,
  alertId: String,
  type: String, // 'water_quality', 'health_cluster', 'emergency'
  severity: String, // 'low', 'medium', 'high', 'critical'
  title: String,
  description: String,
  location: {
    coordinates: [Number],
    address: String,
    district: String
  },
  parameters: {
    parameterName: String,
    measuredValue: Number,
    threshold: Number,
    unit: String
  },
  source: {
    type: String, // 'water_report', 'patient_report', 'iot_sensor'
    sourceId: ObjectId,
    sensorId: String // For IoT sensors
  },
  status: String, // 'active', 'acknowledged', 'resolved'
  assignedTeam: [ObjectId], // References to Users
  actions: [{
    action: String,
    performedBy: ObjectId,
    timestamp: Date,
    notes: String
  }],
  createdAt: Date,
  resolvedAt: Date
}
```

### Health Center Model
```javascript
{
  _id: ObjectId,
  centerId: String, // e.g., ASHA-001
  name: String,
  type: String, // 'ASHA', 'NGO'
  location: {
    coordinates: [Number],
    address: String,
    district: String,
    state: String
  },
  leadWorker: {
    name: String,
    designation: String,
    contactNumber: String,
    email: String,
    lastContact: Date
  },
  coverage: {
    population: Number,
    area: String,
    villages: [String]
  },
  status: String, // 'active', 'inactive', 'maintenance'
  resources: [{
    resourceType: String,
    quantity: Number,
    lastUpdated: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

### Frontend Error Handling
- **API Errors**: Centralized error handling in API service with user-friendly messages
- **Form Validation**: Real-time validation with clear error indicators
- **Network Errors**: Retry mechanisms and offline state handling
- **Authentication Errors**: Automatic token refresh and redirect to login

### Backend Error Handling
- **Validation Errors**: Mongoose validation with custom error messages
- **Database Errors**: Connection handling and query error management
- **File Upload Errors**: Size limits, type validation, and storage errors
- **Authentication Errors**: JWT validation and authorization failures

### Error Response Format
```javascript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'User-friendly error message',
    details: {
      field: 'Specific field error'
    }
  }
}
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration and user flow testing
- **E2E Tests**: Critical user journeys with Cypress
- **Visual Tests**: Component snapshot testing

### Backend Testing
- **Unit Tests**: Controller and utility function testing with Jest
- **Integration Tests**: API endpoint testing with Supertest
- **Database Tests**: Model validation and query testing
- **Load Tests**: Performance testing for high-traffic scenarios

### Test Coverage Goals
- **Frontend**: 80% code coverage for components and utilities
- **Backend**: 90% code coverage for controllers and models
- **API**: 100% endpoint coverage with success and error scenarios

## Security Considerations

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Session management and timeout

### Data Protection
- Input validation and sanitization
- SQL injection prevention (NoSQL injection for MongoDB)
- XSS protection with content security policy
- File upload security with type and size validation

### API Security
- Rate limiting to prevent abuse
- CORS configuration for allowed origins
- Request logging and monitoring
- Secure headers implementation

## Performance Optimization

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization and lazy loading
- Caching strategies for API responses
- Bundle size optimization

### Backend Optimization
- Database indexing for frequent queries
- Query optimization and aggregation pipelines
- Caching with Redis for frequently accessed data
- File compression and CDN integration

### Database Optimization
- Proper indexing strategy
- Aggregation pipeline optimization
- Connection pooling
- Data archiving for old records