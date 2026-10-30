/**
 * @file scripts/gerar-chaves-vapid.mjs
 * @description Gera o par oficial de chaves VAPID (Pública e Privada) para o Jejuar
 * e salva em vapid-keys.json para uso no front e no back.
 */

import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

const keys = webpush.generateVAPIDKeys();
console.log('Chaves VAPID geradas:');
console.log('Public Key:', keys.publicKey);
console.log('Private Key:', keys.privateKey);

const outputPath = path.resolve('vapid-keys.json');
fs.writeFileSync(outputPath, JSON.stringify(keys, null, 2), 'utf8');
console.log('Salvo em vapid-keys.json com sucesso!');
