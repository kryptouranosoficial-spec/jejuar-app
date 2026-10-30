/**
 * @file TimerJejumCard.tsx
 * @description Card central de cronometragem de Jejum e Janela de Alimentação.
 * Renderiza o anel circular decorativo em SVG com gradientes dinâmicos, tempo em destaque,
 * botões de ação com alto contraste e os horários de início e término com suporte à edição.
 */

import React from 'react';
import { Trophy, Utensils, Clock, CheckCircle2, Pencil } from 'lucide-react';
import type { ProtocoloJejum } from '../../data/planosJejumData';

interface HorariosInfo {
  rotuloInicio: string;
  inicioFormatado: string;
  rotuloTermino: string;
  terminoFormatado: string;
  dataInicioObjeto: Date;
  janelaAlimentacaoFormatada?: string;
  horasJanela?: number;
}

interface TimerJejumCardProps {
  jejumAtivo: boolean;
  emJanelaAlimentacao: boolean;
  metaAlcancada: boolean;
  planoAtivo: ProtocoloJejum;
  segundosJejum: number;
  segundosJanela: number;
  segundosExtra: number;
  segundosRestantes: number;
  segundosRestantesJanela: number;
  porcentagemProgresso: number;
  porcentagemProgressoJanela: number;
  modoTimer: 'decorrido' | 'restante';
  horarios: HorariosInfo;
  onAlternarModoTimer: () => void;
  onAcaoPrincipal: () => void;
  onEditarHorarioInicio: () => void;
  formatarTempo: (totalSegundos: number) => string;
}

