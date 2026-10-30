/**
 * @file ModalAlterarSenha.tsx
 * @description Modal de segurança para alteração de senha de acesso.
 * Oferece alternância de visibilidade (Eye/EyeOff), verificação de senha atual,
 * confirmação de segurança e mensagens humanizadas em Português do Brasil.
 */

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { alterarSenhaPerfil } from '../../services/perfilService';

interface ModalAlterarSenhaProps {
  aberto: boolean;
  usuarioId: string;
  onSucesso: () => void;
  onFechar: () => void;
}

export const ModalAlterarSenha: React.FC<ModalAlterarSenhaProps> = ({
  aberto,
  usuarioId,
  onSucesso,
  onFechar,
}) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    // Validações humanizadas
    if (!senhaAtual) {
      setErro('Por favor, informe a sua senha atual para continuar.');
      return;
    }
    if (!novaSenha || novaSenha.length < 6) {
      setErro('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro('A nova senha e a confirmação não coincidem. Digite novamente.');
      return;
    }
    if (senhaAtual === novaSenha) {
      setErro('A nova senha não pode ser idêntica à senha atual.');
      return;
    }

    try {
      setCarregando(true);
      await alterarSenhaPerfil(usuarioId, senhaAtual, novaSenha);
      setCarregando(false);
      onSucesso();
      onFechar();
    } catch (err: any) {
      setCarregando(false);
      setErro(err.message || 'Não conseguimos salvar sua nova senha. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-senha"
    >
      <div 
        className="w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 id="titulo-modal-senha" className="text-base font-bold text-[#0B2246]">
              Alterar Senha
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* Senha Atual */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B2246] block">
              Senha atual <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={mostrarSenhaAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full min-h-[48px] px-4 pr-12 rounded-2xl border border-slate-200 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm text-[#0B2246] outline-hidden transition-all bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={mostrarSenhaAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'}
              >
                {mostrarSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B2246] block">
              Nova senha <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={mostrarNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full min-h-[48px] px-4 pr-12 rounded-2xl border border-slate-200 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm text-[#0B2246] outline-hidden transition-all bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={mostrarNovaSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'}
              >
                {mostrarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B2246] block">
              Confirmar nova senha <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full min-h-[48px] px-4 pr-12 rounded-2xl border border-slate-200 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm text-[#0B2246] outline-hidden transition-all bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={mostrarConfirmarSenha ? 'Ocultar confirmação' : 'Mostrar confirmação'}
              >
                {mostrarConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onFechar}
              disabled={carregando}
              className="flex-1 min-h-[48px] px-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="flex-1 min-h-[48px] px-4 rounded-2xl bg-[#00C975] hover:bg-[#00B067] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Atualizar Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
