/**
 * @file notificacoesInternasService.ts
 * @description Camada de persistência híbrida e resiliente para a Central de Notificações Internas.
 * Integra LocalStorage com espelhamento no Firebase Firestore, garantindo disponibilidade offline
 * imediata e sincronização remota das mensagens de administradores e conquistas.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { NotificacaoInterna } from '../types/notificacoesInternas';

const STORAGE_PREFIX = 'jejuar_notificacoes_';

/**
 * Mensagens inaugurais semeadas automaticamente para que o usuário
 * tenha uma recepção calorosa e conheça a central no primeiro acesso.
 */
export function gerarNotificacoesInaugurais(): NotificacaoInterna[] {
  const agora = new Date();
  const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
  const doisDiasAtras = new Date(agora.getTime() - 48 * 60 * 60 * 1000);

  return [
    {
      id: 'notif_boas_vindas',
      titulo: 'Boas-vindas ao Jejuar! ✨',
      mensagem: 'Estamos muito felizes em ter você aqui. Personalize seu protocolo de jejum e sua meta de água para conquistar sua melhor versão.',
      categoria: 'aviso',
      dataIso: agora.toISOString(),
      lida: false,
      acaoLink: 'plano',
      acaoTexto: 'Conferir Protocolo',
      remetente: 'Equipe Jejuar',
      icone: 'sparkles',
    },
    {
      id: 'notif_primeira_conquista',
      titulo: 'Primeiro Marco Desbloqueado! 🏆',
      mensagem: 'Você deu o passo mais importante: iniciou sua jornada de sincronização metabólica e autocuidado.',
      categoria: 'conquista',
      dataIso: ontem.toISOString(),
      lida: false,
      acaoLink: 'jejum',
      acaoTexto: 'Ver Meu Jejum',
      remetente: 'Sistema',
      icone: 'trophy',
    },
    {
      id: 'notif_dica_hidratacao',
      titulo: 'Dica de Ouro: Água no Jejum 💧',
      mensagem: 'Beber água regularmente durante a janela de jejum acelera a queima de gordura e reduz a fome pela manhã.',
      categoria: 'aviso',
      dataIso: doisDiasAtras.toISOString(),
      lida: true,
      acaoLink: 'agua',
      acaoTexto: 'Registrar Copo',
      remetente: 'Dr. Nutrição',
      icone: 'droplet',
    },
  ];
}

/**
 * Lê as notificações gravadas em cache no localStorage.
 */
export function obterCacheLocal(usuarioId: string): NotificacaoInterna[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${usuarioId || 'padrao'}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Salva as notificações no cache local.
 */
function salvarCacheLocal(usuarioId: string, lista: NotificacaoInterna[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${usuarioId || 'padrao'}`, JSON.stringify(lista));
  } catch (err) {
    console.warn('[Notificações] Aviso ao atualizar cache local:', err);
  }
}

/**
 * Lista todas as notificações internas ordenadas cronologicamente (mais recentes primeiro).
 * Semeadas na primeira consulta se a lista estiver vazia.
 */
export async function listarNotificacoesInternas(usuarioId: string): Promise<NotificacaoInterna[]> {
  const cacheLocal = obterCacheLocal(usuarioId);

  // Se o usuário não estiver logado, usa apenas o cache ou inaugurais
  if (!usuarioId) {
    if (cacheLocal.length === 0) {
      const inaugurais = gerarNotificacoesInaugurais();
      salvarCacheLocal(usuarioId, inaugurais);
      return inaugurais;
    }
    return cacheLocal;
  }

  try {
    const notifsRef = collection(db, 'usuarios', usuarioId, 'notificacoes_internas');
    const q = query(notifsRef, orderBy('dataIso', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doFirestore: NotificacaoInterna[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          titulo: data.titulo || '',
          mensagem: data.mensagem || '',
          categoria: data.categoria || 'aviso',
          dataIso: data.dataIso || new Date().toISOString(),
          lida: Boolean(data.lida),
          acaoLink: data.acaoLink,
          acaoTexto: data.acaoTexto,
          remetente: data.remetente || 'Equipe Jejuar',
          icone: data.icone || 'bell',
        };
      });

      salvarCacheLocal(usuarioId, doFirestore);
      return doFirestore;
    } else {
      // Se for a primeira vez no Firestore, grava as inaugurais para o usuário
      const inaugurais = cacheLocal.length > 0 ? cacheLocal : gerarNotificacoesInaugurais();
      salvarCacheLocal(usuarioId, inaugurais);

      // Persiste no Firestore em segundo plano
      for (const item of inaugurais) {
        const itemRef = doc(db, 'usuarios', usuarioId, 'notificacoes_internas', item.id);
        setDoc(itemRef, {
          ...item,
          criadoEm: serverTimestamp(),
        }).catch(() => {});
      }

      return inaugurais;
    }
  } catch (err) {
    console.warn('[Notificações] Falha ao sincronizar com Firestore, utilizando cache:', err);
    if (cacheLocal.length === 0) {
      const inaugurais = gerarNotificacoesInaugurais();
      salvarCacheLocal(usuarioId, inaugurais);
      return inaugurais;
    }
    return cacheLocal;
  }
}

/**
 * Marca uma única notificação como lida.
 */
export async function marcarNotificacaoComoLida(
  usuarioId: string,
  notificacaoId: string
): Promise<void> {
  const atuais = obterCacheLocal(usuarioId);
  const atualizadas = atuais.map((item) =>
    item.id === notificacaoId ? { ...item, lida: true } : item
  );
  salvarCacheLocal(usuarioId, atualizadas);

  if (usuarioId) {
    try {
      const docRef = doc(db, 'usuarios', usuarioId, 'notificacoes_internas', notificacaoId);
      await updateDoc(docRef, {
        lida: true,
        atualizadoEm: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[Notificações] Aviso ao marcar como lida no Firestore:', err);
    }
  }
}

/**
 * Marca todas as notificações do usuário como lidas simultaneamente.
 */
export async function marcarTodasNotificacoesComoLidas(usuarioId: string): Promise<void> {
  const atuais = obterCacheLocal(usuarioId);
  const atualizadas = atuais.map((item) => ({ ...item, lida: true }));
  salvarCacheLocal(usuarioId, atualizadas);

  if (usuarioId) {
    try {
      for (const item of atuais) {
        if (!item.lida) {
          const docRef = doc(db, 'usuarios', usuarioId, 'notificacoes_internas', item.id);
          updateDoc(docRef, {
            lida: true,
            atualizadoEm: serverTimestamp(),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[Notificações] Aviso ao marcar todas como lidas:', err);
    }
  }
}

/**
 * Exclui uma notificação específica da lista.
 */
export async function excluirNotificacaoInterna(
  usuarioId: string,
  notificacaoId: string
): Promise<void> {
  const atuais = obterCacheLocal(usuarioId);
  const filtradas = atuais.filter((item) => item.id !== notificacaoId);
  salvarCacheLocal(usuarioId, filtradas);

  if (usuarioId) {
    try {
      const docRef = doc(db, 'usuarios', usuarioId, 'notificacoes_internas', notificacaoId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Notificações] Aviso ao excluir do Firestore:', err);
    }
  }
}

/**
 * Calcula a quantidade de notificações não lidas para exibição no badge do sino.
 */
export function contarNaoLidas(lista: NotificacaoInterna[]): number {
  return lista.filter((item) => !item.lida).length;
}
