/**
 * @file ModalDefinirHoraInicio.tsx
 * @description Bottom Sheet modal moderno para ajuste de data e horário de início do jejum.
 * Renderiza um seletor visual em estilo tambor/roleta (Wheel Picker 3D) altamente animado,
 * com arrasto contínuo por toque, efeito de perspectiva cilíndrica, snap elástico e
 * bloqueio do scroll de fundo da aplicação.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { dispararFeedbackHaptico } from '../utils/haptics';

interface ModalDefinirHoraInicioProps {
  aberto: boolean;
  dataInicioAtual: Date;
  onSalvar: (novaData: Date) => void;
  onFechar: () => void;
}

interface OpcaoData {
  rotulo: string;
  dataObj: Date;
  diaMes: string;
}

interface WheelColumnProps {
  valorAtual: string;
  valorAnterior: string;
  valorProximo: string;
  onIncrementar: () => void;
  onDecrementar: () => void;
  tituloAnterior: string;
  tituloProximo: string;
}

/**
 * Componente interno de Coluna do Tambor 3D com gestos touch dinâmicos e física de snap
 */
const WheelColumn: React.FC<WheelColumnProps> = ({
  valorAtual,
  valorAnterior,
  valorProximo,
  onIncrementar,
  onDecrementar,
  tituloAnterior,
  tituloProximo,
}) => {
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPulse, setIsPulse] = useState<boolean>(false);
  const touchStartY = useRef<number | null>(null);

  const triggerPulse = () => {
    setIsPulse(true);
    dispararFeedbackHaptico('suave');
    setTimeout(() => setIsPulse(false), 180);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    // Limita a deflexão visual para no máximo 35px para manter o alinhamento
    const clampedY = Math.max(-35, Math.min(35, deltaY));
    setDragY(clampedY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 16;

    if (dragY < -threshold) {
      // Arrastou para cima -> Próximo item
      onIncrementar();
      triggerPulse();
    } else if (dragY > threshold) {
      // Arrastou para baixo -> Item anterior
      onDecrementar();
      triggerPulse();
    }

    setDragY(0);
    touchStartY.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      onIncrementar();
      triggerPulse();
    } else if (e.deltaY < 0) {
      onDecrementar();
      triggerPulse();
    }
  };

  const handleAnteriorClick = () => {
    onDecrementar();
    triggerPulse();
  };

  const handleProximoClick = () => {
    onIncrementar();
    triggerPulse();
  };

  return (
    <div
      className="flex flex-col items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none py-1 relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ perspective: '300px' }}
    >
      {/* Container animado do Tambor com deslocamento físico dragY */}
      <div
        className={`flex flex-col items-center justify-center w-full transition-transform ${
          isDragging ? 'duration-75' : 'duration-200 ease-out'
        }`}
        style={{
          transform: `translateY(${dragY}px)`,
        }}
      >
        {/* Item Superior (Retroceder) - Efeito Cilíndrico Superior */}
        <button
          type="button"
          onClick={handleAnteriorClick}
          className="h-9 flex items-center text-slate-300 hover:text-slate-500 font-semibold text-[15px] cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            transform: 'rotateX(-25deg) scale(0.88)',
            opacity: 0.45,
          }}
          title={tituloAnterior}
        >
          <span>{valorAnterior}</span>
        </button>

        {/* Item Central (Selecionado) - Destaque Principal com Pulso */}
        <div
          className={`h-[58px] flex items-center justify-center transition-all duration-200 ${
            isPulse ? 'scale-110 text-[#00C975]' : 'scale-100 text-[#092244]'
          }`}
          style={{
            transform: `rotateX(0deg) scale(${isPulse ? 1.12 : 1})`,
          }}
        >
          <span className="text-[23px] sm:text-[25px] font-black tracking-tight">
            {valorAtual}
          </span>
        </div>

        {/* Item Inferior (Avançar) - Efeito Cilíndrico Inferior */}
        <button
          type="button"
          onClick={handleProximoClick}
          className="h-9 flex items-center text-slate-300 hover:text-slate-500 font-semibold text-[15px] cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            transform: 'rotateX(25deg) scale(0.88)',
            opacity: 0.45,
          }}
          title={tituloProximo}
        >
          <span>{valorProximo}</span>
        </button>
      </div>
    </div>
  );
};

