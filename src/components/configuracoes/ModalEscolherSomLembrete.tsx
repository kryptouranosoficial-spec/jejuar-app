/**
 * @file ModalEscolherSomLembrete.tsx
 * @description Modal bottom sheet para seleção do tom/som do lembrete de peso,
 * fiel ao layout da imagem 3 com lista vertical e indicador ativo.
 */

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ModalEscolherSomLembreteProps {
  aberto: boolean;
  somAtual: string;
  onSalvar: (novoSom: string) => void;
  onFechar: () => void;
}

export const LISTA_SONS_DISPONIVEIS = [
  'Padrão',
  'Sino de bicicleta',
  'Zumbido',
  'Sino',
  'Alertas rápidos',
  'Bip rápido',
  'Vibração',
];

export const ModalEscolherSomLembrete: React.FC<ModalEscolherSomLembreteProps> = ({
  aberto,
  somAtual,
  onSalvar,
  onFechar,
}) => {
  const [selecionado, setSelecionado] = useState<string>(somAtual || 'Padrão');

  useEffect(() => {
    if (aberto && somAtual) {
      setSelecionado(somAtual);
    }
  }, [aberto, somAtual]);

  if (!aberto) return null;

  const handleSalvar = () => {
    onSalvar(selecionado);
    onFechar();
  };

  return (
    <div 
      className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center animate-in fade-in duration-200"
      onClick={onFechar}
    >
      <div 
        className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl relative flex flex-col items-center animate-in slide-in-from-bottom duration-300 select-none max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho da Modal */}
        <div className="w-full flex items-center justify-between mb-4">
          <h3 className="text-[19px] font-extrabold text-[#092244] leading-snug">
            Som de lembrete de peso
          </h3>
          <button
            type="button"
            onClick={onFechar}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Lista de Sons */}
        <div className="w-full my-2 divide-y divide-slate-100">
          {LISTA_SONS_DISPONIVEIS.map((som) => {
            const estaAtivo = selecionado === som;

            return (
              <button
                key={som}
                type="button"
                onClick={() => setSelecionado(som)}
                className={`w-full py-3.5 px-4 flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer min-h-[50px] ${
                  estaAtivo
                    ? 'bg-[#EEFAF7] text-[#092244] rounded-2xl'
                    : 'bg-transparent text-[#092244] hover:bg-slate-50'
                }`}
              >
                <span className={`text-[15px] ${estaAtivo ? 'font-extrabold' : 'font-medium'}`}>
                  {som}
                </span>

                {estaAtivo && (
                  <div className="w-6 h-6 rounded-full bg-[#00C975] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Botão de Ação Salvar */}
        <button
          type="button"
          onClick={handleSalvar}
          className="w-full py-3.5 rounded-full bg-[#00C975] hover:bg-[#00B568] active:scale-98 text-white font-extrabold text-[16px] shadow-lg shadow-emerald-500/25 transition-all cursor-pointer min-h-[48px] flex items-center justify-center mt-5"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};
