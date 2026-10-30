/**
 * @file localNotificationService.ts
 * @description Serviço de Notificações Locais Nativas via Capacitor (@capacitor/local-notifications).
 * 
 * Funcionalidade:
 * 1. Detecta se a aplicação está rodando em ambiente Nativo (Android/iOS) ou Web (PWA).
 * 2. Em ambiente Nativo (.apk), agenda os alarmes de Água e Jejum diretamente no relógio
 *    do sistema operacional (Android AlarmManager), com ZERO dependência de internet ou servidor.
 * 3. Quando o usuário altera seus horários ou frequências, cancela os agendamentos anteriores
 *    e grava a nova grade instantaneamente na memória interna do aparelho.
 * 4. Em ambiente Web/PWA, atua como fallback suave e seguro sem quebrar o navegador.
 */

import { Capacitor } from '@capacitor/core';
import { 
  LocalNotifications, 
  type ScheduleOptions, 
  type PendingResult 
} from '@capacitor/local-notifications';

/**
 * Faixas de IDs numéricos para isolar e gerenciar cada categoria de notificação nativa
 * sem conflito entre água, jejum e pesagem.
 */
const CANAL_AGUA_ID = 'canal_hidratacao_jejuar';
const CANAL_JEJUM_ID = 'canal_jejum_jejuar';

// Offset de IDs para evitar colisões
const OFFSET_AGUA = 1000;
const OFFSET_JEJUM = 2000;
const OFFSET_PESO = 3000;

/**
 * Verifica se o aplicativo está rodando em ambiente nativo real (Android ou iOS)
 */
export function ehAmbienteNativo(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Inicializa os canais de notificação nativos no Android (obrigatório a partir do Android 8.0+)
 */
export async function inicializarCanaisNativos(): Promise<void> {
  if (!ehAmbienteNativo()) return;

  try {
    // Canal de Água com alta prioridade
    await LocalNotifications.createChannel({
      id: CANAL_AGUA_ID,
      name: 'Lembretes de Hidratação',
      description: 'Alertas periódicos para consumo de água ao longo do dia',
      importance: 4, // HIGH - Toca som e exibe banner
      visibility: 1, // PUBLIC - Visível na tela de bloqueio
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#00C975'
    });

    // Canal de Jejum com alta prioridade
    await LocalNotifications.createChannel({
      id: CANAL_JEJUM_ID,
      name: 'Ciclos de Jejum Intermitente',
      description: 'Alertas de início, marcos metabólicos e conclusão de jejum',
      importance: 5, // MAX - Acorda a tela
      visibility: 1,
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#00C975'
    });

    console.log('[Capacitor LocalNotifications] Canais nativos configurados com sucesso.');
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao criar canais nativos:', err);
  }
}

/**
 * Solicita a permissão nativa do sistema operacional (Android 13+ / iOS)
 */
export async function solicitarPermissaoNativa(): Promise<boolean> {
  if (!ehAmbienteNativo()) {
    // Se estiver na Web, recorre à API de notificação padrão do navegador
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  }

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return true;
    }

    const resultado = await LocalNotifications.requestPermissions();
    return resultado.display === 'granted';
  } catch (err) {
    console.error('[Capacitor LocalNotifications] Erro ao solicitar permissões:', err);
    return false;
  }
}

/**
 * Configuração de entrada para agendamento de água
 */
export interface ParametrosAgendamentoAgua {
  horaInicio: string; // formato "08:00"
  horaFim: string;    // formato "21:00"
  intervaloTexto: string; // "A cada 30 min", "A cada 1 hora", "A cada 2 horas", etc.
  lembreteAtivo: boolean;
}

/**
 * Converte o texto descritivo de intervalo em minutos inteiros
 */
function extrairMinutosIntervalo(intervaloTexto: string): number {
  if (intervaloTexto.includes('30 min')) return 30;
  if (intervaloTexto.includes('1 hora') || intervaloTexto.includes('1h')) return 60;
  if (intervaloTexto.includes('2 hora') || intervaloTexto.includes('2h')) return 120;
  if (intervaloTexto.includes('3 hora') || intervaloTexto.includes('3h')) return 180;
  return 60; // padrão: 1 hora
}

