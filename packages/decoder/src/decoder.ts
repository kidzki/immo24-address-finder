import type { Address } from './types.js';

export interface DecodingStrategy {
  decode(encoded: string): unknown | null;
}

export class Base64JsonStrategy implements DecodingStrategy {
  decode(encoded: string): unknown | null {
    try {
      const normalized = this.normalizeBase64(encoded);
      const bytes = this.base64ToBytes(normalized);
      const jsonString = this.bytesToString(bytes);
      const fixed = this.fixDoubleUtf8(jsonString);

      try {
        return JSON.parse(fixed);
      } catch {
        return JSON.parse(decodeURIComponent(fixed));
      }
    } catch {
      return null;
    }
  }

  private normalizeBase64(b64: string): string {
    return (b64 || '').replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  }

  private base64ToBytes(b64: string): Uint8Array {
    const norm = this.normalizeBase64(b64);
    const pad = norm.length % 4 === 0 ? '' : '='.repeat(4 - (norm.length % 4));
    const bin = atob(norm + pad);
    return Uint8Array.from(bin, (c: string) => c.charCodeAt(0));
  }

  private bytesToString(bytes: Uint8Array): string {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {}

    try {
      return new TextDecoder('windows-1252', { fatal: true }).decode(bytes);
    } catch {}

    try {
      return new TextDecoder('iso-8859-1', { fatal: true }).decode(bytes);
    } catch {}

    let s = '';
    for (let i = 0; i < bytes.length; i++) {
      s += String.fromCharCode(bytes[i] & 0xff);
    }

    try {
      return decodeURIComponent(escape(s));
    } catch {
      return s;
    }
  }

  private fixDoubleUtf8(s: string): string {
    if (!s) return s;
    if (!/[Ã][\x80-\xBF]/.test(s)) return s;

    const bytes = Uint8Array.from([...s].map(ch => ch.charCodeAt(0) & 0xff));
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return s;
    }
  }
}

export class DirectJsonStrategy implements DecodingStrategy {
  decode(encoded: string): unknown | null {
    try {
      return JSON.parse(encoded);
    } catch {
      try {
        return JSON.parse(decodeURIComponent(encoded));
      } catch {
        return null;
      }
    }
  }
}

export class DecodingStrategyChain {
  private strategies: DecodingStrategy[] = [];

  addStrategy(strategy: DecodingStrategy): this {
    this.strategies.push(strategy);
    return this;
  }

  decode(encoded: string | null): unknown | null {
    if (!encoded) return null;

    let urlDecoded: string;
    try {
      urlDecoded = decodeURIComponent(String(encoded).replace(/\+/g, '%20'));
    } catch {
      urlDecoded = encoded;
    }

    for (const strategy of this.strategies) {
      const result = strategy.decode(urlDecoded);
      if (result !== null) {
        return result;
      }
    }

    return null;
  }
}

export function createDefaultDecodingChain(): DecodingStrategyChain {
  return new DecodingStrategyChain()
    .addStrategy(new Base64JsonStrategy())
    .addStrategy(new DirectJsonStrategy());
}

function sanitize(text: string): string {
  if (!text) return text;
  const bytes = Uint8Array.from([...text].map(ch => ch.charCodeAt(0) & 0xff));
  let fixed = text;
  if (/[Ã][\x80-\xBF]/.test(text)) {
    try {
      fixed = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {}
  }
  return fixed.replace(/\uFFFD/g, '');
}

function toAddress(obj: Record<string, unknown>): Address {
  return {
    street: sanitize(String(obj.strasse || obj.street || '')),
    houseNumber: sanitize(String(obj.hausnummer || obj.houseNumber || obj.housenumber || '')),
    postalCode: sanitize(String(obj.plz || obj.zip || obj.postalCode || '')),
    city: sanitize(String(obj.ort || obj.city || '')),
    district: sanitize(String(obj.ortsteil || obj.district || ''))
  };
}

export function decodeAddress(encoded: string | null): Address | null {
  const chain = createDefaultDecodingChain();
  const obj = chain.decode(encoded);
  if (!obj || typeof obj !== 'object') return null;
  return toAddress(obj as Record<string, unknown>);
}
