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

  // 2. Overpass API Real Cafe Search Endpoint
  app.post('/api/osm/cafes', async (req, res) => {
    try {
      const { lat, lng, radius = 3500 } = req.body;
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'lat and lng are required' });
      }

      const overpassQuery = `[out:json][timeout:25];
(
  node["amenity"="cafe"](around:${radius}, ${lat}, ${lng});
  way["amenity"="cafe"](around:${radius}, ${lat}, ${lng});
  node["amenity"="coffee_shop"](around:${radius}, ${lat}, ${lng});
  way["amenity"="coffee_shop"](around:${radius}, ${lat}, ${lng});
);
out center tags 35;`;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BrewlyCafeDiscovery/1.0',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Overpass API request failed' });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error('Overpass error:', err);
      return res.status(500).json({ error: err.message || 'Internal Overpass error' });
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
      console.error('Gemini enrichment error:', err);
      return res.status(500).json({ error: err.message || 'AI enrichment failed' });
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

      // Query Overpass for real cafes
      const overpassQuery = `[out:json][timeout:25];
(
  node["amenity"="cafe"](around:4000, ${lat}, ${lng});
  way["amenity"="cafe"](around:4000, ${lat}, ${lng});
  node["amenity"="coffee_shop"](around:4000, ${lat}, ${lng});
  way["amenity"="coffee_shop"](around:4000, ${lat}, ${lng});
);
out center tags 30;`;

      let rawCafes: any[] = [];
      try {
        const overpassResp = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'BrewlyCafeDiscovery/1.0',
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
        });

        if (overpassResp.ok) {
          const data = await overpassResp.json();
          rawCafes = data.elements || [];
        }
      } catch (opErr) {
        console.warn('Overpass fetch failed, continuing with fallback:', opErr);
      }

      // Filter and normalize real OSM cafes
      const validCafes = rawCafes
        .filter((el: OSMCafeElement) => {
          const name = el.tags?.name || el.tags?.['name:en'];
          return Boolean(name && name.trim().length > 1);
        })
        .map((el: OSMCafeElement, index: number) => {
          const cLat = el.lat ?? el.center?.lat ?? lat;
          const cLng = el.lon ?? el.center?.lon ?? lng;
          const distKm = calculateDistanceKm(lat, lng, cLat, cLng);
          const name = el.tags?.name || el.tags?.['name:en'] || 'Local Cafe';
          const street = el.tags?.['addr:street'] || el.tags?.['addr:suburb'] || '';
          const address = [el.tags?.['addr:housenumber'], street, el.tags?.['addr:city']]
            .filter(Boolean)
            .join(', ') || `${distKm.toFixed(1)} km from center`;

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
        .slice(0, 15);

      if (validCafes.length === 0) {
        return res.json({
          cafes: [],
          lat,
          lng,
          foundRealOsm: false,
          message: 'No cafes found in immediate area from OpenStreetMap.',
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
        foundRealOsm: true,
        totalFound: finalCafes.length,
      });
    } catch (err: any) {
      console.error('Search error:', err);
      return res.status(500).json({ error: err.message || 'Discovery search failed' });
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
