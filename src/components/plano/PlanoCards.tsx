/**
 * @file PlanoCards.tsx
 * @description Conjunto de cards estilizados e otimizados para renderização de protocolos
 * de jejum: CardPlanoPopular, CardPlanoGrade e CardPlanoProlongado.
 */

import React from 'react';
import { Check, Clock, Utensils, Star, Droplet, Flame } from 'lucide-react';
import type { ProtocoloJejum, ItemPlanoGrade, ItemPlanoProlongado } from '../../data/planosJejumData';

interface CardPlanoPopularProps {
  plano: ProtocoloJejum;
  estaSelecionado: boolean;
  onSelecionar: (plano: ProtocoloJejum) => void;
}

/** Card de destaque para os 4 protocolos mais populares */
export const CardPlanoPopular: React.FC<CardPlanoPopularProps> = ({
  plano,
  estaSelecionado,
  onSelecionar,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelecionar(plano)}
      className={`relative flex flex-col justify-between p-4 rounded-2xl bg-white transition-all text-left active:scale-[0.98] min-h-[148px] cursor-pointer select-none ${
        estaSelecionado
          ? 'shadow-md ring-2 ring-[#00C975]'
          : 'shadow-xs border border-slate-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[26px] leading-none text-[#0B1C30] font-extrabold tracking-tight">
          {plano.nome}
        </span>
        {estaSelecionado ? (
          <div className="w-6 h-6 rounded-full bg-[#00C975] flex items-center justify-center text-white shadow-xs">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        ) : plano.ehPro ? (
          <span className="px-2 py-0.5 rounded-full bg-[#FFDDB8] text-[#603B00] text-[10px] font-black flex items-center gap-0.5 shadow-2xs">
            <Star className="w-2.5 h-2.5 fill-[#603B00]" /> PRO
          </span>
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Clock className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="space-y-1.5 my-1">
        <div className="flex items-center gap-1.5 text-xs text-[#0B1C30] font-semibold">
          <Utensils className="w-3.5 h-3.5 text-[#006D3D]" />
          <span>{plano.horasJejum}h jejum</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="text-amber-500 font-bold">●</span>
          <span>{plano.horasAlimentacao}h comendo</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
          plano.rotuloDestaque === 'Mais popular'
            ? 'bg-[#5FFEA4]/35 text-[#004D2A] font-extrabold'
            : plano.rotuloDestaque === 'Dieta do guerreiro'
              ? 'bg-amber-50 text-amber-800'
              : 'bg-slate-100 text-[#0B1C30]'
        }`}>
          {plano.rotuloDestaque}
        </span>
      </div>
    </button>
  );
};

interface CardPlanoGradeProps {
  item: ItemPlanoGrade;
  categoria: 'basico' | 'intermediario' | 'avancado';
  estaSelecionado: boolean;
  onSelecionar: (plano: ProtocoloJejum) => void;
}

/** Card de grid de duas colunas para planos Básicos, Intermediários e Avançados */
export const CardPlanoGrade: React.FC<CardPlanoGradeProps> = ({
  item,
  categoria,
  estaSelecionado,
  onSelecionar,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelecionar({
        id: item.id,
        nome: item.nome,
        horasJejum: item.jejum,
        horasAlimentacao: item.comida,
        ehPro: item.ehPro,
        categoria,
      })}
      className={`p-4 rounded-2xl bg-white text-left flex flex-col justify-between transition-all active:scale-[0.98] min-h-[110px] cursor-pointer select-none ${
        estaSelecionado
          ? 'shadow-md ring-2 ring-[#00C975]'
          : 'shadow-xs border border-slate-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[22px] text-[#0B1C30] font-extrabold">{item.nome}</span>
        {estaSelecionado ? (
          <div className="w-5 h-5 rounded-full bg-[#00C975] flex items-center justify-center text-white">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        ) : item.ehPro ? (
          <span className="px-1.5 py-0.5 rounded bg-[#FFDDB8] text-[#603B00] text-[10px] font-bold">
            PRO
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[#565E74] font-medium">
        <span>{item.jejum}h jejum</span>
        <span>•</span>
        <span>{item.comida}h comendo</span>
      </div>

      {/* Barra de Proporção Visual Jejum/Alimentação */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden flex">
        <div 
          className="bg-[#00C975] h-full" 
          style={{ width: `${(item.jejum / 24) * 100}%` }} 
        />
        <div 
          className="bg-amber-400 h-full" 
          style={{ width: `${(item.comida / 24) * 100}%` }} 
        />
      </div>
    </button>
  );
};

interface CardPlanoProlongadoProps {
  item: ItemPlanoProlongado;
  estaSelecionado: boolean;
  onSelecionar: (plano: ProtocoloJejum) => void;
}

/** Card para protocolos de jejum prolongado (24h a 72h) */
export const CardPlanoProlongado: React.FC<CardPlanoProlongadoProps> = ({
  item,
  estaSelecionado,
  onSelecionar,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelecionar({
        id: item.id,
        nome: item.nome,
        horasJejum: item.horasJejum,
        horasAlimentacao: 0,
        ehPro: item.ehPro,
        categoria: 'prolongado',
        rotuloDestaque: item.label,
        dicaHidratacao: item.dica,
      })}
      className={`p-4 rounded-2xl bg-white text-left flex flex-col justify-between transition-all active:scale-[0.98] min-h-[110px] cursor-pointer select-none ${
        estaSelecionado
          ? 'shadow-md ring-2 ring-[#00C975]'
          : 'shadow-xs border border-slate-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[22px] text-[#0B1C30] font-extrabold">{item.nome}</span>
        <span className="px-1.5 py-0.5 rounded bg-[#FFDDB8] text-[#603B00] text-[10px] font-bold">
          PRO
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-[#0B1C30] font-bold">{item.label}</p>
        <div className="flex items-center gap-1 text-[#006D3D]">
          <Droplet className="w-3.5 h-3.5 fill-[#006D3D]" />
          <span className="text-[11px] text-[#565E74]">{item.dica}</span>
        </div>
      </div>
    </button>
  );
};

interface CardPlanoSeteDiasProps {
  estaSelecionado: boolean;
  onSelecionar: (plano: ProtocoloJejum) => void;
}

/** Card especial de 7 dias completos (168h PRO) */
export const CardPlanoSeteDias: React.FC<CardPlanoSeteDiasProps> = ({
  estaSelecionado,
  onSelecionar,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelecionar({
        id: '168h',
        nome: '168h',
        horasJejum: 168,
        horasAlimentacao: 0,
        ehPro: true,
        categoria: 'prolongado',
        rotuloDestaque: '7 dias autofágicos',
      })}
      className={`col-span-2 p-4 rounded-2xl bg-white text-left flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer select-none ${
        estaSelecionado
          ? 'shadow-md ring-2 ring-[#00C975]'
          : 'shadow-xs border border-slate-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-700">
          <Flame className="w-5 h-5 fill-amber-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[20px] text-[#0B1C30] font-extrabold">168h</span>
            <span className="px-1.5 py-0.5 rounded bg-[#FFDDB8] text-[#603B00] text-[10px] font-bold">
              PRO
            </span>
          </div>
          <p className="text-xs text-[#565E74] font-medium">7 dias completos em jejum autofágico</p>
        </div>
      </div>
      {estaSelecionado && (
        <div className="w-6 h-6 rounded-full bg-[#00C975] text-white flex items-center justify-center">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      )}
    </button>
  );
};
