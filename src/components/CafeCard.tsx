import React, { useState } from 'react';
import {
  Star,
  MapPin,
  Clock,
  Sparkles,
  Heart,
  Navigation,
  Eye,
  Wifi,
  Zap,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { Cafe } from '../types/cafe';

interface CafeCardProps {
  cafe: Cafe;
  isFavorite: boolean;
  onToggleFavorite: (cafeId: string) => void;
  onViewDetails: (cafe: Cafe) => void;
}

export const CafeCard: React.FC<CafeCardProps> = ({
  cafe,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(cafe.directionsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(cafe.id);
  };

  return (
    <article
      onClick={() => onViewDetails(cafe)}
      className="group relative bg-[#211A16] hover:bg-[#261E1A] rounded-[24px] border border-[#F6EBDD]/10 hover:border-[#C88A5A]/40 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
    >
      {/* Top Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#15110F]">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#211A16] to-[#2A211C] animate-pulse" />
        )}

        {!imageError ? (
          <img
            src={cafe.image}
            alt={`${cafe.name} interior and ambiance`}
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#2A211C] text-[#D8C5B5] p-6 text-center">
            <span className="text-3xl mb-2">☕</span>
            <span className="text-sm font-semibold">{cafe.name}</span>
          </div>
        )}

        {/* Ambient Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#211A16] via-[#211A16]/20 to-transparent pointer-events-none" />

        {/* AI Match Badge (Top Left) */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15110F]/85 backdrop-blur-md border border-[#A98BFF]/40 text-xs font-bold text-[#A98BFF] shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#A98BFF]" />
          <span>{cafe.aiMatch}% Match</span>
        </div>

        {/* Favorite Button (Top Right) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? `Remove ${cafe.name} from favorites` : `Save ${cafe.name} to favorites`}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#15110F]/80 hover:bg-[#15110F] backdrop-blur-md border border-[#F6EBDD]/15 flex items-center justify-center text-[#F6EBDD] transition-transform active:scale-90 cursor-pointer shadow-lg z-10"
        >
          <Heart
            className={`w-4.5 h-4.5 transition-colors ${
              isFavorite
                ? 'fill-[#FF7676] text-[#FF7676]'
                : 'text-[#F6EBDD] hover:text-[#FF7676]'
            }`}
          />
        </button>

        {/* Category & Status Overlay (Bottom of Image) */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs">
          <span className="px-2.5 py-1 rounded-full bg-[#15110F]/80 backdrop-blur-md border border-[#F6EBDD]/10 text-[#F6EBDD] font-medium truncate max-w-[65%]">
            {cafe.category}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#15110F]/85 backdrop-blur-md border border-[#F6EBDD]/10 font-semibold text-[#6FCF97]">
            <span className="w-2 h-2 rounded-full bg-[#6FCF97] animate-pulse" />
            <span>Open</span>
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
        
        {/* Header: Title, Rating, and Price */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-[#F6EBDD] group-hover:text-[#C88A5A] transition-colors font-display line-clamp-1">
              {cafe.name}
            </h3>
            
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#6F4E37]/30 border border-[#C88A5A]/25 shrink-0">
              <Star className="w-3.5 h-3.5 fill-[#C88A5A] text-[#C88A5A]" />
              <span className="text-xs font-bold text-[#F6EBDD] tabular-nums">
                {cafe.rating.toFixed(1)}
              </span>
              <span className="text-[11px] text-[#D8C5B5]/60 tabular-nums">
                ({cafe.reviewCount})
              </span>
            </div>
          </div>

          {/* Tagline / Vibe Summary */}
          <p className="text-xs sm:text-sm text-[#D8C5B5]/85 line-clamp-2 mb-3 leading-relaxed">
            {cafe.tagline}
          </p>

          {/* Location & Cost Metadata */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#D8C5B5] mb-3.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C88A5A] shrink-0" />
              <span className="truncate max-w-[150px]">{cafe.area}</span>
            </span>
            <span className="text-[#D8C5B5]/40" aria-hidden="true">·</span>
            <span className="font-semibold text-[#F6EBDD]">{cafe.distance}</span>
            <span className="text-[#D8C5B5]/40" aria-hidden="true">·</span>
            <span className="font-bold text-[#C88A5A]">{cafe.priceLevel}</span>
            <span className="text-[#D8C5B5]/70">({cafe.priceEstimate})</span>
          </div>

          {/* AI Match Commentary Banner */}
          <div className="p-2.5 rounded-xl bg-[#15110F]/70 border border-[#A98BFF]/20 text-[11px] sm:text-xs text-[#D8C5B5] flex items-start gap-2 mb-3.5">
            <Sparkles className="w-3.5 h-3.5 text-[#A98BFF] shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-relaxed text-[#F6EBDD]/90">
              {cafe.aiReasoning}
            </p>
          </div>

          {/* Key Amenities */}
          <div className="flex flex-wrap items-center gap-1.5">
            {cafe.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="px-2.5 py-1 rounded-lg bg-[#2A211C] border border-[#F6EBDD]/8 text-[11px] font-medium text-[#D8C5B5]"
              >
                {amenity}
              </span>
            ))}
            {cafe.amenities.length > 3 && (
              <span className="px-2 py-1 rounded-lg bg-[#2A211C]/60 text-[11px] font-medium text-[#D8C5B5]/70">
                +{cafe.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer: Action Buttons */}
        <div className="pt-3 border-t border-[#F6EBDD]/10 flex items-center gap-2">
          
          {/* View Details Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(cafe);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#15110F] hover:bg-[#6F4E37]/30 border border-[#F6EBDD]/15 hover:border-[#C88A5A]/50 text-xs sm:text-sm font-semibold text-[#F6EBDD] transition-colors cursor-pointer active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-[#C88A5A]" />
            <span>View Details</span>
          </button>

          {/* Directions Button */}
          <button
            type="button"
            onClick={handleDirectionsClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#C88A5A]/15 hover:bg-[#C88A5A]/25 border border-[#C88A5A]/40 text-xs sm:text-sm font-semibold text-[#C88A5A] hover:text-[#F6EBDD] transition-all cursor-pointer active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5 text-[#C88A5A]" />
            <span>Directions</span>
          </button>

        </div>

      </div>
    </article>
  );
};
