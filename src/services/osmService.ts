import { Cafe } from '../types/cafe';

const CAFE_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80',
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert user location query into coordinates using free Nominatim OpenStreetMap API
 */
export async function geocodeLocationWithNominatim(
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    // First try internal server proxy to avoid any client CORS or rate-limit quirks
    const proxyResp = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    if (proxyResp.ok) {
      const data = await proxyResp.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
      }
    }
  } catch (err) {
    console.warn('Proxy geocode failed, falling back to direct Nominatim:', err);
  }

  // Direct Nominatim API fallback
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
  } catch (err) {
    console.error('Direct Nominatim geocoding error:', err);
  }

  return null;
}

/**
 * Reverse geocode coordinates to neighborhood/city name via Nominatim
 */
export async function reverseGeocodeWithNominatim(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential;
      const city = addr.city || addr.town || addr.municipality || addr.state_district;
      if (suburb && city) {
        return `${suburb}, ${city}`;
      }
      return suburb || city || data.display_name?.split(',')[0] || null;
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err);
  }
  return null;
}

/**
 * Search real cafes near coordinates using free Overpass API (OpenStreetMap)
 */
export async function fetchRealCafesFromOverpass(
  lat: number,
  lng: number,
  radius: number = 3500
): Promise<any[]> {
  const overpassQuery = `[out:json][timeout:25];
(
  node["amenity"="cafe"](around:${radius}, ${lat}, ${lng});
  way["amenity"="cafe"](around:${radius}, ${lat}, ${lng});
  node["amenity"="coffee_shop"](around:${radius}, ${lat}, ${lng});
  way["amenity"="coffee_shop"](around:${radius}, ${lat}, ${lng});
);
out center tags 30;`;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.elements || [];
  } catch (err) {
    console.error('Direct Overpass fetch error:', err);
    return [];
  }
}

/**
 * Discover real cafes near coordinates or location name with Gemini AI enrichment
 */
