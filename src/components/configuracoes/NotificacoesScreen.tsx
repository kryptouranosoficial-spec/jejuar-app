/**
 * @file NotificacoesScreen.tsx
 * @description Subtela principal de Notificações (conforme imagem de referência 4).
 * Gerencia a navegação para as configurações específicas de Jejum, Água e Peso,
 * além do Período de não perturbe e exibição do status na barra do sistema.
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Send, 
  Loader2, 
  Check, 
  Activity, 
  RefreshCw, 
  Trash2, 
  Clock, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck 
} from 'lucide-react';
import type { ConfiguracoesNotificacoes, ConfiguracaoMonitorAgua } from '../../types';
import { NotificacaoJejumScreen } from './NotificacaoJejumScreen';
import { ConfiguracaoMonitorAguaScreen } from '../agua/ConfiguracaoMonitorAguaScreen';
import { NotificacaoPesoScreen } from './NotificacaoPesoScreen';
import { 
  buscarConfiguracaoAguaFirestore, 
  salvarConfiguracaoAguaFirestore 
} from '../../services/firebase';
import { 
  solicitarPermissaoEAssinarPush, 
  testarEnvioPushServidor,
  sincronizarAssinaturaSilenciosa
} from '../../services/pushNotificationService';
import { 
  agendarGradeNativaAgua, 
  ehAmbienteNativo, 
  dispararTesteNotificacaoNativa 
} from '../../services/localNotificationService';



interface NotificacoesScreenProps {
  /** ID do usuário autenticado para validação de push */
  usuarioId?: string;
  /** Peso do usuário em kg para cálculo inteligente de meta de água */
  pesoUsuarioKg?: number;
  /** Estado atual das notificações */
  notificacoes: ConfiguracoesNotificacoes;
  /** Callback acionado ao atualizar qualquer parâmetro das notificações */
  onAtualizarNotificacoes: (novasNotificacoes: Partial<ConfiguracoesNotificacoes>) => void;
  /** Callback acionado ao clicar na seta voltar */
  onVoltar: () => void;
}

type SubtelaNotificacao = 'menu' | 'jejum' | 'agua' | 'peso';

interface ItemHistoricoDisparo {
  id: string;
  tipo: string;
  status: 'sucesso' | 'erro' | 'info';
  detalhe: string;
  fcmStatus?: string | number | null;
  dataHoraFormatada?: string;
  timestamp?: { seconds: number; nanoseconds: number } | string;
}

