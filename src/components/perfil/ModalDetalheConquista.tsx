/**
 * @file ModalDetalheConquista.tsx
 * @description Modal de destaque e exibição individual de uma conquista/medalha.
 * Focado exclusivamente na conquista selecionada (fiel ao design da Imagem 5):
 * - Badge em destaque com raio/brilho celebrativo e laurel leaves/estrelas.
 * - Título, descrição humanizada e barra de progresso reativa.
 * - Botão de Compartilhar via Web Share API nativa do dispositivo ou Cópia de Texto.
 */

import React, { useState } from 'react';
import { X, Share2, Check, Lock, Sparkles, Award, Droplets, Flame, Star, Trophy, Shield, Activity, Scale, HeartPulse } from 'lucide-react';
import type { ConquistaUsuario } from '../../types';

interface ModalDetalheConquistaProps {
  conquista: ConquistaUsuario | null;
  onFechar: () => void;
}

export const ModalDetalheConquista: React.FC<ModalDetalheConquistaProps> = ({
  conquista,
  onFechar,
}) => {
  const [copiado, setCopiado] = useState(false);

  if (!conquista) return null;

  const porcentagem = Math.min(
    100,
    Math.round((conquista.progressoAtual / conquista.progressoTotal) * 100)
  );

  // Ação de Compartilhamento Nativo com Fallback para Cópia
  const handleCompartilhar = async () => {
    const textoCompartilhamento = `🏆 Alcancei a conquista "${conquista.titulo}" no app Jejuar!\n"${conquista.descricao}"\n\nJunte-se a mim na jornada de saúde e longevidade! 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Conquista: ${conquista.titulo}`,
          text: textoCompartilhamento,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Usuário pode ter cancelado a janela nativa de compartilhamento
        console.warn('Compartilhamento nativo não concluído:', err);
      }
    }

    // Fallback: Copiar para a área de transferência
    try {
      await navigator.clipboard.writeText(textoCompartilhamento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Ignora erro de cópia em navegadores restritos
    }
  };

  // Cores do tema do Badge
  const getCoresTema = () => {
    if (!conquista.desbloqueada) {
      return {
        bgGradient: 'from-slate-100 to-slate-200',
        badgeBg: 'bg-slate-200/80',
        badgeBorder: 'border-slate-300',
        textoBadge: 'text-slate-500',
        barFill: 'bg-slate-400',
        glow: 'from-slate-200/30 to-transparent',
      };
    }

    switch (conquista.corTema) {
      case 'dourado':
        return {
          bgGradient: 'from-amber-400 via-amber-500 to-amber-600',
          badgeBg: 'bg-gradient-to-b from-amber-400 to-amber-600',
          badgeBorder: 'border-amber-200',
          textoBadge: 'text-white',
          barFill: 'bg-amber-500',
          glow: 'from-amber-300/40 via-amber-100/30 to-transparent',
        };
      case 'azul':
        return {
          bgGradient: 'from-blue-400 via-blue-500 to-blue-600',
          badgeBg: 'bg-gradient-to-b from-blue-400 to-blue-600',
          badgeBorder: 'border-blue-200',
          textoBadge: 'text-white',
          barFill: 'bg-blue-500',
          glow: 'from-blue-300/40 via-blue-100/30 to-transparent',
        };
      case 'esmeralda':
      case 'verde':
        return {
          bgGradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
          badgeBg: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
          badgeBorder: 'border-emerald-200',
          textoBadge: 'text-white',
          barFill: 'bg-emerald-500',
          glow: 'from-emerald-300/40 via-emerald-100/30 to-transparent',
        };
      case 'roxo':
      default:
        return {
          bgGradient: 'from-indigo-500 via-purple-500 to-indigo-600',
          badgeBg: 'bg-gradient-to-b from-indigo-500 to-purple-600',
          badgeBorder: 'border-indigo-200',
          textoBadge: 'text-white',
          barFill: 'bg-indigo-600',
          glow: 'from-indigo-300/40 via-purple-100/30 to-transparent',
        };
    }
  };

  const cores = getCoresTema();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 select-none animate-in fade-in"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-detalhe-conquista"
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col items-center text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar Topo Direito */}
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer z-10"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Halo / Brilho Radiante de Fundo */}
        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-radial ${cores.glow} rounded-full blur-2xl pointer-events-none opacity-80`} />

        {/* Efeito de Confete / Partículas */}
        {conquista.desbloqueada && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            <Sparkles className="absolute top-6 left-8 w-4 h-4 text-amber-400 animate-bounce" />
            <Sparkles className="absolute top-10 right-10 w-5 h-5 text-indigo-400 animate-pulse" />
            <Sparkles className="absolute bottom-20 left-10 w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
        )}

        {/* Badge Principal Grande Emulando o Estilo Hexagonal / Escudo das Referências */}
        <div className="relative mt-2 mb-4 flex flex-col items-center justify-center">
          {/* Formato do Badge Hexagonal ou Escudo */}
          <div
            className={`w-28 h-28 rounded-[28px] ${cores.badgeBg} border-4 ${cores.badgeBorder} shadow-lg flex flex-col items-center justify-center relative transition-transform duration-300 hover:scale-105 ${
              !conquista.desbloqueada ? 'grayscale opacity-70' : 'ring-4 ring-white/60'
            }`}
            style={{
              clipPath: conquista.estiloBadge === 'escudo'
                ? 'polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%)'
                : 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
            }}
          >
            {/* Rótulo Numérico ou Texto do Badge */}
            <span className={`text-2xl font-black tracking-tight ${cores.textoBadge} drop-shadow-sm`}>
              {conquista.rotuloBadge || conquista.progressoTotal}
            </span>

            {/* Ícone de Estrelas ou Laurels em Miniatura no Topo do Badge */}
            <div className="flex items-center justify-center gap-0.5 mt-0.5">
              <Star className="w-3 h-3 text-white/90 fill-white" />
              <Star className="w-3.5 h-3.5 text-white fill-white" />
              <Star className="w-3 h-3 text-white/90 fill-white" />
            </div>
          </div>

          {/* Selo de Status (Check em Esmeralda ou Cadeado em Cinza) */}
          <div className={`absolute -bottom-2 px-3 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md border ${
            conquista.desbloqueada
              ? 'bg-emerald-500 text-white border-emerald-300'
              : 'bg-slate-200 text-slate-600 border-slate-300'
          }`}>
            {conquista.desbloqueada ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>CONQUISTADO</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                <span>EM ANDAMENTO</span>
              </>
            )}
          </div>
        </div>

        {/* Título Principal da Conquista */}
        <h3 id="titulo-modal-detalhe-conquista" className="text-xl font-black text-[#0B2246] tracking-tight mt-1 mb-1">
          {conquista.titulo}
        </h3>

        {/* Subtítulo / Descrição Motivacional */}
        <p className="text-xs font-semibold text-slate-500 max-w-[260px] leading-relaxed mb-5">
          {conquista.descricao}
        </p>

        {/* Barra de Progresso com Números no Formato do App */}
        <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#0B2246]">
            <span>{conquista.progressoAtual}</span>
            <span>{conquista.progressoTotal}</span>
          </div>

          <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${cores.barFill}`}
              style={{ width: `${porcentagem}%` }}
            />
          </div>

          <div className="text-[10px] font-bold text-slate-400 text-center">
            {conquista.desbloqueada
              ? `Meta atingida com sucesso! 🎉`
              : `Faltam ${Math.max(0, conquista.progressoTotal - conquista.progressoAtual)} para desbloquear`}
          </div>
        </div>

        {/* Botão de Ação Principal: Compartilhar */}
        <button
          type="button"
          onClick={handleCompartilhar}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-black rounded-2xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
        >
          <Share2 className="w-4 h-4 stroke-[2.5]" />
          <span>{copiado ? 'Texto Copiado! ✨' : 'Compartilhar'}</span>
        </button>

        {/* Botão Secundário Fechar */}
        <button
          type="button"
          onClick={onFechar}
          className="w-full h-10 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
