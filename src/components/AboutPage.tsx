import React from 'react';
import { Coffee, Sparkles, MapPin, Wifi, Shield, ArrowLeft, Heart, Users, Compass } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-200">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-xs sm:text-sm font-semibold text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Discovery</span>
      </button>

      {/* Header Badge & Title */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6F4E37]/30 border border-[#C88A5A]/30 text-xs font-semibold text-[#C88A5A] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#C88A5A]" />
          <span>About Brewly</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F6EBDD] font-display tracking-tight mb-4">
          Finding your perfect spot shouldn't be guesswork.
        </h1>
        <p className="text-base sm:text-lg text-[#D8C5B5] leading-relaxed">
          Brewly is an intelligent cafe discovery platform founded by Pradipsinh to connect coffee aficionados, students, remote creators, and nomads with spaces crafted for their needs.
        </p>
      </div>

      {/* Main Story & Philosophy */}
      <div className="space-y-8 text-sm sm:text-base text-[#D8C5B5]/90 leading-relaxed border-t border-[#F6EBDD]/10 pt-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F6EBDD] font-display mb-3 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[#C88A5A]" />
            <span>The Story Behind Brewly</span>
          </h2>
          <p className="mb-4">
            Finding a cafe used to mean scrolling through outdated generic reviews, hoping for an open power outlet, or gambling on whether the Wi-Fi would support a Zoom call. Most mapping apps treat a neighborhood specialty roastery the same as a fast-food drive-through.
          </p>
          <p>
            Brewly was built by Pradipsinh to fix this. We blend geographic mapping with acoustic decibel indexing, power-plug availability tracking, and single-origin roast evaluation — all powered by natural-language AI discovery.
          </p>
        </div>

        {/* Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          <div className="p-6 rounded-[22px] bg-[#211A16] border border-[#F6EBDD]/10">
            <div className="w-10 h-10 rounded-xl bg-[#6FCF97]/15 flex items-center justify-center mb-4">
              <Wifi className="w-5 h-5 text-[#6FCF97]" />
            </div>
            <h3 className="font-bold text-base text-[#F6EBDD] mb-1 font-display">Verified Tech Amenities</h3>
            <p className="text-xs sm:text-sm text-[#D8C5B5]/75">
              Verified fiber Wi-Fi speeds and table-level electrical socket availability for productive work.
            </p>
          </div>

          <div className="p-6 rounded-[22px] bg-[#211A16] border border-[#F6EBDD]/10">
            <div className="w-10 h-10 rounded-xl bg-[#A98BFF]/15 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-[#A98BFF]" />
            </div>
            <h3 className="font-bold text-base text-[#F6EBDD] mb-1 font-display">Natural-Language Search</h3>
            <p className="text-xs sm:text-sm text-[#D8C5B5]/75">
              Ask in plain language: "Quiet cafe for reading under ₹500" or "Late night espresso bar for a date".
            </p>
          </div>

          <div className="p-6 rounded-[22px] bg-[#211A16] border border-[#F6EBDD]/10">
            <div className="w-10 h-10 rounded-xl bg-[#C88A5A]/15 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-[#C88A5A]" />
            </div>
            <h3 className="font-bold text-base text-[#F6EBDD] mb-1 font-display">Hyper-Local Map Pins</h3>
            <p className="text-xs sm:text-sm text-[#D8C5B5]/75">
              Accurate walking distance calculation, turn-by-turn navigation, and live neighborhood pulse.
            </p>
          </div>

          <div className="p-6 rounded-[22px] bg-[#211A16] border border-[#F6EBDD]/10">
            <div className="w-10 h-10 rounded-xl bg-[#FF7676]/15 flex items-center justify-center mb-4">
              <Heart className="w-5 h-5 text-[#FF7676]" />
            </div>
            <h3 className="font-bold text-base text-[#F6EBDD] mb-1 font-display">Curated Independent Roasters</h3>
            <p className="text-xs sm:text-sm text-[#D8C5B5]/75">
              Celebrating ethical estates, micro-lots, cold-brew alchemy, and passionate local baristas.
            </p>
          </div>
        </div>

        {/* Creator Note */}
        <div className="p-6 sm:p-7 rounded-[24px] bg-gradient-to-r from-[#211A16] via-[#2A211C] to-[#1F1713] border border-[#C88A5A]/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#6F4E37] flex items-center justify-center text-sm font-bold text-[#F6EBDD]">
              P
            </div>
            <div>
              <div className="font-bold text-sm text-[#F6EBDD]">A Note from Pradipsinh</div>
              <div className="text-xs text-[#C88A5A]">Creator & Architect of Brewly</div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#D8C5B5] leading-relaxed italic">
            "Coffee shops are the modern town squares where friendships flourish, books are written, and startups begin. Brewly was built with warmth, care, and code to help you find your sanctuary anywhere you are. Enjoy your next cup."
          </p>
        </div>

      </div>

      {/* Return button */}
      <div className="mt-12 text-center">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C88A5A] hover:brightness-110 text-xs sm:text-sm font-bold text-[#F6EBDD] transition-all cursor-pointer shadow-lg"
        >
          Explore Cafes Now
        </button>
      </div>

    </div>
  );
};
