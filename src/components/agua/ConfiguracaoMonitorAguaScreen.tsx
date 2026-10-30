/**
 * @file ConfiguracaoMonitorAguaScreen.tsx
 * @description Tela completa de Configuração do Monitoramento de Água fiel à imagem de referência.
 * Título: "Monitoramento de água".
 * Permite ativar lembretes, escolher sons, horários (início e fim), intervalos, meta diária e unidade (ml / fl oz).
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import type { ConfiguracaoMonitorAgua } from '../../types';
import { ModalEditarMetaAgua } from './ModalEditarMetaAgua';
import { ModalSomLembreteAgua } from './ModalSomLembreteAgua';
import { ModalHoraLembreteAgua } from './ModalHoraLembreteAgua';
import { ModalIntervaloLembreteAgua } from './ModalIntervaloLembreteAgua';
import { sincronizarAssinaturaSilenciosa } from '../../services/pushNotificationService';

interface ConfiguracaoMonitorAguaScreenProps {
  configuracao: ConfiguracaoMonitorAgua;
  pesoUsuarioKg?: number;
  usuarioId?: string;
  onSalvarConfiguracao: (novaConfig: ConfiguracaoMonitorAgua) => void;
  onVoltar: () => void;
}

export const ConfiguracaoMonitorAguaScreen: React.FC<ConfiguracaoMonitorAguaScreenProps> = ({
  configuracao,
  pesoUsuarioKg = 72.4,
  usuarioId = '',
  onSalvarConfiguracao,
  onVoltar,
}) => {
  const [config, setConfig] = useState<ConfiguracaoMonitorAgua>(configuracao);
  const [modalMetaAberto, setModalMetaAberto] = useState<boolean>(false);
  
  // Controle dos modais específicos
  const [modalSeletorAberto, setModalSeletorAberto] = useState<null | 'som' | 'iniciar' | 'fim' | 'intervalo'>(null);

  // Auto-cura ao entrar na tela: se os lembretes estiverem ativos, garante que o aparelho está ativo no servidor
  useEffect(() => {
    if (usuarioId && config.lembreteAtivo) {
      sincronizarAssinaturaSilenciosa(usuarioId).catch(() => {});
    }
  }, [usuarioId, config.lembreteAtivo]);

  const atualizarParcial = (campos: Partial<ConfiguracaoMonitorAgua>) => {
    const atualizado = { ...config, ...campos };
    setConfig(atualizado);
    onSalvarConfiguracao(atualizado);
  };

  const handleToggleLembrete = () => {
    const novoStatus = !config.lembreteAtivo;
    atualizarParcial({ lembreteAtivo: novoStatus });
    if (novoStatus && usuarioId) {
      sincronizarAssinaturaSilenciosa(usuarioId, true).catch(() => {});
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#F5F9FC] text-[#092244] flex flex-col justify-between items-center select-none overflow-hidden animate-in slide-in-from-right duration-200"
      role="region"
      aria-label="Configuração do Monitoramento de Água"
    >
      <div className="w-full max-w-[430px] h-screen max-h-screen bg-[#F5F9FC] relative flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Bar / Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#092244] active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          
          <h1 className="text-[18px] sm:text-[19px] font-black text-[#092244] truncate max-w-[260px] text-center">
            Monitoramento de água
          </h1>

          <div className="w-10" aria-hidden="true" />
        </header>

        {/* Conteúdo com Scroll */}
        <main className="flex-1 w-full px-4 py-5 overflow-y-auto space-y-4">
          
          {/* Card 1: Lembrete de beber água */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100/80 divide-y divide-gray-100">
            {/* Linha Switch: Lembrete de beber água */}
            <div className="flex items-center justify-between py-3 first:pt-1">
              <span className="font-bold text-[15px] text-[#092244]">
                Lembrete de beber água
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={config.lembreteAtivo}
                onClick={handleToggleLembrete}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                  config.lembreteAtivo ? 'bg-[#00C975]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    config.lembreteAtivo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Linha: Som do lembrete */}
            <button
              type="button"
              disabled={!config.lembreteAtivo}
              onClick={() => setModalSeletorAberto('som')}
              className={`w-full flex items-center justify-between py-3 text-left transition-colors min-h-[48px] ${
                !config.lembreteAtivo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50/50'
              }`}
            >
              <span className="font-semibold text-[15px] text-[#092244]">
                Som do lembrete
              </span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-[14px] font-medium text-gray-500">
                  {config.somLembrete}
                </span>
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </div>
            </button>

            {/* Linha: Iniciar */}
            <button
              type="button"
              disabled={!config.lembreteAtivo}
              onClick={() => setModalSeletorAberto('iniciar')}
              className={`w-full flex items-center justify-between py-3 text-left transition-colors min-h-[48px] ${
                !config.lembreteAtivo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50/50'
              }`}
            >
              <span className="font-semibold text-[15px] text-[#092244]">
                Iniciar
              </span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-[14px] font-medium text-gray-500 tabular-nums">
                  {config.horaInicio}
                </span>
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </div>
            </button>

            {/* Linha: Fim */}
            <button
              type="button"
              disabled={!config.lembreteAtivo}
              onClick={() => setModalSeletorAberto('fim')}
              className={`w-full flex items-center justify-between py-3 text-left transition-colors min-h-[48px] ${
                !config.lembreteAtivo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50/50'
              }`}
            >
              <span className="font-semibold text-[15px] text-[#092244]">
                Fim
              </span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-[14px] font-medium text-gray-500 tabular-nums">
                  {config.horaFim}
                </span>
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </div>
            </button>

            {/* Linha: Intervalos de tempo */}
            <button
              type="button"
              disabled={!config.lembreteAtivo}
              onClick={() => setModalSeletorAberto('intervalo')}
              className={`w-full flex items-center justify-between py-3 last:pb-1 text-left transition-colors min-h-[48px] ${
                !config.lembreteAtivo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50/50'
              }`}
            >
              <span className="font-semibold text-[15px] text-[#092244]">
                Intervalos de tempo
              </span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-[14px] font-medium text-gray-500">
                  {config.intervalo}
                </span>
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </div>
            </button>
          </div>

          {/* Card 2: Meta diária de água e Unidades de medida */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100/80 divide-y divide-gray-100">
            {/* Meta diária de água */}
            <button
              type="button"
              onClick={() => setModalMetaAberto(true)}
              className="w-full flex items-center justify-between py-3.5 first:pt-1 text-left hover:bg-gray-50/50 transition-colors min-h-[48px] cursor-pointer"
            >
              <span className="font-bold text-[15px] text-[#092244]">
                Meta diária de água
              </span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-[14px] font-semibold text-gray-500 tabular-nums">
                  {config.metaDiariaMl} {config.unidade}
                </span>
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </div>
            </button>

            {/* Unidades de medida */}
            <div className="flex items-center justify-between py-3.5 last:pb-1">
              <span className="font-bold text-[15px] text-[#092244]">
                Unidades de medida
              </span>
              <div className="flex items-center p-1 bg-[#F0F6FF] rounded-xl border border-blue-50">
                <button
                  type="button"
                  onClick={() => atualizarParcial({ unidade: 'ml' })}
                  className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    config.unidade === 'ml'
                      ? 'bg-white text-[#2F80ED] shadow-xs'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ml
                </button>
                <button
                  type="button"
                  onClick={() => atualizarParcial({ unidade: 'fl oz' })}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    config.unidade === 'fl oz'
                      ? 'bg-white text-[#2F80ED] shadow-xs'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  fl oz
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Meta Diária */}
      <ModalEditarMetaAgua
        aberto={modalMetaAberto}
        metaAtualMl={config.metaDiariaMl}
        pesoUsuarioKg={pesoUsuarioKg}
        onSalvar={(novaMeta) => atualizarParcial({ metaDiariaMl: novaMeta })}
        onFechar={() => setModalMetaAberto(false)}
      />

      {/* 1. Modal de Som do Lembrete */}
      <ModalSomLembreteAgua
        aberto={modalSeletorAberto === 'som'}
        somAtual={config.somLembrete}
        onSalvar={(novoSom) => atualizarParcial({ somLembrete: novoSom })}
        onFechar={() => setModalSeletorAberto(null)}
      />

      {/* 2. Modal de Hora de Início */}
      <ModalHoraLembreteAgua
        aberto={modalSeletorAberto === 'iniciar'}
        tipo="inicio"
        horaAtual={config.horaInicio}
        onSalvar={(novaHora) => atualizarParcial({ horaInicio: novaHora })}
        onFechar={() => setModalSeletorAberto(null)}
      />

      {/* 3. Modal de Hora de Término */}
      <ModalHoraLembreteAgua
        aberto={modalSeletorAberto === 'fim'}
        tipo="fim"
        horaAtual={config.horaFim}
        onSalvar={(novaHora) => atualizarParcial({ horaFim: novaHora })}
        onFechar={() => setModalSeletorAberto(null)}
      />

      {/* 4. Modal de Intervalo de Tempo (Estritamente as 4 opções) */}
      <ModalIntervaloLembreteAgua
        aberto={modalSeletorAberto === 'intervalo'}
        intervaloAtual={config.intervalo}
        onSalvar={(novoIntervalo) => atualizarParcial({ intervalo: novoIntervalo })}
        onFechar={() => setModalSeletorAberto(null)}
      />
    </div>
  );
};
