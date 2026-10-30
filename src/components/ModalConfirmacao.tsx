/**
 * @file ModalConfirmacao.tsx
 * @description Modal profissional de confirmação com design semântico e touch targets ergonômicos (>= 48px).
 * Utilizado para ações críticas como excluir cadastro, descartar dados ou confirmar alterações.
 */

import React from 'react';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';

interface ModalConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: 'perigo' | 'aviso' | 'sucesso';
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'perigo',
  carregando = false,
  onConfirmar,
  onCancelar,
}) => {
  if (!aberto) return null;

  // Definição semântica de cores e ícones conforme a diretriz de design
  const coresIcone = {
    perigo: 'bg-rose-50 text-rose-600 border-rose-100',
    aviso: 'bg-amber-50 text-amber-600 border-amber-100',
    sucesso: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  }[variante];

  const coresBotao = {
    perigo: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25',
    aviso: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25',
    sucesso: 'bg-[#00C975] hover:bg-[#00B167] text-white shadow-emerald-500/25',
  }[variante];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone de Destaque Semântico */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-4 ${coresIcone}`}>
          {variante === 'perigo' && <Trash2 className="w-7 h-7" strokeWidth={1.8} />}
          {variante === 'aviso' && <AlertTriangle className="w-7 h-7" strokeWidth={1.8} />}
          {variante === 'sucesso' && <Check className="w-7 h-7" strokeWidth={1.8} />}
        </div>

        {/* Título e Mensagem Humanizada */}
        <h3 id="modal-titulo" className="text-lg font-bold text-slate-900 tracking-tight mb-2">
          {titulo}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 px-1">
          {mensagem}
        </p>

        {/* Ações em 2 Botões com Zonas de Toque Mínimas (>= 48px) */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            className="w-full sm:flex-1 h-12 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center min-h-[48px] disabled:opacity-50"
          >
            {textoCancelar}
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            className={`w-full sm:flex-1 h-12 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50 ${coresBotao}`}
          >
            {carregando ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>{carregando ? 'Processando...' : textoConfirmar}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
