/**
 * @file perfil.ts
 * @description Definições de tipos TypeScript para o módulo de Perfil do Usuário e Gamificação.
 * Inclui estruturas de dados cadastrais completos, níveis de maestria metabólica e avatares.
 */

/** Tipos de planos e papéis disponíveis no aplicativo */
export type TipoPlanoUsuario = 'vitalicio' | 'pro' | 'gratuito';

/** Estrutura dos dados pessoais completos editáveis do perfil */
export interface DadosPerfilUsuario {
  /** Nome completo do usuário */
  nome: string;
  /** Endereço de e-mail (apenas leitura após cadastro) */
  email: string;
  /** CPF ou CNPJ com formatação dinâmica */
  cpfCnpj?: string;
  /** Telefone celular ou WhatsApp com DDD */
  telefone?: string;
  /** Data de nascimento no formato DD/MM/AAAA */
  dataNascimento?: string;
  /** Renda mensal ou valor monetário formatado em Real Brasileiro (R$) */
  rendaMensalCentavos?: number;
  /** URL de foto personalizada enviada pelo usuário (Base64 ou storage) */
  fotoUrl?: string | null;
  /** Identificador de avatar ilustrado predefinido escolhido */
  avatarPredefinidoId?: string | null;
  /** Tipo de assinatura ou plano ativo */
  plano: TipoPlanoUsuario;
  /** Sexo biológico do usuário para cálculos metabólicos ('feminino' | 'masculino') */
  genero?: 'feminino' | 'masculino' | string;
  /** Altura em centímetros (ex: 170) */
  altura?: number;
  /** Peso inicial registrado no Onboarding em kg (ex: 80.0) */
  pesoInicial?: number;
  /** Peso atual em kg (ex: 76.5) */
  peso?: number;
  /** Meta de peso desejado em kg (ex: 68.0) */
  pesoDesejado?: number;
  /** Objetivo principal escolhido no Onboarding (ex: 'perder_peso') */
  objetivoPrincipal?: string;
  /** Nível de experiência com jejum escolhido no Onboarding (ex: 'primeira_vez') */
  experienciaJejum?: string;
  /** Ano de nascimento sincronizado com a data de nascimento */
  anoNascimento?: number;
  /** Data de última atualização dos dados */
  atualizadoEm?: unknown;
}

/** Configuração dos níveis de maestria metabólica (Gamificação) */
export interface NivelGamificacao {
  nivel: number;
  titulo: string;
  descricao: string;
  xpMinimo: number;
  xpMaximo: number;
  iconeNome: string;
  corDestaque: string;
}

/** Resumo dos indicadores de gamificação exibidos no perfil */
export interface MetricasGamificacaoUsuario {
  pontosXpTotal: number;
  nivelAtual: number;
  tituloNivel: string;
  xpNivelAtual: number;
  xpProximoNivel: number;
  porcentagemProgressoNivel: number;
  diasConsecutivos: number;
  totalHorasJejum: number;
  totalAguaConsumidaLitros: number;
  conquistasDesbloqueadasTotal: number;
  conquistasDisponiveisTotal: number;
}

/** Avatar ilustrado pré-configurado */
export interface AvatarPredefinido {
  id: string;
  nome: string;
  emoji: string;
  corFundo: string;
  descricao: string;
}
