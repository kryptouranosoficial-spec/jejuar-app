/**
 * @file utils/bioimpedanciaUtils.ts
 * @description Funções utilitárias, cálculos clínicos, réguas de referência médica (SBIM / Anvisa / Omron),
 * busca insensível a acentos e formatações para o módulo de Bioimpedância.
 */

import type {
  RegistroBioimpedancia,
  NivelClassificacao,
  InfoClassificacaoMetrica,
  DiagnosticoBioimpedancia,
  DeltaEvolucaoBioimpedancia,
} from '../types/bioimpedancia';

/**
 * Normaliza uma string removendo diacríticos (acentos) e transformando em minúsculas
 * para garantir busca 100% case-insensitive e accent-insensitive.
 */
export function normalizarTextoParaBusca(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Realiza busca inteligente em uma lista de exames, ignorando maiúsculas/minúsculas e acentuação,
 * além de permitir palavras separadas (ex: "lauro farmacia" encontra "Farmácia Drogasil Lauro de Freitas").
 */
export function filtrarExamesPorTermo(
  exames: RegistroBioimpedancia[],
  termoBusca: string
): RegistroBioimpedancia[] {
  const termoLimpo = normalizarTextoParaBusca(termoBusca);
  if (!termoLimpo) return exames;

  const palavrasChave = termoLimpo.split(/\s+/).filter(Boolean);

  return exames.filter((exame) => {
    const textoCompleto = normalizarTextoParaBusca(
      `${exame.local} ${exame.dataExame} ${formatarDataBR(exame.dataExame)} ${exame.observacoes || ''}`
    );
    // Cada palavra digitada precisa existir no texto do exame
    return palavrasChave.every((palavra) => textoCompleto.includes(palavra));
  });
}

/**
 * Calcula o Índice de Massa Corporal (IMC) com precisão de 2 casas decimais.
 * Fórmula oficial: IMC = Peso (kg) / Altura² (m)
 */
export function calcularImc(pesoKg: number, alturaMetros: number): number {
  if (!pesoKg || !alturaMetros || alturaMetros <= 0) return 0;
  const imcBruto = pesoKg / (alturaMetros * alturaMetros);
  return Math.round(imcBruto * 100) / 100;
}

/**
 * Formata um número com vírgula para o padrão brasileiro (ex: 72,40).
 */
export function formatarDecimalBR(valor: number, casasDecimais: number = 1): string {
  if (isNaN(valor)) return '0';
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
}

/**
 * Converte data ISO (YYYY-MM-DD) para formato brasileiro simples DD/MM/AAAA.
 */
export function formatarDataBR(dataIso: string): string {
  if (!dataIso) return '';
  const partes = dataIso.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataIso;
}

/**
 * Converte data ISO (YYYY-MM-DD) para formato amigável extenso (ex: "21 de out. de 2026").
 */
export function formatarDataExtensaBR(dataIso: string): string {
  if (!dataIso) return '';
  try {
    const [ano, mes, dia] = dataIso.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return formatarDataBR(dataIso);
  }
}

/**
 * Classifica o IMC conforme critérios da Organização Mundial da Saúde (OMS) e SBIM.
 */
export function classificarImc(imc: number): InfoClassificacaoMetrica {
  if (imc < 18.5) {
    return {
      nivel: 'baixo',
      rotulo: 'Abaixo do Peso',
      corTexto: 'text-sky-700',
      corFundo: 'bg-sky-50 border-sky-200',
      faixaReferenciaTexto: '< 18,5',
      posicaoPercentual: Math.min(25, Math.max(5, (imc / 18.5) * 25)),
    };
  }
  if (imc <= 24.9) {
    return {
      nivel: 'normal',
      rotulo: 'Peso Normal',
      corTexto: 'text-emerald-700',
      corFundo: 'bg-emerald-50 border-emerald-200',
      faixaReferenciaTexto: '18,5 - 24,9',
      posicaoPercentual: 25 + ((imc - 18.5) / (24.9 - 18.5)) * 25,
    };
  }
  if (imc <= 29.9) {
    return {
      nivel: 'alto',
      rotulo: 'Sobrepeso',
      corTexto: 'text-amber-700',
      corFundo: 'bg-amber-50 border-amber-200',
      faixaReferenciaTexto: '25,0 - 29,9',
      posicaoPercentual: 50 + ((imc - 25.0) / (29.9 - 25.0)) * 25,
    };
  }
  return {
    nivel: 'muito_alto',
    rotulo: 'Obesidade',
    corTexto: 'text-rose-700',
    corFundo: 'bg-rose-50 border-rose-200',
    faixaReferenciaTexto: '≥ 30,0',
    posicaoPercentual: Math.min(95, 75 + ((imc - 30.0) / 10) * 20),
  };
}

/**
 * Classifica a Gordura Visceral conforme tabela do exame farmacêutico (Omron / Drogasil):
 * Normal <= 9, Alto 10 a 14, Muito Alto >= 15.
 */
export function classificarGorduraVisceral(nivelVisceral: number): InfoClassificacaoMetrica {
  if (nivelVisceral <= 9) {
    return {
      nivel: 'normal',
      rotulo: 'Nível Saudável',
      corTexto: 'text-emerald-700',
      corFundo: 'bg-emerald-50 border-emerald-200',
      faixaReferenciaTexto: '≤ 9',
      posicaoPercentual: Math.min(33, (nivelVisceral / 9) * 33),
    };
  }
  if (nivelVisceral <= 14) {
    return {
      nivel: 'alto',
      rotulo: 'Nível Elevado',
      corTexto: 'text-amber-700',
      corFundo: 'bg-amber-50 border-amber-200',
      faixaReferenciaTexto: '10 - 14',
      posicaoPercentual: 33 + ((nivelVisceral - 10) / (14 - 10)) * 33,
    };
  }
  return {
    nivel: 'muito_alto',
    rotulo: 'Muito Elevado',
    corTexto: 'text-rose-700',
    corFundo: 'bg-rose-50 border-rose-200',
    faixaReferenciaTexto: '≥ 15',
    posicaoPercentual: Math.min(95, 66 + ((nivelVisceral - 15) / 15) * 29),
  };
}

/**
 * Classifica o Percentual de Gordura Corporal (PGC) com base na idade e sexo biológico.
 * Tabela oficial extraída diretamente do laudo de bioimpedância Drogasil.
 */
export function classificarGorduraCorporal(
  pgc: number,
  idade: number = 40,
  sexo: string = 'masculino'
): InfoClassificacaoMetrica {
  const ehFeminino = sexo.toLowerCase().includes('fem') || sexo.toLowerCase().includes('mulher');

  // Faixas para homens
  if (!ehFeminino) {
    if (idade < 40) {
      if (pgc < 8) return criarMetrica('baixo', 'Baixo', '< 8,0%', pgc, 0, 8, 0, 25);
      if (pgc <= 19.9) return criarMetrica('normal', 'Normal', '8,0% - 19,9%', pgc, 8, 19.9, 25, 50);
      if (pgc <= 24.9) return criarMetrica('alto', 'Alto', '20,0% - 24,9%', pgc, 20, 24.9, 50, 75);
      return criarMetrica('muito_alto', 'Muito Alto', '≥ 25,0%', pgc, 25, 35, 75, 95);
    } else if (idade <= 59) {
      if (pgc < 11) return criarMetrica('baixo', 'Baixo', '< 11,0%', pgc, 0, 11, 0, 25);
      if (pgc <= 21.9) return criarMetrica('normal', 'Normal', '11,0% - 21,9%', pgc, 11, 21.9, 25, 50);
      if (pgc <= 27.9) return criarMetrica('alto', 'Alto', '22,0% - 27,9%', pgc, 22, 27.9, 50, 75);
      return criarMetrica('muito_alto', 'Muito Alto', '≥ 28,0%', pgc, 28, 40, 75, 95);
    } else {
      if (pgc < 13) return criarMetrica('baixo', 'Baixo', '< 13,0%', pgc, 0, 13, 0, 25);
      if (pgc <= 24.9) return criarMetrica('normal', 'Normal', '13,0% - 24,9%', pgc, 13, 24.9, 25, 50);
      if (pgc <= 29.9) return criarMetrica('alto', 'Alto', '25,0% - 29,9%', pgc, 25, 29.9, 50, 75);
      return criarMetrica('muito_alto', 'Muito Alto', '≥ 30,0%', pgc, 30, 42, 75, 95);
    }
  }

  // Faixas para mulheres
  if (idade < 40) {
    if (pgc < 21) return criarMetrica('baixo', 'Baixo', '< 21,0%', pgc, 0, 21, 0, 25);
    if (pgc <= 32.9) return criarMetrica('normal', 'Normal', '21,0% - 32,9%', pgc, 21, 32.9, 25, 50);
    if (pgc <= 38.9) return criarMetrica('alto', 'Alto', '33,0% - 38,9%', pgc, 33, 38.9, 50, 75);
    return criarMetrica('muito_alto', 'Muito Alto', '≥ 39,0%', pgc, 39, 50, 75, 95);
  } else if (idade <= 59) {
    if (pgc < 23) return criarMetrica('baixo', 'Baixo', '< 23,0%', pgc, 0, 23, 0, 25);
    if (pgc <= 33.9) return criarMetrica('normal', 'Normal', '23,0% - 33,9%', pgc, 23, 33.9, 25, 50);
    if (pgc <= 39.9) return criarMetrica('alto', 'Alto', '34,0% - 39,9%', pgc, 34, 39.9, 50, 75);
    return criarMetrica('muito_alto', 'Muito Alto', '≥ 40,0%', pgc, 40, 52, 75, 95);
  } else {
    if (pgc < 24) return criarMetrica('baixo', 'Baixo', '< 24,0%', pgc, 0, 24, 0, 25);
    if (pgc <= 35.9) return criarMetrica('normal', 'Normal', '24,0% - 35,9%', pgc, 24, 35.9, 25, 50);
    if (pgc <= 41.9) return criarMetrica('alto', 'Alto', '36,0% - 41,9%', pgc, 36, 41.9, 50, 75);
    return criarMetrica('muito_alto', 'Muito Alto', '≥ 42,0%', pgc, 42, 55, 75, 95);
  }
}

/**
 * Classifica a Massa Muscular Esquelética com base na idade e sexo biológico.
 * Tabela oficial extraída diretamente do laudo de bioimpedância Drogasil.
 */
export function classificarMusculoEsqueletico(
  musculoPct: number,
  idade: number = 40,
  sexo: string = 'masculino'
): InfoClassificacaoMetrica {
  const ehFeminino = sexo.toLowerCase().includes('fem') || sexo.toLowerCase().includes('mulher');

  // Homens
  if (!ehFeminino) {
    if (idade < 40) {
      if (musculoPct < 33.3) return criarMetricaMusculo('baixo', 'Abaixo do Ideal', '< 33,3%', musculoPct, 20, 33.3, 0, 25);
      if (musculoPct <= 39.3) return criarMetricaMusculo('normal', 'Normal / Bom', '33,3% - 39,3%', musculoPct, 33.3, 39.3, 25, 50);
      if (musculoPct <= 44.0) return criarMetricaMusculo('alto', 'Alto / Forte', '39,4% - 44,0%', musculoPct, 39.4, 44.0, 50, 75);
      return criarMetricaMusculo('muito_alto', 'Excelente / Atleta', '≥ 44,1%', musculoPct, 44.1, 55.0, 75, 95);
    } else if (idade <= 59) {
      if (musculoPct < 33.1) return criarMetricaMusculo('baixo', 'Abaixo do Ideal', '< 33,1%', musculoPct, 20, 33.1, 0, 25);
      if (musculoPct <= 39.1) return criarMetricaMusculo('normal', 'Normal / Bom', '33,1% - 39,1%', musculoPct, 33.1, 39.1, 25, 50);
      if (musculoPct <= 43.8) return criarMetricaMusculo('alto', 'Alto / Forte', '39,2% - 43,8%', musculoPct, 39.2, 43.8, 50, 75);
      return criarMetricaMusculo('muito_alto', 'Excelente / Atleta', '≥ 43,9%', musculoPct, 43.9, 55.0, 75, 95);
    } else {
      if (musculoPct < 32.9) return criarMetricaMusculo('baixo', 'Abaixo do Ideal', '< 32,9%', musculoPct, 20, 32.9, 0, 25);
      if (musculoPct <= 38.9) return criarMetricaMusculo('normal', 'Normal / Bom', '32,9% - 38,9%', musculoPct, 32.9, 38.9, 25, 50);
      if (musculoPct <= 43.6) return criarMetricaMusculo('alto', 'Alto / Forte', '39,0% - 43,6%', musculoPct, 39.0, 43.6, 50, 75);
      return criarMetricaMusculo('muito_alto', 'Excelente / Atleta', '≥ 43,7%', musculoPct, 43.7, 55.0, 75, 95);
    }
  }

  // Mulheres
  if (idade < 40) {
    if (musculoPct < 24.3) return criarMetricaMusculo('baixo', 'Abaixo do Ideal', '< 24,3%', musculoPct, 15, 24.3, 0, 25);
    if (musculoPct <= 30.3) return criarMetricaMusculo('normal', 'Normal / Bom', '24,3% - 30,3%', musculoPct, 24.3, 30.3, 25, 50);
    if (musculoPct <= 35.3) return criarMetricaMusculo('alto', 'Alto / Forte', '30,4% - 35,3%', musculoPct, 30.4, 35.3, 50, 75);
    return criarMetricaMusculo('muito_alto', 'Excelente / Atleta', '≥ 35,4%', musculoPct, 35.4, 45.0, 75, 95);
  } else if (idade <= 59) {
    if (musculoPct < 24.1) return criarMetricaMusculo('baixo', 'Abaixo do Ideal', '< 24,1%', musculoPct, 15, 24.1, 0, 25);
    if (musculoPct <= 30.1) return criarMetricaMusculo('normal', 'Normal / Bom', '24,1% - 30,1%', musculoPct, 24.1, 30.1, 25, 50);
    if (musculoPct <= 35.1) return criarMetricaMusculo('alto', 'Alto / Forte', '30,2% - 35,1%', musculoPct, 30.2, 35.1, 50, 75);
    return criarMetricaMusculo('muito_alto', 'Excelente / Atleta', '≥ 35,2%', musculoPct, 35.2, 45.0, 75, 95);
  } else {
    if (musculoPct < 23.9) return criarMetricaMusculo('baixo', 'Abaixo do Ideal', '< 23,9%', musculoPct, 15, 23.9, 0, 25);
    if (musculoPct <= 29.9) return criarMetricaMusculo('normal', 'Normal / Bom', '23,9% - 29,9%', musculoPct, 23.9, 29.9, 25, 50);
    if (musculoPct <= 34.9) return criarMetricaMusculo('alto', 'Alto / Forte', '30,0% - 34,9%', musculoPct, 30.0, 34.9, 50, 75);
    return criarMetricaMusculo('muito_alto', 'Excelente / Atleta', '≥ 35,0%', musculoPct, 35.0, 45.0, 75, 95);
  }
}

/**
 * Função auxiliar para gerar métrica de gordura (onde alto/muito_alto são de atenção).
 */
function criarMetrica(
  nivel: NivelClassificacao,
  rotulo: string,
  faixaReferenciaTexto: string,
  val: number,
  minVal: number,
  maxVal: number,
  basePerc: number,
  topoPerc: number
): InfoClassificacaoMetrica {
  const fraction = maxVal > minVal ? Math.min(1, Math.max(0, (val - minVal) / (maxVal - minVal))) : 0.5;
  const posicaoPercentual = basePerc + fraction * (topoPerc - basePerc);

  let corTexto = 'text-emerald-700';
  let corFundo = 'bg-emerald-50 border-emerald-200';

  if (nivel === 'baixo') {
    corTexto = 'text-sky-700';
    corFundo = 'bg-sky-50 border-sky-200';
  } else if (nivel === 'alto') {
    corTexto = 'text-amber-700';
    corFundo = 'bg-amber-50 border-amber-200';
  } else if (nivel === 'muito_alto') {
    corTexto = 'text-rose-700';
    corFundo = 'bg-rose-50 border-rose-200';
  }

  return {
    nivel,
    rotulo,
    corTexto,
    corFundo,
    faixaReferenciaTexto,
    posicaoPercentual: Math.min(95, Math.max(5, posicaoPercentual)),
  };
}

/**
 * Função auxiliar para métrica muscular (onde valores mais altos são positivos).
 */
function criarMetricaMusculo(
  nivel: NivelClassificacao,
  rotulo: string,
  faixaReferenciaTexto: string,
  val: number,
  minVal: number,
  maxVal: number,
  basePerc: number,
  topoPerc: number
): InfoClassificacaoMetrica {
  const fraction = maxVal > minVal ? Math.min(1, Math.max(0, (val - minVal) / (maxVal - minVal))) : 0.5;
  const posicaoPercentual = basePerc + fraction * (topoPerc - basePerc);

  let corTexto = 'text-emerald-700';
  let corFundo = 'bg-emerald-50 border-emerald-200';

  if (nivel === 'baixo') {
    corTexto = 'text-amber-700';
    corFundo = 'bg-amber-50 border-amber-200';
  } else if (nivel === 'muito_alto') {
    corTexto = 'text-emerald-800';
    corFundo = 'bg-emerald-100 border-emerald-300';
  }

  return {
    nivel,
    rotulo,
    corTexto,
    corFundo,
    faixaReferenciaTexto,
    posicaoPercentual: Math.min(95, Math.max(5, posicaoPercentual)),
  };
}

/**
 * Diagnóstico consolidado de todas as métricas para renderização rápida na interface.
 */
export function classificarExameBioimpedancia(
  exame: RegistroBioimpedancia,
  idade: number = 40,
  sexo: string = 'masculino'
): DiagnosticoBioimpedancia {
  return {
    imc: classificarImc(exame.imc),
    gorduraCorporal: classificarGorduraCorporal(exame.gorduraCorporalPercentual, idade, sexo),
    musculoEsqueletico: classificarMusculoEsqueletico(exame.musculoEsqueleticoPercentual, idade, sexo),
    gorduraVisceral: classificarGorduraVisceral(exame.gorduraVisceralNivel),
  };
}

/**
 * Calcula a variação (Delta) entre o exame atual e o exame anterior.
 */
export function calcularDeltaEvolucao(
  exameRecente: RegistroBioimpedancia,
  exameAnterior: RegistroBioimpedancia
): DeltaEvolucaoBioimpedancia {
  const d1 = new Date(exameRecente.dataExame).getTime();
  const d2 = new Date(exameAnterior.dataExame).getTime();
  const diasDiferenca = Math.max(0, Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)));

  const deltaPesoKg = Math.round((exameRecente.pesoKg - exameAnterior.pesoKg) * 10) / 10;
  const deltaGorduraPercentual =
    Math.round((exameRecente.gorduraCorporalPercentual - exameAnterior.gorduraCorporalPercentual) * 10) / 10;
  const deltaMusculoPercentual =
    Math.round((exameRecente.musculoEsqueleticoPercentual - exameAnterior.musculoEsqueleticoPercentual) * 10) / 10;
  const deltaGorduraVisceral = exameRecente.gorduraVisceralNivel - exameAnterior.gorduraVisceralNivel;

  return {
    diasDiferenca,
    deltaPesoKg,
    deltaGorduraPercentual,
    deltaMusculoPercentual,
    deltaGorduraVisceral,
    melhorouGordura: deltaGorduraPercentual < 0, // Perder gordura é melhora
    melhorouMusculo: deltaMusculoPercentual > 0, // Ganhar músculo é melhora
    melhorouVisceral: deltaGorduraVisceral <= 0, // Reduzir ou manter visceral baixa é melhora
  };
}

