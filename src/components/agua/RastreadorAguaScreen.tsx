/**
 * @file RastreadorAguaScreen.tsx
 * @description Tela Cheia de Rastreador de Água conforme design de referência do usuário.
 * Contém o recipiente circular com animação fluida de ondas, seletor de capacidade de copo,
 * guia de bebidas permitidas no jejum, e o gráfico semanal de ingestão de água com linha de meta.
 * Sincronizado integralmente com o Firestore e com o estado em tempo real.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Pencil, 
  Plus, 
  Minus, 
  Coffee, 
  Sparkles, 
  ChevronRight,
  GlassWater,
  Droplet
} from 'lucide-react';
import type { UsuarioEmCadastro, RegistroConsumoAgua, ConfiguracaoMonitorAgua } from '../../types';
import { 
  salvarConsumoAguaFirestore, 
  buscarHistoricoAguaFirestore,
  buscarConfiguracaoAguaFirestore,
  salvarConfiguracaoAguaFirestore
} from '../../services/firebase';
import { ModalEditarMetaAgua } from './ModalEditarMetaAgua';
import { ModalAdicionarAguaCustomizada } from './ModalAdicionarAguaCustomizada';
import { ModalHistoricoHidratacao } from './ModalHistoricoHidratacao';
import { ConfiguracaoMonitorAguaScreen } from './ConfiguracaoMonitorAguaScreen';

interface RastreadorAguaScreenProps {
  usuario?: UsuarioEmCadastro;
  aguaConsumidaHoje: number;
  onAtualizarAguaHoje: (novaQuantidade: number) => void;
  onVoltar: () => void;
}

export const RastreadorAguaScreen: React.FC<RastreadorAguaScreenProps> = ({
  usuario,
  aguaConsumidaHoje,
  onAtualizarAguaHoje,
  onVoltar,
}) => {
  // Data atual no formato YYYY-MM-DD
  const hojeStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Consumo local do dia atual
  const [consumoAtual, setConsumoAtual] = useState<number>(aguaConsumidaHoje);

  // Capacidade ativa do copo (padrão 300 ml conforme imagem de referência)
  const [capacidadeCopo, setCapacidadeCopo] = useState<number>(300);

  // Configurações e Meta Diária
  const [configAgua, setConfigAgua] = useState<ConfiguracaoMonitorAgua>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_config_agua');
      if (salvo) {
        try {
          return JSON.parse(salvo);
        } catch {
          // ignora
        }
      }
      const metaSalva = localStorage.getItem('jejuar_meta_agua');
      if (metaSalva) {
        return {
          lembreteAtivo: true,
          somLembrete: 'Padrão',
          horaInicio: '08:00',
          horaFim: '21:00',
          intervalo: 'A cada 1 hora',
          metaDiariaMl: Number(metaSalva),
          unidade: 'ml'
        };
      }
    }
    return {
      lembreteAtivo: true,
      somLembrete: 'Padrão',
      horaInicio: '08:00',
      horaFim: '21:00',
      intervalo: 'A cada 1 hora',
      metaDiariaMl: 2500,
      unidade: 'ml'
    };
  });

  // Histórico dos últimos 7 dias para o gráfico
  const [historico7Dias, setHistorico7Dias] = useState<RegistroConsumoAgua[]>([]);

  // Modais e telas filhas
  const [modalMetaAberto, setModalMetaAberto] = useState<boolean>(false);
  const [modalCustomAberto, setModalCustomAberto] = useState<boolean>(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState<boolean>(false);
  const [telaConfiguracaoAberta, setTelaConfiguracaoAberta] = useState<boolean>(false);

  // Carrega configurações e histórico do Firestore ao montar a tela
  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      if (usuario?.id) {
        try {
          const cfg = await buscarConfiguracaoAguaFirestore(usuario.id);
          if (ativo && cfg) setConfigAgua(cfg);
        } catch (err) {
          console.warn('Erro ao carregar configurações de água:', err);
        }
      }

      try {
        const hist = await buscarHistoricoAguaFirestore(usuario?.id || '', 7, configAgua.metaDiariaMl);
        if (ativo) {
          // Garante que o dia de hoje no histórico reflita exatamente o consumoAtual
          const atualizado = hist.map((item) => {
            if (item.dataStr === hojeStr) {
              return { ...item, consumidoMl: consumoAtual };
            }
            return item;
          });
          setHistorico7Dias(atualizado);
        }
      } catch (err) {
        console.warn('Erro ao carregar histórico de água:', err);
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [usuario?.id, hojeStr]);

  // Sincroniza consumoAtual caso a prop externa mude
  useEffect(() => {
    setConsumoAtual(aguaConsumidaHoje);
  }, [aguaConsumidaHoje]);

  // Cálculos do percentual de preenchimento da animação
  const metaMl = configAgua.metaDiariaMl || 2500;
  const porcentagem = Math.min(100, Math.max(0, (consumoAtual / metaMl) * 100));

  // Cálculo da média dos 7 dias para o gráfico
  const mediaSemanal = useMemo(() => {
    if (!historico7Dias.length) return consumoAtual;
    const soma = historico7Dias.reduce((acc, curr) => acc + (curr.dataStr === hojeStr ? consumoAtual : curr.consumidoMl), 0);
    return Math.round(soma / historico7Dias.length);
  }, [historico7Dias, consumoAtual, hojeStr]);

  // Função central para persistir novo valor de consumo no dia
  const atualizarConsumo = (novoValor: number) => {
    const valorTratado = Math.max(0, novoValor);
    setConsumoAtual(valorTratado);
    onAtualizarAguaHoje(valorTratado);

    // Atualiza o histórico local imediatamente para que o gráfico reaja em tempo real
    setHistorico7Dias((prev) => 
      prev.map((reg) => reg.dataStr === hojeStr ? { ...reg, consumidoMl: valorTratado } : reg)
    );

    // Salva no Firestore e localStorage
    salvarConsumoAguaFirestore(
      usuario?.id || '',
      hojeStr,
      valorTratado,
      metaMl,
      configAgua.unidade
    );
  };

  // Incremento rápido
  const handleAdicionar = (quantidade: number) => {
    atualizarConsumo(consumoAtual + quantidade);
  };

  // Decremento rápido
  const handleSubtrair = () => {
    atualizarConsumo(Math.max(0, consumoAtual - capacidadeCopo));
  };

  // Salvar nova meta diária
  const handleSalvarNovaMeta = (novaMetaMl: number) => {
    const novaConfig = { ...configAgua, metaDiariaMl: novaMetaMl };
    setConfigAgua(novaConfig);
    salvarConfiguracaoAguaFirestore(usuario?.id || '', novaConfig);
  };

  // Ajusta retroativamente a água de qualquer dia do histórico (últimos 7 dias)
  const handleSalvarAjusteDia = (dataStr: string, novoValorMl: number) => {
    setHistorico7Dias((prev) =>
      prev.map((reg) => (reg.dataStr === dataStr ? { ...reg, consumidoMl: novoValorMl } : reg))
    );

    if (dataStr === hojeStr) {
      setConsumoAtual(novoValorMl);
      onAtualizarAguaHoje(novoValorMl);
    }

    salvarConsumoAguaFirestore(
      usuario?.id || '',
      dataStr,
      novoValorMl,
      metaMl,
      configAgua.unidade
    );
  };

  // Opções de copo padrão
  const coposPredefinidos = [
    { ml: 100, rotulo: '100 ml', tipo: 'xicara' },
    { ml: 250, rotulo: '250 ml', tipo: 'copo-pequeno' },
    { ml: 300, rotulo: '300 ml', tipo: 'copo-medio' },
    { ml: 500, rotulo: '500 ml', tipo: 'garrafa' },
  ];

  return (
    <div 
      className="fixed inset-0 z-40 bg-[#F5F9FC] text-[#092244] flex flex-col justify-between items-center select-none overflow-hidden animate-in fade-in duration-200"
      role="region"
      aria-label="Rastreador de água em tela cheia"
    >
      <div className="w-full max-w-[430px] h-screen max-h-screen bg-[#F5F9FC] relative flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabeçalho Superior */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#F5F9FC] shrink-0 border-b border-blue-50/60">
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar para tela de Jejum"
            className="w-10 h-10 rounded-full hover:bg-blue-100/60 flex items-center justify-center text-[#092244] active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          <h1 className="text-[19px] font-black text-[#092244] tracking-tight text-center">
            Rastreador de água
          </h1>

          {/* Ícone normal de configuração da engrenagem (solicitado pelo usuário) */}
          <button
            type="button"
            onClick={() => setTelaConfiguracaoAberta(true)}
            aria-label="Abrir configurações de monitoramento de água"
            title="Configurações do monitor de água"
            className="w-10 h-10 rounded-full hover:bg-blue-100/60 flex items-center justify-center text-[#092244] active:scale-90 transition-all cursor-pointer"
          >
            <Settings className="w-6 h-6 stroke-[2.2]" />
          </button>
        </header>

        {/* Corpo com Scroll */}
        <main className="flex-1 w-full px-4 pt-2 pb-12 overflow-y-auto space-y-5" data-purpose="water-tracker-body">
          
          {/* Contador Numérico Central e Meta Editável */}
          <section className="text-center pt-1 space-y-1" data-purpose="water-counter-header">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[42px] font-black text-[#092244] tracking-tight leading-none tabular-nums">
                {consumoAtual}
              </span>
              <span className="text-xl font-bold text-[#092244]/80">
                {configAgua.unidade}
              </span>
            </div>

            {/* Meta com botão de editar em lápis */}
            <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500">
              <span>Meta: {metaMl} {configAgua.unidade}</span>
              <button
                type="button"
                onClick={() => setModalMetaAberto(true)}
                title="Editar meta de água"
                aria-label="Editar meta diária de água"
                className="w-6 h-6 rounded-full hover:bg-blue-100/80 flex items-center justify-center text-[#2F80ED] active:scale-90 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </section>

          {/* Recipiente Circular Animado com Efeito de Ondas Líquidas */}
          <section className="flex justify-center py-2" data-purpose="liquid-circle-animation">
            <div 
              className="relative w-[230px] h-[230px] rounded-full bg-[#E5F1FC] shadow-inner overflow-hidden flex items-center justify-center border-4 border-white"
              style={{
                boxShadow: 'inset 0 4px 14px rgba(47, 128, 237, 0.15), 0 8px 24px rgba(47, 128, 237, 0.12)'
              }}
            >
              {/* Reflexo de luz / brilho suave no topo do vidro */}
              <div 
                className="absolute top-2 left-6 right-6 h-10 rounded-full bg-white/40 blur-[2px] pointer-events-none z-20"
                aria-hidden="true" 
              />

              {/* Nível do Líquido com Ondas SVG Animadas */}
              <div 
                className="absolute bottom-0 left-0 right-0 w-full transition-all duration-700 ease-out z-10"
                style={{ 
                  height: `${porcentagem}%`,
                  background: 'linear-gradient(180deg, #4AA3FF 0%, #2F80ED 100%)'
                }}
              >
                {/* SVG Ondas Dinâmicas no Topo do Líquido */}
                <div 
                  className="absolute -top-[14px] left-0 w-[200%] h-[16px] pointer-events-none overflow-hidden"
                  style={{
                    animation: 'ondaHorizontal 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite',
                  }}
                >
                  <svg 
                    viewBox="0 0 1200 40" 
                    className="w-full h-full fill-[#4AA3FF]" 
                    preserveAspectRatio="none"
                  >
                    <path d="M 0,20 C 150,40 350,0 500,20 C 650,40 850,0 1000,20 C 1150,40 1200,20 1200,20 L 1200,40 L 0,40 Z" />
                  </svg>
                </div>

                {/* Segunda onda suave translúcida para profundidade visual */}
                <div 
                  className="absolute -top-[12px] left-0 w-[200%] h-[14px] pointer-events-none opacity-60 overflow-hidden"
                  style={{
                    animation: 'ondaHorizontalReversa 4s linear infinite',
                  }}
                >
                  <svg 
                    viewBox="0 0 1200 40" 
                    className="w-full h-full fill-[#8AD2FF]" 
                    preserveAspectRatio="none"
                  >
                    <path d="M 0,15 C 200,0 400,30 600,15 C 800,0 1000,30 1200,15 L 1200,40 L 0,40 Z" />
                  </svg>
                </div>
              </div>

              {/* Indicador de Porcentagem Flutuante sutil no centro */}
              <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none">
                {porcentagem > 0 && porcentagem < 100 && (
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full backdrop-blur-xs transition-colors ${
                    porcentagem > 45 ? 'bg-white/30 text-white' : 'bg-blue-100 text-[#2F80ED]'
                  }`}>
                    {Math.round(porcentagem)}%
                  </span>
                )}
                {porcentagem >= 100 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/90 text-[#00A854] font-black text-xs rounded-full shadow-md animate-bounce">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Meta atingida!</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Botões de Ação Imediata (- e + [Copo Selecionado]) */}
          <section className="flex items-center justify-center gap-4 px-2" data-purpose="quick-water-actions">
            {/* Botão Menos (-) */}
            <button
              type="button"
              onClick={handleSubtrair}
              disabled={consumoAtual <= 0}
              title={`Subtrair ${capacidadeCopo} ml`}
              aria-label={`Subtrair ${capacidadeCopo} ml`}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xs transition-all ${
                consumoAtual <= 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                  : 'bg-[#E5F1FC] hover:bg-blue-200 text-[#2F80ED] active:scale-90 cursor-pointer'
              }`}
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Botão Principal Mais (+ XXX ml) */}
            <button
              type="button"
              onClick={() => handleAdicionar(capacidadeCopo)}
              aria-label={`Adicionar ${capacidadeCopo} ml de água`}
              className="flex-1 max-w-[240px] h-12 rounded-full bg-[#38B6FF] hover:bg-[#22a5f0] text-white font-extrabold text-[17px] shadow-md shadow-blue-200/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>{capacidadeCopo} {configAgua.unidade}</span>
            </button>
          </section>

          {/* Seção: Capacidade do copo (Carrossel / Cards de Seleção) */}
          <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3" data-purpose="cup-capacity-section">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-black text-[#092244]">
                Capacidade do copo
              </h2>
              <button
                type="button"
                onClick={() => setModalCustomAberto(true)}
                className="text-xs font-bold text-[#2F80ED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Outro valor</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {coposPredefinidos.map((copo) => {
                const ativo = capacidadeCopo === copo.ml;
                return (
                  <button
                    key={copo.ml}
                    type="button"
                    onClick={() => setCapacidadeCopo(copo.ml)}
                    aria-pressed={ativo}
                    className={`flex flex-col items-center justify-between p-2.5 rounded-2xl h-[92px] transition-all cursor-pointer ${
                      ativo
                        ? 'bg-[#E8FAF3] border-2 border-[#00C975] shadow-xs'
                        : 'bg-[#F5F9FC] border border-blue-50/80 hover:bg-[#EEF6FD]'
                    }`}
                  >
                    {/* Ícone ilustrado do copo */}
                    <div className="flex-1 flex items-center justify-center">
                      {copo.ml === 100 && (
                        <div className="w-8 h-6 rounded-b-xl border-2 border-blue-400 bg-blue-100 flex items-end justify-center overflow-hidden">
                          <div className="w-full h-1/2 bg-[#38B6FF]" />
                        </div>
                      )}
                      {copo.ml === 250 && (
                        <div className="w-7 h-7 rounded-b-lg border-2 border-blue-400 bg-blue-100 flex items-end justify-center overflow-hidden">
                          <div className="w-full h-2/3 bg-[#38B6FF]" />
                        </div>
                      )}
                      {copo.ml === 300 && (
                        <div className="w-6 h-8 rounded-b-md border-2 border-blue-500 bg-blue-100 flex items-end justify-center overflow-hidden">
                          <div className="w-full h-3/4 bg-[#2F80ED]" />
                        </div>
                      )}
                      {copo.ml === 500 && (
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-1.5 bg-blue-400 rounded-t-xs" />
                          <div className="w-5 h-7 rounded-b-md border-2 border-blue-400 bg-blue-100 overflow-hidden flex items-end">
                            <div className="w-full h-4/5 bg-[#38B6FF]" />
                          </div>
                        </div>
                      )}
                    </div>

                    <span className={`text-[12px] font-bold ${ativo ? 'text-[#00804b]' : 'text-gray-700'}`}>
                      {copo.rotulo}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Seção: Bebidas durante o jejum */}
          <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3.5" data-purpose="fasting-drinks-guide">
            <h2 className="text-[17px] font-black text-[#092244]">
              Bebidas durante o jejum
            </h2>

            <div className="space-y-3">
              {/* Item 1: Água */}
              <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-50/60 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/60">
                  <GlassWater className="w-6 h-6 text-[#2F80ED]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[15px] text-[#092244]">
                    Água
                  </h3>
                  <p className="text-xs text-gray-500 leading-snug">
                    Água pura, água mineral, água com gás
                  </p>
                </div>
              </div>

              {/* Item 2: Café */}
              <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-50/60 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100/60">
                  <Coffee className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[15px] text-[#092244]">
                    Café
                  </h3>
                  <p className="text-xs text-gray-500 leading-snug">
                    Café preto, sem açúcar, sem leite, sem creme
                  </p>
                </div>
              </div>

              {/* Item 3: Chá */}
              <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-50/60 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/60">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">
                    🍵
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-[15px] text-[#092244]">
                    Chá
                  </h3>
                  <p className="text-xs text-gray-500 leading-snug">
                    Chá verde, chá preto, chá de ervas
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção: Ingestão de água (Gráfico Semanal) */}
          <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3" data-purpose="water-weekly-chart">
            <div 
              onClick={() => setModalHistoricoAberto(true)}
              className="flex items-center justify-between cursor-pointer hover:opacity-80 active:scale-[0.99] transition-all select-none group"
              role="button"
              tabIndex={0}
              title="Abrir histórico detalhado dos últimos 7 dias"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setModalHistoricoAberto(true);
                }
              }}
            >
              <h2 className="text-[17px] font-black text-[#092244] group-hover:text-[#2F80ED] transition-colors">
                Ingestão de água
              </h2>
              <div className="flex items-center gap-1 text-gray-400 group-hover:text-[#2F80ED] transition-colors">
                <span className="text-xs font-bold text-gray-400 group-hover:text-[#2F80ED]">Histórico</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Subtítulo com Média e Linha de Meta */}
            <div className="flex items-center justify-between text-xs font-semibold pt-1">
              <div>
                <span className="text-gray-500">Média: </span>
                <span className="font-black text-[#092244] text-sm tabular-nums">
                  {mediaSemanal} {configAgua.unidade}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="w-3 border-b-2 border-dashed border-[#FA8C16]" />
                <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
                  Meta: {metaMl} {configAgua.unidade}
                </span>
              </div>
            </div>

            {/* Gráfico de Barras dos 7 Dias */}
            <div className="relative pt-6 pb-2">
              {/* Linha Tracejada da Meta (Posicionada proporcionalmente no gráfico) */}
              <div 
                className="absolute left-10 right-0 border-b border-dashed border-[#FA8C16] z-10 pointer-events-none"
                style={{ 
                  bottom: `${Math.min(95, Math.max(10, (metaMl / 3000) * 120 + 24))}px` 
                }}
              />

              <div className="flex items-end justify-between h-[150px] gap-2 pt-2">
                {/* Eixo Y Numérico */}
                <div className="flex flex-col justify-between h-full text-[10px] font-bold text-gray-400 tabular-nums shrink-0 pr-1 pb-6">
                  <span>3.000</span>
                  <span>2.250</span>
                  <span>1.500</span>
                  <span>750</span>
                  <span>0</span>
                </div>

                {/* Colunas dos 7 Dias */}
                <div className="flex-1 flex items-end justify-between h-full gap-1.5 pb-6">
                  {historico7Dias.map((reg) => {
                    const valorEfetivo = reg.dataStr === hojeStr ? consumoAtual : reg.consumidoMl;
                    const alturaPx = Math.min(120, Math.max(0, (valorEfetivo / 3000) * 120));
                    
                    // Formata a data para DD/MM
                    const partes = reg.dataStr.split('-');
                    const rotuloData = partes.length === 3 ? `${partes[2]}/${partes[1]}` : reg.dataStr;
                    const ehHoje = reg.dataStr === hojeStr;

                    return (
                      <div key={reg.dataStr} className="flex-1 flex flex-col items-center h-full justify-end group">
                        {/* Barra Vertical de Água */}
                        <div className="w-full max-w-[18px] h-[120px] bg-[#F0F6FF] rounded-full relative overflow-hidden flex items-end">
                          <div 
                            className={`w-full rounded-full transition-all duration-500 ${
                              ehHoje ? 'bg-[#38B6FF]' : 'bg-[#2F80ED]'
                            }`}
                            style={{ height: `${alturaPx}px` }}
                          />
                        </div>

                        {/* Rótulo da Data abaixo da coluna */}
                        <span className={`text-[10px] mt-2 tabular-nums ${
                          ehHoje ? 'font-black text-[#2F80ED]' : 'font-semibold text-gray-400'
                        }`}>
                          {rotuloData}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Modal de Edição da Meta Diária (Bottom Sheet com cálculo dinâmico baseado no peso) */}
      <ModalEditarMetaAgua
        aberto={modalMetaAberto}
        metaAtualMl={metaMl}
        pesoUsuarioKg={usuario?.informacoesBasicas?.peso || 72.4}
        onSalvar={handleSalvarNovaMeta}
        onFechar={() => setModalMetaAberto(false)}
      />

      {/* Modal para Adicionar Quantidade Customizada */}
      <ModalAdicionarAguaCustomizada
        aberto={modalCustomAberto}
        onAdicionar={(qtd) => handleAdicionar(qtd)}
        onFechar={() => setModalCustomAberto(false)}
      />

      {/* Modal Bottom Sheet: Histórico de Hidratação dos últimos 7 dias com ajuste */}
      <ModalHistoricoHidratacao
        aberto={modalHistoricoAberto}
        historico7Dias={historico7Dias}
        metaMl={metaMl}
        unidade={configAgua.unidade}
        onSalvarAjusteDia={handleSalvarAjusteDia}
        onFechar={() => setModalHistoricoAberto(false)}
      />

      {/* Subtela Cheia de Configurações do Monitor de Água */}
      {telaConfiguracaoAberta && (
        <ConfiguracaoMonitorAguaScreen
          configuracao={configAgua}
          pesoUsuarioKg={usuario?.informacoesBasicas?.peso || 72.4}
          usuarioId={usuario?.id}
          onSalvarConfiguracao={(nova) => {
            setConfigAgua(nova);
            salvarConfiguracaoAguaFirestore(usuario?.id || '', nova);
          }}
          onVoltar={() => setTelaConfiguracaoAberta(false)}
        />
      )}

      {/* Estilos Globais de Keyframe para Animação de Onda */}
      <style>{`
        @keyframes ondaHorizontal {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(0); }
        }
        @keyframes ondaHorizontalReversa {
          0% { transform: translateX(-25%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
      `}</style>
    </div>
  );
};
