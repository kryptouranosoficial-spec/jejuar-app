/**
 * @file OnboardingBasicoAnoNascimento.tsx
 * @description Terceira tela do onboarding de Informações Básicas do usuário.
 * Pergunta: "Em que ano você nasceu?"
 * Apresenta seletor de roleta vertical (Wheel Picker) suave e interativo,
 * com barra de progresso em 50% e gravação no subgrupo 'informacoesBasicas.anoNascimento' no Firestore.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { salvarInformacaoBasicaFirestore } from '../services/firebase';

interface OnboardingBasicoAnoNascimentoProps {
  /** ID do usuário no Firestore */
  usuarioId: string;
  /** Ano inicial selecionado (padrão 2000) */
  anoInicial?: number;
  /** Callback para avançar à próxima etapa com o ano selecionado */
  onAvancar: (ano: number) => void;
  /** Callback para retornar à etapa anterior */
  onVoltar: () => void;
}

// Limites seguros de ano de nascimento para o aplicativo
const ANO_MINIMO = 1940;
const ANO_MAXIMO = 2012;

export const OnboardingBasicoAnoNascimento: React.FC<OnboardingBasicoAnoNascimentoProps> = ({
  usuarioId,
  anoInicial = 2000,
  onAvancar,
  onVoltar,
}) => {
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anoInicial);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Variáveis para manipulação do gesto de arrasto vertical (touch & drag)
  const touchStartY = useRef<number | null>(null);
  const acumuladorArrasto = useRef<number>(0);

  // Garante que o ano permaneça dentro dos limites válidos
  const alterarAno = useCallback((novoAno: number) => {
    if (novoAno >= ANO_MINIMO && novoAno <= ANO_MAXIMO) {
      setAnoSelecionado(novoAno);
    }
  }, []);

  // Manipulador de rolagem com a roda do mouse (wheel)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 15) {
      alterarAno(anoSelecionado + 1);
    } else if (e.deltaY < -15) {
      alterarAno(anoSelecionado - 1);
    }
  };

  // Manipuladores de toque móvel (Touch Events)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    acumuladorArrasto.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Sensibilidade de arrasto (cada 26px desloca um ano)
    const LIMIAR = 26;
    if (deltaY > LIMIAR) {
      alterarAno(anoSelecionado - 1);
      touchStartY.current = currentY;
    } else if (deltaY < -LIMIAR) {
      alterarAno(anoSelecionado + 1);
      touchStartY.current = currentY;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  // Suporte a teclas de seta para acessibilidade total
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        alterarAno(anoSelecionado - 1);
      } else if (e.key === 'ArrowDown') {
        alterarAno(anoSelecionado + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [anoSelecionado, alterarAno]);

  // Grava o ano no subgrupo 'informacoesBasicas' no Firestore e avança
  const handleProximo = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    try {
      if (usuarioId) {
        await salvarInformacaoBasicaFirestore(usuarioId, 'anoNascimento', anoSelecionado);
      }
      onAvancar(anoSelecionado);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Não conseguimos salvar seu ano de nascimento. Verifique sua conexão e tente novamente.';
      setErro(msg);
      setSalvando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAFCFF] text-slate-800 flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Container responsivo mobile-first */}
      <main className="w-full max-w-md min-h-screen flex flex-col justify-between px-6 pt-5 pb-8 relative safe-top safe-bottom">
        {/* ==================== Área Superior: Header, Progresso & Pergunta ==================== */}
        <div className="w-full flex flex-col">
          {/* Header de Navegação */}
          <header className="relative flex items-center justify-center pt-2 pb-5">
            <button
              type="button"
              onClick={onVoltar}
              disabled={salvando}
              aria-label="Voltar para a etapa anterior"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[#0A1C3E] p-2 -ml-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <h1 className="text-[17px] font-bold text-[#0A1C3E] tracking-tight">
              Informações Básicas
            </h1>
          </header>

          {/* Barra de Progresso Linear (Passo 3 de 5 = 50%) */}
          <div className="w-full mt-1 mb-8" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
            <div className="w-full bg-[#EBF1F6] h-[3px] rounded-full overflow-hidden">
              <div 
                className="bg-[#00C975] h-full rounded-full transition-all duration-400 ease-out" 
                style={{ width: '50%' }}
              />
            </div>
          </div>

          {/* Pergunta Principal */}
          <section className="text-center px-4 mt-2">
            <h2 className="text-[26px] sm:text-[28px] font-extrabold text-[#0A1C3E] leading-[1.25] tracking-tight">
              Em que ano você<br />nasceu?
            </h2>
          </section>
        </div>

        {/* Feedback de erro humanizado */}
        {erro && (
          <div className="w-full my-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <p className="leading-relaxed">{erro}</p>
          </div>
        )}

        {/* ==================== Área Central: Seletor Roleta de Anos (Wheel Picker) ==================== */}
        <section 
          aria-label="Seletor de ano de nascimento"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex flex-col items-center justify-center my-auto py-6 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-full flex flex-col items-center space-y-3.5">
            {/* Ano: -2 (Muito atenuado no topo) */}
            <button
              type="button"
              onClick={() => alterarAno(anoSelecionado - 2)}
              disabled={anoSelecionado - 2 < ANO_MINIMO}
              className="text-[22px] font-medium text-[#9BA5B7]/30 hover:text-[#9BA5B7]/50 active:scale-95 transition-all select-none min-h-[36px] flex items-center justify-center disabled:opacity-0"
            >
              {anoSelecionado - 2 >= ANO_MINIMO ? anoSelecionado - 2 : ''}
            </button>

            {/* Ano: -1 (Atenuado médio no topo) */}
            <button
              type="button"
              onClick={() => alterarAno(anoSelecionado - 1)}
              disabled={anoSelecionado - 1 < ANO_MINIMO}
              className="text-[23px] font-medium text-[#9BA5B7]/60 hover:text-[#9BA5B7]/80 active:scale-95 transition-all select-none min-h-[38px] flex items-center justify-center disabled:opacity-0"
            >
              {anoSelecionado - 1 >= ANO_MINIMO ? anoSelecionado - 1 : ''}
            </button>

            {/* Caixa Central de Destaque: Ano Selecionado */}
            <div 
              role="spinbutton"
              aria-label={`Ano selecionado: ${anoSelecionado}`}
              aria-valuenow={anoSelecionado}
              aria-valuemin={ANO_MINIMO}
              aria-valuemax={ANO_MAXIMO}
              tabIndex={0}
              className="w-full max-w-[340px] h-[68px] rounded-2xl border-2 border-[#00C975] bg-[#F0FBF6]/60 flex items-center justify-center shadow-[0_2px_12px_rgba(0,201,117,0.08)] transition-all"
            >
              <span className="text-[28px] font-bold text-[#0A1C3E] tracking-tight">
                {anoSelecionado}
              </span>
            </div>

            {/* Ano: +1 (Atenuado médio na base) */}
            <button
              type="button"
              onClick={() => alterarAno(anoSelecionado + 1)}
              disabled={anoSelecionado + 1 > ANO_MAXIMO}
              className="text-[23px] font-medium text-[#9BA5B7]/60 hover:text-[#9BA5B7]/80 active:scale-95 transition-all select-none min-h-[38px] flex items-center justify-center disabled:opacity-0"
            >
              {anoSelecionado + 1 <= ANO_MAXIMO ? anoSelecionado + 1 : ''}
            </button>

            {/* Ano: +2 (Muito atenuado na base) */}
            <button
              type="button"
              onClick={() => alterarAno(anoSelecionado + 2)}
              disabled={anoSelecionado + 2 > ANO_MAXIMO}
              className="text-[22px] font-medium text-[#9BA5B7]/30 hover:text-[#9BA5B7]/50 active:scale-95 transition-all select-none min-h-[36px] flex items-center justify-center disabled:opacity-0"
            >
              {anoSelecionado + 2 <= ANO_MAXIMO ? anoSelecionado + 2 : ''}
            </button>
          </div>
        </section>

        {/* ==================== Área Inferior: Aviso de Privacidade & CTA ==================== */}
        <footer className="w-full flex flex-col items-center mt-auto">
          {/* Texto de Privacidade */}
          <p className="text-center text-[13px] leading-relaxed text-[#9BA5B7] px-4 mb-5 max-w-[310px]">
            Nunca venderemos ou compartilharemos seus dados pessoais de forma inadequada.
          </p>

          {/* Botão Primário Próximo */}
          <button
            type="button"
            onClick={handleProximo}
            disabled={salvando}
            className={`w-full h-[58px] bg-[#00C975] hover:bg-[#00B86B] active:scale-[0.985] transition-all duration-150 rounded-full flex items-center justify-center text-white text-[18px] font-bold tracking-wide shadow-[0_6px_20px_rgba(0,201,117,0.28)] min-h-[56px] ${
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
