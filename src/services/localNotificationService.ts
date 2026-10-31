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
import type { ConfiguracoesNotificacoes } from '../types';
import { gerarMarcosBiometricosJejum } from '../utils/biometriaMarcosUtils';

/**
 * Faixas de IDs numéricos para isolar e gerenciar cada categoria de notificação nativa
 * sem conflito entre água, jejum e pesagem.
 */
const CANAL_AGUA_ID = 'canal_hidratacao_jejuar';
const CANAL_JEJUM_ID = 'canal_jejum_jejuar';
const CANAL_JEJUM_SILENCIOSO_ID = 'canal_jejum_silencioso_jejuar';
const CANAL_PESO_ID = 'canal_peso_jejuar';
const CANAL_BIOIMPEDANCIA_ID = 'canal_bioimpedancia_jejuar';

// Offset de IDs para evitar colisões
const OFFSET_AGUA = 1000;
const OFFSET_JEJUM = 2000;
const OFFSET_PESO = 3000;
const OFFSET_BIOIMPEDANCIA = 4000;

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

    // Canal de Jejum com alta prioridade (Horário Normal: vibra e toca som)
    await LocalNotifications.createChannel({
      id: CANAL_JEJUM_ID,
      name: 'Ciclos de Jejum Intermitente',
      description: 'Alertas de início, marcos metabólicos e conclusão de jejum',
      importance: 5, // MAX - Acorda a tela e vibra
      visibility: 1,
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#00C975'
    });

    // Canal de Jejum Silencioso (Horário de Não Perturbe Noturno: entrega na barra sem vibrar)
    await LocalNotifications.createChannel({
      id: CANAL_JEJUM_SILENCIOSO_ID,
      name: 'Marcos de Jejum (Silencioso Noturno)',
      description: 'Entrega marcos biométricos na barra de status durante a madrugada sem tocar som ou vibrar',
      importance: 2, // LOW - Sem som e sem vibração, visível na barra ao acordar
      visibility: 1,
      vibration: false,
      lights: false
    });

    // Canal de Lembrete de Peso com alta prioridade
    await LocalNotifications.createChannel({
      id: CANAL_PESO_ID,
      name: 'Lembretes de Registro de Peso',
      description: 'Alertas nos dias e horários programados para registro de evolução corporal',
      importance: 4, // HIGH - Toca som, vibra e exibe banner
      visibility: 1,
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#00C975'
    });

    // Canal de Lembrete de Bioimpedância com alta prioridade
    await LocalNotifications.createChannel({
      id: CANAL_BIOIMPEDANCIA_ID,
      name: 'Lembretes de Exame de Bioimpedância',
      description: 'Alertas periódicos (7, 15 ou 30 dias) baseados na data da última bioimpedância registrada',
      importance: 4, // HIGH - Toca som, vibra e exibe banner
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
        smallIcon: 'ic_stat_jejuar',
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
 * Verifica se uma determinada data/hora cai dentro do período de Não Perturbe configurado.
 */
export function verificarHorarioNaoPerturbe(
  dataAlvo: Date,
  naoPerturbeAtivo: boolean = false,
  inicioStr: string = '23:00',
  fimStr: string = '07:00'
): boolean {
  if (!naoPerturbeAtivo) return false;

  const minAlvo = dataAlvo.getHours() * 60 + dataAlvo.getMinutes();
  const [hIni, mIni] = (inicioStr || '23:00').split(':').map(Number);
  const [hFim, mFim] = (fimStr || '07:00').split(':').map(Number);

  const minIni = (hIni || 23) * 60 + (mIni || 0);
  const minFim = (hFim || 7) * 60 + (mFim || 0);

  if (minIni > minFim) {
    return minAlvo >= minIni || minAlvo < minFim;
  }
  return minAlvo >= minIni && minAlvo < minFim;
}

/**
 * Dispara uma notificação externa real no navegador/sistema operacional do celular via Service Worker
 * quando o aplicativo está em execução ou em segundo plano na Web/PWA.
 * Usa a mesma `tag` do servidor Web Push para que o sistema operacional unifique sem duplicar.
 */
export async function dispararNotificacaoExternaSistema(params: {
  titulo: string;
  corpo: string;
  tag: string;
  silenciosa?: boolean;
  url?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const modoSilencioso = Boolean(params.silenciosa);
    if ('serviceWorker' in navigator) {
      const registro = await navigator.serviceWorker.ready;
      await registro.showNotification(params.titulo, {
        body: params.corpo,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: params.tag,
        renotify: !modoSilencioso,
        silent: modoSilencioso,
        vibrate: modoSilencioso ? [] : [250, 100, 250, 100, 250],
        data: {
          url: params.url || '/?tab=biometria',
          acao: params.url?.includes('tab=peso')
            ? 'peso'
            : params.url?.includes('tab=bioimpedancia')
            ? 'bioimpedancia'
            : 'biometria',
          tipo: params.url?.includes('tab=peso')
            ? 'lembrete_peso'
            : params.url?.includes('tab=bioimpedancia')
            ? 'lembrete_bioimpedancia'
            : 'marco_biometrico'
        }
      } as any);
      return true;
    } else {
      new Notification(params.titulo, {
        body: params.corpo,
        icon: '/icon-192.png',
        tag: params.tag,
        silent: modoSilencioso
      });
      return true;
    }
  } catch (err) {
    console.warn('[Notificação Externa Sistema] Aviso ao exibir notificação:', err);
    return false;
  }
}

/**
 * Agenda todos os marcos biométricos do jejum em andamento (4h, 8h, 12h, 14h, 16h, 18h, 24h, 36h, 48h, 72h, 168h + meta)
 * diretamente no hardware do celular via Capacitor LocalNotifications.
 * Respeita o modo silencioso caso o horário previsto caia na janela de Não Perturbe Noturno.
 */
export async function agendarMarcosBiometricosJejum(
  dataInicio: Date,
  metaHoras: number,
  nomePlano: string,
  pesoKg: number = 72.4,
  configNotificacoes?: ConfiguracoesNotificacoes
): Promise<number> {
  if (!ehAmbienteNativo()) return 0;

  try {
    await inicializarCanaisNativos();

    // Cancela alertas anteriores de marcos biométricos de jejum
    await cancelarNotificacoesJejum();

    const agoraMs = Date.now();
    const notificacoes: any[] = [];
    const marcos = gerarMarcosBiometricosJejum(metaHoras, nomePlano, pesoKg);

    for (const marco of marcos) {
      const momentoMarco = new Date(dataInicio.getTime() + marco.horas * 3600 * 1000);
      if (momentoMarco.getTime() > agoraMs) {
        const caiNoNaoPerturbe = verificarHorarioNaoPerturbe(
          momentoMarco,
          Boolean(configNotificacoes?.naoPerturbeAtivo),
          configNotificacoes?.naoPerturbeHoraInicio || '23:00',
          configNotificacoes?.naoPerturbeHoraFim || '07:00'
        );

        notificacoes.push({
          id: OFFSET_JEJUM + marco.horas,
          title: marco.titulo,
          body: marco.mensagem,
          channelId: caiNoNaoPerturbe ? CANAL_JEJUM_SILENCIOSO_ID : CANAL_JEJUM_ID,
          smallIcon: 'ic_stat_jejuar',
          schedule: {
            at: momentoMarco,
            allowWhileIdle: true
          },
          extra: {
            tipo: 'marco_biometrico',
            acao: 'biometria',
            horas: marco.horas
          }
        });
      }
    }

    if (notificacoes.length > 0) {
      await LocalNotifications.schedule({ notifications: notificacoes });
      console.log(`[Capacitor LocalNotifications] ${notificacoes.length} marcos biométricos externos agendados com sucesso.`);
    }

    return notificacoes.length;
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao agendar marcos biométricos:', err);
    return 0;
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
          smallIcon: 'ic_stat_jejuar',
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
 * Cancela alertas de marcos biométricos de jejum caso o usuário finalize ou interrompa antes do prazo
 */
export async function cancelarNotificacoesJejum(): Promise<void> {
  if (!ehAmbienteNativo()) return;
  try {
    const pendentes: PendingResult = await LocalNotifications.getPending();
    const idsParaCancelar = pendentes.notifications
      .filter(item => item.id >= OFFSET_JEJUM && item.id < OFFSET_JEJUM + 200)
      .map(item => ({ id: item.id }));

    if (idsParaCancelar.length > 0) {
      await LocalNotifications.cancel({ notifications: idsParaCancelar });
      console.log(`[Capacitor LocalNotifications] ${idsParaCancelar.length} alertas de marcos de jejum cancelados.`);
    }
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
          smallIcon: 'ic_stat_jejuar',
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

/**
 * Interface com os parâmetros necessários para agendar as notificações do processo de jejum
 */
export interface ParametrosNotificacoesProcessoJejum {
  config: ConfiguracoesNotificacoes;
  horaInicioDiaria?: string; // Formato "HH:mm" (ex: "19:00")
  emJejum: boolean;
  dataInicio?: Date | null;
  metaHoras?: number;
  nomePlano?: string;
}

/**
 * Cancela todas as notificações de processo de jejum agendadas anteriormente no sistema nativo
 */
export async function cancelarNotificacoesProcessoJejum(): Promise<void> {
  if (!ehAmbienteNativo()) return;

  try {
    const pendentes: PendingResult = await LocalNotifications.getPending();
    const idsCancelamento = pendentes.notifications
      .filter(item => item.id >= (OFFSET_JEJUM + 100) && item.id <= (OFFSET_JEJUM + 110))
      .map(item => ({ id: item.id }));

    if (idsCancelamento.length > 0) {
      await LocalNotifications.cancel({ notifications: idsCancelamento });
      console.log(`[Capacitor LocalNotifications] ${idsCancelamento.length} notificações do processo de jejum canceladas.`);
    }
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao cancelar notificações do processo de jejum:', err);
  }
}

/**
 * Converte uma string de hora "HH:mm" no próximo Date correspondente no futuro
 */
function obterProximoHorarioInicio(horaStr: string): Date {
  const [h, m] = (horaStr || '19:00').split(':').map(Number);
  const agora = new Date();
  const proximo = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h || 19, m || 0, 0, 0);
  
  // Se o horário de hoje já passou, projeta para o mesmo horário de amanhã
  if (proximo.getTime() <= agora.getTime()) {
    proximo.setDate(proximo.getDate() + 1);
  }
  return proximo;
}

/**
 * Agenda todas as notificações do Processo de Jejum (alertas pré-início, início perdido, marcos e alertas pré-término)
 * diretamente no hardware do Android via Capacitor LocalNotifications.
 */
export async function agendarNotificacoesProcessoJejum(params: ParametrosNotificacoesProcessoJejum): Promise<number> {
  if (!ehAmbienteNativo()) return 0;

  try {
    await inicializarCanaisNativos();
    
    // Cancela agendamentos anteriores do processo de jejum para renovar a grade
    await cancelarNotificacoesProcessoJejum();

    const { config, horaInicioDiaria, emJejum, dataInicio, metaHoras = 16, nomePlano = '16:8' } = params;
    const agoraMs = Date.now();
    const notificacoes: any[] = [];

    // -------------------------------------------------------------
    // FASE A: NOTIFICAÇÕES QUANDO O USUÁRIO NÃO ESTÁ EM JEJUM (PRÉ-INÍCIO)
    // -------------------------------------------------------------
    if (!emJejum && horaInicioDiaria) {
      const proximoInicio = obterProximoHorarioInicio(horaInicioDiaria);
      const proximoInicioMs = proximoInicio.getTime();

      // 1. 2h antes do início do jejum
      if (config?.jejum2hAntesInicio) {
        const momento2hAntes = new Date(proximoInicioMs - 2 * 3600 * 1000);
        if (momento2hAntes.getTime() > agoraMs) {
          notificacoes.push({
            id: OFFSET_JEJUM + 102,
            title: '⏰ Falta 2h para o seu jejum!',
            body: 'Prepare sua última refeição nutritiva para iniciar seu ciclo de jejum com energia.',
            channelId: CANAL_JEJUM_ID,
            smallIcon: 'ic_stat_jejuar',
            schedule: { at: momento2hAntes, allowWhileIdle: true },
            extra: { tipo: 'processo_jejum', subtipo: '2h_antes_inicio' }
          });
        }
      }

      // 2. 1h antes do início do jejum
      if (config?.jejum1hAntesInicio) {
        const momento1hAntes = new Date(proximoInicioMs - 1 * 3600 * 1000);
        if (momento1hAntes.getTime() > agoraMs) {
          notificacoes.push({
            id: OFFSET_JEJUM + 101,
            title: '🥗 Falta 1h para fechar a janela!',
            body: 'Hora de finalizar sua refeição e se preparar para o ciclo de renovação celular.',
            channelId: CANAL_JEJUM_ID,
            smallIcon: 'ic_stat_jejuar',
            schedule: { at: momento1hAntes, allowWhileIdle: true },
            extra: { tipo: 'processo_jejum', subtipo: '1h_antes_inicio' }
          });
        }
      }

      // 3. Início do jejum perdido (dispara 30 minutos após o horário previsto caso não tenha iniciado)
      if (config?.jejumInicioPerdido) {
        const momentoPerdido = new Date(proximoInicioMs + 30 * 60 * 1000);
        if (momentoPerdido.getTime() > agoraMs) {
          notificacoes.push({
            id: OFFSET_JEJUM + 100,
            title: '⚠️ Perdeu o horário de início?',
            body: `Você não ativou seu timer de jejum às ${horaInicioDiaria}. Toque aqui para iniciar agora mesmo!`,
            channelId: CANAL_JEJUM_ID,
            smallIcon: 'ic_stat_jejuar',
            schedule: { at: momentoPerdido, allowWhileIdle: true },
            extra: { tipo: 'processo_jejum', subtipo: 'inicio_perdido' }
          });
        }
      }
    }

    // -------------------------------------------------------------
    // FASE B: NOTIFICAÇÕES QUANDO O USUÁRIO JÁ ESTÁ EM JEJUM ATIVO
    // -------------------------------------------------------------
    if (emJejum && dataInicio) {
      const inicioMs = dataInicio.getTime();

      // 4. 3h após o início do jejum
      if (config?.jejum3hAposInicio) {
        const momento3hApos = new Date(inicioMs + 3 * 3600 * 1000);
        if (momento3hApos.getTime() > agoraMs) {
          notificacoes.push({
            id: OFFSET_JEJUM + 103,
            title: '🌱 3 horas de jejum concluídas!',
            body: 'Glicose estabilizada. Seu corpo está entrando em fase de digestão plena!',
            channelId: CANAL_JEJUM_ID,
            smallIcon: 'ic_stat_jejuar',
            schedule: { at: momento3hApos, allowWhileIdle: true },
            extra: { tipo: 'processo_jejum', subtipo: '3h_apos_inicio' }
          });
        }
      }

      // 5. 2h antes do término do jejum
      if (config?.jejum2hAntesFim && metaHoras > 2) {
        const momento2hAntesFim = new Date(inicioMs + (metaHoras - 2) * 3600 * 1000);
        if (momento2hAntesFim.getTime() > agoraMs) {
          notificacoes.push({
            id: OFFSET_JEJUM + 104,
            title: '⏳ Faltam 2 horas para concluir!',
            body: `Sua queima lipídica está no pico! Falta pouco para bater sua meta de ${metaHoras}h.`,
            channelId: CANAL_JEJUM_ID,
            smallIcon: 'ic_stat_jejuar',
            schedule: { at: momento2hAntesFim, allowWhileIdle: true },
            extra: { tipo: 'processo_jejum', subtipo: '2h_antes_fim' }
          });
        }
      }

      // 6. 1h antes do término do jejum
      if (config?.jejum1hAntesFim && metaHoras > 1) {
        const momento1hAntesFim = new Date(inicioMs + (metaHoras - 1) * 3600 * 1000);
        if (momento1hAntesFim.getTime() > agoraMs) {
          notificacoes.push({
            id: OFFSET_JEJUM + 105,
            title: '🎯 Reta final do jejum (1h restante)!',
            body: 'Prepare sua próxima refeição saudável. Autofagia celular em nível máximo!',
            channelId: CANAL_JEJUM_ID,
            smallIcon: 'ic_stat_jejuar',
            schedule: { at: momento1hAntesFim, allowWhileIdle: true },
            extra: { tipo: 'processo_jejum', subtipo: '1h_antes_fim' }
          });
        }
      }

      // 7. Término do jejum perdido (dispara 30 min após a meta expirar)
      if (config?.jejumFimPerdido) {
        const momentoFimPerdido = new Date(inicioMs + (metaHoras * 3600 + 1800) * 1000);
        if (momentoFimPerdido.getTime() > agoraMs) {
          notificacoes.push({
            id: OFFSET_JEJUM + 106,
            title: '⏱️ Meta concluída! Já se alimentou?',
            body: `Sua meta de ${metaHoras}h de jejum (${nomePlano}) venceu há 30 min. Lembre-se de registrar a conclusão!`,
            channelId: CANAL_JEJUM_ID,
            smallIcon: 'ic_stat_jejuar',
            schedule: { at: momentoFimPerdido, allowWhileIdle: true },
            extra: { tipo: 'processo_jejum', subtipo: 'fim_perdido' }
          });
        }
      }
    }

    // -------------------------------------------------------------
    // DISPARO E AGENDAMENTO NO HARDWARE DO DISPOSITIVO
    // -------------------------------------------------------------
    if (notificacoes.length > 0) {
      await LocalNotifications.schedule({ notifications: notificacoes });
      console.log(`[Capacitor LocalNotifications] ${notificacoes.length} notificações de processo de jejum agendadas com sucesso no hardware.`);
    }

    return notificacoes.length;
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao agendar notificações de processo de jejum:', err);
    return 0;
  }
}

/**
 * Remove acentos e converte para minúsculas para comparação resiliente de dias da semana
 */
export function normalizarTextoDiaSemana(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Verifica se a data de referência (padrão: hoje) corresponde aos dias da semana configurados
 * para o lembrete de registro de peso (aceita string única ex: "Sábado", "Todos os dias" ou array de strings).
 */
export function verificarDiaSemanaPesoValido(
  diasConfig: string | string[] | undefined,
  dataRef: Date = new Date()
): boolean {
  if (!diasConfig) return true;

  const textoConfig = Array.isArray(diasConfig) ? diasConfig.join(', ') : String(diasConfig);
  const normalizado = normalizarTextoDiaSemana(textoConfig);

  if (!normalizado || normalizado.includes('todos')) return true;

  // getDay(): 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  const indiceDia = dataRef.getDay();
  const chavesDiaPorIndice: Record<number, string[]> = {
    0: ['domingo', 'dom', 'fins de semana', 'fim de semana'],
    1: ['segunda', 'seg'],
    2: ['terca', 'ter'],
    3: ['quarta', 'qua'],
    4: ['quinta', 'qui'],
    5: ['sexta', 'sex'],
    6: ['sabado', 'sab', 'fins de semana', 'fim de semana']
  };

  if (indiceDia >= 1 && indiceDia <= 5 && normalizado.includes('segunda a sexta')) {
    return true;
  }

  const chavesAceitas = chavesDiaPorIndice[indiceDia] || [];
  return chavesAceitas.some((chave) => normalizado.includes(chave));
}

/**
 * Extrai a lista de códigos de dias da semana no padrão Capacitor LocalNotifications:
 * 1 = Domingo (Sunday), 2 = Segunda, 3 = Terça, 4 = Quarta, 5 = Quinta, 6 = Sexta, 7 = Sábado
 */
function extrairCodigosDiasSemanaCapacitor(diasConfig: string | string[] | undefined): number[] {
  if (!diasConfig) return [1, 2, 3, 4, 5, 6, 7];

  const textoConfig = Array.isArray(diasConfig) ? diasConfig.join(', ') : String(diasConfig);
  const normalizado = normalizarTextoDiaSemana(textoConfig);

  if (!normalizado || normalizado.includes('todos')) {
    return [1, 2, 3, 4, 5, 6, 7];
  }
  if (normalizado.includes('segunda a sexta')) {
    return [2, 3, 4, 5, 6];
  }
  if (normalizado.includes('fins de semana') || normalizado.includes('fim de semana')) {
    return [1, 7];
  }

  const diasEncontrados: number[] = [];
  if (normalizado.includes('domingo') || normalizado.includes('dom')) diasEncontrados.push(1);
  if (normalizado.includes('segunda') || normalizado.includes('seg')) diasEncontrados.push(2);
  if (normalizado.includes('terca') || normalizado.includes('ter')) diasEncontrados.push(3);
  if (normalizado.includes('quarta') || normalizado.includes('qua')) diasEncontrados.push(4);
  if (normalizado.includes('quinta') || normalizado.includes('qui')) diasEncontrados.push(5);
  if (normalizado.includes('sexta') || normalizado.includes('sex')) diasEncontrados.push(6);
  if (normalizado.includes('sabado') || normalizado.includes('sab')) diasEncontrados.push(7);

  return diasEncontrados.length > 0 ? diasEncontrados : [1, 2, 3, 4, 5, 6, 7];
}

/**
 * Cancela todos os agendamentos anteriores de lembrete de peso no sistema nativo
 */
export async function cancelarNotificacoesPeso(): Promise<void> {
  if (!ehAmbienteNativo()) return;

  try {
    const pendentes: PendingResult = await LocalNotifications.getPending();
    const idsPesoParaCancelar = pendentes.notifications
      .filter((item) => item.id >= OFFSET_PESO && item.id < OFFSET_PESO + 100)
      .map((item) => ({ id: item.id }));

    if (idsPesoParaCancelar.length > 0) {
      await LocalNotifications.cancel({ notifications: idsPesoParaCancelar });
      console.log(`[Capacitor LocalNotifications] ${idsPesoParaCancelar.length} lembretes antigos de peso cancelados.`);
    }
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao cancelar lembretes de peso:', err);
  }
}

/**
 * Interface de parâmetros para agendamento nativo de lembrete de peso
 */
export interface ParametrosAgendamentoPeso {
  ativo: boolean;
  hora: string; // formato "08:00"
  dias: string | string[]; // ex: "Sábado", "Todos os dias", ["Sábado"]
}

/**
 * Agenda os lembretes semanais/diários de registro de peso diretamente no relógio do Android/iOS
 * via Capacitor LocalNotifications.
 */
export async function agendarNotificacoesPeso(params: ParametrosAgendamentoPeso): Promise<number> {
  if (!ehAmbienteNativo()) return 0;

  try {
    await inicializarCanaisNativos();
    await cancelarNotificacoesPeso();

    if (!params.ativo) {
      console.log('[Capacitor LocalNotifications] Lembrete de registro de peso desativado pelo usuário.');
      return 0;
    }

    const temPermissao = await solicitarPermissaoNativa();
    if (!temPermissao) return 0;

    const [hPeso, mPeso] = (params.hora || '08:00').split(':').map(Number);
    const hora = isNaN(hPeso) ? 8 : hPeso;
    const minuto = isNaN(mPeso) ? 0 : mPeso;

    const codigosDias = extrairCodigosDiasSemanaCapacitor(params.dias);
    const notificacoesParaAgendar: any[] = [];

    // Se todos os 7 dias estiverem ativos, agenda um único alarme diário recorrente
    if (codigosDias.length === 7) {
      notificacoesParaAgendar.push({
        id: OFFSET_PESO,
        title: '⚖️ Hora de Registrar seu Peso!',
        body: 'Bom dia! Suba na balança em jejum para acompanhar sua evolução corporal com consistência.',
        channelId: CANAL_PESO_ID,
        smallIcon: 'ic_stat_jejuar',
        schedule: {
          on: {
            hour: hora,
            minute: minuto
          },
          allowWhileIdle: true
        },
        extra: {
          tipo: 'lembrete_peso',
          acao: 'peso',
          url: '/?tab=peso'
        }
      });
    } else {
      // Agenda um alarme recorrente semanal para cada dia da semana selecionado (ex: Sábado = weekday 7)
      codigosDias.forEach((weekdayCode, idx) => {
        notificacoesParaAgendar.push({
          id: OFFSET_PESO + idx + 1,
          title: '⚖️ Hora de Registrar seu Peso!',
          body: 'Bom dia! Suba na balança em jejum para acompanhar sua evolução corporal com consistência.',
          channelId: CANAL_PESO_ID,
          smallIcon: 'ic_stat_jejuar',
          schedule: {
            on: {
              weekday: weekdayCode,
              hour: hora,
              minute: minuto
            },
            allowWhileIdle: true
          },
          extra: {
            tipo: 'lembrete_peso',
            acao: 'peso',
            url: '/?tab=peso'
          }
        });
      });
    }

    if (notificacoesParaAgendar.length > 0) {
      await LocalNotifications.schedule({ notifications: notificacoesParaAgendar });
      console.log(`[Capacitor LocalNotifications] ${notificacoesParaAgendar.length} lembretes nativos de peso agendados para ${params.hora}.`);
    }

    return notificacoesParaAgendar.length;
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao agendar lembretes de peso:', err);
    return 0;
  }
}

/**
 * Registra um ouvinte nativo para quando o usuário toca em uma notificação do Android/iOS,
 * permitindo abrir diretamente a tela correspondente (ex: Dados Corporais/Peso, Água ou Biometria).
 */
export async function registrarOuvinteCliqueNotificacaoNativa(
  aoClicar: (acao: string, url: string) => void
): Promise<() => void> {
  if (!ehAmbienteNativo()) return () => {};

  try {
    const listener = await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (evento) => {
        const extra = evento?.notification?.extra || {};
        const acao = String(extra.acao || extra.tipo || '');
        const url = String(extra.url || '');
        aoClicar(acao, url);
      }
    );

    return () => {
      listener.remove().catch(() => {});
    };
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Aviso ao registrar ouvinte de clique:', err);
    return () => {};
  }
}

/**
 * Calcula a data e hora exatas do próximo alarme de Bioimpedância somando `intervaloDias` (7, 15 ou 30)
 * à data da última bioimpedância registrada (`YYYY-MM-DD`).
 * Retorna `null` caso não exista nenhum exame de bioimpedância registrado.
 */
export function calcularDataAlvoBioimpedancia(
  dataUltimoExameStr: string | null | undefined,
  intervaloDias: number = 15,
  horaStr: string = '08:00'
): Date | null {
  if (!dataUltimoExameStr || typeof dataUltimoExameStr !== 'string') return null;

  const partesData = dataUltimoExameStr.slice(0, 10).split('-').map(Number);
  if (partesData.length !== 3 || partesData.some(isNaN)) return null;

  const [ano, mes, dia] = partesData;
  const [hBio, mBio] = (horaStr || '08:00').split(':').map(Number);
  const hora = isNaN(hBio) ? 8 : hBio;
  const minuto = isNaN(mBio) ? 0 : mBio;

  const diasParaSomar = intervaloDias === 7 || intervaloDias === 15 || intervaloDias === 30 ? intervaloDias : 15;
  const dataAlvo = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
  dataAlvo.setDate(dataAlvo.getDate() + diasParaSomar);

  return isNaN(dataAlvo.getTime()) ? null : dataAlvo;
}

/**
 * Cancela todos os agendamentos anteriores de lembrete de bioimpedância no sistema nativo
 */
export async function cancelarNotificacoesBioimpedancia(): Promise<void> {
  if (!ehAmbienteNativo()) return;

  try {
    const pendentes: PendingResult = await LocalNotifications.getPending();
    const idsBioParaCancelar = pendentes.notifications
      .filter((item) => item.id >= OFFSET_BIOIMPEDANCIA && item.id < OFFSET_BIOIMPEDANCIA + 100)
      .map((item) => ({ id: item.id }));

    if (idsBioParaCancelar.length > 0) {
      await LocalNotifications.cancel({ notifications: idsBioParaCancelar });
      console.log(`[Capacitor LocalNotifications] ${idsBioParaCancelar.length} lembretes antigos de bioimpedância cancelados.`);
    }
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao cancelar lembretes de bioimpedância:', err);
  }
}

/**
 * Interface de parâmetros para agendamento nativo do lembrete de bioimpedância
 */
export interface ParametrosAgendamentoBioimpedancia {
  ativo: boolean;
  hora: string; // formato "08:00"
  intervaloDias: number; // 7, 15 ou 30 dias
  dataUltimoExame?: string | null; // formato "YYYY-MM-DD"
}

/**
 * Agenda o alarme nativo de Bioimpedância diretamente no Android/iOS para a data exata
 * (`dataUltimoExame + intervaloDias` às `hora`).
 * Regra de Ouro: Se não houver registro de Bioimpedância (`!dataUltimoExame`) ou se o lembrete estiver inativo,
 * cancela qualquer alarme anterior e não cria nenhum agendamento.
 */
export async function agendarNotificacoesBioimpedancia(
  params: ParametrosAgendamentoBioimpedancia
): Promise<number> {
  if (!ehAmbienteNativo()) return 0;

  try {
    await inicializarCanaisNativos();
    await cancelarNotificacoesBioimpedancia();

    // Regra de Ouro: Sem registro de bioimpedância ou com lembrete desativado, o alarme não deve existir
    if (!params.ativo || !params.dataUltimoExame) {
      console.log('[Capacitor LocalNotifications] Alarme de bioimpedância não agendado (inativo ou sem exame registrado).');
      return 0;
    }

    const dataAlvo = calcularDataAlvoBioimpedancia(
      params.dataUltimoExame,
      params.intervaloDias,
      params.hora
    );

    if (!dataAlvo) return 0;

    // Se a data e hora programadas ainda estiverem no futuro, agenda o alarme pontual no hardware
    if (dataAlvo.getTime() <= Date.now()) {
      return 0;
    }

    const temPermissao = await solicitarPermissaoNativa();
    if (!temPermissao) return 0;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: OFFSET_BIOIMPEDANCIA + 1,
          title: '🧬 Hora da sua Nova Bioimpedância!',
          body: `Completaram-se ${params.intervaloDias} dias desde seu último exame. Abra a aba Exames e registre sua nova medição!`,
          channelId: CANAL_BIOIMPEDANCIA_ID,
          smallIcon: 'ic_stat_jejuar',
          schedule: {
            at: dataAlvo,
            allowWhileIdle: true
          },
          extra: {
            tipo: 'lembrete_bioimpedancia',
            acao: 'bioimpedancia',
            url: '/?tab=bioimpedancia'
          }
        }
      ]
    });

    console.log(
      `[Capacitor LocalNotifications] Alarme nativo de bioimpedância agendado para ${dataAlvo.toLocaleDateString('pt-BR')} às ${params.hora}`
    );
    return 1;
  } catch (err) {
    console.warn('[Capacitor LocalNotifications] Erro ao agendar alarme de bioimpedância:', err);
    return 0;
  }
}




