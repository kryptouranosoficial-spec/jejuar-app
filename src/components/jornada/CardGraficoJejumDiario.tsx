/**
 * @file CardGraficoJejumDiario.tsx
 * @description Card com gráfico de barras verticais de Jejum Diário (últimos 7 dias).
 * Baseado estritamente na imagem de referência fornecida pelo usuário:
 * - Título: "Jejum diário" com ícone de expansão.
 * - Subtítulo: Média de horas (ex: Média: 14.1 h).
 * - Eixo Y: marcas em 0, 6, 12, 18, 24 horas.
 * - Barras verticais pill-shaped em verde esmeralda sobre trilhas menta translúcidas.
 * - Eixo X com as datas dos últimos 7 dias (ex: 20/10 a 26/10).
 */

import React, { useState, useMemo } from 'react';
import { ExternalLink, Flame } from 'lucide-react';
import type { SessaoJejum } from '../../types';

interface DiaJejumGrafico {
  dataStr: string; // YYYY-MM-DD
  rotuloData: string; // DD/MM
  horas: number;
}

interface CardGraficoJejumDiarioProps {
  historicoJejuns?: SessaoJejum[];
  horasJejumHoje?: number;
  diasConsecutivos?: number;
  onAbrirDetalhes?: () => void;
}

export const CardGraficoJejumDiario: React.FC<CardGraficoJejumDiarioProps> = ({
  historicoJejuns = [],
  horasJejumHoje = 14.5,
  diasConsecutivos = 1,
  onAbrirDetalhes,
}) => {
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);

  // Gera os dados dos últimos 7 dias terminando em hoje
  const dados7Dias = useMemo<DiaJejumGrafico[]>(() => {
    const hoje = new Date();
    const lista: DiaJejumGrafico[] = [];

    // Cria os últimos 7 dias cronológicos
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      const dataStr = d.toISOString().slice(0, 10);
      const diaFormatado = String(d.getDate()).padStart(2, '0');
      const mesFormatado = String(d.getMonth() + 1).padStart(2, '0');
      const rotuloData = `${diaFormatado}/${mesFormatado}`;

      // Busca sessões registradas nesta data
      const sessoesNoDia = historicoJejuns.filter(s => s.fim?.startsWith(dataStr) || s.inicio?.startsWith(dataStr));
      let horas = 0;

      if (sessoesNoDia.length > 0) {
        const totalSegundos = sessoesNoDia.reduce((acc, curr) => acc + (curr.duracaoSegundos || 0), 0);
        horas = Math.round((totalSegundos / 3600) * 10) / 10;
      } else {
        horas = 0;
      }

      lista.push({
        dataStr,
        rotuloData,
        horas: Math.min(24, Math.max(0, horas)),
      });
    }

    return lista;
  }, [historicoJejuns, horasJejumHoje, diasConsecutivos]);

  // Cálculo da média de horas (apenas dias com jejum > 0)
  const mediaHoras = useMemo(() => {
    const diasComJejum = dados7Dias.filter(d => d.horas > 0);
    if (diasComJejum.length === 0) return '0.0';
    const soma = diasComJejum.reduce((acc, curr) => acc + curr.horas, 0);
    return (soma / diasComJejum.length).toFixed(1);
  }, [dados7Dias]);

  const marcasEixoY = [24, 18, 12, 6, 0];

  return (
    <div className="w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4 select-none">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-[#0B2246] tracking-tight">
          Jejum diário
        </h3>
        {onAbrirDetalhes && (
          <button
            type="button"
            onClick={onAbrirDetalhes}
            aria-label="Ver histórico completo de jejum"
            className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Subtítulo com Média em destaque */}
      <div className="flex items-baseline gap-1.5 -mt-1">
        <span className="text-xs font-semibold text-slate-400">Média:</span>
        <span className="text-base font-extrabold text-[#0B2246]">
          {mediaHoras} h
        </span>
      </div>

      {/* Área do Gráfico */}
      <div className="relative pt-2 pb-1">
        {/* Tooltip flutuante de detalhe ao tocar */}
        {diaSelecionado !== null && (
          <div className="absolute top-0 right-4 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-bold shadow-md animate-in fade-in z-10 flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#00C975]" />
            <span>{dados7Dias[diaSelecionado].rotuloData}: {dados7Dias[diaSelecionado].horas}h</span>
          </div>
        )}

        <div className="flex items-stretch gap-3">
          {/* Eixo Y com as marcas de horas (24, 18, 12, 6, 0) */}
          <div className="flex flex-col justify-between items-end pr-1 text-[11px] font-medium text-slate-400 h-44 select-none">
            {marcasEixoY.map((marca) => (
              <span key={marca} className="leading-none">
                {marca}
              </span>
            ))}
          </div>

          {/* Grid de Colunas de Barras Verticais */}
          <div className="flex-1 flex items-end justify-between gap-2 h-44 border-b border-slate-100 pb-1">
            {dados7Dias.map((item, index) => {
              const porcentagemAltura = Math.round((item.horas / 24) * 100);
              const estaSelecionado = diaSelecionado === index;

              return (
                <div
                  key={item.dataStr}
                  onClick={() => setDiaSelecionado(estaSelecionado ? null : index)}
                  className="flex-1 h-full flex flex-col justify-end items-center cursor-pointer group"
                >
                  {/* Trilha vertical de fundo (Verde translúcido) com Barra Verde Esmeralda */}
                  <div className="w-full max-w-[14px] sm:max-w-[18px] h-full rounded-full bg-[#E8FAF2] flex flex-col justify-end p-0.5 relative overflow-hidden transition-all group-hover:bg-[#D5F5E7]">
                    <div
                      className={`w-full rounded-full transition-all duration-700 ease-out ${
                        item.horas > 0 
                          ? 'bg-[#00C975] group-hover:bg-[#00B067]' 
                          : 'bg-transparent'
                      } ${estaSelecionado ? 'ring-2 ring-emerald-400' : ''}`}
                      style={{ 
                        height: `${item.horas > 0 ? Math.max(8, porcentagemAltura) : 0}%` 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eixo X com as datas */}
        <div className="flex justify-between pl-8 pr-1 pt-2">
          {dados7Dias.map((item, index) => (
            <span
              key={item.dataStr}
              onClick={() => setDiaSelecionado(diaSelecionado === index ? null : index)}
              className={`text-[10px] sm:text-[11px] font-medium text-center flex-1 cursor-pointer transition-colors ${
                diaSelecionado === index 
                  ? 'text-[#00C975] font-black' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.rotuloData}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
