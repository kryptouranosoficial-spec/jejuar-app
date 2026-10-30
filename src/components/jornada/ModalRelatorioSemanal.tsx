/**
 * @file ModalRelatorioSemanal.tsx
 * @description Modal do Relatório Semanal de Transformação (Conclusão do Ciclo de 7 Dias).
 * Consolida as métricas acumuladas de jejum, gordura oxidada e hidratação da semana,
 * liberando projeções preditivas para os próximos 14 dias e o badge 'Metabolismo Blindado'.
 */

import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Flame, 
  Droplet, 
  Clock, 
  TrendingDown, 
  Sparkles, 
  Share2, 
  Check, 
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import { vibrarSucesso, vibrarClique } from '../../utils/haptics';

interface ModalRelatorioSemanalProps {
  /** Se o modal está aberto */
  aberto: boolean;
  /** Sequência de dias consecutivos do usuário */
  diasConsecutivos: number;
  /** Peso atual do usuário em kg */
  pesoAtualKg: number;
  /** Meta de peso desejada */
  pesoMetaKg: number;
  /** Callback para fechar o modal */
  onFechar: () => void;
}

export const ModalRelatorioSemanal: React.FC<ModalRelatorioSemanalProps> = ({
  aberto,
  diasConsecutivos,
  pesoAtualKg,
  pesoMetaKg,
  onFechar,
}) => {
  const [copiado, setCopiado] = useState<boolean>(false);

  if (!aberto) return null;

  // Cálculos consolidados dos últimos 7 dias (ou dias completados)
  const diasReferencia = Math.min(7, Math.max(1, diasConsecutivos));
  const horasTotaisSemana = diasReferencia * 16;
  const gorduraOxidadaSemanaGramas = Math.round(diasReferencia * 42);
  const aguaLitrosSemana = (diasReferencia * 2.3).toFixed(1);
  const projecaoPerda14DiasKg = ((gorduraOxidadaSemanaGramas * 2 * 1.3) / 1000).toFixed(2);

  const handleCompartilhar = async () => {
    vibrarSucesso();
    const texto = `📊 Fechei minha semana no app Jejuar com ${horasTotaisSemana}h de jejum acumuladas e ~${gorduraOxidadaSemanaGramas}g de gordura oxidada! Rumo à minha melhor versão. 💪✨`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Relatório Semanal no Jejuar',
          text: texto,
        });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      } catch {}
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-relatorio-semanal"
    >
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-100 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Glow decorativo */}
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
          aria-label="Fechar relatório"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone de Conclusão do Ciclo com Glow */}
        <div className="relative mt-2 mb-3">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#00C975] to-[#25D366] flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Trophy className="w-10 h-10 fill-white/20 stroke-[2.2]" />
          </div>
          <span className="absolute -bottom-1 -right-1 text-xl animate-bounce">
            ✨
          </span>
        </div>

        {/* Badge do Ciclo Semanal */}
        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-1 border border-emerald-100">
          Ciclo de 7 Dias Concluído
        </span>

        <h2 
          id="titulo-relatorio-semanal"
          className="text-2xl font-black text-[#092244] tracking-tight leading-tight"
        >
          Relatório de Transformação
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed max-w-[310px]">
          Sua constância gerou uma adaptação biológica profunda no metabolismo. Veja seus números acumulados:
        </p>

        {/* Grid 3x1 das Métricas Consolidadas */}
        <div className="w-full grid grid-cols-3 gap-2 mb-4">
          {/* Card 1: Horas Totais */}
          <div className="bg-[#F5F9FC] rounded-2xl p-2.5 flex flex-col items-center border border-slate-100 text-center">
            <Clock className="w-4 h-4 text-[#00C975] mb-1" />
            <span className="text-base font-black text-[#092244] leading-tight">
              {horasTotaisSemana}h
            </span>
            <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">
              Jejum Total
            </span>
          </div>

          {/* Card 2: Gordura Queimada */}
          <div className="bg-[#F0FAF5] rounded-2xl p-2.5 flex flex-col items-center border border-emerald-100/70 text-center">
            <Flame className="w-4 h-4 text-emerald-600 fill-emerald-500/30 mb-1" />
            <span className="text-base font-black text-emerald-800 leading-tight">
              ~{gorduraOxidadaSemanaGramas}g
            </span>
            <span className="text-[9px] font-bold uppercase text-emerald-700 mt-0.5">
              Gordura Pura
            </span>
          </div>

          {/* Card 3: Litros de Água */}
          <div className="bg-[#F0F6FF] rounded-2xl p-2.5 flex flex-col items-center border border-blue-100/70 text-center">
            <Droplet className="w-4 h-4 text-blue-500 fill-blue-500/30 mb-1" />
            <span className="text-base font-black text-blue-900 leading-tight">
              {aguaLitrosSemana}L
            </span>
            <span className="text-[9px] font-bold uppercase text-blue-600 mt-0.5">
              Água Total
            </span>
          </div>
        </div>

        {/* Card Preditivo dos Próximos 14 Dias */}
        <div className="w-full bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-slate-50 border border-indigo-100 rounded-2xl p-3.5 text-left mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Projeção para os Próximos 14 Dias</span>
            </div>
            <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              Preditivo
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
            Mantendo o protocolo atual, seu déficit metabólico estimado para as próximas 2 semanas projeta uma queima de aproximadamente:
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-indigo-100/70">
            <span className="text-xs font-bold text-indigo-950">
              Perda Adiposa Preditiva:
            </span>
            <span className="text-sm font-black text-emerald-600">
              -{projecaoPerda14DiasKg} kg
            </span>
          </div>
        </div>

        {/* Badge Desbloqueado */}
        <div className="w-full bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-3 mb-5 text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
              Medalha Desbloqueada
            </span>
            <span className="text-xs font-black text-amber-950 block">
              Metabolismo Blindado · Nível 1
            </span>
          </div>
        </div>

        {/* Botão de Compartilhar Relatório */}
        <button
          type="button"
          onClick={handleCompartilhar}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#00C975] hover:bg-[#00B568] active:scale-95 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-500/25 cursor-pointer min-h-[46px] flex items-center justify-center gap-2 mb-2"
        >
          {copiado ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Resumo Copiado para Compartilhar!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Compartilhar Relatório Semanal</span>
            </>
          )}
        </button>

        {/* Fechar */}
        <button
          type="button"
          onClick={() => {
            vibrarClique();
            onFechar();
          }}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 active:scale-95 transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
        >
          Fechar relatório
        </button>
      </div>
    </div>
  );
};
