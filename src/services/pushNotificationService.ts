/**
 * @file pushNotificationService.ts
 * @description Serviço de gerenciamento da Web Push API e sincronização com o Firestore.
 * Responsável por:
 * 1. Verificar suporte a notificações e Service Worker no navegador.
 * 2. Solicitar permissão nativa de forma suave e contextual.
 * 3. Assinar o dispositivo através do PushManager com as chaves VAPID oficiais.
 * 4. Registrar e persistir o endpoint e chaves no Firestore vinculado ao ID do usuário autenticado.
 * 5. Permitir desativação de notificações e atualização de preferências (jejum, água, pesagem).
 */

import { doc, collection, setDoc, serverTimestamp, getDocs, getDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/** Chave Pública VAPID Oficial do Jejuar */
export const VAPID_PUBLIC_KEY = 'BJhZ8UVaICG-vfkI04dGhJKmk4OHkS0tglNs1IWDdSE0ScGdRfVUtpAeLuNyxwyhzu40SxkFMpcs3lzTubd6MgM';

/** Interface para preferências de notificação do usuário */
export interface PreferenciasNotificacao {
  /** Alertas de início de jejum, metas de 50%, autofagia e quebra de jejum */
  jejum: boolean;
  /** Lembretes periódicos de copos d'água */
  agua: boolean;
  /** Alerta semanal ou mensal para registro de nova pesagem */
  peso: boolean;
  /** Alerta de vencimento ou aviso prévio do ciclo de reteste de bioimpedância */
  bioimpedancia: boolean;
}

/** Preferências padrão ativadas */
export const PREFERENCIAS_PADRAO: PreferenciasNotificacao = {
  jejum: true,
  agua: true,
  peso: true,
  bioimpedancia: true
};

/**
 * Converte uma chave pública Base64 URL-safe para Uint8Array,
 * exigido pelo método `pushManager.subscribe()`.
 * 
 * @param base64String Chave pública em formato string Base64
 * @returns Buffer Uint8Array correspondente
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Detecta se o dispositivo atual é um dispositivo Apple (iOS / iPadOS).
 */
export function ehDispositivoIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

/**
 * Verifica se a aplicação está rodando em modo PWA Standalone (adicionada à tela inicial).
 */
export function ehModoStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Valida o nível de suporte do navegador à Web Push API.
 * Identifica se é iOS que necessita ser instalado na tela de início primeiro.
 */
export function verificarSuportePush(): {
  suportado: boolean;
  motivo?: 'sem_service_worker' | 'sem_push_manager' | 'ios_requer_instalacao' | 'inseguro_sem_https';
} {
  if (typeof window === 'undefined') {
    return { suportado: false, motivo: 'sem_service_worker' };
  }

  // Verifica suporte básico a Service Worker
  if (!('serviceWorker' in navigator)) {
    return { suportado: false, motivo: 'sem_service_worker' };
  }

  // No iOS, a Apple exige que o PWA seja instalado na tela de início a partir do iOS 16.4
  if (ehDispositivoIOS() && !ehModoStandalone()) {
    return { suportado: false, motivo: 'ios_requer_instalacao' };
  }

  // Verifica suporte a PushManager
  if (!('PushManager' in window)) {
    return { suportado: false, motivo: 'sem_push_manager' };
  }

  return { suportado: true };
}

/**
 * Obtém o status atual de permissão de notificação do navegador.
 * @returns 'granted' | 'denied' | 'default' | 'nao_suportado'
 */
export function obterStatusPermissaoNotificacao(): NotificationPermission | 'nao_suportado' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'nao_suportado';
  }
  return Notification.permission;
}

/**
 * Gera um identificador único e seguro a partir da URL do endpoint para servir como ID de documento.
 */
function gerarIdDispositivo(endpoint: string): string {
  // Pega os últimos 32 caracteres do endpoint como hash identificador do aparelho
  return endpoint.replace(/[^a-zA-Z0-9]/g, '').slice(-36) || 'dispositivo_padrao';
}

/**
 * Recupera a assinatura de push atual deste aparelho, se existir.
 */
export async function obterAssinaturaPushAtual(): Promise<PushSubscription | null> {
  const status = verificarSuportePush();
  if (!status.suportado) return null;

  try {
    const registro = await navigator.serviceWorker.ready;
    return await registro.pushManager.getSubscription();
  } catch (erro) {
    console.warn('[Push] Erro ao obter assinatura existente:', erro);
    return null;
  }
}

