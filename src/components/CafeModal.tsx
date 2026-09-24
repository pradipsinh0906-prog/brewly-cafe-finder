import React, { useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  Clock,
  Sparkles,
  Heart,
  Navigation,
  Wifi,
  Volume2,
  Zap,
  Coffee,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Cafe } from '../types/cafe';

interface CafeModalProps {
  cafe: Cafe | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onShare: (cafe: Cafe) => void;
  onViewOnMap?: (cafe: Cafe) => void;
}

export const CafeModal: React.FC<CafeModalProps> = ({
  cafe,
  onClose,
  isFavorite,
  onToggleFavorite,
  onShare,
  onViewOnMap,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (cafe) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cafe, onClose]);

  if (!cafe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#15110F]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#211A16] border border-[#F6EBDD]/15 rounded-[28px] shadow-2xl overflow-hidden z-10 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#15110F]/80 hover:bg-[#15110F] text-[#F6EBDD] flex items-center justify-center border border-[#F6EBDD]/15 transition-transform active:scale-90 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative aspect-[16/9] w-full bg-[#15110F]">
          <img
            src={cafe.image}
            alt={cafe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#211A16] via-transparent to-black/30" />

          {/* AI Match & Sample Data Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#15110F]/90 backdrop-blur-md border border-[#A98BFF]/40 text-xs font-bold text-[#A98BFF] shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-[#A98BFF]" />
              <span>{cafe.aiMatch}% AI Match</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15110F]/90 backdrop-blur-md border border-[#C88A5A]/45 text-xs font-bold text-[#C88A5A] shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C88A5A]" />
              <span>Sample Data</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#C88A5A]">
                {cafe.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F6EBDD] font-display">
                {cafe.name}
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#15110F]/85 backdrop-blur-md border border-[#C88A5A]/30">
              <Star className="w-4 h-4 fill-[#C88A5A] text-[#C88A5A]" />
              <span className="text-sm font-bold text-[#F6EBDD] tabular-nums">
                {cafe.rating.toFixed(1)}
              </span>
              <span className="text-xs text-[#D8C5B5]/60 tabular-nums">
                ({cafe.reviewCount})
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[65vh] overflow-y-auto space-y-6">
          
          {/* Quick info row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#D8C5B5] pb-4 border-b border-[#F6EBDD]/10">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#C88A5A]" />
              <span>{cafe.address}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#6FCF97] font-semibold">
              <Clock className="w-4 h-4" />
              <span>{cafe.openingHours}</span>
            </div>
          </div>

          {/* AI Analysis Recommendation */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6F4E37]/25 via-[#2A211C] to-[#A98BFF]/10 border border-[#A98BFF]/30">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#A98BFF] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Why Brewly Recommends This Spot</span>
            </div>
            <p className="text-sm text-[#F6EBDD] leading-relaxed">
              {cafe.aiReasoning}
            </p>
          </div>

          {/* Productivity & Vibe Benchmarks */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#D8C5B5]/70 mb-3">
              Environment & Vibe Specs
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              <div className="p-3 rounded-2xl bg-[#15110F] border border-[#F6EBDD]/8 flex flex-col">
                <span className="text-[11px] text-[#D8C5B5]/60 flex items-center gap-1 mb-1">
                  <Wifi className="w-3.5 h-3.5 text-[#6FCF97]" />
                  Wi-Fi Speed
                </span>
                <span className="text-sm font-bold text-[#F6EBDD] tabular-nums">
                  {cafe.wifiSpeed}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#15110F] border border-[#F6EBDD]/8 flex flex-col">
                <span className="text-[11px] text-[#D8C5B5]/60 flex items-center gap-1 mb-1">
                  <Volume2 className="w-3.5 h-3.5 text-[#C88A5A]" />
                  Noise Level
                </span>
                <span className="text-sm font-bold text-[#F6EBDD]">
                  {cafe.noiseLevel}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#15110F] border border-[#F6EBDD]/8 flex flex-col">
                <span className="text-[11px] text-[#D8C5B5]/60 flex items-center gap-1 mb-1">
                  <Zap className="w-3.5 h-3.5 text-[#A98BFF]" />
                  Power Outlets
                </span>
                <span className="text-sm font-bold text-[#F6EBDD]">
                  {cafe.outlets}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#15110F] border border-[#F6EBDD]/8 flex flex-col">
                <span className="text-[11px] text-[#D8C5B5]/60 flex items-center gap-1 mb-1">
                  <Coffee className="w-3.5 h-3.5 text-[#C88A5A]" />
                  Avg. For Two
                </span>
                <span className="text-sm font-bold text-[#F6EBDD]">
                  {cafe.priceEstimate}
                </span>
              </div>

            </div>
          </div>

          {/* Signature Drinks / Bites */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#D8C5B5]/70 mb-3">
              Signature Menu Highlights
            </h4>
            <div className="space-y-2.5">
              {cafe.signatureItems.map((item) => (
                <div
                  key={item.name}
                  className="p-3 rounded-2xl bg-[#15110F]/70 border border-[#F6EBDD]/8 flex items-center justify-between gap-3"
                >
                  <div>
                    <h5 className="text-sm font-bold text-[#F6EBDD]">{item.name}</h5>
                    <p className="text-xs text-[#D8C5B5]/75 mt-0.5">{item.description}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#C88A5A] shrink-0 tabular-nums">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* All Amenities */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#D8C5B5]/70 mb-3">
              Amenities & Perks
            </h4>
            <div className="flex flex-wrap gap-2">
              {cafe.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15110F] border border-[#F6EBDD]/10 text-xs font-medium text-[#D8C5B5]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6FCF97]" />
                  <span>{amenity}</span>
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-[#15110F] border-t border-[#F6EBDD]/10 flex flex-wrap items-center gap-3">
          
          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleFavorite(cafe.id)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isFavorite
                ? 'bg-[#FF7676]/20 border-[#FF7676]/40 text-[#FF7676]'
                : 'bg-[#211A16] border-[#F6EBDD]/15 text-[#F6EBDD] hover:bg-[#2A211C]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#FF7676]' : ''}`} />
            <span>{isFavorite ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => onShare(cafe)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#211A16] border border-[#F6EBDD]/15 hover:bg-[#2A211C] text-xs sm:text-sm font-semibold text-[#F6EBDD] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#D8C5B5]" />
            <span>Share</span>
          </button>

          {/* View on Map Primary CTA */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewOnMap?.(cafe);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#6F4E37] via-[#855B3F] to-[#C88A5A] text-[#F6EBDD] text-xs sm:text-sm font-bold shadow-lg shadow-[#6F4E37]/35 transition-all hover:brightness-110 cursor-pointer text-center"
          >
            <MapPin className="w-4 h-4 text-[#F6EBDD]" />
            <span>View on Map</span>
          </button>

        </div>

      </div>
    </div>
  );
};
