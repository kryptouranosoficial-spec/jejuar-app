/**
 * @file OnboardingBasicoPesoDesejado.tsx
 * @description Sétima tela do onboarding de Informações Básicas do usuário.
 * Pergunta: "Defina seu peso desejado"
 * Apresenta régua com área sombreada da meta, tag comparativa do peso atual,
 * cálculo dinâmico da faixa de peso saudável e card inteligente de viabilidade da meta.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { salvarInformacaoBasicaFirestore } from '../services/firebase';
import { dispararFeedbackHaptico } from '../utils/haptics';

interface OnboardingBasicoPesoDesejadoProps {
  /** ID do documento do usuário no Firestore */
  usuarioId: string;
  /** Altura em cm do usuário (usada para calcular o peso saudável recomendado) */
  altura?: number;
  /** Peso atual cadastrado na etapa anterior */
  pesoAtual?: number;
  /** Peso desejado inicial sugerido em kg (padrão 66.0 kg) */
  pesoDesejadoInicial?: number;
  /** Callback para avançar à próxima etapa com o peso desejado selecionado */
  onAvancar: (pesoDesejado: number) => void;
  /** Callback para retornar à etapa anterior (Peso Atual) */
  onVoltar: () => void;
}

const PESO_MIN = 35.0;
const PESO_MAX = 160.0;
const PASSO_PESO = 0.5;
const LARGURA_POR_PASSO = 14;

