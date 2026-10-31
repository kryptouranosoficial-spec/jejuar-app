/**
 * @file OnboardingBasicoGenero.tsx
 * @description Quarta tela do onboarding de Informações Básicas do usuário.
 * Pergunta: "Qual é o seu gênero?"
 * Apresenta opções com avatares vetoriais ilustrados, barra de progresso em 68%
 * e gravação no subgrupo 'informacoesBasicas.genero' dentro do Firestore.
 */

import React, { useState } from 'react';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { salvarInformacaoBasicaFirestore } from '../services/firebase';

interface OpcaoGenero {
  id: string;
  titulo: string;
  corFundoAvatar: string;
  avatar: React.ReactNode;
}

interface OnboardingBasicoGeneroProps {
  /** ID do documento do usuário no Firestore */
  usuarioId: string;
  /** Gênero inicial selecionado (padrão 'Feminino' conforme o design original) */
  generoInicial?: string;
  /** Callback para avançar para a próxima etapa */
  onAvancar: (genero: string) => void;
  /** Callback para retornar à etapa anterior (Ano de nascimento) */
  onVoltar: () => void;
}

export const OnboardingBasicoGenero: React.FC<OnboardingBasicoGeneroProps> = ({
  usuarioId,
  generoInicial = 'Feminino',
  onAvancar,
  onVoltar,
}) => {
  // Lista oficial das 2 opções biológicas com avatares fiéis ao design
  const opcoes: OpcaoGenero[] = [
    {
      id: 'masculino',
      titulo: 'Masculino',
      corFundoAvatar: 'bg-[#E0F2FE]',
      avatar: (
        <svg className="w-10 h-10 mt-1" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          {/* Cabelo */}
          <path d="M16 19C16 13 18.5 10 24 10C29.5 10 32 13 32 19C32 20.5 31.5 21 31.5 21C30 16 28 14 24 14C19 14 17.5 17 16.5 21C16.5 21 16 20.5 16 19Z" fill="#334155" />
          {/* Rosto & Pescoço */}
          <path d="M17 21C17 25.5 20.1 29 24 29C27.9 29 31 25.5 31 21V19H17V21Z" fill="#FED7AA" />
          <path d="M22 28H26V32H22V28Z" fill="#FDBA74" />
          {/* Roupa / Camisa Azul */}
          <path d="M11 44C11 36.5 16.5 33 24 33C31.5 33 37 36.5 37 44H11Z" fill="#38BDF8" />
          <path d="M21 33L24 37L27 33H21Z" fill="#0284C7" />
        </svg>
      ),
    },
    {
      id: 'feminino',
      titulo: 'Feminino',
      corFundoAvatar: 'bg-[#FCE7F3]',
      avatar: (
        <svg className="w-10 h-10 mt-1" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          {/* Fundo do cabelo */}
          <path d="M14 25C14 16 17 10 24 10C31 10 34 16 34 25C34 32 31 36 31 36L29 27L19 27L17 36C17 36 14 32 14 25Z" fill="#9A3412" />
          {/* Rosto */}
          <path d="M17.5 21C17.5 25 20.4 28 24 28C27.6 28 30.5 25 30.5 21V18H17.5V21Z" fill="#FFEDD5" />
          {/* Franja frontal */}
          <path d="M17 18C19 14.5 21 14 24 14C27 14 29 14.5 31 18C29 16.5 27 16 24 16C21 16 19 16.5 17 18Z" fill="#7C2D12" />
          <path d="M22 27H26V31H22V27Z" fill="#FED7AA" />
          {/* Blusa Rosa / Magenta */}
          <path d="M11 44C11 36.5 16.5 32 24 32C31.5 32 37 36.5 37 44H11Z" fill="#F43F5E" />
          <path d="M21 32C22 34.5 26 34.5 27 32H21Z" fill="#BE123C" />
        </svg>
      ),
    },
  ];

  // Opção atualmente selecionada
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>(
    generoInicial.toLowerCase() === 'masculino' ? 'masculino' : 'feminino'
  );
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Trata o clique no botão "Próximo"
  const handleProximo = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    const opcaoObj = opcoes.find(o => o.id === opcaoSelecionada);
    const tituloGenero = opcaoObj ? opcaoObj.titulo : 'Feminino';

    try {
      if (usuarioId) {
        await salvarInformacaoBasicaFirestore(usuarioId, 'genero', tituloGenero);
      }
      onAvancar(tituloGenero);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Não conseguimos salvar seu gênero. Verifique sua conexão e tente novamente.';
      setErro(msg);
      setSalvando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F9FF] text-[#0F172A] flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Container responsivo mobile-first */}
      <main className="w-full max-w-md min-h-screen flex flex-col justify-between px-6 pt-5 pb-8 relative safe-top safe-bottom">
        {/* ==================== Área Superior: Header, Progresso & Pergunta ==================== */}
        <div className="w-full flex flex-col gap-4">
          {/* Header de Navegação */}
          <header className="flex items-center justify-between relative pt-2 pb-1">
            <button
              type="button"
              onClick={onVoltar}
              disabled={salvando}
              aria-label="Voltar para a etapa anterior"
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-slate-100 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </button>

            <h1 className="text-[17px] font-bold text-[#0F172A] tracking-tight text-center">
              Informações Básicas
            </h1>

            <div aria-hidden="true" className="w-10 h-10" />
          </header>

          {/* Barra de Progresso (Passo 4 de 5 = ~68%) */}
          <div className="w-full px-6 mt-1" role="progressbar" aria-valuenow={68} aria-valuemin={0} aria-valuemax={100}>
            <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-[#00C975] rounded-full transition-all duration-500 ease-out" 
                style={{ width: '68%' }}
              />
            </div>
          </div>

          {/* Pergunta Principal */}
          <section className="mt-4 mb-2 text-center">
            <h2 className="text-[26px] leading-tight font-extrabold text-[#0F172A] tracking-[-0.02em]">
              Qual é o seu gênero?
            </h2>
          </section>

          {/* Feedback de erro humanizado */}
          {erro && (
            <div className="w-full my-1 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{erro}</p>
            </div>
          )}

          {/* ==================== Grupo de Seleção de Gênero ==================== */}
          <div 
            className="flex flex-col gap-3.5 w-full mt-2" 
            role="radiogroup" 
            aria-label="Selecione o seu gênero"
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
                  className={`flex items-center justify-between p-4 bg-white rounded-[22px] cursor-pointer transition-all duration-200 select-none active:scale-[0.99] text-left focus:outline-none min-h-[72px] ${
                    selecionada
                      ? 'border-2 border-[#00C975] shadow-[0_4px_24px_-2px_rgba(0,201,117,0.15)]'
                      : 'border-2 border-transparent shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar Ilustrado */}
                    <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${opcao.corFundoAvatar} flex items-center justify-center`}>
                      {opcao.avatar}
                    </div>

                    {/* Rótulo */}
                    <span className="text-[17px] font-semibold text-[#0F172A]">
                      {opcao.titulo}
                    </span>
                  </div>

                  {/* Badge de Seleção com Checkmark */}
                  {selecionada ? (
                    <div className="w-7 h-7 rounded-full bg-[#00C975] flex items-center justify-center text-white shrink-0 animate-scaleIn shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border border-slate-200 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================== Área Inferior: Aviso de Privacidade & CTA ==================== */}
        <footer className="w-full flex flex-col items-center mt-auto pt-8 pb-2">
          {/* Texto de Privacidade */}
          <p className="text-xs text-center text-[#94A3B8] leading-relaxed max-w-[290px] mb-6 font-normal">
            Nunca venderemos ou compartilharemos seus dados pessoais de forma inadequada.
          </p>

          {/* Botão Primário Próximo */}
          <button
            type="button"
            onClick={handleProximo}
            disabled={salvando}
            className={`w-full h-14 bg-[#00C975] hover:bg-[#00B568] active:scale-[0.98] text-white font-bold text-[18px] tracking-wide rounded-full shadow-lg shadow-[#00C975]/25 flex items-center justify-center transition-all duration-200 min-h-[56px] ${
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
          <div className="w-32 h-1 bg-slate-300 rounded-full mt-5 hidden sm:block opacity-40" />
        </footer>
      </main>
    </div>
  );
};
