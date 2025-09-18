const request = require('supertest');
const express = require('express');
const analyticsRoutes = require('../../routes/analytics');
const {
  exportAnalyticsCSV,
  exportAnalyticsExcel,
  exportAnalyticsPDF,
  emailAnalyticsReport
} = require('../analyticsController');

// Mock the models
jest.mock('../../models/PatientReport');
jest.mock('../../models/WaterReport');
jest.mock('../../utils/exportUtils');

const PatientReport = require('../../models/PatientReport');
const WaterReport = require('../../models/WaterReport');
const exportUtils = require('../../utils/exportUtils');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);

describe('Analytics Export Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CSV Export', () => {
    it('should export patient cases as CSV', async () => {
      const mockCases = [
        {
          caseId: 'CASE-001',
          reportDate: new Date('2024-01-15'),
          patientInfo: {
            location: 'Test District',
            age: 30,
            ageGroup: '25-35',
            gender: 'Male'
          },
          symptoms: ['Diarrhea', 'Fever'],
          severity: 'moderate',
          diseaseIdentification: {
            suspectedDisease: 'Gastroenteritis',
            confirmationStatus: 'suspected'
          },
          suspectedWaterSource: {
            source: 'Well Water',
            location: 'Test Area'
          },
          emergencyAlert: false,
          submittedBy: 'Dr. Test'
        }
      ];

      PatientReport.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCases)
          })
        })
      });

      exportUtils.createCSVExport = jest.fn().mockReturnValue('Case ID,Report Date\nCASE-001,2024-01-15');

      const response = await request(app)
        .get('/api/analytics/export/csv')
        .query({ type: 'cases' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(exportUtils.createCSVExport).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            'Case ID': 'CASE-001'
          })
        ])
      );
    });

    it('should return 404 when no data found', async () => {
      PatientReport.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        })
      });

      const response = await request(app)
        .get('/api/analytics/export/csv')
        .query({ type: 'cases' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_DATA');
    });
  });

  describe('Excel Export', () => {
    it('should export water quality reports as Excel', async () => {
      const mockReports = [
        {
          reportId: 'WR-001',
          createdAt: new Date('2024-01-15'),
          location: {
            district: 'Test District',
            address: 'Test Address',
            waterSource: 'River'
          },
          testingParameters: {
            pH: 7.2,
            turbidity: 2.5,
            dissolvedOxygen: 6.8,
            temperature: 25
          },
          status: 'reviewed',
          submittedBy: 'Field Worker'
        }
      ];

      WaterReport.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockReports)
        })
      });

      const mockExcelBuffer = Buffer.from('mock excel data');
      exportUtils.createExcelExport = jest.fn().mockReturnValue(mockExcelBuffer);

      const response = await request(app)
        .get('/api/analytics/export/excel')
        .query({ type: 'water-quality' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
      expect(exportUtils.createExcelExport).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            'Report ID': 'WR-001'
          })
        ]),
        'Water Quality Reports'
      );
    });
  });

  describe('PDF Export', () => {
    it('should export patient cases as PDF', async () => {
      const mockCases = [
        {
          caseId: 'CASE-001',
          reportDate: new Date('2024-01-15'),
          patientInfo: {
            location: 'Test District',
            age: 30,
            gender: 'Male'
          },
          severity: 'moderate',
          diseaseIdentification: {
            suspectedDisease: 'Gastroenteritis'
          },
          suspectedWaterSource: {
            source: 'Well Water'
          },
          emergencyAlert: false
        }
      ];

      PatientReport.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCases)
          })
        })
      });

      const mockPDFBuffer = Buffer.from('mock pdf data');
      exportUtils.createPDFReport = jest.fn().mockReturnValue(mockPDFBuffer);

      const response = await request(app)
        .get('/api/analytics/export/pdf')
        .query({ type: 'cases' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf; charset=utf-8');
      expect(exportUtils.createPDFReport).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            'Case ID': 'CASE-001'
          })
        ]),
        expect.objectContaining({
          title: 'Patient Cases Report',
          orientation: 'landscape'
        })
      );
    });
  });

  describe('Email Export', () => {
    it('should send email with PDF attachment', async () => {
      const mockCases = [
        {
          caseId: 'CASE-001',
          reportDate: new Date('2024-01-15'),
          patientInfo: {
            location: 'Test District',
            age: 30,
            ageGroup: '25-35',
            gender: 'Male'
          },
          symptoms: ['Diarrhea'],
          severity: 'moderate',
          diseaseIdentification: {
            suspectedDisease: 'Gastroenteritis'
          },
          suspectedWaterSource: {
            source: 'Well Water'
          },
          emergencyAlert: false,
          submittedBy: 'Dr. Test'
        }
      ];

      PatientReport.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCases)
          })
        })
      });

      const mockPDFBuffer = Buffer.from('mock pdf data');
      exportUtils.createPDFReport = jest.fn().mockReturnValue(mockPDFBuffer);
      exportUtils.generateSummaryStats = jest.fn().mockReturnValue({
        totalRecords: 1,
        severityDistribution: { moderate: 1 }
      });
      exportUtils.sendEmailWithAttachment = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'test-message-id'
      });

      const response = await request(app)
        .post('/api/analytics/export/email')
        .send({
          type: 'cases',
          format: 'pdf',
          email: 'test@example.com',
          subject: 'Test Report'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recipient).toBe('test@example.com');
      expect(exportUtils.sendEmailWithAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Report'
        }),
        mockPDFBuffer,
        expect.stringContaining('cases_report_'),
        'application/pdf'
      );
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/analytics/export/email')
        .send({
          type: 'cases',
          format: 'pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      PatientReport.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      const response = await request(app)
        .get('/api/analytics/export/csv')
        .query({ type: 'cases' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EXPORT_ERROR');
    });

    it('should handle export utility errors', async () => {
      PatientReport.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ caseId: 'CASE-001' }])
          })
        })
      });

      exportUtils.createCSVExport = jest.fn().mockImplementation(() => {
        throw new Error('Export utility error');
      });

      const response = await request(app)
        .get('/api/analytics/export/csv')
        .query({ type: 'cases' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});