/**
 * @file jornada/CalendarioConsistenciaJornada.tsx
 * @description Calendário visual de consistência mensal (Heatmap da Jornada).
 * Apresenta dias com jejuns concluídos (verde), anotações no diário (âmbar) e medições (azul),
 * permitindo filtragem rápida ao tocar em qualquer dia.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import type { ItemLinhaTempoJornada } from '../../types/jornada';

interface CalendarioConsistenciaJornadaProps {
  itensTimeline: ItemLinhaTempoJornada[];
  dataFiltro?: string | null; // 'YYYY-MM-DD'
  onSelecionarData: (dataStr: string | null) => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const CalendarioConsistenciaJornada: React.FC<CalendarioConsistenciaJornadaProps> = ({
  itensTimeline,
  dataFiltro,
  onSelecionarData,
}) => {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());

  // Mapeia eventos por data 'YYYY-MM-DD'
  const mapaEventosPorDia = React.useMemo(() => {
    const mapa: Record<string, { temJejum: boolean; temAnotacao: boolean; temMedicao: boolean }> = {};
    
    itensTimeline.forEach(item => {
      const chaveDia = item.dataIso.slice(0, 10);
      if (!mapa[chaveDia]) {
        mapa[chaveDia] = { temJejum: false, temAnotacao: false, temMedicao: false };
      }
      if (item.tipo === 'jejum') mapa[chaveDia].temJejum = true;
      if (item.tipo === 'anotacao') mapa[chaveDia].temAnotacao = true;
      if (item.tipo === 'pesagem' || item.tipo === 'bioimpedancia') mapa[chaveDia].temMedicao = true;
    });

    return mapa;
  }, [itensTimeline]);

  // Cálculos da grade do calendário
  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDiasMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const handleMesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const handleProximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  const handleIrParaHoje = () => {
    setMesAtual(hoje.getMonth());
    setAnoAtual(hoje.getFullYear());
    const hojeStr = hoje.toISOString().slice(0, 10);
    onSelecionarData(hojeStr === dataFiltro ? null : hojeStr);
  };

  const hojeFormatadoStr = hoje.toISOString().slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs" data-purpose="consistency-calendar">
      {/* Cabeçalho do Calendário */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {MESES[mesAtual]} de {anoAtual}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleIrParaHoje}
            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={handleMesAnterior}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleProximoMes}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DIAS_SEMANA.map((dia, idx) => (
          <span key={idx} className="text-[11px] font-semibold text-slate-400 py-1">
            {dia}
          </span>
        ))}
      </div>

      {/* Grade de Dias */}
      <div className="grid grid-cols-7 gap-1">
        {/* Espaços vazios do início do mês */}
        {Array.from({ length: primeiroDiaMes }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-9 w-full" />
        ))}

        {/* Dias do mês */}
        {Array.from({ length: totalDiasMes }).map((_, idx) => {
          const diaNum = idx + 1;
          const diaFormatado = String(diaNum).padStart(2, '0');
          const mesFormatado = String(mesAtual + 1).padStart(2, '0');
          const dataChave = `${anoAtual}-${mesFormatado}-${diaFormatado}`;

          const ehHoje = dataChave === hojeFormatadoStr;
          const estaSelecionado = dataChave === dataFiltro;
          const status = mapaEventosPorDia[dataChave];

          return (
            <button
              key={dataChave}
              type="button"
              onClick={() => onSelecionarData(estaSelecionado ? null : dataChave)}
              className={`h-9 w-full rounded-xl flex flex-col items-center justify-center relative transition-all min-w-[36px] active:scale-95 cursor-pointer ${
                estaSelecionado
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : ehHoje
                  ? 'border-2 border-emerald-500 text-emerald-700 font-bold bg-emerald-50/40'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="text-xs leading-none">{diaNum}</span>

              {/* Indicadores de Conquista no Dia */}
              {status && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {status.temJejum && (
                    <span 
                      className={`w-1 h-1 rounded-full ${estaSelecionado ? 'bg-white' : 'bg-emerald-500'}`} 
                      title="Jejum Concluído"
                    />
                  )}
                  {status.temAnotacao && (
                    <span 
                      className={`w-1 h-1 rounded-full ${estaSelecionado ? 'bg-amber-200' : 'bg-amber-400'}`} 
                      title="Anotação no Diário"
                    />
                  )}
                  {status.temMedicao && (
                    <span 
                      className={`w-1 h-1 rounded-full ${estaSelecionado ? 'bg-sky-200' : 'bg-sky-400'}`} 
                      title="Exame ou Pesagem"
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda de Consistência */}
      <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Jejum
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Diário
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Medição
          </span>
        </div>

        {dataFiltro && (
          <button
            type="button"
            onClick={() => onSelecionarData(null)}
            className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
          >
            Limpar filtro de data
          </button>
        )}
      </div>
    </div>
  );
};