/**
 * Cancela todos os agendamentos anteriores de água no sistema nativo
 */
export async function cancelarNotificacoesAgua(): Promise<void> {
  if (!ehAmbienteNativo()) return;

  try {
    const pendentes: PendingResult = await LocalNotifications.getPending();
    const idsAguaParaCancelar = pendentes.notifications
      .filter(item => item.id >= OFFSET_AGUA && item.id < OFFSET_JEJUM)
      .map(item => ({ id: item.id }));

    if (idsAguaParaCancelar.length > 0) {
      await LocalNotifications.cancel({ notifications: idsAguaParaCancelar });
      console.log(`[Capacitor LocalNotifications] ${idsAguaParaCancelar.length} lembretes antigos de água cancelados.`);
    }
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao cancelar lembretes de água:', err);
  }
}

/**
 * Agenda toda a grade diária de lembretes de água diretamente no hardware do celular.
 * Se o usuário mudar o intervalo ou horário, basta chamar esta função novamente:
 * ela limpa o passado e registra a nova grade pontualmente.
 */
export async function agendarGradeNativaAgua(params: ParametrosAgendamentoAgua): Promise<{ agendados: number; sucesso: boolean }> {
  if (!ehAmbienteNativo()) {
    return { agendados: 0, sucesso: false };
  }

  // 1. Garante que os canais de áudio/vibração existem
  await inicializarCanaisNativos();

  // 2. Sempre cancela a grade antiga antes de reagendar
  await cancelarNotificacoesAgua();

  if (!params.lembreteAtivo) {
    console.log('[Capacitor LocalNotifications] Lembretes de água desativados pelo usuário.');
    return { agendados: 0, sucesso: true };
  }

  const temPermissao = await solicitarPermissaoNativa();
  if (!temPermissao) {
    console.warn('[Capacitor LocalNotifications] Sem permissão para agendar notificações nativas.');
    return { agendados: 0, sucesso: false };
  }

  try {
    const [hIni, mIni] = (params.horaInicio || '08:00').split(':').map(Number);
    const [hFim, mFim] = (params.horaFim || '21:00').split(':').map(Number);

    const minInicio = (hIni || 8) * 60 + (mIni || 0);
    const minFim = (hFim || 21) * 60 + (mFim || 0);
    const intervaloMinutos = extrairMinutosIntervalo(params.intervaloTexto || 'A cada 1 hora');

    if (minInicio >= minFim) {
      console.warn('[Capacitor LocalNotifications] Horário de início maior ou igual ao fim.');
      return { agendados: 0, sucesso: false };
    }

    const notificacoesParaAgendar: any[] = [];
    let contador = 0;

    for (let minutoAtual = minInicio; minutoAtual <= minFim; minutoAtual += intervaloMinutos) {
      const hora = Math.floor(minutoAtual / 60);
      const minuto = minutoAtual % 60;
      const idNotificacao = OFFSET_AGUA + contador;

      // Agenda repetição diária nativa no relógio do sistema operacional (Android AlarmManager)
      notificacoesParaAgendar.push({
        id: idNotificacao,
        title: 'Hora de se Hidratar 💧',
        body: 'Mantenha seu metabolismo ativo e seu corpo desinflamado. Beba um copo de água agora!',
        channelId: CANAL_AGUA_ID,
        smallIcon: 'ic_stat_icon_config_sample',
        schedule: {
          on: {
            hour: hora,
            minute: minuto
          },
          allowWhileIdle: true // Permite disparar mesmo em modo Doze / Economia de Bateria profunda
        },
        extra: {
          tipo: 'agua',
          horarioAgendado: `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
        }
      });

      contador++;
    }

    if (notificacoesParaAgendar.length > 0) {
      const options: ScheduleOptions = { notifications: notificacoesParaAgendar };
      await LocalNotifications.schedule(options);
      console.log(`[Capacitor LocalNotifications] Grade de ${notificacoesParaAgendar.length} lembretes diários de água ativada com sucesso no hardware.`);
      return { agendados: notificacoesParaAgendar.length, sucesso: true };
    }

    return { agendados: 0, sucesso: true };
  } catch (err) {
    console.error('[Capacitor LocalNotifications] Erro ao agendar grade de água:', err);
    return { agendados: 0, sucesso: false };
  }
}

/**
 * Agenda lembrete de conclusão do jejum em andamento diretamente no celular
 */
export async function agendarConclusaoJejumNativo(dataHoraFim: Date, nomePlano: string, metaHoras: number): Promise<boolean> {
  if (!ehAmbienteNativo()) return false;

  try {
    await inicializarCanaisNativos();
    
    // Cancela qualquer lembrete de fim de jejum anterior
    await LocalNotifications.cancel({ notifications: [{ id: OFFSET_JEJUM + 1 }] });

    const agora = new Date().getTime();
    const momentoFim = dataHoraFim.getTime();

    // Se o fim já estiver no passado, não agenda
    if (momentoFim <= agora) return false;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: OFFSET_JEJUM + 1,
          title: 'Parabéns! Meta de Jejum Concluída 🔥',
          body: `Você completou o seu protocolo ${nomePlano} (${metaHoras}h) com sucesso! Abra para registrar sua refeição.`,
          channelId: CANAL_JEJUM_ID,
          smallIcon: 'ic_stat_icon_config_sample',
          schedule: {
            at: dataHoraFim,
            allowWhileIdle: true
          },
          extra: {
            tipo: 'conclusao_jejum'
          }
        }
      ]
    });

    console.log(`[Capacitor LocalNotifications] Alerta de conclusão de jejum agendado no celular para ${dataHoraFim.toLocaleTimeString()}`);
    return true;
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao agendar conclusão de jejum:', err);
    return false;
  }
}

/**
 * Cancela alertas de jejum caso o usuário finalize ou interrompa antes do prazo
 */
export async function cancelarNotificacoesJejum(): Promise<void> {
  if (!ehAmbienteNativo()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: OFFSET_JEJUM + 1 }] });
    console.log('[Capacitor LocalNotifications] Alertas pendentes de jejum cancelados.');
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao cancelar jejum:', err);
  }
}

/**
 * Dispara uma notificação nativa de teste com som e vibração após 2 segundos.
 * Permite comprovar imediatamente que o hardware do Android está respondendo aos alarmes.
 */
export async function dispararTesteNotificacaoNativa(): Promise<{ sucesso: boolean; mensagem: string }> {
  if (!ehAmbienteNativo()) {
    return { sucesso: false, mensagem: 'Ambiente web: utilizando envio via servidor.' };
  }

  try {
    await inicializarCanaisNativos();
    const temPermissao = await solicitarPermissaoNativa();
    if (!temPermissao) {
      return { sucesso: false, mensagem: 'Permissão de notificação negada no Android.' };
    }

    const daquiADoisSegundos = new Date(Date.now() + 2000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 9999,
          title: '💧 Teste Nativo: Jejuar',
          body: 'Perfeito! As notificações nativas no seu celular estão 100% ativas e pontuais.',
          channelId: CANAL_AGUA_ID,
          smallIcon: 'ic_stat_icon_config_sample',
          schedule: {
            at: daquiADoisSegundos,
            allowWhileIdle: true
          },
          extra: {
            tipo: 'teste_nativo'
          }
        }
      ]
    });

    return { sucesso: true, mensagem: 'Notificação nativa agendada! Chegará em 2 segundos na tela.' };
  } catch (err: any) {
    console.error('[Capacitor LocalNotifications] Erro no teste nativo:', err);
    return { sucesso: false, mensagem: err?.message || 'Falha ao agendar teste nativo.' };
  }
}

