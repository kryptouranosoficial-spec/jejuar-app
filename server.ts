/**
 * @file server.ts
 * @description Servidor Full-Stack Express integrado ao Vite e Agendador de Web Push.
 * Executa continuamente em segundo plano (porta 3000), monitorando o Firestore a cada 60 segundos
 * para disparar alertas reais de jejum e hidratação nos celulares dos usuários com o app fechado.
 */

import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  getFirestore,
  initializeFirestore,
  setLogLevel
} from 'firebase/firestore';

// Suprime avisos de desconexão e reconexão de canais ociosos do Firestore
setLogLevel('error');

const firebaseConfig = {
  apiKey: "AIzaSyA1fIME-D9Bg7mZBBnicRZvNNTWUSyMT-w",
  authDomain: "jejuar-7da3b.firebaseapp.com",
  projectId: "jejuar-7da3b",
  storageBucket: "jejuar-7da3b.firebasestorage.app",
  messagingSenderId: "65689530196",
  appId: "1:65689530196:web:3aeeaf90d2e494f807a2c1"
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicialização resiliente com auto-detecção de long polling para evitar ECONNRESET em proxies
const db = (() => {
  try {
    return initializeFirestore(firebaseApp, {
      experimentalAutoDetectLongPolling: true
    });
  } catch {
    return getFirestore(firebaseApp);
  }
})();

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Configuração das Chaves VAPID Oficiais do Jejuar
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BJhZ8UVaICG-vfkI04dGhJKmk4OHkS0tglNs1IWDdSE0ScGdRfVUtpAeLuNyxwyhzu40SxkFMpcs3lzTubd6MgM';
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

// Carrega a chave privada do arquivo vapid-keys.json caso não esteja nas env vars
if (!VAPID_PRIVATE_KEY) {
  try {
    const keysFile = path.resolve('vapid-keys.json');
    if (fs.existsSync(keysFile)) {
      const keysJson = JSON.parse(fs.readFileSync(keysFile, 'utf8'));
      VAPID_PRIVATE_KEY = keysJson.privateKey || '';
    }
  } catch (err) {
    console.warn('[VAPID] Aviso ao carregar vapid-keys.json:', err);
  }
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:contato@jejuar.app',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    console.log('[Push Server] Chaves VAPID configuradas com sucesso.');
  } catch (err) {
    console.error('[Push Server] Erro ao registrar chaves VAPID:', err);
  }
}

app.use(express.json() as any);

/**
 * Interface do payload de notificação a ser enviado pelo Web Push
 */
interface NotificacaoPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url: string;
    tipo?: string;
  };
}

/**
 * Registra um evento de auditoria/diagnóstico no Firestore subcoleção `historico_disparos` do usuário.
 * Permite acompanhamento transparente de disparos, horários e respostas do FCM.
 */
async function gravarLogDisparo(
  usuarioId: string,
  tipo: string,
  status: 'sucesso' | 'erro' | 'info',
  detalhe: string,
  fcmStatus?: string | number
) {
  try {
    const historicoRef = collection(db, 'usuarios', usuarioId, 'historico_disparos');
    await addDoc(historicoRef, {
      tipo,
      status,
      detalhe,
      fcmStatus: fcmStatus || null,
      timestamp: serverTimestamp(),
      dataHoraFormatada: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    });
  } catch (err) {
    console.warn(`[LogDisparo] Erro ao gravar histórico no Firestore para o usuário ${usuarioId}:`, err);
  }
}

/**
 * Envia uma notificação push com prioridade máxima (Urgency: high) para todos os dispositivos ativos cadastrados.
 * O cabeçalho 'Urgency: high' e TTL garantem que aparelhos Android (Samsung, Xiaomi, Motorola)
 * acordem o display mesmo durante o modo de economia de energia profunda (Doze Mode).
 */
