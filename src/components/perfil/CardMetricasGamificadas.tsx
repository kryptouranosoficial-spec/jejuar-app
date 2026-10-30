/**
 * @file CardMetricasGamificadas.tsx
 * @description Painel 4x1 de métricas vitais e gamificadas do perfil do usuário:
 * Streak de Consistência (Chamas), Horas Totais Jejuadas, Litros de Água e Conquistas.
 */

import React from 'react';
import { Flame, Clock, Droplets, Trophy } from 'lucide-react';
import type { MetricasGamificacaoUsuario } from '../../types';

interface CardMetricasGamificadasProps {
  metricas: MetricasGamificacaoUsuario;
  onVerConquistas: () => void;
}

export const CardMetricasGamificadas: React.FC<CardMetricasGamificadasProps> = ({
  metricas,
  onVerConquistas,
}) => {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. Dias Consecutivos (Streak) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex flex-col items-center text-center">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-1.5 shadow-2xs">
          <Flame className="w-4 h-4 fill-amber-400" />
        </div>
        <span className="text-base font-black text-[#0B2246] leading-none mb-0.5">
          {metricas.diasConsecutivos} {metricas.diasConsecutivos === 1 ? 'dia' : 'dias'}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Sequência
        </span>
      </div>

      {/* 2. Horas Totais de Jejum */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex flex-col items-center text-center">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00C975] flex items-center justify-center mb-1.5 shadow-2xs">
          <Clock className="w-4 h-4" />
        </div>
        <span className="text-base font-black text-[#0B2246] leading-none mb-0.5">
          {metricas.totalHorasJejum}h
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Jejuadas
        </span>
      </div>

      {/* 3. Hidratação Total */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex flex-col items-center text-center">
        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center mb-1.5 shadow-2xs">
          <Droplets className="w-4 h-4" />
        </div>
        <span className="text-base font-black text-[#0B2246] leading-none mb-0.5">
          {metricas.totalAguaConsumidaLitros}L
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Água Bebida
        </span>
      </div>

      {/* 4. Conquistas Desbloqueadas (Clicável) */}
      <div 
        onClick={onVerConquistas}
        role="button"
        tabIndex={0}
        aria-label="Abrir galeria de conquistas"
        className="bg-white hover:bg-slate-50/80 rounded-2xl p-3 border border-slate-100 shadow-2xs flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all group"
      >
        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
          <Trophy className="w-4 h-4" />
        </div>
        <span className="text-base font-black text-purple-700 leading-none mb-0.5">
          {metricas.conquistasDesbloqueadasTotal}/{metricas.conquistasDisponiveisTotal}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
          Troféus
        </span>
      </div>
    </div>
  );
};
