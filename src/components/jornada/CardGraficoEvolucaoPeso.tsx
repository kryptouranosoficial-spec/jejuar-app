/**
 * @file CardGraficoEvolucaoPeso.tsx
 * @description Card gráfico de evolução do peso do usuário com seletor de período (Dia, Semana, Mês).
 * Baseado estritamente na imagem de referência fornecida pelo usuário:
 * - Título: "Peso" com seta de navegação.
 * - Subtítulo: "Atual: 72.3 kg" e indicação pontilhada "--- Meta: 66.0 kg".
 * - Seletor em pílula: Dia | Semana | Mês.
 * - Gráfico de área e linha vetorial SVG suave com mira pontilhada e badge de valor verde.
 * - Eixos Y e X graduados e dinamicamente calibrados com os dados do usuário.
 */

import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';

export type PeriodoGraficoPeso = 'dia' | 'semana' | 'mes';

interface PontoPesoGrafico {
  dataStr: string;
  rotuloData: string;
  peso: number;
}

interface CardGraficoEvolucaoPesoProps {
  pesoAtual?: number;
  pesoMeta?: number;
  onAbrirRegistroPeso?: () => void;
}

export const CardGraficoEvolucaoPeso: React.FC<CardGraficoEvolucaoPesoProps> = ({
  pesoAtual = 72.3,
  pesoMeta = 66.0,
  onAbrirRegistroPeso,
}) => {
  const [periodo, setPeriodo] = useState<PeriodoGraficoPeso>('dia');
  const [indicePontoAtivo, setIndicePontoAtivo] = useState<number>(4); // Ponto destacado

  // Gera a lista de pontos baseada no período selecionado
  const pontos = useMemo<PontoPesoGrafico[]>(() => {
    const hoje = new Date();
    const lista: PontoPesoGrafico[] = [];
    const quantidade = 7;

    for (let i = quantidade - 1; i >= 0; i--) {
      const d = new Date(hoje);
      if (periodo === 'dia') {
        d.setDate(hoje.getDate() - i);
      } else if (periodo === 'semana') {
        d.setDate(hoje.getDate() - i * 7);
      } else {
        d.setMonth(hoje.getMonth() - i);
      }

      const diaFormatado = String(d.getDate()).padStart(2, '0');
      const mesFormatado = String(d.getMonth() + 1).padStart(2, '0');
      const rotuloData = `${diaFormatado}/${mesFormatado}`;

      // Variação suave de peso simulando progresso
      // Mantém coerência exata com a imagem de referência (ex: ~72.3 kg)
      let pesoValor = pesoAtual;
      if (periodo === 'dia') {
        const deltas = [0.1, 0.1, 0.1, 0.1, 0.0, 0.0, 0.0];
        pesoValor = Math.round((pesoAtual + (deltas[i] || 0)) * 10) / 10;
      } else if (periodo === 'semana') {
        pesoValor = Math.round((pesoAtual + i * 0.4) * 10) / 10;
      } else {
        pesoValor = Math.round((pesoAtual + i * 1.2) * 10) / 10;
      }

      lista.push({
        dataStr: d.toISOString().slice(0, 10),
        rotuloData,
        peso: pesoValor,
      });
    }

    return lista;
  }, [periodo, pesoAtual]);

  // Cálculos de limites do Eixo Y com margem harmônica
  const pesosArray = pontos.map(p => p.peso);
  const minPeso = Math.floor(Math.min(...pesosArray, pesoAtual) - 0.8);
  const maxPeso = Math.ceil(Math.max(...pesosArray, pesoAtual) + 1.2);

  // Gera 6 marcas no Eixo Y exatamente como na imagem
  const step = (maxPeso - minPeso) / 5;
  const marcasY = [
    maxPeso,
    Math.round((maxPeso - step) * 10) / 10,
    Math.round((maxPeso - step * 2) * 10) / 10,
    Math.round((maxPeso - step * 3) * 10) / 10,
    Math.round((maxPeso - step * 4) * 10) / 10,
    minPeso,
  ];

  // Dimensões do SVG do Gráfico
  const svgWidth = 320;
  const svgHeight = 150;
  const paddingX = 15;
  const paddingY = 15;

  // Função para converter peso e índice em coordenadas X e Y no SVG
  const getX = (index: number) => {
    return paddingX + (index / (pontos.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (peso: number) => {
    const range = maxPeso - minPeso;
    if (range <= 0) return svgHeight / 2;
    const ratio = (peso - minPeso) / range;
    return svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
  };

  // Caminho da linha contínua do gráfico
  const linePathD = useMemo(() => {
    return pontos.reduce((acc, ponto, index) => {
      const x = getX(index);
      const y = getY(ponto.peso);
      return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [pontos, minPeso, maxPeso]);

  // Caminho da área sombreada abaixo da linha
  const areaPathD = useMemo(() => {
    if (pontos.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(pontos.length - 1);
    const bottomY = svgHeight;
    return `${linePathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePathD, pontos.length]);

  const pontoAtivo = pontos[indicePontoAtivo] || pontos[pontos.length - 1];
  const posXAtivo = getX(indicePontoAtivo);
  const posYAtivo = getY(pontoAtivo.peso);

  return (
    <div className="w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4 select-none">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-[#0B2246] tracking-tight">
          Peso
        </h3>
        <button
          type="button"
          onClick={onAbrirRegistroPeso}
          aria-label="Gerenciar pesagens"
          className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Subtítulo: Atual vs Meta */}
      <div className="flex items-baseline justify-between -mt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-slate-400">Atual:</span>
          <span className="text-base font-extrabold text-[#0B2246]">
            {pesoAtual.toFixed(1)} kg
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-4 border-b-2 border-dashed border-amber-400" />
          <span>Meta: {pesoMeta.toFixed(1)} kg</span>
        </div>
      </div>

      {/* Seletor Segmentado de Período (Dia | Semana | Mês) */}
      <div className="flex items-center bg-slate-100/70 p-1 rounded-2xl">
        {(['dia', 'semana', 'mes'] as PeriodoGraficoPeso[]).map((p) => {
          const rotulo = p === 'dia' ? 'Dia' : p === 'semana' ? 'Semana' : 'Mês';
          const ativo = periodo === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                ativo 
                  ? 'bg-white text-[#0B2246] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {rotulo}
            </button>
          );
        })}
      </div>

      {/* Área do Gráfico com Eixo Y e Linha SVG */}
      <div className="relative pt-2">
        <div className="flex items-stretch gap-2">
          {/* Eixo Y */}
          <div className="flex flex-col justify-between items-end pr-1 text-[11px] font-medium text-slate-400 h-36 select-none">
            {marcasY.map((marca, i) => (
              <span key={i} className="leading-none">
                {marca.toFixed(1).replace('.', ',')}
              </span>
            ))}
          </div>

          {/* Canvas SVG Interativo */}
          <div className="flex-1 relative h-36 overflow-visible">
            {/* Linhas de Grade de Fundo Horizontais */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {marcasY.map((_, i) => (
                <div key={i} className="w-full border-b border-slate-100" />
              ))}
            </div>

            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                {/* Gradiente da Área preenchida verde */}
                <linearGradient id="degradeVerdePeso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00C975" stopOpacity="0.28" />
                  <stop offset="90%" stopColor="#00C975" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Área Sombreada */}
              <path d={areaPathD} fill="url(#degradeVerdePeso)" />

              {/* Linha Contínua do Gráfico */}
              <path
                d={linePathD}
                fill="none"
                stroke="#00C975"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Linhas de Mira Pontilhadas (Vertical e Horizontal) no Ponto Selecionado */}
              <line
                x1={posXAtivo}
                y1={0}
                x2={posXAtivo}
                y2={svgHeight}
                stroke="#00C975"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <line
                x1={0}
                y1={posYAtivo}
                x2={svgWidth}
                y2={posYAtivo}
                stroke="#00C975"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
              />

              {/* Pontos clicáveis na linha */}
              {pontos.map((ponto, index) => {
                const cx = getX(index);
                const cy = getY(ponto.peso);
                const estaAtivo = indicePontoAtivo === index;

                return (
                  <circle
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={estaAtivo ? 5 : 3.5}
                    className="cursor-pointer transition-all duration-200"
                    fill={estaAtivo ? '#00C975' : '#00C975'}
                    stroke="#ffffff"
                    strokeWidth={estaAtivo ? 2.5 : 1.5}
                    onClick={() => setIndicePontoAtivo(index)}
                  />
                );
              })}
            </svg>

            {/* Tooltip Verde Pill com Valor Exato (Igual à Imagem de Referência) */}
            <div
              className="absolute -top-3.5 z-10 transition-all duration-300 pointer-events-none"
              style={{
                left: `${(posXAtivo / svgWidth) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="px-2.5 py-1 rounded-xl bg-[#00C975] text-white text-[11px] font-black shadow-md flex items-center justify-center">
                {pontoAtivo.peso.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Eixo X com Datas */}
        <div className="flex justify-between pl-9 pr-1 pt-2">
          {pontos.map((p, index) => (
            <span
              key={p.dataStr}
              onClick={() => setIndicePontoAtivo(index)}
              className={`text-[10px] sm:text-[11px] font-medium text-center flex-1 cursor-pointer transition-colors ${
                indicePontoAtivo === index 
                  ? 'text-[#00C975] font-black' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p.rotuloData}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
