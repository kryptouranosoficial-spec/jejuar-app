/**
 * @file biometriaMarcosUtils.ts
 * @description Utilitário centralizado para cálculo de estimativas biométricas (oxidação lipídica,
 * gasto calórico da reserva e autofagia) e geração da régua de marcos de notificações externas e internas
 * desde 4h até 168h (7 dias), incluindo a meta personalizada do protocolo ativo.
 */

export interface MarcoBiometricoJejum {
  /** Hora exata do marco (ex: 4, 8, 12, 14, 16, 18, 24, 36, 48, 72, 168) */
  horas: number;
  /** Título curto e impactante para a notificação externa no celular */
  titulo: string;
  /** Corpo detalhado com explicação fisiológica e estimativa em gramas de gordura oxidada */
  mensagem: string;
  /** Nome científico/fisiológico da fase para exibição no painel de Biometria */
  nomeFase: string;
  /** Gramas estimadas de gordura pura oxidada até este marco */
  gorduraGramas: number;
  /** Calorias lipídicas equivalentes extraídas do estoque adiposo */
  caloriasLipidicas: number;
  /** Indica se este marco corresponde exatamente à conclusão da meta do plano */
  ehConclusaoMeta: boolean;
}

/**
 * Calcula a taxa média de oxidação de gordura por hora (g/h) de acordo com a profundidade
 * fisiológica do jejum e o peso corporal do usuário.
 *
 * @param horasDecorridas Horas totais acumuladas no jejum
 * @param pesoKg Peso atual do usuário em kg (padrão: 72.4)
 * @returns Objeto contendo gramas de gordura oxidada e calorias lipídicas
 */
export function calcularEstimativaLipolise(
  horasDecorridas: number,
  pesoKg: number = 72.4
): { gorduraGramas: number; caloriasLipidicas: number } {
  const pesoValido = pesoKg > 30 ? pesoKg : 72.4;
  const fatorPeso = pesoValido / 70;

  // Taxa progressiva de lipólise conforme a queda da insulina e aumento dos corpos cetônicos
  let taxaGorduraHora = 1.2;
  if (horasDecorridas >= 36) {
    taxaGorduraHora = 3.6; // Cetose máxima (100% dependente de ácidos graxos e corpos cetônicos)
  } else if (horasDecorridas >= 24) {
    taxaGorduraHora = 3.4; // Esgotamento completo de glicogênio hepático
  } else if (horasDecorridas >= 16) {
    taxaGorduraHora = 3.2; // Autofagia ativa e lipólise plena
  } else if (horasDecorridas >= 12) {
    taxaGorduraHora = 2.8; // Entrada em cetose nutricional
  } else if (horasDecorridas >= 8) {
    taxaGorduraHora = 2.2; // Virada metabólica (HSL ativada)
  } else if (horasDecorridas >= 4) {
    taxaGorduraHora = 1.6; // Queda da insulina e glicogenólise
  }

  const gorduraGramas = Math.max(4, Math.round(horasDecorridas * taxaGorduraHora * fatorPeso));
  const caloriasLipidicas = Math.round(gorduraGramas * 9);

  return { gorduraGramas, caloriasLipidicas };
}

/**
 * Gera a lista ordenada de todos os marcos biométricos aplicáveis ao protocolo de jejum do usuário.
 * Inclui os marcos fisiológicos universais (4h, 8h, 12h, 14h, 16h, 18h, 24h, 36h, 48h, 72h, 168h)
 * e garante que a meta exata do plano escolhido (`metaHoras`) tenha seu alerta celebrativo rico.
 *
 * @param metaHoras Meta em horas do protocolo selecionado (ex: 16, 18, 24, 36, 48, 72, 168)
 * @param nomePlano Nome do protocolo (ex: '16:8', '24h', '48h')
 * @param pesoKg Peso corporal do usuário em kg para cálculo personalizado de oxidação
 * @returns Lista ordenada de marcos biométricos
 */
