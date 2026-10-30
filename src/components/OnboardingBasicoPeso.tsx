/**
 * @file OnboardingBasicoPeso.tsx
 * @description Sexta tela do onboarding de Informações Básicas do usuário.
 * Pergunta: "Qual é o seu peso?"
 * Apresenta régua horizontal graduada interativa de peso, card com cálculo dinâmico de IMC em tempo real,
 * barra colorida de categorias de saúde, barra de progresso em 88% e gravação no subgrupo 'informacoesBasicas' no Firestore.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { salvarInformacaoBasicaFirestore } from '../services/firebase';
import { dispararFeedbackHaptico } from '../utils/haptics';

interface OnboardingBasicoPesoProps {
  /** ID do documento do usuário no Firestore */
  usuarioId: string;
  /** Altura do usuário em cm previamente cadastrada (usada para calcular o IMC) */
  altura?: number;
  /** Peso inicial sugerido em kg (padrão 80.0 kg) */
  pesoInicial?: number;
  /** Callback para avançar à próxima etapa com peso e IMC calculados */
  onAvancar: (peso: number, imc: number) => void;
  /** Callback para retornar à etapa anterior (Altura) */
  onVoltar: () => void;
}

const PESO_MIN = 40.0;
const PESO_MAX = 180.0;
const PASSO_PESO = 0.5; // Resolução a cada 500g para precisão e suavidade
const LARGURA_POR_PASSO = 14; // Pixels por cada 0.5kg na régua

