/**
 * @file CardGraficoImc.tsx
 * @description Card com gráfico de tendência do IMC (Índice de Massa Corporal) ao longo do tempo.
 * Substitui imagens desenhadas por um gráfico vetorial limpo e analítico com:
 * - IMC Atual em destaque (ex: 27.2) e Badge com classificação semântica.
 * - Seletor de período: Dia | Semana | Mês.
 * - Gráfico de linha e área SVG mostrando a evolução do IMC.
 * - Faixa de fundo verde indicando a zona saudável ideal de IMC (18.5 a 24.9).
 * - Tooltip flutuante e pontos interativos.
 */

import React, { useState, useMemo } from 'react';
import { HelpCircle, TrendingDown } from 'lucide-react';

export type PeriodoGraficoImc = 'dia' | 'semana' | 'mes';

interface PontoImcGrafico {
  dataStr: string;
  rotuloData: string;
  imc: number;
}

interface CardGraficoImcProps {
  imcAtual?: number;
  alturaCm?: number;
  pesoAtualKg?: number;
  onAbrirExplicacao?: () => void;
}

export const CardGraficoImc: React.FC<CardGraficoImcProps> = ({
  imcAtual = 27.2,
  alturaCm = 165,
  pesoAtualKg = 72.3,
  onAbrirExplicacao,
}) => {
  const [periodo, setPeriodo] = useState<PeriodoGraficoImc>('dia');
  const [indicePontoAtivo, setIndicePontoAtivo] = useState<number>(6); // Último ponto por padrão
  const [modalExplicacaoAberto, setModalExplicacaoAberto] = useState(false);

  // Determina a classificação e a cor semântica baseada no IMC
  const dadosClassificacao = useMemo(() => {
    if (imcAtual < 18.5) {
      return {
        rotulo: 'Abaixo do peso',
        corTexto: 'text-sky-600',
        corBg: 'bg-sky-50',
        corBorda: 'border-sky-200',
        corLinha: '#38BDF8',
      };
    }
    if (imcAtual < 25.0) {
      return {
        rotulo: 'Peso normal',
        corTexto: 'text-emerald-700',
        corBg: 'bg-emerald-50',
        corBorda: 'border-emerald-200',
        corLinha: '#10B981',
      };
    }
    if (imcAtual < 30.0) {
      return {
        rotulo: 'Excesso de peso',
        corTexto: 'text-amber-700',
        corBg: 'bg-amber-50',
        corBorda: 'border-amber-200',
        corLinha: '#F59E0B',
      };
    }
    if (imcAtual < 35.0) {
      return {
        rotulo: 'Obesidade Grau I',
        corTexto: 'text-orange-700',
        corBg: 'bg-orange-50',
        corBorda: 'border-orange-200',
        corLinha: '#F97316',
      };
    }
    return {
      rotulo: 'Obesidade Severa',
      corTexto: 'text-rose-700',
      corBg: 'bg-rose-50',
      corBorda: 'border-rose-200',
      corLinha: '#EF4444',
    };
  }, [imcAtual]);

  // Gera os pontos do gráfico baseados no período
  const pontos = useMemo<PontoImcGrafico[]>(() => {
    const hoje = new Date();
    const lista: PontoImcGrafico[] = [];
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

      // Simulação suave de evolução do IMC
      let imcValor = imcAtual;
      if (periodo === 'dia') {
        const deltas = [0.2, 0.2, 0.1, 0.1, 0.1, 0.0, 0.0];
        imcValor = Math.round((imcAtual + (deltas[i] || 0)) * 10) / 10;
      } else if (periodo === 'semana') {
        imcValor = Math.round((imcAtual + i * 0.15) * 10) / 10;
      } else {
        imcValor = Math.round((imcAtual + i * 0.4) * 10) / 10;
      }

      lista.push({
        dataStr: d.toISOString().slice(0, 10),
        rotuloData,
        imc: imcValor,
      });
    }

    return lista;
  }, [periodo, imcAtual]);

  // Limites do Eixo Y
  const imcsArray = pontos.map(p => p.imc);
  const minImc = Math.floor(Math.min(...imcsArray, 18.5) - 1);
  const maxImc = Math.ceil(Math.max(...imcsArray, 30.0) + 1);

  const step = (maxImc - minImc) / 4;
  const marcasY = [
    maxImc,
    Math.round((maxImc - step) * 10) / 10,
    Math.round((maxImc - step * 2) * 10) / 10,
    Math.round((maxImc - step * 3) * 10) / 10,
    minImc,
  ];

  // SVG do Gráfico
  const svgWidth = 320;
  const svgHeight = 140;
  const paddingX = 15;
  const paddingY = 15;

  const getX = (index: number) => {
    return paddingX + (index / (pontos.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const range = maxImc - minImc;
    if (range <= 0) return svgHeight / 2;
    const ratio = (val - minImc) / range;
    return svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
  };

  // Faixa Saudável (18.5 a 24.9) em pixels Y
  const yNormalTopo = getY(24.9);
  const yNormalBase = getY(18.5);

  const linePathD = useMemo(() => {
    return pontos.reduce((acc, ponto, index) => {
      const x = getX(index);
      const y = getY(ponto.imc);
      return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [pontos, minImc, maxImc]);

  const areaPathD = useMemo(() => {
    if (pontos.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(pontos.length - 1);
    const bottomY = svgHeight;
    return `${linePathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePathD, pontos.length]);

  const pontoAtivo = pontos[indicePontoAtivo] || pontos[pontos.length - 1];
  const posXAtivo = getX(indicePontoAtivo);
  const posYAtivo = getY(pontoAtivo.imc);

  return (
    <div className="w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4 select-none">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-[#0B2246] tracking-tight">
          IMC
        </h3>
        <button
          type="button"
          onClick={() => {
            if (onAbrirExplicacao) onAbrirExplicacao();
            else setModalExplicacaoAberto(true);
          }}
          aria-label="O que é o IMC?"
          className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Subtítulo: IMC Atual e Badge de Categoria */}
      <div className="flex items-center justify-between -mt-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-slate-400">Atual:</span>
          <span className="text-xl font-black text-[#0B2246]">
            {imcAtual.toFixed(1)}
          </span>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${dadosClassificacao.corBg} ${dadosClassificacao.corTexto} ${dadosClassificacao.corBorda}`}>
          {dadosClassificacao.rotulo}
        </span>
      </div>

      {/* Seletor Segmentado de Período (Dia | Semana | Mês) */}
      <div className="flex items-center bg-slate-100/70 p-1 rounded-2xl">
        {(['dia', 'semana', 'mes'] as PeriodoGraficoImc[]).map((p) => {
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

      {/* Gráfico SVG de Tendência do IMC */}
      <div className="relative pt-2">
        <div className="flex items-stretch gap-2">
          {/* Eixo Y */}
          <div className="flex flex-col justify-between items-end pr-1 text-[11px] font-medium text-slate-400 h-36 select-none">
            {marcasY.map((marca, i) => (
              <span key={i} className="leading-none">
                {marca.toFixed(1)}
              </span>
            ))}
          </div>

          {/* Canvas SVG */}
          <div className="flex-1 relative h-36 overflow-visible">
            {/* Linhas de Grade e Zona Saudável Verde de Fundo (18.5 a 24.9) */}
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
                <linearGradient id="degradeImc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dadosClassificacao.corLinha} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={dadosClassificacao.corLinha} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Faixa Sombreada Verde da Zona Saudável Ideal (18.5 a 24.9) */}
              <rect
                x={0}
                y={Math.max(0, Math.min(svgHeight, yNormalTopo))}
                width={svgWidth}
                height={Math.max(0, yNormalBase - yNormalTopo)}
                fill="#10B981"
                fillOpacity="0.08"
                rx="4"
              />

              {/* Área Sombreada sob a Curva do IMC */}
              <path d={areaPathD} fill="url(#degradeImc)" />

              {/* Linha Principal do IMC */}
              <path
                d={linePathD}
                fill="none"
                stroke={dadosClassificacao.corLinha}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Linhas de Mira Pontilhadas */}
              <line
                x1={posXAtivo}
                y1={0}
                x2={posXAtivo}
                y2={svgHeight}
                stroke={dadosClassificacao.corLinha}
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
              />

              {/* Pontos Clicáveis na Linha */}
              {pontos.map((ponto, index) => {
                const cx = getX(index);
                const cy = getY(ponto.imc);
                const estaAtivo = indicePontoAtivo === index;

                return (
                  <circle
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={estaAtivo ? 5 : 3.5}
                    className="cursor-pointer transition-all duration-200"
                    fill={dadosClassificacao.corLinha}
                    stroke="#ffffff"
                    strokeWidth={estaAtivo ? 2.5 : 1.5}
                    onClick={() => setIndicePontoAtivo(index)}
                  />
                );
              })}
            </svg>

            {/* Tooltip com Valor de IMC Pontual */}
            <div
              className="absolute -top-3.5 z-10 transition-all duration-300 pointer-events-none"
              style={{
                left: `${(posXAtivo / svgWidth) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div 
                className="px-2.5 py-1 rounded-xl text-white text-[11px] font-black shadow-md flex items-center justify-center"
                style={{ backgroundColor: dadosClassificacao.corLinha }}
              >
                {pontoAtivo.imc.toFixed(1)}
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
                  ? 'text-[#0B2246] font-black' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p.rotuloData}
            </span>
          ))}
        </div>
      </div>

      {/* Legenda Informativa da Faixa Saudável */}
      <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
        <span className="font-semibold">Zona Ideal de Saúde:</span>
        <span className="font-bold bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
          IMC 18.5 – 24.9
        </span>
      </div>

      {/* Modal Educativo de Explicação do IMC */}
      {modalExplicacaoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl space-y-3">
            <h4 className="text-base font-bold text-[#0B2246]">Entenda o seu IMC</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              O Índice de Massa Corporal (IMC) é uma métrica baseada em peso e altura. O gráfico exibe sua tendência ao longo do tempo em direção à faixa verde saudável:
            </p>
            <ul className="text-xs space-y-1 text-slate-500">
              <li>• <strong className="text-sky-600">Abaixo de 18.5:</strong> Abaixo do peso</li>
              <li>• <strong className="text-emerald-600">18.5 a 24.9:</strong> Faixa saudável ideal</li>
              <li>• <strong className="text-amber-600">25.0 a 29.9:</strong> Excesso de peso</li>
              <li>• <strong className="text-orange-600">30.0 a 34.9:</strong> Obesidade Grau I</li>
              <li>• <strong className="text-rose-600">35.0+:</strong> Obesidade Severa</li>
            </ul>
            <button
              type="button"
              onClick={() => setModalExplicacaoAberto(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#00C975] text-white font-bold text-xs shadow-sm active:scale-95 cursor-pointer mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
