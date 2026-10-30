/**
 * @file PullToRefreshIndicator.tsx
 * @description Indicador visual flutuante para a funcionalidade Puxar para Atualizar (Pull-To-Refresh).
 * Exibe animação circular fluida, ícone da chama de ativação metabólica e mensagens de status humanizadas.
 */

import React from 'react';
import { RefreshCw, Flame, ArrowDown } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  /** Distância atual em pixels do puxão */
  pullDistance: number;
  /** Indica se o gesto de arrasto está ativo */
  isPulling: boolean;
  /** Indica se o aplicativo está recarregando os dados no Firestore */
  isRefreshing: boolean;
  /** Indica se o limite de liberação foi ultrapassado */
  isThresholdReached: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isPulling,
  isRefreshing,
  isThresholdReached,
}) => {
  // Oculta o indicador se o usuário não estiver puxando e nem recarregando
  if (pullDistance <= 0 && !isRefreshing) return null;

  // Rotação do ícone proporcional à distância puxada
  const anguloRotacao = Math.min(360, (pullDistance / 65) * 360);

  return (
    <div 
      className="w-full flex justify-center items-center overflow-hidden transition-all duration-200 ease-out z-30 pointer-events-none select-none"
      style={{ 
        height: `${pullDistance}px`,
        opacity: Math.min(1, pullDistance / 40)
      }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-emerald-100 text-xs font-bold text-[#092244] animate-in fade-in zoom-in-90 duration-150">
        
        {/* Ícone Animado */}
        {isRefreshing ? (
          <RefreshCw className="w-4 h-4 text-[#00C975] animate-spin" />
        ) : isThresholdReached ? (
          <Flame className="w-4 h-4 text-[#00C975] fill-[#00C975] animate-bounce" />
        ) : (
          <ArrowDown 
            className="w-4 h-4 text-emerald-600 transition-transform duration-100" 
            style={{ transform: `rotate(${anguloRotacao}deg)` }}
          />
        )}

        {/* Mensagem do Estado */}
        <span className="text-[12px] font-extrabold tracking-tight text-[#092244]">
          {isRefreshing 
            ? 'Sincronizando dados...' 
            : isThresholdReached 
              ? 'Solte para atualizar' 
              : 'Puxe para atualizar'}
        </span>
      </div>
    </div>
  );
};
