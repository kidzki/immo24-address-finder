import { describe, it, expect } from 'vitest';
import { extractMetadata, formatDate } from '@immo24/metadata';

// Full window.IS24 fixture based on real data
const fullIS24 = {
  expose: {
    id: 166173168,
    lastModificationDate: '2026-03-25T17:58:18.399Z',
    purchasePrice: '829000',
    propertyPrice: '829000',
    totalRent: '',
    baseRent: '',
    commercializationType: 'BUY',
    realEstateType: 'APARTMENT_BUY',
    onTopProduct: 'XXL',
    isVerifiedRealtor: true,
    isCommercialRealtor: true,
    locationAddress: {
      street: 'Oberländer Ufer',
      houseNumber: '194',
      zip: '50968',
      city: 'Köln',
      isFullAddress: true
    },
    contactData: {
      contactPerson: {
        salutationAndTitle: 'Herr',
        firstName: 'Stefan',
        lastName: 'Busch'
      },
      phoneNumbers: {
        phoneNumber: { contactNumber: '0221 95798476' },
        cellPhoneNumber: { contactNumber: '0172 6599210' }
      },
      realtorInformation: {
        companyName: 'Immobilien Busch',
        privateOffer: false
      }
    },
    availableServicesData: {
      squareMeters: 98,
      numberOfRooms: 4,
      zipCode: '50968'
    },
    galleryData: {
      images: [
        {
          id: '1',
          caption: 'Wohn- Kochbereich',
          fullSizePictureUrl: 'https://pictures.immobilienscout24.de/listings/abc.jpg',
          thumbnailUrl: 'https://pictures.immobilienscout24.de/listings/abc-thumb.jpg',
          type: 'PICTURE'
        }
      ],
      documents: [
        { title: 'Grundriss neu.pdf', url: 'https://example.com/doc.pdf' }
      ],
      floorPlanAvailable: true,
      imageCount: 13
    },
    quickCheckConfig: {
      quickCheckServiceUrl: '/reference-price/ajax/v3.0/latitude/50.90181/longitude/6.98194?realEstateType=2&objectCategory=0&price=8459.18&livingArea=98&constructionYear=1980&firstTimeUse=false'
    }
  },
  premiumStatsWidget: {
    exposeOnlineSince: '2026-03-08T20:51:51.000+01:00'
  },
  ssr: {
    frontendModel: {
      exposeTitle: {
        exposeTitle: '4-ZI / Wohntraum in Marienburg'
      },
      exposeMap: {
        location: {
          latitude: 50.90181,
          longitude: 6.98194,
          coordinateAvailable: true,
          showFullAddress: true
        },
        addressForMap: {
          street: 'Oberländer Ufer',
          houseNumber: '194',
          zipCode: '50968',
          city: 'Köln',
          quarter: 'Marienburg',
          region: 'Nordrhein-Westfalen'
        }
      },
      exposeContent: {
        objectDescription: 'Bei dem Objekt handelt es sich um...',
        locationDescription: 'Köln Marienburg ist eine ruhige...',
        furnishingDescription: 'Sanierung 2025/2026',
        otherDescription: 'Besichtigungen sind nach Absprache möglich.',
        aiSummaries: [
          { content: 'Die kernsanierte 4-Zimmer-Wohnung...' }
        ]
      },
      booleanCriteriaData: {
        criteria: [
          { key: 'balcony', hasTooltip: false },
          { key: 'guestToilet', hasTooltip: false },
          { key: 'cellar', hasTooltip: false },
          { key: 'hasNoCourtage', hasTooltip: false }
        ]
      }
    }
  }
};

