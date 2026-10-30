/**
 * @file ModalTravaAntiEsquecimento.tsx
 * @description Modal de Trava Inteligente Anti-Esquecimento (Anti-What-the-Hell Effect).
 * Acionado quando o cronômetro ultrapassa expressivamente a meta planejada (ex: > 18h em plano de 16h).
 * Permite ao usuário registrar no horário exato da meta planejada, com o tempo real ou ajustar o término,
 * prevenindo distorções no histórico e eliminando a sensação de culpa ou abandono do app.
 */

import React from 'react';
import { Clock, CheckCircle2, Sparkles, X, History, Calendar } from 'lucide-react';
import { vibrarClique, vibrarSucesso } from '../../utils/haptics';

interface ModalTravaAntiEsquecimentoProps {
  /** Se o modal está aberto */
  aberto: boolean;
  /** Meta de horas do protocolo (ex: 16) */
  metaHoras: number;
  /** Segundos totais decorridos no cronômetro */
  segundosTotais: number;
  /** Horário formatado em que a meta foi atingida (ex: "04:20" ou "Ontem, 20:00") */
  horarioMetaAtingida: string;
  /** Callback para confirmar no horário da meta estipulada (ex: 16h limpas) */
  onConfirmarHorarioMeta: () => void;
  /** Callback para confirmar com o tempo real total decorrido (ex: 21h36m) */
  onConfirmarTempoReal: () => void;
  /** Callback para abrir o modal de seleção manual de término */
  onAjustarManualmente: () => void;
  /** Callback para fechar e continuar com o timer rodando */
  onFechar: () => void;
}

export const ModalTravaAntiEsquecimento: React.FC<ModalTravaAntiEsquecimentoProps> = ({
  aberto,
  metaHoras,
  segundosTotais,
  horarioMetaAtingida,
  onConfirmarHorarioMeta,
  onConfirmarTempoReal,
  onAjustarManualmente,
  onFechar,
}) => {
  if (!aberto) return null;

  const horasTotais = Math.floor(segundosTotais / 3600);
  const minutosTotais = Math.floor((segundosTotais % 3600) / 60);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-trava-esquecimento"
    >
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Detalhe decorativo no topo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onFechar}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition-all cursor-pointer z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone Acolhedor de Ajuste */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00C975] mb-3 mt-1 shadow-sm">
          <History className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Badge e Título */}
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-1.5 border border-emerald-100">
          Ajuste Inteligente
        </span>

        <h2 
          id="titulo-trava-esquecimento"
          className="text-xl font-black text-[#092244] tracking-tight leading-snug"
        >
          Esqueceu o timer ligado?
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-[300px]">
          Sua meta de <strong className="text-[#092244] font-bold">{metaHoras}h</strong> foi batida às <strong className="text-emerald-700 font-bold">{horarioMetaAtingida}</strong>. O cronômetro já marca <strong className="text-[#092244] font-bold">{horasTotais}h {minutosTotais > 0 ? `${minutosTotais}m` : ''}</strong>.
        </p>

        {/* Opções de Conclusão */}
        <div className="w-full space-y-2.5 my-4">
          {/* Opção 1: Salvar exatamente no horário da meta (Recomendada) */}
          <button
            type="button"
            onClick={() => {
              vibrarSucesso();
              onConfirmarHorarioMeta();
            }}
            className="w-full p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-between text-left transition-all shadow-md shadow-emerald-500/20 cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5] shrink-0" />
              <div>
                <span className="text-xs font-black block leading-tight">
                  Salvar meta de {metaHoras}h ({horarioMetaAtingida})
                </span>
                <span className="text-[10px] text-emerald-100 leading-tight block">
                  Recomendado para manter seu histórico limpo
                </span>
              </div>
            </div>
            <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
          </button>

          {/* Opção 2: Salvar com o tempo real total decorrido */}
          <button
            type="button"
            onClick={() => {
              vibrarClique();
              onConfirmarTempoReal();
            }}
            className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-800 border border-slate-200/80 flex items-center justify-between text-left transition-all cursor-pointer min-h-[50px]"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <span className="text-xs font-bold block leading-tight text-[#092244]">
                  Salvar tempo real de {horasTotais}h {minutosTotais}m
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Se você realmente continuou jejuando até agora
                </span>
              </div>
            </div>
          </button>

          {/* Opção 3: Ajustar Horário de Término */}
          <button
            type="button"
            onClick={() => {
              vibrarClique();
              onAjustarManualmente();
            }}
            className="w-full p-2.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-600 border border-dashed border-slate-200 flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Definir outro horário de término</span>
          </button>
        </div>

        {/* Botão para Continuar Jejuando */}
        <button
          type="button"
          onClick={onFechar}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 active:scale-95 transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
        >
          Continuar jejuando (não encerrar agora)
        </button>
      </div>
    </div>
  );
};
