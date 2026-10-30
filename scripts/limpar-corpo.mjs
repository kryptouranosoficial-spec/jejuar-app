import sharp from 'sharp';

async function processarCorpoMasculinoPerfeitoFinal() {
  const inputPath = 'public/assets/aistudio/image_12b5d1a1.png';
  const outputPath = 'public/assets/aistudio/corpo_masculino_limpo.png';

  const cropY = 240;
  const cropHeight = 520;
  const cropWidth = 576;

  const { data, info } = await sharp(inputPath)
    .extract({ left: 0, top: cropY, width: cropWidth, height: cropHeight })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;

  // Função para pintar uma região circular com uma cor RGB específica e ruído sutil de textura
  function pintarCirculoCor(cx, cy, raio, r, g, b, ruidoMax = 4) {
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        if (dx * dx + dy * dy <= raio * raio) {
          const px = cx + dx;
          const py = cy + dy;
          if (px >= 0 && px < cropWidth && py >= 0 && py < cropHeight) {
            const idx = (py * cropWidth + px) * channels;
            const ruido = (Math.random() * ruidoMax * 2) - ruidoMax;
            data[idx] = Math.min(255, Math.max(0, Math.round(r + ruido)));
            data[idx + 1] = Math.min(255, Math.max(0, Math.round(g + ruido)));
            data[idx + 2] = Math.min(255, Math.max(0, Math.round(b + ruido)));
          }
        }
      }
    }
  }

  // Clona diretamente de uma fonte saudável (copiando textura real)
  function clonarTextura(srcX, srcY, dstX, dstY, raio) {
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        if (dx * dx + dy * dy <= raio * raio) {
          const sx = srcX + dx;
          const sy = srcY + dy;
          const tx = dstX + dx;
          const ty = dstY + dy;
          if (sx >= 0 && sx < cropWidth && sy >= 0 && sy < cropHeight &&
              tx >= 0 && tx < cropWidth && ty >= 0 && ty < cropHeight) {
            const sIdx = (sy * cropWidth + sx) * channels;
            const tIdx = (ty * cropWidth + tx) * channels;
            for (let c = 0; c < 3; c++) {
              data[tIdx + c] = data[sIdx + c];
            }
          }
        }
      }
    }
  }

  // 1. Limpa o peito: clona da textura limpa da camiseta (x=280, y=140) para o peito e linha
  clonarTextura(280, 140, 232, 128, 14);
  // Linha tracejada do bolso e peito (x=160 a 230, y=90 a 130)
  for (let x = 160; x <= 230; x += 4) {
    const yLinha = Math.round(92 + (x - 160) * 0.45);
    clonarTextura(280, 160, x, yLinha, 6);
  }

  // 2. Limpa a cintura: clona da textura limpa da camiseta na altura da cintura (x=260, y=280)
  clonarTextura(260, 280, 217, 280, 15);
  for (let x = 165; x <= 217; x += 4) {
    clonarTextura(260, 280, x, 280, 6);
  }

  // 3. Limpa o braço esquerdo: clona da manga limpa (x=380, y=148)
  clonarTextura(380, 148, 405, 148, 12);

  // 4. Limpa o quadril: clona da textura escura da calça de moletom (x=280, y=340)
  clonarTextura(280, 340, 351, 332, 14);

  // 5. Limpa a coxa: clona da textura escura da calça de moletom (x=280, y=435)
  clonarTextura(280, 435, 342, 435, 14);

  // 6. Limpa as linhas tracejadas externas à direita da calça (x=350 a 420)
  for (let x = 350; x <= 415; x += 3) {
    // Linha do quadril
    clonarTextura(300, 340, x, 335, 5);
    // Linha da coxa
    clonarTextura(300, 435, x, 435, 5);
  }

  // 7. Limpa todo o fundo externo (fora do corpo) com branco puro #FFFFFF
  for (let y = 0; y < cropHeight; y++) {
    for (let x = 0; x < cropWidth; x++) {
      let ehFora = false;

      // Ombro direito até topo
      if (y < 70 && x < 185) ehFora = true;
      // Braço direito
      else if (y >= 70 && y < 350 && x < 135) ehFora = true;
      // Perna / mão direita
      else if (y >= 350 && x < 155) ehFora = true;

      // Ombro esquerdo até topo
      else if (y < 70 && x > 390) ehFora = true;
      // Braço esquerdo
      else if (y >= 70 && y < 350 && x > 445) ehFora = true;
      // Perna / mão esquerda
      else if (y >= 350 && x > 425) ehFora = true;

      if (ehFora) {
        const idx = (y * cropWidth + x) * channels;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
      }
    }
  }

  // Limpa as margens laterais completas onde ficavam as badges
  for (let y = 0; y < cropHeight; y++) {
    // Lado esquerdo
    for (let x = 0; x <= 165; x++) {
      if (y < 160 || (y >= 180 && y <= 330) || y > 350) {
        const idx = (y * cropWidth + x) * channels;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
      }
    }
    // Lado direito
    for (let x = 415; x < cropWidth; x++) {
      const idx = (y * cropWidth + x) * channels;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
    }
  }

  // 8. Fade suave no topo (pescoço) e na base (coxas)
  for (let y = 0; y < 35; y++) {
    const fator = 1 - (y / 35);
    for (let x = 0; x < cropWidth; x++) {
      const idx = (y * cropWidth + x) * channels;
      data[idx] = Math.round(data[idx] * (1 - fator) + 255 * fator);
      data[idx + 1] = Math.round(data[idx + 1] * (1 - fator) + 255 * fator);
      data[idx + 2] = Math.round(data[idx + 2] * (1 - fator) + 255 * fator);
    }
  }

  for (let y = cropHeight - 70; y < cropHeight; y++) {
    const fator = (y - (cropHeight - 70)) / 70;
    for (let x = 0; x < cropWidth; x++) {
      const idx = (y * cropWidth + x) * channels;
      data[idx] = Math.round(data[idx] * (1 - fator) + 255 * fator);
      data[idx + 1] = Math.round(data[idx + 1] * (1 - fator) + 255 * fator);
      data[idx + 2] = Math.round(data[idx + 2] * (1 - fator) + 255 * fator);
    }
  }

  await sharp(data, {
    raw: {
      width: cropWidth,
      height: cropHeight,
      channels: channels,
    }
  })
    .png()
    .toFile(outputPath);

  console.log('Imagem masculina perfeita final gerada em:', outputPath);
}

processarCorpoMasculinoPerfeitoFinal().catch(console.error);
