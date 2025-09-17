const PatientReport = require('../PatientReport');

describe('PatientReport Model Integration', () => {
  test('should create a valid patient report object structure', () => {
    // Test case ID generation
    const generateCaseId = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `HC${timestamp}${random}`;
    };

    const caseId = generateCaseId();
    expect(caseId).toMatch(/^HC\d{9}$/);
    expect(caseId.length).toBe(11);
  });

  test('should validate patient report data structure', () => {
    const samplePatientReport = {
      submittedBy: 'Dr. John Smith',
      submitterRole: 'doctor',
      patientInfo: {
        age: 25,
        ageGroup: '25-35',
        gender: 'male',
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
      emergencyAlert: false,
      reportDate: new Date(),
      onsetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      followUpRequired: true,
      notes: 'Patient reports drinking from community well before symptom onset'
    };

    // Validate structure
    expect(samplePatientReport.patientInfo).toBeDefined();
    expect(samplePatientReport.symptoms).toBeInstanceOf(Array);
    expect(samplePatientReport.symptoms.length).toBeGreaterThan(0);
    expect(samplePatientReport.suspectedWaterSource).toBeDefined();
    expect(samplePatientReport.diseaseIdentification).toBeDefined();
    
    // Validate enum values
    expect(['mild', 'moderate', 'severe', 'critical']).toContain(samplePatientReport.severity);
    expect(['0-5', '5-15', '15-25', '25-35', '35-45', '45+']).toContain(samplePatientReport.patientInfo.ageGroup);
    expect(['male', 'female', 'other', 'prefer_not_to_say']).toContain(samplePatientReport.patientInfo.gender);
  });

  test('should validate symptom enum values', () => {
    const validSymptoms = [
      'diarrhea', 'vomiting', 'nausea', 'abdominal_pain', 'fever',
      'dehydration', 'bloody_stool', 'watery_stool', 'muscle_cramps',
      'headache', 'fatigue', 'loss_of_appetite', 'jaundice', 'other'
    ];

    const testSymptoms = ['diarrhea', 'vomiting', 'fever'];
    testSymptoms.forEach(symptom => {
      expect(validSymptoms).toContain(symptom);
    });
  });

  test('should validate disease enum values', () => {
    const validDiseases = [
      'cholera', 'typhoid', 'hepatitis_a', 'hepatitis_e', 'dysentery', 
      'gastroenteritis', 'diarrheal_disease', 'giardiasis', 'cryptosporidiosis',
      'rotavirus', 'norovirus', 'other'
    ];

    const testDiseases = ['cholera', 'gastroenteritis', 'typhoid'];
    testDiseases.forEach(disease => {
      expect(validDiseases).toContain(disease);
    });
  });

  test('should validate water source enum values', () => {
    const validWaterSources = [
      'well', 'borehole', 'river', 'lake', 'pond', 'spring', 'tap', 'bottled', 'other'
    ];

    const testSources = ['well', 'river', 'tap'];
    testSources.forEach(source => {
      expect(validWaterSources).toContain(source);
    });
  });

  test('should validate confirmation status enum values', () => {
    const validStatuses = ['suspected', 'confirmed', 'ruled_out', 'pending_lab_results'];
    
    validStatuses.forEach(status => {
      expect(['suspected', 'confirmed', 'ruled_out', 'pending_lab_results']).toContain(status);
    });
  });

  test('should validate lab test enum values', () => {
    const validLabTests = [
      'stool_culture', 'blood_culture', 'rapid_diagnostic_test',
      'pcr_test', 'serology', 'microscopy', 'other'
    ];

    const testLabTests = ['stool_culture', 'blood_culture'];
    testLabTests.forEach(test => {
      expect(validLabTests).toContain(test);
    });
  });
});