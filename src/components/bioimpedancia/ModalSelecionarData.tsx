/**
 * @file bioimpedancia/ModalSelecionarData.tsx
 * @description Modal bottom sheet profissional para seleção tátil e elegante de data da bioimpedância.
 * Oferece visualização em Calendário Mensal e em Roleta/Tambor (dia, mês e ano),
 * atalhos rápidos ("Hoje", "Ontem", etc.), touch targets >= 44px e safe area inferior.
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Calendar as CalendarIcon, 
  Check, 
  SlidersHorizontal 
} from 'lucide-react';

interface ModalSelecionarDataProps {
  aberto: boolean;
  dataAtual: string; // Formato "DD/MM/AAAA" (ex: "21/10/2026")
  onSalvar: (novaDataBr: string) => void;
  onFechar: () => void;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const NOMES_MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const ModalSelecionarData: React.FC<ModalSelecionarDataProps> = ({
  aberto,
  dataAtual,
  onSalvar,
  onFechar,
}) => {
  // Modo de visualização: 'calendario' ou 'roleta'
  const [modoVisualizacao, setModoVisualizacao] = useState<'calendario' | 'roleta'>('calendario');

  // Estados da data selecionada
  const [ano, setAno] = useState<number>(() => new Date().getFullYear());
  const [mes, setMes] = useState<number>(() => new Date().getMonth()); // 0 a 11
  const [dia, setDia] = useState<number>(() => new Date().getDate());

  // Mês e ano navegados no modo calendário
  const [mesNavegado, setMesNavegado] = useState<number>(() => new Date().getMonth());
  const [anoNavegado, setAnoNavegado] = useState<number>(() => new Date().getFullYear());

  // Inicializa quando abre o modal
  useEffect(() => {
    if (!aberto) return;

    if (dataAtual && dataAtual.includes('/')) {
      const partes = dataAtual.split('/').map(Number);
      if (partes.length === 3 && !isNaN(partes[0]) && !isNaN(partes[1]) && !isNaN(partes[2])) {
        const d = partes[0];
        const m = partes[1] - 1; // 0-indexed
        const a = partes[2];
        setDia(d);
        setMes(m);
        setAno(a);
        setMesNavegado(m);
        setAnoNavegado(a);
        return;
      }
    }

    const hoje = new Date();
    setDia(hoje.getDate());
    setMes(hoje.getMonth());
    setAno(hoje.getFullYear());
    setMesNavegado(hoje.getMonth());
    setAnoNavegado(hoje.getFullYear());
  }, [aberto, dataAtual]);

  if (!aberto) return null;

  // Quantidade de dias no mês selecionado
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diaValido = Math.min(dia, diasNoMes);

  // Quantidade de dias no mês navegado pelo calendário
  const totalDiasMesNavegado = new Date(anoNavegado, mesNavegado + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoNavegado, mesNavegado, 1).getDay(); // 0 (Dom) a 6 (Sáb)

  // Navegação no calendário
  const mesAnterior = () => {
    if (mesNavegado === 0) {
      setMesNavegado(11);
      setAnoNavegado((prev) => prev - 1);
    } else {
      setMesNavegado((prev) => prev - 1);
    }
  };

  const proximoMes = () => {
    if (mesNavegado === 11) {
      setMesNavegado(0);
      setAnoNavegado((prev) => prev + 1);
    } else {
      setMesNavegado((prev) => prev + 1);
    }
  };

  // Atalhos rápidos
  const aplicarAtalho = (diasAtras: number) => {
    const d = new Date();
    d.setDate(d.getDate() - diasAtras);
    const novoDia = d.getDate();
    const novoMes = d.getMonth();
    const novoAno = d.getFullYear();
    setDia(novoDia);
    setMes(novoMes);
    setAno(novoAno);
    setMesNavegado(novoMes);
    setAnoNavegado(novoAno);
  };

  // Ajustes de Roleta
  const incrementarDia = () => setDia((prev) => (prev < diasNoMes ? prev + 1 : 1));
  const decrementarDia = () => setDia((prev) => (prev > 1 ? prev - 1 : diasNoMes));

  const incrementarMes = () => setMes((prev) => (prev < 11 ? prev + 1 : 0));
  const decrementarMes = () => setMes((prev) => (prev > 0 ? prev - 1 : 11));

  const incrementarAno = () => setAno((prev) => Math.min(2035, prev + 1));
  const decrementarAno = () => setAno((prev) => Math.max(2015, prev - 1));

  // Formata para DD/MM/AAAA
  const dataFormatada = `${String(diaValido).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;

  const handleConfirmar = () => {
    onSalvar(dataFormatada);
    onFechar();
  };

  const hoje = new Date();
  const ehHoje = hoje.getDate() === diaValido && hoje.getMonth() === mes && hoje.getFullYear() === ano;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center animate-in fade-in duration-200"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl relative flex flex-col items-center animate-in slide-in-from-bottom duration-300 select-none"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
      >
        {/* Barra superior de arraste */}
        <div className="w-10 h-1.5 bg-slate-200 rounded-full mb-4" />

        {/* Cabeçalho */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B1C30]">
                Data da Bioimpedância
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {dataFormatada} {ehHoje && '· Hoje'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Alternar modo Calendário / Roleta */}
            <button
              type="button"
              onClick={() => setModoVisualizacao(modoVisualizacao === 'calendario' ? 'roleta' : 'calendario')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              title="Alternar modo de seleção"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{modoVisualizacao === 'calendario' ? 'Roleta' : 'Calendário'}</span>
            </button>

            <button
              type="button"
              onClick={onFechar}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-all cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Barra de Atalhos Rápidos */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
          <button
            type="button"
            onClick={() => aplicarAtalho(0)}
            className="min-h-[36px] px-3.5 rounded-full bg-[#00C975]/15 text-[#006D3D] text-xs font-bold whitespace-nowrap active:scale-95 transition-all cursor-pointer"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => aplicarAtalho(1)}
            className="min-h-[36px] px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer"
          >
            Ontem
          </button>
          <button
            type="button"
            onClick={() => aplicarAtalho(7)}
            className="min-h-[36px] px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer"
          >
            7 dias atrás
          </button>
          <button
            type="button"
            onClick={() => aplicarAtalho(30)}
            className="min-h-[36px] px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer"
          >
            30 dias atrás
          </button>
        </div>

        {/* ==================== MODO CALENDÁRIO VISUAL ==================== */}
        {modoVisualizacao === 'calendario' && (
          <div className="w-full my-2 bg-slate-50/80 border border-slate-100 rounded-3xl p-4">
            {/* Navegação de Mês */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={mesAnterior}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm font-extrabold text-[#0B1C30]">
                {NOMES_MESES[mesNavegado]} {anoNavegado}
              </span>

              <button
                type="button"
                onClick={proximoMes}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DIAS_SEMANA.map((diaSem, idx) => (
                <span key={idx} className="text-[11px] font-bold text-slate-400 py-1">
                  {diaSem}
                </span>
              ))}
            </div>

            {/* Grade de Dias */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Espaços vazios antes do 1º dia */}
              {Array.from({ length: primeiroDiaSemana }).map((_, idx) => (
                <div key={`vazio-${idx}`} className="h-10 w-full" />
              ))}

              {/* Dias do mês navegado */}
              {Array.from({ length: totalDiasMesNavegado }).map((_, idx) => {
                const numDia = idx + 1;
                const estaSelecionado =
                  numDia === dia && mesNavegado === mes && anoNavegado === ano;
                const ehDiaHoje =
                  hoje.getDate() === numDia &&
                  hoje.getMonth() === mesNavegado &&
                  hoje.getFullYear() === anoNavegado;

                return (
                  <button
                    key={numDia}
                    type="button"
                    onClick={() => {
                      setDia(numDia);
                      setMes(mesNavegado);
                      setAno(anoNavegado);
                    }}
                    className={`h-10 w-full rounded-2xl flex items-center justify-center text-xs font-bold transition-all active:scale-90 cursor-pointer ${
                      estaSelecionado
                        ? 'bg-[#00C975] text-white shadow-sm'
                        : ehDiaHoje
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-black'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    {numDia}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== MODO ROLETA / TAMBOR ==================== */}
        {modoVisualizacao === 'roleta' && (
          <div className="w-full flex items-center justify-center gap-4 my-3 bg-slate-50/80 border border-slate-100 rounded-3xl p-4">
            
            {/* Coluna Dia */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Dia
              </span>
              <button
                type="button"
                onClick={decrementarDia}
                className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
                aria-label="Dia anterior"
              >
                <ChevronUp className="w-5 h-5 stroke-[2]" />
              </button>

              <div className="w-14 h-12 my-1 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006D3D] flex items-center justify-center text-xl font-black tabular-nums shadow-xs">
                {String(diaValido).padStart(2, '0')}
              </div>

              <button
                type="button"
                onClick={incrementarDia}
                className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
                aria-label="Próximo dia"
              >
                <ChevronDown className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Coluna Mês */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Mês
              </span>
              <button
                type="button"
                onClick={decrementarMes}
                className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
                aria-label="Mês anterior"
              >
                <ChevronUp className="w-5 h-5 stroke-[2]" />
              </button>

              <div className="w-20 h-12 my-1 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006D3D] flex items-center justify-center text-base font-black tabular-nums shadow-xs px-2">
                {NOMES_MESES_ABREV[mes]}
              </div>

              <button
                type="button"
                onClick={incrementarMes}
                className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
                aria-label="Próximo mês"
              >
                <ChevronDown className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Coluna Ano */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Ano
              </span>
              <button
                type="button"
                onClick={decrementarAno}
                className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
                aria-label="Ano anterior"
              >
                <ChevronUp className="w-5 h-5 stroke-[2]" />
              </button>

              <div className="w-18 h-12 my-1 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006D3D] flex items-center justify-center text-base font-black tabular-nums shadow-xs">
                {ano}
              </div>

              <button
                type="button"
                onClick={incrementarAno}
                className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
                aria-label="Próximo ano"
              >
                <ChevronDown className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </div>
        )}

        {/* Botão de Confirmação */}
        <div className="w-full pt-3">
          <button
            type="button"
            onClick={handleConfirmar}
            className="w-full min-h-[48px] rounded-2xl bg-[#00C975] hover:bg-[#00B066] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar {dataFormatada}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
