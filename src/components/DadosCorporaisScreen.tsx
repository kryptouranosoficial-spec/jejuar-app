/**
 * @file DadosCorporaisScreen.tsx
 * @description Tela cheia de Dados Corporais (cobrindo o menu inferior) exibindo histórico e metas de peso,
 * gráfico interativo semanal/mensal/trimestral, lembrete e suporte para registro de peso com régua de precisão.
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Edit3, 
  ChevronRight, 
  ChevronsRight, 
  Ruler, 
  Scale, 
  Bell
} from 'lucide-react';
import type { UsuarioEmCadastro } from '../types';
import { ModalRegistrarPeso, type ModoRegistroPeso } from './ModalRegistrarPeso';
import { ConfiguracoesPesoScreen } from './ConfiguracoesPesoScreen';
import { 
  registrarPesagemHistoricoFirestore, 
  atualizarPesoInicialFirestore, 
  atualizarMetaPesoFirestore, 
  buscarHistoricoPesagensFirestore,
  salvarMedidaCorporalFirestore,
  buscarMedidasCorporaisFirestore,
  buscarHistoricoMedidasParteFirestore,
  type RegistroPesagem,
  type RegistroMedidaCorporal 
} from '../services/firebase';
import { 
  ModalRegistrarMedidaCorpo, 
  type ParteDoCorpo, 
  PARTES_CORPO_CONFIG 
} from './corpo/ModalRegistrarMedidaCorpo';
import { VisualizadorCorpoMedidas } from './corpo/VisualizadorCorpoMedidas';

interface DadosCorporaisScreenProps {
  /** Dados atuais do usuário */
  usuario?: UsuarioEmCadastro;
  /** Callback para voltar à tela inicial */
  onVoltar: () => void;
  /** Callback para atualizar o peso no estado pai */
  onAtualizarPeso?: (novoPeso: number) => void;
}

