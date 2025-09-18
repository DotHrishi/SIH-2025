# Maps API Documentation

## Overview

The Maps API provides geographic clustering functionality for patient cases, enabling visualization of disease outbreaks and case density on interactive maps.

## Endpoints

### 1. Get Patient Clusters

**GET** `/api/maps/patient-clusters`

Retrieves geographic clusters of patient cases based on proximity and configurable parameters.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `radius` | number | 1000 | Clustering radius in meters |
| `startDate` | string | - | Filter cases from this date (ISO format) |
| `endDate` | string | - | Filter cases until this date (ISO format) |
| `severity` | string | - | Filter by severity (mild, moderate, severe, critical) |
| `disease` | string | - | Filter by suspected disease |
| `location` | string | - | Filter by location (partial match) |
| `minCases` | number | 1 | Minimum cases per cluster |

#### Response

```json
{
  "success": true,
  "data": {
    "clusters": [
      {
        "id": "cluster_1",
        "center": [77.5948, 12.9718],
        "caseCount": 5,
        "severity": "moderate",
        "severityBreakdown": {
          "mild": 2,
          "moderate": 2,
          "severe": 1,
          "critical": 0
        },
        "radius": 125,
        "cases": [
          {
            "caseId": "HC001",
            "severity": "moderate",
            "reportDate": "2024-01-15T10:30:00Z",
            "suspectedDisease": "cholera",
            "coordinates": [77.5946, 12.9716],
            "location": "Bangalore Central"
          }
        ],
        "recentCases": [...]
      }
    ],
    "totalCases": 15,
    "totalClusters": 3,
    "parameters": {
      "radius": 1000,
      "minCases": 1,
      "filters": {...}
    }
  }
}
```

#### Example Usage

```bash
# Get all clusters with default parameters
GET /api/maps/patient-clusters

# Get clusters with custom radius and severity filter
GET /api/maps/patient-clusters?radius=500&severity=severe

# Get clusters for a specific date range
GET /api/maps/patient-clusters?startDate=2024-01-01&endDate=2024-01-31
```

### 2. Get Cluster Details

**GET** `/api/maps/cluster-details/:clusterId`

Retrieves detailed information about a specific cluster, including comprehensive statistics and case breakdowns.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `clusterId` | string | Cluster identifier |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `centerLat` | number | Yes | Cluster center latitude |
| `centerLon` | number | Yes | Cluster center longitude |
| `radius` | number | No | Cluster radius in meters (default: 1000) |
| `startDate` | string | No | Filter cases from this date |
| `endDate` | string | No | Filter cases until this date |

#### Response

```json
{
  "success": true,
  "data": {
    "clusterId": "cluster_1",
    "center": [77.5948, 12.9718],
    "radius": 1000,
    "totalCases": 8,
    "emergencyAlerts": 2,
    "severityBreakdown": {
      "mild": 3,
      "moderate": 3,
      "severe": 2,
      "critical": 0
    },
    "diseaseBreakdown": {
      "cholera": 4,
      "typhoid": 2,
      "gastroenteritis": 2
    },
    "ageGroupBreakdown": {
      "0-5": 2,
      "25-35": 3,
      "35-45": 2,
      "45+": 1
    },
    "timeline": {
      "2024-01-15": 3,
      "2024-01-16": 2,
      "2024-01-17": 3
    },
    "cases": [
      {
        "caseId": "HC001",
        "reportDate": "2024-01-15T10:30:00Z",
        "severity": "moderate",
        "suspectedDisease": "cholera",
        "patientAge": 28,
        "patientAgeGroup": "25-35",
        "location": "Bangalore Central",
        "coordinates": [77.5946, 12.9716],
        "emergencyAlert": false,
        "waterSource": "well",
        "relatedWaterReport": "WR001"
      }
    ]
  }
}
```

#### Example Usage

```bash
# Get details for a specific cluster
GET /api/maps/cluster-details/cluster_1?centerLat=12.9718&centerLon=77.5948&radius=1000
```

### 3. Get Cluster Updates

**GET** `/api/maps/cluster-updates`

