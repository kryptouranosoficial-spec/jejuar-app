/**
 * @file OnboardingBasicoObjetivo.tsx
 * @description Primeira tela do onboarding de Informações Básicas do usuário.
 * Pergunta: "Qual é o seu principal objetivo?"
 * Exibe barra de progresso em 20% (Passo 1 de 5) e atualiza diretamente o documento
 * do usuário na coleção "usuarios" do Firestore utilizando o ID salvo na etapa de registro.
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Scale, 
  Flame, 
  Zap, 
  Sprout, 
  SlidersHorizontal, 
  MoreHorizontal, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { salvarInformacaoBasicaFirestore } from '../services/firebase';

interface OpcaoObjetivo {
  id: string;
  titulo: string;
  icone: React.ReactNode;
  corIcone: string;
  corFundoIcone: string;
}

interface OnboardingBasicoObjetivoProps {
  /** ID do usuário salvo no Firestore na etapa de registro */
  usuarioId: string;
  /** Nome do usuário para personalização amigável */
  nomeUsuario?: string;
  /** Callback para avançar ao próximo passo de informações básicas */
  onAvancar: (objetivoSelecionado: string) => void;
  /** Callback para retornar à tela anterior */
  onVoltar: () => void;
}

export const OnboardingBasicoObjetivo: React.FC<OnboardingBasicoObjetivoProps> = ({
  usuarioId,
  nomeUsuario,
  onAvancar,
  onVoltar,
}) => {
  // Lista oficial das 6 opções do design
  const opcoes: OpcaoObjetivo[] = [
    {
      id: 'perder_peso',
      titulo: 'Perder peso',
      icone: <Scale className="w-6 h-6" strokeWidth={2} />,
      corIcone: 'text-[#00C975]',
      corFundoIcone: 'bg-emerald-500/15',
    },
    {
      id: 'melhorar_saude',
      titulo: 'Melhorar a saúde',
      icone: <Flame className="w-6 h-6" strokeWidth={2} />,
      corIcone: 'text-amber-500',
      corFundoIcone: 'bg-orange-50',
    },
    {
      id: 'ganhar_energia',
      titulo: 'Ganhar energia',
      icone: <Zap className="w-6 h-6" strokeWidth={2} />,
      corIcone: 'text-amber-600',
      corFundoIcone: 'bg-amber-50',
    },
    {
      id: 'antienvelhecimento',
      titulo: 'Antienvelhecimento e longevidade',
      icone: <Sprout className="w-6 h-6" strokeWidth={2} />,
      corIcone: 'text-lime-600',
      corFundoIcone: 'bg-lime-50',
    },
    {
      id: 'manter_peso',
      titulo: 'Manter o peso',
      icone: <SlidersHorizontal className="w-6 h-6" strokeWidth={2} />,
      corIcone: 'text-amber-500',
      corFundoIcone: 'bg-amber-50',
    },
    {
      id: 'outros',
      titulo: 'Outros',
      icone: <MoreHorizontal className="w-6 h-6" strokeWidth={2} />,
      corIcone: 'text-slate-400',
      corFundoIcone: 'bg-slate-100',
    },
  ];

  // Opção padrão selecionada: "Perder peso" (conforme design original)
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>('perder_peso');
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Disparado ao clicar no botão "Próximo"
  const handleProximo = async () => {
    if (!opcaoSelecionada || salvando) return;

    setSalvando(true);
    setErro(null);

    const opcaoObj = opcoes.find(o => o.id === opcaoSelecionada);
    const tituloObjetivo = opcaoObj ? opcaoObj.titulo : opcaoSelecionada;

    try {
      // Salva no subgrupo 'informacoesBasicas' do documento do usuário
      if (usuarioId) {
        await salvarInformacaoBasicaFirestore(usuarioId, 'objetivoPrincipal', tituloObjetivo);
      }
      onAvancar(tituloObjetivo);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Não conseguimos salvar seu objetivo. Verifique sua conexão e tente novamente.';
      setErro(msg);
      setSalvando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F6F9FC] text-[#1E293B] flex flex-col justify-between items-center relative overflow-hidden select-none">
      {/* Container responsivo mobile-first */}
      <main className="w-full max-w-md min-h-screen flex flex-col justify-between relative px-5 pb-6 pt-2 safe-top safe-bottom">
        {/* ==================== Top Header & Barra de Progresso ==================== */}
        <header className="w-full pt-3 pb-3">
          <div className="flex items-center justify-between relative mb-2">
            <button
              type="button"
              onClick={onVoltar}
              disabled={salvando}
              aria-label="Voltar para a etapa anterior"
              className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Título da Seção */}
            <h2 className="text-center font-bold text-base text-[#0B1F3B] tracking-tight">
              Informações Básicas
            </h2>

            <div className="w-10" aria-hidden="true" />
          </div>

          {/* Barra de Progresso (Passo 1 de 5 = ~20%) */}
          <div className="mt-3 px-4 w-full flex justify-center">
            <div 
              className="w-full max-w-xs h-1.5 bg-[#E9EEF5] rounded-full overflow-hidden flex"
              role="progressbar" 
              aria-valuenow={20} 
              aria-valuemin={0} 
              aria-valuemax={100}
            >
              <div 
                className="h-full bg-[#00C975] rounded-full transition-all duration-400 ease-out" 
                style={{ width: '20%' }}
              />
            </div>
          </div>
        </header>

        {/* ==================== Conteúdo Principal: Pergunta & Opções ==================== */}
        <section className="w-full flex-1 flex flex-col items-center">
          {/* Título da Pergunta */}
          <div className="w-full text-center mt-2 mb-6 px-2">
            <h1 className="text-[24px] sm:text-[26px] font-extrabold text-[#0B1F3B] leading-snug tracking-tight">
              Qual é o seu principal objetivo{nomeUsuario ? `, ${nomeUsuario.split(' ')[0]}` : ''}?
            </h1>
          </div>

          {/* Feedback de erro humanizado */}
          {erro && (
            <div className="w-full mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{erro}</p>
            </div>
          )}

          {/* Lista de Opções de Escolha Única */}
          <div className="w-full flex flex-col space-y-3" role="radiogroup" aria-label="Objetivo principal">
            {opcoes.map((opcao) => {
              const selecionada = opcaoSelecionada === opcao.id;

              return (
                <button
                  key={opcao.id}
                  type="button"
                  role="radio"
                  aria-checked={selecionada}
                  onClick={() => setOpcaoSelecionada(opcao.id)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white transition-all active:scale-[0.99] focus:outline-none min-h-[64px] text-left cursor-pointer ${
                    selecionada
                      ? 'border-2 border-[#00C975] shadow-[0_4px_16px_rgba(0,201,117,0.12)]'
                      : 'border border-slate-100 shadow-[0_2px_10px_rgba(11,31,59,0.04)] hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    {/* Badge do Ícone com cor semântica */}
                    <div className={`w-11 h-11 rounded-xl ${opcao.corFundoIcone} flex items-center justify-center shrink-0 ${opcao.corIcone}`}>
                      {opcao.icone}
                    </div>

                    {/* Rótulo da Opção */}
                    <span className={`text-[16px] sm:text-[17px] tracking-tight ${
                      selecionada ? 'font-bold text-[#0B1F3B]' : 'font-semibold text-[#1E293B]'
                    }`}>
                      {opcao.titulo}
                    </span>
                  </div>

                  {/* Indicador de Seleção Circular com Checkmark */}
                  {selecionada ? (
                    <div className="w-6 h-6 rounded-full bg-[#00C975] flex items-center justify-center text-white shrink-0 animate-scaleIn shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-200 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ==================== Ação Inferior: Botão Próximo ==================== */}
        <footer className="w-full mt-6 pt-2 pb-2 flex flex-col items-center">
          <button
            type="button"
            onClick={handleProximo}
            disabled={salvando}
            className={`w-full py-4 rounded-full bg-[#00C975] text-white text-[17px] sm:text-[18px] font-bold shadow-[0_8px_20px_rgba(0,201,117,0.32)] hover:bg-[#00B568] active:scale-[0.98] transition-all flex items-center justify-center tracking-wide min-h-[56px] ${
              salvando ? 'opacity-80 cursor-wait' : 'cursor-pointer'
            }`}
          >
            {salvando ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando objetivo...</span>
              </div>
            ) : (
              <span>Próximo</span>
            )}
          </button>

          {/* Indicador de Barra de Navegação Móvel */}
          <div className="w-full flex justify-center items-center pt-5 pb-1 opacity-25">
            <div className="w-32 h-1 bg-[#0B1F3B] rounded-full" />
          </div>
        </footer>
      </main>
    </div>
  );
};
