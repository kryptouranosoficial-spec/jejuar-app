/**
 * @file conquistasUtils.ts
 * @description Lógica de cálculo e catálogo dinâmico de conquistas e medalhas do usuário.
 * Organizado rigorosamente nas Missões e Blocos das referências:
 * - Missão Iniciante (Jejuns concluídos)
 * - Guerreiro Perseverante (Sequências / Combos)
 * - Missões de Água (Hidratação contínua)
 * - Evolução de Peso & Medidas
 * - Mestre da Bioimpedância
 * - Aventureiro (Engajamento e perfil)
 * - Vencedor do Desafio
 */

import type { ConquistaUsuario, RegistroConsumoAgua } from '../types';

/**
 * Parâmetros completos para avaliação em tempo real de todas as conquistas do aplicativo.
 */
export interface ParametrosCalculoConquistas {
  /** Dias consecutivos de sequência (streak atual ou máximo atingido) */
  diasConsecutivos?: number;
  /** Consumo de água registrado no dia de hoje (em ml) */
  aguaConsumidaHoje?: number;
  /** Meta diária de água configurada para hoje (em ml) */
  metaAguaHoje?: number;
  /** Histórico consolidado de registros diários de água */
  historicoAgua7Dias?: RegistroConsumoAgua[];
  /** Quantidade real de sessões de jejum concluídas no histórico */
  totalJejunsConcluidos?: number;
  /** Peso atual aferido pelo usuário (em kg) */
  pesoAtualKg?: number;
  /** Peso inicial de partida do usuário (em kg) */
  pesoInicialKg?: number;
  /** Meta de peso desejado pelo usuário (em kg) */
  pesoDesejadoKg?: number;
  /** Quantidade de registros de pesagem realizados na balança */
  pesagensRegistradasCount?: number;
  /** Quantidade de medidas corporais registradas (cintura, quadril, peito, braço, coxa) */
  medidasRegistradasCount?: number;
  /** Quantidade de exames de bioimpedância cadastrados */
  examesBioimpedanciaCount?: number;
  /** Indica se houve redução no percentual de gordura corporal entre exames de bioimpedância */
  gorduraCorporalReduzida?: boolean;
  /** Indica se o usuário preencheu os dados pessoais/corporais completos no perfil */
  perfilCompleto?: boolean;
  /** Indica se o usuário possui foto ou avatar configurado */
  temFotoOuAvatar?: boolean;
  /** Indica se o usuário já configurou sua meta de água ou realizou registros hídricos */
  configurouAguaOuBateuMeta?: boolean;
  /** Indica se o usuário já abriu/explorou a janela de alimentação pós-jejum */
  explorouJanelaAlimentacao?: boolean;
  /** Indica se o usuário ativou lembretes inteligentes ou widgets de acompanhamento */
  ativouLembretesOuWidgets?: boolean;
  /** Indica se os dados estão sincronizados na nuvem ou se exportou backup LGPD */
  sincronizouNuvemOuBackup?: boolean;
  /** Indica se o usuário já compartilhou pelo menos uma conquista com amigos */
  compartilhouConquista?: boolean;
}

/**
 * Calcula a lista completa de medalhas e conquistas organizadas por Missões,
 * refletindo fielmente cada ação realizada pelo usuário no aplicativo.
 */
