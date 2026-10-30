/**
 * @file ModalRegistrarMedidaCorpo.tsx
 * @description Modal bottom sheet para registrar medidas corporais (Cintura, Peito, Coxa, Braço, Quadris)
 * com régua de precisão interativa em centímetros, conforme o design de referência.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export type ParteDoCorpo = 'cintura' | 'peito' | 'coxa' | 'braco' | 'quadris';

export interface ParteCorpoInfo {
  id: ParteDoCorpo;
  rotulo: string;
  minimo: number;
  maximo: number;
  padrao: number;
}

export const PARTES_CORPO_CONFIG: Record<ParteDoCorpo, ParteCorpoInfo> = {
  cintura: { id: 'cintura', rotulo: 'Cintura', minimo: 40, maximo: 180, padrao: 90 },
  peito: { id: 'peito', rotulo: 'Peito', minimo: 40, maximo: 180, padrao: 95 },
  coxa: { id: 'coxa', rotulo: 'Coxa', minimo: 30, maximo: 120, padrao: 55 },
  braco: { id: 'braco', rotulo: 'Braço', minimo: 15, maximo: 70, padrao: 32 },
  quadris: { id: 'quadris', rotulo: 'Quadris', minimo: 50, maximo: 200, padrao: 100 },
};

interface ModalRegistrarMedidaCorpoProps {
  /** Se a modal está visível */
  visivel: boolean;
  /** Identificador da parte do corpo selecionada */
  parte: ParteDoCorpo;
  /** Valor inicial em cm */
  valorInicial?: number;
  /** Callback ao fechar a modal */
  onFechar: () => void;
  /** Callback ao salvar a medida */
  onSalvar: (valorCm: number, parte: ParteDoCorpo) => void;
}

// Largura em pixels por centímetro na régua
const PIXELS_POR_CM = 12;

