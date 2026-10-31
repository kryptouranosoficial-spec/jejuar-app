/**
 * @file perfilUtils.ts
 * @description Funções utilitárias puras para o módulo de Perfil e Gamificação:
 * - Máscaras dinâmicas de CPF/CNPJ, Telefone, Data de Nascimento e Moeda Brasileira (R$).
 * - Sistema de Níveis de Maestria Metabólica e cálculo automático de XP conectado a todas as ações do app.
 * - Lista de avatares ilustrados estilizados para escolha do usuário.
 */

import type { 
  NivelGamificacao, 
  MetricasGamificacaoUsuario, 
  AvatarPredefinido, 
  UsuarioEmCadastro, 
  ConquistaUsuario 
} from '../types';

/** Nome do evento customizado global para sincronizar Conquistas, Nível e XP em tempo real */
export const EVENTO_GAMIFICACAO_ATUALIZADA = 'jejuar:gamificacao-atualizada';

/**
 * Emite um evento global na janela do navegador para que todos os componentes
 * que exibem Conquistas, Nível e XP se atualizem instantaneamente após qualquer registro.
 */
export function notificarAtualizacaoGamificacao(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENTO_GAMIFICACAO_ATUALIZADA));
  }
}

/**
 * Aplica máscara exclusiva para CPF de Pessoa Física (11 dígitos: 000.000.000-00).
 * Mantém formatação progressiva em tempo real ao digitar.
 */
export function mascararCpf(valor: string): string {
  const apenasNumeros = (valor || '').replace(/\D/g, '').slice(0, 11);

  return apenasNumeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara dinâmica reativa para CPF (11 dígitos) e CNPJ (14 dígitos).
 * Mantida para compatibilidade com módulos existentes.
 */
export function mascararCpfCnpj(valor: string): string {
  // Remove qualquer caractere que não seja número
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 14);

  // Se até 11 dígitos: formata como CPF (000.000.000-00)
  if (apenasNumeros.length <= 11) {
    return mascararCpf(apenasNumeros);
  }

  // Acima de 11 dígitos: formata dinamicamente como CNPJ (00.000.000/0000-00)
  return apenasNumeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Valida matematicamente os dígitos verificadores de um CPF brasileiro (11 dígitos).
 * Se o campo estiver vazio, retorna válido (pois o campo é opcional).
 */
export function validarCpf(cpfFormatado: string): { valido: boolean; mensagemErro?: string } {
  const limpo = (cpfFormatado || '').replace(/\D/g, '');

  // Campo vazio é permitido pois não é obrigatório
  if (limpo.length === 0) {
    return { valido: true };
  }

  if (limpo.length < 11) {
    return {
      valido: false,
      mensagemErro: 'O CPF informado está incompleto. Digite os 11 números ou deixe o campo em branco.',
    };
  }

  // Rejeita sequências repetidas conhecidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) {
    return {
      valido: false,
      mensagemErro: 'Este número de CPF não é válido. Verifique os dígitos informados.',
    };
  }

  // Cálculo do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) {
    return {
      valido: false,
      mensagemErro: 'O CPF digitado possui números inválidos. Confira e tente novamente.',
    };
  }

  // Cálculo do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10), 10)) {
    return {
      valido: false,
      mensagemErro: 'O CPF digitado possui números inválidos. Confira e tente novamente.',
    };
  }

  return { valido: true };
}

/**
 * Aplica máscara de telefone fixo ou celular com DDD: (99) 99999-9999 ou (99) 9999-9999.
 */