Retrieves real-time updates for clusters since a specified timestamp, useful for live map updates.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lastUpdate` | string | Yes | ISO timestamp of last update |
| `radius` | number | No | Clustering radius in meters (default: 1000) |

#### Response

```json
{
  "success": true,
  "data": {
    "hasUpdates": true,
    "newCases": 3,
    "updatedClusters": [
      {
        "id": "cluster_1",
        "center": [77.5948, 12.9718],
        "caseCount": 8,
        "severity": "severe",
        "severityBreakdown": {...},
        "cases": [...]
      }
    ],
    "timestamp": "2024-01-15T15:30:00Z"
  }
}
```

#### Example Usage

```bash
# Get updates since last check
GET /api/maps/cluster-updates?lastUpdate=2024-01-15T14:00:00Z
```

## Clustering Algorithm

### How It Works

1. **Proximity Clustering**: Groups patient cases within a specified radius (default: 1km)
2. **Centroid Calculation**: Calculates the geographic center of each cluster
3. **Severity Assessment**: Determines cluster severity based on case severity distribution
4. **Dynamic Radius**: Visual radius scales with case count (base: 50px, scale: +15px per case)

### Severity Classification

- **Mild**: Predominantly mild cases, low average severity
- **Moderate**: Mixed severity or moderate average
- **Severe**: High proportion of severe/critical cases or high case density

### Color Coding

- **Green (#10B981)**: Mild clusters
- **Yellow (#F59E0B)**: Moderate clusters  
- **Red (#EF4444)**: Severe clusters

## Data Requirements

### Patient Report Coordinates

Patient reports must include coordinates in the `patientInfo.coordinates` field:

```json
{
  "patientInfo": {
    "coordinates": [longitude, latitude], // [77.5946, 12.9716]
    "location": "Bangalore Central",
    // ... other fields
  }
}
```

### Coordinate Format

- **Format**: `[longitude, latitude]` (GeoJSON standard)
- **Range**: Longitude: -180 to 180, Latitude: -90 to 90
- **Precision**: Up to 6 decimal places recommended

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Center coordinates (centerLat, centerLon) are required"
  }
}
```

### Error Codes

- `VALIDATION_ERROR`: Missing or invalid parameters
- `NOT_FOUND`: No cases found in specified area
- `INTERNAL_SERVER_ERROR`: Server processing error

## Performance Considerations

### Indexing

The system uses a 2dsphere index on `patientInfo.coordinates` for efficient geospatial queries:

```javascript
patientReportSchema.index({ 'patientInfo.coordinates': '2dsphere' });
```

### Optimization Tips

1. **Use appropriate radius**: Smaller radius = faster clustering
2. **Filter by date**: Limit data to recent cases for better performance
3. **Set minimum cases**: Filter out single-case clusters if not needed
4. **Cache results**: Consider caching cluster data for frequently accessed areas

## Integration Examples

### Frontend Integration

```javascript
// Fetch clusters for map display
const fetchClusters = async (mapBounds, filters = {}) => {
  const params = new URLSearchParams({
    radius: '1000',
    minCases: '2',
    ...filters
  });
  
  const response = await fetch(`/api/maps/patient-clusters?${params}`);
  const data = await response.json();
  
  return data.data.clusters;
};

// Get cluster details on click
const getClusterDetails = async (cluster) => {
  const params = new URLSearchParams({
    centerLat: cluster.center[1],
    centerLon: cluster.center[0],
    radius: '1000'
  });
  
  const response = await fetch(`/api/maps/cluster-details/${cluster.id}?${params}`);
  return response.json();
};
```

### Real-time Updates

```javascript
// Poll for updates every 30 seconds
const pollForUpdates = async () => {
  const lastUpdate = localStorage.getItem('lastClusterUpdate') || new Date().toISOString();
  
  const response = await fetch(`/api/maps/cluster-updates?lastUpdate=${lastUpdate}`);
  const data = await response.json();
  
  if (data.data.hasUpdates) {
    // Update map with new cluster data
    updateMapClusters(data.data.updatedClusters);
    localStorage.setItem('lastClusterUpdate', data.data.timestamp);
  }
};

setInterval(pollForUpdates, 30000);
```