export const ModalRegistrarMedidaCorpo: React.FC<ModalRegistrarMedidaCorpoProps> = ({
  visivel,
  parte,
  valorInicial,
  onFechar,
  onSalvar,
}) => {
  const infoParte = PARTES_CORPO_CONFIG[parte] || PARTES_CORPO_CONFIG.cintura;
  
  // Valor numérico em cm selecionado
  const [valor, setValor] = useState<number>(() => {
    return valorInicial && valorInicial >= infoParte.minimo && valorInicial <= infoParte.maximo
      ? valorInicial
      : infoParte.padrao;
  });

  // Unidade de exibição: 'cm' padrão ou 'ft'
  const [unidade, setUnidade] = useState<'cm' | 'ft'>('cm');

  // Controle de arrasto (drag / swipe) da régua
  const containerReguaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startScrollLeftRef = useRef<number>(0);
  const isUserScrollingRef = useRef<boolean>(false);

  // Sincroniza o valor inicial sempre que a parte ou modal abrir
  useEffect(() => {
    if (visivel) {
      const v = valorInicial && valorInicial >= infoParte.minimo && valorInicial <= infoParte.maximo
        ? valorInicial
        : infoParte.padrao;
      setValor(v);
    }
  }, [visivel, parte, valorInicial, infoParte]);

  // Posiciona a régua no valor atual ao abrir
  const posicionarReguaNoValor = useCallback((val: number) => {
    if (!containerReguaRef.current) return;
    const larguraContainer = containerReguaRef.current.clientWidth;
    const offsetCentro = larguraContainer / 2;
    const distanciaDoMinimo = (val - infoParte.minimo) * PIXELS_POR_CM;
    
    containerReguaRef.current.scrollLeft = Math.max(0, distanciaDoMinimo - offsetCentro);
  }, [infoParte.minimo]);

  useEffect(() => {
    if (visivel) {
      const timer = setTimeout(() => {
        posicionarReguaNoValor(valor);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [visivel, posicionarReguaNoValor, valor]);

  // Detecta o scroll manual na régua para atualizar o valor
  const handleScrollRegua = () => {
    if (!containerReguaRef.current || !isUserScrollingRef.current) return;
    const larguraContainer = containerReguaRef.current.clientWidth;
    const offsetCentro = larguraContainer / 2;
    const scrollAtual = containerReguaRef.current.scrollLeft;
    
    const valorCalculado = infoParte.minimo + Math.round((scrollAtual + offsetCentro) / PIXELS_POR_CM);
    const valorLimitado = Math.min(Math.max(valorCalculado, infoParte.minimo), infoParte.maximo);
    
    if (valorLimitado !== valor) {
      setValor(valorLimitado);
    }
  };

  // Handlers para arrastar com mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerReguaRef.current) return;
    isDraggingRef.current = true;
    isUserScrollingRef.current = true;
    startXRef.current = e.pageX - containerReguaRef.current.offsetLeft;
    startScrollLeftRef.current = containerReguaRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerReguaRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerReguaRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    containerReguaRef.current.scrollLeft = startScrollLeftRef.current - walk;
    handleScrollRegua();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
  };

  // Handlers para arrastar com toque mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerReguaRef.current) return;
    isDraggingRef.current = true;
    isUserScrollingRef.current = true;
    startXRef.current = e.touches[0].pageX - containerReguaRef.current.offsetLeft;
    startScrollLeftRef.current = containerReguaRef.current.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !containerReguaRef.current) return;
    const x = e.touches[0].pageX - containerReguaRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    containerReguaRef.current.scrollLeft = startScrollLeftRef.current - walk;
    handleScrollRegua();
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
  };

  // Se não estiver visível, não renderiza
  if (!visivel) return null;

  // Gera as marcações da régua
  const totalPontos = infoParte.maximo - infoParte.minimo;
  const arrayMarcas = Array.from({ length: totalPontos + 1 }, (_, i) => infoParte.minimo + i);

  // Valor exibido na unidade selecionada
  const valorExibido = unidade === 'cm' ? valor : (valor / 30.48).toFixed(1);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      onClick={onFechar}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== Cabeçalho da Modal ==================== */}
        <div className="relative flex items-center justify-between pb-5 border-b border-gray-100">
          <div className="w-8" /> {/* Espaçador para centralizar o título */}
          <h2 className="text-[19px] font-black text-[#092244] tracking-tight">
            Dados do corpo
          </h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-slate-100/90 text-slate-500 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ==================== Seletor de Parte e Unidade ==================== */}
        <div className="flex items-center justify-between pt-5 pb-3">
          <span className="text-[19px] font-black text-[#092244]">
            {infoParte.rotulo}
          </span>

          {/* Toggle de Unidades cm / ft */}
          <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-full text-[13px] font-bold">
            <button
              type="button"
              onClick={() => setUnidade('cm')}
              className={`px-3 py-1 rounded-full transition-all duration-200 min-h-[30px] ${
                unidade === 'cm'
                  ? 'bg-white text-[#092244] shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              cm
            </button>
            <button
              type="button"
              onClick={() => setUnidade('ft')}
              className={`px-3 py-1 rounded-full transition-all duration-200 min-h-[30px] ${
                unidade === 'ft'
                  ? 'bg-white text-[#092244] shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              ft
            </button>
          </div>
        </div>

        {/* ==================== Mostrador Numérico em Verde Esmeralda ==================== */}
        <div className="flex flex-col items-center justify-center py-5">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-[52px] leading-none font-black text-[#00C975] tracking-tight">
              {valorExibido}
            </span>
            <span className="text-[17px] font-bold text-[#00C975] self-end mb-1">
              {unidade}
            </span>
          </div>

          {/* Indicador Triangular Central (Ponteiro da Régua) */}
          <div className="flex flex-col items-center justify-center mt-2">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#00C975]" />
            <div className="w-[2px] h-9 bg-[#00C975] rounded-full mt-0.5" />
          </div>
        </div>

        {/* ==================== Régua Interativa Deslizante ==================== */}
        <div className="relative w-full py-2 select-none">
          {/* Efeito de fade nas bordas laterais da régua */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

          <div
            ref={containerReguaRef}
            onScroll={handleScrollRegua}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full overflow-x-auto scrollbar-none py-1 cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div 
              className="flex items-end justify-start h-20 px-[50%]"
              style={{ width: `${(totalPontos + 1) * PIXELS_POR_CM + 400}px` }}
            >
              {arrayMarcas.map((m) => {
                const ehDezena = m % 10 === 0;
                const ehCinco = m % 5 === 0 && !ehDezena;
                
                return (
                  <div
                    key={m}
                    className="flex flex-col items-center justify-end"
                    style={{ width: `${PIXELS_POR_CM}px`, minWidth: `${PIXELS_POR_CM}px` }}
                  >
                    {/* Linha vertical da marcação */}
                    <div
                      className={`w-[1.5px] rounded-full transition-colors ${
                        ehDezena
                          ? 'h-8 bg-slate-300'
                          : ehCinco
                            ? 'h-5 bg-slate-200'
                            : 'h-3 bg-slate-200/70'
                      }`}
                    />
                    
                    {/* Número abaixo da régua a cada 10 cm */}
                    <div className="h-6 flex items-center justify-center mt-1">
                      {ehDezena && (
                        <span className="text-[12px] font-semibold text-slate-400">
                          {m}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================== Botão de Ação Salvar ==================== */}
        <div className="pt-6 pb-2">
          <button
            type="button"
            onClick={() => {
              onSalvar(valor, parte);
              onFechar();
            }}
            className="w-full h-13 bg-[#00C975] hover:bg-[#00B76A] active:scale-[0.98] text-white text-[16px] font-black rounded-full shadow-lg shadow-[#00C975]/25 transition-all flex items-center justify-center min-h-[48px]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
