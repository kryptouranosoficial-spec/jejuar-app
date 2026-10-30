/**
 * @file BannerEstagioMetabolico.tsx
 * @description Régua horizontal interativa dos estágios metabólicos do jejum.
 * Exibe a progressão em tempo real (Glicemia, Cetose, Queima de Gordura, Autofagia)
 * e conecta o clique do usuário ao modal científico de detalhes de cada fase.
 */

import React from 'react';
import { 
  Utensils, 
  TrendingDown, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Dna, 
  Sparkles 
} from 'lucide-react';
import { 
  ESTAGIOS_METABOLICOS, 
  type EstagioMetabolico 
} from '../ModalEstagioJejum';

interface BannerEstagioMetabolicoProps {
  jejumAtivo: boolean;
  segundosJejum: number;
  horasJejumMeta: number;
  onSelecionarEstagio: (estagio: EstagioMetabolico) => void;
}

export const BannerEstagioMetabolico: React.FC<BannerEstagioMetabolicoProps> = ({
  jejumAtivo,
  segundosJejum,
  horasJejumMeta,
  onSelecionarEstagio,
}) => {
  const horasJejumAtuais = jejumAtivo ? segundosJejum / 3600 : 0;
  const estágiosExibidos = horasJejumMeta > 16 
    ? ESTAGIOS_METABOLICOS 
    : ESTAGIOS_METABOLICOS.slice(0, 5);

  return (
    <section 
      className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 select-none" 
      data-purpose="metabolic-stages-timeline"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-[#092244]">Estágios metabólicos</span>
        <span className="text-[11px] font-semibold text-slate-400">Toque no ícone para detalhes</span>
      </div>

      <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
        {/* Linha de Conexão de Fundo */}
        <div className="absolute left-6 right-6 top-[22px] h-[3px] bg-slate-100 rounded-full z-0" />
        
        {/* Linha de Conexão Preenchida em Verde Conforme os Estágios Concluídos */}
        <div 
          className="absolute left-6 top-[22px] h-[3px] bg-[#00C975] rounded-full z-0 transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, (horasJejumAtuais / (horasJejumMeta || 16)) * 100)) * 0.82}%`
          }}
        />

        {estágiosExibidos.map((estagio) => {
          const concluido = jejumAtivo && (
            estagio.horaFim !== null 
              ? horasJejumAtuais >= estagio.horaFim 
              : horasJejumAtuais >= estagio.horaInicio
          );
          const emAndamento = jejumAtivo && (
            horasJejumAtuais >= estagio.horaInicio && 
            (estagio.horaFim === null || horasJejumAtuais < estagio.horaFim)
          );

          const renderIconeInterno = () => {
            const iconeProps = { className: "w-4 h-4 stroke-[2.2]" };
            switch (estagio.iconeNome) {
              case 'utensils':
                return <Utensils {...iconeProps} />;
              case 'trending-down':
                return <TrendingDown {...iconeProps} />;
              case 'flame':
                return <Flame {...iconeProps} />;
              case 'zap':
                return <Zap {...iconeProps} />;
              case 'shield':
                return <ShieldCheck {...iconeProps} />;
              case 'dna':
                return <Dna {...iconeProps} />;
              default:
                return <Sparkles {...iconeProps} />;
            }
          };

          return (
            <div key={estagio.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => onSelecionarEstagio(estagio)}
                className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                  concluido 
                    ? 'bg-[#00C975] text-white shadow-xs' 
                    : emAndamento 
                      ? 'bg-white text-[#00C975] ring-[2.5px] ring-[#00C975] shadow-md shadow-emerald-500/20 animate-pulse' 
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                }`}
                title={`${estagio.titulo} (${estagio.faixaHoras})`}
                aria-label={`Ver detalhes do ${estagio.titulo}`}
              >
                {renderIconeInterno()}
              </button>
              
              <span className={`text-[10px] mt-1 font-bold ${
                emAndamento ? 'text-[#00C975] font-black' : concluido ? 'text-[#092244]' : 'text-slate-400'
              }`}>
                {estagio.horaInicio}h
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
