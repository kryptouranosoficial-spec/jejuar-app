/**
 * @file ModalEstagioJejum.tsx
 * @description Modal informativo e científico dos estágios metabólicos do jejum.
 * Exibe detalhadamente o que acontece nas células, hormônios e queima de gordura
 * ao longo de cada janela de tempo do jejum intermitente.
 */

import React from 'react';
import { 
  X, 
  Utensils, 
  TrendingDown, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Activity,
  Dna,
  Droplet,
  Lightbulb,
  Ban
} from 'lucide-react';

/** Estrutura descritiva de cada estágio metabólico */
export interface EstagioMetabolico {
  id: string;
  numero: number;
  titulo: string;
  faixaHoras: string;
  horaInicio: number;
  horaFim: number | null; // null para estágios sem limite superior definido
  iconeNome: 'utensils' | 'trending-down' | 'flame' | 'zap' | 'shield' | 'dna';
  oQueAcontece: string;
  estadoMetabolico: string;
  beneficioPrincipal: string;
  sensacaoComum: string;
  guiaPratico: {
    oQueBeber: string;
    oQueFazer: string;
    oQueEvitar: string;
  };
}

/** Catálogo científico dos 6 estágios fisiológicos do jejum */
export const ESTAGIOS_METABOLICOS: EstagioMetabolico[] = [
  {
    id: 'estagio_1',
    numero: 1,
    titulo: 'Digestão & Absorção',
    faixaHoras: '0h a 4h',
    horaInicio: 0,
    horaFim: 4,
    iconeNome: 'utensils',
    oQueAcontece: 'Após a refeição, os nutrientes estão sendo digeridos e absorvidos no trato digestivo. A glicose sobe e o pâncreas libera picos de insulina para transportar o açúcar para dentro das células e estocar glicogênio no fígado.',
    estadoMetabolico: 'Modo de armazenamento de energia. A queima de gordura fica temporariamente inibida pela presença da insulina.',
    beneficioPrincipal: 'Absorção eficiente de vitaminas, proteínas e minerais essenciais para o tecido muscular.',
    sensacaoComum: 'Saciedade inicial, energia estável pós-prandial ou leve letargia digestiva nas primeiras 2 horas.',
    guiaPratico: {
      oQueBeber: 'Água mineral à vontade e chás digestivos sem açúcar (camomila, hortelã ou erva-doce).',
      oQueFazer: 'Faça uma caminhada leve de 10 a 15 minutos para diminuir o pico glicêmico pós-refeição e reduzir a sonolência.',
      oQueEvitar: 'Beliscar pequenos petiscos, tomar sucos ou café com leite (isso reinicia o ciclo digestivo e bloqueia a queima de gordura).'
    }
  },
  {
    id: 'estagio_2',
    numero: 2,
    titulo: 'Queda da Insulina & Estabilização',
    faixaHoras: '4h a 8h',
    horaInicio: 4,
    horaFim: 8,
    iconeNome: 'trending-down',
    oQueAcontece: 'A digestão encerra e a absorção alimentar diminui. A taxa de glicose no sangue estabiliza e os níveis de insulina caem fortemente. O pâncreas começa a secretar glucagon e o fígado passa a quebrar glicogênio estocado para manter a energia.',
    estadoMetabolico: 'Transição suave: o organismo encerra o modo digestivo e passa para a manutenção da homeostase.',
    beneficioPrincipal: 'Queda na inflamação digestiva e início da restauração da sensibilidade dos receptores de insulina.',
    sensacaoComum: 'Digestão leve, sensação de estômago descansado e recuperação da atenção.',
    guiaPratico: {
      oQueBeber: 'Água com gás e rodelas de limão espremido, café preto puro ou chá verde sem açúcar.',
      oQueFazer: 'Mantenha-se ocupado em tarefas intelectuais ou de trabalho. Se sentir vontade psicológica de mastigar, escove os dentes.',
      oQueEvitar: 'Ficar perto da cozinha, abrir a despensa ou assistir a vídeos de receitas culinárias enquanto a insulina está caindo.'
    }
  },
  {
    id: 'estagio_3',
    numero: 3,
    titulo: 'Queima de Gordura Inicial',
    faixaHoras: '8h a 12h',
    horaInicio: 8,
    horaFim: 12,
    iconeNome: 'flame',
    oQueAcontece: 'As reservas de glicogênio hepático começam a se esgotar. A enzima Lípase Hormônio-Sensível (HSL) é ativada pela queda da insulina, mobilizando triglicerídeos dos adipócitos diretamente para a circulação para serem oxidados.',
    estadoMetabolico: 'Virada metabólica (Metabolic Switch): o corpo começa a quebrar gordura como combustível primário.',
    beneficioPrincipal: 'Aceleração real da oxidação de ácidos graxos e início da queima de gordura visceral.',
    sensacaoComum: 'Possível onda momentânea de apetite (pico de grelina) que desaparece em 20 minutos com hidratação.',
    guiaPratico: {
      oQueBeber: 'Copo grande de água fria com uma pitadinha de sal integral/marinho (elimina fraqueza e dor de cabeça em minutos), chá de gengibre ou café expresso puro.',
      oQueFazer: 'Quando a fome bater, espere 20 minutos: o hormônio grelina vem em ondas e passa sozinho. Beba água e respire fundo.',
      oQueEvitar: 'Ceder ao impulso momentâneo achando que terá hipoglicemia; seu fígado está ativando a queima de gordura corporal.'
    }
  },
  {
    id: 'estagio_4',
    numero: 4,
    titulo: 'Cetose Leve & Clareza Mental',
    faixaHoras: '12h a 16h',
    horaInicio: 12,
    horaFim: 16,
    iconeNome: 'zap',
    oQueAcontece: 'O fígado converte ácidos graxos em corpos cetônicos (beta-hidroxibutirato). As cetonas atravessam a barreira hematoencefálica, alimentando neurônios de forma muito eficiente. O hormônio do crescimento (HGH) começa a se elevar.',
    estadoMetabolico: 'Cetose nutricional ativa: energia celular limpa sem oscilações bruscas de glicose.',
    beneficioPrincipal: 'Preservação de massa magra via HGH, maior foco mental e supressão natural da fome pelas cetonas.',
    sensacaoComum: 'Mente nítida, maior facilidade de concentração e estabilidade de humor.',
    guiaPratico: {
      oQueBeber: 'Água abundante (mínimo de 500ml a cada 2h), café preto puro ou chá mate tostado sem adoçantes calóricos.',
      oQueFazer: 'Aproveite a clareza mental das cetonas para estudar, trabalhar em projetos difíceis ou fazer treinos aeróbicos moderados.',
      oQueEvitar: 'Bebidas com adoçantes artificiais em excesso (sucralose, maltitol), pois podem provocar estímulo cefálico de insulina.'
    }
  },
  {
    id: 'estagio_5',
    numero: 5,
    titulo: 'Autofagia Celular Ativada',
    faixaHoras: '16h a 24h',
    horaInicio: 16,
    horaFim: 24,
    iconeNome: 'shield',
    oQueAcontece: 'O sensor celular mTOR é desativado e a via AMPK é intensamente acionada. Ocorre a autofagia (Nobel 2016): as células decompõem e reciclam mitocôndrias velhas, restos proteicos danificados e agentes oxidativos.',
    estadoMetabolico: 'Faxina e renovação celular de alta intensidade com queima máxima de reservas lipídicas.',
    beneficioPrincipal: 'Reciclagem de estruturas celulares defeituosas, rejuvenescimento biológico e defesa antienvelhecimento.',
    sensacaoComum: 'Sensação revigorante de leveza corporal e ausência de fome descontrolada.',
    guiaPratico: {
      oQueBeber: 'Água com eletrólitos (água + sal marinho + limão espremido), água mineral com gás e chá verde rico em antioxidantes.',
      oQueFazer: 'Práticas de relaxamento, banho morno, alongamentos e descanso. Lembre-se: suas células estão fazendo uma faxina profunda agora!',
      oQueEvitar: 'Treinos exaustivos de hipertrofia máxima sem adaptação prévia. Evite ambientes com cheiro forte de alimentos.'
    }
  },
  {
    id: 'estagio_6',
    numero: 6,
    titulo: 'Autofagia Profunda & Renovação',
    faixaHoras: '24h+',
    horaInicio: 24,
    horaFim: null,
    iconeNome: 'dna',
    oQueAcontece: 'O marcador de envelhecimento celular IGF-1 sofre forte redução. Glóbulos brancos antigos são degradados e células-tronco são acionadas para sintetizar novos elementos do sistema imune (pesquisas Dr. Valter Longo).',
    estadoMetabolico: 'Renovação sistêmica, autofagia profunda e biogênese mitocondrial acelerada.',
    beneficioPrincipal: 'Reinicialização do sistema imunológico e reprogramação epigenética protetora.',
    sensacaoComum: 'Estado profundo de calma metabólica; requer hidratação rigorosa com eletrólitos.',
    guiaPratico: {
      oQueBeber: 'Eletrólitos obrigatórios ao longo do dia (água com sal mineral para evitar tonturas e cãibras) e chás botânicos puros.',
      oQueFazer: 'Mantenha ritmo tranquilo, priorize uma boa noite de sono e respeite rigorosamente os limites do seu corpo.',
      oQueEvitar: 'Jamais quebre o jejum prolongado com uma refeição pesada, frituras ou carboidratos refinados. Faça a quebra gradual com caldos, ovos ou folhas leves.'
    }
  },
];

