/**
 * @file firebase.ts
 * @description Inicialização e configuração dos serviços do Firebase para o aplicativo Jejuar.
 * Configurado com as credenciais do projeto jejuar-7da3b.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  type User,
  type Auth
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  type Firestore
} from "firebase/firestore";
import type { 
  UsuarioEmCadastro, 
  ConfiguracaoMonitorAgua, 
  RegistroConsumoAgua,
  EstadoJejumUsuario,
  SessaoJejum,
  ProtocoloJejumData,
  ConfiguracoesJejum
} from "../types";
import { notificarAtualizacaoGamificacao } from "../utils/perfilUtils";

// Suprime avisos de reconexão de canais do Firestore em redes móveis/proxies
setLogLevel('error');

// Configurações fornecidas do aplicativo Web no Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA1fIME-D9Bg7mZBBnicRZvNNTWUSyMT-w",
  authDomain: "jejuar-7da3b.firebaseapp.com",
  projectId: "jejuar-7da3b",
  storageBucket: "jejuar-7da3b.firebasestorage.app",
  messagingSenderId: "65689530196",
  appId: "1:65689530196:web:3aeeaf90d2e494f807a2c1"
};

// Garante inicialização única do Firebase evitando duplicações
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Instância do serviço de Autenticação
export const auth: Auth = getAuth(firebaseApp);

// Instância do serviço de Banco de Dados Firestore com auto-detecção de Long Polling para máxima resiliência
export const db: Firestore = (() => {
  try {
    return initializeFirestore(firebaseApp, {
      experimentalAutoDetectLongPolling: true
    });
  } catch {
    return getFirestore(firebaseApp);
  }
})();

/**
 * Interface dos dados de cadastro inicial do usuário.
 */
export interface DadosCadastroUsuario {
  nome: string;
  email: string;
  senha: string;
  nivel?: string;
}

/**
 * Salva um novo usuário diretamente na coleção "usuarios" do Firestore (sem Firebase Auth).
 * @param dados Dados contendo nome, e-mail, senha e nível.
 * @returns ID do documento recém-criado no Firestore.
 */
export async function salvarUsuarioFirestore(dados: DadosCadastroUsuario): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "usuarios"), {
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      senha: dados.senha,
      nivel: dados.nivel || "usuario",
      criadoEm: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao salvar usuário no Firestore:", error);
    throw new Error("Não conseguimos salvar seu cadastro no momento. Verifique sua conexão e tente novamente.");
  }
}

/**
 * Autentica o usuário validando suas credenciais diretamente na coleção "usuarios" do Firestore.
 * @param email E-mail informado pelo usuário.
 * @param senha Senha informada pelo usuário.
 * @returns Dados completos do usuário autenticado incluindo seu ID.
 */
export async function autenticarUsuarioFirestore(
  email: string, 
  senha: string
): Promise<UsuarioEmCadastro> {
  try {
    const emailNormalizado = email.trim().toLowerCase();
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("email", "==", emailNormalizado));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("E-mail não cadastrado. Verifique o endereço digitado ou crie uma nova conta.");
    }

    // Procura documento com a senha coincidente
    let usuarioEncontrado: any = null;
    let docIdEncontrado = '';

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.senha === senha) {
        usuarioEncontrado = data;
        docIdEncontrado = docSnap.id;
      }
    });

    if (!usuarioEncontrado) {
      throw new Error("Senha incorreta. Por favor, confira sua senha e tente novamente.");
    }

    return {
      id: docIdEncontrado,
      nome: usuarioEncontrado.nome || '',
      email: usuarioEncontrado.email || emailNormalizado,
      nivel: usuarioEncontrado.nivel || 'usuario',
      informacoesBasicas: usuarioEncontrado.informacoesBasicas || undefined,
      estadoJejum: usuarioEncontrado.estadoJejum || undefined,
      consumoAguaAtual: usuarioEncontrado.consumoAguaAtual || undefined,
      configuracaoAgua: usuarioEncontrado.configuracaoAgua || undefined,
    };
  } catch (error: any) {
    console.error("Erro ao autenticar usuário no Firestore:", error);
    if (error.message && (error.message.includes("E-mail não cadastrado") || error.message.includes("Senha incorreta"))) {
      throw error;
    }
    throw new Error("Não conseguimos validar seu acesso no momento. Verifique sua conexão à internet e tente novamente.");
  }
}

/**
 * Recupera os dados atualizados de um usuário existente pelo seu ID no Firestore.
 * @param usuarioId ID do documento do usuário.
 * @returns Objeto com os dados do usuário ou null se não encontrado.
 */
export async function buscarDadosUsuarioFirestore(usuarioId: string): Promise<any | null> {
  if (!usuarioId) return null;
  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    const snap = await getDoc(usuarioRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data()
    };
  } catch (error) {
    console.warn("Aviso ao buscar dados do usuário no Firestore:", error);
    return null;
  }
}

/**
 * Salva ou atualiza um campo específico dentro do subgrupo (Map) 'informacoesBasicas' no Firestore.
 * Utiliza notação de ponto ('informacoesBasicas.campo') via updateDoc, garantindo que
 * TODOS os outros campos anteriores do mapa sejam 100% preservados sem qualquer risco de sobrescrita.
 * @param usuarioId ID do documento na coleção "usuarios".
 * @param campo Nome da propriedade filha (ex: 'objetivoPrincipal', 'experienciaJejum', 'altura', 'peso').
 * @param valor Valor a ser persistido.
 */
