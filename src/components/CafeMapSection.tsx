import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Coffee,
  Navigation,
  Star,
  Sparkles,
  Wifi,
  Clock,
  Eye,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  X,
  Volume2,
} from 'lucide-react';
import { Cafe } from '../types/cafe';
import { POPULAR_LOCATIONS } from '../data/cafes';

interface CafeMapSectionProps {
  cafes: Cafe[];
  selectedCafe: Cafe | null;
  onSelectCafe: (cafe: Cafe) => void;
  onViewDetails: (cafe: Cafe) => void;
  currentLocation: string;
  onSelectLocation?: (loc: string) => void;
  userLocationCoords?: { lat: number; lng: number } | null;
  isStandalonePage?: boolean;
  onBackToDiscover?: () => void;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const CafeMapSection: React.FC<CafeMapSectionProps> = ({
  cafes,
  selectedCafe,
  onSelectCafe,
  onViewDetails,
  currentLocation,
  onSelectLocation,
  userLocationCoords = null,
  isStandalonePage = false,
  onBackToDiscover,
}) => {
  const [activeCafeId, setActiveCafeId] = useState<string>(
    selectedCafe ? selectedCafe.id : cafes[0]?.id || ''
  );

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [clusterModalCafeList, setClusterModalCafeList] = useState<{
    count: number;
    cafes: Cafe[];
  } | null>(null);
  const [isMobileSheetDismissed, setIsMobileSheetDismissed] = useState<boolean>(false);
  const [isMobileListExpanded, setIsMobileListExpanded] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Detect mobile resize
  useEffect(() => {
    const handleCheckMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, []);

  // Sync active cafe when parent changes it
  useEffect(() => {
    if (selectedCafe) {
      setActiveCafeId(selectedCafe.id);
      setIsMobileSheetDismissed(false);
    }
  }, [selectedCafe]);

  // Keep active cafe in sync when cafes change
  useEffect(() => {
    if (cafes.length > 0 && !cafes.some((c) => c.id === activeCafeId)) {
      setActiveCafeId(cafes[0].id);
    }
  }, [cafes, activeCafeId]);

  const activeCafe =
    cafes.find((c) => c.id === activeCafeId) || cafes[0] || selectedCafe;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = userLocationCoords?.lat ?? activeCafe?.coordinates?.lat ?? 23.0338;
      const initialLng = userLocationCoords?.lng ?? activeCafe?.coordinates?.lng ?? 72.5186;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Warm/Modern OpenStreetMap Tile Layer
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Custom Attribution Control (cleaner style)
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '<span class="text-[10px] text-[#D8C5B5]/60">© OpenStreetMap · Overpass</span>',
        })
        .addTo(map);

      // Listen to zoom changes to dynamically trigger/break clustering
      map.on('zoomend', () => {
        setMapZoom(map.getZoom());
      });

