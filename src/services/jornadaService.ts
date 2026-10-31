/**
 * @file services/jornadaService.ts
 * @description Camada de serviços para a aba Jornada & Diário de Bordo.
 * Gerencia anotações pessoais, unificação de eventos na timeline (jejuns, água, notas, pesagens, bioimpedância)
 * com suporte a persistência híbrida (Firestore + localStorage offline instantâneo).
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  AnotacaoJornada, 
  ItemLinhaTempoJornada, 
  HumorJornada, 
  OpcaoHumorJornada,
  EstatisticasJornada,
  FiltroCategoriaJornada 
} from '../types/jornada';
import type { SessaoJejum } from '../types';
import { listarBioimpedancias } from './bioimpedanciaService';
import { buscarHistoricoPesagensFirestore } from './firebase';
import { notificarAtualizacaoGamificacao } from '../utils/perfilUtils';

/** Catálogo oficial de humores/sentimentos disponíveis para registro rápido */
export const LISTA_HUMORES_JORNADA: OpcaoHumorJornada[] = [
  { id: 'energico', rotulo: 'Enérgico', emoji: '⚡', corBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', corTexto: 'text-emerald-700' },
  { id: 'focado', rotulo: 'Focado', emoji: '🎯', corBg: 'bg-indigo-50 text-indigo-700 border-indigo-200', corTexto: 'text-indigo-700' },
  { id: 'sereno', rotulo: 'Sereno', emoji: '🌿', corBg: 'bg-teal-50 text-teal-700 border-teal-200', corTexto: 'text-teal-700' },
  { id: 'motivado', rotulo: 'Motivado', emoji: '🔥', corBg: 'bg-amber-50 text-amber-700 border-amber-200', corTexto: 'text-amber-700' },
  { id: 'leve', rotulo: 'Leve', emoji: '🍃', corBg: 'bg-sky-50 text-sky-700 border-sky-200', corTexto: 'text-sky-700' },
  { id: 'cansado', rotulo: 'Cansado', emoji: '🥱', corBg: 'bg-slate-100 text-slate-700 border-slate-300', corTexto: 'text-slate-700' },
  { id: 'com_fome', rotulo: 'Com Fome', emoji: '🍽️', corBg: 'bg-orange-50 text-orange-700 border-orange-200', corTexto: 'text-orange-700' },
  { id: 'desafiador', rotulo: 'Desafiador', emoji: '🏔️', corBg: 'bg-rose-50 text-rose-700 border-rose-200', corTexto: 'text-rose-700' },
];

const LOCAL_STORAGE_KEY_ANOTACOES = 'jejuar_diario_anotacoes';

/**
 * Remove acentuação e converte para minúsculas para busca resiliente.
 */
export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Salva uma nova anotação no diário da Jornada.
 */
export async function salvarNovaAnotacaoJornada(
  usuarioId: string | undefined,
  dados: {
    titulo: string;
    conteudo: string;
    dataIso?: string;
    humor?: HumorJornada;
    tags?: string[];
  }
): Promise<AnotacaoJornada> {
  const agoraIso = dados.dataIso || new Date().toISOString();
  const novaAnotacao: AnotacaoJornada = {
    id: `nota_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dataIso: agoraIso,
    titulo: dados.titulo.trim() || 'Anotação do Dia',
    conteudo: dados.conteudo.trim(),
    humor: dados.humor,
    tags: dados.tags || [],
    criadoEm: agoraIso,
    atualizadoEm: agoraIso,
  };

  // 1. Atualiza cache local instantâneo
  if (typeof window !== 'undefined') {
    try {
      const salvas = obterAnotacoesLocal();
      const atualizadas = [novaAnotacao, ...salvas];
      localStorage.setItem(LOCAL_STORAGE_KEY_ANOTACOES, JSON.stringify(atualizadas));
    } catch (e) {
      console.warn('Erro ao salvar anotação em localStorage:', e);
    }
  }

  // 2. Persiste no Firestore se usuário estiver autenticado
  if (usuarioId) {
    try {
      const colecaoRef = collection(db, 'usuarios', usuarioId, 'diario_anotacoes');
      const docRef = await addDoc(colecaoRef, {
        dataIso: novaAnotacao.dataIso,
        titulo: novaAnotacao.titulo,
        conteudo: novaAnotacao.conteudo,
        humor: novaAnotacao.humor || null,
        tags: novaAnotacao.tags || [],
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
      novaAnotacao.id = docRef.id;
    } catch (error) {
      console.warn('[Jornada] Falha ao persistir anotação no Firestore, mantido em cache local:', error);
    }
  }

  notificarAtualizacaoGamificacao();
  return novaAnotacao;
}

/**
 * Atualiza uma anotação existente do diário.
 */
export async function atualizarAnotacaoJornada(
  usuarioId: string | undefined,
  anotacaoId: string,
  dados: Partial<Omit<AnotacaoJornada, 'id' | 'criadoEm'>>
): Promise<void> {
  const agoraIso = new Date().toISOString();

  // 1. Atualiza cache local
  if (typeof window !== 'undefined') {
    try {
      const salvas = obterAnotacoesLocal();
      const index = salvas.findIndex(a => a.id === anotacaoId);
      if (index !== -1) {
        salvas[index] = {
          ...salvas[index],
          ...dados,
          atualizadoEm: agoraIso,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY_ANOTACOES, JSON.stringify(salvas));
      }
    } catch (e) {
      console.warn('Erro ao atualizar anotação localmente:', e);
    }
  }

  // 2. Atualiza no Firestore
  if (usuarioId && anotacaoId && !anotacaoId.startsWith('nota_')) {
    try {
      const docRef = doc(db, 'usuarios', usuarioId, 'diario_anotacoes', anotacaoId);
      await updateDoc(docRef, {
        ...dados,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.warn('[Jornada] Falha ao atualizar anotação no Firestore:', error);
    }
  }
  notificarAtualizacaoGamificacao();
}

/**
 * Exclui uma anotação do diário de bordo.
 */
export async function excluirAnotacaoJornada(
  usuarioId: string | undefined,
  anotacaoId: string
): Promise<void> {
  // 1. Remove do cache local
  if (typeof window !== 'undefined') {
    try {
      const salvas = obterAnotacoesLocal();
      const filtradas = salvas.filter(a => a.id !== anotacaoId);
      localStorage.setItem(LOCAL_STORAGE_KEY_ANOTACOES, JSON.stringify(filtradas));
    } catch (e) {
      console.warn('Erro ao excluir anotação localmente:', e);
    }
  }

  // 2. Remove do Firestore
  if (usuarioId && anotacaoId && !anotacaoId.startsWith('nota_')) {
    try {
      const docRef = doc(db, 'usuarios', usuarioId, 'diario_anotacoes', anotacaoId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('[Jornada] Falha ao excluir anotação no Firestore:', error);
    }
  }
  notificarAtualizacaoGamificacao();
}

/**
 * Lista todas as anotações do diário de bordo.
 */
export async function listarAnotacoesJornada(usuarioId?: string): Promise<AnotacaoJornada[]> {
  const anotacoesLocais = obterAnotacoesLocal();

  if (!usuarioId) {
    return anotacoesLocais;
  }

  try {
    const colRef = collection(db, 'usuarios', usuarioId, 'diario_anotacoes');
    const q = query(colRef, orderBy('dataIso', 'desc'), limit(100));
    const snap = await getDocs(q);

    const remotas: AnotacaoJornada[] = [];
    snap.forEach(d => {
      const data = d.data();
      remotas.push({
        id: d.id,
        dataIso: data.dataIso || new Date().toISOString(),
        titulo: data.titulo || 'Anotação',
        conteudo: data.conteudo || '',
        humor: data.humor || undefined,
        tags: data.tags || [],
        criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : data.dataIso,
        atualizadoEm: data.atualizadoEm?.toDate ? data.atualizadoEm.toDate().toISOString() : data.dataIso,
      });
    });

    if (remotas.length > 0) {
      // Sincroniza cache local
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY_ANOTACOES, JSON.stringify(remotas));
      }
      return remotas;
    }
  } catch (error) {
    console.warn('[Jornada] Falha ao ler anotações do Firestore, usando locais:', error);
  }

  return anotacoesLocais;
}

/**
 * Lê anotações do cache local do navegador.
 */
function obterAnotacoesLocal(): AnotacaoJornada[] {
  if (typeof window === 'undefined') return [];
  try {
    const salvo = localStorage.getItem(LOCAL_STORAGE_KEY_ANOTACOES);
    if (!salvo) {
      // Anotação inaugural de boas-vindas
      const inaugural: AnotacaoJornada = {
        id: 'nota_inaugural',
        dataIso: new Date().toISOString(),
        titulo: 'Início da Minha Jornada',
        conteudo: 'Começando meu acompanhamento de jejum intermitente e recomposição corporal. Focado em clareza mental, energia constante e saúde a longo prazo!',
        humor: 'motivado',
        tags: ['Início', 'Foco', 'Saúde'],
        criadoEm: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_ANOTACOES, JSON.stringify([inaugural]));
      return [inaugural];
    }
    return JSON.parse(salvo);
  } catch {
    return [];
  }
}

/**
 * Lista todas as sessões de jejuns concluídas/registradas pelo usuário,
 * unificando a subcoleção 'historico_jejuns' do Firestore com o cache local
 * ('jejuar_historico_jejuns_cache') e sincronizando o total exato de horas jejuadas.
 */
export async function listarSessoesJejuns(usuarioId?: string): Promise<SessaoJejum[]> {
  const mapaSessoes = new Map<string, SessaoJejum>();

  // 1. Lê sessões salvas no cache local (caso o usuário tenha lançado/editado manualmente)
  if (typeof window !== 'undefined') {
    try {
      const cache = localStorage.getItem('jejuar_historico_jejuns_cache');
      if (cache) {
        const parsed = JSON.parse(cache);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item && !['1', '2', '3', '4', '5', '6'].includes(String(item.id))) {
              const chave = item.id || `${item.inicio}_${item.duracaoSegundos}`;
              mapaSessoes.set(chave, {
                id: item.id || chave,
                planoId: item.planoId || '16:8',
                nomePlano: item.nomePlano || '16:8',
                inicio: item.inicio || new Date().toISOString(),
                fim: item.fim || new Date().toISOString(),
                duracaoSegundos: Number(item.duracaoSegundos || 0),
                metaHoras: Number(item.metaHoras || 16),
                metaAtingida: Boolean(item.metaAtingida),
                aguaConsumidaMl: item.aguaConsumidaMl ? Number(item.aguaConsumidaMl) : undefined,
              });
            }
          });
        }
      }
    } catch {
      // Ignora erro de parse do cache local
    }
  }

  // 2. Busca sessões persistidas no Firestore na subcoleção 'historico_jejuns'
  if (usuarioId) {
    try {
      const colRef = collection(db, 'usuarios', usuarioId, 'historico_jejuns');
      const q = query(colRef, orderBy('fim', 'desc'), limit(1000));
      const snap = await getDocs(q);

      snap.forEach((d) => {
        const data = d.data();
        const sessaoRemota: SessaoJejum = {
          id: d.id,
          planoId: data.planoId || '16:8',
          nomePlano: data.nomePlano || '16:8',
          inicio: data.inicio || new Date().toISOString(),
          fim: data.fim || new Date().toISOString(),
          duracaoSegundos: Number(data.duracaoSegundos || 0),
          metaHoras: Number(data.metaHoras || 16),
          metaAtingida: Boolean(data.metaAtingida),
          aguaConsumidaMl: data.aguaConsumidaMl ? Number(data.aguaConsumidaMl) : undefined,
        };

        // Evita duplicação caso o mesmo registro exista com ID temporário local pelo mesmo horário de início
        for (const [k, v] of mapaSessoes.entries()) {
          if (k !== d.id && v.inicio === sessaoRemota.inicio && Math.abs(v.duracaoSegundos - sessaoRemota.duracaoSegundos) < 60) {
            mapaSessoes.delete(k);
          }
        }

        mapaSessoes.set(d.id, sessaoRemota);
      });
    } catch (error) {
      console.warn('[Jornada] Erro ao buscar sessões de jejuns no Firestore:', error);
    }
  }

  const sessoesConsolidadas = Array.from(mapaSessoes.values()).sort(
    (a, b) => new Date(b.fim || b.inicio).getTime() - new Date(a.fim || a.inicio).getTime()
  );

  // 3. Sincroniza o cache local e a soma exata das horas jejuadas concluídas
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('jejuar_historico_jejuns_cache', JSON.stringify(sessoesConsolidadas));
      const totalSegundos = sessoesConsolidadas.reduce((acc, s) => acc + (Number(s.duracaoSegundos) || 0), 0);
      const totalHorasExatas = Math.round(totalSegundos / 3600);
      localStorage.setItem('jejuar_total_horas_jejum', String(totalHorasExatas));
    } catch {
      // Ignora erro de escrita local
    }
  }

  return sessoesConsolidadas;
}

/**
 * Gera a Linha do Tempo Unificada consolidando:
 * 1. Sessões de jejuns
 * 2. Anotações pessoais
 * 3. Exames de bioimpedância
 * 4. Registros de pesagem
 */
export async function obterLinhaTempoConsolidada(
  usuarioId?: string,
  filtro: FiltroCategoriaJornada = 'todos',
  termoBusca = ''
): Promise<{ itens: ItemLinhaTempoJornada[]; estatisticas: EstatisticasJornada }> {
  const [anotacoes, sessoesJejum, bioimpedancias, pesagens] = await Promise.all([
    listarAnotacoesJornada(usuarioId),
    listarSessoesJejuns(usuarioId),
    listarBioimpedancias(usuarioId || ''),
    usuarioId ? buscarHistoricoPesagensFirestore(usuarioId, 50) : Promise.resolve([]),
  ]);

  const itensTimeline: ItemLinhaTempoJornada[] = [];

  // 1. Mapeia Sessões de Jejum
  if (filtro === 'todos' || filtro === 'jejuns') {
    sessoesJejum.forEach(s => {
      const horas = Math.floor(s.duracaoSegundos / 3600);
      const minutos = Math.floor((s.duracaoSegundos % 3600) / 60);
      const tempoFormatado = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}min`;

      itensTimeline.push({
        id: `jejum_${s.id || s.fim}`,
        tipo: 'jejum',
        dataIso: s.fim,
        tituloPrincipal: `Jejum ${s.nomePlano} Concluído`,
        subtitulo: `Duração: ${tempoFormatado} • Meta de ${s.metaHoras}h`,
        descricao: s.aguaConsumidaMl ? `Hidratação registrada: ${s.aguaConsumidaMl} ml` : undefined,
        badge: {
          rotulo: s.metaAtingida ? 'Meta Superada' : 'Finalizado',
          variante: s.metaAtingida ? 'sucesso' : 'aviso',
        },
        icone: 'Flame',
        metadados: {
          duracaoSegundos: s.duracaoSegundos,
          metaHoras: s.metaHoras,
          aguaMl: s.aguaConsumidaMl,
        },
        dadosOriginais: s,
      });
    });
  }

  // 2. Mapeia Anotações Pessoais
  if (filtro === 'todos' || filtro === 'anotacoes') {
    anotacoes.forEach(a => {
      const humorConfig = a.humor ? LISTA_HUMORES_JORNADA.find(h => h.id === a.humor) : undefined;
      itensTimeline.push({
        id: a.id,
        tipo: 'anotacao',
        dataIso: a.dataIso,
        tituloPrincipal: a.titulo,
        subtitulo: humorConfig ? `Sentimento: ${humorConfig.emoji} ${humorConfig.rotulo}` : undefined,
        descricao: a.conteudo,
        badge: humorConfig ? {
          rotulo: humorConfig.rotulo,
          variante: 'destaque',
        } : undefined,
        icone: 'BookOpen',
        metadados: {
          humor: a.humor,
        },
        dadosOriginais: a,
      });
    });
  }

  // 3. Mapeia Exames de Bioimpedância
  if (filtro === 'todos' || filtro === 'medicoes') {
    bioimpedancias.forEach(b => {
      const dataIsoExame = `${b.dataExame}T${b.horaExame || '08:00'}:00`;
      itensTimeline.push({
        id: `bio_${b.id}`,
        tipo: 'bioimpedancia',
        dataIso: dataIsoExame,
        tituloPrincipal: `Bioimpedância (${b.local})`,
        subtitulo: `Peso: ${b.pesoKg.toFixed(1).replace('.', ',')} kg • IMC: ${b.imc.toFixed(1).replace('.', ',')}`,
        descricao: `Gordura Corporal: ${b.gorduraCorporalPercentual.toFixed(1).replace('.', ',')}% | Músculo: ${b.musculoEsqueleticoPercentual.toFixed(1).replace('.', ',')}% | Visceral: Nível ${b.gorduraVisceralNivel}`,
        badge: {
          rotulo: 'Laudo Clínico',
          variante: 'info',
        },
        icone: 'ClipboardCheck',
        metadados: {
          peso: b.pesoKg,
          gorduraCorporal: b.gorduraCorporalPercentual,
          musculoEsqueletico: b.musculoEsqueleticoPercentual,
        },
        dadosOriginais: b,
      });
    });

    // 4. Mapeia Pesagens Avulsas
    pesagens.forEach(p => {
      itensTimeline.push({
        id: `peso_${p.id || p.dataIso}`,
        tipo: 'pesagem',
        dataIso: p.dataIso,
        tituloPrincipal: `Pesagem: ${p.peso.toFixed(1).replace('.', ',')} kg`,
        subtitulo: 'Registro na balança',
        badge: {
          rotulo: 'Peso',
          variante: 'info',
        },
        icone: 'Scale',
        metadados: {
          peso: p.peso,
        },
        dadosOriginais: p,
      });
    });
  }

  // Ordena rigorosamente do mais recente para o mais antigo
  itensTimeline.sort((a, b) => new Date(b.dataIso).getTime() - new Date(a.dataIso).getTime());

  // Aplica filtro de pesquisa resiliente (case-insensitive e sem acentos)
  let itensFiltrados = itensTimeline;
  if (termoBusca.trim().length > 0) {
    const termoNorm = normalizarTexto(termoBusca);
    itensFiltrados = itensTimeline.filter(item => {
      const matchTitulo = normalizarTexto(item.tituloPrincipal).includes(termoNorm);
      const matchSub = normalizarTexto(item.subtitulo || '').includes(termoNorm);
      const matchDesc = normalizarTexto(item.descricao || '').includes(termoNorm);
      return matchTitulo || matchSub || matchDesc;
    });
  }

  // Calcula estatísticas consolidadas
  const totalHorasSegundos = sessoesJejum.reduce((acc, curr) => acc + (curr.duracaoSegundos || 0), 0);
  const sessoesBatidas = sessoesJejum.filter(s => s.metaAtingida).length;
  const taxaSucesso = sessoesJejum.length > 0 ? Math.round((sessoesBatidas / sessoesJejum.length) * 100) : 100;

  let streak = 0;
  if (typeof window !== 'undefined') {
    const salvoStreak = localStorage.getItem('jejuar_dias_consecutivos');
    if (salvoStreak) streak = Number(salvoStreak);
  }

  const estatisticas: EstatisticasJornada = {
    diasConsecutivos: streak,
    totalHorasJejum: Math.round(totalHorasSegundos / 3600),
    totalSessoesConcluidas: sessoesJejum.length,
    taxaSucessoPercentual: taxaSucesso,
    totalAnotacoes: anotacoes.length,
  };

  return {
    itens: itensFiltrados,
    estatisticas,
  };
}