export async function salvarInformacaoBasicaFirestore(
  usuarioId: string,
  campo: string,
  valor: unknown
): Promise<void> {
  if (!usuarioId) {
    console.warn(`[Firebase] usuarioId não fornecido ao tentar salvar ${campo}. Operação ignorada.`);
    return;
  }

  const usuarioRef = doc(db, "usuarios", usuarioId);

  try {
    // Notação de ponto: atualiza estritamente a chave filha dentro do mapa informacoesBasicas
    await updateDoc(usuarioRef, {
      [`informacoesBasicas.${campo}`]: valor,
      "informacoesBasicas.atualizadoEm": serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.warn(`[Firebase] updateDoc com notação de ponto falhou para ${campo}, aplicando fallback com setDoc merge:`, error);
    try {
      await setDoc(
        usuarioRef,
        {
          informacoesBasicas: {
            [campo]: valor,
            atualizadoEm: serverTimestamp()
          },
          atualizadoEm: serverTimestamp()
        },
        { merge: true }
      );
    } catch (fallbackError) {
      console.error(`Erro ao salvar ${campo} nas informações básicas:`, fallbackError);
      throw new Error("Não conseguimos salvar sua resposta. Verifique sua conexão e tente novamente.");
    }
  }
}

/**
 * Consolidação Final Garantida: Grava o conjunto completo acumulado do subgrupo 'informacoesBasicas'
 * no documento do usuário de uma só vez, assegurando 100% de integridade antes da Tela de Início.
 * @param usuarioId ID do documento na coleção "usuarios".
 * @param informacoes Objeto completo com todas as preferências coletadas no onboarding (1 a 8).
 */
export async function consolidarTodasInformacoesBasicasFirestore(
  usuarioId: string,
  informacoes: Record<string, unknown>
): Promise<void> {
  if (!usuarioId) {
    console.warn("[Firebase] usuarioId não fornecido para consolidação final.");
    return;
  }

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await setDoc(
      usuarioRef,
      {
        informacoesBasicas: {
          ...informacoes,
          atualizadoEm: serverTimestamp()
        },
        atualizadoEm: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Erro na consolidação final das informações básicas no Firestore:", error);
    throw new Error("Não conseguimos salvar seu perfil completo. Verifique sua conexão e tente novamente.");
  }
}

/**
 * Atualiza campos adicionais do usuário (ex: onboarding com informações básicas).
 * @param usuarioId ID do documento na coleção "usuarios".
 * @param campos Objeto contendo os dados a serem atualizados.
 */
export async function atualizarUsuarioFirestore(
  usuarioId: string, 
  campos: Record<string, unknown>
): Promise<void> {
  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await updateDoc(usuarioRef, {
      ...campos,
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao atualizar informações no Firestore:", error);
    throw new Error("Não conseguimos atualizar suas informações. Verifique sua conexão e tente novamente.");
  }
}

/**
 * Exclui permanentemente o usuário da coleção "usuarios".
 * @param usuarioId ID do documento a ser excluído.
 */
export async function excluirUsuarioFirestore(usuarioId: string): Promise<void> {
  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await deleteDoc(usuarioRef);
  } catch (error) {
    console.error("Erro ao excluir usuário no Firestore:", error);
    throw new Error("Não conseguimos remover o cadastro. Verifique sua conexão e tente novamente.");
  }
}

/**
 * Realiza o login anônimo do usuário no Firebase (mantido para compatibilidade).
 * @returns Promise com o usuário autenticado ou lança um erro humanizado.
 */
export async function iniciarSessaoAnonima(): Promise<User> {
  try {
    const credencial = await signInAnonymously(auth);
    return credencial.user;
  } catch (error) {
    console.warn("Aviso ao conectar com Firebase Auth:", error);
    throw new Error("Não foi possível iniciar sua sessão no momento. Verifique sua conexão à internet.");
  }
}

/**
 * Observa alterações de autenticação do usuário.
 * @param callback Função chamada quando o estado de autenticação mudar.
 * @returns Função para cancelar a inscrição do observador.
 */
export function observarAutenticacao(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ============================================================================
// GESTÃO DE PLANOS PRÉ-CONFIGURADOS E HISTÓRICO DE JEJUM NO FIRESTORE
// ============================================================================

/**
 * Catálogo padrão seed de protocolos de jejum para fallback instantâneo de alta velocidade.
 */
export const PLANOS_PADRAO_SEED: ProtocoloJejumData[] = [
  // Populares
  { id: '16-8', nome: '16:8', horasJejum: 16, horasAlimentacao: 8, categoria: 'popular', rotuloDestaque: 'Mais popular', ehPro: false, ordem: 1 },
  { id: '23-1', nome: '23:1', horasJejum: 23, horasAlimentacao: 1, categoria: 'popular', rotuloDestaque: 'OMAD (1 refeição)', ehPro: true, ordem: 2 },
  { id: '20-4', nome: '20:4', horasJejum: 20, horasAlimentacao: 4, categoria: 'popular', rotuloDestaque: 'Dieta do guerreiro', ehPro: false, ordem: 3 },
  { id: '14-10', nome: '14:10', horasJejum: 14, horasAlimentacao: 10, categoria: 'popular', rotuloDestaque: 'Fácil de começar', ehPro: false, ordem: 4 },
  
  // Básicos
  { id: '12-12', nome: '12:12', horasJejum: 12, horasAlimentacao: 12, categoria: 'basico', ehPro: false, ordem: 5 },
  { id: '13-11', nome: '13:11', horasJejum: 13, horasAlimentacao: 11, categoria: 'basico', ehPro: false, ordem: 6 },
  { id: '15-9', nome: '15:9', horasJejum: 15, horasAlimentacao: 9, categoria: 'basico', ehPro: true, ordem: 7 },
  
  // Intermediários
  { id: '17-7', nome: '17:7', horasJejum: 17, horasAlimentacao: 7, categoria: 'intermediario', ehPro: true, ordem: 8 },
  { id: '18-6', nome: '18:6', horasJejum: 18, horasAlimentacao: 6, categoria: 'intermediario', ehPro: true, ordem: 9 },
  { id: '19-5', nome: '19:5', horasJejum: 19, horasAlimentacao: 5, categoria: 'intermediario', ehPro: true, ordem: 10 },
  
  // Avançados
  { id: '21-3', nome: '21:3', horasJejum: 21, horasAlimentacao: 3, categoria: 'avancado', ehPro: true, ordem: 11 },
  { id: '22-2', nome: '22:2', horasJejum: 22, horasAlimentacao: 2, categoria: 'avancado', ehPro: true, ordem: 12 },
  
  // Prolongados
  { id: '24h', nome: '24h', horasJejum: 24, horasAlimentacao: 0, categoria: 'prolongado', rotuloDestaque: '1 dia em jejum', dicaHidratacao: 'Mantenha hidratação', ehPro: true, ordem: 13 },
  { id: '30h', nome: '30h', horasJejum: 30, horasAlimentacao: 0, categoria: 'prolongado', rotuloDestaque: '1.25 dias em jejum', dicaHidratacao: 'Mantenha hidratação', ehPro: true, ordem: 14 },
  { id: '48h', nome: '48h', horasJejum: 48, horasAlimentacao: 0, categoria: 'prolongado', rotuloDestaque: '2 dias em jejum', dicaHidratacao: 'Eletrólitos essenciais', ehPro: true, ordem: 15 },
  { id: '72h', nome: '72h', horasJejum: 72, horasAlimentacao: 0, categoria: 'prolongado', rotuloDestaque: '3 dias em jejum', dicaHidratacao: 'Supervisão indicada', ehPro: true, ordem: 16 },
  { id: '168h', nome: '168h', horasJejum: 168, horasAlimentacao: 0, categoria: 'prolongado', rotuloDestaque: '7 dias autofágicos', dicaHidratacao: 'Acompanhamento médico', ehPro: true, ordem: 17 }
];

/**
 * Busca a coleção global 'planos' no Firestore.
 * Se a coleção estiver vazia no primeiro acesso, realiza o auto-provisionamento (seed)
 * dos planos oficiais para que qualquer administrador possa editar no Firebase console.
 * @returns Lista de protocolos de jejum ordenados.
 */
export async function buscarPlanosFirestore(): Promise<ProtocoloJejumData[]> {
  try {
    const planosRef = collection(db, "planos");
    const snapshot = await getDocs(planosRef);

    if (snapshot.empty) {
      // Auto-provisiona a coleção 'planos' no Firestore em segundo plano
      PLANOS_PADRAO_SEED.forEach(async (plano) => {
        try {
          await setDoc(doc(db, "planos", plano.id), {
            ...plano,
            atualizadoEm: serverTimestamp()
          });
        } catch (err) {
          console.warn(`[Firebase] Falha ao auto-provisionar plano ${plano.id}:`, err);
        }
      });
      return PLANOS_PADRAO_SEED;
    }

    const planosCarregados: ProtocoloJejumData[] = [];
    snapshot.forEach((docSnap) => {
      planosCarregados.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ProtocoloJejumData, 'id'>)
      });
    });

    // Ordena de acordo com o campo ordem, ou padrão de horas
    planosCarregados.sort((a, b) => (a.ordem || 99) - (b.ordem || 99));
    return planosCarregados;
  } catch (error) {
    console.warn("[Firebase] Aviso ao buscar planos do Firestore, utilizando fallback rápido local:", error);
    return PLANOS_PADRAO_SEED;
  }
}

/**
 * Salva ou atualiza o estado atual do jejum (Live State) no documento do usuário em 'usuarios/{usuarioId}'.
 * Permite que a tela inicial saiba imediatamente o plano ativo, se está jejuando agora e a contagem de dias.
 * @param usuarioId ID do usuário.
 * @param estado Objeto parcial contendo as alterações do estado atual.
 */
export async function salvarEstadoJejumUsuarioFirestore(
  usuarioId: string,
  estado: Partial<EstadoJejumUsuario>
): Promise<void> {
  if (!usuarioId) return;

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await setDoc(
      usuarioRef,
      {
        estadoJejum: {
          ...estado,
          atualizadoEm: serverTimestamp()
        },
        atualizadoEm: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("[Firebase] Aviso ao salvar estado do jejum no Firestore:", error);
  }
}

/**
 * Registra a conclusão ou encerramento de um jejum na subcoleção 'usuarios/{usuarioId}/historico_jejuns'.
 * Atualiza também a sequência de dias consecutivos (streak) do usuário no documento principal.
 * @param usuarioId ID do usuário.
 * @param sessao Dados da sessão de jejum concluída.
 * @param diasConsecutivosAtuais Sequência de dias atual do usuário.
 * @param ultimoDiaConcluido Data YYYY-MM-DD do último jejum salvo.
 * @returns Nova contagem de dias consecutivos calculada.
 */
export async function registrarHistoricoJejumFirestore(
  usuarioId: string,
  sessao: SessaoJejum,
  diasConsecutivosAtuais: number = 1,
  ultimoDiaConcluido?: string | null,
  opcoesJanela?: {
    abrirJanelaAlimentacao?: boolean;
    horasJanelaAlimentacao?: number;
  }
): Promise<{ novosDiasConsecutivos: number; ultimoDiaAtualizado: string; inicioJanelaIso: string | null }> {
  const agoraIso = new Date().toISOString();
  const hojeStr = agoraIso.slice(0, 10); // "YYYY-MM-DD"
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().slice(0, 10);

  // Lógica de cálculo da sequência de dias consecutivos
  let novosDias = diasConsecutivosAtuais || 1;
  if (ultimoDiaConcluido === hojeStr) {
    // Já jejuou hoje, preserva a sequência
  } else if (ultimoDiaConcluido === ontemStr) {
    // Jejuou ontem e registrou hoje, incrementa a sequência!
    novosDias += 1;
  } else if (!ultimoDiaConcluido) {
    novosDias = 1;
  } else {
    // Ficou mais de um dia sem jejuar, reinicia a contagem
    novosDias = 1;
  }

  // Cache instantâneo em localStorage para evitar qualquer piscada de dados ao recarregar
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('jejuar_dias_consecutivos', String(novosDias));
      localStorage.setItem('jejuar_ultimo_dia', hojeStr);
      const maiorAntigo = Number(localStorage.getItem('jejuar_maior_streak') || '0');
      if (novosDias > maiorAntigo) {
        localStorage.setItem('jejuar_maior_streak', String(novosDias));
      }
      if (opcoesJanela?.abrirJanelaAlimentacao) {
        localStorage.setItem('jejuar_explorou_janela', 'true');
      }

      // Adiciona imediatamente a sessão concluída ao cache local para atualização instantânea das conquistas e XP
      const cacheSessoesRaw = localStorage.getItem('jejuar_historico_jejuns_cache');
      const listaAtual = cacheSessoesRaw ? JSON.parse(cacheSessoesRaw) : [];
      const novaSessaoCache: SessaoJejum = {
        ...sessao,
        id: sessao.id || `jejum_${Date.now()}`,
      };
      const novaLista = [novaSessaoCache, ...(Array.isArray(listaAtual) ? listaAtual : [])];
      localStorage.setItem('jejuar_historico_jejuns_cache', JSON.stringify(novaLista));
    } catch {
      // Ignora restrições locais silenciosamente
    }
  }

  const deveAbrirJanela = Boolean(opcoesJanela?.abrirJanelaAlimentacao);
  const horasJanela = opcoesJanela?.horasJanelaAlimentacao || Math.max(1, 24 - sessao.metaHoras);
  const inicioJanelaIso = deveAbrirJanela ? agoraIso : null;

  if (usuarioId) {
    try {
      // 1. Grava o documento independente na subcoleção historico_jejuns
      const historicoRef = collection(db, "usuarios", usuarioId, "historico_jejuns");
      await addDoc(historicoRef, {
        ...sessao,
        criadoEm: serverTimestamp()
      });

      // 2. Atualiza o estado vivo do usuário no documento principal
      const usuarioRef = doc(db, "usuarios", usuarioId);
      await setDoc(
        usuarioRef,
        {
          estadoJejum: {
            planoAtivoId: sessao.planoId,
            nomePlano: sessao.nomePlano,
            metaHoras: sessao.metaHoras,
            emJejum: false,
            inicioTimestamp: null,
            emJanelaAlimentacao: deveAbrirJanela,
            inicioJanelaTimestamp: inicioJanelaIso,
            horasJanelaAlimentacao: horasJanela,
            diasConsecutivos: novosDias,
            ultimoDiaConcluido: hojeStr,
            atualizadoEm: serverTimestamp()
          },
          atualizadoEm: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.warn("[Firebase] Aviso ao registrar histórico de jejum no Firestore:", error);
    }
  }

  notificarAtualizacaoGamificacao();

  return {
    novosDiasConsecutivos: novosDias,
    ultimoDiaAtualizado: hojeStr,
    inicioJanelaIso,
  };
}

/**
 * Salva ou edita manualmente uma sessão de jejum na subcoleção 'usuarios/{usuarioId}/historico_jejuns'.
 * Utilizado pela subtela EditarJejunsScreen para manter o histórico do Firestore 100% sincronizado.
 * @param usuarioId ID do usuário autenticado.
 * @param sessao Objeto completo da sessão de jejum a ser criada ou atualizada.
 */
export async function salvarSessaoJejumManualFirestore(
  usuarioId: string,
  sessao: SessaoJejum
): Promise<string> {
  if (!usuarioId) return sessao.id || `jejum_${Date.now()}`;

  try {
    const historicoRef = collection(db, "usuarios", usuarioId, "historico_jejuns");
    if (sessao.id && !sessao.id.startsWith("jejum_")) {
      const docRef = doc(db, "usuarios", usuarioId, "historico_jejuns", sessao.id);
      await setDoc(
        docRef,
        {
          planoId: sessao.planoId,
          nomePlano: sessao.nomePlano,
          inicio: sessao.inicio,
          fim: sessao.fim,
          duracaoSegundos: sessao.duracaoSegundos,
          metaHoras: sessao.metaHoras,
          metaAtingida: sessao.metaAtingida,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );
      notificarAtualizacaoGamificacao();
      return sessao.id;
    } else {
      const docRef = await addDoc(historicoRef, {
        planoId: sessao.planoId,
        nomePlano: sessao.nomePlano,
        inicio: sessao.inicio,
        fim: sessao.fim,
        duracaoSegundos: sessao.duracaoSegundos,
        metaHoras: sessao.metaHoras,
        metaAtingida: sessao.metaAtingida,
        criadoEm: serverTimestamp(),
      });
      notificarAtualizacaoGamificacao();
      return docRef.id;
    }
  } catch (error) {
    console.warn("[Firebase] Aviso ao salvar sessão manual de jejum no Firestore:", error);
    notificarAtualizacaoGamificacao();
    return sessao.id || `jejum_${Date.now()}`;
  }
}

/**
 * Remove uma sessão de jejum da subcoleção 'usuarios/{usuarioId}/historico_jejuns' no Firestore.
 * @param usuarioId ID do usuário autenticado.
 * @param sessaoId ID do documento da sessão de jejum a ser excluída.
 */
export async function excluirSessaoJejumFirestore(
  usuarioId: string,
  sessaoId: string
): Promise<void> {
  if (!usuarioId || !sessaoId) {
    notificarAtualizacaoGamificacao();
    return;
  }

  try {
    const docRef = doc(db, "usuarios", usuarioId, "historico_jejuns", sessaoId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("[Firebase] Aviso ao excluir sessão de jejum no Firestore:", error);
  }
  notificarAtualizacaoGamificacao();
}

/** Interface de um registro individual de pesagem */
export interface RegistroPesagem {
  id?: string;
  peso: number;
  dataIso: string;
  fotoUrl?: string | null;
  criadoEm?: unknown;
}

/**
 * Registra uma nova pesagem na subcoleção 'historico_pesagens' e atualiza o peso atual
 * no documento principal do usuário no Firestore.
 * @param usuarioId ID do usuário autenticado
 * @param peso Valor numérico do peso registrado
 * @param fotoUrl Opcional: URL da foto de progresso
 */
export async function registrarPesagemHistoricoFirestore(
  usuarioId: string,
  peso: number,
  fotoUrl?: string
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const qtdAtual = Number(localStorage.getItem('jejuar_total_pesagens_registradas') || '0');
      localStorage.setItem('jejuar_total_pesagens_registradas', String(qtdAtual + 1));
      localStorage.setItem('jejuar_peso_atual', String(peso));
      localStorage.setItem('jejuar_peso_registrado_hoje', new Date().toISOString().slice(0, 10));
    } catch {}
  }

  if (!usuarioId) {
    notificarAtualizacaoGamificacao();
    return;
  }

  const agoraIso = new Date().toISOString();

  try {
    // 1. Grava o registro cronológico na subcoleção 'historico_pesagens'
    const pesagensRef = collection(db, "usuarios", usuarioId, "historico_pesagens");
    await addDoc(pesagensRef, {
      peso,
      dataIso: agoraIso,
      fotoUrl: fotoUrl || null,
      criadoEm: serverTimestamp()
    });

    // 2. Atualiza o peso vivo nas informacoesBasicas do documento do usuário
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await updateDoc(usuarioRef, {
      "informacoesBasicas.peso": peso,
      "informacoesBasicas.atualizadoEm": serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    notificarAtualizacaoGamificacao();
  } catch (error) {
    notificarAtualizacaoGamificacao();
    console.error("[Firebase] Erro ao registrar pesagem no Firestore:", error);
    throw error;
  }
}

/**
 * Atualiza o peso de início (ponto de partida do usuário) no Firestore.
 * @param usuarioId ID do usuário autenticado
 * @param pesoInicial Novo valor do peso de início
 */
export async function atualizarPesoInicialFirestore(
  usuarioId: string,
  pesoInicial: number
): Promise<void> {
  if (!usuarioId) {
    notificarAtualizacaoGamificacao();
    return;
  }

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await updateDoc(usuarioRef, {
      "informacoesBasicas.pesoInicial": pesoInicial,
      "informacoesBasicas.atualizadoEm": serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    notificarAtualizacaoGamificacao();
  } catch (error) {
    notificarAtualizacaoGamificacao();
    console.error("[Firebase] Erro ao atualizar peso inicial no Firestore:", error);
    throw error;
  }
}

/**
 * Atualiza a meta de peso desejado pelo usuário no Firestore.
 * @param usuarioId ID do usuário autenticado
 * @param pesoDesejado Novo valor da meta de peso
 */
export async function atualizarMetaPesoFirestore(
  usuarioId: string,
  pesoDesejado: number
): Promise<void> {
  if (!usuarioId) {
    notificarAtualizacaoGamificacao();
    return;
  }

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await updateDoc(usuarioRef, {
      "informacoesBasicas.pesoDesejado": pesoDesejado,
      "informacoesBasicas.atualizadoEm": serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    notificarAtualizacaoGamificacao();
  } catch (error) {
    notificarAtualizacaoGamificacao();
    console.error("[Firebase] Erro ao atualizar meta de peso no Firestore:", error);
    throw error;
  }
}

/**
 * Recupera o histórico recente de pesagens do usuário para exibição no gráfico.
 * @param usuarioId ID do usuário autenticado
 * @param limiteRegistros Quantidade máxima de registros a buscar (padrão: 30)
 */
export async function buscarHistoricoPesagensFirestore(
  usuarioId: string,
  limiteRegistros = 30
): Promise<RegistroPesagem[]> {
  if (!usuarioId) return [];

  try {
    const pesagensRef = collection(db, "usuarios", usuarioId, "historico_pesagens");
    const q = query(pesagensRef, orderBy("dataIso", "desc"), limit(limiteRegistros));
    const snapshot = await getDocs(q);

    const pesagens: RegistroPesagem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      pesagens.push({
        id: docSnap.id,
        peso: Number(data.peso),
        dataIso: data.dataIso || new Date().toISOString(),
        fotoUrl: data.fotoUrl || null,
        criadoEm: data.criadoEm
      });
    });

    // Retorna em ordem cronológica (do mais antigo para o mais recente)
    return pesagens.reverse();
  } catch (error) {
    console.warn("[Firebase] Aviso ao buscar histórico de pesagens no Firestore:", error);
    return [];
  }
}

/** Configuração dos lembretes de pesagem */
export interface ConfiguracoesLembretePeso {
  ativo: boolean;
  hora: string;
  dias: string[];
  som: string;
}

/**
 * Salva as configurações de lembrete de peso do usuário no Firestore.
 * @param usuarioId ID do usuário autenticado
 * @param config Objeto com as configurações de lembrete
 */
export async function salvarConfiguracoesLembretePesoFirestore(
  usuarioId: string,
  config: ConfiguracoesLembretePeso
): Promise<void> {
  const diasTexto =
    Array.isArray(config.dias) && config.dias.length === 7
      ? 'Todos os dias'
      : Array.isArray(config.dias) && config.dias.length > 0
      ? config.dias.join(', ')
      : 'Todos os dias';

  // Sincroniza cache local de ambos os módulos (ConfiguracoesPesoScreen e NotificacaoPesoScreen)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('jejuar_lembrete_peso_ativo', String(config.ativo));
      localStorage.setItem('jejuar_lembrete_peso_hora', config.hora);
      localStorage.setItem('jejuar_lembrete_peso_dias', JSON.stringify(config.dias));
      localStorage.setItem('jejuar_lembrete_peso_som', config.som);

      const salvoJejum = localStorage.getItem('jejuar_config_jejum');
      const objJejum = salvoJejum ? JSON.parse(salvoJejum) : { ...CONFIGURACAO_JEJUM_PADRAO };
      if (!objJejum.notificacoes) objJejum.notificacoes = { ...CONFIGURACAO_JEJUM_PADRAO.notificacoes };
      objJejum.notificacoes.pesoLembreteAtivo = config.ativo;
      objJejum.notificacoes.pesoHora = config.hora;
      objJejum.notificacoes.pesoDias = diasTexto;
      objJejum.notificacoes.pesoSom = config.som;
      localStorage.setItem('jejuar_config_jejum', JSON.stringify(objJejum));
    } catch {
      // Ignora restrições locais
    }
  }

  if (!usuarioId) return;

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await setDoc(
      usuarioRef,
      {
        configuracoesPeso: {
          ...config,
          atualizadoEm: serverTimestamp()
        },
        configuracoesJejum: {
          notificacoes: {
            pesoLembreteAtivo: config.ativo,
            pesoHora: config.hora,
            pesoDias: diasTexto,
            pesoSom: config.som
          }
        },
        atualizadoEm: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.error("[Firebase] Erro ao salvar configurações de lembrete de peso:", error);
    throw error;
  }
}

/**
 * Busca as configurações salvas de lembrete de peso do usuário no Firestore.
 * @param usuarioId ID do usuário autenticado
 */
export async function buscarConfiguracoesLembretePesoFirestore(
  usuarioId: string
): Promise<ConfiguracoesLembretePeso | null> {
  if (!usuarioId) return null;

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    const snap = await getDoc(usuarioRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.configuracoesPeso) {
      return data.configuracoesPeso;
    }
    if (data.configuracoesJejum?.notificacoes) {
      const n = data.configuracoesJejum.notificacoes;
      const diasStr = String(n.pesoDias || 'Todos os dias');
      const todosDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const diasArr =
        diasStr === 'Todos os dias'
          ? todosDias
          : diasStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      return {
        ativo: n.pesoLembreteAtivo ?? true,
        hora: n.pesoHora || '08:00',
        dias: diasArr.length > 0 ? diasArr : todosDias,
        som: n.pesoSom || 'Padrão'
      };
    }
    return null;
  } catch (error) {
    console.warn("[Firebase] Aviso ao carregar configurações de peso:", error);
    return null;
  }
}

/** Interface de um registro histórico de medida corporal */
export interface RegistroMedidaCorporal {
  id?: string;
  parte: string;
  valorCm: number;
  dataIso: string;
  criadoEm?: any;
}

/** Mapa das últimas medidas registradas de cada parte do corpo */
export interface MedidasCorporaisUsuario {
  cintura?: number;
  peito?: number;
  braco?: number;
  quadris?: number;
  coxa?: number;
  atualizadoEm?: any;
}

/**
 * Salva uma nova medição corporal no Firestore.
 * Atualiza o mapa `medidasCorporais` no documento do usuário e cria um registro
 * histórico na subcoleção `usuarios/{usuarioId}/historico_medidas`.
 * 
 * @param usuarioId ID do usuário autenticado
 * @param parte Identificador da parte do corpo (ex: 'cintura', 'peito', 'braco', 'quadris', 'coxa')
 * @param valorCm Valor medido em centímetros
 */
export async function salvarMedidaCorporalFirestore(
  usuarioId: string,
  parte: string,
  valorCm: number
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('jejuar_medida_registrada_manual', 'true');
      const qtdAtual = Number(localStorage.getItem('jejuar_total_medidas_registradas') || '0');
      localStorage.setItem('jejuar_total_medidas_registradas', String(qtdAtual + 1));
    } catch {}
  }

  if (!usuarioId) {
    notificarAtualizacaoGamificacao();
    return;
  }

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    
    // 1. Atualiza a última medição no mapa principal do usuário
    await setDoc(
      usuarioRef,
      {
        medidasCorporais: {
          [parte]: valorCm,
          atualizadoEm: serverTimestamp()
        },
        atualizadoEm: serverTimestamp()
      },
      { merge: true }
    );

    // 2. Grava no histórico de medidas corporais do usuário
    const historicoRef = collection(db, "usuarios", usuarioId, "historico_medidas");
    await addDoc(historicoRef, {
      parte,
      valorCm,
      dataIso: new Date().toISOString(),
      criadoEm: serverTimestamp()
    });
    notificarAtualizacaoGamificacao();
  } catch (error) {
    notificarAtualizacaoGamificacao();
    console.error(`[Firebase] Erro ao salvar medida corporal (${parte}):`, error);
    throw new Error("Não conseguimos salvar suas medidas. Verifique sua conexão e tente novamente.");
  }
}

