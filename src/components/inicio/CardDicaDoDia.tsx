/**
 * @file CardDicaDoDia.tsx
 * @description Componente dinâmico 'Dica do Dia' para a tela inicial do aplicativo Jejuar.
 * Exibe conteúdos curtos e acionáveis baseados no progresso metabólico em tempo real do usuário,
 * com orientações sobre o que consumir, sensações esperadas e botão para alternar entre dicas da mesma fase.
 */

import React, { useState, useMemo } from 'react';
import { 
  Lightbulb, 
  RefreshCw, 
  Flame, 
  Sparkles, 
  Droplets, 
  Brain, 
  Apple, 
  Dna,
  HeartPulse
} from 'lucide-react';

interface DicaMetabolica {
  id: string;
  faseNome: string;
  titulo: string;
  texto: string;
  dicaPratica: string;
  badge: string;
  icone: React.ReactNode;
}

interface CardDicaDoDiaProps {
  /** Se o usuário está atualmente em sessão de jejum */
  jejumAtivo: boolean;
  /** Se o usuário está atualmente na janela de alimentação aberta */
  emJanelaAlimentacao: boolean;
  /** Total de segundos decorridos no jejum atual */
  segundosJejum: number;
  /** Meta de horas estipulada para o jejum */
  horasJejumMeta?: number;
}

