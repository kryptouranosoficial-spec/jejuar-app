/**
 * @file ModalAlterarSenha.tsx
 * @description Tela cheia de Alteração de Senha de Acesso do aplicativo Jejuar.
 * Segue exatamente a mesma arquitetura de UX/UI de alto nível da tela de Editar Perfil:
 * - Assume 100% da tela (fixed inset-0 z-[60]), encobrindo o cabeçalho global e o menu inferior.
 * - Cabeçalho superior fixo com botão Voltar e botão X de alta qualidade (touch targets >= 44x44px).
 * - Verificação em tempo real da Senha Atual conforme o usuário digita.
 * - Medidor dinâmico de força da Nova Senha e Checklist interativo em tempo real
 *   (Mínimo de 8 caracteres, Letras e números, Diferente da atual e Confirmação idêntica).
 * - Duplo controle em todos os campos: botão X para limpar rapidamente + botão Olho (Mostrar/Ocultar).
 * - Rodapé fixo na zona do polegar (Safe Area) com alerta ancorado logo acima do botão principal
 *   e rolagem suave automática até o campo que precisa de ajuste.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { alterarSenhaPerfil, obterSenhaAtualUsuario } from '../../services/perfilService';

interface ModalAlterarSenhaProps {
  /** Define se a tela cheia de alteração de senha está aberta */
  aberto: boolean;
  /** ID do usuário autenticado no Firestore */
  usuarioId: string;
  /** Callback acionado após atualização bem-sucedida da senha */
  onSucesso: () => void;
  /** Callback para fechar a tela e retornar ao perfil */
  onFechar: () => void;
}

