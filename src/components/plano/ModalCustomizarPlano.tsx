/**
 * @file ModalCustomizarPlano.tsx
 * @description Modal interativo para criação de protocolo de jejum customizado,
 * permitindo ao usuário definir o número exato de horas de jejum diário.
 */

import React from 'react';
import { X, Sliders } from 'lucide-react';

interface ModalCustomizarPlanoProps {
  aberto: boolean;
  horasCustomJejum: number;
  onMudarHoras: (horas: number) => void;
  onFechar: () => void;
  onSalvar: () => void;
}

export const ModalCustomizarPlano: React.FC<ModalCustomizarPlanoProps> = ({
  aberto,
  horasCustomJejum,
  onMudarHoras,
  onFechar,
  onSalvar,
}) => {
  if (!aberto) return null;

  const horasComendo = Math.max(1, 24 - horasCustomJejum);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      data-purpose="modal-customize"
    >
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
        <button 
          type="button" 
          onClick={onFechar}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer active:scale-90 transition-all"
          aria-label="Fechar modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0B1C30]">Plano Sob Medida</h3>
            <p className="text-xs text-[#565E74]">Ajuste as horas do seu protocolo diário</p>
          </div>
        </div>

        {/* Seletor de Horas de Jejum */}
        <div className="my-6 text-center">
          <span className="text-[44px] font-black text-[#0B1C30] tracking-tight">
            {horasCustomJejum}h : {horasComendo}h
          </span>
          <p className="text-xs text-[#565E74] font-medium mt-1">
            {horasCustomJejum}h de Jejum • {horasComendo}h de Alimentação
          </p>

          <input 
            type="range"
            min={10}
            max={23}
            step={1}
            value={horasCustomJejum}
            onChange={(e) => onMudarHoras(Number(e.target.value))}
            className="w-full mt-6 accent-[#00C975] cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={onSalvar}
          className="w-full py-3.5 px-4 bg-[#00C975] hover:bg-[#00B568] text-white rounded-2xl font-extrabold text-sm shadow-[0_4px_14px_rgba(0,201,117,0.35)] active:scale-95 transition-all min-h-[48px] cursor-pointer"
        >
          Salvar e Usar este Protocolo
        </button>
      </div>
    </div>
  );
};
