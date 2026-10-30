/**
 * @file perfilService.ts
 * @description Serviços de persistência e segurança para o Perfil do Usuário no Firestore e LocalStorage:
 * - Leitura e gravação de dados cadastrais (CPF, telefone, data de nascimento, renda em R$, avatar).
 * - Alteração de senha com validação de segurança.
 * - Exportação de backup em JSON em conformidade com a LGPD.
 * - Exclusão definitiva de conta com descarte de dados e reset de sessão.
 */

import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { DadosPerfilUsuario, UsuarioEmCadastro } from '../types';

/** Chave de armazenamento local de cache do perfil */
const CHAVE_CACHE_PERFIL = 'jejuar_perfil_dados';

/**
 * Busca os dados cadastrais completos do perfil do usuário no Firestore ou no LocalStorage.
 * @param usuarioId ID do usuário autenticado.
 */
export async function buscarDadosPerfil(usuarioId: string): Promise<DadosPerfilUsuario | null> {
  // 1. Tenta recuperar do cache local imediato
  let dadosLocais: Partial<DadosPerfilUsuario> = {};
  if (typeof window !== 'undefined') {
    try {
      const cache = localStorage.getItem(`${CHAVE_CACHE_PERFIL}_${usuarioId}`);
      if (cache) {
        dadosLocais = JSON.parse(cache);
      }
    } catch {
      // Ignora erro de parse local
    }
  }

  if (!usuarioId) {
    if (Object.keys(dadosLocais).length > 0) {
      return dadosLocais as DadosPerfilUsuario;
    }
    return null;
  }

  // 2. Consulta o documento principal no Firestore
  try {
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    const snap = await getDoc(usuarioRef);

    if (snap.exists()) {
      const data = snap.data();
      const infoBasicas = data.informacoesBasicas || {};
      const perfilDoc = data.perfil || {};

      const perfilConsolidado: DadosPerfilUsuario = {
        nome: data.nome || dadosLocais.nome || 'Usuário Jejuar',
        email: data.email || dadosLocais.email || '',
        cpfCnpj: perfilDoc.cpfCnpj || dadosLocais.cpfCnpj || '',
        telefone: perfilDoc.telefone || dadosLocais.telefone || '',
        dataNascimento: perfilDoc.dataNascimento || dadosLocais.dataNascimento || '',
        rendaMensalCentavos: typeof perfilDoc.rendaMensalCentavos === 'number' 
          ? perfilDoc.rendaMensalCentavos 
          : (dadosLocais.rendaMensalCentavos ?? 0),
        fotoUrl: perfilDoc.fotoUrl || dadosLocais.fotoUrl || null,
        avatarPredefinidoId: perfilDoc.avatarPredefinidoId || dadosLocais.avatarPredefinidoId || 'avatar_longevidade',
        plano: data.nivel === 'vitalicio' ? 'vitalicio' : (data.nivel === 'pro' ? 'pro' : 'pro'),
        genero: infoBasicas.genero || dadosLocais.genero || 'feminino',
        altura: infoBasicas.altura || dadosLocais.altura || 165,
        peso: infoBasicas.peso || dadosLocais.peso || 68,
      };

      // Atualiza o cache local
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${CHAVE_CACHE_PERFIL}_${usuarioId}`, JSON.stringify(perfilConsolidado));
      }

      return perfilConsolidado;
    }
  } catch (error) {
    console.warn('[PerfilService] Falha ao consultar perfil no Firestore, utilizando cache:', error);
  }

  return (Object.keys(dadosLocais).length > 0 ? (dadosLocais as DadosPerfilUsuario) : null);
}

/**
 * Salva as alterações cadastrais do perfil tanto no Firestore quanto no LocalStorage.
 * @param usuarioId ID do usuário.
 * @param novosDados Dados cadastrais atualizados pelo usuário.
 */
export async function salvarDadosPerfil(
  usuarioId: string,
  novosDados: Partial<DadosPerfilUsuario>
): Promise<void> {
  // 1. Atualiza o LocalStorage imediatamente para resposta instantânea
  if (typeof window !== 'undefined') {
    try {
      const chave = `${CHAVE_CACHE_PERFIL}_${usuarioId}`;
      const cacheAtual = localStorage.getItem(chave);
      const objetoAtual = cacheAtual ? JSON.parse(cacheAtual) : {};
      const atualizado = { ...objetoAtual, ...novosDados };
      localStorage.setItem(chave, JSON.stringify(atualizado));
      if (novosDados.nome) {
        localStorage.setItem('jejuar_usuario_nome', novosDados.nome);
      }
    } catch {
      // Ignora restrições locais
    }
  }

  if (!usuarioId) return;

  // 2. Persiste no Firestore
  try {
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    
    // Objeto limpo sem undefined para o Firestore
    const payloadPerfil: Record<string, unknown> = {
      atualizadoEm: serverTimestamp(),
    };

    if (novosDados.cpfCnpj !== undefined) payloadPerfil.cpfCnpj = novosDados.cpfCnpj;
    if (novosDados.telefone !== undefined) payloadPerfil.telefone = novosDados.telefone;
    if (novosDados.dataNascimento !== undefined) payloadPerfil.dataNascimento = novosDados.dataNascimento;
    if (novosDados.rendaMensalCentavos !== undefined) payloadPerfil.rendaMensalCentavos = novosDados.rendaMensalCentavos;
    if (novosDados.fotoUrl !== undefined) payloadPerfil.fotoUrl = novosDados.fotoUrl;
    if (novosDados.avatarPredefinidoId !== undefined) payloadPerfil.avatarPredefinidoId = novosDados.avatarPredefinidoId;

    const payloadPrincipal: Record<string, unknown> = {
      perfil: payloadPerfil,
      atualizadoEm: serverTimestamp(),
    };

    if (novosDados.nome) {
      payloadPrincipal.nome = novosDados.nome.trim();
    }

    await setDoc(usuarioRef, payloadPrincipal, { merge: true });
  } catch (error) {
    console.error('[PerfilService] Erro ao persistir perfil no Firestore:', error);
    throw new Error('Não conseguimos salvar suas alterações. Verifique sua conexão e tente novamente.');
  }
}

/**
 * Altera a senha do usuário verificando a senha atual informada.
 * @param usuarioId ID do usuário
 * @param senhaAtual Senha atualmente cadastrada
 * @param novaSenha Nova senha escolhida
 */
export async function alterarSenhaPerfil(
  usuarioId: string,
  senhaAtual: string,
  novaSenha: string
): Promise<void> {
  if (!usuarioId) {
    throw new Error('Sessão expirada. Por favor, entre novamente na sua conta.');
  }

  if (!novaSenha || novaSenha.length < 6) {
    throw new Error('A nova senha deve possuir pelo menos 6 caracteres para sua segurança.');
  }

  try {
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    const snap = await getDoc(usuarioRef);

    if (!snap.exists()) {
      throw new Error('Conta não localizada no sistema. Tente novamente mais tarde.');
    }

    const dados = snap.data();
    // Valida senha atual
    if (dados.senha && dados.senha !== senhaAtual) {
      throw new Error('A senha atual informada está incorreta. Verifique e tente novamente.');
    }

    // Grava a nova senha
    await updateDoc(usuarioRef, {
      senha: novaSenha,
      atualizadoEm: serverTimestamp(),
    });
  } catch (error: any) {
    if (error.message) throw error;
    throw new Error('Não conseguimos alterar sua senha no momento. Verifique sua conexão e tente novamente.');
  }
}

/**
 * Exporta um arquivo JSON com todos os dados pessoais do usuário em conformidade com a LGPD.
 * @param usuario Dados completos carregados
 * @param perfil Dados cadastrais do perfil
 */
export function exportarBackupDadosLGPD(
  usuario?: UsuarioEmCadastro,
  perfil?: DadosPerfilUsuario | null
): void {
  const dadosExportacao = {
    formato: 'LGPD_BACKUP_DADOS_JEJUAR',
    versao: '1.0',
    dataExportacao: new Date().toISOString(),
    usuario: {
      id: usuario?.id || 'anonimo',
      nome: perfil?.nome || usuario?.nome || '',
      email: usuario?.email || perfil?.email || '',
      cpfCnpj: perfil?.cpfCnpj || '',
      telefone: perfil?.telefone || '',
      dataNascimento: perfil?.dataNascimento || '',
      rendaMensalCentavos: perfil?.rendaMensalCentavos || 0,
      plano: perfil?.plano || 'vitalicio',
    },
    biometria: {
      altura: perfil?.altura || usuario?.informacoesBasicas?.altura || null,
      pesoAtual: perfil?.peso || usuario?.informacoesBasicas?.peso || null,
      pesoDesejado: usuario?.informacoesBasicas?.pesoDesejado || null,
      objetivoPrincipal: usuario?.informacoesBasicas?.objetivoPrincipal || null,
      genero: perfil?.genero || usuario?.informacoesBasicas?.genero || null,
    },
    progressoJejum: {
      diasConsecutivos: usuario?.estadoJejum?.diasConsecutivos || 1,
      planoAtivo: usuario?.estadoJejum?.nomePlano || '16:8',
      ultimoDiaConcluido: usuario?.estadoJejum?.ultimoDiaConcluido || null,
    },
    avisoLegal: 'Arquivo exportado a pedido do titular conforme previsto no Artigo 18 da Lei Geral de Proteção de Dados (Lei 13.709/2018).',
  };

  const conteudoJson = JSON.stringify(dadosExportacao, null, 2);
  const blob = new Blob([conteudoJson], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dataHoje = new Date().toISOString().slice(0, 10);
  link.download = `backup_dados_jejuar_${dataHoje}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exclui permanentemente a conta do usuário no Firestore, limpa os dados locais e reinicia o app.
 * @param usuarioId ID do usuário.
 */
export async function excluirContaUsuarioLGPD(usuarioId: string): Promise<void> {
  if (usuarioId) {
    try {
      const usuarioRef = doc(db, 'usuarios', usuarioId);
      await deleteDoc(usuarioRef);
    } catch (error) {
      console.warn('[PerfilService] Falha ao deletar documento remoto, limpando dados locais:', error);
    }
  }

  // Limpeza total de credenciais e caches no dispositivo
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    // Recarrega a aplicação para retornar à Splash/Welcome limpa
    window.location.reload();
  }
}
