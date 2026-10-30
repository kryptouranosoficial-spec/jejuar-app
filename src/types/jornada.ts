/**
 * @file types/jornada.ts
 * @description Definições de tipos TypeScript para a aba Jornada & Diário de Bordo.
 * Abrange registros de anotações pessoais, timeline unificada de eventos (jejuns, notas, pesagens, exames)
 * e estatísticas de consistência de longo prazo.
 */

/** Tipos de humor/sentimento disponíveis para as anotações diárias */
export type HumorJornada = 
  | 'energico' 
  | 'focado' 
  | 'sereno' 
  | 'motivado' 
  | 'leve' 
  | 'cansado' 
  | 'com_fome' 
  | 'desafiador';

/** Estrutura de metadados visuais para cada humor */
export interface OpcaoHumorJornada {
  id: HumorJornada;
  rotulo: string;
  emoji: string;
  corBg: string;
  corTexto: string;
}

/** Estrutura de uma anotação pessoal no Diário da Jornada */
export interface AnotacaoJornada {
  id: string;
  dataIso: string; // ISO String (data e hora da anotação)
  titulo: string;
  conteudo: string;
  humor?: HumorJornada;
  tags?: string[];
  criadoEm?: string;
  atualizadoEm?: string;
}

/** Tipo de evento que compõe a Linha do Tempo unificada */
export type TipoItemTimeline = 'jejum' | 'anotacao' | 'pesagem' | 'bioimpedancia';

/** Item normalizado para exibição no Feed Cronológico da Jornada */
export interface ItemLinhaTempoJornada {
  id: string;
  tipo: TipoItemTimeline;
  dataIso: string;
  tituloPrincipal: string;
  subtitulo?: string;
  descricao?: string;
  badge?: {
    rotulo: string;
    variante: 'sucesso' | 'info' | 'aviso' | 'destaque';
  };
  icone: string; // Nome do ícone
  metadados?: {
    duracaoSegundos?: number;
    metaHoras?: number;
    peso?: number;
    aguaMl?: number;
    humor?: HumorJornada;
    gorduraCorporal?: number;
    musculoEsqueletico?: number;
  };
  dadosOriginais?: any; // Referência aos dados brutos para edição
}

/** Estatísticas de consistência consolidadas */
export interface EstatisticasJornada {
  diasConsecutivos: number;
  totalHorasJejum: number;
  totalSessoesConcluidas: number;
  taxaSucessoPercentual: number;
  totalAnotacoes: number;
  primeiroRegistroDataIso?: string;
}

/** Filtros rápidos da Linha do Tempo */
export type FiltroCategoriaJornada = 'todos' | 'jejuns' | 'anotacoes' | 'medicoes';