describe('extractMetadata', () => {
  it('should extract all core fields from a full IS24 object', () => {
    const m = extractMetadata(fullIS24);

    expect(m.exposeId).toBe('166173168');
    expect(m.title).toBe('4-ZI / Wohntraum in Marienburg');
    expect(m.publishedAt).toBe('08.03.2026');
    expect(m.lastModifiedAt).toBe('25.03.2026');
    expect(m.realEstateType).toBe('APARTMENT_BUY');
    expect(m.commercializationType).toBe('BUY');
    expect(m.onTopProduct).toBe('XXL');
  });

  it('should extract price info with price per sqm', () => {
    const m = extractMetadata(fullIS24);

    expect(m.price.amount).toBe(829000);
    expect(m.price.type).toBe('buy');
    expect(m.price.currency).toBe('EUR');
    expect(m.price.pricePerSqm).toBe(8459.18);
  });

  it('should extract location with geo coordinates', () => {
    const m = extractMetadata(fullIS24);

    expect(m.location.street).toBe('Oberländer Ufer');
    expect(m.location.houseNumber).toBe('194');
    expect(m.location.zip).toBe('50968');
    expect(m.location.city).toBe('Köln');
    expect(m.location.quarter).toBe('Marienburg');
    expect(m.location.region).toBe('Nordrhein-Westfalen');
    expect(m.location.isFullAddress).toBe(true);
    expect(m.location.geo).toEqual({ latitude: 50.90181, longitude: 6.98194 });
  });

  it('should extract contact information', () => {
    const m = extractMetadata(fullIS24);

    expect(m.contact.firstName).toBe('Stefan');
    expect(m.contact.lastName).toBe('Busch');
    expect(m.contact.company).toBe('Immobilien Busch');
    expect(m.contact.phone).toBe('0221 95798476');
    expect(m.contact.cellPhone).toBe('0172 6599210');
    expect(m.contact.isVerified).toBe(true);
    expect(m.contact.isCommercial).toBe(true);
  });

  it('should extract property details including features and construction year', () => {
    const m = extractMetadata(fullIS24);

    expect(m.property.squareMeters).toBe(98);
    expect(m.property.numberOfRooms).toBe(4);
    expect(m.property.constructionYear).toBe(1980);
    expect(m.property.features).toEqual(['balcony', 'guestToilet', 'cellar', 'hasNoCourtage']);
  });

  it('should extract gallery data', () => {
    const m = extractMetadata(fullIS24);

    expect(m.gallery.imageCount).toBe(13);
    expect(m.gallery.hasFloorplan).toBe(true);
    expect(m.gallery.images).toHaveLength(1);
    expect(m.gallery.images[0].caption).toBe('Wohn- Kochbereich');
    expect(m.gallery.documents).toHaveLength(1);
    expect(m.gallery.documents[0].title).toBe('Grundriss neu.pdf');
  });

  it('should extract descriptions including AI summary', () => {
    const m = extractMetadata(fullIS24);

    expect(m.descriptions).toHaveProperty('objectDescription');
    expect(m.descriptions).toHaveProperty('locationDescription');
    expect(m.descriptions).toHaveProperty('furnishingDescription');
    expect(m.descriptions).toHaveProperty('otherDescription');
    expect(m.descriptions).toHaveProperty('aiSummary');
    expect(m.descriptions.aiSummary).toBe('Die kernsanierte 4-Zimmer-Wohnung...');
  });

  it('should handle rent listings', () => {
    const rentIS24 = {
      expose: {
        id: 123456,
        commercializationType: 'RENT',
        totalRent: '1500',
        availableServicesData: { squareMeters: 75 }
      },
      premiumStatsWidget: {}
    };

    const m = extractMetadata(rentIS24);

    expect(m.price.amount).toBe(1500);
    expect(m.price.type).toBe('rent');
    expect(m.price.pricePerSqm).toBe(20);
  });

  it('should handle empty object gracefully', () => {
    const m = extractMetadata({});

    expect(m.exposeId).toBeNull();
    expect(m.publishedAt).toBeNull();
    expect(m.lastModifiedAt).toBeNull();
    expect(m.price.amount).toBeNull();
    expect(m.price.type).toBeNull();
    expect(m.location.street).toBeNull();
    expect(m.contact.firstName).toBeNull();
    expect(m.property.squareMeters).toBeNull();
    expect(m.gallery.images).toHaveLength(0);
    expect(m.descriptions).toEqual({});
  });

  it('should handle null input gracefully', () => {
    const m = extractMetadata(null);

    expect(m.exposeId).toBeNull();
    expect(m.publishedAt).toBeNull();
    expect(m.lastModifiedAt).toBeNull();
  });

  it('should handle invalid date strings', () => {
    const is24 = {
      expose: { lastModificationDate: 'invalid-date' },
      premiumStatsWidget: { exposeOnlineSince: 'not a date' }
    };

    const m = extractMetadata(is24);

    expect(m.publishedAt).toBeNull();
    expect(m.lastModifiedAt).toBeNull();
  });
});

describe('formatDate', () => {
  it('should format ISO date to DD.MM.YYYY', () => {
    expect(formatDate('2026-12-24T12:34:56.000Z')).toBe('24.12.2026');
    expect(formatDate('2025-01-01T00:00:00.000Z')).toBe('01.01.2025');
  });

  it('should return null for invalid input', () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate('invalid')).toBeNull();
    expect(formatDate('')).toBeNull();
  });
});
