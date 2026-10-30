/**
 * @file InicioScreen.tsx
 * @description Tela principal (Dashboard de Início - Jejum) do aplicativo Jejuar.
 * Contém o timer central do plano de jejum recomendado com arco circular decorativo,
 * horários de início e término, régua de estágios metabólicos, banner educativo,
 * grid 2x2 de tarefas diárias e o menu de navegação inferior global independente.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronRight, 
  Clock 
} from 'lucide-react';
import type { UsuarioEmCadastro, RegistroConsumoAgua, ConfiguracaoMonitorAgua } from '../types';
import { ModalConfirmacao } from './ModalConfirmacao';
import { AppHeader } from './AppHeader';
import { MenuInferior, type AbaNavegacao } from './MenuInferior';
import { PlanoScreen, type ProtocoloJejum } from './PlanoScreen';
import { 
  salvarEstadoJejumUsuarioFirestore, 
  registrarHistoricoJejumFirestore,
  salvarConsumoAguaFirestore,
  buscarConfiguracaoAguaFirestore,
  buscarHistoricoAguaFirestore,
  buscarDadosUsuarioFirestore,
  buscarConfiguracoesJejumFirestore
} from '../services/firebase';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './common/PullToRefreshIndicator';
import { RastreadorAguaScreen } from './agua/RastreadorAguaScreen';
import { 
  ModalEstagioJejum, 
  type EstagioMetabolico 
} from './ModalEstagioJejum';
import { ModalDefinirHoraInicio } from './ModalDefinirHoraInicio';
import { ModalConcluirJejum } from './ModalConcluirJejum';
import { ToastSucesso } from './ToastSucesso';
import { DadosCorporaisScreen } from './DadosCorporaisScreen';
import { ConfiguracoesJejumScreen } from './configuracoes/ConfiguracoesJejumScreen';
import { TimerJejumCard } from './inicio/TimerJejumCard';
import { BannerEstagioMetabolico } from './inicio/BannerEstagioMetabolico';
import { CardDicaDoDia } from './inicio/CardDicaDoDia';
import { GridTarefasDiarias } from './inicio/GridTarefasDiarias';
import { SecaoConquistas } from './inicio/SecaoConquistas';
import { ModalGaleriaConquistas } from './inicio/ModalGaleriaConquistas';
import { ModalDetalheConquista } from './perfil/ModalDetalheConquista';
import { CarrosselDicasDoDia } from './inicio/CarrosselDicasDoDia';
import type { ConquistaUsuario } from '../types';
import { calcularConquistasUsuario } from '../utils/conquistasUtils';
import { CentralNotificacoesScreen } from './notificacoes/CentralNotificacoesScreen';
import { listarNotificacoesInternas, contarNaoLidas } from '../services/notificacoesInternasService';
import { BioimpedanciaScreen } from './bioimpedancia/BioimpedanciaScreen';
import { JornadaScreen } from './jornada/JornadaScreen';
import { PerfilScreen } from './perfil/PerfilScreen';
import { 
  obterAssinaturaPushAtual, 
  obterStatusPermissaoNotificacao 
} from '../services/pushNotificationService';

interface InicioScreenProps {
  /** Dados do usuário com informações do cadastro e onboarding */
  usuario?: UsuarioEmCadastro;
}

