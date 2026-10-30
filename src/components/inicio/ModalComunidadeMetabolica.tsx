/**
 * @file ModalComunidadeMetabolica.tsx
 * @description Modal de Prova Social e Validação da Tribo (Comunidade Metabólica Silenciosa).
 * Demonstra ao usuário a sincronicidade de milhares de pessoas jejuando juntas no mundo,
 * reforçando a constância e eliminando a sensação de isolamento biológico.
 */

import React from 'react';
import { X, Users, Flame, Globe, Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';
import { vibrarClique } from '../../utils/haptics';

interface ModalComunidadeMetabolicaProps {
  /** Se o modal está aberto */
  aberto: boolean;
  /** Quantidade aproximada de pessoas ativas no mesmo estágio */
  pessoasAtivas: number;
  /** Texto descritivo da fase atual (ex: "em Cetose", "em Autofagia", etc.) */
  faseTexto: string;
  /** Callback para fechar o modal */
  onFechar: () => void;
}

export const ModalComunidadeMetabolica: React.FC<ModalComunidadeMetabolicaProps> = ({
  aberto,
  pessoasAtivas,
  faseTexto,
  onFechar,
}) => {
  if (!aberto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-comunidade"
    >
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow decorativo suave */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={() => {
            vibrarClique();
            onFechar();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition-all cursor-pointer z-10"
          aria-label="Fechar modal de comunidade"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone Central da Comunidade com badge Ao Vivo */}
        <div className="relative mt-2 mb-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <Users className="w-8 h-8 stroke-[2.2]" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
          </span>
        </div>

        {/* Badge de Prova Social */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-black uppercase tracking-wider mb-2">
          <Globe className="w-3.5 h-3.5" />
          <span>Comunidade Silenciosa</span>
        </div>

        <h2 
          id="titulo-comunidade"
          className="text-2xl font-black text-[#092244] tracking-tight leading-tight"
        >
          Você nunca jejua sozinho
        </h2>

        {/* Contador em Destaque */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 border border-slate-200/70 w-full text-center">
          <span className="text-3xl font-black text-emerald-600 block tracking-tight">
            {pessoasAtivas.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs font-bold text-slate-600 mt-1 block">
            pessoas sincronizadas {faseTexto} neste exato momento
          </span>
        </div>

        {/* Mensagem Psicológica de Pertencimento e Força Coletiva */}
        <div className="text-left space-y-2.5 text-xs text-slate-600 leading-relaxed mb-5">
          <div className="flex items-start gap-2.5">
            <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              O desconforto transitório da fome é um processo fisiológico compartilhado por milhares de mentes focadas agora.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Ao manter seu jejum ativo, você alimenta a energia e a disciplina de toda a comunidade que avança com você.
            </p>
          </div>
        </div>

        {/* Botão de Fechar com Foco */}
        <button
          type="button"
          onClick={() => {
            vibrarClique();
            onFechar();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#00C975] hover:bg-[#00B568] active:scale-95 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer min-h-[46px] flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          <span>Permanecer focado junto</span>
        </button>
      </div>
    </div>
  );
};