export const OnboardingBasicoPesoDesejado: React.FC<OnboardingBasicoPesoDesejadoProps> = ({
  usuarioId,
  altura = 175,
  pesoAtual = 80.0,
  pesoDesejadoInicial = 66.0,
  onAvancar,
  onVoltar,
}) => {
  const [pesoDesejado, setPesoDesejado] = useState<number>(pesoDesejadoInicial);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const containerReguaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const programaticScrollRef = useRef<boolean>(false);

  // Cálculo do peso saudável recomendado baseado na altura (IMC 18.5 a 24.9)
  const alturaMetros = Math.max(1, altura / 100);
  const pesoRecomendadoMin = useMemo(() => {
    return Number((18.5 * alturaMetros * alturaMetros).toFixed(1));
  }, [alturaMetros]);

  const pesoRecomendadoMax = useMemo(() => {
    return Number((24.9 * alturaMetros * alturaMetros).toFixed(1));
  }, [alturaMetros]);

  // Cálculo da variação percentual em relação ao peso atual
  const avaliacaoMeta = useMemo(() => {
    const diferenca = pesoAtual - pesoDesejado;
    const percentual = Math.round(Math.abs(diferenca / pesoAtual) * 100);

    let facilidade = 'Fácil de alcançar';
    if (percentual > 18) {
      facilidade = 'Desafio ambicioso';
    } else if (percentual > 10) {
      facilidade = 'Moderado e saudável';
    }

    let descricao = `Perca ${percentual}% do seu peso`;
    if (diferenca < 0) {
      descricao = `Ganhe ${percentual}% de peso`;
    } else if (diferenca === 0) {
      descricao = 'Manter seu peso atual';
      facilidade = 'Manutenção de peso';
    }

    return { facilidade, descricao, percentual, diferenca };
  }, [pesoAtual, pesoDesejado]);

  // Converte peso em posição de scroll da régua (com espaçadores flex de 50% - meia largura do passo)
  const calcularScrollParaPeso = useCallback((kg: number) => {
    const indice = Math.round((kg - PESO_MIN) / PASSO_PESO);
    return Math.max(0, indice * LARGURA_POR_PASSO);
  }, []);

  // Centraliza a régua no peso inicial ao montar
  useEffect(() => {
    if (containerReguaRef.current) {
      programaticScrollRef.current = true;
      const targetScroll = calcularScrollParaPeso(pesoDesejadoInicial);
      containerReguaRef.current.scrollLeft = targetScroll;
      const timer = setTimeout(() => {
        programaticScrollRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pesoDesejadoInicial, calcularScrollParaPeso]);

  // Trata a rolagem manual da régua
  const handleScroll = () => {
    if (programaticScrollRef.current || !containerReguaRef.current) return;
    const scrollPos = containerReguaRef.current.scrollLeft;

    const indiceCalculado = Math.round(scrollPos / LARGURA_POR_PASSO);
    const kgCalculado = PESO_MIN + indiceCalculado * PASSO_PESO;
    const kgFinal = Math.max(PESO_MIN, Math.min(PESO_MAX, Number(kgCalculado.toFixed(1))));

    if (kgFinal !== pesoDesejado) {
      setPesoDesejado(kgFinal);
      dispararFeedbackHaptico('suave');
    }
  };

  // Suporte a mouse drag
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

  // Suporte a teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        const novo = Math.max(PESO_MIN, Number((pesoDesejado - PASSO_PESO).toFixed(1)));
        setPesoDesejado(novo);
        if (containerReguaRef.current) {
          programaticScrollRef.current = true;
          containerReguaRef.current.scrollLeft = calcularScrollParaPeso(novo);
          setTimeout(() => { programaticScrollRef.current = false; }, 50);
        }
      } else if (e.key === 'ArrowRight') {
        const novo = Math.min(PESO_MAX, Number((pesoDesejado + PASSO_PESO).toFixed(1)));
        setPesoDesejado(novo);
        if (containerReguaRef.current) {
          programaticScrollRef.current = true;
          containerReguaRef.current.scrollLeft = calcularScrollParaPeso(novo);
          setTimeout(() => { programaticScrollRef.current = false; }, 50);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pesoDesejado, calcularScrollParaPeso]);

  // Salva no subgrupo 'informacoesBasicas' no Firestore e avança
  const handleProximo = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    try {
      if (usuarioId) {
        await salvarInformacaoBasicaFirestore(usuarioId, 'pesoDesejado', pesoDesejado);
      }
      onAvancar(pesoDesejado);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Não conseguimos salvar seu peso desejado. Verifique sua conexão e tente novamente.';
      setErro(msg);
      setSalvando(false);
    }
  };

  // Total de divisões da régua
  const totalPassos = Math.round((PESO_MAX - PESO_MIN) / PASSO_PESO) + 1;
  const listaPassos = Array.from({ length: totalPassos }, (_, i) => Number((PESO_MIN + i * PASSO_PESO).toFixed(1)));

  // Formatação do peso atual para exibição na tag comparativa
  const pesoAtualFormatado = pesoAtual.toFixed(1).replace('.', ',');

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-[#0C1B33] flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Container responsivo mobile-first */}
      <main className="w-full max-w-md min-h-screen flex flex-col justify-between px-6 pt-3 pb-8 relative safe-top safe-bottom">
        {/* ==================== Área Superior: Header & Barra de Progresso ==================== */}
        <header className="w-full pt-2 pb-1">
          <div className="relative flex items-center justify-center py-2">
            <button
              type="button"
              onClick={onVoltar}
              disabled={salvando}
              aria-label="Voltar para a etapa anterior"
              className="absolute left-0 p-2 text-slate-800 hover:text-[#00C975] active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <h1 className="text-[17px] font-bold text-[#0C1B33] tracking-tight">
              Informações Básicas
            </h1>
          </div>

          {/* Barra de Progresso Linear (Passo 7 de 8 = ~95%) */}
          <div className="w-full bg-slate-200/70 h-1.5 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={95} aria-valuemin={0} aria-valuemax={100}>
            <div 
              className="bg-[#00C975] h-full rounded-full transition-all duration-400 ease-out" 
              style={{ width: '95%' }}
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

        {/* ==================== Área Central: Pergunta, Peso Desejado & Régua ==================== */}
        <section className="flex-1 flex flex-col items-center justify-start pt-3 w-full">
          {/* Título Principal */}
          <h2 className="text-[27px] sm:text-[28px] font-extrabold text-center text-[#0C1B33] leading-tight mb-5">
            Defina seu peso<br />desejado
          </h2>

          {/* Mostrador Central do Peso com Tag Comparativa à Direita */}
          <div className="relative flex items-center justify-center w-full mt-1 mb-2">
            {/* Valor em Grande Destaque */}
            <div className="flex items-baseline space-x-1">
              <span className="text-[52px] font-extrabold text-[#00C975] tracking-tight leading-none" id="weight-value-display">
                {pesoDesejado.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-[#00C975] ml-1">
                kg
              </span>
            </div>

            {/* Tag comparativa com peso atual da etapa anterior */}
            <div 
              className="absolute right-2 sm:right-3 flex items-center space-x-1 text-slate-800 font-bold text-[16px] sm:text-[17px] bg-slate-100/60 px-2.5 py-1 rounded-xl" 
              title="Seu peso atual"
            >
              <span className="text-[#00A8E8] text-sm tracking-tighter font-extrabold">«</span>
              <span>{pesoAtualFormatado}</span>
            </div>
          </div>

          {/* Triângulo Apontador Central Verde */}
          <div className="flex justify-center -mb-1">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#00C975]" />
          </div>

          {/* Régua Graduada Interativa */}
          <div 
            className="w-full relative overflow-hidden py-4 border-b border-t border-slate-100 my-2 select-none [mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)]" 
            data-purpose="ruler-slider"
          >
            {/* Faixa sombreada verde da meta entre peso desejado e peso atual */}
            <div 
              className="absolute top-4 bottom-10 bg-[#00C975]/10 rounded-sm pointer-events-none transition-all duration-300"
              style={{
                left: `${Math.min(50, 50 + (pesoAtual - pesoDesejado) * (LARGURA_POR_PASSO / PASSO_PESO) * 0.1)}%`,
                width: `${Math.min(220, Math.abs(pesoAtual - pesoDesejado) * 8)}px`,
              }}
            />

            {/* Marcador central fixo verde */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 h-10 w-[2px] bg-[#00C975] rounded-full z-10 pointer-events-none" />

            <div
              ref={containerReguaRef}
              onScroll={handleScroll}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="overflow-x-auto no-scrollbar flex items-end h-20 w-full cursor-grab active:cursor-grabbing touch-pan-x"
              style={{
                scrollBehavior: isDraggingRef.current ? 'auto' : 'smooth',
              }}
            >
              {/* Espaçador flex inicial para centralizar o primeiro item */}
              <div className="flex-shrink-0" style={{ width: `calc(50% - ${LARGURA_POR_PASSO / 2}px)` }} />

              {listaPassos.map((kg) => {
                const isInteiro = Number.isInteger(kg);
                const isAtivo = Math.abs(kg - pesoDesejado) < 0.25;

                return (
                  <div
                    key={kg}
                    onClick={() => {
                      setPesoDesejado(kg);
                      if (containerReguaRef.current) {
                        programaticScrollRef.current = true;
                        containerReguaRef.current.scrollLeft = calcularScrollParaPeso(kg);
                        setTimeout(() => { programaticScrollRef.current = false; }, 50);
                      }
                    }}
                    style={{ width: `${LARGURA_POR_PASSO}px` }}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                  >
                    {/* Linha da Graduação */}
                    <div
                      className={`rounded-full transition-all ${
                        isAtivo
                          ? 'w-[2px] h-10 bg-[#00C975]'
                          : isInteiro
                          ? 'w-[1.5px] h-8 bg-slate-300'
                          : 'w-[1px] h-4 bg-slate-200 mb-2'
                      }`}
                    />

                    {/* Rótulo Numérico do Quilo Inteiro */}
                    {isInteiro ? (
                      <span className={`text-xs mt-2 select-none pointer-events-none transition-colors ${
                        isAtivo ? 'font-bold text-slate-600 text-sm' : 'font-medium text-slate-300'
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

          {/* Subtexto Informativo de Peso Recomendado */}
          <div className="text-center mt-2 mb-6">
            <p className="text-[13px] font-semibold text-slate-600">
              Peso recomendado: <span className="text-[#00C975] font-bold">{pesoRecomendadoMin} - {pesoRecomendadoMax}kg</span>
            </p>
          </div>

          {/* ==================== Card Inteligente de Viabilidade da Meta ==================== */}
          <section className="w-full bg-white rounded-2xl p-5 shadow-[0_8px_24px_-4px_rgba(12,27,51,0.05),0_2px_6px_-1px_rgba(12,27,51,0.03)] border border-slate-100">
            <p className="text-[#00A8E8] text-[17px] font-bold tracking-tight mb-1">
              {avaliacaoMeta.facilidade}
            </p>
            <p className="text-[#0C1B33] font-extrabold text-[17px] tracking-tight">
              {avaliacaoMeta.diferenca !== 0 ? (
                <>
                  {avaliacaoMeta.diferenca > 0 ? 'Perca ' : 'Ganhe '}
                  <span className="text-[#00A8E8]">{avaliacaoMeta.percentual}%</span>
                  {avaliacaoMeta.diferenca > 0 ? ' do seu peso' : ' de peso'}
                </>
              ) : (
                'Mantenha seu peso ideal'
              )}
            </p>
          </section>
        </section>

        {/* ==================== Área Inferior: Aviso de Privacidade & CTA ==================== */}
        <footer className="w-full flex flex-col items-center pt-3 pb-2 mt-auto">
          {/* Texto de Privacidade */}
          <p className="text-center text-[12px] leading-relaxed text-slate-400 font-medium px-4 mb-4 max-w-xs">
            Nunca venderemos ou compartilharemos seus dados pessoais de forma inadequada.
          </p>

          {/* Botão Primário Próximo com Chevron */}
          <button
            type="button"
            onClick={handleProximo}
            disabled={salvando}
            className={`w-full bg-[#00C975] hover:bg-[#00B368] active:scale-[0.99] text-white font-bold text-[18px] h-14 rounded-full flex items-center justify-center space-x-2 shadow-[0_8px_20px_-2px_rgba(0,201,117,0.38)] transition duration-150 ease-in-out min-h-[56px] ${
              salvando ? 'opacity-80 cursor-wait' : 'cursor-pointer'
            }`}
          >
            {salvando ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando meta...</span>
              </div>
            ) : (
              <>
                <span>Próximo</span>
                <ChevronRight className="w-5 h-5 ml-1 stroke-[3]" />
              </>
            )}
          </button>
        </footer>
      </main>
    </div>
  );
};