export const TimerJejumCard: React.FC<TimerJejumCardProps> = ({
  jejumAtivo,
  emJanelaAlimentacao,
  metaAlcancada,
  planoAtivo,
  segundosJejum,
  segundosJanela,
  segundosExtra,
  segundosRestantes,
  segundosRestantesJanela,
  porcentagemProgresso,
  porcentagemProgressoJanela,
  modoTimer,
  horarios,
  onAlternarModoTimer,
  onAcaoPrincipal,
  onEditarHorarioInicio,
  formatarTempo,
}) => {
  return (
    <section 
      className={`rounded-3xl p-5 shadow-sm border transition-all ${
        emJanelaAlimentacao 
          ? 'bg-blue-50/50 border-blue-100 shadow-blue-500/5' 
          : metaAlcancada 
            ? 'bg-emerald-50/40 border-emerald-100 shadow-emerald-500/5' 
            : 'bg-white border-gray-100 shadow-gray-200/50'
      }`}
      data-purpose="fasting-timer-card"
    >
      {/* Container Central com o Anel de Progresso Circular */}
      <div className="relative w-full aspect-square max-w-[290px] mx-auto flex flex-col items-center justify-center p-2 mb-2">
        {/* SVG do Anel Decorativo e Trilha de Progresso */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 290 290">
            <defs>
              {/* Gradiente Verde Esmeralda quando em Jejum */}
              <linearGradient id="fastingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C975" />
                <stop offset="100%" stopColor="#00A86B" />
              </linearGradient>

              {/* Gradiente Dourado quando a Meta for Concluída */}
              <linearGradient id="victoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C975" />
                <stop offset="50%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>

              {/* Gradiente Azul para a Janela de Alimentação Aberta */}
              <linearGradient id="feedingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>

            {/* Trilha de fundo inativa com abertura na base */}
            <circle
              cx="145"
              cy="145"
              r="130"
              fill="none"
              stroke={emJanelaAlimentacao ? '#DBEAFE' : jejumAtivo ? '#F3F4F6' : '#DAF4ED'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="498 817"
              transform="rotate(160 145 145)"
            />

            {/* Trilha ativa de Jejum com preenchimento gradual partindo do início da ferradura */}
            {jejumAtivo && (
              <circle
                cx="145"
                cy="145"
                r="130"
                fill="none"
                stroke={metaAlcancada ? "url(#victoryGradient)" : "url(#fastingGradient)"}
                strokeWidth={metaAlcancada ? "16" : "14"}
                strokeLinecap="round"
                strokeDasharray={`${metaAlcancada ? 498 : Math.max(1, Math.min(498, (porcentagemProgresso / 100) * 498))} 817`}
                transform="rotate(160 145 145)"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Trilha ativa de Janela de Alimentação com preenchimento gradual */}
            {emJanelaAlimentacao && (
              <circle
                cx="145"
                cy="145"
                r="130"
                fill="none"
                stroke="url(#feedingGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(1, Math.min(498, (porcentagemProgressoJanela / 100) * 498))} 817`}
                transform="rotate(160 145 145)"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>
        </div>

        {/* Ícone Central: Cloche, Troféu ou Refeição */}
        <div className="relative z-10 mb-2 flex items-center justify-center">
          {metaAlcancada && jejumAtivo ? (
            <div className="w-13 h-13 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner border border-emerald-200">
              <Trophy className="w-6 h-6 text-[#00C975] fill-emerald-500/20 stroke-[2.3]" />
            </div>
          ) : emJanelaAlimentacao ? (
            <div className="w-13 h-13 rounded-full bg-blue-100/80 flex items-center justify-center shadow-inner border border-blue-200">
              <Utensils className="w-6 h-6 text-[#2F80ED]" />
            </div>
          ) : (
            <div className="w-13 h-13 rounded-full bg-amber-100/70 flex items-center justify-center shadow-inner">
              <Utensils className="w-6 h-6 text-[#FFB400]" />
            </div>
          )}
          <span className={`absolute -top-1 -right-1 text-sm ${
            metaAlcancada && jejumAtivo 
              ? 'text-emerald-500 animate-bounce' 
              : emJanelaAlimentacao 
                ? 'text-blue-500 animate-pulse' 
                : 'text-amber-400 animate-pulse'
          }`}>
            ✨
          </span>
        </div>

        {/* Rótulo do Plano com Badge Centralizado */}
        <div 
          className="relative z-10 flex items-center justify-center mb-1.5 cursor-pointer select-none" 
          onClick={jejumAtivo ? onAlternarModoTimer : undefined}
        >
          {metaAlcancada && jejumAtivo ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-extrabold tracking-wide border border-emerald-200/90 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C975] animate-pulse" />
              100% Concluído
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-[#092244] text-[13px] font-semibold tracking-normal">
                {emJanelaAlimentacao
                  ? `Janela de ${planoAtivo.horasAlimentacao}h`
                  : !jejumAtivo 
                    ? `Plano ativo (${planoAtivo.nome})` 
                    : (modoTimer === 'decorrido' ? 'Tempo decorrido' : 'Tempo restante')}
              </p>
              {jejumAtivo && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider bg-emerald-100 text-emerald-800">
                  {`${porcentagemProgresso.toFixed(0)}%`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tempo em Destaque Bold */}
        <div 
          onClick={jejumAtivo ? onAlternarModoTimer : undefined}
          className={`relative z-10 flex flex-col items-center justify-center select-none ${jejumAtivo ? 'cursor-pointer active:scale-98 transition-transform' : ''}`}
          title={jejumAtivo ? "Toque para alternar modo do contador" : undefined}
        >
          <h2 className={`text-[32px] sm:text-[34px] font-black tracking-tight ${
            emJanelaAlimentacao 
              ? 'text-[#0E4999]' 
              : metaAlcancada 
                ? 'text-[#00874E]' 
                : 'text-[#092244]'
          }`}>
            {emJanelaAlimentacao
              ? formatarTempo(segundosRestantesJanela)
              : !jejumAtivo 
                ? `Jejum de ${planoAtivo.horasJejum} h` 
                : metaAlcancada
                  ? (modoTimer === 'decorrido' 
                      ? formatarTempo(segundosJejum) 
                      : `+${formatarTempo(segundosExtra)}`)
                  : (modoTimer === 'decorrido' 
                      ? formatarTempo(segundosJejum) 
                      : formatarTempo(segundosRestantes))}
          </h2>

          {/* Subtexto auxiliar enxuto */}
          {emJanelaAlimentacao && (
            <span className="text-[11px] font-medium mt-0.5 mb-3 text-blue-700 tracking-wide">
              {segundosRestantesJanela >= 3600
                ? `Restam ${Math.floor(segundosRestantesJanela / 3600)}h de alimentação`
                : `Restam ${Math.max(1, Math.floor(segundosRestantesJanela / 60))}min de alimentação`}
            </span>
          )}
          {jejumAtivo && (
            <span className={`text-[11px] font-bold mt-1 mb-4 ${
              metaAlcancada ? 'text-emerald-700' : 'text-slate-500'
            }`}>
              {metaAlcancada
                ? (modoTimer === 'decorrido' 
                    ? `Meta batida • +${Math.max(1, Math.floor(segundosExtra / 60))}m em autofagia` 
                    : `+${formatarTempo(segundosExtra)} além da meta • Toque p/ total`)
                : (modoTimer === 'decorrido' 
                    ? `Meta: ${planoAtivo.horasJejum}h • Toque p/ restante` 
                    : `Meta: ${planoAtivo.horasJejum}h • Toque p/ decorrido`)}
            </span>
          )}
          {!jejumAtivo && !emJanelaAlimentacao && <div className="mb-5" />}
        </div>

        {/* Botão Principal de Ação (CTA com prioridade z-10) */}
        <button 
          type="button"
          onClick={onAcaoPrincipal}
          className={`relative z-10 px-5 py-3 rounded-full font-bold text-[14px] active:scale-95 transition-all min-h-[46px] cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap select-none ${
            emJanelaAlimentacao
              ? 'w-auto min-w-[210px] max-w-[240px] bg-[#00C975] hover:bg-[#00B568] text-white shadow-[0_4px_14px_rgba(0,201,117,0.35)]'
              : !jejumAtivo 
                ? 'w-[210px] bg-[#00C975] hover:bg-[#00B568] text-white shadow-[0_4px_14px_rgba(0,201,117,0.35)]' 
                : metaAlcancada
                  ? 'w-[240px] bg-[#00C975] hover:bg-[#00B568] text-white shadow-[0_4px_16px_rgba(0,201,117,0.45)] ring-2 ring-emerald-300'
                  : 'w-[210px] bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
          }`}
        >
          {emJanelaAlimentacao ? (
            <>
              <Clock className="w-4 h-4 shrink-0" />
              <span>Iniciar próximo jejum</span>
            </>
          ) : !jejumAtivo ? (
            <>
              <Clock className="w-4 h-4 shrink-0" />
              <span>Comece o jejum</span>
            </>
          ) : metaAlcancada ? (
            <>
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Concluir e registrar</span>
            </>
          ) : (
            <span>Encerrar jejum</span>
          )}
        </button>
      </div>

      {/* Indicadores Dinâmicos de Horário de Início e Término */}
      <div className="w-full flex justify-between px-3 pt-1 select-none" data-purpose="schedule-details">
        {/* Horário de Início Dinâmico */}
        <div className="text-left">
          <span className="block text-xs font-semibold text-gray-500 mb-0.5">
            {horarios.rotuloInicio}
          </span>
          <div 
            onClick={() => !emJanelaAlimentacao && onEditarHorarioInicio()}
            className={`flex items-center gap-1.5 ${!emJanelaAlimentacao ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
            title={!emJanelaAlimentacao ? "Editar data e horário de início" : undefined}
          >
            <span className="text-[15px] sm:text-[16px] font-extrabold text-[#092244]">
              {horarios.inicioFormatado}
            </span>
            {!emJanelaAlimentacao && (
              <Pencil className="w-3.5 h-3.5 text-[#00C975]" strokeWidth={2.5} />
            )}
          </div>
        </div>

        {/* Horário de Término Projetado */}
        <div className="text-right">
          <span className="block text-xs font-semibold text-gray-500 mb-0.5">
            {horarios.rotuloTermino}
          </span>
          <span className="text-[15px] sm:text-[16px] font-extrabold text-[#092244]">
            {horarios.terminoFormatado}
          </span>
        </div>
      </div>

      {/* Prévia Elegante da Janela de Alimentação Futura Programada */}
      {horarios.janelaAlimentacaoFormatada && (
        <div 
          className="mt-3 mx-1 px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between text-xs select-none shadow-xs"
          data-purpose="feeding-window-preview"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Utensils className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-semibold text-slate-500 leading-tight">
                {emJanelaAlimentacao ? 'Janela atual de alimentação' : 'Janela futura de alimentação'}
              </span>
              <span className="text-[12px] font-bold text-[#092244] leading-tight">
                {horarios.horasJanela || planoAtivo.horasAlimentacao}h permitidas
              </span>
            </div>
          </div>
          <span className="font-bold text-[11px] text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded-lg border border-blue-200/50">
            {horarios.janelaAlimentacaoFormatada}
          </span>
        </div>
      )}
    </section>
  );
};
