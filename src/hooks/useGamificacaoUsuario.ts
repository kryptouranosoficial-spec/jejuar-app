/**
 * @file useGamificacaoUsuario.ts
 * @description Hook unificado de Gamificação (Conquistas, Nível e XP) para o aplicativo Jejuar.
 * Centraliza a leitura de todos os registros reais do usuário (Jejuns, Água, Peso, Medidas Corporais,
 * Bioimpedância, Anotações da Jornada e Perfil) tanto na Tela Inicial quanto na Tela de Perfil,
 * reagindo instantaneamente a qualquer alteração em tempo real.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  UsuarioEmCadastro,
  ConquistaUsuario,
  MetricasGamificacaoUsuario,
  SessaoJejum,
  RegistroConsumoAgua,
  DadosPerfilUsuario,
} from '../types';
import type { RegistroBioimpedancia } from '../types/bioimpedancia';
import { listarSessoesJejuns, listarAnotacoesJornada } from '../services/jornadaService';
import {
  buscarTodoHistoricoAguaFirestore,
  buscarHistoricoPesagensFirestore,
  buscarMedidasCorporaisFirestore,
} from '../services/firebase';
import { listarBioimpedancias } from '../services/bioimpedanciaService';
import { buscarDadosPerfil } from '../services/perfilService';
import { calcularConquistasUsuario } from '../utils/conquistasUtils';
import {
  calcularMetricasGamificacao,
  EVENTO_GAMIFICACAO_ATUALIZADA,
} from '../utils/perfilUtils';

export interface ParametrosHookGamificacao {
  usuario?: UsuarioEmCadastro;
  diasConsecutivos?: number;
  aguaConsumidaHoje?: number;
  metaAguaHoje?: number;
  pesoAtualOverride?: number;
  emJanelaAlimentacao?: boolean;
  notificacoesPushAtivas?: boolean;
  dadosPerfilOverride?: DadosPerfilUsuario | null;
}

export interface RetornoHookGamificacao {
  conquistas: ConquistaUsuario[];
  metricasGamificadas: MetricasGamificacaoUsuario;
  historicoJejuns: SessaoJejum[];
  historicoAguaCompleto: RegistroConsumoAgua[];
  examesBioimpedancia: RegistroBioimpedancia[];
  recarregarGamificacao: () => Promise<void>;
}

/**
 * Hook unificado que mantém Conquistas, Nível e XP 100% sincronizados
 * com tudo o que acontece no aplicativo.
 */
