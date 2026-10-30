/**
 * @file ModalAdicionarAguaCustomizada.tsx
 * @description Modal para registrar uma quantidade personalizada de água consumida (ex: garrafinha de 350ml, squeeze de 650ml).
 */

import React, { useState } from 'react';
import { X, Plus, GlassWater } from 'lucide-react';

interface ModalAdicionarAguaCustomizadaProps {
  aberto: boolean;
  onAdicionar: (quantidadeMl: number) => void;
  onFechar: () => void;
}

export const ModalAdicionarAguaCustomizada: React.FC<ModalAdicionarAguaCustomizadaProps> = ({
  aberto,
  onAdicionar,
  onFechar
}) => {
  const [quantidadeDigitada, setQuantidadeDigitada] = useState<string>('300');
  const [erro, setErro] = useState<string>('');

  if (!aberto) return null;

  const sugestoes = [150, 200, 350, 400, 600, 750];

  const handleConfirmar = () => {
    const valorNumerico = parseInt(quantidadeDigitada.replace(/\D/g, ''), 10);
    if (!valorNumerico || isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe uma quantidade válida em ml.');
      return;
    }
    if (valorNumerico > 2000) {
      setErro('A quantidade máxima em um único registro é de 2.000 ml.');
      return;
    }
    setErro('');
    onAdicionar(valorNumerico);
    onFechar();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-agua-custom"
    >
      <div 
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 border border-blue-50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#2F80ED]">
              <GlassWater className="w-5 h-5" />
            </div>
            <div>
              <h3 id="titulo-agua-custom" className="text-lg font-bold text-[#092244]">
                Quantidade personalizada
              </h3>
              <p className="text-xs text-gray-500">Registre o tamanho do seu recipiente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 active:scale-90 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campo com formatação numérica */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Volume a ser adicionado:
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantidadeDigitada}
              onChange={(e) => {
                const limpo = e.target.value.replace(/\D/g, '');
                setQuantidadeDigitada(limpo);
                if (erro) setErro('');
              }}
              className="w-full h-12 px-4 pr-14 text-xl font-black text-[#092244] bg-[#F5F9FC] border border-blue-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
              placeholder="350"
            />
            <span className="absolute right-4 text-sm font-bold text-gray-400 pointer-events-none">
              ml
            </span>
          </div>
          {erro && (
            <p className="text-xs text-red-500 font-medium mt-1.5 animate-in fade-in">
              {erro}
            </p>
          )}
        </div>

        {/* Sugestões rápidas */}
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Volumes comuns
          </span>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((vol) => (
              <button
                key={vol}
                type="button"
                onClick={() => {
                  setQuantidadeDigitada(String(vol));
                  setErro('');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  quantidadeDigitada === String(vol)
                    ? 'bg-[#2F80ED] text-white shadow-xs'
                    : 'bg-[#F0F6FF] text-[#2F80ED] hover:bg-blue-100'
                }`}
              >
                +{vol} ml
              </button>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl active:scale-95 transition-all min-h-[44px] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            className="flex-1 py-3 text-sm font-bold text-white bg-[#2F80ED] hover:bg-[#256ac7] rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