export async function discoverRealCafes({
  lat,
  lng,
  locationQuery,
  searchQuery,
}: {
  lat?: number;
  lng?: number;
  locationQuery?: string;
  searchQuery?: string;
}): Promise<{ cafes: Cafe[]; center: { lat: number; lng: number }; foundRealOsm: boolean }> {
  // 1. First attempt full-stack endpoint /api/cafes/search
  try {
    const res = await fetch('/api/cafes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat,
        lng,
        locationQuery,
        searchQuery,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.cafes && data.cafes.length > 0) {
        return {
          cafes: data.cafes,
          center: { lat: data.lat, lng: data.lng },
          foundRealOsm: true,
        };
      }
    }
  } catch (apiErr) {
    console.warn('/api/cafes/search endpoint unavailable, trying direct OSM fallback:', apiErr);
  }

  // 2. Direct client-side Nominatim + Overpass fallback
  let targetLat = lat;
  let targetLng = lng;

  if ((targetLat === undefined || targetLng === undefined) && locationQuery) {
    const geo = await geocodeLocationWithNominatim(locationQuery);
    if (geo) {
      targetLat = geo.lat;
      targetLng = geo.lng;
    }
  }

  if (targetLat === undefined || targetLng === undefined) {
    targetLat = 12.9784;
    targetLng = 77.6408;
  }

  const rawElements = await fetchRealCafesFromOverpass(targetLat, targetLng, 3500);

  const validElements = rawElements.filter((el) => {
    const name = el.tags?.name || el.tags?.['name:en'];
    return Boolean(name && name.trim().length > 1);
  });

  if (validElements.length === 0) {
    return {
      cafes: [],
      center: { lat: targetLat, lng: targetLng },
      foundRealOsm: false,
    };
  }

  // Format real cafes
  const mappedCafes = validElements.slice(0, 12).map((el, index) => {
    const cLat = el.lat ?? el.center?.lat ?? targetLat!;
    const cLng = el.lon ?? el.center?.lon ?? targetLng!;
    const distKm = calculateDistanceKm(targetLat!, targetLng!, cLat, cLng);
    const name = el.tags?.name || el.tags?.['name:en'] || 'Local Cafe';
    const street = el.tags?.['addr:street'] || el.tags?.['addr:suburb'] || '';
    const address =
      [el.tags?.['addr:housenumber'], street, el.tags?.['addr:city']].filter(Boolean).join(', ') ||
      `${distKm.toFixed(1)} km from center`;

    return {
      id: `osm-${el.id}`,
      name,
      address,
      tags: el.tags,
      coordinates: { lat: cLat, lng: cLng },
      distanceKm: distKm,
      distance: `${distKm < 1 ? Math.round(distKm * 1000) + ' m' : distKm.toFixed(1) + ' km'} away`,
      image: CAFE_IMAGES[index % CAFE_IMAGES.length],
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${cLat},${cLng}`,
    };
  });

  // Try to enrich with Gemini via /api/ai/enrich
  let enrichedMap = new Map<string, any>();
  try {
    const enrichRes = await fetch('/api/ai/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cafes: mappedCafes,
        searchQuery,
      }),
    });
    if (enrichRes.ok) {
      const enrichData = await enrichRes.json();
      if (Array.isArray(enrichData.enriched)) {
        enrichData.enriched.forEach((item: any) => enrichedMap.set(item.id, item));
      }
    }
  } catch (enrichErr) {
    console.warn('AI enrichment fetch error, using heuristics:', enrichErr);
  }

  const finalCafes: Cafe[] = mappedCafes.map((c, idx) => {
    const enriched = enrichedMap.get(c.id) || {};
    return {
      id: c.id,
      name: c.name,
      tagline: enriched.tagline || 'Specialty brews & warm atmosphere',
      image: c.image,
      rating: enriched.rating || Number((4.3 + ((idx * 0.1) % 0.6)).toFixed(1)),
      reviewCount: enriched.reviewCount || 90 + ((idx * 17) % 200),
      distance: c.distance,
      priceLevel: (enriched.priceLevel as '₹' | '₹₹' | '₹₹₹') || '₹₹',
      priceEstimate: enriched.priceEstimate || '₹350 for two',
      isOpen: true,
      openingHours: c.tags?.opening_hours || '8:00 AM – 10:30 PM',
      address: c.address,
      area: c.tags?.['addr:suburb'] || c.tags?.['addr:city'] || 'Nearby',
      category: enriched.category || 'Specialty Coffee House',
      amenities: enriched.amenities || [
        'High-Speed Wi-Fi',
        'Power Outlets',
        'Air Conditioning',
        'Comfortable Seating',
      ],
      aiMatch: enriched.aiMatch || 90 - idx * 2,
      aiReasoning:
        enriched.aiReasoning ||
        `Real cafe discovered via OpenStreetMap near your location. Known locally for welcoming atmosphere and quality coffee.`,
      vibeTags: enriched.vibeTags || ['Local Favorite', 'Great Espresso', 'Cozy Vibe'],
      wifiSpeed: enriched.wifiSpeed || '65 Mbps',
      noiseLevel: (enriched.noiseLevel as 'Quiet' | 'Moderate' | 'Lively') || (idx % 2 === 0 ? 'Quiet' : 'Moderate'),
      outlets: (enriched.outlets as 'Every Table' | 'Ample Outlets' | 'Limited Outlets') || 'Ample Outlets',
      signatureItems: enriched.signatureItems || [
        {
          name: 'Signature Flat White',
          price: '₹190',
          description: 'Silky microfoam over double espresso',
        },
        {
          name: 'Cold Brew on Tap',
          price: '₹210',
          description: 'Steeped for 18 hours with subtle berry finish',
        },
      ],
      popularFor: enriched.popularFor || 'Specialty roast coffee & relaxed workspace',
      directionsUrl: c.directionsUrl,
      coordinates: c.coordinates,
      isRealOsmData: true,
    };
  });

  return {
    cafes: finalCafes,
    center: { lat: targetLat, lng: targetLng },
    foundRealOsm: true,
  };
}
