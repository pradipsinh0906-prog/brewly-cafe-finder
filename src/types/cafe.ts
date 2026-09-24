export interface MenuItem {
  name: string;
  price: string;
  description: string;
}

export interface Cafe {
  id: string;
  name: string;
  tagline: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance: string;
  priceLevel: '₹' | '₹₹' | '₹₹₹';
  priceEstimate: string;
  isOpen: boolean;
  openingHours: string;
  address: string;
  area: string;
  category: string;
  amenities: string[];
  aiMatch: number;
  aiReasoning: string;
  vibeTags: string[];
  wifiSpeed: string;
  noiseLevel: 'Quiet' | 'Moderate' | 'Lively';
  outlets: 'Every Table' | 'Ample Outlets' | 'Limited Outlets';
  signatureItems: MenuItem[];
  popularFor: string;
  directionsUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface QuickPrompt {
  id: string;
  label: string;
  iconName: string;
  searchQuery: string;
}