async function enviarNotificacaoParaUsuario(
  usuarioId: string, 
  payload: NotificacaoPayload
): Promise<number> {
  let enviosSucesso = 0;
  try {
    const dispositivosRef = collection(db, 'usuarios', usuarioId, 'dispositivos_push');
    const q = query(dispositivosRef, where('ativo', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      if (payload.tag === 'teste-agua') {
        await gravarLogDisparo(
          usuarioId,
          payload.tag || 'geral',
          'erro',
          `Tentativa de envio de "${payload.title}", porém nenhum dispositivo ativo foi encontrado no Firestore.`,
          '404_sem_dispositivos'
        );
      }
      return 0;
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      tag: payload.tag || 'jejuar-notificacao',
      data: payload.data || { url: '/' }
    });

    const opcoesPush = {
      urgency: 'high' as const,
      TTL: 86400, // 24 horas
      headers: {
        'Urgency': 'high',
        'Topic': payload.tag || 'jejuar-alerta'
      }
    };

    for (const docSnap of snapshot.docs) {
      const disp = docSnap.data();
      if (!disp.endpoint || !disp.keys?.p256dh || !disp.keys?.auth) continue;

      const pushSubscription = {
        endpoint: disp.endpoint,
        keys: {
          p256dh: disp.keys.p256dh,
          auth: disp.keys.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payloadString, opcoesPush);
        enviosSucesso++;
        await gravarLogDisparo(
          usuarioId,
          payload.tag || 'geral',
          'sucesso',
          `Notificação "${payload.title}" entregue com sucesso ao FCM.`,
          201
        );
      } catch (pushErr: any) {
        if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
          console.log(`[Push] Dispositivo ${docSnap.id} expirado no FCM (Status ${pushErr.statusCode}). Desativando no Firestore...`);
          await updateDoc(docSnap.ref, {
            ativo: false,
            motivoInativo: 'subscription_expired_410',
            desativadoEm: serverTimestamp()
          }).catch(() => {});

          await gravarLogDisparo(
            usuarioId,
            payload.tag || 'geral',
            'erro',
            `FCM recusou o envio (Status ${pushErr.statusCode}): Token de push expirado ou desinstalado. Dispositivo desativado.`,
            pushErr.statusCode
          );
        } else {
          console.warn(`[Push] Falha ao enviar para ${docSnap.id}:`, pushErr.message);
          await gravarLogDisparo(
            usuarioId,
            payload.tag || 'geral',
            'erro',
            `Falha na entrega via FCM: ${pushErr.message || 'Erro de comunicação'}`,
            pushErr.statusCode || 500
          );
        }
      }
    }
  } catch (err: any) {
    console.error(`[Push] Erro ao buscar dispositivos do usuário ${usuarioId}:`, err);
    await gravarLogDisparo(
      usuarioId,
      payload.tag || 'geral',
      'erro',
      `Exceção ao processar notificação: ${err?.message || 'Erro interno'}`,
      500
    );
  }
  return enviosSucesso;
}

/**
 * Verifica se o horário atual está dentro da janela do Período de Não Perturbe.
 * Suporta intervalos que cruzam a meia-noite (ex: 23:00 até 07:00 do dia seguinte).
 */
function estaNoPeriodoNaoPerturbe(horaAtualStr: string, inicio = '23:00', fim = '07:00'): boolean {
  if (!horaAtualStr) return false;
  const [hAtual, mAtual] = horaAtualStr.split(':').map(Number);
  const [hIni, mIni] = inicio.split(':').map(Number);
  const [hFim, mFim] = fim.split(':').map(Number);

  const minAtual = (hAtual || 0) * 60 + (mAtual || 0);
  const minIni = (hIni || 23) * 60 + (mIni || 0);
  const minFim = (hFim || 7) * 60 + (mFim || 0);

  if (minIni > minFim) {
    // Cruzando a meia-noite (ex: 23:00 às 07:00 => >= 23:00 OU < 07:00)
    return minAtual >= minIni || minAtual < minFim;
  }
  return minAtual >= minIni && minAtual < minFim;
}

/**
 * ----------------------------------------------------------------------------
 * 1. MÓDULO DE AVALIAÇÃO: JEJUM INTERMITENTE
 * ----------------------------------------------------------------------------
 * Avalia início programado, marcos de autofagia/queima e término da meta com tolerância temporal.
 */
