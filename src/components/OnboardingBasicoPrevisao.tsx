/**
 * @file OnboardingBasicoPrevisao.tsx
 * @description Oitava e última tela do onboarding de Informações Básicas do usuário (Passo 8 de 8).
 * Apresenta a projeção inspiradora e visual da perda de peso esperada com gráfico vetorial de trajetória,
 * balão de fala da meta alcançada e botão "Continuar" para avançar à experiência principal (Início).
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { salvarInformacaoBasicaFirestore, consolidarTodasInformacoesBasicasFirestore } from '../services/firebase';
import type { InformacoesBasicasUsuario } from '../types';

interface OnboardingBasicoPrevisaoProps {
  /** ID do documento do usuário no Firestore */
  usuarioId: string;
  /** Peso atual em kg informado na Tela 6 */
  pesoAtual?: number;
  /** Peso desejado em kg informado na Tela 7 */
  pesoDesejado?: number;
  /** Objeto com todas as informações básicas acumuladas para consolidação atômica */
  informacoesBasicas?: InformacoesBasicasUsuario;
  /** Callback para avançar e concluir o onboarding básico (indo para a tela de Início) */
  onAvancar: () => void;
  /** Callback para retornar à etapa anterior (Peso Desejado) */
  onVoltar: () => void;
}

