/**
 * @file AppHeader.tsx
 * @description Cabeçalho padrão unificado do aplicativo Jejuar.
 * Compartilhado identicamente entre as telas de Jejum (Início), Plano e futuras seções.
 * Contém o logotipo oficial, badge com chamas de dias consecutivos, dia dinâmico do mês
 * e botão de ajustes/metas com touch targets acessíveis (mínimo de 44x44px).
 */

import React from 'react';
import { Flame, Sliders, Bell } from 'lucide-react';
import { vibrarClique } from '../utils/haptics';

interface AppHeaderProps {
  /** Quantidade de dias consecutivos no aplicativo (padrão: 1) */
  diasConsecutivos?: number;
  /** Callback acionado ao clicar no botão de notificações */
  onAbrirNotificacoes?: () => void;
  /** Indicador se as notificações estão ativas */
  notificacoesAtivas?: boolean;
  /** Quantidade de notificações internas não lidas para o badge */
  totalNaoLidas?: number;
  /** Callback acionado ao clicar no botão de calendário */
  onAbrirCalendario?: () => void;
  /** Callback acionado ao clicar no botão de configurações/ajustes */
  onAbrirAjustes?: () => void;
  /** Callback acionado ao tocar na badge de sequência para ver o Posicionamento de Resiliência */
  onAbrirResiliencia?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  diasConsecutivos = 1,
  onAbrirNotificacoes,
  notificacoesAtivas = false,
  totalNaoLidas = 0,
  onAbrirCalendario,
  onAbrirAjustes,
  onAbrirResiliencia,
}) => {
  return (
    <header 
      className="w-full pt-4 pb-2 px-4 flex items-center justify-between z-20 flex-shrink-0 bg-[#F5F9FC]/95 backdrop-blur-md border-b border-slate-200/40 select-none" 
      data-purpose="header-section"
    >
      {/* Logotipo Oficial e Nome do Aplicativo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs border border-slate-200/60 bg-white flex items-center justify-center shrink-0">
          <img 
            src="/assets/aistudio/screen_1d1a20d5.png" 
            alt="Logo Oficial Jejuar" 
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <span className="font-extrabold text-[#0B2246] text-xl tracking-tight">Jejuar</span>
      </div>

      {/* Ações da Barra Superior (Badge de Fogo, Calendário com Dia, Ajustes) */}
      <div className="flex items-center gap-2.5" data-purpose="header-actions">
        {/* Badge Interativa de Dias Consecutivos (Posicionamento de Resiliência) */}
        <button 
          type="button"
          onClick={() => {
            vibrarClique();
            if (onAbrirResiliencia) onAbrirResiliencia();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100/70 hover:bg-blue-200/60 border border-blue-50/50 shadow-xs text-xs font-semibold text-[#0B2246] active:scale-95 transition-all cursor-pointer min-h-[36px]"
          data-purpose="day-counter-badge"
          title="Toque para ver seu Posicionamento de Resiliência (Top %)"
          aria-label={`Sequência: Dia ${diasConsecutivos}. Toque para ver seu status na comunidade.`}
        >
          <Flame className="w-4 h-4 text-[#00C975] fill-[#00C975]" />
          <span className="font-bold text-[#0B2246]">Dia {diasConsecutivos}</span>
        </button>

        {/* Botão de Notificações / Central de Notificações */}
        <button 
          type="button"
          onClick={onAbrirNotificacoes}
          className="w-10 h-10 flex items-center justify-center text-[#0B2246] active:scale-95 transition-transform relative rounded-xl hover:bg-slate-200/50 cursor-pointer" 
          title="Central de Notificações"
          aria-label="Central de Notificações"
        >
          <Bell className="w-5 h-5 text-[#0B2246]" strokeWidth={2} />
          {totalNaoLidas > 0 ? (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#00C975] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-xs">
              {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
            </span>
          ) : notificacoesAtivas ? (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00C975] ring-2 ring-white" />
          ) : null}
        </button>

        {/* Botão de Ajustes e Metas */}
        <button 
          type="button"
          onClick={onAbrirAjustes}
          className="w-10 h-10 flex items-center justify-center text-[#0B2246] active:scale-95 transition-transform rounded-xl hover:bg-slate-200/50" 
          title="Ajustes e Metas"
          aria-label="Abrir configurações e ajustes"
        >
          <Sliders className="w-5 h-5 text-[#0B2246]" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
};
