/**
 * @file types/index.ts
 * @description Definições de tipos centrais para navegação e estado do aplicativo Jejuar.
 */

/**
 * Telas principais disponíveis no aplicativo.
 * Seguem a esteira contínua horizontal tipo filme sem intervalos brancos.
 */
export type TelaAtiva = 
  | 'splash' 
  | 'welcome' 
  | 'login'
  | 'onboarding' 
  | 'cadastro_step1' 
  | 'cadastro_step2' 
  | 'onboarding_basico_objetivo' 
  | 'onboarding_basico_experiencia'
  | 'onboarding_basico_ano'
  | 'onboarding_basico_genero'
  | 'onboarding_basico_altura'
  | 'onboarding_basico_peso'
  | 'onboarding_basico_peso_desejado'
  | 'onboarding_basico_previsao'
  | 'inicio';

/**
 * Estrutura do subgrupo de Informações Básicas persistido no Firestore.
 */
export interface InformacoesBasicasUsuario {
  objetivoPrincipal?: string;
  experienciaJejum?: string;
  anoNascimento?: number;
  genero?: string;
  altura?: number;
  peso?: number;
  pesoInicial?: number;
  imc?: number;
  pesoDesejado?: number;
  previsaoPerdaKg?: number;
  onboardingCompleto?: boolean;
  atualizadoEm?: unknown;
}

/**
 * Estado atual em tempo real do jejum do usuário (persistido no documento raiz do usuário).
 */
export interface EstadoJejumUsuario {
  /** ID do protocolo selecionado (ex: '16:8') */
  planoAtivoId: string;
  /** Nome amigável do protocolo (ex: '16:8') */
  nomePlano: string;
  /** Meta de duração em horas do jejum (ex: 16) */
  metaHoras: number;
  /** Indica se o timer de jejum está atualmente em execução */
  emJejum: boolean;
  /** Data/Hora em formato ISO quando o jejum atual começou */
  inicioTimestamp?: string | null;
  /** Indica se o usuário está atualmente na janela de alimentação aberta (pós-jejum) */
  emJanelaAlimentacao?: boolean;
  /** Data/Hora em formato ISO quando a janela de alimentação atual começou */
  inicioJanelaTimestamp?: string | null;
  /** Duração em horas da janela de alimentação (ex: 8 no 16:8) */
  horasJanelaAlimentacao?: number;
  /** Contador de dias consecutivos completados no app */
  diasConsecutivos: number;
  /** Data no formato YYYY-MM-DD da última sessão concluída com sucesso */
  ultimoDiaConcluido?: string | null;
  /** Data de atualização */
  atualizadoEm?: unknown;
}

/**
 * Registro de histórico de uma sessão de jejum (persistido na subcoleção historico_jejuns).
 */
export interface SessaoJejum {
  id?: string;
  planoId: string;
  nomePlano: string;
  inicio: string;
  fim: string;
  duracaoSegundos: number;
  metaHoras: number;
  metaAtingida: boolean;
  aguaConsumidaMl?: number;
  criadoEm?: unknown;
}

/**
 * Estrutura de dados de um plano salvo na coleção global 'planos' no Firestore.
 */
export interface ProtocoloJejumData {
  id: string;
  nome: string;
  horasJejum: number;
  horasAlimentacao: number;
  categoria: 'popular' | 'basico' | 'intermediario' | 'avancado' | 'prolongado';
  rotuloDestaque?: string;
  ehPro?: boolean;
  ordem?: number;
  dicaHidratacao?: string;
}

/**
 * Dados do usuário durante o fluxo de cadastro e onboarding contínuo.
 */
export interface UsuarioEmCadastro {
  /** ID do documento na coleção "usuarios" gerado pelo Firestore */
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  nivel: string;
  informacoesBasicas?: InformacoesBasicasUsuario;
  /** Estado de jejum e streak sincronizados com o Firestore */
  estadoJejum?: EstadoJejumUsuario;
  /** Consumo de água do dia sincronizado */
  consumoAguaAtual?: RegistroConsumoAgua;
  /** Configurações de monitoramento de água */
  configuracaoAgua?: ConfiguracaoMonitorAgua;
}

/**
 * Informações dos estágios de calibração exibidos na Splash Screen.
 */