/**
 * Busca o mapa das últimas medidas corporais do usuário gravadas no Firestore.
 * @param usuarioId ID do usuário autenticado
 */
export async function buscarMedidasCorporaisFirestore(
  usuarioId: string
): Promise<MedidasCorporaisUsuario | null> {
  if (!usuarioId) return null;

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    const snap = await getDoc(usuarioRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.medidasCorporais || null;
  } catch (error) {
    console.warn("[Firebase] Aviso ao buscar medidas corporais:", error);
    return null;
  }
}

/**
 * Busca o histórico de medidas de uma determinada parte do corpo do usuário.
 * @param usuarioId ID do usuário autenticado
 * @param parte Identificador da parte do corpo
 * @param limiteRegistros Quantidade máxima de registros a retornar (padrão: 14)
 */
export async function buscarHistoricoMedidasParteFirestore(
  usuarioId: string,
  parte: string,
  limiteRegistros = 14
): Promise<RegistroMedidaCorporal[]> {
  if (!usuarioId) return [];

  try {
    const historicoRef = collection(db, "usuarios", usuarioId, "historico_medidas");
    const q = query(
      historicoRef,
      where("parte", "==", parte),
      orderBy("dataIso", "desc"),
      limit(limiteRegistros)
    );
    const snapshot = await getDocs(q);

    const registros: RegistroMedidaCorporal[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      registros.push({
        id: docSnap.id,
        parte: data.parte,
        valorCm: Number(data.valorCm),
        dataIso: data.dataIso || new Date().toISOString(),
        criadoEm: data.criadoEm
      });
    });

    return registros.reverse();
  } catch (error) {
    console.warn(`[Firebase] Aviso ao buscar histórico de medidas para ${parte}:`, error);
    return [];
  }
}

