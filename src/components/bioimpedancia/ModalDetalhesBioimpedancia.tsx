/**
 * @file bioimpedancia/ModalDetalhesBioimpedancia.tsx
 * @description Modal de visualização detalhada do laudo de bioimpedância.
 * Apresenta réguas visuais de referência clínica oficial (SBIM/Anvisa), cards de parâmetros,
 * comparativo com o exame anterior e ações de edição e exclusão.
 */

import React from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  Flame, 
  Heart, 
  Activity, 
  UserCheck,
  TrendingDown,
  TrendingUp,
  Clock
} from 'lucide-react';
import type { RegistroBioimpedancia } from '../../types/bioimpedancia';
import { 
  classificarExameBioimpedancia, 
  formatarDataExtensaBR, 
  formatarDecimalBR 
} from '../../utils/bioimpedanciaUtils';

interface ModalDetalhesBioimpedanciaProps {
  aberto: boolean;
  exame: RegistroBioimpedancia | null;
  exameAnterior?: RegistroBioimpedancia | null;
  idadeUsuario?: number;
  generoUsuario?: string;
  onEditar: (exame: RegistroBioimpedancia) => void;
  onExcluir: (id: string) => void;
  onFechar: () => void;
}

export const ModalDetalhesBioimpedancia: React.FC<ModalDetalhesBioimpedanciaProps> = ({
  aberto,
  exame,
  exameAnterior,
  idadeUsuario = 40,
  generoUsuario = 'masculino',
  onEditar,
  onExcluir,
  onFechar,
}) => {
  if (!aberto || !exame) return null;

  const diagnostico = classificarExameBioimpedancia(exame, idadeUsuario, generoUsuario);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-detalhes"
    >
      <div className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center">
              <Activity className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 id="titulo-modal-detalhes" className="text-base font-bold text-[#0B1C30]">
                Laudo de Bioimpedância
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatarDataExtensaBR(exame.dataExame)}</span>
                {exame.horaExame && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{exame.horaExame}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="w-11 h-11 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Fechar laudo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem suave */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          
          {/* Card de Identificação do Local */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Local do Atendimento
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {exame.local}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Peso Aferido
              </span>
              <span className="text-sm font-black text-slate-900 tabular-nums">
                {formatarDecimalBR(exame.pesoKg, 1)} kg
              </span>
            </div>
          </div>

          {/* Grid de Métricas Primárias com Classificação Semântica */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Gordura Corporal (% PGC) */}
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
                Gordura Corporal
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 tabular-nums">
                  {formatarDecimalBR(exame.gorduraCorporalPercentual, 1)}
                </span>
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
              <div className="mt-2">
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${diagnostico.gorduraCorporal.corFundo} ${diagnostico.gorduraCorporal.corTexto}`}>
                  {diagnostico.gorduraCorporal.rotulo}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Ideal: {diagnostico.gorduraCorporal.faixaReferenciaTexto}
                </span>
              </div>
            </div>

            {/* Músculo Esquelético (% Massa Magra) */}
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
                Músculo Esquelético
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 tabular-nums">
                  {formatarDecimalBR(exame.musculoEsqueleticoPercentual, 1)}
                </span>
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
              <div className="mt-2">
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${diagnostico.musculoEsqueletico.corFundo} ${diagnostico.musculoEsqueletico.corTexto}`}>
                  {diagnostico.musculoEsqueletico.rotulo}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Ideal: {diagnostico.musculoEsqueletico.faixaReferenciaTexto}
                </span>
              </div>
            </div>

            {/* Gordura Visceral */}
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
                Gordura Visceral
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 tabular-nums">
                  {exame.gorduraVisceralNivel}
                </span>
                <span className="text-xs font-semibold text-slate-400">nível</span>
              </div>
              <div className="mt-2">
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${diagnostico.gorduraVisceral.corFundo} ${diagnostico.gorduraVisceral.corTexto}`}>
                  {diagnostico.gorduraVisceral.rotulo}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Ideal: ≤ 9
                </span>
              </div>
            </div>

            {/* IMC */}
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
                IMC (Índice de Massa)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 tabular-nums">
                  {formatarDecimalBR(exame.imc, 2)}
                </span>
              </div>
              <div className="mt-2">
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${diagnostico.imc.corFundo} ${diagnostico.imc.corTexto}`}>
                  {diagnostico.imc.rotulo}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Ideal: 18,5 - 24,9
                </span>
              </div>
            </div>
          </div>

          {/* Régua de Referência Clínica Visual */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Posição nas Faixas Clínicas Oficiais (SBIM / Anvisa)
            </span>

            {/* Barra Visual de Gordura Corporal */}
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>Gordura Corporal</span>
                <span className="font-bold tabular-nums">{formatarDecimalBR(exame.gorduraCorporalPercentual, 1)}%</span>
              </div>
              <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                <div className="h-full bg-sky-400 w-1/4" title="Baixo" />
                <div className="h-full bg-emerald-400 w-1/4" title="Normal" />
                <div className="h-full bg-amber-400 w-1/4" title="Alto" />
                <div className="h-full bg-rose-400 w-1/4" title="Muito Alto" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 px-0.5">
                <span>Baixo</span>
                <span>Normal</span>
                <span>Alto</span>
                <span>Muito Alto</span>
              </div>
            </div>

            {/* Barra Visual de Músculo Esquelético */}
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>Músculo Esquelético</span>
                <span className="font-bold tabular-nums">{formatarDecimalBR(exame.musculoEsqueleticoPercentual, 1)}%</span>
              </div>
              <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                <div className="h-full bg-amber-400 w-1/4" title="Baixo" />
                <div className="h-full bg-emerald-400 w-1/4" title="Normal" />
                <div className="h-full bg-emerald-500 w-1/4" title="Alto" />
                <div className="h-full bg-emerald-600 w-1/4" title="Excelente" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 px-0.5">
                <span>Abaixo</span>
                <span>Normal</span>
                <span>Alto</span>
                <span>Excelente</span>
              </div>
            </div>
          </div>

          {/* Parâmetros Complementares: Metabolismo Basal e Idade Corporal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Metabolismo Basal
                </span>
                <span className="text-sm font-black text-slate-800 tabular-nums">
                  {exame.taxaMetabolicaBasalKcal} <span className="text-[11px] font-semibold text-slate-500">Kcal</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Idade Corporal
                </span>
                <span className="text-sm font-black text-slate-800 tabular-nums">
                  {exame.idadeCorporalAnos ? `${exame.idadeCorporalAnos} anos` : 'Não informada'}
                </span>
              </div>
            </div>
          </div>

          {/* Observações Clínicas */}
          {exame.observacoes && (
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Observações
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {exame.observacoes}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé com Ações de Edição e Exclusão */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEditar(exame)}
            className="flex-1 min-h-[48px] rounded-2xl bg-[#00C975] hover:bg-[#00B066] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Exame</span>
          </button>

          <button
            type="button"
            onClick={() => onExcluir(exame.id)}
            className="min-h-[48px] px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            aria-label="Excluir este exame"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
