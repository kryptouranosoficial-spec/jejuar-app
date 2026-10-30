/**
 * @file ModalResilienciaConsistencia.tsx
 * @description Modal de Posicionamento de Resiliência (Top % de Consistência e Status Biológico).
 * Compara a sequência ininterrupta de dias consecutivos do usuário com a coorte da comunidade,
 * destacando a superação da barreira das 72h e promovendo prestígio e aversão à perda.
 */

import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Trophy, 
  TrendingUp, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Zap,
  Award
} from 'lucide-react';
import { vibrarClique, vibrarSucesso } from '../../utils/haptics';

interface ModalResilienciaConsistenciaProps {
  /** Se o modal está aberto */
  aberto: boolean;
  /** Sequência atual de dias consecutivos */
  diasConsecutivos: number;
  /** Callback para fechar o modal */
  onFechar: () => void;
}

export const ModalResilienciaConsistencia: React.FC<ModalResilienciaConsistenciaProps> = ({
  aberto,
  diasConsecutivos,
  onFechar,
}) => {
  const [copiado, setCopiado] = useState<boolean>(false);

  if (!aberto) return null;

  // Determina o percentil e a narrativa de status baseada na sequência
  const obterDadosPercentil = (dias: number) => {
    if (dias >= 30) {
      return {
        topPercentil: 'Top 0.5%',
        tituloNivel: 'Metabolismo Lendário',
        corBadge: 'bg-amber-500 text-white',
        corBorda: 'border-amber-200',
        descricaoStatus: 'Você atingiu o patamar mais exclusivo de consistência celular do Jejuar.',
        beneficioCelular: 'Reprogramação epigenética completa e ritmo circadiano perfeitamente adaptado.',
        posicaoGrafico: 96,
      };
    }
    if (dias >= 15) {
      return {
        topPercentil: 'Top 2%',
        tituloNivel: 'Mestre da Autofagia',
        corBadge: 'bg-emerald-600 text-white',
        corBorda: 'border-emerald-200',
        descricaoStatus: 'Sua disciplina supera 98% de todos os praticantes de jejum intermitente.',
        beneficioCelular: 'Biogênese mitocondrial acelerada e queima lipídica como combustível primário.',
        posicaoGrafico: 88,
      };
    }
    if (dias >= 8) {
      return {
        topPercentil: 'Top 5%',
        tituloNivel: 'Disciplina de Elite',
        corBadge: 'bg-emerald-500 text-white',
        corBorda: 'border-emerald-200',
        descricaoStatus: 'Você está no grupo mais resiliente e consistente da comunidade nesta semana.',
        beneficioCelular: 'Queda drástica de inflamação visceral e sensibilidade à insulina restaurada.',
        posicaoGrafico: 80,
      };
    }
    if (dias >= 5) {
      return {
        topPercentil: 'Top 12%',
        tituloNivel: 'Consistência Avançada',
        corBadge: 'bg-teal-600 text-white',
        corBorda: 'border-teal-200',
        descricaoStatus: 'Mais de 88% das pessoas desistem antes de atingir o 5º dia ininterrupto.',
        beneficioCelular: 'Estabilidade glicêmica plena e ausência de névoa mental pela manhã.',
        posicaoGrafico: 68,
      };
    }
    if (dias >= 3) {
      return {
        topPercentil: 'Top 25%',
        tituloNivel: 'Superou as 72 Horas',
        corBadge: 'bg-blue-600 text-white',
        corBorda: 'border-blue-200',
        descricaoStatus: 'Você venceu o momento mais difícil: o pico inicial da grelina do 3º dia.',
        beneficioCelular: 'Transição da queima de açúcar para uso de gordura estocada em andamento.',
        posicaoGrafico: 52,
      };
    }
    return {
      topPercentil: 'Top 45%',
      tituloNivel: 'Início Promissor',
      corBadge: 'bg-slate-700 text-white',
      corBorda: 'border-slate-200',
      descricaoStatus: 'Você deu o passo mais importante: começar a construir seu hábito diário.',
      beneficioCelular: 'Esvaziamento do glicogênio hepático e ativação das primeiras enzimas de autofagia.',
      posicaoGrafico: 35,
    };
  };

  const dados = obterDadosPercentil(diasConsecutivos);

  const handleCompartilhar = async () => {
    vibrarSucesso();
    const textoCompartilhamento = `🔥 Conquistei ${diasConsecutivos} dias consecutivos no app Jejuar e alcancei o ${dados.topPercentil} mais disciplinados! Minha saúde metabólica em outro nível. 💪`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Progresso no Jejuar',
          text: textoCompartilhamento,
        });
        return;
      } catch {
        // Fallback para cópia
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(textoCompartilhamento);
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
      aria-labelledby="titulo-resiliencia"
    >
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Glow de fundo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={() => {
            vibrarClique();
            onFechar();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition-all cursor-pointer z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone de Prestígio e Sequência */}
        <div className="relative mt-2 mb-3">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#00C975] to-[#25D366] flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Flame className="w-10 h-10 fill-white/30 stroke-[2.2]" />
          </div>
          <span className="absolute -bottom-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-xs">
            {dados.topPercentil}
          </span>
        </div>

        {/* Badge de Nível */}
        <span className={`text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-1 shadow-xs ${dados.corBadge}`}>
          {dados.tituloNivel}
        </span>

        <h2 
          id="titulo-resiliencia"
          className="text-2xl font-black text-[#092244] tracking-tight leading-tight mt-1"
        >
          {diasConsecutivos} Dias de Sequência
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed max-w-[290px]">
          {dados.descricaoStatus}
        </p>

        {/* Gráfico Visual de Distribuição da Comunidade (Curva de Retenção) */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-4 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Curva de Consistência
            </span>
            <span className="text-emerald-700 font-extrabold">{dados.topPercentil}</span>
          </div>

          {/* Barra de Progresso com Marcador do Usuário */}
          <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-visible mb-2">
            {/* Gradiente da curva */}
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-400 via-teal-400 to-[#00C975] transition-all duration-700"
              style={{ width: `${dados.posicaoGrafico}%` }}
            />
            {/* Pino do Usuário */}
            <div 
              className="absolute -top-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-600 shadow-md flex items-center justify-center -translate-x-1/2 transition-all duration-700"
              style={{ left: `${dados.posicaoGrafico}%` }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Legendas da Curva */}
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <span>Dia 1 (Início)</span>
            <span className="text-rose-500">Dia 3 (Barreira 72h)</span>
            <span className="text-emerald-600 font-black">Você ({diasConsecutivos}d)</span>
          </div>
        </div>

        {/* Card de Impacto Biológico Acumulado */}
        <div className="w-full bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-left mb-5">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
            <span>Seu Ganho Celular Acumulado:</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            {dados.beneficioCelular}
          </p>
        </div>

        {/* Botão de Compartilhar Conquista */}
        <button
          type="button"
          onClick={handleCompartilhar}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#00C975] hover:bg-[#00B568] active:scale-95 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-500/25 cursor-pointer min-h-[46px] flex items-center justify-center gap-2 mb-2"
        >
          {copiado ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Texto Copiado para Compartilhar!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Compartilhar meu Top {dados.topPercentil}</span>
            </>
          )}
        </button>

        {/* Botão Secundário Fechar */}
        <button
          type="button"
          onClick={() => {
            vibrarClique();
            onFechar();
          }}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 active:scale-95 transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
        >
          Voltar ao meu jejum
        </button>
      </div>
    </div>
  );
};
