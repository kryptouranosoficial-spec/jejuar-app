/**
 * @file bioimpedancia/ModalSelecionarHorario.tsx
 * @description Modal bottom sheet para seleção intuitiva e tátil de horário do exame de bioimpedância.
 * Apresenta seletor de roleta/tambor (horas e minutos), atalhos rápidos ("Agora", "07:00", etc.)
 * e zonas de toque seguras de 48px para ergonomia perfeita no celular.
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Clock, Check } from 'lucide-react';

interface ModalSelecionarHorarioProps {
  aberto: boolean;
  horarioAtual: string; // Formato "HH:mm" (ex: "07:35")
  onSalvar: (novoHorario: string) => void;
  onLimpar?: () => void;
  onFechar: () => void;
}

export const ModalSelecionarHorario: React.FC<ModalSelecionarHorarioProps> = ({
  aberto,
  horarioAtual,
  onSalvar,
  onLimpar,
  onFechar,
}) => {
  const [hora, setHora] = useState<number>(7);
  const [minuto, setMinuto] = useState<number>(30);

  // Inicializa com o horário recebido ou com o horário atual
  useEffect(() => {
    if (!aberto) return;

    if (horarioAtual && horarioAtual.includes(':')) {
      const [h, m] = horarioAtual.split(':').map(Number);
      setHora(!isNaN(h) && h >= 0 && h <= 23 ? h : 7);
      setMinuto(!isNaN(m) && m >= 0 && m <= 59 ? m : 0);
    } else {
      const agora = new Date();
      setHora(agora.getHours());
      setMinuto(agora.getMinutes());
    }
  }, [aberto, horarioAtual]);

  if (!aberto) return null;

  // Ajustes de hora (0 a 23)
  const incrementarHora = () => setHora((prev) => (prev + 1) % 24);
  const decrementarHora = () => setHora((prev) => (prev - 1 + 24) % 24);

  // Ajustes de minuto (0 a 59)
  const incrementarMinuto = () => setMinuto((prev) => (prev + 1) % 60);
  const decrementarMinuto = () => setMinuto((prev) => (prev - 1 + 60) % 60);

  // Valores adjacentes para sensação visual de roleta contínua
  const horaAnterior = (hora - 1 + 24) % 24;
  const horaPosterior = (hora + 1) % 24;
  const minutoAnterior = (minuto - 1 + 60) % 60;
  const minutoPosterior = (minuto + 1) % 60;

  // Preenche com o horário atual do relógio
  const preencherAgora = () => {
    const agora = new Date();
    setHora(agora.getHours());
    setMinuto(agora.getMinutes());
  };

  // Preenche atalho rápido
  const preencherAtalho = (h: number, m: number) => {
    setHora(h);
    setMinuto(m);
  };

  const handleConfirmar = () => {
    const formatada = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    onSalvar(formatada);
    onFechar();
  };

  return (
    <div
      className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center animate-in fade-in duration-200"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl relative flex flex-col items-center animate-in slide-in-from-bottom duration-300 select-none"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
      >
        {/* Barra superior de arraste */}
        <div className="w-10 h-1.5 bg-slate-200 rounded-full mb-4" />

        {/* Cabeçalho */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B1C30]">
                Horário da Bioimpedância
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste a hora e minuto do atendimento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Atalhos Rápidos */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
          <button
            type="button"
            onClick={preencherAgora}
            className="min-h-[36px] px-3 rounded-full bg-[#00C975]/15 text-[#006D3D] text-xs font-bold whitespace-nowrap active:scale-95 transition-all cursor-pointer"
          >
            Agora
          </button>
          {[
            { label: '07:00', h: 7, m: 0 },
            { label: '07:35', h: 7, m: 35 },
            { label: '08:00', h: 8, m: 0 },
            { label: '12:00', h: 12, m: 0 },
            { label: '18:00', h: 18, m: 0 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => preencherAtalho(item.h, item.m)}
              className="min-h-[36px] px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Seletor Visual de Horas e Minutos (Wheel Picker) */}
        <div className="w-full flex items-center justify-center gap-6 my-4 relative">
          
          {/* Coluna de Horas */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Hora
            </span>

            <button
              type="button"
              onClick={decrementarHora}
              className="w-12 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
              aria-label="Diminuir hora"
            >
              <ChevronUp className="w-6 h-6 stroke-[2]" />
            </button>

            <div className="flex flex-col items-center my-1">
              <span className="text-sm font-semibold text-slate-300 tabular-nums">
                {String(horaAnterior).padStart(2, '0')}
              </span>
              <div className="w-16 h-14 my-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006D3D] flex items-center justify-center text-2xl font-black tabular-nums shadow-xs">
                {String(hora).padStart(2, '0')}
              </div>
              <span className="text-sm font-semibold text-slate-300 tabular-nums">
                {String(horaPosterior).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={incrementarHora}
              className="w-12 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
              aria-label="Aumentar hora"
            >
              <ChevronDown className="w-6 h-6 stroke-[2]" />
            </button>
          </div>

          {/* Separador Dois Pontos */}
          <div className="text-3xl font-black text-slate-400 self-center mt-4">:</div>

          {/* Coluna de Minutos */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Minuto
            </span>

            <button
              type="button"
              onClick={decrementarMinuto}
              className="w-12 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
              aria-label="Diminuir minuto"
            >
              <ChevronUp className="w-6 h-6 stroke-[2]" />
            </button>

            <div className="flex flex-col items-center my-1">
              <span className="text-sm font-semibold text-slate-300 tabular-nums">
                {String(minutoAnterior).padStart(2, '0')}
              </span>
              <div className="w-16 h-14 my-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006D3D] flex items-center justify-center text-2xl font-black tabular-nums shadow-xs">
                {String(minuto).padStart(2, '0')}
              </div>
              <span className="text-sm font-semibold text-slate-300 tabular-nums">
                {String(minutoPosterior).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={incrementarMinuto}
              className="w-12 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
              aria-label="Aumentar minuto"
            >
              <ChevronDown className="w-6 h-6 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="w-full flex items-center gap-2.5 mt-2">
          {onLimpar && (
            <button
              type="button"
              onClick={() => {
                onLimpar();
                onFechar();
              }}
              className="min-h-[48px] px-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              Sem horário
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmar}
            className="flex-1 min-h-[48px] rounded-2xl bg-[#00C975] hover:bg-[#00B066] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar {String(hora).padStart(2, '0')}:{String(minuto).padStart(2, '0')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
