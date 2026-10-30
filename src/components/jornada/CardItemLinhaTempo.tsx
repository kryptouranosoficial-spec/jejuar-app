/**
 * @file jornada/CardItemLinhaTempo.tsx
 * @description Card individual para cada evento da Linha do Tempo (Timeline da Jornada).
 * Apresenta sessões de jejum, anotações do diário pessoal, exames de bioimpedância e pesagens.
 * Possui ações completas de edição e exclusão para anotações, com touch target >= 44x44px.
 */

import React from 'react';
import { 
  Flame, 
  BookOpen, 
  ClipboardCheck, 
  Scale, 
  Clock, 
  Droplet, 
  Edit3, 
  Trash2,
  Calendar
} from 'lucide-react';
import type { ItemLinhaTempoJornada } from '../../types/jornada';
import { LISTA_HUMORES_JORNADA } from '../../services/jornadaService';

interface CardItemLinhaTempoProps {
  item: ItemLinhaTempoJornada;
  onEditarAnotacao?: (anotacao: any) => void;
  onExcluirAnotacao?: (id: string, titulo: string) => void;
  onAbrirExame?: (exame: any) => void;
}

/** Formata data de forma amigável em Português */
function formatarDataHoraAmigavel(isoString: string): string {
  try {
    const data = new Date(isoString);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);

    const horaStr = `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;

    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje às ${horaStr}`;
    }
    if (data.toDateString() === ontem.toDateString()) {
      return `Ontem às ${horaStr}`;
    }

    const dia = data.getDate();
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();

    return `${dia} de ${mes} de ${ano} às ${horaStr}`;
  } catch {
    return 'Data desconhecida';
  }
}

export const CardItemLinhaTempo: React.FC<CardItemLinhaTempoProps> = ({
  item,
  onEditarAnotacao,
  onExcluirAnotacao,
  onAbrirExame,
}) => {
  const dataFormatada = formatarDataHoraAmigavel(item.dataIso);

  // Configurações visuais por tipo de evento
  const renderIcone = () => {
    switch (item.tipo) {
      case 'jejum':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 fill-emerald-500/20" />
          </div>
        );
      case 'anotacao':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        );
      case 'bioimpedancia':
        return (
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        );
      case 'pesagem':
        return (
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
        );
    }
  };

  const humorEncontrado = item.metadados?.humor 
    ? LISTA_HUMORES_JORNADA.find(h => h.id === item.metadados?.humor) 
    : undefined;

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs hover:border-slate-200 transition-all group"
      data-purpose={`timeline-item-${item.tipo}`}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        {renderIcone()}

        {/* Informações Centrais */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dataFormatada}
            </span>

            {/* Badge semântico */}
            {item.badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                item.badge.variante === 'sucesso'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : item.badge.variante === 'info'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : item.badge.variante === 'destaque'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {item.badge.rotulo}
              </span>
            )}
          </div>

          <h5 className="text-sm font-bold text-slate-800 leading-snug">
            {item.tituloPrincipal}
          </h5>

          {item.subtitulo && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {item.subtitulo}
            </p>
          )}

          {item.descricao && (
            <div className="mt-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/80 leading-relaxed whitespace-pre-line">
              {item.descricao}
            </div>
          )}

          {/* Tags da Anotação */}
          {item.tipo === 'anotacao' && item.dadosOriginais?.tags && item.dadosOriginais.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.dadosOriginais.tags.map((tag: string, idx: number) => (
                <span key={idx} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Ações para Anotações (Editar e Excluir com touch target >= 44x44px) */}
          {item.tipo === 'anotacao' && (
            <div className="flex items-center justify-end gap-1 mt-2.5 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => onEditarAnotacao?.(item.dadosOriginais)}
                className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                aria-label="Editar anotação"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={() => onExcluirAnotacao?.(item.id, item.tituloPrincipal)}
                className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                aria-label="Excluir anotação"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          )}

          {/* Ação para Exame de Bioimpedância (Ver Laudo Completo) */}
          {item.tipo === 'bioimpedancia' && onAbrirExame && (
            <div className="flex items-center justify-end mt-2 pt-1">
              <button
                type="button"
                onClick={() => onAbrirExame(item.dadosOriginais)}
                className="min-h-[44px] px-3 text-xs font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Ver Laudo de Bioimpedância</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
