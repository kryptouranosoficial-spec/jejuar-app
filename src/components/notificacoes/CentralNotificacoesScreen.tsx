/**
 * @file CentralNotificacoesScreen.tsx
 * @description Tela completa de Central de Notificações Internas do aplicativo Jejuar.
 * Exibe avisos da administração, comunicados da equipe e conquistas alcançadas.
 * Permite filtrar por abas (Todas, Avisos, Conquistas), marcar como lidas e excluir com modal de confirmação.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  CheckCheck, 
  Bell, 
  Trophy, 
  Droplet, 
  Flame, 
  Scale, 
  Sparkles, 
  Trash2, 
  ChevronRight,
  Inbox
} from 'lucide-react';
import type { NotificacaoInterna, CategoriaNotificacaoInterna } from '../../types/notificacoesInternas';
import {
  listarNotificacoesInternas,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  excluirNotificacaoInterna,
  contarNaoLidas,
  obterCacheLocal,
  gerarNotificacoesInaugurais
} from '../../services/notificacoesInternasService';
import { ModalConfirmacao } from '../ModalConfirmacao';

interface CentralNotificacoesScreenProps {
  /** ID do usuário autenticado */
  usuarioId: string;
  /** Callback acionado ao voltar para a tela anterior */
  onVoltar: () => void;
  /** Callback para navegação rápida de acordo com o link de ação (ex: 'jejum', 'agua', 'plano') */
  onNavegarParaAcao?: (destino: string) => void;
  /** Callback de atualização do total de não lidas para o badge do AppHeader */
  onAtualizarContadorNaoLidas?: (totalNaoLidas: number) => void;
}

type FiltroCategoria = 'todas' | 'aviso' | 'conquista';

