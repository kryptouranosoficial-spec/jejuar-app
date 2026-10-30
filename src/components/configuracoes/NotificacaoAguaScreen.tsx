/**
 * @file NotificacaoAguaScreen.tsx
 * @description Redirecionamento unificado para a tela oficial de Monitoramento de Água,
 * garantindo consistência total de design e sincronização de dados.
 */

import React from 'react';
import type { ConfiguracoesNotificacoes, ConfiguracaoMonitorAgua } from '../../types';
import { ConfiguracaoMonitorAguaScreen } from '../agua/ConfiguracaoMonitorAguaScreen';

interface NotificacaoAguaScreenProps {
  /** Objeto com o estado atual das notificações */
  notificacoes: ConfiguracoesNotificacoes;
  /** Callback acionado ao alterar qualquer opção de notificação de água */
  onAtualizarNotificacoes: (novasNotificacoes: Partial<ConfiguracoesNotificacoes>) => void;
  /** Callback acionado ao voltar para a tela anterior de Notificação */
  onVoltar: () => void;
  usuarioId?: string;
  pesoUsuarioKg?: number;
}

export const NotificacaoAguaScreen: React.FC<NotificacaoAguaScreenProps> = ({
  notificacoes,
  onAtualizarNotificacoes,
  onVoltar,
  usuarioId = '',
  pesoUsuarioKg = 72.4,
}) => {
  const configAgua: ConfiguracaoMonitorAgua = {
    lembreteAtivo: notificacoes.aguaLembreteAtivo ?? true,
    somLembrete: notificacoes.aguaSom || 'Padrão',
    horaInicio: notificacoes.aguaHoraInicio || '08:00',
    horaFim: notificacoes.aguaHoraFim || '21:00',
    intervalo: notificacoes.aguaIntervalo || 'A cada 1 hora',
    metaDiariaMl: 2500,
    unidade: 'ml'
  };

  return (
    <ConfiguracaoMonitorAguaScreen
      configuracao={configAgua}
      pesoUsuarioKg={pesoUsuarioKg}
      usuarioId={usuarioId}
      onSalvarConfiguracao={(nova) => {
        onAtualizarNotificacoes({
          aguaLembreteAtivo: nova.lembreteAtivo,
          aguaSom: nova.somLembrete,
          aguaHoraInicio: nova.horaInicio,
          aguaHoraFim: nova.horaFim,
          aguaIntervalo: nova.intervalo,
        });
      }}
      onVoltar={onVoltar}
    />
  );
};
