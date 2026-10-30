/**
 * @file ModalSOSFome.tsx
 * @description Ferramenta de resgate metabólico e emocional contra o pico da grelina (Dia 3).
 * Oferece 3 passos guiados: Hidratação com eletrólitos, respiração guiada de 1 minuto
 * e evidência visual do orgulho celular (estimativa de queima lipídica e autofagia ativa).
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Droplet, 
  Wind, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { vibrarSucesso, vibrarClique } from '../../utils/haptics';

interface ModalSOSFomeProps {
  /** Se o modal está aberto na tela */
  aberto: boolean;
  /** Horas atuais em jejum */
  horasJejum: number;
  /** Volume de água atual do dia em ml */
  aguaConsumidaMl: number;
  /** Callback para adicionar água imediatamente (+250ml) */
  onAdicionarAgua: (ml: number) => void;
  /** Callback para fechar o modal */
  onFechar: () => void;
}

export const ModalSOSFome: React.FC<ModalSOSFomeProps> = ({
  aberto,
  horasJejum,
  aguaConsumidaMl,
  onAdicionarAgua,
  onFechar,
}) => {
  // Aba ativa do protocolo SOS (1: Hidratação, 2: Respiração, 3: Ciência Celular)
  const [passoAtivo, setPassoAtivo] = useState<'agua' | 'respiracao' | 'celula'>('agua');

  // Estado do exercício de respiração de 1 minuto
  const [segundosRespiracao, setSegundosRespiracao] = useState<number>(60);
  const [respirandoAtivo, setRespirandoAtivo] = useState<boolean>(false);
  const [faseRespiracao, setFaseRespiracao] = useState<'inspire' | 'segure' | 'expire'>('inspire');
  const [aguaAdicionada, setAguaAdicionada] = useState<boolean>(false);

  // Efeito do timer de respiração
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (respirandoAtivo && segundosRespiracao > 0) {
      timer = setInterval(() => {
        setSegundosRespiracao((prev) => {
          if (prev <= 1) {
            setRespirandoAtivo(false);
            vibrarSucesso();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [respirandoAtivo, segundosRespiracao]);

  // Ciclo da respiração (4s inspire, 4s segure, 4s expire)
  useEffect(() => {
    if (!respirandoAtivo) return;
    const ciclo = (60 - segundosRespiracao) % 12;
    if (ciclo < 4) {
      setFaseRespiracao('inspire');
    } else if (ciclo < 8) {
      setFaseRespiracao('segure');
    } else {
      setFaseRespiracao('expire');
    }
  }, [segundosRespiracao, respirandoAtivo]);

  // Se o modal for reaberto, restaura o passo inicial
  useEffect(() => {
    if (aberto) {
      setPassoAtivo('agua');
      setAguaAdicionada(false);
    }
  }, [aberto]);

  if (!aberto) return null;

  // Estimativa aproximada de gordura visceral oxidada com base nas horas de jejum (ex: ~2.5g por hora pós-12h)
  const gramasGorduraEstimadas = Math.max(12, Math.round(horasJejum * 2.8));

  const handleBeberAgua = () => {
    vibrarSucesso();
    onAdicionarAgua(250);
    setAguaAdicionada(true);
  };

  const alternarTimerRespiracao = () => {
    vibrarClique();
    setRespirandoAtivo((prev) => !prev);
  };

  const reiniciarRespiracao = () => {
    vibrarClique();
    setRespirandoAtivo(false);
    setSegundosRespiracao(60);
    setFaseRespiracao('inspire');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-sos-fome"
    >
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-rose-100 flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Glow de fundo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar no Topo */}
        <button
          type="button"
          onClick={onFechar}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition-all cursor-pointer z-10"
          aria-label="Fechar protocolo SOS Fome"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho do Protocolo */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-rose-500" />
            Protocolo de Resgate
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {horasJejum.toFixed(1)}h em curso
          </span>
        </div>

        <h2 
          id="titulo-sos-fome" 
          className="text-xl sm:text-2xl font-black text-[#092244] tracking-tight leading-tight"
        >
          Sentindo fome agora?
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
          O pico da grelina dura em média <strong>15 a 20 minutos</strong> e passa. Siga este protocolo em 3 passos para dominar a sua biologia:
        </p>

        {/* Abas dos 3 Passos */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 select-none">
          <button
            type="button"
            onClick={() => {
              vibrarClique();
              setPassoAtivo('agua');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center justify-center gap-1 cursor-pointer ${
              passoAtivo === 'agua' 
                ? 'bg-white text-blue-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
            <span>1. Água</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrarClique();
              setPassoAtivo('respiracao');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center justify-center gap-1 cursor-pointer ${
              passoAtivo === 'respiracao' 
                ? 'bg-white text-emerald-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Respirar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrarClique();
              setPassoAtivo('celula');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center justify-center gap-1 cursor-pointer ${
              passoAtivo === 'celula' 
                ? 'bg-white text-purple-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>3. Ciência</span>
          </button>
        </div>

        {/* Conteúdo do Passo 1: Hidratação e Eletrólitos */}
        {passoAtivo === 'agua' && (
          <div className="flex flex-col items-center text-center space-y-3 py-1">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shadow-inner">
              <Droplet className="w-8 h-8 fill-blue-500" />
            </div>

            <h3 className="text-base font-extrabold text-[#092244]">
              Seu cérebro pode estar com sede
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-[320px]">
              O centro cerebral da fome e da sede no hipotálamo utiliza as mesmas vias. Na maioria das vezes, um copo d’água (opcionalmente com uma pitadinha de sal mineral) silencia o sinal da grelina em 5 minutos.
            </p>

            {/* Ação de Beber Água */}
            <div className="w-full pt-2">
              <button
                type="button"
                onClick={handleBeberAgua}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer min-h-[46px]"
              >
                {aguaAdicionada ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>+250ml Registrados com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Droplet className="w-4 h-4 fill-white" />
                    <span>Tomei um copo de água (+250ml)</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                vibrarClique();
                setPassoAtivo('respiracao');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 pt-1 flex items-center gap-1 cursor-pointer min-h-[44px]"
            >
              <span>Avançar para Passo 2: Respiração Guiada</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Conteúdo do Passo 2: Respiração Guiada de 1 Minuto */}
        {passoAtivo === 'respiracao' && (
          <div className="flex flex-col items-center text-center space-y-3 py-1">
            {/* Círculo Pulsante da Respiração */}
            <div className="relative w-36 h-36 flex items-center justify-center my-1">
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  faseRespiracao === 'inspire' 
                    ? 'scale-100 bg-emerald-200/50' 
                    : faseRespiracao === 'segure' 
                      ? 'scale-95 bg-amber-200/50 ring-4 ring-amber-300' 
                      : 'scale-75 bg-blue-200/50'
                }`}
              />
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-2xl font-black text-[#092244]">
                  {segundosRespiracao}s
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  {faseRespiracao === 'inspire' ? 'Inspire...' : faseRespiracao === 'segure' ? 'Segure...' : 'Expire...'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-[320px]">
              Respirar ritmadamente por 60 segundos diminui o cortisol e desacelera as contrações gástricas de ansiedade alimentar.
            </p>

            {/* Controles da Respiração */}
            <div className="flex items-center gap-2 pt-1 w-full">
              <button
                type="button"
                onClick={alternarTimerRespiracao}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer min-h-[46px]"
              >
                {respirandoAtivo ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>{segundosRespiracao === 60 ? 'Iniciar 1 Minuto' : 'Continuar'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={reiniciarRespiracao}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Reiniciar timer"
                aria-label="Reiniciar respiração"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                vibrarClique();
                setPassoAtivo('celula');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 pt-1 flex items-center gap-1 cursor-pointer min-h-[44px]"
            >
              <span>Avançar para Passo 3: Ciência Celular</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Conteúdo do Passo 3: Orgulho Biológico e Ciência Celular */}
        {passoAtivo === 'celula' && (
          <div className="flex flex-col items-center text-center space-y-3 py-1">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-base font-extrabold text-[#092244]">
              A fome é gordura sendo consumida
            </h3>

            {/* Card com Dados Celulares Dinâmicos */}
            <div className="w-full bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-3.5 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900">
                  Gordura Pura Oxidada Hoje:
                </span>
                <span className="text-sm font-black text-purple-700">
                  ~{gramasGorduraEstimadas}g
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900">
                  Nível de Autofagia:
                </span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {horasJejum >= 16 ? 'Autofagia Máxima' : horasJejum >= 12 ? 'Cetose Ativa' : 'Transição Metabólica'}
                </span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed pt-1 border-t border-purple-200/50">
                Você não está sem energia: seu corpo está queimando seu próprio estoque de gordura visceral para manter seu foco e limpar mitocôndrias envelhecidas.
              </p>
            </div>

            {/* Botão de Concluir Protocolo de Resgate */}
            <div className="w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  vibrarSucesso();
                  onFechar();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#00C975] hover:bg-[#00B568] active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/25 cursor-pointer min-h-[46px]"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Estou no controle do meu corpo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
