/**
 * @file jornada/ModalNovaAnotacao.tsx
 * @description Modal interativo para criar ou editar anotações no Diário de Bordo da Jornada.
 * Inclui seletor de sentimento/humor, campo de texto expansível com foco automático,
 * tags contextuais e validações com feedback humanizado.
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, Clock, Check, Loader2, Tag, BookOpen } from 'lucide-react';
import type { AnotacaoJornada, HumorJornada } from '../../types/jornada';
import { LISTA_HUMORES_JORNADA } from '../../services/jornadaService';

interface ModalNovaAnotacaoProps {
  aberto: boolean;
  anotacaoParaEditar?: AnotacaoJornada | null;
  onSalvar: (dados: {
    titulo: string;
    conteudo: string;
    humor?: HumorJornada;
    tags?: string[];
  }) => Promise<void>;
  onFechar: () => void;
}

const TAGS_SUGESTO = ['Quebra de Jejum', 'Treino', 'Energia', 'Disposição', 'Clareza Mental', 'Reflexão'];

export const ModalNovaAnotacao: React.FC<ModalNovaAnotacaoProps> = ({
  aberto,
  anotacaoParaEditar,
  onSalvar,
  onFechar,
}) => {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [humorSelecionado, setHumorSelecionado] = useState<HumorJornada | undefined>(undefined);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Inicializa os campos ao abrir para edição ou nova anotação
  useEffect(() => {
    if (aberto) {
      if (anotacaoParaEditar) {
        setTitulo(anotacaoParaEditar.titulo);
        setConteudo(anotacaoParaEditar.conteudo);
        setHumorSelecionado(anotacaoParaEditar.humor);
        setTagsSelecionadas(anotacaoParaEditar.tags || []);
      } else {
        setTitulo('');
        setConteudo('');
        setHumorSelecionado('energico');
        setTagsSelecionadas([]);
      }
      setErro(null);
      setSalvando(false);
    }
  }, [aberto, anotacaoParaEditar]);

  if (!aberto) return null;

  const handleToggleTag = (tag: string) => {
    if (tagsSelecionadas.includes(tag)) {
      setTagsSelecionadas(tagsSelecionadas.filter(t => t !== tag));
    } else {
      setTagsSelecionadas([...tagsSelecionadas, tag]);
    }
  };

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conteudo.trim()) {
      setErro('Por favor, escreva o que você sentiu ou observou hoje.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);
      await onSalvar({
        titulo: titulo.trim() || 'Anotação do Dia',
        conteudo: conteudo.trim(),
        humor: humorSelecionado,
        tags: tagsSelecionadas,
      });
      onFechar();
    } catch {
      setErro('Não conseguimos salvar sua anotação. Verifique sua conexão e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 transition-opacity animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-anotacao-titulo"
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-anotacao-titulo" className="text-base font-bold text-slate-800">
                {anotacaoParaEditar ? 'Editar Anotação' : 'Nova Anotação no Diário'}
              </h3>
              <p className="text-xs text-slate-400">
                Registre seus sentimentos, quebra de jejum e insights
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll Seguro */}
        <form onSubmit={handleSubmeter} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {erro && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {erro}
            </div>
          )}

          {/* Como você está se sentindo? */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Como você está se sentindo?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LISTA_HUMORES_JORNADA.map(humor => {
                const ativo = humorSelecionado === humor.id;
                return (
                  <button
                    key={humor.id}
                    type="button"
                    onClick={() => setHumorSelecionado(humor.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs transition-all min-h-[54px] active:scale-95 cursor-pointer ${
                      ativo
                        ? 'border-emerald-500 bg-emerald-50/80 font-bold shadow-xs'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg leading-none mb-1">{humor.emoji}</span>
                    <span className="text-[10px] truncate max-w-full">{humor.rotulo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título da Anotação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Título (opcional)
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Quebra com ovos e abacate, Muita clareza"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              maxLength={80}
            />
          </div>

          {/* Conteúdo da Anotação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              O que você gostaria de registrar? <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              placeholder="Escreva como foi seu jejum, suas sensações corporais, o que comeu na primeira refeição ou reflexões..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
              required
            />
          </div>

          {/* Tags Sugeridas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tags contextuais
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS_SUGESTO.map(tag => {
                const ativo = tagsSelecionadas.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors min-h-[36px] cursor-pointer ${
                      ativo
                        ? 'bg-emerald-600 text-white font-medium shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 pb-1 flex gap-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="flex-1 min-h-[48px] px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 min-h-[48px] px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{anotacaoParaEditar ? 'Atualizar Anotação' : 'Salvar no Diário'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
