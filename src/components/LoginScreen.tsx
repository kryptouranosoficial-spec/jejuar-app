/**
 * @file LoginScreen.tsx
 * @description Tela de acesso à conta do usuário no aplicativo Jejuar.
 * Segue com rigor as diretrizes de design system, tipografia Plus Jakarta Sans,
 * validação em tempo real de e-mail e senha, suporte a 'Lembrar de mim',
 * feedback humanizado de erros e conexão direta ao Firestore.
 */

import React, { useState, useId } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { autenticarUsuarioFirestore } from '../services/firebase';
import type { UsuarioEmCadastro } from '../types';

interface LoginScreenProps {
  /** Callback para voltar à tela de Boas-Vindas */
  onVoltar: () => void;
  /** Callback para navegar ao fluxo de cadastro/onboarding */
  onIrParaCadastro: () => void;
  /** Callback acionado ao concluir o login com sucesso */
  onLoginSucesso: (usuario: UsuarioEmCadastro) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onVoltar,
  onIrParaCadastro,
  onLoginSucesso,
}) => {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [lembrarDeMim, setLembrarDeMim] = useState<boolean>(true);
  const [autenticando, setAutenticando] = useState<boolean>(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // IDs para acessibilidade
  const idEmail = useId();
  const idSenha = useId();
  const idLembrar = useId();

  // Validação em tempo real
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValido = emailRegex.test(email.trim());
  const isSenhaValida = senha.trim().length >= 6;
  const formularioValido = isEmailValido && isSenhaValida;

  /**
   * Executa a autenticação do usuário junto ao Firestore.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioValido || autenticando) return;

    setAutenticando(true);
    setMensagemErro(null);

    try {
      // Valida credenciais na coleção "usuarios"
      const dadosUsuario = await autenticarUsuarioFirestore(email, senha);

      // Persiste a sessão no navegador caso solicitado
      if (dadosUsuario.id) {
        localStorage.setItem('jejuar_usuario_id', dadosUsuario.id);
        if (lembrarDeMim) {
          localStorage.setItem('jejuar_sessao_ativa', 'true');
        } else {
          localStorage.removeItem('jejuar_sessao_ativa');
        }
      }

      // Repassa dados ao estado mestre e navega para a tela de início
      onLoginSucesso({
        id: dadosUsuario.id,
        nome: dadosUsuario.nome,
        email: dadosUsuario.email,
        nivel: dadosUsuario.nivel,
        informacoesBasicas: dadosUsuario.informacoesBasicas,
      });
    } catch (error: any) {
      setMensagemErro(error.message || 'Não conseguimos acessar sua conta. Verifique sua conexão e tente novamente.');
      setAutenticando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0B1C30] relative overflow-hidden select-none font-sans antialiased">
      {/* Container Principal */}
      <div className="flex flex-col w-full h-full justify-between flex-1">
        
        {/* ==================== Top Navigation & Clean App Header ==================== */}
        <header className="w-full pt-6 pb-4 px-6 bg-white border-b border-slate-100 flex items-center justify-between relative z-10">
          <button 
            type="button"
            onClick={onVoltar}
            disabled={autenticando}
            aria-label="Voltar para a tela anterior"
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 active:scale-95 transition-all flex items-center justify-center z-10 rounded-full hover:bg-slate-100 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" strokeWidth={2.2} />
          </button>

          <h1 className="absolute inset-0 flex items-center justify-center font-bold text-[18px] text-[#0B1C30] tracking-tight pointer-events-none whitespace-nowrap">
            Acessar Conta
          </h1>

          <div className="w-8" aria-hidden="true" />
        </header>

        {/* ==================== Conteúdo Principal com Rolagem Suave ==================== */}
        <main className="flex flex-col flex-1 px-6 pt-6 pb-4 overflow-y-auto">
          
          {/* Recipiente do Ícone do App */}
          <div className="flex justify-center items-center w-full mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-white flex items-center justify-center shrink-0">
              <img 
                src="/assets/aistudio/screen_1d1a20d5.png" 
                alt="Logotipo Jejuar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback suave caso o arquivo local não esteja acessível
                  (e.currentTarget as HTMLImageElement).src = 'https://lh3.googleusercontent.com/aida/AEtjO1XbYMS5du7Zim-PgrKiOlmI82_aNI00uBf939zrMTd6aEUl8FXZb0lFNp3aqDl_4qoMv10qTZp2rO7nafwLEh9fxHXJnYNO_82RAl_z0VK4mdOC8ovGnsxscCjzYtUncHMQdHE8v4DvW1qQzyZDr2Ee_68uDKJCjysZVtHUOT1LRvHACL4ekZIUOGpcUgKy9imJzffgfFzHhmZwzYWNc8mUrEcqDuOB2Dxg_48yh5HmQeacsiHPT-U7ibbG';
                }}
              />
            </div>
          </div>

          {/* Título Principal & Subtítulo */}
          <div className="flex flex-col gap-2 mb-6 text-center items-center">
            <h2 className="text-[28px] font-extrabold text-[#0B1C30] tracking-tight leading-tight">
              Bem-vindo de volta!
            </h2>
            <p className="text-[14px] leading-relaxed text-slate-500 font-normal max-w-[320px]">
              Acesse sua conta para continuar acompanhando seus jejuns, metas e evolução.
            </p>
          </div>

          {/* Mensagem de Erro Humanizada */}
          {mensagemErro && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{mensagemErro}</p>
            </div>
          )}

          {/* Formulário de Login */}
          <form id="form-login" onSubmit={handleLogin} className="flex flex-col gap-4">
            
            {/* Input 1: E-mail */}
            <div className="flex flex-col gap-1.5">
              <label 
                htmlFor={idEmail} 
                className="text-[13px] font-semibold text-slate-700 ml-1 flex items-center justify-between"
              >
                <span>E-mail de cadastro</span>
                <span 
                  className={`text-xs font-semibold text-emerald-600 transition-opacity flex items-center gap-1 ${
                    isEmailValido ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Válido</span>
                </span>
              </label>

              <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-4 h-[56px] focus-within:border-[#00C975] focus-within:ring-2 focus-within:ring-[#00C975]/20 transition-all">
                <div className="flex items-center justify-center text-slate-400 mr-3 pointer-events-none">
                  <Mail className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <input
                  id={idEmail}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  className="w-full bg-transparent text-[#0B1C30] text-[15px] font-medium placeholder:text-slate-400 focus:outline-none border-0 p-0"
                />
              </div>
            </div>

            {/* Input 2: Senha */}
            <div className="flex flex-col gap-1.5">
              <label 
                htmlFor={idSenha} 
                className="text-[13px] font-semibold text-slate-700 ml-1 flex items-center justify-between"
              >
                <span>Sua senha</span>
              </label>

              <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-4 h-[56px] focus-within:border-[#00C975] focus-within:ring-2 focus-within:ring-[#00C975]/20 transition-all">
                <div className="flex items-center justify-center text-slate-400 mr-3 pointer-events-none">
                  <Lock className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <input
                  id={idSenha}
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-[#0B1C30] text-[15px] font-medium placeholder:text-slate-400 focus:outline-none border-0 p-0"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 flex items-center justify-center focus:outline-none min-h-[44px] min-w-[44px]"
                >
                  {mostrarSenha ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.8} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            {/* Linha de Apoio: Lembrar de mim & Esqueceu a senha */}
            <div className="flex items-center justify-between pt-1 px-1">
              <label htmlFor={idLembrar} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id={idLembrar}
                  type="checkbox"
                  checked={lembrarDeMim}
                  onChange={(e) => setLembrarDeMim(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center peer-checked:bg-[#00C975] peer-checked:border-[#00C975] transition-colors">
                  <svg className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-xs text-slate-600 font-medium">Lembrar de mim</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setMensagemErro('Para redefinir sua senha, solicite assistência ao administrador ou utilize o cadastro.');
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-0 p-0 cursor-pointer min-h-[44px] inline-flex items-center"
              >
                Esqueceu a senha?
              </button>
            </div>
          </form>
        </main>

        {/* ==================== Ação Inferior CTA & Rodapé ==================== */}
        <footer className="w-full px-6 pb-7 pt-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent flex flex-col items-center gap-3">
          <button
            type="submit"
            form="form-login"
            disabled={!formularioValido || autenticando}
            className={`w-full h-[56px] bg-[#00C975] hover:bg-[#00B167] active:scale-[0.98] text-white font-bold text-[16px] rounded-full flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all min-h-[48px] ${
              formularioValido && !autenticando
                ? 'opacity-100 cursor-pointer shadow-emerald-500/30'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            {autenticando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Acessando...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>

          {/* Link para Cadastro */}
          <div className="text-center">
            <p className="text-xs text-slate-500 font-normal">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={onIrParaCadastro}
                className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors ml-0.5 bg-transparent border-0 p-0 cursor-pointer inline min-h-[44px]"
              >
                Cadastre-se
              </button>
            </p>
          </div>

          {/* Indicador de Home iOS/Android */}
          <div className="w-32 h-1 bg-slate-300/60 rounded-full mt-1" />
        </footer>
      </div>
    </div>
  );
};
