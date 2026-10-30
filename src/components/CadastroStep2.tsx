/**
 * @file CadastroStep2.tsx
 * @description Segunda etapa do cadastro: Definição e confirmação da senha com validação visual de força.
 * Possui botão explícito "Registrar" que grava oficialmente o usuário no Firestore na coleção "usuarios",
 * com nível "usuario", capturando o ID gerado para alimentar os passos seguintes de informações básicas.
 */

import React, { useState, useId } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldCheck, 
  UserCheck, 
  Edit3, 
  Trash2,
  AlertCircle 
} from 'lucide-react';
import { ModalConfirmacao } from './ModalConfirmacao';
import { salvarUsuarioFirestore } from '../services/firebase';

interface CadastroStep2Props {
  /** Nome coletado no Passo 1 */
  nome: string;
  /** E-mail coletado no Passo 1 */
  email: string;
  /** Callback acionado após o registro bem-sucedido no Firestore, repassando o ID e os dados */
  onRegistrado: (usuarioId: string, dadosCompletos: { nome: string; email: string; nivel: string }) => void;
  /** Callback para voltar ao Passo 1 (Editar dados anteriores) */
  onVoltar: () => void;
  /** Callback para cancelar o processo de cadastro */
  onCancelarCadastro: () => void;
}

