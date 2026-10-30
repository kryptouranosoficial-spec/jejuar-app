/**
 * @file AneisMetabolicosTriplos.tsx
 * @description Barra compacta horizontal de Anéis Metabólicos Triplos de Fechamento Diário.
 * Representa os 3 pilares biológicos do hábito (Jejum, Hidratação Dinâmica e Registro Corporal).
 * Disposição vertical inteligente inspirada no padrão Apple Fitness / Health, garantindo
 * tipografia 100% legível, sem cortes e com touch target ergonômico.
 */

import React from 'react';
import { Flame, Droplet, Scale, Plus, Check } from 'lucide-react';
import { vibrarSucesso, vibrarClique } from '../../utils/haptics';

interface AneisMetabolicosTriplosProps {
  /** Horas atuais em jejum ou concluídas hoje */
  horasJejum: number;
  /** Meta de horas estipulada pelo protocolo */
  metaHorasJejum: number;
  /** Volume de água consumido hoje em ml */
  aguaConsumidaMl: number;
  /** Meta diária de água em ml */
  metaAguaMl: number;
  /** Se o usuário já registrou o peso ou bioimpedância hoje */
  pesoRegistradoHoje: boolean;
  /** Peso atual registrado em kg */
  pesoAtualKg?: number;
  /** Callback para adicionar rapidamente 250ml de água com 1 toque */
  onAdicionarAguaRapida: (ml: number) => void;
  /** Callback para abrir o rastreador completo de água */
  onAbrirRastreadorAgua: () => void;
  /** Callback para abrir a tela de registro de dados corporais/peso */
  onAbrirDadosCorporais: () => void;
  /** Callback para abrir o modal de detalhes do jejum */
  onVerDetalhesJejum?: () => void;
}

