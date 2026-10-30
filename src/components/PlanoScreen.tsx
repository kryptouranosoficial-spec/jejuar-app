/**
 * @file PlanoScreen.tsx
 * @description Tela de Planos de Jejum Intermitente do aplicativo Jejuar.
 * Componente modularizado e de alta performance que organiza os protocolos de jejum:
 * 1. Banner "Plano Personalizado" inteligente baseado nas respostas do onboarding.
 * 2. Seção "Planos Populares" (16:8, 23:1 OMAD, 20:4 Guerreiro, 14:10).
 * 3. Seção "Planos Básicos" (12:12, 13:11, 14:10, 15:9 PRO).
 * 4. Seção "Planos Intermediários" (16:8, 17:7 PRO, 18:6 PRO, 19:5 PRO).
 * 5. Seção "Planos Avançados" (20:4, 21:3 PRO, 22:2 PRO, 23:1 PRO).
 * 6. Seção "Planos Personalizados & Prolongados" (Customizar, 24h, 30h, 48h, 72h, 168h).
 */

import React, { useState, useEffect } from 'react';
import { Check, X, Sliders } from 'lucide-react';
import type { UsuarioEmCadastro } from '../types';
import { buscarPlanosFirestore } from '../services/firebase';
import {
  type ProtocoloJejum,
  PLANOS_POPULARES,
  PLANOS_BASICOS,
  PLANOS_INTERMEDIARIOS,
  PLANOS_AVANCADOS,
  PLANOS_PROLONGADOS,
} from '../data/planosJejumData';
import { BannerPlanoRecomendado } from './plano/BannerPlanoRecomendado';
import { 
  CardPlanoPopular, 
  CardPlanoGrade, 
  CardPlanoProlongado, 
  CardPlanoSeteDias 
} from './plano/PlanoCards';
import { ModalRecomendacaoPlano } from './plano/ModalRecomendacaoPlano';
import { ModalCustomizarPlano } from './plano/ModalCustomizarPlano';

// Re-exporta a tipagem de ProtocoloJejum para manter compatibilidade total
export type { ProtocoloJejum };

interface PlanoScreenProps {
  /** Dados persistidos ou coletados do usuário no onboarding */
  usuario?: UsuarioEmCadastro;
  /** Identificador do plano atualmente ativo (ex: '16:8') */
  planoAtivoId: string;
  /** Callback para atualizar o plano selecionado e sua meta em horas */
  onSelecionarPlano: (protocolo: ProtocoloJejum) => void;
}

