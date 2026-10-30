/**
 * @file OnboardingBasicoExperiencia.tsx
 * @description Segunda tela do onboarding de Informações Básicas do usuário.
 * Pergunta: "Você já tentou o jejum intermitente?"
 * Exibe barra de progresso em 40% (Passo 2 de 5) e salva a resposta no subgrupo (Map)
 * 'informacoesBasicas.experienciaJejum' dentro do documento do usuário na coleção "usuarios".
 */

import React, { useState } from 'react';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { salvarInformacaoBasicaFirestore } from '../services/firebase';

interface OpcaoExperiencia {
  id: string;
  titulo: string;
  icone: React.ReactNode;
}

interface OnboardingBasicoExperienciaProps {
  /** ID do usuário salvo no Firestore */
  usuarioId: string;
  /** Valor previamente selecionado (se houver) */
  experienciaInicial?: string;
  /** Callback acionado ao avançar com a experiência selecionada */
  onAvancar: (experienciaSelecionada: string) => void;
  /** Callback para retornar à etapa anterior (Objetivo Principal) */
  onVoltar: () => void;
}

export const OnboardingBasicoExperiencia: React.FC<OnboardingBasicoExperienciaProps> = ({
  usuarioId,
  experienciaInicial = 'primeira_vez',
  onAvancar,
  onVoltar,
}) => {
  // Lista oficial das 3 opções com os ícones orgânicos fiéis ao design
  const opcoes: OpcaoExperiencia[] = [
    {
      id: 'primeira_vez',
      titulo: 'É a minha primeira vez',
      icone: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          {/* Motivo de semente/grão acolhedor */}
          <path 
            d="M14 26C14 19.3726 19.3726 14 26 14C32.6274 14 38 19.3726 38 26C38 32.6274 32.6274 38 26 38C21 38 19 33.5 16 33.5C13 33.5 14 29 14 26Z" 
            fill="#E69363" 
          />
          <path 
            d="M19 24C19 20 22 17 26 17" 
            stroke="#F4B892" 
            strokeLinecap="round" 
            strokeWidth="2.5" 
          />
          {/* Folha inicial brotando em verde esmeralda */}
          <path 
            d="M30 15C30.5 11 34 9 37 9C37 12.5 34.5 15.5 30 15Z" 
            fill="#00C975" 
          />
        </svg>
      ),
    },
    {
      id: 'algumas_vezes',
      titulo: 'Já tentei algumas vezes',
      icone: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          {/* Solo fértil */}
          <ellipse cx="24" cy="38" fill="#CD8255" rx="14" ry="4.5" />
          {/* Caule forte */}
          <path d="M24 36V22" stroke="#78B936" strokeLinecap="round" strokeWidth="3" />
          {/* Folha esquerda */}
          <path d="M24 27C17 26.5 15 20.5 15 17C19.5 17 24 21 24 27Z" fill="#78B936" />
          {/* Folha direita */}
          <path d="M24 25C31 24.5 33 18.5 33 15C28.5 15 24 19 24 25Z" fill="#95D448" />
        </svg>
      ),
    },
    {
      id: 'estilo_vida',
      titulo: 'O jejum se tornou meu estilo de vida',
      icone: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          {/* Tronco e galho robustos */}
          <path d="M24 27V40" stroke="#935733" strokeLinecap="round" strokeWidth="4" />
          <path d="M24 33L28 29" stroke="#935733" strokeLinecap="round" strokeWidth="2.5" />
          {/* Folhagem frondosa e viva */}
          <circle cx="24" cy="18" fill="#48A843" r="10" />
          <circle cx="17" cy="22" fill="#3D9238" r="7.5" />
          <circle cx="31" cy="22" fill="#58BA52" r="7.5" />
          <circle cx="24" cy="23" fill="#48A843" r="8" />
        </svg>
      ),
    },
  ];

  // Opção selecionada ativa (padrão: "É a minha primeira vez" conforme o design)
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>(experienciaInicial);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Trata o avanço salvando a resposta no subgrupo 'informacoesBasicas'
  const handleProximo = async () => {
    if (!opcaoSelecionada || salvando) return;

    setSalvando(true);
    setErro(null);

    const opcaoObj = opcoes.find(o => o.id === opcaoSelecionada);
    const tituloExperiencia = opcaoObj ? opcaoObj.titulo : opcaoSelecionada;

    try {
      // Salva no subgrupo 'informacoesBasicas' do documento do usuário
      if (usuarioId) {
        await salvarInformacaoBasicaFirestore(usuarioId, 'experienciaJejum', tituloExperiencia);
      }
      onAvancar(tituloExperiencia);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Não conseguimos salvar sua resposta. Verifique sua conexão e tente novamente.';
      setErro(msg);
      setSalvando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFF] text-[#172B4D] flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Container responsivo mobile-first */}
      <main className="w-full max-w-md min-h-screen flex flex-col justify-between relative px-6 pt-3 pb-8 safe-top safe-bottom">
        {/* ==================== Header & Barra de Progresso ==================== */}
        <header className="w-full pt-2 pb-5">
          {/* Barra de Navegação Superior */}
          <div className="relative flex items-center justify-between min-h-[44px] mb-4">
            <button
              type="button"
              onClick={onVoltar}
              disabled={salvando}
              aria-label="Voltar para a etapa anterior"
              className="w-11 h-11 -ml-2 text-[#0D2238] hover:opacity-75 active:scale-95 transition-all flex items-center justify-center rounded-full min-h-[48px] min-w-[48px]"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Título da Seção */}
            <h1 className="text-lg font-bold text-[#0D2238] tracking-tight text-center">
              Informações Básicas
            </h1>

            <div className="w-10" aria-hidden="true" />
          </div>

          {/* Barra de Progresso Linear (Passo 2 de 5 = ~40%) */}
          <div 
            className="w-full bg-[#E9F0F8] h-1.5 rounded-full overflow-hidden" 
            role="progressbar" 
            aria-valuenow={40} 
            aria-valuemin={0} 
            aria-valuemax={100}
          >
            <div 
              className="bg-[#00C975] h-full rounded-full transition-all duration-400 ease-out" 
              style={{ width: '40%' }}
            />
          </div>
        </header>

        {/* ==================== Conteúdo Principal: Pergunta & Opções ==================== */}
        <section className="flex-1 flex flex-col pt-2">
          {/* Título da Pergunta Principal */}
          <h2 className="text-[25px] sm:text-[26px] leading-[1.3] font-extrabold text-center text-[#0D2238] px-2 mb-7 tracking-tight">
            Você já tentou o jejum intermitente?
          </h2>

          {/* Feedback de erro humanizado */}
          {erro && (
            <div className="w-full mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{erro}</p>
            </div>
          )}

          {/* Opções de Seleção Única */}
          <div 
            className="flex flex-col gap-3.5" 
            role="radiogroup" 
            aria-label="Experiência prévia com jejum"
          >
            {opcoes.map((opcao) => {
              const selecionada = opcaoSelecionada === opcao.id;

              return (
                <button
                  key={opcao.id}
                  type="button"
                  role="radio"
                  aria-checked={selecionada}
                  onClick={() => setOpcaoSelecionada(opcao.id)}
                  className={`flex items-center justify-between p-4 sm:p-5 bg-white rounded-[24px] cursor-pointer transition-all duration-200 active:scale-[0.99] text-left focus:outline-none min-h-[76px] ${
                    selecionada
                      ? 'border-2 border-[#00C975] shadow-[0_4px_18px_0_rgba(0,201,117,0.12)]'
                      : 'border border-transparent hover:border-slate-100 shadow-[0_4px_18px_0_rgba(16,37,66,0.04)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Ilustração Visual Temática */}
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                      {opcao.icone}
                    </div>

                    {/* Rótulo da Opção */}
                    <span className="text-[16px] sm:text-[17px] font-bold text-[#0D2238] leading-snug">
                      {opcao.titulo}
                    </span>
                  </div>

                  {/* Badge de Seleção com Checkmark */}
                  {selecionada ? (
                    <div className="w-6 h-6 rounded-full bg-[#00C975] flex items-center justify-center flex-shrink-0 ml-2 animate-scaleIn shadow-xs">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-200 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ==================== Ação Inferior: Botão Próximo ==================== */}
        <footer className="w-full pt-6 pb-2 flex flex-col items-center">
          <button
            type="button"
            onClick={handleProximo}
            disabled={salvando}
            className={`w-full py-4 px-6 bg-[#00C975] hover:bg-[#00B568] active:scale-[0.99] text-white text-lg font-bold rounded-full shadow-[0_8px_24px_-4px_rgba(0,201,117,0.4)] transition duration-150 flex items-center justify-center min-h-[56px] ${
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
          <div className="w-36 h-1 bg-slate-300 rounded-full mt-6 mb-1" />
        </footer>
      </main>
    </div>
  );
};