interface ModalEstagioJejumProps {
  aberto: boolean;
  estagio: EstagioMetabolico | null;
  horasJejumAtuais: number;
  emJejum: boolean;
  onFechar: () => void;
}

export const ModalEstagioJejum: React.FC<ModalEstagioJejumProps> = ({
  aberto,
  estagio,
  horasJejumAtuais,
  emJejum,
  onFechar,
}) => {
  if (!aberto || !estagio) return null;

  // Determina o status do usuário em relação a este estágio específico
  const estagioConcluido = emJejum && (estagio.horaFim !== null ? horasJejumAtuais >= estagio.horaFim : horasJejumAtuais >= estagio.horaInicio);
  const estagioAtual = emJejum && horasJejumAtuais >= estagio.horaInicio && (estagio.horaFim === null || horasJejumAtuais < estagio.horaFim);
  const horasFaltando = Math.max(0, estagio.horaInicio - horasJejumAtuais);

  // Renderiza o ícone correspondente
  const renderIcone = () => {
    const props = { className: "w-7 h-7 text-white stroke-[2.2]" };
    switch (estagio.iconeNome) {
      case 'utensils':
        return <Utensils {...props} />;
      case 'trending-down':
        return <TrendingDown {...props} />;
      case 'flame':
        return <Flame {...props} />;
      case 'zap':
        return <Zap {...props} />;
      case 'shield':
        return <ShieldCheck {...props} />;
      case 'dna':
        return <Dna {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      data-purpose="modal-fasting-stage"
    >
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Botão Fechar Acessível (Mínimo 44x44px) */}
        <button 
          type="button" 
          onClick={onFechar}
          className="absolute top-4 right-4 w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-all"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Topo com Ícone e Número do Estágio */}
        <div className="flex items-center gap-3.5 mb-4 pr-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C975] to-[#00A85F] flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
            {renderIcone()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Estágio {estagio.numero} de 6
              </span>
              <span className="text-xs font-bold text-slate-400">
                {estagio.faixaHoras}
              </span>
            </div>
            <h3 className="text-[19px] font-extrabold text-[#0B1C30] leading-tight mt-0.5">
              {estagio.titulo}
            </h3>
          </div>
        </div>

        {/* Badge Dinâmico de Status em Relação ao Jejum Atual */}
        <div className="mb-4">
          {estagioAtual && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center gap-2 text-emerald-800 text-xs font-bold animate-pulse">
              <Activity className="w-4 h-4 text-[#00C975] shrink-0" />
              <span>Você está neste estágio fisiológico agora!</span>
            </div>
          )}
          {estagioConcluido && !estagioAtual && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center gap-2 text-blue-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Estágio concluído com sucesso neste jejum!</span>
            </div>
          )}
          {!emJejum && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-600 text-xs font-medium">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Ativado a partir de {estagio.horaInicio}h de jejum contínuo.</span>
            </div>
          )}
          {emJejum && !estagioConcluido && !estagioAtual && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center gap-2 text-amber-800 text-xs font-semibold">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Faltam cerca de {horasFaltando.toFixed(1)}h para desbloquear este estágio.</span>
            </div>
          )}
        </div>

        {/* Conteúdo Científico Detalhado em Blocos Limpos */}
        <div className="space-y-3 text-left mb-6 text-xs leading-relaxed">
          
          {/* O que acontece no corpo */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="font-extrabold text-[#0B1C30] block mb-1 text-[13px] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#00C975]" />
              O que acontece no seu corpo:
            </span>
            <p className="text-slate-600">{estagio.oQueAcontece}</p>
          </div>

          {/* Estado Metabólico */}
          <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/60">
            <span className="font-extrabold text-[#006D3D] block mb-1 text-[13px] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#00C975]" />
              Estado metabólico:
            </span>
            <p className="text-slate-700">{estagio.estadoMetabolico}</p>
          </div>

          {/* Benefício Principal */}
          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100/60">
            <span className="font-extrabold text-blue-900 block mb-1 text-[13px] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Principal benefício à saúde:
            </span>
            <p className="text-slate-700">{estagio.beneficioPrincipal}</p>
          </div>

          {/* O que você pode sentir */}
          <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-100/60">
            <span className="font-extrabold text-amber-900 block mb-1 text-[13px] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              Sensações corporais comuns:
            </span>
            <p className="text-slate-700">{estagio.sensacaoComum}</p>
          </div>

          {/* Guia Prático: O que beber e fazer para manter o jejum */}
          <div className="p-4 bg-gradient-to-br from-[#E8FAF2] to-[#D5F5E7] rounded-2xl border border-[#00C975]/35 shadow-xs">
            <span className="font-extrabold text-[#004D2A] block mb-2.5 text-[13px] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#00C975]" />
              Guia Prático: O que beber e fazer
            </span>

            <div className="space-y-2 text-[12px] text-slate-700">
              {/* O que beber */}
              <div className="flex items-start gap-2 bg-white/75 p-2.5 rounded-xl border border-emerald-100">
                <Droplet className="w-4 h-4 text-[#00C975] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#004D2A] block text-[11px] uppercase tracking-wide">O que beber:</strong>
                  <span>{estagio.guiaPratico.oQueBeber}</span>
                </div>
              </div>

              {/* O que fazer */}
              <div className="flex items-start gap-2 bg-white/75 p-2.5 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-[#00C975] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#004D2A] block text-[11px] uppercase tracking-wide">O que fazer:</strong>
                  <span>{estagio.guiaPratico.oQueFazer}</span>
                </div>
              </div>

              {/* Evite */}
              <div className="flex items-start gap-2 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
                <Ban className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-900 block text-[11px] uppercase tracking-wide">Evite:</strong>
                  <span>{estagio.guiaPratico.oQueEvitar}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Entendi Acessível */}
        <button
          type="button"
          onClick={onFechar}
          className="w-full py-3.5 px-4 bg-[#00C975] hover:bg-[#00B568] text-white rounded-2xl font-extrabold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all min-h-[44px]"
        >
          Entendi, continuar acompanhando
        </button>
      </div>
    </div>
  );
};
