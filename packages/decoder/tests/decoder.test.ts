import { describe, it, expect } from 'vitest';
import { decodeAddress, Base64JsonStrategy, DirectJsonStrategy, DecodingStrategyChain } from '../src/index.js';

function toBase64(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

describe('decodeAddress', () => {
  it('decodes a base64-encoded address with German field names', () => {
    const encoded = toBase64({
      strasse: 'Musterstraße',
      hausnummer: '42',
      plz: '10115',
      ort: 'Berlin',
      ortsteil: 'Mitte'
    });

    const result = decodeAddress(encoded);

    expect(result).toEqual({
      street: 'Musterstraße',
      houseNumber: '42',
      postalCode: '10115',
      city: 'Berlin',
      district: 'Mitte'
    });
  });

  it('decodes a base64-encoded address with English field names', () => {
    const encoded = toBase64({
      street: 'Example Street',
      houseNumber: '1',
      postalCode: '80331',
      city: 'Munich',
      district: ''
    });

    const result = decodeAddress(encoded);

    expect(result).toEqual({
      street: 'Example Street',
      houseNumber: '1',
      postalCode: '80331',
      city: 'Munich',
      district: ''
    });
  });

  it('decodes a URL-safe base64 encoded address', () => {
    const normal = Buffer.from(JSON.stringify({ strasse: 'Straße', hausnummer: '1', plz: '10115', ort: 'Berlin', ortsteil: '' })).toString('base64');
    const urlSafe = normal.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const result = decodeAddress(urlSafe);

    expect(result?.street).toBe('Straße');
    expect(result?.city).toBe('Berlin');
  });

  it('decodes a directly JSON-encoded address', () => {
    const encoded = JSON.stringify({ strasse: 'Hauptstraße', hausnummer: '5', plz: '50667', ort: 'Köln', ortsteil: '' });

    const result = decodeAddress(encoded);

    expect(result?.street).toBe('Hauptstraße');
    expect(result?.postalCode).toBe('50667');
  });

  it('returns null for null input', () => {
    expect(decodeAddress(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(decodeAddress('')).toBeNull();
  });

  it('returns null for non-decodable input', () => {
    expect(decodeAddress('not-valid-base64-or-json!!!###')).toBeNull();
  });

  it('handles missing fields gracefully', () => {
    const encoded = toBase64({ strasse: 'Musterstraße' });
    const result = decodeAddress(encoded);

    expect(result?.street).toBe('Musterstraße');
    expect(result?.houseNumber).toBe('');
    expect(result?.postalCode).toBe('');
    expect(result?.city).toBe('');
    expect(result?.district).toBe('');
  });
});

describe('Base64JsonStrategy', () => {
  it('decodes valid base64 JSON', () => {
    const strategy = new Base64JsonStrategy();
    const encoded = Buffer.from('{"key":"value"}').toString('base64');
    expect(strategy.decode(encoded)).toEqual({ key: 'value' });
  });

  it('returns null for invalid input', () => {
    const strategy = new Base64JsonStrategy();
    expect(strategy.decode('!!!invalid!!!')).toBeNull();
  });
});

describe('DirectJsonStrategy', () => {
  it('decodes valid JSON string', () => {
    const strategy = new DirectJsonStrategy();
    expect(strategy.decode('{"key":"value"}')).toEqual({ key: 'value' });
  });

  it('decodes URL-encoded JSON', () => {
    const strategy = new DirectJsonStrategy();
    const encoded = encodeURIComponent('{"key":"value"}');
    expect(strategy.decode(encoded)).toEqual({ key: 'value' });
  });

  it('returns null for invalid input', () => {
    const strategy = new DirectJsonStrategy();
    expect(strategy.decode('not json')).toBeNull();
  });
});

describe('DecodingStrategyChain', () => {
  it('tries strategies in order and returns first match', () => {
    const chain = new DecodingStrategyChain()
      .addStrategy(new Base64JsonStrategy())
      .addStrategy(new DirectJsonStrategy());

    const b64 = Buffer.from('{"source":"base64"}').toString('base64');
    expect(chain.decode(b64)).toEqual({ source: 'base64' });
  });

  it('falls through to next strategy when first fails', () => {
    const chain = new DecodingStrategyChain()
      .addStrategy(new Base64JsonStrategy())
      .addStrategy(new DirectJsonStrategy());

    expect(chain.decode('{"source":"direct"}')).toEqual({ source: 'direct' });
  });

  it('returns null when no strategy matches', () => {
    const chain = new DecodingStrategyChain()
      .addStrategy(new Base64JsonStrategy())
      .addStrategy(new DirectJsonStrategy());

    expect(chain.decode('garbage input xyz')).toBeNull();
  });

  it('returns null for null input', () => {
    const chain = new DecodingStrategyChain();
    expect(chain.decode(null)).toBeNull();
  });
});