// ============================================================================
// GESTÃO DO MONITORAMENTO E CONSUMO DE ÁGUA NO FIRESTORE
// ============================================================================

/** Configuração padrão do monitoramento de água */
export const CONFIGURACAO_AGUA_PADRAO: ConfiguracaoMonitorAgua = {
  lembreteAtivo: true,
  somLembrete: "Padrão",
  horaInicio: "08:00",
  horaFim: "21:00",
  intervalo: "A cada 1 hora",
  metaDiariaMl: 2500,
  unidade: "ml"
};

/**
 * Salva ou atualiza o consumo diário de água do usuário no Firestore.
 * Cria/atualiza o documento com a chave da data 'YYYY-MM-DD' na subcoleção 'historico_agua'.
 * Também atualiza o consumo atual do dia no documento principal para leitura instantânea.
 * 
 * @param usuarioId ID do usuário autenticado
 * @param dataStr Data no formato 'YYYY-MM-DD'
 * @param consumidoMl Quantidade total consumida no dia em ml
 * @param metaMl Meta diária estipulada em ml
 * @param unidade Unidade utilizada ('ml' ou 'fl oz')
 */
export async function salvarConsumoAguaFirestore(
  usuarioId: string,
  dataStr: string,
  consumidoMl: number,
  metaMl: number = 2500,
  unidade: 'ml' | 'fl oz' = 'ml'
): Promise<void> {
  // Atualiza cache em localStorage para resposta com zero-latency
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`jejuar_agua_${dataStr}`, String(consumidoMl));
      localStorage.setItem('jejuar_meta_agua', String(metaMl));
    } catch {
      // Ignora restrições locais
    }
  }

  notificarAtualizacaoGamificacao();

  if (!usuarioId) return;

  try {
    // 1. Grava o registro diário na subcoleção 'historico_agua' com ID fixo por dia (YYYY-MM-DD)
    const registroDiaRef = doc(db, "usuarios", usuarioId, "historico_agua", dataStr);
    await setDoc(registroDiaRef, {
      dataStr,
      consumidoMl,
      metaMl,
      unidade,
      atualizadoEm: serverTimestamp()
    }, { merge: true });

    // 2. Atualiza o resumo de água no documento raiz do usuário
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await setDoc(usuarioRef, {
      consumoAguaAtual: {
        dataStr,
        consumidoMl,
        metaMl,
        unidade,
        atualizadoEm: serverTimestamp()
      },
      atualizadoEm: serverTimestamp()
    }, { merge: true });
    notificarAtualizacaoGamificacao();
  } catch (error) {
    console.warn("[Firebase] Aviso ao salvar consumo de água no Firestore:", error);
  }
}