export const PlanoScreen: React.FC<PlanoScreenProps> = ({
  usuario,
  planoAtivoId,
  onSelecionarPlano,
}) => {
  // Sincroniza a coleção 'planos' no Firestore em background (auto-seed garantido)
  useEffect(() => {
    buscarPlanosFirestore().catch((err) => {
      console.warn("Aviso ao carregar planos do Firestore:", err);
    });
  }, []);

  // Modais de Recomendação Personalizada e Customizador PRO
  const [modalRecomendacaoAberto, setModalRecomendacaoAberto] = useState<boolean>(false);
  const [modalCustomizarAberto, setModalCustomizarAberto] = useState<boolean>(false);
  const [horasCustomJejum, setHorasCustomJejum] = useState<number>(16);

  // Toast flutuante de confirmação com feedback claro
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  // Extrai informações do onboarding para recomendação inteligente
  const pesoAtual = usuario?.informacoesBasicas?.peso || 72.0;
  const pesoDesejado = usuario?.informacoesBasicas?.pesoDesejado || 66.0;
  const experiencia = usuario?.informacoesBasicas?.experienciaJejum || 'iniciante';
  const diferencaPeso = Math.max(0, pesoAtual - pesoDesejado);

  /**
   * Calcula a melhor recomendação de plano baseada no perfil e histórico do usuário
   */
  const obterRecomendacaoOnboarding = (): {
    plano: ProtocoloJejum;
    motivo: string;
    beneficio: string;
  } => {
    if (experiencia === 'experiente' || diferencaPeso > 10) {
      return {
        plano: {
          id: '18:6',
          nome: '18:6',
          horasJejum: 18,
          horasAlimentacao: 6,
          categoria: 'intermediario',
          rotuloDestaque: 'Queima Acelerada',
        },
        motivo: `Você já possui boa adaptação e tem uma meta de eliminar ${diferencaPeso.toFixed(1)} kg com constância.`,
        beneficio: 'Ativa autofagia profunda diária e maximiza o consumo de reservas lipídicas durante as últimas horas.',
      };
    }

    if (experiencia === 'intermediario' || diferencaPeso > 5) {
      return {
        plano: {
          id: '16:8',
          nome: '16:8',
          horasJejum: 16,
          horasAlimentacao: 8,
          categoria: 'popular',
          rotuloDestaque: 'Equilíbrio Ideal',
        },
        motivo: `Excelente padrão ouro para eliminar ${diferencaPeso.toFixed(1)} kg sem estresse metabólico ou perda muscular.`,
        beneficio: 'Proporciona regulação glicêmica estável, fácil adesão social e perda de gordura consistente.',
      };
    }

    return {
      plano: {
        id: '14:10',
        nome: '14:10',
        horasJejum: 14,
        horasAlimentacao: 10,
        categoria: 'basico',
        rotuloDestaque: 'Início Suave',
      },
      motivo: 'Ideal para o seu período de adaptação, permitindo que seu corpo aprenda a usar gordura como energia sem desconforto.',
      beneficio: 'Melhora a digestão noturna, qualidade do sono e disposição matinal.',
    };
  };

  const recomendacao = obterRecomendacaoOnboarding();

  /**
   * Aciona a seleção de um plano com feedback tátil e visual amigável
   */
  const handleEscolherPlano = (protocolo: ProtocoloJejum) => {
    onSelecionarPlano(protocolo);
    setToastMensagem(`Plano ${protocolo.nome} ativado com sucesso! Sua meta agora é de ${protocolo.horasJejum}h.`);
    setTimeout(() => {
      setToastMensagem(null);
    }, 3500);
  };

  /**
   * Aplica o plano customizado criado pelo usuário
   */
  const handleAplicarCustomizado = () => {
    const horasComendo = Math.max(1, 24 - horasCustomJejum);
    const novoPlano: ProtocoloJejum = {
      id: `custom_${horasCustomJejum}:${horasComendo}`,
      nome: `${horasCustomJejum}:${horasComendo}`,
      horasJejum: horasCustomJejum,
      horasAlimentacao: horasComendo,
      categoria: 'prolongado',
      rotuloDestaque: 'Personalizado',
      ehPro: true,
    };
    handleEscolherPlano(novoPlano);
    setModalCustomizarAberto(false);
  };

  return (
    <div className="w-full flex flex-col relative select-none">
      {/* Toast flutuante de confirmação */}
      {toastMensagem && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] bg-[#092244] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-7 h-7 rounded-full bg-[#00C975] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white stroke-[3]" />
          </div>
          <span className="text-xs font-semibold leading-snug flex-1">{toastMensagem}</span>
          <button 
            type="button" 
            onClick={() => setToastMensagem(null)} 
            className="text-gray-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Banner: Plano Personalizado Inteligente */}
      <BannerPlanoRecomendado 
        onVerificar={() => setModalRecomendacaoAberto(true)} 
      />

      {/* Seção 1: Planos Populares */}
      <section className="mb-7" data-purpose="popular-plans-section">
        <div className="flex items-baseline justify-between mb-3.5">
          <div>
            <h3 className="text-[18px] font-bold text-[#0B1C30] tracking-tight">Planos Populares</h3>
            <p className="text-[13px] text-[#565E74]">A escolha mais frequente da nossa comunidade</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PLANOS_POPULARES.map((plano) => (
            <CardPlanoPopular
              key={plano.id}
              plano={plano}
              estaSelecionado={planoAtivoId === plano.id}
              onSelecionar={handleEscolherPlano}
            />
          ))}
        </div>
      </section>

      {/* Seção 2: Planos Básicos */}
      <section className="mb-7" data-purpose="basic-plans-section">
        <div className="mb-3.5">
          <h3 className="text-[18px] font-bold text-[#0B1C30] tracking-tight">Planos Básicos</h3>
          <p className="text-[13px] text-[#565E74]">Fácil de começar para iniciantes</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PLANOS_BASICOS.map((item) => (
            <CardPlanoGrade
              key={item.id}
              item={item}
              categoria="basico"
              estaSelecionado={planoAtivoId === item.id}
              onSelecionar={handleEscolherPlano}
            />
          ))}
        </div>
      </section>

      {/* Seção 3: Planos Intermediários */}
      <section className="mb-7" data-purpose="intermediate-plans-section">
        <div className="mb-3.5">
          <h3 className="text-[18px] font-bold text-[#0B1C30] tracking-tight">Planos Intermediários</h3>
          <p className="text-[13px] text-[#565E74]">Para queima de gordura e mais energia</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PLANOS_INTERMEDIARIOS.map((item) => (
            <CardPlanoGrade
              key={item.id}
              item={item}
              categoria="intermediario"
              estaSelecionado={planoAtivoId === item.id}
              onSelecionar={handleEscolherPlano}
            />
          ))}
        </div>
      </section>

      {/* Seção 4: Planos Avançados */}
      <section className="mb-7" data-purpose="advanced-plans-section">
        <div className="mb-3.5">
          <h3 className="text-[18px] font-bold text-[#0B1C30] tracking-tight">Planos Avançados</h3>
          <p className="text-[13px] text-[#565E74]">Autofagia e resultados máximos</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PLANOS_AVANCADOS.map((item) => (
            <CardPlanoGrade
              key={item.id}
              item={item}
              categoria="avancado"
              estaSelecionado={planoAtivoId === item.id}
              onSelecionar={handleEscolherPlano}
            />
          ))}
        </div>
      </section>

      {/* Seção 5: Planos Personalizados & Prolongados */}
      <section className="mb-10" data-purpose="custom-prolonged-plans-section">
        <div className="mb-3.5">
          <h3 className="text-[18px] font-bold text-[#0B1C30] tracking-tight">Personalizados & Prolongados</h3>
          <p className="text-[13px] text-[#565E74]">Para usuários experientes e supervisão</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card Customizar */}
          <button
            type="button"
            onClick={() => setModalCustomizarAberto(true)}
            className="p-4 rounded-2xl bg-white border-2 border-dashed border-[#00C975]/60 hover:border-[#00C975] text-left flex flex-col justify-between transition-all active:scale-[0.98] min-h-[110px] cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[20px] text-[#006D3D] font-extrabold">Customizar</span>
              <div className="w-6 h-6 rounded-full bg-[#00C975]/15 text-[#006D3D] flex items-center justify-center">
                <Sliders className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xs text-[#565E74] font-medium leading-tight">
              Defina seu próprio horário de jejum e refeição
            </p>
          </button>

          {/* Cards Prolongados */}
          {PLANOS_PROLONGADOS.map((item) => (
            <CardPlanoProlongado
              key={item.id}
              item={item}
              estaSelecionado={planoAtivoId === item.id}
              onSelecionar={handleEscolherPlano}
            />
          ))}

          {/* 168h PRO (7 dias) em largura total */}
          <CardPlanoSeteDias
            estaSelecionado={planoAtivoId === '168h'}
            onSelecionar={handleEscolherPlano}
          />
        </div>
      </section>

      {/* Modal de Recomendação Personalizada */}
      <ModalRecomendacaoPlano
        aberto={modalRecomendacaoAberto}
        recomendacao={recomendacao}
        pesoAtual={pesoAtual}
        pesoDesejado={pesoDesejado}
        experiencia={experiencia}
        onFechar={() => setModalRecomendacaoAberto(false)}
        onAplicarPlano={handleEscolherPlano}
      />

      {/* Modal de Customização PRO */}
      <ModalCustomizarPlano
        aberto={modalCustomizarAberto}
        horasCustomJejum={horasCustomJejum}
        onMudarHoras={setHorasCustomJejum}
        onFechar={() => setModalCustomizarAberto(false)}
        onSalvar={handleAplicarCustomizado}
      />
    </div>
  );
};