export function gerarMarcosBiometricosJejum(
  metaHoras: number = 16,
  nomePlano: string = '16:8',
  pesoKg: number = 72.4
): MarcoBiometricoJejum[] {
  const catalogoBase: Array<{
    horas: number;
    nomeFase: string;
    gerarTitulo: (ehMeta: boolean, plano: string) => string;
    gerarMensagem: (gordura: number, kcal: number, ehMeta: boolean) => string;
  }> = [
    {
      horas: 4,
      nomeFase: 'Queda da Insulina & Fim da Digestão',
      gerarTitulo: () => '📉 4h de Jejum: Insulina em queda!',
      gerarMensagem: (g) =>
        `Sua digestão terminou e o fígado começou a usar o glicogênio estocado (~${g}g mobilizados). Continue firme!`,
    },
    {
      horas: 8,
      nomeFase: 'Virada Metabólica & Lipólise Inicial',
      gerarTitulo: () => '⚡ 8h de Jejum: Insulina no menor nível!',
      gerarMensagem: (g) =>
        `Seu fígado começou a liberar ácidos graxos estocados! Estimativa atual: ~${g}g de gordura oxidada.`,
    },
    {
      horas: 12,
      nomeFase: 'Cetose Nutricional & Foco Mental',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `✨ Meta de 12h Atingida (${plano}): Cetose Ativada!`
          : '🔥 12h de Jejum: Cetose Ativada!',
      gerarMensagem: (g, kcal, ehMeta) =>
        `Cetonas alimentando seu cérebro e HGH subindo! Estimativa: ~${g}g de gordura pura oxidada (${kcal} kcal).${ehMeta ? ' Parabéns!' : ''}`,
    },
    {
      horas: 14,
      nomeFase: 'Queima Lipídica Profunda',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `✨ Meta de 14h Atingida (${plano}): Queima Profunda!`
          : '🔬 14h de Jejum: Queima Lipídica Profunda!',
      gerarMensagem: (g, kcal, ehMeta) =>
        `Suas mitocôndrias ativaram a queima lipídica profunda! Estimativa de hoje: ~${g}g de gordura oxidada (${kcal} kcal).${ehMeta ? ' Parabéns!' : ''}`,
    },
    {
      horas: 16,
      nomeFase: 'Autofagia Celular Ativada',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `✨ Meta de 16h Atingida! (${plano})`
          : '🛡️ 16h de Jejum: Autofagia Celular Ativada!',
      gerarMensagem: (g, kcal, ehMeta) =>
        `Reciclagem celular em ação e ~${g}g de gordura oxidada (${kcal} kcal da reserva).${ehMeta ? ' Parabéns pela conquista!' : ' Continue evoluindo!'}`,
    },
    {
      horas: 18,
      nomeFase: 'Pico de HGH & Autofagia Acelerada',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `✨ Meta de 18h Atingida! (${plano})`
          : '🚀 18h de Jejum: Pico de HGH e Autofagia!',
      gerarMensagem: (g, kcal, ehMeta) =>
        `Hormônio do crescimento protegendo sua massa magra e ~${g}g de gordura visceral oxidada (${kcal} kcal).${ehMeta ? ' Parabéns!' : ''}`,
    },
    {
      horas: 24,
      nomeFase: 'Autofagia Profunda & Células-Tronco',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `✨ Meta de 24h Atingida! (${plano})`
          : '🧬 24h de Jejum: Regeneração de Células-Tronco!',
      gerarMensagem: (g, kcal, ehMeta) =>
        `1 dia completo! Redução de IGF-1, renovação intestinal e ~${g}g de gordura pura oxidada (${kcal} kcal).${ehMeta ? ' Incrível!' : ''}`,
    },
    {
      horas: 36,
      nomeFase: 'Cetose Máxima (100% Lipólise)',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `✨ Meta de 36h Atingida! (${plano})`
          : '⚡ 36h de Jejum: Cetose e Faxina Metabólica!',
      gerarMensagem: (g, kcal, ehMeta) =>
        `Queima intensa de gordura visceral e reciclagem celular profunda: ~${g}g de gordura oxidada (${kcal} kcal).${ehMeta ? ' Parabéns!' : ''}`,
    },
    {
      horas: 48,
      nomeFase: 'Biogênese Mitocondrial & Renovação Imune',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `✨ Meta de 48h Atingida! (${plano})`
          : '🛡️ 48h de Jejum: Renovação do Sistema Imune!',
      gerarMensagem: (g, kcal, ehMeta) =>
        `2 dias em jejum! Criação de novas mitocôndrias, limpeza imune e ~${g}g de gordura oxidada (${kcal} kcal).${ehMeta ? ' Extraordinário!' : ''}`,
    },
    {
      horas: 72,
      nomeFase: 'Reinicialização Imunológica Plena',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `👑 Meta de 72h Atingida! (${plano})`
          : '👑 72h de Jejum: Pico Máximo de Células-Tronco!',
      gerarMensagem: (g, kcal, ehMeta) =>
        `3 dias! Seu sistema imune e metabólico atingiu regeneração celular máxima (~${g}g de gordura oxidada / ${kcal} kcal).`,
    },
    {
      horas: 168,
      nomeFase: 'Reprogramação Epigenética (7 Dias)',
      gerarTitulo: (ehMeta, plano) =>
        ehMeta
          ? `🌟 Meta Lendária de 168h Atingida! (${plano})`
          : '🌟 168h de Jejum: Marco Lendário de 7 Dias!',
      gerarMensagem: (g, kcal) =>
        `7 dias concluídos! Renovação sistêmica completa e ~${g}g de gordura pura oxidada (${kcal} kcal). Lembre-se de quebrar o jejum com leveza!`,
    },
  ];

  const marcosMap = new Map<number, MarcoBiometricoJejum>();

  for (const item of catalogoBase) {
    // Inclui todos os marcos fisiológicos até a meta do plano (ou até o próximo estágio imediato se o usuário continuar em tempo extra)
    const ehMeta = item.horas === metaHoras;
    const { gorduraGramas, caloriasLipidicas } = calcularEstimativaLipolise(item.horas, pesoKg);

    marcosMap.set(item.horas, {
      horas: item.horas,
      titulo: item.gerarTitulo(ehMeta, nomePlano),
      mensagem: item.gerarMensagem(gorduraGramas, caloriasLipidicas, ehMeta),
      nomeFase: item.nomeFase,
      gorduraGramas,
      caloriasLipidicas,
      ehConclusaoMeta: ehMeta,
    });
  }

  // Caso o usuário tenha escolhido um plano com hora intermediária (ex: 13h, 15h, 17h, 19h, 20h, 21h, 22h, 23h, 30h)
  if (metaHoras > 0 && !marcosMap.has(metaHoras)) {
    const { gorduraGramas, caloriasLipidicas } = calcularEstimativaLipolise(metaHoras, pesoKg);
    marcosMap.set(metaHoras, {
      horas: metaHoras,
      titulo: `✨ Meta de ${metaHoras}h Atingida! (${nomePlano})`,
      mensagem: `Autofagia celular no pico máximo e ~${gorduraGramas}g de gordura oxidada (${caloriasLipidicas} kcal). Parabéns!`,
      nomeFase: `Meta do Protocolo ${nomePlano} Concluída`,
      gorduraGramas,
      caloriasLipidicas,
      ehConclusaoMeta: true,
    });
  }

  return Array.from(marcosMap.values()).sort((a, b) => a.horas - b.horas);
}
