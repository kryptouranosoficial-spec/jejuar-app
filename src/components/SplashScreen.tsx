/**
 * @file SplashScreen.tsx
 * @description Tela inicial de abertura (Splash Screen) do aplicativo Jejuar.
 * Exibe anel animado de progresso, logotipo com efeito de brilho e calibração metabólica.
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, Flame } from 'lucide-react';
import type { EstagioCarregamento } from '../types';

interface SplashScreenProps {
  /** Callback acionado ao finalizar a animação de carregamento */
  onFinalizado: () => void;
}

// Estágios de sincronização exibidos durante o carregamento da tela
const ESTAGIOS: EstagioCarregamento[] = [
  { porcentagem: 32, mensagem: "Calibrando janelas metabólicas..." },
  { porcentagem: 68, mensagem: "Ajustando metas de hidratação..." },
  { porcentagem: 92, mensagem: "Sincronizando protocolos..." },
  { porcentagem: 100, mensagem: "Pronto para começar!" }
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinalizado }) => {
  const [indiceEstagio, setIndiceEstagio] = useState(0);
  const [progresso, setProgresso] = useState(ESTAGIOS[0].porcentagem);
  const [mensagemAtual, setMensagemAtual] = useState(ESTAGIOS[0].mensagem);
  const [falhaImagem, setFalhaImagem] = useState(false);
  
  // Trava de segurança para garantir execução única do temporizador
  const finalizadoRef = React.useRef(false);

  // Efeito responsável por orquestrar a progressão dos estágios uma única vez
  useEffect(() => {
    if (finalizadoRef.current) return;

    const intervalos = [
      setTimeout(() => avancarParaEstagio(1), 600),
      setTimeout(() => avancarParaEstagio(2), 1400),
      setTimeout(() => avancarParaEstagio(3), 2200),
      setTimeout(() => {
        finalizadoRef.current = true;
        onFinalizado();
      }, 2900)
    ];

    return () => {
      intervalos.forEach(id => clearTimeout(id));
    };
  }, []); // Executa estritamente na montagem inicial

  // Função auxiliar para avançar o estágio e atualizar valores visuais
  const avancarParaEstagio = (novoIndice: number) => {
    if (novoIndice < ESTAGIOS.length) {
      setIndiceEstagio(novoIndice);
      setProgresso(ESTAGIOS[novoIndice].porcentagem);
      setMensagemAtual(ESTAGIOS[novoIndice].mensagem);
    }
  };

  // Cálculo do offset do anel circular SVG (circunferência = 2 * PI * 70 ≈ 440)
  const circunferencia = 440;
  const strokeDashoffset = circunferencia - (circunferencialCalculado(progresso, circunferencia));

  function circunferencialCalculado(percent: number, total: number): number {
    return (total * percent) / 100;
  }

  return (
    <div 
      className="relative w-full min-h-screen flex flex-col justify-between items-center bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#F0FDF4] text-[#0F172A] px-5 py-6 select-none overflow-hidden"
      role="region"
      aria-label="Tela de carregamento do Jejuar"
    >
      {/* Elementos ambientais de iluminação suave esmeralda no fundo */}
      <div 
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute top-1/3 -right-20 w-72 h-72 bg-emerald-50/80 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-20 -left-16 w-80 h-80 bg-teal-50/70 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Espaçador superior para equilíbrio vertical */}
      <div className="w-full pt-safe" />

      {/* Área Central Hero: Logotipo em anel circular e títulos */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto z-10 relative">
        {/* Moldura dinâmica com anel de sincronização */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Brilho externo difuso */}
          <div 
            className="absolute inset-0 bg-[#00C975]/15 rounded-full blur-2xl transform scale-125" 
            aria-hidden="true" 
          />

          {/* Anel de progresso em SVG circular suave */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
            <svg 
              className="w-full h-full -rotate-90 transform" 
              viewBox="0 0 160 160"
              aria-hidden="true"
            >
              {/* Trilha de fundo inativa */}
              <circle 
                cx="80" 
                cy="80" 
                fill="transparent" 
                r="70" 
                stroke="#E2E8F0" 
                strokeWidth="5" 
              />
              {/* Trilha ativa com gradiente verde esmeralda */}
              <circle 
                className="transition-all duration-700 ease-out" 
                cx="80" 
                cy="80" 
                fill="transparent" 
                r="70" 
                stroke="#00C975" 
                strokeDasharray={circunferencia} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                strokeWidth="5" 
              />
            </svg>

            {/* Recipiente central do logotipo com sombra suave */}
            <div className="absolute inset-0 m-auto w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white p-2 shadow-xl shadow-emerald-500/10 border border-slate-100 flex items-center justify-center overflow-hidden">
              {!falhaImagem ? (
                <img 
                  src="/assets/aistudio/screen_1d1a20d5.png" 
                  alt="Logotipo Jejuar" 
                  className="w-full h-full object-contain rounded-2xl"
                  onError={() => setFalhaImagem(true)}
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-2 border-[#00C975] flex items-center justify-center">
                    <Flame className="w-8 h-8 text-[#00C975]" />
                  </div>
                  <span className="text-xs font-bold text-[#0F172A] mt-1">Jejuar</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apresentação da Marca e Tipografia */}
        <div className="text-center space-y-2 px-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Jejuar<span className="text-[#00C975] inline-block ml-0.5">.</span>
          </h1>

          <p className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
            Seu ritmo, sua saúde, sua melhor versão
          </p>

          <p className="text-sm font-normal text-[#64748B] max-w-xs mx-auto leading-relaxed pt-0.5">
            Jejum intermitente inteligente e sincronizado com o seu metabolismo.
          </p>
        </div>
      </div>

      {/* Seção Inferior: Barra de Carregamento e Rodapé */}
      <footer className="w-full max-w-xs flex flex-col items-center gap-3 z-10 pb-safe">
        <div className="w-full flex flex-col gap-2">
          {/* Indicador de Status com Ícone Giratório */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-[#0F172A]">
              <RefreshCw className="w-3.5 h-3.5 text-[#00C975] animate-spin shrink-0" />
              <span className="truncate max-w-[220px]">{mensagemAtual}</span>
            </div>
            <span className="text-[#00C975] font-bold tabular-nums ml-1">
              {progresso}%
            </span>
          </div>

          {/* Trilha da Barra de Progresso com Brilho Esmeralda */}
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
            <div 
              className="h-full rounded-full bg-[#00C975] transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,201,117,0.5)]"
              style={{ width: `${progresso}%` }} 
            />
          </div>
        </div>

        {/* Rodapé Limpo e Minimalista */}
        <div className="flex items-center justify-center gap-2 pt-1 text-center">
          <span className="text-xs text-[#64748B] font-medium">v1.0.0</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="text-xs text-[#64748B] font-medium">Feito para sua longevidade</span>
        </div>
      </footer>
    </div>
  );
};
