import {
  calculateDistance,
  calculateCentroid,
  clusterPatientCases,
  calculateClusterSeverity,
  calculateClusterRadius,
  getSeverityColor,
  calculateSeverityBreakdown,
} from "../geoUtils";

describe("geoUtils", () => {
  describe("calculateDistance", () => {
    it("should calculate distance between two points correctly", () => {
      const point1 = { lat: 28.6139, lng: 77.209 }; // Delhi
      const point2 = { lat: 19.076, lng: 72.8777 }; // Mumbai

      const distance = calculateDistance(point1, point2);

      // Distance between Delhi and Mumbai is approximately 1150km
      expect(distance).toBeGreaterThan(1100000); // 1100km
      expect(distance).toBeLessThan(1200000); // 1200km
    });

    it("should return 0 for identical points", () => {
      const point = { lat: 28.6139, lng: 77.209 };
      const distance = calculateDistance(point, point);

      expect(distance).toBe(0);
    });
  });

  describe("calculateCentroid", () => {
    it("should calculate centroid of multiple points", () => {
      const points = [
        { lat: 28.6139, lng: 77.209 },
        { lat: 28.6239, lng: 77.219 },
        { lat: 28.6339, lng: 77.229 },
      ];

      const centroid = calculateCentroid(points);

      expect(centroid.lat).toBeCloseTo(28.6239, 4);
      expect(centroid.lng).toBeCloseTo(77.219, 4);
    });

    it("should handle empty array", () => {
      const centroid = calculateCentroid([]);

      expect(centroid.lat).toBe(0);
      expect(centroid.lng).toBe(0);
    });
  });

  describe("clusterPatientCases", () => {
    const sampleReports = [
      {
        _id: "1",
        location: { coordinates: [77.209, 28.6139] },
        severity: "mild",
      },
      {
        _id: "2",
        location: { coordinates: [77.219, 28.6239] },
        severity: "moderate",
      },
      {
        _id: "3",
        location: { coordinates: [72.8777, 19.076] },
        severity: "severe",
      },
    ];

    it("should cluster nearby cases", () => {
      const clusters = clusterPatientCases(sampleReports, 50000); // 50km radius

      expect(clusters).toHaveLength(2); // Delhi cluster and Mumbai cluster
      expect(clusters[0].caseCount).toBe(2); // Delhi area cases
      expect(clusters[1].caseCount).toBe(1); // Mumbai case
    });

    it("should handle empty reports array", () => {
      const clusters = clusterPatientCases([]);

      expect(clusters).toHaveLength(0);
    });

    it("should skip reports without valid location", () => {
      const invalidReports = [
        { _id: "1", severity: "mild" }, // No location
        { _id: "2", location: {}, severity: "moderate" }, // Empty location
        {
          _id: "3",
          location: { coordinates: [77.209, 28.6139] },
          severity: "severe",
        },
      ];

      const clusters = clusterPatientCases(invalidReports);

      expect(clusters).toHaveLength(1); // Only one valid report
    });
  });

  describe("calculateClusterSeverity", () => {
    it("should return severe for high percentage of severe cases", () => {
      const cases = [
        { severity: "severe" },
        { severity: "severe" },
        { severity: "mild" },
      ];

      const severity = calculateClusterSeverity(cases);

      expect(severity).toBe("severe");
    });

    it("should return moderate for mixed cases", () => {
      const cases = [
        { severity: "moderate" },
        { severity: "moderate" },
        { severity: "mild" },
      ];

      const severity = calculateClusterSeverity(cases);

      expect(severity).toBe("moderate");
    });

    it("should return mild for predominantly mild cases", () => {
      const cases = [
        { severity: "mild" },
        { severity: "mild" },
        { severity: "mild" },
      ];

      const severity = calculateClusterSeverity(cases);

      expect(severity).toBe("mild");
    });
  });

  describe("calculateClusterRadius", () => {
    it("should return base radius for single case", () => {
      const radius = calculateClusterRadius(1);

      expect(radius).toBe(65); // 50 + (1 * 15)
    });

    it("should increase radius with case count", () => {
      const radius1 = calculateClusterRadius(1);
      const radius5 = calculateClusterRadius(5);

      expect(radius5).toBeGreaterThan(radius1);
    });

    it("should cap at maximum radius", () => {
      const radius = calculateClusterRadius(100);

      expect(radius).toBe(200); // Maximum radius
    });
  });

  describe("getSeverityColor", () => {
    it("should return correct colors for severity levels", () => {
      expect(getSeverityColor("mild")).toBe("#10B981");
      expect(getSeverityColor("moderate")).toBe("#F59E0B");
      expect(getSeverityColor("severe")).toBe("#EF4444");
    });

    it("should return default color for unknown severity", () => {
      expect(getSeverityColor("unknown")).toBe("#10B981");
    });
  });

  describe("calculateSeverityBreakdown", () => {
    it("should count cases by severity", () => {
      const cases = [
        { severity: "mild" },
        { severity: "mild" },
        { severity: "moderate" },
        { severity: "severe" },
      ];

      const breakdown = calculateSeverityBreakdown(cases);

      expect(breakdown.mild).toBe(2);
      expect(breakdown.moderate).toBe(1);
      expect(breakdown.severe).toBe(1);
    });

    it("should handle cases without severity", () => {
      const cases = [
        { severity: "mild" },
        {}, // No severity
        { severity: "moderate" },
      ];

      const breakdown = calculateSeverityBreakdown(cases);

      expect(breakdown.mild).toBe(2); // One explicit + one default
      expect(breakdown.moderate).toBe(1);
      expect(breakdown.severe).toBe(0);
    });
  });
});
