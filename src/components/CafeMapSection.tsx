import React, { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
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
} from 'lucide-react';
import { Cafe } from '../types/cafe';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyCks4kJF4RtOVBO_lE0MoRC761W7LBaivs';

// Internal controller component to smoothly pan map when selected cafe changes
function MapPanController({ targetCoords }: { targetCoords: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCoords) return;
    map.panTo(targetCoords);
    // Smoothly zoom in slightly if zoomed out
    const currentZoom = map.getZoom();
    if (typeof currentZoom === 'number' && currentZoom < 14) {
      map.setZoom(14);
    }
  }, [map, targetCoords]);

  return null;
}

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

  const activeCafe = cafes.find((c) => c.id === activeCafeId) || cafes[0];

  const handleMarkerClick = (cafe: Cafe) => {
    setActiveCafeId(cafe.id);
    onSelectCafe(cafe);
  };

  const handleGetDirections = (cafe: Cafe) => {
    window.open(cafe.directionsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLocateOnMap = () => {
    onUseCurrentLocation();
  };

  // Determine current focus coordinate on map
  const activeFocusCoords =
    selectedCafe?.coordinates ||
    activeCafe?.coordinates ||
    userLocationCoords ||
    cafes[0]?.coordinates ||
    { lat: 12.9716, lng: 77.6412 };

  return (
    <section id="map-section" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#15110F] border border-[#C88A5A]/30 text-xs font-semibold text-[#C88A5A] mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#C88A5A]" />
            <span>Interactive Discovery Map</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F6EBDD] font-display">
            Explore Cafes on the Map
          </h2>
          <p className="text-xs sm:text-sm text-[#D8C5B5] mt-1.5 max-w-xl">
            View live cafe pins, walking distances, and real-time vibe metrics across {currentLocation}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#D8C5B5]/70 bg-[#211A16] border border-[#F6EBDD]/10 px-3.5 py-1.5 rounded-full font-medium">
            {cafes.length} mapped locations
          </span>
        </div>
      </div>

      {/* Neighborhood Pulse Panel (Kept & Enhanced) */}
      <div className="mb-8 rounded-[24px] bg-gradient-to-r from-[#211A16] via-[#2A211C] to-[#1F1713] border border-[#F6EBDD]/12 p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left stats info */}
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2 font-bold text-sm text-[#F6EBDD]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6FCF97] animate-pulse" />
              <span>Neighborhood Pulse: {currentLocation}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#D8C5B5] leading-relaxed">
              Real-time snapshot: 14 specialty cafes active within 3 km. Select any pin on the map to inspect noise levels, Wi-Fi speed, and instant directions.
            </p>
          </div>

          {/* Metrics summary */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-[#15110F]/80 border border-[#F6EBDD]/10 backdrop-blur-md">
              <span className="text-[#D8C5B5]/60 block text-[11px]">Open Right Now</span>
              <span className="font-bold text-[#6FCF97]">All 4 Curated Spots</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#15110F]/80 border border-[#F6EBDD]/10 backdrop-blur-md">
              <span className="text-[#D8C5B5]/60 block text-[11px]">Peak Wi-Fi</span>
              <span className="font-bold text-[#F6EBDD]">185 Mbps (Fiber)</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#15110F]/80 border border-[#F6EBDD]/10 backdrop-blur-md">
              <span className="text-[#D8C5B5]/60 block text-[11px]">Avg. Price / 2</span>
              <span className="font-bold text-[#C88A5A]">₹550</span>
            </div>

            {/* Locate Me Action Button */}
            <button
              onClick={handleLocateOnMap}
              disabled={isLocating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6F4E37] hover:bg-[#855B3F] text-[#F6EBDD] font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Crosshair className={`w-4 h-4 text-[#F6EBDD] ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Find Cafes Near Me'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Split Container: Cafe List (Left) + Interactive Google Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Cafe List on Desktop (5 of 12 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 max-h-[640px] overflow-y-auto pr-1">
          {cafes.map((cafe) => {
            const isSelected = activeCafe?.id === cafe.id;
            return (
              <div
                key={cafe.id}
                onClick={() => handleMarkerClick(cafe)}
                className={`p-4 sm:p-5 rounded-[22px] transition-all duration-200 cursor-pointer flex flex-col justify-between border text-left ${
                  isSelected
                    ? 'bg-[#2A211C] border-[#C88A5A] shadow-xl ring-1 ring-[#C88A5A]/30'
                    : 'bg-[#211A16]/80 hover:bg-[#261E1A] border-[#F6EBDD]/10 hover:border-[#C88A5A]/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#15110F] relative">
                    <img
                      src={cafe.image}
                      alt={cafe.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[#15110F]/90 text-[10px] font-bold text-[#A98BFF]">
                      {cafe.aiMatch}%
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="font-bold text-sm sm:text-base text-[#F6EBDD] font-display truncate">
                        {cafe.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#F6EBDD] shrink-0">
                        <Star className="w-3.5 h-3.5 fill-[#C88A5A] text-[#C88A5A]" />
                        <span>{cafe.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#D8C5B5]/80 line-clamp-1 mb-2">
                      {cafe.category}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#D8C5B5]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C88A5A]" />
                        <span>{cafe.distance}</span>
                      </span>
                      <span>·</span>
                      <span className="font-bold text-[#C88A5A]">{cafe.priceLevel}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[#6FCF97]">
                        <Wifi className="w-3 h-3" />
                        <span>{cafe.wifiSpeed}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions when Selected */}
                <div className="mt-3.5 pt-3 border-t border-[#F6EBDD]/8 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#D8C5B5]/60 truncate">
                    {cafe.area}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(cafe);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#15110F] hover:bg-[#6F4E37]/30 border border-[#F6EBDD]/12 text-xs font-semibold text-[#F6EBDD] transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(cafe);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#C88A5A]/20 hover:bg-[#C88A5A]/30 border border-[#C88A5A]/40 text-xs font-bold text-[#C88A5A] hover:text-[#F6EBDD] transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Right Column: Google Maps Interactive Canvas (7 of 12 columns) */}
        <div className="lg:col-span-7 relative h-[480px] lg:h-[640px] rounded-[26px] overflow-hidden border border-[#F6EBDD]/15 shadow-2xl bg-[#15110F]">
          
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              id="brewly-interactive-map"
              defaultCenter={activeFocusCoords}
              defaultZoom={13}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              disableDefaultUI={false}
              colorScheme="DARK"
              className="w-full h-full"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <MapPanController targetCoords={activeFocusCoords} />

              {/* User Geolocation Marker if available */}
              {userLocationCoords && (
                <AdvancedMarker position={userLocationCoords} title="Your Detected Location">
                  <div className="relative flex flex-col items-center justify-center cursor-default">
                    <span className="absolute w-8 h-8 rounded-full bg-[#A98BFF]/40 animate-ping" />
                    <span className="relative w-4 h-4 rounded-full bg-[#A98BFF] border-2 border-white shadow-lg" />
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-[#15110F]/95 text-[10px] font-bold text-[#A98BFF] border border-[#A98BFF]/40 whitespace-nowrap shadow-md">
                      You are here
                    </span>
                  </div>
                </AdvancedMarker>
              )}

              {/* Cafe Pin Markers */}
              {cafes.map((cafe) => {
                const isSelected = activeCafe?.id === cafe.id;
                return (
                  <AdvancedMarker
                    key={cafe.id}
                    position={cafe.coordinates}
                    title={cafe.name}
                    onClick={() => handleMarkerClick(cafe)}
                  >
                    <div
                      className={`group relative flex flex-col items-center cursor-pointer transition-transform duration-300 ${
                        isSelected ? 'scale-120 z-40' : 'hover:scale-110 z-10'
                      }`}
                    >
                      {/* Floating Name Badge for Selected Pin */}
                      {isSelected && (
                        <div className="mb-1.5 px-2.5 py-1 rounded-full bg-[#15110F]/95 backdrop-blur-md border border-[#C88A5A] text-[11px] font-bold text-[#F6EBDD] whitespace-nowrap shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-90 duration-150">
                          <Coffee className="w-3 h-3 text-[#C88A5A]" />
                          <span>{cafe.name}</span>
                          <span className="text-[#A98BFF] font-semibold">({cafe.aiMatch}%)</span>
                        </div>
                      )}

                      {/* Custom Coffee Pin */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#6F4E37] to-[#C88A5A] border-[#F6EBDD] ring-4 ring-[#A98BFF]/40'
                            : 'bg-[#211A16] border-[#C88A5A]/80 hover:border-[#F6EBDD]'
                        }`}
                      >
                        <Coffee
                          className={`w-5 h-5 transition-colors ${
                            isSelected ? 'text-[#F6EBDD]' : 'text-[#C88A5A]'
                          }`}
                        />
                      </div>

                      {/* Pin pointer tip */}
                      <div
                        className={`w-2.5 h-2.5 rotate-45 -mt-1.5 rounded-sm transition-colors ${
                          isSelected ? 'bg-[#C88A5A]' : 'bg-[#211A16]'
                        }`}
                      />
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>

          {/* Floating Cafe Preview Card (On-Map Overlay) */}
          {activeCafe && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 max-w-md z-20 bg-[#211A16]/95 backdrop-blur-xl border border-[#F6EBDD]/15 rounded-[22px] p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={activeCafe.image}
                    alt={activeCafe.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#15110F]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A98BFF]/20 text-[#A98BFF] border border-[#A98BFF]/30">
                        {activeCafe.aiMatch}% Match
                      </span>
                      <span className="text-xs text-[#6FCF97] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6FCF97]" />
                        Open
                      </span>
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-[#F6EBDD] font-display">
                      {activeCafe.name}
                    </h4>
                    <p className="text-xs text-[#D8C5B5]/75 line-clamp-1">
                      {activeCafe.address}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onViewDetails(activeCafe)}
                  className="text-xs text-[#D8C5B5] hover:text-[#F6EBDD] p-1"
                  aria-label="View more details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-[#F6EBDD]/10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetails(activeCafe)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#15110F] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-xs font-semibold text-[#F6EBDD] transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#C88A5A]" />
                  <span>View Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGetDirections(activeCafe)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C88A5A] hover:brightness-110 text-xs font-bold text-[#F6EBDD] transition-all cursor-pointer shadow-md"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#F6EBDD]" />
                  <span>Get Directions</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </section>
  );
};
