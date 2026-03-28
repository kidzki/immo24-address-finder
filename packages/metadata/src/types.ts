export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  street: string | null;
  houseNumber: string | null;
  zip: string | null;
  city: string | null;
  quarter: string | null;
  region: string | null;
  isFullAddress: boolean;
  geo: GeoLocation | null;
}

export interface ContactPerson {
  salutation: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  cellPhone: string | null;
  isCommercial: boolean;
  isVerified: boolean;
}

export interface PriceInfo {
  amount: number | null;
  type: 'buy' | 'rent' | null;
  pricePerSqm: number | null;
  currency: string;
}

export interface PropertyDetails {
  squareMeters: number | null;
  numberOfRooms: number | null;
  floor: string | null;
  constructionYear: number | null;
  features: string[];
}

export interface GalleryImage {
  id: string;
  caption: string;
  fullSizeUrl: string;
  thumbnailUrl: string;
}

export interface GalleryDocument {
  title: string;
  url: string;
}

export interface Gallery {
  images: GalleryImage[];
  documents: GalleryDocument[];
  imageCount: number;
  hasFloorplan: boolean;
}

export interface ExposeMetadata {
  exposeId: string | null;
  title: string | null;
  publishedAt: string | null;
  lastModifiedAt: string | null;
  realEstateType: string | null;
  commercializationType: string | null;
  onTopProduct: string | null;
  price: PriceInfo;
  location: LocationAddress;
  contact: ContactPerson;
  property: PropertyDetails;
  gallery: Gallery;
  descriptions: Record<string, string>;
}
