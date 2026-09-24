import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface OSMCafeElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Fallback curated imagery for cafes
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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // 1. Nominatim Geocoding Endpoint
  app.get('/api/geocode', async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) {
        return res.status(400).json({ error: 'Query parameter q is required' });
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          q
        )}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'BrewlyCafeDiscovery/1.0 (contact: info@brewly.coffee)',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to geocode location' });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error('Geocode error:', err);
      return res.status(500).json({ error: err.message || 'Internal geocoding error' });
    }
  });

  // 2. Overpass & OpenStreetMap Cafe Search Helper with Radius Expansion
  async function fetchRealOSMCafes(
    lat: number,
    lng: number,
    baseRadius: number = 2500
  ): Promise<{ rawCafes: any[]; radiusUsed: number; source: string }> {
    const radiiToTry = [baseRadius, 5000, 9000, 15000].filter((r, idx, arr) => arr.indexOf(r) === idx);

    for (const radius of radiiToTry) {
      // 1. Try Overpass API with short timeout
      const overpassQuery = `[out:json][timeout:15];
(
  node["amenity"="cafe"](around:${radius}, ${lat}, ${lng});
  way["amenity"="cafe"](around:${radius}, ${lat}, ${lng});
  node["amenity"="coffee_shop"](around:${radius}, ${lat}, ${lng});
  way["amenity"="coffee_shop"](around:${radius}, ${lat}, ${lng});
);
out center tags 40;`;

      const overpassEndpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
      ];

      for (const endpoint of overpassEndpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'BrewlyCafeDiscovery/1.0 (contact: info@brewly.coffee)',
            },
            body: `data=${encodeURIComponent(overpassQuery)}`,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            const data = await resp.json();
            const elements = data.elements || [];
            const namedElements = elements.filter(
              (el: any) => el.tags && (el.tags.name || el.tags['name:en'])
            );
            if (namedElements.length >= 3) {
              return { rawCafes: namedElements, radiusUsed: radius, source: 'Overpass API' };
            }
          }
        } catch (_err) {
          // Continue to next endpoint or Nominatim fallback
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim Bounded Amenity Search (fast, reliable CDN)
      try {
        const delta = (radius / 111320) * 1.0;
        const minLng = (lng - delta).toFixed(5);
        const maxLat = (lat + delta).toFixed(5);
        const maxLng = (lng + delta).toFixed(5);
        const minLat = (lat - delta).toFixed(5);

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=cafe&format=json&addressdetails=1&limit=30&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1`;
        const nomResp = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'BrewlyCafeDiscovery/1.0 (contact: info@brewly.coffee)',
            Accept: 'application/json',
          },
        });

        if (nomResp.ok) {
          const items = await nomResp.json();
          if (Array.isArray(items) && items.length > 0) {
            // Also optionally fetch coffee shop query to augment
            let moreItems: any[] = [];
            if (items.length < 10) {
              try {
                const coffeeUrl = `https://nominatim.openstreetmap.org/search?q=coffee+shop&format=json&addressdetails=1&limit=15&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1`;
                const coffeeResp = await fetch(coffeeUrl, {
                  headers: {
                    'User-Agent': 'BrewlyCafeDiscovery/1.0 (contact: info@brewly.coffee)',
                    Accept: 'application/json',
                  },
                });
                if (coffeeResp.ok) {
                  moreItems = await coffeeResp.json();
                }
              } catch (_e) {
                // ignore
              }
            }

            const combined = [...items, ...(Array.isArray(moreItems) ? moreItems : [])];
            // Format into OSMCafeElement structure
            const seenIds = new Set<string>();
            const mappedElements: any[] = [];

            for (const item of combined) {
              const placeId = item.place_id || item.osm_id;
              if (seenIds.has(String(placeId))) continue;
              seenIds.add(String(placeId));

              const cafeName =
                item.name ||
                item.namedetails?.name ||
                item.display_name?.split(',')[0] ||
                '';

              // Filter out street names or generic areas that don't look like cafe names
              if (!cafeName || cafeName.length < 2) continue;

              const addr = item.address || {};
              const street = addr.road || addr.street || addr.neighbourhood || addr.suburb || '';
              const city = addr.city || addr.town || addr.municipality || addr.state || '';

              mappedElements.push({
                id: item.osm_id || item.place_id,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                tags: {
                  name: cafeName,
                  'addr:street': street,
                  'addr:city': city,
                  'addr:suburb': addr.suburb || addr.neighbourhood || '',
                  'addr:housenumber': addr.house_number || '',
                  amenity: 'cafe',
                  opening_hours: '8:00 AM – 10:30 PM',
                },
              });
            }

            if (mappedElements.length >= 3) {
              return {
                rawCafes: mappedElements,
                radiusUsed: radius,
                source: 'OpenStreetMap Nominatim',
              };
            }
          }
        }
      } catch (nomErr) {
        console.warn('Nominatim bounded search error:', nomErr);
      }
    }

    return { rawCafes: [], radiusUsed: 15000, source: 'None' };
  }

  // 2. Direct Overpass API Endpoint
  app.post('/api/osm/cafes', async (req, res) => {
    try {
      const { lat, lng, radius = 3500 } = req.body;
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'lat and lng are required' });
      }

      const result = await fetchRealOSMCafes(lat, lng, radius);
      return res.json({
        elements: result.rawCafes,
        radiusUsed: result.radiusUsed,
        source: result.source,
      });
    } catch (err: any) {
      console.error('OSM cafes endpoint error:', err);
      return res.status(500).json({ error: err.message || 'Internal OSM error' });
    }
  });

  // 3. Gemini AI Enrichment Endpoint for Real OSM Cafes
  app.post('/api/ai/enrich', async (req, res) => {
    try {
      const { cafes, searchQuery = '' } = req.body;
      if (!Array.isArray(cafes) || cafes.length === 0) {
        return res.status(400).json({ error: 'cafes array is required' });
      }

      if (!ai) {
        // Fallback heuristic enrichment if GEMINI_API_KEY is not configured
        const enriched = cafes.map((c, index) => ({
          id: c.id,
          aiMatch: 82 + ((index * 7) % 16),
          noiseLevel: index % 3 === 0 ? 'Quiet' : index % 3 === 1 ? 'Moderate' : 'Lively',
          wifiSpeed: `${45 + (index * 15) % 65} Mbps`,
          outlets: index % 2 === 0 ? 'Ample Outlets' : 'Limited Outlets',
          aiReasoning: `Local favorite cafe near ${c.address || 'your location'}, known for fresh roast coffee and welcoming ambiance.`,
          tagline: 'Local favorite specialty coffee & cozy ambiance',
          vibeTags: ['Local Roast', 'Comfortable Seating', 'Community Hub'],
          popularFor: 'Freshly brewed coffee & relaxed conversations',
          priceLevel: '₹₹',
          priceEstimate: '₹350 for two',
          category: 'Specialty Cafe',
          signatureItems: [
            { name: 'House Espresso', price: '₹160', description: 'Rich crema and balanced cocoa profile' },
            { name: 'Iced Vanilla Latte', price: '₹220', description: 'Smooth milk cold brew with Madagascar vanilla' }
          ]
        }));
        return res.json({ enriched, source: 'heuristic' });
      }

      const prompt = `You are Brewly's AI Cafe Sommelier & Space Curator.
The user is looking for cafes with this preference/query: "${searchQuery || 'Good coffee, great vibes, and comfortable seating'}".

Here is a list of real cafes discovered from OpenStreetMap:
${JSON.stringify(
  cafes.slice(0, 15).map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    tags: c.tags,
    distance: c.distance,
  })),
  null,
  2
)}

For each cafe, generate accurate and contextual details tailored to the user's search query.
Return a valid JSON array of objects with the exact schema:
[
  {
    "id": "matching cafe id string",
    "aiMatch": integer between 70 and 99,
    "aiReasoning": "1-2 sentence compelling personalized insight explaining why this spot fits the user's vibe/request",
    "tagline": "catchy 4-7 word cafe tagline",
    "noiseLevel": "Quiet" or "Moderate" or "Lively",
    "wifiSpeed": "e.g. 85 Mbps",
    "outlets": "Every Table" or "Ample Outlets" or "Limited Outlets",
    "priceLevel": "₹" or "₹₹" or "₹₹₹",
    "priceEstimate": "e.g. ₹350 for two",
    "rating": number between 4.1 and 4.9 (1 decimal place),
    "reviewCount": integer between 45 and 480,
    "category": "e.g. Artisanal Roastery, Study Cafe, Garden Espresso Bar, or Cozy Bistro",
    "amenities": ["array", "of", "4-6", "amenities", "like", "High-Speed Wi-Fi", "Power Outlets", "Air Conditioning", "Outdoor Garden", "Pour Over Bar"],
    "vibeTags": ["array", "of", "3", "short", "tags", "e.g. Quiet Focus", "Specialty Roasts", "Sunny Patio"],
    "popularFor": "short sentence e.g. Single-origin cold brews and quiet laptop sessions",
    "signatureItems": [
      { "name": "Item name", "price": "e.g. ₹220", "description": "Short delicious description" },
      { "name": "Item name", "price": "e.g. ₹180", "description": "Short delicious description" }
    ]
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '[]';
      const enriched = JSON.parse(text);
      return res.json({ enriched, source: 'gemini' });
    } catch (err: any) {
      console.warn('Gemini enrichment error, falling back to heuristic:', err?.message || err);
      const { cafes } = req.body || {};
      const enriched = (Array.isArray(cafes) ? cafes : []).map((c: any, index: number) => ({
        id: c.id,
        aiMatch: 86 + ((index * 7) % 13),
        noiseLevel: index % 3 === 0 ? 'Quiet' : index % 3 === 1 ? 'Moderate' : 'Lively',
        wifiSpeed: `${65 + (index * 15) % 65} Mbps`,
        outlets: index % 2 === 0 ? 'Ample Outlets' : 'Limited Outlets',
        aiReasoning: `Local favorite cafe near ${c.address || 'your location'}, known for fresh roast coffee and welcoming ambiance.`,
        tagline: 'Local favorite specialty coffee & cozy ambiance',
        vibeTags: ['Local Roast', 'Comfortable Seating', 'Community Hub'],
        popularFor: 'Freshly brewed coffee & relaxed conversations',
        priceLevel: '₹₹',
        priceEstimate: '₹350 for two',
        category: 'Specialty Cafe',
        signatureItems: [
          { name: 'House Espresso', price: '₹160', description: 'Rich crema and balanced cocoa profile' },
          { name: 'Iced Vanilla Latte', price: '₹220', description: 'Smooth milk cold brew with Madagascar vanilla' }
        ]
      }));
      return res.json({ enriched, source: 'heuristic' });
    }
  });

  // 4. Unified Full Cafe Discovery Endpoint: Nominatim -> Overpass -> Gemini
  app.post('/api/cafes/search', async (req, res) => {
    try {
      let { lat, lng, locationQuery, searchQuery = '' } = req.body;

      // If coordinates aren't provided, use Nominatim
      if ((lat === undefined || lng === undefined) && locationQuery) {
        const geoResp = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            locationQuery
          )}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'BrewlyCafeDiscovery/1.0 (info@brewly.coffee)',
            },
          }
        );
        if (geoResp.ok) {
          const geoData = await geoResp.json();
          if (geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          }
        }
      }

      if (lat === undefined || lng === undefined) {
        // Default to Indiranagar, Bengaluru coordinates if completely unknown
        lat = 12.9784;
        lng = 77.6408;
      }

      // Query OpenStreetMap (Overpass & Nominatim) with radius expansion
      const osmResult = await fetchRealOSMCafes(lat, lng, 2500);
      const rawCafes = osmResult.rawCafes;
      const radiusUsed = osmResult.radiusUsed;
      const osmSource = osmResult.source;

      // Filter and normalize real OSM cafes
      const validCafes = rawCafes
        .filter((el: OSMCafeElement) => {
          const name = el.tags?.name || el.tags?.['name:en'];
          return Boolean(name && name.trim().length > 1);
        })
        .map((el: OSMCafeElement, index: number) => {
          const cLat = el.lat ?? el.center?.lat ?? lat;
          const cLng = el.lon ?? el.center?.lon ?? lng;
          const distKm = Number(calculateDistanceKm(lat, lng, cLat, cLng).toFixed(2));
          const name = el.tags?.name || el.tags?.['name:en'] || 'Local Cafe';
          const street = el.tags?.['addr:street'] || el.tags?.['addr:suburb'] || '';
          const address = [el.tags?.['addr:housenumber'], street, el.tags?.['addr:city']]
            .filter(Boolean)
            .join(', ') || `${distKm < 1 ? Math.round(distKm * 1000) + ' m' : distKm.toFixed(1) + ' km'} from search center`;

          return {
            id: `osm-${el.id}`,
            name,
            coordinates: { lat: cLat, lng: cLng },
            distanceKm: distKm,
            distance: `${distKm < 1 ? Math.round(distKm * 1000) + ' m' : distKm.toFixed(1) + ' km'} away`,
            address,
            tags: el.tags,
            image: CAFE_IMAGES[index % CAFE_IMAGES.length],
            directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${cLat},${cLng}`,
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 16);

      if (validCafes.length === 0) {
        return res.json({
          cafes: [],
          lat,
          lng,
          radiusUsed,
          foundRealOsm: false,
          message: `No cafes found within ${Math.round(radiusUsed / 1000)}km from OpenStreetMap.`,
        });
      }

      // Enrich with Gemini if available
      let enrichmentMap = new Map<string, any>();
      if (ai) {
        try {
          const prompt = `You are Brewly's AI cafe expert.
User request: "${searchQuery || 'Popular cozy cafe with good coffee'}".
Real cafes found near user:
${JSON.stringify(
  validCafes.map((c) => ({ id: c.id, name: c.name, address: c.address, tags: c.tags })),
  null,
  2
)}

Generate JSON array of evaluated cafes:
[
  {
    "id": "string id",
    "aiMatch": integer (75-98),
    "aiReasoning": "1-2 sentence evaluation",
    "tagline": "short catchy tagline",
    "noiseLevel": "Quiet" | "Moderate" | "Lively",
    "wifiSpeed": "e.g. 75 Mbps",
    "outlets": "Every Table" | "Ample Outlets" | "Limited Outlets",
    "priceLevel": "₹" | "₹₹" | "₹₹₹",
    "priceEstimate": "e.g. ₹350 for two",
    "rating": number (4.2 - 4.9),
    "reviewCount": number (30 - 350),
    "category": "e.g. Specialty Roaster, Study Hub, Espresso Bar",
    "amenities": ["Wi-Fi", "Outlets", "Air Conditioning", "Outdoor Seating"],
    "vibeTags": ["tag1", "tag2", "tag3"],
    "popularFor": "specialty feature",
    "signatureItems": [
      { "name": "Item 1", "price": "₹180", "description": "desc" },
      { "name": "Item 2", "price": "₹220", "description": "desc" }
    ]
  }
]`;

          const aiResp = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });

          const parsed = JSON.parse(aiResp.text || '[]');
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => enrichmentMap.set(item.id, item));
          }
        } catch (enrichErr) {
          console.warn('Gemini enrichment error:', enrichErr);
        }
      }

      const finalCafes = validCafes.map((c, idx) => {
        const enriched = enrichmentMap.get(c.id) || {};
        return {
          id: c.id,
          name: c.name,
          tagline: enriched.tagline || 'Specialty brews & warm atmosphere',
          image: c.image,
          rating: enriched.rating || Number((4.3 + (idx * 0.1) % 0.6).toFixed(1)),
          reviewCount: enriched.reviewCount || (85 + (idx * 23) % 240),
          distance: c.distance,
          priceLevel: enriched.priceLevel || '₹₹',
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
          aiMatch: enriched.aiMatch || (88 - (idx * 2)),
          aiReasoning:
            enriched.aiReasoning ||
            `Real cafe discovered via OpenStreetMap near your location. Known locally for welcoming atmosphere and quality coffee.`,
          vibeTags: enriched.vibeTags || ['Local Favorite', 'Great Espresso', 'Cozy Vibe'],
          wifiSpeed: enriched.wifiSpeed || '60 Mbps',
          noiseLevel: enriched.noiseLevel || (idx % 2 === 0 ? 'Quiet' : 'Moderate'),
          outlets: enriched.outlets || 'Ample Outlets',
          signatureItems: enriched.signatureItems || [
            { name: 'Signature Flat White', price: '₹190', description: 'Silky microfoam over double espresso' },
            { name: 'Cold Brew on Tap', price: '₹210', description: 'Steeped for 18 hours with subtle berry finish' }
          ],
          popularFor: enriched.popularFor || 'Specialty roast coffee & relaxed workspace',
          directionsUrl: c.directionsUrl,
          coordinates: c.coordinates,
          isRealOsmData: true,
        };
      });

      return res.json({
        cafes: finalCafes,
        lat,
        lng,
        radiusUsed,
        source: osmSource,
        foundRealOsm: true,
        totalFound: finalCafes.length,
      });
    } catch (err: any) {
      console.error('Search error:', err);
      return res.status(500).json({ error: err.message || 'Discovery search failed' });
    }
  });

  // Local generator fallback helper for localized cafes
  function generateLocalFallbackCafes(
    location: string,
    baseLat: number,
    baseLng: number,
    _searchQuery: string = ''
  ): any[] {
    const locLower = location.toLowerCase();

    const templates = [
      {
        nameSuffix: 'Artisanal Roastery & Brew Bar',
        tagline: 'Precision single-origin light roasts & sunlit seating',
        category: 'Artisanal Roastery',
        vibe: ['Best Coffee', 'Work', 'Outdoor'],
        noise: 'Quiet' as const,
        wifi: '160 Mbps',
        outlets: 'Every Table' as const,
        price: '₹₹' as const,
        est: '₹450 for two',
        popular: 'Pour-over micro-lots and sourdough sandwiches',
      },
      {
        nameSuffix: 'Botanical Courtyard & Coffee Loft',
        tagline: 'Lush greenery, serene open-air patio & slow sips',
        category: 'Botanical Garden Cafe',
        vibe: ['Outdoor', 'Date', 'Friends'],
        noise: 'Moderate' as const,
        wifi: '110 Mbps',
        outlets: 'Ample Outlets' as const,
        price: '₹₹' as const,
        est: '₹500 for two',
        popular: 'Weekend brunches and cold brew spritzers',
      },
      {
        nameSuffix: 'Focus Lab & Study Sanctuary',
        tagline: 'Quiet deep-work haven with high-speed fiber & charging desks',
        category: 'Study & Remote Work Hub',
        vibe: ['Study', 'Work', 'Budget'],
        noise: 'Quiet' as const,
        wifi: '220 Mbps',
        outlets: 'Every Table' as const,
        price: '₹' as const,
        est: '₹380 for two',
        popular: 'Productive laptop sessions and silent reading corners',
      },
      {
        nameSuffix: 'Minimalist Espresso & Toast Bar',
        tagline: 'Sleek architectural design, micro-batch beans & flat whites',
        category: 'Specialty Espresso Bar',
        vibe: ['Best Coffee', 'Friends', 'Date'],
        noise: 'Moderate' as const,
        wifi: '140 Mbps',
        outlets: 'Ample Outlets' as const,
        price: '₹₹₹' as const,
        est: '₹620 for two',
        popular: 'Double shot flat whites and artisanal brioche',
      },
      {
        nameSuffix: 'Twilight Lounge & Late Espresso Bar',
        tagline: 'Warm acoustic jazz, mood lighting & midnight coffee pairings',
        category: 'Late-Night Cafe',
        vibe: ['Date', 'Open Late', 'Friends'],
        noise: 'Lively' as const,
        wifi: '120 Mbps',
        outlets: 'Limited Outlets' as const,
        price: '₹₹' as const,
        est: '₹520 for two',
        popular: 'Midnight affogato desserts and cascara iced tea',
      },
    ];

    let prefixes = ['The Roost', 'Drift & Co.', 'Paper & Oak', 'Velvet Bean', 'Terra Roasters'];
    if (locLower.includes('ahmedabad')) {
      prefixes = ['Sindhu Bhavan', 'Bodakdev Garden', 'Vastrapur Lake', 'Sabarmati Riverfront', 'Ambawadi Heritage'];
    } else if (locLower.includes('bandra')) {
      prefixes = ['Bandra Heritage', 'Sea Breeze', 'Chapel Road', 'Pali Hill', 'Ranwar'];
    } else if (locLower.includes('hauz')) {
      prefixes = ['Lakeview Monolith', 'Ruins & Beans', 'Deer Park', 'Qutub View', 'Heritage Hearth'];
    } else if (locLower.includes('koramangala')) {
      prefixes = ['Greenhouse 80ft', 'Founder & Press', 'Canopy Roasters', '4th Block', 'The Silicon Bean'];
    } else if (locLower.includes('indiranagar')) {
      prefixes = ['100ft Roasters', 'Defence Colony Espresso', 'Banyan & Brew', 'Indira Loft', 'Old Trees Coffee'];
    } else if (locLower.includes('cyber')) {
      prefixes = ['Atrium Coffee Lab', 'Skyline Espresso', 'Silicon Square', 'Metropolis', 'The Glasshouse'];
    } else if (locLower.includes('koregaon')) {
      prefixes = ['Lane 7 Roasters', 'Banyan Tree', 'North Main Coffee', 'Zenith', 'Osho Garden Brews'];
    }

    return templates.map((tmpl, idx) => {
      const latOffset = idx * 0.0035 - 0.007;
      const lngOffset = (idx % 2 === 0 ? 1 : -1) * (0.002 + idx * 0.0015);
      const cLat = Number((baseLat + latOffset).toFixed(5));
      const cLng = Number((baseLng + lngOffset).toFixed(5));
      const name = `${prefixes[idx % prefixes.length]} ${tmpl.nameSuffix}`;
      const img = CAFE_IMAGES[idx % CAFE_IMAGES.length];

      return {
        id: `ai-sample-${location.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx + 1}`,
        name,
        tagline: tmpl.tagline,
        image: img,
        rating: Number((4.6 + idx * 0.07).toFixed(1)),
        reviewCount: 140 + idx * 85,
        distance: `${(0.4 + idx * 0.3).toFixed(1)} km away`,
        priceLevel: tmpl.price,
        priceEstimate: tmpl.est,
        isOpen: true,
        openingHours: '8:00 AM – 11:00 PM',
        address: `Near ${prefixes[idx % prefixes.length]}, ${location}`,
        area: location,
        category: tmpl.category,
        amenities: ['High-Speed Wi-Fi', 'Power Outlets', 'Specialty Coffee', 'Air Conditioning'],
        aiMatch: 98 - idx * 2,
        aiReasoning: `Generated recommendation highlighting ${tmpl.category.toLowerCase()} vibes in ${location.split(',')[0]}.`,
        vibeTags: tmpl.vibe,
        wifiSpeed: tmpl.wifi,
        noiseLevel: tmpl.noise,
        outlets: tmpl.outlets,
        signatureItems: [
          { name: 'Estate Pour-Over', price: '₹220', description: 'Slow brewed with notes of milk chocolate and dried stone fruit' },
          { name: 'Iced Cardamom Cold Brew', price: '₹240', description: 'Steeped for 16 hours with gentle aromatic spice' },
        ],
        popularFor: tmpl.popular,
        directionsUrl: `https://maps.google.com/?q=${cLat},${cLng}`,
        coordinates: { lat: cLat, lng: cLng },
        isRealOsmData: false,
      };
    });
  }

  // 5. Fresh AI Cafe Recommendations Generator tailored to selected Area using Gemini
  app.post('/api/ai/generate-cafes', async (req, res) => {
    try {
      const { location = 'Ahmedabad', coordinates, searchQuery = '' } = req.body;
      const baseLat = typeof coordinates?.lat === 'number' ? coordinates.lat : 23.0338;
      const baseLng = typeof coordinates?.lng === 'number' ? coordinates.lng : 72.5186;

      if (!ai) {
        console.log('Gemini API client not initialized, using localized fallback generator');
        return res.json({
          cafes: generateLocalFallbackCafes(location, baseLat, baseLng, searchQuery),
          location,
          source: 'curated_generator',
        });
      }

      const prompt = `You are Brewly's AI Cafe Sommelier & Space Curator.
Generate a fresh, realistic, highly distinctive set of 5 cafe recommendations tailored specifically to the neighborhood and vibe of "${location}".
User search query / preference: "${searchQuery || 'Artisanal coffee, great ambiance, and comfortable seating'}".
Base Coordinates of area: latitude ${baseLat}, longitude ${baseLng}.

Requirements:
1. Distinctive, realistic cafe names tailored to this specific city/area culture (not generic names, and not identical to any standard chain).
   - If Bandra West, Mumbai: reflect breezy seaside, Portuguese bungalows, art deco lanes, coastal sourdough bakeries, aesthetic boutique roasteries.
   - If Hauz Khas Village, Delhi: reflect medieval monument views, lush deer park, bohemian artist rooftops, heritage espresso labs.
   - If Koramangala, Bengaluru: reflect leafy green canopy, high-energy founder meetups, precision pour-over and nitro cold-brew labs.
   - If Indiranagar, Bengaluru: reflect 100ft road heritage lanes, quiet study lofts, chic botanical courtyards.
   - If Cyber City, Gurugram: reflect sleek glasshouse espresso bars, executive coffee lounges, ultra-fast fiber for business/tech.
   - If Koregaon Park, Pune: reflect banyan-shaded garden patios, zen alfresco verandahs, artisanal roasters.
   - For any other city/area: ground the cafes in the true cultural character and geography of that exact location.
2. Authentic realistic street names, lanes, or landmark corners in "${location}".
3. Coordinates: apply realistic minor offsets to the base lat/lng (within +/-0.003 to +/-0.012 degrees) so they plot naturally around ${location}.
4. Tailored signature items, genuine coffee pricing (in INR ₹), opening hours, Wi-Fi speeds, noise levels, and compelling AI reasoning for why each spot was recommended.

Return a valid JSON array of 5 cafe objects strictly conforming to this schema:
[
  {
    "id": "slug-string",
    "name": "Cafe Name",
    "tagline": "Catchy 4-7 word authentic tagline",
    "rating": 4.7,
    "reviewCount": 320,
    "distance": "0.6 km away",
    "priceLevel": "₹₹",
    "priceEstimate": "₹450 for two",
    "isOpen": true,
    "openingHours": "8:00 AM – 11:00 PM",
    "address": "Realistic street or landmark in ${location}",
    "area": "${location}",
    "category": "Artisanal Roastery",
    "amenities": ["High-Speed Wi-Fi", "Power Outlets Every Desk", "Outdoor Patio", "Cold Brew Bar"],
    "aiMatch": 96,
    "aiReasoning": "1-2 sentence compelling personalized insight explaining why this spot is a standout in ${location}",
    "vibeTags": ["Best Coffee", "Work", "Outdoor"],
    "wifiSpeed": "150 Mbps",
    "noiseLevel": "Quiet",
    "outlets": "Every Table",
    "popularFor": "Short phrase describing what they are known for",
    "latOffset": 0.004,
    "lngOffset": -0.003,
    "signatureItems": [
      { "name": "Item 1", "price": "₹220", "description": "Short appetizing description" },
      { "name": "Item 2", "price": "₹260", "description": "Short appetizing description" }
    ]
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.85,
        },
      });

      const text = response.text || '[]';
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Gemini returned an empty array of cafes');
      }

      const formattedCafes = parsed.map((c: any, index: number) => {
        const cLat = Number(
          (baseLat + (typeof c.latOffset === 'number' ? c.latOffset : index * 0.003 - 0.006)).toFixed(5)
        );
        const cLng = Number(
          (baseLng + (typeof c.lngOffset === 'number' ? c.lngOffset : index * 0.003 - 0.006)).toFixed(5)
        );
        const img = CAFE_IMAGES[index % CAFE_IMAGES.length];
        const uniqueId = `ai-${location.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index + 1}-${Date.now().toString(36).slice(-4)}`;

        return {
          id: c.id ? `ai-${c.id}-${index}` : uniqueId,
          name: c.name || `Specialty Cafe ${index + 1}`,
          tagline: c.tagline || 'Curated specialty coffee & cozy ambiance',
          image: img,
          rating: typeof c.rating === 'number' ? c.rating : 4.8,
          reviewCount: typeof c.reviewCount === 'number' ? c.reviewCount : 240,
          distance: c.distance || `${((index + 1) * 0.3).toFixed(1)} km away`,
          priceLevel: c.priceLevel || '₹₹',
          priceEstimate: c.priceEstimate || '₹450 for two',
          isOpen: true,
          openingHours: c.openingHours || '8:00 AM – 11:00 PM',
          address: c.address || `${location}`,
          area: location,
          category: c.category || 'Specialty Coffee House',
          amenities:
            Array.isArray(c.amenities) && c.amenities.length > 0
              ? c.amenities
              : ['High-Speed Wi-Fi', 'Power Outlets', 'Air Conditioning', 'Comfortable Seating'],
          aiMatch: typeof c.aiMatch === 'number' ? c.aiMatch : 95,
          aiReasoning:
            c.aiReasoning || `Specially generated recommendation tailored to ${location}.`,
          vibeTags:
            Array.isArray(c.vibeTags) && c.vibeTags.length > 0
              ? c.vibeTags
              : ['Best Coffee', 'Work', 'Local Favorite'],
          wifiSpeed: c.wifiSpeed || '120 Mbps',
          noiseLevel: c.noiseLevel || (index % 2 === 0 ? 'Quiet' : 'Moderate'),
          outlets: c.outlets || 'Ample Outlets',
          signatureItems:
            Array.isArray(c.signatureItems) && c.signatureItems.length > 0
              ? c.signatureItems
              : [
                  {
                    name: 'Single Origin Pour Over',
                    price: '₹220',
                    description: 'Hand-brewed with distinct fruity aromatics',
                  },
                  {
                    name: 'Iced Vanilla Oat Latte',
                    price: '₹240',
                    description: 'Smooth cold espresso over creamy oat milk',
                  },
                ],
          popularFor: c.popularFor || 'Specialty roast coffee & relaxed workspace',
          directionsUrl: `https://maps.google.com/?q=${cLat},${cLng}`,
          coordinates: { lat: cLat, lng: cLng },
          isRealOsmData: false,
        };
      });

      return res.json({
        cafes: formattedCafes,
        location,
        source: 'gemini',
      });
    } catch (err: any) {
      console.error('Gemini cafe generation error:', err);
      // Graceful fallback to local generator
      const { location = 'Koramangala, Bengaluru', coordinates, searchQuery = '' } = req.body || {};
      const baseLat = typeof coordinates?.lat === 'number' ? coordinates.lat : 12.9345;
      const baseLng = typeof coordinates?.lng === 'number' ? coordinates.lng : 77.6265;
      return res.json({
        cafes: generateLocalFallbackCafes(location, baseLat, baseLng, searchQuery),
        location,
        source: 'curated_generator',
        errorNotice: err.message,
      });
    }
  });

  // Serve static assets in production or Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`☕ Brewly server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