export function mascararTelefone(valor: string): string {
  const apenasNumeros = (valor || '').replace(/\D/g, '').slice(0, 11);

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
 * Valida se o telefone/WhatsApp preenchido possui DDD + número válido (10 ou 11 dígitos).
 * Caso esteja em branco, retorna válido por ser opcional.
 */
export function validarTelefone(telefoneFormatado: string): { valido: boolean; mensagemErro?: string } {
  const limpo = (telefoneFormatado || '').replace(/\D/g, '');

  if (limpo.length === 0) {
    return { valido: true };
  }

  if (limpo.length < 10 || limpo.length > 11) {
    return {
      valido: false,
      mensagemErro: 'Informe o DDD seguido do número de WhatsApp completo com 10 ou 11 dígitos.',
    };
  }

  const ddd = parseInt(limpo.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return {
      valido: false,
      mensagemErro: 'O código de DDD informado não é válido. Exemplo: (11) 99999-9999.',
    };
  }

  return { valido: true };
}

/**
 * Aplica máscara de data de nascimento no formato DD/MM/AAAA limitando a 8 dígitos.
 */
export function mascararDataNascimento(valor: string): string {
  const apenasNumeros = (valor || '').replace(/\D/g, '').slice(0, 8);

  return apenasNumeros
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

/**
 * Valida se uma data de nascimento no formato DD/MM/AAAA é uma data real do calendário
 * e calcula a idade atual do usuário. Se vazia, retorna válido (campo opcional).
 */
export function validarDataNascimento(dataFormatada: string): {
  valido: boolean;
  idade?: number;
  mensagemErro?: string;
} {
  const limpo = (dataFormatada || '').replace(/\D/g, '');

  if (limpo.length === 0) {
    return { valido: true };
  }

  if (limpo.length < 8) {
    return {
      valido: false,
      mensagemErro: 'Complete a data de nascimento no formato DD/MM/AAAA (ex: 15/04/1990) ou deixe em branco.',
    };
  }

  const dia = parseInt(limpo.slice(0, 2), 10);
  const mes = parseInt(limpo.slice(2, 4), 10);
  const ano = parseInt(limpo.slice(4, 8), 10);

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  if (mes < 1 || mes > 12) {
    return {
      valido: false,
      mensagemErro: 'O mês da data de nascimento deve estar entre 01 e 12.',
    };
  }

  if (ano < 1905 || ano > anoAtual) {
    return {
      valido: false,
      mensagemErro: `O ano de nascimento deve estar entre 1905 e ${anoAtual}.`,
    };
  }

  // Verifica se o dia existe naquele mês/ano (incluindo anos bissextos)
  const objetoData = new Date(ano, mes - 1, dia);
  if (
    objetoData.getFullYear() !== ano ||
    objetoData.getMonth() !== mes - 1 ||
    objetoData.getDate() !== dia
  ) {
    return {
      valido: false,
      mensagemErro: 'Esta data não existe no calendário. Verifique o dia e o mês informados.',
    };
  }

  // Calcula a idade exata
  let idade = anoAtual - ano;
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();
  if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
    idade--;
  }

  if (idade < 12 || idade > 120) {
    return {
      valido: false,
      mensagemErro: 'Verifique o ano de nascimento informado (idade permitida a partir de 12 anos).',
    };
  }

  return { valido: true, idade };
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
 * Formata a exibição das horas totais jejuadas para o card de perfil:
 * - Até 9999: exibe direto sem ponto separador (ex: "0h", "164h", "1250h", "9999h").
 * - Acima de 9999 (10.000+): substitui por "+10 Mil", "+11 Mil", "+20 Mil", etc.
 */
export function formatarMetricaHorasJejumCard(horas: number): string {
  const valorInteiro = Math.max(0, Math.round(Number(horas) || 0));
  if (valorInteiro > 9999) {
    const milhares = Math.floor(valorInteiro / 1000);
    return `+${milhares} Mil`;
  }
  return `${valorInteiro}h`;
}

/**
 * Formata a exibição do volume total de água bebida (em Litros) para o card de perfil:
 * - Abaixo de 100L: exibe com até 1 casa decimal (ex: "0L", "4.5L", "22.5L").
 * - De 100L até 9999L: exibe inteiro direto sem ponto separador (ex: "120L", "1450L", "9999L").
 * - Acima de 9999L (10.000+): substitui por "+10 Mil", "+11 Mil", "+20 Mil", etc.
 */
export function formatarMetricaAguaLitrosCard(litros: number): string {
  const valorNumerico = Math.max(0, Number(litros) || 0);
  if (valorNumerico > 9999) {
    const milhares = Math.floor(valorNumerico / 1000);
    return `+${milhares} Mil`;
  }
  if (valorNumerico >= 100) {
    return `${Math.round(valorNumerico)}L`;
  }
  const valorUmaCasa = Math.round(valorNumerico * 10) / 10;
  return `${valorUmaCasa}L`;
}

/**
 * Formata a exibição da sequência de dias (Streak) para o card de perfil:
 * - Até 9999: exibe direto sem ponto (ex: "1 dia", "9 dias", "365 dias").
 * - Acima de 9999: substitui por "+10 Mil", "+11 Mil", etc.
 */
export function formatarMetricaSequenciaDiasCard(dias: number): string {
  const valorInteiro = Math.max(0, Math.round(Number(dias) || 0));
  if (valorInteiro > 9999) {
    const milhares = Math.floor(valorInteiro / 1000);
    return `+${milhares} Mil`;
  }
  return `${valorInteiro} ${valorInteiro === 1 ? 'dia' : 'dias'}`;
}

/**
 * Retorna a classe tipográfica responsiva ideal de acordo com o comprimento do texto exibido no card,
 * garantindo que valores de 1 a 4 dígitos ou "+10 Mil" nunca quebrem linha nem vazem do card.
 */
export function obterClasseTamanhoFonteCardMetrica(textoExibido: string): string {
  const tamanho = (textoExibido || '').length;
  if (tamanho <= 5) {
    return 'text-base tracking-tight';
  }
  if (tamanho <= 7) {
    return 'text-[14px] tracking-tight';
  }
  return 'text-xs tracking-tighter';
}

/**
 * Opções detalhadas do histórico para cálculo exato de XP de todas as atividades do usuário.
 */
export interface OpcoesHistoricoGamificacao {
  totalHorasJejumReal?: number;
  totalAguaLitrosReal?: number;
  totalJejunsConcluidos?: number;
  totalJejunsMetaAtingida?: number;
  diasMetaAguaBatida?: number;
  pesagensRegistradasCount?: number;
  medidasRegistradasCount?: number;
  examesBioimpedanciaCount?: number;
  anotacoesJornadaCount?: number;
  maiorStreakAlcancado?: number;
}

/**
 * Calcula os pontos de experiência (XP) acumulados pelo usuário a partir de TODAS as suas ações reais no app:
 * - Cada Jejum concluído: +50 XP (ou +100 XP se atingir 100% da meta do protocolo)
 * - Cada hora de jejum concluída no histórico: +10 XP
 * - Cada dia de sequência máxima (Streak): +50 XP (protegendo para nunca cair de nível se quebrar a sequência)
 * - Cada 1.000ml (1L) de água consumida no histórico: +20 XP
 * - Cada dia em que atingiu a meta diária de água: +30 XP
 * - Cada registro de Peso na balança: +25 XP
 * - Cada medida corporal registrada (cintura, quadril, etc.): +25 XP
 * - Cada exame de Bioimpedância cadastrado: +100 XP
 * - Cada anotação no Diário da Jornada: +15 XP
 * - Cada Conquista (Medalha) desbloqueada: +150 XP
 */
export function calcularMetricasGamificacao(
  usuario?: UsuarioEmCadastro,
  conquistas: ConquistaUsuario[] = [],
  opcoesHistorico?: OpcoesHistoricoGamificacao
): MetricasGamificacaoUsuario {
  const diasConsecutivos = usuario?.estadoJejum?.diasConsecutivos || 1;
  const conquistasDesbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

  let totalAguaConsumidaLitros = 0;
  let totalHorasJejum = 0;
  let totalJejunsConcluidos = opcoesHistorico?.totalJejunsConcluidos ?? 0;
  let totalJejunsMetaAtingida = opcoesHistorico?.totalJejunsMetaAtingida ?? 0;

  // 1. Horas totais e sessões de jejum (prioriza o cálculo exato do histórico passado pelo hook/tela)
  if (typeof opcoesHistorico?.totalHorasJejumReal === 'number') {
    totalHorasJejum = Math.max(0, Math.round(opcoesHistorico.totalHorasJejumReal));
  } else if (typeof window !== 'undefined') {
    const cacheSessoes = localStorage.getItem('jejuar_historico_jejuns_cache');
    if (cacheSessoes) {
      try {
        const parsed = JSON.parse(cacheSessoes);
        if (Array.isArray(parsed)) {
          const validas = parsed.filter(
            (item: any) => item && !['1', '2', '3', '4', '5', '6'].includes(String(item.id))
          );
          const somaSegundos = validas.reduce(
            (acc: number, curr: any) => acc + (Number(curr.duracaoSegundos) || 0),
            0
          );
          totalHorasJejum = Math.round(somaSegundos / 3600);
          if (opcoesHistorico?.totalJejunsConcluidos === undefined) {
            totalJejunsConcluidos = validas.length;
          }
          if (opcoesHistorico?.totalJejunsMetaAtingida === undefined) {
            totalJejunsMetaAtingida = validas.filter((v: any) => Boolean(v.metaAtingida)).length;
          }
        }
      } catch {
        // Fallback para chave direta caso o JSON falhe
      }
    } else {
      const horasSalvas = localStorage.getItem('jejuar_total_horas_jejum');
      totalHorasJejum = horasSalvas !== null ? Math.max(0, Math.round(Number(horasSalvas) || 0)) : 0;
    }
  }

  // 2. Água total consumida em Litros
  if (typeof opcoesHistorico?.totalAguaLitrosReal === 'number') {
    totalAguaConsumidaLitros = Math.max(0, Math.round(opcoesHistorico.totalAguaLitrosReal * 10) / 10);
  } else if (typeof window !== 'undefined') {
    const aguaTotalSalva = localStorage.getItem('jejuar_total_agua_consumida_ml');
    if (aguaTotalSalva !== null) {
      totalAguaConsumidaLitros = Math.round((Number(aguaTotalSalva) / 1000) * 10) / 10;
    } else {
      let somaMlLocal = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && /^jejuar_agua_\d{4}-\d{2}-\d{2}$/.test(k)) {
          somaMlLocal += Number(localStorage.getItem(k) || '0');
        }
      }
      totalAguaConsumidaLitros = Math.round((somaMlLocal / 1000) * 10) / 10;
    }
  }

  // 3. Proteção do Maior Streak alcançado (para o usuário nunca perder XP ou cair de nível se quebrar a sequência)
  let maiorStreak = Math.max(
    opcoesHistorico?.maiorStreakAlcancado || 0,
    totalJejunsConcluidos > 0 ? diasConsecutivos : (diasConsecutivos > 1 ? diasConsecutivos : 0)
  );
  if (typeof window !== 'undefined') {
    const maiorSalvo = Number(localStorage.getItem('jejuar_maior_streak') || '0');
    if (diasConsecutivos > maiorSalvo && (totalJejunsConcluidos > 0 || diasConsecutivos > 1)) {
      localStorage.setItem('jejuar_maior_streak', String(diasConsecutivos));
      maiorStreak = Math.max(maiorStreak, diasConsecutivos);
    } else if (maiorSalvo > maiorStreak) {
      maiorStreak = maiorSalvo;
    }
  }

  // 4. Cálculo detalhado de XP por cada atividade realizada no app
  const jejunsParciais = Math.max(0, totalJejunsConcluidos - totalJejunsMetaAtingida);
  const xpPorSessoesJejum = (totalJejunsMetaAtingida * 100) + (jejunsParciais * 50);
  const xpPorHorasJejum = Math.floor(totalHorasJejum * 10);
  const xpPorStreak = maiorStreak * 50;

  const xpPorAguaLitros = Math.floor(totalAguaConsumidaLitros * 20);
  const xpPorMetasAgua = (opcoesHistorico?.diasMetaAguaBatida || 0) * 30;

  const xpPorPesagens = (opcoesHistorico?.pesagensRegistradasCount || 0) * 25;
  const xpPorMedidas = (opcoesHistorico?.medidasRegistradasCount || 0) * 25;
  const xpPorBioimpedancia = (opcoesHistorico?.examesBioimpedanciaCount || 0) * 100;
  const xpPorAnotacoes = (opcoesHistorico?.anotacoesJornadaCount || 0) * 15;
  const xpPorConquistas = conquistasDesbloqueadas * 150;

  // Bônus inicial de boas-vindas calibrado (+50 XP) para começar legitimamente no Nível 1 (Iniciante Curioso)
  const xpBaseInicial = 50;

  const pontosXpCalculados =
    xpBaseInicial +
    xpPorSessoesJejum +
    xpPorHorasJejum +
    xpPorStreak +
    xpPorAguaLitros +
    xpPorMetasAgua +
    xpPorPesagens +
    xpPorMedidas +
    xpPorBioimpedancia +
    xpPorAnotacoes +
    xpPorConquistas;

  const pontosXpTotal = Math.max(xpBaseInicial, pontosXpCalculados);

  // Localiza o nível correspondente na tabela de Maestria Metabólica
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
    conquistasDisponiveisTotal: conquistas.length > 0 ? conquistas.length : 35,
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
