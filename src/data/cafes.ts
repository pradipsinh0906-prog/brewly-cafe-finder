import { Cafe, QuickPrompt } from '../types/cafe';

import roasteryImg from '../assets/images/cafe_artisan_roastery_1790222233625.jpg';
import studyImg from '../assets/images/cafe_cozy_study_books_1790222248146.jpg';
import botanicalImg from '../assets/images/cafe_botanical_garden_1790222261058.jpg';
import minimalistImg from '../assets/images/cafe_minimalist_espresso_1790222272793.jpg';

export const QUICK_PROMPTS: QuickPrompt[] = [
  { id: 'coffee', label: 'Best Coffee', iconName: 'Coffee', searchQuery: 'Best specialty coffee single origin pour over' },
  { id: 'study', label: 'Study', iconName: 'BookOpen', searchQuery: 'Quiet cafe with Wi-Fi for studying under ₹500' },
  { id: 'work', label: 'Work', iconName: 'Laptop', searchQuery: 'Productive workspace with fast internet and charging ports' },
  { id: 'date', label: 'Date', iconName: 'Heart', searchQuery: 'Romantic cozy cafe with warm ambient lighting and dessert' },
  { id: 'friends', label: 'Friends', iconName: 'Users', searchQuery: 'Vibrant spacious cafe for group catchups and brunch' },
  { id: 'outdoor', label: 'Outdoor', iconName: 'Leaf', searchQuery: 'Lush green botanical patio with open air seating' },
  { id: 'budget', label: 'Budget', iconName: 'Coins', searchQuery: 'Great pocket-friendly coffee and bites under ₹350' },
  { id: 'late', label: 'Open Late', iconName: 'Moon', searchQuery: 'Night owl cafes open past 11 PM with good vibes' },
];