/**
 * Calcula os dias restantes até o próximo reteste sugerido com base no último exame e frequência.
 */
export function calcularStatusProximoReteste(
  dataUltimoExame: string | undefined,
  frequenciaDias: number = 30
): { diasRestantes: number; dataSugeridaIso: string; status: 'em_dia' | 'proximo' | 'atrasado' | 'sem_exame' } {
  if (!dataUltimoExame) {
    return {
      diasRestantes: 0,
      dataSugeridaIso: '',
      status: 'sem_exame',
    };
  }

  const [ano, mes, dia] = dataUltimoExame.split('-').map(Number);
  const dataUltimo = new Date(ano, mes - 1, dia);
  const dataSugerida = new Date(dataUltimo);
  dataSugerida.setDate(dataSugerida.getDate() + frequenciaDias);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataSugerida.setHours(0, 0, 0, 0);

  const diffMs = dataSugerida.getTime() - hoje.getTime();
  const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const anoSug = dataSugerida.getFullYear();
  const mesSug = String(dataSugerida.getMonth() + 1).padStart(2, '0');
  const diaSug = String(dataSugerida.getDate()).padStart(2, '0');
  const dataSugeridaIso = `${anoSug}-${mesSug}-${diaSug}`;

  let status: 'em_dia' | 'proximo' | 'atrasado' = 'em_dia';
  if (diasRestantes < 0) {
    status = 'atrasado';
  } else if (diasRestantes <= 7) {
    status = 'proximo';
  }

  return {
    diasRestantes,
    dataSugeridaIso,
    status,
  };
}

/**
 * Calcula a faixa de peso ideal em kg para uma dada altura com base no IMC saudável (18,5 a 24,9).
 */
export function calcularFaixaPesoIdeal(alturaMetros: number): {
  pesoMinKg: number;
  pesoMaxKg: number;
  textoFaixa: string;
} {
  const altura = alturaMetros > 0 ? alturaMetros : 1.63;
  const pesoMinKg = Math.round(18.5 * altura * altura * 10) / 10;
  const pesoMaxKg = Math.round(24.9 * altura * altura * 10) / 10;
  return {
    pesoMinKg,
    pesoMaxKg,
    textoFaixa: `${formatarDecimalBR(pesoMinKg, 1)} - ${formatarDecimalBR(pesoMaxKg, 1)} kg`,
  };
}
