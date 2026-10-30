/**
 * @file scripts/disparar-push-servidor.mjs
 * @description Exemplo de script de backend (Node.js / Cloud Function / Cron)
 * que lê uma assinatura do Firestore ou recebe via parâmetro e dispara o alerta push
 * criptografado diretamente para o dispositivo do usuário com o aplicativo fechado.
 */

import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Carrega as chaves VAPID oficiais
const keysPath = path.resolve('vapid-keys.json');
const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));

// Configura o identificador e as chaves VAPID
webpush.setVapidDetails(
  'mailto:contato@jejuar.app',
  keys.publicKey,
  keys.privateKey
);

/**
 * Função utilitária para disparar um alerta Push a partir de um servidor
 * @param {object} subscription Objeto PushSubscription salvo no Firestore
 * @param {object} notificacao Dados da notificação (titulo, corpo, url, tag)
 */
export async function enviarPush(subscription, notificacao) {
  const payload = JSON.stringify({
    title: notificacao.title || 'Jejuar 🔥',
    body: notificacao.body || 'Seu jejum está ativo!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: notificacao.tag || 'jejuar-alerta',
    data: {
      url: notificacao.url || '/'
    }
  });

  try {
    const resposta = await webpush.sendNotification(subscription, payload);
    console.log('✓ Notificação enviada com sucesso! Status HTTP:', resposta.statusCode);
    return { sucesso: true, statusCode: resposta.statusCode };
  } catch (erro) {
    console.error('Erro ao enviar push notification:', erro);
    return { sucesso: false, erro };
  }
}

console.log('Serviço de envio Web Push configurado e pronto para uso!');
