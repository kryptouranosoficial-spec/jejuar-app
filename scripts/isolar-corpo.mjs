import sharp from 'sharp';

async function gerarInpaintingLocalPerfeito() {
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

  // Inpaint estritamente local: calcula a média dos pixels no anel de raio [rInterno, rExterno]
  function inpaintLocal(cx, cy, rInterno, rExterno) {
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    for (let dy = -rExterno; dy <= rExterno; dy++) {
      for (let dx = -rExterno; dx <= rExterno; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= rInterno && dist <= rExterno) {
          const px = cx + dx;
          const py = cy + dy;
          if (px >= 0 && px < cropWidth && py >= 0 && py < cropHeight) {
            const idx = (py * cropWidth + px) * channels;
            sumR += data[idx];
            sumG += data[idx + 1];
            sumB += data[idx + 2];
            count++;
          }
        }
      }
    }

    if (count === 0) return;
    const avgR = sumR / count;
    const avgG = sumG / count;
    const avgB = sumB / count;

    // Preenche o interior do anel interno com a média e gradiente suave na borda
    for (let dy = -rInterno; dy <= rInterno; dy++) {
      for (let dx = -rInterno; dx <= rInterno; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= rInterno) {
          const px = cx + dx;
          const py = cy + dy;
          if (px >= 0 && px < cropWidth && py >= 0 && py < cropHeight) {
            const idx = (py * cropWidth + px) * channels;
            const feather = dist > rInterno - 2 ? (rInterno - dist) / 2 : 1;
            data[idx] = Math.round(data[idx] * (1 - feather) + avgR * feather);
            data[idx + 1] = Math.round(data[idx + 1] * (1 - feather) + avgG * feather);
            data[idx + 2] = Math.round(data[idx + 2] * (1 - feather) + avgB * feather);
          }
        }
      }
    }
  }

  // Remove os 5 pontos com raio exato
  // Ponto Peito (x=232, y=128)
  inpaintLocal(232, 128, 9, 14);

  // Ponto Cintura (x=217, y=280)
  inpaintLocal(217, 280, 10, 16);

  // Ponto Braço (x=405, y=148)
  inpaintLocal(405, 148, 8, 13);

  // Ponto Quadril (x=351, y=332)
  inpaintLocal(351, 332, 8, 13);

  // Ponto Coxa (x=342, y=435)
  inpaintLocal(342, 435, 8, 13);

  // Remove linhas tracejadas com interpolação vertical (média de 3px acima e 3px abaixo)
  function removerLinhaSegmento(x1, y1, x2, y2, espessura) {
    const passos = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= passos; i++) {
      const t = i / passos;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t);
      inpaintLocal(x, y, espessura, espessura + 4);
    }
  }

  // Linha do peito: x=175 a 232, y=105 a 128
  removerLinhaSegmento(170, 100, 232, 128, 3);
  // Linha da cintura: x=175 a 217, y=280
  removerLinhaSegmento(170, 280, 217, 280, 3);
  // Linha do quadril: x=351 a 400, y=332 a 340
  removerLinhaSegmento(351, 332, 405, 340, 3);
  // Linha da coxa: x=342 a 400, y=435
  removerLinhaSegmento(342, 435, 405, 435, 3);

  // Limpeza das margens externas onde ficavam as badges
  // Esquerda: tudo que está em x < 165
  for (let y = 0; y < cropHeight; y++) {
    for (let x = 0; x <= 165; x++) {
      const idx = (y * cropWidth + x) * channels;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
    }
  }

  // Direita: tudo que está em x > 410
  for (let y = 0; y < cropHeight; y++) {
    for (let x = 410; x < cropWidth; x++) {
      const idx = (y * cropWidth + x) * channels;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
    }
  }

  // Fade superior suave
  for (let y = 0; y < 25; y++) {
    const fator = 1 - (y / 25);
    for (let x = 0; x < cropWidth; x++) {
      const idx = (y * cropWidth + x) * channels;
      data[idx] = Math.round(data[idx] * (1 - fator) + 255 * fator);
      data[idx + 1] = Math.round(data[idx + 1] * (1 - fator) + 255 * fator);
      data[idx + 2] = Math.round(data[idx + 2] * (1 - fator) + 255 * fator);
    }
  }

  // Fade inferior suave
  for (let y = cropHeight - 60; y < cropHeight; y++) {
    const fator = (y - (cropHeight - 60)) / 60;
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

  console.log('Inpainting local concluído com perfeição!');
}

gerarInpaintingLocalPerfeito().catch(console.error);
