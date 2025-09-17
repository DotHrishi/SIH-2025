const mongoose = require('mongoose');
const Alert = require('../Alert');

// Check if we have a database connection for integration tests
const runIntegrationTests = process.env.NODE_ENV !== 'test' || process.env.MONGODB_URI;

if (!runIntegrationTests) {
  console.log('Skipping integration tests - no database connection');
}

// Mock data for testing
const validAlertData = {
  type: 'water_quality',
  severity: 'high',
  title: 'High pH Level Detected',
  description: 'Water pH level exceeds safe drinking water standards in the area',
  location: {
    coordinates: [77.5946, 12.9716], // Bangalore coordinates
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
    sourceId: new mongoose.Types.ObjectId(),
    sourceModel: 'WaterReport'
  }
};

const validCriticalAlertData = {
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
    sourceId: new mongoose.Types.ObjectId(),
    sourceModel: 'PatientReport'
  }
};

describe('Alert Model Integration Tests', () => {
  // Skip all tests if no database connection
  beforeAll(() => {
    if (!runIntegrationTests) {
      return;
    }
  });

  afterEach(async () => {
    if (!runIntegrationTests) return;
    
    // Clean up test data
    try {
      await Alert.deleteMany({ title: { $regex: /test|Test/ } });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should save and retrieve alert from database', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData = { ...validAlertData };
    alertData.title = 'Test Alert for Database';
    
    const alert = new Alert(alertData);
    const savedAlert = await alert.save();
    
    expect(savedAlert._id).toBeDefined();
    expect(savedAlert.alertId).toMatch(/^AL\d{9}$/);
    expect(savedAlert.createdAt).toBeInstanceOf(Date);
    expect(savedAlert.updatedAt).toBeInstanceOf(Date);
    
    // Retrieve from database
    const retrievedAlert = await Alert.findById(savedAlert._id);
    expect(retrievedAlert.title).toBe('Test Alert for Database');
    expect(retrievedAlert.type).toBe('water_quality');
    expect(retrievedAlert.severity).toBe('high');
  });

  test('should enforce unique alertId constraint', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData1 = { ...validAlertData };
    alertData1.title = 'Test Alert 1';
    const alert1 = new Alert(alertData1);
    await alert1.save();
    
    const alertData2 = { ...validAlertData };
    alertData2.title = 'Test Alert 2';
    alertData2.alertId = alert1.alertId; // Same alertId
    const alert2 = new Alert(alertData2);
    
    await expect(alert2.save()).rejects.toThrow();
  });

  test('should create geospatial index and support location queries', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData = { ...validAlertData };
    alertData.title = 'Test Location Alert';
    alertData.location.coordinates = [77.5946, 12.9716]; // Bangalore
    
    const alert = new Alert(alertData);
    await alert.save();
    
    // Test location-based query
    const nearbyAlerts = await Alert.findByLocation(77.5946, 12.9716, 5); // 5km radius
    expect(nearbyAlerts.length).toBeGreaterThan(0);
    expect(nearbyAlerts[0].title).toBe('Test Location Alert');
  });

  test('should support static methods for querying', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    // Create test alerts
    const alert1Data = { ...validAlertData };
    alert1Data.title = 'Test Active Alert';
    alert1Data.status = 'active';
    const alert1 = new Alert(alert1Data);
    await alert1.save();
    
    const alert2Data = { ...validCriticalAlertData };
    alert2Data.title = 'Test Critical Alert';
    const alert2 = new Alert(alert2Data);
    await alert2.save();
    
    // Test findActiveAlerts
    const activeAlerts = await Alert.findActiveAlerts();
    expect(activeAlerts.length).toBeGreaterThan(0);
    
    // Test findBySeverity
    const criticalAlerts = await Alert.findBySeverity('critical');
    expect(criticalAlerts.length).toBeGreaterThan(0);
    
    // Test getAlertStats
    const stats = await Alert.getAlertStats();
    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0].totalAlerts).toBeGreaterThan(0);
  });

  test('should handle alert actions and status updates', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData = { ...validAlertData };
    alertData.title = 'Test Action Alert';
    
    const alert = new Alert(alertData);
    await alert.save();
    
    // Add action
    await alert.addAction({
      action: 'acknowledged',
      performedBy: 'Test User',
      performerRole: 'admin',
      notes: 'Alert acknowledged for investigation'
    });
    
    // Reload from database
    const updatedAlert = await Alert.findById(alert._id);
    expect(updatedAlert.status).toBe('acknowledged');
    expect(updatedAlert.actions).toHaveLength(1);
    expect(updatedAlert.actions[0].action).toBe('acknowledged');
  });

  test('should handle team assignment', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData = { ...validAlertData };
    alertData.title = 'Test Team Assignment Alert';
    
    const alert = new Alert(alertData);
    await alert.save();
    
    const teamMembers = [
      { memberName: 'John Doe', role: 'lead', contactInfo: 'john@example.com' },
      { memberName: 'Jane Smith', role: 'investigator', contactInfo: 'jane@example.com' }
    ];
    
    await alert.assignTeam(teamMembers);
    
    // Reload from database
    const updatedAlert = await Alert.findById(alert._id);
    expect(updatedAlert.assignedTeam).toHaveLength(2);
    expect(updatedAlert.assignedTeam[0].memberName).toBe('John Doe');
    expect(updatedAlert.actions).toHaveLength(1);
    expect(updatedAlert.actions[0].action).toBe('team_assigned');
  });

  test('should handle alert escalation', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData = { ...validAlertData };
    alertData.title = 'Test Escalation Alert';
    alertData.severity = 'medium';
    
    const alert = new Alert(alertData);
    await alert.save();
    
    const initialEscalationLevel = alert.escalationLevel;
    const initialPriority = alert.priority;
    
    await alert.escalate('Test User', 'Urgent response needed');
    
    // Reload from database
    const updatedAlert = await Alert.findById(alert._id);
    expect(updatedAlert.escalationLevel).toBe(initialEscalationLevel + 1);
    expect(updatedAlert.priority).toBe(Math.min(initialPriority + 2, 10));
    expect(updatedAlert.actions).toHaveLength(1);
    expect(updatedAlert.actions[0].action).toBe('escalated');
  });

  test('should handle alert resolution', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData = { ...validAlertData };
    alertData.title = 'Test Resolution Alert';
    
    const alert = new Alert(alertData);
    await alert.save();
    
    await alert.resolve('Test User', 'Issue has been resolved successfully');
    
    // Reload from database
    const updatedAlert = await Alert.findById(alert._id);
    expect(updatedAlert.status).toBe('resolved');
    expect(updatedAlert.resolvedBy).toBe('Test User');
    expect(updatedAlert.resolutionNotes).toBe('Issue has been resolved successfully');
    expect(updatedAlert.resolvedAt).toBeInstanceOf(Date);
    expect(updatedAlert.actions).toHaveLength(1);
    expect(updatedAlert.actions[0].action).toBe('resolved');
  });

  test('should handle notifications', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData = { ...validAlertData };
    alertData.title = 'Test Notification Alert';
    
    const alert = new Alert(alertData);
    await alert.save();
    
    await alert.sendNotification('admin@example.com', 'email');
    
    // Reload from database
    const updatedAlert = await Alert.findById(alert._id);
    expect(updatedAlert.notificationsSent).toHaveLength(1);
    expect(updatedAlert.notificationsSent[0].recipient).toBe('admin@example.com');
    expect(updatedAlert.notificationsSent[0].method).toBe('email');
    expect(updatedAlert.notificationsSent[0].status).toBe('sent');
  });

  test('should handle related alerts linking', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alert1Data = { ...validAlertData };
    alert1Data.title = 'Test Related Alert 1';
    const alert1 = new Alert(alert1Data);
    await alert1.save();
    
    const alert2Data = { ...validCriticalAlertData };
    alert2Data.title = 'Test Related Alert 2';
    const alert2 = new Alert(alert2Data);
    await alert2.save();
    
    await alert1.linkAlert(alert2._id);
    
    // Reload from database
    const updatedAlert1 = await Alert.findById(alert1._id);
    expect(updatedAlert1.relatedAlerts).toHaveLength(1);
    expect(updatedAlert1.relatedAlerts[0].toString()).toBe(alert2._id.toString());
  });

  test('should auto-escalate critical alerts on creation', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    const alertData = { ...validCriticalAlertData };
    alertData.title = 'Test Critical Auto-Escalation';
    
    const alert = new Alert(alertData);
    await alert.save();
    
    expect(alert.severity).toBe('critical');
    expect(alert.escalationLevel).toBe(1); // Auto-escalated
    expect(alert.priority).toBe(10); // Max priority for critical
  });

  test('should support aggregation queries', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - no database connection');
      return;
    }

    // Create test alerts of different types
    const waterAlert = new Alert({
      ...validAlertData,
      title: 'Test Water Quality Alert',
      type: 'water_quality'
    });
    await waterAlert.save();
    
    const healthAlert = new Alert({
      ...validCriticalAlertData,
      title: 'Test Health Cluster Alert',
      type: 'health_cluster'
    });
    await healthAlert.save();
    
    // Test getAlertsByType aggregation
    const alertsByType = await Alert.getAlertsByType();
    expect(alertsByType.length).toBeGreaterThan(0);
    
    const waterAlerts = alertsByType.find(item => item._id === 'water_quality');
    const healthAlerts = alertsByType.find(item => item._id === 'health_cluster');
    
    expect(waterAlerts).toBeDefined();
    expect(healthAlerts).toBeDefined();
    expect(waterAlerts.count).toBeGreaterThan(0);
    expect(healthAlerts.count).toBeGreaterThan(0);
  });
});