export const DadosCorporaisScreen: React.FC<DadosCorporaisScreenProps> = ({
  usuario,
  onVoltar,
  onAtualizarPeso,
}) => {
  // Aba ativa nos dados corporais: 'peso' ou 'corpo'
  const [abaAtiva, setAbaAtiva] = useState<'peso' | 'corpo'>('peso');

  // Filtro de período do gráfico: 'semana' | 'mes' | 'trimestre'
  const [periodoGrafico, setPeriodoGrafico] = useState<'semana' | 'mes' | 'trimestre'>('semana');

  // Controle da Modal de Registro e Edição de Peso (3 modos: atual, inicio, meta)
  const [modalRegistroAberto, setModalRegistroAberto] = useState<boolean>(false);
  const [modoEdicao, setModoEdicao] = useState<ModoRegistroPeso>('atual');

  // Controle da Tela de Configurações de Peso
  const [telaConfiguracoesAberta, setTelaConfiguracoesAberta] = useState<boolean>(false);

  // Histórico de pesagens carregado do Firestore
  const [historicoPesagens, setHistoricoPesagens] = useState<RegistroPesagem[]>([]);

  // Peso atual e metas com cache e sincronização reativa com o Firestore
  const [pesoAtual, setPesoAtual] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_peso_atual');
      if (salvo) return Number(salvo);
    }
    return usuario?.informacoesBasicas?.peso || 72.5;
  });

  const [pesoInicial, setPesoInicial] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_peso_inicio');
      if (salvo) return Number(salvo);
    }
    return usuario?.informacoesBasicas?.pesoInicial || usuario?.informacoesBasicas?.peso || 72.4;
  });

  const [pesoMeta, setPesoMeta] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_peso_meta');
      if (salvo) return Number(salvo);
    }
    return usuario?.informacoesBasicas?.pesoDesejado || 66.0;
  });

  // Busca histórico real de pesagens do usuário no Firestore
  React.useEffect(() => {
    if (usuario?.id) {
      buscarHistoricoPesagensFirestore(usuario.id)
        .then((dados) => {
          if (dados && dados.length > 0) {
            setHistoricoPesagens(dados);
          }
        })
        .catch((err) => {
          console.warn("Aviso ao buscar histórico de pesagens:", err);
        });
    }
  }, [usuario?.id]);

  // ==================== Estados e Lógica da Aba Corpo ====================
  // Parte do corpo ativa selecionada na visualização ('cintura' | 'peito' | 'coxa' | 'braco' | 'quadris')
  const [parteCorpoAtiva, setParteCorpoAtiva] = useState<ParteDoCorpo>('cintura');
  // Controle de visibilidade da modal de registro de medida do corpo
  const [modalMedidaCorpoAberta, setModalMedidaCorpoAberta] = useState<boolean>(false);
  // Medidas atuais registradas para cada parte do corpo (com fallback no localStorage)
  const [medidasCorporais, setMedidasCorporais] = useState<Partial<Record<ParteDoCorpo, number>>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const salvas = localStorage.getItem('jejuar_medidas_corporais');
        if (salvas) return JSON.parse(salvas);
      } catch {}
    }
    return {
      cintura: 90,
      peito: 95,
      coxa: 55,
      braco: 32,
      quadris: 100
    };
  });
  // Histórico de medições da parte ativa para plotar no gráfico
  const [historicoMedidasParte, setHistoricoMedidasParte] = useState<RegistroMedidaCorporal[]>([]);

  // Carrega as medidas salvas no Firestore ao montar ou trocar de usuário
  React.useEffect(() => {
    if (usuario?.id) {
      buscarMedidasCorporaisFirestore(usuario.id)
        .then((dados) => {
          if (dados) {
            setMedidasCorporais((prev) => ({
              ...prev,
              ...(dados.cintura && { cintura: dados.cintura }),
              ...(dados.peito && { peito: dados.peito }),
              ...(dados.braco && { braco: dados.braco }),
              ...(dados.quadris && { quadris: dados.quadris }),
              ...(dados.coxa && { coxa: dados.coxa }),
            }));
          }
        })
        .catch((err) => {
          console.warn("Aviso ao buscar medidas corporais no Firestore:", err);
        });
    }
  }, [usuario?.id]);

  // Carrega o histórico da parte ativa sempre que ela mudar
  React.useEffect(() => {
    if (usuario?.id && abaAtiva === 'corpo') {
      buscarHistoricoMedidasParteFirestore(usuario.id, parteCorpoAtiva)
        .then((registros) => {
          setHistoricoMedidasParte(registros);
        })
        .catch((err) => {
          console.warn(`Aviso ao buscar histórico de medidas para ${parteCorpoAtiva}:`, err);
        });
    }
  }, [usuario?.id, abaAtiva, parteCorpoAtiva]);

  // Salva a nova medida corporal no Firestore e atualiza o estado local reativamente
  const handleSalvarMedidaCorpo = async (novoValorCm: number, parte: ParteDoCorpo) => {
    const novasMedidas = {
      ...medidasCorporais,
      [parte]: novoValorCm,
    };
    setMedidasCorporais(novasMedidas);

    // Salva em cache local
    try {
      localStorage.setItem('jejuar_medidas_corporais', JSON.stringify(novasMedidas));
    } catch {}

    // Salva no Firestore
    if (usuario?.id) {
      try {
        await salvarMedidaCorporalFirestore(usuario.id, parte, novoValorCm);
        // Atualiza a lista de histórico
        const novoHistorico = await buscarHistoricoMedidasParteFirestore(usuario.id, parte);
        setHistoricoMedidasParte(novoHistorico);
      } catch (error) {
        console.error("Erro ao salvar medida no Firestore:", error);
      }
    }
  };

  // Diferença do peso (em relação ao peso de início)
  const diferencaPeso = Number((pesoInicial - pesoAtual).toFixed(1));

  // Abre a modal configurada para o modo desejado
  const abrirModalComModo = (modo: ModoRegistroPeso) => {
    setModoEdicao(modo);
    setModalRegistroAberto(true);
  };

  // Trata o salvamento dinâmico conforme o modo (atual, início ou meta)
  const handleSalvarPeso = async (novoValor: number, modo: ModoRegistroPeso, fotoBase64?: string | null) => {
    if (modo === 'atual') {
      setPesoAtual(novoValor);
      if (onAtualizarPeso) {
        onAtualizarPeso(novoValor);
      }
      try {
        localStorage.setItem('jejuar_peso_atual', novoValor.toString());
      } catch {}

      // Grava no Firestore na subcoleção de pesagens com foto Base64 e atualiza documento
      if (usuario?.id) {
        try {
          await registrarPesagemHistoricoFirestore(usuario.id, novoValor, fotoBase64 || undefined);
          setHistoricoPesagens((prev) => [
            ...prev,
            { peso: novoValor, dataIso: new Date().toISOString(), fotoUrl: fotoBase64 || null }
          ]);
        } catch (e) {
          console.warn("Erro ao salvar pesagem no Firestore:", e);
        }
      }
    } else if (modo === 'inicio') {
      setPesoInicial(novoValor);
      try {
        localStorage.setItem('jejuar_peso_inicio', novoValor.toString());
      } catch {}

      if (usuario?.id) {
        try {
          await atualizarPesoInicialFirestore(usuario.id, novoValor);
        } catch (e) {
          console.warn("Erro ao salvar peso inicial no Firestore:", e);
        }
      }
    } else if (modo === 'meta') {
      setPesoMeta(novoValor);
      try {
        localStorage.setItem('jejuar_peso_meta', novoValor.toString());
      } catch {}

      if (usuario?.id) {
        try {
          await atualizarMetaPesoFirestore(usuario.id, novoValor);
        } catch (e) {
          console.warn("Erro ao salvar meta de peso no Firestore:", e);
        }
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#F5F9FC] flex flex-col justify-start items-center overflow-y-auto animate-in slide-in-from-bottom duration-300"
      data-purpose="dados-corporais-fullscreen-page"
    >
      {/* Container mobile com largura padrão de 430px */}
      <div className="w-full max-w-[430px] min-h-screen flex flex-col bg-[#F5F9FC] relative pb-10">
        
        {/* ==================== Cabeçalho Superior ==================== */}
        <header className="sticky top-0 z-40 bg-[#F5F9FC]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
          <button
            type="button"
            onClick={onVoltar}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#092244] hover:bg-slate-200/60 active:scale-90 transition-all cursor-pointer"
            aria-label="Voltar para a tela anterior"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.3]" />
          </button>

          <h2 className="text-[18px] font-extrabold text-[#092244] tracking-tight">
            Dados Corporais
          </h2>

          <button
            type="button"
            onClick={() => setTelaConfiguracoesAberta(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#092244] hover:bg-slate-200/60 active:scale-90 transition-all cursor-pointer"
            aria-label="Configurações de peso e lembretes"
            title="Configurações de peso"
          >
            <Settings className="w-5 h-5 text-[#092244] stroke-[2.2]" />
          </button>
        </header>

        {/* ==================== Segmented Control (Peso | Corpo) ==================== */}
        <div className="px-4 pt-3 pb-2">
          <div className="bg-[#E8EFF5] p-1 rounded-full flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => setAbaAtiva('peso')}
              className={`flex-1 py-2 rounded-full font-bold text-[14px] transition-all cursor-pointer ${
                abaAtiva === 'peso'
                  ? 'bg-white text-[#092244] shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Peso
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('corpo')}
              className={`flex-1 py-2 rounded-full font-bold text-[14px] transition-all cursor-pointer ${
                abaAtiva === 'corpo'
                  ? 'bg-white text-[#092244] shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Corpo
            </button>
          </div>
        </div>

        {/* ==================== Conteúdo da Aba Peso ==================== */}
        {abaAtiva === 'peso' && (
          <main className="px-4 space-y-4 pt-1">
            
            {/* Card 1: Resumo do Peso Atual e Metas */}
            <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-[#092244] mb-1">
                  Atual
                </span>
                <div className="flex items-baseline gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[38px] font-black text-[#092244] tracking-tight leading-none">
                      {pesoAtual.toFixed(1)}
                    </span>
                    <span className="text-[18px] font-bold text-[#092244]">
                      kg
                    </span>
                  </div>

                  {/* Badge de Variação */}
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#E6F8F0] text-[#00C975] text-[12px] font-black tracking-wide">
                    {diferencaPeso >= 0 ? '↓' : '↑'} {Math.abs(diferencaPeso).toFixed(1).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Botão Principal de Registro */}
              <button
                type="button"
                onClick={() => abrirModalComModo('atual')}
                className="w-full py-3.5 rounded-full bg-[#00C975] hover:bg-[#00B568] active:scale-98 text-white font-extrabold text-[16px] shadow-[0_4px_14px_rgba(0,201,117,0.3)] transition-all cursor-pointer flex items-center justify-center min-h-[48px]"
              >
                Registrar peso
              </button>

              {/* Linha Comparativa: Iniciar vs Meta */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {/* Lado Esquerdo: Início */}
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => abrirModalComModo('inicio')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      abrirModalComModo('inicio');
                    }
                  }}
                  className="flex flex-col cursor-pointer active:scale-95 group hover:opacity-80 transition-all p-1.5 -m-1.5 rounded-xl select-none"
                  title="Toque para editar seu peso de início"
                  aria-label="Editar peso inicial"
                >
                  <span className="text-slate-400 font-semibold mb-0.5 group-hover:text-emerald-700 transition-colors">Iniciar</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-extrabold text-[#092244]">
                      {pesoInicial.toFixed(1)} kg
                    </span>
                    <div className="w-5 h-5 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                      <Edit3 className="w-3.5 h-3.5 text-[#00C975] stroke-[2.5]" />
                    </div>
                  </div>
                </div>

                {/* Centro: Ícone de Progresso */}
                <div className="flex items-center justify-center">
                  <ChevronsRight className="w-5 h-5 text-[#3AE18A] stroke-[2.5]" />
                </div>

                {/* Lado Direito: Meta */}
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => abrirModalComModo('meta')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      abrirModalComModo('meta');
                    }
                  }}
                  className="flex flex-col items-end cursor-pointer active:scale-95 group hover:opacity-80 transition-all p-1.5 -m-1.5 rounded-xl select-none"
                  title="Toque para editar sua meta de peso"
                  aria-label="Editar meta de peso"
                >
                  <span className="text-slate-400 font-semibold mb-0.5 group-hover:text-emerald-700 transition-colors">Meta</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-extrabold text-[#092244]">
                      {pesoMeta.toFixed(1)} kg
                    </span>
                    <div className="w-5 h-5 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                      <Edit3 className="w-3.5 h-3.5 text-[#00C975] stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Card 2: Lembrete Customizado */}
            <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 flex items-center justify-between overflow-hidden">
              <div className="flex-1 pr-3">
                <p className="text-[16px] font-extrabold text-[#092244] leading-snug max-w-[180px]">
                  Defina um lembrete que se encaixe no seu ritmo
                </p>
                <button
                  type="button"
                  onClick={() => setTelaConfiguracoesAberta(true)}
                  className="mt-3 px-5 py-2 rounded-full border-[1.8px] border-[#F5A623] text-[#E08A00] font-bold text-xs bg-white hover:bg-amber-50 active:scale-95 transition-all inline-block min-h-[38px] cursor-pointer"
                >
                  Definir agora
                </button>
              </div>

              {/* Ilustração Temática: Despertador sobre a Balança */}
              <div className="w-28 h-24 relative flex-shrink-0 flex items-center justify-center">
                {/* Balança Digital na Base */}
                <div className="absolute bottom-1 w-24 h-10 bg-slate-100 rounded-xl shadow-md border border-slate-200 flex flex-col items-center justify-end pb-1">
                  <div className="w-8 h-2 bg-slate-300 rounded-sm mb-0.5" />
                </div>
                {/* Relógio Despertador Analógico em cima */}
                <div className="relative z-10 w-14 h-14 rounded-full bg-white shadow-lg border-2 border-amber-300 flex items-center justify-center">
                  {/* Campainhas do despertador */}
                  <div className="absolute -top-1.5 -left-1 w-4 h-3 bg-amber-400 rounded-t-full rotate-[-30deg]" />
                  <div className="absolute -top-1.5 -right-1 w-4 h-3 bg-amber-400 rounded-t-full rotate-[30deg]" />
                  {/* Ponteiros */}
                  <div className="w-1 h-3.5 bg-[#092244] rounded-full origin-bottom" />
                  <div className="w-2.5 h-1 bg-[#F5A623] rounded-full origin-left" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00C975] absolute" />
                </div>
              </div>
            </section>

            {/* Card 3: Gráfico de Evolução do Peso */}
            <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-3">
              {/* Topo do Card de Gráfico */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 cursor-pointer group">
                  <h3 className="text-[17px] font-extrabold text-[#092244] group-hover:text-emerald-600 transition-colors">
                    Peso
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Média e Meta */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="text-slate-500 font-medium">
                  Média: <span className="text-[#092244] font-extrabold">{pesoAtual.toFixed(1).replace('.', ',')} kg</span>
                </div>
                <div className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="w-4 border-b-2 border-dashed border-slate-300 inline-block" />
                  <span>Meta: {pesoMeta.toFixed(1).replace('.', ',')} kg</span>
                </div>
              </div>

              {/* Seletor de Período (Semana | Mês | Trimestre) */}
              <div className="bg-[#F0F5FA] p-1 rounded-full flex items-center text-xs font-bold my-1">
                <button
                  type="button"
                  onClick={() => setPeriodoGrafico('semana')}
                  className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
                    periodoGrafico === 'semana'
                      ? 'bg-white text-[#092244] shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoGrafico('mes')}
                  className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
                    periodoGrafico === 'mes'
                      ? 'bg-white text-[#092244] shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoGrafico('trimestre')}
                  className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
                    periodoGrafico === 'trimestre'
                      ? 'bg-white text-[#092244] shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Trimestre
                </button>
              </div>

              {/* Renderização do Gráfico SVG de Precisão */}
              <div className="w-full h-48 relative mt-3 select-none">
                <svg className="w-full h-full" viewBox="0 0 340 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaPesoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00C975" stopOpacity="0.30" />
                      <stop offset="85%" stopColor="#00C975" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#00C975" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Linhas de Grade Horizontal do Eixo Y */}
                  {[20, 50, 80, 110, 140].map((y, idx) => (
                    <line 
                      key={idx} 
                      x1="35" 
                      y1={y} 
                      x2="330" 
                      y2={y} 
                      stroke="#F1F5F9" 
                      strokeWidth="1" 
                    />
                  ))}

                  {/* Linha Guia Vertical do Dia Selecionado (26/10) */}
                  <line 
                    x1="225" 
                    y1="35" 
                    x2="225" 
                    y2="150" 
                    stroke="#00C975" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                  />

                  {/* Linha Tracejada de Meta */}
                  <line 
                    x1="35" 
                    y1="110" 
                    x2="330" 
                    y2="110" 
                    stroke="#CBD5E1" 
                    strokeWidth="1.2" 
                    strokeDasharray="4 4" 
                  />

                  {/* Área Preenchida com Gradiente Verde */}
                  <polygon
                    points="50,110 95,110 140,110 180,110 225,115 225,150 50,150"
                    fill="url(#areaPesoGradient)"
                  />

                  {/* Linha de Traçado do Peso Registrado */}
                  <polyline
                    fill="none"
                    stroke="#00C975"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="50,110 95,110 140,110 180,110 225,115"
                  />

                  {/* Pontos Registrados (Nós circulares) */}
                  {[
                    { cx: 50, cy: 110 },
                    { cx: 95, cy: 110 },
                    { cx: 140, cy: 110 },
                    { cx: 180, cy: 110 },
                    { cx: 225, cy: 115 },
                  ].map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.cx}
                      cy={p.cy}
                      r="3.5"
                      fill="#00C975"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>

                {/* Eixos Y: Escala de Pesos em Texto */}
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-semibold text-slate-400 pointer-events-none">
                  <span>74,0</span>
                  <span>73,4</span>
                  <span>72,8</span>
                  <span>72,2</span>
                  <span>71,6</span>
                  <span>71,0</span>
                </div>

                {/* Eixos X: Datas da Semana */}
                <div className="absolute left-10 right-2 bottom-0 flex justify-between text-[10px] font-bold text-slate-400 pointer-events-none">
                  <span>22/10</span>
                  <span>23/10</span>
                  <span>24/10</span>
                  <span>25/10</span>
                  <span className="text-[#00C975] font-black">26/10</span>
                  <span>27/10</span>
                  <span>28/10</span>
                </div>

                {/* Balão / Tooltip Flutuante no Dia Atual com Valor Exato */}
                <div 
                  className="absolute z-20 flex flex-col items-center pointer-events-none transition-all duration-300"
                  style={{ left: 'calc(66% - 16px)', top: '68px' }}
                >
                  <div className="px-2 py-0.5 rounded-md bg-[#00C975] text-white text-[11px] font-black shadow-md">
                    {pesoAtual.toFixed(1)}
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        {/* ==================== Conteúdo da Aba Corpo ==================== */}
        {abaAtiva === 'corpo' && (
          <main className="px-4 pt-1">
            <VisualizadorCorpoMedidas
              genero={usuario?.informacoesBasicas?.genero || 'masculino'}
              alturaUsuario={usuario?.informacoesBasicas?.altura || 175}
              parteSelecionada={parteCorpoAtiva}
              onSelecionarParte={(parte) => setParteCorpoAtiva(parte)}
              onRegistrarMedida={(parte) => {
                setParteCorpoAtiva(parte);
                setModalMedidaCorpoAberta(true);
              }}
              medidasAtuais={medidasCorporais}
              historico={historicoMedidasParte}
            />
          </main>
        )}

        {/* ==================== Modal Bottom Sheet de Registrar / Editar Peso ==================== */}
        <ModalRegistrarPeso
          visivel={modalRegistroAberto}
          modo={modoEdicao}
          pesoInicial={
            modoEdicao === 'inicio' 
              ? pesoInicial 
              : modoEdicao === 'meta' 
                ? pesoMeta 
                : pesoAtual
          }
          onFechar={() => setModalRegistroAberto(false)}
          onSalvar={handleSalvarPeso}
        />

        {/* ==================== Modal Bottom Sheet de Registrar Medida do Corpo ==================== */}
        <ModalRegistrarMedidaCorpo
          visivel={modalMedidaCorpoAberta}
          parte={parteCorpoAtiva}
          valorInicial={medidasCorporais[parteCorpoAtiva]}
          onFechar={() => setModalMedidaCorpoAberta(false)}
          onSalvar={handleSalvarMedidaCorpo}
        />

        {/* ==================== Tela de Configurações de Peso ==================== */}
        {telaConfiguracoesAberta && (
          <ConfiguracoesPesoScreen
            usuario={usuario}
            onVoltar={() => setTelaConfiguracoesAberta(false)}
          />
        )}
      </div>
    </div>
  );
};
