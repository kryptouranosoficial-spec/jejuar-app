/**
 * @file CarrosselDicasDoDia.tsx
 * @description Componente de carrossel de slides horizontais com temporizador automático (6 segundos),
 * barra de progresso visual estilo stories, pausa ao tocar para leitura, navegação por swipe touch
 * e conteúdos educativos de alto valor científico sobre jejum intermitente e hidratação.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Droplets, 
  Flame, 
  Brain, 
  Apple, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  BookOpen,
  CheckCircle2
} from 'lucide-react';

/** Estrutura de dados de uma dica educativa */
export interface DicaEducativa {
  id: string;
  categoria: 'hidratacao' | 'jejum' | 'metabolismo' | 'nutricao' | 'longevidade';
  rotuloCategoria: string;
  badgeCor: string;
  icone: React.ComponentType<{ className?: string }>;
  titulo: string;
  conteudo: string;
  dicaPratica: string;
  tempoLeitura: string;
}

/** Catálogo de conteúdos educativos curtos e acionáveis */
const DICAS_EDUCATIVAS: DicaEducativa[] = [
  {
    id: 'dica-hidratacao-eletrolitos',
    categoria: 'hidratacao',
    rotuloCategoria: 'Hidratação & Eletrólitos',
    badgeCor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    icone: Droplets,
    titulo: 'O segredo da pitada de sal na água',
    conteudo: 'Durante o jejum, os rins diminuem a retenção de sódio devido à queda da insulina. Se sentir dor de cabeça ou cansaço leve, uma pitada de sal integral na água repõe eletrólitos em poucos minutos.',
    dicaPratica: 'Adicione uma pitadinha de sal marinho em 300ml de água se notar moleza ou vertigem passageira.',
    tempoLeitura: '45 seg'
  },
  {
    id: 'dica-jejum-grelina',
    categoria: 'jejum',
    rotuloCategoria: 'Fisiologia do Jejum',
    badgeCor: 'bg-amber-50 text-amber-700 border-amber-200/60',
    icone: Flame,
    titulo: 'A fome não cresce sem parar: ela vem em ondas',
    conteudo: 'O hormônio grelina é liberado em horários regulares em que você costuma comer. Se você aguardar de 15 a 20 minutos com um copo de água ou chá, a onda passa naturalmente e a fome vai embora.',
    dicaPratica: 'Quando sentir vontade urgente de mastigar, tome água gelada e espere 15 minutos antes de tomar qualquer decisão.',
    tempoLeitura: '50 seg'
  },
  {
    id: 'dica-hidratacao-gas',
    categoria: 'hidratacao',
    rotuloCategoria: 'Truque de Saciedade',
    badgeCor: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
    icone: Sparkles,
    titulo: 'Água com gás: o melhor aliado contra a fome psicológica',
    conteudo: 'O gás carbônico natural presente na água gaseificada promove leve dilatação gástrica temporária, enviando sinais de saciedade ao cérebro e amenizando a vontade de petiscar sem quebrar o jejum.',
    dicaPratica: 'Esprema algumas gotas de limão puro na água com gás fresca para variar o sabor sem gerar calorias.',
    tempoLeitura: '40 seg'
  },
  {
    id: 'dica-metabolismo-cetose',
    categoria: 'metabolismo',
    rotuloCategoria: 'Clareza Mental',
    badgeCor: 'bg-purple-50 text-purple-700 border-purple-200/60',
    icone: Brain,
    titulo: 'Por que seu foco mental aumenta no jejum?',
    conteudo: 'Após 12 a 14 horas de jejum, o fígado passa a produzir corpos cetônicos (BHB) a partir da queima de gordura. Cetonas são um combustível limpo para os neurônios, gerando alta lucidez e menor sonolência.',
    dicaPratica: 'Aproveite a reta final do seu jejum para trabalhar em tarefas analíticas e estudos complexos.',
    tempoLeitura: '55 seg'
  },
  {
    id: 'dica-nutricao-quebra',
    categoria: 'nutricao',
    rotuloCategoria: 'Quebra Inteligente',
    badgeCor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    icone: Apple,
    titulo: 'A ordem dos alimentos ao quebrar o jejum',
    conteudo: 'Evite pães, sucos de frutas ou doces logo no primeiro bocado. Iniciar com ovos, azeite de oliva e salada prepara as enzimas digestivas e evita um pico repentino de glicemia seguido de moleza.',
    dicaPratica: 'Primeira garfada: proteínas e gorduras boas. Aguarde 10 minutos antes de consumir carboidratos complexos.',
    tempoLeitura: '50 seg'
  }
];

