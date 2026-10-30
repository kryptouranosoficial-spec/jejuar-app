/**
 * @file ModalExcluirConta.tsx
 * @description Modal de exclusão definitiva de conta com destruição de dados.
 * Exige a digitação da palavra "Excluir", fornece aviso explícito da LGPD (Lei Geral de Proteção de Dados)
 * e disponibiliza link/botão para download prévio do backup completo de dados em formato JSON.
 */

import React, { useState } from 'react';
import { AlertTriangle, Download, Trash2, X, Loader2 } from 'lucide-react';
import { exportarBackupDadosLGPD, excluirContaUsuarioLGPD } from '../../services/perfilService';
import type { UsuarioEmCadastro, DadosPerfilUsuario } from '../../types';

interface ModalExcluirContaProps {
  aberto: boolean;
  usuario?: UsuarioEmCadastro;
  perfil?: DadosPerfilUsuario | null;
  onFechar: () => void;
}

export const ModalExcluirConta: React.FC<ModalExcluirContaProps> = ({
  aberto,
  usuario,
  perfil,
  onFechar,
}) => {
  const [palavraConfirmacao, setPalavraConfirmacao] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [backupBaixado, setBackupBaixado] = useState(false);

  if (!aberto) return null;

  const confirmacaoValida = palavraConfirmacao.trim().toLowerCase() === 'excluir';

  const handleBaixarBackup = () => {
    exportarBackupDadosLGPD(usuario, perfil);
    setBackupBaixado(true);
  };

  const handleExcluirDefinitivamente = async () => {
    if (!confirmacaoValida) return;
    try {
      setExcluindo(true);
      await excluirContaUsuarioLGPD(usuario?.id || '');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      setExcluindo(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-excluir"
    >
      <div 
        className="w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 id="titulo-modal-excluir" className="text-base font-bold text-rose-950">
              Excluir Conta Definitivamente
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="w-9 h-9 rounded-full hover:bg-rose-100/50 flex items-center justify-center text-rose-400 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed space-y-1.5">
            <p className="font-bold">⚠️ Esta ação é permanente e irreversível.</p>
            <p>
              Todos os seus registros de jejum, histórico de bioimpedância, diário de bordo, medalhas conquistadas e dados de cadastro serão permanentemente apagados dos nossos servidores.
            </p>
          </div>

          {/* Aviso Legal LGPD e Botão de Backup */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#0B2246] block">
                  Lei Geral de Proteção de Dados (LGPD)
                </span>
                <p className="text-[11px] text-slate-500">
                  Você tem o direito de obter uma cópia integral de todos os seus dados pessoais antes de excluir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBaixarBackup}
              className={`w-full min-h-[44px] px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
                backupBaixado 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-white border-slate-300 hover:bg-slate-100 text-[#0B2246]'
              }`}
            >
              <Download className="w-4 h-4 text-[#00C975]" />
              {backupBaixado ? '✓ Cópia de Backup Baixada (.json)' : 'Baixar Cópia dos Meus Dados (.json)'}
            </button>
          </div>

          {/* Campo de Confirmação com Digitação Obrigatória */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 block">
              Para confirmar, digite a palavra <span className="text-rose-600 font-extrabold select-all">Excluir</span> abaixo:
            </label>
            <input
              type="text"
              value={palavraConfirmacao}
              onChange={(e) => setPalavraConfirmacao(e.target.value)}
              placeholder="Digite Excluir"
              className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm text-[#0B2246] font-semibold outline-hidden transition-all bg-slate-50/50"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={excluindo}
              className="flex-1 min-h-[48px] px-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExcluirDefinitivamente}
              disabled={!confirmacaoValida || excluindo}
              className="flex-1 min-h-[48px] px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {excluindo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Minha Conta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