export const ModalAlterarSenha: React.FC<ModalAlterarSenhaProps> = ({
  aberto,
  usuarioId,
  onSucesso,
  onFechar,
}) => {
  // Estados dos 3 campos de senha
  const [senhaAtual, setSenhaAtual] = useState<string>('');
  const [novaSenha, setNovaSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');

  // Estados de visibilidade (Mostrar / Ocultar senha)
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState<boolean>(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState<boolean>(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState<boolean>(false);

  // Senha real cadastrada no banco para verificação instantânea em tempo real
  const [senhaCadastradaReal, setSenhaCadastradaReal] = useState<string | null>(null);

  // Estados do botão do rodapé (Normal -> Salvando -> Sucesso) e mensagem de erro
  const [estadoBotao, setEstadoBotao] = useState<'normal' | 'salvando' | 'sucesso'>('normal');
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Carrega a senha atual cadastrada ao abrir a tela para validar em tempo real
  useEffect(() => {
    if (aberto) {
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setMostrarSenhaAtual(false);
      setMostrarNovaSenha(false);
      setMostrarConfirmarSenha(false);
      setEstadoBotao('normal');
      setMensagemErro(null);

      obterSenhaAtualUsuario(usuarioId)
        .then((senhaSalva) => {
          setSenhaCadastradaReal(senhaSalva);
        })
        .catch(() => {
          setSenhaCadastradaReal(null);
        });
    }
  }, [aberto, usuarioId]);

  // ==================== VERIFICAÇÕES EM TEMPO REAL ====================
  // 1. Status da Senha Atual digitada
  const senhaAtualConfirmadaAoVivo = useMemo(() => {
    if (!senhaAtual) return 'vazia';
    if (senhaCadastradaReal !== null) {
      return senhaAtual === senhaCadastradaReal ? 'correta' : 'incorreta';
    }
    return 'digitando';
  }, [senhaAtual, senhaCadastradaReal]);

  // 2. Requisitos de segurança da Nova Senha (Padrão 8 caracteres + Letras e Números)
  const temTamanhoMinimo = novaSenha.length >= 8;
  const temLetrasENumeros = /[a-zA-Z]/.test(novaSenha) && /[0-9]/.test(novaSenha);
  const diferenteDaAtual =
    novaSenha.length > 0 && (senhaAtual.length === 0 || novaSenha !== senhaAtual);
  const senhasCoincidem = novaSenha.length > 0 && novaSenha === confirmarSenha;

  // Cálculo da força da Nova Senha (0 a 4)
  const infoForcaSenha = useMemo(() => {
    if (novaSenha.length === 0) {
      return {
        largura: '0%',
        rotulo: 'Digite a nova senha',
        corTexto: 'text-slate-400 dark:text-slate-400',
        corBarra: 'bg-slate-200 dark:bg-slate-700',
      };
    }

    let pontos = 0;
    if (temTamanhoMinimo) pontos += 1;
    if (temLetrasENumeros) pontos += 1;
    if (novaSenha.length >= 10 || /[^a-zA-Z0-9]/.test(novaSenha)) pontos += 1;

    if (!temTamanhoMinimo || pontos <= 1) {
      return {
        largura: '35%',
        rotulo: 'Senha fraca',
        corTexto: 'text-amber-600 dark:text-amber-400',
        corBarra: 'bg-amber-500',
      };
    }

    if (pontos === 2) {
      return {
        largura: '75%',
        rotulo: 'Senha forte',
        corTexto: 'text-emerald-600 dark:text-emerald-400',
        corBarra: 'bg-[#00C975]',
      };
    }

    return {
      largura: '100%',
      rotulo: 'Segurança excelente',
      corTexto: 'text-emerald-600 dark:text-emerald-400',
      corBarra: 'bg-emerald-500',
    };
  }, [novaSenha, temTamanhoMinimo, temLetrasENumeros]);

  if (!aberto) return null;

  /**
   * Rola suavemente a tela até o campo que precisa de ajuste e aplica foco nele.
   */
  const focarERolarParaCampo = (idCampo: string) => {
    if (typeof document === 'undefined') return;
    const elemento = document.getElementById(idCampo) as HTMLInputElement | null;
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        elemento.focus({ preventScroll: true });
      }, 280);
    }
  };

  /**
   * Submissão do formulário com validação humanizada e auto-scroll para o campo inválido.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    // 1. Verifica preenchimento da Senha Atual
    if (!senhaAtual) {
      setMensagemErro('Por favor, digite a sua senha atual para confirmar sua identidade.');
      focarERolarParaCampo('input-senha-atual');
      return;
    }

    // Se já sabemos em tempo real que a senha atual não confere, avisa imediatamente
    if (senhaCadastradaReal !== null && senhaAtual !== senhaCadastradaReal) {
      setMensagemErro('A senha atual informada está incorreta. Verifique e tente novamente.');
      focarERolarParaCampo('input-senha-atual');
      return;
    }

    // 2. Verifica tamanho mínimo de 8 caracteres
    if (!temTamanhoMinimo) {
      setMensagemErro('A nova senha deve ter no mínimo 8 caracteres.');
      focarERolarParaCampo('input-nova-senha');
      return;
    }

    // 3. Verifica combinação de letras e números
    if (!temLetrasENumeros) {
      setMensagemErro('A nova senha precisa conter pelo menos uma letra e um número.');
      focarERolarParaCampo('input-nova-senha');
      return;
    }

    // 4. Impede senha igual à atual
    if (senhaAtual === novaSenha) {
      setMensagemErro('Para sua segurança, a nova senha deve ser diferente da senha atual.');
      focarERolarParaCampo('input-nova-senha');
      return;
    }

    // 5. Verifica se a confirmação coincide
    if (!confirmarSenha || novaSenha !== confirmarSenha) {
      setMensagemErro('A confirmação da nova senha não coincide. Verifique os dois campos.');
      focarERolarParaCampo('input-confirmar-senha');
      return;
    }

    try {
      setEstadoBotao('salvando');
      await alterarSenhaPerfil(usuarioId, senhaAtual, novaSenha);

      setEstadoBotao('sucesso');

      setTimeout(() => {
        onSucesso();
        onFechar();
      }, 950);
    } catch (err: any) {
      setEstadoBotao('normal');
      const msgBruta = String(err?.message || '');
      const ehErroTecnico =
        /is not defined|undefined|null|firebase|network|fetch|syntax|referenceerror|typeerror/i.test(
          msgBruta
        );
      setMensagemErro(
        !msgBruta || ehErroTecnico
          ? 'Não conseguimos atualizar sua senha no momento. Verifique sua conexão e tente novamente.'
          : msgBruta
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#F1F5F9] dark:bg-slate-950 flex justify-center items-center select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-tela-alterar-senha"
      data-purpose="alterar-senha-fullscreen-overlay"
    >
      {/* Container Mobile de Tela Cheia (Encobre AppHeader no topo e MenuInferior no rodapé) */}
      <div className="w-full max-w-[430px] h-[100dvh] bg-[#F5F9FC] dark:bg-slate-900 flex flex-col justify-between relative shadow-2xl overflow-hidden">
        
        {/* ==================== CABEÇALHO FIXO SUPERIOR ==================== */}
        <header
          className="shrink-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 pb-3 flex items-center justify-between"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
        >
          <button
            type="button"
            onClick={onFechar}
            disabled={estadoBotao === 'salvando'}
            aria-label="Voltar para a tela de perfil"
            className="min-h-[44px] min-w-[44px] -ml-1.5 rounded-2xl flex items-center justify-center text-[#0B2246] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <h1
            id="titulo-tela-alterar-senha"
            className="text-[17px] font-extrabold text-[#0B2246] dark:text-white tracking-tight"
          >
            Alterar Senha de Acesso
          </h1>

          {/* Botão X de Alta Qualidade para fechar rapidamente */}
          <button
            type="button"
            onClick={onFechar}
            disabled={estadoBotao === 'salvando'}
            aria-label="Fechar tela de alterar senha"
            className="min-h-[44px] min-w-[44px] -mr-1.5 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0B2246] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </header>

        {/* ==================== ÁREA CENTRAL ROLÁVEL DO FORMULÁRIO ==================== */}
        <form
          id="form-alterar-senha"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 w-full overflow-y-auto px-4 pt-4 pb-8 space-y-4"
        >
          {/* ==================== BLOCO 1: VERIFICAÇÃO DE IDENTIDADE ==================== */}
          <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-700/70 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Identidade Atual
              </span>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                <strong className="text-rose-500">*</strong> Obrigatório
              </span>
            </div>

            {/* 1. Senha Atual com Verificação em Tempo Real */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-senha-atual"
                  className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4 text-amber-500 stroke-[2]" />
                  <span>Senha Atual</span>
                  <span className="text-rose-500 font-extrabold" aria-hidden="true">
                    *
                  </span>
                </label>

                {/* Badge dinâmico em tempo real da Senha Atual */}
                {senhaAtualConfirmadaAoVivo === 'vazia' && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    Confirme sua senha
                  </span>
                )}
                {senhaAtualConfirmadaAoVivo === 'correta' && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.3]" />
                    Senha atual confirmada
                  </span>
                )}
                {senhaAtualConfirmadaAoVivo === 'incorreta' && (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                    Ainda não confere
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  id="input-senha-atual"
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="next"
                  required
                  value={senhaAtual}
                  onChange={(e) => {
                    setMensagemErro(null);
                    setSenhaAtual(e.target.value);
                  }}
                  placeholder="Digite sua senha de acesso atual"
                  className={`w-full min-h-[48px] pl-4 pr-22 rounded-2xl border bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-sm font-semibold text-[#0B2246] dark:text-white placeholder:text-slate-400 outline-hidden transition-all ${
                    senhaAtualConfirmadaAoVivo === 'correta'
                      ? 'border-emerald-400 dark:border-emerald-500/80 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15'
                  }`}
                />

                {/* Controles Duplos: Limpar (X) + Mostrar/Ocultar (Olho) */}
                <div className="absolute right-1 flex items-center">
                  {senhaAtual.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMensagemErro(null);
                        setSenhaAtual('');
                      }}
                      aria-label="Limpar senha atual"
                      className="min-w-[40px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setMostrarSenhaAtual((prev) => !prev)}
                    aria-label={mostrarSenhaAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-[#0B2246] dark:hover:text-white active:scale-95 transition-all cursor-pointer"
                  >
                    {mostrarSenhaAtual ? (
                      <EyeOff className="w-4.5 h-4.5 stroke-[2]" />
                    ) : (
                      <Eye className="w-4.5 h-4.5 stroke-[2]" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== BLOCO 2: DEFINIÇÃO DA NOVA SENHA ==================== */}
          <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-700/70 shadow-2xs space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
              Nova Credencial de Acesso
            </span>

            {/* 2. Nova Senha + Medidor de Força Ao Vivo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-nova-senha"
                  className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4 text-[#00C975] stroke-[2]" />
                  <span>Nova Senha</span>
                  <span className="text-rose-500 font-extrabold" aria-hidden="true">
                    *
                  </span>
                </label>

                <span className={`text-[11px] font-bold ${infoForcaSenha.corTexto}`}>
                  {infoForcaSenha.rotulo}
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  id="input-nova-senha"
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  required
                  value={novaSenha}
                  onChange={(e) => {
                    setMensagemErro(null);
                    setNovaSenha(e.target.value);
                  }}
                  placeholder="Mínimo de 8 caracteres (letras e números)"
                  className="w-full min-h-[48px] pl-4 pr-22 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15 text-sm font-semibold text-[#0B2246] dark:text-white placeholder:text-slate-400 outline-hidden transition-all"
                />

                <div className="absolute right-1 flex items-center">
                  {novaSenha.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMensagemErro(null);
                        setNovaSenha('');
                      }}
                      aria-label="Limpar nova senha"
                      className="min-w-[40px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha((prev) => !prev)}
                    aria-label={mostrarNovaSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-[#0B2246] dark:hover:text-white active:scale-95 transition-all cursor-pointer"
                  >
                    {mostrarNovaSenha ? (
                      <EyeOff className="w-4.5 h-4.5 stroke-[2]" />
                    ) : (
                      <Eye className="w-4.5 h-4.5 stroke-[2]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Barra Visual de Força da Senha */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/70 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${infoForcaSenha.corBarra}`}
                  style={{ width: infoForcaSenha.largura }}
                />
              </div>
            </div>

            {/* 3. Confirmar Nova Senha */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-confirmar-senha"
                  className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400 stroke-[2]" />
                  <span>Confirmar Nova Senha</span>
                  <span className="text-rose-500 font-extrabold" aria-hidden="true">
                    *
                  </span>
                </label>

                {confirmarSenha.length === 0 ? (
                  <span className="text-[11px] font-semibold text-slate-400">
                    Repita a senha
                  </span>
                ) : senhasCoincidem ? (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.3]" />
                    Senhas coincidem
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                    Ainda não coincide
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  id="input-confirmar-senha"
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  enterKeyHint="done"
                  required
                  value={confirmarSenha}
                  onChange={(e) => {
                    setMensagemErro(null);
                    setConfirmarSenha(e.target.value);
                  }}
                  placeholder="Digite novamente a nova senha"
                  className={`w-full min-h-[48px] pl-4 pr-22 rounded-2xl border bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-sm font-semibold text-[#0B2246] dark:text-white placeholder:text-slate-400 outline-hidden transition-all ${
                    confirmarSenha.length > 0 && senhasCoincidem
                      ? 'border-emerald-400 dark:border-emerald-500/80 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15'
                  }`}
                />

                <div className="absolute right-1 flex items-center">
                  {confirmarSenha.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMensagemErro(null);
                        setConfirmarSenha('');
                      }}
                      aria-label="Limpar confirmação de senha"
                      className="min-w-[40px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha((prev) => !prev)}
                    aria-label={
                      mostrarConfirmarSenha
                        ? 'Ocultar confirmação de senha'
                        : 'Mostrar confirmação de senha'
                    }
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-[#0B2246] dark:hover:text-white active:scale-95 transition-all cursor-pointer"
                  >
                    {mostrarConfirmarSenha ? (
                      <EyeOff className="w-4.5 h-4.5 stroke-[2]" />
                    ) : (
                      <Eye className="w-4.5 h-4.5 stroke-[2]" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== BLOCO 3: CHECKLIST EM TEMPO REAL DE REQUISITOS ==================== */}
          <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-700/70 shadow-2xs space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
              Verificação em Tempo Real
            </span>

            <div className="space-y-2.5">
              {/* Requisito 1: Tamanho mínimo */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    temTamanhoMinimo
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    temTamanhoMinimo
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Pelo menos 8 caracteres ({novaSenha.length}/8)
                </span>
              </div>

              {/* Requisito 2: Letras e números */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    temLetrasENumeros
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    temLetrasENumeros
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Combinação de letras e números
                </span>
              </div>

              {/* Requisito 3: Diferente da senha atual */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    diferenteDaAtual
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    diferenteDaAtual
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Diferente da senha utilizada atualmente
                </span>
              </div>

              {/* Requisito 4: Confirmação idêntica */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    senhasCoincidem
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    senhasCoincidem
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Nova senha e confirmação idênticas
                </span>
              </div>
            </div>
          </section>
        </form>

        {/* ==================== RODAPÉ FIXO NA ZONA DO POLEGAR (SAFE AREA) ==================== */}
        <footer
          className="shrink-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-4 pt-3 space-y-2.5"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        >
          {/* Alerta de Erro Ancorado Logo Acima do Botão Atualizar Senha */}
          {mensagemErro && (
            <div
              role="alert"
              className="pl-3.5 pr-1 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-start gap-2.5 py-0.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400 stroke-[2.2]" />
                <span className="leading-relaxed">{mensagemErro}</span>
              </div>

              <button
                type="button"
                onClick={() => setMensagemErro(null)}
                aria-label="Fechar aviso"
                className="min-w-[44px] min-h-[44px] shrink-0 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          )}

          <button
            type="submit"
            form="form-alterar-senha"
            disabled={estadoBotao === 'salvando' || estadoBotao === 'sucesso'}
            className={`w-full min-h-[52px] rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 cursor-pointer ${
              estadoBotao === 'salvando'
                ? 'bg-[#00C975] text-white opacity-90 cursor-wait'
                : estadoBotao === 'sucesso'
                ? 'bg-emerald-600 text-white scale-[1.01] shadow-emerald-500/25'
                : 'bg-[#00C975] hover:bg-[#00B368] text-white shadow-[#00C975]/25 active:scale-[0.98]'
            }`}
          >
            {estadoBotao === 'salvando' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin stroke-[2.2]" />
                <span>Atualizando senha...</span>
              </>
            )}

            {estadoBotao === 'sucesso' && (
              <>
                <Check className="w-5 h-5 stroke-[2.8]" />
                <span>Senha atualizada com sucesso!</span>
              </>
            )}

            {estadoBotao === 'normal' && (
              <>
                <Check className="w-5 h-5 stroke-[2.4]" />
                <span>Atualizar Senha de Acesso</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
