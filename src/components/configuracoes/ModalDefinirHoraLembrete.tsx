/**
 * @file ModalDefinirHoraLembrete.tsx
 * @description Modal bottom sheet para ajuste do horário de lembrete de registro de peso.
 * Implementa o seletor estilo roda com destaque central verde e botões táteis de ajuste.
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface ModalDefinirHoraLembreteProps {
  aberto: boolean;
  horaAtual: string; // formato "HH:MM" (ex: "08:00")
  onSalvar: (novaHora: string) => void;
  onFechar: () => void;
}

export const ModalDefinirHoraLembrete: React.FC<ModalDefinirHoraLembreteProps> = ({
  aberto,
  horaAtual,
  onSalvar,
  onFechar,
}) => {
  const [hora, setHora] = useState<number>(8);
  const [minuto, setMinuto] = useState<number>(0);

  // Inicializa com a hora atual passada
  useEffect(() => {
    if (aberto && horaAtual) {
      const [h, m] = horaAtual.split(':').map(Number);
      setHora(!isNaN(h) ? h : 8);
      setMinuto(!isNaN(m) ? m : 0);
    }
  }, [aberto, horaAtual]);

  if (!aberto) return null;

  const incrementarHora = () => setHora((prev) => (prev + 1) % 24);
  const decrementarHora = () => setHora((prev) => (prev - 1 + 24) % 24);
  const incrementarMinuto = () => setMinuto((prev) => (prev + 1) % 60);
  const decrementarMinuto = () => setMinuto((prev) => (prev - 1 + 60) % 60);

  const horaAnterior = (hora - 1 + 24) % 24;
  const horaPosterior = (hora + 1) % 24;
  const minutoAnterior = (minuto - 1 + 60) % 60;
  const minutoPosterior = (minuto + 1) % 60;

  const handleSalvar = () => {
    const formatada = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    onSalvar(formatada);
    onFechar();
  };

  return (
    <div 
      className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center animate-in fade-in duration-200"
      onClick={onFechar}
    >
      <div 
        className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl relative flex flex-col items-center animate-in slide-in-from-bottom duration-300 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho da Modal */}
        <div className="w-full flex items-center justify-between mb-6">
          <h3 className="text-[19px] font-extrabold text-[#092244] leading-snug max-w-[280px]">
            Definir lembrete de registro de peso
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

        {/* Seletor Visual de Horas e Minutos (Wheel Picker Centralizado) */}
        <div className="w-full flex items-center justify-center gap-4 my-4 relative">
          
          {/* Coluna de Horas */}
          <div className="flex flex-col items-center">
            {/* Botão / Valor Anterior */}
            <button
              type="button"
              onClick={decrementarHora}
              className="p-1 text-slate-300 hover:text-slate-500 active:scale-90 transition-all flex flex-col items-center cursor-pointer"
            >
              <ChevronUp className="w-4 h-4 text-slate-300" />
              <span className="text-[18px] font-medium opacity-60">
                {String(horaAnterior).padStart(2, '0')}
              </span>
            </button>

            {/* Container Selecionado em Verde */}
            <div className="w-20 h-14 rounded-2xl bg-[#EEFAF7] border-2 border-[#00C975] flex items-center justify-center my-1.5 shadow-xs">
              <span className="text-[26px] font-black text-[#092244]">
                {String(hora).padStart(2, '0')}
              </span>
            </div>

            {/* Botão / Valor Posterior */}
            <button
              type="button"
              onClick={incrementarHora}
              className="p-1 text-slate-300 hover:text-slate-500 active:scale-90 transition-all flex flex-col items-center cursor-pointer"
            >
              <span className="text-[18px] font-medium opacity-60">
                {String(horaPosterior).padStart(2, '0')}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Separador de Dois Pontos */}
          <div className="flex items-center justify-center text-[26px] font-black text-[#092244] pb-1">
            :
          </div>

          {/* Coluna de Minutos */}
          <div className="flex flex-col items-center">
            {/* Botão / Valor Anterior */}
            <button
              type="button"
              onClick={decrementarMinuto}
              className="p-1 text-slate-300 hover:text-slate-500 active:scale-90 transition-all flex flex-col items-center cursor-pointer"
            >
              <ChevronUp className="w-4 h-4 text-slate-300" />
              <span className="text-[18px] font-medium opacity-60">
                {String(minutoAnterior).padStart(2, '0')}
              </span>
            </button>

            {/* Container Selecionado em Verde */}
            <div className="w-20 h-14 rounded-2xl bg-[#EEFAF7] border-2 border-[#00C975] flex items-center justify-center my-1.5 shadow-xs">
              <span className="text-[26px] font-black text-[#092244]">
                {String(minuto).padStart(2, '0')}
              </span>
            </div>

            {/* Botão / Valor Posterior */}
            <button
              type="button"
              onClick={incrementarMinuto}
              className="p-1 text-slate-300 hover:text-slate-500 active:scale-90 transition-all flex flex-col items-center cursor-pointer"
            >
              <span className="text-[18px] font-medium opacity-60">
                {String(minutoPosterior).padStart(2, '0')}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Botão de Ação Salvar */}
        <button
          type="button"
          onClick={handleSalvar}
          className="w-full py-3.5 rounded-full bg-[#00C975] hover:bg-[#00B568] active:scale-98 text-white font-extrabold text-[16px] shadow-lg shadow-emerald-500/25 transition-all cursor-pointer min-h-[48px] flex items-center justify-center mt-6"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};
