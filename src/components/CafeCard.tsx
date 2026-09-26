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
  onViewOnMap?: (cafe: Cafe) => void;
  index?: number;
}

export const CafeCard: React.FC<CafeCardProps> = ({
  cafe,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  onViewOnMap,
  index = 0,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isBouncingHeart, setIsBouncingHeart] = useState(false);

  const handleViewOnMapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewOnMap?.(cafe);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBouncingHeart(true);
    setTimeout(() => setIsBouncingHeart(false), 360);
    onToggleFavorite(cafe.id);
  };

  return (
    <article
      onClick={() => onViewDetails(cafe)}
      style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
      className="group relative bg-[#211A16] hover:bg-[#261E1A] rounded-[24px] border border-[#F6EBDD]/10 hover:border-[#C88A5A]/40 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1 animate-card-fade-up"
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

        {/* Subtle Steam Wisps on Hover */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center overflow-hidden z-10"
        >
          <div className="w-16 h-20 relative flex justify-center items-center opacity-45 group-hover:opacity-60 transition-opacity">
            <svg
              className="w-12 h-16 text-[#F6EBDD] drop-shadow-[0_0_8px_rgba(246,235,221,0.25)]"
              viewBox="0 0 36 50"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M10 44 C7 34 15 28 11 18 C8 9 13 4 11 0"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="animate-steam-1"
              />
              <path
                d="M18 46 C21 36 15 30 19 20 C23 10 17 4 19 0"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="animate-steam-2"
              />
              <path
                d="M26 44 C24 35 30 29 26 19 C23 10 28 4 26 0"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="animate-steam-1"
                style={{ animationDelay: '0.7s' }}
              />
            </svg>
          </div>
        </div>

        {/* AI Match & Sample Data Badges (Top Left) */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 z-20">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15110F]/85 backdrop-blur-md border border-[#A98BFF]/40 text-xs font-bold text-[#A98BFF] shadow-lg animate-badge-glow">
            <Sparkles className="w-3.5 h-3.5 text-[#A98BFF] group-hover:rotate-12 transition-transform duration-300" />
            <span>{cafe.aiMatch}% Match</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#15110F]/90 backdrop-blur-md border border-[#C88A5A]/45 text-[11px] font-bold text-[#C88A5A] shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C88A5A]" />
            <span>Sample Data</span>
          </div>
        </div>

        {/* Favorite Button (Top Right) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? `Remove ${cafe.name} from favorites` : `Save ${cafe.name} to favorites`}
          className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#15110F]/80 hover:bg-[#15110F] backdrop-blur-md border flex items-center justify-center text-[#F6EBDD] transition-all active:scale-90 cursor-pointer shadow-lg z-20 ${
            isFavorite
              ? 'border-[#FF7676]/45 shadow-[0_0_12px_rgba(255,118,118,0.25)]'
              : 'border-[#F6EBDD]/15 hover:border-[#FF7676]/35'
          }`}
        >
          <Heart
            className={`w-4.5 h-4.5 transition-colors ${
              isBouncingHeart ? 'animate-heart-bounce' : ''
            } ${
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

          {/* View on Map Button */}
          <button
            type="button"
            onClick={handleViewOnMapClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#C88A5A]/15 hover:bg-[#C88A5A]/25 border border-[#C88A5A]/40 text-xs sm:text-sm font-semibold text-[#C88A5A] hover:text-[#F6EBDD] transition-all cursor-pointer active:scale-95"
            title="Highlight cafe on interactive map"
          >
            <MapPin className="w-3.5 h-3.5 text-[#C88A5A]" />
            <span>View on Map</span>
          </button>

        </div>

      </div>
    </article>
  );
};
