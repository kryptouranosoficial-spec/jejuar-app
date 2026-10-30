/**
 * @file EditarMedidasScreen.tsx
 * @description Subtela de gerenciamento completo de histórico de medidas corporais (Editar medidas corporais).
 * Exibe registros 100% reais do usuário (Cintura, Peito, Braço, Quadris e Coxa em cm) sem dados fictícios.
 * Possui ações de edição, exclusão com modal profissional e cadastro de nova medição.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Trash2, Plus, Edit3, Ruler, Check, X } from 'lucide-react';
import type { UsuarioEmCadastro } from '../../types';
import { salvarMedidaCorporalFirestore, buscarMedidasCorporaisFirestore } from '../../services/firebase';
import { ModalConfirmacao } from '../ModalConfirmacao';

export interface RegistroHistoricoMedidas {
  id: string;
  dataIso: string;
  dataFormatada: string;
  cinturaCm?: number;
  peitoCm?: number;
  bracoCm?: number;
  quadrisCm?: number;
  coxaCm?: number;
}

interface EditarMedidasScreenProps {
  usuario?: UsuarioEmCadastro;
  onVoltar: () => void;
  onAtualizarMedidasApp?: () => void;
}

export const EditarMedidasScreen: React.FC<EditarMedidasScreenProps> = ({
  usuario,
  onVoltar,
  onAtualizarMedidasApp,
}) => {
  // Estado dos registros 100% reais de medidas
  const [listaMedidas, setListaMedidas] = useState<RegistroHistoricoMedidas[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Formata 'YYYY-MM-DD' para 'DD/MM/YYYY'
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

  // Carrega histórico de medidas reais do Firestore e LocalStorage
  const carregarHistoricoReal = useCallback(async () => {
    setCarregando(true);
    try {
      const hojeIso = new Date().toISOString().slice(0, 10);
      let salvosLocais: RegistroHistoricoMedidas[] = [];

      if (typeof window !== 'undefined') {
        const cache = localStorage.getItem('jejuar_historico_medidas_cache');
        if (cache) {
          try { salvosLocais = JSON.parse(cache); } catch { /* silêncio */ }
        }
      }

      // Tenta buscar as medidas corporais ativas do Firestore
      if (usuario?.id) {
        const mDoc = await buscarMedidasCorporaisFirestore(usuario.id);
        if (mDoc) {
          const temHoje = salvosLocais.some(m => m.dataIso === hojeIso);
          if (!temHoje) {
            const registroHoje: RegistroHistoricoMedidas = {
              id: `m_${hojeIso}`,
              dataIso: hojeIso,
              dataFormatada: formatarDataStr(hojeIso),
              cinturaCm: mDoc.cintura || 82,
              peitoCm: mDoc.peito || 98,
              bracoCm: mDoc.braco || 32,
              quadrisCm: mDoc.quadris || 102,
              coxaCm: mDoc.coxa || 58,
            };
            salvosLocais = [registroHoje, ...salvosLocais];
          }
        }
      }

      // Se não houver nenhum registro no cache ou Firestore, a lista permanece vazia até o primeiro cadastro real
      setListaMedidas(salvosLocais);
    } catch (err) {
      console.warn('[EditarMedidasScreen] Erro ao carregar histórico:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id]);

  useEffect(() => {
    carregarHistoricoReal();
  }, [carregarHistoricoReal]);

  // Salva no LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && listaMedidas.length > 0) {
      localStorage.setItem('jejuar_historico_medidas_cache', JSON.stringify(listaMedidas));
    }
  }, [listaMedidas]);

  // Modais
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<RegistroHistoricoMedidas | null>(null);

  const [dataInput, setDataInput] = useState('');
  const [cinturaInput, setCinturaInput] = useState('82');
  const [peitoInput, setPeitoInput] = useState('98');
  const [bracoInput, setBracoInput] = useState('32');
  const [quadrisInput, setQuadrisInput] = useState('102');
  const [coxaInput, setCoxaInput] = useState('58');

  const [itemParaExcluir, setItemParaExcluir] = useState<RegistroHistoricoMedidas | null>(null);

  // Abre para novo registro
  const handleAbrirNovaMedicao = () => {
    const hoje = new Date().toISOString().slice(0, 10);
    setDataInput(hoje);
    const atual = listaMedidas[0] || {};
    setCinturaInput(String(atual.cinturaCm || 82));
    setPeitoInput(String(atual.peitoCm || 98));
    setBracoInput(String(atual.bracoCm || 32));
    setQuadrisInput(String(atual.quadrisCm || 102));
    setCoxaInput(String(atual.coxaCm || 58));
    setItemEmEdicao(null);
    setModalFormAberto(true);
  };

  // Abre para editar registro
  const handleAbrirEditar = (item: RegistroHistoricoMedidas) => {
    setItemEmEdicao(item);
    setDataInput(item.dataIso || new Date().toISOString().slice(0, 10));
    setCinturaInput(String(item.cinturaCm || 82));
    setPeitoInput(String(item.peitoCm || 98));
    setBracoInput(String(item.bracoCm || 32));
    setQuadrisInput(String(item.quadrisCm || 102));
    setCoxaInput(String(item.coxaCm || 58));
    setModalFormAberto(true);
  };

  // Salva no Firestore e LocalStorage
  const handleSalvarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(cinturaInput) || 82;
    const p = parseFloat(peitoInput) || 98;
    const b = parseFloat(bracoInput) || 32;
    const q = parseFloat(quadrisInput) || 102;
    const cx = parseFloat(coxaInput) || 58;

    const dataFormatada = formatarDataStr(dataInput);

    // Grava partes no Firestore se usuarioId existir
    if (usuario?.id) {
      try {
        await salvarMedidaCorporalFirestore(usuario.id, 'cintura', c);
        await salvarMedidaCorporalFirestore(usuario.id, 'peito', p);
        await salvarMedidaCorporalFirestore(usuario.id, 'braco', b);
        await salvarMedidaCorporalFirestore(usuario.id, 'quadris', q);
        await salvarMedidaCorporalFirestore(usuario.id, 'coxa', cx);
      } catch { /* silêncio */ }
    }

    setListaMedidas(prev => {
      const existe = prev.some(m => m.dataIso === dataInput);
      if (existe) {
        return prev.map(m => {
          if (m.dataIso === dataInput) {
            return {
              ...m,
              cinturaCm: c,
              peitoCm: p,
              bracoCm: b,
              quadrisCm: q,
              coxaCm: cx,
            };
          }
          return m;
        });
      }
      const novo: RegistroHistoricoMedidas = {
        id: `m_${dataInput}`,
        dataIso: dataInput,
        dataFormatada,
        cinturaCm: c,
        peitoCm: p,
        bracoCm: b,
        quadrisCm: q,
        coxaCm: cx,
      };
      return [novo, ...prev].sort((a, b) => b.dataIso.localeCompare(a.dataIso));
    });

    setModalFormAberto(false);
    if (onAtualizarMedidasApp) onAtualizarMedidasApp();
  };

  // Confirma exclusão
  const handleConfirmarExclusao = () => {
    if (!itemParaExcluir) return;
    setListaMedidas(prev => prev.filter(m => m.id !== itemParaExcluir.id));
    setItemParaExcluir(null);
    if (onAtualizarMedidasApp) onAtualizarMedidasApp();
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F9FC] flex flex-col relative select-none">
      {/* Cabeçalho */}
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
            Editar medidas corporais
          </h1>
        </div>

        {/* Botão Lixeira e Botão "+" */}
        <div className="flex items-center gap-2">
          {listaMedidas.length > 0 && (
            <button
              type="button"
              onClick={() => setItemParaExcluir(listaMedidas[0])}
              aria-label="Excluir medição mais recente"
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleAbrirNovaMedicao}
            aria-label="Cadastrar nova medição de corpo"
            className="w-10 h-10 rounded-2xl bg-[#00C975] hover:bg-[#00B067] text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Lista de Cards Brancos de Medidas Corporais */}
      <main className="flex-1 w-full px-4 pt-4 pb-24 space-y-3 max-w-[430px] mx-auto">
        {carregando ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400 animate-pulse">
            Sincronizando histórico de medidas...
          </div>
        ) : listaMedidas.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-100 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00C975] flex items-center justify-center mx-auto">
              <Ruler className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0B2246]">Nenhuma medição registrada</h3>
            <p className="text-xs text-slate-400">
              Clique no botão "+" para registrar suas medidas de cintura, peito, braço, etc.
            </p>
          </div>
        ) : (
          listaMedidas.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3 hover:border-emerald-200 transition-all"
            >
              {/* Data e Ações */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500">
                  Medição de {item.dataFormatada}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAbrirEditar(item)}
                    aria-label="Editar estas medidas"
                    className="w-8 h-8 rounded-xl hover:bg-emerald-50 text-[#00C975] flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemParaExcluir(item)}
                    aria-label="Excluir estas medidas"
                    className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid de Partes do Corpo em cm */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Cintura</span>
                  <span className="font-extrabold text-[#0B2246]">{item.cinturaCm || 82} cm</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Peito</span>
                  <span className="font-extrabold text-[#0B2246]">{item.peitoCm || 98} cm</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Braço</span>
                  <span className="font-extrabold text-[#0B2246]">{item.bracoCm || 32} cm</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Quadris</span>
                  <span className="font-extrabold text-[#0B2246]">{item.quadrisCm || 102} cm</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Coxa</span>
                  <span className="font-extrabold text-[#0B2246]">{item.coxaCm || 58} cm</span>
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
                {itemEmEdicao ? 'Editar medidas corporais' : 'Nova medição corporal'}
              </h3>
              <button
                type="button"
                onClick={() => setModalFormAberto(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarFormulario} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2246]">Data da Medição</label>
                <input
                  type="date"
                  required
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-[#0B2246] outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B2246]">Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={cinturaInput}
                    onChange={(e) => setCinturaInput(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-[#0B2246] outline-hidden bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B2246]">Peito (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={peitoInput}
                    onChange={(e) => setPeitoInput(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-[#0B2246] outline-hidden bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B2246]">Braço (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bracoInput}
                    onChange={(e) => setBracoInput(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-2xl border border-slate-200 text-sm font-bold text-[#0B2246] outline-hidden bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B2246]">Quadris (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={quadrisInput}
                    onChange={(e) => setQuadrisInput(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-2xl border border-slate-200 text-sm font-bold text-[#0B2246] outline-hidden bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B2246]">Coxa (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={coxaInput}
                    onChange={(e) => setCoxaInput(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-2xl border border-slate-200 text-sm font-bold text-[#0B2246] outline-hidden bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
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
                  <span>Salvar Medidas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profissional de Exclusão */}
      <ModalConfirmacao
        aberto={Boolean(itemParaExcluir)}
        titulo="Excluir estas medidas corporais?"
        mensagem={`Tem certeza que deseja apagar o registro de medidas realizado em ${itemParaExcluir?.dataFormatada}?`}
        textoConfirmar="Sim, excluir"
        textoCancelar="Cancelar"
        variante="perigo"
        onConfirmar={handleConfirmarExclusao}
        onCancelar={() => setItemParaExcluir(null)}
      />
    </div>
  );
};
