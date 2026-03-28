/**
 * Tests that simulate the actual IS24 page script structure observed in the wild.
 * IS24 builds window.IS24 incrementally across ~17 script tags.
 * These tests verify which fields are actually extractable.
 */
import { describe, it, expect } from 'vitest';
import { parseIS24FromScripts, extractMetadata } from '@immo24/metadata';

// Simulate the real IS24 script structure observed via browser debug
function buildRealWorldDocument(): Document {
  const doc = document.implementation.createHTMLDocument('IS24 Expose');

  function addScript(content: string) {
    const s = doc.createElement('script');
    s.textContent = content;
    doc.body.appendChild(s);
  }

  // Script 0: large script with individual property assignments (real pattern)
  addScript(`
    window.IS24 = window.IS24 || {};
    IS24.ssoAppName = "expose";
    IS24.applicationContext = "/expose/frontend";
    IS24.ab = {"EXPO3198":"unassigned","EXPO1555":"unassigned"};
    IS24.expose = IS24.expose || {};
    IS24.expose.id = 166173168;
    IS24.expose.purchasePrice = "829000";
    IS24.expose.propertyPrice = "829000";
    IS24.expose.totalRent = "";
    IS24.expose.baseRent = "";
    IS24.expose.commercializationType = "BUY";
    IS24.expose.realEstateType = "APARTMENT_BUY";
    IS24.expose.onTopProduct = "XXL";
    IS24.expose.isVerifiedRealtor = true;
    IS24.expose.isCommercialRealtor = true;
    IS24.expose.lastModificationDate = "2026-03-25T17:58:18.399Z";
    IS24.expose.locationAddress = {"street":"Oberländer Ufer","houseNumber":"194","zip":"50968","city":"Köln","isFullAddress":true};
    IS24.expose.contactData = {"contactPerson":{"salutationAndTitle":"Herr","firstName":"Stefan","lastName":"Busch"},"phoneNumbers":{"phoneNumber":{"contactNumber":"0221 95798476"},"cellPhoneNumber":{"contactNumber":"0172 6599210"}},"realtorInformation":{"companyName":"Immobilien Busch","privateOffer":false}};
    IS24.expose.availableServicesData = {"squareMeters":98,"numberOfRooms":4,"zipCode":"50968","isGasHeating":true};
    IS24.expose.galleryData = {"images":[{"id":"1","caption":"Wohn- Kochbereich","fullSizePictureUrl":"https://pictures.immobilienscout24.de/listings/abc.jpg","thumbnailUrl":"https://pictures.immobilienscout24.de/listings/abc-thumb.jpg","type":"PICTURE"}],"documents":[{"title":"Grundriss neu.pdf","url":"https://example.com/doc.pdf"}],"floorPlanAvailable":true,"imageCount":13};
  `);

  // Script 1
  addScript(`IS24.expose.reportingEventStore = [];`);

  // Script 4
  addScript(`IS24.message = {};`);

  // Script 5: travelTime (unquoted keys, JS literal)
  addScript(`
    IS24.expose.travelTime = {
      city: "Schleiden",
      zip: "53937",
      isFullAddress: false,
      streetAndStreetNumber: ""
    }
  `);

  // Script 6: premiumStatsWidget (unquoted keys, JS object literal - NOT valid JSON)
  addScript(`
    IS24.premiumStatsWidget = {
      exposeOnlineSince: "2026-03-08T20:51:51.000+01:00",
      exposeReturnUrl: "/expose/166173168",
      exposePPA: false,
      layout: "DEFAULT",
      plusUpsellUrl: "/warenkorb/kaeuferplus/"
    };
  `);

  // Script 9: quickCheckConfig (valid JSON)
  addScript(`
    IS24.expose.quickCheckConfig = {
      "quickCheckServiceUrl": "/reference-price/ajax/v3.0/latitude/50.90181/longitude/6.98194?realEstateType=2&objectCategory=0&price=8459.18&livingArea=98&constructionYear=1980&firstTimeUse=false",
      "livingArea": 98,
      "price": 8459.18,
      "location": "Marienburg"
    };
  `);

  // Script 11: contactLayerModel (valid JSON, large)
  addScript(`
    IS24.contactLayerModel = {
      "ssoHost": "https://sso.immobilienscout24.de",
      "topic": {
        "relocation": {
          "details": {
            "type": "MFH",
            "elevator": false,
            "floor": "2"
          }
        }
      }
    };
  `);

  // SSR data (server-side rendered, set as individual property)
  addScript(`
    IS24.ssr = IS24.ssr || {};
    IS24.ssr.frontendModel = IS24.ssr.frontendModel || {};
    IS24.ssr.frontendModel.exposeTitle = {"exposeTitle":"4-ZI / Wohntraum in Marienburg"};
    IS24.ssr.frontendModel.exposeContent = {"objectDescription":"Bei dem Objekt...","locationDescription":"Köln Marienburg...","furnishingDescription":"Sanierung 2025/2026","otherDescription":"Besichtigungen möglich.","aiSummaries":[{"content":"Die kernsanierte Wohnung..."}]};
    IS24.ssr.frontendModel.booleanCriteriaData = {"criteria":[{"key":"balcony","hasTooltip":false},{"key":"guestToilet","hasTooltip":false},{"key":"cellar","hasTooltip":false},{"key":"hasNoCourtage","hasTooltip":false}]};
    IS24.ssr.frontendModel.exposeMap = {"location":{"latitude":50.90181,"longitude":6.98194,"coordinateAvailable":true,"showFullAddress":true},"addressForMap":{"street":"Oberländer Ufer","houseNumber":"194","zipCode":"50968","city":"Köln","quarter":"Marienburg","region":"Nordrhein-Westfalen"}};
  `);

  return doc;
}

