/**
 * @file ModalHoraLembreteAgua.tsx
 * @description Modal Bottom Sheet para definir o horário de Início ou Fim dos lembretes de água.
 * Fiel ao design de rolo/seletor da imagem de referência enviada pelo usuário.
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface ModalHoraLembreteAguaProps {
  aberto: boolean;
  tipo: 'inicio' | 'fim';
  horaAtual: string; // Formato "HH:mm" (ex: "08:00")
  onSalvar: (novaHora: string) => void;
  onFechar: () => void;
}

export const ModalHoraLembreteAgua: React.FC<ModalHoraLembreteAguaProps> = ({
  aberto,
  tipo,
  horaAtual,
  onSalvar,
  onFechar,
}) => {
  // Inicializa hora e minutos separados
  const [hora, setHora] = useState<number>(8);
  const [minuto, setMinuto] = useState<number>(0);

  useEffect(() => {
    if (aberto && horaAtual) {
      const [h, m] = horaAtual.split(':').map((v) => parseInt(v, 10));
      setHora(isNaN(h) ? 8 : h);
      setMinuto(isNaN(m) ? 0 : m);
    }
  }, [aberto, horaAtual]);

  if (!aberto) return null;

  const alterarHora = (delta: number) => {
    setHora((prev) => (prev + delta + 24) % 24);
  };

  const alterarMinuto = (delta: number) => {
    setMinuto((prev) => (prev + delta + 60) % 60);
  };

  const formatar2Digitos = (n: number) => String(n).padStart(2, '0');

  // Valores de visualização do rolo (anterior, atual, próximo)
  const horaAnterior = (hora - 1 + 24) % 24;
  const horaProxima = (hora + 1) % 24;

  const minutoAnterior = (minuto - 1 + 60) % 60;
  const minutoProximo = (minuto + 1) % 60;

  const handleSalvar = () => {
    const horaFormatada = `${formatar2Digitos(hora)}:${formatar2Digitos(minuto)}`;
    onSalvar(horaFormatada);
    onFechar();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300 select-none animate-in fade-in"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-hora-lembrete"
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== Cabeçalho ==================== */}
        <div className="relative flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="w-8" />
          <h2 id="titulo-hora-lembrete" className="text-[19px] font-black text-[#092244] tracking-tight text-center">
            {tipo === 'inicio' ? 'Definir hora de início' : 'Definir hora de término'}
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

        {/* ==================== Seletor Rolo de Horário ==================== */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-6 w-full max-w-[280px]">
            
            {/* Coluna de Horas */}
            <div className="flex flex-col items-center flex-1">
              {/* Botão / Valor Anterior */}
              <button
                type="button"
                onClick={() => alterarHora(-1)}
                className="py-1 text-slate-300 hover:text-slate-400 font-bold text-[20px] tabular-nums active:scale-90 transition-transform cursor-pointer"
              >
                {formatar2Digitos(horaAnterior)}
              </button>

              {/* Botão de seta para cima sutil */}
              <button
                type="button"
                onClick={() => alterarHora(-1)}
                className="text-slate-300 hover:text-slate-500 py-0.5 active:scale-90 transition-transform"
                aria-label="Diminuir hora"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* Separador de dois pontos atenuado topo */}
            <div className="w-4" />

            {/* Coluna de Minutos */}
            <div className="flex flex-col items-center flex-1">
              {/* Botão / Valor Anterior */}
              <button
                type="button"
                onClick={() => alterarMinuto(-1)}
                className="py-1 text-slate-300 hover:text-slate-400 font-bold text-[20px] tabular-nums active:scale-90 transition-transform cursor-pointer"
              >
                {formatar2Digitos(minutoAnterior)}
              </button>

              {/* Botão de seta para cima sutil */}
              <button
                type="button"
                onClick={() => alterarMinuto(-1)}
                className="text-slate-300 hover:text-slate-500 py-0.5 active:scale-90 transition-transform"
                aria-label="Diminuir minuto"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Container Central em Destaque (Borda Verde e Fundo Suave) */}
          <div className="w-full max-w-[280px] h-16 rounded-2xl border-2 border-[#00C975] bg-[#E8FAF3] flex items-center justify-center gap-3 my-1 shadow-xs">
            <span className="text-[34px] font-black text-[#092244] tabular-nums tracking-tight w-20 text-center">
              {formatar2Digitos(hora)}
            </span>
            <span className="text-[26px] font-black text-[#092244] leading-none mb-1">
              :
            </span>
            <span className="text-[34px] font-black text-[#092244] tabular-nums tracking-tight w-20 text-center">
              {formatar2Digitos(minuto)}
            </span>
          </div>

          {/* Linha Inferior (Próximos Valores) */}
          <div className="flex items-center justify-center gap-6 w-full max-w-[280px]">
            {/* Próxima Hora */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => alterarHora(1)}
                className="text-slate-300 hover:text-slate-500 py-0.5 active:scale-90 transition-transform"
                aria-label="Aumentar hora"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => alterarHora(1)}
                className="py-1 text-slate-300 hover:text-slate-400 font-bold text-[20px] tabular-nums active:scale-90 transition-transform cursor-pointer"
              >
                {formatar2Digitos(horaProxima)}
              </button>
            </div>

            <div className="w-4" />

            {/* Próximo Minuto */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => alterarMinuto(1)}
                className="text-slate-300 hover:text-slate-500 py-0.5 active:scale-90 transition-transform"
                aria-label="Aumentar minuto"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => alterarMinuto(1)}
                className="py-1 text-slate-300 hover:text-slate-400 font-bold text-[20px] tabular-nums active:scale-90 transition-transform cursor-pointer"
              >
                {formatar2Digitos(minutoProximo)}
              </button>
            </div>
          </div>
        </div>

        {/* ==================== Botão Salvar ==================== */}
        <div className="pt-2 pb-2">
          <button
            type="button"
            onClick={handleSalvar}
            className="w-full h-13 bg-[#00C975] hover:bg-[#00B76A] active:scale-[0.98] text-white text-[16px] font-black rounded-full shadow-lg shadow-[#00C975]/25 transition-all flex items-center justify-center min-h-[50px] cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
