/**
 * PatientReport Model Usage Examples
 * 
 * This file demonstrates how to use the PatientReport model
 * for creating, validating, and querying patient reports.
 */

const PatientReport = require('../PatientReport');

// Example 1: Basic Patient Report Creation
const createBasicPatientReport = () => {
  const patientReportData = {
    submittedBy: 'Dr. Sarah Johnson',
    submitterRole: 'doctor',
    patientInfo: {
      age: 8,
      ageGroup: '5-15',
      gender: 'female',
      location: 'Village Rampur, District Ghaziabad',
      contactNumber: '+91-9876543210'
    },
    symptoms: ['diarrhea', 'vomiting', 'fever', 'dehydration'],
    severity: 'moderate',
    suspectedWaterSource: {
      source: 'well',
      location: 'Community well behind school',
      sourceDescription: 'Open well used by 50+ families, no recent cleaning'
    },
    diseaseIdentification: {
      suspectedDisease: 'gastroenteritis',
      confirmationStatus: 'suspected',
      labTestsOrdered: ['stool_culture', 'rapid_diagnostic_test']
    },
    emergencyAlert: false,
    reportDate: new Date(),
    onsetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    followUpRequired: true,
    notes: 'Patient reports drinking from community well. Multiple similar cases in the area.'
  };

  return patientReportData;
};

// Example 2: Emergency/Critical Case
const createEmergencyPatientReport = () => {
  const emergencyReportData = {
    submittedBy: 'Nurse Priya Sharma',
    submitterRole: 'nurse',
    patientInfo: {
      age: 65,
      ageGroup: '45+',
      gender: 'male',
      location: 'Ward 12, City Hospital',
      contactNumber: '+91-9123456789'
    },
    symptoms: ['bloody_stool', 'severe_dehydration', 'fever', 'vomiting'],
    severity: 'critical',
    suspectedWaterSource: {
      source: 'river',
      location: 'Yamuna River near Ghat 5',
      sourceDescription: 'Patient reports drinking river water during religious ceremony'
    },
    diseaseIdentification: {
      suspectedDisease: 'cholera',
      confirmationStatus: 'pending_lab_results',
      labTestsOrdered: ['stool_culture', 'rapid_diagnostic_test', 'pcr_test']
    },
    emergencyAlert: true,
    reportDate: new Date(),
    onsetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    hospitalAdmission: {
      required: true,
      hospitalName: 'City General Hospital',
      admissionDate: new Date()
    },
    followUpRequired: true,
    notes: 'URGENT: Suspected cholera outbreak. Patient in critical condition. Contact tracing initiated.'
  };

  return emergencyReportData;
};

// Example 3: Pediatric Case
const createPediatricPatientReport = () => {
  const pediatricReportData = {
    submittedBy: 'ASHA Worker Meera Devi',
    submitterRole: 'asha_worker',
    patientInfo: {
      age: 2,
      ageGroup: '0-5',
      gender: 'male',
      location: 'Anganwadi Center, Village Sultanpur',
      contactNumber: '+91-8765432109'
    },
    symptoms: ['watery_stool', 'vomiting', 'fever', 'loss_of_appetite'],
    severity: 'moderate',
    suspectedWaterSource: {
      source: 'tap',
      location: 'Village hand pump',
      sourceDescription: 'Community hand pump, water appears cloudy'
    },
    diseaseIdentification: {
      suspectedDisease: 'rotavirus',
      confirmationStatus: 'suspected',
      labTestsOrdered: ['stool_culture']
    },
    emergencyAlert: false,
    reportDate: new Date(),
    onsetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    followUpRequired: true,
    notes: 'Mother reports child became ill after drinking from village pump. Other children in area also affected.'
  };

  return pediatricReportData;
};

// Example Usage Functions (for demonstration)
const demonstrateModelUsage = async () => {
  try {
    console.log('=== PatientReport Model Examples ===\n');

    // Example 1: Basic Report
    const basicReport = createBasicPatientReport();
    console.log('1. Basic Patient Report:');
    console.log(`   Case ID Pattern: HC + timestamp + random`);
    console.log(`   Symptoms: ${basicReport.symptoms.join(', ')}`);
    console.log(`   Severity: ${basicReport.severity}`);
    console.log(`   Disease: ${basicReport.diseaseIdentification.suspectedDisease}\n`);

    // Example 2: Emergency Report
    const emergencyReport = createEmergencyPatientReport();
    console.log('2. Emergency Patient Report:');
    console.log(`   Emergency Alert: ${emergencyReport.emergencyAlert}`);
    console.log(`   Severity: ${emergencyReport.severity}`);
    console.log(`   Disease: ${emergencyReport.diseaseIdentification.suspectedDisease}`);
    console.log(`   Hospital Admission: ${emergencyReport.hospitalAdmission.required}\n`);

    // Example 3: Pediatric Report
    const pediatricReport = createPediatricPatientReport();
    console.log('3. Pediatric Patient Report:');
    console.log(`   Age Group: ${pediatricReport.patientInfo.ageGroup}`);
    console.log(`   Submitter Role: ${pediatricReport.submitterRole}`);
    console.log(`   Water Source: ${pediatricReport.suspectedWaterSource.source}\n`);

    // Demonstrate validation
    console.log('=== Validation Examples ===');
    console.log('Valid Symptoms:', [
      'diarrhea', 'vomiting', 'nausea', 'abdominal_pain', 'fever',
      'dehydration', 'bloody_stool', 'watery_stool', 'muscle_cramps',
      'headache', 'fatigue', 'loss_of_appetite', 'jaundice', 'other'
    ]);
    
    console.log('Valid Severities:', ['mild', 'moderate', 'severe', 'critical']);
    
    console.log('Valid Diseases:', [
      'cholera', 'typhoid', 'hepatitis_a', 'hepatitis_e', 'dysentery', 
      'gastroenteritis', 'diarrheal_disease', 'giardiasis', 'cryptosporidiosis',
      'rotavirus', 'norovirus', 'other'
    ]);

  } catch (error) {
    console.error('Error demonstrating model usage:', error);
  }
};

// Export examples for use in other files
module.exports = {
  createBasicPatientReport,
  createEmergencyPatientReport,
  createPediatricPatientReport,
  demonstrateModelUsage
};

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateModelUsage();
}