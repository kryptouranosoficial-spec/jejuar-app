/**
 * @file NotificacaoPesoScreen.tsx
 * @description Tela de configurações da Notificação de Peso (conforme imagem de referência 7).
 * Permite alternar o lembrete de pesagem, horário, frequência de dias e som do alerta.
 */

import React, { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { ConfiguracoesNotificacoes } from '../../types';
import { ModalDefinirHoraLembrete } from './ModalDefinirHoraLembrete';
import { ModalEscolherDiasLembrete, DIAS_DA_SEMANA } from './ModalEscolherDiasLembrete';
import { ModalEscolherSomLembrete } from './ModalEscolherSomLembrete';

interface NotificacaoPesoScreenProps {
  /** Objeto com o estado atual das notificações */
  notificacoes: ConfiguracoesNotificacoes;
  /** Callback acionado ao alterar qualquer opção de notificação de peso */
  onAtualizarNotificacoes: (novasNotificacoes: Partial<ConfiguracoesNotificacoes>) => void;
  /** Callback acionado ao voltar para a tela anterior de Notificação */
  onVoltar: () => void;
}

export const NotificacaoPesoScreen: React.FC<NotificacaoPesoScreenProps> = ({
  notificacoes,
  onAtualizarNotificacoes,
  onVoltar,
}) => {
  const [modalHoraAberto, setModalHoraAberto] = useState<boolean>(false);
  const [modalDiasAberto, setModalDiasAberto] = useState<boolean>(false);
  const [modalSomAberto, setModalSomAberto] = useState<boolean>(false);

  // Converte a string de dias para array consumível pelo ModalEscolherDiasLembrete
  const obterArrayDias = (): string[] => {
    const texto = notificacoes.pesoDias || 'Todos os dias';
    if (texto === 'Todos os dias' || texto === 'Todos') {
      return DIAS_DA_SEMANA;
    }
    return texto.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const handleSalvarDias = (novosDias: string[]) => {
    if (novosDias.length === DIAS_DA_SEMANA.length || novosDias.length === 0) {
      onAtualizarNotificacoes({ pesoDias: 'Todos os dias' });
    } else {
      onAtualizarNotificacoes({ pesoDias: novosDias.join(', ') });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F9FC] select-none">
      
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar para Notificações"
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#092244] active:scale-90 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>
        <h1 className="text-[19px] font-extrabold text-[#092244] tracking-tight">
          Notificação de peso
        </h1>
      </header>

      {/* Conteúdo do Card Inset */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          {/* Lembrete de registro de peso */}
          <div className="flex items-center justify-between p-4 min-h-[52px]">
            <span className="text-[15px] font-semibold text-[#092244]">
              Lembrete de registro de peso
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={notificacoes.pesoLembreteAtivo}
              onClick={() => onAtualizarNotificacoes({ pesoLembreteAtivo: !notificacoes.pesoLembreteAtivo })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                notificacoes.pesoLembreteAtivo ? 'bg-[#00C975]' : 'bg-slate-200'
              }`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                notificacoes.pesoLembreteAtivo ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Hora do lembrete */}
          <button
            type="button"
            disabled={!notificacoes.pesoLembreteAtivo}
            onClick={() => setModalHoraAberto(true)}
            className={`w-full flex items-center justify-between p-4 min-h-[52px] text-left transition-colors ${
              !notificacoes.pesoLembreteAtivo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'
            }`}
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Hora do lembrete
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
              <span className="tabular-nums font-semibold text-slate-600">{notificacoes.pesoHora || '08:00'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Dia do lembrete */}
          <button
            type="button"
            disabled={!notificacoes.pesoLembreteAtivo}
            onClick={() => setModalDiasAberto(true)}
            className={`w-full flex items-center justify-between p-4 min-h-[52px] text-left transition-colors ${
              !notificacoes.pesoLembreteAtivo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'
            }`}
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Dia do lembrete
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium max-w-[200px]">
              <span className="truncate font-medium text-slate-600">{notificacoes.pesoDias || 'Todos os dias'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </button>

          {/* Som do lembrete */}
          <button
            type="button"
            disabled={!notificacoes.pesoLembreteAtivo}
            onClick={() => setModalSomAberto(true)}
            className={`w-full flex items-center justify-between p-4 min-h-[52px] text-left transition-colors ${
              !notificacoes.pesoLembreteAtivo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'
            }`}
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Som do lembrete
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
              <span className="font-medium text-slate-600">{notificacoes.pesoSom || 'Padrão'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

        </div>
      </main>

      {/* Modal Seletor de Horário */}
      <ModalDefinirHoraLembrete
        aberto={modalHoraAberto}
        horaAtual={notificacoes.pesoHora || '08:00'}
        onSalvar={(novaHora) => onAtualizarNotificacoes({ pesoHora: novaHora })}
        onFechar={() => setModalHoraAberto(false)}
      />

      {/* Modal Seletor de Dias da Semana */}
      <ModalEscolherDiasLembrete
        aberto={modalDiasAberto}
        diasSelecionados={obterArrayDias()}
        onSalvar={handleSalvarDias}
        onFechar={() => setModalDiasAberto(false)}
      />

      {/* Modal Seletor de Som */}
      <ModalEscolherSomLembrete
        aberto={modalSomAberto}
        somAtual={notificacoes.pesoSom || 'Padrão'}
        onSalvar={(novoSom) => onAtualizarNotificacoes({ pesoSom: novoSom })}
        onFechar={() => setModalSomAberto(false)}
      />
    </div>
  );
};
