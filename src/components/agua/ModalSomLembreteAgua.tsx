/**
 * @file ModalSomLembreteAgua.tsx
 * @description Modal Bottom Sheet para escolher o som de notificação do lembrete de água.
 * Fiel à imagem de referência do usuário.
 */

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ModalSomLembreteAguaProps {
  aberto: boolean;
  somAtual: string;
  onSalvar: (novoSom: string) => void;
  onFechar: () => void;
}

export const ModalSomLembreteAgua: React.FC<ModalSomLembreteAguaProps> = ({
  aberto,
  somAtual,
  onSalvar,
  onFechar,
}) => {
  const [somSelecionado, setSomSelecionado] = useState<string>(somAtual || 'Padrão');

  const sons = [
    'Padrão',
    'Bolha',
    'Gotejamento',
    'Gelo',
    'Refrigerante',
    'Sino de bicicleta',
    'Zumbido',
  ];

  useEffect(() => {
    if (aberto) {
      setSomSelecionado(somAtual || 'Padrão');
    }
  }, [aberto, somAtual]);

  if (!aberto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300 select-none animate-in fade-in"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-som-lembrete"
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== Cabeçalho ==================== */}
        <div className="relative flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="w-8" />
          <h2 id="titulo-som-lembrete" className="text-[18px] sm:text-[19px] font-black text-[#092244] tracking-tight text-center">
            Som de lembrete para beber água
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-slate-100/90 text-slate-500 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ==================== Lista de Sons ==================== */}
        <div className="py-4 overflow-y-auto max-h-[50vh] space-y-1">
          {sons.map((som) => {
            const ativo = somSelecionado === som;
            return (
              <button
                key={som}
                type="button"
                onClick={() => setSomSelecionado(som)}
                aria-pressed={ativo}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[15px] transition-all min-h-[48px] cursor-pointer ${
                  ativo
                    ? 'bg-[#E8FAF3] text-[#008A4D] font-black'
                    : 'text-[#092244] font-semibold hover:bg-gray-50'
                }`}
              >
                <span>{som}</span>
                {ativo && (
                  <div className="w-6 h-6 rounded-full bg-[#00C975] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ==================== Botão Salvar ==================== */}
        <div className="pt-2 pb-2">
          <button
            type="button"
            onClick={() => {
              onSalvar(somSelecionado);
              onFechar();
            }}
            className="w-full h-13 bg-[#00C975] hover:bg-[#00B76A] active:scale-[0.98] text-white text-[16px] font-black rounded-full shadow-lg shadow-[#00C975]/25 transition-all flex items-center justify-center min-h-[50px] cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