async function avaliarNotificacoesJejum(
  usuario: any,
  usuarioId: string,
  userDocRef: any,
  agora: Date,
  hojeDataStr: string,
  horaAtualStr: string,
  totalMinutosAtual: number,
  emSilencioNoturno: boolean
): Promise<number> {
  let enviadas = 0;
  const configJejum = usuario.configuracoesJejum;
  const notifsJejum = configJejum?.notificacoes;
  const estadoJejum = usuario.estadoJejum || {};
  const agoraMs = agora.getTime();

  const horaInicioDiaria = configJejum?.horaInicioDiaria || '19:00';
  const inicioAutomatico = Boolean(configJejum?.inicioAutomatico);

  const [hProg, mProg] = horaInicioDiaria.split(':').map(Number);
  const minProgramado = (hProg || 19) * 60 + (mProg || 0);

  // Cenário A: Usuário NÃO está em jejum ativo
  if (!estadoJejum.emJejum) {
    // A1. 2h antes do início do jejum (tolerância de até 20 minutos)
    const min2hAntes = (minProgramado - 120 + 1440) % 1440;
    if (totalMinutosAtual >= min2hAntes && totalMinutosAtual < min2hAntes + 25 && notifsJejum?.jejum2hAntesInicio && !emSilencioNoturno) {
      const slot2h = `${hojeDataStr}_jejum_2h_antes`;
      if (usuario.ultimoAlertaJejumSlot !== slot2h) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: '2h para o Início do Jejum 🍽️',
          body: 'Prepare sua última refeição antes de começar seu ciclo de jejum.',
          tag: 'jejum-2h-antes',
          data: { url: '/?tab=jejum', tipo: 'preparar_jejum' }
        });
        if (enviou > 0) {
          enviadas += enviou;
          await updateDoc(userDocRef, {
            ultimoAlertaJejumSlot: slot2h,
            atualizadoEm: serverTimestamp()
          }).catch(() => {});
        }
      }
    }

    // A2. 1h antes do início do jejum (tolerância de até 20 minutos)
    const min1hAntes = (minProgramado - 60 + 1440) % 1440;
    if (totalMinutosAtual >= min1hAntes && totalMinutosAtual < min1hAntes + 25 && notifsJejum?.jejum1hAntesInicio && !emSilencioNoturno) {
      const slot1h = `${hojeDataStr}_jejum_1h_antes`;
      if (usuario.ultimoAlertaJejumSlot !== slot1h) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: '1h para o Início do Jejum ⏰',
          body: 'Quase na hora! Aproveite para beber água e finalizar sua refeição com calma.',
          tag: 'jejum-1h-antes',
          data: { url: '/?tab=jejum', tipo: 'preparar_jejum' }
        });
        if (enviou > 0) {
          enviadas += enviou;
          await updateDoc(userDocRef, {
            ultimoAlertaJejumSlot: slot1h,
            atualizadoEm: serverTimestamp()
          }).catch(() => {});
        }
      }
    }

    // A3. Horário de Início Programado (tolerância de até 30 minutos)
    if (totalMinutosAtual >= minProgramado && totalMinutosAtual < minProgramado + 30) {
      const slotInicio = `${hojeDataStr}_jejum_inicio`;
      if (usuario.ultimoAlertaJejumSlot !== slotInicio) {
        if (inicioAutomatico) {
          const agoraIso = agora.toISOString();
          const metaHorasPlano = Number(estadoJejum.metaHoras || 16);
          const planoId = estadoJejum.planoAtivoId || '16:8';
          const nomePlano = estadoJejum.nomePlano || '16:8';

          await updateDoc(userDocRef, {
            'estadoJejum.emJejum': true,
            'estadoJejum.inicioTimestamp': agoraIso,
            'estadoJejum.emJanelaAlimentacao': false,
            'estadoJejum.inicioJanelaTimestamp': null,
            'estadoJejum.planoAtivoId': planoId,
            'estadoJejum.nomePlano': nomePlano,
            'estadoJejum.metaHoras': metaHorasPlano,
            'estadoJejum.alertaConclusaoEnviado': false,
            'estadoJejum.alertaMetadeEnviado': false,
            'estadoJejum.alerta3hEnviado': false,
            'estadoJejum.alerta2hFimEnviado': false,
            'estadoJejum.alerta1hFimEnviado': false,
            'estadoJejum.alertaFimPerdidoEnviado': false,
            ultimoAlertaJejumSlot: slotInicio,
            atualizadoEm: serverTimestamp()
          }).catch(() => {});

          if (!emSilencioNoturno) {
            const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
              title: 'Seu jejum começou automaticamente! 🔥',
              body: `Protocolo ${nomePlano} (${metaHorasPlano}h) ativado pontualmente às ${horaInicioDiaria}. Bom jejum!`,
              tag: 'jejum-inicio-auto',
              data: { url: '/?tab=jejum', tipo: 'inicio_jejum' }
            });
            if (enviou > 0) enviadas += enviou;
          }
        } else if (notifsJejum?.jejumInicioAtivo !== false && !emSilencioNoturno) {
          const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
            title: 'Hora de Iniciar seu Jejum! ⏳',
            body: `Seu horário programado chegou (${horaInicioDiaria}). Abra o app para começar!`,
            tag: 'jejum-inicio-lembrete',
            data: { url: '/?tab=jejum', tipo: 'inicio_jejum' }
          });
          if (enviou > 0) {
            enviadas += enviou;
            await updateDoc(userDocRef, {
              ultimoAlertaJejumSlot: slotInicio,
              atualizadoEm: serverTimestamp()
            }).catch(() => {});
          }
        }
      }
    }
  }

  // Cenário B: Usuário ESTÁ em jejum ativo
  else if (estadoJejum.emJejum && estadoJejum.inicioTimestamp) {
    const inicioMs = new Date(estadoJejum.inicioTimestamp).getTime();
    const metaHoras = Number(estadoJejum.metaHoras || 16);
    const metaMs = metaHoras * 3600 * 1000;
    const decorridoMs = agoraMs - inicioMs;

    // B1. 3h após o início do jejum
    if (decorridoMs >= 3 * 3600 * 1000 && !estadoJejum.alerta3hEnviado && decorridoMs < metaMs) {
      if (!emSilencioNoturno && notifsJejum?.jejum3hAposInicio) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: '3h de Jejum Concluídas ✨',
          body: 'Sua digestão foi finalizada e seu corpo começa a queimar as reservas de glicogênio!',
          tag: 'jejum-3h',
          data: { url: '/?tab=jejum', tipo: 'progresso_jejum' }
        });
        if (enviou > 0) enviadas += enviou;
      }
      await updateDoc(userDocRef, {
        'estadoJejum.alerta3hEnviado': true,
        atualizadoEm: serverTimestamp()
      }).catch(() => {});
    }

    // B2. Marco de 50% do Jejum
    if (decorridoMs >= (metaMs / 2) && !estadoJejum.alertaMetadeEnviado && decorridoMs < metaMs) {
      if (!emSilencioNoturno) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: 'Metade do Jejum Atingida! ⚡',
          body: `Você já completou metade da sua meta de ${metaHoras}h. Seu corpo está acelerando a queima de gordura!`,
          tag: 'jejum-metade',
          data: { url: '/?tab=jejum', tipo: 'metade_jejum' }
        });
        if (enviou > 0) enviadas += enviou;
      }
      await updateDoc(userDocRef, {
        'estadoJejum.alertaMetadeEnviado': true,
        atualizadoEm: serverTimestamp()
      }).catch(() => {});
    }

    // B3. 2h antes do término do jejum
    if (decorridoMs >= (metaMs - 2 * 3600 * 1000) && !estadoJejum.alerta2hFimEnviado && decorridoMs < metaMs) {
      if (!emSilencioNoturno && notifsJejum?.jejum2hAntesFim) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: 'Faltam apenas 2h para sua Meta! 🏁',
          body: 'Reta final do seu jejum. Mantenha o foco e continue se hidratando!',
          tag: 'jejum-2h-fim',
          data: { url: '/?tab=jejum', tipo: 'progresso_jejum' }
        });
        if (enviou > 0) enviadas += enviou;
      }
      await updateDoc(userDocRef, {
        'estadoJejum.alerta2hFimEnviado': true,
        atualizadoEm: serverTimestamp()
      }).catch(() => {});
    }

    // B4. Meta de Jejum Concluída
    if (decorridoMs >= metaMs && !estadoJejum.alertaConclusaoEnviado) {
      if (!emSilencioNoturno && notifsJejum?.jejumFimAtivo !== false) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: 'Parabéns! Meta de Jejum Concluída 🔥',
          body: `Você completou suas ${metaHoras} horas com sucesso! Abra para registrar sua refeição.`,
          tag: 'jejum-conclusao',
          data: { url: '/?tab=jejum', tipo: 'conclusao_jejum' }
        });
        if (enviou > 0) enviadas += enviou;
      }
      await updateDoc(userDocRef, {
        'estadoJejum.alertaConclusaoEnviado': true,
        'estadoJejum.notificadoEm': serverTimestamp(),
        atualizadoEm: serverTimestamp()
      }).catch(() => {});
    }
  }

  return enviadas;
}

