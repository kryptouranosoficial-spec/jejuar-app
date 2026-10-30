/**
 * @file ModalIntervaloLembreteAgua.tsx
 * @description Modal Bottom Sheet para escolher o intervalo de ingestão de água.
 * Contém estritamente as 4 opções exibidas na imagem de referência do usuário.
 */

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ModalIntervaloLembreteAguaProps {
  aberto: boolean;
  intervaloAtual: string;
  onSalvar: (novoIntervalo: string) => void;
  onFechar: () => void;
}

export const ModalIntervaloLembreteAgua: React.FC<ModalIntervaloLembreteAguaProps> = ({
  aberto,
  intervaloAtual,
  onSalvar,
  onFechar,
}) => {
  const [intervaloSelecionado, setIntervaloSelecionado] = useState<string>(intervaloAtual || 'A cada 2 hora');

  // Estritamente as 4 opções solicitadas da imagem de referência
  const opcoesIntervalo = [
    'A cada 1 hora',
    'A cada 2 hora',
    'A cada 3 hora',
    'A cada 4 hora',
  ];

  useEffect(() => {
    if (aberto) {
      setIntervaloSelecionado(intervaloAtual || 'A cada 2 hora');
    }
  }, [aberto, intervaloAtual]);

  if (!aberto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300 select-none animate-in fade-in"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-intervalo-agua"
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== Cabeçalho ==================== */}
        <div className="relative flex items-start justify-between pb-3">
          <div className="flex-1 pr-4">
            <h2 id="titulo-intervalo-agua" className="text-[19px] font-black text-[#092244] tracking-tight leading-snug">
              Definir intervalo de ingestão de água
            </h2>
            <p className="text-[13px] text-gray-500 font-medium mt-1">
              Escolha com que frequência deseja receber lembretes para beber água.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-slate-100/90 text-slate-500 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer shrink-0 mt-0.5"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ==================== Lista de 4 Opções ==================== */}
        <div className="py-4 space-y-3">
          {opcoesIntervalo.map((opcao) => {
            const ativo = intervaloSelecionado === opcao;
            return (
              <button
                key={opcao}
                type="button"
                onClick={() => setIntervaloSelecionado(opcao)}
                aria-pressed={ativo}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[16px] transition-all min-h-[56px] cursor-pointer ${
                  ativo
                    ? 'border-2 border-[#00C975] bg-[#E8FAF3] text-[#008A4D] font-black shadow-xs'
                    : 'border border-blue-50/80 bg-[#F5F9FC] text-[#092244] font-semibold hover:bg-[#EEF6FD]'
                }`}
              >
                <span>{opcao}</span>
                {ativo && (
                  <div className="w-6 h-6 rounded-full bg-[#00C975] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ==================== Botão Definir ==================== */}
        <div className="pt-2 pb-2">
          <button
            type="button"
            onClick={() => {
              onSalvar(intervaloSelecionado);
              onFechar();
            }}
            className="w-full h-13 bg-[#00C975] hover:bg-[#00B76A] active:scale-[0.98] text-white text-[16px] font-black rounded-full shadow-lg shadow-[#00C975]/25 transition-all flex items-center justify-center min-h-[50px] cursor-pointer"
          >
            Definir
          </button>
        </div>
      </div>
    </div>
  );
};
