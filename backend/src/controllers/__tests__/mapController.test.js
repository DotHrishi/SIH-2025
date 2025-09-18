const PatientReport = require('../../models/PatientReport');
const { getPatientClusters, getClusterDetails, getClusterUpdates } = require('../mapController');

// Mock the PatientReport model
jest.mock('../../models/PatientReport');

describe('Map Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      params: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getPatientClusters', () => {
    it('should return empty clusters when no patient reports exist', async () => {
      PatientReport.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      await getPatientClusters(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          clusters: [],
          totalCases: 0,
          totalClusters: 0
        }
      });
    });

    it('should cluster patient reports by proximity', async () => {
      const mockReports = [
        {
          _id: '1',
          caseId: 'HC001',
          patientInfo: {
            coordinates: [77.5946, 12.9716], // Bangalore
            location: 'Bangalore'
          },
          severity: 'mild',
          diseaseIdentification: { suspectedDisease: 'diarrhea' },
          reportDate: new Date()
        },
        {
          _id: '2',
          caseId: 'HC002',
          patientInfo: {
            coordinates: [77.5950, 12.9720], // Close to first one
            location: 'Bangalore'
          },
          severity: 'moderate',
          diseaseIdentification: { suspectedDisease: 'cholera' },
          reportDate: new Date()
        }
      ];

      PatientReport.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockReports)
        })
      });

      req.query = { radius: '1000' };

      await getPatientClusters(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            clusters: expect.arrayContaining([
              expect.objectContaining({
                caseCount: 2,
                severity: expect.any(String),
                center: expect.any(Array)
              })
            ]),
            totalCases: 2,
            totalClusters: 1
          })
        })
      );
    });

    it('should handle filtering parameters', async () => {
      PatientReport.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      req.query = {
        radius: '500',
        severity: 'severe',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        disease: 'cholera',
        location: 'Bangalore'
      };

      await getPatientClusters(req, res);

      expect(PatientReport.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'patientInfo.coordinates': { $exists: true, $ne: null },
          severity: 'severe',
          'diseaseIdentification.suspectedDisease': 'cholera',
          'patientInfo.location': expect.any(RegExp),
          reportDate: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date)
          })
        })
      );
    });
  });

  describe('getClusterDetails', () => {
    it('should return error when center coordinates are missing', async () => {
      req.params.clusterId = 'cluster_1';
      req.query = { radius: '1000' };

      await getClusterDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Center coordinates (centerLat, centerLon) are required'
        }
      });
    });

    it('should return cluster details with statistics', async () => {
      const mockCases = [
        {
          caseId: 'HC001',
          severity: 'mild',
          diseaseIdentification: { suspectedDisease: 'diarrhea' },
          patientInfo: { age: 25, ageGroup: '25-35', location: 'Bangalore', coordinates: [77.5946, 12.9716] },
          reportDate: new Date(),
          emergencyAlert: false,
          suspectedWaterSource: { source: 'well' }
        }
      ];

      PatientReport.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCases)
          })
        })
      });

      req.params.clusterId = 'cluster_1';
      req.query = {
        radius: '1000',
        centerLat: '12.9716',
        centerLon: '77.5946'
      };

      await getClusterDetails(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            clusterId: 'cluster_1',
            totalCases: 1,
            severityBreakdown: expect.objectContaining({
              mild: 1,
              moderate: 0,
              severe: 0,
              critical: 0
            }),
            cases: expect.arrayContaining([
              expect.objectContaining({
                caseId: 'HC001',
                severity: 'mild'
              })
            ])
          })
        })
      );
    });
  });

  describe('getClusterUpdates', () => {
    it('should return error when lastUpdate is missing', async () => {
      await getClusterUpdates(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'lastUpdate timestamp is required'
        }
      });
    });

    it('should return no updates when no new reports exist', async () => {
      PatientReport.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      req.query.lastUpdate = new Date().toISOString();

      await getClusterUpdates(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          hasUpdates: false,
          newCases: 0,
          updatedClusters: []
        }
      });
    });
  });
});