import React from 'react';
import { FileText, ArrowLeft, CheckCircle2, AlertCircle, Coffee } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C88A5A]/15 border border-[#C88A5A]/30 text-xs font-semibold text-[#C88A5A] mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>Terms of Service</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F6EBDD] font-display tracking-tight mb-3">
          Terms of Use
        </h1>
        <p className="text-xs sm:text-sm text-[#D8C5B5]/70">
          Effective Date: September 2026 · Brewly by Pradipsinh
        </p>
      </div>

      {/* Terms Body */}
      <div className="space-y-8 text-sm text-[#D8C5B5]/85 leading-relaxed border-t border-[#F6EBDD]/10 pt-8">
        
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Brewly, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the application. Brewly is a discovery tool provided by Pradipsinh for informational and exploration purposes.
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2">
            2. Cafe Information & Data Accuracy
          </h2>
          <p className="mb-2">
            Brewly provides cafe details, ratings, Wi-Fi benchmarks, outlet counts, operating hours, and menu estimates. While we strive to maintain accurate data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>Operating hours, seasonal menus, and pricing are set independently by cafe management and may fluctuate.</li>
            <li>Wi-Fi speeds and noise decibel levels are sampled benchmarks and may vary based on cafe patronage and peak hours.</li>
            <li>We recommend calling the cafe directly if you have specific timing or seating reservation requirements.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2">
            3. Permitted Platform Use
          </h2>
          <p>
            You agree to use Brewly solely for personal, non-commercial cafe discovery and exploration. You may not scrape, reverse-engineer, or systematically extract cafe information or algorithmic scores without written permission from Pradipsinh.
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2">
            4. External Navigation & Maps
          </h2>
          <p>
            Brewly utilizes Google Maps Platform to provide map views and route links. Brewly is not responsible for road closures, traffic conditions, or transit delays encountered when navigating to venues.
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2">
            5. Intellectual Property
          </h2>
          <p>
            The Brewly brand, logo lockup, user interface designs, and recommendation algorithms are owned by Pradipsinh. All third-party trademarks and cafe trade names remain the property of their respective owners.
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F6EBDD] font-display mb-2">
            6. Limitation of Liability
          </h2>
          <p>
            Brewly is provided "as is" without warranty of any kind. Under no circumstances shall Pradipsinh or Brewly be liable for any indirect, incidental, or consequential damages arising from the use of the platform.
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
