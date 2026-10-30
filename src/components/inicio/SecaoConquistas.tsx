/**
 * @file SecaoConquistas.tsx
 * @description Seção compacta de conquistas e medalhas na tela inicial do aplicativo.
 * Exibe os badges em destaque no formato hexagonal/escudo.
 * - Clicar no card de um emblema individual dispara o Modal de Detalhe de Conquista Única.
 * - Clicar no atalho "Ver todas" abre a Galeria Completa por Missões.
 */

import React from 'react';
import { 
  Trophy, 
  ChevronRight, 
  Star, 
  Check, 
  Lock 
} from 'lucide-react';
import type { ConquistaUsuario } from '../../types';

interface SecaoConquistasProps {
  conquistas: ConquistaUsuario[];
  onAbrirGaleria: () => void;
  onSelecionarConquista?: (conquista: ConquistaUsuario) => void;
}

export const SecaoConquistas: React.FC<SecaoConquistasProps> = ({
  conquistas,
  onAbrirGaleria,
  onSelecionarConquista,
}) => {
  // Quantidade de conquistas desbloqueadas
  const totalDesbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

  // Seleciona as 3 conquistas prioritárias para exibição em destaque no feed
  const conquistasDestaque = conquistas.slice(0, 3);

  // Estilização do Badge Visual
  const renderBadgeVisual = (item: ConquistaUsuario) => {
    const ehHexagonal = item.estiloBadge === 'hexagonal';
    const clipStyle = ehHexagonal
      ? { clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }
      : { clipPath: 'polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%)' };

    let corFundo = 'bg-slate-200/80 border-slate-300 text-slate-500';
    if (item.desbloqueada) {
      if (item.corTema === 'dourado') corFundo = 'bg-gradient-to-b from-amber-400 to-amber-500 border-amber-200 text-white';
      else if (item.corTema === 'azul') corFundo = 'bg-gradient-to-b from-blue-400 to-blue-500 border-blue-200 text-white';
      else if (item.corTema === 'esmeralda' || item.corTema === 'verde') corFundo = 'bg-gradient-to-b from-emerald-400 to-emerald-500 border-emerald-200 text-white';
      else corFundo = 'bg-gradient-to-b from-indigo-500 to-purple-600 border-indigo-200 text-white';
    }

    return (
      <div
        className={`w-11 h-11 rounded-xl ${corFundo} border-2 flex flex-col items-center justify-center relative mb-1 ${
          !item.desbloqueada ? 'opacity-65 grayscale' : 'shadow-xs'
        }`}
        style={clipStyle}
      >
        <span className="text-[10px] font-black tracking-tight drop-shadow-2xs">
          {item.rotuloBadge || item.progressoTotal}
        </span>
        <div className="flex items-center gap-0.5">
          <Star className="w-1.5 h-1.5 fill-current" />
          <Star className="w-1.5 h-1.5 fill-current" />
        </div>
      </div>
    );
  };

  return (
    <section 
      className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3 select-none"
      data-purpose="achievements-section"
    >
      {/* ==================== Cabeçalho da Seção ==================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
            <Trophy className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-[19px] sm:text-[20px] font-extrabold text-[#092244]">
            Conquistas
          </h3>
          <span className="text-[11px] font-black text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
            {totalDesbloqueadas}/{conquistas.length}
          </span>
        </div>

        {/* Botão de Ação: Ver todas */}
        <button
          type="button"
          onClick={onAbrirGaleria}
          className="min-h-[44px] px-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
          aria-label="Ver todas as conquistas"
        >
          <span>Ver todas</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ==================== Grid de Badges em Destaque ==================== */}
      <div className="grid grid-cols-3 gap-1.5">
        {conquistasDestaque.map((conquista) => {
          const porcentagem = Math.min(
            100,
            Math.round((conquista.progressoAtual / conquista.progressoTotal) * 100)
          );

          return (
            <div
              key={conquista.id}
              onClick={() => {
                if (onSelecionarConquista) {
                  onSelecionarConquista(conquista);
                } else {
                  onAbrirGaleria();
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelecionarConquista) onSelecionarConquista(conquista);
                  else onAbrirGaleria();
                }
              }}
              className={`p-2 rounded-2xl border transition-all flex flex-col items-center text-center justify-between min-h-[120px] cursor-pointer active:scale-95 ${
                conquista.desbloqueada
                  ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FFF8ED] border-amber-200/80 shadow-2xs'
                  : 'bg-[#F9FAFB] border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Badge Visual */}
              {renderBadgeVisual(conquista)}

              {/* Título visível */}
              <span className="text-[11px] font-black text-[#092244] line-clamp-2 leading-tight text-center my-0.5 break-words max-w-full">
                {conquista.titulo}
              </span>

              {/* Status ou barra de progresso */}
              {conquista.desbloqueada ? (
                <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black text-[#00C975] bg-[#E8FAF3] px-1.5 py-0.5 rounded-full">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  Ganha
                </span>
              ) : (
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[9.5px] font-bold text-gray-400">
                    <Lock className="w-2 h-2" />
                    <span>{conquista.progressoAtual}/{conquista.progressoTotal}</span>
                  </div>
                  <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full" 
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
