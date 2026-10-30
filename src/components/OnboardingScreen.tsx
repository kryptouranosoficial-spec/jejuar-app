/**
 * @file OnboardingScreen.tsx
 * @description Orquestrador do carrossel contínuo das telas de Onboarding do aplicativo Jejuar.
 * Utiliza esteira horizontal nativa (filmstrip) com física spring suave (60 FPS),
 * eliminando qualquer tela em branco entre os passos 1, 2, 3 e 4.
 */

import React, { useState } from 'react';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { motion } from 'motion/react';
import { OnboardingStep2 } from './OnboardingStep2';
import { OnboardingStep3 } from './OnboardingStep3';
import { OnboardingStep4 } from './OnboardingStep4';
import { BotaoProximo } from './BotaoProximo';

interface OnboardingScreenProps {
  /** Callback acionado ao concluir o fluxo de onboarding */
  onAvancar: () => void;
  /** Callback para retornar à tela de Boas-Vindas */
  onVoltar: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onAvancar, onVoltar }) => {
  // Estado que controla o passo ativo do onboarding (1 a 4)
  const [passoAtivo, setPassoAtivo] = useState<number>(1);
  const [imagemErroPasso1, setImagemErroPasso1] = useState(false);

  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden select-none">
      {/* 
        Esteira Horizontal Contínua (Horizontal Track)
        Todas as 4 telas ficam conectadas lado a lado.
        Ao mudar de passo, a esteira inteira desliza suavemente sem intervalos em branco.
      */}
      <motion.div
        className="flex w-full h-full min-h-screen"
        animate={{ x: `-${(passoAtivo - 1) * 100}%` }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 30,
          mass: 0.8,
        }}
      >
        {/* ==================== PASSO 1: Sem dieta, sem restrições ==================== */}
        <div className="w-full min-w-full flex-shrink-0 min-h-screen flex flex-col justify-between relative bg-white">
          {/* Botão de retorno para a tela de Boas-Vindas */}
          <div className="absolute top-4 left-4 z-30 pt-safe">
            <button
              type="button"
              onClick={onVoltar}
              aria-label="Voltar para a tela de boas-vindas"
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Hero Fotográfico Superior (~58% de altura) */}
          <div 
            className="relative w-full h-[58vh] min-h-[340px] max-h-[490px] overflow-hidden bg-neutral-100 flex items-center justify-center"
            data-purpose="hero-image-wrapper"
          >
            {!imagemErroPasso1 ? (
              <img
                src="/assets/aistudio/onboarding_01.jpg"
                alt="Pessoa feliz aproveitando sua refeição favorita na janela de alimentação"
                className="w-full h-full object-cover object-top transition-opacity duration-300"
                onError={() => setImagemErroPasso1(true)}
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center border border-emerald-200 mb-3">
                  <UtensilsCrossed className="w-10 h-10 text-[#00C975]" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Alimentação livre na sua janela</p>
              </div>
            )}
          </div>

          {/* Bottom Sheet com cantos arredondados sobrepostos à foto */}
          <section 
            className="relative -mt-8 flex-1 bg-white rounded-t-[32px] pt-7 pb-8 px-6 flex flex-col justify-between z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-safe"
            data-purpose="bottom-sheet"
          >
            {/* Bloco de Informações Textuais */}
            <div className="flex flex-col items-center text-center mt-1 px-2">
              <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0B2545] leading-tight tracking-tight">
                Sem dieta, sem<br />restrições alimentares
              </h1>

              <p className="mt-3.5 text-[17px] text-[#334155] font-medium leading-relaxed max-w-[280px]">
                Coma o que você ama quando não estiver em jejum
              </p>
            </div>

            {/* Controles de Ação e Indicador de Paginação */}
            <div className="flex flex-col items-center w-full gap-6 pb-2">
              {/* Indicador de Pontos do Carrossel (Passo 1 de 4 ativo) */}
              <div 
                aria-label="Passos de introdução" 
                className="flex items-center justify-center gap-2" 
                data-purpose="carousel-dots" 
                role="tablist"
              >
                {/* Ponto 1 (Ativo em Verde Esmeralda) */}
                <span 
                  aria-current="step" 
                  className="w-2.5 h-2.5 rounded-full bg-[#00C975] transition-all" 
                  title="Passo 1 de 4"
                />
                {/* Pontos 2, 3 e 4 (Inativos) */}
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 transition-all" title="Passo 2" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 transition-all" title="Passo 3" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 transition-all" title="Passo 4" />
              </div>

              {/* Botão Primário "Próximo" -> Desliza para o Passo 2 */}
              <BotaoProximo onClick={() => setPassoAtivo(2)} />
            </div>
          </section>
        </div>

        {/* ==================== PASSO 2: Plano de jejum personalizado ==================== */}
        <div className="w-full min-w-full flex-shrink-0 min-h-screen">
          <OnboardingStep2
            onAvancar={() => setPassoAtivo(3)}
            onVoltar={() => setPassoAtivo(1)}
          />
        </div>

        {/* ==================== PASSO 3: Amigável para iniciantes ==================== */}
        <div className="w-full min-w-full flex-shrink-0 min-h-screen">
          <OnboardingStep3
            onAvancar={() => setPassoAtivo(4)}
            onVoltar={() => setPassoAtivo(2)}
          />
        </div>

        {/* ==================== PASSO 4: Perca peso & ganhe saúde ==================== */}
        <div className="w-full min-w-full flex-shrink-0 min-h-screen">
          <OnboardingStep4
            onAvancar={onAvancar}
            onVoltar={() => setPassoAtivo(3)}
          />
        </div>
      </motion.div>
    </div>
  );
};
