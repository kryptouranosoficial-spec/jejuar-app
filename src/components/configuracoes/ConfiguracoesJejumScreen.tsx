/**
 * @file ConfiguracoesJejumScreen.tsx
 * @description Tela principal de Configurações de Jejum (conforme imagem de referência 2).
 * Exibe o modo contagem regressiva, hora de início do jejum diário, notificações, início automático,
 * formato de exibição no calendário e redefinição do plano de jejum ativo.
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Timer, 
  Clock, 
  Bell, 
  Power, 
  RotateCcw 
} from 'lucide-react';
import type { UsuarioEmCadastro, ConfiguracoesJejum } from '../../types';
import { 
  buscarConfiguracoesJejumFirestore, 
  salvarConfiguracoesJejumFirestore,
  CONFIGURACAO_JEJUM_PADRAO 
} from '../../services/firebase';
import { ModalHoraInicioJejum } from './ModalHoraInicioJejum';
import { NotificacoesScreen } from './NotificacoesScreen';

interface ConfiguracoesJejumScreenProps {
  /** Dados do usuário atualmente logado */
  usuario?: UsuarioEmCadastro;
  /** Callback acionado para retornar à tela de Jejum (Home) */
  onVoltar: () => void;
  /** Callback acionado ao redefinir ou alterar o plano (abre a PlanoScreen) */
  onRedefinirPlano: () => void;
  /** Callback para sincronizar a alteração do modo do timer com a tela de início */
  onAlternarModoTimer?: (modoRegressivo: boolean) => void;
}

type SubVisaoConfig = 'main' | 'notificacoes';

export const ConfiguracoesJejumScreen: React.FC<ConfiguracoesJejumScreenProps> = ({
  usuario,
  onVoltar,
  onRedefinirPlano,
  onAlternarModoTimer,
}) => {
  const [subVisao, setSubVisao] = useState<SubVisaoConfig>('main');
  const [modalHoraAberto, setModalHoraAberto] = useState<boolean>(false);

  // Estado das configurações completas
  const [config, setConfig] = useState<ConfiguracoesJejum>(() => CONFIGURACAO_JEJUM_PADRAO);

  // Carrega as configurações do Firestore/LocalStorage ao montar a tela
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const dadosSalvos = await buscarConfiguracoesJejumFirestore(usuario?.id || '');
        if (ativo) {
          setConfig(dadosSalvos);
        }
      } catch (err) {
        console.warn('Aviso ao carregar configurações de jejum:', err);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [usuario?.id]);

  // Função auxiliar para atualizar e salvar configurações
  const atualizarConfiguracao = (novasPartes: Partial<ConfiguracoesJejum>) => {
    setConfig((prev) => {
      const atualizado = { ...prev, ...novasPartes };
      salvarConfiguracoesJejumFirestore(usuario?.id || '', atualizado);
      return atualizado;
    });
  };

  // Alterna o modo contagem regressiva
  const handleToggleModoContagem = () => {
    const novoValor = !config.modoContagemRegressiva;
    atualizarConfiguracao({ modoContagemRegressiva: novoValor });
    if (onAlternarModoTimer) {
      onAlternarModoTimer(novoValor);
    }
  };

  // Alterna o início automático
  const handleToggleInicioAutomatico = () => {
    atualizarConfiguracao({ inicioAutomatico: !config.inicioAutomatico });
  };

  // Salva nova hora de início diária
  const handleSalvarNovaHoraInicio = (novaHora: string) => {
    atualizarConfiguracao({ horaInicioDiaria: novaHora });
  };

  // Atualiza subcampo das notificações
  const handleAtualizarNotificacoes = (subcampos: Partial<typeof config.notificacoes>) => {
    const novasNotificacoes = {
      ...config.notificacoes,
      ...subcampos,
    };
    atualizarConfiguracao({ notificacoes: novasNotificacoes });
  };

  // Subtela de Notificações
  if (subVisao === 'notificacoes') {
    return (
      <div className="fixed inset-0 z-40 bg-[#F5F9FC] text-[#092244] flex flex-col justify-between items-center select-none overflow-hidden animate-in fade-in duration-200">
        <div className="w-full max-w-[430px] h-screen max-h-screen bg-[#F5F9FC] relative flex flex-col shadow-2xl overflow-hidden">
          <NotificacoesScreen
            usuarioId={usuario?.id}
            pesoUsuarioKg={usuario?.informacoesBasicas?.peso || 72.4}
            notificacoes={config.notificacoes}
            onAtualizarNotificacoes={handleAtualizarNotificacoes}
            onVoltar={() => setSubVisao('main')}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-40 bg-[#F5F9FC] text-[#092244] flex flex-col justify-between items-center select-none overflow-hidden animate-in fade-in duration-200"
      role="region"
      aria-label="Configurações de jejum em tela cheia"
    >
      <div className="w-full max-w-[430px] h-screen max-h-screen bg-[#F5F9FC] relative flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabeçalho */}
        <header className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar para a tela principal"
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#092244] active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          <h1 className="text-[19px] font-extrabold text-[#092244] tracking-tight">
            Configurações de jejum
          </h1>
        </header>

        {/* Lista de Opções Inset com Scroll */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
            
            {/* 1. Modo contagem regressiva */}
            <div className="flex items-center justify-between p-4 min-h-[68px]">
              <div className="flex items-start gap-3.5 pr-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Timer className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-[#092244]">
                    Modo contagem regressiva
                  </span>
                  <span className="text-xs text-slate-400 font-medium leading-snug">
                    Contagem regressiva para mostrar o tempo restante
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={config.modoContagemRegressiva}
                onClick={handleToggleModoContagem}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  config.modoContagemRegressiva ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  config.modoContagemRegressiva ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* 2. Hora de início do jejum diário */}
            <button
              type="button"
              onClick={() => setModalHoraAberto(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors cursor-pointer min-h-[64px]"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-[#092244]">
                    Hora de início do jejum diário
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {config.horaInicioDiaria || '19:00'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* 3. Notificação */}
            <button
              type="button"
              onClick={() => setSubVisao('notificacoes')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors cursor-pointer min-h-[60px]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[15px] font-bold text-[#092244]">
                  Notificação
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* 4. Início automático em jejum */}
            <div className="flex items-center justify-between p-4 min-h-[68px]">
              <div className="flex items-start gap-3.5 pr-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Power className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-[#092244]">
                    Início automático em jejum
                  </span>
                  <span className="text-xs text-slate-400 font-medium leading-snug">
                    O rastreador começará a contar automaticamente no horário de início do jejum
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={config.inicioAutomatico}
                onClick={handleToggleInicioAutomatico}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  config.inicioAutomatico ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  config.inicioAutomatico ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* 6. Redefinir seu plano */}
            <button
              type="button"
              onClick={onRedefinirPlano}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors cursor-pointer min-h-[60px]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[15px] font-bold text-[#092244]">
                  Redefinir seu plano
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

          </div>
        </main>

        {/* Modal Selecionar Hora de Início */}
        <ModalHoraInicioJejum
          aberto={modalHoraAberto}
          horaAtual={config.horaInicioDiaria || '19:00'}
          onFechar={() => setModalHoraAberto(false)}
          onSalvar={handleSalvarNovaHoraInicio}
        />

      </div>
    </div>
  );
};
