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
 * Agenda todos os marcos biométricos do jejum em andamento diretamente no hardware do celular.
 * Dispara notificações ricas com cálculos estimados de queima lipídica e autofagia nos marcos de 8h, 12h, 14h e na conclusão (ex: 16h).
 */
export async function agendarMarcosBiometricosJejum(
  dataInicio: Date,
  metaHoras: number,
  nomePlano: string,
  pesoKg: number = 72.4
): Promise<number> {
  if (!ehAmbienteNativo()) return 0;

  try {
    await inicializarCanaisNativos();
    
    // Cancela alertas anteriores de jejum
    await cancelarNotificacoesJejum();

    const agoraMs = Date.now();
    const fatorPeso = pesoKg / 70;
    const notificacoes: any[] = [];

    // Definição dos marcos com estimativas biométricas reais
    const marcos = [
      {
        horas: 8,
        id: OFFSET_JEJUM + 8,
        titulo: '⚡ 8h de Jejum: Insulina no menor nível!',
        corpo: 'Seu fígado começou a liberar ácidos graxos estocados. Toque para ver sua biometria.',
      },
      {
        horas: 12,
        id: OFFSET_JEJUM + 12,
        titulo: '🔥 12h de Jejum: Cetose Ativada!',
        corpo: `Cetonas alimentando seu cérebro! Estimativa de hoje: ~${Math.round(12 * 2.8 * fatorPeso)}g de gordura pura oxidada.`,
      },
      {
        horas: 14,
        id: OFFSET_JEJUM + 14,
        titulo: '🔬 14h de Jejum: Queima Lipídica Profunda!',
        corpo: `Suas mitocôndrias aceleraram a queima. Estimativa: ~${Math.round(14 * 2.8 * fatorPeso)}g de gordura pura oxidada hoje!`,
      },
      {
        horas: metaHoras,
        id: OFFSET_JEJUM + 1,
        titulo: `✨ Meta de ${metaHoras}h Atingida! (${nomePlano})`,
        corpo: `Autofagia celular no pico máximo e ~${Math.round(metaHoras * 3.2 * fatorPeso)}g de gordura oxidada. Parabéns!`,
      }
    ];

    for (const marco of marcos) {
      if (marco.horas > metaHoras && marco.horas !== metaHoras) continue;
      
      const momentoMarco = new Date(dataInicio.getTime() + marco.horas * 3600 * 1000);
      if (momentoMarco.getTime() > agoraMs) {
        notificacoes.push({
          id: marco.id,
          title: marco.titulo,
          body: marco.corpo,
          channelId: CANAL_JEJUM_ID,
          smallIcon: 'ic_stat_icon_config_sample',
          schedule: {
            at: momentoMarco,
            allowWhileIdle: true
          },
          extra: {
            tipo: 'marco_biometrico',
            horas: marco.horas
          }
        });
      }
    }

    if (notificacoes.length > 0) {
      await LocalNotifications.schedule({ notifications: notificacoes });
      console.log(`[Capacitor LocalNotifications] ${notificacoes.length} marcos biométricos agendados com sucesso.`);
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
    await LocalNotifications.cancel({ 
      notifications: [
        { id: OFFSET_JEJUM + 1 },
        { id: OFFSET_JEJUM + 4 },
        { id: OFFSET_JEJUM + 8 },
        { id: OFFSET_JEJUM + 12 },
        { id: OFFSET_JEJUM + 14 },
        { id: OFFSET_JEJUM + 16 },
        { id: OFFSET_JEJUM + 18 },
        { id: OFFSET_JEJUM + 20 }
      ] 
    });
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
            smallIcon: 'ic_stat_icon_config_sample',
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
            smallIcon: 'ic_stat_icon_config_sample',
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
            smallIcon: 'ic_stat_icon_config_sample',
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
            smallIcon: 'ic_stat_icon_config_sample',
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
            smallIcon: 'ic_stat_icon_config_sample',
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
            smallIcon: 'ic_stat_icon_config_sample',
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
            smallIcon: 'ic_stat_icon_config_sample',
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


