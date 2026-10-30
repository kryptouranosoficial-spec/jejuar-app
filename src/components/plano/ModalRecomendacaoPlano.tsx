/**
 * @file ModalRecomendacaoPlano.tsx
 * @description Modal explicativo com embasamento científico do plano de jejum recomendado,
 * calculado de acordo com os dados fornecidos pelo usuário no questionário de onboarding.
 */

import React from 'react';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import type { ProtocoloJejum } from '../../data/planosJejumData';

interface RecomendacaoInfo {
  plano: ProtocoloJejum;
  motivo: string;
  beneficio: string;
}

interface ModalRecomendacaoPlanoProps {
  aberto: boolean;
  recomendacao: RecomendacaoInfo;
  pesoAtual: number;
  pesoDesejado: number;
  experiencia: string;
  onFechar: () => void;
  onAplicarPlano: (plano: ProtocoloJejum) => void;
}

export const ModalRecomendacaoPlano: React.FC<ModalRecomendacaoPlanoProps> = ({
  aberto,
  recomendacao,
  pesoAtual,
  pesoDesejado,
  experiencia,
  onFechar,
  onAplicarPlano,
}) => {
  if (!aberto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      data-purpose="modal-recommendation"
    >
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Botão Fechar */}
        <button 
          type="button" 
          onClick={onFechar}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer active:scale-90 transition-all"
          aria-label="Fechar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0B1C30]">Seu Plano Ideal</h3>
            <p className="text-xs text-[#565E74]">Calculado com base no seu questionário</p>
          </div>
        </div>

        {/* Card do Plano Recomendado */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EFF4FF] to-[#D3E4FE] border border-blue-200/50 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[28px] font-black text-[#0B1C30]">{recomendacao.plano.nome}</span>
            <span className="px-3 py-1 rounded-full bg-[#00C975] text-white text-xs font-black">
              {recomendacao.plano.rotuloDestaque}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#0B1C30] mb-2 leading-relaxed">
            {recomendacao.motivo}
          </p>
          <div className="p-2.5 bg-white/70 rounded-xl flex items-start gap-2 text-xs text-[#3C4A3F]">
            <ShieldCheck className="w-4 h-4 text-[#00C975] shrink-0 mt-0.5" />
            <span>{recomendacao.beneficio}</span>
          </div>
        </div>

        {/* Dados do Onboarding utilizados */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-5">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 font-medium text-[10px]">Peso Atual / Meta</span>
            <span className="font-extrabold text-[#0B1C30] text-[13px]">{pesoAtual.toFixed(1)} kg → {pesoDesejado.toFixed(1)} kg</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 font-medium text-[10px]">Experiência</span>
            <span className="font-extrabold text-[#0B1C30] text-[13px] capitalize">{experiencia}</span>
          </div>
        </div>

        {/* Botão de Aplicação Imediata */}
        <button
          type="button"
          onClick={() => {
            onAplicarPlano(recomendacao.plano);
            onFechar();
          }}
          className="w-full py-3.5 px-4 bg-[#00C975] hover:bg-[#00B568] text-white rounded-2xl font-extrabold text-sm shadow-[0_4px_14px_rgba(0,201,117,0.35)] active:scale-95 transition-all min-h-[48px] cursor-pointer"
        >
          Aplicar {recomendacao.plano.nome} agora
        </button>
      </div>
    </div>
  );
};
