// Builder Pattern for Overlay Construction

import type { Settings } from '../types.js';
import type { Address } from '@immo24/decoder';
import { OverlayStyleFactory, AddressFormatter } from '../factories/overlay-factory.js';

export class OverlayBuilder {
  private element: HTMLDivElement;
  private settings: Settings;
  private address: Address;
  private translator: (key: string) => string;
  private onCopy?: (text: string) => Promise<boolean>;
  private onClose?: () => void;

  constructor(
    settings: Settings,
    address: Address,
    translator: (key: string) => string
  ) {
    this.settings = settings;
    this.address = address;
    this.translator = translator;
    this.element = document.createElement('div');
  }

  withCopyHandler(handler: (text: string) => Promise<boolean>): this {
    this.onCopy = handler;
    return this;
  }

  withCloseHandler(handler: () => void): this {
    this.onClose = handler;
    return this;
  }

  build(): HTMLDivElement {
    this.setupContainer();
    this.addTitle();
    this.addAddressDisplay();
    this.addActionButtons();
    
    return this.element;
  }

  private setupContainer(): void {
    this.element.id = 'is24-address-decoder-overlay';
    const style = OverlayStyleFactory.createBaseStyle(
      this.settings.theme,
      this.settings.position
    );
    this.element.setAttribute('style', style);
  }

  private addTitle(): void {
    const title = document.createElement('div');
    title.style.fontWeight = '700';
    title.style.marginBottom = '6px';
    title.textContent = this.translator('uiTitle');
    this.element.appendChild(title);
  }

  private addAddressDisplay(): void {
    const line = document.createElement('div');
    line.style.margin = '6px 0 10px';
    line.style.whiteSpace = 'pre-wrap';

    const sanitizedAddress: Address = {
      street: AddressFormatter.sanitize(this.address.street),
      houseNumber: AddressFormatter.sanitize(this.address.houseNumber),
      postalCode: AddressFormatter.sanitize(this.address.postalCode),
      city: AddressFormatter.sanitize(this.address.city),
      district: AddressFormatter.sanitize(this.address.district)
    };

    const formatted = AddressFormatter.format(sanitizedAddress);
    line.textContent = formatted || this.translator('uiNoAddress');
    this.element.appendChild(line);
  }

  private addActionButtons(): void {
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.flexWrap = 'wrap';

    if (this.onCopy) {
      actions.appendChild(this.createCopyButton());
    }
    
    actions.appendChild(this.createMapButton());
    
    if (this.onClose) {
      actions.appendChild(this.createCloseButton());
    }

    this.element.appendChild(actions);
  }

  private createCopyButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    const style = OverlayStyleFactory.createButtonStyle();
    btn.setAttribute('style', style);
    btn.textContent = this.translator('uiCopy');

    if (this.onCopy) {
      const sanitizedAddress: Address = {
        street: AddressFormatter.sanitize(this.address.street),
        houseNumber: AddressFormatter.sanitize(this.address.houseNumber),
        postalCode: AddressFormatter.sanitize(this.address.postalCode),
        city: AddressFormatter.sanitize(this.address.city),
        district: AddressFormatter.sanitize(this.address.district)
      };
      
      const addrLine = AddressFormatter.format(sanitizedAddress);
      const copyHandler = this.onCopy;

      btn.addEventListener('click', async () => {
        const ok = await copyHandler(addrLine);
        btn.textContent = ok ? this.translator('uiCopied') : this.translator('uiCopyFail');
        setTimeout(() => {
          btn.textContent = this.translator('uiCopy');
        }, 1500);
      });
    }

    return btn;
  }

  private createMapButton(): HTMLAnchorElement {
    const btn = document.createElement('a');
    const style = OverlayStyleFactory.createGhostButtonStyle(this.settings.theme);
    btn.setAttribute('style', style + ' text-decoration:none; display:inline-flex; align-items:center; justify-content:center;');
    
    btn.href = this.buildMapHref();
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.textContent = this.translator('uiOpenMap');

    return btn;
  }

  private createCloseButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    const style = OverlayStyleFactory.createGhostButtonStyle(this.settings.theme);
    btn.setAttribute('style', style);
    btn.textContent = this.translator('uiClose');

    if (this.onClose) {
      btn.addEventListener('click', this.onClose);
    }

    return btn;
  }

  private buildMapHref(): string {
    const parts = [
      this.address.street,
      this.address.houseNumber,
      this.address.postalCode,
      this.address.city
    ].filter(Boolean);

    const q = encodeURIComponent(parts.join(' '));

    switch (this.settings.mapProvider) {
      case 'osm':
        return `https://www.openstreetmap.org/search?query=${q}`;
      case 'apple':
        return `https://maps.apple.com/?q=${q}`;
      default:
        return `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
  }
}
