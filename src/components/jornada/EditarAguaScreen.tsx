/**
 * @file EditarAguaScreen.tsx
 * @description Subtela de gerenciamento completo do histórico de hidratação (Editar ingestão de água).
 * Baseada estritamente na imagem de referência enviada pelo usuário:
 * - Cabeçalho com botão voltar, título, ícone de lixeira e botão "+" para novo lançamento de água.
 * - Carrega e exibe em tempo real o registro do dia atual (ex: 28/10/2026) e dos dias anteriores do Firestore e LocalStorage.
 * - Sincronização bidirecional: salva alterações de água no Firestore em tempo real.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Trash2, Plus, Edit3, Droplets, Check, X } from 'lucide-react';
import type { UsuarioEmCadastro, RegistroConsumoAgua } from '../../types';
import { buscarHistoricoAguaFirestore, salvarConsumoAguaFirestore } from '../../services/firebase';
import { ModalConfirmacao } from '../ModalConfirmacao';

export interface ItemHistoricoAgua {
  id: string;
  dataIso: string; // YYYY-MM-DD
  dataFormatada: string; // DD/MM/YYYY
  consumidoMl: number;
  metaMl: number;
  porcentagem: number;
}

interface EditarAguaScreenProps {
  usuario?: UsuarioEmCadastro;
  onVoltar: () => void;
  onAtualizarAguaApp?: () => void;
}

export const EditarAguaScreen: React.FC<EditarAguaScreenProps> = ({
  usuario,
  onVoltar,
  onAtualizarAguaApp,
}) => {
  const metaDiariaGlobal = usuario?.configuracaoAgua?.metaDiariaMl || 2500;

  // Estado local do histórico de hidratação
  const [listaAgua, setListaAgua] = useState<ItemHistoricoAgua[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Formata 'YYYY-MM-DD' em 'DD/MM/YYYY'
  const formatarDataStr = (dataStr: string): string => {
    try {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return dataStr;
    } catch {
      return dataStr;
    }
  };

  // Carrega e mescla dados do Firestore e do LocalStorage
  const carregarHistoricoReal = useCallback(async () => {
    setCarregando(true);
    try {
      const hojeStr = new Date().toISOString().slice(0, 10);
      
      // 1. Busca do Firestore (últimos 14 dias)
      let registrosFirestore: RegistroConsumoAgua[] = [];
      if (usuario?.id) {
        registrosFirestore = await buscarHistoricoAguaFirestore(usuario.id, 14, metaDiariaGlobal);
      }

      // 2. Leitura do consumo do dia atual no LocalStorage
      let consumoHoje = 0;
      if (typeof window !== 'undefined') {
        const c = localStorage.getItem(`jejuar_agua_${hojeStr}`);
        if (c) consumoHoje = Number(c);
      }

      // Mapa inicial apenas com dados reais
      const mapaDatas: Record<string, { consumido: number; meta: number }> = {};

      // Sobrescreve com os registros vindos do Firestore
      registrosFirestore.forEach(reg => {
        if (reg.consumidoMl > 0 || reg.dataStr === hojeStr) {
          mapaDatas[reg.dataStr] = {
            consumido: reg.consumidoMl,
            meta: reg.metaMl || metaDiariaGlobal,
          };
        }
      });

      // Garante que o dia de hoje (28/10/2026) esteja sempre presente se tiver consumo
      if (consumoHoje > 0 || !mapaDatas[hojeStr]) {
        mapaDatas[hojeStr] = {
          consumido: Math.max(consumoHoje, mapaDatas[hojeStr]?.consumido || 0),
          meta: metaDiariaGlobal,
        };
      }

      // Converte o mapa em lista ordenada pela data mais recente (decrescente)
      const resultadoFormatado: ItemHistoricoAgua[] = Object.keys(mapaDatas)
        .sort((a, b) => b.localeCompare(a))
        .map(dStr => {
          const item = mapaDatas[dStr];
          const pct = item.meta > 0 ? Math.min(100, Math.round((item.consumido / item.meta) * 100)) : 0;
          return {
            id: `agua_${dStr}`,
            dataIso: dStr,
            dataFormatada: formatarDataStr(dStr),
            consumidoMl: item.consumido,
            metaMl: item.meta,
            porcentagem: pct,
          };
        })
        // Filtra apenas dias que possuam consumo registrado
        .filter(item => item.consumidoMl > 0);

      setListaAgua(resultadoFormatado);
    } catch (err) {
      console.warn('[EditarAguaScreen] Erro ao carregar histórico:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id, metaDiariaGlobal]);

  useEffect(() => {
    carregarHistoricoReal();
  }, [carregarHistoricoReal]);

  // Modais de formulário e confirmação
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemHistoricoAgua | null>(null);

  const [dataInput, setDataInput] = useState('');
  const [consumoInput, setConsumoInput] = useState('2500');

  const [itemParaExcluir, setItemParaExcluir] = useState<ItemHistoricoAgua | null>(null);

  // Abre modal para novo registro
  const handleAbrirNovoLancamento = () => {
    setDataInput(new Date().toISOString().slice(0, 10));
    setConsumoInput('2500');
    setItemEmEdicao(null);
    setModalFormAberto(true);
  };

  // Abre modal para editar registro
  const handleAbrirEditarItem = (item: ItemHistoricoAgua) => {
    setItemEmEdicao(item);
    setDataInput(item.dataIso || new Date().toISOString().slice(0, 10));
    setConsumoInput(String(item.consumidoMl));
    setModalFormAberto(true);
  };

  // Salva inclusão/edição no Firestore e LocalStorage
  const handleSalvarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    const consumido = parseInt(consumoInput || '0', 10);
    const meta = metaDiariaGlobal;
    const pct = Math.min(100, Math.round((consumido / meta) * 100));

    const dataIso = dataInput;
    const dataFormatada = formatarDataStr(dataIso);

    // Persiste no Firestore e LocalStorage
    if (usuario?.id) {
      await salvarConsumoAguaFirestore(usuario.id, dataIso, consumido, meta);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem(`jejuar_agua_${dataIso}`, String(consumido));
    }

    setListaAgua(prev => {
      const existe = prev.some(a => a.dataIso === dataIso);
      if (existe) {
        return prev.map(a => {
          if (a.dataIso === dataIso) {
            return {
              ...a,
              consumidoMl: consumido,
              metaMl: meta,
              porcentagem: pct,
            };
          }
          return a;
        });
      }
      const novo: ItemHistoricoAgua = {
        id: `agua_${dataIso}`,
        dataIso,
        dataFormatada,
        consumidoMl: consumido,
        metaMl: meta,
        porcentagem: pct,
      };
      return [novo, ...prev].sort((a, b) => b.dataIso.localeCompare(a.dataIso));
    });

    setModalFormAberto(false);
    if (onAtualizarAguaApp) onAtualizarAguaApp();
  };

  // Confirma exclusão
  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    const dataIso = itemParaExcluir.dataIso;

    if (usuario?.id) {
      await salvarConsumoAguaFirestore(usuario.id, dataIso, 0, metaDiariaGlobal);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem(`jejuar_agua_${dataIso}`);
    }

    setListaAgua(prev => prev.filter(a => a.id !== itemParaExcluir.id));
    setItemParaExcluir(null);
    if (onAtualizarAguaApp) onAtualizarAguaApp();
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
          <h1 className="text-lg font-black text-[#0B2246] tracking-tight truncate max-w-[220px]">
            Editar ingestão de água
          </h1>
        </div>

        {/* Botão Lixeira e Botão "+" */}
        <div className="flex items-center gap-2">
          {listaAgua.length > 0 && (
            <button
              type="button"
              onClick={() => setItemParaExcluir(listaAgua[0])}
              aria-label="Excluir consumo mais recente"
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleAbrirNovoLancamento}
            aria-label="Adicionar consumo de água"
            className="w-10 h-10 rounded-2xl bg-[#00C975] hover:bg-[#00B067] text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Lista de Cards Brancos de Hidratação Sincronizados em Tempo Real */}
      <main className="flex-1 w-full px-4 pt-4 pb-24 space-y-3 max-w-[430px] mx-auto">
        {carregando ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400 animate-pulse">
            Sincronizando histórico de água...
          </div>
        ) : listaAgua.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-100 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0B2246]">Nenhum consumo de água registrado</h3>
            <p className="text-xs text-slate-400">
              Clique no botão "+" para adicionar um novo registro de água.
            </p>
          </div>
        ) : (
          listaAgua.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-2 hover:border-emerald-200 transition-all"
            >
              {/* Linha 1: Data */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {item.dataFormatada}
                </span>
              </div>

              {/* Linha 2: Consumo / Meta, Porcentagem e Botões de Ação */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-base font-black text-[#0B2246]">
                    {item.consumidoMl}
                    <span className="text-xs font-medium text-slate-400">/{item.metaMl}ml</span>
                  </span>

                  <span className="text-sm font-black text-[#0B2246]">
                    {item.porcentagem}%
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAbrirEditarItem(item)}
                    aria-label="Editar este consumo de água"
                    className="w-10 h-10 rounded-2xl hover:bg-emerald-50 text-[#00C975] flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemParaExcluir(item)}
                    aria-label="Excluir este consumo de água"
                    className="w-10 h-10 rounded-2xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal de Formulário */}
      {modalFormAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[400px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0B2246]">
                {itemEmEdicao ? 'Editar consumo de água' : 'Novo registro de água'}
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
                <label className="text-xs font-bold text-[#0B2246]">Data</label>
                <input
                  type="date"
                  required
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 text-sm font-semibold text-[#0B2246] outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2246]">Quantidade Consumida (ml)</label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  max="10000"
                  required
                  value={consumoInput}
                  onChange={(e) => setConsumoInput(e.target.value)}
                  placeholder="Ex: 2500"
                  className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 text-sm font-bold text-[#0B2246] outline-hidden bg-slate-50/50"
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
                  <span>Salvar Água</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profissional de Exclusão */}
      <ModalConfirmacao
        aberto={Boolean(itemParaExcluir)}
        titulo="Excluir este consumo de água?"
        mensagem={`Tem certeza que deseja remover o consumo de ${itemParaExcluir?.consumidoMl}ml registrado em ${itemParaExcluir?.dataFormatada}?`}
        textoConfirmar="Sim, excluir"
        textoCancelar="Cancelar"
        variante="perigo"
        onConfirmar={handleConfirmarExclusao}
        onCancelar={() => setItemParaExcluir(null)}
      />
    </div>
  );
};
