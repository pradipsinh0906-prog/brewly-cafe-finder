import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Search,
  Coffee,
  BookOpen,
  Laptop,
  Heart,
  Users,
  Leaf,
  Coins,
  Moon,
  ArrowRight,
  Crosshair,
  Loader2,
} from 'lucide-react';
import { QUICK_PROMPTS } from '../data/cafes';
import { QuickPrompt } from '../types/cafe';

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  selectedChip: string | null;
  setSelectedChip: (chipId: string | null) => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  onUseCurrentLocation,
  isLocating,
  selectedChip,
  setSelectedChip,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getChipIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'BookOpen':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Laptop':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'Heart':
        return <Heart className="w-3.5 h-3.5" />;
      case 'Users':
        return <Users className="w-3.5 h-3.5" />;
      case 'Leaf':
        return <Leaf className="w-3.5 h-3.5" />;
      case 'Coins':
        return <Coins className="w-3.5 h-3.5" />;
      case 'Moon':
        return <Moon className="w-3.5 h-3.5" />;
      default:
        return <Coffee className="w-3.5 h-3.5" />;
    }
  };

  const handleChipClick = (chip: QuickPrompt) => {
    if (selectedChip === chip.id) {
      setSelectedChip(null);
      setSearchQuery('');
      onSearch('');
    } else {
      setSelectedChip(chip.id);
      setSearchQuery(chip.searchQuery);
      onSearch(chip.searchQuery);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Subtle Background Glows & Particle Ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#6F4E37]/25 via-[#C88A5A]/15 to-[#A98BFF]/10 blur-[130px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-[#A98BFF]/10 blur-[100px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-5 left-10 w-[320px] h-[320px] bg-[#6F4E37]/15 blur-[110px] pointer-events-none -z-10 rounded-full" />

      {/* Floating Subtle Decorative Elements (Coffee beans, map pin, spark particle) */}
      <div className="absolute top-24 left-[8%] hidden lg:block opacity-35 hover:opacity-75 transition-opacity animate-float-slow pointer-events-none">
        <div className="w-10 h-10 rounded-full border border-[#C88A5A]/30 bg-[#211A16]/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Coffee className="w-5 h-5 text-[#C88A5A]" />
        </div>
      </div>

      <div className="absolute top-48 right-[10%] hidden lg:block opacity-35 hover:opacity-75 transition-opacity animate-float-reverse pointer-events-none">
        <div className="w-11 h-11 rounded-2xl border border-[#A98BFF]/30 bg-[#211A16]/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-[#A98BFF]" />
        </div>
      </div>

      <div className="absolute bottom-16 left-[16%] hidden lg:block opacity-25 hover:opacity-60 transition-opacity animate-float-slow pointer-events-none">
        <div className="w-9 h-9 rounded-full border border-[#D8C5B5]/25 bg-[#211A16]/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <MapPin className="w-4 h-4 text-[#D8C5B5]" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Badge: ✨ AI-powered cafe discovery */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#211A16]/90 border border-[#A98BFF]/30 text-xs sm:text-sm font-semibold text-[#F6EBDD] shadow-lg shadow-[#15110F]/60 backdrop-blur-md mb-6 hover:border-[#A98BFF]/60 transition-colors">
          <Sparkles className="w-4 h-4 text-[#A98BFF] animate-pulse-subtle" />
          <span className="tracking-wide">AI-powered cafe discovery</span>
        </div>

        {/* Headline: Find your perfect spot. */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F6EBDD] font-display text-balance mb-5 leading-[1.12]">
          Find your perfect spot.
        </h1>

        {/* Supporting line */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[#D8C5B5] font-normal leading-relaxed mb-10 text-balance">
          Tell Brewly what you're looking for. We'll help you discover the right cafe.
        </p>

        {/* AI Search Bar Container */}
        <div className="max-w-3xl mx-auto mb-8">
          <form
            onSubmit={handleSubmit}
            className={`relative rounded-3xl p-2 sm:p-2.5 transition-all duration-300 ${
              isFocused
                ? 'bg-[#211A16] border-2 border-[#A98BFF]/70 shadow-2xl shadow-[#A98BFF]/15'
                : 'bg-[#211A16]/90 border border-[#F6EBDD]/15 shadow-xl shadow-[#15110F]/80 hover:border-[#C88A5A]/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              
              {/* Input Zone with AI Sparkle Icon */}
              <div className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#A98BFF]/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#A98BFF]" />
                </div>
                <input
                  id="ai-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Try: Quiet cafe with Wi-Fi for studying under ₹500"
                  className="w-full bg-transparent text-sm sm:text-base text-[#F6EBDD] placeholder-[#D8C5B5]/45 focus:outline-none font-medium truncate"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedChip(null);
                      onSearch('');
                    }}
                    className="text-xs text-[#D8C5B5] hover:text-[#F6EBDD] px-2 py-1 rounded-md cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Action Buttons Zone */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F6EBDD]/10">
                
                {/* Use my location button */}
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  disabled={isLocating}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#15110F] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-xs sm:text-sm font-semibold text-[#D8C5B5] hover:text-[#F6EBDD] transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
                  title="Use my current GPS location"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#C88A5A] animate-spin" />
                  ) : (
                    <Crosshair className="w-3.5 h-3.5 text-[#C88A5A]" />
                  )}
                  <span>Use my location</span>
                </button>

                {/* Discover button */}
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#6F4E37] via-[#855B3F] to-[#C88A5A] hover:brightness-110 text-[#F6EBDD] text-xs sm:text-sm font-bold shadow-lg shadow-[#6F4E37]/35 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <Search className="w-4 h-4 text-[#F6EBDD]" />
                  <span>Discover</span>
                </button>

              </div>

            </div>
          </form>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#D8C5B5]/60">
            Popular Moods & Prompts
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
            {QUICK_PROMPTS.map((chip) => {
              const isSelected = selectedChip === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => handleChipClick(chip)}
                  className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 border ${
                    isSelected
                      ? 'bg-[#F6EBDD] text-[#15110F] border-[#F6EBDD] shadow-md shadow-[#F6EBDD]/10 font-semibold'
                      : 'bg-[#211A16]/80 text-[#D8C5B5] border-[#F6EBDD]/10 hover:border-[#C88A5A]/50 hover:text-[#F6EBDD] hover:bg-[#2A211C]'
                  }`}
                >
                  <span className={isSelected ? 'text-[#15110F]' : 'text-[#C88A5A] group-hover:scale-110 transition-transform'}>
                    {getChipIcon(chip.iconName)}
                  </span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
