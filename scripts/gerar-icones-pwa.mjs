/**
 * @file scripts/gerar-icones-pwa.mjs
 * @description Converte o logo 3D oficial de alta resolução (/public/assets/aistudio/screen_1d1a20d5.png)
 * nos ícones físicos exatos para o PWA (192x192, 512x512 e apple-touch-icon).
 * Garante fidelidade visual idêntica à do aplicativo.
 */

import sharp from 'sharp';
import path from 'path';

const sourceImg = path.resolve('public/assets/aistudio/screen_1d1a20d5.png');
const out192Path = path.resolve('public/icon-192.png');
const out512Path = path.resolve('public/icon-512.png');
const outApplePath = path.resolve('public/apple-touch-icon.png');

async function gerarIcones() {
  try {
    // Redimensionar para 192x192
    await sharp(sourceImg)
      .resize(192, 192, { fit: 'cover' })
      .png({ quality: 100 })
      .toFile(out192Path);
    console.log('✓ /public/icon-192.png gerado com qualidade máxima (192x192)');

    // Redimensionar para 512x512
    await sharp(sourceImg)
      .resize(512, 512, { fit: 'cover' })
      .png({ quality: 100 })
      .toFile(out512Path);
    console.log('✓ /public/icon-512.png gerado com qualidade máxima (512x512)');

    // Redimensionar para apple-touch-icon (180x180)
    await sharp(sourceImg)
      .resize(180, 180, { fit: 'cover' })
      .png({ quality: 100 })
      .toFile(outApplePath);
    console.log('✓ /public/apple-touch-icon.png gerado com qualidade máxima (180x180)');
  } catch (err) {
    console.error('Erro ao processar ícones:', err);
    process.exit(1);
  }
}

gerarIcones();
