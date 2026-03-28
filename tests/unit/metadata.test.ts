import { describe, it, expect } from 'vitest';
import { extractMetadata } from '../../src/metadata';

describe('Metadata Extraction', () => {
  it('should extract all metadata fields from window.is24 object', () => {
    const is24 = {
      expose: {
        id: 165721032,
        lastModificationDate: '2026-03-27T22:18:52.943Z',
        purchasePrice: '610000',
        commercializationType: 'BUY',
        realEstateType: 'HOUSE_BUY'
      },
      premiumStatsWidget: {
        exposeOnlineSince: '2026-02-13T18:09:57.000+01:00'
      },
      ssr: {
        frontendModel: {
          exposeTitle: {
            exposeTitle: 'Charmantes MFH in Kall mit 4 Wohneinheiten'
          }
        }
      }
    };

    const result = extractMetadata(is24);

    expect(result.exposeId).toBe('165721032');
    expect(result.publishedAt).toBe('13.02.2026');
    expect(result.lastModifiedAt).toBe('27.03.2026');
    expect(result.price).toBe('610000');
    expect(result.priceType).toBe('buy');
    expect(result.realEstateType).toBe('HOUSE_BUY');
    expect(result.title).toBe('Charmantes MFH in Kall mit 4 Wohneinheiten');
  });

  it('should handle rent listings correctly', () => {
    const is24 = {
      expose: {
        id: 123456,
        commercializationType: 'RENT',
        totalRent: '1500'
      },
      premiumStatsWidget: {}
    };

    const result = extractMetadata(is24);

    expect(result.price).toBe('1500');
    expect(result.priceType).toBe('rent');
  });

  it('should return null for missing fields', () => {
    const is24 = {
      expose: {
        id: 123456
      }
    };

    const result = extractMetadata(is24);

    expect(result.exposeId).toBe('123456');
    expect(result.publishedAt).toBeNull();
    expect(result.lastModifiedAt).toBeNull();
    expect(result.price).toBeNull();
    expect(result.priceType).toBeNull();
  });

  it('should handle empty object gracefully', () => {
    const result = extractMetadata({});

    expect(result.exposeId).toBeNull();
    expect(result.publishedAt).toBeNull();
    expect(result.lastModifiedAt).toBeNull();
    expect(result.price).toBeNull();
    expect(result.priceType).toBeNull();
    expect(result.realEstateType).toBeNull();
    expect(result.title).toBeNull();
  });

  it('should handle null input gracefully', () => {
    const result = extractMetadata(null);

    expect(result.exposeId).toBeNull();
    expect(result.publishedAt).toBeNull();
    expect(result.lastModifiedAt).toBeNull();
  });

  it('should format ISO dates to locale format (de)', () => {
    const is24 = {
      expose: {
        lastModificationDate: '2026-12-24T12:34:56.000Z'
      },
      premiumStatsWidget: {
        exposeOnlineSince: '2025-01-01T00:00:00.000Z'
      }
    };

    const result = extractMetadata(is24);

    expect(result.publishedAt).toBe('01.01.2025');
    expect(result.lastModifiedAt).toBe('24.12.2026');
  });

  it('should handle invalid date strings', () => {
    const is24 = {
      expose: {
        lastModificationDate: 'invalid-date'
      },
      premiumStatsWidget: {
        exposeOnlineSince: 'not a date'
      }
    };

    const result = extractMetadata(is24);

    expect(result.publishedAt).toBeNull();
    expect(result.lastModifiedAt).toBeNull();
  });
});
