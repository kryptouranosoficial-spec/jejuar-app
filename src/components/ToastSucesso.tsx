/**
 * @file ToastSucesso.tsx
 * @description Toast de notificação flutuante com feedback de vitória,
 * persistência no Firestore e abertura da janela de alimentação.
 * Desenvolvido para ficar na Safe Area superior com alta visibilidade e touch target acessível.
 */

import React, { useEffect } from 'react';
import { CheckCircle2, Sparkles, X, Flame } from 'lucide-react';

interface ToastSucessoProps {
  /** Se o toast está visível */
  visivel: boolean;
  /** Título principal da notificação */
  titulo: string;
  /** Mensagem complementar explicativa */
  mensagem: string;
  /** Sequência de dias atualizada para destaque */
  diasConsecutivos?: number;
  /** Callback para fechar a notificação */
  onFechar: () => void;
  /** Tempo de auto-fechamento em milissegundos (padrão: 4500ms) */
  tempoDuracaoMs?: number;
}

export const ToastSucesso: React.FC<ToastSucessoProps> = ({
  visivel,
  titulo,
  mensagem,
  diasConsecutivos,
  onFechar,
  tempoDuracaoMs = 4500,
}) => {
  useEffect(() => {
    if (!visivel) return;
    const timer = setTimeout(() => {
      onFechar();
    }, tempoDuracaoMs);
    return () => clearTimeout(timer);
  }, [visivel, tempoDuracaoMs, onFechar]);

  if (!visivel) return null;

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
      role="status"
      aria-live="polite"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-emerald-100 flex items-start gap-3 relative overflow-hidden">
        {/* Barra lateral de cor semântica esmeralda */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00C975]" />

        {/* Ícone comemorativo com badge suave */}
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00874E] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
        </div>

        {/* Textos Informativos */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-[14px] font-extrabold text-[#092244] leading-snug">
              {titulo}
            </h4>
            {diasConsecutivos && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                Dia {diasConsecutivos}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {mensagem}
          </p>
        </div>

        {/* Botão de Fechar Acessível (44x44px touch target) */}
        <button
          type="button"
          onClick={onFechar}
          className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-95 transition-all cursor-pointer rounded-full"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
