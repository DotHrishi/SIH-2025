# Models Documentation

This directory contains the data models for the Water Quality and Health Surveillance System.

## Available Models

- [WaterReport](#water-report-model) - Water quality testing and monitoring
- [PatientReport](#patient-report-model) - Patient health data and disease surveillance
- [Alert](#alert-model) - Alert monitoring and management system

---

# Water Report Model Documentation

## Overview

The `WaterReport` model is designed to store comprehensive water quality testing data with location information and image attachments. It supports the requirements for water quality monitoring, testing parameter validation, and GridFS image integration.

## Features

### Core Functionality
- **Unique Report ID Generation**: Auto-generates unique report IDs in format `WR{timestamp}{random}`
- **Location Data**: Stores coordinates, address, district, and water source information
- **Testing Parameters**: Validates and stores pH, turbidity, dissolved oxygen, temperature, conductivity, and TDS
- **Sample Collection Info**: Tracks collection date, time, collector, and sample ID
- **Image Support**: GridFS integration for storing multiple images per report
- **Status Management**: Tracks report status (pending, reviewed, action_required, resolved)

### Validation Features
- **Coordinate Validation**: Ensures valid longitude/latitude ranges
- **Parameter Ranges**: Validates water quality parameters within realistic ranges
- **Required Fields**: Enforces required data for complete reports
- **Image Limits**: Restricts to maximum 10 images per report
- **Time Format**: Validates collection time in HH:MM format
- **Enum Validation**: Water source types and status values

### Advanced Features
- **Geospatial Indexing**: 2dsphere index for location-based queries
- **Quality Assessment**: Virtual property that evaluates water quality
- **Static Methods**: Location-based searches and quality statistics
- **Instance Methods**: Image management and report updates

## Schema Structure

```javascript
{
  reportId: String,           // Auto-generated unique ID
  submittedBy: String,        // Name of person submitting report
  location: {
    coordinates: [Number],    // [longitude, latitude]
    address: String,          // Full address
    district: String,         // District name
    waterSource: String       // Type of water source (enum)
  },
  testingParameters: {
    pH: Number,               // pH value (0-14)
    turbidity: Number,        // Turbidity in NTU
    dissolvedOxygen: Number,  // DO in mg/L
    temperature: Number,      // Temperature in Celsius
    conductivity: Number,     // Conductivity (optional)
    totalDissolvedSolids: Number // TDS (optional)
  },
  sampleCollection: {
    collectionDate: Date,     // When sample was collected
    collectionTime: String,   // Time in HH:MM format
    collectorName: String,    // Name of collector
    sampleId: String          // Unique sample identifier
  },
  images: [{
    filename: String,         // Stored filename
    originalName: String,     // Original filename
    fileId: ObjectId,         // GridFS file reference
    uploadDate: Date,         // Upload timestamp
    fileSize: Number,         // File size in bytes
    mimeType: String          // MIME type validation
  }],
  status: String,             // Report status (enum)
  notes: String,              // Additional notes (optional)
  reviewedBy: String,         // Reviewer name (optional)
  reviewedAt: Date,           // Review timestamp (optional)
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

## Usage Examples

### Creating a Basic Report

```javascript
const WaterReport = require('./WaterReport');

const report = new WaterReport({
  submittedBy: 'Dr. John Doe',
  location: {
    coordinates: [77.5946, 12.9716],
    address: 'Cubbon Park Lake, Bangalore',
    district: 'Bangalore Urban',
    waterSource: 'lake'
  },
  testingParameters: {
    pH: 7.2,
    turbidity: 2.5,
    dissolvedOxygen: 8.5,
    temperature: 25.0
  },
  sampleCollection: {
    collectionDate: new Date(),
    collectionTime: '10:30',
    collectorName: 'Field Worker',
    sampleId: 'SAMPLE001'
  }
});

await report.save();
```

### Adding Images

```javascript
const imageData = {
  filename: 'water_sample.jpg',
  originalName: 'IMG_001.jpg',
  fileId: new mongoose.Types.ObjectId(),
  fileSize: 1024000,
  mimeType: 'image/jpeg'
};

await report.addImage(imageData);
```

### Location-Based Queries

```javascript
// Find reports within 10km of coordinates
const nearbyReports = await WaterReport.findByLocation(77.5946, 12.9716, 10);

// Find reports by district
const districtReports = await WaterReport.findByDistrict('Bangalore Urban');

// Get quality statistics
const stats = await WaterReport.getQualityStats({ status: 'reviewed' });
```

### Quality Assessment

```javascript
const report = await WaterReport.findById(reportId);
const assessment = report.qualityAssessment;

console.log(assessment.status);  // 'acceptable' or 'concerning'
console.log(assessment.issues);  // Array of identified issues
```

## Validation Rules

### Required Fields
- `submittedBy`: Person submitting the report
- `location.coordinates`: Valid longitude/latitude array
- `location.address`: Full address string
- `location.district`: District name
- `location.waterSource`: Must be one of predefined types
- `testingParameters.*`: All core parameters (pH, turbidity, dissolvedOxygen, temperature)
- `sampleCollection.*`: All collection information

### Validation Ranges
- **pH**: 0-14
- **Turbidity**: ≥0, warning if >5
- **Dissolved Oxygen**: ≥0, warning if <5
- **Temperature**: -10°C to 60°C
- **Coordinates**: Valid longitude (-180 to 180) and latitude (-90 to 90)

### Water Source Types
- `well`, `borehole`, `river`, `lake`, `pond`, `spring`, `tap`, `other`

### Status Types
- `pending` (default), `reviewed`, `action_required`, `resolved`

## Indexes

- **Geospatial**: `location.coordinates` (2dsphere)
- **Compound**: `status + createdAt` (descending)
- **Compound**: `location.district + createdAt` (descending)

## Testing

Run the test suite to verify model functionality:

```bash
npm test
```

The test suite covers:
- Model creation and validation
- Required field enforcement
- Parameter range validation
- Image handling and limits
- Quality assessment calculations
- Virtual properties and methods

## Requirements Mapping

This model satisfies the following requirements:

- **Requirement 2.1**: Water quality report submission with location and testing data
- **Requirement 2.2**: Testing parameters and validation
- **Requirement 2.4**: Image upload and GridFS integration

## Performance Considerations

- Geospatial indexing enables efficient location-based queries
- Compound indexes optimize common filtering patterns
- Image metadata stored in document, actual files in GridFS
- Validation performed at model level for data integrity
- Virtual properties calculated on-demand without storage overhead
---

# P
atient Report Model Documentation

## Overview

The `PatientReport` model is designed to store comprehensive patient health data for waterborne disease surveillance and outbreak detection. It supports case tracking, symptom monitoring, disease identification, and emergency alert management with automatic case ID generation.

## Features

### Core Functionality
- **Unique Case ID Generation**: Auto-generates unique case IDs in format `HC{timestamp}{random}`
- **Patient Information**: Stores age, gender, location, and contact details with privacy compliance
- **Symptom Tracking**: Predefined symptom categories with validation
- **Disease Identification**: Suspected disease tracking with confirmation status
- **Severity Assessment**: Categorizes cases as mild, moderate, severe, or critical
- **Water Source Linking**: Links to suspected water sources and related water reports
- **Emergency Alerts**: Automatic escalation for critical cases

### Validation Features
- **Age Group Auto-Assignment**: Automatically sets age group based on patient age
- **Symptom Validation**: Ensures only valid symptoms from predefined list
- **Disease Validation**: Validates suspected diseases against waterborne disease list
- **Contact Validation**: Phone number format validation
- **Date Validation**: Ensures onset date is before report date
- **Emergency Auto-Escalation**: Automatically flags critical cases as emergency

### Advanced Features
- **Risk Assessment**: Virtual property that calculates risk level based on multiple factors
- **Statistical Methods**: Disease statistics, age group analysis, and trend tracking
- **Location Indexing**: Efficient location-based queries for outbreak detection
- **Outcome Tracking**: Patient outcome monitoring and follow-up management

## Schema Structure

```javascript
{
  caseId: String,               // Auto-generated unique ID (HC + timestamp + random)
  submittedBy: String,          // Name of person submitting report
  submitterRole: String,        // Role: doctor, nurse, asha_worker, etc.
  patientInfo: {
    age: Number,                // Patient age (0-150)
    ageGroup: String,           // Auto-assigned: 0-5, 5-15, 15-25, 25-35, 35-45, 45+
    gender: String,             // male, female, other, prefer_not_to_say
    location: String,           // Patient location/address
    contactNumber: String       // Optional contact number with validation
  },
  symptoms: [String],           // Array of symptoms from predefined list
  severity: String,             // mild, moderate, severe, critical
  suspectedWaterSource: {
    source: String,             // Type of water source (enum)
    location: String,           // Water source location
    relatedWaterReport: ObjectId, // Optional reference to WaterReport
    sourceDescription: String   // Additional description
  },
  diseaseIdentification: {
    suspectedDisease: String,   // Disease from predefined list
    confirmationStatus: String, // suspected, confirmed, ruled_out, pending_lab_results
    labTestsOrdered: [String],  // Array of lab tests
    labResults: String          // Lab results description
  },
  emergencyAlert: Boolean,      // Emergency flag (auto-set for critical cases)
  reportDate: Date,             // When report was submitted
  onsetDate: Date,              // When symptoms started (optional)
  hospitalAdmission: {
    required: Boolean,          // Whether admission is required
    hospitalName: String,       // Hospital name if admitted
    admissionDate: Date         // Admission date
  },
  outcome: String,              // recovering, recovered, hospitalized, deceased, etc.
  followUpRequired: Boolean,    // Whether follow-up is needed
  notes: String,                // Additional notes
  reviewedBy: String,           // Reviewer name (optional)
  reviewedAt: Date,             // Review timestamp (optional)
  createdAt: Date,              // Auto-generated
  updatedAt: Date               // Auto-generated
}
```

## Usage Examples

### Creating a Basic Patient Report

```javascript
const PatientReport = require('./PatientReport');

const report = new PatientReport({
  submittedBy: 'Dr. Sarah Johnson',
  submitterRole: 'doctor',
  patientInfo: {
    age: 25,
    gender: 'female',
    location: 'Village ABC, District XYZ',
    contactNumber: '+91-9876543210'
  },
  symptoms: ['diarrhea', 'vomiting', 'fever'],
  severity: 'moderate',
  suspectedWaterSource: {
    source: 'well',
    location: 'Community well near village center',
    sourceDescription: 'Open well used by multiple families'
  },
  diseaseIdentification: {
    suspectedDisease: 'gastroenteritis',
    confirmationStatus: 'suspected',
    labTestsOrdered: ['stool_culture']
  },
  reportDate: new Date(),
  onsetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
});

await report.save();
```

### Creating an Emergency Case

```javascript
const emergencyReport = new PatientReport({
  submittedBy: 'Nurse Priya Sharma',
  submitterRole: 'nurse',
  patientInfo: {
    age: 65,
    gender: 'male',
    location: 'Ward 12, City Hospital'
  },
  symptoms: ['bloody_stool', 'severe_dehydration', 'fever'],
  severity: 'critical', // This will auto-set emergencyAlert to true
  suspectedWaterSource: {
    source: 'river',
    location: 'Yamuna River near Ghat 5'
  },
  diseaseIdentification: {
    suspectedDisease: 'cholera',
    confirmationStatus: 'pending_lab_results',
    labTestsOrdered: ['stool_culture', 'rapid_diagnostic_test']
  },
  reportDate: new Date()
});

await emergencyReport.save();
```

### Querying and Analytics

```javascript
// Find cases by location
const locationCases = await PatientReport.findByLocation('Village ABC');

// Find cases by disease
const choleraCase = await PatientReport.findByDisease('cholera');

// Find emergency cases
const emergencyCases = await PatientReport.findEmergencyCases();

// Get disease statistics
const diseaseStats = await PatientReport.getDiseaseStats({
  createdAt: { $gte: new Date('2024-01-01') }
});

// Get age group statistics
const ageStats = await PatientReport.getAgeGroupStats();
```

### Using Instance Methods

```javascript
const report = await PatientReport.findById(reportId);

// Escalate to emergency
await report.escalateToEmergency('Multiple similar cases reported in area');

// Update outcome
await report.updateOutcome('recovered', 'Patient fully recovered after treatment');

// Link to water report
await report.linkWaterReport(waterReportId);

// Access virtual properties
console.log(report.riskAssessment);     // { level: 'medium', factors: [...] }
console.log(report.daysSinceOnset);     // Number of days since symptom onset
console.log(report.formattedCaseId);    // HC-123456789
```

## Validation Rules

### Required Fields
- `submittedBy`: Person submitting the report
- `patientInfo.age`: Patient age (0-150)
- `patientInfo.ageGroup`: Age group (auto-assigned if not provided)
- `patientInfo.gender`: Gender from predefined list
- `patientInfo.location`: Patient location
- `symptoms`: At least one symptom from predefined list
- `severity`: Severity level from predefined list
- `suspectedWaterSource`: Complete water source information
- `diseaseIdentification`: Disease identification details
- `reportDate`: Report submission date

### Validation Enums

#### Symptoms
`diarrhea`, `vomiting`, `nausea`, `abdominal_pain`, `fever`, `dehydration`, `bloody_stool`, `watery_stool`, `muscle_cramps`, `headache`, `fatigue`, `loss_of_appetite`, `jaundice`, `other`

#### Severity Levels
`mild`, `moderate`, `severe`, `critical`

#### Age Groups
`0-5`, `5-15`, `15-25`, `25-35`, `35-45`, `45+`

#### Suspected Diseases
`cholera`, `typhoid`, `hepatitis_a`, `hepatitis_e`, `dysentery`, `gastroenteritis`, `diarrheal_disease`, `giardiasis`, `cryptosporidiosis`, `rotavirus`, `norovirus`, `other`

#### Water Sources
`well`, `borehole`, `river`, `lake`, `pond`, `spring`, `tap`, `bottled`, `other`

#### Confirmation Status
`suspected`, `confirmed`, `ruled_out`, `pending_lab_results`

#### Lab Tests
`stool_culture`, `blood_culture`, `rapid_diagnostic_test`, `pcr_test`, `serology`, `microscopy`, `other`

#### Outcomes
`recovering`, `recovered`, `hospitalized`, `deceased`, `lost_to_followup`, `unknown`

## Risk Assessment

The model includes a virtual `riskAssessment` property that automatically calculates risk level based on:

- **Severity Level**: Critical → Critical Risk, Severe → High Risk
- **Disease Type**: High-risk diseases (cholera, typhoid, hepatitis) increase risk
- **Age Group**: Vulnerable groups (0-5, 45+) increase risk
- **Emergency Alert**: Automatically sets risk to critical

Risk levels: `low`, `medium`, `high`, `critical`

## Indexes

- **Unique**: `caseId` (auto-generated unique identifier)
- **Compound**: `patientInfo.location + createdAt` (location-based queries)
- **Compound**: `severity + createdAt` (severity filtering)
- **Compound**: `diseaseIdentification.suspectedDisease + createdAt` (disease tracking)
- **Compound**: `emergencyAlert + createdAt` (emergency case queries)
- **Single**: `reportDate` (date-based queries)

## Testing

Run the test suite to verify model functionality:

```bash
npm test -- PatientReport
```

The test suite covers:
- Model creation and validation
- Case ID generation
- Symptom and disease validation
- Risk assessment calculations
- Virtual properties and methods
- Statistical aggregation methods

## Requirements Mapping

This model satisfies the following requirements:

- **Requirement 3.1**: Patient information, symptoms, and suspected water source tracking
- **Requirement 3.2**: Predefined symptom categories with validation
- **Requirement 3.4**: Severity categorization (mild, moderate, severe, critical)

## Performance Considerations

- Compound indexes optimize common query patterns (location, severity, disease, date)
- Case ID generation uses timestamp + random for uniqueness without collisions
- Virtual properties calculated on-demand without storage overhead
- Aggregation pipelines for efficient statistical calculations
- Auto-escalation rules minimize manual intervention for critical cases

## Privacy and Security

- Contact information is optional and validated when provided
- Patient data follows health data privacy requirements
- No sensitive medical details stored beyond necessary surveillance data
- Audit trail maintained through timestamps and reviewer tracking
---

# 
Alert Model Documentation

## Overview

The `Alert` model is designed to manage comprehensive alert monitoring for water quality issues, health clusters, and emergency situations. It supports automatic alert generation, severity-based prioritization, team assignment, action tracking, and resolution management with geospatial capabilities.

## Features

### Core Functionality
- **Unique Alert ID Generation**: Auto-generates unique alert IDs in format `AL{timestamp}{random}`
- **Multi-Type Alerts**: Supports water quality, health cluster, emergency, outbreak, and system maintenance alerts
- **Severity-Based Prioritization**: Four severity levels with automatic priority calculation
- **Location Tracking**: Geospatial coordinates with address and district information
- **Source Tracking**: Links alerts to water reports, patient reports, IoT sensors, or manual triggers
- **Parameter Monitoring**: Tracks threshold breaches for various parameters

### Alert Management
- **Status Lifecycle**: Active → Acknowledged → Investigating → Resolved/False Alarm
- **Team Assignment**: Multi-member team assignment with roles and contact information
- **Action History**: Complete audit trail of all actions taken on alerts
- **Escalation System**: Automatic and manual escalation with level tracking
- **Notification System**: Multi-channel notifications (email, SMS, push, system)
- **Related Alerts**: Linking system for related or duplicate alerts

### Advanced Features
- **Auto-Escalation**: Critical alerts automatically escalated to level 1
- **Urgency Scoring**: Dynamic urgency calculation based on severity and time
- **Geospatial Queries**: Location-based alert discovery and analysis
- **Statistical Analytics**: Comprehensive alert statistics and trend analysis
- **Expiry Management**: TTL (Time To Live) for low-priority alerts

## Schema Structure

```javascript
{
  alertId: String,              // Auto-generated unique ID (AL + timestamp + random)
  type: String,                 // water_quality, health_cluster, emergency, outbreak, system_maintenance
  severity: String,             // low, medium, high, critical
  title: String,                // Alert title (max 200 chars)
  description: String,          // Detailed description (max 1000 chars)
  location: {
    coordinates: [Number],      // [longitude, latitude]
    address: String,            // Full address
    district: String            // District name
  },
  parameters: {                 // Required for water_quality and health_cluster alerts
    parameterName: String,      // pH, turbidity, case_count, etc.
    measuredValue: Number,      // Actual measured value
    threshold: Number,          // Threshold that was breached
    unit: String,               // Unit of measurement
    comparisonType: String      // above, below, equal, range
  },
  source: {
    type: String,               // water_report, patient_report, iot_sensor, manual, system_generated
    sourceId: ObjectId,         // Reference to source document
    sourceModel: String,        // Model name for population
    sensorId: String,           // For IoT sensor sources
    triggeredBy: String         // For manual sources
  },
  status: String,               // active, acknowledged, investigating, resolved, false_alarm, expired
  priority: Number,             // 1-10 (auto-calculated based on severity)
  assignedTeam: [{
    memberName: String,         // Team member name
    role: String,               // lead, investigator, field_worker, coordinator, support
    contactInfo: String,        // Contact information
    assignedAt: Date            // Assignment timestamp
  }],
  actions: [{
    action: String,             // acknowledged, investigated, team_assigned, escalated, etc.
    performedBy: String,        // Person who performed action
    performerRole: String,      // Role of performer
    timestamp: Date,            // When action was performed
    notes: String,              // Action notes
    attachments: [{             // Optional file attachments
      filename: String,
      fileId: ObjectId,
      uploadDate: Date
    }]
  }],
  escalationLevel: Number,      // 0-5 (auto-escalated for critical alerts)
  estimatedResolutionTime: Date, // Expected resolution time
  actualResolutionTime: Date,   // Actual resolution time
  resolvedAt: Date,             // Resolution timestamp
  resolvedBy: String,           // Person who resolved alert
  resolutionNotes: String,      // Resolution details
  notificationsSent: [{
    recipient: String,          // Notification recipient
    method: String,             // email, sms, push, system
    sentAt: Date,               // Send timestamp
    status: String              // sent, delivered, failed
  }],
  relatedAlerts: [ObjectId],    // References to related alerts
  tags: [String],               // Custom tags for categorization
  isPublic: Boolean,            // Whether alert is public
  expiresAt: Date,              // Auto-expiry date (for low priority alerts)
  createdAt: Date,              // Auto-generated
  updatedAt: Date               // Auto-generated
}
```

## Usage Examples

### Creating a Water Quality Alert

```javascript
const Alert = require('./Alert');

const waterAlert = new Alert({
  type: 'water_quality',
  severity: 'high',
  title: 'High pH Level Detected',
  description: 'Water pH level exceeds safe drinking water standards in the area',
  location: {
    coordinates: [77.5946, 12.9716],
    address: '123 Main Street, Bangalore',
    district: 'Bangalore Urban'
  },
  parameters: {
    parameterName: 'pH',
    measuredValue: 9.2,
    threshold: 8.5,
    unit: 'pH units',
    comparisonType: 'above'
  },
  source: {
    type: 'water_report',
    sourceId: waterReportId,
    sourceModel: 'WaterReport'
  }
});

await waterAlert.save();
```

### Creating a Health Cluster Alert

```javascript
const healthAlert = new Alert({
  type: 'health_cluster',
  severity: 'critical',
  title: 'Disease Outbreak Detected',
  description: 'Multiple cases of waterborne disease reported in the same area',
  location: {
    coordinates: [77.6031, 12.9698],
    address: '456 Health Center Road, Bangalore',
    district: 'Bangalore Urban'
  },
  parameters: {
    parameterName: 'case_count',
    measuredValue: 15,
    threshold: 10,
    unit: 'cases',
    comparisonType: 'above'
  },
  source: {
    type: 'patient_report',
    sourceId: patientReportId,
    sourceModel: 'PatientReport'
  }
});

await healthAlert.save();
```

### Creating a Manual Emergency Alert

```javascript
const emergencyAlert = new Alert({
  type: 'emergency',
  severity: 'critical',
  title: 'Emergency Water Contamination',
  description: 'Immediate action required due to severe water contamination',
  location: {
    coordinates: [77.5946, 12.9716],
    address: '789 Emergency Site, Bangalore',
    district: 'Bangalore Urban'
  },
  source: {
    type: 'manual',
    triggeredBy: 'Emergency Coordinator John Doe'
  }
});

await emergencyAlert.save();
```

### Alert Management Operations

```javascript
const alert = await Alert.findById(alertId);

// Acknowledge alert
await alert.addAction({
  action: 'acknowledged',
  performedBy: 'Dr. Sarah Johnson',
  performerRole: 'health_officer',
  notes: 'Alert acknowledged, initiating investigation'
});

// Assign team
await alert.assignTeam([
  { memberName: 'John Doe', role: 'lead', contactInfo: 'john@example.com' },
  { memberName: 'Jane Smith', role: 'investigator', contactInfo: 'jane@example.com' }
]);

// Escalate alert
await alert.escalate('Supervisor Mike', 'Situation worsening, need immediate response');

// Resolve alert
await alert.resolve('Dr. Sarah Johnson', 'Water source treated and tested safe');

// Send notifications
await alert.sendNotification('admin@health.gov', 'email');

// Link related alerts
await alert.linkAlert(relatedAlertId);
```

### Querying and Analytics

```javascript
// Find active alerts
const activeAlerts = await Alert.findActiveAlerts();

// Find alerts by location (within 10km)
const nearbyAlerts = await Alert.findByLocation(77.5946, 12.9716, 10);

// Find alerts by severity
const criticalAlerts = await Alert.findBySeverity('critical');

// Get alert statistics
const stats = await Alert.getAlertStats({
  createdAt: { $gte: new Date('2024-01-01') }
});

// Get alerts by type
const alertsByType = await Alert.getAlertsByType();

// Access virtual properties
console.log(alert.formattedAlertId);    // AL-123456789
console.log(alert.urgencyScore);        // Dynamic urgency score
console.log(alert.timeSinceCreation);   // "2 hours ago"
console.log(alert.responseTime);        // "4 hours" (if resolved)
```

## Validation Rules

### Required Fields
- `type`: Alert type from predefined enum
- `severity`: Severity level from predefined enum
- `title`: Alert title (max 200 characters)
- `description`: Alert description (max 1000 characters)
- `location`: Complete location information with coordinates
- `source`: Source information with type and relevant IDs
- `parameters`: Required for water_quality and health_cluster alerts

### Validation Enums

#### Alert Types
`water_quality`, `health_cluster`, `emergency`, `outbreak`, `system_maintenance`

#### Severity Levels
`low`, `medium`, `high`, `critical`

#### Status Values
`active`, `acknowledged`, `investigating`, `resolved`, `false_alarm`, `expired`

#### Source Types
`water_report`, `patient_report`, `iot_sensor`, `manual`, `system_generated`

#### Parameter Names
`pH`, `turbidity`, `dissolved_oxygen`, `temperature`, `conductivity`, `total_dissolved_solids`, `case_count`, `mortality_rate`, `outbreak_threshold`, `water_contamination_level`, `other`

#### Action Types
`acknowledged`, `investigated`, `team_assigned`, `escalated`, `resolved`, `false_alarm`, `monitoring`, `response_initiated`, `resources_deployed`, `public_notification`, `other`

#### Team Roles
`lead`, `investigator`, `field_worker`, `coordinator`, `support`

#### Notification Methods
`email`, `sms`, `push`, `system`

## Auto-Calculations and Middleware

### Priority Calculation
- **Low**: Priority 3
- **Medium**: Priority 5
- **High**: Priority 7
- **Critical**: Priority 10

### Auto-Escalation
- Critical alerts automatically set to escalation level 1
- Escalation increases priority by 2 (max 10)

### Auto-Expiry
- Low priority alerts expire after 30 days
- TTL index automatically removes expired alerts

### Status Management
- Adding 'acknowledged' action updates status to 'acknowledged'
- Adding 'investigated' action updates status to 'investigating'
- Adding 'resolved' action updates status to 'resolved' and sets resolvedAt

## Virtual Properties

### formattedAlertId
Returns formatted alert ID: `AL-123456789`

### urgencyScore
Dynamic calculation based on severity and time elapsed:
- Severity weights: low=1, medium=2, high=3, critical=4
- Time factor increases urgency as time passes
- Formula: `severityScore * (1 + timeFactor)`

### timeSinceCreation
Human-readable time since alert creation: "2 hours ago", "3 days ago"

### responseTime
Time taken to resolve alert (only for resolved alerts): "4 hours", "2 days"

## Indexes

- **Geospatial**: `location.coordinates` (2dsphere for location queries)
- **Compound**: `status + severity + createdAt` (alert filtering)
- **Compound**: `type + createdAt` (type-based queries)
- **Compound**: `location.district + status` (district-based filtering)
- **Compound**: `priority + createdAt` (priority sorting)
- **TTL**: `expiresAt` (automatic expiry for low priority alerts)

## Testing

Run the test suite to verify model functionality:

```bash
npm test -- Alert
```

The test suite covers:
- Model creation and validation for all alert types
- Required field enforcement and enum validation
- Auto-calculation of priority and escalation levels
- Virtual property calculations
- Instance methods (actions, team assignment, escalation, resolution)
- Static methods (queries and analytics)
- Integration tests with database operations

## Requirements Mapping

This model satisfies the following requirements:

- **Requirement 6.1**: Automatic alert generation for water quality parameter thresholds
- **Requirement 6.2**: Alert categorization by Water Quality, Health Clusters, and Query Response
- **Requirement 6.5**: Status management and audit trail for alert actions

## Performance Considerations

- Geospatial indexing enables efficient location-based queries
- Compound indexes optimize common filtering patterns
- TTL index automatically manages alert lifecycle
- Priority-based sorting for urgent alert identification
- Aggregation pipelines for statistical analysis
- Virtual properties calculated on-demand without storage overhead

## Security and Privacy

- Action audit trail maintains complete history
- Team assignment tracking with timestamps
- Notification delivery status tracking
- Public/private alert classification
- Attachment support with file reference validation
- Role-based action tracking for accountability

## Integration Points

### Water Reports
- Alerts can be triggered by water quality parameter breaches
- Source tracking links back to originating water reports
- Automatic parameter comparison against thresholds

### Patient Reports
- Health cluster alerts generated from multiple patient reports
- Disease outbreak detection based on case count thresholds
- Geographic clustering analysis for outbreak identification

### Notification Systems
- Multi-channel notification support (email, SMS, push)
- Delivery status tracking and retry mechanisms
- Escalation-based notification routing

### Team Management
- Role-based team assignment and tracking
- Contact information management for rapid response
- Action history with performer identification and roles