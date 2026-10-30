/**
 * @file ModalEscolherDiasLembrete.tsx
 * @description Modal bottom sheet para seleção dos dias da semana para lembrete de registro de peso,
 * fiel ao layout da imagem 2 com pílulas selecionáveis e checks verdes.
 */

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ModalEscolherDiasLembreteProps {
  aberto: boolean;
  diasSelecionados: string[]; // ex: ['Domingo', 'Segunda-feira', ...]
  onSalvar: (novosDias: string[]) => void;
  onFechar: () => void;
}

export const DIAS_DA_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const ModalEscolherDiasLembrete: React.FC<ModalEscolherDiasLembreteProps> = ({
  aberto,
  diasSelecionados,
  onSalvar,
  onFechar,
}) => {
  const [selecionados, setSelecionados] = useState<string[]>(diasSelecionados);

  useEffect(() => {
    if (aberto) {
      setSelecionados(diasSelecionados && diasSelecionados.length > 0 ? diasSelecionados : DIAS_DA_SEMANA);
    }
  }, [aberto, diasSelecionados]);

  if (!aberto) return null;

  const toggleDia = (dia: string) => {
    setSelecionados((prev) => {
      if (prev.includes(dia)) {
        // Evita desmarcar todos os dias
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== dia);
      } else {
        return [...prev, dia];
      }
    });
  };

  const handleSalvar = () => {
    onSalvar(selecionados);
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
          <h3 className="text-[19px] font-extrabold text-[#092244] leading-snug max-w-[280px]">
            Escolha o dia para registrar o peso
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

        {/* Lista de Dias da Semana (Pílulas com Check) */}
        <div className="w-full space-y-2.5 my-2">
          {DIAS_DA_SEMANA.map((dia) => {
            const estaMarcado = selecionados.includes(dia);

            return (
              <button
                key={dia}
                type="button"
                onClick={() => toggleDia(dia)}
                className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer min-h-[48px] ${
                  estaMarcado
                    ? 'bg-[#EEFAF7] text-[#092244] border border-[#DCF3E7]'
                    : 'bg-[#F9FBFC] text-slate-500 border border-slate-100 hover:bg-slate-100/60'
                }`}
              >
                <span className={`text-[15px] ${estaMarcado ? 'font-extrabold' : 'font-medium'}`}>
                  {dia}
                </span>

                {estaMarcado ? (
                  <div className="w-6 h-6 rounded-full bg-[#00C975] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white" />
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
