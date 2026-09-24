import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Menu, X, Heart, Compass, Coffee, ChevronDown, Check, Crosshair } from 'lucide-react';
import { POPULAR_LOCATIONS } from '../data/cafes';

interface NavbarProps {
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onUseCurrentLocation?: () => void;
  isLocating?: boolean;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  onSelectLocation,
  favoritesCount,
  onOpenFavorites,
  activeNav,
  setActiveNav,
  onUseCurrentLocation,
  isLocating = false,
  onGoHome,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'discover', label: 'Discover', href: '#discover' },
    { id: 'explore', label: 'Explore', href: '#explore' },
    { id: 'map', label: 'Map', href: '#map-section' },
    { id: 'favorites', label: 'Favorites', badge: favoritesCount > 0 ? favoritesCount : null },
  ];

  const handleNavClick = (id: string, href?: string) => {
    onGoHome?.();
    setActiveNav(id);
    setMobileMenuOpen(false);
    if (id === 'favorites') {
      onOpenFavorites();
      return;
    }
    if (href) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#15110F]/90 backdrop-blur-md border-b border-[#F6EBDD]/10 py-3 shadow-xl'
            : 'bg-[#15110F]/40 backdrop-blur-sm border-b border-transparent py-4.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            
            {/* Zone 1: Brand Wordmark with Coffee Cup + Pin + Sparkle */}
            <a
              href="#discover"
              onClick={(e) => {
                e.preventDefault();
                onGoHome?.();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActiveNav('discover');
              }}
              className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C88A5A] rounded-xl px-1 py-0.5"
            >
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#6F4E37] via-[#2A211C] to-[#15110F] border border-[#C88A5A]/30 flex items-center justify-center shadow-md shadow-[#15110F]/80 group-hover:border-[#C88A5A]/60 transition-colors">
                {/* Custom minimal cup + pin icon */}
                <Coffee className="w-4.5 h-4.5 text-[#F6EBDD]" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A98BFF] flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-[#15110F]" />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-[#F6EBDD] font-display flex items-center gap-1">
                  ☕ Brewly
                </span>
              </div>
            </a>

            {/* Zone 2: Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 bg-[#211A16]/70 border border-[#F6EBDD]/8 px-3 py-1.5 rounded-full backdrop-blur-md">
              {navItems.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id, item.href)}
                    className={`relative px-4 py-1.5 text-sm font-medium transition-all rounded-full whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'text-[#15110F] bg-[#F6EBDD] font-semibold shadow-sm'
                        : 'text-[#D8C5B5] hover:text-[#F6EBDD] hover:bg-[#F6EBDD]/5'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full font-bold tabular-nums ${
                          isActive
                            ? 'bg-[#15110F] text-[#F6EBDD]'
                            : 'bg-[#C88A5A] text-[#15110F]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Actions (Location Selector + AI Sparkle + Profile) */}
            <div className="flex items-center gap-2.5">
              
              {/* Location Selector Pill */}
              <div className="relative">
                <button
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/12 text-xs sm:text-sm text-[#F6EBDD] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C88A5A]"
                  aria-expanded={locationDropdownOpen}
                  aria-label="Select location"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C88A5A] shrink-0" />
                  <span className="max-w-[120px] sm:max-w-[150px] truncate font-medium">
                    {currentLocation}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#D8C5B5] transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {locationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#211A16] border border-[#F6EBDD]/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {onUseCurrentLocation && (
                      <div className="pb-1.5 mb-1.5 border-b border-[#F6EBDD]/10">
                        <button
                          type="button"
                          onClick={() => {
                            setLocationDropdownOpen(false);
                            onUseCurrentLocation();
                          }}
                          disabled={isLocating}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#6F4E37]/30 hover:bg-[#6F4E37]/50 text-[#C88A5A] hover:text-[#F6EBDD] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Crosshair className={`w-4 h-4 text-[#C88A5A] ${isLocating ? 'animate-spin' : ''}`} />
                          <span>{isLocating ? 'Detecting Location...' : 'Use My Exact Location'}</span>
                        </button>
                      </div>
                    )}
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#D8C5B5]/70">
                      Popular Hubs
                    </div>
                    <div className="mt-1 space-y-1">
                      {POPULAR_LOCATIONS.map((loc) => {
                        const isSelected = currentLocation === loc.label;
                        return (
                          <button
                            key={loc.label}
                            onClick={() => {
                              onSelectLocation(loc.label);
                              setLocationDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-xl text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#6F4E37]/40 text-[#F6EBDD] font-semibold'
                                : 'text-[#D8C5B5] hover:bg-[#F6EBDD]/8 hover:text-[#F6EBDD]'
                            }`}
                          >
                            <span className="truncate">{loc.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#6FCF97]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Status Accent Pill */}
              <button
                onClick={() => {
                  const searchEl = document.getElementById('ai-search-input');
                  if (searchEl) {
                    searchEl.focus();
                    searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#A98BFF]/15 hover:bg-[#A98BFF]/25 border border-[#A98BFF]/40 text-xs font-semibold text-[#A98BFF] transition-all cursor-pointer shadow-sm shadow-[#A98BFF]/10 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#A98BFF]" />
                <span>AI Finder</span>
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-[#211A16] border border-[#F6EBDD]/12 text-[#F6EBDD] hover:bg-[#2A211C] focus:outline-none cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[65px] z-30 bg-[#15110F]/95 backdrop-blur-xl md:hidden border-b border-[#F6EBDD]/10 px-6 py-6 flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.href)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-base font-semibold text-left transition-colors cursor-pointer ${
                  activeNav === item.id
                    ? 'bg-[#6F4E37]/40 text-[#F6EBDD] border border-[#C88A5A]/30'
                    : 'text-[#D8C5B5] hover:bg-[#211A16]'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#C88A5A] text-[#15110F] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#F6EBDD]/10 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const searchEl = document.getElementById('ai-search-input');
                if (searchEl) {
                  searchEl.focus();
                  searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C88A5A] text-[#F6EBDD] font-bold text-sm shadow-lg shadow-[#6F4E37]/30"
            >
              <Sparkles className="w-4 h-4 text-[#F6EBDD]" />
              <span>Ask Brewly AI</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
