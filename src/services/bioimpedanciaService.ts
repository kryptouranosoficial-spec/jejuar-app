/**
 * @file services/bioimpedanciaService.ts
 * @description Camada de persistência híbrida e resiliente para registros de Bioimpedância.
 * Sincroniza em tempo real com a coleção Firestore 'usuarios/{usuarioId}/bioimpedancias'
 * com espelhamento contínuo em localStorage para suporte completo e offline.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  RegistroBioimpedancia,
  ConfiguracaoRetesteBioimpedancia,
} from '../types/bioimpedancia';
import { notificarAtualizacaoGamificacao } from '../utils/perfilUtils';

const CHAVE_STORAGE_PREFIX = 'jejuar_bioimpedancias_';
const CHAVE_CONFIG_PREFIX = 'jejuar_bio_config_';

/**
 * Carrega o cache local resiliente de exames do usuário.
 */
function obterExamesLocalStorage(usuarioId: string): RegistroBioimpedancia[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CHAVE_STORAGE_PREFIX}${usuarioId || 'padrao'}`);
    if (!raw) return [];
    const lista = JSON.parse(raw);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

/**
 * Salva a lista de exames no cache local resiliente.
 */
function salvarExamesLocalStorage(usuarioId: string, lista: RegistroBioimpedancia[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${CHAVE_STORAGE_PREFIX}${usuarioId || 'padrao'}`,
      JSON.stringify(lista)
    );
  } catch (err) {
    console.warn('Aviso ao sincronizar cache local de bioimpedâncias:', err);
  }
}

/**
 * Lista todos os exames de bioimpedância de um usuário ordenados da data mais recente para a mais antiga.
 */
export async function listarBioimpedancias(usuarioId: string): Promise<RegistroBioimpedancia[]> {
  const cacheLocal = obterExamesLocalStorage(usuarioId);

  if (!usuarioId) {
    // Retorna ordenado por data descendente
    return cacheLocal.sort((a, b) => (b.dataExame > a.dataExame ? 1 : -1));
  }

  try {
    const colRef = collection(db, 'usuarios', usuarioId, 'bioimpedancias');
    const q = query(colRef, orderBy('dataExame', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doFirestore: RegistroBioimpedancia[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          usuarioId: data.usuarioId || usuarioId,
          dataExame: data.dataExame || new Date().toISOString().slice(0, 10),
          horaExame: data.horaExame || '',
          local: data.local || 'Não informado',
          pesoKg: Number(data.pesoKg) || 0,
          alturaMetros: Number(data.alturaMetros) || 1.7,
          imc: Number(data.imc) || 0,
          gorduraCorporalPercentual: Number(data.gorduraCorporalPercentual) || 0,
          musculoEsqueleticoPercentual: Number(data.musculoEsqueleticoPercentual) || 0,
          gorduraVisceralNivel: Number(data.gorduraVisceralNivel) || 0,
          taxaMetabolicaBasalKcal: Number(data.taxaMetabolicaBasalKcal) || 0,
          idadeCorporalAnos: data.idadeCorporalAnos ? Number(data.idadeCorporalAnos) : undefined,
          observacoes: data.observacoes || '',
          criadoEm: data.criadoEm || new Date().toISOString(),
          atualizadoEm: data.atualizadoEm || undefined,
        };
      });

      // Atualiza cache local com os dados mais recentes do Firestore
      salvarExamesLocalStorage(usuarioId, doFirestore);
      return doFirestore;
    }
  } catch (erro) {
    console.warn('Aviso: Consulta remota de bioimpedância indisponível, utilizando cache seguro:', erro);
  }

  return cacheLocal.sort((a, b) => (b.dataExame > a.dataExame ? 1 : -1));
}

/**
 * Cadastra um novo exame de bioimpedância no Firestore e no cache local.
 */