/**
 * Solicita a permissão nativa, gera a inscrição de push e registra no Firestore.
 * 
 * @param usuarioId ID obrigatório do usuário autenticado no Firestore
 * @param preferencias Preferências opcionais de quais alertas receber
 * @returns Resultado da operação com status e mensagem amigável
 */
export async function solicitarPermissaoEAssinarPush(
  usuarioId: string,
  preferencias: PreferenciasNotificacao = PREFERENCIAS_PADRAO
): Promise<{ sucesso: boolean; mensagem: string; subscription?: PushSubscription }> {
  if (!usuarioId) {
    return {
      sucesso: false,
      mensagem: 'É necessário estar conectado à sua conta para receber alertas personalizados.'
    };
  }

  const suporte = verificarSuportePush();
  if (!suporte.suportado) {
    if (suporte.motivo === 'ios_requer_instalacao') {
      return {
        sucesso: false,
        mensagem: 'No iPhone/iPad, adicione o Jejuar à sua Tela de Início primeiro para habilitar alertas.'
      };
    }
    return {
      sucesso: false,
      mensagem: 'Seu navegador atual não possui suporte a notificações em segundo plano.'
    };
  }

  try {
    // 1. Solicita a permissão nativa do sistema operacional
    const permissao = await Notification.requestPermission();
    if (permissao !== 'granted') {
      return {
        sucesso: false,
        mensagem: permissao === 'denied'
          ? 'As notificações foram bloqueadas no seu navegador. Você pode reativá-las nas configurações do dispositivo.'
          : 'A permissão de notificações não foi concedida.'
      };
    }

    // 2. Aguarda o Service Worker estar pronto e ativo
    const registro = await navigator.serviceWorker.ready;

    // 3. Renova a inscrição: desinscreve qualquer token local anterior para evitar tokens expirados no Google FCM (HTTP 410)
    const assinaturaAntiga = await registro.pushManager.getSubscription();
    if (assinaturaAntiga) {
      try {
        console.log('[Push] Descartando inscrição anterior para gerar token novo e ativo...');
        await assinaturaAntiga.unsubscribe();
      } catch (desinscreverErr) {
        console.warn('[Push] Aviso ao desinscrever chave anterior:', desinscreverErr);
      }
    }

    // 4. Cria uma inscrição 100% nova e atualizada com as chaves VAPID oficiais
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource
    });

    // 5. Extrai os dados do PushSubscription
    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint || '';
    const p256dh = subJson.keys?.p256dh || '';
    const authKey = subJson.keys?.auth || '';

    if (!endpoint || !p256dh || !authKey) {
      throw new Error('Falha ao obter chaves de criptografia do dispositivo.');
    }

    // 6. Detecta plataforma para relatórios e depuração
    const plataforma = ehDispositivoIOS() 
      ? 'iOS' 
      : /android/i.test(navigator.userAgent) 
        ? 'Android' 
        : 'Desktop';

    // 7. Detecta o fuso horário exato do aparelho do usuário (ex: 'America/Bahia', 'America/Sao_Paulo', 'America/Manaus')
    const fusoHorario = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

    const idDispositivo = gerarIdDispositivo(endpoint);

    // 8. Grava na subcoleção do usuário no Firestore: usuarios/{usuarioId}/dispositivos_push/{idDispositivo}
    const dispositivoRef = doc(db, 'usuarios', usuarioId, 'dispositivos_push', idDispositivo);
    await setDoc(dispositivoRef, {
      idDispositivo,
      userId: usuarioId,
      endpoint,
      keys: {
        p256dh,
        auth: authKey
      },
      plataforma,
      fusoHorario,
      preferencias,
      userAgent: navigator.userAgent,
      ativo: true,
      atualizadoEm: serverTimestamp(),
      criadoEm: serverTimestamp()
    }, { merge: true });

    // 9. Atualiza o status geral de notificações e o fuso horário no documento principal do usuário
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    await updateDoc(usuarioRef, {
      notificacoesPushAtivas: true,
      fusoHorario,
      timeZone: fusoHorario,
      preferenciasNotificacoes: preferencias,
      atualizadoEm: serverTimestamp()
    });

    return {
      sucesso: true,
      mensagem: 'Notificações ativadas com sucesso! Você receberá seus alertas pontualmente.',
      subscription
    };
  } catch (erro: any) {
    console.error('[Push] Erro ao registrar notificação push:', erro);
    return {
      sucesso: false,
      mensagem: 'Não conseguimos ativar suas notificações no momento. Verifique sua conexão e tente novamente.'
    };
  }
}

