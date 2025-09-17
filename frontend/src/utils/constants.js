// API Endpoints
export const API_ENDPOINTS = {
  DASHBOARD: '/dashboard',
  WATER_REPORTS: '/reports/water',
  PATIENT_REPORTS: '/reports/patient',
  ANALYTICS: '/analytics',
  ALERTS: '/alerts',
  DIRECTORY: '/directory',
};

// Navigation items
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/alerts', label: 'Alerts', icon: '🚨' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/reports', label: 'Reports', icon: '📋' },
  { path: '/forms', label: 'Forms', icon: '📝' },
  { path: '/directory', label: 'Directory', icon: '📞' },
];

// Alert severity levels
export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Alert types
export const ALERT_TYPES = {
  WATER_QUALITY: 'water_quality',
  HEALTH_CLUSTER: 'health_cluster',
  EMERGENCY: 'emergency',
  OUTBREAK: 'outbreak',
  SYSTEM_MAINTENANCE: 'system_maintenance',
};

// Alert status
export const ALERT_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  FALSE_ALARM: 'false_alarm',
};

// Alert actions
export const ALERT_ACTIONS = {
  ACKNOWLEDGE: 'acknowledged',
  INVESTIGATE: 'investigated',
  RESOLVE: 'resolved',
  ESCALATE: 'escalated',
  ASSIGN_TEAM: 'team_assigned',
  FALSE_ALARM: 'false_alarm',
};

// Report status options
export const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  ACTION_REQUIRED: 'action_required',
};

// Patient case severity
export const CASE_SEVERITY = {
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
};

// Age groups for patient reports
export const AGE_GROUPS = [
  '0-5',
  '5-15',
  '15-25',
  '25-35',
  '35-45',
  '45+',
];

// Common symptoms for patient reports
export const SYMPTOMS = [
  'Diarrhea',
  'Vomiting',
  'Nausea',
  'Abdominal Pain',
  'Fever',
  'Dehydration',
  'Headache',
  'Fatigue',
  'Loss of Appetite',
  'Muscle Cramps',
  'Bloody Stool',
  'Watery Stool',
  'Cholera-like Symptoms',
  'Dysentery Symptoms',
  'Typhoid Symptoms',
  'Hepatitis Symptoms',
  'Other'
];

// Waterborne diseases
export const WATERBORNE_DISEASES = [
  'Cholera',
  'Typhoid',
  'Hepatitis A',
  'Hepatitis E',
  'Dysentery',
  'Gastroenteritis',
  'Diarrheal Disease',
  'Other Waterborne Disease',
  'Unknown'
];

// Water source types
export const WATER_SOURCE_TYPES = [
  'River',
  'Lake',
  'Pond',
  'Well',
  'Borehole',
  'Spring',
  'Tap Water',
  'Other'
];

// Analytics chart types
export const CHART_TYPES = {
  TRENDS: 'trends',
  SEVERITY: 'severity',
  AGE_GROUP: 'ageGroup',
  WATER_QUALITY: 'waterQuality'
};

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf'
};

// Chart colors
export const CHART_COLORS = {
  PRIMARY: 'rgb(59, 130, 246)',
  SUCCESS: 'rgb(34, 197, 94)',
  WARNING: 'rgb(251, 191, 36)',
  DANGER: 'rgb(239, 68, 68)',
  INFO: 'rgb(16, 185, 129)',
  SECONDARY: 'rgb(107, 114, 128)'
};

// Severity colors for charts
export const SEVERITY_COLORS = {
  mild: {
    bg: 'rgba(34, 197, 94, 0.8)',
    border: 'rgb(34, 197, 94)'
  },
  moderate: {
    bg: 'rgba(251, 191, 36, 0.8)',
    border: 'rgb(251, 191, 36)'
  },
  severe: {
    bg: 'rgba(239, 68, 68, 0.8)',
    border: 'rgb(239, 68, 68)'
  }
};

// Health center types
export const CENTER_TYPES = {
  ASHA: 'ASHA',
  NGO: 'NGO',
};

// Health center status
export const CENTER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
};

// Directory tabs
export const DIRECTORY_TABS = [
  { id: 'asha', label: 'ASHA Centers', type: CENTER_TYPES.ASHA },
  { id: 'ngo', label: 'NGO Partners', type: CENTER_TYPES.NGO },
];

// Resource types
export const RESOURCE_TYPES = [
  'Medical Supplies',
  'Testing Kits',
  'Water Purification Tablets',
  'Emergency Equipment',
  'Communication Devices',
  'Transportation',
  'Other',
];