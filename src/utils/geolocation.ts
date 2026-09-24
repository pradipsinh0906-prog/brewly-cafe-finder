import { Cafe } from '../types/cafe';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface GeocodedLocation {
  displayName: string;
  neighborhood: string;
  city: string;
  country: string;
  coordinates: GeoCoordinates;
}

/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Requests actual GPS coordinates from navigator.geolocation.
 */
export async function getBrowserGeolocation(): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let msg = 'Could not retrieve your location';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Reverse geocodes latitude & longitude into a human-readable neighborhood and city using OpenStreetMap Nominatim.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<GeocodedLocation> {
  try {
    // 1. Try server proxy if available
    try {
      const proxyRes = await fetch(`/api/geocode?q=${lat},${lng}`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (Array.isArray(data) && data[0]?.address) {
          const addr = data[0].address;
          const neighborhood =
            addr.suburb ||
            addr.neighbourhood ||
            addr.quarter ||
            addr.residential ||
            'Central District';
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.state ||
            'Local City';
          const displayName =
            neighborhood && neighborhood !== city
              ? `${neighborhood}, ${city}`
              : city;
          return {
            displayName,
            neighborhood,
            city,
            country: addr.country || '',
            coordinates: { lat, lng },
          };
        }
      }
    } catch {
      // Fall through to direct fetch
    }

    // 2. Direct Nominatim OpenStreetMap Reverse Geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const neighborhood =
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.residential ||
        addr.commercial ||
        'Local Area';
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.state ||
        'Current Location';
      const country = addr.country || '';
      const displayName =
        neighborhood && neighborhood !== city
          ? `${neighborhood}, ${city}`
          : city;

      return {
        displayName,
        neighborhood,
        city,
        country,
        coordinates: { lat, lng },
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocoding warning:', err);
  }

  // Graceful fallback
  return {
    displayName: `Near (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
    neighborhood: 'Local Area',
    city: 'Current Area',
    country: '',
    coordinates: { lat, lng },
  };
}

/**
 * Geocodes location name into coordinates using OpenStreetMap Nominatim API
 */
export async function geocodeLocationNameWithNominatim(
  query: string
): Promise<GeocodedLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const addr = item.address || {};
      const neighborhood =
        addr.suburb || addr.neighbourhood || addr.quarter || query.split(',')[0];
      const city =
        addr.city || addr.town || addr.municipality || addr.state || 'Local';
      return {
        displayName: item.display_name.split(',').slice(0, 2).join(', '),
        neighborhood,
        city,
        country: addr.country || '',
        coordinates: { lat, lng },
      };
    }
  } catch (err) {
    console.error('Nominatim geocode error:', err);
  }
  return null;
}

/**
 * Offsets for creating realistic local cafe clusters around the user's detected GPS.
 * Radii roughly 0.4 km, 0.8 km, 1.2 km, 1.7 km in different directions.
 */
const CAFE_GEO_OFFSETS = [
  { latOffset: 0.0035, lngOffset: 0.0028, distanceStr: '0.4 km away' }, // ~400m Northeast
  { latOffset: -0.0048, lngOffset: 0.0032, distanceStr: '0.8 km away' }, // ~800m Southeast
  { latOffset: 0.0062, lngOffset: -0.0075, distanceStr: '1.2 km away' }, // ~1.2km Northwest
  { latOffset: -0.0085, lngOffset: -0.0062, distanceStr: '1.7 km away' }, // ~1.7km Southwest
];

/**
 * Maps cafes to the user's detected coordinates so the map and cards
 * reflect the user's real location with precise walking distances and Google Maps directions.
 */
export function adaptCafesToUserLocation(
  baseCafes: Cafe[],
  userCoords: GeoCoordinates,
  locationInfo: GeocodedLocation
): Cafe[] {
  return baseCafes.map((cafe, index) => {
    const offset = CAFE_GEO_OFFSETS[index % CAFE_GEO_OFFSETS.length];
    const cafeLat = Number((userCoords.lat + offset.latOffset).toFixed(6));
    const cafeLng = Number((userCoords.lng + offset.lngOffset).toFixed(6));
    const realDistKm = calculateDistanceKm(
      userCoords.lat,
      userCoords.lng,
      cafeLat,
      cafeLng
    );

    return {
      ...cafe,
      coordinates: {
        lat: cafeLat,
        lng: cafeLng,
      },
      distance: `${realDistKm} km away`,
      area: `${locationInfo.neighborhood || locationInfo.city}`,
      address: `${cafe.address.split(',')[0]}, ${locationInfo.neighborhood}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${cafeLat},${cafeLng}`,
      isRealOsmData: false,
    };
  });
}
