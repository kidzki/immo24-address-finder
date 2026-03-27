// Factory Pattern for Overlay Creation

import type { Address, Settings } from '../types.js';

export interface OverlayTheme {
  bg: string;
  fg: string;
  border: string;
  shadow: string;
}

export class OverlayThemeFactory {
  static createTheme(theme: Settings['theme']): OverlayTheme {
    if (theme === 'light') {
      return {
        bg: '#ffffff',
        fg: '#111827',
        border: 'rgba(0,0,0,.1)',
        shadow: 'rgba(0,0,0,.15)'
      };
    }
    
    return {
      bg: '#111827',
      fg: '#ffffff',
      border: 'rgba(255,255,255,.08)',
      shadow: 'rgba(0,0,0,.25)'
    };
  }
}

export class OverlayStyleFactory {
  private static readonly POSITION_MAP: Record<Settings['position'], string> = {
    'bottom-right': 'inset: auto 16px 16px auto;',
    'bottom-left': 'inset: auto auto 16px 16px;',
    'top-right': 'inset: 16px 16px auto auto;',
    'top-left': 'inset: 16px auto auto 16px;'
  };

  static createBaseStyle(theme: Settings['theme'], position: Settings['position']): string {
    const palette = OverlayThemeFactory.createTheme(theme);
    const positionStyle = this.POSITION_MAP[position] || this.POSITION_MAP['bottom-right'];

    return `
      position: fixed; ${positionStyle} z-index: 2147483647;
      background: ${palette.bg}; color: ${palette.fg}; 
      font: 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;
      border-radius: 12px; box-shadow: 0 8px 24px ${palette.shadow}; 
      padding: 12px 14px; min-width: 280px; max-width: 360px;
      border: 1px solid ${palette.border}; display: none;
    `;
  }

  static createButtonStyle(): string {
    return `
      appearance: none; border: 0; border-radius: 10px; padding: 8px 10px; cursor: pointer;
      background: #2563eb; color: #fff; font-weight: 600;
    `;
  }

  static createGhostButtonStyle(theme: Settings['theme']): string {
    const border = theme === 'light' ? 'rgba(17,24,39,.2)' : 'rgba(255,255,255,.2)';
    const text = theme === 'light' ? '#111827' : '#fff';
    
    return `
      appearance: none; border: 1px solid ${border}; border-radius: 10px; 
      padding: 8px 10px; cursor: pointer; background: transparent; 
      color: ${text}; font-weight: 600;
    `;
  }
}

export class AddressFormatter {
  static format(address: Address): string {
    const parts: string[] = [];
    
    if (address.street || address.houseNumber) {
      parts.push([address.street, address.houseNumber].filter(Boolean).join(' '));
    }

    if (address.postalCode || address.city) {
      parts.push([address.postalCode, address.city].filter(Boolean).join(' '));
    }

    if (address.district) {
      parts.push(`(${address.district})`);
    }
    
    return parts.join('\n');
  }

  static sanitize(text: string): string {
    if (!text) return text;
    
    const fixed = this.fixDoubleUtf8(text);
    return fixed.replace(/\uFFFD/g, '');
  }

  private static fixDoubleUtf8(s: string): string {
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
