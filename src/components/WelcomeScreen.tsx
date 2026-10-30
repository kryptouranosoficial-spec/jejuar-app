/**
 * @file WelcomeScreen.tsx
 * @description Tela de boas-vindas do aplicativo Jejuar ("Bem-vindo ao Jejuar").
 * Contém o logotipo com brilho esmeralda, tipografia acolhedora e o botão primário "Começar".
 */

import React, { useState } from 'react';
import { ChevronRight, Flame, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { iniciarSessaoAnonima } from '../services/firebase';

interface WelcomeScreenProps {
  /** Callback para reiniciar a visualização da SplashScreen */
  onReiniciarSplash?: () => void;
  /** Callback para avançar para a tela apropriada (início se já logado, ou onboarding para novo usuário) */
  onComecar?: (destino: 'inicio' | 'onboarding' | 'login') => void;
  /** Callback para abrir diretamente a tela de Login para usuários cadastrados */
  onIrParaLogin?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onReiniciarSplash, 
  onComecar,
  onIrParaLogin 
}) => {
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [falhaImagem, setFalhaImagem] = useState(false);

  /**
   * Trata o clique no botão "Começar".
   * Se já estiver logado, direciona imediatamente para 'inicio'.
   * Se for um novo usuário, direciona para o onboarding interativo.
   */
  const tratarInicio = async () => {
    try {
      setCarregando(true);
      setErro(null);

      // Inicia a sessão anônima no Firebase em background para garantir conectividade
      iniciarSessaoAnonima().catch((err) => {
        console.warn("Aviso na autenticação Firebase:", err);
      });

      // Checa a persistência da sessão nas configurações do navegador
      const usuarioIdSalvo = typeof window !== 'undefined' ? localStorage.getItem('jejuar_usuario_id') : null;
      const sessaoAtiva = typeof window !== 'undefined' ? localStorage.getItem('jejuar_sessao_ativa') : null;

      const estaLogado = Boolean(usuarioIdSalvo && sessaoAtiva === 'true');

      if (onComecar) {
        onComecar(estaLogado ? 'inicio' : 'onboarding');
      }
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Trata o clique direto em "Já tem uma conta? Entrar".
   * Direciona imediatamente para a tela de Login sem passar pelo questionário.
   */
  const tratarLogin = () => {
    if (onIrParaLogin) {
      onIrParaLogin();
    } else if (onComecar) {
      onComecar('login');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAFCFA] text-[#0F172A] font-sans antialiased flex flex-col justify-between selection:bg-[#00C975]/20 selection:text-[#00C975] overflow-x-hidden">
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col justify-between px-6 pt-safe pb-safe relative">
        {/* Barra superior de status/espaçador com botão opcional de rever Splash */}
        <header className="w-full flex items-center justify-end py-3 z-20">
          {onReiniciarSplash && (
            <button
              type="button"
              onClick={onReiniciarSplash}
              aria-label="Rever tela de abertura (Splash Screen)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-slate-100 rounded-full border border-slate-200/80 shadow-xs transition-all duration-150 min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ver Splash</span>
            </button>
          )}
        </header>

        {/* Seção Central: Logotipo & Títulos de Boas-vindas */}
        <section className="flex flex-col items-center justify-center text-center my-auto px-2 z-10">
          {/* Recipiente do Ícone do App com Brilho Suave */}
          <div className="relative mb-6">
            <div 
              className="absolute -inset-3 bg-[#00C975]/15 rounded-[36px] blur-xl" 
              aria-hidden="true" 
            />
            
            {!falhaImagem ? (
              <img 
                src="/assets/aistudio/screen_1d1a20d5.png" 
                alt="Logotipo Jejuar" 
                className="relative w-[124px] h-[124px] object-cover rounded-3xl shadow-xl shadow-emerald-950/5 border border-white/60 bg-white"
                onError={() => setFalhaImagem(true)}
                loading="eager"
              />
            ) : (
              <div className="relative w-[124px] h-[124px] rounded-3xl bg-white shadow-xl shadow-emerald-950/5 border border-white/60 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center border-2 border-[#00C975]">
                  <Flame className="w-9 h-9 text-[#00C975]" />
                </div>
              </div>
            )}
          </div>

          {/* Título de Boas-vindas */}
          <h1 className="text-[30px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Bem-vindo ao Jejuar
          </h1>

          {/* Subtítulo limpo e objetivo */}
          <p className="text-base text-slate-500 font-medium mt-2.5 max-w-[310px] leading-relaxed">
            Seu acompanhamento inteligente de jejum intermitente
          </p>

          {/* Feedback amigável caso a autenticação tenha sido acionada */}
          {mensagemSucesso && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#00C975] shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {erro && (
            <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium">
              <span>{erro}</span>
            </div>
          )}
        </section>

        {/* Seção Inferior de Ação: Botão Primário "Começar" */}
        <footer className="w-full pb-8 pt-4 flex flex-col gap-3.5 items-center z-10">
          <button
            type="button"
            id="start-btn"
            disabled={carregando}
            onClick={tratarInicio}
            className="w-full h-14 py-4 px-6 bg-[#00C975] hover:bg-[#00B368] active:scale-[0.985] disabled:opacity-75 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-full shadow-lg shadow-[#00C975]/30 flex items-center justify-between transition-all duration-200 relative min-h-[44px]"
          >
            {/* Espaçador para garantir centralização matemática do texto */}
            <span className="w-5 h-5 invisible" aria-hidden="true" />
            
            <span className="text-center font-semibold text-lg inline-flex items-center gap-2">
              {carregando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                'Começar'
              )}
            </span>

            {/* Seta animada com deslocamento horizontal contínuo */}
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-white stroke-[2.5]" />
            </motion.div>
          </button>

          {/* Opção para usuários cadastrados irem diretamente para o Login */}
          <button
            type="button"
            id="login-direct-btn"
            disabled={carregando}
            onClick={tratarLogin}
            className="w-full min-h-[46px] py-2 px-4 rounded-full text-slate-600 hover:text-[#00C975] hover:bg-emerald-50/60 active:scale-95 font-semibold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Já tem uma conta?</span>
            <span className="text-[#00C975] font-bold underline underline-offset-2">Entrar</span>
          </button>

          {/* Nota de privacidade e boas práticas */}
          <p className="text-[12px] text-slate-400 text-center font-medium">
            Ao continuar, você concorda em gerenciar seus jejuns com equilíbrio e saúde.
          </p>
        </footer>
      </main>
    </div>
  );
};
