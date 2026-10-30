/**
 * @file CardGraficoMedidasCorporais.tsx
 * @description Card do Dashboard da Jornada com resumo visual das medidas corporais em centímetros:
 * Cintura, Peito, Braço, Quadris e Coxa.
 * Possui seta no canto superior direito para abrir a subtela dedicada de histórico (EditarMedidasScreen).
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, Ruler, Scale } from 'lucide-react';
import type { UsuarioEmCadastro } from '../../types';
import { buscarMedidasCorporaisFirestore } from '../../services/firebase';

interface CardGraficoMedidasCorporaisProps {
  usuario?: UsuarioEmCadastro;
  onAbrirDetalhes: () => void;
}

export const CardGraficoMedidasCorporais: React.FC<CardGraficoMedidasCorporaisProps> = ({
  usuario,
  onAbrirDetalhes,
}) => {
  const [medidas, setMedidas] = useState<{
    cintura?: number;
    peito?: number;
    braco?: number;
    quadris?: number;
    coxa?: number;
  }>({
    cintura: 82,
    peito: 98,
    braco: 32,
    quadris: 102,
    coxa: 58,
  });

  useEffect(() => {
    if (usuario?.id) {
      buscarMedidasCorporaisFirestore(usuario.id).then((m) => {
        if (m) {
          setMedidas(prev => ({
            ...prev,
            cintura: m.cintura ?? prev.cintura,
            peito: m.peito ?? prev.peito,
            braco: m.braco ?? prev.braco,
            quadris: m.quadris ?? prev.quadris,
            coxa: m.coxa ?? prev.coxa,
          }));
        }
      }).catch(() => {});
    }
  }, [usuario?.id]);

  const itensMedidas = [
    { chave: 'cintura', rotulo: 'Cintura', valor: medidas.cintura || 82, cor: 'bg-emerald-50 text-[#00C975]' },
    { chave: 'peito', rotulo: 'Peito', valor: medidas.peito || 98, cor: 'bg-blue-50 text-blue-600' },
    { chave: 'braco', rotulo: 'Braço', valor: medidas.braco || 32, cor: 'bg-[#F5F9FC] text-[#0B2246]' },
    { chave: 'quadris', rotulo: 'Quadris', valor: medidas.quadris || 102, cor: 'bg-[#F5F9FC] text-[#0B2246]' },
    { chave: 'coxa', rotulo: 'Coxa', valor: medidas.coxa || 58, cor: 'bg-[#F5F9FC] text-[#0B2246]' },
  ];

  return (
    <div className="w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4 select-none">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00C975] flex items-center justify-center">
            <Ruler className="w-4 h-4 stroke-[2]" />
          </div>
          <h3 className="text-lg font-black text-[#0B2246] tracking-tight">
            Medidas corporais
          </h3>
        </div>

        <button
          type="button"
          onClick={onAbrirDetalhes}
          aria-label="Abrir histórico de medidas corporais"
          className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid com Pílulas de Medidas em Centímetros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {itensMedidas.map((item) => (
          <div
            key={item.chave}
            onClick={onAbrirDetalhes}
            role="button"
            tabIndex={0}
            className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col items-start justify-between cursor-pointer hover:bg-slate-100/60 active:scale-95 transition-all"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {item.rotulo}
            </span>
            <span className="text-base font-black text-[#0B2246] mt-0.5">
              {item.valor} <span className="text-xs font-semibold text-slate-400">cm</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