export const InicioScreen: React.FC<InicioScreenProps> = ({ usuario }) => {
  // Aba ativa na navegação inferior (padrão: 'jejum')
  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('jejum');

  // Estado da tela completa de Central de Notificações Internas e contagem de não lidas
  const [telaCentralNotificacoesAberta, setTelaCentralNotificacoesAberta] = useState<boolean>(false);
  const [totalNaoLidasInternas, setTotalNaoLidasInternas] = useState<number>(0);
  const [notificacoesPushAtivas, setNotificacoesPushAtivas] = useState<boolean>(false);

  // Detecta se este dispositivo possui push ativo e carrega contagem de notificações não lidas
  useEffect(() => {
    obterAssinaturaPushAtual().then((sub) => {
      setNotificacoesPushAtivas(Boolean(sub));
    }).catch(() => {});

    listarNotificacoesInternas(usuario?.id || '').then((lista) => {
      setTotalNaoLidasInternas(contarNaoLidas(lista));
    }).catch(() => {});
  }, [usuario?.id]);

  // Sequência de dias consecutivos do usuário (Streak) com cache local resiliente
  const [diasConsecutivos, setDiasConsecutivos] = useState<number>(() => {
    if (usuario?.estadoJejum?.diasConsecutivos) return usuario.estadoJejum.diasConsecutivos;
    if (typeof window !== 'undefined') {
      const cache = localStorage.getItem('jejuar_dias_consecutivos');
      if (cache) return Number(cache);
    }
    return 1;
  });

  const [ultimoDiaConcluido, setUltimoDiaConcluido] = useState<string | null>(() => {
    if (usuario?.estadoJejum?.ultimoDiaConcluido) return usuario.estadoJejum.ultimoDiaConcluido;
    if (typeof window !== 'undefined') {
      const cache = localStorage.getItem('jejuar_ultimo_dia');
      if (cache) return cache;
    }
    return null;
  });

  /**
   * Calcula os segundos decorridos entre um timestamp absoluto ISO e o horário atual (Date.now()).
   * Garante precisão matemática exata independente de suspensão de abas ou bloqueio do celular.
   */
  const calcularSegundosDecorridos = (timestampIso: string | null): number => {
    if (!timestampIso) return 0;
    const inicioMs = new Date(timestampIso).getTime();
    if (isNaN(inicioMs)) return 0;
    const agoraMs = Date.now();
    const decorrido = Math.floor((agoraMs - inicioMs) / 1000);
    return decorrido > 0 ? decorrido : 0;
  };

  // Timestamp de início da sessão atual de jejum com fallback local
  const [inicioTimestamp, setInicioTimestamp] = useState<string | null>(() => {
    if (usuario?.estadoJejum?.inicioTimestamp) return usuario.estadoJejum.inicioTimestamp;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jejuar_inicio_jejum_timestamp');
    }
    return null;
  });

  // Protocolo de jejum ativo (sincronizado com o Firestore e tela de Planos)
  const [planoAtivo, setPlanoAtivo] = useState<ProtocoloJejum>(() => {
    const salvo = usuario?.estadoJejum;
    if (salvo && salvo.planoAtivoId) {
      return {
        id: salvo.planoAtivoId,
        nome: salvo.nomePlano || salvo.planoAtivoId.replace('-', ':'),
        horasJejum: salvo.metaHoras || 16,
        horasAlimentacao: Math.max(1, 24 - (salvo.metaHoras || 16)),
        categoria: 'popular',
        rotuloDestaque: 'Plano Selecionado',
      };
    }
    return {
      id: '16:8',
      nome: '16:8',
      horasJejum: 16,
      horasAlimentacao: 8,
      categoria: 'popular',
      rotuloDestaque: 'Mais popular',
    };
  });

  // Estado do Jejum (Inativo vs Ativo) com persistência local
  const [jejumAtivo, setJejumAtivo] = useState<boolean>(() => {
    if (usuario?.estadoJejum?.emJejum !== undefined) {
      return Boolean(usuario.estadoJejum.emJejum && usuario.estadoJejum.inicioTimestamp);
    }
    if (typeof window !== 'undefined') {
      const salvoEmJejum = localStorage.getItem('jejuar_em_jejum');
      const salvoInicio = localStorage.getItem('jejuar_inicio_jejum_timestamp');
      if (salvoEmJejum === 'true' && salvoInicio) return true;
    }
    return false;
  });
  
  // Contagem dinâmica de segundos baseada no timestamp absoluto
  const [segundosJejum, setSegundosJejum] = useState<number>(() => {
    const ts = usuario?.estadoJejum?.inicioTimestamp || (typeof window !== 'undefined' ? localStorage.getItem('jejuar_inicio_jejum_timestamp') : null);
    const ativo = usuario?.estadoJejum?.emJejum !== undefined 
      ? usuario.estadoJejum.emJejum 
      : (typeof window !== 'undefined' ? localStorage.getItem('jejuar_em_jejum') === 'true' : false);
    
    if (ativo && ts) {
      return calcularSegundosDecorridos(ts);
    }
    return 0;
  });

  // Estado da Janela de Alimentação Aberta (após o encerramento do jejum)
  const [emJanelaAlimentacao, setEmJanelaAlimentacao] = useState<boolean>(() => {
    if (usuario?.estadoJejum?.emJanelaAlimentacao !== undefined) {
      return Boolean(usuario.estadoJejum.emJanelaAlimentacao && usuario.estadoJejum.inicioJanelaTimestamp);
    }
    if (typeof window !== 'undefined') {
      const salvoJanela = localStorage.getItem('jejuar_em_janela_alimentacao');
      const salvoInicioJanela = localStorage.getItem('jejuar_inicio_janela_timestamp');
      if (salvoJanela === 'true' && salvoInicioJanela) return true;
    }
    return false;
  });

  const [inicioJanelaTimestamp, setInicioJanelaTimestamp] = useState<string | null>(() => {
    if (usuario?.estadoJejum?.inicioJanelaTimestamp) return usuario.estadoJejum.inicioJanelaTimestamp;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jejuar_inicio_janela_timestamp');
    }
    return null;
  });

  const [segundosJanela, setSegundosJanela] = useState<number>(() => {
    const ts = usuario?.estadoJejum?.inicioJanelaTimestamp || (typeof window !== 'undefined' ? localStorage.getItem('jejuar_inicio_janela_timestamp') : null);
    const emJanela = usuario?.estadoJejum?.emJanelaAlimentacao !== undefined
      ? usuario.estadoJejum.emJanelaAlimentacao
      : (typeof window !== 'undefined' ? localStorage.getItem('jejuar_em_janela_alimentacao') === 'true' : false);
    
    if (emJanela && ts) {
      return calcularSegundosDecorridos(ts);
    }
    return 0;
  });

  // Estado do Toast de Notificação e Sucesso
  const [toastConfig, setToastConfig] = useState<{
    visivel: boolean;
    titulo: string;
    mensagem: string;
    dias?: number;
  }>({
    visivel: false,
    titulo: '',
    mensagem: '',
  });

  const [modalEncerrarAberto, setModalEncerrarAberto] = useState<boolean>(false);
  const [modalConcluirAberto, setModalConcluirAberto] = useState<boolean>(false);
  const [modalEditarHorarioAberto, setModalEditarHorarioAberto] = useState<boolean>(false);
  const [modalEstagioAberto, setModalEstagioAberto] = useState<boolean>(false);
  const [modalConquistasAberto, setModalConquistasAberto] = useState<boolean>(false);
  const [conquistaDetalheModal, setConquistaDetalheModal] = useState<ConquistaUsuario | null>(null);
  const [estagioSelecionado, setEstagioSelecionado] = useState<EstagioMetabolico | null>(null);
  const [telaDadosCorporaisAberta, setTelaDadosCorporaisAberta] = useState<boolean>(false);
  const [telaRastreadorAguaAberta, setTelaRastreadorAguaAberta] = useState<boolean>(false);
  const [telaConfiguracoesJejumAberta, setTelaConfiguracoesJejumAberta] = useState<boolean>(false);

  // Modo de exibição do timer: 'decorrido' (progressivo) ou 'restante' (regressivo)
  const [modoTimer, setModoTimer] = useState<'decorrido' | 'restante'>('decorrido');

  // Meta diária de água (ml) com persistência
  const [metaAgua, setMetaAgua] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_meta_agua');
      if (salvo) return Number(salvo);
    }
    return 2500;
  });

  // Registro diário de água (em ml) sincronizado com o dia de hoje
  const [aguaConsumida, setAguaConsumida] = useState<number>(() => {
    const hojeStr = new Date().toISOString().slice(0, 10);
    if (usuario?.consumoAguaAtual?.dataStr === hojeStr && typeof usuario.consumoAguaAtual.consumidoMl === 'number') {
      return usuario.consumoAguaAtual.consumidoMl;
    }
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem(`jejuar_agua_${hojeStr}`);
      if (salvo !== null) {
        const num = Number(salvo);
        return isNaN(num) ? 0 : num;
      }
    }
    return 0;
  });

  // Histórico de ingestão de água dos últimos 7 dias para conquistas
  const [historicoAgua7Dias, setHistoricoAgua7Dias] = useState<RegistroConsumoAgua[]>([]);

  // Configurações do monitor de água salvas do usuário
  const [configAgua, setConfigAgua] = useState<ConfiguracaoMonitorAgua | null>(() => {
    if (usuario?.configuracaoAgua) return usuario.configuracaoAgua;
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_config_agua');
      if (salvo) {
        try {
          return JSON.parse(salvo);
        } catch {}
      }
    }
    return null;
  });

  // Carrega configurações e histórico de água salvas no Firestore
  useEffect(() => {
    if (usuario?.id) {
      buscarConfiguracaoAguaFirestore(usuario.id).then((cfg) => {
        if (cfg) {
          setConfigAgua(cfg);
          if (cfg.metaDiariaMl) {
            setMetaAgua(cfg.metaDiariaMl);
          }
        }
      }).catch((err) => console.warn('Aviso ao carregar config de água:', err));

      const hojeStr = new Date().toISOString().slice(0, 10);
      buscarHistoricoAguaFirestore(usuario.id, 7, metaAgua)
        .then((hist) => {
          setHistoricoAgua7Dias(hist);
          // Atualiza o consumo da tela principal com o valor real gravado no Firestore para hoje (iniciando em 0 caso não haja ingestão)
          const regHoje = hist.find((item) => item.dataStr === hojeStr);
          if (regHoje && typeof regHoje.consumidoMl === 'number') {
            setAguaConsumida(regHoje.consumidoMl);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`jejuar_agua_${hojeStr}`, String(regHoje.consumidoMl));
            }
          } else {
            setAguaConsumida(0);
          }
        })
        .catch((err) => console.warn('Aviso ao carregar histórico de água para conquistas:', err));
    }
  }, [usuario?.id, metaAgua]);

  // Monitoramento ativo de lembrete de água em primeiro plano (com o aplicativo aberto)
  useEffect(() => {
    if (!configAgua || !configAgua.lembreteAtivo) return;

    const verificarLembreteAguaInApp = () => {
      const agora = new Date();
      // Formata a hora no padrão 24h HH:mm
      const horaAtualStr = agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });

      const horaInicio = configAgua.horaInicio || '08:00';
      const horaFim = configAgua.horaFim || '21:00';

      // Modelo A: Converte horários em minutos absolutos do dia a partir de horaInicio
      const [hInicio, mInicio] = horaInicio.split(':').map(Number);
      const [hFim, mFim] = horaFim.split(':').map(Number);
      const [hAtual, mAtual] = horaAtualStr.split(':').map(Number);

      const minInicio = (hInicio || 8) * 60 + (mInicio || 0);
      const minFim = (hFim || 21) * 60 + (mFim || 0);
      const minAtual = (hAtual || 0) * 60 + (mAtual || 0);

      let minutosIntervalo = 60;
      if (typeof configAgua.intervalo === 'string') {
        if (configAgua.intervalo.includes('30 min')) minutosIntervalo = 30;
        else if (configAgua.intervalo.includes('1 hora')) minutosIntervalo = 60;
        else if (configAgua.intervalo.includes('2 hora')) minutosIntervalo = 120;
        else if (configAgua.intervalo.includes('3 hora')) minutosIntervalo = 180;
      }

      // Modelo A: Horário atual deve estar dentro da janela e ser exatamente um múltiplo a partir do início
      const estaNaJanela = minAtual >= minInicio && minAtual <= minFim;
      const ehHorarioDoSlot = (minAtual - minInicio) % minutosIntervalo === 0;

      if (estaNaJanela && ehHorarioDoSlot) {
        const hojeStr = agora.toISOString().slice(0, 10);
        const slotIdentificador = `${hojeStr}_${horaAtualStr}`;
        const cacheUltimoSlot = typeof window !== 'undefined' 
          ? localStorage.getItem('jejuar_ultimo_slot_agua_inapp')
          : null;

        // Dispara uma única vez durante o minuto exato do slot configurado
        if (cacheUltimoSlot !== slotIdentificador) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('jejuar_ultimo_slot_agua_inapp', slotIdentificador);
          }

          setToastConfig({
            visivel: true,
            titulo: '💧 Hora de se Hidratar!',
            mensagem: 'Mantenha seu metabolismo ativo durante o jejum. Beba um copo de água agora!',
          });

          // Toca um feedback sonoro suave se a Web Audio API estiver disponível
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const ctx = new AudioContextClass();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
              gain.gain.setValueAtTime(0.12, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            }
          } catch {}
        }
      }
    };

    // Avalia a cada 30 segundos com o app aberto e ao inicializar
    const intervalId = setInterval(verificarLembreteAguaInApp, 30 * 1000);
    verificarLembreteAguaInApp();

    return () => clearInterval(intervalId);
  }, [configAgua]);

  // Cálculo reativo das conquistas e medalhas em tempo real
  const conquistas = useMemo(() => {
    return calcularConquistasUsuario({
      diasConsecutivos,
      aguaConsumidaHoje: aguaConsumida,
      metaAguaHoje: metaAgua,
      historicoAgua7Dias,
      totalJejunsConcluidos: diasConsecutivos,
    });
  }, [diasConsecutivos, aguaConsumida, metaAgua, historicoAgua7Dias]);

  // Dados sincronizados do onboarding e dados corporais do usuário
  const [pesoAtual, setPesoAtual] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_peso_atual');
      if (salvo) return Number(salvo);
    }
    return usuario?.informacoesBasicas?.peso || 72.4;
  });
  const pesoDesejado = usuario?.informacoesBasicas?.pesoDesejado || 66.0;

  // Sincroniza estado de jejum quando as props do Firestore forem carregadas ou atualizadas
  useEffect(() => {
    if (usuario?.estadoJejum) {
      const ej = usuario.estadoJejum;
      if (ej.emJejum !== undefined) {
        setJejumAtivo(Boolean(ej.emJejum && ej.inicioTimestamp));
        if (typeof window !== 'undefined') {
          localStorage.setItem('jejuar_em_jejum', ej.emJejum ? 'true' : 'false');
        }
      }
      if (ej.inicioTimestamp) {
        setInicioTimestamp(ej.inicioTimestamp);
        if (typeof window !== 'undefined') {
          localStorage.setItem('jejuar_inicio_jejum_timestamp', ej.inicioTimestamp);
        }
      }
      if (ej.emJanelaAlimentacao !== undefined) {
        setEmJanelaAlimentacao(Boolean(ej.emJanelaAlimentacao && ej.inicioJanelaTimestamp));
        if (typeof window !== 'undefined') {
          localStorage.setItem('jejuar_em_janela_alimentacao', ej.emJanelaAlimentacao ? 'true' : 'false');
        }
      }
      if (ej.inicioJanelaTimestamp) {
        setInicioJanelaTimestamp(ej.inicioJanelaTimestamp);
        if (typeof window !== 'undefined') {
          localStorage.setItem('jejuar_inicio_janela_timestamp', ej.inicioJanelaTimestamp);
        }
      }
      if (ej.diasConsecutivos) {
        setDiasConsecutivos(ej.diasConsecutivos);
        if (typeof window !== 'undefined') {
          localStorage.setItem('jejuar_dias_consecutivos', String(ej.diasConsecutivos));
        }
      }
      if (ej.ultimoDiaConcluido) {
        setUltimoDiaConcluido(ej.ultimoDiaConcluido);
        if (typeof window !== 'undefined') {
          localStorage.setItem('jejuar_ultimo_dia', ej.ultimoDiaConcluido);
        }
      }
      if (ej.planoAtivoId) {
        setPlanoAtivo({
          id: ej.planoAtivoId,
          nome: ej.nomePlano || ej.planoAtivoId.replace('-', ':'),
          horasJejum: ej.metaHoras || 16,
          horasAlimentacao: Math.max(1, 24 - (ej.metaHoras || 16)),
          categoria: 'popular',
          rotuloDestaque: 'Plano Selecionado',
        });
      }
    }
  }, [usuario?.estadoJejum]);

  // Função mestre para recalcular os segundos absolutos em tempo real
  const recalcularTempoReal = useCallback(() => {
    if (jejumAtivo && inicioTimestamp) {
      const decorrido = calcularSegundosDecorridos(inicioTimestamp);
      setSegundosJejum(decorrido);
    } else if (!jejumAtivo) {
      setSegundosJejum(0);
    }

    if (emJanelaAlimentacao && inicioJanelaTimestamp) {
      const decorridoJanela = calcularSegundosDecorridos(inicioJanelaTimestamp);
      setSegundosJanela(decorridoJanela);
    } else if (!emJanelaAlimentacao) {
      setSegundosJanela(0);
    }
  }, [jejumAtivo, inicioTimestamp, emJanelaAlimentacao, inicioJanelaTimestamp]);

  // Recalcula imediatamente em tempo real e liga ouvintes de ciclo de vida do smartphone/PWA
  useEffect(() => {
    // 1. Executa recálculo imediato na inicialização ou mudança de estado
    recalcularTempoReal();

    // 2. Intervalo regular de 1s executando recálculo determinístico absoluto
    const intervalo = setInterval(() => {
      recalcularTempoReal();
    }, 1000);

    // 3. Ouvinte de visibilidade (disparado ao ligar a tela do celular ou reabrir o app)
    const handleVisibilidade = () => {
      if (document.visibilityState === 'visible') {
        recalcularTempoReal();
      }
    };

    // 4. Ouvinte de foco da janela (ao alternar entre abas ou aplicativos no celular)
    const handleFoco = () => {
      recalcularTempoReal();
    };

    // 5. Ouvinte de pageshow (retorno de cache em navegadores mobile)
    const handlePageShow = () => {
      recalcularTempoReal();
    };

    document.addEventListener('visibilitychange', handleVisibilidade);
    window.addEventListener('focus', handleFoco);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', handleVisibilidade);
      window.removeEventListener('focus', handleFoco);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [recalcularTempoReal]);

  // Formatação do tempo decorrido ou restante no timer
  const formatarTempo = (totalSegundos: number) => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  };

  // Metas e cálculos de contagem regressiva, progresso e tempo extra (overtime) do Jejum
  const totalSegundosMeta = (planoAtivo.horasJejum || 16) * 3600;
  const metaAlcancada = jejumAtivo && segundosJejum >= totalSegundosMeta;
  const segundosExtra = metaAlcancada ? segundosJejum - totalSegundosMeta : 0;
  const segundosRestantes = Math.max(0, totalSegundosMeta - segundosJejum);
  const porcentagemProgresso = jejumAtivo 
    ? Math.min(100, Math.max(0, (segundosJejum / totalSegundosMeta) * 100))
    : 0;

  // Cálculos da Janela de Alimentação Aberta
  const totalSegundosJanela = (planoAtivo.horasAlimentacao || 8) * 3600;
  const segundosRestantesJanela = Math.max(0, totalSegundosJanela - segundosJanela);
  const porcentagemProgressoJanela = emJanelaAlimentacao
    ? Math.min(100, Math.max(0, (segundosJanela / totalSegundosJanela) * 100))
    : 0;

  // Inicia um novo ciclo de jejum fechando a janela de alimentação
  const iniciarNovoCicloJejum = () => {
    const agoraIso = new Date().toISOString();
    setEmJanelaAlimentacao(false);
    setInicioJanelaTimestamp(null);
    setSegundosJanela(0);

    setJejumAtivo(true);
    setSegundosJejum(1);
    setInicioTimestamp(agoraIso);

    // Persiste instantaneamente no cache local do dispositivo
    if (typeof window !== 'undefined') {
      localStorage.setItem('jejuar_em_jejum', 'true');
      localStorage.setItem('jejuar_inicio_jejum_timestamp', agoraIso);
      localStorage.setItem('jejuar_em_janela_alimentacao', 'false');
      localStorage.removeItem('jejuar_inicio_janela_timestamp');
    }

    // Persiste o início imediato no Firestore
    if (usuario?.id) {
      salvarEstadoJejumUsuarioFirestore(usuario.id, {
        emJejum: true,
        inicioTimestamp: agoraIso,
        emJanelaAlimentacao: false,
        inicioJanelaTimestamp: null,
        planoAtivoId: planoAtivo.id,
        nomePlano: planoAtivo.nome,
        metaHoras: planoAtivo.horasJejum,
        diasConsecutivos,
      });
    }

    setToastConfig({
      visivel: true,
      titulo: '⏱️ Novo jejum iniciado!',
      mensagem: `Protocolo ${planoAtivo.nome} (${planoAtivo.horasJejum}h) ativado. Bom jejum!`,
    });
  };

  // Alterna o estado do jejum: se meta alcançada abre o modal de celebração, senão confirma encerramento
  const handleAlternarJejum = () => {
    if (emJanelaAlimentacao) {
      iniciarNovoCicloJejum();
      return;
    }

    if (jejumAtivo) {
      if (metaAlcancada) {
        setModalConcluirAberto(true);
      } else {
        setModalEncerrarAberto(true);
      }
    } else {
      iniciarNovoCicloJejum();
    }
  };

  // Confirmação para encerrar o jejum, registrar no histórico e abrir a janela de alimentação
  const confirmarEncerramentoJejum = async () => {
    const agoraIso = new Date().toISOString();
    const duracaoAtual = segundosJejum;
    const atingiuMeta = duracaoAtual >= (planoAtivo.horasJejum * 3600);
    const horasJanela = planoAtivo.horasAlimentacao || Math.max(1, 24 - planoAtivo.horasJejum);

    let novosDias = diasConsecutivos;
    let novoUltimoDia = ultimoDiaConcluido;

    // Registra na subcoleção do Firestore e ativa a Janela de Alimentação
    if (usuario?.id) {
      try {
        const resultado = await registrarHistoricoJejumFirestore(
          usuario.id,
          {
            planoId: planoAtivo.id,
            nomePlano: planoAtivo.nome,
            inicio: inicioTimestamp || agoraIso,
            fim: agoraIso,
            duracaoSegundos: duracaoAtual,
            metaHoras: planoAtivo.horasJejum,
            metaAtingida: atingiuMeta,
            aguaConsumidaMl: aguaConsumida,
          },
          diasConsecutivos,
          ultimoDiaConcluido,
          {
            abrirJanelaAlimentacao: true,
            horasJanelaAlimentacao: horasJanela,
          }
        );

        novosDias = resultado.novosDiasConsecutivos;
        novoUltimoDia = resultado.ultimoDiaAtualizado;
      } catch (err) {
        console.error("Erro ao registrar jejum no Firestore:", err);
      }
    } else {
      // Fallback sem usuário autenticado
      novosDias = diasConsecutivos + (atingiuMeta ? 1 : 0);
      novoUltimoDia = agoraIso.split('T')[0];
    }

    // Atualiza estados locais e cache no localStorage
    setJejumAtivo(false);
    setSegundosJejum(0);
    setInicioTimestamp(null);
    setDiasConsecutivos(novosDias);
    setUltimoDiaConcluido(novoUltimoDia);
    setModalEncerrarAberto(false);

    // Ativa a Janela de Alimentação
    setEmJanelaAlimentacao(true);
    setInicioJanelaTimestamp(agoraIso);
    setSegundosJanela(1);

    if (typeof window !== 'undefined') {
      localStorage.setItem('jejuar_em_jejum', 'false');
      localStorage.removeItem('jejuar_inicio_jejum_timestamp');
      localStorage.setItem('jejuar_em_janela_alimentacao', 'true');
      localStorage.setItem('jejuar_inicio_janela_timestamp', agoraIso);
      localStorage.setItem('jejuar_dias_consecutivos', String(novosDias));
      if (novoUltimoDia) localStorage.setItem('jejuar_ultimo_dia', novoUltimoDia);
    }

    // Toast comemorativo humanizado
    setToastConfig({
      visivel: true,
      titulo: atingiuMeta ? '🎉 Incrível! Jejum concluído com sucesso!' : '✅ Jejum encerrado',
      mensagem: atingiuMeta 
        ? `Você completou ${formatarTempo(duracaoAtual)} de jejum! Janela de alimentação aberta por ${horasJanela}h.`
        : `Sessão finalizada com ${formatarTempo(duracaoAtual)}. Sua janela de alimentação está aberta por ${horasJanela}h.`,
      dias: novosDias,
    });
  };

  // Atualização da data e hora de início customizada pelo modal
  const handleSalvarDataInicio = (novaData: Date) => {
    const agora = new Date();
    const diferencaSegundos = Math.max(0, Math.floor((agora.getTime() - novaData.getTime()) / 1000));
    const novaDataIso = novaData.toISOString();

    setInicioTimestamp(novaDataIso);
    setSegundosJejum(diferencaSegundos);

    if (typeof window !== 'undefined') {
      localStorage.setItem('jejuar_em_jejum', 'true');
      localStorage.setItem('jejuar_inicio_jejum_timestamp', novaDataIso);
    }

    if (usuario?.id && jejumAtivo) {
      salvarEstadoJejumUsuarioFirestore(usuario.id, {
        inicioTimestamp: novaDataIso,
      });
    }

    setToastConfig({
      visivel: true,
      titulo: '🕒 Horário atualizado com sucesso',
      mensagem: `Início ajustado para as ${String(novaData.getHours()).padStart(2, '0')}:${String(novaData.getMinutes()).padStart(2, '0')}.`,
    });
  };

  // Alterna o plano ativo e atualiza a meta de horas adaptando-se em tempo real
  const handleAlterarPlanoAtivo = (novoPlano: ProtocoloJejum) => {
    const planoAnterior = planoAtivo;
    setPlanoAtivo(novoPlano);
    setAbaAtiva('jejum');

    if (usuario?.id) {
      salvarEstadoJejumUsuarioFirestore(usuario.id, {
        planoAtivoId: novoPlano.id,
        nomePlano: novoPlano.nome,
        metaHoras: novoPlano.horasJejum,
      });
    }

    // Feedback contextual humanizado se o usuário estiver jejuando no momento da troca
    if (jejumAtivo) {
      const novoTotalSegundos = (novoPlano.horasJejum || 16) * 3600;
      const diferenca = novoTotalSegundos - segundosJejum;

      if (diferenca <= 0) {
        // Já completou o tempo da nova meta
        setToastConfig({
          visivel: true,
          titulo: '🎉 Meta alcançada com o novo plano!',
          mensagem: `Você já completou ${formatarTempo(segundosJejum)} e superou a meta de ${novoPlano.horasJejum}h do protocolo ${novoPlano.nome}! Pode concluir quando quiser.`,
        });
      } else if (novoPlano.horasJejum > planoAnterior.horasJejum) {
        // Meta foi estendida (ex: 16:8 -> 18:6)
        const horasRest = Math.floor(diferenca / 3600);
        const minRest = Math.floor((diferenca % 3600) / 60);
        const tempoRestTexto = horasRest > 0 ? `${horasRest}h ${minRest}m` : `${minRest}m`;

        setToastConfig({
          visivel: true,
          titulo: '🚀 Meta estendida com sucesso!',
          mensagem: `Seu jejum agora é de ${novoPlano.horasJejum}h (${novoPlano.nome}). Faltam ${tempoRestTexto} para sua meta. Sua nova janela de alimentação será de ${novoPlano.horasAlimentacao}h.`,
        });
      } else {
        // Meta foi reduzida
        const horasRest = Math.floor(diferenca / 3600);
        const minRest = Math.floor((diferenca % 3600) / 60);
        const tempoRestTexto = horasRest > 0 ? `${horasRest}h ${minRest}m` : `${minRest}m`;

        setToastConfig({
          visivel: true,
          titulo: '🎯 Meta ajustada!',
          mensagem: `Protocolo adaptado para ${novoPlano.nome} (${novoPlano.horasJejum}h). Faltam apenas ${tempoRestTexto} para concluir. Janela alimentar: ${novoPlano.horasAlimentacao}h.`,
        });
      }
    } else {
      // Jejum inativo - notificação padrão amigável
      setToastConfig({
        visivel: true,
        titulo: '✨ Plano atualizado!',
        mensagem: `Protocolo ${novoPlano.nome} definido como sua meta oficial (${novoPlano.horasJejum}h jejum / ${novoPlano.horasAlimentacao}h alimentação).`,
      });
    }
  };

  // Incrementa água consumida com persistência imediata no Firestore
  const adicionarAgua = () => {
    const novoValor = Math.min(10000, aguaConsumida + 250);
    setAguaConsumida(novoValor);

    const hojeStr = new Date().toISOString().slice(0, 10);
    salvarConsumoAguaFirestore(usuario?.id || '', hojeStr, novoValor, metaAgua);

    setToastConfig({
      visivel: true,
      titulo: '💧 +250ml registrados!',
      mensagem: `Você atingiu ${novoValor} ml de ${metaAgua} ml da sua meta diária.`
    });
  };

  /**
   * Recarrega todos os dados do Firestore e do usuário de forma reativa e instantânea
   */
  const handleRecarregarDados = useCallback(async () => {
    if (!usuario?.id) return;

    try {
      const hojeStr = new Date().toISOString().slice(0, 10);

      // 1. Recarrega dados do documento do usuário
      const dadosUsuario = await buscarDadosUsuarioFirestore(usuario.id);
      if (dadosUsuario) {
        if (dadosUsuario.estadoJejum) {
          const ej = dadosUsuario.estadoJejum;
          if (ej.emJejum !== undefined) setJejumAtivo(Boolean(ej.emJejum && ej.inicioTimestamp));
          if (ej.inicioTimestamp) {
            setInicioTimestamp(ej.inicioTimestamp);
            if (typeof window !== 'undefined') {
              localStorage.setItem('jejuar_inicio_jejum_timestamp', ej.inicioTimestamp);
              localStorage.setItem('jejuar_em_jejum', ej.emJejum ? 'true' : 'false');
            }
          }
          if (ej.emJanelaAlimentacao !== undefined) setEmJanelaAlimentacao(Boolean(ej.emJanelaAlimentacao && ej.inicioJanelaTimestamp));
          if (ej.inicioJanelaTimestamp) {
            setInicioJanelaTimestamp(ej.inicioJanelaTimestamp);
            if (typeof window !== 'undefined') {
              localStorage.setItem('jejuar_inicio_janela_timestamp', ej.inicioJanelaTimestamp);
              localStorage.setItem('jejuar_em_janela_alimentacao', ej.emJanelaAlimentacao ? 'true' : 'false');
            }
          }
          if (ej.diasConsecutivos) setDiasConsecutivos(ej.diasConsecutivos);
          if (ej.ultimoDiaConcluido) setUltimoDiaConcluido(ej.ultimoDiaConcluido);
        }
      }

      // 2. Recarrega dados de água
      const cfgAgua = await buscarConfiguracaoAguaFirestore(usuario.id);
      if (cfgAgua?.metaDiariaMl) {
        setMetaAgua(cfgAgua.metaDiariaMl);
      }

      const histAgua = await buscarHistoricoAguaFirestore(usuario.id, 7, cfgAgua?.metaDiariaMl || metaAgua);
      setHistoricoAgua7Dias(histAgua);
      const regHoje = histAgua.find((item) => item.dataStr === hojeStr);
      if (regHoje && typeof regHoje.consumidoMl === 'number') {
        setAguaConsumida(regHoje.consumidoMl);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`jejuar_agua_${hojeStr}`, String(regHoje.consumidoMl));
        }
      } else {
        setAguaConsumida(0);
      }

      // 3. Recarrega configurações de jejum
      const cfgJejum = await buscarConfiguracoesJejumFirestore(usuario.id);
      if (cfgJejum) {
        setModoTimer(cfgJejum.modoContagemRegressiva ? 'restante' : 'decorrido');
      }

      // Toast suave de sincronização concluída
      setToastConfig({
        visivel: true,
        titulo: '✨ Dados sincronizados com sucesso!',
        mensagem: 'Todos os seus registros e metas estão atualizados.',
      });
    } catch (err) {
      console.warn('Aviso durante atualização de dados:', err);
    }
  }, [usuario?.id, metaAgua]);

  // Hook do Pull-To-Refresh para a aba de Jejum
  const { 
    containerRef, 
    pullDistance, 
    isPulling, 
    isRefreshing, 
    isThresholdReached 
  } = usePullToRefresh({
    onRefresh: handleRecarregarDados,
  });

  /**
   * Cálculo dinâmico dos horários de início e término projetado
   */
  const obterHorariosDinamicos = () => {
    const agora = new Date();

    const formatarHora = (d: Date) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };

    const formatarDiaMes = (d: Date) => {
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes}`;
    };

    const obterRotuloDiaTermino = (d: Date) => {
      const hoje = new Date();
      if (d.toDateString() === hoje.toDateString()) return 'Hoje';
      
      const amanha = new Date(hoje);
      amanha.setDate(hoje.getDate() + 1);
      if (d.toDateString() === amanha.toDateString()) return 'Amanhã';

      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return diasSemana[d.getDay()];
    };

    if (emJanelaAlimentacao) {
      const dataInicioJanela = inicioJanelaTimestamp ? new Date(inicioJanelaTimestamp) : agora;
      const horasJanela = planoAtivo.horasAlimentacao || Math.max(1, 24 - planoAtivo.horasJejum);
      const dataFimJanela = new Date(dataInicioJanela.getTime() + horasJanela * 3600 * 1000);

      return {
        dataInicioObjeto: dataInicioJanela,
        rotuloInicio: 'Janela aberta',
        inicioFormatado: `${formatarDiaMes(dataInicioJanela)}, ${formatarHora(dataInicioJanela)}`,
        rotuloTermino: 'Próximo jejum',
        terminoFormatado: `${obterRotuloDiaTermino(dataFimJanela)}, ${formatarHora(dataFimJanela)}`,
        horaInicioInput: formatarHora(dataInicioJanela),
        horasJanela,
        janelaAlimentacaoFormatada: `${formatarHora(dataInicioJanela)} às ${formatarHora(dataFimJanela)}`,
      };
    }

    const dataInicio = (jejumAtivo && inicioTimestamp) 
      ? new Date(inicioTimestamp) 
      : agora;
    
    const horasMeta = planoAtivo.horasJejum || 16;
    const dataTermino = new Date(dataInicio.getTime() + horasMeta * 3600 * 1000);
    const horasJanela = planoAtivo.horasAlimentacao || Math.max(1, 24 - horasMeta);
    const dataFimJanela = new Date(dataTermino.getTime() + horasJanela * 3600 * 1000);

    return {
      dataInicioObjeto: dataInicio,
      rotuloInicio: 'Hora de início',
      inicioFormatado: `${formatarDiaMes(dataInicio)}, ${formatarHora(dataInicio)}`,
      rotuloTermino: 'Hora de término',
      terminoFormatado: `${obterRotuloDiaTermino(dataTermino)}, ${formatarHora(dataTermino)}`,
      horaInicioInput: formatarHora(dataInicio),
      horasJanela,
      janelaAlimentacaoFormatada: `${formatarHora(dataTermino)} às ${formatarHora(dataFimJanela)}`,
    };
  };

  const horarios = obterHorariosDinamicos();

  return (
    <div className="w-full h-screen max-h-screen bg-[#F5F9FC] text-[#0B2246] flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Toast Flutuante de Notificação no Topo (Safe Area) */}
      <ToastSucesso
        visivel={toastConfig.visivel}
        titulo={toastConfig.titulo}
        mensagem={toastConfig.mensagem}
        diasConsecutivos={toastConfig.dias}
        onFechar={() => setToastConfig(prev => ({ ...prev, visivel: false }))}
      />

      {/* Container responsivo mobile-first */}
      <div className="w-full max-w-[430px] h-screen max-h-screen bg-[#F5F9FC] relative flex flex-col shadow-2xl overflow-hidden" data-purpose="app-container">
        
        {/* Cabeçalho Padrão Unificado */}
        <AppHeader 
          diasConsecutivos={diasConsecutivos}
          onAbrirNotificacoes={() => setTelaCentralNotificacoesAberta(true)}
          notificacoesAtivas={notificacoesPushAtivas}
          totalNaoLidas={totalNaoLidasInternas}
          onAbrirAjustes={() => setTelaConfiguracoesJejumAberta(true)}
        />

        {/* Conteúdo Principal da Aba Jejum */}
        {abaAtiva === 'jejum' && (
          <main 
            ref={containerRef}
            className="flex-1 w-full px-4 pt-1 pb-24 overflow-y-auto space-y-4 relative" 
            data-purpose="main-fasting-content"
          >
            {/* Indicador Flutuante do Gestual Pull-To-Refresh */}
            <PullToRefreshIndicator
              pullDistance={pullDistance}
              isPulling={isPulling}
              isRefreshing={isRefreshing}
              isThresholdReached={isThresholdReached}
            />
            
            {/* Card Principal de Cronometragem e Horários */}
            <TimerJejumCard
              jejumAtivo={jejumAtivo}
              emJanelaAlimentacao={emJanelaAlimentacao}
              metaAlcancada={metaAlcancada}
              planoAtivo={planoAtivo}
              segundosJejum={segundosJejum}
              segundosJanela={segundosJanela}
              segundosExtra={segundosExtra}
              segundosRestantes={segundosRestantes}
              segundosRestantesJanela={segundosRestantesJanela}
              porcentagemProgresso={porcentagemProgresso}
              porcentagemProgressoJanela={porcentagemProgressoJanela}
              modoTimer={modoTimer}
              horarios={horarios}
              onAlternarModoTimer={() => setModoTimer(prev => prev === 'decorrido' ? 'restante' : 'decorrido')}
              onAcaoPrincipal={handleAlternarJejum}
              onEditarHorarioInicio={() => setModalEditarHorarioAberto(true)}
              formatarTempo={formatarTempo}
            />

            {/* Régua Horizontal dos Estágios Metabólicos */}
            <BannerEstagioMetabolico
              jejumAtivo={jejumAtivo}
              segundosJejum={segundosJejum}
              horasJejumMeta={planoAtivo.horasJejum || 16}
              onSelecionarEstagio={(estagio) => {
                setEstagioSelecionado(estagio);
                setModalEstagioAberto(true);
              }}
            />

            {/* Dica do Dia Baseada no Progresso Metabólico Atual */}
            <CardDicaDoDia
              jejumAtivo={jejumAtivo}
              emJanelaAlimentacao={emJanelaAlimentacao}
              segundosJejum={segundosJejum}
              horasJejumMeta={planoAtivo.horasJejum || 16}
            />

            {/* Grid 2x2 de Metas & Tarefas Diárias (Água, Peso, Calorias, Passos) */}
            <GridTarefasDiarias
              aguaConsumida={aguaConsumida}
              metaAgua={metaAgua}
              onAdicionarAgua={adicionarAgua}
              onAbrirRastreadorAgua={() => setTelaRastreadorAguaAberta(true)}
              pesoAtual={pesoAtual}
              pesoDesejado={pesoDesejado}
              onAbrirDadosCorporais={() => setTelaDadosCorporaisAberta(true)}
            />

            {/* Seção de Conquistas e Medalhas (Jejum Semanal, Mestre da Água, etc.) */}
            <SecaoConquistas
              conquistas={conquistas}
              onAbrirGaleria={() => setModalConquistasAberto(true)}
              onSelecionarConquista={(conquista) => setConquistaDetalheModal(conquista)}
            />

            {/* Seção Dica do Dia: Carrossel Educativo em Slide Horizontal com Timer Automático */}
            <CarrosselDicasDoDia />
          </main>
        )}

        {/* Conteúdo da Tela de Planos */}
        {abaAtiva === 'plano' && (
          <main className="flex-1 w-full px-4 pt-4 pb-24 overflow-y-auto" data-purpose="main-plan-content">
            <PlanoScreen 
              usuario={usuario}
              planoAtivoId={planoAtivo.id}
              onSelecionarPlano={handleAlterarPlanoAtivo}
            />
          </main>
        )}

        {/* Conteúdo da Tela de Exames e Bioimpedância (Substitui Aprender) */}
        {(abaAtiva === 'exames' || abaAtiva === 'aprender') && (
          <main className="flex-1 w-full px-4 pt-4 pb-24 overflow-y-auto" data-purpose="main-bioimpedancia-content">
            <BioimpedanciaScreen 
              usuario={usuario}
              onAtualizarPeso={(novo) => setPesoAtual(novo)}
            />
          </main>
        )}

        {/* Conteúdo da Tela de Jornada (Dashboard Visual de Gráficos Analíticos) */}
        {(abaAtiva === 'jornada' || abaAtiva === 'receitas') && (
          <main className="flex-1 w-full overflow-y-auto" data-purpose="main-jornada-content">
            <JornadaScreen 
              usuario={usuario}
              onAbrirRastreadorAgua={() => setTelaRastreadorAguaAberta(true)}
              onAbrirDadosCorporais={() => setTelaDadosCorporaisAberta(true)}
            />
          </main>
        )}

        {/* Conteúdo Completo da Tela de Perfil ("Eu") com Gamificação */}
        {abaAtiva === 'eu' && (
          <main className="flex-1 w-full overflow-y-auto" data-purpose="main-perfil-content">
            <PerfilScreen 
              usuario={usuario}
              onMudarAba={(novaAba) => setAbaAtiva(novaAba)}
              onAbrirDadosCorporais={() => setTelaDadosCorporaisAberta(true)}
              onAbrirRastreadorAgua={() => setTelaRastreadorAguaAberta(true)}
              onAbrirNotificacoes={() => setTelaCentralNotificacoesAberta(true)}
            />
          </main>
        )}

        {/* Barra de Navegação Inferior Global Reutilizável */}
        <MenuInferior 
          abaAtiva={abaAtiva} 
          onMudarAba={(novaAba) => setAbaAtiva(novaAba)} 
        />
      </div>

      {/* Modal de Confirmação para Encerrar Jejum */}
      <ModalConfirmacao
        aberto={modalEncerrarAberto}
        titulo="Encerrar jejum atual?"
        mensagem="Você está fazendo um ótimo progresso! Deseja realmente finalizar o timer de jejum agora?"
        textoConfirmar="Sim, encerrar"
        textoCancelar="Continuar jejuando"
        variante="aviso"
        onConfirmar={confirmarEncerramentoJejum}
        onCancelar={() => setModalEncerrarAberto(false)}
      />

      {/* Modal para Ajustar Horário de Início */}
      <ModalDefinirHoraInicio
        aberto={modalEditarHorarioAberto}
        dataInicioAtual={horarios.dataInicioObjeto}
        onSalvar={handleSalvarDataInicio}
        onFechar={() => setModalEditarHorarioAberto(false)}
      />

      {/* Modal Científico dos Estágios Metabólicos */}
      <ModalEstagioJejum
        aberto={modalEstagioAberto}
        estagio={estagioSelecionado}
        horasJejumAtuais={jejumAtivo ? segundosJejum / 3600 : 0}
        emJejum={jejumAtivo}
        onFechar={() => setModalEstagioAberto(false)}
      />

      {/* Modal Celebrativo de Conclusão com Meta Atingida */}
      <ModalConcluirJejum
        aberto={modalConcluirAberto}
        nomePlano={planoAtivo.nome}
        metaHoras={planoAtivo.horasJejum}
        duracaoSegundos={segundosJejum}
        aguaConsumidaMl={aguaConsumida}
        diasConsecutivos={diasConsecutivos}
        onConfirmarConclusao={() => {
          setModalConcluirAberto(false);
          confirmarEncerramentoJejum();
        }}
        onContinuarJejuando={() => setModalConcluirAberto(false)}
      />

      {/* Tela Cheia de Dados Corporais (Cobre integralmente o container) */}
      {telaDadosCorporaisAberta && (
        <DadosCorporaisScreen
          usuario={{
            ...usuario!,
            informacoesBasicas: {
              ...(usuario?.informacoesBasicas || {}),
              peso: pesoAtual,
              pesoDesejado,
            }
          }}
          onVoltar={() => setTelaDadosCorporaisAberta(false)}
          onAtualizarPeso={(novo) => setPesoAtual(novo)}
        />
      )}

      {/* Tela Cheia de Rastreador de Água (Cobre integralmente com animação de ondas e histórico) */}
      {telaRastreadorAguaAberta && (
        <RastreadorAguaScreen
          usuario={usuario}
          aguaConsumidaHoje={aguaConsumida}
          onAtualizarAguaHoje={(novaQtd) => setAguaConsumida(novaQtd)}
          onVoltar={() => setTelaRastreadorAguaAberta(false)}
        />
      )}

      {/* Tela Cheia de Configurações de Jejum e Notificações */}
      {telaConfiguracoesJejumAberta && (
        <ConfiguracoesJejumScreen
          usuario={usuario}
          onVoltar={() => setTelaConfiguracoesJejumAberta(false)}
          onRedefinirPlano={() => {
            setTelaConfiguracoesJejumAberta(false);
            setAbaAtiva('plano');
          }}
          onAlternarModoTimer={(modoRegressivo) => {
            setModoTimer(modoRegressivo ? 'restante' : 'decorrido');
          }}
        />
      )}

      {/* Modal Bottom Sheet da Galeria Completa de Conquistas */}
      <ModalGaleriaConquistas
        aberto={modalConquistasAberto}
        conquistas={conquistas}
        onFechar={() => setModalConquistasAberto(false)}
        onSelecionarConquista={(conquista) => setConquistaDetalheModal(conquista)}
      />

      {/* Modal de Detalhe Exclusivo de uma Única Conquista */}
      <ModalDetalheConquista
        conquista={conquistaDetalheModal}
        onFechar={() => setConquistaDetalheModal(null)}
      />

      {/* Tela Cheia da Central de Notificações Internas */}
      {telaCentralNotificacoesAberta && (
        <CentralNotificacoesScreen
          usuarioId={usuario?.id || ''}
          onVoltar={() => setTelaCentralNotificacoesAberta(false)}
          onAtualizarContadorNaoLidas={setTotalNaoLidasInternas}
          onNavegarParaAcao={(destino) => {
            setTelaCentralNotificacoesAberta(false);
            if (destino === 'agua') {
              setTelaRastreadorAguaAberta(true);
            } else if (destino === 'peso') {
              setTelaDadosCorporaisAberta(true);
            } else if (destino === 'plano') {
              setAbaAtiva('plano');
            } else if (destino === 'jejum') {
              setAbaAtiva('jejum');
            } else if (destino === 'bioimpedancia' || destino === 'exames') {
              setAbaAtiva('exames');
            }
          }}
        />
      )}
    </div>
  );
};
