import { describe, it, expect, afterEach } from 'vitest';
import { calculateRelationshipStats, getRelationshipStartDate } from '../src/utils/relationshipStats.js';

describe('relationshipStats', () => {
  describe('calculateRelationshipStats', () => {
    it('should calculate correct total days', () => {
      const stats = calculateRelationshipStats('2021-11-12');
      expect(stats.totals.days).toBeGreaterThan(1000); // More than 1000 days since 2021
    });

    it('should calculate breakdown correctly', () => {
      const stats = calculateRelationshipStats('2021-11-12');
      expect(stats.breakdown.years).toBeGreaterThanOrEqual(3);
      expect(stats.breakdown.days).toBeGreaterThanOrEqual(0);
      expect(stats.breakdown.days).toBeLessThan(366);
      expect(stats.breakdown.hours).toBeGreaterThanOrEqual(0);
      expect(stats.breakdown.hours).toBeLessThan(24);
    });

    it('should include metadata', () => {
      const stats = calculateRelationshipStats('2021-11-12', 'Europe/Berlin');
      expect(stats.startDate).toBe('2021-11-12');
      expect(stats.timezone).toBe('Europe/Berlin');
    });

    it('should calculate totals for all units', () => {
      const stats = calculateRelationshipStats('2021-11-12');
      expect(stats.totals.seconds).toBeGreaterThan(stats.totals.minutes);
      expect(stats.totals.minutes).toBeGreaterThan(stats.totals.hours);
      expect(stats.totals.hours).toBeGreaterThan(stats.totals.days);
    });
  });

  describe('getRelationshipStartDate', () => {
    const originalEnv = process.env.RELATIONSHIP_START_DATE;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.RELATIONSHIP_START_DATE;
      } else {
        process.env.RELATIONSHIP_START_DATE = originalEnv;
      }
    });

    it('should return environment variable value', () => {
      process.env.RELATIONSHIP_START_DATE = '2020-01-01';
      expect(getRelationshipStartDate()).toBe('2020-01-01');
    });

    it('should return default value if not set', () => {
      delete process.env.RELATIONSHIP_START_DATE;
      expect(getRelationshipStartDate()).toBe('2021-11-12');
    });
  });
});
