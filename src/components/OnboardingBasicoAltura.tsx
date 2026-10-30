/**
 * @file OnboardingBasicoAltura.tsx
 * @description Quinta tela do onboarding de Informações Básicas do usuário.
 * Pergunta: "Qual é a sua altura?"
 * Apresenta régua horizontal interativa com rolagem/arraste suave (swipe),
 * marcador central verde esmeralda, barra de progresso em 78% e gravação no subgrupo
 * 'informacoesBasicas.altura' no Firestore.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { salvarInformacaoBasicaFirestore } from '../services/firebase';
import { dispararFeedbackHaptico } from '../utils/haptics';

interface OnboardingBasicoAlturaProps {
  /** ID do documento do usuário no Firestore */
  usuarioId: string;
  /** Altura inicial em cm (padrão 175 conforme o design) */
  alturaInicial?: number;
  /** Callback para avançar à próxima etapa com a altura selecionada */
  onAvancar: (altura: number) => void;
  /** Callback para retornar à etapa anterior (Gênero) */
  onVoltar: () => void;
}

const ALTURA_MIN = 130;
const ALTURA_MAX = 220;
const LARGURA_POR_CM = 10; // 10px de espaçamento entre cada centímetro

export const OnboardingBasicoAltura: React.FC<OnboardingBasicoAlturaProps> = ({
  usuarioId,
  alturaInicial = 175,
  onAvancar,
  onVoltar,
}) => {
  const [altura, setAltura] = useState<number>(alturaInicial);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const containerReguaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const programaticScrollRef = useRef<boolean>(false);

  // Converte altura em posição de scroll da régua (com espaçadores flex de 50% - meia largura da marca de 10px)
  const calcularScrollParaAltura = useCallback((cm: number) => {
    const indice = cm - ALTURA_MIN;
    return Math.max(0, indice * LARGURA_POR_CM);
  }, []);

  // Centraliza a régua na altura inicial ao carregar
  useEffect(() => {
    if (containerReguaRef.current) {
      programaticScrollRef.current = true;
      const targetScroll = calcularScrollParaAltura(alturaInicial);
      containerReguaRef.current.scrollLeft = targetScroll;
      const timer = setTimeout(() => {
        programaticScrollRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [alturaInicial, calcularScrollParaAltura]);

  // Atualiza a altura com base na posição atual de rolagem da régua
  const handleScroll = () => {
    if (programaticScrollRef.current || !containerReguaRef.current) return;
    const scrollPos = containerReguaRef.current.scrollLeft;

    const cmCalculado = Math.round(scrollPos / LARGURA_POR_CM) + ALTURA_MIN;
    const cmFinal = Math.max(ALTURA_MIN, Math.min(ALTURA_MAX, cmCalculado));

    if (cmFinal !== altura) {
      setAltura(cmFinal);
      dispararFeedbackHaptico('suave');
    }
  };

  // Manipuladores de mouse para arrastar a régua no desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerReguaRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - containerReguaRef.current.offsetLeft;
    scrollLeftStartRef.current = containerReguaRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerReguaRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerReguaRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    containerReguaRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Suporte à roda do mouse (wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerReguaRef.current) return;
    e.preventDefault();
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    containerReguaRef.current.scrollLeft += delta * 0.8;
  };

  // Suporte a teclado para acessibilidade (Setas Direita e Esquerda)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        const novo = Math.max(ALTURA_MIN, altura - 1);
        setAltura(novo);
        if (containerReguaRef.current) {
          programaticScrollRef.current = true;
          containerReguaRef.current.scrollLeft = calcularScrollParaAltura(novo);
          setTimeout(() => { programaticScrollRef.current = false; }, 50);
        }
      } else if (e.key === 'ArrowRight') {
        const novo = Math.min(ALTURA_MAX, altura + 1);
        setAltura(novo);
        if (containerReguaRef.current) {
          programaticScrollRef.current = true;
          containerReguaRef.current.scrollLeft = calcularScrollParaAltura(novo);
          setTimeout(() => { programaticScrollRef.current = false; }, 50);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [altura, calcularScrollParaAltura]);

  // Trata o avanço salvando a altura no subgrupo 'informacoesBasicas'
  const handleProximo = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    try {
      if (usuarioId) {
        await salvarInformacaoBasicaFirestore(usuarioId, 'altura', altura);
      }
      onAvancar(altura);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Não conseguimos salvar sua altura. Verifique sua conexão e tente novamente.';
      setErro(msg);
      setSalvando(false);
    }
  };

  // Array contínuo de centímetro a centímetro
  const listaCms = Array.from({ length: ALTURA_MAX - ALTURA_MIN + 1 }, (_, i) => ALTURA_MIN + i);

  return (
    <div className="w-full min-h-screen bg-white text-[#0E192D] flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Container responsivo mobile-first */}
      <main className="w-full max-w-md min-h-screen flex flex-col justify-between px-6 pt-3 pb-8 relative safe-top safe-bottom">
        {/* ==================== Área Superior: Header & Barra de Progresso ==================== */}
        <header className="w-full pt-2">
          <div className="flex items-center justify-between relative py-2">
            <button
              type="button"
              onClick={onVoltar}
              disabled={salvando}
              aria-label="Voltar para a etapa anterior"
              className="w-10 h-10 -ml-2 flex items-center justify-center text-[#0E192D] active:scale-95 transition-transform min-h-[44px] min-w-[44px] rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </button>

            <h1 className="text-[17px] font-bold text-[#0E192D] text-center flex-1 pr-8 tracking-tight">
              Informações Básicas
            </h1>
          </div>

          {/* Barra de Progresso Linear (Passo 5 de 5 = ~78%) */}
          <div className="mt-3 w-full bg-[#EEF2F6] h-1.5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={78} aria-valuemin={0} aria-valuemax={100}>
            <div 
              className="bg-[#00C975] h-full rounded-full transition-all duration-400 ease-out" 
              style={{ width: '78%' }}
            />
          </div>
        </header>

        {/* Feedback de erro humanizado */}
        {erro && (
          <div className="w-full my-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <p className="leading-relaxed">{erro}</p>
          </div>
        )}

        {/* ==================== Área Central: Pergunta, Valor Numérico & Régua ==================== */}
        <section className="flex-1 flex flex-col items-center justify-center -mt-4 w-full">
          {/* Título da Pergunta */}
          <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#0E192D] tracking-tight text-center mb-8">
            Qual é a sua altura?
          </h2>

          {/* Valor da Altura em Destaque */}
          <div className="flex flex-col items-center relative w-full mb-1">
            <div className="flex items-baseline justify-center">
              <span className="text-5xl font-extrabold text-[#00C975] tracking-tight" id="current-height-value">
                {altura}
              </span>
              <span className="text-lg font-bold text-[#00C975] ml-1">
                cm
              </span>
            </div>

            {/* Triângulo indicador apontando para a marca central da régua */}
            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-[#00C975] mt-2 z-20" />
          </div>

          {/* Contêiner da Régua Horizontal Interativa com Máscara Gradiente */}
          <div 
            className="w-full relative py-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]" 
            data-purpose="ruler-container"
          >
            {/* Marcador Fixo Central Alinhado com o Triângulo */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 h-14 w-[2.5px] bg-[#00C975] rounded-full z-10 pointer-events-none" />

            {/* Área Rolável de Ticks */}
            <div
              ref={containerReguaRef}
              onScroll={handleScroll}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="w-full flex items-end select-none overflow-x-auto no-scrollbar py-2 cursor-grab active:cursor-grabbing touch-pan-x"
              style={{
                scrollBehavior: isDraggingRef.current ? 'auto' : 'smooth',
              }}
            >
              {/* Espaçador flex inicial para centralizar o primeiro item */}
              <div className="flex-shrink-0" style={{ width: `calc(50% - ${LARGURA_POR_CM / 2}px)` }} />

              {listaCms.map((cm) => {
                const isDezena = cm % 10 === 0;
                const isCinco = cm % 5 === 0 && !isDezena;

                return (
                  <div
                    key={cm}
                    onClick={() => {
                      setAltura(cm);
                      if (containerReguaRef.current) {
                        programaticScrollRef.current = true;
                        containerReguaRef.current.scrollLeft = calcularScrollParaAltura(cm);
                        setTimeout(() => { programaticScrollRef.current = false; }, 50);
                      }
                    }}
                    style={{ width: `${LARGURA_POR_CM}px` }}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                  >
                    {/* Linha de Marcação do Centímetro */}
                    <div
                      className={`transition-all rounded-full ${
                        isDezena
                          ? 'h-10 w-[1.5px] bg-slate-300'
                          : isCinco
                          ? 'h-7 w-[1.5px] bg-slate-300'
                          : 'h-4 w-[1px] bg-slate-200'
                      }`}
                    />

                    {/* Rótulo Numérico das Dezenas */}
                    {isDezena ? (
                      <span className="text-xs font-semibold text-slate-400 mt-2.5 -translate-x-0.5 select-none pointer-events-none">
                        {cm}
                      </span>
                    ) : (
                      <div className="h-4 mt-2.5" />
                    )}
                  </div>
                );
              })}

              {/* Espaçador flex final para centralizar o último item */}
              <div className="flex-shrink-0" style={{ width: `calc(50% - ${LARGURA_POR_CM / 2}px)` }} />
            </div>
          </div>
        </section>

        {/* ==================== Área Inferior: Aviso de Privacidade & CTA ==================== */}
        <footer className="w-full flex flex-col items-center space-y-4 mt-auto">
          {/* Texto de Privacidade */}
          <p className="text-[12.5px] leading-relaxed text-[#94A3B8] text-center max-w-[280px]">
            Nunca venderemos ou compartilharemos seus dados pessoais de forma inadequada.
          </p>

          {/* Botão Primário Próximo */}
          <button
            type="button"
            onClick={handleProximo}
            disabled={salvando}
            className={`w-full py-4 bg-[#00C975] hover:bg-[#00B368] active:scale-[0.99] text-white font-bold text-base rounded-full shadow-[0_8px_20px_rgba(0,201,117,0.28)] transition-all duration-150 flex items-center justify-center tracking-wide min-h-[56px] ${
              salvando ? 'opacity-80 cursor-wait' : 'cursor-pointer'
            }`}
          >
            {salvando ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : (
              <span>Próximo</span>
            )}
          </button>

          {/* Indicador de home iOS/Android */}
          <div className="w-32 h-1 bg-slate-200 rounded-full mx-auto mt-2" />
        </footer>
      </main>
    </div>
  );
};