export const OnboardingBasicoPrevisao: React.FC<OnboardingBasicoPrevisaoProps> = ({
  usuarioId,
  pesoAtual = 72.4,
  pesoDesejado = 66.0,
  informacoesBasicas,
  onAvancar,
  onVoltar,
}) => {
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Diferença em quilos entre o peso de partida e a meta
  const diferencaKg = useMemo(() => {
    const diff = pesoAtual - pesoDesejado;
    return Math.max(0.1, Number(Math.abs(diff).toFixed(1)));
  }, [pesoAtual, pesoDesejado]);

  // Formatações brasileiras para os rótulos visuais
  const diferencaFormatada = diferencaKg.toFixed(1).replace('.', ',');
  const pesoAtualFormatado = pesoAtual.toFixed(1).replace('.', ',');
  const pesoDesejadoFormatado = Number.isInteger(pesoDesejado)
    ? `${pesoDesejado}`
    : pesoDesejado.toFixed(1).replace('.', ',');

  // Grava o encerramento do onboarding básico no Firestore com consolidação atômica de todas as 8 telas
  const handleContinuar = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    try {
      if (usuarioId) {
        localStorage.setItem('jejuar_usuario_id', usuarioId);
        localStorage.setItem('jejuar_sessao_ativa', 'true');
        // Consolidação atômica final garantida com 100% dos dados coletados
        await consolidarTodasInformacoesBasicasFirestore(usuarioId, {
          ...(informacoesBasicas || {}),
          peso: pesoAtual,
          pesoDesejado: pesoDesejado,
          previsaoPerdaKg: diferencaKg,
          onboardingCompleto: true,
        });
      }
      localStorage.setItem('jejuar_sessao_ativa', 'true');
      onAvancar();
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Não conseguimos salvar sua previsão. Verifique sua conexão e tente novamente.';
      setErro(msg);
      setSalvando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FFFDF9] text-slate-800 flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Container responsivo mobile-first */}
      <main className="w-full max-w-md min-h-screen bg-[#FFFDF9] flex flex-col justify-between overflow-hidden shadow-2xl relative px-4 sm:px-6 pt-5 pb-8 safe-top safe-bottom">
        {/* ==================== Área Superior: Barra de Navegação & Headline ==================== */}
        <div className="flex flex-col w-full z-10">
          {/* Navegação de Topo */}
          <nav className="flex items-center justify-between px-2 pt-2 pb-2" data-purpose="app-top-bar">
            <button
              type="button"
              onClick={onVoltar}
              disabled={salvando}
              aria-label="Voltar para a etapa anterior"
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-slate-800 hover:bg-black/5 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div className="w-10" aria-hidden="true" />
          </nav>

          {/* Headline Motivacional Dinâmica */}
          <header className="px-4 text-center mt-2" data-purpose="screen-headline">
            <h1 className="text-[32px] sm:text-[36px] font-extrabold tracking-tight text-[#0B1E48] leading-[1.18]">
              Ótimo!<br />
              <span className="block mt-1 font-extrabold">
                Você vai perder{' '}
                <span className="text-[#FF643D] font-extrabold">
                  {diferencaFormatada}kg
                </span>
              </span>
              <span className="block font-extrabold">
                com o Jejuar
              </span>
            </h1>
          </header>
        </div>

        {/* Feedback de erro humanizado */}
        {erro && (
          <div className="w-full my-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn z-20">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <p className="leading-relaxed">{erro}</p>
          </div>
        )}

        {/* ==================== Área Central: Gráfico Vetorial de Trajetória ==================== */}
        <div 
          className="relative flex-1 flex flex-col justify-center items-center w-full px-2 py-4 select-none" 
          data-purpose="weight-loss-chart"
        >
          <div className="relative w-full max-w-[360px] aspect-[4/3] flex items-center justify-center">
            {/* Rótulo do Peso Inicial (Superior Esquerdo) */}
            <div className="absolute top-[3%] left-[10%] z-20">
              <span className="text-[17px] font-bold text-slate-400 tracking-wide">
                {pesoAtualFormatado} kg
              </span>
            </div>

            {/* Balão de Fala do Peso Desejado (Sobre o Nó Direito) */}
            <div className="absolute top-[32%] right-[9%] z-30 flex flex-col items-center">
              <div className="relative bg-[#00C975] text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center">
                <span className="text-[20px] font-extrabold tracking-tight leading-none">
                  {pesoDesejadoFormatado} kg
                </span>
                {/* Seta Triangular do Balão */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-[#00C975]" />
              </div>
            </div>

            {/* Seta Curva de Momento (Dourada / Âmbar) */}
            <div className="absolute top-[15%] right-[32%] z-10 pointer-events-none opacity-85">
              <svg fill="none" height="68" viewBox="0 0 86 68" width="86" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8C26 8 52 14 62 38" stroke="url(#arrow_grad_previsao)" strokeLinecap="round" strokeWidth="13" />
                <path d="M45 42L66 45L69 22" fill="url(#arrow_grad_previsao)" />
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="arrow_grad_previsao" x1="12" x2="69" y1="8" y2="45">
                    <stop stopColor="#FFDD78" stopOpacity="0.3" />
                    <stop offset="0.6" stopColor="#F9BE4A" stopOpacity="0.75" />
                    <stop offset="1" stopColor="#EEA834" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Gráfico Vetorial Principal (Curva de Trajetória, Preenchimento e Guias Pontilhadas) */}
            <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 360 270" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Gradiente da Curva: Laranja Vibrante para Verde Esmeralda */}
                <linearGradient gradientUnits="userSpaceOnUse" id="curve-gradient-previsao" x1="68" x2="278" y1="48" y2="188">
                  <stop offset="0%" stopColor="#FF5D2E" />
                  <stop offset="28%" stopColor="#FFA228" />
                  <stop offset="68%" stopColor="#46D869" />
                  <stop offset="100%" stopColor="#00C975" />
                </linearGradient>

                {/* Área de Preenchimento Suave sob a Curva */}
                <linearGradient gradientUnits="userSpaceOnUse" id="fill-gradient-previsao" x1="180" x2="180" y1="40" y2="250">
                  <stop offset="0%" stopColor="#FF9E4A" stopOpacity="0.22" />
                  <stop offset="50%" stopColor="#6CE19B" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Área Gradiente Sombreada */}
              <path 
                d="M 68 48 C 115 50, 145 130, 200 172 C 235 198, 295 186, 332 194 L 332 250 L 68 250 Z" 
                fill="url(#fill-gradient-previsao)" 
              />

              {/* Linha Tracejada Esquerda (Ponto de Partida) */}
              <line 
                stroke="#FF8A65" 
                strokeDasharray="1.5 8" 
                strokeLinecap="round" 
                strokeWidth="4.5" 
                x1="68" 
                x2="68" 
                y1="48" 
                y2="245" 
              />

              {/* Linha Tracejada Direita (Ponto de Chegada) */}
              <line 
                stroke="#34D399" 
                strokeDasharray="1.5 8" 
                strokeLinecap="round" 
                strokeWidth="4" 
                x1="274" 
                x2="274" 
                y1="188" 
                y2="245" 
              />

              {/* Curva de Trajetória Suave */}
              <path 
                d="M 68 48 C 115 50, 145 130, 200 172 C 235 198, 295 186, 332 194" 
                fill="none" 
                stroke="url(#curve-gradient-previsao)" 
                strokeLinecap="round" 
                strokeWidth="7" 
              />

              {/* Nó Inicial (Esquerdo - Laranja) */}
              <circle cx="68" cy="48" fill="#FF5E2E" r="10.5" />
              <circle cx="68" cy="48" fill="#FFFFFF" r="4.5" />

              {/* Halo / Brilho do Nó de Chegada da Meta (Direito - Verde) */}
              <circle cx="274" cy="188" fill="#00C975" fillOpacity="0.25" r="18" />
              {/* Anel Externo Branco */}
              <circle cx="274" cy="188" fill="#FFFFFF" r="11" stroke="#00C975" strokeWidth="3" />
              {/* Centro Verde Esmeralda */}
              <circle cx="274" cy="188" fill="#00C975" r="7" />
            </svg>
          </div>
        </div>

        {/* ==================== Área Inferior: Botão Continuar ==================== */}
        <footer className="w-full px-2 sm:px-4 pb-4 pt-2 z-10 flex flex-col items-center" data-purpose="cta-section">
          {/* Botão Primário de Ação: Continuar */}
          <button
            type="button"
            onClick={handleContinuar}
            disabled={salvando}
            className={`w-full py-4 sm:py-[18px] bg-[#00C975] hover:bg-[#00B368] text-white text-[19px] sm:text-[20px] font-bold rounded-full shadow-lg shadow-emerald-500/25 active:scale-[0.985] transition-all duration-150 text-center tracking-wide min-h-[56px] flex items-center justify-center ${
              salvando ? 'opacity-80 cursor-wait' : 'cursor-pointer'
            }`}
          >
            {salvando ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Finalizando...</span>
              </div>
            ) : (
              <span>Continuar</span>
            )}
          </button>

          {/* Indicador de home iOS/Android */}
          <div className="mt-4 sm:mt-5 flex items-center justify-center w-full pb-1">
            <div className="w-36 h-1 bg-slate-300/60 rounded-full" />
          </div>
        </footer>
      </main>
    </div>
  );
};