/**
 * Busca o histórico de ingestão de água dos últimos dias (padrão 7 dias) para exibição no gráfico.
 * Preenche dias faltantes com 0 para garantir que o gráfico de 7 dias tenha continuidade visual perfeita.
 * 
 * @param usuarioId ID do usuário autenticado
 * @param totalDias Quantidade de dias para o gráfico (padrão: 7)
 * @param metaPadrao Meta padrão em ml caso não haja registro
 */
export async function buscarHistoricoAguaFirestore(
  usuarioId: string,
  totalDias: number = 7,
  metaPadrao: number = 2500
): Promise<RegistroConsumoAgua[]> {
  const hoje = new Date();
  const diasChaves: string[] = [];
  
  // Gera os últimos N dias no formato 'YYYY-MM-DD'
  for (let i = totalDias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(hoje.getDate() - i);
    diasChaves.push(d.toISOString().slice(0, 10));
  }

  // Mapa com valores iniciais zerados ou preenchidos pelo cache local
  const mapaHistorico: Record<string, RegistroConsumoAgua> = {};
  diasChaves.forEach((dStr) => {
    let valorCache = 0;
    if (typeof window !== 'undefined') {
      const c = localStorage.getItem(`jejuar_agua_${dStr}`);
      if (c) valorCache = Number(c);
    }
    mapaHistorico[dStr] = {
      dataStr: dStr,
      consumidoMl: valorCache,
      metaMl: metaPadrao,
      unidade: 'ml'
    };
  });

  if (!usuarioId) {
    return diasChaves.map((dStr) => mapaHistorico[dStr]);
  }

  try {
    const historicoRef = collection(db, "usuarios", usuarioId, "historico_agua");
    const q = query(historicoRef, orderBy("dataStr", "desc"), limit(totalDias));
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const dStr = data.dataStr || docSnap.id;
      if (mapaHistorico[dStr]) {
        mapaHistorico[dStr] = {
          id: docSnap.id,
          dataStr: dStr,
          consumidoMl: Number(data.consumidoMl || 0),
          metaMl: Number(data.metaMl || metaPadrao),
          unidade: data.unidade || 'ml',
          atualizadoEm: data.atualizadoEm
        };
      }
    });
  } catch (error) {
    console.warn("[Firebase] Aviso ao buscar histórico de água do Firestore:", error);
  }

  return diasChaves.map((dStr) => mapaHistorico[dStr]);
}

