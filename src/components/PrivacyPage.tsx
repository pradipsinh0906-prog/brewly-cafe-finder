import React from 'react';
import { Shield, ArrowLeft, Lock, Eye, MapPin, Database, CheckCircle2 } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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

      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6FCF97]/15 border border-[#6FCF97]/30 text-xs font-semibold text-[#6FCF97] mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy Policy</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F6EBDD] font-display tracking-tight mb-3">
          Your Privacy at Brewly
        </h1>
        <p className="text-xs sm:text-sm text-[#D8C5B5]/70">
          Last Updated: September 2026 · Maintained by Pradipsinh
        </p>
      </div>

      {/* Summary card */}
      <div className="p-6 rounded-[22px] bg-[#211A16] border border-[#F6EBDD]/10 mb-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#6FCF97]/15 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-[#6FCF97]" />
        </div>
        <div>
          <h3 className="font-bold text-sm sm:text-base text-[#F6EBDD] mb-1 font-display">
            The Brewly Privacy Promise
          </h3>
          <p className="text-xs sm:text-sm text-[#D8C5B5] leading-relaxed">
            We believe location data belongs to you. When you tap "Use my location", your GPS coordinates are used exclusively in your browser session to calculate walking distances and render map pins. We never sell, auction, or profile your personal data.
          </p>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="space-y-8 text-sm text-[#D8C5B5]/85 leading-relaxed border-t border-[#F6EBDD]/10 pt-8">
        
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#C88A5A]" />
            <span>1. Information We Collect</span>
          </h2>
          <p className="mb-2">
            Brewly collects minimal information necessary to deliver cafe recommendations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-[#F6EBDD]">Precise Geolocation (Optional):</strong> With your browser permission, we access your device latitude and longitude through <code className="text-[#A98BFF]">navigator.geolocation</code>.
            </li>
            <li>
              <strong className="text-[#F6EBDD]">Search & Filter Queries:</strong> Text entered into the search bar or prompt chips (e.g., "quiet study cafe") is processed to rank matching results.
            </li>
            <li>
              <strong className="text-[#F6EBDD]">Client-Side Favorites:</strong> Bookmarked cafes are stored directly in your browser's local memory for your convenience.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#A98BFF]" />
            <span>2. How Your Information Is Used</span>
          </h2>
          <p className="mb-2">
            Information collected is strictly utilized to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>Center the interactive map on your neighborhood.</li>
            <li>Calculate accurate walking and driving distances to cafes.</li>
            <li>Display localized coffee options and neighborhood pulse statistics.</li>
            <li>Direct you seamlessly to Google Maps navigation when you click "Get Directions".</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#6FCF97]" />
            <span>3. Third-Party Services</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Brewly incorporates Google Maps Platform APIs for rendering map tiles, pins, and navigation. Use of Google Maps is subject to the Google Privacy Policy. We do not embed covert advertising pixels or third-party behavioral trackers.
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2">
            4. User Rights and Controls
          </h2>
          <p className="text-xs sm:text-sm">
            You can revoke location permissions at any time through your browser settings. You can also select preset coffee hubs (e.g., Indiranagar, Bandra West) without enabling GPS.
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2">
            5. Contact
          </h2>
          <p className="text-xs sm:text-sm">
            If you have questions regarding this policy or data practices, contact Pradipsinh at <span className="text-[#C88A5A]">privacy@brewly.coffee</span>.
          </p>
        </div>

      </div>

      {/* Return button */}
      <div className="mt-12 text-center">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full bg-[#211A16] hover:bg-[#2A211C] border border-[#F6EBDD]/15 text-xs sm:text-sm font-semibold text-[#F6EBDD] transition-colors cursor-pointer"
        >
          Return to Brewly
        </button>
      </div>

    </div>
  );
};