export const CentralNotificacoesScreen: React.FC<CentralNotificacoesScreenProps> = ({
  usuarioId,
  onVoltar,
  onNavegarParaAcao,
  onAtualizarContadorNaoLidas,
}) => {
  // Inicializa imediatamente com cache local ou inaugurais para eliminar qualquer flicker ou piscamento
  const [notificacoes, setNotificacoes] = useState<NotificacaoInterna[]>(() => {
    const cache = obterCacheLocal(usuarioId);
    if (cache.length > 0) return cache;
    return gerarNotificacoesInaugurais();
  });
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroCategoria>('todas');
  const [carregando, setCarregando] = useState<boolean>(false);
  const [notificacaoParaExcluir, setNotificacaoParaExcluir] = useState<NotificacaoInterna | null>(null);

  // Referência estável para o callback para nunca causar loops de re-renderização
  const callbackBadgeRef = useRef(onAtualizarContadorNaoLidas);
  useEffect(() => {
    callbackBadgeRef.current = onAtualizarContadorNaoLidas;
  });

  // Sincroniza em segundo plano silenciosamente sem travar ou piscar a interface
  useEffect(() => {
    let ativo = true;

    async function sincronizarRemoto() {
      try {
        const lista = await listarNotificacoesInternas(usuarioId);
        if (ativo && lista.length > 0) {
          setNotificacoes(lista);
          callbackBadgeRef.current?.(contarNaoLidas(lista));
        }
      } catch (err) {
        console.warn('Aviso ao sincronizar notificações internas:', err);
      }
    }

    sincronizarRemoto();

    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  // Total de mensagens não lidas
  const totalNaoLidas = useMemo(() => contarNaoLidas(notificacoes), [notificacoes]);

  // Lista filtrada com base na pílula selecionada
  const notificacoesFiltradas = useMemo(() => {
    if (filtroAtivo === 'todas') return notificacoes;
    return notificacoes.filter((item) => item.categoria === filtroAtivo);
  }, [notificacoes, filtroAtivo]);

  // Formata timestamp relativo amigável em Pt-br
  const formatarDataRelativa = (iso: string): string => {
    try {
      const data = new Date(iso);
      const agora = new Date();
      const diffMs = agora.getTime() - data.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHoras = Math.floor(diffMin / 60);
      const diffDias = Math.floor(diffHoras / 24);

      if (diffMin < 2) return 'Agora mesmo';
      if (diffMin < 60) return `Há ${diffMin} min`;
      if (diffHoras < 24) {
        return `Hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      if (diffDias === 1) {
        return `Ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return 'Recente';
    }
  };

  // Marca uma notificação individual como lida
  const handleMarcarComoLida = async (item: NotificacaoInterna) => {
    if (item.lida) return;
    const atualizadas = notificacoes.map((n) => (n.id === item.id ? { ...n, lida: true } : n));
    setNotificacoes(atualizadas);
    onAtualizarContadorNaoLidas?.(contarNaoLidas(atualizadas));
    await marcarNotificacaoComoLida(usuarioId, item.id);
  };

  // Marca todas as notificações como lidas de uma só vez
  const handleMarcarTodasComoLidas = async () => {
    if (totalNaoLidas === 0) return;
    const atualizadas = notificacoes.map((n) => ({ ...n, lida: true }));
    setNotificacoes(atualizadas);
    onAtualizarContadorNaoLidas?.(0);
    await marcarTodasNotificacoesComoLidas(usuarioId);
  };

  // Executa a exclusão após confirmação no modal
  const handleConfirmarExclusao = async () => {
    if (!notificacaoParaExcluir) return;
    const idExcluir = notificacaoParaExcluir.id;
    setNotificacaoParaExcluir(null);

    const atualizadas = notificacoes.filter((n) => n.id !== idExcluir);
    setNotificacoes(atualizadas);
    onAtualizarContadorNaoLidas?.(contarNaoLidas(atualizadas));
    await excluirNotificacaoInterna(usuarioId, idExcluir);
  };

  // Ação ao clicar no botão contextual de um card
  const handleExecutarAcao = (item: NotificacaoInterna) => {
    handleMarcarComoLida(item);
    if (item.acaoLink && onNavegarParaAcao) {
      onNavegarParaAcao(item.acaoLink);
    }
  };

  // Renderiza o ícone correspondente com estilo semântico
  const renderIconeNotificacao = (icone?: string, categoria?: CategoriaNotificacaoInterna) => {
    const estiloBase = 'w-5 h-5 stroke-[2]';

    switch (icone) {
      case 'trophy':
        return <Trophy className={`${estiloBase} text-amber-500`} />;
      case 'flame':
        return <Flame className={`${estiloBase} text-orange-500`} />;
      case 'droplet':
        return <Droplet className={`${estiloBase} text-blue-500`} />;
      case 'scale':
        return <Scale className={`${estiloBase} text-emerald-600`} />;
      case 'sparkles':
        return <Sparkles className={`${estiloBase} text-indigo-500`} />;
      default:
        return categoria === 'conquista' ? (
          <Trophy className={`${estiloBase} text-amber-500`} />
        ) : (
          <Bell className={`${estiloBase} text-[#00C975]`} />
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#F5F9FC] text-[#092244] flex flex-col justify-between items-center select-none overflow-hidden animate-in slide-in-from-right duration-200"
      role="region"
      aria-label="Central de Notificações Internas"
    >
      <div className="w-full max-w-[430px] h-screen max-h-screen bg-[#F5F9FC] relative flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header com Botão Voltar e Ação de Marcar Lidas */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar para a tela inicial"
            className="w-11 h-11 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#092244] active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-extrabold text-[#092244] tracking-tight">
              Notificações
            </h1>
            {totalNaoLidas > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                {totalNaoLidas}
              </span>
            )}
          </div>

          {/* Botão Marcar Todas como Lidas */}
          <button
            type="button"
            disabled={totalNaoLidas === 0}
            onClick={handleMarcarTodasComoLidas}
            aria-label="Marcar todas como lidas"
            title="Marcar todas como lidas"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              totalNaoLidas > 0 
                ? 'text-[#00C975] hover:bg-emerald-50 active:scale-90' 
                : 'text-slate-300 opacity-40 cursor-not-allowed'
            }`}
          >
            <CheckCheck className="w-5 h-5 stroke-[2.2]" />
          </button>
        </header>

        {/* Pílulas de Filtro (Todas, Avisos, Conquistas) */}
        <nav className="w-full px-4 py-3 bg-white/70 backdrop-blur-xs border-b border-slate-100 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setFiltroAtivo('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer ${
              filtroAtivo === 'todas'
                ? 'bg-[#092244] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>Todas</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
              filtroAtivo === 'todas' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {notificacoes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroAtivo('aviso')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer ${
              filtroAtivo === 'aviso'
                ? 'bg-[#00C975] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Avisos da Equipe</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroAtivo('conquista')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer ${
              filtroAtivo === 'conquista'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Conquistas</span>
          </button>

        </nav>

        {/* Lista de Notificações com Scroll Suave */}
        <main className="flex-1 w-full px-4 py-4 overflow-y-auto space-y-3">
          
          {carregando ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-xs font-medium">Carregando mensagens...</span>
            </div>
          ) : notificacoesFiltradas.length === 0 ? (
            /* Estado Vazio Humanizado (Empty State) */
            <div className="w-full py-20 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <Inbox className="w-8 h-8 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-extrabold text-[#092244]">
                Nenhuma notificação por aqui
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                {filtroAtivo === 'todas'
                  ? 'Você está em dia com tudo! Novos avisos da equipe e conquistas aparecerão aqui.'
                  : `Nenhuma notificação encontrada na categoria selecionada.`}
              </p>
            </div>
          ) : (
            notificacoesFiltradas.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarcarComoLida(item)}
                className={`w-full rounded-2xl p-4 transition-all border relative flex flex-col gap-2.5 cursor-pointer ${
                  !item.lida
                    ? 'bg-white border-emerald-200/80 shadow-sm ring-1 ring-emerald-500/10'
                    : 'bg-white/80 border-slate-100 hover:bg-white'
                }`}
              >
                {/* Cabeçalho do Card: Ícone, Remetente, Horário e Lixeira */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                      !item.lida ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
                    }`}>
                      {renderIconeNotificacao(item.icone, item.categoria)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-extrabold text-[#092244]">
                          {item.remetente || 'Equipe Jejuar'}
                        </span>
                        {!item.lida && (
                          <span className="w-2 h-2 rounded-full bg-[#00C975] ring-2 ring-emerald-100" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatarDataRelativa(item.dataIso)}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Excluir Notificação com Touch Target Mínimo de 44x44px */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificacaoParaExcluir(item);
                    }}
                    aria-label={`Excluir notificação: ${item.titulo}`}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Conteúdo da Notificação */}
                <div className="space-y-1">
                  <h4 className={`text-sm font-bold ${!item.lida ? 'text-[#092244]' : 'text-slate-700'}`}>
                    {item.titulo}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.mensagem}
                  </p>
                </div>

                {/* Botão de Ação Contextual (se houver) */}
                {item.acaoTexto && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecutarAcao(item);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-[#092244] hover:text-[#00C975] border border-slate-200/70 hover:border-emerald-200 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer min-h-[36px]"
                    >
                      <span>{item.acaoTexto}</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

        </main>

        {/* Rodapé Seguro com Indicador de Leitura */}
        <footer className="px-4 py-3 bg-white border-t border-slate-100 text-center shrink-0">
          <p className="text-[11px] text-slate-400 font-medium">
            Toque em uma notificação para marcar como lida
          </p>
        </footer>

      </div>

      {/* Modal de Confirmação Profissional de Exclusão */}
      <ModalConfirmacao
        aberto={Boolean(notificacaoParaExcluir)}
        titulo="Excluir notificação?"
        mensagem="Esta mensagem será removida permanentemente da sua central de notificações."
        textoConfirmar="Excluir"
        textoCancelar="Cancelar"
        variante="perigo"
        onConfirmar={handleConfirmarExclusao}
        onCancelar={() => setNotificacaoParaExcluir(null)}
      />
    </div>
  );
};
