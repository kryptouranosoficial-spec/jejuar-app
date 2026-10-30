/**
 * @file notificacoesInternas.ts
 * @description Tipagem e contratos de dados para a Central de Notificações Internas do aplicativo Jejuar.
 */

export type CategoriaNotificacaoInterna = 'aviso' | 'conquista' | 'sistema';

export interface NotificacaoInterna {
  /** Identificador único da notificação */
  id: string;
  /** Título principal em alto contraste */
  titulo: string;
  /** Corpo descritivo com mensagem humanizada em Pt-br */
  mensagem: string;
  /** Categoria da notificação para segmentação por abas */
  categoria: CategoriaNotificacaoInterna;
  /** Timestamp ISO do momento da emissão */
  dataIso: string;
  /** Estado de leitura para controle de badges */
  lida: boolean;
  /** Rota ou ação contextual ao tocar na mensagem */
  acaoLink?: 'jejum' | 'agua' | 'peso' | 'bioimpedancia' | 'plano' | string;
  /** Rótulo do botão de ação rápida (ex: "Ver Jejum", "Registrar Água") */
  acaoTexto?: string;
  /** Identificação do emissor (ex: "Equipe Jejuar", "Sistema", "Admin") */
  remetente?: string;
  /** Ícone visual associado ao card */
  icone?: 'bell' | 'trophy' | 'droplet' | 'flame' | 'scale' | 'sparkles';
}
