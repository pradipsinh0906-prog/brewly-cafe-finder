import React from 'react';
import { CheckCircle2, Sparkles, Heart } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'favorite' | 'ai';
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#211A16] border border-[#F6EBDD]/15 shadow-2xl text-xs sm:text-sm text-[#F6EBDD] font-medium backdrop-blur-md">
        {type === 'favorite' ? (
          <Heart className="w-4 h-4 fill-[#FF7676] text-[#FF7676]" />
        ) : type === 'ai' ? (
          <Sparkles className="w-4 h-4 text-[#A98BFF]" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-[#6FCF97]" />
        )}
        <span>{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 text-[#D8C5B5]/60 hover:text-[#F6EBDD] text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
