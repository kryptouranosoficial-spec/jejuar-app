/**
 * @file ModalConcluirJejum.tsx
 * @description Modal celebrativo de conclusão de jejum com meta atingida (100%+).
 * Apresenta métricas da sessão realizada (tempo total, tempo extra em autofagia,
 * sequência de dias atualizada, água consumida) e confirma o registro na jornada do usuário.
 */

import React from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Sparkles, 
  Droplet, 
  CheckCircle2, 
  X,
  Share2
} from 'lucide-react';

interface ModalConcluirJejumProps {
  /** Se o modal está visível na tela */
  aberto: boolean;
  /** Nome do plano executado (ex: "16:8") */
  nomePlano: string;
  /** Meta de horas estipulada */
  metaHoras: number;
  /** Duração real total em segundos */
  duracaoSegundos: number;
  /** Volume de água registrado durante o dia (ml) */
  aguaConsumidaMl: number;
  /** Sequência de dias consecutivos atual */
  diasConsecutivos: number;
  /** Função de callback ao confirmar e salvar a vitória */
  onConfirmarConclusao: () => void;
  /** Função para fechar o modal e continuar jejuando em tempo extra */
  onContinuarJejuando: () => void;
}

export const ModalConcluirJejum: React.FC<ModalConcluirJejumProps> = ({
  aberto,
  nomePlano,
  metaHoras,
  duracaoSegundos,
  aguaConsumidaMl,
  diasConsecutivos,
  onConfirmarConclusao,
  onContinuarJejuando,
}) => {
  if (!aberto) return null;

  // Cálculo de horas, minutos e segundos totais
  const horasTotais = Math.floor(duracaoSegundos / 3600);
  const minutosTotais = Math.floor((duracaoSegundos % 3600) / 60);

  // Cálculo do tempo extra (overtime) além da meta
  const segundosMeta = metaHoras * 3600;
  const segundosExtra = Math.max(0, duracaoSegundos - segundosMeta);
  const horasExtra = Math.floor(segundosExtra / 3600);
  const minutosExtra = Math.floor((segundosExtra % 3600) / 60);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-conclusao-jejum"
    >
      <div 
        className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Detalhe decorativo no topo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar discreto para continuar no jejum */}
        <button
          type="button"
          onClick={onContinuarJejuando}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition-all cursor-pointer z-10"
          aria-label="Fechar e continuar jejuando"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone Triunfante Central com Glow */}
        <div className="relative mt-2 mb-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#00C975] to-[#3AE18A] flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Trophy className="w-10 h-10 text-white fill-white/20 stroke-[2.2]" />
          </div>
          <span className="absolute -top-2 -right-2 text-2xl animate-bounce">
            ✨
          </span>
          <span className="absolute -bottom-1 -left-2 text-xl">
            🔥
          </span>
        </div>

        {/* Título de Conquista */}
        <span className="text-[11px] font-black tracking-wider uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2 border border-emerald-100">
          Meta 100% Concluída
        </span>
        <h2 
          id="titulo-conclusao-jejum"
          className="text-2xl font-black text-[#092244] tracking-tight leading-tight"
        >
          Parabéns pela vitória!
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-[270px] leading-relaxed">
          Você completou seu protocolo <strong className="text-[#092244] font-bold">{nomePlano}</strong> com disciplina exemplar e ativou benefícios celulares profundos.
        </p>

        {/* Grid de Métricas da Sessão */}
        <div className="w-full grid grid-cols-2 gap-2.5 my-5">
          {/* Card 1: Tempo Total */}
          <div className="bg-[#F5F9FC] rounded-2xl p-3 flex flex-col items-start border border-slate-100 text-left">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#00C975]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tempo Total</span>
            </div>
            <p className="text-lg font-black text-[#092244]">
              {horasTotais}h {minutosTotais > 0 ? `${minutosTotais}m` : ''}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600">
              Meta: {metaHoras}h atingida
            </span>
          </div>

          {/* Card 2: Tempo Extra / Autofagia */}
          <div className="bg-[#F0FAF5] rounded-2xl p-3 flex flex-col items-start border border-emerald-100/60 text-left">
            <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#00C975]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tempo Extra</span>
            </div>
            <p className="text-lg font-black text-[#00874E]">
              +{horasExtra > 0 ? `${horasExtra}h ` : ''}{minutosExtra}m
            </p>
            <span className="text-[10px] font-semibold text-emerald-700">
              Autofagia profunda
            </span>
          </div>

          {/* Card 3: Sequência / Streak */}
          <div className="bg-[#FFF9EE] rounded-2xl p-3 flex flex-col items-start border border-amber-100 text-left">
            <div className="flex items-center gap-1.5 text-amber-600 mb-1">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sequência</span>
            </div>
            <p className="text-lg font-black text-[#874D00]">
              Dia {diasConsecutivos + 1}
            </p>
            <span className="text-[10px] font-semibold text-amber-600">
              Novo recorde ativo!
            </span>
          </div>

          {/* Card 4: Hidratação */}
          <div className="bg-[#F0F6FF] rounded-2xl p-3 flex flex-col items-start border border-blue-100 text-left">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
              <Droplet className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Água Hoje</span>
            </div>
            <p className="text-lg font-black text-[#0E4999]">
              {aguaConsumidaMl} ml
            </p>
            <span className="text-[10px] font-semibold text-blue-600">
              Hidratação ótima
            </span>
          </div>
        </div>

        {/* Dica de Reintrodução Alimentar (Quebra do Jejum) */}
        <div className="w-full bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3 text-left mb-5">
          <p className="text-[11px] font-bold text-amber-900 leading-snug">
            💡 Dica para quebrar o jejum:
          </p>
          <p className="text-[11px] text-amber-800 leading-normal mt-0.5">
            Prefira refeições leves e ricas em proteínas magras, gorduras boas e folhas. Evite picos glicêmicos rápidos com carboidratos simples.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="w-full space-y-2">
          {/* Botão Principal: Salvar Conclusão */}
          <button
            type="button"
            onClick={onConfirmarConclusao}
            className="w-full py-3.5 px-6 rounded-full bg-[#00C975] hover:bg-[#00B568] text-white font-extrabold text-[15px] shadow-lg shadow-emerald-500/25 active:scale-95 transition-all min-h-[48px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Salvar vitória & Registrar</span>
          </button>

          {/* Botão Secundário: Continuar no Jejum */}
          <button
            type="button"
            onClick={onContinuarJejuando}
            className="w-full py-3 px-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all min-h-[44px] cursor-pointer"
          >
            Continuar no jejum (Tempo extra)
          </button>
        </div>
      </div>
    </div>
  );
};