export const NotificacoesScreen: React.FC<NotificacoesScreenProps> = ({
  usuarioId,
  pesoUsuarioKg = 72.4,
  notificacoes,
  onAtualizarNotificacoes,
  onVoltar,
}) => {
  const [subtela, setSubtela] = useState<SubtelaNotificacao>('menu');

  // Estado sincronizado da configuração de água
  const [configAgua, setConfigAgua] = useState<ConfiguracaoMonitorAgua>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_config_agua');
      if (salvo) {
        try {
          return JSON.parse(salvo);
        } catch {}
      }
    }
    return {
      lembreteAtivo: notificacoes.aguaLembreteAtivo ?? true,
      somLembrete: notificacoes.aguaSom || 'Padrão',
      horaInicio: notificacoes.aguaHoraInicio || '08:00',
      horaFim: notificacoes.aguaHoraFim || '21:00',
      intervalo: notificacoes.aguaIntervalo || 'A cada 1 hora',
      metaDiariaMl: 2500,
      unidade: 'ml'
    };
  });

  // Estados do Painel de Diagnóstico e Auditoria de Disparos
  const [painelDiagnosticoAberto, setPainelDiagnosticoAberto] = useState<boolean>(false);
  const [historicoLogs, setHistoricoLogs] = useState<ItemHistoricoDisparo[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState<boolean>(false);
  const [totalDispositivosAtivos, setTotalDispositivosAtivos] = useState<number | null>(null);
  const [limpandoInativos, setLimpandoInativos] = useState<boolean>(false);
  const [mensagemAvisoLimpeza, setMensagemAvisoLimpeza] = useState<string | null>(null);

  // Carrega configuração salva no Firestore para garantir paridade total
  useEffect(() => {
    let ativo = true;
    if (usuarioId) {
      buscarConfiguracaoAguaFirestore(usuarioId).then((salva) => {
        if (ativo && salva) {
          setConfigAgua(salva);
        }
      }).catch(() => {});
    }
    return () => { ativo = false; };
  }, [usuarioId]);

  const [testandoPush, setTestandoPush] = useState<boolean>(false);
  const [statusTeste, setStatusTeste] = useState<'ocioso' | 'sucesso' | 'erro'>('ocioso');

  // Função centralizada para carregar métricas do painel de diagnóstico
  const carregarDiagnostico = async () => {
    if (!usuarioId) return;
    setCarregandoHistorico(true);
    try {
      // 1. Consulta dispositivos ativos cadastrados no Firestore
      const resStatus = await fetch(`/api/notificacoes/status-dispositivo/${usuarioId}`);
      if (resStatus.ok) {
        const dataStatus = await resStatus.json();
        setTotalDispositivosAtivos(dataStatus.totalAtivos ?? 0);
      }

      // 2. Consulta histórico de disparos reais
      const resHist = await fetch(`/api/notificacoes/historico/${usuarioId}`);
      if (resHist.ok) {
        const dataHist = await resHist.json();
        setHistoricoLogs(dataHist.historico || []);
      }
    } catch (err) {
      console.warn('[Diagnóstico] Erro ao carregar histórico:', err);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  // Auto-Ativação Automática ao abrir a tela: renova o token com o Google FCM e atualiza o diagnóstico
  useEffect(() => {
    let ativo = true;
    if (usuarioId) {
      // 1. Carrega status e histórico imediatamente
      carregarDiagnostico();

      // 2. Tenta renovar e reativar silenciosamente em segundo plano sem exigir cliques
      sincronizarAssinaturaSilenciosa(usuarioId, true).then(() => {
        if (ativo) carregarDiagnostico();
      }).catch(() => {});
    }
    return () => { ativo = false; };
  }, [usuarioId]);

  // Atualiza os dados de diagnóstico quando o painel for aberto
  useEffect(() => {
    if (painelDiagnosticoAberto) {
      carregarDiagnostico();
    }
  }, [painelDiagnosticoAberto, usuarioId]);

  // Função para efetuar limpeza de dispositivos inativos do banco
  const handleLimparInativos = async () => {
    if (!usuarioId || limpandoInativos) return;
    setLimpandoInativos(true);
    setMensagemAvisoLimpeza(null);
    try {
      const res = await fetch('/api/notificacoes/limpar-inativos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId })
      });
      const data = await res.json();
      if (data.sucesso) {
        setMensagemAvisoLimpeza(data.mensagem || 'Limpeza realizada com sucesso.');
        await carregarDiagnostico();
      }
    } catch (err) {
      console.error('Erro ao limpar dispositivos:', err);
    } finally {
      setLimpandoInativos(false);
      setTimeout(() => setMensagemAvisoLimpeza(null), 5000);
    }
  };

  const handleTestarNotificacao = async () => {
    if (testandoPush) return;
    setTestandoPush(true);
    setStatusTeste('ocioso');

    try {
      // 1. Se estiver rodando dentro do aplicativo nativo (.apk), testa o hardware diretamente
      if (ehAmbienteNativo()) {
        const resultadoNativo = await dispararTesteNotificacaoNativa();
        if (resultadoNativo.sucesso) {
          setStatusTeste('sucesso');
        } else {
          setStatusTeste('erro');
        }
        return;
      }

      // 2. Se estiver na Web / PWA, utiliza a rota de teste do servidor
      if (!usuarioId) {
        setStatusTeste('erro');
        return;
      }

      await solicitarPermissaoEAssinarPush(usuarioId);
      const res = await testarEnvioPushServidor(usuarioId);
      if (res.sucesso) {
        setStatusTeste('sucesso');
      } else {
        setStatusTeste('erro');
      }
    } catch (e: any) {
      console.error('Erro no teste de notificação:', e);
      setStatusTeste('erro');
    } finally {
      setTestandoPush(false);
      carregarDiagnostico();
      setTimeout(() => setStatusTeste('ocioso'), 7000);
    }
  };


  // Estado reativo em tempo real do status de permissão no navegador/Chrome

  const [statusPermissaoNativa, setStatusPermissaoNativa] = useState<NotificationPermission | 'nao_suportado'>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'nao_suportado';
  });

  // Atualiza dinamicamente a permissão quando a janela ganha foco ou muda de visibilidade
  useEffect(() => {
    const atualizarStatus = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setStatusPermissaoNativa(Notification.permission);
      }
    };

    window.addEventListener('focus', atualizarStatus);
    document.addEventListener('visibilitychange', atualizarStatus);

    return () => {
      window.removeEventListener('focus', atualizarStatus);
      document.removeEventListener('visibilitychange', atualizarStatus);
    };
  }, []);

  const permissaoGranted = statusPermissaoNativa === 'granted';
  const permissaoDenied = statusPermissaoNativa === 'denied';
  const temDispositivoAtivo = (totalDispositivosAtivos ?? 0) > 0;
  const prontoParaProximoAlerta = permissaoGranted && temDispositivoAtivo;

  // Detecta o fuso horário atual configurado no navegador
  const fusoNavegador = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'America/Sao_Paulo';

  if (subtela === 'jejum') {
    return (
      <NotificacaoJejumScreen
        usuarioId={usuarioId}
        notificacoes={notificacoes}
        onAtualizarNotificacoes={onAtualizarNotificacoes}
        onVoltar={() => setSubtela('menu')}
      />
    );
  }

  if (subtela === 'agua') {
    return (
      <ConfiguracaoMonitorAguaScreen
        configuracao={configAgua}
        pesoUsuarioKg={pesoUsuarioKg}
        usuarioId={usuarioId}
        onSalvarConfiguracao={(nova) => {
          setConfigAgua(nova);
          salvarConfiguracaoAguaFirestore(usuarioId || '', nova);
          onAtualizarNotificacoes({
            aguaLembreteAtivo: nova.lembreteAtivo,
            aguaSom: nova.somLembrete,
            aguaHoraInicio: nova.horaInicio,
            aguaHoraFim: nova.horaFim,
            aguaIntervalo: nova.intervalo,
          });

          // Agenda no hardware nativo do celular (Capacitor) se estiver em ambiente .apk
          agendarGradeNativaAgua({
            horaInicio: nova.horaInicio,
            horaFim: nova.horaFim,
            intervaloTexto: nova.intervalo,
            lembreteAtivo: nova.lembreteAtivo
          }).catch(() => {});
        }}
        onVoltar={() => setSubtela('menu')}
      />
    );
  }

  if (subtela === 'peso') {
    return (
      <NotificacaoPesoScreen
        notificacoes={notificacoes}
        onAtualizarNotificacoes={onAtualizarNotificacoes}
        onVoltar={() => setSubtela('menu')}
      />
    );
  }


  return (
    <div className="w-full h-full flex flex-col bg-[#F5F9FC] select-none transition-colors">
      
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar para Configurações de jejum"
          className="w-11 h-11 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#092244] active:scale-90 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>
        <h1 className="text-[19px] font-extrabold text-[#092244] tracking-tight">
          Notificação
        </h1>
      </header>

      {/* Conteúdo com Cartões Agrupados */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* PAINEL DE STATUS EM TEMPO REAL — TRANSPARÊNCIA TOTAL */}
        <div className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col gap-3 ${
          prontoParaProximoAlerta
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900 ring-1 ring-emerald-500/20'
            : permissaoDenied
              ? 'bg-rose-50 border-rose-200 text-rose-900 ring-1 ring-rose-500/20'
              : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${
                prontoParaProximoAlerta
                  ? 'bg-emerald-500 ring-4 ring-emerald-200'
                  : permissaoDenied
                    ? 'bg-rose-500 ring-4 ring-rose-200'
                    : 'bg-amber-500 ring-4 ring-amber-200'
              }`} />
              <span className="text-xs font-black uppercase tracking-wider">
                {prontoParaProximoAlerta
                  ? 'Alertas 100% Prontos para os Próximos Horários'
                  : permissaoDenied
                    ? 'Notificações Bloqueadas no Google Chrome'
                    : 'Ativação de Alertas Pendente'}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200/80 text-slate-700 font-mono">
              {String(statusPermissaoNativa).toUpperCase()}
            </span>
          </div>

          <div className="text-xs space-y-1.5 leading-relaxed font-medium">
            {prontoParaProximoAlerta ? (
              <div className="flex flex-col gap-1">
                <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Seu aparelho está autorizado e conectado com o servidor na nuvem!
                </p>
                <p className="text-[11px] text-emerald-700">
                  Os lembretes de hidratação e jejum chegarão pontualmente na sua tela de bloqueio com o aplicativo fechado.
                </p>
              </div>
            ) : permissaoDenied ? (
              <div className="flex flex-col gap-2">
                <p className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  O Google Chrome do seu celular bloqueou as permissões deste site.
                </p>
                <div className="p-3 rounded-xl bg-white/95 border border-rose-200 text-[11px] text-rose-900 space-y-1">
                  <p className="font-bold text-rose-800">Como liberar no Chrome em 2 passos rápidos:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Toque no ícone de <strong>Cadeado 🔒 ou Ajustes</strong> ao lado do endereço na barra do navegador.</li>
                    <li>Acesse <strong>Permissões</strong> e altere Notificações para <strong>Permitir</strong>.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <p className="text-amber-800">
                Toque no botão de testar abaixo para conceder a permissão nativa de notificações ao seu navegador.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          <button
            type="button"
            onClick={() => setSubtela('jejum')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors cursor-pointer min-h-[52px]"
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Jejum
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setSubtela('agua')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors cursor-pointer min-h-[52px]"
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Água
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setSubtela('peso')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors cursor-pointer min-h-[52px]"
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Peso
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

        </div>

        {/* Grupo 2: Período de não perturbe */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-4 min-h-[64px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-[#092244]">
                Período de não perturbe
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {notificacoes.naoPerturbeHoraInicio || '23:00'} ~ Dia seguinte {notificacoes.naoPerturbeHoraFim || '07:00'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificacoes.naoPerturbeAtivo}
              onClick={() => onAtualizarNotificacoes({ naoPerturbeAtivo: !notificacoes.naoPerturbeAtivo })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                notificacoes.naoPerturbeAtivo ? 'bg-[#00C975]' : 'bg-slate-200'
              }`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                notificacoes.naoPerturbeAtivo ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Grupo 3: Teste de Notificação Instantâneo no Aparelho */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <button
            type="button"
            disabled={testandoPush}
            onClick={handleTestarNotificacao}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors cursor-pointer min-h-[64px] disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                statusTeste === 'sucesso' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : statusTeste === 'erro' 
                    ? 'bg-rose-50 text-rose-500' 
                    : 'bg-blue-50 text-[#2F80ED]'
              }`}>
                {testandoPush ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : statusTeste === 'sucesso' ? (
                  <Check className="w-5 h-5 text-emerald-500 stroke-[2.5]" />
                ) : (
                  <Send className="w-5 h-5 stroke-[2.2]" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#092244]">
                  {testandoPush ? 'Disparando alerta...' : 'Testar notificação no celular'}
                </span>
                <span className="text-xs text-slate-400">
                  {statusTeste === 'sucesso'
                    ? 'Notificação enviada! Verifique o topo do celular'
                    : statusTeste === 'erro'
                      ? 'Não foi possível entregar. Toque para tentar novamente'
                      : 'Envia um alerta imediato para validar este aparelho'}
                </span>
              </div>
            </div>
            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${
              statusTeste === 'sucesso'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-blue-50 text-[#2F80ED] border-blue-100'
            }`}>
              {testandoPush ? 'Enviando...' : statusTeste === 'sucesso' ? 'Enviado!' : 'Testar'}
            </div>
          </button>
        </div>

        {/* Grupo 4: PAINEL DE DIAGNÓSTICO & HISTÓRICO DE DISPAROS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden transition-all">
          
          {/* Cabeçalho do Card Expansível */}
          <button
            type="button"
            onClick={() => setPainelDiagnosticoAberto(!painelDiagnosticoAberto)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors cursor-pointer min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#092244]">
                  Diagnóstico e Histórico de Alertas
                </span>
                <span className="text-xs text-slate-400">
                  {painelDiagnosticoAberto ? 'Toque para recolher o painel de auditoria' : 'Acompanhe as respostas e o status do servidor FCM'}
                </span>
              </div>
            </div>
            <div className="p-2 text-slate-400 hover:text-slate-600">
              {painelDiagnosticoAberto ? (
                <ChevronUp className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <ChevronDown className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>
          </button>

          {/* Conteúdo Expandido do Diagnóstico */}
          {painelDiagnosticoAberto && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-4">
              
              {/* Badges do Sistema e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Aparelho Ativo</span>
                    <span className="text-xs font-bold text-[#092244]">
                      {totalDispositivosAtivos === null 
                        ? 'Verificando...' 
                        : totalDispositivosAtivos > 0 
                          ? `${totalDispositivosAtivos} dispositivo registrado` 
                          : 'Nenhum ativo'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fuso Horário</span>
                    <span className="text-xs font-bold text-[#092244] truncate">
                      {fusoNavegador}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas de Diagnóstico */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={carregarDiagnostico}
                  disabled={carregandoHistorico}
                  className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-xs font-bold text-[#092244] min-h-[44px] cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${carregandoHistorico ? 'animate-spin' : ''}`} />
                  Atualizar Histórico
                </button>

                <button
                  type="button"
                  onClick={handleLimparInativos}
                  disabled={limpandoInativos}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95 transition-all text-xs font-bold min-h-[44px] cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {limpandoInativos ? 'Limpando...' : 'Limpar Inativos'}
                </button>
              </div>

              {mensagemAvisoLimpeza && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {mensagemAvisoLimpeza}
                </div>
              )}

              {/* Lista do Histórico de Registros de Disparos */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Últimos Disparos do Servidor
                </span>

                {carregandoHistorico && historicoLogs.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    Carregando histórico do Firestore...
                  </div>
                ) : historicoLogs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Nenhum disparo registrado ainda neste dispositivo. Clique no botão &quot;Testar&quot; acima para registrar o primeiro evento.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {historicoLogs.map((item) => {
                      const isSucesso = item.status === 'sucesso';
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold">
                              {isSucesso ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              )}
                              <span className={isSucesso ? 'text-emerald-700 uppercase tracking-wide' : 'text-rose-600 uppercase tracking-wide'}>
                                {item.tipo || 'alerta'}
                              </span>
                              {item.fcmStatus && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">
                                  FCM: {item.fcmStatus}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.dataHoraFormatada || 'Horário recente'}
                            </span>
                          </div>
                          <p className="text-slate-600 font-normal leading-relaxed">
                            {item.detalhe}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
};
