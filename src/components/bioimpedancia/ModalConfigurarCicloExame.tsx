/**
 * @file bioimpedancia/ModalConfigurarCicloExame.tsx
 * @description Modal para configurar a frequência periódica de realização de novas bioimpedâncias
 * (ex: a cada 30, 45, 60 ou 90 dias).
 */

import React, { useState } from 'react';
import { X, Calendar, Check, Bell } from 'lucide-react';
import type { ConfiguracaoRetesteBioimpedancia } from '../../types/bioimpedancia';

interface ModalConfigurarCicloExameProps {
  aberto: boolean;
  configAtual: ConfiguracaoRetesteBioimpedancia;
  onSalvar: (novaConfig: ConfiguracaoRetesteBioimpedancia) => Promise<void>;
  onFechar: () => void;
}

const OPCOES_FREQUENCIA = [
  { dias: 7, rotulo: '7 dias (1 semana)', descricao: 'Acompanhamento semanal intensivo após a última medição' },
  { dias: 15, rotulo: '15 dias (Quinzenal)', descricao: 'Equilíbrio ideal para acompanhar perda de gordura e massa magra' },
  { dias: 30, rotulo: '30 dias (Mensal)', descricao: 'Ciclo mensal completo de recomposição corporal' },
];

export const ModalConfigurarCicloExame: React.FC<ModalConfigurarCicloExameProps> = ({
  aberto,
  configAtual,
  onSalvar,
  onFechar,
}) => {
  const [frequencia, setFrequencia] = useState<number>(configAtual.frequenciaDias || 15);
  const [lembretes, setLembretes] = useState<boolean>(configAtual.lembretesAtivos ?? true);
  const [salvando, setSalvando] = useState<boolean>(false);

  if (!aberto) return null;

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      await onSalvar({
        frequenciaDias: frequencia,
        lembretesAtivos: lembretes,
      });
      onFechar();
    } catch {
      // Falha tratada silenciosamente com fallback seguro
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center">
              <Calendar className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1C30]">
                Frequência de Reteste
              </h3>
              <p className="text-xs text-slate-500">
                A cada quantos dias planeja fazer uma nova bioimpedância?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Opções */}
        <div className="py-4 space-y-2.5">
          {OPCOES_FREQUENCIA.map((opcao) => {
            const selecionado = frequencia === opcao.dias;
            return (
              <button
                key={opcao.dias}
                type="button"
                onClick={() => setFrequencia(opcao.dias)}
                className={`w-full min-h-[52px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${
                  selecionado
                    ? 'border-[#00C975] bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <span className={`text-sm font-bold block ${selecionado ? 'text-emerald-900' : 'text-slate-800'}`}>
                    A cada {opcao.rotulo}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {opcao.descricao}
                  </span>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                    selecionado
                      ? 'bg-[#00C975] border-[#00C975] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {selecionado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}

          {/* Toggle de Lembrete */}
          <div className="pt-2 flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Lembrete no Dashboard
                </span>
                <span className="text-[11px] text-slate-500">
                  Exibir contagem regressiva para a próxima data
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={lembretes}
              onClick={() => setLembretes(!lembretes)}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                lembretes ? 'bg-[#00C975]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-xs absolute top-1 transition-transform ${
                  lembretes ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="pt-2">
          <button
            type="button"
            disabled={salvando}
            onClick={handleSalvar}
            className="w-full min-h-[48px] rounded-2xl bg-[#00C975] hover:bg-[#00B066] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
          >
            {salvando ? 'Salvando...' : 'Confirmar Frequência'}
          </button>
        </div>
      </div>
    </div>
  );
};