      mapInstanceRef.current = map;
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size on standalone view or resize
  useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [isStandalonePage]);

  // Update Markers when cafes, activeCafeId, or map changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous cafe markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clustering calculation:
    // When zoom is low/standard or on mobile screens, cafes within ~0.0075 degrees (~800m) cluster together
    const clusterRadiusDeg = isMobile ? (mapZoom >= 16 ? 0.002 : 0.0075) : (mapZoom >= 17 ? 0.001 : 0.0045);

    type ClusterGroup = {
      cafes: Cafe[];
      centerLat: number;
      centerLng: number;
      isCluster: boolean;
    };

    const clusters: ClusterGroup[] = [];
    const visited = new Set<string>();

    cafes.forEach((cafe) => {
      if (visited.has(cafe.id)) return;

      // Find nearby cafes that haven't been clustered
      const group: Cafe[] = [cafe];
      visited.add(cafe.id);

      cafes.forEach((other) => {
        if (!visited.has(other.id)) {
          const dLat = Math.abs(other.coordinates.lat - cafe.coordinates.lat);
          const dLng = Math.abs(other.coordinates.lng - cafe.coordinates.lng);
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);

          if (dist < clusterRadiusDeg) {
            group.push(other);
            visited.add(other.id);
          }
        }
      });

      const avgLat = group.reduce((acc, c) => acc + c.coordinates.lat, 0) / group.length;
      const avgLng = group.reduce((acc, c) => acc + c.coordinates.lng, 0) / group.length;

      clusters.push({
        cafes: group,
        centerLat: avgLat,
        centerLng: avgLng,
        isCluster: group.length > 1,
      });
    });

    // Render Markers or Clusters
    clusters.forEach((cluster) => {
      if (cluster.isCluster) {
        // Multi-cafe cluster pin
        const hasSelected = cluster.cafes.some((c) => c.id === activeCafeId);
        const topCafe = [...cluster.cafes].sort((a, b) => b.aiMatch - a.aiMatch)[0];

        const clusterHtml = `
          <div class="brewly-pin-anchor" style="
            position: absolute;
            left: 0;
            top: 0;
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: auto;
            cursor: pointer;
          ">
            <div class="brewly-cluster-pin ${hasSelected ? 'is-selected' : ''}" style="
              background: ${hasSelected ? 'linear-gradient(135deg, #C88A5A 0%, #A36437 100%)' : 'linear-gradient(135deg, #2A211C 0%, #15110F 100%)'};
              border: ${hasSelected ? '2px solid #F6EBDD' : '2px solid #C88A5A'};
              border-radius: 9999px;
              padding: ${isMobile ? '5px 10px' : '6px 13px'};
              display: inline-flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.8), 0 0 16px rgba(200, 138, 90, 0.4);
              width: max-content;
            ">
              <span style="font-size: 13px; line-height: 1;">☕</span>
              <span style="
                color: #F6EBDD;
                font-weight: 800;
                font-size: 12px;
                font-family: 'Plus Jakarta Sans', sans-serif;
                white-space: nowrap;
                letter-spacing: -0.01em;
              ">
                ${cluster.cafes.length} cafes here
              </span>
              <span style="
                background: ${hasSelected ? '#15110F' : 'rgba(200, 138, 90, 0.3)'};
                color: #F6EBDD;
                font-size: 9.5px;
                font-weight: 800;
                padding: 1.5px 6px;
                border-radius: 9999px;
                border: 1px solid rgba(246, 235, 221, 0.25);
              ">
                Top ${topCafe.aiMatch}%
              </span>
            </div>
            <div style="
              width: 0; 
              height: 0; 
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid ${hasSelected ? '#A36437' : '#C88A5A'};
              margin-top: -1px;
            "></div>
          </div>
        `;

        const clusterIcon = L.divIcon({
          className: 'brewly-pin-container',
          html: clusterHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([cluster.centerLat, cluster.centerLng], {
          icon: clusterIcon,
          zIndexOffset: hasSelected ? 2200 : 1500,
        });

        marker.bindTooltip(
          `
          <div style="padding: 4px 6px; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 170px;">
            <div style="font-weight: 800; font-size: 12.5px; color: #F6EBDD; margin-bottom: 2px;">
              📍 ${cluster.cafes.length} Cafes Clustered Here
            </div>
            <div style="font-size: 11px; color: #D8C5B5;">
              ${cluster.cafes.map((c) => escapeHtml(c.name)).slice(0, 3).join(', ')}${cluster.cafes.length > 3 ? '…' : ''}
            </div>
            <div style="font-size: 10px; color: #C88A5A; margin-top: 3px; font-weight: 700;">
              👉 Tap to expand and explore all ${cluster.cafes.length}
            </div>
          </div>
          `,
          {
            direction: 'top',
            offset: [0, -38],
            className: 'brewly-marker-tooltip',
            opacity: 0.98,
          }
        );

        marker.on('click', () => {
          // On mobile or desktop tap:
          // 1. Zoom in map smoothly to un-cluster
          const currentZ = map.getZoom();
          if (currentZ < 16) {
            map.flyTo([cluster.centerLat, cluster.centerLng], currentZ + 2, { duration: 0.7 });
          }
          // 2. Open cluster sheet/modal showing the list of cafes so user can immediately pick
          setClusterModalCafeList({
            count: cluster.cafes.length,
            cafes: cluster.cafes,
          });
          // Also select top cafe
          setActiveCafeId(topCafe.id);
          onSelectCafe(topCafe);
          setIsMobileSheetDismissed(false);
        });

        marker.addTo(map);
        markersRef.current.push(marker);
        return;
      }

      // Single Cafe Pin
      const cafe = cluster.cafes[0];
      const isSelected = cafe.id === activeCafeId;

      const escapedName = escapeHtml(cafe.name);
      const escapedCategory = escapeHtml(cafe.category);
      const escapedAddress = escapeHtml(cafe.address);

      // Clean responsive name formatting: never truncate mid-word or cut into badges
      const maxChars = isMobile ? 16 : 24;
      const formattedDisplayName =
        cafe.name.length > maxChars
          ? escapeHtml(cafe.name.slice(0, maxChars).trim()) + '…'
          : escapedName;

      const iconHtml = `
        <div class="brewly-pin-anchor" style="
          position: absolute;
          left: 0;
          top: 0;
          transform: translate(-50%, -100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
          cursor: pointer;
        ">
          <div class="brewly-pin-badge ${isSelected ? 'is-selected' : ''}" style="
            background: ${isSelected ? 'linear-gradient(135deg, #C88A5A 0%, #A36437 100%)' : '#1A1411'};
            border: ${isSelected ? '2px solid #F6EBDD' : '1.5px solid rgba(246, 235, 221, 0.22)'};
            border-radius: 9999px;
            padding: ${isSelected ? '5px 11px' : '4px 9px'};
            display: inline-flex;
            align-items: center;
            gap: 5px;
            box-shadow: ${isSelected ? '0 8px 24px rgba(200, 138, 90, 0.5), 0 3px 10px rgba(0,0,0,0.85)' : '0 4px 14px rgba(0,0,0,0.65)'};
            width: max-content;
            max-width: ${isSelected ? '280px' : '220px'};
            white-space: nowrap;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            <span style="font-size: ${isSelected ? '12px' : '11px'}; line-height: 1;">☕</span>
            <span style="
              color: #F6EBDD;
              font-weight: 700;
              font-size: ${isSelected ? '11.5px' : '11px'};
              font-family: 'Plus Jakarta Sans', sans-serif;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              letter-spacing: -0.01em;
            ">
              ${formattedDisplayName}
            </span>
            <span style="
              background: ${isSelected ? '#15110F' : 'rgba(169, 139, 255, 0.22)'};
              color: ${isSelected ? '#F6EBDD' : '#D1C4E9'};
              font-size: 9px;
              font-weight: 800;
              padding: 1px 5px;
              border-radius: 9999px;
              border: ${isSelected ? '1px solid rgba(246,235,221,0.25)' : '1px solid rgba(169, 139, 255, 0.35)'};
              flex-shrink: 0;
            ">
              ${cafe.aiMatch}%
            </span>
          </div>
          <div style="
            width: 0; 
            height: 0; 
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid ${isSelected ? '#A36437' : '#1A1411'};
            margin-top: -1px;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'brewly-pin-container',
        html: iconHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const baseZIndex = isSelected ? 2000 : (100 + cafe.aiMatch);
      const marker = L.marker([cafe.coordinates.lat, cafe.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: baseZIndex,
      });

      // Rich interactive tooltip on hover
      marker.bindTooltip(
        `
        <div style="padding: 3px 5px; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 170px; max-width: 280px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <span style="font-weight: 800; font-size: 13px; color: #F6EBDD; letter-spacing: -0.01em; line-height: 1.25;">${escapedName}</span>
            <span style="font-size: 10px; font-weight: 800; color: #C88A5A; background: rgba(200,138,90,0.18); padding: 1.5px 6px; border-radius: 9999px; white-space: nowrap; flex-shrink: 0;">${cafe.aiMatch}% Match</span>
          </div>
          <div style="font-size: 11px; color: #D8C5B5; display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
            <span style="color: #FBBF24; font-weight: 700;">★ ${cafe.rating}</span>
            <span style="opacity: 0.65;">(${cafe.reviewCount})</span>
            <span>•</span>
            <span style="color: #A98BFF;">${escapedCategory}</span>
          </div>
          <div style="font-size: 10.5px; color: #A8907E; line-height: 1.3;">
            📍 ${escapedAddress}
          </div>
        </div>
        `,
        {
          direction: 'top',
          offset: [0, -34],
          className: 'brewly-marker-tooltip',
          opacity: 0.98,
        }
      );

      // On hover, immediately elevate above all other markers
      marker.on('mouseover', () => {
        marker.setZIndexOffset(3500);
      });
      marker.on('mouseout', () => {
        marker.setZIndexOffset(isSelected ? 2000 : baseZIndex);
      });

      marker.on('click', () => {
        setActiveCafeId(cafe.id);
        onSelectCafe(cafe);
        setIsMobileSheetDismissed(false);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Update or create user location marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocationCoords) {
      const userIconHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <span style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(111, 207, 151, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="position: relative; width: 15px; height: 15px; border-radius: 50%; background: #6FCF97; border: 3px solid #15110F; box-shadow: 0 0 10px rgba(111, 207, 151, 0.8);"></span>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'brewly-user-marker',
        html: userIconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const userMarker = L.marker([userLocationCoords.lat, userLocationCoords.lng], {
        icon: userIcon,
        zIndexOffset: 2000,
      });
      userMarker.addTo(map);
      userMarkerRef.current = userMarker;
    }
  }, [cafes, activeCafeId, userLocationCoords, onSelectCafe, isMobile, mapZoom]);

  // Pan map when active cafe or coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeCafe) return;

    map.panTo([activeCafe.coordinates.lat, activeCafe.coordinates.lng], {
      animate: true,
      duration: 0.6,
    });
  }, [activeCafe]);

  // Fit map when cafes array updates to show all pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || cafes.length === 0) return;

    try {
      const bounds = L.latLngBounds(cafes.map((c) => [c.coordinates.lat, c.coordinates.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch {
      // fallback safe ignore
    }
  }, [cafes]);

  // Recenter map on active cafe or area center
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (activeCafe && map) {
      map.flyTo([activeCafe.coordinates.lat, activeCafe.coordinates.lng], 15, { duration: 0.8 });
    } else if (userLocationCoords && map) {
      map.flyTo([userLocationCoords.lat, userLocationCoords.lng], 14, { duration: 0.8 });
    }
  };

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <section
      id="map"
      className={`bg-[#15110F] relative transition-all ${
        isStandalonePage ? 'pt-24 sm:pt-28 pb-20' : 'py-16 sm:py-24'
      }`}
    >
      <div id="map-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Standalone View Header with Back button */}
        {isStandalonePage && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={onBackToDiscover}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-xs sm:text-sm font-semibold text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Back to Discover Grid</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#C88A5A] bg-[#6F4E37]/20 border border-[#C88A5A]/30 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#C88A5A]" />
              <span>Full Interactive Map View</span>
            </div>
          </div>
        )}

        {/* Neighborhood Pulse Panel */}
        <div className="mb-10 p-6 sm:p-8 rounded-[28px] bg-gradient-to-r from-[#211A16] via-[#2A211C] to-[#1F1713] border border-[#F6EBDD]/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C88A5A]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6FCF97] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6FCF97]"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6FCF97]">
                  Neighborhood Spotlight
                </span>
                <span className="text-xs text-[#D8C5B5]/60">•</span>
                <span className="text-xs text-[#C88A5A] font-semibold">
                  {currentLocation}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F6EBDD] font-display">
                Interactive Cafe Map & Real-Time Spotter
              </h2>
              <p className="text-xs sm:text-sm text-[#D8C5B5]/80 mt-1 max-w-xl">
                Explore popular curated cafes in {currentLocation} with AI match scores, Wi-Fi speeds, and live distance calculations.
              </p>
            </div>

            {onSelectLocation && (
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-[#D8C5B5]/70 hidden sm:inline">Switch Area:</span>
                <select
                  value={currentLocation}
                  onChange={(e) => onSelectLocation(e.target.value)}
                  className="px-4 py-2.5 rounded-full bg-[#15110F] border border-[#F6EBDD]/20 text-xs sm:text-sm font-bold text-[#F6EBDD] hover:border-[#C88A5A] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C88A5A]"
                >
                  {POPULAR_LOCATIONS.map((loc) => (
                    <option key={loc.label} value={loc.label} className="bg-[#211A16] text-[#F6EBDD]">
                      {loc.area} ({loc.city})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="mt-6 pt-6 border-t border-[#F6EBDD]/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-2xl bg-[#15110F]/60 border border-[#F6EBDD]/5">
              <div className="text-xs text-[#D8C5B5]/70">Spots Mapped</div>
              <div className="text-lg font-bold text-[#F6EBDD] font-display mt-0.5">
                {cafes.length} Sample Spots
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#15110F]/60 border border-[#F6EBDD]/5">
              <div className="text-xs text-[#D8C5B5]/70">Data Source</div>
              <div className="text-lg font-bold text-[#C88A5A] font-display mt-0.5">
                Sample Data
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#15110F]/60 border border-[#F6EBDD]/5">
              <div className="text-xs text-[#D8C5B5]/70">AI Sommelier</div>
              <div className="text-lg font-bold text-[#A98BFF] font-display mt-0.5">
                Gemini Active
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#15110F]/60 border border-[#F6EBDD]/5">
              <div className="text-xs text-[#D8C5B5]/70">Avg Wi-Fi Speed</div>
              <div className="text-lg font-bold text-[#F6EBDD] font-display mt-0.5">
                78 Mbps
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Info & Status Strip (Directly above the map, never overlapping canvas) */}
        <div className="lg:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 mb-4 rounded-2xl bg-[#211A16] border border-[#F6EBDD]/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#15110F] text-[#C88A5A] text-xs font-bold border border-[#C88A5A]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C88A5A]" />
              Sample Data Mode
            </span>
            <span className="text-xs text-[#D8C5B5]">
              📍 <strong className="text-[#F6EBDD] font-bold">{cafes.length}</strong> spots in {currentLocation}
            </span>
          </div>
          <span className="text-[11px] text-[#A98BFF] font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Tap any pin or cluster to view details
          </span>
        </div>

        {/* Map Layout: Left Side List (Desktop), Right Side Interactive Map (Stacked on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Interactive OpenStreetMap (Desktop: Right 7 columns, Mobile: Top in flow, NEVER sticky on mobile) */}
          <div className="lg:col-span-7 order-1 lg:order-2 lg:sticky lg:top-24">
            <div className="h-[360px] sm:h-[480px] lg:h-[640px] rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#F6EBDD]/15 shadow-2xl relative bg-[#1F1814]">
              
              {/* Leaflet Map Div */}
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Map Floating Tools (Top Right) */}
              <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-[500] flex flex-col gap-2">
                <button
                  onClick={handleRecenter}
                  title="Recenter Map"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#211A16]/95 hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-[#F6EBDD] flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#C88A5A]" />
                </button>
                <button
                  onClick={handleZoomIn}
                  title="Zoom in"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#211A16]/95 hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-[#F6EBDD] flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer font-bold text-base"
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  title="Zoom out"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#211A16]/95 hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-[#F6EBDD] flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer font-bold text-base"
                >
                  −
                </button>
              </div>

              {/* Map Floating Badge - Desktop ONLY to avoid blocking mobile map view */}
              <div className="hidden lg:flex absolute top-4 left-4 z-[500] pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15110F]/90 backdrop-blur-md border border-[#F6EBDD]/15 text-xs text-[#D8C5B5] shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-[#C88A5A]" />
                  <span className="font-semibold text-[#F6EBDD]">Sample Data Mode</span>
                  <span className="text-[#C88A5A] font-medium">· Demo Preview</span>
                </div>
              </div>

              {/* Desktop Floating Preview Card (Overlaid only on desktop) */}
              {activeCafe && (
                <div className="hidden lg:block absolute bottom-4 left-4 right-4 z-[500] pointer-events-auto">
                  <div className="p-4 sm:p-5 rounded-[24px] bg-[#15110F]/95 backdrop-blur-md border border-[#F6EBDD]/20 shadow-2xl relative">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <img
                          src={activeCafe.image}
                          alt={activeCafe.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-[#F6EBDD]/15"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A98BFF]/20 text-[#A98BFF] border border-[#A98BFF]/30">
                              {activeCafe.aiMatch}% Match
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6F4E37]/30 text-[#C88A5A] border border-[#C88A5A]/30">
                              Sample Data
                            </span>
                            <span className="text-xs text-[#6FCF97] font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#6FCF97]" />
                              Open
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-[#F6EBDD] font-display truncate">
                            {activeCafe.name}
                          </h3>

                          <p className="text-xs text-[#D8C5B5]/75 line-clamp-1 mt-0.5">
                            {activeCafe.aiReasoning || activeCafe.address}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-[#D8C5B5] mt-1.5">
                            <span className="flex items-center gap-1 text-[#C88A5A]">
                              <Star className="w-3.5 h-3.5 fill-[#C88A5A]" />
                              <span className="font-semibold">{activeCafe.rating}</span>
                              <span className="text-[#D8C5B5]/60">({activeCafe.reviewCount})</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#C88A5A]" />
                              <span>{activeCafe.distance}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#6FCF97]">
                              <Wifi className="w-3 h-3" />
                              <span>{activeCafe.wifiSpeed}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onViewDetails(activeCafe)}
                          className="px-4 py-2 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-xs font-semibold text-[#F6EBDD] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const map = mapInstanceRef.current;
                            if (map && activeCafe) {
                              map.flyTo([activeCafe.coordinates.lat, activeCafe.coordinates.lng], 16, { duration: 0.8 });
                            }
                          }}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C88A5A] hover:brightness-110 text-xs font-bold text-[#F6EBDD] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                          title="Focus pin on map"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Focus Pin</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: Selected Cafe Spotlight Card (Placed cleanly BELOW map in normal flow, NOT covering map) */}
            {activeCafe && !isMobileSheetDismissed && (
              <div className="lg:hidden mt-3 p-3.5 rounded-2xl bg-[#1F1713] border border-[#C88A5A]/35 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F6EBDD]/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C88A5A]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C88A5A]">
                      Selected Cafe on Map
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileSheetDismissed(true)}
                    aria-label="Dismiss spotlight"
                    className="w-6 h-6 rounded-full bg-[#2A211C] hover:bg-[#3D2E26] text-[#D8C5B5] hover:text-[#F6EBDD] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={activeCafe.image}
                    alt={activeCafe.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#F6EBDD]/15"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#A98BFF]/20 text-[#A98BFF] border border-[#A98BFF]/30 shrink-0">
                        {activeCafe.aiMatch}% Match
                      </span>
                      <span className="text-[11px] text-[#6FCF97] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6FCF97]" />
                        Open
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[#F6EBDD] font-display truncate">
                      {activeCafe.name}
                    </h4>
                    <p className="text-[11px] text-[#D8C5B5]/75 truncate mt-0.5">
                      {activeCafe.address}
                    </p>
                    <div className="flex items-center gap-2.5 text-[11px] text-[#D8C5B5] mt-1">
                      <span className="flex items-center gap-1 text-[#C88A5A]">
                        <Star className="w-3 h-3 fill-[#C88A5A]" />
                        <span className="font-semibold">{activeCafe.rating}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#6FCF97]">
                        <Wifi className="w-3 h-3" />
                        <span>{activeCafe.wifiSpeed}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#F6EBDD]/10">
                  <button
                    onClick={() => onViewDetails(activeCafe)}
                    className="flex-1 py-2 px-3 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-xs font-semibold text-[#F6EBDD] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const map = mapInstanceRef.current;
                      if (map && activeCafe) {
                        map.flyTo([activeCafe.coordinates.lat, activeCafe.coordinates.lng], 16, { duration: 0.8 });
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C88A5A] text-xs font-bold text-[#F6EBDD] flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Focus Pin</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile: Quick Horizontal Cafe Picker */}
            <div className="lg:hidden mt-3 mb-1">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D8C5B5]/70">
                  Quick Focus ({cafes.length})
                </span>
                <span className="text-[11px] text-[#C88A5A]">Swipe spots</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {cafes.map((cafe) => {
                  const isSelected = cafe.id === activeCafeId;
                  return (
                    <button
                      key={cafe.id}
                      onClick={() => {
                        setActiveCafeId(cafe.id);
                        onSelectCafe(cafe);
                        setIsMobileSheetDismissed(false);
                        const map = mapInstanceRef.current;
                        if (map) {
                          map.flyTo([cafe.coordinates.lat, cafe.coordinates.lng], 16, { duration: 0.7 });
                        }
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl shrink-0 text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2A211C] border-[#C88A5A] text-[#F6EBDD] shadow-md'
                          : 'bg-[#211A16] border-[#F6EBDD]/10 text-[#D8C5B5] hover:border-[#F6EBDD]/25'
                      }`}
                    >
                      <img src={cafe.image} alt={cafe.name} className="w-6 h-6 rounded-md object-cover" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate max-w-[110px]">{cafe.name}</div>
                        <div className="text-[10px] text-[#C88A5A]">★ {cafe.rating} • {cafe.aiMatch}%</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Cafe List (Desktop: Left 5 columns, Mobile: Bottom Section with Collapsible Drawer) */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar order-2 lg:order-1">
            <div className="relative lg:sticky lg:top-0 bg-[#15110F] pb-2 z-10 flex items-center justify-between border-b border-[#F6EBDD]/10 lg:border-b-0 pt-2 lg:pt-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#D8C5B5] uppercase tracking-wider">
                  Select a cafe to focus map ({cafes.length})
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#6F4E37]/30 text-[10px] font-bold text-[#C88A5A] border border-[#C88A5A]/30">
                  Sample Data
                </span>
              </div>

              {/* Mobile Collapsible Toggle Button */}
              <button
                onClick={() => setIsMobileListExpanded((prev) => !prev)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-xs font-semibold text-[#F6EBDD] transition-colors cursor-pointer"
              >
                <span>{isMobileListExpanded ? 'Collapse' : `View All (${cafes.length})`}</span>
                {isMobileListExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#C88A5A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#C88A5A]" />}
              </button>
            </div>

            {/* Cafe Cards (Always visible on desktop, togglable on mobile) */}
            <div className={`${!isMobileListExpanded ? 'hidden lg:flex' : 'flex'} flex-col gap-3`}>
              {cafes.map((cafe) => {
                const isSelected = cafe.id === activeCafeId;
                return (
                  <div
                    key={cafe.id}
                    onClick={() => {
                      setActiveCafeId(cafe.id);
                      onSelectCafe(cafe);
                      setIsMobileSheetDismissed(false);
                      const map = mapInstanceRef.current;
                      if (map) {
                        map.flyTo([cafe.coordinates.lat, cafe.coordinates.lng], 16, { duration: 0.7 });
                      }
                    }}
                    className={`p-4 rounded-[22px] transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#2A211C] border-[#C88A5A] shadow-lg shadow-[#6F4E37]/20 scale-[1.01]'
                        : 'bg-[#211A16]/80 hover:bg-[#2A211C]/60 border-[#F6EBDD]/8 hover:border-[#F6EBDD]/20'
                    }`}
                  >
                    <div className="flex gap-3.5">
                      <img
                        src={cafe.image}
                        alt={cafe.name}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#F6EBDD]/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-bold text-sm text-[#F6EBDD] font-display truncate">
                            {cafe.name}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-[#C88A5A] font-bold shrink-0">
                            <Star className="w-3.5 h-3.5 fill-[#C88A5A]" />
                            <span>{cafe.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-xs text-[#D8C5B5]/80 line-clamp-1">
                            {cafe.category}
                          </p>
                          <span className="px-1.5 py-0.5 rounded bg-[#6F4E37]/30 text-[10px] font-bold text-[#C88A5A] border border-[#C88A5A]/30 shrink-0">
                            Sample Data
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#D8C5B5]">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#C88A5A]" />
                            <span>{cafe.distance}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#A98BFF] font-semibold">
                            <Sparkles className="w-3 h-3" />
                            <span>{cafe.aiMatch}% Match</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F6EBDD]/8 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-[#D8C5B5]/70 truncate max-w-[240px]">
                        <span className="truncate">{cafe.address}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(cafe);
                        }}
                        className="text-xs font-semibold text-[#C88A5A] hover:text-[#F6EBDD] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Cluster Details Drawer / Modal when user taps "X cafes here" */}
      {clusterModalCafeList && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setClusterModalCafeList(null)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col bg-[#1A1411] border border-[#F6EBDD]/15 rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#F6EBDD]/10 flex items-center justify-between bg-[#211A16]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#C88A5A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C88A5A]">
                    Clustered Cafes ({clusterModalCafeList.count})
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#F6EBDD] font-display">
                  Select a spot in this area
                </h3>
              </div>
              <button
                onClick={() => setClusterModalCafeList(null)}
                aria-label="Close cluster view"
                className="w-8 h-8 rounded-full bg-[#15110F] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-[#D8C5B5] hover:text-[#F6EBDD] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cafe List in Cluster */}
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
              {clusterModalCafeList.cafes.map((cafe) => {
                const isSelected = cafe.id === activeCafeId;
                return (
                  <div
                    key={cafe.id}
                    onClick={() => {
                      setActiveCafeId(cafe.id);
                      onSelectCafe(cafe);
                      setClusterModalCafeList(null);
                      setIsMobileSheetDismissed(false);
                      const map = mapInstanceRef.current;
                      if (map) {
                        map.flyTo([cafe.coordinates.lat, cafe.coordinates.lng], 16, { duration: 0.8 });
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-[#2A211C] border-[#C88A5A] shadow-md shadow-[#C88A5A]/20'
                        : 'bg-[#211A16]/70 hover:bg-[#2A211C]/60 border-[#F6EBDD]/10 hover:border-[#F6EBDD]/25'
                    }`}
                  >
                    <img
                      src={cafe.image}
                      alt={cafe.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#F6EBDD]/10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="font-bold text-sm text-[#F6EBDD] font-display truncate">
                          {cafe.name}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#A98BFF]/20 text-[#A98BFF] border border-[#A98BFF]/30 shrink-0">
                          {cafe.aiMatch}% Match
                        </span>
                      </div>
                      <p className="text-xs text-[#D8C5B5]/75 line-clamp-1">
                        {cafe.category} • {cafe.address}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[#D8C5B5] mt-1">
                        <span className="flex items-center gap-1 text-[#C88A5A]">
                          <Star className="w-3 h-3 fill-[#C88A5A]" />
                          <span>{cafe.rating}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#C88A5A]" />
                          <span>{cafe.distance}</span>
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D8C5B5]/60 shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer inside modal */}
            <div className="p-3 bg-[#15110F] border-t border-[#F6EBDD]/10 text-center">
              <span className="text-xs text-[#D8C5B5]/60">
                Tap any cafe to focus map and view full details
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