/**
 * Desativa as notificações push para o dispositivo atual e atualiza o Firestore.
 * 
 * @param usuarioId ID do usuário autenticado
 * @returns Status da desativação
 */
export async function desativarNotificacoesPush(
  usuarioId: string
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const subscription = await obterAssinaturaPushAtual();
    if (subscription) {
      const endpoint = subscription.endpoint;
      const idDispositivo = gerarIdDispositivo(endpoint);

      // 1. Cancela a inscrição no navegador
      await subscription.unsubscribe();

      // 2. Atualiza no Firestore marcando como inativo
      if (usuarioId) {
        const dispositivoRef = doc(db, 'usuarios', usuarioId, 'dispositivos_push', idDispositivo);
        await setDoc(dispositivoRef, {
          ativo: false,
          desativadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp()
        }, { merge: true });

        // Verifica se ainda há outros dispositivos ativos
        const dispRef = collection(db, 'usuarios', usuarioId, 'dispositivos_push');
        const q = query(dispRef, where('ativo', '==', true));
        const snap = await getDocs(q);

        const usuarioRef = doc(db, 'usuarios', usuarioId);
        await updateDoc(usuarioRef, {
          notificacoesPushAtivas: !snap.empty,
          atualizadoEm: serverTimestamp()
        });
      }
    }

    return {
      sucesso: true,
      mensagem: 'Notificações desativadas para este aparelho.'
    };
  } catch (erro) {
    console.error('[Push] Erro ao desativar notificações:', erro);
    return {
      sucesso: false,
      mensagem: 'Não foi possível desativar as notificações no momento.'
    };
  }
}

/**
 * Atualiza apenas as preferências de quais notificações o usuário deseja receber (jejum, água, peso).
 * 
 * @param usuarioId ID do usuário autenticado
 * @param preferencias Novas preferências
 */
export async function salvarPreferenciasNotificacaoFirestore(
  usuarioId: string,
  preferencias: PreferenciasNotificacao
): Promise<void> {
  if (!usuarioId) return;

  try {
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    await updateDoc(usuarioRef, {
      preferenciasNotificacoes: preferencias,
      atualizadoEm: serverTimestamp()
    });

    // Atualiza também no dispositivo atual se estiver assinado
    const subscription = await obterAssinaturaPushAtual();
    if (subscription) {
      const idDispositivo = gerarIdDispositivo(subscription.endpoint);
      const dispRef = doc(db, 'usuarios', usuarioId, 'dispositivos_push', idDispositivo);
      await setDoc(dispRef, {
        preferencias,
        atualizadoEm: serverTimestamp()
      }, { merge: true });
    }
  } catch (erro) {
    console.error('[Push] Erro ao salvar preferências no Firestore:', erro);
    throw new Error('Não conseguimos salvar suas preferências de alerta.');
  }
}

/**
 * Consulta se este usuário possui ao menos um dispositivo com assinatura push ativa no Firestore.
 * Evita falsos positivos onde o navegador tem um token antigo mas que já foi invalidado/desativado.
 * 
 * @param usuarioId ID do usuário autenticado
 */
export async function verificarAssinaturaAtivaNoServidor(usuarioId: string): Promise<boolean> {
  if (!usuarioId) return false;

  try {
    const dispRef = collection(db, 'usuarios', usuarioId, 'dispositivos_push');
    const q = query(dispRef, where('ativo', '==', true));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.warn('[Push] Aviso ao verificar assinatura ativa no Firestore:', err);
    return false;
  }
}

/**
 * Dispara uma requisição ao servidor para enviar um alerta push de teste imediato para o aparelho.
 * Útil para o usuário comprovar em 3 segundos que o alerta funciona com o app fechado.
 * 
 * @param usuarioId ID do usuário autenticado
 */