export function useGamificacaoUsuario({
  usuario,
  diasConsecutivos: diasConsecutivosProp,
  aguaConsumidaHoje: aguaConsumidaProp,
  metaAguaHoje: metaAguaProp,
  pesoAtualOverride,
  emJanelaAlimentacao,
  notificacoesPushAtivas,
  dadosPerfilOverride,
}: ParametrosHookGamificacao): RetornoHookGamificacao {
  const usuarioId = usuario?.id || '';

  // Estados consolidados de todas as coleções do aplicativo
  const [historicoJejuns, setHistoricoJejuns] = useState<SessaoJejum[]>([]);
  const [historicoAguaCompleto, setHistoricoAguaCompleto] = useState<RegistroConsumoAgua[]>([]);
  const [examesBioimpedancia, setExamesBioimpedancia] = useState<RegistroBioimpedancia[]>([]);
  const [pesagensCount, setPesagensCount] = useState<number>(0);
  const [medidasCount, setMedidasCount] = useState<number>(0);
  const [anotacoesCount, setAnotacoesCount] = useState<number>(0);
  const [perfilCarregado, setPerfilCarregado] = useState<DadosPerfilUsuario | null>(null);
  const [contadorRefresh, setContadorRefresh] = useState<number>(0);

  // Função para carregar e sincronizar todos os dados reais do Firestore e LocalStorage
  const recarregarGamificacao = useCallback(async () => {
    const metaPadrao = metaAguaProp || usuario?.configuracaoAgua?.metaDiariaMl || 2500;

    try {
      // 1. Leitura rápida de caches locais para resposta instantânea
      if (typeof window !== 'undefined') {
        try {
          const medidasSalvas = localStorage.getItem('jejuar_medidas_corporais');
          if (medidasSalvas) {
            const objMedidas = JSON.parse(medidasSalvas);
            const qtdMedidasLocal = Object.keys(objMedidas || {}).filter(
              (k) => k !== 'atualizadoEm' && Number(objMedidas[k]) > 0
            ).length;
            const flagMedidaManual = localStorage.getItem('jejuar_medida_registrada_manual') === 'true';
            if (flagMedidaManual && qtdMedidasLocal > 0) {
              setMedidasCount((prev) => Math.max(prev, qtdMedidasLocal));
            }
          }
        } catch {}
      }

      // 2. Busca paralela de todos os módulos do aplicativo
      const [
        sessoes,
        registrosAgua,
        examesBio,
        pesagens,
        medidasRemotas,
        anotacoes,
        perfilSalvo,
      ] = await Promise.all([
        listarSessoesJejuns(usuarioId || undefined),
        buscarTodoHistoricoAguaFirestore(usuarioId || undefined, metaPadrao),
        listarBioimpedancias(usuarioId),
        usuarioId ? buscarHistoricoPesagensFirestore(usuarioId, 200) : Promise.resolve([]),
        usuarioId ? buscarMedidasCorporaisFirestore(usuarioId) : Promise.resolve(null),
        listarAnotacoesJornada(usuarioId || undefined),
        usuarioId ? buscarDadosPerfil(usuarioId) : Promise.resolve(null),
      ]);

      setHistoricoJejuns(sessoes);
      setHistoricoAguaCompleto(registrosAgua);
      setExamesBioimpedancia(examesBio);

      // Contabiliza pesagens reais (subcoleção + registros locais realizados pelo usuário)
      let totalPesagens = pesagens.length;
      if (typeof window !== 'undefined') {
        const qtdLocalPesagens = Number(localStorage.getItem('jejuar_total_pesagens_registradas') || '0');
        const registrouHoje = Boolean(localStorage.getItem('jejuar_peso_registrado_hoje'));
        totalPesagens = Math.max(totalPesagens, qtdLocalPesagens, registrouHoje ? 1 : 0);
      }
      setPesagensCount(totalPesagens);

      // Contabiliza medidas corporais registradas no Firestore ou manualmente pelo usuário
      let totalMedidas = 0;
      if (medidasRemotas) {
        totalMedidas = Object.keys(medidasRemotas).filter(
          (k) => k !== 'atualizadoEm' && Number((medidasRemotas as any)[k]) > 0
        ).length;
      }
      if (typeof window !== 'undefined') {
        const qtdMedidasLocal = Number(localStorage.getItem('jejuar_total_medidas_registradas') || '0');
        totalMedidas = Math.max(totalMedidas, qtdMedidasLocal);
      }
      setMedidasCount(totalMedidas);

      // Contabiliza anotações reais da Jornada (descontando a nota inaugural automática se for a única)
      const anotacoesReais = anotacoes.filter((a) => a.id !== 'nota_inaugural');
      setAnotacoesCount(anotacoesReais.length);

      if (perfilSalvo) {
        setPerfilCarregado(perfilSalvo);
      }
    } catch (err) {
      console.warn('[Gamificação] Aviso ao sincronizar dados para conquistas e XP:', err);
    }
  }, [usuarioId, metaAguaProp, usuario?.configuracaoAgua?.metaDiariaMl]);

  // Executa carregamento inicial e escuta o evento global de atualização de gamificação
  useEffect(() => {
    recarregarGamificacao();

    const handleEventoAtualizacao = () => {
      setContadorRefresh((prev) => prev + 1);
      recarregarGamificacao();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENTO_GAMIFICACAO_ATUALIZADA, handleEventoAtualizacao);
      return () => {
        window.removeEventListener(EVENTO_GAMIFICACAO_ATUALIZADA, handleEventoAtualizacao);
      };
    }
  }, [recarregarGamificacao]);

  // Recalcula todas as conquistas e métricas de XP de forma reativa
  return useMemo(() => {
    // 1. Sequência de dias consecutivos
    let streakAtual = diasConsecutivosProp ?? usuario?.estadoJejum?.diasConsecutivos ?? 1;
    if (typeof window !== 'undefined') {
      const cacheStreak = Number(localStorage.getItem('jejuar_dias_consecutivos') || '0');
      if (cacheStreak > streakAtual) streakAtual = cacheStreak;
    }

    // 2. Água consumida hoje e meta diária
    const hojeStr = new Date().toISOString().slice(0, 10);
    let aguaHoje = aguaConsumidaProp ?? 0;
    if (typeof window !== 'undefined' && aguaConsumidaProp === undefined) {
      aguaHoje = Number(localStorage.getItem(`jejuar_agua_${hojeStr}`) || '0');
    }
    const metaAgua =
      metaAguaProp ||
      usuario?.configuracaoAgua?.metaDiariaMl ||
      (typeof window !== 'undefined' ? Number(localStorage.getItem('jejuar_meta_agua') || '2500') : 2500);

    // 3. Pesos (atual, inicial e desejado) sincronizados entre estado e localStorage
    const pesoAtual =
      pesoAtualOverride ??
      (typeof window !== 'undefined' && localStorage.getItem('jejuar_peso_atual')
        ? Number(localStorage.getItem('jejuar_peso_atual'))
        : undefined) ??
      usuario?.informacoesBasicas?.peso;

    const pesoInicial =
      (typeof window !== 'undefined' && localStorage.getItem('jejuar_peso_inicio')
        ? Number(localStorage.getItem('jejuar_peso_inicio'))
        : undefined) ??
      usuario?.informacoesBasicas?.pesoInicial ??
      usuario?.informacoesBasicas?.peso;

    const pesoDesejado =
      (typeof window !== 'undefined' && localStorage.getItem('jejuar_peso_meta')
        ? Number(localStorage.getItem('jejuar_peso_meta'))
        : undefined) ??
      usuario?.informacoesBasicas?.pesoDesejado;

    // 4. Verifica se houve redução real de gordura corporal entre exames de bioimpedância
    let gorduraReduzida = false;
    if (examesBioimpedancia.length >= 2) {
      const ordenados = [...examesBioimpedancia].sort((a, b) =>
        b.dataExame.localeCompare(a.dataExame)
      );
      const maisRecente = ordenados[0];
      const maisAntigo = ordenados[ordenados.length - 1];
      const penultimo = ordenados[1];
      if (
        (maisRecente && penultimo && maisRecente.gorduraCorporalPercentual < penultimo.gorduraCorporalPercentual) ||
        (maisRecente && maisAntigo && maisRecente.gorduraCorporalPercentual < maisAntigo.gorduraCorporalPercentual)
      ) {
        gorduraReduzida = true;
      }
    }

    // 5. Status real das conquistas do bloco Aventureiro
    const perfilEfetivo = dadosPerfilOverride || perfilCarregado;
    const perfilCompleto = Boolean(
      (perfilEfetivo?.cpfCnpj && perfilEfetivo.cpfCnpj.length >= 11) ||
      (perfilEfetivo?.telefone && perfilEfetivo.telefone.length >= 10) ||
      (perfilEfetivo?.dataNascimento && perfilEfetivo.dataNascimento.length >= 8) ||
      (typeof window !== 'undefined' && localStorage.getItem('jejuar_perfil_editado_completo') === 'true')
    );

    const configurouAguaOuBateuMeta = Boolean(
      aguaHoje > 0 ||
      historicoAguaCompleto.some((a) => a.consumidoMl > 0) ||
      (typeof window !== 'undefined' && localStorage.getItem('jejuar_config_agua') !== null)
    );

    const explorouJanela = Boolean(
      emJanelaAlimentacao ||
      usuario?.estadoJejum?.emJanelaAlimentacao ||
      historicoJejuns.length >= 1 ||
      (typeof window !== 'undefined' && localStorage.getItem('jejuar_explorou_janela') === 'true')
    );

    const ativouLembretes = Boolean(
      notificacoesPushAtivas ||
      (typeof window !== 'undefined' &&
        (localStorage.getItem('jejuar_config_jejum') !== null ||
          localStorage.getItem('jejuar_lembrete_peso_ativo') === 'true' ||
          localStorage.getItem('jejuar_config_agua') !== null))
    );

    const sincronizouNuvemOuBackup = Boolean(
      (typeof window !== 'undefined' && localStorage.getItem('jejuar_backup_lgpd_exportado') === 'true') ||
      (Boolean(usuarioId) && (historicoJejuns.length > 0 || examesBioimpedancia.length > 0 || pesagensCount > 0))
    );

    const compartilhouConquista = Boolean(
      typeof window !== 'undefined' && localStorage.getItem('jejuar_conquista_compartilhada') === 'true'
    );

    // 6. Calcula a lista completa de conquistas
    const conquistasCalculadas = calcularConquistasUsuario({
      diasConsecutivos: streakAtual,
      aguaConsumidaHoje: aguaHoje,
      metaAguaHoje: metaAgua,
      historicoAgua7Dias: historicoAguaCompleto,
      totalJejunsConcluidos: historicoJejuns.length,
      pesoAtualKg: pesoAtual,
      pesoInicialKg: pesoInicial,
      pesoDesejadoKg: pesoDesejado,
      pesagensRegistradasCount: pesagensCount,
      medidasRegistradasCount: medidasCount,
      examesBioimpedanciaCount: examesBioimpedancia.length,
      gorduraCorporalReduzida: gorduraReduzida,
      perfilCompleto,
      configurouAguaOuBateuMeta,
      explorouJanelaAlimentacao: explorouJanela,
      ativouLembretesOuWidgets: ativouLembretes,
      sincronizouNuvemOuBackup,
      compartilhouConquista,
    });

    // 7. Calcula horas totais de jejum e litros totais de água (sem duplicar o dia de hoje)
    const totalSegundosJejum = historicoJejuns.reduce(
      (acc, sessao) => acc + (Number(sessao.duracaoSegundos) || 0),
      0
    );
    const totalHorasJejumReal = Math.round(totalSegundosJejum / 3600);
    const totalJejunsMetaAtingida = historicoJejuns.filter((s) => s.metaAtingida).length;

    const mapaAguaMl = new Map<string, { consumidoMl: number; metaMl: number }>();
    historicoAguaCompleto.forEach((item) => {
      if (!item?.dataStr) return;
      mapaAguaMl.set(item.dataStr, {
        consumidoMl: Number(item.consumidoMl) || 0,
        metaMl: Number(item.metaMl) || metaAgua,
      });
    });
    if (aguaHoje > 0) {
      const regHoje = mapaAguaMl.get(hojeStr);
      mapaAguaMl.set(hojeStr, {
        consumidoMl: Math.max(regHoje?.consumidoMl || 0, aguaHoje),
        metaMl: regHoje?.metaMl || metaAgua,
      });
    }

    let somaTotalAguaMl = 0;
    let diasMetaAguaBatida = 0;
    mapaAguaMl.forEach((val) => {
      somaTotalAguaMl += val.consumidoMl;
      if (val.metaMl > 0 && val.consumidoMl >= val.metaMl) {
        diasMetaAguaBatida += 1;
      }
    });
    const totalAguaLitrosReal = Math.round((somaTotalAguaMl / 1000) * 10) / 10;

    // 8. Calcula Nível e XP completos com todas as métricas conectadas
    const usuarioSincronizado: UsuarioEmCadastro = {
      ...(usuario || { nome: 'Usuário Jejuar', email: '', nivel: 'pro' }),
      estadoJejum: {
        ...(usuario?.estadoJejum || {
          planoAtivoId: '16:8',
          nomePlano: '16:8',
          metaHoras: 16,
          emJejum: false,
        }),
        diasConsecutivos: streakAtual,
      },
    };

    const metricasGamificadas = calcularMetricasGamificacao(
      usuarioSincronizado,
      conquistasCalculadas,
      {
        totalHorasJejumReal,
        totalAguaLitrosReal,
        totalJejunsConcluidos: historicoJejuns.length,
        totalJejunsMetaAtingida,
        diasMetaAguaBatida,
        pesagensRegistradasCount: pesagensCount,
        medidasRegistradasCount: medidasCount,
        examesBioimpedanciaCount: examesBioimpedancia.length,
        anotacoesJornadaCount: anotacoesCount,
      }
    );

    return {
      conquistas: conquistasCalculadas,
      metricasGamificadas,
      historicoJejuns,
      historicoAguaCompleto,
      examesBioimpedancia,
      recarregarGamificacao,
    };
  }, [
    usuario,
    usuarioId,
    diasConsecutivosProp,
    aguaConsumidaProp,
    metaAguaProp,
    pesoAtualOverride,
    emJanelaAlimentacao,
    notificacoesPushAtivas,
    dadosPerfilOverride,
    perfilCarregado,
    historicoJejuns,
    historicoAguaCompleto,
    examesBioimpedancia,
    pesagensCount,
    medidasCount,
    anotacoesCount,
    contadorRefresh,
    recarregarGamificacao,
  ]);
}
