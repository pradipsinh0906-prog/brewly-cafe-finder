import React from 'react';
import { Coffee, Sparkles, Heart } from 'lucide-react';

interface FooterProps {
  onNavClick: (id: string, href?: string) => void;
  onOpenPage?: (page: 'about' | 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick, onOpenPage }) => {
  return (
    <footer className="mt-20 border-t border-[#F6EBDD]/10 bg-[#15110F] text-[#D8C5B5] relative overflow-hidden">
      {/* Subtle background ambient blur */}
      <div className="absolute bottom-0 right-1/4 w-[350px] h-[200px] bg-[#6F4E37]/10 blur-[100px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[#F6EBDD]/8">
          
          {/* Brand Info */}
          <div className="max-w-md">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6F4E37] to-[#211A16] border border-[#C88A5A]/30 flex items-center justify-center">
                <Coffee className="w-4 h-4 text-[#F6EBDD]" />
              </div>
              <span className="text-xl font-extrabold text-[#F6EBDD] font-display">
                ☕ Brewly
              </span>
            </div>
            <p className="text-sm font-semibold text-[#F6EBDD]/90 mb-1">
              Find your perfect spot.
            </p>
            <p className="text-xs text-[#D8C5B5]/70 leading-relaxed">
              Coffee, comfort, and the right place — discovered by AI.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm font-medium">
            <button
              onClick={() => onNavClick('discover', '#discover')}
              className="text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer"
            >
              Discover
            </button>
            <button
              onClick={() => onNavClick('explore', '#explore')}
              className="text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer"
            >
              Explore
            </button>
            <button
              onClick={() => onNavClick('map', '#map-section')}
              className="text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer"
            >
              Map
            </button>
            <button
              onClick={() => onNavClick('favorites')}
              className="text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer"
            >
              Favorites
            </button>
            <button
              onClick={() => onOpenPage ? onOpenPage('about') : onNavClick('about')}
              className="text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => onOpenPage ? onOpenPage('privacy') : onNavClick('privacy')}
              className="text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              onClick={() => onOpenPage ? onOpenPage('terms') : onNavClick('terms')}
              className="text-[#D8C5B5] hover:text-[#F6EBDD] transition-colors cursor-pointer"
            >
              Terms
            </button>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#D8C5B5]/60">
          <div>
            © {new Date().getFullYear()} Brewly Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#D8C5B5]/80 font-medium">
            <span>Built by Pradipsinh, powered by AI & coffee ☕</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
