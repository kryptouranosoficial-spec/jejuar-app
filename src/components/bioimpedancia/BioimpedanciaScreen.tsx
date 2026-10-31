/**
 * @file bioimpedancia/BioimpedanciaScreen.tsx
 * @description Tela principal do módulo de Exames & Bioimpedância do aplicativo Jejuar.
 * Substitui a antiga aba Aprender, proporcionando dashboard analítico de saúde corporal,
 * gráficos de evolução interativos, histórico cronológico, busca inteligente e lembretes de ciclo.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Calendar, 
  Flame, 
  Activity, 
  TrendingDown, 
  TrendingUp, 
  Settings, 
  RefreshCw,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import type { UsuarioEmCadastro } from '../../types';
import type { 
  RegistroBioimpedancia, 
  ConfiguracaoRetesteBioimpedancia 
} from '../../types/bioimpedancia';
import { 
  listarBioimpedancias, 
  salvarNovoExameBioimpedancia, 
  atualizarExameBioimpedancia, 
  excluirExameBioimpedancia,
  obterConfiguracaoReteste,
  salvarConfiguracaoReteste
} from '../../services/bioimpedanciaService';
import { 
  filtrarExamesPorTermo, 
  formatarDataExtensaBR, 
  formatarDecimalBR, 
  calcularStatusProximoReteste,
  calcularDeltaEvolucao,
  classificarExameBioimpedancia,
  calcularFaixaPesoIdeal
} from '../../utils/bioimpedanciaUtils';
import { agendarNotificacoesBioimpedancia } from '../../services/localNotificationService';
import { GraficoEvolucaoBioimpedancia } from './GraficoEvolucaoBioimpedancia';
import { SimuladorPreditivoBioimpedancia } from './SimuladorPreditivoBioimpedancia';
import { CardExameItem } from './CardExameItem';
import { ModalCadastroBioimpedancia } from './ModalCadastroBioimpedancia';
import { ModalDetalhesBioimpedancia } from './ModalDetalhesBioimpedancia';
import { ModalConfigurarCicloExame } from './ModalConfigurarCicloExame';
import { ModalConfirmacao } from '../ModalConfirmacao';

interface BioimpedanciaScreenProps {
  usuario?: UsuarioEmCadastro;
  onAtualizarPeso?: (novoPeso: number) => void;
}

export const BioimpedanciaScreen: React.FC<BioimpedanciaScreenProps> = ({
  usuario,
  onAtualizarPeso,
}) => {
  // Lista de exames do usuário
  const [exames, setExames] = useState<RegistroBioimpedancia[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [termoBusca, setTermoBusca] = useState<string>('');

  // Configuração de ciclo de reteste (ex: a cada 7, 15 ou 30 dias)
  const [configCiclo, setConfigCiclo] = useState<ConfiguracaoRetesteBioimpedancia>({
    frequenciaDias: 15,
    lembretesAtivos: true,
    horaLembrete: '08:00',
    somLembrete: 'Padrão',
  });

  // Modais
  const [modalCadastroAberto, setModalCadastroAberto] = useState<boolean>(false);
  const [exameParaEditar, setExameParaEditar] = useState<RegistroBioimpedancia | null>(null);
  const [exameParaVisualizar, setExameParaVisualizar] = useState<RegistroBioimpedancia | null>(null);
  const [modalCicloAberto, setModalCicloAberto] = useState<boolean>(false);
  const [idParaExcluir, setIdParaExcluir] = useState<string | null>(null);

  const usuarioId = usuario?.id || '';
  const idadeUsuario = usuario?.informacoesBasicas?.anoNascimento 
    ? new Date().getFullYear() - usuario.informacoesBasicas.anoNascimento 
    : 40;
  const generoUsuario = usuario?.informacoesBasicas?.genero || 'masculino';
  const alturaUsuario = usuario?.informacoesBasicas?.altura || 1.63;

  /**
   * Carrega os exames e as preferências de periodicidade do usuário.
   */
  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const [listaExames, config] = await Promise.all([
        listarBioimpedancias(usuarioId),
        obterConfiguracaoReteste(usuarioId),
      ]);
      setExames(listaExames);
      setConfigCiclo(config);

      // Agenda ou cancela o alarme nativo de bioimpedância com base na existência de registro
      const ordenados = [...listaExames].sort((a, b) => (b.dataExame > a.dataExame ? 1 : -1));
      const maisRecente = ordenados[0] || null;
      agendarNotificacoesBioimpedancia({
        ativo: config.lembretesAtivos ?? true,
        hora: config.horaLembrete || '08:00',
        intervaloDias: config.frequenciaDias || 15,
        dataUltimoExame: maisRecente?.dataExame || null,
      }).catch(() => {});
    } catch (err) {
      console.warn('Aviso ao carregar bioimpedâncias:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Lista ordenada por data decrescente (mais recente primeiro)
  const examesOrdenados = useMemo(() => {
    return [...exames].sort((a, b) => (b.dataExame > a.dataExame ? 1 : -1));
  }, [exames]);

  // Exames filtrados por termo de busca inteligente (case & accent insensitive)
  const examesFiltrados = useMemo(() => {
    return filtrarExamesPorTermo(examesOrdenados, termoBusca);
  }, [examesOrdenados, termoBusca]);

  // Exame mais recente
  const ultimoExame = examesOrdenados[0] || null;
  const penultimoExame = examesOrdenados[1] || null;

  // Diagnóstico do exame mais recente
  const diagnosticoUltimo = ultimoExame 
    ? classificarExameBioimpedancia(ultimoExame, idadeUsuario, generoUsuario) 
    : null;

  // Delta do último exame comparado ao anterior
  const deltaUltimo = (ultimoExame && penultimoExame)
    ? calcularDeltaEvolucao(ultimoExame, penultimoExame)
    : null;

  // Status de periodicidade para o próximo reteste
  const statusReteste = useMemo(() => {
    return calcularStatusProximoReteste(ultimoExame?.dataExame, configCiclo.frequenciaDias);
  }, [ultimoExame?.dataExame, configCiclo.frequenciaDias]);

  /**
   * Salva novo exame ou atualiza existente.
   */
  const handleSalvarExame = async (dados: Omit<RegistroBioimpedancia, 'id' | 'criadoEm'>) => {
    if (exameParaEditar) {
      await atualizarExameBioimpedancia(usuarioId, exameParaEditar.id, dados);
    } else {
      const novo = await salvarNovoExameBioimpedancia(usuarioId, dados);
      // Sincroniza o peso mais recente com o restante do aplicativo
      if (onAtualizarPeso && novo.pesoKg > 0) {
        onAtualizarPeso(novo.pesoKg);
        localStorage.setItem('jejuar_peso_atual', String(novo.pesoKg));
      }
    }
    await carregarDados();
    setModalCadastroAberto(false);
    setExameParaEditar(null);
  };

  /**
   * Abre confirmação para exclusão de um exame.
   */
  const handleSolicitarExclusao = (id: string) => {
    setIdParaExcluir(id);
    if (exameParaVisualizar?.id === id) {
      setExameParaVisualizar(null);
    }
  };

  /**
   * Executa a exclusão confirmada.
   */
  const handleConfirmarExclusao = async () => {
    if (!idParaExcluir) return;
    try {
      await excluirExameBioimpedancia(usuarioId, idParaExcluir);
      await carregarDados();
    } catch (err) {
      console.warn('Erro ao excluir exame:', err);
    } finally {
      setIdParaExcluir(null);
    }
  };

  /**
   * Salva alteração de periodicidade do reteste.
   */
  const handleSalvarConfigCiclo = async (novaConfig: ConfiguracaoRetesteBioimpedancia) => {
    const configCompleta: ConfiguracaoRetesteBioimpedancia = {
      ...configCiclo,
      ...novaConfig,
    };
    setConfigCiclo(configCompleta);
    await salvarConfiguracaoReteste(usuarioId, configCompleta);

    agendarNotificacoesBioimpedancia({
      ativo: configCompleta.lembretesAtivos ?? true,
      hora: configCompleta.horaLembrete || '08:00',
      intervaloDias: configCompleta.frequenciaDias || 15,
      dataUltimoExame: ultimoExame?.dataExame || null,
    }).catch(() => {});
  };

  return (
    <div className="w-full flex flex-col space-y-4 pb-12 select-none" data-purpose="bioimpedancia-module">
      
      {/* Topo da Aba Exames */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center shadow-xs">
            <ClipboardCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#0B1C30] tracking-tight">
              Exames & Bioimpedância
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Acompanhamento de Composição Corporal
            </p>
          </div>
        </div>

        {/* Botão Primário de Novo Exame */}
        <button
          type="button"
          onClick={() => {
            setExameParaEditar(null);
            setModalCadastroAberto(true);
          }}
          className="min-h-[44px] px-3.5 rounded-2xl bg-[#00C975] hover:bg-[#00B066] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Exame</span>
        </button>
      </div>

      {/* Alerta de Periodicidade de Reteste (Ciclo Configurável) */}
      {ultimoExame && configCiclo.lembretesAtivos && (
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-3xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white text-[#00C975] flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                {statusReteste.status === 'atrasado'
                  ? 'Reteste Sugerido Pendente'
                  : statusReteste.status === 'proximo'
                  ? 'Próximo Reteste se Aproximando'
                  : 'Ciclo de Acompanhamento'}
              </span>
              <p className="text-xs text-emerald-800 font-medium">
                {statusReteste.status === 'atrasado'
                  ? `Seu ciclo de ${configCiclo.frequenciaDias} dias encerrou. Agende sua nova bioimpedância!`
                  : statusReteste.diasRestantes === 0
                  ? `Dia da nova bioimpedância! (Ciclo de ${configCiclo.frequenciaDias} dias)`
                  : `Próximo exame sugerido em ${statusReteste.diasRestantes} dias · Ciclo de ${configCiclo.frequenciaDias} dias`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalCicloAberto(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Configurar periodicidade"
            title="Alterar frequência de reteste"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ESTADO VAZIO: Nenhum exame cadastrado ainda */}
      {!carregando && examesOrdenados.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-xs flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 rounded-3xl bg-[#00C975]/10 text-[#00C975] flex items-center justify-center mb-4">
            <ClipboardCheck className="w-8 h-8 stroke-[1.75]" />
          </div>

          <h3 className="text-base font-bold text-[#0B1C30] mb-1.5">
            Nenhum exame cadastrado ainda
          </h3>

          <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed mb-6">
            Acompanhe de perto sua evolução física, percentual de gordura corporal, massa muscular e taxa metabólica. Toque no botão abaixo para registrar sua primeira bioimpedância.
          </p>

          <button
            type="button"
            onClick={() => {
              setExameParaEditar(null);
              setModalCadastroAberto(true);
            }}
            className="min-h-[48px] px-6 rounded-2xl bg-[#00C975] hover:bg-[#00B066] text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Primeiro Exame</span>
          </button>
        </div>
      )}

      {/* SE HOUVER EXAMES CADASTRADOS */}
      {examesOrdenados.length > 0 && (
        <>
          {/* Card de Destaque do Último Exame Realizado */}
          {ultimoExame && diagnosticoUltimo && (
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Último Exame Realizado
                  </span>
                  <h3 className="text-sm font-bold text-[#0B1C30]">
                    {ultimoExame.local} · {formatarDataExtensaBR(ultimoExame.dataExame)}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setExameParaVisualizar(ultimoExame)}
                  className="text-xs font-bold text-[#00C975] hover:underline cursor-pointer"
                >
                  Ver Laudo Completo
                </button>
              </div>

              {/* Grid 2x2 com Métricas do Último Exame e Alvos Ideais em Verde */}
              {(() => {
                const faixaPesoIdeal = calcularFaixaPesoIdeal(ultimoExame.alturaMetros || alturaUsuario);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Gordura Corporal */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Gordura Corporal
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-black text-slate-900 tabular-nums">
                              {formatarDecimalBR(ultimoExame.gorduraCorporalPercentual, 1)}
                            </span>
                            <span className="text-xs font-bold text-slate-500">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-2 flex-wrap">
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md ${diagnosticoUltimo.gorduraCorporal.corFundo} ${diagnosticoUltimo.gorduraCorporal.corTexto}`}>
                            {diagnosticoUltimo.gorduraCorporal.rotulo}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                            Ideal: {diagnosticoUltimo.gorduraCorporal.faixaReferenciaTexto}
                          </span>
                        </div>
                      </div>

                      {/* Músculo Esquelético */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Músculo Esquelético
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-black text-slate-900 tabular-nums">
                              {formatarDecimalBR(ultimoExame.musculoEsqueleticoPercentual, 1)}
                            </span>
                            <span className="text-xs font-bold text-slate-500">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-2 flex-wrap">
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md ${diagnosticoUltimo.musculoEsqueletico.corFundo} ${diagnosticoUltimo.musculoEsqueletico.corTexto}`}>
                            {diagnosticoUltimo.musculoEsqueletico.rotulo}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                            Ideal: {diagnosticoUltimo.musculoEsqueletico.faixaReferenciaTexto}
                          </span>
                        </div>
                      </div>

                      {/* Gordura Visceral */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Gordura Visceral
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-black text-slate-900 tabular-nums">
                              {ultimoExame.gorduraVisceralNivel}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">nível</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-2 flex-wrap">
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md ${diagnosticoUltimo.gorduraVisceral.corFundo} ${diagnosticoUltimo.gorduraVisceral.corTexto}`}>
                            {diagnosticoUltimo.gorduraVisceral.rotulo}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                            Ideal: ≤ 9
                          </span>
                        </div>
                      </div>

                      {/* Peso e IMC */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Peso Aferido
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-black text-slate-900 tabular-nums">
                              {formatarDecimalBR(ultimoExame.pesoKg, 1)}
                            </span>
                            <span className="text-xs font-bold text-slate-500">kg</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-2 flex-wrap">
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md ${diagnosticoUltimo.imc.corFundo} ${diagnosticoUltimo.imc.corTexto}`}>
                            {diagnosticoUltimo.imc.rotulo}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                            Ideal: {faixaPesoIdeal.pesoMinKg}-{faixaPesoIdeal.pesoMaxKg}kg
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Régua de Referência Clínica Oficial (SBIM / Anvisa) */}
                    <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Posição nas Faixas Clínicas Oficiais (SBIM / Anvisa)
                      </span>

                      {/* Barra Visual de Gordura Corporal */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                          <span>Gordura Corporal</span>
                          <span className="font-bold tabular-nums text-slate-800">{formatarDecimalBR(ultimoExame.gorduraCorporalPercentual, 1)}%</span>
                        </div>
                        <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div className="h-full bg-sky-400 w-1/4" title="Baixo" />
                          <div className="h-full bg-emerald-400 w-1/4" title="Normal" />
                          <div className="h-full bg-amber-400 w-1/4" title="Alto" />
                          <div className="h-full bg-rose-400 w-1/4" title="Muito Alto" />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 px-0.5">
                          <span>Baixo</span>
                          <span>Normal (Ideal)</span>
                          <span>Alto</span>
                          <span>Muito Alto</span>
                        </div>
                      </div>

                      {/* Barra Visual de Músculo Esquelético */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                          <span>Músculo Esquelético</span>
                          <span className="font-bold tabular-nums text-slate-800">{formatarDecimalBR(ultimoExame.musculoEsqueleticoPercentual, 1)}%</span>
                        </div>
                        <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div className="h-full bg-amber-400 w-1/4" title="Abaixo" />
                          <div className="h-full bg-emerald-400 w-1/4" title="Normal" />
                          <div className="h-full bg-emerald-500 w-1/4" title="Alto" />
                          <div className="h-full bg-emerald-600 w-1/4" title="Excelente" />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 px-0.5">
                          <span>Abaixo</span>
                          <span>Normal (Ideal)</span>
                          <span>Alto</span>
                          <span>Excelente</span>
                        </div>
                      </div>
                    </div>

                    {/* Parâmetros Complementares: Metabolismo Basal e Idade Corporal */}
                    <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-100">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            Metabolismo Basal
                          </span>
                          <span className="text-xs font-black text-slate-800 tabular-nums">
                            {ultimoExame.taxaMetabolicaBasalKcal} <span className="text-[10px] font-semibold text-slate-500">Kcal</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            Idade Corporal
                          </span>
                          <span className="text-xs font-black text-slate-800 tabular-nums">
                            {ultimoExame.idadeCorporalAnos ? `${ultimoExame.idadeCorporalAnos} anos` : 'Não informada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Variação em relação ao penúltimo exame */}
              {deltaUltimo && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Comparado ao exame de {formatarDataExtensaBR(penultimoExame!.dataExame)}:
                  </span>
                  <div className="flex items-center gap-2 font-bold">
                    <span className={deltaUltimo.melhorouGordura ? 'text-emerald-600' : 'text-amber-600'}>
                      {deltaUltimo.deltaGorduraPercentual > 0 ? '+' : ''}
                      {formatarDecimalBR(deltaUltimo.deltaGorduraPercentual, 1)}% gordura
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className={deltaUltimo.melhorouMusculo ? 'text-emerald-600' : 'text-slate-600'}>
                      {deltaUltimo.deltaMusculoPercentual > 0 ? '+' : ''}
                      {formatarDecimalBR(deltaUltimo.deltaMusculoPercentual, 1)}% músculo
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gráfico de Linha de Evolução Temporal */}
          <GraficoEvolucaoBioimpedancia exames={examesOrdenados} />

          {/* Simulador Preditivo de Recomposição Corporal e Metabolismo */}
          <SimuladorPreditivoBioimpedancia
            ultimoExame={ultimoExame}
            alturaPadrao={alturaUsuario}
          />

          {/* Seção de Histórico de Exames com Busca */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0B1C30]">
                  Histórico de Exames
                </h3>
                <span className="text-[11px] text-slate-400">
                  {examesFiltrados.length} {examesFiltrados.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {/* Botão para redefinir periodicidade caso queira */}
              <button
                type="button"
                onClick={() => setModalCicloAberto(true)}
                className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full hover:bg-emerald-100 cursor-pointer"
              >
                Ciclo de {configCiclo.frequenciaDias} dias
              </button>
            </div>

            {/* Campo de Busca Inteligente (Case-insensitive e Accent-insensitive) */}
            {examesOrdenados.length > 2 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por farmácia, clínica ou data..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/15 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Lista dos Cards de Exames */}
            <div className="space-y-2.5">
              {examesFiltrados.map((exame, idx) => (
                <CardExameItem
                  key={exame.id}
                  exame={exame}
                  exameAnterior={examesFiltrados[idx + 1] || null}
                  idadeUsuario={idadeUsuario}
                  generoUsuario={generoUsuario}
                  onVisualizar={(e) => setExameParaVisualizar(e)}
                  onEditar={(e) => {
                    setExameParaEditar(e);
                    setModalCadastroAberto(true);
                  }}
                  onExcluir={(id) => handleSolicitarExclusao(id)}
                />
              ))}

              {examesFiltrados.length === 0 && termoBusca && (
                <div className="p-6 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
                  Nenhum exame encontrado para "{termoBusca}". Tente outro termo ou limpe a busca.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de Cadastro / Edição */}
      <ModalCadastroBioimpedancia
        aberto={modalCadastroAberto}
        exameParaEditar={exameParaEditar}
        alturaPadraoUsuario={alturaUsuario}
        onSalvar={handleSalvarExame}
        onExcluir={(id) => {
          setModalCadastroAberto(false);
          handleSolicitarExclusao(id);
        }}
        onFechar={() => {
          setModalCadastroAberto(false);
          setExameParaEditar(null);
        }}
      />

      {/* Modal de Detalhes do Laudo */}
      <ModalDetalhesBioimpedancia
        aberto={Boolean(exameParaVisualizar)}
        exame={exameParaVisualizar}
        exameAnterior={penultimoExame}
        idadeUsuario={idadeUsuario}
        generoUsuario={generoUsuario}
        onEditar={(e) => {
          setExameParaVisualizar(null);
          setExameParaEditar(e);
          setModalCadastroAberto(true);
        }}
        onExcluir={(id) => {
          setExameParaVisualizar(null);
          handleSolicitarExclusao(id);
        }}
        onFechar={() => setExameParaVisualizar(null)}
      />

      {/* Modal de Configuração do Ciclo de Reteste */}
      <ModalConfigurarCicloExame
        aberto={modalCicloAberto}
        configAtual={configCiclo}
        onSalvar={handleSalvarConfigCiclo}
        onFechar={() => setModalCicloAberto(false)}
      />

      {/* Modal Profissional de Confirmação de Exclusão */}
      <ModalConfirmacao
        aberto={Boolean(idParaExcluir)}
        titulo="Excluir este exame de bioimpedância?"
        mensagem="Tem certeza que deseja remover este registro? Esta ação excluirá os dados e recalculará as médias e comparativos de evolução."
        textoConfirmar="Sim, excluir"
        textoCancelar="Cancelar"
        variante="perigo"
        onConfirmar={handleConfirmarExclusao}
        onCancelar={() => setIdParaExcluir(null)}
      />
    </div>
  );
};
