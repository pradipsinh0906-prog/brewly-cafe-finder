import React, { useState, useMemo } from 'react';
import { Heart, Coffee, ArrowLeft, Search, Sparkles, MapPin } from 'lucide-react';
import { Cafe } from '../types/cafe';
import { CafeCard } from './CafeCard';

interface FavoritesPageProps {
  savedCafes: Cafe[];
  allFavoritesIds: string[];
  onToggleFavorite: (cafeId: string) => void;
  onViewDetails: (cafe: Cafe) => void;
  onViewOnMap: (cafe: Cafe) => void;
  onBackToDiscover: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  savedCafes,
  allFavoritesIds,
  onToggleFavorite,
  onViewDetails,
  onViewOnMap,
  onBackToDiscover,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter saved cafes by query if user has searched within favorites
  const filteredSavedCafes = useMemo(() => {
    if (!searchQuery.trim()) return savedCafes;
    const q = searchQuery.toLowerCase().trim();
    return savedCafes.filter((cafe) => {
      return (
        cafe.name.toLowerCase().includes(q) ||
        cafe.tagline.toLowerCase().includes(q) ||
        cafe.area.toLowerCase().includes(q) ||
        cafe.category.toLowerCase().includes(q) ||
        cafe.vibeTags.some((tag) => tag.toLowerCase().includes(q)) ||
        cafe.amenities.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [savedCafes, searchQuery]);

  const hasZeroFavorites = allFavoritesIds.length === 0;

  return (
    <div className="pt-24 sm:pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-200">
      
      {/* Top Navigation & Breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          onClick={onBackToDiscover}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-xs sm:text-sm font-semibold text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discover</span>
        </button>

        {!hasZeroFavorites && (
          <span className="text-xs text-[#D8C5B5]/75 bg-[#211A16] border border-[#F6EBDD]/10 px-3.5 py-1.5 rounded-full font-medium tabular-nums">
            {savedCafes.length} {savedCafes.length === 1 ? 'spot' : 'spots'} saved
          </span>
        )}
      </div>

      {/* Page Header */}
      <div className="mb-8 sm:mb-10 pb-6 border-b border-[#F6EBDD]/10">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#FF7676] uppercase tracking-wider">
          <Heart className="w-4 h-4 fill-[#FF7676] text-[#FF7676]" />
          <span>My Brewly</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F6EBDD] font-display tracking-tight">
              Bookmarked Spots
            </h1>
            <p className="text-sm sm:text-base text-[#D8C5B5] mt-2 max-w-2xl leading-relaxed">
              Your hand-picked collection of top cafes, study hubs, and artisan roasteries. Tap the heart to bookmark or remove any spot anytime.
            </p>
          </div>

          {/* Quick Filter Search inside Favorites if multiple items */}
          {savedCafes.length > 1 && (
            <div className="relative min-w-[240px] sm:w-64">
              <Search className="w-4 h-4 text-[#D8C5B5]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter saved spots..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-[#211A16] border border-[#F6EBDD]/15 text-xs text-[#F6EBDD] placeholder-[#D8C5B5]/50 focus:outline-none focus:border-[#C88A5A]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {hasZeroFavorites ? (
        /* Empty State: exactly when truly zero saved cafes */
        <div className="py-20 text-center rounded-[28px] bg-[#211A16]/50 border border-[#F6EBDD]/10 p-8 max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#6F4E37]/30 border border-[#C88A5A]/30 flex items-center justify-center mx-auto mb-5">
            <Coffee className="w-8 h-8 text-[#C88A5A]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F6EBDD] mb-3 font-display">
            Your coffee list is empty ☕
          </h2>
          <p className="text-sm text-[#D8C5B5] leading-relaxed mb-6 max-w-md mx-auto">
            You haven't bookmarked any cafes yet. Browse discovered spots, filter by Wi-Fi or roast, and tap the heart icon on any card to save your favorite cafes here.
          </p>
          <button
            onClick={onBackToDiscover}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C88A5A] hover:opacity-95 text-[#F6EBDD] text-sm font-bold transition-all shadow-lg shadow-[#6F4E37]/30 cursor-pointer active:scale-95"
          >
            Discover Cafes
          </button>
        </div>
      ) : filteredSavedCafes.length === 0 ? (
        /* Search has no results within favorites */
        <div className="py-16 text-center rounded-[28px] bg-[#211A16]/40 border border-[#F6EBDD]/10 p-8 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#6F4E37]/30 border border-[#C88A5A]/30 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-[#C88A5A]" />
          </div>
          <h3 className="text-xl font-bold text-[#F6EBDD] mb-2 font-display">
            No saved spots match "{searchQuery}"
          </h3>
          <p className="text-sm text-[#D8C5B5] mb-6">
            Try searching for another neighborhood or keyword, or clear your search to view all {savedCafes.length} saved spots.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-5 py-2.5 rounded-full bg-[#6F4E37] hover:bg-[#855B3F] text-[#F6EBDD] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        /* Render Saved Cafe Cards Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
            {filteredSavedCafes.map((cafe, index) => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                index={index}
                isFavorite={true}
                onToggleFavorite={onToggleFavorite}
                onViewDetails={onViewDetails}
                onViewOnMap={onViewOnMap}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
