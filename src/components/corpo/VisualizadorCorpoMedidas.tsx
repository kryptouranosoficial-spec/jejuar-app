/**
 * @file VisualizadorCorpoMedidas.tsx
 * @description Exibe a representação interativa do corpo humano (masculino e feminino),
 * pontos anatômicos conectados por linhas tracejadas a badges flutuantes, card com abas
 * de histórico e botão de registro de medidas corporais.
 */

import React, { useState, useMemo } from 'react';
import { Edit2, Plus, Info, User } from 'lucide-react';
import { ParteDoCorpo, PARTES_CORPO_CONFIG } from './ModalRegistrarMedidaCorpo';
import type { RegistroMedidaCorporal } from '../../services/firebase';

interface VisualizadorCorpoMedidasProps {
  /** Gênero do usuário para adequação anatômica ('masculino' | 'feminino') */
  genero?: 'masculino' | 'feminino' | string;
  /** Altura do usuário em cm para cálculo da faixa saudável de referência */
  alturaUsuario?: number;
  /** Parte atualmente selecionada */
  parteSelecionada: ParteDoCorpo;
  /** Callback ao selecionar uma parte diferente */
  onSelecionarParte: (parte: ParteDoCorpo) => void;
  /** Callback ao clicar para registrar ou editar medida */
  onRegistrarMedida: (parte: ParteDoCorpo) => void;
  /** Medidas atuais do usuário */
  medidasAtuais?: Partial<Record<ParteDoCorpo, number>>;
  /** Histórico de medidas da parte selecionada */
  historico?: RegistroMedidaCorporal[];
}

/**
 * Calcula a faixa saudável de referência (min e max em cm) segundo os padrões da OMS
 * e relações de proporção antropométrica em função da altura e gênero do usuário.
 */
export function calcularFaixaIdealMedida(
  parte: ParteDoCorpo,
  genero: string = 'masculino',
  alturaCm: number = 175
): { min: number; max: number; informacao: string } {
  const h = alturaCm > 0 ? alturaCm : 175;
  const ehFeminino = genero?.toLowerCase() === 'feminino';

  switch (parte) {
    case 'cintura': {
      // OMS / Relação Cintura-Altura (RCA 0,40 - 0,48)
      const min = Math.round(h * (ehFeminino ? 0.40 : 0.41));
      const max = Math.round(h * (ehFeminino ? 0.47 : 0.48));
      return {
        min,
        max,
        informacao: 'Faixa de prevenção de gordura visceral (OMS - RCA < 0,50).'
      };
    }
    case 'quadris': {
      // Relação Cintura-Quadril OMS
      const min = Math.round(h * (ehFeminino ? 0.54 : 0.52));
      const max = Math.round(h * (ehFeminino ? 0.62 : 0.58));
      return {
        min,
        max,
        informacao: 'Proporção pélvica saudável e distribuição lipídica.'
      };
    }
    case 'peito': {
      // Proporção torácica
      const min = Math.round(h * (ehFeminino ? 0.50 : 0.53));
      const max = Math.round(h * (ehFeminino ? 0.56 : 0.60));
      return {
        min,
        max,
        informacao: 'Perímetro torácico ideal para capacidade e proporção.'
      };
    }
    case 'coxa': {
      // Sustentação e massa muscular
      const min = Math.round(h * 0.30);
      const max = Math.round(h * 0.35);
      return {
        min,
        max,
        informacao: 'Perímetro saudável para sustentação e trofismo muscular.'
      };
    }
    case 'braco': {
      // Perímetro de membros superiores
      const min = Math.round(h * (ehFeminino ? 0.18 : 0.19));
      const max = Math.round(h * (ehFeminino ? 0.21 : 0.22));
      return {
        min,
        max,
        informacao: 'Perímetro de braço relaxado proporcional à altura.'
      };
    }
    default:
      return { min: 70, max: 90, informacao: 'Faixa de referência antropométrica.' };
  }
}