/**
 * ----------------------------------------------------------------------------
 * 2. MÓDULO DE AVALIAÇÃO: HIDRATAÇÃO (ÁGUA)
 * ----------------------------------------------------------------------------
 * Implementa janela de tolerância de até 35 minutos para nunca perder lembretes
 * mesmo se o container na nuvem tiver entrado em hibernação temporária.
 */
async function avaliarNotificacoesAgua(
  usuario: any,
  usuarioId: string,
  userDocRef: any,
  agora: Date,
  hojeDataStr: string,
  totalMinutosAtual: number,
  emSilencioNoturno: boolean
): Promise<number> {
  let enviadas = 0;
  if (emSilencioNoturno) return 0;

  // Prioriza a configuração específica de água ou fallback das configurações gerais de notificação
  const configAgua = usuario.configuracaoAgua || {};
  const notifsGerais = usuario.configuracoesJejum?.notificacoes || {};

  const lembreteAtivo = configAgua.lembreteAtivo ?? notifsGerais.aguaLembreteAtivo ?? true;
  if (!lembreteAtivo) return 0;

  const horaInicio = configAgua.horaInicio || notifsGerais.aguaHoraInicio || '08:00';
  const horaFim = configAgua.horaFim || notifsGerais.aguaHoraFim || '21:00';
  const intervaloTexto = configAgua.intervalo || notifsGerais.aguaIntervalo || 'A cada 1 hora';

  const [hIni, mIni] = horaInicio.split(':').map(Number);
  const [hFim, mFim] = horaFim.split(':').map(Number);
  const minInicio = (hIni || 8) * 60 + (mIni || 0);
  const minFim = (hFim || 21) * 60 + (mFim || 0);

  // Calcula o intervalo em minutos (padrão de 60 minutos se hora em hora)
  let minutosIntervalo = 60;
  if (intervaloTexto.includes('30 min')) minutosIntervalo = 30;
  else if (intervaloTexto.includes('1 hora')) minutosIntervalo = 60;
  else if (intervaloTexto.includes('2 hora')) minutosIntervalo = 120;
  else if (intervaloTexto.includes('3 hora')) minutosIntervalo = 180;

  // Verifica se o momento atual está dentro da janela do dia
  if (totalMinutosAtual < minInicio || totalMinutosAtual > minFim + 30) {
    return 0;
  }

  // Identifica o slot mais recente válido dentro do intervalo
  const slotAtualIndex = Math.floor((totalMinutosAtual - minInicio) / minutosIntervalo);
  const slotMinutos = minInicio + (slotAtualIndex * minutosIntervalo);

  // Janela de tolerância: dispara se estivermos entre o horário do slot e até 35 min após
  if (slotMinutos >= minInicio && slotMinutos <= minFim) {
    const diferencaMinutos = totalMinutosAtual - slotMinutos;
    const toleranciaMaxima = Math.min(35, minutosIntervalo - 5);

    if (diferencaMinutos >= 0 && diferencaMinutos <= toleranciaMaxima) {
      const slotIdentificador = `${hojeDataStr}_agua_slot_${slotMinutos}`;
      const ultimoSlotEnviado = usuario.ultimoLembreteAguaSlot;

      if (ultimoSlotEnviado !== slotIdentificador) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: 'Hora de se Hidratar 💧',
          body: 'Mantenha seu metabolismo acelerado durante o ciclo. Beba um copo de água agora!',
          tag: 'lembrete-agua',
          data: { url: '/?tab=agua', tipo: 'lembrete_agua' }
        });

        if (enviou > 0) {
          enviadas += enviou;
          await updateDoc(userDocRef, {
            ultimoLembreteAguaSlot: slotIdentificador,
            ultimoLembreteAguaEnviadoIso: agora.toISOString(),
            atualizadoEm: serverTimestamp()
          }).catch(() => {});
          console.log(`[Push] Lembrete de água (slot ${slotIdentificador}) entregue com sucesso para o usuário ${usuarioId}`);
        }
      }
    }
  }

  return enviadas;
}

