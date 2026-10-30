/**
 * @file OnboardingStep2.tsx
 * @description Segunda tela de apresentação (Onboarding - Passo 2) do aplicativo Jejuar.
 * Título: "Plano de jejum personalizado"
 * Subtítulo: "Personalize um plano que se ajuste ao seu horário, objetivos e hábitos"
 * Apresenta hero fotográfico oficial de alta fidelidade com os protocolos (16:8, 18:6 e 20:4) perfeitamente circulares.
 */

import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { BotaoProximo } from './BotaoProximo';

interface OnboardingStep2Props {
  /** Callback para avançar para a próxima etapa */
  onAvancar: () => void;
  /** Callback para retornar à etapa anterior */
  onVoltar: () => void;
}

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({ onAvancar, onVoltar }) => {
  const [imagemErro, setImagemErro] = useState(false);

  return (
    <div className="relative w-full min-h-screen bg-white flex flex-col justify-between overflow-hidden select-none">
      {/* Botão de retorno superior */}
      <div className="absolute top-4 left-4 z-30 pt-safe">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar para a tela anterior"
          className="w-10 h-10 rounded-full bg-white/85 backdrop-blur-md border border-white/70 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Visual Fotográfico Oficial com os 3 Relógios de Jejum Perfeitamente Circulares */}
      <div 
        className="relative w-full h-[58vh] min-h-[350px] max-h-[500px] overflow-hidden bg-neutral-100 flex items-center justify-center"
        data-purpose="hero-image-wrapper"
      >
        {!imagemErro ? (
          <img
            src="/assets/aistudio/onboarding_02_hero.png"
            alt="Nutricionista com cesta de alimentos frescos e protocolos de jejum 16:8, 18:6 e 20:4"
            className="w-full h-full object-cover object-top select-none"
            onError={() => setImagemErro(true)}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center border border-emerald-200 mb-3">
              <Sparkles className="w-10 h-10 text-[#00C874]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Protocolos cientificamente comprovados</p>
          </div>
        )}
      </div>

      {/* Bottom Sheet com cantos arredondados sobrepostos à foto */}
      <section 
        className="relative -mt-7 pt-7 pb-8 px-6 bg-white rounded-t-[34px] shadow-[0_-8px_25px_-4px_rgba(0,0,0,0.08),0_-4px_10px_-2px_rgba(0,0,0,0.04)] z-20 flex flex-col justify-between pb-safe"
        data-purpose="bottom-content-sheet"
      >
        {/* Título e Subtítulo */}
        <header className="text-center space-y-3 mb-6 px-1">
          <h1 className="text-[27px] sm:text-[30px] font-extrabold leading-[1.2] text-[#0A2540] tracking-[-0.02em]">
            Plano de jejum<br />personalizado
          </h1>
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#2D3E50]/90 font-medium max-w-[310px] mx-auto">
            Personalize um plano que se ajuste ao seu horário, objetivos e hábitos
          </p>
        </header>

        {/* Indicador de Passos de Navegação (Passo 2 de 4 ativo) */}
        <nav 
          aria-label="Progresso do onboarding" 
          className="flex items-center justify-center space-x-2.5 mb-6" 
          data-purpose="pagination-indicator"
        >
          {/* Passo 1 (Inativo) */}
          <span className="w-2 h-2 rounded-full bg-[#E2E8F0]" title="Passo 1" />
          {/* Passo 2 (Ativo em Verde) */}
          <span 
            aria-current="step" 
            className="w-2.5 h-2.5 rounded-full bg-[#00C874] transition-all duration-300" 
            title="Passo 2 de 4" 
          />
          {/* Passo 3 (Inativo) */}
          <span className="w-2 h-2 rounded-full bg-[#E2E8F0]" title="Passo 3" />
          {/* Passo 4 (Inativo) */}
          <span className="w-2 h-2 rounded-full bg-[#E2E8F0]" title="Passo 4" />
        </nav>

        {/* Botão Primário "Próximo" com Seta Animada */}
        <div className="w-full pb-1" data-purpose="cta-container">
          <BotaoProximo onClick={onAvancar} />
        </div>

        {/* Barra decorativa do indicador de gestos do iOS */}
        <div aria-hidden="true" className="mt-3 flex justify-center w-full">
          <div className="w-32 h-1 bg-slate-200/80 rounded-full" />
        </div>
      </section>
    </div>
  );
};
