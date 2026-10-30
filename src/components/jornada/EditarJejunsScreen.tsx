/**
 * @file EditarJejunsScreen.tsx
 * @description Subtela de gerenciamento completo de histórico de jejuns (Editar jejuns).
 * Baseada estritamente na imagem de referência enviada pelo usuário:
 * - Cabeçalho com botão voltar, título, ícone de lixeira e botão "+" para novo lançamento.
 * - Lista de cards brancos arredondados com data/hora, duração (ex: 20h26m) e botão lápis verde de edição.
 * - Modal para cadastro/edição manual de jejuns.
 * - Modal de confirmação profissional de exclusão.
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Edit3, Clock, Check, X, AlertCircle } from 'lucide-react';
import type { SessaoJejum, UsuarioEmCadastro } from '../../types';
import { ModalConfirmacao } from '../ModalConfirmacao';

interface EditarJejunsScreenProps {
  usuario?: UsuarioEmCadastro;
  historicoJejunsInicial?: SessaoJejum[];
  onVoltar: () => void;
  onAtualizarHistorico?: () => void;
}

export const EditarJejunsScreen: React.FC<EditarJejunsScreenProps> = ({
  usuario,
  historicoJejunsInicial = [],
  onVoltar,
  onAtualizarHistorico,
}) => {
  // Estado local do histórico de jejuns
  const [listaJejuns, setListaJejuns] = useState<SessaoJejum[]>(() => {
    if (historicoJejunsInicial.length > 0) return historicoJejunsInicial;
    if (typeof window !== 'undefined') {
      const cache = localStorage.getItem('jejuar_historico_jejuns_cache');
      if (cache) {
        try {
          const parsed = JSON.parse(cache);
          if (Array.isArray(parsed)) {
            // Purga forçada de IDs mock legados
            const filtrados = parsed.filter((item: any) => !['1', '2', '3', '4', '5', '6'].includes(item.id));
            if (filtrados.length > 0) return filtrados;
          }
        } catch { /* silêncio */ }
      }
    }
    // Sem dados fictícios por padrão: exibe apenas os registros reais salvos
    return [];
  });

  // Salva no cache local quando houver alterações
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jejuar_historico_jejuns_cache', JSON.stringify(listaJejuns));
    }
  }, [listaJejuns]);

  // Modais de Formulário e Confirmação
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [jejumEmEdicao, setJejumEmEdicao] = useState<SessaoJejum | null>(null);

  // Formulário: campos de data, hora e horas de jejum
  const [dataInput, setDataInput] = useState('');
  const [horaInicioInput, setHoraInicioInput] = useState('18:00');
  const [horasJejumInput, setHorasJejumInput] = useState('16');

  // Modal de confirmação de exclusão
  const [itemParaExcluir, setItemParaExcluir] = useState<SessaoJejum | null>(null);

  // Formata os segundos em texto estilo "20h26m" ou "17h"
  const formatarDuracaoHorasMinutos = (segundos: number): string => {
    const totalMinutos = Math.floor(segundos / 60);
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    if (m === 0) return `${h}h`;
    return `${h}h${m}m`;
  };

  // Formata data e hora do início do jejum: DD/MM/YYYY HH:MM
  const formatarDataHora = (isoStr?: string): string => {
    if (!isoStr) return '27/10/2026 15:44';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '27/10/2026 15:44';
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      const horas = String(d.getHours()).padStart(2, '0');
      const minutos = String(d.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
    } catch {
      return '27/10/2026 15:44';
    }
  };

  // Abre modal para novo jejum
  const handleAbrirNovoJejum = () => {
    const hojeIso = new Date().toISOString().slice(0, 10);
    setDataInput(hojeIso);
    setHoraInicioInput('18:00');
    setHorasJejumInput('16');
    setJejumEmEdicao(null);
    setModalFormAberto(true);
  };

  // Abre modal para editar jejum existente
  const handleAbrirEditarJejum = (jejum: SessaoJejum) => {
    setJejumEmEdicao(jejum);
    if (jejum.inicio) {
      const d = new Date(jejum.inicio);
      setDataInput(d.toISOString().slice(0, 10));
      setHoraInicioInput(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    } else {
      setDataInput(new Date().toISOString().slice(0, 10));
      setHoraInicioInput('18:00');
    }
    const horasCalculadas = Math.round((jejum.duracaoSegundos || 57600) / 3600);
    setHorasJejumInput(String(horasCalculadas));
    setModalFormAberto(true);
  };

  // Salva inclusão ou edição
  const handleSalvarFormulario = (e: React.FormEvent) => {
    e.preventDefault();
    const horasNum = parseFloat(horasJejumInput) || 16;
    const duracaoSegundos = Math.round(horasNum * 3600);

    const dataHoraIso = `${dataInput}T${horaInicioInput}:00Z`;

    if (jejumEmEdicao) {
      // Edita registro existente
      setListaJejuns(prev => prev.map(item => {
        if (item.id === jejumEmEdicao.id) {
          return {
            ...item,
            inicio: dataHoraIso,
            duracaoSegundos,
            metaHoras: horasNum,
          };
        }
        return item;
      }));
    } else {
      // Cria novo registro
      const novoItem: SessaoJejum = {
        id: `jejum_${Date.now()}`,
        planoId: `${horasNum}:8`,
        nomePlano: `${horasNum}h`,
        inicio: dataHoraIso,
        fim: new Date(new Date(dataHoraIso).getTime() + duracaoSegundos * 1000).toISOString(),
        duracaoSegundos,
        metaHoras: horasNum,
        metaAtingida: true,
      };
      setListaJejuns(prev => [novoItem, ...prev]);
    }

    setModalFormAberto(false);
    if (onAtualizarHistorico) onAtualizarHistorico();
  };

  // Confirma a exclusão de um registro
  const handleConfirmarExclusao = () => {
    if (!itemParaExcluir) return;
    setListaJejuns(prev => prev.filter(item => item.id !== itemParaExcluir.id));
    setItemParaExcluir(null);
    if (onAtualizarHistorico) onAtualizarHistorico();
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F9FC] flex flex-col relative select-none">
      {/* Cabeçalho Fiel à Imagem de Referência */}
      <header className="sticky top-0 z-20 bg-[#F5F9FC]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar para a tela de Jornada"
            className="min-h-[44px] min-w-[44px] -ml-2 rounded-2xl flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#0B2246]" />
          </button>
          <h1 className="text-lg font-black text-[#0B2246] tracking-tight">
            Editar jejuns
          </h1>
        </div>

        {/* Botão de Lixeira e Botão "+" de Cadastro em Pílula Azul */}
        <div className="flex items-center gap-2">
          {listaJejuns.length > 0 && (
            <button
              type="button"
              onClick={() => setItemParaExcluir(listaJejuns[0])}
              aria-label="Excluir o registro mais recente"
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleAbrirNovoJejum}
            aria-label="Cadastrar novo lançamento de jejum"
            className="w-10 h-10 rounded-2xl bg-[#00C975] hover:bg-[#00B067] text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Lista de Cards Brancos de Jejuns */}
      <main className="flex-1 w-full px-4 pt-4 pb-24 space-y-3 max-w-[430px] mx-auto">
        {listaJejuns.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-100 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00C975] flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0B2246]">Nenhum jejum registrado</h3>
            <p className="text-xs text-slate-400">
              Clique no botão "+" acima para cadastrar um novo lançamento manualmente.
            </p>
          </div>
        ) : (
          listaJejuns.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs flex items-center justify-between hover:border-emerald-200 transition-all group"
            >
              {/* Esquerda: Avatar de Emoji / Ícone de Relógio e Informações */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-xl shadow-2xs group-hover:bg-emerald-50 group-hover:text-[#00C975] transition-colors">
                  😁
                </div>

                <div className="space-y-0.5 text-left">
                  <span className="text-[11px] font-medium text-slate-400 block">
                    {formatarDataHora(item.inicio)}
                  </span>
                  <span className="text-base font-black text-[#0B2246] block tracking-tight">
                    {formatarDuracaoHorasMinutos(item.duracaoSegundos || 57600)}
                  </span>
                </div>
              </div>

              {/* Direita: Botão Lápis Verde de Edição e Lixeira de Exclusão */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAbrirEditarJejum(item)}
                  aria-label="Editar este registro de jejum"
                  className="w-10 h-10 rounded-2xl hover:bg-emerald-50 text-[#00C975] flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 stroke-[2.2]" />
                </button>

                <button
                  type="button"
                  onClick={() => setItemParaExcluir(item)}
                  aria-label="Excluir este registro de jejum"
                  className="w-10 h-10 rounded-2xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal de Formulário (Novo Lançamento / Editar) */}
      {modalFormAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[400px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0B2246]">
                {jejumEmEdicao ? 'Editar registro de jejum' : 'Novo lançamento de jejum'}
              </h3>
              <button
                type="button"
                onClick={() => setModalFormAberto(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarFormulario} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2246]">Data do Jejum</label>
                <input
                  type="date"
                  required
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 text-sm font-semibold text-[#0B2246] outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2246]">Horário de Início</label>
                <input
                  type="time"
                  required
                  value={horaInicioInput}
                  onChange={(e) => setHoraInicioInput(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 text-sm font-semibold text-[#0B2246] outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2246]">Duração (Horas)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="72"
                  required
                  value={horasJejumInput}
                  onChange={(e) => setHorasJejumInput(e.target.value)}
                  placeholder="Ex: 16"
                  className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 text-sm font-semibold text-[#0B2246] outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFormAberto(false)}
                  className="flex-1 min-h-[48px] rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] rounded-2xl bg-[#00C975] hover:bg-[#00B067] text-xs font-bold text-white shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Salvar Jejum</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profissional de Confirmação de Exclusão */}
      <ModalConfirmacao
        aberto={Boolean(itemParaExcluir)}
        titulo="Excluir este lançamento de jejum?"
        mensagem={`Você tem certeza que deseja remover o registro de ${itemParaExcluir ? formatarDataHora(itemParaExcluir.inicio) : ''}? Esta ação não poderá ser desfeita.`}
        textoConfirmar="Sim, excluir"
        textoCancelar="Cancelar"
        variante="perigo"
        onConfirmar={handleConfirmarExclusao}
        onCancelar={() => setItemParaExcluir(null)}
      />
    </div>
  );
};