/**
 * ----------------------------------------------------------------------------
 * 3. MÓDULO DE AVALIAÇÃO: PESAGEM PERIÓDICA
 * ----------------------------------------------------------------------------
 * Dispara o lembrete no horário configurado e no dia da semana selecionado pelo usuário.
 */
async function avaliarNotificacoesPeso(
  usuario: any,
  usuarioId: string,
  userDocRef: any,
  agora: Date,
  hojeDataStr: string,
  totalMinutosAtual: number,
  emSilencioNoturno: boolean,
  fusoUsuario: string
): Promise<number> {
  let enviadas = 0;
  if (emSilencioNoturno) return 0;

  const notifs = usuario.configuracoesJejum?.notificacoes || {};
  const lembretePesoAtivo = notifs.pesoLembreteAtivo ?? true;
  if (!lembretePesoAtivo) return 0;

  const pesoHora = notifs.pesoHora || '08:00';
  const pesoDias = notifs.pesoDias || 'Todos os dias';

  // Identifica o dia da semana atual no fuso horário do usuário
  let diaSemanaAtual = '';
  try {
    diaSemanaAtual = agora.toLocaleDateString('pt-BR', { timeZone: fusoUsuario, weekday: 'long' }).toLowerCase();
  } catch {
    diaSemanaAtual = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' }).toLowerCase();
  }

  // Verifica se o dia atual coincide com a preferência do usuário
  const pesoDiasNormalizado = pesoDias.toLowerCase();
  const diaValido = 
    pesoDiasNormalizado.includes('todos') || 
    pesoDiasNormalizado.includes(diaSemanaAtual) ||
    (diaSemanaAtual.startsWith('segunda') && pesoDiasNormalizado.includes('segunda')) ||
    (diaSemanaAtual.startsWith('terça') && pesoDiasNormalizado.includes('terça')) ||
    (diaSemanaAtual.startsWith('quarta') && pesoDiasNormalizado.includes('quarta')) ||
    (diaSemanaAtual.startsWith('quinta') && pesoDiasNormalizado.includes('quinta')) ||
    (diaSemanaAtual.startsWith('sexta') && pesoDiasNormalizado.includes('sexta')) ||
    (diaSemanaAtual.startsWith('sábado') && pesoDiasNormalizado.includes('sábado')) ||
    (diaSemanaAtual.startsWith('domingo') && pesoDiasNormalizado.includes('domingo'));

  if (!diaValido) return 0;

  const [hPeso, mPeso] = pesoHora.split(':').map(Number);
  const minPeso = (hPeso || 8) * 60 + (mPeso || 0);

  // Janela de tolerância: de minPeso até minPeso + 45 min
  if (totalMinutosAtual >= minPeso && totalMinutosAtual < minPeso + 45) {
    const slotPeso = `${hojeDataStr}_peso_lembrete`;
    if (usuario.ultimoAlertaPesoSlot !== slotPeso) {
      const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
        title: '⚖️ Hora de Registrar seu Peso',
        body: 'Bom dia! Suba na balança em jejum pela manhã para acompanhar sua evolução com consistência.',
        tag: 'lembrete-peso',
        data: { url: '/?tab=jornada', tipo: 'lembrete_peso' }
      });

      if (enviou > 0) {
        enviadas += enviou;
        await updateDoc(userDocRef, {
          ultimoAlertaPesoSlot: slotPeso,
          atualizadoEm: serverTimestamp()
        }).catch(() => {});
        console.log(`[Push] Lembrete de pesagem entregue para o usuário ${usuarioId}`);
      } else {
        await updateDoc(userDocRef, {
          ultimoAlertaPesoSlot: slotPeso,
          atualizadoEm: serverTimestamp()
        }).catch(() => {});
      }
    }
  }

  return enviadas;
}

