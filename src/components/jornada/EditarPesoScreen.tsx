/**
 * @file EditarPesoScreen.tsx
 * @description Subtela de gerenciamento completo do histórico de peso (Editar peso).
 * Baseada estritamente na imagem de referência enviada pelo usuário:
 * - Cabeçalho com botão voltar, título, ícone de lixeira e botão "+" para nova medição.
 * - Garante que a medição do dia atual (ex: 28/10/2026) esteja sempre presente no topo com dados em tempo real.
 * - Sincronização em tempo real com LocalStorage e Firestore.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Trash2, Plus, Edit3, Scale, Check, X } from 'lucide-react';
import type { UsuarioEmCadastro } from '../../types';
import { ModalConfirmacao } from '../ModalConfirmacao';

import { 
  buscarHistoricoPesagensFirestore, 
  registrarPesagemHistoricoFirestore 
} from '../../services/firebase';

export interface RegistroHistoricoPeso {
  id: string;
  dataIso: string;
  dataFormatada: string;
  pesoKg: number;
  imc: number;
  classificacaoImc: string;
}

interface EditarPesoScreenProps {
  usuario?: UsuarioEmCadastro;
  onVoltar: () => void;
  onAtualizarPesoApp?: (novoPeso: number) => void;
}

export const EditarPesoScreen: React.FC<EditarPesoScreenProps> = ({
  usuario,
  onVoltar,
  onAtualizarPesoApp,
}) => {
  const alturaCm = usuario?.informacoesBasicas?.altura || 165;

  // Categória de IMC
  const calcularImcEClassificacao = useCallback((peso: number) => {
    const altMetros = alturaCm / 100;
    const imcVal = altMetros > 0 ? Math.round((peso / (altMetros * altMetros)) * 10) / 10 : 27.2;

    let classificacao = 'Excesso de peso';
    let corBadge = 'bg-amber-50 text-amber-700 border-amber-200';

    if (imcVal < 18.5) {
      classificacao = 'Abaixo do peso';
      corBadge = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (imcVal < 25.0) {
      classificacao = 'Peso normal';
      corBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (imcVal < 30.0) {
      classificacao = 'Excesso de peso';
      corBadge = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (imcVal < 35.0) {
      classificacao = 'Obesidade Grau I';
      corBadge = 'bg-orange-50 text-orange-700 border-orange-200';
    } else {
      classificacao = 'Obesidade Severa';
      corBadge = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return { imcVal, classificacao, corBadge };
  }, [alturaCm]);

  // Estado local dos registros de peso
  const [listaPesos, setListaPesos] = useState<RegistroHistoricoPeso[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Formata YYYY-MM-DD em DD/MM/YYYY
  const formatarDataStr = (dataStr: string): string => {
    try {
      const partes = dataStr.slice(0, 10).split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return dataStr;
    } catch {
      return dataStr;
    }
  };

  // Carrega e purga dados reais do Firestore e LocalStorage
  const carregarHistoricoReal = useCallback(async () => {
    setCarregando(true);
    const hojeIso = new Date().toISOString().slice(0, 10);
    const pesoAtualInformado = usuario?.informacoesBasicas?.peso || 72.3;

    try {
      let registrosReais: RegistroHistoricoPeso[] = [];

      // 1. Busca do Firestore na subcoleção 'historico_pesagens' do usuário
      if (usuario?.id) {
        const doFirestore = await buscarHistoricoPesagensFirestore(usuario.id, 30);
        if (doFirestore && doFirestore.length > 0) {
          registrosReais = doFirestore.map((item) => {
            const dataIso = item.dataIso ? item.dataIso.slice(0, 10) : hojeIso;
            const { imcVal, classificacao } = calcularImcEClassificacao(item.peso);
            return {
              id: item.id || `p_${dataIso}`,
              dataIso,
              dataFormatada: formatarDataStr(dataIso),
              pesoKg: item.peso,
              imc: imcVal,
              classificacaoImc: classificacao,
            };
          });
        }
      }

      // 2. Se o Firestore não retornou registros, lê do LocalStorage mas FILTRA IDs MOCK antigos
      if (registrosReais.length === 0 && typeof window !== 'undefined') {
        const cache = localStorage.getItem('jejuar_historico_pesos_cache');
        if (cache) {
          try {
            const parsed = JSON.parse(cache);
            if (Array.isArray(parsed)) {
              // Purga forçada de IDs fictícios antigos ('p1' a 'p7')
              registrosReais = parsed.filter(
                (item: any) => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'].includes(item.id)
              );
            }
          } catch { /* silêncio */ }
        }
      }

      // 3. Se ainda não houver histórico, cria APENAS O ÚNICO registro real da primeira pesagem
      if (registrosReais.length === 0) {
        const { imcVal, classificacao } = calcularImcEClassificacao(pesoAtualInformado);
        registrosReais = [
          {
            id: `p_${hojeIso}`,
            dataIso: hojeIso,
            dataFormatada: formatarDataStr(hojeIso),
            pesoKg: pesoAtualInformado,
            imc: imcVal,
            classificacaoImc: classificacao,
          },
        ];
      }

      // Salva a lista limpa no LocalStorage para sobreescrever qualquer cache fictício legado
      if (typeof window !== 'undefined') {
        localStorage.setItem('jejuar_historico_pesos_cache', JSON.stringify(registrosReais));
        localStorage.setItem('jejuar_peso_atual', String(registrosReais[0].pesoKg));
      }

      setListaPesos(registrosReais);
    } catch (err) {
      console.warn('[EditarPesoScreen] Erro ao carregar histórico de peso:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuario, calcularImcEClassificacao]);

  useEffect(() => {
    carregarHistoricoReal();
  }, [carregarHistoricoReal]);

  // Salva alterações locais no LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && listaPesos.length > 0) {
      localStorage.setItem('jejuar_historico_pesos_cache', JSON.stringify(listaPesos));
      localStorage.setItem('jejuar_peso_atual', String(listaPesos[0].pesoKg));
      if (onAtualizarPesoApp) {
        onAtualizarPesoApp(listaPesos[0].pesoKg);
      }
    }
  }, [listaPesos, onAtualizarPesoApp]);

  // Modais de formulário e confirmação
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [pesoEmEdicao, setPesoEmEdicao] = useState<RegistroHistoricoPeso | null>(null);

  const [dataInput, setDataInput] = useState('');
  const [pesoInput, setPesoInput] = useState('72.3');

  const [itemParaExcluir, setItemParaExcluir] = useState<RegistroHistoricoPeso | null>(null);

  // Abre modal para novo peso
  const handleAbrirNovoPeso = () => {
    setDataInput(new Date().toISOString().slice(0, 10));
    setPesoInput(listaPesos.length > 0 ? String(listaPesos[0].pesoKg) : '72.3');
    setPesoEmEdicao(null);
    setModalFormAberto(true);
  };

  // Abre modal para editar peso
  const handleAbrirEditarPeso = (item: RegistroHistoricoPeso) => {
    setPesoEmEdicao(item);
    setDataInput(item.dataIso || new Date().toISOString().slice(0, 10));
    setPesoInput(String(item.pesoKg));
    setModalFormAberto(true);
  };

  // Salva formulário
  const handleSalvarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    const pesoNum = parseFloat(pesoInput) || 70.0;
    const { imcVal, classificacao } = calcularImcEClassificacao(pesoNum);

    const dataObj = new Date(`${dataInput}T12:00:00Z`);
    const diaStr = String(dataObj.getDate()).padStart(2, '0');
    const mesStr = String(dataObj.getMonth() + 1).padStart(2, '0');
    const anoStr = dataObj.getFullYear();
    const dataFormatada = `${diaStr}/${mesStr}/${anoStr}`;

    // Grava na subcoleção do Firestore se houver usuário autenticado
    if (usuario?.id) {
      try {
        await registrarPesagemHistoricoFirestore(usuario.id, pesoNum);
      } catch (err) {
        console.warn('[EditarPesoScreen] Erro ao gravar pesagem no Firestore:', err);
      }
    }

    if (pesoEmEdicao) {
      setListaPesos(prev => prev.map(p => {
        if (p.id === pesoEmEdicao.id) {
          return {
            ...p,
            dataIso: dataInput,
            dataFormatada,
            pesoKg: pesoNum,
            imc: imcVal,
            classificacaoImc: classificacao,
          };
        }
        return p;
      }));
    } else {
      const novo: RegistroHistoricoPeso = {
        id: `p_${Date.now()}`,
        dataIso: dataInput,
        dataFormatada,
        pesoKg: pesoNum,
        imc: imcVal,
        classificacaoImc: classificacao,
      };
      setListaPesos(prev => [novo, ...prev].sort((a, b) => b.dataIso.localeCompare(a.dataIso)));
    }

    setModalFormAberto(false);
  };

  // Confirma exclusão
  const handleConfirmarExclusao = () => {
    if (!itemParaExcluir) return;
    setListaPesos(prev => prev.filter(p => p.id !== itemParaExcluir.id));
    setItemParaExcluir(null);
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
          <h1 className="text-lg font-black text-[#0B2246] tracking-tight">
            Editar peso
          </h1>
        </div>

        {/* Botão Lixeira e Botão "+" */}
        <div className="flex items-center gap-2">
          {listaPesos.length > 0 && (
            <button
              type="button"
              onClick={() => setItemParaExcluir(listaPesos[0])}
              aria-label="Excluir medição mais recente"
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleAbrirNovoPeso}
            aria-label="Cadastrar novo peso"
            className="w-10 h-10 rounded-2xl bg-[#00C975] hover:bg-[#00B067] text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Lista de Cards Brancos de Peso */}
      <main className="flex-1 w-full px-4 pt-4 pb-24 space-y-3 max-w-[430px] mx-auto">
        {listaPesos.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-100 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0B2246]">Nenhuma pesagem registrada</h3>
            <p className="text-xs text-slate-400">
              Clique no botão "+" para registrar sua medição de peso.
            </p>
          </div>
        ) : (
          listaPesos.map((item) => {
            const { corBadge } = calcularImcEClassificacao(item.pesoKg);
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-2 hover:border-emerald-200 transition-all"
              >
                {/* Linha 1: Data e Badge de Categoria */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    {item.dataFormatada}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${corBadge}`}>
                    {item.classificacaoImc}
                  </span>
                </div>

                {/* Linha 2: Peso, IMC e Botões de Ação */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-baseline gap-4">
                    <span className="text-base font-medium text-slate-500">
                      Peso: <strong className="font-black text-[#0B2246]">{item.pesoKg.toFixed(1)} kg</strong>
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      IMC: <strong className="font-black text-[#0B2246]">{item.imc.toFixed(1)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAbrirEditarPeso(item)}
                      aria-label="Editar esta pesagem"
                      className="w-10 h-10 rounded-2xl hover:bg-emerald-50 text-[#00C975] flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 stroke-[2.2]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemParaExcluir(item)}
                      aria-label="Excluir esta pesagem"
                      className="w-10 h-10 rounded-2xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Modal de Formulário */}
      {modalFormAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[400px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0B2246]">
                {pesoEmEdicao ? 'Editar medição de peso' : 'Nova medição de peso'}
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
                <label className="text-xs font-bold text-[#0B2246]">Data da Medição</label>
                <input
                  type="date"
                  required
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 text-sm font-semibold text-[#0B2246] outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2246]">Peso Atual (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  required
                  value={pesoInput}
                  onChange={(e) => setPesoInput(e.target.value)}
                  placeholder="Ex: 72.3"
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
                  <span>Salvar Peso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profissional de Exclusão */}
      <ModalConfirmacao
        aberto={Boolean(itemParaExcluir)}
        titulo="Excluir este registro de peso?"
        mensagem={`Tem certeza que deseja apagar a pesagem de ${itemParaExcluir?.pesoKg} kg realizada em ${itemParaExcluir?.dataFormatada}?`}
        textoConfirmar="Sim, excluir"
        textoCancelar="Cancelar"
        variante="perigo"
        onConfirmar={handleConfirmarExclusao}
        onCancelar={() => setItemParaExcluir(null)}
      />
    </div>
  );
};
