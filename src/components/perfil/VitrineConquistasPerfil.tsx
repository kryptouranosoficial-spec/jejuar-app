/**
 * @file VitrineConquistasPerfil.tsx
 * @description Vitrine das principais conquistas e medalhas do usuário exibidas no perfil.
 * Mostra os 3 troféus mais destacados em cards hexagonais/escudos.
 * - Clicar no card do emblema abre o Modal de Detalhe Exclusivo daquela conquista.
 * - Clicar em "Ver todas" abre o Modal da Galeria Completa por Missões.
 */

import React from 'react';
import { Trophy, ChevronRight, Star, Flame, Droplets, Award, Shield, Scale } from 'lucide-react';
import type { ConquistaUsuario } from '../../types';

interface VitrineConquistasPerfilProps {
  conquistas: ConquistaUsuario[];
  onAbrirGaleriaCompleta: () => void;
  onSelecionarConquista: (conquista: ConquistaUsuario) => void;
}

export const VitrineConquistasPerfil: React.FC<VitrineConquistasPerfilProps> = ({
  conquistas,
  onAbrirGaleriaCompleta,
  onSelecionarConquista,
}) => {
  // Prioriza conquistas desbloqueadas recentemente ou as 3 primeiras
  const topConquistas = React.useMemo(() => {
    const desbloqueadas = conquistas.filter(c => c.desbloqueada);
    const pendentes = conquistas.filter(c => !c.desbloqueada);
    return [...desbloqueadas, ...pendentes].slice(0, 3);
  }, [conquistas]);

  // Estilização do Badge
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
        className={`w-12 h-12 rounded-xl ${corFundo} border-2 flex flex-col items-center justify-center relative mb-1.5 ${
          !item.desbloqueada ? 'opacity-60 grayscale' : 'shadow-xs'
        }`}
        style={clipStyle}
      >
        <span className="text-[11px] font-black tracking-tight drop-shadow-2xs">
          {item.rotuloBadge || item.progressoTotal}
        </span>
        <div className="flex items-center gap-0.5">
          <Star className="w-1.5 h-1.5 fill-current" />
          <Star className="w-2 h-2 fill-current" />
          <Star className="w-1.5 h-1.5 fill-current" />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3">
      {/* Cabeçalho da Seção com Link "Ver todas" */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-[#0B2246] uppercase tracking-wider">
            Vitrine de Conquistas
          </h3>
        </div>

        <button
          type="button"
          onClick={onAbrirGaleriaCompleta}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <span>Ver todas</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid com 3 Medalhas em Destaque */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {topConquistas.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelecionarConquista(item)}
            role="button"
            tabIndex={0}
            className={`p-2.5 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition-all active:scale-95 hover:bg-slate-50/80 ${
              item.desbloqueada
                ? 'bg-gradient-to-b from-amber-50/40 to-white border-amber-200/80 shadow-2xs'
                : 'bg-slate-50/80 border-slate-200/80'
            }`}
          >
            {renderBadgeVisual(item)}

            <span className={`text-[11px] font-black line-clamp-1 leading-tight ${
              item.desbloqueada ? 'text-[#0B2246]' : 'text-slate-500'
            }`}>
              {item.titulo}
            </span>

            <span className="text-[9px] font-bold text-slate-400 line-clamp-1 mt-0.5">
              {item.desbloqueada ? 'Conquistado' : `${item.progressoAtual}/${item.progressoTotal}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