/**
 * Busca TODO o histórico de ingestão de água do usuário sem limite de 7 dias,
 * unificando os documentos da subcoleção 'historico_agua' do Firestore com todas as chaves
 * 'jejuar_agua_YYYY-MM-DD' presentes no LocalStorage.
 * Também atualiza o cache consolidado 'jejuar_total_agua_consumida_ml' para leitura instantânea.
 *
 * @param usuarioId ID do usuário autenticado
 * @param metaPadrao Meta padrão em ml caso o registro não especifique
 */
export async function buscarTodoHistoricoAguaFirestore(
  usuarioId?: string,
  metaPadrao: number = 2500
): Promise<RegistroConsumoAgua[]> {
  const mapaUnificado: Record<string, RegistroConsumoAgua> = {};

  // 1. Lê todas as chaves locais do tipo 'jejuar_agua_YYYY-MM-DD' no navegador
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave && /^jejuar_agua_\d{4}-\d{2}-\d{2}$/.test(chave)) {
          const dataStr = chave.replace('jejuar_agua_', '');
          const valorMl = Number(localStorage.getItem(chave) || '0');
          if (!isNaN(valorMl) && valorMl > 0) {
            mapaUnificado[dataStr] = {
              id: `agua_${dataStr}`,
              dataStr,
              consumidoMl: valorMl,
              metaMl: metaPadrao,
              unidade: 'ml',
            };
          }
        }
      }
    } catch {
      // Ignora restrições de leitura do localStorage
    }
  }

  // 2. Consulta todos os registros persistidos na subcoleção 'historico_agua' no Firestore
  if (usuarioId) {
    try {
      const historicoRef = collection(db, "usuarios", usuarioId, "historico_agua");
      const q = query(historicoRef, orderBy("dataStr", "desc"), limit(1000));
      const snapshot = await getDocs(q);

      const hojeStr = new Date().toISOString().slice(0, 10);

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const dStr = data.dataStr || docSnap.id;
        const consumidoRemoto = Number(data.consumidoMl || 0);
        const consumidoLocal = mapaUnificado[dStr]?.consumidoMl || 0;

        // Para o dia de hoje preserva o maior valor entre cache imediato e banco; para dias passados usa o banco
        const consumidoFinal = dStr === hojeStr ? Math.max(consumidoRemoto, consumidoLocal) : consumidoRemoto;

        if (consumidoFinal > 0) {
          mapaUnificado[dStr] = {
            id: docSnap.id,
            dataStr: dStr,
            consumidoMl: consumidoFinal,
            metaMl: Number(data.metaMl || metaPadrao),
            unidade: data.unidade || 'ml',
            atualizadoEm: data.atualizadoEm,
          };
        } else if (mapaUnificado[dStr] && dStr !== hojeStr) {
          // Se foi zerado/excluído no banco em dia anterior, remove do mapa consolidado
          delete mapaUnificado[dStr];
        }
      });
    } catch (error) {
      console.warn("[Firebase] Aviso ao buscar todo o histórico de água no Firestore:", error);
    }
  }

  const listaConsolidada = Object.values(mapaUnificado).sort((a, b) =>
    b.dataStr.localeCompare(a.dataStr)
  );

  // 3. Atualiza a soma total real em ml no cache local para zero-latency no Perfil
  if (typeof window !== 'undefined') {
    try {
      const somaTotalMl = listaConsolidada.reduce((acc, item) => acc + (item.consumidoMl || 0), 0);
      localStorage.setItem('jejuar_total_agua_consumida_ml', String(somaTotalMl));
    } catch {
      // Ignora erro local
    }
  }

  return listaConsolidada;
}

