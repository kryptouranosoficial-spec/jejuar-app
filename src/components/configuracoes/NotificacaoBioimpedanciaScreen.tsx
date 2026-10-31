/**
 * @file NotificacaoBioimpedanciaScreen.tsx
 * @description Tela de configurações da Notificação de Bioimpedância.
 * Segue o mesmo padrão visual da tela de Notificação de Peso, permitindo alternar:
 * - Lembrete de registro de bioimpedância (Switch verde #00C975)
 * - Hora do lembrete (Drum picker modal)
 * - Dia do lembrete (Periodicidade de 7, 15 ou 30 dias após a última Bioimpedância)
 * - Som do lembrete
 * Exibe também o resumo inteligente da última medição e da data programada do próximo alarme
 * (ou informa que o alarme só existirá após o primeiro registro de bioimpedância).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronRight, Calendar, Check, X, AlertCircle, ClipboardCheck } from 'lucide-react';
import type { ConfiguracoesNotificacoes } from '../../types';
import type { RegistroBioimpedancia } from '../../types/bioimpedancia';
import { listarBioimpedancias, salvarConfiguracaoReteste } from '../../services/bioimpedanciaService';
import { calcularDataAlvoBioimpedancia, agendarNotificacoesBioimpedancia } from '../../services/localNotificationService';
import { ModalDefinirHoraLembrete } from './ModalDefinirHoraLembrete';
import { ModalEscolherSomLembrete } from './ModalEscolherSomLembrete';

interface NotificacaoBioimpedanciaScreenProps {
  /** ID do usuário autenticado */
  usuarioId?: string;
  /** Objeto com o estado atual das notificações */
  notificacoes: ConfiguracoesNotificacoes;
  /** Callback acionado ao alterar qualquer opção de notificação de bioimpedância */
  onAtualizarNotificacoes: (novasNotificacoes: Partial<ConfiguracoesNotificacoes>) => void;
  /** Callback acionado ao voltar para a tela anterior de Notificação */
  onVoltar: () => void;
}

const OPCOES_INTERVALO_DIAS = [
  {
    dias: 7,
    rotuloCurto: 'A cada 7 dias',
    titulo: '7 dias (1 semana)',
    descricao: 'Acompanhamento semanal intensivo após a última medição',
  },
  {
    dias: 15,
    rotuloCurto: 'A cada 15 dias',
    titulo: '15 dias (Quinzenal)',
    descricao: 'Equilíbrio ideal para avaliar perda de gordura e massa magra',
  },
  {
    dias: 30,
    rotuloCurto: 'A cada 30 dias',
    titulo: '30 dias (Mensal)',
    descricao: 'Ciclo mensal completo de recomposição corporal',
  },
];

