/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CafeCard } from './components/CafeCard';
import { CafeModal } from './components/CafeModal';
import { CafeMapSection } from './components/CafeMapSection';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { AboutPage } from './components/AboutPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { FavoritesPage } from './components/FavoritesPage';
import { ScrollToTop } from './components/ScrollToTop';
import { DEMO_CAFES, POPULAR_LOCATIONS, getCafesForLocation, ALL_PRESET_CAFES, findCafeById } from './data/cafes';
import { Cafe } from './types/cafe';
import {
  Sparkles,
  MapPin,
  Coffee,
  Heart,
  Wifi,
  Volume2,
  Zap,
  ArrowRight,
  Compass,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'map' | 'about' | 'privacy' | 'terms' | 'favorites'>('home');
  const [currentLocation, setCurrentLocation] = useState('Ahmedabad');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(
    POPULAR_LOCATIONS[0].coordinates
  );
  const [cafesData, setCafesData] = useState<Cafe[]>(() => getCafesForLocation('Ahmedabad'));
  const [isRealOsmData, setIsRealOsmData] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['ahm-1']);
  const [activeNav, setActiveNav] = useState('discover');
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [selectedMapCafe, setSelectedMapCafe] = useState<Cafe | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'favorite' | 'ai'>('success');

  const showToast = (msg: string, type: 'success' | 'favorite' | 'ai' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleFavorite = (cafeId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(cafeId) || (cafeId === 'ahm-1' && prev.includes('kora-third-wave'));
      const updated = exists
        ? prev.filter((id) => id !== cafeId && id !== 'kora-third-wave')
        : [...prev, cafeId];
      const cafe = findCafeById(cafeId, cafesData);
      if (exists) {
        showToast(`Removed ${cafe?.name ?? 'cafe'} from favorites`, 'favorite');
      } else {
        showToast(`Saved ${cafe?.name ?? 'cafe'} to your favorites!`, 'favorite');
      }
      return updated;
    });
  };

  // Full Cafe objects for all user favorites across presets, dynamic cafes and current location
  const savedCafesList = useMemo(() => {
    return favorites
      .map((favId) => findCafeById(favId, cafesData))
      .filter((cafe): cafe is Cafe => Boolean(cafe));
  }, [favorites, cafesData]);

  const handleSelectLocation = async (locLabel: string) => {
    setCurrentLocation(locLabel);
    setSelectedCafe(null);
    setIsRealOsmData(false);

    const pop = POPULAR_LOCATIONS.find((l) => l.label === locLabel);
    const coords = pop?.coordinates || { lat: 12.9345, lng: 77.6265 };
    setUserCoords(coords);

    setIsGeneratingAi(true);
    showToast(`Generating fresh AI recommendations for ${locLabel.split(',')[0]}...`, 'ai');

    try {
      const resp = await fetch('/api/ai/generate-cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: locLabel,
          coordinates: coords,
          searchQuery,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.cafes) && data.cafes.length > 0) {
          setCafesData(data.cafes);
          setSelectedMapCafe(data.cafes[0]);
          showToast(`Generated ${data.cafes.length} fresh sample cafes for ${locLabel.split(',')[0]}!`, 'success');
          return;
        }
      }

      // Fallback to static location dataset if fetch response didn't contain cafes
      const fallbackCafes = getCafesForLocation(locLabel);
      setCafesData(fallbackCafes);
      setSelectedMapCafe(fallbackCafes[0] || null);
      showToast(`Showing sample cafes for ${locLabel}`, 'success');
    } catch (err) {
      console.warn('AI cafe generation error:', err);
      const fallbackCafes = getCafesForLocation(locLabel);
      setCafesData(fallbackCafes);
      setSelectedMapCafe(fallbackCafes[0] || null);
      showToast(`Showing sample cafes for ${locLabel}`, 'success');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleViewOnMap = (cafe: Cafe) => {
    // Close modal if open
    setSelectedCafe(null);
    // Focus map on this specific cafe
    setSelectedMapCafe(cafe);
    setActiveNav('map');
    setCurrentView('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Viewing "${cafe.name}" on the map`, 'success');
  };

  const handleNavClick = (id: string, href?: string) => {
    setActiveNav(id);

    if (id === 'map') {
      setCurrentView('map');
      setShowOnlyFavorites(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (id === 'favorites') {
      setCurrentView('favorites');
      setShowOnlyFavorites(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (id === 'explore') {
      setCurrentView('home');
      setShowOnlyFavorites(false);
      setTimeout(() => {
        const el = document.getElementById('explore');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
      return;
    }

    if (id === 'discover') {
      setCurrentView('home');
      setShowOnlyFavorites(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (href) {
      setCurrentView('home');
      setShowOnlyFavorites(false);
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const resultsElement = document.getElementById('results-section');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (query.trim()) {
      showToast(`Showing results for "${query}" in ${currentLocation.split(',')[0]}`, 'ai');
    }
  };

  const handleOpenFavorites = () => {
    handleNavClick('favorites');
  };

  const handleShare = (cafe: Cafe) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(`Link to ${cafe.name} copied to clipboard!`, 'success');
    } else {
      showToast(`Saved link to ${cafe.name}`, 'success');
    }
  };

  // Filter cafes based on search query / prompt / favorites
  const filteredCafes = useMemo(() => {
    let list = showOnlyFavorites ? savedCafesList : cafesData;

    if (!searchQuery.trim()) {
      return list;
    }

    const q = searchQuery.toLowerCase();

    // Check matching tags / text
    return list.filter((cafe) => {
      const matchName = cafe.name.toLowerCase().includes(q);
      const matchTagline = cafe.tagline.toLowerCase().includes(q);
      const matchCategory = cafe.category.toLowerCase().includes(q);
      const matchArea = cafe.area.toLowerCase().includes(q);
      const matchVibes = cafe.vibeTags.some((v) => q.includes(v.toLowerCase()) || v.toLowerCase().includes(q));
      const matchAmenities = cafe.amenities.some((a) => a.toLowerCase().includes(q));
      const matchReasoning = cafe.aiReasoning.toLowerCase().includes(q);

      // Match query keywords
      const keywords = q.split(' ');
      const matchKeywords = keywords.some(
        (kw) =>
          kw.length > 2 &&
          (cafe.name.toLowerCase().includes(kw) ||
            cafe.category.toLowerCase().includes(kw) ||
            cafe.vibeTags.some((v) => v.toLowerCase().includes(kw)) ||
            cafe.amenities.some((a) => a.toLowerCase().includes(kw)))
      );

      return matchName || matchTagline || matchCategory || matchArea || matchVibes || matchAmenities || matchReasoning || matchKeywords;
    });
  }, [cafesData, savedCafesList, searchQuery, showOnlyFavorites]);

  return (
    <div className="min-h-screen bg-[#15110F] text-[#F6EBDD] flex flex-col font-sans selection:bg-[#6F4E37]/50 selection:text-[#F6EBDD]">
      
      {/* Sticky Navigation */}
      <Navbar
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        favoritesCount={favorites.length}
        onOpenFavorites={handleOpenFavorites}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onNavClick={handleNavClick}
        onGoHome={() => handleNavClick('discover', '#discover')}
      />

      <main className="flex-1" id="discover">
        {currentView === 'about' && (
          <AboutPage
            onBack={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'privacy' && (
          <PrivacyPage
            onBack={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'terms' && (
          <TermsPage
            onBack={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Dedicated Favorites ("My Brewly") Page View */}
        {currentView === 'favorites' && (
          <FavoritesPage
            savedCafes={savedCafesList}
            allFavoritesIds={favorites}
            onToggleFavorite={handleToggleFavorite}
            onViewDetails={(cafe) => setSelectedCafe(cafe)}
            onViewOnMap={handleViewOnMap}
            onBackToDiscover={() => handleNavClick('discover', '#discover')}
          />
        )}

        {/* Dedicated Full Map Page View */}
        {currentView === 'map' && (
          <CafeMapSection
            cafes={filteredCafes.length > 0 ? filteredCafes : cafesData}
            selectedCafe={selectedMapCafe}
            onSelectCafe={(cafe) => setSelectedMapCafe(cafe)}
            onViewDetails={(cafe) => setSelectedCafe(cafe)}
            currentLocation={currentLocation}
            onSelectLocation={handleSelectLocation}
            userLocationCoords={userCoords}
            isStandalonePage={true}
            onBackToDiscover={() => handleNavClick('discover', '#discover')}
          />
        )}

        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <Hero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handleSearch}
              currentLocation={currentLocation}
              onSelectLocation={handleSelectLocation}
              selectedChip={selectedChip}
              setSelectedChip={(chipId) => {
                setSelectedChip(chipId);
              }}
              isRealOsmData={isRealOsmData}
            />

        {/* Results & Discovery Section */}
        <section id="results-section" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 sm:mb-10 pb-4 border-b border-[#F6EBDD]/10">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider">
                {showOnlyFavorites ? (
                  <div className="flex items-center gap-1.5 text-[#FF7676]">
                    <Heart className="w-3.5 h-3.5 fill-[#FF7676] text-[#FF7676]" />
                    <span>My Brewly</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[#A98BFF]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {searchQuery
                        ? `AI Matches for "${searchQuery}"`
                        : `Recommended Spots in ${currentLocation.split(',')[0]}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F6EBDD] font-display">
                  {showOnlyFavorites ? 'Bookmarked Spots' : 'Top Discovered Cafes'}
                </h2>
                {!showOnlyFavorites && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#6F4E37]/30 border border-[#C88A5A]/35 text-xs font-bold text-[#C88A5A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C88A5A]" />
                    <span>Sample Data</span>
                  </span>
                )}
              </div>
            </div>

            {/* Toggle / Counter Pill */}
            <div className="flex items-center gap-2">
              {showOnlyFavorites && (
                <button
                  onClick={() => setShowOnlyFavorites(false)}
                  className="px-3 py-1.5 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-xs font-semibold text-[#D8C5B5] transition-colors cursor-pointer"
                >
                  Show All Cafes
                </button>
              )}
              <span className="text-xs text-[#D8C5B5]/70 bg-[#211A16] border border-[#F6EBDD]/10 px-3 py-1.5 rounded-full font-medium tabular-nums">
                {filteredCafes.length} {filteredCafes.length === 1 ? 'cafe' : 'cafes'} {showOnlyFavorites ? 'saved' : 'found'}
              </span>
            </div>
          </div>

          {/* Active Area Banner */}
          {showOnlyFavorites ? (
            <div className="mb-6 p-4 rounded-2xl bg-[#211A16] border border-[#F6EBDD]/10 flex items-center justify-between gap-3 text-xs text-[#F6EBDD] shadow-md">
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 fill-[#FF7676] text-[#FF7676] shrink-0" />
                <span>
                  Viewing your saved favorite spots in <strong className="text-[#F6EBDD] font-semibold">My Brewly</strong>. Tap the heart on any cafe card to bookmark or remove.
                </span>
              </div>
              <span className="text-[#FF7676] font-semibold text-[11px] shrink-0 bg-[#FF7676]/15 border border-[#FF7676]/30 px-2.5 py-1 rounded-full">
                {savedCafesList.length} Saved {savedCafesList.length === 1 ? 'Spot' : 'Spots'}
              </span>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-[#211A16] border border-[#F6EBDD]/10 flex items-center justify-between gap-3 text-xs text-[#F6EBDD] shadow-md">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#C88A5A] shrink-0" />
                <span>
                  Exploring top sample cafes in <strong className="text-[#F6EBDD] font-semibold">{currentLocation}</strong>. Pick another neighborhood from the location dropdown anytime!
                </span>
              </div>
              <span className="text-[#C88A5A] font-semibold text-[11px] shrink-0 bg-[#6F4E37]/30 border border-[#C88A5A]/30 px-2.5 py-1 rounded-full">
                {filteredCafes.length} Sample Spots
              </span>
            </div>
          )}

          {/* AI Generating Indicator Banner */}
          {isGeneratingAi && (
            <div className="mb-6 p-4 rounded-2xl bg-[#A98BFF]/10 border border-[#A98BFF]/30 flex items-center justify-between gap-3 text-xs text-[#F6EBDD] animate-pulse shadow-lg">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#A98BFF] animate-spin shrink-0" />
                <span>
                  Crafting fresh, realistic cafe concepts for <strong className="text-[#A98BFF] font-semibold">{currentLocation}</strong> with Gemini AI...
                </span>
              </div>
              <span className="text-[#A98BFF] font-bold text-[11px] shrink-0 bg-[#A98BFF]/20 px-2.5 py-1 rounded-full border border-[#A98BFF]/30">
                Generating Sample Data
              </span>
            </div>
          )}

          {/* Cafe Cards Grid */}
          {filteredCafes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
              {filteredCafes.map((cafe) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  isFavorite={favorites.includes(cafe.id) || (cafe.id === 'ahm-1' && favorites.includes('kora-third-wave'))}
                  onToggleFavorite={handleToggleFavorite}
                  onViewDetails={(c) => setSelectedCafe(c)}
                  onViewOnMap={handleViewOnMap}
                />
              ))}
            </div>
          ) : showOnlyFavorites ? (
            favorites.length === 0 ? (
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
                  onClick={() => {
                    setShowOnlyFavorites(false);
                    setActiveNav('discover');
                    setCurrentView('home');
                  }}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C88A5A] hover:opacity-95 text-[#F6EBDD] text-sm font-bold transition-all shadow-lg shadow-[#6F4E37]/30 cursor-pointer active:scale-95"
                >
                  Discover Cafes
                </button>
              </div>
            ) : (
              <div className="py-16 text-center rounded-[28px] bg-[#211A16]/50 border border-[#F6EBDD]/10 p-8 max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#6F4E37]/30 border border-[#C88A5A]/30 flex items-center justify-center mx-auto mb-4">
                  <Coffee className="w-7 h-7 text-[#C88A5A]" />
                </div>
                <h3 className="text-xl font-bold text-[#F6EBDD] mb-2 font-display">
                  No saved spots match "{searchQuery}"
                </h3>
                <p className="text-sm text-[#D8C5B5] mb-6">
                  Try another keyword or clear your search to view all your saved cafes.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 rounded-full bg-[#6F4E37] hover:bg-[#855B3F] text-[#F6EBDD] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )
          ) : (
            <div className="py-16 text-center rounded-[28px] bg-[#211A16]/50 border border-[#F6EBDD]/10 p-8 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#6F4E37]/30 border border-[#C88A5A]/30 flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-7 h-7 text-[#C88A5A]" />
              </div>
              <h3 className="text-xl font-bold text-[#F6EBDD] mb-2 font-display">
                No matching cafes found
              </h3>
              <p className="text-sm text-[#D8C5B5] mb-6">
                Try searching for something else like "quiet study spot", "outdoor patio", or "specialty pour over".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedChip(null);
                  setShowOnlyFavorites(false);
                }}
                className="px-5 py-2.5 rounded-full bg-[#6F4E37] hover:bg-[#855B3F] text-[#F6EBDD] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          )}

        </section>

        {/* Explore / Why Brewly Value Proposition Section */}
        <section id="explore" className="py-16 sm:py-24 bg-[#211A16]/40 border-y border-[#F6EBDD]/8 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="max-w-2xl mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6F4E37]/25 border border-[#C88A5A]/30 text-xs font-semibold text-[#C88A5A] mb-3">
                <Coffee className="w-3.5 h-3.5" />
                <span>The Brewly Standard</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F6EBDD] font-display mb-4">
                Curated by coffee lovers, verified by real data.
              </h2>
              <p className="text-sm sm:text-base text-[#D8C5B5] leading-relaxed">
                Finding the right cafe shouldn't be guesswork. Brewly inspects speed, ambiance, plugs, and roast freshness so you can walk in with total confidence.
              </p>
            </div>

            {/* Feature Cards Grid (Asymmetric & Clean) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 sm:p-8 rounded-[24px] bg-[#211A16] border border-[#F6EBDD]/10 hover:border-[#C88A5A]/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#6FCF97]/15 border border-[#6FCF97]/30 flex items-center justify-center mb-6">
                    <Wifi className="w-6 h-6 text-[#6FCF97]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#F6EBDD] mb-2 font-display">
                    Benchmarked Wi-Fi & Outlets
                  </h3>
                  <p className="text-xs sm:text-sm text-[#D8C5B5]/80 leading-relaxed mb-6">
                    Real speed tests for remote workers. We specify exactly which tables have surge-protected sockets and quiet focus alcoves.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#F6EBDD]/8 flex items-center justify-between text-xs text-[#6FCF97] font-semibold">
                  <span>Avg. verified 140+ Mbps</span>
                  <Check className="w-4 h-4" />
                </div>
              </div>

              <div className="p-6 sm:p-8 rounded-[24px] bg-[#211A16] border border-[#F6EBDD]/10 hover:border-[#A98BFF]/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#A98BFF]/15 border border-[#A98BFF]/30 flex items-center justify-center mb-6">
                    <Volume2 className="w-6 h-6 text-[#A98BFF]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#F6EBDD] mb-2 font-display">
                    Decibel & Noise Profiling
                  </h3>
                  <p className="text-xs sm:text-sm text-[#D8C5B5]/80 leading-relaxed mb-6">
                    Whether you need pin-drop silence for exam study or a lively acoustic background for casual brainstorming, AI filters the noise level.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#F6EBDD]/8 flex items-center justify-between text-xs text-[#A98BFF] font-semibold">
                  <span>Silent to Lively index</span>
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <div className="p-6 sm:p-8 rounded-[24px] bg-[#211A16] border border-[#F6EBDD]/10 hover:border-[#C88A5A]/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#C88A5A]/15 border border-[#C88A5A]/30 flex items-center justify-center mb-6">
                    <Coffee className="w-6 h-6 text-[#C88A5A]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#F6EBDD] mb-2 font-display">
                    Single-Origin & Roast Quality
                  </h3>
                  <p className="text-xs sm:text-sm text-[#D8C5B5]/80 leading-relaxed mb-6">
                    From light roast Ethiopian micro-lots to rich Indian estate Chikmagalur beans, explore cafes that take their craft seriously.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#F6EBDD]/8 flex items-center justify-between text-xs text-[#C88A5A] font-semibold">
                  <span>Ethical direct-trade beans</span>
                  <Coffee className="w-4 h-4" />
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Interactive Cafe Map Section */}
        <CafeMapSection
          cafes={filteredCafes.length > 0 ? filteredCafes : cafesData}
          selectedCafe={selectedMapCafe}
          onSelectCafe={(cafe) => setSelectedMapCafe(cafe)}
          onViewDetails={(cafe) => setSelectedCafe(cafe)}
          currentLocation={currentLocation}
          onSelectLocation={handleSelectLocation}
          userLocationCoords={userCoords}
        />
        </>
      )}
      </main>

      {/* Cafe In-depth Details Modal */}
      <CafeModal
        cafe={selectedCafe}
        onClose={() => setSelectedCafe(null)}
        isFavorite={selectedCafe ? (favorites.includes(selectedCafe.id) || (selectedCafe.id === 'ahm-1' && favorites.includes('kora-third-wave'))) : false}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        onViewOnMap={handleViewOnMap}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Footer */}
      <Footer
        onNavClick={handleNavClick}
        onOpenPage={(page) => {
          setCurrentView(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Global Smooth Scroll to Top Button */}
      <ScrollToTop />

    </div>
  );
}
