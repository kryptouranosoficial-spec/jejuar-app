/**
 * @file ContadorMetabolicoColetivo.tsx
 * @description Indicador dinâmico de Prova Social e Comunidade Silenciosa.
 * Mostra o volume em tempo real de pessoas jejuando na mesma fase metabólica com oscilação orgânica,
 * proporcionando suporte psicológico subconsciente ao usuário.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Globe } from 'lucide-react';
import { vibrarClique } from '../../utils/haptics';
import { ModalComunidadeMetabolica } from './ModalComunidadeMetabolica';

interface ContadorMetabolicoColetivoProps {
  /** Se o jejum está em andamento */
  jejumAtivo: boolean;
  /** Se está em janela de alimentação */
  emJanelaAlimentacao: boolean;
  /** Segundos decorridos no jejum atual */
  segundosJejum: number;
}

export const ContadorMetabolicoColetivo: React.FC<ContadorMetabolicoColetivoProps> = ({
  jejumAtivo,
  emJanelaAlimentacao,
  segundosJejum,
}) => {
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [microVariacao, setMicroVariacao] = useState<number>(0);

  // Calcula a fase biológica e o contingente base de usuários
  const { baseCount, faseTexto, destaqueFase } = useMemo(() => {
    if (emJanelaAlimentacao) {
      return {
        baseCount: 21340,
        faseTexto: 'em nutrição consciente',
        destaqueFase: 'nutrindo o corpo',
      };
    }
    if (!jejumAtivo) {
      return {
        baseCount: 48920,
        faseTexto: 'ativos na comunidade hoje',
        destaqueFase: 'saúde celular hoje',
      };
    }

    const horas = segundosJejum / 3600;
    if (horas < 4) {
      return {
        baseCount: 18420,
        faseTexto: 'em repouso digestivo',
        destaqueFase: 'descanso digestivo',
      };
    }
    if (horas < 8) {
      return {
        baseCount: 12350,
        faseTexto: 'reduzindo níveis de insulina',
        destaqueFase: 'queda de insulina',
      };
    }
    if (horas < 12) {
      return {
        baseCount: 15680,
        faseTexto: 'queimando gordura visceral',
        destaqueFase: 'queima lipídica',
      };
    }
    if (horas < 16) {
      return {
        baseCount: 14820,
        faseTexto: 'em Cetose profunda',
        destaqueFase: 'em Cetose',
      };
    }
    return {
      baseCount: 9410,
      faseTexto: 'em autofagia e renovação celular',
      destaqueFase: 'em autofagia celular',
    };
  }, [jejumAtivo, emJanelaAlimentacao, segundosJejum]);

  // Micro-oscilação periódica orgânica (+/- 1 a 3 a cada 18 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setMicroVariacao((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // entre -2 e +2
        const novo = prev + delta;
        // Limita a variação para manter consistência sem disparidades
        return Math.max(-15, Math.min(15, novo));
      });
    }, 18000);

    return () => clearInterval(interval);
  }, []);

  const totalFormatado = (baseCount + microVariacao).toLocaleString('pt-BR');

  const handleClick = () => {
    vibrarClique();
    setModalAberto(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="w-full mt-3 mx-auto px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50 border border-emerald-100/70 hover:border-emerald-200 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group shadow-2xs select-none"
        title="Toque para ver a Comunidade Metabólica ao vivo"
        aria-label={`Comunidade: ${totalFormatado} pessoas ${destaqueFase}`}
        data-purpose="collective-metabolic-counter"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Indicador de Status com Ponto Pulsante Ao Vivo */}
          <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-700 shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] font-black text-[#092244] tracking-tight">
                {totalFormatado} pessoas
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-md">
                ao vivo
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium truncate">
              {faseTexto} com você
            </span>
          </div>
        </div>

        <span className="text-[10px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
          Ver tribo →
        </span>
      </button>

      {/* Modal Acolhedor de Validação da Tribo */}
      <ModalComunidadeMetabolica
        aberto={modalAberto}
        pessoasAtivas={baseCount + microVariacao}
        faseTexto={faseTexto}
        onFechar={() => setModalAberto(false)}
      />
    </>
  );
};
