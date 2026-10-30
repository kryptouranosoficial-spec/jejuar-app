/**
 * @file EditProfileSection.tsx
 * @description Subtela de edição completa dos dados cadastrais do Perfil (EditProfileSection).
 * Atende com precisão cirúrgica ao Padrão Universal de Tela de Perfil:
 * - Nome Completo (obrigatório com *)
 * - CPF/CNPJ com máscara reativa dinâmica (11 ou 14 dígitos) em fonte mono
 * - Data de Nascimento DD/MM/AAAA (limitado a 8 dígitos)
 * - Telefone/WhatsApp com máscara (99) 99999-9999
 * - E-mail com layout @ visível e desabilitado com indicador explícito "Somente leitura"
 * - Renda em Real Brasileiro (R$ 0.000,00) progressiva com cálculo de centavos ao digitar
 * - Botão fixo no rodapé (Safe Area) com 3 estados: Normal -> Salvando com spinner -> Sucesso esmeralda
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Loader2, 
  Lock, 
  AlertCircle, 
  Calendar, 
  Phone, 
  CreditCard, 
  DollarSign, 
  User, 
  Mail,
  Sparkles
} from 'lucide-react';
import { 
  mascararCpfCnpj, 
  mascararTelefone, 
  mascararDataNascimento, 
  processarDigitacaoMoedaReal, 
  formatarCentavosEmReal 
} from '../../utils/perfilUtils';
import type { DadosPerfilUsuario } from '../../types';

interface EditProfileSectionProps {
  perfilAtual: DadosPerfilUsuario;
  onSalvar: (dadosAtualizados: Partial<DadosPerfilUsuario>) => Promise<void>;
  onVoltar: () => void;
}

export const EditProfileSection: React.FC<EditProfileSectionProps> = ({
  perfilAtual,
  onSalvar,
  onVoltar,
}) => {
  // Estados dos campos do formulário
  const [nome, setNome] = useState(perfilAtual.nome || '');
  const [cpfCnpj, setCpfCnpj] = useState(mascararCpfCnpj(perfilAtual.cpfCnpj || ''));
  const [telefone, setTelefone] = useState(mascararTelefone(perfilAtual.telefone || ''));
  const [dataNascimento, setDataNascimento] = useState(mascararDataNascimento(perfilAtual.dataNascimento || ''));
  const [rendaCentavos, setRendaCentavos] = useState<number>(perfilAtual.rendaMensalCentavos || 0);
  const [rendaTextoFormatada, setRendaTextoFormatada] = useState<string>(
    formatarCentavosEmReal(perfilAtual.rendaMensalCentavos || 0)
  );

  // Estados do botão de submissão (Normal -> Salvando -> Sucesso)
  const [estadoBotao, setEstadoBotao] = useState<'normal' | 'salvando' | 'sucesso'>('normal');
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Manipulador reativo de CPF/CNPJ
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = mascararCpfCnpj(e.target.value);
    setCpfCnpj(formatado);
  };

  // Manipulador reativo de Telefone
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = mascararTelefone(e.target.value);
    setTelefone(formatado);
  };

  // Manipulador reativo de Data de Nascimento
  const handleDataNascimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = mascararDataNascimento(e.target.value);
    setDataNascimento(formatado);
  };

  // Manipulador de digitação progressiva de moeda em Real Brasileiro
  const handleRendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { centavos, formatado } = processarDigitacaoMoedaReal(e.target.value);
    setRendaCentavos(centavos);
    setRendaTextoFormatada(formatado);
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    // Validação de nome obrigatório
    if (!nome.trim()) {
      setMensagemErro('Por favor, informe seu nome completo.');
      return;
    }

    try {
      setEstadoBotao('salvando');

      await onSalvar({
        nome: nome.trim(),
        cpfCnpj: cpfCnpj.trim(),
        telefone: telefone.trim(),
        dataNascimento: dataNascimento.trim(),
        rendaMensalCentavos: rendaCentavos,
      });

      // Transição para estado de sucesso
      setEstadoBotao('sucesso');

      // Retorna automaticamente à visão geral após 1 segundo
      setTimeout(() => {
        onVoltar();
      }, 1100);
    } catch (err: any) {
      setEstadoBotao('normal');
      setMensagemErro(err.message || 'Não conseguimos salvar suas alterações. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F9FC] flex flex-col relative select-none">
      {/* Barra Superior / Header de Navegação */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar para a visão geral do perfil"
          className="min-h-[44px] min-w-[44px] -ml-2 rounded-2xl flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-100/80 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-base font-extrabold text-[#0B2246] tracking-tight">
          Editar Perfil
        </h1>

        <div className="w-9" />
      </header>

      {/* Formulário com rolagem */}
      <form 
        onSubmit={handleSubmit}
        className="flex-1 w-full px-4 pt-4 pb-32 space-y-4 max-w-[430px] mx-auto"
      >
        {/* Banner de Feedback de Erro */}
        {mensagemErro && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{mensagemErro}</span>
          </div>
        )}

        {/* Grupo 1: Identificação Básica */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Dados Pessoais
          </span>

          {/* Nome Completo (Obrigatório *) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B2246] flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Nome Completo <span className="text-rose-500 font-extrabold">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Clara Silva"
              className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm font-semibold text-[#0B2246] outline-hidden transition-all bg-slate-50/50"
            />
          </div>

          {/* CPF ou CNPJ com Máscara Reativa e Fonte Mono */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B2246] flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              CPF ou CNPJ
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cpfCnpj}
              onChange={handleCpfCnpjChange}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm font-mono font-semibold text-[#0B2246] outline-hidden transition-all bg-slate-50/50"
            />
          </div>

          {/* Data de Nascimento (DD/MM/AAAA) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B2246] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Data de Nascimento
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dataNascimento}
              onChange={handleDataNascimentoChange}
              placeholder="DD/MM/AAAA"
              className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm font-mono font-semibold text-[#0B2246] outline-hidden transition-all bg-slate-50/50"
            />
          </div>
        </div>

        {/* Grupo 2: Contato & Informações Financeiras */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Contato & Financeiro
          </span>

          {/* Telefone / WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B2246] flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={telefone}
              onChange={handleTelefoneChange}
              placeholder="(00) 00000-0000"
              className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm font-semibold text-[#0B2246] outline-hidden transition-all bg-slate-50/50"
            />
          </div>

          {/* E-mail (Desabilitado com indicador Somente Leitura) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0B2246] flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail Cadastrado
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Somente leitura
              </span>
            </div>
            <input
              type="email"
              disabled
              inputMode="email"
              value={perfilAtual.email || ''}
              className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 text-sm font-medium text-slate-400 bg-slate-100 cursor-not-allowed select-all"
            />
          </div>

          {/* Renda / Valor Monetário em Real Brasileiro (R$ 0.000,00) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B2246] flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              Renda Mensal Estimada
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={rendaTextoFormatada}
                onChange={handleRendaChange}
                placeholder="R$ 0,00"
                className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm font-bold text-[#0B2246] outline-hidden transition-all bg-slate-50/50"
              />
            </div>
            <span className="text-[11px] text-slate-400 block px-1">
              Usado exclusivamente para calibrar recomendações de rotina de acordo com seu estilo de vida.
            </span>
          </div>
        </div>

        {/* Botão Fixo no Rodapé (Safe Area) com os 3 Estados: Normal -> Salvando -> Sucesso */}
        <div 
          className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-30"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          <button
            type="submit"
            disabled={estadoBotao === 'salvando' || estadoBotao === 'sucesso'}
            className={`w-full min-h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 cursor-pointer ${
              estadoBotao === 'salvando'
                ? 'bg-[#00C975] text-white opacity-90 cursor-wait'
                : estadoBotao === 'sucesso'
                ? 'bg-emerald-600 text-white scale-[1.01]'
                : 'bg-[#00C975] hover:bg-[#00B067] text-white active:scale-[0.98]'
            }`}
          >
            {estadoBotao === 'salvando' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando alterações...</span>
              </>
            )}

            {estadoBotao === 'sucesso' && (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Salvo com sucesso!</span>
              </>
            )}

            {estadoBotao === 'normal' && (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
