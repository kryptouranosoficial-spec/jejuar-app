/**
 * @file bioimpedancia/GraficoEvolucaoBioimpedancia.tsx
 * @description Gráfico de evolução temporal em SVG nativo responsivo para Bioimpedância.
 * Permite alternar entre Percentual de Gordura Corporal (%), Músculo Esquelético (%) e Peso (kg).
 * Oferece tooltips com toque interativo, eixos claros e suporte completo a Light/Dark mode.
 */

import React, { useState, useId } from 'react';
import type { RegistroBioimpedancia } from '../../types/bioimpedancia';
import { formatarDecimalBR, formatarDataBR } from '../../utils/bioimpedanciaUtils';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export type MetricaGrafico = 'gordura' | 'musculo' | 'peso';

interface GraficoEvolucaoBioimpedanciaProps {
  exames: RegistroBioimpedancia[];
}

export const GraficoEvolucaoBioimpedancia: React.FC<GraficoEvolucaoBioimpedanciaProps> = ({
  exames,
}) => {
  const [metricaAtiva, setMetricaAtiva] = useState<MetricaGrafico>('gordura');
  const [indicePontoAtivo, setIndicePontoAtivo] = useState<number | null>(null);
  const gradienteId = useId();

  // Ordena cronologicamente (do mais antigo para o mais recente) para desenhar o gráfico da esquerda para a direita
  const examesOrdenados = [...exames].sort((a, b) => (a.dataExame > b.dataExame ? 1 : -1));

  if (examesOrdenados.length < 2) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-slate-800">Evolução Corporal</h4>
          <span className="text-xs text-slate-400 font-medium">Aguardando mais dados</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Cadastre ao menos 2 exames periódicos para visualizar os gráficos de evolução de gordura corporal, massa muscular e peso.
        </p>
      </div>
    );
  }

  // Configuração das métricas
  const config = {
    gordura: {
      titulo: 'Gordura Corporal',
      unidade: '%',
      corTraço: '#F59E0B', // Âmbar
      corGradiente: '#FDE68A',
      obterValor: (e: RegistroBioimpedancia) => e.gorduraCorporalPercentual,
      inverterBom: true, // Reduzir gordura é bom
    },
    musculo: {
      titulo: 'Músculo Esquelético',
      unidade: '%',
      corTraço: '#00C975', // Verde esmeralda marca
      corGradiente: '#A7F3D0',
      obterValor: (e: RegistroBioimpedancia) => e.musculoEsqueleticoPercentual,
      inverterBom: false, // Aumentar músculo é bom
    },
    peso: {
      titulo: 'Peso Corporal',
      unidade: 'kg',
      corTraço: '#3B82F6', // Azul
      corGradiente: '#BFDBFE',
      obterValor: (e: RegistroBioimpedancia) => e.pesoKg,
      inverterBom: true,
    },
  }[metricaAtiva];

  const valores = examesOrdenados.map(config.obterValor);
  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);
  const deltaTotal = valores[valores.length - 1] - valores[0];

  // Dimensões do SVG do gráfico
  const svgLargura = 360;
  const svgAltura = 160;
  const paddingX = 32;
  const paddingY = 24;

  const amplitude = maxValor === minValor ? 1 : maxValor - minValor;
  const escalaX = (svgLargura - paddingX * 2) / (valores.length - 1);

  // Calcula coordenadas dos pontos (x, y)
  const pontos = valores.map((val, idx) => {
    const x = paddingX + idx * escalaX;
    // Inverte Y para que valores maiores fiquem no topo
    const y = svgAltura - paddingY - ((val - minValor) / amplitude) * (svgAltura - paddingY * 2);
    return { x, y, valor: val, exame: examesOrdenados[idx] };
  });

  // String de pontos para o polyline
  const polylineStr = pontos.map((p) => `${p.x},${p.y}`).join(' ');

  // Área preenchida com gradiente fechando na base
  const areaPath = `M ${pontos[0].x},${svgAltura - paddingY / 2} L ${polylineStr} L ${
    pontos[pontos.length - 1].x
  },${svgAltura - paddingY / 2} Z`;

  // Ponto atualmente selecionado ou o mais recente por padrão
  const pontoAtivo =
    indicePontoAtivo !== null && pontos[indicePontoAtivo]
      ? pontos[indicePontoAtivo]
      : pontos[pontos.length - 1];

  const melhorou = config.inverterBom ? deltaTotal <= 0 : deltaTotal >= 0;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs transition-all">
      {/* Seletor de Métricas com Botões de Toque Seguro */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Comparativo de Evolução
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-lg font-black text-[#0B1C30] tabular-nums">
              {formatarDecimalBR(pontoAtivo.valor, 1)}
              <span className="text-xs font-semibold text-slate-500 ml-1">{config.unidade}</span>
            </span>

            {/* Badge de Delta */}
            <div
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                melhorou ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {deltaTotal > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : deltaTotal < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>
                {deltaTotal > 0 ? '+' : ''}
                {formatarDecimalBR(deltaTotal, 1)} {config.unidade}
              </span>
            </div>
          </div>
        </div>

        {/* Data do Ponto em Foco */}
        <div className="text-right">
          <span className="text-[11px] text-slate-400 font-medium">Exame em</span>
          <p className="text-xs font-bold text-slate-700">
            {formatarDataBR(pontoAtivo.exame.dataExame)}
          </p>
        </div>
      </div>

      {/* Tabs Segmentadas das Métricas */}
      <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl mb-4 gap-1">
        <button
          type="button"
          onClick={() => {
            setMetricaAtiva('gordura');
            setIndicePontoAtivo(null);
          }}
          className={`flex-1 min-h-[44px] text-xs font-bold rounded-xl transition-all cursor-pointer ${
            metricaAtiva === 'gordura'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          % Gordura
        </button>

        <button
          type="button"
          onClick={() => {
            setMetricaAtiva('musculo');
            setIndicePontoAtivo(null);
          }}
          className={`flex-1 min-h-[44px] text-xs font-bold rounded-xl transition-all cursor-pointer ${
            metricaAtiva === 'musculo'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          % Músculo
        </button>

        <button
          type="button"
          onClick={() => {
            setMetricaAtiva('peso');
            setIndicePontoAtivo(null);
          }}
          className={`flex-1 min-h-[44px] text-xs font-bold rounded-xl transition-all cursor-pointer ${
            metricaAtiva === 'peso'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Peso (kg)
        </button>
      </div>

      {/* Área do Gráfico SVG */}
      <div className="relative w-full overflow-hidden select-none touch-pan-x">
        <svg
          viewBox={`0 0 ${svgLargura} ${svgAltura}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id={gradienteId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.corTraço} stopOpacity="0.25" />
              <stop offset="100%" stopColor={config.corTraço} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade de Fundo Sutis */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={svgLargura - paddingX}
            y2={paddingY}
            stroke="#F1F5F9"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={svgAltura / 2}
            x2={svgLargura - paddingX}
            y2={svgAltura / 2}
            stroke="#F1F5F9"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={svgAltura - paddingY}
            x2={svgLargura - paddingX}
            y2={svgAltura - paddingY}
            stroke="#E2E8F0"
            strokeWidth="1"
          />

          {/* Área com Gradiente */}
          <path d={areaPath} fill={`url(#${gradienteId})`} />

          {/* Linha de Traçado Principal */}
          <polyline
            fill="none"
            stroke={config.corTraço}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Pontos Clicáveis Interativos */}
          {pontos.map((p, idx) => {
            const ehAtivo =
              pontoAtivo.exame.id === p.exame.id ||
              (indicePontoAtivo === null && idx === pontos.length - 1);

            return (
              <g
                key={p.exame.id || idx}
                onClick={() => setIndicePontoAtivo(idx)}
                className="cursor-pointer"
              >
                {/* Hitbox expandida para toque seguro */}
                <circle cx={p.x} cy={p.y} r="16" fill="transparent" />

                {/* Halo do ponto ativo */}
                {ehAtivo && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    fill={config.corTraço}
                    opacity="0.3"
                    className="animate-pulse"
                  />
                )}

                {/* Círculo visível */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={ehAtivo ? '5' : '3.5'}
                  fill="#FFFFFF"
                  stroke={config.corTraço}
                  strokeWidth={ehAtivo ? '3' : '2'}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Eixo de Datas Inferior */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-2 mt-2">
          <span>{formatarDataBR(examesOrdenados[0].dataExame)}</span>
          <span className="text-slate-300">· · ·</span>
          <span>{formatarDataBR(examesOrdenados[examesOrdenados.length - 1].dataExame)}</span>
        </div>
      </div>
    </div>
  );
};