/**
 * Salva as configurações de monitoramento de água (lembretes, horários, meta e unidade) no Firestore.
 * 
 * @param usuarioId ID do usuário autenticado
 * @param config Objeto completo de configuração
 */
export async function salvarConfiguracaoAguaFirestore(
  usuarioId: string,
  config: ConfiguracaoMonitorAgua
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('jejuar_config_agua', JSON.stringify(config));
      localStorage.setItem('jejuar_meta_agua', String(config.metaDiariaMl));

      // Sincroniza em tempo real no cache local de configurações de jejum
      const salvoJejum = localStorage.getItem('jejuar_config_jejum');
      if (salvoJejum) {
        const objJejum = JSON.parse(salvoJejum);
        if (!objJejum.notificacoes) objJejum.notificacoes = {};
        objJejum.notificacoes.aguaLembreteAtivo = config.lembreteAtivo;
        objJejum.notificacoes.aguaSom = config.somLembrete;
        objJejum.notificacoes.aguaHoraInicio = config.horaInicio;
        objJejum.notificacoes.aguaHoraFim = config.horaFim;
        objJejum.notificacoes.aguaIntervalo = config.intervalo;
        localStorage.setItem('jejuar_config_jejum', JSON.stringify(objJejum));
      }
    } catch {
      // Ignora restrições locais
    }
  }

  if (!usuarioId) return;

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await setDoc(usuarioRef, {
      configuracaoAgua: {
        ...config,
        atualizadoEm: serverTimestamp()
      },
      configuracoesJejum: {
        notificacoes: {
          aguaLembreteAtivo: config.lembreteAtivo,
          aguaSom: config.somLembrete,
          aguaHoraInicio: config.horaInicio,
          aguaHoraFim: config.horaFim,
          aguaIntervalo: config.intervalo,
        }
      },
      atualizadoEm: serverTimestamp()
    }, { merge: true });
    notificarAtualizacaoGamificacao();
  } catch (error) {
    notificarAtualizacaoGamificacao();
    console.error("[Firebase] Erro ao salvar configurações do monitor de água:", error);
    throw new Error("Não conseguimos salvar as configurações de água. Verifique sua conexão e tente novamente.");
  }
}

/**
 * Busca as configurações de monitoramento de água salvas do usuário.
 * 
 * @param usuarioId ID do usuário autenticado
 */
export async function buscarConfiguracaoAguaFirestore(
  usuarioId: string
): Promise<ConfiguracaoMonitorAgua> {
  // Tenta ler do cache do localStorage primeiro para carregamento instantâneo
  if (typeof window !== 'undefined') {
    try {
      const salvo = localStorage.getItem('jejuar_config_agua');
      if (salvo) {
        return { ...CONFIGURACAO_AGUA_PADRAO, ...JSON.parse(salvo) };
      }
    } catch {
      // Ignora erro de JSON
    }
  }

  if (!usuarioId) return CONFIGURACAO_AGUA_PADRAO;

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    const snap = await getDoc(usuarioRef);
    if (!snap.exists()) return CONFIGURACAO_AGUA_PADRAO;
    const data = snap.data();
    return data.configuracaoAgua ? { ...CONFIGURACAO_AGUA_PADRAO, ...data.configuracaoAgua } : CONFIGURACAO_AGUA_PADRAO;
  } catch (error) {
    console.warn("[Firebase] Aviso ao buscar configurações de água no Firestore:", error);
    return CONFIGURACAO_AGUA_PADRAO;
  }
}