export const CadastroStep2: React.FC<CadastroStep2Props> = ({
  nome,
  email,
  onRegistrado,
  onVoltar,
  onCancelarCadastro,
}) => {
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Estados dos modais profissionais
  const [modalEditarAberto, setModalEditarAberto] = useState<boolean>(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState<boolean>(false);

  // IDs para acessibilidade
  const idSenha = useId();
  const idConfirmarSenha = useId();

  // Validação dinâmica dos 3 requisitos
  const temTamanhoMinimo = senha.length >= 8;
  const temLetrasENumeros = /[a-zA-Z]/.test(senha) && /[0-9]/.test(senha);
  const senhasCoincidem = senha.length > 0 && senha === confirmarSenha;

  // Cálculo da pontuação de força (0 a 3)
  const pontuacao = (temTamanhoMinimo ? 1 : 0) + (temLetrasENumeros ? 1 : 0) + (senhasCoincidem ? 1 : 0);
  const formularioValido = temTamanhoMinimo && temLetrasENumeros && senhasCoincidem;

  // Informações da barra de força
  const obterInfoForca = () => {
    if (senha.length === 0) {
      return { largura: '0%', texto: 'Requerida', corTexto: 'text-slate-400', corBarra: 'bg-slate-200' };
    }
    if (pontuacao === 1) {
      return { largura: '35%', texto: 'Fraca', corTexto: 'text-amber-600', corBarra: 'bg-amber-500' };
    }
    if (pontuacao === 2) {
      return { largura: '70%', texto: 'Média', corTexto: 'text-[#00C975]', corBarra: 'bg-[#00C975]' };
    }
    return { largura: '100%', texto: 'Excelente', corTexto: 'text-[#00C975] font-bold', corBarra: 'bg-[#00C975]' };
  };

  const infoForca = obterInfoForca();

  // Função disparada ao clicar no botão "Registrar"
  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioValido || salvando) return;

    setSalvando(true);
    setMensagemErro(null);

    try {
      // Salva no Firestore na coleção "usuarios" com nivel = 'usuario'
      const novoUsuarioId = await salvarUsuarioFirestore({
        nome,
        email,
        senha,
        nivel: 'usuario',
      });

      // Notifica o orquestrador com o ID recém-gerado
      onRegistrado(novoUsuarioId, {
        nome,
        email,
        nivel: 'usuario',
      });
    } catch (error: unknown) {
      const msg = error instanceof Error 
        ? error.message 
        : 'Não conseguimos salvar seu cadastro no momento. Verifique sua conexão e tente novamente.';
      setMensagemErro(msg);
      setSalvando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0B1C30] relative overflow-hidden select-none">
      {/* ==================== Top Navigation & Progress Header ==================== */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100/80 sticky top-0 z-20 pt-safe">
        <div className="h-16 px-4 flex items-center justify-between relative">
          {/* Botão Voltar */}
          <button
            type="button"
            onClick={onVoltar}
            disabled={salvando}
            aria-label="Voltar para a etapa anterior"
            className="w-11 h-11 text-slate-700 hover:text-slate-900 active:scale-95 transition-all flex items-center justify-center rounded-full min-h-[48px] min-w-[48px] disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Título Centralizado */}
          <h1 className="font-bold text-[18px] text-[#0B1C30] tracking-tight truncate px-2">
            Informações da Conta
          </h1>

          {/* Ações de Edição e Exclusão/Cancelamento (Regra de Cadastro) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setModalEditarAberto(true)}
              aria-label="Editar nome e e-mail"
              title="Editar dados anteriores"
              className="text-slate-500 hover:text-slate-800 p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setModalCancelarAberto(true)}
              aria-label="Cancelar cadastro"
              title="Cancelar e descartar cadastro"
              className="text-slate-400 hover:text-rose-600 p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Progresso do Cadastro (50% preenchido) */}
        <div className="w-full h-1 bg-slate-200/60 overflow-hidden" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="h-full bg-[#00C975] transition-all duration-500 ease-out" 
            style={{ width: '50%' }}
          />
        </div>
      </header>

      {/* ==================== Conteúdo Principal com Rolagem ==================== */}
      <main className="flex-1 px-6 pt-5 pb-4 overflow-y-auto flex flex-col justify-between">
        <div className="flex flex-col w-full">
          {/* Badge de Contexto */}
          <div className="flex justify-center w-full mb-5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-700 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00C975]" />
              <span>Segurança da Conta</span>
            </div>
          </div>

          {/* Cabeçalho Principal */}
          <div className="flex flex-col items-center text-center mb-6">
            <h2 className="text-[24px] sm:text-[26px] font-extrabold text-slate-900 mb-2 tracking-tight leading-snug">
              Crie sua senha de acesso
            </h2>
            <p className="text-slate-500 text-sm max-w-[320px] leading-relaxed">
              Defina uma senha segura para acessar seu plano e acompanhar seus resultados em qualquer dispositivo.
            </p>
          </div>

          {/* Feedback de Erro Humanizado */}
          {mensagemErro && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{mensagemErro}</p>
            </div>
          )}

          {/* Formulário de Criação de Senha */}
          <form id="form-cadastro-senha" onSubmit={handleRegistrar} className="flex flex-col gap-4.5 w-full">
            {/* Campo 1: Sua senha */}
            <div className="flex flex-col gap-1.5">
              <label 
                htmlFor={idSenha} 
                className="text-[13px] font-semibold text-slate-700 px-1 flex items-center justify-between"
              >
                <span>Sua senha</span>
                <span className={`text-xs transition-colors duration-200 ${infoForca.corTexto}`}>
                  {infoForca.texto}
                </span>
              </label>

              <div className="relative flex items-center w-full bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] focus-within:border-[#00C975] focus-within:ring-2 focus-within:ring-[#00C975]/20 transition-all">
                <div className="absolute left-4 flex items-center justify-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <input
                  id={idSenha}
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full h-[56px] pl-12 pr-12 bg-transparent text-[#0B1C30] text-[15px] font-medium placeholder:text-slate-400 outline-none rounded-2xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 transition-all active:scale-90 min-h-[44px] min-w-[44px]"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Campo 2: Confirme sua senha */}
            <div className="flex flex-col gap-1.5">
              <label 
                htmlFor={idConfirmarSenha} 
                className="text-[13px] font-semibold text-slate-700 px-1"
              >
                Confirme sua senha
              </label>

              <div className="relative flex items-center w-full bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] focus-within:border-[#00C975] focus-within:ring-2 focus-within:ring-[#00C975]/20 transition-all">
                <div className="absolute left-4 flex items-center justify-center pointer-events-none text-slate-400">
                  <UserCheck className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <input
                  id={idConfirmarSenha}
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a sua senha"
                  className="w-full h-[56px] pl-12 pr-12 bg-transparent text-[#0B1C30] text-[15px] font-medium placeholder:text-slate-400 outline-none rounded-2xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  aria-label={mostrarConfirmarSenha ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                  className="absolute right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 transition-all active:scale-90 min-h-[44px] min-w-[44px]"
                >
                  {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Barra de Progresso de Força Sutil */}
            <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden px-0.5 mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${infoForca.corBarra}`} 
                style={{ width: infoForca.largura }}
              />
            </div>

            {/* Indicador de Requisitos em Tempo Real */}
            <div className="flex flex-col gap-2 px-1 pt-1">
              {/* Regra 1 */}
              <div className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                temTamanhoMinimo ? 'text-emerald-700 font-medium' : 'text-slate-500'
              }`}>
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  temTamanhoMinimo ? 'bg-[#00C975] text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Pelo menos 8 caracteres</span>
              </div>

              {/* Regra 2 */}
              <div className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                temLetrasENumeros ? 'text-emerald-700 font-medium' : 'text-slate-500'
              }`}>
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  temLetrasENumeros ? 'bg-[#00C975] text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Inclui letras e números</span>
              </div>

              {/* Regra 3 */}
              <div className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                senhasCoincidem ? 'text-emerald-700 font-medium' : 'text-slate-500'
              }`}>
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  senhasCoincidem ? 'bg-[#00C975] text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>As senhas coincidem</span>
              </div>
            </div>

            {/* Card de Proteção Integral */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/90 border border-slate-200/60 shadow-xs mt-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 text-[#00C975] border border-emerald-100">
                <ShieldCheck className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xs font-bold text-slate-800 mb-0.5">Proteção Integral</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Sua senha é protegida com criptografia e você pode alterá-la a qualquer momento nas configurações do perfil.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* ==================== Ação Principal: Botão REGISTRAR ==================== */}
        <footer className="w-full pt-4 pb-6 pb-safe flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleRegistrar}
            disabled={!formularioValido || salvando}
            className={`w-full h-[56px] bg-[#00C975] hover:bg-[#00B167] active:scale-[0.98] text-white font-bold text-[16px] rounded-full flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all min-h-[48px] ${
              formularioValido && !salvando
                ? 'opacity-100 cursor-pointer shadow-emerald-500/35'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            {salvando ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registrando sua conta...</span>
              </>
            ) : (
              <>
                <span>Registrar</span>
                <Check className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Ao registrar, você concorda com nossos termos de proteção de dados.
          </p>

          {/* Indicador de home iOS/Android */}
          <div className="w-32 h-1 bg-slate-300/60 rounded-full mt-1" />
        </footer>
      </main>

      {/* Modal Profissional para Editar Dados Anteriores */}
      <ModalConfirmacao
        aberto={modalEditarAberto}
        titulo="Editar dados anteriores?"
        mensagem="Deseja voltar para a etapa anterior e alterar seu nome ou e-mail?"
        textoConfirmar="Sim, editar"
        textoCancelar="Continuar aqui"
        variante="aviso"
        onConfirmar={() => {
          setModalEditarAberto(false);
          onVoltar();
        }}
        onCancelar={() => setModalEditarAberto(false)}
      />

      {/* Modal Profissional para Cancelar / Descartar Cadastro */}
      <ModalConfirmacao
        aberto={modalCancelarAberto}
        titulo="Cancelar cadastro?"
        mensagem="Ao cancelar, todos os dados preenchidos até agora serão descartados e você voltará para o início."
        textoConfirmar="Sim, descartar"
        textoCancelar="Continuar cadastro"
        variante="perigo"
        onConfirmar={() => {
          setModalCancelarAberto(false);
          onCancelarCadastro();
        }}
        onCancelar={() => setModalCancelarAberto(false)}
      />
    </div>
  );
};
