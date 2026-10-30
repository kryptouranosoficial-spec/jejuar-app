/**
 * @file ModalHistoricoHidratacao.tsx
 * @description Modal Bottom Sheet para exibir o Histórico de Hidratação dos últimos 7 dias.
 * Permite ao usuário visualizar os dados cronológicos do Firestore e clicar em qualquer dia
 * para ajustar retroativamente a quantidade de água consumida.
 */

import React, { useState } from 'react';
import { X, Check, Droplet, Pencil, Sparkles, Plus, Minus } from 'lucide-react';
import type { RegistroConsumoAgua } from '../../types';

interface ModalHistoricoHidratacaoProps {
  aberto: boolean;
  historico7Dias: RegistroConsumoAgua[];
  metaMl: number;
  unidade?: string;
  onSalvarAjusteDia: (dataStr: string, novoValorMl: number) => void;
  onFechar: () => void;
}

export const ModalHistoricoHidratacao: React.FC<ModalHistoricoHidratacaoProps> = ({
  aberto,
  historico7Dias,
  metaMl,
  unidade = 'ml',
  onSalvarAjusteDia,
  onFechar,
}) => {
  // Dia selecionado para ajuste retroativo
  const [diaEmEdicao, setDiaEmEdicao] = useState<RegistroConsumoAgua | null>(null);
  const [valorEdicao, setValorEdicao] = useState<string>('0');
  const [erroEdicao, setErroEdicao] = useState<string>('');

  if (!aberto) return null;

  const hojeStr = new Date().toISOString().slice(0, 10);
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().slice(0, 10);

  // Ordena do mais recente (hoje) para o mais antigo (últimos 7 dias)
  const listaOrdenada = [...historico7Dias].sort((a, b) => b.dataStr.localeCompare(a.dataStr));

  // Métricas do resumo
  const totalDiasBatidos = listaOrdenada.filter((item) => item.consumidoMl >= (item.metaMl || metaMl)).length;
  const mediaMl = Math.round(
    listaOrdenada.reduce((acc, curr) => acc + curr.consumidoMl, 0) / (listaOrdenada.length || 1)
  );

  // Formata o rótulo amigável do dia
  const formatarRotuloDia = (dataStr: string) => {
    if (dataStr === hojeStr) return 'Hoje';
    if (dataStr === ontemStr) return 'Ontem';

    const partes = dataStr.split('-');
    if (partes.length === 3) {
      const dataObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const diaSemanaNome = diasSemana[dataObj.getDay()];
      return `${diaSemanaNome}, ${partes[2]}/${partes[1]}`;
    }
    return dataStr;
  };

  // Abre sub-modal de edição de um dia específico
  const abrirEdicaoDia = (registro: RegistroConsumoAgua) => {
    setDiaEmEdicao(registro);
    setValorEdicao(String(registro.consumidoMl));
    setErroEdicao('');
  };

  const confirmarAjusteDia = () => {
    if (!diaEmEdicao) return;
    const num = parseInt(valorEdicao.replace(/\D/g, ''), 10);
    if (isNaN(num) || num < 0) {
      setErroEdicao('Informe um valor numérico válido.');
      return;
    }
    if (num > 10000) {
      setErroEdicao('O limite máximo diário é de 10.000 ml.');
      return;
    }

    onSalvarAjusteDia(diaEmEdicao.dataStr, num);
    setDiaEmEdicao(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300 select-none animate-in fade-in"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-historico-agua"
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== Cabeçalho da Modal ==================== */}
        <div className="relative flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="w-8" />
          <h2 id="titulo-historico-agua" className="text-[19px] font-black text-[#092244] tracking-tight text-center">
            Histórico de hidratação
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-slate-100/90 text-slate-500 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ==================== Resumo Topo (KPIs) ==================== */}
        <div className="pt-4 pb-2">
          <div className="bg-[#F0F6FF] rounded-2xl p-4 border border-blue-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#2F80ED]">
                <Droplet className="w-5 h-5 fill-[#2F80ED]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Média 7 dias
                </span>
                <span className="text-[18px] font-black text-[#092244] tabular-nums">
                  {mediaMl} {unidade}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Metas batidas
              </span>
              <div className="flex items-center justify-end gap-1 text-[16px] font-black text-[#00C975]">
                <Sparkles className="w-4 h-4" />
                <span>{totalDiasBatidos} de 7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dica amigável */}
        <p className="text-[11px] text-gray-400 font-semibold px-1 pt-1 pb-2">
          Toque em qualquer dia para registrar ou corrigir a quantidade consumida.
        </p>

        {/* ==================== Lista Cronológica dos 7 Dias ==================== */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {listaOrdenada.map((registro) => {
            const metaDoDia = registro.metaMl || metaMl;
            const porcentagem = Math.min(100, Math.round((registro.consumidoMl / metaDoDia) * 100));
            const bateuMeta = registro.consumidoMl >= metaDoDia;
            const ehHoje = registro.dataStr === hojeStr;

            return (
              <div
                key={registro.dataStr}
                onClick={() => abrirEdicaoDia(registro)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  ehHoje
                    ? 'border-blue-200 bg-[#F5F9FC] hover:bg-[#EDF5FD]'
                    : 'border-gray-100 bg-white hover:bg-gray-50/80 shadow-2xs'
                }`}
              >
                {/* Linha Superior: Data e Quantidade */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[14px] ${ehHoje ? 'font-black text-[#2F80ED]' : 'font-bold text-[#092244]'}`}>
                      {formatarRotuloDia(registro.dataStr)}
                    </span>
                    {ehHoje && (
                      <span className="text-[10px] font-black bg-blue-100 text-[#2F80ED] px-2 py-0.5 rounded-full">
                        Hoje
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-black text-[#092244] tabular-nums">
                      {registro.consumidoMl}
                    </span>
                    <span className="text-[12px] font-bold text-gray-400">
                      / {metaDoDia} {unidade}
                    </span>
                    <Pencil className="w-3.5 h-3.5 text-gray-400 ml-1 hover:text-[#2F80ED] transition-colors" />
                  </div>
                </div>

                {/* Barra de Progresso e Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        bateuMeta ? 'bg-[#00C975]' : 'bg-[#38B6FF]'
                      }`}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>

                  {bateuMeta ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#00C975] bg-[#E8FAF3] px-2 py-0.5 rounded-full shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Meta batida
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400 tabular-nums shrink-0">
                      {porcentagem}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ==================== Botão Fechar ==================== */}
        <div className="pt-3 pb-2">
          <button
            type="button"
            onClick={onFechar}
            className="w-full h-13 bg-[#00C975] hover:bg-[#00B76A] active:scale-[0.98] text-white text-[16px] font-black rounded-full shadow-lg shadow-[#00C975]/25 transition-all flex items-center justify-center min-h-[50px] cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* ==================== Sub-Modal de Ajuste do Dia ==================== */}
      {diaEmEdicao && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-blue-50 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#092244]">
                  Ajustar consumo de água
                </h3>
                <p className="text-xs font-semibold text-[#2F80ED]">
                  {formatarRotuloDia(diaEmEdicao.dataStr)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDiaEmEdicao(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input com campo numérico */}
            <div className="pt-1">
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Quantidade consumida nesse dia:
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  value={valorEdicao}
                  onChange={(e) => {
                    const limpo = e.target.value.replace(/\D/g, '');
                    setValorEdicao(limpo);
                    if (erroEdicao) setErroEdicao('');
                  }}
                  className="w-full h-12 px-4 pr-14 text-xl font-black text-[#092244] bg-[#F5F9FC] border border-blue-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
                />
                <span className="absolute right-4 text-sm font-bold text-gray-400 pointer-events-none">
                  {unidade}
                </span>
              </div>
              {erroEdicao && (
                <p className="text-xs text-rose-500 font-bold mt-1.5">
                  {erroEdicao}
                </p>
              )}
            </div>

            {/* Atalhos Rápidos de Ajuste */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const atual = parseInt(valorEdicao || '0', 10);
                  setValorEdicao(String(Math.max(0, atual - 250)));
                }}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
              >
                <Minus className="w-3 h-3" /> 250
              </button>
              <button
                type="button"
                onClick={() => {
                  const atual = parseInt(valorEdicao || '0', 10);
                  setValorEdicao(String(atual + 250));
                }}
                className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-[#2F80ED] flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 250
              </button>
              <button
                type="button"
                onClick={() => {
                  const atual = parseInt(valorEdicao || '0', 10);
                  setValorEdicao(String(atual + 500));
                }}
                className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-[#2F80ED] flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 500
              </button>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDiaEmEdicao(null)}
                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl active:scale-95 transition-all min-h-[44px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAjusteDia}
                className="flex-1 py-3 text-sm font-bold text-white bg-[#00C975] hover:bg-[#00B76A] rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar dia</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
