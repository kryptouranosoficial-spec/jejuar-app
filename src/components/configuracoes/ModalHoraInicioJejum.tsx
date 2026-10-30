/**
 * @file ModalHoraInicioJejum.tsx
 * @description Modal de seleção de horário de início do jejum diário (conforme imagem de referência 3).
 * Apresenta o seletor de horas e minutos destacado com caixa de seleção verde e botão Salvar.
 */

import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface ModalHoraInicioJejumProps {
  /** Indica se o modal está aberto */
  aberto: boolean;
  /** Horário atual no formato HH:MM (ex: "19:00") */
  horaAtual: string;
  /** Callback acionado ao fechar o modal */
  onFechar: () => void;
  /** Callback acionado ao salvar o novo horário selecionado */
  onSalvar: (novaHora: string) => void;
}

export const ModalHoraInicioJejum: React.FC<ModalHoraInicioJejumProps> = ({
  aberto,
  horaAtual,
  onFechar,
  onSalvar,
}) => {
  if (!aberto) return null;

  // Extrai hora e minuto iniciais
  const [partes] = useState(() => {
    const [h, m] = horaAtual.split(':');
    return {
      hora: Number(h) || 19,
      minuto: Number(m) || 0,
    };
  });

  const [horaSel, setHoraSel] = useState<number>(partes.hora);
  const [minutoSel, setMinutoSel] = useState<number>(partes.minuto);

  // Manipuladores de hora
  const incrementarHora = () => setHoraSel((prev) => (prev + 1) % 24);
  const decrementarHora = () => setHoraSel((prev) => (prev - 1 + 24) % 24);

  // Manipuladores de minuto
  const incrementarMinuto = () => setMinutoSel((prev) => (prev + 5) % 60);
  const decrementarMinuto = () => setMinutoSel((prev) => (prev - 5 + 60) % 60);

  // Formatação com dois dígitos
  const strHora = String(horaSel).padStart(2, '0');
  const strMinuto = String(minutoSel).padStart(2, '0');

  // Valores anterior e posterior para efeito visual de roleta
  const strHoraAnterior = String((horaSel - 1 + 24) % 24).padStart(2, '0');
  const strHoraProxima = String((horaSel + 1) % 24).padStart(2, '0');
  const strMinAnterior = String((minutoSel - 5 + 60) % 60).padStart(2, '0');
  const strMinProximo = String((minutoSel + 5) % 60).padStart(2, '0');

  const handleSalvar = () => {
    const horaFormatada = `${strHora}:${strMinuto}`;
    onSalvar(horaFormatada);
    onFechar();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Hora de início do jejum diário"
    >
      {/* Recipiente do Modal com cantos arredondados inferiores no mobile */}
      <div className="w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative select-none animate-in slide-in-from-bottom duration-300">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] font-extrabold text-[#092244] tracking-tight">
            Hora de início do jejum diário
          </h3>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar modal"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor Estilo Roleta com Borda Destaque Verde */}
        <div className="flex flex-col items-center justify-center py-2">
          
          {/* Linha de Valores Anteriores (Efeito Translúcido) */}
          <div className="flex items-center justify-center gap-12 text-slate-300 font-bold text-lg pointer-events-none mb-1">
            <span>{strHoraAnterior}</span>
            <span className="opacity-0">:</span>
            <span>{strMinAnterior}</span>
          </div>

          {/* Botões de Incremento Superior */}
          <div className="flex items-center justify-center gap-10 mb-2">
            <button
              type="button"
              onClick={decrementarHora}
              aria-label="Hora anterior"
              className="p-1 text-emerald-600 hover:text-emerald-700 active:scale-90 transition-transform cursor-pointer"
            >
              <ChevronUp className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div className="w-4" />
            <button
              type="button"
              onClick={decrementarMinuto}
              aria-label="Minuto anterior"
              className="p-1 text-emerald-600 hover:text-emerald-700 active:scale-90 transition-transform cursor-pointer"
            >
              <ChevronUp className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Caixa do Valor Selecionado em Destaque Verde */}
          <div className="w-full max-w-[320px] h-16 rounded-2xl border-2 border-[#00C975] bg-[#EBFBF3]/50 flex items-center justify-around px-8 shadow-xs">
            <span className="text-[32px] font-extrabold text-[#092244] tabular-nums">
              {strHora}
            </span>
            <span className="text-[28px] font-bold text-[#092244] mb-1">
              :
            </span>
            <span className="text-[32px] font-extrabold text-[#092244] tabular-nums">
              {strMinuto}
            </span>
          </div>

          {/* Botões de Decremento Inferior */}
          <div className="flex items-center justify-center gap-10 mt-2 mb-1">
            <button
              type="button"
              onClick={incrementarHora}
              aria-label="Próxima hora"
              className="p-1 text-emerald-600 hover:text-emerald-700 active:scale-90 transition-transform cursor-pointer"
            >
              <ChevronDown className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div className="w-4" />
            <button
              type="button"
              onClick={incrementarMinuto}
              aria-label="Próximo minuto"
              className="p-1 text-emerald-600 hover:text-emerald-700 active:scale-90 transition-transform cursor-pointer"
            >
              <ChevronDown className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Linha de Valores Posteriores (Efeito Translúcido) */}
          <div className="flex items-center justify-center gap-12 text-slate-300 font-bold text-lg pointer-events-none mt-1">
            <span>{strHoraProxima}</span>
            <span className="opacity-0">:</span>
            <span>{strMinProximo}</span>
          </div>
        </div>

        {/* Botão Principal Salvar */}
        <button
          type="button"
          onClick={handleSalvar}
          className="w-full py-4 rounded-2xl bg-[#00C975] hover:bg-[#00b569] active:scale-[0.98] text-white font-bold text-[17px] shadow-lg shadow-[#00C975]/25 transition-all cursor-pointer text-center"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};