export function calcularConquistasUsuario({
  diasConsecutivos = 0,
  aguaConsumidaHoje = 0,
  metaAguaHoje = 2500,
  historicoAgua7Dias = [],
  totalJejunsConcluidos = 0,
  pesoAtualKg,
  pesoInicialKg,
  pesoDesejadoKg,
  pesagensRegistradasCount = 0,
  medidasRegistradasCount = 0,
  examesBioimpedanciaCount = 0,
  gorduraCorporalReduzida = false,
  perfilCompleto = false,
  configurouAguaOuBateuMeta = false,
  explorouJanelaAlimentacao = false,
  ativouLembretesOuWidgets = false,
  sincronizouNuvemOuBackup = false,
  compartilhouConquista = false,
}: ParametrosCalculoConquistas): ConquistaUsuario[] {
  // 1. Total real de jejuns concluídos (não força 1 se o usuário ainda não concluiu nenhum jejum)
  const streakEfetivo = totalJejunsConcluidos > 0 ? Math.max(diasConsecutivos, 1) : (diasConsecutivos > 1 ? diasConsecutivos : 0);
  const countJejuns = Math.max(0, totalJejunsConcluidos, diasConsecutivos > 1 ? diasConsecutivos : 0);

  // 2. Histórico de água batida (unificado por data YYYY-MM-DD para nunca duplicar o dia de hoje)
  const hojeStr = new Date().toISOString().slice(0, 10);
  const mapaDiasAgua = new Map<string, { consumidoMl: number; metaMl: number }>();

  historicoAgua7Dias.forEach((item) => {
    if (!item || !item.dataStr) return;
    const atual = mapaDiasAgua.get(item.dataStr);
    const consumido = Math.max(atual?.consumidoMl || 0, Number(item.consumidoMl) || 0);
    const meta = Number(item.metaMl) || metaAguaHoje || 2500;
    mapaDiasAgua.set(item.dataStr, { consumidoMl: consumido, metaMl: meta });
  });

  // Garante que o consumo em tempo real de hoje esteja refletido sem somar duas vezes
  if (aguaConsumidaHoje > 0) {
    const registroHoje = mapaDiasAgua.get(hojeStr);
    mapaDiasAgua.set(hojeStr, {
      consumidoMl: Math.max(registroHoje?.consumidoMl || 0, aguaConsumidaHoje),
      metaMl: registroHoje?.metaMl || metaAguaHoje || 2500,
    });
  }

  let diasMetaAguaBatida = 0;
  mapaDiasAgua.forEach((info) => {
    if (info.metaMl > 0 && info.consumidoMl >= info.metaMl) {
      diasMetaAguaBatida += 1;
    }
  });

  // 3. Cálculo de perda de peso em kg e verificação de primeiro registro de peso
  const temPesoRegistrado = pesagensRegistradasCount > 0 || Boolean(
    pesoInicialKg && pesoAtualKg && Math.abs(pesoInicialKg - pesoAtualKg) >= 0.1
  );

  const pesoPerdidoKg = (pesoInicialKg && pesoAtualKg && pesoInicialKg > pesoAtualKg)
    ? Number((pesoInicialKg - pesoAtualKg).toFixed(1))
    : 0;

  const metaPesoAtingida = Boolean(
    pesoAtualKg &&
    pesoDesejadoKg &&
    pesoInicialKg &&
    pesoAtualKg <= pesoDesejadoKg &&
    (pesagensRegistradasCount > 0 || pesoAtualKg < pesoInicialKg)
  );

  // 4. Flags dinâmicas do bloco Aventureiro
  const mestreAguaDesbloqueado = configurouAguaOuBateuMeta || diasMetaAguaBatida >= 1 || aguaConsumidaHoje > 0;
  const chefDesbloqueado = explorouJanelaAlimentacao || countJejuns >= 1;

  const listaConquistas: ConquistaUsuario[] = [
    // ==========================================
    // 1. MISSÃO INICIANTE (Jejuns Concluídos)
    // ==========================================
    {
      id: 'jejum-1',
      titulo: 'Primeiro jejum',
      descricao: 'Conclua seu 1º jejum oficial no aplicativo com sucesso.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 1,
      progressoAtual: Math.min(1, countJejuns),
      progressoTotal: 1,
      unidadeProgresso: 'jejum',
      iconeNome: 'fogo',
      rotuloBadge: '1',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
      dataDesbloqueio: countJejuns >= 1 ? 'Conquistada' : undefined,
    },
    {
      id: 'jejum-5',
      titulo: '5 jejuns',
      descricao: 'Terminei 5 vezes o jejum com determinação e disciplina.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 5,
      progressoAtual: Math.min(5, countJejuns),
      progressoTotal: 5,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '5',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
      dataDesbloqueio: countJejuns >= 5 ? 'Conquistada' : undefined,
    },
    {
      id: 'jejum-10',
      titulo: '10 jejuns',
      descricao: 'Conclua 10 sessões de jejum intercaladas no app.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 10,
      progressoAtual: Math.min(10, countJejuns),
      progressoTotal: 10,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '10',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-20',
      titulo: '20 jejuns',
      descricao: 'Complete 20 jejuns no seu ritmo.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 20,
      progressoAtual: Math.min(20, countJejuns),
      progressoTotal: 20,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '20',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-50',
      titulo: '50 jejuns',
      descricao: 'Alcance a marca de meio século de jejuns concluídos.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 50,
      progressoAtual: Math.min(50, countJejuns),
      progressoTotal: 50,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '50',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-100',
      titulo: '100 jejuns',
      descricao: 'Complete 100 jejuns e atinja a flexibilidade metabólica.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 100,
      progressoAtual: Math.min(100, countJejuns),
      progressoTotal: 100,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '100',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-150',
      titulo: '150 jejuns',
      descricao: 'Chegue a 150 sessões e torne o jejum seu estilo de vida.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 150,
      progressoAtual: Math.min(150, countJejuns),
      progressoTotal: 150,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '150',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-200',
      titulo: '200 jejuns',
      descricao: 'Sua constância é admirável: 200 jejuns finalizados!',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 200,
      progressoAtual: Math.min(200, countJejuns),
      progressoTotal: 200,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '200',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-300',
      titulo: '300 jejuns',
      descricao: 'Mestre da autofagia: 300 jejuns concluídos.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 300,
      progressoAtual: Math.min(300, countJejuns),
      progressoTotal: 300,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '300',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-400',
      titulo: '400 jejuns',
      descricao: '400 sessões de jejum registradas com absoluto foco.',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 400,
      progressoAtual: Math.min(400, countJejuns),
      progressoTotal: 400,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '400',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-500',
      titulo: '500 jejuns',
      descricao: 'Atingiu meio milhar de jejuns concluídos!',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 500,
      progressoAtual: Math.min(500, countJejuns),
      progressoTotal: 500,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '500',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },
    {
      id: 'jejum-1000',
      titulo: '1000 jejuns',
      descricao: 'Lenda do Jejum Intermitente: 1000 marcas batidas!',
      categoria: 'jejum',
      blocoNome: 'Missão Iniciante',
      desbloqueada: countJejuns >= 1000,
      progressoAtual: Math.min(1000, countJejuns),
      progressoTotal: 1000,
      unidadeProgresso: 'jejuns',
      iconeNome: 'trofeu',
      rotuloBadge: '1000',
      estiloBadge: 'hexagonal',
      corTema: 'roxo',
    },

    // ==========================================
    // 2. GUERREIRO PERSEVERANTE (Combos / Streaks)
    // ==========================================
    {
      id: 'combo-7',
      titulo: '7-combo jejum',
      descricao: 'Mantenha uma sequência ininterrupta de 7 dias seguidos.',
      categoria: 'streak',
      blocoNome: 'Guerreiro Perseverante',
      desbloqueada: streakEfetivo >= 7,
      progressoAtual: Math.min(7, streakEfetivo),
      progressoTotal: 7,
      unidadeProgresso: 'dias',
      iconeNome: 'fogo',
      rotuloBadge: '7',
      estiloBadge: 'hexagonal',
      corTema: 'dourado',
      dataDesbloqueio: streakEfetivo >= 7 ? 'Conquistada' : undefined,
    },
    {
      id: 'combo-14',
      titulo: '14-combo jejum',
      descricao: '2 semanas inteiras de disciplina sem quebrar a sequência.',
      categoria: 'streak',
      blocoNome: 'Guerreiro Perseverante',
      desbloqueada: streakEfetivo >= 14,
      progressoAtual: Math.min(14, streakEfetivo),
      progressoTotal: 14,
      unidadeProgresso: 'dias',
      iconeNome: 'fogo',
      rotuloBadge: '14',
      estiloBadge: 'hexagonal',
      corTema: 'dourado',
    },
    {
      id: 'combo-28',
      titulo: '28-combo jejum',
      descricao: 'Praticamente um mês inteiro (28 dias) sem interrupções!',
      categoria: 'streak',
      blocoNome: 'Guerreiro Perseverante',
      desbloqueada: streakEfetivo >= 28,
      progressoAtual: Math.min(28, streakEfetivo),
      progressoTotal: 28,
      unidadeProgresso: 'dias',
      iconeNome: 'fogo',
      rotuloBadge: '28',
      estiloBadge: 'hexagonal',
      corTema: 'dourado',
    },
    {
      id: 'combo-50',
      titulo: '50-combo jejum',
      descricao: '50 dias seguidos de dedicação total ao seu corpo.',
      categoria: 'streak',
      blocoNome: 'Guerreiro Perseverante',
      desbloqueada: streakEfetivo >= 50,
      progressoAtual: Math.min(50, streakEfetivo),
      progressoTotal: 50,
      unidadeProgresso: 'dias',
      iconeNome: 'fogo',
      rotuloBadge: '50',
      estiloBadge: 'hexagonal',
      corTema: 'dourado',
    },
    {
      id: 'combo-100',
      titulo: '100-combo jejum',
      descricao: '100 dias ininterruptos! Um hábito para a vida toda.',
      categoria: 'streak',
      blocoNome: 'Guerreiro Perseverante',
      desbloqueada: streakEfetivo >= 100,
      progressoAtual: Math.min(100, streakEfetivo),
      progressoTotal: 100,
      unidadeProgresso: 'dias',
      iconeNome: 'fogo',
      rotuloBadge: '100',
      estiloBadge: 'hexagonal',
      corTema: 'dourado',
    },
    {
      id: 'combo-200',
      titulo: '200-combo jejum',
      descricao: '200 dias de foco implacável. Nível mestre!',
      categoria: 'streak',
      blocoNome: 'Guerreiro Perseverante',
      desbloqueada: streakEfetivo >= 200,
      progressoAtual: Math.min(200, streakEfetivo),
      progressoTotal: 200,
      unidadeProgresso: 'dias',
      iconeNome: 'fogo',
      rotuloBadge: '200',
      estiloBadge: 'hexagonal',
      corTema: 'dourado',
    },

    // ==========================================
    // 3. MISSÕES DE ÁGUA (Hidratação)
    // ==========================================
    {
      id: 'agua-5',
      titulo: '5 vezes',
      descricao: 'Atinja sua meta diária de hidratação por 5 vezes.',
      categoria: 'agua',
      blocoNome: 'Missões de Água',
      desbloqueada: diasMetaAguaBatida >= 5,
      progressoAtual: Math.min(5, diasMetaAguaBatida),
      progressoTotal: 5,
      unidadeProgresso: 'vezes',
      iconeNome: 'gota',
      rotuloBadge: '5',
      estiloBadge: 'hexagonal',
      corTema: 'azul',
    },
    {
      id: 'agua-10',
      titulo: '10 vezes',
      descricao: 'Meta de água diária batida 10 vezes com sucesso.',
      categoria: 'agua',
      blocoNome: 'Missões de Água',
      desbloqueada: diasMetaAguaBatida >= 10,
      progressoAtual: Math.min(10, diasMetaAguaBatida),
      progressoTotal: 10,
      unidadeProgresso: 'vezes',
      iconeNome: 'gota',
      rotuloBadge: '10',
      estiloBadge: 'hexagonal',
      corTema: 'azul',
    },
    {
      id: 'agua-20',
      titulo: '20 vezes',
      descricao: '20 metas de água completadas. Seu corpo agradece!',
      categoria: 'agua',
      blocoNome: 'Missões de Água',
      desbloqueada: diasMetaAguaBatida >= 20,
      progressoAtual: Math.min(20, diasMetaAguaBatida),
      progressoTotal: 20,
      unidadeProgresso: 'vezes',
      iconeNome: 'gota',
      rotuloBadge: '20',
      estiloBadge: 'hexagonal',
      corTema: 'azul',
    },
    {
      id: 'agua-50',
      titulo: '50 vezes',
      descricao: '50 metas de consumo de água registradas.',
      categoria: 'agua',
      blocoNome: 'Missões de Água',
      desbloqueada: diasMetaAguaBatida >= 50,
      progressoAtual: Math.min(50, diasMetaAguaBatida),
      progressoTotal: 50,
      unidadeProgresso: 'vezes',
      iconeNome: 'gota',
      rotuloBadge: '50',
      estiloBadge: 'hexagonal',
      corTema: 'azul',
    },
    {
      id: 'agua-100',
      titulo: '100 vezes',
      descricao: 'Centenário da hidratação perfeita.',
      categoria: 'agua',
      blocoNome: 'Missões de Água',
      desbloqueada: diasMetaAguaBatida >= 100,
      progressoAtual: Math.min(100, diasMetaAguaBatida),
      progressoTotal: 100,
      unidadeProgresso: 'vezes',
      iconeNome: 'gota',
      rotuloBadge: '100',
      estiloBadge: 'hexagonal',
      corTema: 'azul',
    },
    {
      id: 'agua-300',
      titulo: '300 vezes',
      descricao: 'Hidratação de nível elite: 300 metas alcançadas!',
      categoria: 'agua',
      blocoNome: 'Missões de Água',
      desbloqueada: diasMetaAguaBatida >= 300,
      progressoAtual: Math.min(300, diasMetaAguaBatida),
      progressoTotal: 300,
      unidadeProgresso: 'vezes',
      iconeNome: 'gota',
      rotuloBadge: '300',
      estiloBadge: 'hexagonal',
      corTema: 'azul',
    },

    // ==========================================
    // 4. EVOLUÇÃO DE PESO & MEDIDAS
    // ==========================================
    {
      id: 'peso-primeiro',
      titulo: 'Primeiro Peso',
      descricao: 'Registre seu peso na balança para acompanhar seu progresso.',
      categoria: 'peso',
      blocoNome: 'Evolução de Peso & Medidas',
      desbloqueada: temPesoRegistrado,
      progressoAtual: temPesoRegistrado ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'registro',
      iconeNome: 'balanca',
      rotuloBadge: 'KG',
      estiloBadge: 'escudo',
      corTema: 'esmeralda',
    },
    {
      id: 'peso-1kg',
      titulo: '-1 kg Eliminado',
      descricao: 'Primeiro quilo perdido com o jejum intermitente.',
      categoria: 'peso',
      blocoNome: 'Evolução de Peso & Medidas',
      desbloqueada: pesoPerdidoKg >= 1,
      progressoAtual: Math.min(1, Math.floor(pesoPerdidoKg)),
      progressoTotal: 1,
      unidadeProgresso: 'kg',
      iconeNome: 'balanca',
      rotuloBadge: '-1kg',
      estiloBadge: 'escudo',
      corTema: 'esmeralda',
    },
    {
      id: 'peso-5kg',
      titulo: '-5 kg Eliminados',
      descricao: '5 quilos eliminados! Sua saúde e energia renovadas.',
      categoria: 'peso',
      blocoNome: 'Evolução de Peso & Medidas',
      desbloqueada: pesoPerdidoKg >= 5,
      progressoAtual: Math.min(5, Math.floor(pesoPerdidoKg)),
      progressoTotal: 5,
      unidadeProgresso: 'kg',
      iconeNome: 'balanca',
      rotuloBadge: '-5kg',
      estiloBadge: 'escudo',
      corTema: 'esmeralda',
    },
    {
      id: 'peso-meta',
      titulo: 'Meta Atingida',
      descricao: 'Alcance seu peso desejado e comemore a vitória!',
      categoria: 'peso',
      blocoNome: 'Evolução de Peso & Medidas',
      desbloqueada: metaPesoAtingida,
      progressoAtual: metaPesoAtingida ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'meta',
      iconeNome: 'trofeu',
      rotuloBadge: 'META',
      estiloBadge: 'escudo',
      corTema: 'dourado',
    },
    {
      id: 'medidas-corpo',
      titulo: 'Corpo Medido',
      descricao: 'Registre suas medidas corporais (cintura, quadril, braços).',
      categoria: 'peso',
      blocoNome: 'Evolução de Peso & Medidas',
      desbloqueada: medidasRegistradasCount >= 1,
      progressoAtual: Math.min(1, medidasRegistradasCount),
      progressoTotal: 1,
      unidadeProgresso: 'medida',
      iconeNome: 'corpo',
      rotuloBadge: 'CM',
      estiloBadge: 'escudo',
      corTema: 'esmeralda',
    },

    // ==========================================
    // 5. MESTRE DA BIOIMPEDÂNCIA
    // ==========================================
    {
      id: 'bio-primeiro-exame',
      titulo: 'Primeira Bioimpedância',
      descricao: 'Cadastre seu primeiro exame completo de bioimpedância.',
      categoria: 'bioimpedancia',
      blocoNome: 'Mestre da Bioimpedância',
      desbloqueada: examesBioimpedanciaCount >= 1,
      progressoAtual: Math.min(1, examesBioimpedanciaCount),
      progressoTotal: 1,
      unidadeProgresso: 'exame',
      iconeNome: 'peso',
      rotuloBadge: 'BIO',
      estiloBadge: 'escudo',
      corTema: 'azul',
    },
    {
      id: 'bio-gordura-down',
      titulo: 'Queima de Gordura',
      descricao: 'Reduza a porcentagem de gordura corporal entre dois exames.',
      categoria: 'bioimpedancia',
      blocoNome: 'Mestre da Bioimpedância',
      desbloqueada: gorduraCorporalReduzida,
      progressoAtual: gorduraCorporalReduzida ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'evolução',
      iconeNome: 'fogo',
      rotuloBadge: '%G',
      estiloBadge: 'escudo',
      corTema: 'azul',
    },

    // ==========================================
    // 6. AVENTUREIRO (Engajamento e Recursos Reais)
    // ==========================================
    {
      id: 'av-mestre-agua',
      titulo: 'Mestre da água',
      descricao: 'Configure seu monitoramento ou registre sua hidratação diária.',
      categoria: 'aventureiro',
      blocoNome: 'Aventureiro',
      desbloqueada: mestreAguaDesbloqueado,
      progressoAtual: mestreAguaDesbloqueado ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'nível',
      iconeNome: 'gota',
      rotuloBadge: 'ÁGUA',
      estiloBadge: 'escudo',
      corTema: 'verde',
    },
    {
      id: 'av-academico',
      titulo: 'Acadêmico estagiário',
      descricao: 'Preencha suas informações pessoais e corporais no Perfil.',
      categoria: 'aventureiro',
      blocoNome: 'Aventureiro',
      desbloqueada: perfilCompleto,
      progressoAtual: perfilCompleto ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'perfil',
      iconeNome: 'escudo',
      rotuloBadge: 'PERFIL',
      estiloBadge: 'escudo',
      corTema: 'verde',
    },
    {
      id: 'av-chef',
      titulo: 'Chef estagiário',
      descricao: 'Explore os horários da janela de alimentação saudável pós-jejum.',
      categoria: 'aventureiro',
      blocoNome: 'Aventureiro',
      desbloqueada: chefDesbloqueado,
      progressoAtual: chefDesbloqueado ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'janela',
      iconeNome: 'escudo',
      rotuloBadge: 'CHEF',
      estiloBadge: 'escudo',
      corTema: chefDesbloqueado ? 'verde' : 'prata',
    },
    {
      id: 'av-widgets',
      titulo: 'Mestre dos widgets',
      descricao: 'Ative os lembretes inteligentes e alertas no seu telefone.',
      categoria: 'aventureiro',
      blocoNome: 'Aventureiro',
      desbloqueada: ativouLembretesOuWidgets,
      progressoAtual: ativouLembretesOuWidgets ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'widget',
      iconeNome: 'escudo',
      rotuloBadge: 'WIDGET',
      estiloBadge: 'escudo',
      corTema: ativouLembretesOuWidgets ? 'verde' : 'prata',
    },
    {
      id: 'av-nuvem',
      titulo: 'Mestre da nuvem',
      descricao: 'Mantenha seus dados sincronizados ou exporte seu backup LGPD.',
      categoria: 'aventureiro',
      blocoNome: 'Aventureiro',
      desbloqueada: sincronizouNuvemOuBackup,
      progressoAtual: sincronizouNuvemOuBackup ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'backup',
      iconeNome: 'escudo',
      rotuloBadge: 'NUVEM',
      estiloBadge: 'escudo',
      corTema: 'verde',
    },
    {
      id: 'av-compartilhar',
      titulo: 'Compartilhar conquista',
      descricao: 'Compartilhe um progresso ou medalha com seus amigos.',
      categoria: 'aventureiro',
      blocoNome: 'Aventureiro',
      desbloqueada: compartilhouConquista,
      progressoAtual: compartilhouConquista ? 1 : 0,
      progressoTotal: 1,
      unidadeProgresso: 'post',
      iconeNome: 'escudo',
      rotuloBadge: 'SOCIAL',
      estiloBadge: 'escudo',
      corTema: 'verde',
    },

    // ==========================================
    // 7. VENCEDOR DO DESAFIO
    // ==========================================
    {
      id: 'desafio-7dias',
      titulo: 'Jejum de 7 dias',
      descricao: 'Complete o desafio especial de 7 dias seguidos de jejum.',
      categoria: 'desafio',
      blocoNome: 'Vencedor do desafio',
      desbloqueada: streakEfetivo >= 7,
      progressoAtual: Math.min(7, streakEfetivo),
      progressoTotal: 7,
      unidadeProgresso: 'dias',
      iconeNome: 'desafio',
      rotuloBadge: '7-DAY',
      estiloBadge: 'escudo',
      corTema: streakEfetivo >= 7 ? 'dourado' : 'prata',
    },
    {
      id: 'desafio-14dias',
      titulo: 'Jejum de 14 dias',
      descricao: 'Complete o desafio intensivo de 14 dias consecutivos.',
      categoria: 'desafio',
      blocoNome: 'Vencedor do desafio',
      desbloqueada: streakEfetivo >= 14,
      progressoAtual: Math.min(14, streakEfetivo),
      progressoTotal: 14,
      unidadeProgresso: 'dias',
      iconeNome: 'desafio',
      rotuloBadge: '14-DAY',
      estiloBadge: 'escudo',
      corTema: streakEfetivo >= 14 ? 'dourado' : 'prata',
    },
    {
      id: 'desafio-21dias',
      titulo: 'Jejum de 21 dias',
      descricao: 'Complete o desafio de transformação de 21 dias.',
      categoria: 'desafio',
      blocoNome: 'Vencedor do desafio',
      desbloqueada: streakEfetivo >= 21,
      progressoAtual: Math.min(21, streakEfetivo),
      progressoTotal: 21,
      unidadeProgresso: 'dias',
      iconeNome: 'desafio',
      rotuloBadge: '21-DAY',
      estiloBadge: 'escudo',
      corTema: streakEfetivo >= 21 ? 'dourado' : 'prata',
    },
    {
      id: 'desafio-primavera',
      titulo: 'Perda de peso na primavera',
      descricao: 'Participe da temporada especial de primavera e conclua 20 jejuns.',
      categoria: 'desafio',
      blocoNome: 'Vencedor do desafio',
      desbloqueada: countJejuns >= 20,
      progressoAtual: Math.min(20, countJejuns),
      progressoTotal: 20,
      unidadeProgresso: 'jejuns',
      iconeNome: 'desafio',
      rotuloBadge: '20 Fasts',
      estiloBadge: 'escudo',
      corTema: countJejuns >= 20 ? 'esmeralda' : 'prata',
    },
  ];

  return listaConquistas;
}
