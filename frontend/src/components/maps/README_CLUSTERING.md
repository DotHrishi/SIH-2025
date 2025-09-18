# Patient Case Clustering Implementation

This document describes the implementation of patient case clustering and visualization functionality for the Water Quality and Health Surveillance System.

## Overview

The patient case clustering system automatically groups nearby patient cases based on geographic proximity and visualizes them as colored circles on the map. The implementation includes:

- **Geographic Clustering Algorithm**: Groups cases within a configurable radius
- **Severity-based Color Coding**: Visual indicators for mild (green), moderate (yellow), and severe (red) cases
- **Dynamic Circle Sizing**: Circle radius increases with case density
- **Interactive Popups**: Detailed cluster information with case breakdown
- **Real-time Updates**: Automatic updates when new cases are reported

## Components

### 1. PatientCaseCircles
Main component for displaying clustered patient cases on the map.

```jsx
import { PatientCaseCircles } from './components/maps';

<PatientCaseCircles
  patientReports={patientData}
  visible={true}
  clusterRadius={1000} // 1km clustering radius
  onClusterClick={handleClusterClick}
  realTimeUpdates={true}
/>
```

**Props:**
- `patientReports`: Array of patient report objects
- `visible`: Boolean to show/hide the layer
- `clusterRadius`: Clustering radius in meters (default: 1000)
- `onClusterClick`: Callback function for cluster click events
- `realTimeUpdates`: Enable real-time updates (default: true)

### 2. CaseClusterPopup
Popup component showing detailed cluster information.

**Features:**
- Case count and overall severity
- Severity breakdown (mild/moderate/severe)
- Recent cases list
- Location information
- Action buttons (View Details, Create Alert)

### 3. PatientClusterMap
Complete map implementation with clustering functionality.

```jsx
import { PatientClusterMap } from './components/maps';

<PatientClusterMap
  center={[20.5937, 78.9629]}
  zoom={6}
  height="600px"
  clusterRadius={1000}
  showOtherLayers={true}
/>
```

### 4. ClusteringDemo
Interactive demonstration component showcasing all clustering features.

## Utilities

### Geographic Utilities (`utils/geoUtils.js`)

**Key Functions:**
- `calculateDistance(point1, point2)`: Haversine distance calculation
- `calculateCentroid(points)`: Calculate center point of multiple locations
- `clusterPatientCases(reports, radius)`: Main clustering algorithm
- `calculateClusterSeverity(cases)`: Determine overall cluster severity
- `getSeverityColor(severity)`: Get color for severity level

### Clustering Service (`services/clusterService.js`)

**Methods:**
- `getAndClusterPatientReports()`: Fetch and cluster patient data
- `createClusterAlert()`: Generate alerts for high-risk clusters
- `subscribeToClusterUpdates()`: Real-time update subscription
- `filterClusters()`: Apply various filters to clusters

### Custom Hook (`hooks/usePatientClusters.js`)

**Features:**
- State management for clusters and filters
- Real-time updates
- Filter operations (severity, case count, date range)
- Alert creation
- Statistics calculation

## Usage Examples

### Basic Implementation

```jsx
import React from 'react';
import { InteractiveMap, PatientCaseCircles } from './components/maps';

const MyMap = ({ patientData }) => {
  const handleClusterClick = (cluster) => {
    console.log('Cluster clicked:', cluster);
  };

  return (
    <InteractiveMap
      center={[20.5937, 78.9629]}
      zoom={6}
      height="500px"
      layers={[
        <PatientCaseCircles
          key="patient-clusters"
          patientReports={patientData}
          onClusterClick={handleClusterClick}
        />
      ]}
    />
  );
};
```

### Advanced Implementation with Hooks

```jsx
import React from 'react';
import { PatientClusterMap } from './components/maps';
import usePatientClusters from './hooks/usePatientClusters';

const AdvancedMap = () => {
  const {
    clusters,
    statistics,
    loading,
    updateFilters,
    createClusterAlert
  } = usePatientClusters({
    clusterRadius: 1000,
    autoUpdate: true
  });

  const handleCreateAlert = async (cluster) => {
    try {
      await createClusterAlert(cluster);
      alert('Alert created successfully');
    } catch (error) {
      alert('Failed to create alert');
    }
  };

  return (
    <div>
      <div>Total Clusters: {statistics.totalClusters}</div>
      <PatientClusterMap
        clusterRadius={1000}
        onClusterClick={handleCreateAlert}
      />
    </div>
  );
};
```

## Data Format

### Patient Report Structure
```javascript
{
  _id: "unique_id",
  caseId: "HC001",
  location: {
    coordinates: [longitude, latitude] // GeoJSON format
  },
  severity: "mild" | "moderate" | "severe",
  patientInfo: {
    ageGroup: "25-35",
    location: "Area name"
  },
  diseaseIdentification: {
    suspectedDisease: "Cholera"
  },
  reportDate: "2024-01-15T10:00:00Z",
  createdAt: "2024-01-15T10:00:00Z"
}
```

### Cluster Structure
```javascript
{
  id: "cluster_1",
  center: { lat: 28.6139, lng: 77.2090 },
  cases: [/* array of patient reports */],
  severity: "moderate",
  caseCount: 5,
  radius: 125, // Display radius in pixels
  color: "#F59E0B", // Severity color
  severityBreakdown: { mild: 2, moderate: 2, severe: 1 }
}
```

## Configuration

### Clustering Parameters
- **Cluster Radius**: 500m - 5km (default: 1km)
- **Base Circle Radius**: 50 pixels
- **Scale Factor**: 15 pixels per additional case
- **Maximum Radius**: 200 pixels

### Color Scheme
- **Mild Cases**: #10B981 (Green)
- **Moderate Cases**: #F59E0B (Yellow/Orange)
- **Severe Cases**: #EF4444 (Red)

### Severity Calculation Rules
- **Severe**: >30% of cases are severe
- **Moderate**: >50% of cases are moderate or severe
- **Mild**: Predominantly mild cases

## Integration with Existing Components

The clustering functionality integrates seamlessly with existing map components:

1. **ComprehensiveMap**: Updated to include patient clusters layer
2. **MapControls**: Added toggle for patient clusters visibility
3. **API Service**: Extended with clustering endpoints
4. **Analytics**: Can use cluster data for trend analysis

## Performance Considerations

- Clustering is performed client-side for real-time responsiveness
- Large datasets (>1000 cases) may benefit from server-side clustering
- Real-time updates use polling (30-second intervals)
- Consider implementing WebSocket connections for true real-time updates

## Testing

The implementation includes unit tests for core utilities:
- Distance calculations
- Clustering algorithm
- Severity calculations
- Color coding functions

Run tests with: `npm test geoUtils.test.js`

## Future Enhancements

1. **Server-side Clustering**: For better performance with large datasets
2. **WebSocket Integration**: True real-time updates
3. **Advanced Filtering**: Time-based animations, disease-specific clustering
4. **Export Functionality**: Export cluster data and visualizations
5. **Mobile Optimization**: Touch-friendly interactions for mobile devices