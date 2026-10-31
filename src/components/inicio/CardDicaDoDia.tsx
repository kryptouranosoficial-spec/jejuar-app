/**
 * @file CardDicaDoDia.tsx
 * @description Componente dinâmico de Dica do Dia e Recompensa da Caça (Biometria Revelada).
 * Alterna suavemente entre o catálogo de orientações metabólicas práticas e o motor de
 * cálculos biométricos revelados a cada marco (gramas de gordura oxidada, calorias lipídicas e autofagia).
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
  HeartPulse,
  Activity,
  Zap,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { vibrarClique, vibrarSucesso } from '../../utils/haptics';

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
  /** Peso atual do usuário em kg para cálculos de lipólise */
  pesoAtual?: number;
  /** Permite forçar externamente a exibição da aba 'dica' ou 'biometria' (ex: ao clicar na notificação) */
  abaSelecionada?: 'dica' | 'biometria';
}

export const CardDicaDoDia: React.FC<CardDicaDoDiaProps> = ({
  jejumAtivo,
  emJanelaAlimentacao,
  segundosJejum,
  horasJejumMeta = 16,
  pesoAtual = 72.4,
  abaSelecionada,
}) => {
  // Aba ativa: 'dica' (orientação prática) ou 'biometria' (recompensa da caça com métricas reveladas)
  const [abaAtiva, setAbaAtiva] = useState<'dica' | 'biometria'>(abaSelecionada || 'dica');

  // Sincroniza se o componente pai solicitar a troca para 'biometria' ou 'dica'
  React.useEffect(() => {
    if (abaSelecionada) {
      setAbaAtiva(abaSelecionada);
    }
  }, [abaSelecionada]);

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

  // Cálculos de Biometria Revelada (Recompensa da Caça baseada nas horas reais e peso do usuário)
  const biometria = useMemo(() => {
    const pesoValido = pesoAtual && pesoAtual > 30 ? pesoAtual : 72.4;
    const fatorPeso = pesoValido / 70;
    
    // Taxa de lipólise crescente conforme a insulina cai e a cetose aprofunda:
    let taxaGorduraHora = 1.2;
    if (horasDecorridas >= 36) taxaGorduraHora = 3.6;
    else if (horasDecorridas >= 24) taxaGorduraHora = 3.4;
    else if (horasDecorridas >= 16) taxaGorduraHora = 3.2;
    else if (horasDecorridas >= 12) taxaGorduraHora = 2.8;
    else if (horasDecorridas >= 8) taxaGorduraHora = 2.2;
    else if (horasDecorridas >= 4) taxaGorduraHora = 1.6;

    const gorduraGramas = Math.max(4, Math.round(horasDecorridas * taxaGorduraHora * fatorPeso));
    const caloriasLipidicas = Math.round(gorduraGramas * 9);

    // Marco atual desbloqueado e projeção do próximo marco fisiológico (4h até 168h)
    let marcoNome = 'Transição Metabólica & Digestão';
    let proximoMarcoTexto = `Faltam ${Math.max(0, 4 - horasDecorridas).toFixed(1)}h para Queda da Insulina (4h)`;
    let porcentagemAteProximo = Math.min(100, Math.round((horasDecorridas / 4) * 100));

    if (horasDecorridas >= 168) {
      marcoNome = 'Reprogramação Epigenética (7 Dias)';
      proximoMarcoTexto = 'Marco Lendário de 168h Atingido!';
      porcentagemAteProximo = 100;
    } else if (horasDecorridas >= 72) {
      marcoNome = 'Reinicialização Imunológica Plena (72h+)';
      proximoMarcoTexto = `Faltam ${(168 - horasDecorridas).toFixed(1)}h para o Marco de 168h`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 72) / (168 - 72)) * 100));
    } else if (horasDecorridas >= 48) {
      marcoNome = 'Biogênese Mitocondrial & Renovação Imune';
      proximoMarcoTexto = `Faltam ${(72 - horasDecorridas).toFixed(1)}h para Pico de Células-Tronco (72h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 48) / 24) * 100));
    } else if (horasDecorridas >= 36) {
      marcoNome = 'Cetose Máxima (100% Lipólise Visceral)';
      proximoMarcoTexto = `Faltam ${(48 - horasDecorridas).toFixed(1)}h para Renovação Imune (48h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 36) / 12) * 100));
    } else if (horasDecorridas >= 24) {
      marcoNome = 'Autofagia Profunda & Células-Tronco';
      proximoMarcoTexto = `Faltam ${(36 - horasDecorridas).toFixed(1)}h para Cetose Máxima (36h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 24) / 12) * 100));
    } else if (horasDecorridas >= 18) {
      marcoNome = 'Pico de HGH & Autofagia Acelerada';
      proximoMarcoTexto = `Faltam ${(24 - horasDecorridas).toFixed(1)}h para Células-Tronco (24h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 18) / 6) * 100));
    } else if (horasDecorridas >= 16) {
      marcoNome = 'Autofagia e Renovação Mitocondrial';
      proximoMarcoTexto = `Faltam ${(18 - horasDecorridas).toFixed(1)}h para Pico de HGH (18h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 16) / 2) * 100));
    } else if (horasDecorridas >= 14) {
      marcoNome = 'Queima Lipídica Profunda (14h+)';
      proximoMarcoTexto = `Faltam ${(16 - horasDecorridas).toFixed(1)}h para Autofagia Plena (16h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 14) / 2) * 100));
    } else if (horasDecorridas >= 12) {
      marcoNome = 'Cetose Nutricional & Foco Mental';
      proximoMarcoTexto = `Faltam ${(14 - horasDecorridas).toFixed(1)}h para Queima Profunda (14h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 12) / 2) * 100));
    } else if (horasDecorridas >= 8) {
      marcoNome = 'Lipólise Acelerada dos Adipócitos';
      proximoMarcoTexto = `Faltam ${(12 - horasDecorridas).toFixed(1)}h para Cetose Plena (12h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 8) / 4) * 100));
    } else if (horasDecorridas >= 4) {
      marcoNome = 'Queda da Insulina & Uso do Glicogênio';
      proximoMarcoTexto = `Faltam ${(8 - horasDecorridas).toFixed(1)}h para Queima de Gordura (8h)`;
      porcentagemAteProximo = Math.min(100, Math.round(((horasDecorridas - 4) / 4) * 100));
    }

    return {
      gorduraGramas,
      caloriasLipidicas,
      marcoNome,
      proximoMarcoTexto,
      porcentagemAteProximo,
    };
  }, [horasDecorridas, pesoAtual]);

  // Dica ativa com base no índice atual
  const dicaAtiva = catalogoDicasPorFase[indiceDica % catalogoDicasPorFase.length] || catalogoDicasPorFase[0];

  // Alterna suavemente para a próxima dica da mesma fase
  const handleProximaDica = () => {
    vibrarClique();
    setAnimando(true);
    setTimeout(() => {
      setIndiceDica((prev) => (prev + 1) % catalogoDicasPorFase.length);
      setAnimando(false);
    }, 150);
  };

  return (
    <section 
      className="bg-white rounded-3xl p-4 shadow-xs border border-amber-100/70 relative overflow-hidden select-none transition-all"
      data-purpose="metabolic-tip-and-hunt-reward"
    >
      {/* Detalhe estético de fundo decorativo */}
      <div 
        className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-amber-50/60 pointer-events-none blur-xl" 
        aria-hidden="true" 
      />

      <div className="relative z-10 space-y-3">
        {/* Seletor Superior de Abas: Dica Metabólica vs Biometria Revelada */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                vibrarClique();
                setAbaAtiva('dica');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] flex items-center gap-1.5 cursor-pointer ${
                abaAtiva === 'dica' 
                  ? 'bg-white text-[#092244] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Dica do Dia</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrarSucesso();
                setAbaAtiva('biometria');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] flex items-center gap-1.5 cursor-pointer relative ${
                abaAtiva === 'biometria' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Biometria</span>
              {/* Ponto de novidade/recompensa */}
              {jejumAtivo && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>
          </div>

          {/* Botão de Alternar Dica (visível apenas na aba de dicas) */}
          {abaAtiva === 'dica' && (
            <button
              type="button"
              onClick={handleProximaDica}
              title="Ver outra dica para esta fase"
              aria-label="Ver outra dica para esta fase"
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg active:scale-90 transition-all cursor-pointer min-h-[34px]"
            >
              <RefreshCw className={`w-3 h-3 stroke-[2.5] ${animando ? 'animate-spin' : ''}`} />
              <span>Outra dica</span>
            </button>
          )}

          {/* Badge de Horário na aba de Biometria */}
          {abaAtiva === 'biometria' && (
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              {jejumAtivo ? `${horasDecorridas.toFixed(1)}h decorridas` : 'Aguardando início'}
            </span>
          )}
        </div>

        {/* MODO 1: DICA METABÓLICA CLÁSSICA (100% PRESERVADA) */}
        {abaAtiva === 'dica' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-[#FFF7E6] px-2.5 py-1 rounded-full border border-amber-200/50 w-fit">
              {dicaAtiva.icone}
              <span className="truncate max-w-[240px]">{dicaAtiva.faseNome}</span>
            </div>

            <div className={`transition-opacity duration-150 ${animando ? 'opacity-0' : 'opacity-100'}`}>
              <h3 className="text-[15px] font-black text-[#092244] leading-snug mb-1">
                {dicaAtiva.titulo}
              </h3>
              <p className="text-[13px] text-gray-600 leading-relaxed font-normal">
                {dicaAtiva.texto}
              </p>
            </div>

            <div className="pt-1 border-t border-amber-100/50 flex items-center gap-1.5 text-xs text-amber-900/90 font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="text-[11.5px] font-semibold leading-tight">
                <strong>Dica prática:</strong> {dicaAtiva.dicaPratica}
              </span>
            </div>
          </div>
        )}

        {/* MODO 2: RECOMPENSA DA CAÇA (BIOMETRIA REVELADA COM CÁLCULOS DO CORPO) */}
        {abaAtiva === 'biometria' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Título do Marco Desbloqueado */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                Descoberta Celular Desbloqueada
              </span>
              <h3 className="text-sm font-black text-[#092244] leading-tight mt-0.5">
                {biometria.marcoNome}
              </h3>
            </div>

            {/* Grid com Estimativas Biométricas em Tempo Real */}
            <div className="grid grid-cols-2 gap-2">
              {/* Card 1: Gordura Pura Oxidada */}
              <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-100 rounded-2xl p-2.5 text-left">
                <div className="flex items-center gap-1 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-0.5">
                  <Flame className="w-3 h-3 fill-emerald-500" />
                  <span>Gordura Oxidada</span>
                </div>
                <span className="text-lg font-black text-[#092244] block leading-tight">
                  ~{biometria.gorduraGramas}g
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 leading-tight block">
                  Lipídios viscerais puros
                </span>
              </div>

              {/* Card 2: Energia Adiposa Consumida */}
              <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 border border-amber-100 rounded-2xl p-2.5 text-left">
                <div className="flex items-center gap-1 text-amber-700 text-[10px] font-black uppercase tracking-wider mb-0.5">
                  <Zap className="w-3 h-3 fill-amber-500" />
                  <span>Energia da Reserva</span>
                </div>
                <span className="text-lg font-black text-[#092244] block leading-tight">
                  ~{biometria.caloriasLipidicas} kcal
                </span>
                <span className="text-[10px] font-semibold text-amber-700 leading-tight block">
                  Extraídas do estoque
                </span>
              </div>
            </div>

            {/* Próximo Desbloqueio (Incerteza Preditiva) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500">
                {biometria.proximoMarcoTexto}
              </span>
              <span className="font-extrabold text-emerald-700">
                {biometria.porcentagemAteProximo}%
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