export interface EstagioCarregamento {
  /** Porcentagem do progresso de 0 a 100 */
  porcentagem: number;
  /** Texto humanizado exibido ao usuário */
  mensagem: string;
}

/**
 * Registro de consumo diário de água sincronizado no Firestore (subcoleção historico_agua).
 */
export interface RegistroConsumoAgua {
  id?: string;
  dataStr: string; // Formato YYYY-MM-DD
  consumidoMl: number;
  metaMl: number;
  unidade?: 'ml' | 'fl oz';
  atualizadoEm?: unknown;
}

/**
 * Configurações personalizadas do Monitoramento de Água (lembretes, horários, meta e unidade).
 */
export interface ConfiguracaoMonitorAgua {
  lembreteAtivo: boolean;
  somLembrete: string;
  horaInicio: string;
  horaFim: string;
  intervalo: string;
  metaDiariaMl: number;
  unidade: 'ml' | 'fl oz';
}

/**
 * Categoria temática de conquistas do aplicativo.
 */
export type ConquistaCategoria = 
  | 'jejum' 
  | 'streak' 
  | 'agua' 
  | 'peso' 
  | 'bioimpedancia' 
  | 'aventureiro' 
  | 'desafio'
  | 'geral';

/**
 * Conquista ou medalha de gamificação para premiar a consistência do usuário.
 */
export interface ConquistaUsuario {
  id: string;
  titulo: string;
  descricao: string;
  categoria: ConquistaCategoria;
  /** Nome amigável do Bloco/Sessão (ex: 'Missão Iniciante', 'Guerreiro Perseverante', 'Missões de Água') */
  blocoNome?: string;
  desbloqueada: boolean;
  progressoAtual: number;
  progressoTotal: number;
  unidadeProgresso?: string;
  iconeNome: 'trofeu' | 'agua' | 'fogo' | 'estrela' | 'gota' | 'escudo' | 'peso' | 'corpo' | 'balanca' | 'desafio' | 'app' | 'combo';
  /** Rótulo curto exibido dentro do badge (ex: '5', '10', '7-combo', '14-DAY', '1') */
  rotuloBadge?: string;
  /** Estilo visual do badge: 'hexagonal' (como em Missão Iniciante/Água) ou 'escudo' (como em Aventureiro/Desafio) */
  estiloBadge?: 'hexagonal' | 'escudo' | 'circular';
  /** Cor temática do badge (ex: 'roxo', 'dourado', 'azul', 'verde', 'prata') */
  corTema?: 'roxo' | 'dourado' | 'azul' | 'verde' | 'prata' | 'esmeralda';
  dataDesbloqueio?: string;
}

/**
 * Configurações de preferências para notificações de Jejum, Água e Peso.
 */
export interface ConfiguracoesNotificacoes {
  jejumInicioAtivo: boolean;
  jejumInicioSom: string;
  jejumFimAtivo: boolean;
  jejumFimSom: string;
  jejum2hAntesInicio: boolean;
  jejum1hAntesInicio: boolean;
  jejum3hAposInicio: boolean;
  jejumInicioPerdido: boolean;
  jejum2hAntesFim: boolean;
  jejum1hAntesFim: boolean;
  jejumFimPerdido: boolean;
  aguaLembreteAtivo: boolean;
  aguaSom: string;
  aguaHoraInicio: string;
  aguaHoraFim: string;
  aguaIntervalo: string;
  pesoLembreteAtivo: boolean;
  pesoHora: string;
  pesoDias: string;
  pesoSom: string;
  naoPerturbeAtivo: boolean;
  naoPerturbeHoraInicio: string;
  naoPerturbeHoraFim: string;
  mostrarStatusBarraNotificacao: boolean;
}

/**
 * Configurações completas de Jejum personalizadas pelo usuário.
 */
export interface ConfiguracoesJejum {
  modoContagemRegressiva: boolean;
  horaInicioDiaria: string;
  inicioAutomatico: boolean;
  exibicaoCalendario: string;
  notificacoes: ConfiguracoesNotificacoes;
  atualizadoEm?: unknown;
}

// Re-exportação de tipos do módulo de Bioimpedância
export * from './bioimpedancia';

// Re-exportação de tipos do módulo de Jornada & Diário de Bordo
export * from './jornada';

// Re-exportação de tipos do módulo de Perfil & Gamificação
export * from './perfil';