export async function salvarNovoExameBioimpedancia(
  usuarioId: string,
  dados: Omit<RegistroBioimpedancia, 'id' | 'criadoEm'>
): Promise<RegistroBioimpedancia> {
  const agoraIso = new Date().toISOString();
  const idGerado = `bio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const novoRegistro: RegistroBioimpedancia = {
    ...dados,
    id: idGerado,
    criadoEm: agoraIso,
  };

  // 1. Salva imediatamente no cache local garantindo resposta instantânea na UI
  const examesAtuais = obterExamesLocalStorage(usuarioId);
  const atualizados = [novoRegistro, ...examesAtuais].sort((a, b) => (b.dataExame > a.dataExame ? 1 : -1));
  salvarExamesLocalStorage(usuarioId, atualizados);

  // 2. Persiste no Firestore se houver ID de usuário
  if (usuarioId) {
    try {
      const colRef = collection(db, 'usuarios', usuarioId, 'bioimpedancias');
      const docRef = await addDoc(colRef, {
        ...dados,
        criadoEm: serverTimestamp(),
      });

      // Atualiza o ID definitivo com a referência gerada pelo Firestore
      novoRegistro.id = docRef.id;
      const sincronizados = atualizados.map((item) =>
        item.id === idGerado ? novoRegistro : item
      );
      salvarExamesLocalStorage(usuarioId, sincronizados);
    } catch (erro) {
      console.warn('Registro salvo localmente com sucesso. Sincronização em nuvem pendente:', erro);
    }
  }

  notificarAtualizacaoGamificacao();
  return novoRegistro;
}

/**
 * Atualiza um exame de bioimpedância existente no Firestore e cache local.
 */
export async function atualizarExameBioimpedancia(
  usuarioId: string,
  id: string,
  dados: Partial<RegistroBioimpedancia>
): Promise<void> {
  const agoraIso = new Date().toISOString();

  // 1. Atualiza no cache local
  const examesAtuais = obterExamesLocalStorage(usuarioId);
  const atualizados = examesAtuais.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        ...dados,
        atualizadoEm: agoraIso,
      };
    }
    return item;
  }).sort((a, b) => (b.dataExame > a.dataExame ? 1 : -1));
  salvarExamesLocalStorage(usuarioId, atualizados);

  // 2. Persiste alteração no Firestore
  if (usuarioId && !id.startsWith('bio_')) {
    try {
      const docRef = doc(db, 'usuarios', usuarioId, 'bioimpedancias', id);
      await updateDoc(docRef, {
        ...dados,
        atualizadoEm: serverTimestamp(),
      });
    } catch (erro) {
      console.warn('Edição salva localmente. Sincronização em nuvem pendente:', erro);
    }
  }
  notificarAtualizacaoGamificacao();
}

/**
 * Exclui um exame de bioimpedância no Firestore e cache local.
 */
export async function excluirExameBioimpedancia(
  usuarioId: string,
  id: string
): Promise<void> {
  // 1. Remove do cache local
  const examesAtuais = obterExamesLocalStorage(usuarioId);
  const atualizados = examesAtuais.filter((item) => item.id !== id);
  salvarExamesLocalStorage(usuarioId, atualizados);

  // 2. Exclui do Firestore se for ID do banco
  if (usuarioId && !id.startsWith('bio_')) {
    try {
      const docRef = doc(db, 'usuarios', usuarioId, 'bioimpedancias', id);
      await deleteDoc(docRef);
    } catch (erro) {
      console.warn('Exclusão executada localmente. Sincronização remota pendente:', erro);
    }
  }
  notificarAtualizacaoGamificacao();
}

/**
 * Normaliza a frequência de dias para uma das opções válidas (7, 15 ou 30 dias).
 */
function normalizarFrequenciaDias(dias?: number): number {
  if (dias === 7 || dias === 15 || dias === 30) return dias;
  if (dias && dias <= 10) return 7;
  if (dias && dias <= 22) return 15;
  return 30;
}

/**
 * Obtém a configuração de reteste de bioimpedância do usuário.
 */
export async function obterConfiguracaoReteste(
  usuarioId: string
): Promise<ConfiguracaoRetesteBioimpedancia> {
  const padrao: ConfiguracaoRetesteBioimpedancia = {
    frequenciaDias: 15,
    lembretesAtivos: true,
    horaLembrete: '08:00',
    somLembrete: 'Padrão',
  };

  if (typeof window !== 'undefined') {
    const cache = localStorage.getItem(`${CHAVE_CONFIG_PREFIX}${usuarioId || 'padrao'}`);
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        return {
          ...padrao,
          ...parsed,
          frequenciaDias: normalizarFrequenciaDias(Number(parsed.frequenciaDias)),
        };
      } catch {}
    }

    const salvoJejum = localStorage.getItem('jejuar_config_jejum');
    if (salvoJejum) {
      try {
        const objJejum = JSON.parse(salvoJejum);
        const n = objJejum?.notificacoes;
        if (n && n.bioimpedanciaIntervaloDias !== undefined) {
          return {
            frequenciaDias: normalizarFrequenciaDias(Number(n.bioimpedanciaIntervaloDias)),
            lembretesAtivos: n.bioimpedanciaLembreteAtivo ?? true,
            horaLembrete: n.bioimpedanciaHora || '08:00',
            somLembrete: n.bioimpedanciaSom || 'Padrão',
          };
        }
      } catch {}
    }
  }

  if (usuarioId) {
    try {
      const docRef = doc(db, 'usuarios', usuarioId, 'configuracoes', 'bioimpedancia');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const dados = snap.data() as ConfiguracaoRetesteBioimpedancia;
        return {
          ...padrao,
          ...dados,
          frequenciaDias: normalizarFrequenciaDias(Number(dados.frequenciaDias)),
        };
      }
    } catch {}
  }

  return padrao;
}

/**
 * Salva a preferência de frequência de reteste da bioimpedância e sincroniza com as notificações gerais.
 */
export async function salvarConfiguracaoReteste(
  usuarioId: string,
  config: ConfiguracaoRetesteBioimpedancia
): Promise<void> {
  const freqNormalizada = normalizarFrequenciaDias(config.frequenciaDias);
  const hora = config.horaLembrete || '08:00';
  const som = config.somLembrete || 'Padrão';
  const configFinal: ConfiguracaoRetesteBioimpedancia = {
    ...config,
    frequenciaDias: freqNormalizada,
    horaLembrete: hora,
    somLembrete: som,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        `${CHAVE_CONFIG_PREFIX}${usuarioId || 'padrao'}`,
        JSON.stringify(configFinal)
      );

      const salvoJejum = localStorage.getItem('jejuar_config_jejum');
      if (salvoJejum) {
        const objJejum = JSON.parse(salvoJejum);
        if (!objJejum.notificacoes) objJejum.notificacoes = {};
        objJejum.notificacoes.bioimpedanciaLembreteAtivo = configFinal.lembretesAtivos;
        objJejum.notificacoes.bioimpedanciaIntervaloDias = freqNormalizada;
        objJejum.notificacoes.bioimpedanciaHora = hora;
        objJejum.notificacoes.bioimpedanciaSom = som;
        localStorage.setItem('jejuar_config_jejum', JSON.stringify(objJejum));
      }
    } catch {}
  }

  if (usuarioId) {
    try {
      const docRef = doc(db, 'usuarios', usuarioId, 'configuracoes', 'bioimpedancia');
      await setDoc(docRef, {
        ...configFinal,
        atualizadoEm: serverTimestamp(),
      }, { merge: true });

      const usuarioRef = doc(db, 'usuarios', usuarioId);
      await setDoc(usuarioRef, {
        configuracoesJejum: {
          notificacoes: {
            bioimpedanciaLembreteAtivo: configFinal.lembretesAtivos,
            bioimpedanciaIntervaloDias: freqNormalizada,
            bioimpedanciaHora: hora,
            bioimpedanciaSom: som,
          }
        },
        atualizadoEm: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Configuração de ciclo salva localmente:', err);
    }
  }
}