describe('Real-world IS24 page structure', () => {
  const doc = buildRealWorldDocument();
  const is24 = parseIS24FromScripts(doc);
  const m = extractMetadata(is24);

  it('publishedAt — extracted via regex from JS literal', () => {
    expect(m.publishedAt).toBe('08.03.2026');
  });

  it('lastModifiedAt — extracted via string assignment', () => {
    expect(m.lastModifiedAt).toBe('25.03.2026');
  });

  it('exposeId', () => {
    expect(m.exposeId).toBe('166173168');
  });

  it('title — from ssr.frontendModel.exposeTitle', () => {
    expect(m.title).toBe('4-ZI / Wohntraum in Marienburg');
  });

  it('realEstateType', () => {
    expect(m.realEstateType).toBe('APARTMENT_BUY');
  });

  it('commercializationType', () => {
    expect(m.commercializationType).toBe('BUY');
  });

  it('onTopProduct', () => {
    expect(m.onTopProduct).toBe('XXL');
  });

  it('price — buy listing', () => {
    expect(m.price.amount).toBe(829000);
    expect(m.price.type).toBe('buy');
    expect(m.price.pricePerSqm).toBe(8459.18);
  });

  it('location — from expose.locationAddress', () => {
    expect(m.location.street).toBe('Oberländer Ufer');
    expect(m.location.houseNumber).toBe('194');
    expect(m.location.zip).toBe('50968');
    expect(m.location.city).toBe('Köln');
  });

  it('location — quarter and region from exposeMap', () => {
    expect(m.location.quarter).toBe('Marienburg');
    expect(m.location.region).toBe('Nordrhein-Westfalen');
  });

  it('location — geo coordinates from exposeMap', () => {
    expect(m.location.geo).toEqual({ latitude: 50.90181, longitude: 6.98194 });
  });

  it('contact — from expose.contactData', () => {
    expect(m.contact.firstName).toBe('Stefan');
    expect(m.contact.lastName).toBe('Busch');
    expect(m.contact.company).toBe('Immobilien Busch');
    expect(m.contact.phone).toBe('0221 95798476');
  });

  it('property.squareMeters and numberOfRooms — from availableServicesData', () => {
    expect(m.property.squareMeters).toBe(98);
    expect(m.property.numberOfRooms).toBe(4);
  });

  it('property.constructionYear — parsed from quickCheckConfig URL', () => {
    expect(m.property.constructionYear).toBe(1980);
  });

  it('property.floor — from contactLayerModel', () => {
    expect(m.property.floor).toBe('2');
  });

  it('property.features — from booleanCriteriaData', () => {
    expect(m.property.features).toContain('balcony');
    expect(m.property.features).toContain('cellar');
  });

  it('gallery — images and documents', () => {
    expect(m.gallery.imageCount).toBe(13);
    expect(m.gallery.hasFloorplan).toBe(true);
    expect(m.gallery.images).toHaveLength(1);
    expect(m.gallery.documents).toHaveLength(1);
  });

  it('descriptions — all text fields', () => {
    expect(m.descriptions).toHaveProperty('objectDescription');
    expect(m.descriptions).toHaveProperty('locationDescription');
    expect(m.descriptions).toHaveProperty('aiSummary');
  });
});
