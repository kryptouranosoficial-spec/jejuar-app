/**
 * @file CardMetricasGamificadas.tsx
 * @description Painel 4x1 de métricas vitais e gamificadas do perfil do usuário:
 * Streak de Consistência (Chamas), Horas Totais Jejuadas, Litros de Água e Conquistas.
 * Implementa formatação direta até 9999, conversão para "+10 Mil" acima de 9999
 * e escala tipográfica dinâmica para nunca quebrar linha em telas mobile.
 */

import React from 'react';
import { Flame, Clock, Droplets, Trophy } from 'lucide-react';
import type { MetricasGamificacaoUsuario } from '../../types';
import {
  formatarMetricaSequenciaDiasCard,
  formatarMetricaHorasJejumCard,
  formatarMetricaAguaLitrosCard,
  obterClasseTamanhoFonteCardMetrica,
} from '../../utils/perfilUtils';

interface CardMetricasGamificadasProps {
  metricas: MetricasGamificacaoUsuario;
  onVerConquistas: () => void;
}

export const CardMetricasGamificadas: React.FC<CardMetricasGamificadasProps> = ({
  metricas,
  onVerConquistas,
}) => {
  // Textos formatados de acordo com a regra estratégica (direto até 9999 e "+10 Mil" acima de 9999)
  const textoSequencia = formatarMetricaSequenciaDiasCard(metricas.diasConsecutivos);
  const textoHorasJejum = formatarMetricaHorasJejumCard(metricas.totalHorasJejum);
  const textoAguaLitros = formatarMetricaAguaLitrosCard(metricas.totalAguaConsumidaLitros);
  const textoTrofeus = `${metricas.conquistasDesbloqueadasTotal}/${metricas.conquistasDisponiveisTotal}`;

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. Dias Consecutivos (Streak) */}
      <div className="bg-white rounded-2xl px-2 py-3 border border-slate-100 shadow-2xs flex flex-col items-center justify-between text-center min-h-[104px]">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-1.5 shadow-2xs shrink-0">
          <Flame className="w-4 h-4 fill-amber-400" />
        </div>
        <span
          className={`${obterClasseTamanhoFonteCardMetrica(textoSequencia)} font-black text-[#0B2246] leading-none mb-1 whitespace-nowrap`}
        >
          {textoSequencia}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
          Sequência
        </span>
      </div>

      {/* 2. Horas Totais de Jejum Concluídas */}
      <div className="bg-white rounded-2xl px-2 py-3 border border-slate-100 shadow-2xs flex flex-col items-center justify-between text-center min-h-[104px]">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00C975] flex items-center justify-center mb-1.5 shadow-2xs shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <span
          className={`${obterClasseTamanhoFonteCardMetrica(textoHorasJejum)} font-black text-[#0B2246] leading-none mb-1 whitespace-nowrap`}
        >
          {textoHorasJejum}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
          Jejuadas
        </span>
      </div>

      {/* 3. Hidratação Total Acumulada */}
      <div className="bg-white rounded-2xl px-2 py-3 border border-slate-100 shadow-2xs flex flex-col items-center justify-between text-center min-h-[104px]">
        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center mb-1.5 shadow-2xs shrink-0">
          <Droplets className="w-4 h-4" />
        </div>
        <span
          className={`${obterClasseTamanhoFonteCardMetrica(textoAguaLitros)} font-black text-[#0B2246] leading-none mb-1 whitespace-nowrap`}
        >
          {textoAguaLitros}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
          Água Bebida
        </span>
      </div>

      {/* 4. Conquistas Desbloqueadas (Clicável) */}
      <div
        onClick={onVerConquistas}
        role="button"
        tabIndex={0}
        aria-label="Abrir galeria de conquistas"
        className="bg-white hover:bg-slate-50/80 rounded-2xl px-2 py-3 border border-slate-100 shadow-2xs flex flex-col items-center justify-between text-center min-h-[104px] cursor-pointer active:scale-95 transition-all group"
      >
        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <span
          className={`${obterClasseTamanhoFonteCardMetrica(textoTrofeus)} font-black text-purple-700 leading-none mb-1 whitespace-nowrap`}
        >
          {textoTrofeus}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight group-hover:text-purple-600 transition-colors">
          Troféus
        </span>
      </div>
    </div>
  );
};
