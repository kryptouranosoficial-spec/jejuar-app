/**
 * @file BotaoProximo.tsx
 * @description Botão de ação primária "Próximo" para o fluxo de Onboarding.
 * Apresenta uma única seta elegante (ChevronRight) com micro-interação animada
 * de deslocamento horizontal contínuo (ping-pong suave) convidando ao clique.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface BotaoProximoProps {
  /** Ação ao clicar no botão */
  onClick: () => void;
  /** Texto opcional do botão, padrão "Próximo" */
  rotulo?: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Desabilitar clique */
  disabled?: boolean;
}

export const BotaoProximo: React.FC<BotaoProximoProps> = ({
  onClick,
  rotulo = 'Próximo',
  className = '',
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${rotulo} tela`}
      className={`relative w-full h-[58px] bg-[#00C975] hover:bg-[#00b568] active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[18px] rounded-full flex items-center justify-center transition-all duration-150 shadow-md hover:shadow-lg shadow-[#00C975]/25 focus:outline-none focus:ring-4 focus:ring-[#00C975]/30 min-h-[44px] ${className}`}
    >
      {/* Texto centralizado */}
      <span className="tracking-wide">{rotulo}</span>

      {/* Seta animada com movimento contínuo horizontal sutil para convidar ao clique */}
      <div className="absolute right-5 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.6] text-white" />
        </motion.div>
      </div>
    </button>
  );
};