interface PontoAnatomico {
  id: ParteDoCorpo;
  rotulo: string;
  // Coordenadas relativas em porcentagem (0 - 100) no container
  pontoX: number;
  pontoY: number;
  badgeX: number;
  badgeY: number;
  posicaoBadge: 'esquerda' | 'direita';
}

// Mapeamento dos pontos anatômicos para modelo masculino
const PONTOS_MASCULINO: PontoAnatomico[] = [
  {
    id: 'peito',
    rotulo: 'Peito',
    pontoX: 41,
    pontoY: 28,
    badgeX: 18,
    badgeY: 23,
    posicaoBadge: 'esquerda',
  },
  {
    id: 'braco',
    rotulo: 'Braço',
    pontoX: 70,
    pontoY: 30,
    badgeX: 84,
    badgeY: 23,
    posicaoBadge: 'direita',
  },
  {
    id: 'cintura',
    rotulo: 'Cintura',
    pontoX: 37,
    pontoY: 53,
    badgeX: 18,
    badgeY: 52,
    posicaoBadge: 'esquerda',
  },
  {
    id: 'quadris',
    rotulo: 'Quadris',
    pontoX: 62,
    pontoY: 67,
    badgeX: 84,
    badgeY: 67,
    posicaoBadge: 'direita',
  },
  {
    id: 'coxa',
    rotulo: 'Coxa',
    pontoX: 59,
    pontoY: 82,
    badgeX: 84,
    badgeY: 82,
    posicaoBadge: 'direita',
  },
];

// Mapeamento dos pontos anatômicos para modelo feminino
const PONTOS_FEMININO: PontoAnatomico[] = [
  {
    id: 'peito',
    rotulo: 'Peito',
    pontoX: 43,
    pontoY: 29,
    badgeX: 18,
    badgeY: 23,
    posicaoBadge: 'esquerda',
  },
  {
    id: 'braco',
    rotulo: 'Braço',
    pontoX: 68,
    pontoY: 31,
    badgeX: 84,
    badgeY: 23,
    posicaoBadge: 'direita',
  },
  {
    id: 'cintura',
    rotulo: 'Cintura',
    pontoX: 42,
    pontoY: 48,
    badgeX: 18,
    badgeY: 48,
    posicaoBadge: 'esquerda',
  },
  {
    id: 'quadris',
    rotulo: 'Quadris',
    pontoX: 61,
    pontoY: 65,
    badgeX: 84,
    badgeY: 65,
    posicaoBadge: 'direita',
  },
  {
    id: 'coxa',
    rotulo: 'Coxa',
    pontoX: 58,
    pontoY: 80,
    badgeX: 84,
    badgeY: 80,
    posicaoBadge: 'direita',
  },
];

