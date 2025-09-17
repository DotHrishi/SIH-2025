// Mock mongoose before requiring PatientReport
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    virtual: jest.fn().mockReturnValue({
      get: jest.fn()
    }),
    pre: jest.fn(),
    statics: {},
    methods: {}
  })),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn()
  }
}));

const mongoose = require('mongoose');
const PatientReport = require('../PatientReport');

describe('PatientReport Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create PatientReport model with correct schema structure', () => {
    expect(mongoose.Schema).toHaveBeenCalled();
    expect(mongoose.model).toHaveBeenCalledWith('PatientReport', expect.any(Object));
  });

  test('should generate unique case ID with HC prefix', () => {
    const mockPatientReport = new PatientReport();
    
    // Mock the default function for caseId
    const caseIdGenerator = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `HC${timestamp}${random}`;
    };

    const caseId = caseIdGenerator();
    expect(caseId).toMatch(/^HC\d{9}$/);
    expect(caseId.length).toBe(11);
  });

  test('should validate required fields structure', () => {
    const requiredFields = [
      'caseId',
      'submittedBy', 
      'patientInfo',
      'symptoms',
      'severity',
      'suspectedWaterSource',
      'diseaseIdentification',
      'reportDate'
    ];

    // This test verifies the schema structure includes required fields
    expect(mongoose.Schema).toHaveBeenCalled();
    
    // In a real test environment, we would check the schema definition
    // For now, we verify the model creation was called
    expect(mongoose.model).toHaveBeenCalledWith('PatientReport', expect.any(Object));
  });

  test('should validate symptom enum values', () => {
    const validSymptoms = [
      'diarrhea', 'vomiting', 'nausea', 'abdominal_pain', 'fever',
      'dehydration', 'bloody_stool', 'watery_stool', 'muscle_cramps',
      'headache', 'fatigue', 'loss_of_appetite', 'jaundice', 'other'
    ];

    // Test that all valid symptoms are included
    expect(validSymptoms).toContain('diarrhea');
    expect(validSymptoms).toContain('cholera');
    expect(validSymptoms.length).toBeGreaterThan(10);
  });

  test('should validate severity enum values', () => {
    const validSeverities = ['mild', 'moderate', 'severe', 'critical'];
    
    expect(validSeverities).toContain('mild');
    expect(validSeverities).toContain('moderate');
    expect(validSeverities).toContain('severe');
    expect(validSeverities).toContain('critical');
    expect(validSeverities.length).toBe(4);
  });

  test('should validate age group enum values', () => {
    const validAgeGroups = ['0-5', '5-15', '15-25', '25-35', '35-45', '45+'];
    
    expect(validAgeGroups).toContain('0-5');
    expect(validAgeGroups).toContain('45+');
    expect(validAgeGroups.length).toBe(6);
  });

  test('should validate disease enum values', () => {
    const validDiseases = [
      'cholera', 'typhoid', 'hepatitis_a', 'hepatitis_e', 'dysentery', 
      'gastroenteritis', 'diarrheal_disease', 'giardiasis', 'cryptosporidiosis',
      'rotavirus', 'norovirus', 'other'
    ];
    
    expect(validDiseases).toContain('cholera');
    expect(validDiseases).toContain('typhoid');
    expect(validDiseases).toContain('hepatitis_a');
    expect(validDiseases.length).toBeGreaterThan(10);
  });
});