/**
 * ----------------------------------------------------------------------------
 * 4. MÓDULO DE AVALIAÇÃO: CICLO DE BIOIMPEDÂNCIA
 * ----------------------------------------------------------------------------
 * Lembra o usuário de repetir o exame de acordo com sua frequência configurada
 * (ex: a cada 30, 45, 60 ou 90 dias) e envia aviso prévio 3 dias antes.
 */
async function avaliarNotificacoesBioimpedancia(
  usuario: any,
  usuarioId: string,
  userDocRef: any,
  hojeDataStr: string,
  totalMinutosAtual: number,
  emSilencioNoturno: boolean
): Promise<number> {
  let enviadas = 0;
  if (emSilencioNoturno) return 0;

  // Janela matinal de lembrete de exame: entre 08:00 e 10:30 (480 a 630 minutos)
  if (totalMinutosAtual < 480 || totalMinutosAtual > 630) {
    return 0;
  }

  try {
    // 1. Busca a configuração de reteste
    let frequenciaDias = 30;
    let lembretesAtivos = true;

    try {
      const configBioRef = doc(db, 'usuarios', usuarioId, 'configuracoes', 'bioimpedancia');
      const snapConfig = await getDoc(configBioRef);
      if (snapConfig.exists()) {
        const dadosBio = snapConfig.data();
        if (dadosBio.frequenciaDias) frequenciaDias = Number(dadosBio.frequenciaDias);
        if (dadosBio.lembretesAtivos !== undefined) lembretesAtivos = Boolean(dadosBio.lembretesAtivos);
      }
    } catch {}

    if (!lembretesAtivos) return 0;

    // 2. Busca o exame mais recente
    const bioRef = collection(db, 'usuarios', usuarioId, 'bioimpedancias');
    const qBio = query(bioRef, orderBy('dataExame', 'desc'), limit(1));
    const snapBio = await getDocs(qBio);

    if (snapBio.empty) {
      return 0; // Sem exame anterior registrado
    }

    const ultimoExame = snapBio.docs[0].data();
    const dataExameStr = ultimoExame.dataExame; // formato 'YYYY-MM-DD'
    if (!dataExameStr) return 0;

    const dataExame = new Date(dataExameStr);
    const dataHoje = new Date(hojeDataStr);
    const diffMs = dataHoje.getTime() - dataExame.getTime();
    const diasDecorridos = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // A. Lembrete no dia do reteste (quando completou a frequência ou nos 3 dias seguintes se não fez)
    if (diasDecorridos >= frequenciaDias && diasDecorridos <= frequenciaDias + 3) {
      const slotBio = `${hojeDataStr}_bioimpedancia_vencimento`;
      if (usuario.ultimoAlertaBioSlot !== slotBio) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: '⚖️ Hora do seu Novo Exame de Bioimpedância!',
          body: `Chegou o momento do seu reteste (${frequenciaDias} dias). Acompanhe sua evolução de massa magra e gordura!`,
          tag: 'lembrete-bioimpedancia',
          data: { url: '/?tab=bioimpedancia', tipo: 'reteste_bio' }
        });

        if (enviou > 0) {
          enviadas += enviou;
          await updateDoc(userDocRef, {
            ultimoAlertaBioSlot: slotBio,
            atualizadoEm: serverTimestamp()
          }).catch(() => {});
          console.log(`[Push] Lembrete de bioimpedância entregue para o usuário ${usuarioId}`);
        }
      }
    }

    // B. Aviso prévio 3 dias antes
    else if (diasDecorridos === (frequenciaDias - 3)) {
      const slotPreBio = `${hojeDataStr}_bioimpedancia_aviso_previo`;
      if (usuario.ultimoAlertaBioSlot !== slotPreBio) {
        const enviou = await enviarNotificacaoParaUsuario(usuarioId, {
          title: '📅 Seu Reteste de Bioimpedância está Chegando',
          body: 'Faltam apenas 3 dias para seu próximo exame periódico. Mantenha seu protocolo e hidratação alinhados!',
          tag: 'aviso-bioimpedancia',
          data: { url: '/?tab=bioimpedancia', tipo: 'aviso_previo_bio' }
        });

        if (enviou > 0) {
          enviadas += enviou;
          await updateDoc(userDocRef, {
            ultimoAlertaBioSlot: slotPreBio,
            atualizadoEm: serverTimestamp()
          }).catch(() => {});
        }
      }
    }
  } catch (errBio) {
    console.warn(`[Bio Push] Aviso ao verificar bioimpedância do usuário ${usuarioId}:`, errBio);
  }

  return enviadas;
}