export const VisualizadorCorpoMedidas: React.FC<VisualizadorCorpoMedidasProps> = ({
  genero = 'masculino',
  alturaUsuario = 175,
  parteSelecionada,
  onSelecionarParte,
  onRegistrarMedida,
  medidasAtuais = {},
  historico = [],
}) => {
  // Define os pontos conforme o gênero configurado no onboarding
  const ehFeminino = genero?.toLowerCase() === 'feminino';
  const pontos = ehFeminino ? PONTOS_FEMININO : PONTOS_MASCULINO;

  // Calcula a faixa saudável de referência segundo os padrões da OMS
  const faixaIdeal = useMemo(() => {
    return calcularFaixaIdealMedida(parteSelecionada, genero, alturaUsuario);
  }, [parteSelecionada, genero, alturaUsuario]);

  // Lista ordenada das abas do card inferior
  const abasInferiores: ParteDoCorpo[] = ['cintura', 'peito', 'coxa', 'braco', 'quadris'];

  // Gera datas dos últimos 7 dias para o gráfico
  const datasGrafico = useMemo(() => {
    const hoje = new Date();
    const lista = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      lista.push({
        rotulo: `${mes}/${dia}`,
        dataIso: d.toISOString().split('T')[0],
      });
    }
    return lista;
  }, []);

  // Valor atual medido da parte selecionada
  const valorAtualParte = medidasAtuais[parteSelecionada] || PARTES_CORPO_CONFIG[parteSelecionada]?.padrao || 90;

  return (
    <div className="flex flex-col space-y-3 pb-8">
      {/* ==================== Container da Imagem do Corpo e Pontos Interativos ==================== */}
      <div className="relative w-full h-[410px] overflow-hidden rounded-3xl bg-gradient-to-b from-slate-50/60 via-white to-white flex items-center justify-center select-none shadow-xs border border-gray-100/60">
        
        {/* Foto do Modelo Isolada e Limpa (Sem textos, botões ou sobreposições) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={ehFeminino ? "/assets/aistudio/corpo_feminino_limpo.png" : "/assets/aistudio/corpo_masculino_limpo.png"}
            alt={ehFeminino ? "Modelo Corporal Feminino" : "Modelo Corporal Masculino"}
            className="w-full h-full object-contain object-center"
            loading="eager"
          />
        </div>

        {/* Camada SVG para as Linhas Tracejadas de Conexão */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {pontos.map((p) => {
            const ehAtivo = p.id === parteSelecionada;
            return (
              <line
                key={`linha-${p.id}`}
                x1={`${p.badgeX}%`}
                y1={`${p.badgeY + 2}%`}
                x2={`${p.pontoX}%`}
                y2={`${p.pontoY}%`}
                stroke={ehAtivo ? '#00C975' : '#94A3B8'}
                strokeWidth={ehAtivo ? '1.8' : '1.2'}
                strokeDasharray={ehAtivo ? '3 3' : '3 3'}
                strokeOpacity={ehAtivo ? 0.95 : 0.6}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Pontos Anatômicos Circulares no Corpo */}
        {pontos.map((p) => {
          const ehAtivo = p.id === parteSelecionada;
          return (
            <div
              key={`ponto-${p.id}`}
              style={{ left: `${p.pontoX}%`, top: `${p.pontoY}%` }}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer p-3 group"
              onClick={() => onSelecionarParte(p.id)}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                  ehAtivo
                    ? 'bg-white border-2 border-[#00C975] ring-4 ring-[#00C975]/25 scale-110 shadow-sm'
                    : 'bg-white border-2 border-slate-400 group-hover:border-slate-600 shadow-xs'
                }`}
              />
            </div>
          );
        })}

        {/* Badges Flutuantes Clicáveis (Peito, Cintura, Braço, Quadris, Coxa) */}
        {pontos.map((p) => {
          const ehAtivo = p.id === parteSelecionada;
          return (
            <button
              key={`badge-${p.id}`}
              type="button"
              onClick={() => onSelecionarParte(p.id)}
              style={{ left: `${p.badgeX}%`, top: `${p.badgeY}%` }}
              className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 min-w-[84px] h-[44px] px-3.5 rounded-2xl flex items-center justify-center font-black text-[15px] transition-all duration-200 active:scale-95 shadow-sm ${
                ehAtivo
                  ? 'bg-white border-2 border-[#00C975] text-[#092244] shadow-md shadow-[#00C975]/10'
                  : 'bg-white/95 hover:bg-white text-[#092244] border border-gray-100/90 hover:border-gray-200'
              }`}
            >
              {p.rotulo}
            </button>
          );
        })}
      </div>

      {/* ==================== Botão Principal de Registro (Posicionado abaixo do corpo) ==================== */}
      <div className="w-full pt-1 pb-1">
        <button
          type="button"
          onClick={() => onRegistrarMedida(parteSelecionada)}
          className="w-full h-12 min-h-[48px] bg-[#00C975] hover:bg-[#00B76A] active:scale-[0.98] text-white text-[15px] font-black rounded-2xl shadow-md shadow-[#00C975]/20 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Registrar {PARTES_CORPO_CONFIG[parteSelecionada]?.rotulo.toLowerCase()}</span>
        </button>
      </div>

      {/* ==================== Card Inferior com Abas e Gráfico de Histórico ==================== */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 flex flex-col space-y-4">
        
        {/* Banner Informativo com a Faixa Ideal Saudável (OMS) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl px-3.5 py-2.5 text-xs text-[#166534] gap-1 select-none">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C975] shrink-0 animate-pulse" />
            <span className="font-bold text-[12px]">
              Faixa Saudável: <strong className="text-[#00C975] font-black">{faixaIdeal.min} cm - {faixaIdeal.max} cm</strong>
            </span>
          </div>
          <span className="text-[11px] text-emerald-700/80 font-medium">
            Calculado para {alturaUsuario} cm ({ehFeminino ? 'Mulher' : 'Homem'})
          </span>
        </div>

        {/* Barra de Abas Horizontais (Cintura, Peito, Coxa, Braço, Quadris) */}
        <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
          <div className="flex items-center space-x-5 overflow-x-auto scrollbar-none py-1">
            {abasInferiores.map((abaId) => {
              const ehAtiva = abaId === parteSelecionada;
              const info = PARTES_CORPO_CONFIG[abaId];
              return (
                <button
                  key={abaId}
                  type="button"
                  onClick={() => onSelecionarParte(abaId)}
                  className={`relative pb-2 font-black text-[15px] transition-all whitespace-nowrap ${
                    ehAtiva ? 'text-[#092244]' : 'text-slate-400 hover:text-slate-600 font-bold'
                  }`}
                >
                  {info.rotulo}
                  {ehAtiva && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#00C975] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Botão de Edição Rápida com Ícone de Lápis em Verde Claro */}
          <button
            type="button"
            onClick={() => onRegistrarMedida(parteSelecionada)}
            aria-label="Editar medida"
            className="w-8 h-8 rounded-full bg-[#EEFAF7] text-[#00C975] hover:bg-[#D7F5ED] flex items-center justify-center transition-colors shrink-0 active:scale-90"
          >
            <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Gráfico de Evolução de Medidas */}
        <div className="relative pt-2 pb-1">
          <div className="flex">
            {/* Eixo Y com Escala Numérica Fiel */}
            <div className="w-9 flex flex-col justify-between text-[11px] font-semibold text-slate-400 h-36 pr-1 select-none">
              <span>182</span>
              <span>156</span>
              <span>130</span>
              <span>104</span>
              <span>78</span>
              <span>52</span>
            </div>

            {/* Área de Linhas do Gráfico */}
            <div className="flex-1 relative h-36 border-b border-slate-100 overflow-hidden rounded-md">
              {/* Linhas horizontais guias */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-slate-100" />
                <div className="w-full border-t border-slate-100" />
                <div className="w-full border-t border-slate-100" />
                <div className="w-full border-t border-slate-100" />
                <div className="w-full border-t border-slate-100" />
                <div className="w-full border-t border-slate-100" />
              </div>

              {/* Faixa Translucida de Meta Saudável */}
              <div 
                className="absolute left-0 right-0 bg-[#00C975]/15 border-y border-dashed border-[#00C975]/50 pointer-events-none transition-all duration-300"
                style={{
                  bottom: `${Math.min(Math.max(((faixaIdeal.min - 52) / (182 - 52)) * 100, 0), 100)}%`,
                  top: `${100 - Math.min(Math.max(((faixaIdeal.max - 52) / (182 - 52)) * 100, 0), 100)}%`
                }}
              />

              {/* Linha Tracejada do Valor Atual */}
              <div 
                className="absolute left-0 right-0 border-t border-dashed border-orange-300 pointer-events-none transition-all duration-300"
                style={{
                  bottom: `${Math.min(Math.max(((valorAtualParte - 52) / (182 - 52)) * 100, 5), 95)}%`
                }}
              />

              {/* Marcador do Valor Atual do Usuário com Avatar e Status */}
              {(() => {
                const estaNaFaixa = valorAtualParte >= faixaIdeal.min && valorAtualParte <= faixaIdeal.max;
                const estaAbaixo = valorAtualParte < faixaIdeal.min;
                
                const corBadge = estaNaFaixa
                  ? 'border-[#00C975]/40 shadow-[#00C975]/10'
                  : 'border-amber-400/60 shadow-amber-500/10';

                const corStatus = estaNaFaixa
                  ? 'bg-[#00C975] text-white'
                  : 'bg-amber-500 text-white';

                const textoStatus = estaNaFaixa
                  ? 'Ideal'
                  : estaAbaixo
                  ? 'Abaixo'
                  : 'Acima';

                const pctBottom = Math.min(Math.max(((valorAtualParte - 52) / (182 - 52)) * 100, 15), 85);
                const cardEmCima = pctBottom <= 70;

                return (
                  <div 
                    className="absolute -translate-x-[78%] transition-all duration-300 z-20 flex flex-col items-end pointer-events-auto select-none"
                    style={{
                      left: '85%',
                      bottom: `${pctBottom}%`
                    }}
                  >
                    {/* Card/Balão Flutuante quando posicionado acima do ponto */}
                    {cardEmCima && (
                      <div className={`mb-1 px-2 py-0.5 rounded-xl bg-white/95 backdrop-blur-xs border shadow-sm flex items-center space-x-1.5 whitespace-nowrap transition-all ${corBadge}`}>
                        {/* Avatar do Usuário */}
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${
                          estaNaFaixa ? 'bg-[#00C975]' : 'bg-amber-500'
                        }`}>
                          <User className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>

                        {/* Valor Registrado em cm */}
                        <span className="font-black text-[12px] text-[#092244] tracking-tight">
                          {valorAtualParte.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cm
                        </span>

                        {/* Tag de Status da Faixa */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${corStatus}`}>
                          {textoStatus}
                        </span>
                      </div>
                    )}

                    {/* Ponto / Marcador Circular Ancorado no Gráfico */}
                    <div className="relative flex items-center justify-center -translate-y-1/2 mr-1">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-2 ${
                        estaNaFaixa ? 'bg-[#00C975] ring-[#00C975]/30' : 'bg-amber-500 ring-amber-500/30'
                      }`} />
                      <div className={`absolute w-5 h-5 rounded-full animate-ping opacity-25 ${
                        estaNaFaixa ? 'bg-[#00C975]' : 'bg-amber-500'
                      }`} />
                    </div>

                    {/* Card/Balão Flutuante quando posicionado abaixo do ponto (evita estourar topo do gráfico) */}
                    {!cardEmCima && (
                      <div className={`mt-1 px-2 py-0.5 rounded-xl bg-white/95 backdrop-blur-xs border shadow-sm flex items-center space-x-1.5 whitespace-nowrap transition-all ${corBadge}`}>
                        {/* Avatar do Usuário */}
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${
                          estaNaFaixa ? 'bg-[#00C975]' : 'bg-amber-500'
                        }`}>
                          <User className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>

                        {/* Valor Registrado em cm */}
                        <span className="font-black text-[12px] text-[#092244] tracking-tight">
                          {valorAtualParte.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cm
                        </span>

                        {/* Tag de Status da Faixa */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${corStatus}`}>
                          {textoStatus}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Eixo X com Datas dos Dias */}
          <div className="flex items-center justify-between pl-9 pt-2 text-[11px] font-semibold text-slate-400 select-none">
            {datasGrafico.map((d) => (
              <span key={d.rotulo}>{d.rotulo}</span>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
};
