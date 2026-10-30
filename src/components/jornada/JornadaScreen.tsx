/**
 * @file jornada/JornadaScreen.tsx
 * @description Tela principal do módulo de Jornada do aplicativo Jejuar.
 * Orquestra o Dashboard Analítico de Gráficos e a alternância para as 4 subtelas de histórico:
 * - Editar jejuns (`EditarJejunsScreen`)
 * - Editar peso (`EditarPesoScreen`)
 * - Editar ingestão de água (`EditarAguaScreen`)
 * - Editar medidas corporais (`EditarMedidasScreen`)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import type { UsuarioEmCadastro, SessaoJejum, RegistroConsumoAgua } from '../../types';
import { 
  obterLinhaTempoConsolidada, 
  salvarNovaAnotacaoJornada 
} from '../../services/jornadaService';
import { buscarHistoricoAguaFirestore } from '../../services/firebase';
import { CardGraficoJejumDiario } from './CardGraficoJejumDiario';
import { CardGraficoEvolucaoPeso } from './CardGraficoEvolucaoPeso';
import { CardGraficoImc } from './CardGraficoImc';
import { CardGraficoIngestaoAgua } from './CardGraficoIngestaoAgua';
import { CardGraficoMedidasCorporais } from './CardGraficoMedidasCorporais';
import { EditarJejunsScreen } from './EditarJejunsScreen';
import { EditarPesoScreen } from './EditarPesoScreen';
import { EditarAguaScreen } from './EditarAguaScreen';
import { EditarMedidasScreen } from './EditarMedidasScreen';
import { ModalNovaAnotacao } from './ModalNovaAnotacao';
import { ToastSucesso } from '../ToastSucesso';

interface JornadaScreenProps {
  usuario?: UsuarioEmCadastro;
  onAbrirRastreadorAgua?: () => void;
  onAbrirDadosCorporais?: () => void;
}

export const JornadaScreen: React.FC<JornadaScreenProps> = ({ 
  usuario,
  onAbrirRastreadorAgua,
  onAbrirDadosCorporais,
}) => {
  // Estado de navegação entre o Dashboard Geral e as Subtelas de Gerenciamento do Histórico
  const [subtelaAtiva, setSubtelaAtiva] = useState<'geral' | 'jejuns' | 'peso' | 'agua' | 'medidas'>('geral');

  // Controle de carregamento
  const [carregando, setCarregando] = useState(false);

  // Estados dos dados de saúde reais do usuário
  const [pesoAtual, setPesoAtual] = useState<number>(() => {
    if (usuario?.informacoesBasicas?.peso) return usuario.informacoesBasicas.peso;
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_peso_atual');
      if (salvo) return Number(salvo);
    }
    return 72.3;
  });

  const [pesoMeta, setPesoMeta] = useState<number>(() => {
    if (usuario?.informacoesBasicas?.pesoDesejado) return usuario.informacoesBasicas.pesoDesejado;
    return 66.0;
  });

  const alturaCm = usuario?.informacoesBasicas?.altura || 165;

  // Cálculo do IMC atual
  const imcCalculado = useMemo(() => {
    const alturaMetros = alturaCm / 100;
    if (alturaMetros <= 0 || pesoAtual <= 0) return 27.2;
    const calc = pesoAtual / (alturaMetros * alturaMetros);
    return Math.round(calc * 10) / 10;
  }, [pesoAtual, alturaCm]);

  // Consumo de água
  const [historicoAgua, setHistoricoAgua] = useState<RegistroConsumoAgua[]>([]);
  const metaAguaDiaria = usuario?.configuracaoAgua?.metaDiariaMl || 2500;
  
  const aguaHoje = useMemo(() => {
    const hojeStr = new Date().toISOString().slice(0, 10);
    if (usuario?.consumoAguaAtual?.dataStr === hojeStr && typeof usuario.consumoAguaAtual.consumidoMl === 'number') {
      return usuario.consumoAguaAtual.consumidoMl;
    }
    if (typeof window !== 'undefined') {
      const salva = localStorage.getItem(`jejuar_agua_${hojeStr}`);
      if (salva) return Number(salva);
    }
    return 0;
  }, [usuario?.consumoAguaAtual]);

  // Histórico de jejuns
  const [historicoJejuns, setHistoricoJejuns] = useState<SessaoJejum[]>([]);
  const diasConsecutivos = usuario?.estadoJejum?.diasConsecutivos || 1;

  // Modais de ação
  const [modalAnotacaoAberto, setModalAnotacaoAberto] = useState(false);

  // Toast de confirmação
  const [toastConfig, setToastConfig] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
  });

  // Carrega dados integrados do Firestore e Caches
  const carregarDadosDashboard = useCallback(async () => {
    try {
      setCarregando(true);
      if (usuario?.id) {
        const histAgua = await buscarHistoricoAguaFirestore(usuario.id, 7, metaAguaDiaria);
        setHistoricoAgua(histAgua);

        const resultado = await obterLinhaTempoConsolidada(usuario.id, 'todos');
        const sessoes = resultado.itens
          .filter(item => item.tipo === 'jejum' && item.dadosOriginais)
          .map(item => item.dadosOriginais as SessaoJejum);
        setHistoricoJejuns(sessoes);
      }
    } catch (err) {
      console.warn('[Jornada] Erro ao carregar dados do dashboard:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id, metaAguaDiaria]);

  useEffect(() => {
    carregarDadosDashboard();
  }, [carregarDadosDashboard]);

  // Salva nova anotação do diário de bordo
  const handleSalvarAnotacao = async (dados: { titulo: string; conteudo: string; sentimento?: any; tags?: string[] }) => {
    try {
      await salvarNovaAnotacaoJornada(usuario?.id, dados);
      setModalAnotacaoAberto(false);
      setToastConfig({
        visivel: true,
        titulo: '📝 Anotação salva!',
        mensagem: 'Seu registro pessoal foi adicionado ao seu diário de bordo.',
      });
    } catch (err: any) {
      setToastConfig({
        visivel: true,
        titulo: 'Ops!',
        mensagem: err.message || 'Não conseguimos salvar sua anotação no momento.',
      });
    }
  };

  // Roteamento condicional de subtelas de edição de histórico
  if (subtelaAtiva === 'jejuns') {
    return (
      <EditarJejunsScreen
        usuario={usuario}
        historicoJejunsInicial={historicoJejuns}
        onVoltar={() => setSubtelaAtiva('geral')}
        onAtualizarHistorico={carregarDadosDashboard}
      />
    );
  }

  if (subtelaAtiva === 'peso') {
    return (
      <EditarPesoScreen
        usuario={usuario}
        onVoltar={() => setSubtelaAtiva('geral')}
        onAtualizarPesoApp={(novo) => setPesoAtual(novo)}
      />
    );
  }

  if (subtelaAtiva === 'agua') {
    return (
      <EditarAguaScreen
        usuario={usuario}
        onVoltar={() => setSubtelaAtiva('geral')}
        onAtualizarAguaApp={carregarDadosDashboard}
      />
    );
  }

  if (subtelaAtiva === 'medidas') {
    return (
      <EditarMedidasScreen
        usuario={usuario}
        onVoltar={() => setSubtelaAtiva('geral')}
        onAtualizarMedidasApp={carregarDadosDashboard}
      />
    );
  }

  return (
    <div className="w-full flex-1 px-4 pt-3 pb-28 space-y-4 select-none relative">
      {/* Toast Flutuante */}
      <ToastSucesso
        visivel={toastConfig.visivel}
        titulo={toastConfig.titulo}
        mensagem={toastConfig.mensagem}
        onFechar={() => setToastConfig(prev => ({ ...prev, visivel: false }))}
      />

      {/* Cabeçalho Superior da Tela */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-[#0B2246] tracking-tight">
            Minha Jornada
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Progresso visual de jejuns, peso, IMC e hidratação
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Adicionar Nota Rápida no Diário */}
          <button
            type="button"
            onClick={() => setModalAnotacaoAberto(true)}
            className="min-h-[44px] px-3.5 rounded-2xl bg-[#00C975] hover:bg-[#00B067] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            aria-label="Adicionar nota no diário"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Nota</span>
          </button>
        </div>
      </div>

      {/* CARD 1: Gráfico de Jejum Diário */}
      <CardGraficoJejumDiario
        historicoJejuns={historicoJejuns}
        horasJejumHoje={
          usuario?.estadoJejum?.emJejum && usuario?.estadoJejum?.inicioTimestamp
            ? Math.round(((Date.now() - new Date(usuario.estadoJejum.inicioTimestamp).getTime()) / 3600000) * 10) / 10
            : 0
        }
        diasConsecutivos={diasConsecutivos}
        onAbrirDetalhes={() => setSubtelaAtiva('jejuns')}
      />

      {/* CARD 2: Gráfico de Evolução de Peso */}
      <CardGraficoEvolucaoPeso
        pesoAtual={pesoAtual}
        pesoMeta={pesoMeta}
        onAbrirRegistroPeso={() => setSubtelaAtiva('peso')}
      />

      {/* CARD 3: Card com Resumo das Medidas Corporais (Cintura, Peito, Braço, Quadris, Coxa) */}
      <CardGraficoMedidasCorporais
        usuario={usuario}
        onAbrirDetalhes={() => setSubtelaAtiva('medidas')}
      />

      {/* CARD 4: Gráfico de Evolução e Tendência do IMC */}
      <CardGraficoImc
        imcAtual={imcCalculado}
        alturaCm={alturaCm}
        pesoAtualKg={pesoAtual}
      />

      {/* CARD 5: Gráfico de Ingestão de Água */}
      <CardGraficoIngestaoAgua
        historicoAgua={historicoAgua}
        metaAguaDiariaMl={metaAguaDiaria}
        aguaConsumidaHoje={aguaHoje}
        onAbrirRastreador={() => setSubtelaAtiva('agua')}
      />

      {/* Seção de Anotações do Diário de Bordo no Rodapé */}
      <div className="w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0B2246]">
              Diário de Sentimentos & Notas
            </h4>
            <p className="text-xs text-slate-400">
              Registre como você está se sentindo hoje
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalAnotacaoAberto(true)}
          className="min-h-[44px] px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#0B2246] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#00C975]" />
          <span>Escrever</span>
        </button>
      </div>

      {/* Modal de Nova Anotação */}
      <ModalNovaAnotacao
        aberto={modalAnotacaoAberto}
        onSalvar={handleSalvarAnotacao}
        onFechar={() => setModalAnotacaoAberto(false)}
      />
    </div>
  );
};