/**
 * Rotina Central do Agendador (Cron em Segundo Plano):
 * Avalia todos os usuários cadastrados e orquestra os 4 pilares: Jejum, Água, Peso e Bioimpedância.
 */
async function processarVerificacaoNotificacoes(): Promise<{ 
  usuariosProcessados: number; 
  notificacoesEnviadas: number;
  timestamp: string;
}> {
  let totalEnviadas = 0;
  let totalProcessados = 0;
  const agora = new Date();

  try {
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    totalProcessados = snapshot.size;

    for (const userDoc of snapshot.docs) {
      const usuario = userDoc.data();
      const usuarioId = userDoc.id;

      try {
        // Respeita o fuso horário individual do usuário (padrão América/São Paulo)
        const fusoUsuario = usuario.fusoHorario || usuario.timeZone || 'America/Sao_Paulo';
        let horaAtualStr = '';
        let hojeDataStr = '';

        try {
          horaAtualStr = agora.toLocaleTimeString('pt-BR', { 
            timeZone: fusoUsuario, 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          });
          hojeDataStr = agora.toLocaleDateString('pt-BR', {
            timeZone: fusoUsuario,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).split('/').reverse().join('-');
        } catch {
          horaAtualStr = agora.toLocaleTimeString('pt-BR', { 
            timeZone: 'America/Sao_Paulo', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          });
          hojeDataStr = agora.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).split('/').reverse().join('-');
        }

        const [hAtual, mAtual] = horaAtualStr.split(':').map(Number);
        const totalMinutosAtual = (hAtual || 0) * 60 + (mAtual || 0);

        // Validação do Período de Não Perturbe
        const notifsJejum = usuario.configuracoesJejum?.notificacoes;
        const naoPerturbeAtivo = Boolean(notifsJejum?.naoPerturbeAtivo);
        const naoPerturbeHoraInicio = notifsJejum?.naoPerturbeHoraInicio || '23:00';
        const naoPerturbeHoraFim = notifsJejum?.naoPerturbeHoraFim || '07:00';
        const emSilencioNoturno = naoPerturbeAtivo && estaNoPeriodoNaoPerturbe(horaAtualStr, naoPerturbeHoraInicio, naoPerturbeHoraFim);

        // 1. Jejum
        const jejumEnviadas = await avaliarNotificacoesJejum(
          usuario, usuarioId, userDoc.ref, agora, hojeDataStr, horaAtualStr, totalMinutosAtual, emSilencioNoturno
        );
        totalEnviadas += jejumEnviadas;

        // 2. Hidratação (Água)
        const aguaEnviadas = await avaliarNotificacoesAgua(
          usuario, usuarioId, userDoc.ref, agora, hojeDataStr, totalMinutosAtual, emSilencioNoturno
        );
        totalEnviadas += aguaEnviadas;

        // 3. Pesagem
        const pesoEnviadas = await avaliarNotificacoesPeso(
          usuario, usuarioId, userDoc.ref, agora, hojeDataStr, totalMinutosAtual, emSilencioNoturno, fusoUsuario
        );
        totalEnviadas += pesoEnviadas;

        // 4. Bioimpedância
        const bioEnviadas = await avaliarNotificacoesBioimpedancia(
          usuario, usuarioId, userDoc.ref, hojeDataStr, totalMinutosAtual, emSilencioNoturno
        );
        totalEnviadas += bioEnviadas;

      } catch (userErr) {
        console.warn(`[Push Cron] Aviso ao processar usuário ${usuarioId}:`, userErr);
      }
    }
  } catch (erro) {
    console.error('[Push Cron] Erro durante a varredura do agendador:', erro);
  }

  return { 
    usuariosProcessados: totalProcessados, 
    notificacoesEnviadas: totalEnviadas,
    timestamp: agora.toISOString()
  };
}

/**
 * Inicia o Agendador Automático no Servidor:
 * Executa uma verificação contínua a cada 60 segundos enquanto o processo estiver ativo.
 */
function iniciarAgendadorNotificacoes() {
  console.log('[Cron] Motor de Notificações Push iniciado. Ciclo: a cada 60 segundos.');
  
  setTimeout(() => {
    processarVerificacaoNotificacoes().catch(() => {});
  }, 5000);

  setInterval(() => {
    processarVerificacaoNotificacoes().catch(() => {});
  }, 60 * 1000);
}

