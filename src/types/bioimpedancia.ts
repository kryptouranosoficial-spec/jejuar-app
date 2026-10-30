/**
 * @file types/bioimpedancia.ts
 * @description Tipagem completa do módulo de Bioimpedância e Acompanhamento de Exames Corporais.
 * Modelado com base nas medições clínicas laboratoriais e farmacêuticas (SBIM/Anvisa).
 */

/**
 * Classificação semântica do estado clínico do paciente segundo tabelas de referência.
 */
export type NivelClassificacao = 'baixo' | 'normal' | 'alto' | 'muito_alto';

/**
 * Detalhes calculados de uma métrica em relação às faixas de referência médica.
 */
export interface InfoClassificacaoMetrica {
  nivel: NivelClassificacao;
  rotulo: string; // Ex: "Normal", "Alto", "Atenção"
  corTexto: string;
  corFundo: string;
  faixaReferenciaTexto: string; // Ex: "18,5 - 24,9"
  posicaoPercentual: number; // 0 a 100 para posicionamento na régua visual
}

/**
 * Diagnóstico consolidado de todas as métricas de um exame de bioimpedância.
 */
export interface DiagnosticoBioimpedancia {
  imc: InfoClassificacaoMetrica;
  gorduraCorporal: InfoClassificacaoMetrica;
  musculoEsqueletico: InfoClassificacaoMetrica;
  gorduraVisceral: InfoClassificacaoMetrica;
}

/**
 * Registro individual de um exame de bioimpedância salvo no Firestore e sincronizado localmente.
 */
export interface RegistroBioimpedancia {
  /** Identificador único do documento */
  id: string;
  /** ID do usuário proprietário */
  usuarioId: string;
  /** Data de realização do exame no formato YYYY-MM-DD */
  dataExame: string;
  /** Horário opcional do exame no formato HH:mm */
  horaExame?: string;
  /** Local ou estabelecimento onde foi realizada a medição (ex: "Drogasil Lauro de Freitas", "Academia", etc.) */
  local: string;
  /** Peso medido em quilogramas (ex: 72.4) */
  pesoKg: number;
  /** Altura informada em metros (ex: 1.63) */
  alturaMetros: number;
  /** Índice de Massa Corporal (IMC) */
  imc: number;
  /** Percentual de Gordura Corporal (% PGC) */
  gorduraCorporalPercentual: number;
  /** Percentual de Músculo Esquelético (% Massa Magra) */
  musculoEsqueleticoPercentual: number;
  /** Nível de Gordura Visceral (escala 1 a 30) */
  gorduraVisceralNivel: number;
  /** Taxa Metabólica Basal estimada em Kcal (ex: 1581) */
  taxaMetabolicaBasalKcal: number;
  /** Idade Corporal estimada em anos (opcional) */
  idadeCorporalAnos?: number;
  /** Observações ou recomendações do profissional farmacêutico/médico */
  observacoes?: string;
  /** Data/Hora em formato ISO da criação do registro */
  criadoEm: string;
  /** Data/Hora da última edição */
  atualizadoEm?: string;
}

/**
 * Configuração de periodicidade e metas de reteste de bioimpedância.
 */
export interface ConfiguracaoRetesteBioimpedancia {
  /** Periodicidade desejada em dias (padrão: 30) */
  frequenciaDias: number;
  /** Notificações e alertas ativados */
  lembretesAtivos: boolean;
  /** Data limite ou meta estimada para o próximo exame no formato YYYY-MM-DD */
  dataProximoExame?: string;
}

/**
 * Comparativo de evolução entre dois exames sucessivos.
 */
export interface DeltaEvolucaoBioimpedancia {
  diasDiferenca: number;
  deltaPesoKg: number;
  deltaGorduraPercentual: number;
  deltaMusculoPercentual: number;
  deltaGorduraVisceral: number;
  melhorouGordura: boolean;
  melhorouMusculo: boolean;
  melhorouVisceral: boolean;
}
