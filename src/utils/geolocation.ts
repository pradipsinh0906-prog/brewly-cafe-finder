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
 * Reverse geocodes latitude & longitude into a human-readable neighborhood and city.
 * Uses client-side CORS-enabled BigDataCloud reverse geocoding API with fallback.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<GeocodedLocation> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding service unavailable');
    
    const data = await res.json();
    
    const neighborhood =
      data.locality ||
      data.subLocality ||
      data.principalSubdivisionDescription ||
      'Central District';

    const city =
      data.city ||
      data.principalSubdivision ||
      data.countryName ||
      'Current Location';

    const country = data.countryName || '';

    // Create a clean display string like "Indiranagar, Bengaluru" or "SoHo, New York"
    let displayName = `${neighborhood}, ${city}`;
    if (neighborhood === city || !neighborhood) {
      displayName = `${city}${country ? `, ${country}` : ''}`;
    }

    return {
      displayName,
      neighborhood,
      city,
      country,
      coordinates: { lat, lng },
    };
  } catch {
    // Graceful fallback if network fails
    return {
      displayName: `Near (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      neighborhood: 'Local Area',
      city: 'Your City',
      country: '',
      coordinates: { lat, lng },
    };
  }
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
    };
  });
}