// -------------------------------------------------------------
// ROTAS DE API DO SERVIDOR
// -------------------------------------------------------------

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'online', 
    servidor: 'Jejuar Full-Stack Node.js', 
    timestamp: new Date().toISOString() 
  });
});

/**
 * Webhook de Agendamento Externo (Cloud Scheduler, Cron-Job.org, Upstash ou GitHub Actions).
 * Permite que um ping HTTP periódico (ex: a cada 5 ou 10 minutos) acorde a instância na nuvem
 * e execute a varredura pontual de todos os usuários, eliminando a dependência do app estar aberto.
 */
app.all(['/api/cron/verificar-notificacoes', '/api/notificacoes/executar-cron'], async (req: Request, res: Response) => {
  try {
    const resultado = await processarVerificacaoNotificacoes();
    res.json({ 
      sucesso: true, 
      mensagem: 'Varredura de notificações executada com sucesso.',
      ...resultado 
    });
  } catch (err: any) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Endpoint para testar o envio imediato de um push real para o aparelho do usuário
app.post('/api/notificacoes/testar-push', async (req: Request, res: Response) => {
  const { usuarioId } = req.body;
  if (!usuarioId) {
    return res.status(400).json({ sucesso: false, erro: 'ID do usuário não fornecido.' });
  }

  try {
    const enviados = await enviarNotificacaoParaUsuario(usuarioId, {
      title: '💧 Teste de Alerta: Jejuar',
      body: 'Perfeito! Seus alertas com o app fechado estão 100% ativos e funcionando.',
      tag: 'teste-agua',
      data: { url: '/?tab=agua', tipo: 'teste' }
    });

    if (enviados > 0) {
      res.json({ sucesso: true, mensagem: `Notificação enviada com sucesso! (${enviados} aparelho conectado)` });
    } else {
      res.status(404).json({ 
        sucesso: false, 
        erro: 'Nenhum aparelho ativo encontrado. Por favor, ative a chave no aplicativo.' 
      });
    }
  } catch (err: any) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Endpoint para verificar se o usuário possui dispositivos push ativos válidos no Firestore
app.get('/api/notificacoes/status-dispositivo/:usuarioId', async (req: Request, res: Response) => {
  const { usuarioId } = req.params;
  try {
    const dispRef = collection(db, 'usuarios', usuarioId, 'dispositivos_push');
    const q = query(dispRef, where('ativo', '==', true));
    const snap = await getDocs(q);
    res.json({ 
      sucesso: true, 
      possuiDispositivoAtivo: !snap.empty, 
      totalAtivos: snap.size 
    });
  } catch (err: any) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Endpoint para buscar os registros de histórico de disparos de um usuário (mecanismo de auditoria)
app.get('/api/notificacoes/historico/:usuarioId', async (req: Request, res: Response) => {
  const { usuarioId } = req.params;
  try {
    const histRef = collection(db, 'usuarios', usuarioId, 'historico_disparos');
    const q = query(histRef, orderBy('timestamp', 'desc'), limit(15));
    const snap = await getDocs(q);
    const historico = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    res.json({ sucesso: true, historico });
  } catch (err: any) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Endpoint para excluir definitivamente registros de dispositivos push inativos/expirados do usuário
app.post('/api/notificacoes/limpar-inativos', async (req: Request, res: Response) => {
  const { usuarioId } = req.body;
  if (!usuarioId) {
    return res.status(400).json({ sucesso: false, erro: 'ID do usuário não fornecido.' });
  }
  try {
    const dispRef = collection(db, 'usuarios', usuarioId, 'dispositivos_push');
    const q = query(dispRef, where('ativo', '==', false));
    const snap = await getDocs(q);
    let remocoes = 0;
    for (const docSnap of snap.docs) {
      await deleteDoc(docSnap.ref);
      remocoes++;
    }
    res.json({ 
      sucesso: true, 
      mensagem: `${remocoes} dispositivo(s) inativo(s) ou expirado(s) removido(s) do Firestore.`,
      remocoes
    });
  } catch (err: any) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Inicialização Principal do Servidor (Dev com Vite vs Produção Estática)
async function bootstrap() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Modo de Desenvolvimento: Vite montado como middleware com HMR silenciado
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Vite] Middleware de desenvolvimento integrado ao Express.');
  } else {
    // Modo de Produção: Entrega os arquivos estáticos compilados em /dist
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Express] Servindo build de produção a partir de /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Servidor] Jejuar rodando com sucesso em http://0.0.0.0:${PORT}`);
    // Aciona o motor agendador contínuo
    iniciarAgendadorNotificacoes();
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Erro fatal ao iniciar o servidor:', err);
  process.exit(1);
});
