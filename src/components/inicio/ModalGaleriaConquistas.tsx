/**
 * @file ModalGaleriaConquistas.tsx
 * @description Modal em Tela Cheia (Full Screen) exibindo a galeria completa de conquistas do aplicativo.
 * Design responsivo e limpo (fiel às solicitações do usuário):
 * - Ocupa 100% da tela (tela cheia).
 * - Cabeçalho fixo no topo com contagem de emblemas acumulados e filtros de categoria.
 * - Conteúdo central com rolagem fluida exibindo os blocos de missões.
 * - Rodapé fixo na parte inferior com o botão "Concluído".
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Star
} from 'lucide-react';
import type { ConquistaUsuario } from '../../types';

interface ModalGaleriaConquistasProps {
  aberto: boolean;
  conquistas: ConquistaUsuario[];
  onFechar: () => void;
  onSelecionarConquista: (conquista: ConquistaUsuario) => void;
}

export const ModalGaleriaConquistas: React.FC<ModalGaleriaConquistasProps> = ({
  aberto,
  conquistas,
  onFechar,
  onSelecionarConquista,
}) => {
  const [filtro, setFiltro] = useState<string>('todas');

  // Agrupamento de conquistas por Bloco/Missão (executado incondicionalmente para cumprir as regras do React)
  const blocosAgrupados = useMemo(() => {
    if (!conquistas || conquistas.length === 0) return [];
    const mapa = new Map<string, ConquistaUsuario[]>();

    conquistas.forEach((item) => {
      // Filtro por categoria ou todas
      if (filtro !== 'todas') {
        if (filtro === 'jejum' && item.categoria !== 'jejum' && item.categoria !== 'streak') return;
        if (filtro === 'agua' && item.categoria !== 'agua') return;
        if (filtro === 'peso' && item.categoria !== 'peso') return;
        if (filtro === 'bioimpedancia' && item.categoria !== 'bioimpedancia') return;
        if (filtro === 'aventureiro' && item.categoria !== 'aventureiro') return;
        if (filtro === 'desafio' && item.categoria !== 'desafio') return;
      }

      const nomeBloco = item.blocoNome || 'Outras Conquistas';
      if (!mapa.has(nomeBloco)) {
        mapa.set(nomeBloco, []);
      }
      mapa.get(nomeBloco)!.push(item);
    });

    return Array.from(mapa.entries());
  }, [conquistas, filtro]);

  if (!aberto) return null;

  // Emblemas acumulados/desbloqueados
  const totalDesbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

  // Estilização do Badge Hexagonal / Escudo
  const renderBadgeVisual = (item: ConquistaUsuario) => {
    const ehHexagonal = item.estiloBadge === 'hexagonal';
    const clipStyle = ehHexagonal
      ? { clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }
      : { clipPath: 'polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%)' };

    let corFundo = 'bg-slate-200/80 border-slate-300 text-slate-500';
    if (item.desbloqueada) {
      if (item.corTema === 'dourado') corFundo = 'bg-gradient-to-b from-amber-400 to-amber-500 border-amber-200 text-white shadow-amber-200';
      else if (item.corTema === 'azul') corFundo = 'bg-gradient-to-b from-blue-400 to-blue-500 border-blue-200 text-white shadow-blue-200';
      else if (item.corTema === 'esmeralda' || item.corTema === 'verde') corFundo = 'bg-gradient-to-b from-emerald-400 to-emerald-500 border-emerald-200 text-white shadow-emerald-200';
      else corFundo = 'bg-gradient-to-b from-indigo-500 to-purple-600 border-indigo-200 text-white shadow-indigo-200';
    }

    return (
      <div
        className={`w-14 h-14 rounded-xl ${corFundo} border-2 flex flex-col items-center justify-center relative transition-transform group-hover:scale-105 ${
          !item.desbloqueada ? 'opacity-65 grayscale' : 'shadow-sm'
        }`}
        style={clipStyle}
      >
        <span className="text-xs font-black tracking-tight drop-shadow-2xs">
          {item.rotuloBadge || item.progressoTotal}
        </span>
        <div className="flex items-center gap-0.5 mt-0.5">
          <Star className="w-2 h-2 fill-current opacity-90" />
          <Star className="w-2.5 h-2.5 fill-current" />
          <Star className="w-2 h-2 fill-current opacity-90" />
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 w-full h-full bg-[#F5F8FC] flex flex-col select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-galeria-conquistas"
    >
      {/* ==================== 1. Cabeçalho Fixo no Topo ==================== */}
      <div className="shrink-0 bg-[#F5F8FC] border-b border-slate-200/80 px-4 pt-4 pb-3 shadow-2xs z-20">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between">
          <div>
            <h2 id="titulo-galeria-conquistas" className="text-2xl font-black text-[#0B2246] tracking-tight">
              Conquistas
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              <span className="text-indigo-600 font-extrabold">{totalDesbloqueadas}</span> emblemas acumulados
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar galeria"
            className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-600 hover:bg-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer min-w-[40px] min-h-[40px]"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Filtros Rápidos de Categoria */}
        <div className="max-w-xl mx-auto w-full flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'jejum', label: 'Jejum & Streaks' },
            { id: 'agua', label: 'Água' },
            { id: 'peso', label: 'Peso' },
            { id: 'bioimpedancia', label: 'Bioimpedância' },
            { id: 'aventureiro', label: 'Aventureiro' },
            { id: 'desafio', label: 'Desafios' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFiltro(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
                filtro === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 2. Conteúdo Rólavel Central ==================== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-xl mx-auto w-full">
        {blocosAgrupados.map(([nomeBloco, itensBloco]) => {
          const desbBloco = itensBloco.filter((b) => b.desbloqueada).length;

          return (
            <div 
              key={nomeBloco}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3"
            >
              {/* Título do Bloco e Contador (ex: "Missão Iniciante  2/12") */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-black text-[#0B2246] tracking-tight">
                  {nomeBloco}
                </h3>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100/60">
                  {desbBloco}/{itensBloco.length}
                </span>
              </div>

              {/* Grid Responsiva com Emblemas */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                {itensBloco.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelecionarConquista(item)}
                    role="button"
                    tabIndex={0}
                    className="group p-2 rounded-2xl hover:bg-slate-50 transition-all flex flex-col items-center text-center cursor-pointer active:scale-95"
                  >
                    {/* Badge Visual Hexagonal ou Escudo */}
                    {renderBadgeVisual(item)}

                    {/* Nome Curto do Badge abaixo do Ícone */}
                    <span className={`text-[11px] font-black leading-tight line-clamp-2 mt-1.5 ${
                      item.desbloqueada ? 'text-[#0B2246]' : 'text-slate-400'
                    }`}>
                      {item.titulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== 3. Rodapé Fixo com Botão "Concluído" ==================== */}
      <div className="shrink-0 bg-[#F5F8FC] border-t border-slate-200/80 p-4 z-20 shadow-lg">
        <div className="max-w-xl mx-auto w-full">
          <button
            type="button"
            onClick={onFechar}
            className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-base font-black rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center cursor-pointer min-h-[50px]"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
