/**
 * @file BannerEducativoJejum.tsx
 * @description Card educativo do Dashboard Inicial sobre os benefícios do jejum
 * com ilustração visual do prato e chamada "Saiba Mais".
 */

import React from 'react';

export const BannerEducativoJejum: React.FC = () => {
  return (
    <section 
      className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center justify-between relative overflow-hidden select-none" 
      data-purpose="learning-card"
    >
      <div className="flex-1 pr-3 z-10">
        <p className="text-[13px] font-bold text-[#092244] leading-snug mb-3 max-w-[190px]">
          A verdade sobre o jejum, desbloqueie o seu melhor jejum
        </p>
        <button 
          type="button"
          className="inline-block px-4 py-1.5 rounded-full border-[1.8px] border-[#F5A623] text-[#E08A00] font-bold text-xs bg-white hover:bg-amber-50 active:scale-95 transition-all min-h-[36px] cursor-pointer"
        >
          Saiba Mais
        </button>
      </div>

      {/* Ilustração Gráfica do Prato e Refeições */}
      <div className="w-24 h-24 relative flex-shrink-0 flex items-center justify-center pointer-events-none">
        <div className="w-20 h-20 rounded-full bg-[#F9FAFB] border-4 border-[#EEF2F6] shadow-inner flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[#FFF5DB] opacity-70" />
          <span className="absolute bottom-1 text-sm">🥛</span>
          <div className="w-5 h-3 bg-emerald-400 rounded-t-full mb-2 opacity-80" />
        </div>
        <span className="absolute -top-1 left-2 text-xs">🍞</span>
        <span className="absolute top-1 right-2 text-xs">🥑</span>
        <span className="absolute bottom-2 left-0 text-xs">🫐</span>
      </div>
    </section>
  );
};
