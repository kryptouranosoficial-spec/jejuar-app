/**
 * @file imagemUtils.ts
 * @description Utilitários para processamento, redimensionamento e compressão
 * de imagens no lado do cliente (Client-Side Canvas) para persistência segura em Base64 no Firestore.
 */

/**
 * Redimensiona e comprime um arquivo de imagem para Base64 JPEG leve (~40KB a 70KB),
 * respeitando as dimensões máximas e evitando que exceda o limite de 1MB por documento do Firestore.
 * 
 * @param arquivo Arquivo de imagem selecionado pelo usuário (da câmera ou da galeria)
 * @param maxDimensao Largura ou altura máxima em pixels (padrão: 800px)
 * @param qualidade Qualidade de compressão JPEG de 0.0 a 1.0 (padrão: 0.75)
 * @returns Promise com a string da imagem em formato Data URL Base64
 */
export function comprimirImagemBase64(
  arquivo: File,
  maxDimensao = 800,
  qualidade = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validação básica do tipo MIME
    if (!arquivo.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const leitor = new FileReader();

    leitor.onload = (eventoLeitor) => {
      const resultado = eventoLeitor.target?.result;
      if (typeof resultado !== 'string') {
        reject(new Error('Não foi possível ler os dados da imagem.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calcula a nova escala preservando rigorosamente o aspect ratio
        if (width > height) {
          if (width > maxDimensao) {
            height = Math.round((height * maxDimensao) / width);
            width = maxDimensao;
          }
        } else {
          if (height > maxDimensao) {
            width = Math.round((width * maxDimensao) / height);
            height = maxDimensao;
          }
        }

        // Desenha no canvas com dimensões otimizadas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível inicializar o contexto gráfico para compressão.'));
          return;
        }

        // Fundo branco para imagens com transparência (ex: PNG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Renderiza a imagem reescalada
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para JPEG com compressão otimizada
        try {
          const base64Comprimido = canvas.toDataURL('image/jpeg', qualidade);
          resolve(base64Comprimido);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Erro ao decodificar a imagem selecionada.'));
      };

      img.src = resultado;
    };

    leitor.onerror = () => {
      reject(new Error('Falha ao carregar o arquivo de imagem do dispositivo.'));
    };

    leitor.readAsDataURL(arquivo);
  });
}
