/**
 * @file bioimpedancia/SimuladorPreditivoBioimpedancia.tsx
 * @description Seção interativa de simulação preditiva metabólica e de recomposição corporal.
 * Permite ao usuário simular cenários futuros:
 * - "+1 kg de Músculo"
 * - "-2 kg de Gordura"
 * - "Recomposição" (+1kg de músculo e -2kg de gordura)
 * Exibe em tempo real o novo Gasto Basal (TMB), novo Percentual de Gordura (%) e novo Peso projetado.
 */

import React, { useState, useId } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Minus, 
  Plus, 
  Flag, 
  Check, 
  Sparkles, 
  Dumbbell, 
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import type { RegistroBioimpedancia } from '../../types/bioimpedancia';
import { formatarDecimalBR } from '../../utils/bioimpedanciaUtils';

interface SimuladorPreditivoBioimpedanciaProps {
  ultimoExame: RegistroBioimpedancia | null;
  alturaPadrao?: number;
}

export const SimuladorPreditivoBioimpedancia: React.FC<SimuladorPreditivoBioimpedanciaProps> = ({
  ultimoExame,
  alturaPadrao = 1.63,
}) => {
  // Valores base do último exame (ou valores padrão se não houver exame)
  const pesoBase = ultimoExame?.pesoKg || 72.4;
  const gorduraPctBase = ultimoExame?.gorduraCorporalPercentual || 31.7;
  const musculoPctBase = ultimoExame?.musculoEsqueleticoPercentual || 29.9;
  const tmbBase = ultimoExame?.taxaMetabolicaBasalKcal || 1581;

  // Estados dos controles manuais de simulação (em kg)
  const [deltaMusculoKg, setDeltaMusculoKg] = useState<number>(1.0); // -2kg a +3kg
  const [deltaGorduraKg, setDeltaGorduraKg] = useState<number>(0.0); // -4kg a +2kg

  // Estado do botão "Definir como Meta Ativa"
  const [metaDefinida, setMetaDefinida] = useState<boolean>(false);

  // Preset ativo
  const [presetAtivo, setPresetAtivo] = useState<'musculo' | 'gordura' | 'recomposicao' | 'personalizado'>('musculo');

  /**
   * Aplica presets rápidos
   */
  const aplicarPreset = (tipo: 'musculo' | 'gordura' | 'recomposicao') => {
    setPresetAtivo(tipo);
    setMetaDefinida(false);
    if (tipo === 'musculo') {
      setDeltaMusculoKg(1.0);
      setDeltaGorduraKg(0.0);
    } else if (tipo === 'gordura') {
      setDeltaMusculoKg(0.0);
      setDeltaGorduraKg(-2.0);
    } else if (tipo === 'recomposicao') {
      setDeltaMusculoKg(1.0);
      setDeltaGorduraKg(-2.0);
    }
  };

  // Ajustes manuais de músculo (-2 a +3 kg)
  const incrementarMusculo = () => {
    setPresetAtivo('personalizado');
    setMetaDefinida(false);
    setDeltaMusculoKg((prev) => Math.min(3.0, Math.round((prev + 0.5) * 10) / 10));
  };
  const decrementarMusculo = () => {
    setPresetAtivo('personalizado');
    setMetaDefinida(false);
    setDeltaMusculoKg((prev) => Math.max(-2.0, Math.round((prev - 0.5) * 10) / 10));
  };

  // Ajustes manuais de gordura (-4 a +2 kg)
  const incrementarGordura = () => {
    setPresetAtivo('personalizado');
    setMetaDefinida(false);
    setDeltaGorduraKg((prev) => Math.min(2.0, Math.round((prev + 0.5) * 10) / 10));
  };
  const decrementarGordura = () => {
    setPresetAtivo('personalizado');
    setMetaDefinida(false);
    setDeltaGorduraKg((prev) => Math.max(-4.0, Math.round((prev - 0.5) * 10) / 10));
  };

  // CÁLCULOS MATEMÁTICOS DE RECOMPOSIÇÃO CORPORAL:
  // 1. Novo Peso Total
  const novoPeso = Math.max(30, Math.round((pesoBase + deltaMusculoKg + deltaGorduraKg) * 10) / 10);

  // 2. Massa Gorda Atual e Nova Massa Gorda em kg
  const massaGordaAtualKg = (pesoBase * gorduraPctBase) / 100;
  const novaMassaGordaKg = Math.max(1, massaGordaAtualKg + deltaGorduraKg);
  const novoGorduraPct = Math.round((novaMassaGordaKg / novoPeso) * 1000) / 10;
  const deltaGorduraPct = Math.round((novoGorduraPct - gorduraPctBase) * 10) / 10;

  // 3. Massa Muscular Atual e Nova Massa Muscular em kg
  const massaMuscularAtualKg = (pesoBase * musculoPctBase) / 100;
  const novaMassaMuscularKg = Math.max(1, massaMuscularAtualKg + deltaMusculoKg);
  const novoMusculoPct = Math.round((novaMassaMuscularKg / novoPeso) * 1000) / 10;

  // 4. Impacto Metabólico no Gasto Basal (TMB):
  // Cada 1kg de músculo adicionado eleva a TMB diária em ~30 a 34 kcal/dia.
  // Cada 1kg de gordura queima ~4.5 kcal/dia.
  const deltaTmbKcal = Math.round(deltaMusculoKg * 34 + deltaGorduraKg * 4.5);
  const novaTmbKcal = Math.round(tmbBase + deltaTmbKcal);

  // Percentual visual para as barras de progresso
  // Músculo: de -2kg a +3kg (total 5kg amplitude). 0kg fica em 40%
  const progressoMusculoPercent = Math.min(100, Math.max(0, ((deltaMusculoKg + 2) / 5) * 100));
  // Gordura: de -4kg a +2kg (total 6kg amplitude). 0kg fica em 66.6%
  const progressoGorduraPercent = Math.min(100, Math.max(0, ((deltaGorduraKg + 4) / 6) * 100));

  const handleDefinirMeta = () => {
    setMetaDefinida(true);
    // Salva a meta preditiva no localStorage
    try {
      localStorage.setItem('jejuar_meta_preditiva', JSON.stringify({
        deltaMusculoKg,
        deltaGorduraKg,
        novoPeso,
        novoGorduraPct,
        novoMusculoPct,
        novaTmbKcal,
        criadoEm: new Date().toISOString(),
      }));
    } catch {}
  };

  return (
    <div className="space-y-3" data-purpose="simulador-preditivo-section">
      
      {/* Card Principal do Simulador */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        
        {/* Cabeçalho da Seção */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B1C30] tracking-tight">
              Simulador Preditivo
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Simule o impacto de ganhos ou perdas no metabolismo
            </p>
          </div>
        </div>

        {/* Linha de Atalhos / Presets Rápidos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Preset 1: +1 kg de Músculo */}
          <button
            type="button"
            onClick={() => aplicarPreset('musculo')}
            className={`min-h-[42px] px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
              presetAtivo === 'musculo'
                ? 'bg-[#00C975] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            <span>+1 kg de Músculo</span>
          </button>

          {/* Preset 2: -2 kg de Gordura */}
          <button
            type="button"
            onClick={() => aplicarPreset('gordura')}
            className={`min-h-[42px] px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
              presetAtivo === 'gordura'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <TrendingDown className="w-4 h-4 stroke-[2.5]" />
            <span>-2 kg de Gordura</span>
          </button>

          {/* Preset 3: Recomposição */}
          <button
            type="button"
            onClick={() => aplicarPreset('recomposicao')}
            className={`min-h-[42px] px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
              presetAtivo === 'recomposicao'
                ? 'bg-[#0B1C30] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Dumbbell className="w-4 h-4 stroke-[2]" />
            <span>Recomposição</span>
          </button>
        </div>

        {/* Controles Deslizantes / Steppers */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-4 space-y-4">
          
          {/* Controle 1: Massa Muscular */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Massa Muscular
                </span>
              </div>

              {/* Stepper com Botões Táteis */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decrementarMusculo}
                  className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-2xs"
                  aria-label="Diminuir músculo simulado"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className={`text-xs font-black min-w-[56px] text-center tabular-nums ${
                  deltaMusculoKg > 0 ? 'text-emerald-700' : deltaMusculoKg < 0 ? 'text-rose-600' : 'text-slate-700'
                }`}>
                  {deltaMusculoKg > 0 ? '+' : ''}{formatarDecimalBR(deltaMusculoKg, 1)} kg
                </span>

                <button
                  type="button"
                  onClick={incrementarMusculo}
                  className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-2xs"
                  aria-label="Aumentar músculo simulado"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Barra Visual de Amplitude */}
            <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
                style={{ width: `${progressoMusculoPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1 px-0.5">
              <span>-2 kg</span>
              <span className="text-slate-500">0 (Neutro)</span>
              <span>+3 kg</span>
            </div>
          </div>

          {/* Controle 2: Gordura Corporal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Gordura Corporal
                </span>
              </div>

              {/* Stepper com Botões Táteis */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decrementarGordura}
                  className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-2xs"
                  aria-label="Diminuir gordura simulada"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className={`text-xs font-black min-w-[56px] text-center tabular-nums ${
                  deltaGorduraKg < 0 ? 'text-amber-700' : deltaGorduraKg > 0 ? 'text-rose-600' : 'text-slate-700'
                }`}>
                  {deltaGorduraKg > 0 ? '+' : ''}{formatarDecimalBR(deltaGorduraKg, 1)} kg
                </span>

                <button
                  type="button"
                  onClick={incrementarGordura}
                  className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-2xs"
                  aria-label="Aumentar gordura simulada"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Barra Visual de Amplitude */}
            <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-200 rounded-full"
                style={{ width: `${progressoGorduraPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1 px-0.5">
              <span>-4 kg</span>
              <span className="text-slate-500">0 (Estável)</span>
              <span>+2 kg</span>
            </div>
          </div>
        </div>

        {/* Cards com Resultados e Projeções Calculadas em Tempo Real */}
        <div className="grid grid-cols-2 gap-2.5">
          
          {/* Card 1: Gasto Basal (TMB) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Gasto Basal (TMB)
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-black text-slate-800 tabular-nums">
                {tmbBase.toLocaleString('pt-BR')}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-sm font-black text-emerald-700 tabular-nums">
                {novaTmbKcal.toLocaleString('pt-BR')} <span className="text-[11px] font-normal text-slate-400">kcal</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 block mt-1">
              {deltaTmbKcal >= 0 ? `+${deltaTmbKcal}` : deltaTmbKcal} kcal/dia em repouso
            </span>
          </div>

          {/* Card 2: Gordura Corporal */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Gordura Corporal
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-black text-slate-800 tabular-nums">
                {formatarDecimalBR(gorduraPctBase, 1)}%
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-sm font-black text-emerald-700 tabular-nums">
                {formatarDecimalBR(novoGorduraPct, 1)}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 block mt-1">
              {deltaGorduraPct <= 0 ? `${formatarDecimalBR(deltaGorduraPct, 1)}%` : `+${formatarDecimalBR(deltaGorduraPct, 1)}%`} ({deltaMusculoKg > 0 && deltaGorduraKg === 0 ? 'diluição magra' : 'recomposição'})
            </span>
          </div>
        </div>

        {/* Resumo Complementar: Novo Peso e Músculo */}
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900">
          <span>Peso Projetado: <span className="tabular-nums text-slate-900 font-black">{formatarDecimalBR(novoPeso, 1)} kg</span></span>
          <span className="text-slate-300">·</span>
          <span>Músculo: <span className="tabular-nums text-emerald-800 font-black">{formatarDecimalBR(novoMusculoPct, 1)}%</span></span>
        </div>

        {/* Botão de Ação: Definir como Meta Ativa */}
        <button
          type="button"
          onClick={handleDefinirMeta}
          className={`w-full min-h-[48px] rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
            metaDefinida
              ? 'bg-emerald-700'
              : 'bg-[#00C975] hover:bg-[#00B066] active:bg-[#009B58]'
          }`}
        >
          {metaDefinida ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Meta Preditiva Ativada!</span>
            </>
          ) : (
            <>
              <Flag className="w-4 h-4 stroke-[2.2]" />
              <span>Definir como Meta Ativa</span>
            </>
          )}
        </button>
      </div>

      {/* Card Educativo: Psicologia do Progresso · Micro-passo */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-3xl flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-white text-[#006D3D] flex items-center justify-center shrink-0 shadow-2xs">
          <Lightbulb className="w-4 h-4 stroke-[2]" />
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-extrabold text-[#006D3D] uppercase tracking-wider block mb-0.5">
            Psicologia do Progresso · Micro-passo
          </span>
          <h4 className="text-xs font-bold text-slate-900 mb-1">
            Seus quilogramas eliminados preservam a massa magra!
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Em jejuns intermitentes consistentes, o corpo foca na queima visceral antes do tônus muscular. Mantenha hidratação diária de 2.5L para acelerar a recomposição metabólica.
          </p>
        </div>
      </div>
    </div>
  );
};
