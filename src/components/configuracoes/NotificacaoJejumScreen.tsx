/**
 * @file NotificacaoJejumScreen.tsx
 * @description Tela de detalhes das Notificações do Jejum (conforme imagem de referência 5).
 * Permite alternar os alertas de início/término, selecionar sons e configurar lembretes do processo de jejum.
 */

import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { ConfiguracoesNotificacoes } from '../../types';

interface NotificacaoJejumScreenProps {
  /** ID do usuário autenticado para validação de push */
  usuarioId?: string;
  /** Objeto com o estado atual das notificações */
  notificacoes: ConfiguracoesNotificacoes;
  /** Callback acionado ao alterar qualquer opção de notificação */
  onAtualizarNotificacoes: (novasNotificacoes: Partial<ConfiguracoesNotificacoes>) => void;
  /** Callback acionado para voltar para a tela anterior de Notificação */
  onVoltar: () => void;
}

export const NotificacaoJejumScreen: React.FC<NotificacaoJejumScreenProps> = ({
  usuarioId,
  notificacoes,
  onAtualizarNotificacoes,
  onVoltar,
}) => {

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
          Notificação de jejum
        </h1>
      </header>

      {/* Conteúdo com Scroll */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        
        {/* Seção 1: Lembrete de início/término */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Lembrete de início/término
          </h2>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
            
            {/* O jejum começou */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                O jejum começou
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejumInicioAtivo}
                onClick={() => onAtualizarNotificacoes({ jejumInicioAtivo: !notificacoes.jejumInicioAtivo })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejumInicioAtivo ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejumInicioAtivo ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Som de início */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                Som de início
              </span>
              <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
                <span>{notificacoes.jejumInicioSom || 'Padrão'}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* O jejum terminou */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                O jejum terminou
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejumFimAtivo}
                onClick={() => onAtualizarNotificacoes({ jejumFimAtivo: !notificacoes.jejumFimAtivo })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejumFimAtivo ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejumFimAtivo ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Som de término */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                Som de término
              </span>
              <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
                <span>{notificacoes.jejumFimSom || 'Padrão'}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: Processo de jejum */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Processo de jejum
          </h2>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
            
            {/* 2h antes do início */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                2h antes do início do jejum
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejum2hAntesInicio}
                onClick={() => onAtualizarNotificacoes({ jejum2hAntesInicio: !notificacoes.jejum2hAntesInicio })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejum2hAntesInicio ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejum2hAntesInicio ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* 1h antes do início */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                1h antes do início do jejum
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejum1hAntesInicio}
                onClick={() => onAtualizarNotificacoes({ jejum1hAntesInicio: !notificacoes.jejum1hAntesInicio })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejum1hAntesInicio ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejum1hAntesInicio ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* 3h após o início */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                3h após o início do jejum
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejum3hAposInicio}
                onClick={() => onAtualizarNotificacoes({ jejum3hAposInicio: !notificacoes.jejum3hAposInicio })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejum3hAposInicio ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejum3hAposInicio ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Início do jejum perdido */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                Início do jejum perdido
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejumInicioPerdido}
                onClick={() => onAtualizarNotificacoes({ jejumInicioPerdido: !notificacoes.jejumInicioPerdido })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejumInicioPerdido ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejumInicioPerdido ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* 2h antes do término */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                2h antes do término do jejum
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejum2hAntesFim}
                onClick={() => onAtualizarNotificacoes({ jejum2hAntesFim: !notificacoes.jejum2hAntesFim })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejum2hAntesFim ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejum2hAntesFim ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* 1h antes do término */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                1h antes do término do jejum
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejum1hAntesFim}
                onClick={() => onAtualizarNotificacoes({ jejum1hAntesFim: !notificacoes.jejum1hAntesFim })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejum1hAntesFim ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejum1hAntesFim ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Término do jejum perdido */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="text-[15px] font-semibold text-[#092244]">
                Término do jejum perdido
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificacoes.jejumFimPerdido}
                onClick={() => onAtualizarNotificacoes({ jejumFimPerdido: !notificacoes.jejumFimPerdido })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificacoes.jejumFimPerdido ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  notificacoes.jejumFimPerdido ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};