// ============================================================================
// GESTÃO DAS CONFIGURAÇÕES COMPLETAS DE JEJUM
// ============================================================================

/** Configuração padrão inicial do Jejum */
export const CONFIGURACAO_JEJUM_PADRAO: ConfiguracoesJejum = {
  modoContagemRegressiva: true,
  horaInicioDiaria: "19:00",
  inicioAutomatico: false,
  exibicaoCalendario: "Pela janela de jejum planejada",
  notificacoes: {
    jejumInicioAtivo: true,
    jejumInicioSom: "Padrão",
    jejumFimAtivo: true,
    jejumFimSom: "Padrão",
    jejum2hAntesInicio: true,
    jejum1hAntesInicio: true,
    jejum3hAposInicio: true,
    jejumInicioPerdido: true,
    jejum2hAntesFim: true,
    jejum1hAntesFim: true,
    jejumFimPerdido: true,
    aguaLembreteAtivo: true,
    aguaSom: "Padrão",
    aguaHoraInicio: "08:00",
    aguaHoraFim: "21:00",
    aguaIntervalo: "A cada 1 hora",
    pesoLembreteAtivo: true,
    pesoHora: "08:00",
    pesoDias: "Todos os dias",
    pesoSom: "Padrão",
    bioimpedanciaLembreteAtivo: true,
    bioimpedanciaHora: "08:00",
    bioimpedanciaIntervaloDias: 15,
    bioimpedanciaSom: "Padrão",
    naoPerturbeAtivo: false,
    naoPerturbeHoraInicio: "23:00",
    naoPerturbeHoraFim: "07:00",
    mostrarStatusBarraNotificacao: true,
  }
};

/**
 * Salva as configurações de jejum personalizadas do usuário no Firestore e no cache do navegador.
 * @param usuarioId ID do usuário autenticado
 * @param config Objeto completo das configurações de jejum
 */
export async function salvarConfiguracoesJejumFirestore(
  usuarioId: string,
  config: ConfiguracoesJejum
): Promise<void> {
  const todosDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const pesoDiasStr = config.notificacoes?.pesoDias || 'Todos os dias';
  const diasArray =
    pesoDiasStr === 'Todos os dias'
      ? todosDias
      : pesoDiasStr.split(',').map((d) => d.trim()).filter(Boolean);

  const bioAtivo = config.notificacoes?.bioimpedanciaLembreteAtivo ?? true;
  const bioHora = config.notificacoes?.bioimpedanciaHora || '08:00';
  const bioIntervalo = Number(config.notificacoes?.bioimpedanciaIntervaloDias) || 15;
  const bioSom = config.notificacoes?.bioimpedanciaSom || 'Padrão';

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('jejuar_config_jejum', JSON.stringify(config));
      if (config.notificacoes) {
        localStorage.setItem('jejuar_lembrete_peso_ativo', String(config.notificacoes.pesoLembreteAtivo ?? true));
        localStorage.setItem('jejuar_lembrete_peso_hora', config.notificacoes.pesoHora || '08:00');
        localStorage.setItem('jejuar_lembrete_peso_dias', JSON.stringify(diasArray));
        localStorage.setItem('jejuar_lembrete_peso_som', config.notificacoes.pesoSom || 'Padrão');

        // Sincroniza cache local de bioimpedância
        localStorage.setItem(
          `jejuar_bio_config_${usuarioId || 'padrao'}`,
          JSON.stringify({
            frequenciaDias: bioIntervalo,
            lembretesAtivos: bioAtivo,
            horaLembrete: bioHora,
            somLembrete: bioSom,
          })
        );
      }
    } catch {
      // Ignora restrições locais
    }
  }

  if (!usuarioId) return;

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    await setDoc(usuarioRef, {
      configuracoesJejum: {
        ...config,
        atualizadoEm: serverTimestamp()
      },
      configuracoesPeso: {
        ativo: config.notificacoes?.pesoLembreteAtivo ?? true,
        hora: config.notificacoes?.pesoHora || '08:00',
        dias: diasArray,
        som: config.notificacoes?.pesoSom || 'Padrão',
        atualizadoEm: serverTimestamp()
      },
      atualizadoEm: serverTimestamp()
    }, { merge: true });

    // Sincroniza também na subcoleção configuracoes/bioimpedancia para paridade com BioimpedanciaScreen e servidor
    const configBioRef = doc(db, "usuarios", usuarioId, "configuracoes", "bioimpedancia");
    await setDoc(configBioRef, {
      frequenciaDias: bioIntervalo,
      lembretesAtivos: bioAtivo,
      horaLembrete: bioHora,
      somLembrete: bioSom,
      atualizadoEm: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("[Firebase] Erro ao salvar configurações de jejum:", error);
  }
}

/**
 * Busca as configurações de jejum personalizadas do usuário no Firestore ou no cache local.
 * @param usuarioId ID do usuário autenticado
 */
export async function buscarConfiguracoesJejumFirestore(
  usuarioId: string
): Promise<ConfiguracoesJejum> {
  if (typeof window !== 'undefined') {
    try {
      const salvo = localStorage.getItem('jejuar_config_jejum');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        return {
          ...CONFIGURACAO_JEJUM_PADRAO,
          ...parsed,
          notificacoes: {
            ...CONFIGURACAO_JEJUM_PADRAO.notificacoes,
            ...(parsed.notificacoes || {})
          }
        };
      }
    } catch {
      // Ignora erro de JSON
    }
  }

  if (!usuarioId) return CONFIGURACAO_JEJUM_PADRAO;

  try {
    const usuarioRef = doc(db, "usuarios", usuarioId);
    const snap = await getDoc(usuarioRef);
    if (!snap.exists()) return CONFIGURACAO_JEJUM_PADRAO;
    const data = snap.data();
    if (data.configuracoesJejum) {
      return {
        ...CONFIGURACAO_JEJUM_PADRAO,
        ...data.configuracoesJejum,
        notificacoes: {
          ...CONFIGURACAO_JEJUM_PADRAO.notificacoes,
          ...(data.configuracoesJejum.notificacoes || {})
        }
      };
    }
    return CONFIGURACAO_JEJUM_PADRAO;
  } catch (error) {
    console.warn("[Firebase] Aviso ao buscar configurações de jejum no Firestore:", error);
    return CONFIGURACAO_JEJUM_PADRAO;
  }
}
