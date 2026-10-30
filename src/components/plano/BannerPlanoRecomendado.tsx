/**
 * @file BannerPlanoRecomendado.tsx
 * @description Hero Banner do topo da tela de Planos.
 * Destaca o plano personalizado calculado com base nas metas do onboarding.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface BannerPlanoRecomendadoProps {
  onVerificar: () => void;
}

export const BannerPlanoRecomendado: React.FC<BannerPlanoRecomendadoProps> = ({
  onVerificar,
}) => {
  return (
    <section 
      className="relative w-full rounded-3xl overflow-hidden p-6 mb-6 shadow-xs bg-gradient-to-br from-[#EFF4FF] via-[#E5EEFF] to-[#D3E4FE] border border-blue-100/60 select-none" 
      data-purpose="hero-custom-plan"
    >
      <div className="relative z-10 flex flex-col max-w-[70%]">
        <h2 className="text-[21px] font-extrabold text-[#0B1C30] mb-1 leading-tight tracking-tight">
          Plano Personalizado
        </h2>
        <p className="text-[13px] text-[#3C4A3F] mb-4 leading-snug font-medium">
          Alcance seu objetivo mais rápido.
        </p>
        <button 
          type="button"
          onClick={onVerificar}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#00C975] hover:bg-[#00B568] text-white text-xs font-extrabold shadow-[0_4px_12px_rgba(0,201,117,0.3)] active:scale-95 transition-all w-fit min-h-[44px] cursor-pointer"
        >
          <span>Verificar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Ilustração Gráfica Vetorial de Relógio e Metabolismo */}
      <div className="absolute -right-3 -bottom-2 w-36 h-36 flex items-center justify-center pointer-events-none opacity-90">
        <svg className="w-full h-full" fill="none" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="80" fill="#00C975" fillOpacity="0.12" r="64" />
          <circle cx="80" cy="80" fill="#00C975" fillOpacity="0.18" r="48" />
          <path d="M80 40V80L108 94" stroke="#006D3D" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5" />
          <circle cx="80" cy="80" fill="#006D3D" r="5.5" />
          <path d="M124 50C124 50 134 62 134 76C134 90 123 100 123 100" stroke="#00C975" strokeLinecap="round" strokeWidth="3" />
          <path d="M38 108C38 108 26 96 26 80C26 64 38 52 38 52" stroke="#F39D08" strokeLinecap="round" strokeWidth="3" />
          <circle cx="120" cy="46" fill="#00C975" r="4" />
          <circle cx="40" cy="112" fill="#F39D08" r="4" />
        </svg>
      </div>
    </section>
  );
};