export const AneisMetabolicosTriplos: React.FC<AneisMetabolicosTriplosProps> = ({
  horasJejum,
  metaHorasJejum,
  aguaConsumidaMl,
  metaAguaMl,
  pesoRegistradoHoje,
  pesoAtualKg,
  onAdicionarAguaRapida,
  onAbrirRastreadorAgua,
  onAbrirDadosCorporais,
  onVerDetalhesJejum,
}) => {
  // Cálculo de porcentagens limitadas e formatadas
  const metaHorasSegura = metaHorasJejum > 0 ? metaHorasJejum : 16;
  const porcentagemJejum = Math.min(100, Math.round((horasJejum / metaHorasSegura) * 100));
  const jejumConcluido = horasJejum >= metaHorasSegura;

  const metaAguaSegura = metaAguaMl > 0 ? metaAguaMl : 2000;
  const porcentagemAgua = Math.min(100, Math.round((aguaConsumidaMl / metaAguaSegura) * 100));
  const aguaConcluida = aguaConsumidaMl >= metaAguaSegura;

  // Circunferência do círculo para raio de 18px: 2 * PI * 18 ≈ 113.1
  const raioCirculo = 18;
  const circunferencia = 2 * Math.PI * raioCirculo;

  const strokeDashJejum = (porcentagemJejum / 100) * circunferencia;
  const strokeDashAgua = (porcentagemAgua / 100) * circunferencia;

  // Verifica se todos os 3 anéis foram concluídos hoje (Trifecta Metabólica)
  const trifectaCompleta = jejumConcluido && aguaConcluida && pesoRegistradoHoje;

  const handleQuickAgua = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrarSucesso();
    onAdicionarAguaRapida(250);
  };

  return (
    <section 
      className="w-full bg-white/95 backdrop-blur-xs rounded-3xl p-3 border border-slate-100 shadow-sm select-none transition-all"
      aria-label="Metas do Dia e Anéis Metabólicos"
      data-purpose="triple-metabolic-rings"
    >
      {/* Cabeçalho compacto com status do dia */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black tracking-wider uppercase text-slate-500">
            Metas do Dia
          </span>
          {trifectaCompleta && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              ✨ 3 de 3 Concluídos!
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          {[jejumConcluido, aguaConcluida, pesoRegistradoHoje].filter(Boolean).length}/3 metas
        </span>
      </div>

      {/* Grid com os 3 Cards Verticais Arejados */}
      <div className="grid grid-cols-3 gap-2">
        {/* Item 1: Jejum */}
        <div 
          onClick={() => {
            vibrarClique();
            if (onVerDetalhesJejum) onVerDetalhesJejum();
          }}
          className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-2xl transition-all cursor-pointer min-h-[88px] border text-center active:scale-[0.98] ${
            jejumConcluido 
              ? 'bg-emerald-50/70 border-emerald-100/90' 
              : 'bg-slate-50/80 hover:bg-slate-50 border-slate-100'
          }`}
          title="Toque para ver detalhes do jejum"
        >
          {/* Anel SVG Circular Centralizado */}
          <div className="relative w-11 h-11 mb-1.5 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r={raioCirculo}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="3.5"
              />
              <circle
                cx="22"
                cy="22"
                r={raioCirculo}
                fill="none"
                stroke={jejumConcluido ? '#00C975' : '#10B981'}
                strokeWidth="3.5"
                strokeDasharray={`${strokeDashJejum} ${circunferencia}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {jejumConcluido ? (
                <Check className="w-4 h-4 text-[#00C975] stroke-[3]" />
              ) : (
                <Flame className="w-4 h-4 text-emerald-600 fill-emerald-500/30" />
              )}
            </div>
          </div>

          {/* Valor Numérico sem Quebras */}
          <span className="text-[13px] font-black text-[#092244] leading-tight block">
            {horasJejum.toFixed(1)}h
          </span>

          {/* Rótulo Arejado */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5 block">
            Jejum
          </span>
        </div>

        {/* Item 2: Hidratação Dinâmica */}
        <div 
          onClick={() => {
            vibrarClique();
            onAbrirRastreadorAgua();
          }}
          className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-2xl transition-all cursor-pointer min-h-[88px] border text-center relative active:scale-[0.98] ${
            aguaConcluida 
              ? 'bg-blue-50/70 border-blue-100/90' 
              : 'bg-slate-50/80 hover:bg-slate-50 border-slate-100'
          }`}
          title="Toque para abrir monitor de água"
        >
          {/* Anel SVG Circular Centralizado com Botão + como Badge Flutuante */}
          <div className="relative w-11 h-11 mb-1.5 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r={raioCirculo}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="3.5"
              />
              <circle
                cx="22"
                cy="22"
                r={raioCirculo}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3.5"
                strokeDasharray={`${strokeDashAgua} ${circunferencia}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {aguaConcluida ? (
                <Check className="w-4 h-4 text-blue-600 stroke-[3]" />
              ) : (
                <Droplet className="w-4 h-4 text-blue-500 fill-blue-500/30" />
              )}
            </div>

            {/* Badge de Ação Rápida: +250ml em 1 toque */}
            <button
              type="button"
              onClick={handleQuickAgua}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-90 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer z-10"
              title="Adicionar 250ml de água com 1 toque"
              aria-label="Adicionar 250ml"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          </div>

          {/* Valor Numérico sem Quebras */}
          <span className="text-[13px] font-black text-[#092244] leading-tight block">
            {aguaConsumidaMl >= 1000 ? `${(aguaConsumidaMl / 1000).toFixed(1)}L` : `${aguaConsumidaMl}ml`}
          </span>

          {/* Rótulo Arejado */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5 block">
            Água
          </span>
        </div>

        {/* Item 3: Registro Corporal / Check-in */}
        <div 
          onClick={() => {
            vibrarClique();
            onAbrirDadosCorporais();
          }}
          className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-2xl transition-all cursor-pointer min-h-[88px] border text-center active:scale-[0.98] ${
            pesoRegistradoHoje 
              ? 'bg-purple-50/70 border-purple-100/90' 
              : 'bg-slate-50/80 hover:bg-slate-50 border-slate-100'
          }`}
          title="Toque para registrar ou ver peso/bioimpedância"
        >
          {/* Anel SVG Circular Centralizado */}
          <div className="relative w-11 h-11 mb-1.5 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r={raioCirculo}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="3.5"
              />
              <circle
                cx="22"
                cy="22"
                r={raioCirculo}
                fill="none"
                stroke={pesoRegistradoHoje ? '#8B5CF6' : '#CBD5E1'}
                strokeWidth="3.5"
                strokeDasharray={`${pesoRegistradoHoje ? circunferencia : 0} ${circunferencia}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {pesoRegistradoHoje ? (
                <Check className="w-4 h-4 text-purple-600 stroke-[3]" />
              ) : (
                <Scale className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {/* Valor Numérico sem Quebras */}
          <span className="text-[13px] font-black text-[#092244] leading-tight block">
            {pesoRegistradoHoje ? (pesoAtualKg ? `${pesoAtualKg.toFixed(1)}kg` : 'Feito') : 'Pendente'}
          </span>

          {/* Rótulo Arejado */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5 block">
            Check-in
          </span>
        </div>
      </div>
    </section>
  );
};