export async function testarEnvioPushServidor(
  usuarioId: string
): Promise<{ sucesso: boolean; mensagem: string }> {
  if (!usuarioId) {
    return {
      sucesso: false,
      mensagem: 'Conecte-se à sua conta para testar o envio de alertas.'
    };
  }

  try {
    // Sincroniza e garante token 100% ativo no Firestore antes de pedir o teste ao servidor
    await sincronizarAssinaturaSilenciosa(usuarioId, true).catch(() => {});

    const resposta = await fetch('/api/notificacoes/testar-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId })
    });

    const dados = await resposta.json();
    if (resposta.ok && dados.sucesso) {
      return {
        sucesso: true,
        mensagem: dados.mensagem || 'Notificação enviada com sucesso! Verifique sua tela de bloqueio.'
      };
    }

    return {
      sucesso: false,
      mensagem: dados.erro || 'Não foi possível entregar o alerta de teste no momento.'
    };
  } catch (err) {
    console.error('[Push] Erro na requisição de teste:', err);
    return {
      sucesso: false,
      mensagem: 'Falha na comunicação com o servidor de notificações. Verifique sua conexão.'
    };
  }
}

/**
 * Sincroniza silenciosamente a assinatura push deste dispositivo com o Firestore em segundo plano.
 * Executada de forma invisível quando o app abre se o usuário já tiver permissão concedida,
 * garantindo a substituição automática de qualquer token expirado (Status 410) no Google FCM
 * sem exigir nenhuma intervenção ou clique manual do usuário.
 * 
 * @param usuarioId ID do usuário autenticado
 * @param forcarRenovacao Se true, renova obrigatoriamente a chave no FCM
 */
export async function sincronizarAssinaturaSilenciosa(
  usuarioId: string,
  forcarRenovacao: boolean = false
): Promise<boolean> {
  if (!usuarioId) return false;
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  // Só executa silenciosamente se a permissão já foi concedida pelo usuário anteriormente
  if (Notification.permission !== 'granted') return false;

  try {
    const status = verificarSuportePush();
    if (!status.suportado) return false;

    const registro = await navigator.serviceWorker.ready;
    let subscription = await registro.pushManager.getSubscription();

    // Auto-Cura Incondicional: verifica se o token local atual existe e está ativo no Firestore
    let precisaCriarNova = forcarRenovacao;

    if (subscription && !precisaCriarNova) {
      const idAtual = gerarIdDispositivo(subscription.endpoint);
      const docRef = doc(db, 'usuarios', usuarioId, 'dispositivos_push', idAtual);
      const snap = await getDoc(docRef);

      // Se não existir no banco ou se o status for ativo === false (marcado por 410/404 pelo servidor)
      if (!snap.exists() || snap.data()?.ativo === false) {
        console.log('[Push Auto-Heal] Token inativo ou recusado pelo FCM (410). Gerando novo token ativo...');
        precisaCriarNova = true;
      }
    } else if (!subscription) {
      precisaCriarNova = true;
    }

    // Se precisamos gerar uma nova chave válida
    if (precisaCriarNova) {
      if (subscription) {
        try {
          await subscription.unsubscribe();
        } catch (unsubErr) {
          console.warn('[Push Auto-Heal] Aviso ao descartar token antigo:', unsubErr);
        }
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource
      });
      console.log('[Push Auto-Heal] Novo token Push ativo gerado com sucesso pelo Google FCM.');
    }

    if (!subscription) return false;

    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint || '';
    const p256dh = subJson.keys?.p256dh || '';
    const authKey = subJson.keys?.auth || '';

    if (!endpoint || !p256dh || !authKey) return false;

    const idDispositivo = gerarIdDispositivo(endpoint);
    const plataforma = ehDispositivoIOS() ? 'iOS' : /android/i.test(navigator.userAgent) ? 'Android' : 'Desktop';
    const fusoHorario = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

    // Grava/atualiza o dispositivo no Firestore com ativo = true
    const dispositivoRef = doc(db, 'usuarios', usuarioId, 'dispositivos_push', idDispositivo);
    await setDoc(dispositivoRef, {
      idDispositivo,
      userId: usuarioId,
      endpoint,
      keys: { p256dh, auth: authKey },
      plataforma,
      fusoHorario,
      userAgent: navigator.userAgent,
      ativo: true,
      atualizadoEm: serverTimestamp()
    }, { merge: true });

    // Atualiza também no usuário o status ativo e timezone
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    await updateDoc(usuarioRef, {
      notificacoesPushAtivas: true,
      fusoHorario,
      timeZone: fusoHorario,
      atualizadoEm: serverTimestamp()
    }).catch(() => {});

    console.log('[Push] Dispositivo conectado e 100% ativo para recebimento de alertas com app fechado.');
    return true;
  } catch (err) {
    console.warn('[Push] Erro na sincronização automática do token de push:', err);
    return false;
  }
}