export const CardDicaDoDia: React.FC<CardDicaDoDiaProps> = ({
  jejumAtivo,
  emJanelaAlimentacao,
  segundosJejum,
}) => {
  // Índice para alternar entre as dicas da mesma fase
  const [indiceDica, setIndiceDica] = useState<number>(0);
  const [animando, setAnimando] = useState<boolean>(false);

  // Determina a fase metabólica atual em horas
  const horasDecorridas = jejumAtivo ? segundosJejum / 3600 : 0;

  // Catálogo rico e cientificamente embasado de dicas por estágio metabólico
  const catalogoDicasPorFase: DicaMetabolica[] = useMemo(() => {
    // 1. Janela de Alimentação Aberta (Pós-jejum)
    if (emJanelaAlimentacao) {
      return [
        {
          id: 'janela-1',
          faseNome: 'Janela de Alimentação',
          titulo: 'Como quebrar o jejum com inteligência',
          texto: 'Evite carboidratos pesados ou açúcar logo na primeira refeição. Inicie com ovos, azeite de oliva, folhas verdes e proteínas magras para manter sua sensibilidade à insulina alta.',
          dicaPratica: 'Espere 15 minutos antes de comer o prato principal.',
          badge: 'Quebra Segura',
          icone: <Apple className="w-4 h-4 text-emerald-600" />
        },
        {
          id: 'janela-2',
          faseNome: 'Janela de Alimentação',
          titulo: 'Mastigação e saciedade consciente',
          texto: 'Seu sistema gastrointestinal descansou por horas. Mastigue cada garfada com calma e coma até atingir cerca de 80% de saciedade para evitar letargia e indigestão.',
          dicaPratica: 'Beba líquidos apenas 30 minutos após a refeição.',
          badge: 'Digestão Leve',
          icone: <HeartPulse className="w-4 h-4 text-emerald-600" />
        }
      ];
    }

    // 2. Jejum Inativo (Aguardando o usuário iniciar o timer)
    if (!jejumAtivo) {
      return [
        {
          id: 'inativo-1',
          faseNome: 'Preparação do Jejum',
          titulo: 'Prepare sua última refeição',
          texto: 'Priorize fontes saudáveis de gorduras e proteínas antes de acionar o timer. Isso retarda a digestão gástrica e ameniza picos precoces de apetite.',
          dicaPratica: 'Beba um bom copo de água 30 min antes da refeição.',
          badge: 'Nutrição Estratégica',
          icone: <Droplets className="w-4 h-4 text-[#2F80ED]" />
        },
        {
          id: 'inativo-2',
          faseNome: 'Preparação do Jejum',
          titulo: 'Defina o seu melhor horário',
          texto: 'Muitos adeptos preferem jejuar durante o sono, aproveitando 8 horas de repouso natural para cumprir metade do protocolo sem esforço.',
          dicaPratica: 'Inicie logo após o jantar para acordar com 12h completas.',
          badge: 'Rotina Otimizada',
          icone: <Sparkles className="w-4 h-4 text-amber-500" />
        }
      ];
    }

    // 3. Estágio 0h a 4h: Digestão e Queda de Glicemia
    if (horasDecorridas < 4) {
      return [
        {
          id: 'fase1-1',
          faseNome: '0h – 4h · Digestão e Estabilização',
          titulo: 'Glicemia e insulina diminuindo',
          texto: 'Seu corpo está finalizando a digestão. Qualquer pontada de vontade de comer agora é puramente psicológica ou um reflexo de hábito de beliscar.',
          dicaPratica: 'Beba água mineral ou chá de camomila sem açúcar.',
          badge: 'Estabilização',
          icone: <Droplets className="w-4 h-4 text-[#2F80ED]" />
        },
        {
          id: 'fase1-2',
          faseNome: '0h – 4h · Digestão e Estabilização',
          titulo: 'Distraia o cérebro das rotinas automáticas',
          texto: 'Se costuma mastigar enquanto assiste TV ou trabalha, troque o alimento sólido por água com gás fresca e algumas gotas de limão espremido.',
          dicaPratica: 'Água com gás proporciona saciedade gástrica imediata.',
          badge: 'Truque Saudável',
          icone: <Lightbulb className="w-4 h-4 text-amber-500" />
        }
      ];
    }

    // 4. Estágio 4h a 8h: Transição e Esvaziamento do Glicogênio
    if (horasDecorridas < 8) {
      return [
        {
          id: 'fase2-1',
          faseNome: '4h – 8h · Esvaziamento de Glicogênio',
          titulo: 'Ondas passageiras de fome (Grelina)',
          texto: 'A grelina (hormônio do apetite) surge em picos que duram cerca de 15 a 20 minutos e depois diminuem sozinhos. O corpo está gastando as reservas hepáticas.',
          dicaPratica: 'Tome 250ml de água e aguarde 15 minutos: o pico vai passar.',
          badge: 'Ondas Naturais',
          icone: <HeartPulse className="w-4 h-4 text-[#FA8C16]" />
        },
        {
          id: 'fase2-2',
          faseNome: '4h – 8h · Esvaziamento de Glicogênio',
          titulo: 'Acelere com chá verde ou de ervas',
          texto: 'Os polifenóis do chá verde estimulam o metabolismo e reduzem a percepção de fome, além de auxiliarem na modulação antioxidante do fígado.',
          dicaPratica: 'Consuma chás puros, sem açúcar ou adoçantes artificiais.',
          badge: 'Termogênico Leve',
          icone: <Sparkles className="w-4 h-4 text-emerald-600" />
        }
      ];
    }

    // 5. Estágio 8h a 12h: Início da Queima de Gordura (Lipólise)
    if (horasDecorridas < 12) {
      return [
        {
          id: 'fase3-1',
          faseNome: '8h – 12h · Queima de Gordura Ativa',
          titulo: 'Seu corpo virou uma máquina de queima',
          texto: 'Com o glicogênio quase esgotado, os adipócitos liberam ácidos graxos na circulação para virar energia. Uma sensação agradável de leveza começa agora.',
          dicaPratica: 'Ótimo momento para caminhadas leves de 20 minutos.',
          badge: 'Lipólise Ativa',
          icone: <Flame className="w-4 h-4 text-[#FA8C16]" />
        },
        {
          id: 'fase3-2',
          faseNome: '8h – 12h · Queima de Gordura Ativa',
          titulo: 'Atenção aos eletrólitos naturais',
          texto: 'Quando a insulina cai, os rins eliminam mais sódio e água. Se sentir um leve peso na cabeça, adicione uma pitada de sal marinho na água para repor minerais.',
          dicaPratica: 'Uma pitadinha de sal rosa ou marinho na água restaura o equilíbrio.',
          badge: 'Equilíbrio Mineral',
          icone: <Droplets className="w-4 h-4 text-[#2F80ED]" />
        }
      ];
    }

    // 6. Estágio 12h a 16h: Cetose e Alta Clareza Mental
    if (horasDecorridas < 16) {
      return [
        {
          id: 'fase4-1',
          faseNome: '12h – 16h · Cetose e Foco Mental',
          titulo: 'Cetonas alimentando seu cérebro',
          texto: 'O fígado transforma gordura em corpos cetônicos (BHB). Cetonas atravessam a barreira hematoencefálica e proporcionam foco aguçado e menor fadiga mental.',
          dicaPratica: 'Aproveite esta janela para tarefas intelectuais complexas.',
          badge: 'Super Foco',
          icone: <Brain className="w-4 h-4 text-purple-600" />
        },
        {
          id: 'fase4-2',
          faseNome: '12h – 16h · Cetose e Foco Mental',
          titulo: 'Café preto puro como catalisador',
          texto: 'O café preto acelera a conversão de ácidos graxos e aumenta a autofagia hepática. Não adicione adoçantes para não ativar receptores do paladar doce.',
          dicaPratica: 'Um espresso puro sem açúcar preserva 100% o jejum.',
          badge: 'Catalisador',
          icone: <Sparkles className="w-4 h-4 text-amber-600" />
        }
      ];
    }

    // 7. Estágio 16h+: Autofagia e Renovação Celular Profunda
    return [
      {
        id: 'fase5-1',
        faseNome: '16h+ · Autofagia e Limpeza Celular',
        titulo: 'Reciclagem e rejuvenescimento celular',
        texto: 'A autofagia atinge seu ápice: as células eliminam proteínas danificadas e mitocôndrias velhas, renovando os tecidos do organismo de dentro para fora.',
        dicaPratica: 'Mantenha-se bem hidratado com água mineral rica em magnésio.',
        badge: 'Renovação Celular',
        icone: <Dna className="w-4 h-4 text-emerald-600" />
      },
      {
        id: 'fase5-2',
        faseNome: '16h+ · Autofagia e Limpeza Celular',
        titulo: 'Respeite os limites do seu corpo',
        texto: 'Você já atingiu os maiores benefícios do protocolo. Se sentir cansaço extremo ou fraqueza, encerre seu jejum com tranquilidade: consistência supera heroísmo.',
        dicaPratica: 'Planeje sua quebra de jejum com alimentos nutritivos e leves.',
        badge: 'Longevidade',
        icone: <HeartPulse className="w-4 h-4 text-rose-500" />
      }
    ];
  }, [emJanelaAlimentacao, jejumAtivo, horasDecorridas]);

  // Dica ativa com base no índice atual
  const dicaAtiva = catalogoDicasPorFase[indiceDica % catalogoDicasPorFase.length] || catalogoDicasPorFase[0];

  // Alterna suavemente para a próxima dica da mesma fase
  const handleProximaDica = () => {
    setAnimando(true);
    setTimeout(() => {
      setIndiceDica((prev) => (prev + 1) % catalogoDicasPorFase.length);
      setAnimando(false);
    }, 150);
  };

  return (
    <section 
      className="bg-white rounded-2xl p-4 shadow-xs border border-amber-100/70 relative overflow-hidden select-none transition-all"
      data-purpose="metabolic-tip-of-the-day"
    >
      {/* Detalhe estético sutil de fundo decorativo */}
      <div 
        className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-amber-50/60 pointer-events-none blur-xl" 
        aria-hidden="true" 
      />

      <div className="relative z-10 space-y-2.5">
        {/* Topo do Card: Badge da Fase e Botão de Alternar Dica */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-[#FFF7E6] px-2.5 py-1 rounded-full border border-amber-200/50">
            {dicaAtiva.icone}
            <span className="truncate max-w-[210px]">{dicaAtiva.faseNome}</span>
          </div>

          {/* Botão de Alternar Dica com touch target >= 44x44px */}
          <button
            type="button"
            onClick={handleProximaDica}
            title="Ver outra dica para esta fase"
            aria-label="Ver outra dica para esta fase"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 rounded-lg active:scale-90 transition-all cursor-pointer min-h-[36px]"
          >
            <RefreshCw className={`w-3 h-3 stroke-[2.5] ${animando ? 'animate-spin' : ''}`} />
            <span>Outra dica</span>
          </button>
        </div>

        {/* Título e Conteúdo com animação de fade suave */}
        <div className={`transition-opacity duration-150 ${animando ? 'opacity-0' : 'opacity-100'}`}>
          <h3 className="text-[15px] font-black text-[#092244] leading-snug mb-1">
            {dicaAtiva.titulo}
          </h3>
          <p className="text-[13px] text-gray-600 leading-relaxed font-normal">
            {dicaAtiva.texto}
          </p>
        </div>

        {/* Rodapé: Dica Prática em Destaque */}
        <div className="pt-1 border-t border-amber-100/50 flex items-center gap-1.5 text-xs text-amber-900/90 font-medium">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span className="text-[11.5px] font-semibold leading-tight">
            <strong>Dica prática:</strong> {dicaAtiva.dicaPratica}
          </span>
        </div>
      </div>
    </section>
  );
};
