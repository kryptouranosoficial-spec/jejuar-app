/**
 * @file perfilUtils.ts
 * @description Funções utilitárias puras para o módulo de Perfil e Gamificação:
 * - Máscaras dinâmicas de CPF/CNPJ, Telefone, Data de Nascimento e Moeda Brasileira (R$).
 * - Sistema de Níveis de Maestria Metabólica e cálculo automático de XP.
 * - Lista de avatares ilustrados estilizados para escolha do usuário.
 */

import type { 
  NivelGamificacao, 
  MetricasGamificacaoUsuario, 
  AvatarPredefinido, 
  UsuarioEmCadastro, 
  ConquistaUsuario 
} from '../types';

/**
 * Aplica máscara dinâmica reativa para CPF (11 dígitos) e CNPJ (14 dígitos).
 * Mantém formatação em tempo real ao digitar.
 */
export function mascararCpfCnpj(valor: string): string {
  // Remove qualquer caractere que não seja número
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 14);

  // Se até 11 dígitos: formata como CPF (000.000.000-00)
  if (apenasNumeros.length <= 11) {
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  // Acima de 11 dígitos: formata dinamicamente como CNPJ (00.000.000/0000-00)
  return apenasNumeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara de telefone fixo ou celular com DDD: (99) 99999-9999 ou (99) 9999-9999.
 */
export function mascararTelefone(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);

  if (apenasNumeros.length <= 10) {
    return apenasNumeros
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return apenasNumeros
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Aplica máscara de data de nascimento no formato DD/MM/AAAA limitando a 8 dígitos.
 */
export function mascararDataNascimento(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 8);

  return apenasNumeros
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

/**
 * Formata um valor numérico inteiro de centavos em moeda corrente brasileira (R$ 0.000,00).
 * Exemplo: 250050 -> "R$ 2.500,50"
 */
export function formatarCentavosEmReal(centavos: number): string {
  if (isNaN(centavos) || centavos < 0) centavos = 0;
  const valorReais = centavos / 100;
  return valorReais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte a digitação contínua do usuário em centavos inteiros (formatação progressiva de moeda).
 * Permite que ao digitar "1", apareça "R$ 0,01", "10" -> "R$ 0,10", "100" -> "R$ 1,00", etc.
 */
export function processarDigitacaoMoedaReal(valorDigitado: string): {
  centavos: number;
  formatado: string;
} {
  const apenasDigitos = valorDigitado.replace(/\D/g, '');
  const centavos = parseInt(apenasDigitos || '0', 10);
  const formatado = formatarCentavosEmReal(centavos);
  return { centavos, formatado };
}

/**
 * Tabela oficial de Níveis de Maestria Metabólica (Gamificação do Jejuar).
 * Inspirada na progressão biológica de autofagia, queima cetogênica e longevidade.
 */
export const NIVEIS_MESTRIA_METABOLICA: NivelGamificacao[] = [
  {
    nivel: 1,
    titulo: 'Iniciante Curioso',
    descricao: 'Iniciando os primeiros passos rumo à flexibilidade metabólica.',
    xpMinimo: 0,
    xpMaximo: 299,
    iconeNome: 'Seedling',
    corDestaque: '#10B981',
  },
  {
    nivel: 2,
    titulo: 'Explorador da Autofagia',
    descricao: 'Descobrindo o poder da reciclagem celular diária.',
    xpMinimo: 300,
    xpMaximo: 699,
    iconeNome: 'Flame',
    corDestaque: '#00C975',
  },
  {
    nivel: 3,
    titulo: 'Aprendiz Cetogênico',
    descricao: 'O corpo começa a queimar gordura limpa como combustível primário.',
    xpMinimo: 700,
    xpMaximo: 1199,
    iconeNome: 'Zap',
    corDestaque: '#F59E0B',
  },
  {
    nivel: 4,
    titulo: 'Guerreiro Metabólico',
    descricao: 'Janelas de jejum dominadas com disciplina e clareza mental.',
    xpMinimo: 1200,
    xpMaximo: 1799,
    iconeNome: 'Shield',
    corDestaque: '#3B82F6',
  },
  {
    nivel: 5,
    titulo: 'Disciplina Blindada',
    descricao: 'Consistência inabalável diante de qualquer tentação.',
    xpMinimo: 1800,
    xpMaximo: 2499,
    iconeNome: 'Award',
    corDestaque: '#8B5CF6',
  },
  {
    nivel: 6,
    titulo: 'Mestre da Autofagia',
    descricao: 'Células renovadas, longevidade ativada e vitalidade pura.',
    xpMinimo: 2500,
    xpMaximo: 3299,
    iconeNome: 'Crown',
    corDestaque: '#EC4899',
  },
  {
    nivel: 7,
    titulo: 'Guardião da Longevidade',
    descricao: 'Estilo de vida consolidado que inspira outras pessoas.',
    xpMinimo: 3300,
    xpMaximo: 4199,
    iconeNome: 'Sparkles',
    corDestaque: '#10B981',
  },
  {
    nivel: 8,
    titulo: 'Sábio da Renovação',
    descricao: 'Controle absoluto sobre o apetite, mente e biologia.',
    xpMinimo: 4200,
    xpMaximo: 5199,
    iconeNome: 'Medal',
    corDestaque: '#F97316',
  },
  {
    nivel: 9,
    titulo: 'Titã da Consistência',
    descricao: 'Mais de 100 sessões perfeitas completadas com sucesso.',
    xpMinimo: 5200,
    xpMaximo: 6499,
    iconeNome: 'Zap',
    corDestaque: '#6366F1',
  },
  {
    nivel: 10,
    titulo: 'Lendário do Jejum',
    descricao: 'Atingiu a maestria suprema da saúde e longevidade sustentável.',
    xpMinimo: 6500,
    xpMaximo: 99999,
    iconeNome: 'Trophy',
    corDestaque: '#EAB308',
  },
];

/**
 * Calcula os pontos de experiência (XP) acumulados pelo usuário a partir de suas ações no app:
 * - Cada dia de sequência (Streak): +50 XP
 * - Cada hora de jejum estimada: +10 XP
 * - Cada conquista desbloqueada: +150 XP
 * - Cada 1.000ml de água consumida: +20 XP
 */
export function calcularMetricasGamificacao(
  usuario?: UsuarioEmCadastro,
  conquistas: ConquistaUsuario[] = []
): MetricasGamificacaoUsuario {
  const diasConsecutivos = usuario?.estadoJejum?.diasConsecutivos || 1;
  const conquistasDesbloqueadas = conquistas.filter(c => c.desbloqueada).length;

  // Busca dados de água e jejum do cache local se disponível
  let totalAguaConsumidaLitros = 0;
  let totalHorasJejum = 0;

  if (typeof window !== 'undefined') {
    const aguaMl = Number(localStorage.getItem('jejuar_total_agua_consumida_ml') || '4500');
    totalAguaConsumidaLitros = Math.round((aguaMl / 1000) * 10) / 10;

    const horasJejumSalvas = Number(localStorage.getItem('jejuar_total_horas_jejum') || '48');
    totalHorasJejum = horasJejumSalvas;
  } else {
    totalAguaConsumidaLitros = 4.5;
    totalHorasJejum = 48;
  }

  // Pontuação ponderada
  const xpPorStreak = diasConsecutivos * 50;
  const xpPorHorasJejum = Math.floor(totalHorasJejum * 10);
  const xpPorAgua = Math.floor(totalAguaConsumidaLitros * 20);
  const xpPorConquistas = conquistasDesbloqueadas * 150;
  const xpBaseInicial = 250; // Bônus de boas-vindas do cadastro

  const pontosXpTotal = xpBaseInicial + xpPorStreak + xpPorHorasJejum + xpPorAgua + xpPorConquistas;

  // Localiza o nível correspondente
  let configNivel = NIVEIS_MESTRIA_METABOLICA[0];
  for (const n of NIVEIS_MESTRIA_METABOLICA) {
    if (pontosXpTotal >= n.xpMinimo) {
      configNivel = n;
    } else {
      break;
    }
  }

  // Cálculo da porcentagem para o próximo nível
  const xpNivelAtual = pontosXpTotal - configNivel.xpMinimo;
  const tamanhoFaixa = configNivel.xpMaximo - configNivel.xpMinimo + 1;
  const porcentagemProgresso = Math.min(100, Math.max(0, Math.round((xpNivelAtual / tamanhoFaixa) * 100)));

  return {
    pontosXpTotal,
    nivelAtual: configNivel.nivel,
    tituloNivel: configNivel.titulo,
    xpNivelAtual: pontosXpTotal,
    xpProximoNivel: configNivel.xpMaximo + 1,
    porcentagemProgressoNivel: porcentagemProgresso,
    diasConsecutivos,
    totalHorasJejum,
    totalAguaConsumidaLitros,
    conquistasDesbloqueadasTotal: conquistasDesbloqueadas,
    conquistasDisponiveisTotal: conquistas.length > 0 ? conquistas.length : 18,
  };
}

/**
 * Lista de 6 avatares ilustrados estilizados que o usuário pode selecionar caso não queira foto real.
 */
export const AVATARES_PREDEFINIDOS: AvatarPredefinido[] = [
  {
    id: 'avatar_longevidade',
    nome: 'Guerreiro da Longevidade',
    emoji: '🌿',
    corFundo: 'from-emerald-400 to-teal-600',
    descricao: 'Equilíbrio, renovação celular e harmonia com a natureza.',
  },
  {
    id: 'avatar_fogo',
    nome: 'Fogo Metabólico',
    emoji: '🔥',
    corFundo: 'from-amber-400 to-orange-600',
    descricao: 'Potência na queima de gordura e energia limpa inesgotável.',
  },
  {
    id: 'avatar_zen',
    nome: 'Mente Serena',
    emoji: '🧘‍♂️',
    corFundo: 'from-sky-400 to-blue-600',
    descricao: 'Foco profundo, clareza mental e controle emocional do apetite.',
  },
  {
    id: 'avatar_energia',
    nome: 'Energia Celular',
    emoji: '⚡',
    corFundo: 'from-yellow-400 to-amber-500',
    descricao: 'Autofagia ativa produzindo mitocôndrias novas e vigor.',
  },
  {
    id: 'avatar_agua',
    nome: 'Guardião Hídrico',
    emoji: '💧',
    corFundo: 'from-cyan-400 to-blue-500',
    descricao: 'Hidratação impecável e eliminação de toxinas em jejum.',
  },
  {
    id: 'avatar_titã',
    nome: 'Titã da Disciplina',
    emoji: '👑',
    corFundo: 'from-purple-500 to-indigo-600',
    descricao: 'Consistência inabalável rumo à sua melhor versão.',
  },
];
