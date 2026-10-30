/**
 * @file ModalEditarMetaAgua.tsx
 * @description Modal Bottom Sheet para editar a meta diária de água, idêntica ao padrão de referência
 * e à estrutura utilizada em Dados Corporais.
 * Apresenta valor centralizado em destaque, recomendação dinâmica com base no peso corporal (30 a 40 ml/kg)
 * e botão de ação verde esmeralda.
 */

import React, { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';

interface ModalEditarMetaAguaProps {
  aberto: boolean;
  metaAtualMl: number;
  pesoUsuarioKg?: number;
  onSalvar: (novaMetaMl: number) => void;
  onFechar: () => void;
}

export const ModalEditarMetaAgua: React.FC<ModalEditarMetaAguaProps> = ({
  aberto,
  metaAtualMl,
  pesoUsuarioKg = 72.4,
  onSalvar,
  onFechar
}) => {
  const [metaDigitada, setMetaDigitada] = useState<string>(String(metaAtualMl || 2500));
  const [exibirExplicacao, setExibirExplicacao] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');

  // Sincroniza o valor ao abrir a modal
  useEffect(() => {
    if (aberto) {
      setMetaDigitada(String(metaAtualMl || 2500));
      setErro('');
      setExibirExplicacao(false);
    }
  }, [aberto, metaAtualMl]);

  if (!aberto) return null;

  // Cálculo dinâmico da recomendação científica de hidratação (30ml a 40ml por kg de peso corporal)
  const peso = Number(pesoUsuarioKg) > 0 ? Number(pesoUsuarioKg) : 72.4;
  const recomendacaoMinima = Math.round(peso * 30);
  const recomendacaoMaxima = Math.round(peso * 40);

  const handleConfirmar = () => {
    const valorNumerico = parseInt(metaDigitada.replace(/\D/g, ''), 10);
    if (!valorNumerico || isNaN(valorNumerico) || valorNumerico < 500) {
      setErro('Informe uma meta saudável de no mínimo 500 ml.');
      return;
    }
    if (valorNumerico > 10000) {
      setErro('A meta máxima permitida é de 10.000 ml por dia.');
      return;
    }
    setErro('');
    onSalvar(valorNumerico);
    onFechar();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300 select-none animate-in fade-in"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-meta-agua"
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== Cabeçalho da Modal ==================== */}
        <div className="relative flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="w-8" /> {/* Espaçador para alinhamento central */}
          <h2 id="titulo-meta-agua" className="text-[19px] font-black text-[#092244] tracking-tight">
            Meta diária de água
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

        {/* ==================== Card Central de Valor ==================== */}
        <div className="pt-6 pb-2">
          <div className="bg-[#F0F6FF] rounded-2xl py-6 px-4 flex items-center justify-center border border-blue-50/60 shadow-inner">
            <div className="flex items-baseline justify-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={metaDigitada}
                onChange={(e) => {
                  const limpo = e.target.value.replace(/\D/g, '');
                  setMetaDigitada(limpo);
                  if (erro) setErro('');
                }}
                className="text-[44px] sm:text-[48px] font-black text-[#092244] bg-transparent text-center focus:outline-none w-48 tracking-tight tabular-nums"
                placeholder="2500"
              />
              <span className="text-[20px] font-black text-[#092244]/80">
                ml
              </span>
            </div>
          </div>

          {erro && (
            <p className="text-xs text-rose-500 font-bold text-center mt-2 animate-in fade-in">
              {erro}
            </p>
          )}
        </div>

        {/* ==================== Faixa de Recomendação com Ícone ? ==================== */}
        <div className="flex flex-col items-center justify-center pt-3 pb-6">
          <div className="flex items-center justify-center gap-1.5 text-[14px] text-slate-600 font-semibold">
            <span>
              Recomendação: {recomendacaoMinima} ml - {recomendacaoMaxima} ml
            </span>
            <button
              type="button"
              onClick={() => setExibirExplicacao((prev) => !prev)}
              aria-label="Informações sobre o cálculo da meta recomendada"
              title="Como é calculado?"
              className="w-5 h-5 rounded-full bg-[#DAF4ED] hover:bg-[#c3ece1] text-[#00C975] flex items-center justify-center text-xs font-black transition-all active:scale-90 cursor-pointer"
            >
              ?
            </button>
          </div>

          {/* Dica Científica Explicativa */}
          {exibirExplicacao && (
            <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-100 rounded-2xl text-xs text-emerald-900 leading-relaxed max-w-sm animate-in fade-in slide-in-from-top-1">
              <p className="font-bold mb-0.5 flex items-center gap-1 text-[#008A4D]">
                <HelpCircle className="w-3.5 h-3.5" />
                Cálculo personalizado para você
              </p>
              A recomendação ideal de hidratação varia de <strong>30 a 40 ml por quilograma</strong> de peso corporal ({peso.toFixed(1)} kg), essencial para manter seu metabolismo ativo e facilitar o jejum intermitente.
            </div>
          )}
        </div>

        {/* ==================== Botão de Ação Salvar ==================== */}
        <div className="pb-3">
          <button
            type="button"
            onClick={handleConfirmar}
            className="w-full h-13 bg-[#00C975] hover:bg-[#00B76A] active:scale-[0.98] text-white text-[16px] font-black rounded-full shadow-lg shadow-[#00C975]/25 transition-all flex items-center justify-center min-h-[50px] cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