export const OnboardingBasicoPeso: React.FC<OnboardingBasicoPesoProps> = ({
  usuarioId,
  altura = 175,
  pesoInicial = 80.0,
  onAvancar,
  onVoltar,
}) => {
  const [peso, setPeso] = useState<number>(pesoInicial);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const containerReguaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const programaticScrollRef = useRef<boolean>(false);

  // Cálculo dinâmico do IMC baseado na altura coletada anteriormente
  const alturaMetros = Math.max(1, altura / 100);
  const imcCalculado = useMemo(() => {
    const val = peso / (alturaMetros * alturaMetros);
    return Number(val.toFixed(1));
  }, [peso, alturaMetros]);

  // Categoria semântica e cor do IMC
  const categoriaIMC = useMemo(() => {
    if (imcCalculado < 18.5) {
      return { rotulo: 'Abaixo do peso', corTexto: 'text-[#38BDF8]' };
    }
    if (imcCalculado < 25.0) {
      return { rotulo: 'Peso normal', corTexto: 'text-[#00C975]' };
    }
    if (imcCalculado < 30.0) {
      return { rotulo: 'Sobrepeso', corTexto: 'text-[#EAB308]' };
    }
    if (imcCalculado < 35.0) {
      return { rotulo: 'Obesidade (Grau I)', corTexto: 'text-[#F97316]' };
    }
    return { rotulo: 'Obesidade Severa', corTexto: 'text-[#EF4444]' };
  }, [imcCalculado]);

  // Posição percentual do triângulo na barra colorida de IMC (faixa de 15 a 40)
  const percentualPosicaoIMC = useMemo(() => {
    const minEscala = 15;
    const maxEscala = 40;
    const pct = ((imcCalculado - minEscala) / (maxEscala - minEscala)) * 100;
    return Math.max(3, Math.min(97, pct));
  }, [imcCalculado]);

  // Converte peso em posição de scroll da régua (com espaçadores flex de 50% - meia largura do passo)
  const calcularScrollParaPeso = useCallback((kg: number) => {
    const indice = Math.round((kg - PESO_MIN) / PASSO_PESO);
    return Math.max(0, indice * LARGURA_POR_PASSO);
  }, []);

  // Centraliza a régua no peso inicial ao montar o componente
  useEffect(() => {
    if (containerReguaRef.current) {
      programaticScrollRef.current = true;
      const targetScroll = calcularScrollParaPeso(pesoInicial);
      containerReguaRef.current.scrollLeft = targetScroll;
      const timer = setTimeout(() => {
        programaticScrollRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pesoInicial, calcularScrollParaPeso]);

  // Trata a rolagem manual da régua
  const handleScroll = () => {
    if (programaticScrollRef.current || !containerReguaRef.current) return;
    const scrollPos = containerReguaRef.current.scrollLeft;

    const indiceCalculado = Math.round(scrollPos / LARGURA_POR_PASSO);
    const kgCalculado = PESO_MIN + indiceCalculado * PASSO_PESO;
    const kgFinal = Math.max(PESO_MIN, Math.min(PESO_MAX, Number(kgCalculado.toFixed(1))));

    if (kgFinal !== peso) {
      setPeso(kgFinal);
      dispararFeedbackHaptico('suave');
    }
  };

  // Arraste com o mouse para desktop
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

  // Suporte a wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerReguaRef.current) return;
    e.preventDefault();
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    containerReguaRef.current.scrollLeft += delta * 0.7;
  };

  // Suporte a setas de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        const novo = Math.max(PESO_MIN, Number((peso - PASSO_PESO).toFixed(1)));
        setPeso(novo);
        if (containerReguaRef.current) {
          programaticScrollRef.current = true;
          containerReguaRef.current.scrollLeft = calcularScrollParaPeso(novo);
          setTimeout(() => { programaticScrollRef.current = false; }, 50);
        }
      } else if (e.key === 'ArrowRight') {
        const novo = Math.min(PESO_MAX, Number((peso + PASSO_PESO).toFixed(1)));
        setPeso(novo);
        if (containerReguaRef.current) {
          programaticScrollRef.current = true;
          containerReguaRef.current.scrollLeft = calcularScrollParaPeso(novo);
          setTimeout(() => { programaticScrollRef.current = false; }, 50);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [peso, calcularScrollParaPeso]);

  // Salva no subgrupo 'informacoesBasicas' no Firestore e avança
  const handleProximo = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    try {
      if (usuarioId) {
        await salvarInformacaoBasicaFirestore(usuarioId, 'peso', peso);
        await salvarInformacaoBasicaFirestore(usuarioId, 'imc', imcCalculado);
      }
      onAvancar(peso, imcCalculado);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Não conseguimos salvar seu peso. Verifique sua conexão e tente novamente.';
      setErro(msg);
      setSalvando(false);
    }
  };

  // Gera a lista de divisões da régua
  const totalPassos = Math.round((PESO_MAX - PESO_MIN) / PASSO_PESO) + 1;
  const listaPassos = Array.from({ length: totalPassos }, (_, i) => Number((PESO_MIN + i * PASSO_PESO).toFixed(1)));

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-[#0B1F3A] flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Container responsivo mobile-first */}
      <main className="w-full max-w-md min-h-screen bg-white flex flex-col justify-between px-6 pt-3 pb-8 relative shadow-2xl safe-top safe-bottom">
        {/* ==================== Área Superior: Header & Barra de Progresso ==================== */}
        <header className="w-full pt-2 pb-2">
          <div className="relative flex items-center justify-center py-2">
            <button
              type="button"
              onClick={onVoltar}
              disabled={salvando}
              aria-label="Voltar para a etapa anterior"
              className="absolute left-0 p-2 text-slate-800 hover:text-[#00C975] active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </button>

            <h1 className="text-[17px] font-bold text-[#0B1F3A] tracking-tight">
              Informações Básicas
            </h1>
          </div>

          {/* Barra de Progresso Linear (Passo 6 de 8 = ~88%) */}
          <div className="w-full bg-[#E2E8F0]/60 h-1.5 rounded-full mt-3 overflow-hidden" role="progressbar" aria-valuenow={88} aria-valuemin={0} aria-valuemax={100}>
            <div 
              className="bg-[#00C975] h-full rounded-full transition-all duration-500 ease-out" 
              style={{ width: '88%' }}
            />
          </div>
        </header>

        {/* Feedback de erro humanizado */}
        {erro && (
          <div className="w-full my-1 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <p className="leading-relaxed">{erro}</p>
          </div>
        )}

        {/* ==================== Área Central: Pergunta, Peso & Régua & Card IMC ==================== */}
        <section className="flex-1 flex flex-col items-center justify-start pt-2 w-full">
          {/* Título Principal */}
          <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] text-center tracking-tight mb-4">
            Qual é o seu peso?
          </h2>

          {/* Mostrador Central do Peso */}
          <div className="flex items-baseline justify-center mb-1 text-[#00C975]">
            <span className="text-5xl font-extrabold tracking-tight">
              {peso.toFixed(1)}
            </span>
            <span className="text-xl font-bold ml-1.5 lowercase">
              kg
            </span>
          </div>

          {/* Indicador Triangular Central Verde */}
          <div className="flex justify-center text-[#00C975] -mb-1">
            <svg className="w-4 h-4 fill-current drop-shadow-sm" viewBox="0 0 24 24">
              <path d="M12 18l-9-14h18z" />
            </svg>
          </div>

          {/* Régua Graduada Interativa */}
          <div 
            className="w-full overflow-hidden py-3 relative border-b border-t border-slate-100 my-2 select-none [mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]"
            data-purpose="ruler-component"
          >
            {/* Marcador central ativo fixo verde */}
            <div className="absolute left-1/2 -translate-x-1/2 top-3 h-12 w-0.5 bg-[#00C975] rounded-full z-10 pointer-events-none shadow-sm" />

            <div
              ref={containerReguaRef}
              onScroll={handleScroll}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="flex items-end h-20 w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing touch-pan-x"
              style={{
                scrollBehavior: isDraggingRef.current ? 'auto' : 'smooth',
              }}
            >
              {/* Espaçador flex inicial para centralizar o primeiro item */}
              <div className="flex-shrink-0" style={{ width: `calc(50% - ${LARGURA_POR_PASSO / 2}px)` }} />

              {listaPassos.map((kg) => {
                const isInteiro = Number.isInteger(kg);
                const isAtivo = Math.abs(kg - peso) < 0.25;

                return (
                  <div
                    key={kg}
                    onClick={() => {
                      setPeso(kg);
                      if (containerReguaRef.current) {
                        programaticScrollRef.current = true;
                        containerReguaRef.current.scrollLeft = calcularScrollParaPeso(kg);
                        setTimeout(() => { programaticScrollRef.current = false; }, 50);
                      }
                    }}
                    style={{ width: `${LARGURA_POR_PASSO}px` }}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                  >
                    {/* Linha de Graduação */}
                    <div
                      className={`rounded-full transition-all ${
                        isAtivo
                          ? 'w-0.5 h-12 bg-[#00C975] shadow-sm'
                          : isInteiro
                          ? 'w-0.5 h-10 bg-slate-300'
                          : 'w-0.5 h-5 bg-slate-200 mb-2'
                      }`}
                    />

                    {/* Rótulo Numérico do Quilo Inteiro */}
                    {isInteiro ? (
                      <span className={`text-xs mt-2 select-none pointer-events-none transition-colors ${
                        isAtivo ? 'font-bold text-slate-700 text-sm' : 'font-semibold text-slate-400'
                      }`}>
                        {kg}
                      </span>
                    ) : (
                      <div className="h-4 mt-2" />
                    )}
                  </div>
                );
              })}

              {/* Espaçador flex final para centralizar o último item */}
              <div className="flex-shrink-0" style={{ width: `calc(50% - ${LARGURA_POR_PASSO / 2}px)` }} />
            </div>
          </div>

          {/* ==================== Card Inteligente de Cálculo de IMC ==================== */}
          <section className="w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.05)] mt-3">
            {/* Título do IMC com Classificação Colorida */}
            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
              <span className="text-base sm:text-lg font-extrabold text-[#0B1F3A]">Seu IMC:</span>
              <span className="text-base sm:text-lg font-extrabold text-[#0B1F3A]">{imcCalculado}</span>
              <span className={`text-sm sm:text-base font-semibold ml-1 ${categoriaIMC.corTexto}`}>
                {categoriaIMC.rotulo}
              </span>
            </div>

            {/* Triângulo Apontador Dinâmico da Posição do IMC */}
            <div className="w-full relative h-3 mb-1">
              <div 
                className="absolute -top-1 -translate-x-1/2 transition-all duration-300 ease-out"
                style={{ left: `${percentualPosicaoIMC}%` }}
              >
                <svg className="w-3.5 h-3.5 fill-[#0B1F3A]" viewBox="0 0 24 24">
                  <path d="M12 18l-9-14h18z" />
                </svg>
              </div>
            </div>

            {/* Barra Colorida das 5 Categorias da OMS */}
            <div className="w-full h-3 rounded-full overflow-hidden flex shadow-inner gap-0.5">
              {/* Abaixo do peso: 15 - 18.5 (~14%) */}
              <div className="h-full bg-[#38BDF8] flex-[1.4] rounded-l-full" title="Abaixo do peso (&lt; 18.5)" />
              {/* Peso normal: 18.5 - 25.0 (~26%) */}
              <div className="h-full bg-[#00C975] flex-[2.6]" title="Peso normal (18.5 - 24.9)" />
              {/* Sobrepeso: 25.0 - 30.0 (~20%) */}
              <div className="h-full bg-[#EAB308] flex-[2.0]" title="Sobrepeso (25.0 - 29.9)" />
              {/* Obesidade Grau I: 30.0 - 35.0 (~20%) */}
              <div className="h-full bg-[#F97316] flex-[2.0]" title="Obesidade Grau I (30.0 - 34.9)" />
              {/* Obesidade Severa: 35.0 - 40.0 (~20%) */}
              <div className="h-full bg-[#EF4444] flex-[2.0] rounded-r-full" title="Obesidade Severa (&ge; 35.0)" />
            </div>

            {/* Escala Numérica do IMC */}
            <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 mt-2 px-0.5">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>35</span>
              <span>40</span>
            </div>
          </section>
        </section>

        {/* ==================== Área Inferior: Aviso de Privacidade & CTA ==================== */}
        <footer className="w-full flex flex-col items-center pt-4 pb-2 bg-white mt-auto">
          {/* Texto de Privacidade */}
          <p className="text-xs text-[#94A3B8] text-center leading-relaxed px-4 mb-4 max-w-xs">
            Nunca venderemos ou compartilharemos seus dados pessoais de forma inadequada.
          </p>

          {/* Botão Primário Próximo */}
          <button
            type="button"
            onClick={handleProximo}
            disabled={salvando}
            className={`w-full py-4 px-6 bg-[#00C975] hover:bg-[#00B568] active:scale-[0.99] text-white font-bold text-lg rounded-full shadow-lg shadow-emerald-500/25 transition duration-150 flex items-center justify-center min-h-[56px] ${
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
        </footer>
      </main>
    </div>
  );
};
