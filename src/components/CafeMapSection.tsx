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
  Crosshair,
  ExternalLink,
  ChevronRight,
  Layers,
  X,
  Volume2,
} from 'lucide-react';
import { Cafe } from '../types/cafe';

interface CafeMapSectionProps {
  cafes: Cafe[];
  selectedCafe: Cafe | null;
  onSelectCafe: (cafe: Cafe) => void;
  onViewDetails: (cafe: Cafe) => void;
  currentLocation: string;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  userLocationCoords?: { lat: number; lng: number } | null;
}

export const CafeMapSection: React.FC<CafeMapSectionProps> = ({
  cafes,
  selectedCafe,
  onSelectCafe,
  onViewDetails,
  currentLocation,
  onUseCurrentLocation,
  isLocating,
  userLocationCoords = null,
}) => {
  const [activeCafeId, setActiveCafeId] = useState<string>(
    selectedCafe ? selectedCafe.id : cafes[0]?.id || ''
  );

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Sync active cafe when parent changes it
  useEffect(() => {
    if (selectedCafe) {
      setActiveCafeId(selectedCafe.id);
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
      const initialLat = userLocationCoords?.lat ?? activeCafe?.coordinates?.lat ?? 12.9784;
      const initialLng = userLocationCoords?.lng ?? activeCafe?.coordinates?.lng ?? 77.6408;

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

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when cafes, activeCafeId, or map changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous cafe markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers for all cafes
    cafes.forEach((cafe) => {
      const isSelected = cafe.id === activeCafeId;

      const iconHtml = `
        <div style="cursor: pointer; transform: ${
          isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1)'
        }; transition: all 0.25s ease-out;">
          <div style="
            background: ${isSelected ? '#C88A5A' : '#1F1814'};
            border: 2px solid ${isSelected ? '#F6EBDD' : '#6F4E37'};
            border-radius: 9999px;
            padding: 5px 9px;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            white-space: nowrap;
          ">
            <span style="font-size: 12px; line-height: 1;">☕</span>
            <span style="color: #F6EBDD; font-weight: 700; font-size: 11px; font-family: sans-serif;">
              ${cafe.name.length > 14 ? cafe.name.slice(0, 14) + '…' : cafe.name}
            </span>
            <span style="
              background: ${isSelected ? '#15110F' : '#A98BFF'};
              color: ${isSelected ? '#F6EBDD' : '#15110F'};
              font-size: 9px;
              font-weight: 800;
              padding: 1px 5px;
              border-radius: 9999px;
            ">
              ${cafe.aiMatch}%
            </span>
          </div>
          <div style="
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid ${isSelected ? '#C88A5A' : '#6F4E37'};
            margin: 0 auto;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'brewly-osm-marker',
        html: iconHtml,
        iconSize: [110, 36],
        iconAnchor: [55, 36],
      });

      const marker = L.marker([cafe.coordinates.lat, cafe.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 100,
      });

      marker.on('click', () => {
        setActiveCafeId(cafe.id);
        onSelectCafe(cafe);
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
  }, [cafes, activeCafeId, userLocationCoords, onSelectCafe]);

  // Pan map when active cafe or coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeCafe) return;

    map.panTo([activeCafe.coordinates.lat, activeCafe.coordinates.lng], {
      animate: true,
      duration: 0.6,
    });
  }, [activeCafe]);

  // Center on user location
  const handleCenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (userLocationCoords && map) {
      map.flyTo([userLocationCoords.lat, userLocationCoords.lng], 15, { duration: 1 });
    } else {
      onUseCurrentLocation();
    }
  };

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <section id="map" className="py-16 sm:py-24 bg-[#15110F] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
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
                  OpenStreetMap Live Feed
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
                Browse verified spots from OpenStreetMap with AI-analyzed acoustics, Wi-Fi speeds, and live distance calculations.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onUseCurrentLocation}
                disabled={isLocating}
                className="px-4 py-2.5 rounded-full bg-[#6F4E37]/30 hover:bg-[#6F4E37]/50 border border-[#C88A5A]/30 text-xs sm:text-sm font-semibold text-[#F6EBDD] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Crosshair className={`w-4 h-4 text-[#C88A5A] ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Center On Me'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-6 pt-6 border-t border-[#F6EBDD]/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-2xl bg-[#15110F]/60 border border-[#F6EBDD]/5">
              <div className="text-xs text-[#D8C5B5]/70">Spots Mapped</div>
              <div className="text-lg font-bold text-[#F6EBDD] font-display mt-0.5">
                {cafes.length} Real Cafes
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#15110F]/60 border border-[#F6EBDD]/5">
              <div className="text-xs text-[#D8C5B5]/70">Data Source</div>
              <div className="text-lg font-bold text-[#6FCF97] font-display mt-0.5">
                OpenStreetMap
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

        {/* Map Layout: Left Side List, Right Side OpenStreetMap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Cafe List (Desktop: Left 5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar order-2 lg:order-1">
            <div className="sticky top-0 bg-[#15110F]/90 backdrop-blur-md pb-2 z-10 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#D8C5B5]/70 uppercase tracking-wider">
                Select a cafe to focus map ({cafes.length})
              </span>
              <span className="text-xs text-[#A98BFF] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Live OSM
              </span>
            </div>

            {cafes.map((cafe) => {
              const isSelected = cafe.id === activeCafeId;
              return (
                <div
                  key={cafe.id}
                  onClick={() => {
                    setActiveCafeId(cafe.id);
                    onSelectCafe(cafe);
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
                        <span className="px-1.5 py-0.5 rounded bg-[#6FCF97]/15 text-[10px] font-bold text-[#6FCF97] border border-[#6FCF97]/30 shrink-0">
                          OSM Verified
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

          {/* Interactive OpenStreetMap (Desktop: Right 7 columns) */}
          <div className="lg:col-span-7 sticky top-24 order-1 lg:order-2">
            <div className="h-[440px] sm:h-[640px] rounded-[28px] overflow-hidden border border-[#F6EBDD]/15 shadow-2xl relative bg-[#1F1814]">
              
              {/* Leaflet Map Div */}
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Map Floating Tools (Top Right) */}
              <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
                <button
                  onClick={handleCenterOnUser}
                  title="Locate me"
                  className="w-10 h-10 rounded-xl bg-[#211A16]/95 hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-[#F6EBDD] flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
                >
                  <Crosshair className={`w-4 h-4 text-[#C88A5A] ${isLocating ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleZoomIn}
                  title="Zoom in"
                  className="w-10 h-10 rounded-xl bg-[#211A16]/95 hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-[#F6EBDD] flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer font-bold text-base"
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  title="Zoom out"
                  className="w-10 h-10 rounded-xl bg-[#211A16]/95 hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-[#F6EBDD] flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer font-bold text-base"
                >
                  −
                </button>
              </div>

              {/* Map Floating Badge (Top Left) */}
              <div className="absolute top-4 left-4 z-[500] pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15110F]/90 backdrop-blur-md border border-[#F6EBDD]/15 text-xs text-[#D8C5B5] shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-[#6FCF97]" />
                  <span className="font-semibold text-[#F6EBDD]">OpenStreetMap Engine</span>
                  <span className="text-[#A98BFF] font-medium">· Free & Live</span>
                </div>
              </div>

              {/* Active Cafe Floating Preview Card (Bottom overlay) */}
              {activeCafe && (
                <div className="absolute bottom-4 left-4 right-4 z-[500] pointer-events-auto">
                  <div className="p-4 sm:p-5 rounded-[24px] bg-[#15110F]/95 backdrop-blur-md border border-[#F6EBDD]/20 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <img
                          src={activeCafe.image}
                          alt={activeCafe.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-[#F6EBDD]/15"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A98BFF]/20 text-[#A98BFF] border border-[#A98BFF]/30">
                              {activeCafe.aiMatch}% Match
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6FCF97]/20 text-[#6FCF97] border border-[#6FCF97]/30">
                              OSM Cafe
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

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F6EBDD]/10">
                        <button
                          onClick={() => onViewDetails(activeCafe)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/20 text-xs font-semibold text-[#F6EBDD] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                        <a
                          href={activeCafe.directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C88A5A] hover:brightness-110 text-xs font-bold text-[#F6EBDD] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Directions</span>
                        </a>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
