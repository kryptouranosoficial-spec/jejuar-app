/**
 * @file ConfiguracoesPesoScreen.tsx
 * @description Tela cheia de Configurações de Peso do aplicativo Jejuar.
 * Permite configurar ativação do lembrete diário de peso, horário com visual drum picker,
 * frequência de dias da semana e seleção de som/tom de notificação.
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { UsuarioEmCadastro } from '../types';
import { 
  salvarConfiguracoesLembretePesoFirestore, 
  buscarConfiguracoesLembretePesoFirestore,
  type ConfiguracoesLembretePeso 
} from '../services/firebase';
import { agendarNotificacoesPeso } from '../services/localNotificationService';
import { ModalDefinirHoraLembrete } from './configuracoes/ModalDefinirHoraLembrete';
import { ModalEscolherDiasLembrete, DIAS_DA_SEMANA } from './configuracoes/ModalEscolherDiasLembrete';
import { ModalEscolherSomLembrete } from './configuracoes/ModalEscolherSomLembrete';

interface ConfiguracoesPesoScreenProps {
  usuario?: UsuarioEmCadastro;
  onVoltar: () => void;
}

export const ConfiguracoesPesoScreen: React.FC<ConfiguracoesPesoScreenProps> = ({
  usuario,
  onVoltar,
}) => {
  // Estados principais das configurações
  const [lembreteAtivo, setLembreteAtivo] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_lembrete_peso_ativo');
      if (salvo !== null) return salvo === 'true';
    }
    return true;
  });

  const [horaLembrete, setHoraLembrete] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_lembrete_peso_hora');
      if (salvo) return salvo;
    }
    return '08:00';
  });

  const [diasLembrete, setDiasLembrete] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_lembrete_peso_dias');
      if (salvo) {
        try {
          return JSON.parse(salvo);
        } catch {}
      }
    }
    return DIAS_DA_SEMANA;
  });

  const [somLembrete, setSomLembrete] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('jejuar_lembrete_peso_som');
      if (salvo) return salvo;
    }
    return 'Padrão';
  });

  // Estados dos Modais
  const [modalHoraAberta, setModalHoraAberta] = useState<boolean>(false);
  const [modalDiasAberta, setModalDiasAberta] = useState<boolean>(false);
  const [modalSomAberta, setModalSomAberta] = useState<boolean>(false);

  // Carrega configurações persistidas do Firestore ao abrir
  useEffect(() => {
    if (usuario?.id) {
      buscarConfiguracoesLembretePesoFirestore(usuario.id)
        .then((dados) => {
          if (dados) {
            setLembreteAtivo(dados.ativo);
            if (dados.hora) setHoraLembrete(dados.hora);
            if (dados.dias && dados.dias.length > 0) setDiasLembrete(dados.dias);
            if (dados.som) setSomLembrete(dados.som);

            agendarNotificacoesPeso({
              ativo: dados.ativo,
              hora: dados.hora || '08:00',
              dias: dados.dias && dados.dias.length > 0 ? dados.dias : DIAS_DA_SEMANA,
            }).catch(() => {});
          }
        })
        .catch((err) => {
          console.warn("Aviso ao buscar configurações de peso do Firestore:", err);
        });
    }
  }, [usuario?.id]);

  // Função centralizada para salvar qualquer alteração
  const persistirConfiguracoes = (atualizacao: Partial<ConfiguracoesLembretePeso>) => {
    const novoAtivo = atualizacao.ativo !== undefined ? atualizacao.ativo : lembreteAtivo;
    const novaHora = atualizacao.hora || horaLembrete;
    const novosDias = atualizacao.dias || diasLembrete;
    const novoSom = atualizacao.som || somLembrete;

    // Atualiza estados locais
    if (atualizacao.ativo !== undefined) setLembreteAtivo(novoAtivo);
    if (atualizacao.hora) setHoraLembrete(novaHora);
    if (atualizacao.dias) setDiasLembrete(novosDias);
    if (atualizacao.som) setSomLembrete(novoSom);

    // Salva em localStorage e limpa trava de disparo caso horário/dia mude
    try {
      localStorage.setItem('jejuar_lembrete_peso_ativo', String(novoAtivo));
      localStorage.setItem('jejuar_lembrete_peso_hora', novaHora);
      localStorage.setItem('jejuar_lembrete_peso_dias', JSON.stringify(novosDias));
      localStorage.setItem('jejuar_lembrete_peso_som', novoSom);
      if (atualizacao.hora || atualizacao.dias || atualizacao.ativo) {
        const hojeStr = new Date().toISOString().slice(0, 10);
        localStorage.removeItem(`jejuar_alerta_peso_emitido_${hojeStr}`);
      }
    } catch {}

    // Agenda alarmes nativos no Android/iOS via Capacitor
    agendarNotificacoesPeso({
      ativo: novoAtivo,
      hora: novaHora,
      dias: novosDias,
    }).catch(() => {});

    // Salva no Firestore
    if (usuario?.id) {
      salvarConfiguracoesLembretePesoFirestore(usuario.id, {
        ativo: novoAtivo,
        hora: novaHora,
        dias: novosDias,
        som: novoSom,
      }).catch((err) => {
        console.warn("Erro ao salvar configurações de peso no Firestore:", err);
      });
    }
  };

  // Formata o texto descritivo dos dias selecionados
  const formatarDiasDescricao = (): string => {
    if (diasLembrete.length === 7) return 'Todos os dias';
    if (diasLembrete.length === 5 && !diasLembrete.includes('Domingo') && !diasLembrete.includes('Sábado')) {
      return 'Segunda a Sexta';
    }
    if (diasLembrete.length === 2 && diasLembrete.includes('Domingo') && diasLembrete.includes('Sábado')) {
      return 'Fins de semana';
    }
    return diasLembrete.map((d) => d.slice(0, 3)).join(', ');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#F5F9FC] flex flex-col justify-start items-center overflow-y-auto animate-in slide-in-from-right duration-300 select-none"
      data-purpose="configuracoes-peso-fullscreen-page"
    >
      <div className="w-full max-w-[430px] min-h-screen flex flex-col bg-[#F5F9FC] relative pb-10">
        
        {/* Cabeçalho Superior */}
        <header className="sticky top-0 z-40 bg-[#F5F9FC]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
          <button
            type="button"
            onClick={onVoltar}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#092244] hover:bg-slate-200/60 active:scale-90 transition-all cursor-pointer"
            aria-label="Voltar para dados corporais"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.3]" />
          </button>

          <h2 className="text-[18px] font-extrabold text-[#092244] tracking-tight">
            Configurações de Peso
          </h2>

          <div className="w-10" />
        </header>

        {/* Conteúdo Principal */}
        <main className="px-4 pt-4 space-y-4">
          
          {/* Card Único Agrupado de Configurações */}
          <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 divide-y divide-slate-100">
            
            {/* Linha 1: Switch de Ativação do Lembrete */}
            <div className="flex items-center justify-between py-3.5 first:pt-0">
              <span className="text-[15px] font-extrabold text-[#092244]">
                Lembrete de registro de peso
              </span>

              {/* Switch Toggle Customizado em Verde */}
              <button
                type="button"
                role="switch"
                aria-checked={lembreteAtivo}
                onClick={() => persistirConfiguracoes({ ativo: !lembreteAtivo })}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  lembreteAtivo ? 'bg-[#00C975]' : 'bg-slate-200'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    lembreteAtivo ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Linha 2: Hora do Lembrete */}
            <div 
              onClick={() => lembreteAtivo && setModalHoraAberta(true)}
              className={`flex items-center justify-between py-4 transition-all ${
                lembreteAtivo 
                  ? 'cursor-pointer hover:opacity-80 active:scale-[0.99]' 
                  : 'opacity-40 pointer-events-none'
              }`}
            >
              <span className="text-[15px] font-bold text-[#092244]">
                Hora do lembrete
              </span>

              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[14px] font-semibold text-slate-400">
                  {horaLembrete}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>

            {/* Linha 3: Dia do Lembrete */}
            <div 
              onClick={() => lembreteAtivo && setModalDiasAberta(true)}
              className={`flex items-center justify-between py-4 transition-all ${
                lembreteAtivo 
                  ? 'cursor-pointer hover:opacity-80 active:scale-[0.99]' 
                  : 'opacity-40 pointer-events-none'
              }`}
            >
              <span className="text-[15px] font-bold text-[#092244]">
                Dia do lembrete
              </span>

              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[14px] font-semibold text-slate-400">
                  {formatarDiasDescricao()}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>

            {/* Linha 4: Som do Lembrete */}
            <div 
              onClick={() => lembreteAtivo && setModalSomAberta(true)}
              className={`flex items-center justify-between py-4 last:pb-0 transition-all ${
                lembreteAtivo 
                  ? 'cursor-pointer hover:opacity-80 active:scale-[0.99]' 
                  : 'opacity-40 pointer-events-none'
              }`}
            >
              <span className="text-[15px] font-bold text-[#092244]">
                Som do lembrete
              </span>

              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[14px] font-semibold text-slate-400">
                  {somLembrete}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </section>
        </main>

        {/* Modal 1: Definir Hora */}
        <ModalDefinirHoraLembrete
          aberto={modalHoraAberta}
          horaAtual={horaLembrete}
          onSalvar={(novaHora) => persistirConfiguracoes({ hora: novaHora })}
          onFechar={() => setModalHoraAberta(false)}
        />

        {/* Modal 2: Escolher Dias */}
        <ModalEscolherDiasLembrete
          aberto={modalDiasAberta}
          diasSelecionados={diasLembrete}
          onSalvar={(novosDias) => persistirConfiguracoes({ dias: novosDias })}
          onFechar={() => setModalDiasAberta(false)}
        />

        {/* Modal 3: Escolher Som */}
        <ModalEscolherSomLembrete
          aberto={modalSomAberta}
          somAtual={somLembrete}
          onSalvar={(novoSom) => persistirConfiguracoes({ som: novoSom })}
          onFechar={() => setModalSomAberta(false)}
        />
      </div>
    </div>
  );
};