export const ModalDefinirHoraInicio: React.FC<ModalDefinirHoraInicioProps> = ({
  aberto,
  dataInicioAtual,
  onSalvar,
  onFechar,
}) => {
  // Lista dos últimos 5 dias até hoje
  const [opcoesData, setOpcoesData] = useState<OpcaoData[]>([]);
  const [indiceDataSelecionada, setIndiceDataSelecionada] = useState<number>(0);

  // Estados de Hora e Minuto
  const [horaSelecionada, setHoraSelecionada] = useState<number>(19);
  const [minutoSelecionado, setMinutoSelecionado] = useState<number>(23);

  // Ref para controlar se o modal acabou de ser aberto (evita reset em loop a cada 1 seg)
  const prevAbertoRef = useRef<boolean>(false);

  // Bloqueia a rolagem do corpo da página quando o modal estiver aberto
  useEffect(() => {
    if (aberto) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [aberto]);

  // Inicializa as datas e horários APENAS quando o modal transiciona de fechado para aberto
  useEffect(() => {
    if (!aberto) {
      prevAbertoRef.current = false;
      return;
    }

    // Se já estava aberto na renderização anterior, ignora atualizações do timer de fundo
    if (prevAbertoRef.current) {
      return;
    }

    prevAbertoRef.current = true;

    const lista: OpcaoData[] = [];
    const hoje = new Date();

    // Gera de 5 dias atrás até hoje (índice 0 = hoje/mais recente)
    for (let i = 0; i <= 5; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const diaMes = `${dia}/${mes}`;

      let rotulo = diaMes;
      if (i === 0) rotulo = `Hoje (${diaMes})`;
      else if (i === 1) rotulo = `Ontem (${diaMes})`;

      lista.push({
        rotulo,
        dataObj: d,
        diaMes,
      });
    }

    setOpcoesData(lista);

    // Ajusta a data e o horário inicial a partir de dataInicioAtual
    const dataRef =
      dataInicioAtual instanceof Date && !isNaN(dataInicioAtual.getTime())
        ? dataInicioAtual
        : new Date();

    const diaRef = String(dataRef.getDate()).padStart(2, '0');
    const mesRef = String(dataRef.getMonth() + 1).padStart(2, '0');
    const diaMesRef = `${diaRef}/${mesRef}`;

    const indiceEncontrado = lista.findIndex((item) => item.diaMes === diaMesRef);
    setIndiceDataSelecionada(indiceEncontrado !== -1 ? indiceEncontrado : 0);
    setHoraSelecionada(dataRef.getHours());
    setMinutoSelecionado(dataRef.getMinutes());
  }, [aberto, dataInicioAtual]);

  if (!aberto) return null;

  // Funções para manipular a roleta de Data
  const avancarData = () => {
    setIndiceDataSelecionada((prev) => (prev > 0 ? prev - 1 : opcoesData.length - 1));
  };
  const retrocederData = () => {
    setIndiceDataSelecionada((prev) => (prev < opcoesData.length - 1 ? prev + 1 : 0));
  };

  // Funções para manipular a roleta de Horas (0 a 23)
  const incrementarHora = () => {
    setHoraSelecionada((prev) => (prev < 23 ? prev + 1 : 0));
  };
  const decrementarHora = () => {
    setHoraSelecionada((prev) => (prev > 0 ? prev - 1 : 23));
  };

  // Funções para manipular a roleta de Minutos (0 a 59)
  const incrementarMinuto = () => {
    setMinutoSelecionado((prev) => (prev < 59 ? prev + 1 : 0));
  };
  const decrementarMinuto = () => {
    setMinutoSelecionado((prev) => (prev > 0 ? prev - 1 : 59));
  };

  // Salva e confirma o novo horário
  const handleConfirmar = () => {
    const itemData = opcoesData[indiceDataSelecionada] || opcoesData[0];
    const novaData = new Date(itemData.dataObj);
    novaData.setHours(horaSelecionada, minutoSelecionado, 0, 0);

    // Se a data/hora configurada for no futuro, limita ao momento atual
    if (novaData.getTime() > Date.now()) {
      onSalvar(new Date());
    } else {
      onSalvar(novaData);
    }
    onFechar();
  };

  // Itens adjacentes para o efeito de roleta
  const dataAtual = opcoesData[indiceDataSelecionada] || { diaMes: 'Hoje' };
  const dataAnterior =
    indiceDataSelecionada < opcoesData.length - 1
      ? opcoesData[indiceDataSelecionada + 1].diaMes
      : opcoesData[0]?.diaMes;
  const dataProxima =
    indiceDataSelecionada > 0 ? opcoesData[indiceDataSelecionada - 1].diaMes : 'Hoje';

  const horaAcima = horaSelecionada > 0 ? horaSelecionada - 1 : 23;
  const horaAbaixo = horaSelecionada < 23 ? horaSelecionada + 1 : 0;

  const minutoAcima = minutoSelecionado > 0 ? minutoSelecionado - 1 : 59;
  const minutoAbaixo = minutoSelecionado < 59 ? minutoSelecionado + 1 : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center select-none animate-in fade-in duration-200 touch-none overscroll-none"
      data-purpose="bottom-sheet-backdrop"
      onClick={onFechar}
    >
      {/* Container Bottom Sheet estilo gaveta inferior */}
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[32px] pt-6 pb-8 px-6 shadow-2xl relative animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        data-purpose="bottom-sheet-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com Título Centralizado e Botão Fechar Redondo */}
        <div className="relative flex items-center justify-center mb-6">
          <h3 className="text-[21px] font-extrabold text-[#092244] tracking-tight">
            Definir hora de início
          </h3>

          <button
            type="button"
            onClick={onFechar}
            className="absolute right-0 w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 active:scale-95 transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* ==================== Roleta / Wheel Picker 3D de Data e Horário ==================== */}
        <div className="relative w-full my-4 flex items-center justify-center">
          {/* Moldura Central Verde Esmeralda (Destaca o valor selecionado) com Efeito Glow */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[58px] rounded-2xl border-[2px] border-[#00C975] bg-[#EBFBF5]/40 shadow-[0_0_12px_rgba(0,201,117,0.15)] pointer-events-none transition-all duration-200"
          />

          <div className="w-full grid grid-cols-2 gap-4 relative z-10 py-2">
            {/* Coluna 1: Data (ex: 25/10 ou Hoje) */}
            <WheelColumn
              valorAtual={dataAtual.diaMes}
              valorAnterior={dataAnterior}
              valorProximo={dataProxima}
              onIncrementar={avancarData}
              onDecrementar={retrocederData}
              tituloAnterior="Dia anterior"
              tituloProximo="Próximo dia"
            />

            {/* Coluna 2: Horário (Horas : Minutos) */}
            <div className="flex items-center justify-center gap-2">
              {/* Tambor de Horas */}
              <WheelColumn
                valorAtual={String(horaSelecionada).padStart(2, '0')}
                valorAnterior={String(horaAcima).padStart(2, '0')}
                valorProximo={String(horaAbaixo).padStart(2, '0')}
                onIncrementar={incrementarHora}
                onDecrementar={decrementarHora}
                tituloAnterior="Diminuir hora"
                tituloProximo="Aumentar hora"
              />

              {/* Separador de Dois Pontos Animado */}
              <div className="h-[58px] flex items-center justify-center pb-0.5">
                <span className="text-[20px] font-black text-[#092244] animate-pulse">:</span>
              </div>

              {/* Tambor de Minutos */}
              <WheelColumn
                valorAtual={String(minutoSelecionado).padStart(2, '0')}
                valorAnterior={String(minutoAcima).padStart(2, '0')}
                valorProximo={String(minutoAbaixo).padStart(2, '0')}
                onIncrementar={incrementarMinuto}
                onDecrementar={decrementarMinuto}
                tituloAnterior="Diminuir minuto"
                tituloProximo="Aumentar minuto"
              />
            </div>
          </div>
        </div>

        {/* ==================== Botão Principal: Salvar ==================== */}
        <div className="mt-8 w-full">
          <button
            type="button"
            onClick={handleConfirmar}
            className="w-full py-4 rounded-full bg-[#00C975] hover:bg-[#00B568] text-white font-extrabold text-[16px] shadow-[0_4px_16px_rgba(0,201,117,0.35)] active:scale-[0.98] transition-all min-h-[52px] cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
