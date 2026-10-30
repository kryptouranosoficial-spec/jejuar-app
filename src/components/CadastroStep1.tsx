/**
 * @file CadastroStep1.tsx
 * @description Primeira etapa do cadastro: Coleta e validação reativa do Nome e E-mail.
 * Exibe barra de progresso em 25%, badge de segurança, validação com checks animados,
 * botões de touch target >= 48px e opções de edição/limpeza com modal de confirmação.
 */

import React, { useState, useId } from 'react';
import { ArrowLeft, User, Mail, ShieldCheck, CheckCircle2, ArrowRight, Trash2 } from 'lucide-react';
import { ModalConfirmacao } from './ModalConfirmacao';

interface CadastroStep1Props {
  /** Valor inicial do nome caso já preenchido */
  nomeInicial?: string;
  /** Valor inicial do e-mail caso já preenchido */
  emailInicial?: string;
  /** Callback para avançar ao Passo 2 do cadastro */
  onAvancar: (dados: { nome: string; email: string }) => void;
  /** Callback para voltar ao passo 4 do Onboarding */
  onVoltar: () => void;
}

export const CadastroStep1: React.FC<CadastroStep1Props> = ({
  nomeInicial = '',
  emailInicial = '',
  onAvancar,
  onVoltar,
}) => {
  const [nome, setNome] = useState<string>(nomeInicial);
  const [email, setEmail] = useState<string>(emailInicial);
  const [modalLimparAberto, setModalLimparAberto] = useState<boolean>(false);

  // IDs únicos para acessibilidade dos campos
  const idNome = useId();
  const idEmail = useId();

  // Validação em tempo real
  const isNomeValido = nome.trim().length >= 3;
  const isEmailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValido = isNomeValido && isEmailValido;

  // Trata o envio seguro para a próxima etapa
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValido) {
      onAvancar({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
      });
    }
  };

  // Limpa os campos após confirmação no modal profissional
  const confirmarLimpeza = () => {
    setNome('');
    setEmail('');
    setModalLimparAberto(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0B1C30] relative overflow-hidden select-none">
      {/* ==================== Top Navigation & Progress Header ==================== */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100/80 sticky top-0 z-20 pt-safe">
        <div className="h-16 px-5 flex items-center justify-between relative">
          {/* Botão Voltar */}
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar para a etapa anterior"
            className="w-11 h-11 -ml-1 text-slate-700 hover:text-slate-900 active:scale-95 transition-all flex items-center justify-center rounded-full min-h-[48px] min-w-[48px]"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Título Centralizado */}
          <h1 className="absolute inset-0 flex items-center justify-center font-bold text-[18px] text-[#0B1C30] tracking-tight pointer-events-none">
            Informações da Conta
          </h1>

          {/* Botão de Limpar / Descartar campos (Padrão de Cadastro com Modal) */}
          {(nome.length > 0 || email.length > 0) && (
            <button
              type="button"
              onClick={() => setModalLimparAberto(true)}
              aria-label="Limpar formulário"
              title="Limpar campos preenchidos"
              className="text-slate-400 hover:text-rose-600 active:scale-95 transition-colors p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Barra de Progresso do Cadastro (25% preenchido) */}
        <div className="w-full h-1 bg-slate-200/60 overflow-hidden" role="progressbar" aria-valuenow={25} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="h-full bg-[#00C975] transition-all duration-500 ease-out" 
            style={{ width: '25%' }}
          />
        </div>
      </header>

      {/* ==================== Conteúdo Principal com Rolagem ==================== */}
      <main className="flex-1 px-6 pt-6 pb-4 overflow-y-auto flex flex-col justify-between">
        <div className="flex flex-col w-full">
          {/* Badge de Contexto */}
          <div className="flex justify-center w-full mb-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-700 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00C975]" />
              <span>Segurança da Conta</span>
            </div>
          </div>

          {/* Título e Subtítulo Humanizados */}
          <div className="flex flex-col items-center text-center gap-2 mb-7">
            <h2 className="text-[24px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug">
              Como devemos chamar você?
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[320px]">
              Personalize sua experiência e garanta que seus dados de jejum fiquem salvos em segurança.
            </p>
          </div>

          {/* Formulário de Coleta */}
          <form id="form-cadastro-1" onSubmit={handleSubmit} className="flex flex-col gap-4.5 w-full">
            {/* Campo 1: Seu nome */}
            <div className="flex flex-col gap-1.5">
              <label 
                htmlFor={idNome} 
                className="text-[13px] font-semibold text-slate-700 ml-1 flex items-center justify-between"
              >
                <span>Seu nome</span>
                <span 
                  className={`text-xs font-semibold text-emerald-600 flex items-center gap-1 transition-opacity duration-200 ${
                    isNomeValido ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pronto
                </span>
              </label>

              <div className="relative flex items-center group">
                <div className="absolute left-4 flex items-center justify-center text-slate-400 group-focus-within:text-[#00C975] transition-colors pointer-events-none">
                  <User className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <input
                  id={idNome}
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria Clara Silva"
                  className="w-full h-[56px] pl-12 pr-4 bg-white text-[#0B1C30] text-[15px] font-medium rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] placeholder:text-slate-400 focus:outline-none focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Campo 2: Seu melhor e-mail */}
            <div className="flex flex-col gap-1.5">
              <label 
                htmlFor={idEmail} 
                className="text-[13px] font-semibold text-slate-700 ml-1 flex items-center justify-between"
              >
                <span>Seu melhor e-mail</span>
                <span 
                  className={`text-xs font-semibold text-emerald-600 flex items-center gap-1 transition-opacity duration-200 ${
                    isEmailValido ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Válido
                </span>
              </label>

              <div className="relative flex items-center group">
                <div className="absolute left-4 flex items-center justify-center text-slate-400 group-focus-within:text-[#00C975] transition-colors pointer-events-none">
                  <Mail className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <input
                  id={idEmail}
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full h-[56px] pl-12 pr-4 bg-white text-[#0B1C30] text-[15px] font-medium rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] placeholder:text-slate-400 focus:outline-none focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Card de Privacidade & Garantia */}
            <div className="mt-2.5 p-4 bg-white/90 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#00C975] flex items-center justify-center shrink-0 border border-emerald-100">
                <ShieldCheck className="w-5 h-5" strokeWidth={2} />
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed font-normal">
                <strong className="font-semibold text-slate-800">Seus dados estão protegidos.</strong> Nunca compartilharemos suas informações com terceiros.
              </p>
            </div>
          </form>
        </div>

        {/* ==================== Ação Inferior (CTA Próximo) ==================== */}
        <footer className="w-full pt-4 pb-6 pb-safe flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValido}
            className={`w-full h-[56px] bg-[#00C975] hover:bg-[#00B167] active:scale-[0.98] text-white font-bold text-[16px] rounded-full flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all min-h-[48px] ${
              isFormValido ? 'opacity-100 cursor-pointer shadow-emerald-500/30' : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <span>Próximo</span>
            <ArrowRight className="w-5 h-5" strokeWidth={2.2} />
          </button>

          {/* Indicador de home iOS/Android */}
          <div className="w-32 h-1 bg-slate-300/60 rounded-full mt-1" />
        </footer>
      </main>

      {/* Modal Profissional de Limpeza / Descarte */}
      <ModalConfirmacao
        aberto={modalLimparAberto}
        titulo="Limpar informações?"
        mensagem="Ao confirmar, os campos de nome e e-mail serão apagados e você precisará preenchê-los novamente."
        textoConfirmar="Sim, limpar"
        textoCancelar="Cancelar"
        variante="aviso"
        onConfirmar={confirmarLimpeza}
        onCancelar={() => setModalLimparAberto(false)}
      />
    </div>
  );
};
