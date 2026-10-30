/**
 * @file OnboardingStep4.tsx
 * @description Quarta tela de apresentação (Onboarding - Passo 4) do aplicativo Jejuar.
 * Título: "Perca peso & ganhe saúde"
 * Subtítulo: "Veja mudanças reais no seu corpo e na sua vida com o jejum"
 * Apresenta hero fotográfico do casal jovem em forma na cozinha com estilo de vida saudável.
 */

import React, { useState } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { BotaoProximo } from './BotaoProximo';

interface OnboardingStep4Props {
  /** Callback para avançar e concluir o onboarding */
  onAvancar: () => void;
  /** Callback para retornar à etapa anterior (Passo 3) */
  onVoltar: () => void;
}

export const OnboardingStep4: React.FC<OnboardingStep4Props> = ({ onAvancar, onVoltar }) => {
  const [imagemErro, setImagemErro] = useState(false);

  return (
    <div className="relative w-full min-h-screen bg-white flex flex-col justify-between overflow-hidden select-none">
      {/* Botão de retorno superior */}
      <div className="absolute top-4 left-4 z-30 pt-safe">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar para o passo anterior"
          className="w-10 h-10 rounded-full bg-white/85 backdrop-blur-md border border-white/70 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Visual Fotográfico Superior (~58% de altura) */}
      <div 
        className="relative w-full h-[58vh] min-h-[350px] max-h-[500px] overflow-hidden bg-slate-100 flex items-center justify-center"
        data-purpose="hero-image-container"
      >
        {!imagemErro ? (
          <img
            src="/assets/aistudio/onboarding_04.jpg"
            alt="Casal jovem em forma e sorridente na cozinha com smoothie verde saudável"
            className="w-full h-full object-cover object-center select-none"
            onError={() => setImagemErro(true)}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center border border-emerald-200 mb-3">
              <Heart className="w-10 h-10 text-[#00C975]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Transformação real e duradoura</p>
          </div>
        )}

        {/* Gradiente sutil no topo para contraste suave */}
        <div 
          className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 via-black/5 to-transparent pointer-events-none" 
          aria-hidden="true" 
        />
      </div>

      {/* Bottom Sheet com cantos arredondados sobrepostos à foto */}
      <section 
        className="relative -mt-7 pt-8 pb-8 px-7 bg-white rounded-t-[34px] shadow-[0_-10px_30px_-4px_rgba(15,23,42,0.08)] z-20 flex flex-col justify-between pb-safe"
        data-purpose="onboarding-sheet"
      >
        {/* Título e Subtítulo */}
        <header className="flex flex-col items-center text-center mt-1">
          <h1 className="text-[#0B2253] text-[28px] leading-[34px] font-extrabold tracking-tight">
            Perca peso &amp; ganhe<br />saúde
          </h1>
          <p className="mt-3.5 text-[#475569] text-[16px] leading-[23px] font-medium max-w-[280px]">
            Veja mudanças reais no seu corpo e na sua vida com o jejum
          </p>
        </header>

        {/* Indicador de Passos e Botão de Ação */}
        <div className="w-full flex flex-col items-center mt-6 pb-1">
          {/* Indicador de Pontos do Carrossel (Passo 4 de 4 ativo) */}
          <nav 
            aria-label="Progresso do onboarding: tela 4 de 4" 
            className="flex items-center justify-center gap-2 mb-6" 
            data-purpose="pagination-indicator"
          >
            {/* Passo 1 (Inativo) */}
            <span className="w-2 h-2 rounded-full bg-[#E2E8F0]" title="Passo 1" />
            {/* Passo 2 (Inativo) */}
            <span className="w-2 h-2 rounded-full bg-[#E2E8F0]" title="Passo 2" />
            {/* Passo 3 (Inativo) */}
            <span className="w-2 h-2 rounded-full bg-[#E2E8F0]" title="Passo 3" />
            {/* Passo 4 (Ativo em Verde com Anel de Destaque) */}
            <span 
              aria-current="step" 
              className="w-2.5 h-2.5 rounded-full bg-[#00C975] ring-2 ring-[#00C975]/30 transition-all duration-300" 
              title="Passo 4 de 4" 
            />
          </nav>

          {/* Botão Primário "Próximo" com Seta Animada */}
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
