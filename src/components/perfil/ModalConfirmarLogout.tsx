/**
 * @file ModalConfirmarLogout.tsx
 * @description Modal de confirmação de saída (Logout) com prevenção de encerramento acidental.
 * Interface com 2 botões de ação e linguagem clara em Português do Brasil.
 */

import React from 'react';
import { LogOut, X } from 'lucide-react';

interface ModalConfirmarLogoutProps {
  aberto: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ModalConfirmarLogout: React.FC<ModalConfirmarLogoutProps> = ({
  aberto,
  onConfirmar,
  onCancelar,
}) => {
  if (!aberto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-logout"
    >
      <div 
        className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
          <LogOut className="w-6 h-6 ml-0.5" />
        </div>

        <div className="space-y-1.5">
          <h3 id="titulo-modal-logout" className="text-lg font-bold text-[#0B2246]">
            Deseja sair da sua conta?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Seus dados, metas e sequência de dias continuam seguros. Você poderá entrar novamente a qualquer momento com seu e-mail e senha.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 min-h-[48px] px-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          >
            Continuar no app
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="flex-1 min-h-[48px] px-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Sim, sair
          </button>
        </div>
      </div>
    </div>
  );
};