// Tempo de exibição de cada card antes de avançar para o próximo (6 segundos conforme solicitado)
const INTERVALO_TIMER_MS = 6000;
// Intervalo de atualização da barra de progresso visual (em milissegundos)
const TAXA_ATUALIZACAO_MS = 50;

export const CarrosselDicasDoDia: React.FC = () => {
  // Índice do card atualmente em exibição
  const [indiceAtual, setIndiceAtual] = useState<number>(0);
  // Progresso do timer de 0 a 100% para o slide ativo
  const [progressoTimer, setProgressoTimer] = useState<number>(0);
  // Controla se a rotação automática está em pausa pelo usuário
  const [estaPausado, setEstaPausado] = useState<boolean>(false);

  // Referência para guardar a posição inicial do toque para suporte a Swipe
  const toqueInicioX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalDicas = DICAS_EDUCATIVAS.length;

  /**
   * Avança para o próximo slide de maneira cíclica
   */
  const handleProximo = useCallback(() => {
    setIndiceAtual((prev) => (prev + 1) % totalDicas);
    setProgressoTimer(0);
  }, [totalDicas]);

  /**
   * Retorna ao slide anterior
   */
  const handleAnterior = useCallback(() => {
    setIndiceAtual((prev) => (prev - 1 + totalDicas) % totalDicas);
    setProgressoTimer(0);
  }, [totalDicas]);

  /**
   * Seleciona diretamente um slide específico ao clicar no dot indicador
   */
  const handleIrParaSlide = (index: number) => {
    setIndiceAtual(index);
    setProgressoTimer(0);
  };

  /**
   * Temporizador automático contínuo de 6 segundos
   * Avança suavemente e atualiza a barra de progresso
   */
  useEffect(() => {
    if (estaPausado) return;

    const incremento = (TAXA_ATUALIZACAO_MS / INTERVALO_TIMER_MS) * 100;

    const interval = setInterval(() => {
      setProgressoTimer((prev) => {
        if (prev >= 100) {
          handleProximo();
          return 0;
        }
        return prev + incremento;
      });
    }, TAXA_ATUALIZACAO_MS);

    return () => clearInterval(interval);
  }, [estaPausado, handleProximo]);

  /**
   * Início do gesto de toque (Swipe touch)
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    toqueInicioX.current = e.touches[0].clientX;
    setEstaPausado(true); // Pausa temporariamente enquanto o usuário está com o dedo na tela
  };

  /**
   * Fim do gesto de toque e cálculo do deslocamento horizontal
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (toqueInicioX.current !== null) {
      const deltaX = e.changedTouches[0].clientX - toqueInicioX.current;
      const limiteSensibilidade = 45; // Mínimo de 45px para caracterizar swipe intencional

      if (deltaX < -limiteSensibilidade) {
        // Deslize para a esquerda -> Próxima dica
        handleProximo();
      } else if (deltaX > limiteSensibilidade) {
        // Deslize para a direita -> Dica anterior
        handleAnterior();
      }
      toqueInicioX.current = null;
    }
    setEstaPausado(false); // Retoma o timer após soltar o dedo
  };

  const dicaAtiva = DICAS_EDUCATIVAS[indiceAtual];
  const IconeAtivo = dicaAtiva.icone;

  return (
    <section 
      className="pt-2 pb-6 select-none" 
      data-purpose="educational-tips-carousel-section"
      aria-label="Dicas do Dia sobre Jejum e Hidratação"
    >
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center">
            <BookOpen className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-[17px] font-black text-[#092244] leading-tight">
              Dica do Dia
            </h3>
            <p className="text-[11px] font-medium text-slate-400">
              Conteúdos práticos sobre jejum & hidratação
            </p>
          </div>
        </div>

        {/* Controles de Navegação Rápida e Pausa com Touch Targets de 44x44px */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEstaPausado((prev) => !prev)}
            title={estaPausado ? 'Retomar rotação automática' : 'Pausar leitura'}
            aria-label={estaPausado ? 'Retomar rotação automática' : 'Pausar leitura'}
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-90 transition-all rounded-full hover:bg-slate-100 cursor-pointer"
          >
            {estaPausado ? (
              <Play className="w-4 h-4 fill-slate-500 text-slate-500" />
            ) : (
              <Pause className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            type="button"
            onClick={handleAnterior}
            title="Dica anterior"
            aria-label="Dica anterior"
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-90 transition-all rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            type="button"
            onClick={handleProximo}
            title="Próxima dica"
            aria-label="Próxima dica"
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-90 transition-all rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 
        Container do Card em Slide Horizontal com Efeito 'Peek'
        Permite visualizar um pedaço sutil do próximo card à direita para convidar à exploração
      */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setEstaPausado(true)}
        onMouseLeave={() => setEstaPausado(false)}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden transition-all duration-300">
          
          {/* 
            Barra Superior de Progresso dos Slides (Estilo Stories)
            Cada segmento representa uma dica do catálogo
          */}
          <div className="flex items-center gap-1.5 mb-4">
            {DICAS_EDUCATIVAS.map((dica, index) => {
              const estaAtivo = index === indiceAtual;
              const jaPassou = index < indiceAtual;

              return (
                <div 
                  key={dica.id}
                  className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden"
                >
                  <div 
                    className="h-full bg-[#00C975] rounded-full transition-all duration-75 ease-linear"
                    style={{
                      width: estaAtivo 
                        ? `${progressoTimer}%` 
                        : jaPassou 
                          ? '100%' 
                          : '0%'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Topo do Card: Badge da Categoria e Tempo de Leitura */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-[#00C975]">
                <IconeAtivo className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${dicaAtiva.badgeCor}`}>
                {dicaAtiva.rotuloCategoria}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-slate-400">
              {dicaAtiva.tempoLeitura} de leitura
            </span>
          </div>

          {/* Título e Texto Principal com animação de transição suave */}
          <div className="space-y-2 mb-4">
            <h4 className="text-[16px] font-black text-[#092244] leading-snug">
              {dicaAtiva.titulo}
            </h4>
            <p className="text-[13px] text-slate-600 leading-relaxed font-normal">
              {dicaAtiva.conteudo}
            </p>
          </div>

          {/* Pílula / Caixa de Ação: Dica Prática */}
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#00C975] shrink-0 mt-0.5 stroke-[2.2]" />
            <div className="text-[12px] text-slate-700 leading-snug">
              <strong className="text-[#092244] font-bold">Como aplicar hoje: </strong>
              <span>{dicaAtiva.dicaPratica}</span>
            </div>
          </div>

          {/* Indicador inferior de pausa quando o usuário segura o dedo */}
          {estaPausado && (
            <div className="absolute right-4 bottom-3 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50 flex items-center gap-1 animate-pulse">
              <Pause className="w-2.5 h-2.5" />
              <span>Leitura pausada</span>
            </div>
          )}
        </div>
      </div>

      {/* Indicadores de Paginação em Dots (com Touch Targets acessíveis de 44x44px) */}
      <div className="flex items-center justify-center gap-1 mt-2">
        {DICAS_EDUCATIVAS.map((_, index) => {
          const estaAtivo = index === indiceAtual;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleIrParaSlide(index)}
              title={`Ir para a dica ${index + 1}`}
              aria-label={`Ir para a dica ${index + 1}`}
              className="w-11 h-11 flex items-center justify-center cursor-pointer select-none"
            >
              <span 
                className={`rounded-full transition-all duration-300 ${
                  estaAtivo 
                    ? 'w-6 h-2 bg-[#00C975]' 
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`} 
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};
