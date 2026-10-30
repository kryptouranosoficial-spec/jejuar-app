/**
 * @file bioimpedancia/CardExameItem.tsx
 * @description Card individual para exibição cronológica de um exame de bioimpedância no feed de histórico.
 * Exibe métricas consolidadas, variações (deltas), status clínico e ações rápidas (detalhar, editar, excluir).
 */

import React from 'react';
import { 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  Minus 
} from 'lucide-react';
import type { RegistroBioimpedancia } from '../../types/bioimpedancia';
import { 
  formatarDataExtensaBR, 
  formatarDecimalBR, 
  classificarExameBioimpedancia, 
  calcularDeltaEvolucao 
} from '../../utils/bioimpedanciaUtils';

interface CardExameItemProps {
  exame: RegistroBioimpedancia;
  exameAnterior?: RegistroBioimpedancia | null;
  idadeUsuario?: number;
  generoUsuario?: string;
  onVisualizar: (exame: RegistroBioimpedancia) => void;
  onEditar: (exame: RegistroBioimpedancia) => void;
  onExcluir: (id: string) => void;
}

export const CardExameItem: React.FC<CardExameItemProps> = ({
  exame,
  exameAnterior,
  idadeUsuario = 40,
  generoUsuario = 'masculino',
  onVisualizar,
  onEditar,
  onExcluir,
}) => {
  const diagnostico = classificarExameBioimpedancia(exame, idadeUsuario, generoUsuario);
  const delta = exameAnterior ? calcularDeltaEvolucao(exame, exameAnterior) : null;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xs hover:border-slate-200 transition-all select-none">
      
      {/* Topo do Card: Data, Local e Botões de Ação */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div 
          onClick={() => onVisualizar(exame)}
          className="flex-1 cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatarDataExtensaBR(exame.dataExame)}</span>
            {exame.horaExame && (
              <>
                <span aria-hidden="true">·</span>
                <span>{exame.horaExame}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {exame.local}
            </h4>
          </div>
        </div>

        {/* Ações Rápidas (Editar e Excluir) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditar(exame);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Editar exame"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExcluir(exame.id);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Excluir exame"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div 
        onClick={() => onVisualizar(exame)}
        className="grid grid-cols-4 gap-2 py-2.5 px-3 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition-colors"
      >
        {/* Peso */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Peso
          </span>
          <span className="text-xs font-black text-slate-800 tabular-nums">
            {formatarDecimalBR(exame.pesoKg, 1)} kg
          </span>
        </div>

        {/* Gordura */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Gordura
          </span>
          <span className="text-xs font-black text-slate-800 tabular-nums">
            {formatarDecimalBR(exame.gorduraCorporalPercentual, 1)}%
          </span>
        </div>

        {/* Músculo */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Músculo
          </span>
          <span className="text-xs font-black text-slate-800 tabular-nums">
            {formatarDecimalBR(exame.musculoEsqueleticoPercentual, 1)}%
          </span>
        </div>

        {/* Visceral */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Visceral
          </span>
          <span className="text-xs font-black text-slate-800 tabular-nums">
            Nív. {exame.gorduraVisceralNivel}
          </span>
        </div>
      </div>

      {/* Rodapé do Card com Badges de Diagnóstico e Variação */}
      <div 
        onClick={() => onVisualizar(exame)}
        className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50 cursor-pointer text-xs"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Badge Gordura */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${diagnostico.gorduraCorporal.corFundo} ${diagnostico.gorduraCorporal.corTexto}`}>
            Gordura {diagnostico.gorduraCorporal.rotulo}
          </span>

          {/* Variação em relação ao anterior */}
          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                delta.melhorouGordura
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {delta.deltaGorduraPercentual > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : delta.deltaGorduraPercentual < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>
                {delta.deltaGorduraPercentual > 0 ? '+' : ''}
                {formatarDecimalBR(delta.deltaGorduraPercentual, 1)}% gordura
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 text-slate-400 font-semibold text-[11px] group">
          <span>Ver laudo</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