export const NotificacaoBioimpedanciaScreen: React.FC<NotificacaoBioimpedanciaScreenProps> = ({
  usuarioId = '',
  notificacoes,
  onAtualizarNotificacoes,
  onVoltar,
}) => {
  const [modalHoraAberto, setModalHoraAberto] = useState<boolean>(false);
  const [modalIntervaloAberto, setModalIntervaloAberto] = useState<boolean>(false);
  const [modalSomAberto, setModalSomAberto] = useState<boolean>(false);

  // Estado da última bioimpedância registrada pelo usuário
  const [ultimoExame, setUltimoExame] = useState<RegistroBioimpedancia | null>(null);
  const [carregandoExames, setCarregandoExames] = useState<boolean>(true);

  const lembreteAtivo = notificacoes.bioimpedanciaLembreteAtivo ?? true;
  const horaLembrete = notificacoes.bioimpedanciaHora || '08:00';
  const intervaloDias =
    notificacoes.bioimpedanciaIntervaloDias === 7 ||
    notificacoes.bioimpedanciaIntervaloDias === 15 ||
    notificacoes.bioimpedanciaIntervaloDias === 30
      ? notificacoes.bioimpedanciaIntervaloDias
      : 15;
  const somLembrete = notificacoes.bioimpedanciaSom || 'Padrão';

  // Estado temporário para o modal de seleção de período (7, 15 ou 30 dias)
  const [intervaloTemp, setIntervaloTemp] = useState<number>(intervaloDias);

  // Carrega os registros de bioimpedância para verificar a data da última medição
  useEffect(() => {
    let ativo = true;
    setCarregandoExames(true);

    listarBioimpedancias(usuarioId)
      .then((lista) => {
        if (!ativo) return;
        const maisRecente = lista.length > 0 ? lista[0] : null;
        setUltimoExame(maisRecente);

        // Agenda (ou remove caso não haja exame) o alarme nativo
        agendarNotificacoesBioimpedancia({
          ativo: lembreteAtivo,
          hora: horaLembrete,
          intervaloDias,
          dataUltimoExame: maisRecente?.dataExame || null,
        }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setCarregandoExames(false);
      });

    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  // Calcula a data exata do próximo alarme caso exista uma última bioimpedância
  const dataProximoAlarme = useMemo(() => {
    if (!ultimoExame?.dataExame) return null;
    return calcularDataAlvoBioimpedancia(ultimoExame.dataExame, intervaloDias, horaLembrete);
  }, [ultimoExame?.dataExame, intervaloDias, horaLembrete]);

  // Formata data YYYY-MM-DD para DD/MM/AAAA
  const formatarDataBR = (dataStr: string): string => {
    const partes = dataStr.slice(0, 10).split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // Atualiza e persiste qualquer alteração nas configurações de bioimpedância
  const atualizarConfigBio = (parcial: Partial<ConfiguracoesNotificacoes>) => {
    const novoAtivo =
      parcial.bioimpedanciaLembreteAtivo !== undefined
        ? parcial.bioimpedanciaLembreteAtivo
        : lembreteAtivo;
    const novaHora = parcial.bioimpedanciaHora || horaLembrete;
    const novoIntervalo = parcial.bioimpedanciaIntervaloDias || intervaloDias;
    const novoSom = parcial.bioimpedanciaSom || somLembrete;

    onAtualizarNotificacoes(parcial);

    // Sincroniza também com o serviço de bioimpedância no Firestore
    salvarConfiguracaoReteste(usuarioId, {
      frequenciaDias: novoIntervalo,
      lembretesAtivos: novoAtivo,
      horaLembrete: novaHora,
      somLembrete: novoSom,
    }).catch(() => {});

    // Limpa trava diária caso o usuário altere o horário ou período
    if (typeof window !== 'undefined') {
      const hojeStr = new Date().toISOString().slice(0, 10);
      localStorage.removeItem(`jejuar_alerta_bio_emitido_${hojeStr}`);
    }

    // Reagenda ou cancela o alarme nativo de acordo com a existência do último exame
    agendarNotificacoesBioimpedancia({
      ativo: novoAtivo,
      hora: novaHora,
      intervaloDias: novoIntervalo,
      dataUltimoExame: ultimoExame?.dataExame || null,
    }).catch(() => {});
  };

  const rotuloIntervaloAtual =
    OPCOES_INTERVALO_DIAS.find((op) => op.dias === intervaloDias)?.rotuloCurto ||
    `A cada ${intervaloDias} dias`;

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F9FC] select-none">
      
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar para Notificações"
          className="w-11 h-11 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#092244] active:scale-90 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>
        <h1 className="text-[19px] font-extrabold text-[#092244] tracking-tight">
          Notificação de bioimpedância
        </h1>
      </header>

      {/* Conteúdo do Card Inset */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          {/* 1. Lembrete de registro de bioimpedância */}
          <div className="flex items-center justify-between p-4 min-h-[52px]">
            <span className="text-[15px] font-semibold text-[#092244] pr-3">
              Lembrete de registro de bioimpedância
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={lembreteAtivo}
              onClick={() =>
                atualizarConfigBio({ bioimpedanciaLembreteAtivo: !lembreteAtivo })
              }
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                lembreteAtivo ? 'bg-[#00C975]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  lembreteAtivo ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 2. Hora do lembrete */}
          <button
            type="button"
            disabled={!lembreteAtivo}
            onClick={() => setModalHoraAberto(true)}
            className={`w-full flex items-center justify-between p-4 min-h-[52px] text-left transition-colors ${
              !lembreteAtivo
                ? 'opacity-40 cursor-not-allowed'
                : 'cursor-pointer hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Hora do lembrete
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
              <span className="tabular-nums font-semibold text-slate-600">
                {horaLembrete}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* 3. Dia do lembrete (Periodicidade de 7, 15 ou 30 dias após a última bioimpedância) */}
          <button
            type="button"
            disabled={!lembreteAtivo}
            onClick={() => {
              setIntervaloTemp(intervaloDias);
              setModalIntervaloAberto(true);
            }}
            className={`w-full flex items-center justify-between p-4 min-h-[52px] text-left transition-colors ${
              !lembreteAtivo
                ? 'opacity-40 cursor-not-allowed'
                : 'cursor-pointer hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Dia do lembrete
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium max-w-[200px]">
              <span className="truncate font-medium text-slate-600">
                {rotuloIntervaloAtual}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </button>

          {/* 4. Som do lembrete */}
          <button
            type="button"
            disabled={!lembreteAtivo}
            onClick={() => setModalSomAberto(true)}
            className={`w-full flex items-center justify-between p-4 min-h-[52px] text-left transition-colors ${
              !lembreteAtivo
                ? 'opacity-40 cursor-not-allowed'
                : 'cursor-pointer hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
            <span className="text-[15px] font-semibold text-[#092244]">
              Som do lembrete
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
              <span className="font-medium text-slate-600">{somLembrete}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

        </div>

        {/* Card Informativo Inteligente sobre o Próximo Alarme */}
        {!carregandoExames && (
          <div
            className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
              !ultimoExame
                ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                : lembreteAtivo
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                !ultimoExame
                  ? 'bg-amber-100 text-amber-700'
                  : lembreteAtivo
                  ? 'bg-[#00C975]/15 text-[#006D3D]'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {!ultimoExame ? (
                <AlertCircle className="w-5 h-5 stroke-[2]" />
              ) : (
                <ClipboardCheck className="w-5 h-5 stroke-[2]" />
              )}
            </div>

            <div className="flex-1 text-xs leading-relaxed space-y-1">
              {!ultimoExame ? (
                <>
                  <p className="font-bold text-amber-900">
                    Nenhum registro de bioimpedância encontrado
                  </p>
                  <p className="text-amber-800 font-medium">
                    O alarme será agendado automaticamente para <strong>{intervaloDias} dias</strong> após a data em que você cadastrar sua primeira bioimpedância na aba <strong>Exames</strong>.
                  </p>
                </>
              ) : lembreteAtivo && dataProximoAlarme ? (
                <>
                  <p className="font-bold text-emerald-900">
                    Alarme programado a partir da última medição
                  </p>
                  <p className="text-emerald-800 font-medium">
                    Última bioimpedância em <strong>{formatarDataBR(ultimoExame.dataExame)}</strong>. Próximo alerta programado para{' '}
                    <strong>
                      {dataProximoAlarme.toLocaleDateString('pt-BR')} às {horaLembrete}
                    </strong>{' '}
                    ({intervaloDias} dias após o exame).
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-700">
                    Lembrete de bioimpedância desativado
                  </p>
                  <p className="text-slate-500 font-medium">
                    Ative a chave acima para receber o alerta {intervaloDias} dias após sua última bioimpedância ({formatarDataBR(ultimoExame.dataExame)}).
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal 1: Definir Hora do Lembrete */}
      <ModalDefinirHoraLembrete
        aberto={modalHoraAberto}
        horaAtual={horaLembrete}
        onSalvar={(novaHora) => atualizarConfigBio({ bioimpedanciaHora: novaHora })}
        onFechar={() => setModalHoraAberto(false)}
      />

      {/* Modal 2: Escolher Período (7, 15 ou 30 dias após a última bioimpedância) */}
      {modalIntervaloAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Escolher período do lembrete de bioimpedância"
        >
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom duration-200">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center">
                  <Calendar className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#092244]">
                    Período do lembrete
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Contado a partir da data da última bioimpedância
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalIntervaloAberto(false)}
                aria-label="Fechar modal"
                className="w-11 h-11 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opções: 7 dias, 15 dias ou 30 dias */}
            <div className="py-4 space-y-2.5">
              {OPCOES_INTERVALO_DIAS.map((opcao) => {
                const selecionado = intervaloTemp === opcao.dias;
                return (
                  <button
                    key={opcao.dias}
                    type="button"
                    onClick={() => setIntervaloTemp(opcao.dias)}
                    className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${
                      selecionado
                        ? 'border-[#00C975] bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <span
                        className={`text-sm font-bold block ${
                          selecionado ? 'text-emerald-950' : 'text-[#092244]'
                        }`}
                      >
                        A cada {opcao.titulo}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {opcao.descricao}
                      </span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        selecionado
                          ? 'bg-[#00C975] border-[#00C975] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selecionado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Botões de Ação */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalIntervaloAberto(false)}
                className="flex-1 min-h-[48px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  atualizarConfigBio({ bioimpedanciaIntervaloDias: intervaloTemp });
                  setModalIntervaloAberto(false);
                }}
                className="flex-1 min-h-[48px] rounded-2xl bg-[#00C975] hover:bg-[#00B066] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Seletor de Som */}
      <ModalEscolherSomLembrete
        aberto={modalSomAberto}
        somAtual={somLembrete}
        onSalvar={(novoSom) => atualizarConfigBio({ bioimpedanciaSom: novoSom })}
        onFechar={() => setModalSomAberto(false)}
      />
    </div>
  );
};