export const DEMO_CAFES: Cafe[] = [
  {
    id: 'cafe-1',
    name: 'Chapter & Bean Roasters',
    tagline: 'Silent study haven with curated library & single-origin espresso',
    image: studyImg,
    rating: 4.9,
    reviewCount: 428,
    distance: '0.8 km away',
    priceLevel: '₹',
    priceEstimate: '₹420 for two',
    isOpen: true,
    openingHours: 'Open · Closes 11:00 PM',
    address: '42 Heritage Lane, 4th Block, Indiranagar',
    area: 'Indiranagar, Bengaluru',
    category: 'Study & Work Sanctuary',
    amenities: ['Ultra-fast Wi-Fi (180 Mbps)', 'Power Sockets at Every Desk', 'Silent Reading Loft', 'Ergonomic Seating', 'Cold Brew on Tap'],
    aiMatch: 98,
    aiReasoning: 'Top match: Dedicated quiet study zones, rock-solid fiber Wi-Fi, and average bill ₹420 fits under ₹500 budget.',
    vibeTags: ['Study', 'Work', 'Budget', 'Open Late'],
    wifiSpeed: '185 Mbps',
    noiseLevel: 'Quiet',
    outlets: 'Every Table',
    popularFor: 'Deep focus study sessions, thesis writing, and pour-over micro-lots',
    directionsUrl: 'https://maps.google.com/?q=12.9716,77.6412',
    coordinates: { lat: 12.9716, lng: 77.6412 },
    signatureItems: [
      { name: 'Pour-Over Geisha Micro-Lot', price: '₹220', description: 'Bright floral jasmine notes with honey finish.' },
      { name: 'Oat Cortado & Almond Biscotti', price: '₹190', description: 'Velvety double ristretto with house oat milk.' },
      { name: 'Cinnamon Brioche Toast', price: '₹160', description: 'Caramelized cultured butter and Saigon cinnamon.' }
    ]
  },
  {
    id: 'cafe-2',
    name: 'Copper & Oak Artisan Labs',
    tagline: 'Award-winning roastery celebrating ethical estates and precision brewing',
    image: roasteryImg,
    rating: 4.8,
    reviewCount: 612,
    distance: '1.4 km away',
    priceLevel: '₹₹',
    priceEstimate: '₹550 for two',
    isOpen: true,
    openingHours: 'Open · Closes 10:00 PM',
    address: '12th Main Rd, HAL 2nd Stage, Defence Colony',
    area: 'Defence Colony, Bengaluru',
    category: 'Specialty Artisan Roastery',
    amenities: ['Direct-Trade Estate Beans', 'Manual Pour-Over Bar', 'High-Speed Wi-Fi', 'Air-Conditioned', 'Pet Friendly'],
    aiMatch: 95,
    aiReasoning: 'Renowned for world-class barista craft, custom roast profiles, and vibrant daytime productivity spaces.',
    vibeTags: ['Best Coffee', 'Work', 'Friends'],
    wifiSpeed: '120 Mbps',
    noiseLevel: 'Moderate',
    outlets: 'Ample Outlets',
    popularFor: 'Specialty coffee connoisseurs, cupping sessions, and remote work meetings',
    directionsUrl: 'https://maps.google.com/?q=12.9783,77.6408',
    coordinates: { lat: 12.9783, lng: 77.6408 },
    signatureItems: [
      { name: 'Anaerobic Fermented Flat White', price: '₹240', description: 'Red berry acidity harmonized with steamed creamy jersey milk.' },
      { name: 'Cold Brew Tonic & Citrus', price: '₹210', description: '18-hour cold steeped roast with Indian tonic & candied orange peel.' },
      { name: 'Smoked Gouda Sourdough Melt', price: '₹260', description: 'Artisanal sourdough with smoked gouda and onion jam.' }
    ]
  },
  {
    id: 'cafe-3',
    name: 'The Glass Conservatory',
    tagline: 'Lush sunlit atrium cafe enveloped by tropical plants & fresh breezes',
    image: botanicalImg,
    rating: 4.7,
    reviewCount: 890,
    distance: '2.1 km away',
    priceLevel: '₹₹',
    priceEstimate: '₹680 for two',
    isOpen: true,
    openingHours: 'Open · Closes 10:30 PM',
    address: '88 Green View Way, Off 100 Feet Road',
    area: 'Indiranagar, Bengaluru',
    category: 'Botanical Garden Cafe',
    amenities: ['Outdoor Sun Deck', 'Lush Greenhouse Patio', 'Pet Friendly', 'Artisan Bakery', 'Vegan Options'],
    aiMatch: 92,
    aiReasoning: 'Unmatched garden atmosphere with natural light, perfect for romantic dates, creative thinking, and relaxed friend catchups.',
    vibeTags: ['Outdoor', 'Date', 'Friends'],
    wifiSpeed: '85 Mbps',
    noiseLevel: 'Moderate',
    outlets: 'Ample Outlets',
    popularFor: 'Aesthetic weekend dates, pet-friendly brunches, and iced botanic brews',
    directionsUrl: 'https://maps.google.com/?q=12.9652,77.6441',
    coordinates: { lat: 12.9652, lng: 77.6441 },
    signatureItems: [
      { name: 'Iced Rose Cardamom Latte', price: '₹230', description: 'Distilled Damascus rose petal extract with rich espresso.' },
      { name: 'Avocado Tartine with Zaatar', price: '₹290', description: 'Hass avocado, cherry heirloom tomatoes, toasted pepitas.' },
      { name: 'Pistachio Choux Pastry', price: '₹210', description: 'Crisp craquelin shell with silky roasted pistachio creme.' }
    ]
  },
  {
    id: 'cafe-4',
    name: 'Velvet & Noir Espresso Bar',
    tagline: 'Intimate mood lighting, velvet booths & twilight specialty drinks',
    image: minimalistImg,
    rating: 4.9,
    reviewCount: 340,
    distance: '2.6 km away',
    priceLevel: '₹₹₹',
    priceEstimate: '₹750 for two',
    isOpen: true,
    openingHours: 'Open · Closes 12:30 AM',
    address: 'Cornerstone Arcade, 80 Feet Road, Koramangala',
    area: 'Koramangala 4th Block, Bengaluru',
    category: 'Late-Night Specialty Bar',
    amenities: ['Open Until Midnight', 'Ambient Jazz Soundtrack', 'Intimate Booths', 'Artisan Mocktails', 'Valet Parking'],
    aiMatch: 91,
    aiReasoning: 'Top choice for late-night coffee dates and evening deep-work sessions with warm moody walnut acoustics.',
    vibeTags: ['Date', 'Open Late', 'Best Coffee'],
    wifiSpeed: '140 Mbps',
    noiseLevel: 'Quiet',
    outlets: 'Every Table',
    popularFor: 'Late night date spot, midnight espresso tonics, and intimate acoustic ambiance',
    directionsUrl: 'https://maps.google.com/?q=12.9345,77.6265',
    coordinates: { lat: 12.9345, lng: 77.6265 },
    signatureItems: [
      { name: 'Midnight Smoked Mocha', price: '₹260', description: 'Single-origin dark chocolate, espresso, torch-smoked applewood.' },
      { name: 'Espresso Martini (Zero-Proof)', price: '₹280', description: 'Dark roast espresso, roasted chicory syrup, cocoa bitters.' },
      { name: 'Basque Burnt Cheesecake', price: '₹270', description: 'Caramelized crust with molten vanilla bean cream cheese.' }
    ]
  }
];

export const POPULAR_LOCATIONS = [
  { city: 'Bengaluru', area: 'Indiranagar', label: 'Indiranagar, Bengaluru', coordinates: { lat: 12.9716, lng: 77.6412 } },
  { city: 'Bengaluru', area: 'Koramangala', label: 'Koramangala, Bengaluru', coordinates: { lat: 12.9345, lng: 77.6265 } },
  { city: 'Mumbai', area: 'Bandra West', label: 'Bandra West, Mumbai', coordinates: { lat: 19.0596, lng: 72.8295 } },
  { city: 'New Delhi', area: 'Hauz Khas', label: 'Hauz Khas Village, Delhi', coordinates: { lat: 28.5494, lng: 77.2001 } },
  { city: 'Gurugram', area: 'Cyber Hub', label: 'Cyber City, Gurugram', coordinates: { lat: 28.4986, lng: 77.0878 } },
  { city: 'Pune', area: 'Koregaon Park', label: 'Koregaon Park, Pune', coordinates: { lat: 18.5362, lng: 73.8940 } },
];
