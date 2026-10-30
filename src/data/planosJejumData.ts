/**
 * @file planosJejumData.ts
 * @description Definições de tipos e catálogo completo de protocolos de jejum intermitente.
 * Centraliza os dados estáticos para manter o código dos componentes limpo, rápido e manutenível.
 */

export interface ProtocoloJejum {
  id: string;
  nome: string;
  horasJejum: number;
  horasAlimentacao: number;
  descricaoJejum?: string;
  descricaoAlimentacao?: string;
  rotuloDestaque?: string;
  ehPro?: boolean;
  categoria: 'popular' | 'basico' | 'intermediario' | 'avancado' | 'prolongado';
  dicaHidratacao?: string;
}

export interface ItemPlanoGrade {
  id: string;
  nome: string;
  jejum: number;
  comida: number;
  ehPro: boolean;
}

export interface ItemPlanoProlongado {
  id: string;
  nome: string;
  horasJejum: number;
  label: string;
  dica: string;
  ehPro: boolean;
}

/** 4 Protocolos de Maior Aderência Popular */
export const PLANOS_POPULARES: ProtocoloJejum[] = [
  {
    id: '16:8',
    nome: '16:8',
    horasJejum: 16,
    horasAlimentacao: 8,
    categoria: 'popular',
    rotuloDestaque: 'Mais popular',
  },
  {
    id: '23:1',
    nome: '23:1',
    horasJejum: 23,
    horasAlimentacao: 1,
    categoria: 'popular',
    ehPro: true,
    rotuloDestaque: 'OMAD (1 refeição)',
  },
  {
    id: '20:4',
    nome: '20:4',
    horasJejum: 20,
    horasAlimentacao: 4,
    categoria: 'popular',
    rotuloDestaque: 'Dieta do guerreiro',
  },
  {
    id: '14:10',
    nome: '14:10',
    horasJejum: 14,
    horasAlimentacao: 10,
    categoria: 'popular',
    rotuloDestaque: 'Fácil de começar',
  },
];

/** Protocolos para Iniciantes (Básicos) */
export const PLANOS_BASICOS: ItemPlanoGrade[] = [
  { id: '12:12', nome: '12:12', jejum: 12, comida: 12, ehPro: false },
  { id: '13:11', nome: '13:11', jejum: 13, comida: 11, ehPro: false },
  { id: '14:10', nome: '14:10', jejum: 14, comida: 10, ehPro: false },
  { id: '15:9', nome: '15:9', jejum: 15, comida: 9, ehPro: true },
];

/** Protocolos Intermediários */
export const PLANOS_INTERMEDIARIOS: ItemPlanoGrade[] = [
  { id: '16:8', nome: '16:8', jejum: 16, comida: 8, ehPro: false },
  { id: '17:7', nome: '17:7', jejum: 17, comida: 7, ehPro: true },
  { id: '18:6', nome: '18:6', jejum: 18, comida: 6, ehPro: true },
  { id: '19:5', nome: '19:5', jejum: 19, comida: 5, ehPro: true },
];

/** Protocolos Avançados */
export const PLANOS_AVANCADOS: ItemPlanoGrade[] = [
  { id: '20:4', nome: '20:4', jejum: 20, comida: 4, ehPro: false },
  { id: '21:3', nome: '21:3', jejum: 21, comida: 3, ehPro: true },
  { id: '22:2', nome: '22:2', jejum: 22, comida: 2, ehPro: true },
  { id: '23:1', nome: '23:1', jejum: 23, comida: 1, ehPro: true },
];

/** Protocolos Prolongados e de Longa Duração */
export const PLANOS_PROLONGADOS: ItemPlanoProlongado[] = [
  { id: '24h', nome: '24h', horasJejum: 24, label: '1 dia completo', dica: 'Beba bastante água', ehPro: true },
  { id: '30h', nome: '30h', horasJejum: 30, label: 'Jejum estendido', dica: 'Eletrólitos essenciais', ehPro: true },
  { id: '48h', nome: '48h', horasJejum: 48, label: '2 dias em cetose', dica: 'Atenção ao descanso', ehPro: true },
  { id: '72h', nome: '72h', horasJejum: 72, label: '3 dias autofagia', dica: 'Consulte especialista', ehPro: true },
];
