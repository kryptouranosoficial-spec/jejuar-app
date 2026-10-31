/**
 * @file EditProfileSection.tsx
 * @description Tela cheia de Edição de Perfil e Dados do Onboarding (EditProfileSection) do aplicativo Jejuar.
 * Projetada com UX/UI mobile de alto nível:
 * - Assume 100% da tela (fixed inset-0 z-[60]), encobrindo o cabeçalho global e o menu inferior do app.
 * - Cabeçalho superior fixo e rodapé fixo na zona do polegar (Safe Area) com o botão Salvar Alterações.
 * - Bloco 1 (Dados Pessoais): Nome Completo (obrigatório), CPF (opcional com validação real) e Data de Nascimento (opcional com cálculo de idade).
 * - Bloco 2 (Canais de Contato): Telefone/WhatsApp (opcional) e E-mail (bloqueado como somente leitura).
 * - Bloco 3 (Biometria & Metas do Onboarding): Sexo Biológico (Feminino / Masculino), Altura (cm), Peso Inicial (kg), Peso Atual (kg), Meta de Peso Desejado (kg) e cálculo de IMC ao vivo.
 * - Bloco 4 (Perfil Metabólico & Objetivos do Onboarding): Objetivo Principal e Nível de Experiência com Jejum Intermitente.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  AlertCircle,
  Calendar,
  Phone,
  CreditCard,
  User,
  Mail,
  X,
  CheckCircle2,
  ShieldCheck,
  Ruler,
  Scale,
  Target,
  Flame,
  Zap,
  Sprout,
  SlidersHorizontal,
  MoreHorizontal,
  Activity,
} from 'lucide-react';
import {
  mascararCpf,
  mascararTelefone,
  mascararDataNascimento,
  validarCpf,
  validarDataNascimento,
  validarTelefone,
} from '../../utils/perfilUtils';
import type { DadosPerfilUsuario } from '../../types';

interface EditProfileSectionProps {
  /** Dados atuais carregados do perfil e onboarding do usuário */
  perfilAtual: DadosPerfilUsuario;
  /** Função assíncrona para persistir as alterações no Firestore e cache local */
  onSalvar: (dadosAtualizados: Partial<DadosPerfilUsuario>) => Promise<void>;
  /** Função para fechar a tela cheia de edição e retornar à visão geral do perfil */
  onVoltar: () => void;
}

/** Opções oficiais do Objetivo Principal definidas no Onboarding */
const OPCOES_OBJETIVO = [
  {
    id: 'perder_peso',
    titulo: 'Perder peso',
    icone: Scale,
    corIcone: 'text-emerald-600 dark:text-emerald-400',
    corFundo: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  {
    id: 'melhorar_saude',
    titulo: 'Melhorar a saúde',
    icone: Flame,
    corIcone: 'text-amber-500',
    corFundo: 'bg-amber-50 dark:bg-amber-950/60',
  },
  {
    id: 'ganhar_energia',
    titulo: 'Ganhar energia',
    icone: Zap,
    corIcone: 'text-yellow-600 dark:text-yellow-400',
    corFundo: 'bg-yellow-50 dark:bg-yellow-950/60',
  },
  {
    id: 'antienvelhecimento',
    titulo: 'Antienvelhecimento e longevidade',
    icone: Sprout,
    corIcone: 'text-lime-600 dark:text-lime-400',
    corFundo: 'bg-lime-50 dark:bg-lime-950/60',
  },
  {
    id: 'manter_peso',
    titulo: 'Manter o peso',
    icone: SlidersHorizontal,
    corIcone: 'text-sky-600 dark:text-sky-400',
    corFundo: 'bg-sky-50 dark:bg-sky-950/60',
  },
  {
    id: 'outros',
    titulo: 'Outros',
    icone: MoreHorizontal,
    corIcone: 'text-slate-500 dark:text-slate-400',
    corFundo: 'bg-slate-100 dark:bg-slate-800',
  },
] as const;

/** Opções oficiais de Experiência com Jejum definidas no Onboarding */
const OPCOES_EXPERIENCIA = [
  {
    id: 'primeira_vez',
    titulo: 'É a minha primeira vez',
    subtitulo: 'Iniciando no jejum intermitente com segurança',
  },
  {
    id: 'algumas_vezes',
    titulo: 'Já tentei algumas vezes',
    subtitulo: 'Buscando retomar o ritmo e criar consistência',
  },
  {
    id: 'estilo_vida',
    titulo: 'O jejum se tornou meu estilo de vida',
    subtitulo: 'Praticante habituado às janelas metabólicas',
  },
] as const;

/**
 * Normaliza entradas decimais de peso digitadas pelo usuário (aceita vírgula ou ponto).
 */
function limparEntradaPesoDecimal(valor: string): string {
  const trocado = valor.replace(',', '.').replace(/[^0-9.]/g, '');
  const partes = trocado.split('.');
  if (partes.length <= 1) return partes[0].slice(0, 3);
  return `${partes[0].slice(0, 3)}.${partes[1].slice(0, 1)}`;
}

export const EditProfileSection: React.FC<EditProfileSectionProps> = ({
  perfilAtual,
  onSalvar,
  onVoltar,
}) => {
  // ==================== ESTADOS: DADOS PESSOAIS & CONTATO ====================
  const [nome, setNome] = useState<string>(perfilAtual.nome || '');
  const [cpf, setCpf] = useState<string>(() => mascararCpf(perfilAtual.cpfCnpj || ''));
  const [dataNascimento, setDataNascimento] = useState<string>(() =>
    mascararDataNascimento(perfilAtual.dataNascimento || '')
  );
  const [telefone, setTelefone] = useState<string>(() =>
    mascararTelefone(perfilAtual.telefone || '')
  );

  // ==================== ESTADOS: DADOS DO ONBOARDING INICIAL ====================
  const [genero, setGenero] = useState<'feminino' | 'masculino'>(() =>
    String(perfilAtual.genero || 'feminino').toLowerCase() === 'masculino'
      ? 'masculino'
      : 'feminino'
  );
  const [alturaTexto, setAlturaTexto] = useState<string>(() =>
    String(perfilAtual.altura || 165)
  );
  const [pesoInicialTexto, setPesoInicialTexto] = useState<string>(() =>
    String(perfilAtual.pesoInicial || perfilAtual.peso || 68)
  );
  const [pesoAtualTexto, setPesoAtualTexto] = useState<string>(() =>
    String(perfilAtual.peso || 68)
  );
  const [pesoDesejadoTexto, setPesoDesejadoTexto] = useState<string>(() =>
    String(
      perfilAtual.pesoDesejado ||
        Math.max(45, Math.round(((perfilAtual.peso || 68) - 5) * 10) / 10)
    )
  );
  const [objetivoPrincipal, setObjetivoPrincipal] = useState<string>(
    perfilAtual.objetivoPrincipal || 'perder_peso'
  );
  const [experienciaJejum, setExperienciaJejum] = useState<string>(
    perfilAtual.experienciaJejum || 'primeira_vez'
  );

  // ==================== ESTADOS DE SUBMISSÃO ====================
  const [estadoBotao, setEstadoBotao] = useState<'normal' | 'salvando' | 'sucesso'>('normal');
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Validações em tempo real dos campos opcionais
  const statusCpf = useMemo(() => validarCpf(cpf), [cpf]);
  const statusNascimento = useMemo(() => validarDataNascimento(dataNascimento), [dataNascimento]);
  const statusTelefone = useMemo(() => validarTelefone(telefone), [telefone]);

  const cpfDigitosCount = cpf.replace(/\D/g, '').length;
  const nascimentoDigitosCount = dataNascimento.replace(/\D/g, '').length;
  const telefoneDigitosCount = telefone.replace(/\D/g, '').length;

  // Cálculo dinâmico do IMC em tempo real conforme Altura e Peso Atual digitados
  const dadosImcAoVivo = useMemo(() => {
    const alt = parseFloat(alturaTexto);
    const pes = parseFloat(pesoAtualTexto);
    if (!alt || alt < 100 || alt > 250 || !pes || pes < 25 || pes > 350) {
      return null;
    }
    const metros = alt / 100;
    const imc = Number((pes / (metros * metros)).toFixed(1));
    let classificacao = 'Peso normal';
    let corClasse = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60';

    if (imc < 18.5) {
      classificacao = 'Abaixo do peso';
      corClasse = 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60';
    } else if (imc >= 25 && imc < 30) {
      classificacao = 'Sobrepeso';
      corClasse = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60';
    } else if (imc >= 30) {
      classificacao = 'Obesidade';
      corClasse = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60';
    }

    return { imc, classificacao, corClasse };
  }, [alturaTexto, pesoAtualTexto]);

  // Manipuladores de campos com máscara
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMensagemErro(null);
    setCpf(mascararCpf(e.target.value));
  };

  const handleDataNascimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMensagemErro(null);
    setDataNascimento(mascararDataNascimento(e.target.value));
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMensagemErro(null);
    setTelefone(mascararTelefone(e.target.value));
  };

  /**
   * Rola suavemente a tela até o campo que precisa de ajuste e aplica foco nele.
   */
  const focarERolarParaCampo = (idCampo: string) => {
    if (typeof document === 'undefined') return;
    const elemento = document.getElementById(idCampo) as HTMLInputElement | null;
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        elemento.focus({ preventScroll: true });
      }, 280);
    }
  };

  /**
   * Submissão unificada do formulário:
   * - Nome Completo é obrigatório.
   * - CPF, Data de Nascimento e Telefone são opcionais, mas validados se preenchidos.
   * - Biometria e metas do Onboarding são validadas dentro de faixas humanas seguras.
   * - Em caso de erro de preenchimento, exibe o aviso ancorado acima do botão Salvar
   *   e rola suavemente até o campo correspondente.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    // 1. Nome Completo (Obrigatório)
    if (!nome.trim() || nome.trim().length < 2) {
      setMensagemErro('Por favor, informe seu nome completo para identificarmos seu perfil.');
      focarERolarParaCampo('input-perfil-nome');
      return;
    }

    // 2. Validação opcional de CPF
    if (!statusCpf.valido && statusCpf.mensagemErro) {
      setMensagemErro(statusCpf.mensagemErro);
      focarERolarParaCampo('input-perfil-cpf');
      return;
    }

    // 3. Validação opcional de Data de Nascimento
    if (!statusNascimento.valido && statusNascimento.mensagemErro) {
      setMensagemErro(statusNascimento.mensagemErro);
      focarERolarParaCampo('input-perfil-nascimento');
      return;
    }

    // 4. Validação opcional de Telefone / WhatsApp
    if (!statusTelefone.valido && statusTelefone.mensagemErro) {
      setMensagemErro(statusTelefone.mensagemErro);
      focarERolarParaCampo('input-perfil-telefone');
      return;
    }

    // 5. Validação humanizada dos dados biométricos do Onboarding
    const alturaNum = Math.round(Number(alturaTexto) || 0);
    if (alturaNum < 100 || alturaNum > 250) {
      setMensagemErro('Informe uma altura válida entre 100 cm e 250 cm.');
      focarERolarParaCampo('input-perfil-altura');
      return;
    }

    const pesoInicialNum = Number(parseFloat(pesoInicialTexto).toFixed(1));
    if (isNaN(pesoInicialNum) || pesoInicialNum < 25 || pesoInicialNum > 350) {
      setMensagemErro('Informe um peso inicial válido entre 25 kg e 350 kg.');
      focarERolarParaCampo('input-perfil-peso-inicial');
      return;
    }

    const pesoAtualNum = Number(parseFloat(pesoAtualTexto).toFixed(1));
    if (isNaN(pesoAtualNum) || pesoAtualNum < 25 || pesoAtualNum > 350) {
      setMensagemErro('Informe um peso atual válido entre 25 kg e 350 kg.');
      focarERolarParaCampo('input-perfil-peso-atual');
      return;
    }

    const pesoDesejadoNum = Number(parseFloat(pesoDesejadoTexto).toFixed(1));
    if (isNaN(pesoDesejadoNum) || pesoDesejadoNum < 25 || pesoDesejadoNum > 350) {
      setMensagemErro('Informe uma meta de peso desejado válida entre 25 kg e 350 kg.');
      focarERolarParaCampo('input-perfil-peso-meta');
      return;
    }

    try {
      setEstadoBotao('salvando');

      await onSalvar({
        nome: nome.trim(),
        cpfCnpj: cpf.trim(),
        dataNascimento: dataNascimento.trim(),
        telefone: telefone.trim(),
        genero,
        altura: alturaNum,
        pesoInicial: pesoInicialNum,
        peso: pesoAtualNum,
        pesoDesejado: pesoDesejadoNum,
        objetivoPrincipal,
        experienciaJejum,
      });

      setEstadoBotao('sucesso');

      setTimeout(() => {
        onVoltar();
      }, 950);
    } catch (err: any) {
      setEstadoBotao('normal');
      const msgBruta = String(err?.message || '');
      const ehErroTecnico =
        /is not defined|undefined|null|firebase|network|fetch|syntax|referenceerror|typeerror/i.test(
          msgBruta
        );
      setMensagemErro(
        !msgBruta || ehErroTecnico
          ? 'Não conseguimos salvar suas alterações no momento. Verifique sua conexão e tente novamente.'
          : msgBruta
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#F1F5F9] dark:bg-slate-950 flex justify-center items-center select-none animate-in fade-in duration-200"
      data-purpose="editar-perfil-fullscreen-overlay"
    >
      {/* Container Mobile de Tela Cheia (Encobre AppHeader no topo e MenuInferior no rodapé) */}
      <div className="w-full max-w-[430px] h-[100dvh] bg-[#F5F9FC] dark:bg-slate-900 flex flex-col justify-between relative shadow-2xl overflow-hidden">
        
        {/* ==================== CABEÇALHO FIXO SUPERIOR ==================== */}
        <header
          className="shrink-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 pb-3 flex items-center justify-between"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
        >
          <button
            type="button"
            onClick={onVoltar}
            disabled={estadoBotao === 'salvando'}
            aria-label="Voltar para a tela de perfil"
            className="min-h-[44px] min-w-[44px] -ml-1.5 rounded-2xl flex items-center justify-center text-[#0B2246] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <h1 className="text-[17px] font-extrabold text-[#0B2246] dark:text-white tracking-tight">
            Editar Perfil
          </h1>

          {/* Espaçador simétrico de 44px para centralização exata */}
          <div className="min-w-[44px] min-h-[44px]" aria-hidden="true" />
        </header>

        {/* ==================== ÁREA CENTRAL ROLÁVEL DO FORMULÁRIO ==================== */}
        <form
          id="form-editar-perfil"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 w-full overflow-y-auto px-4 pt-4 pb-8 space-y-4"
        >

          {/* ==================== BLOCO 1: DADOS PESSOAIS ==================== */}
          <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-700/70 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Dados Pessoais
              </span>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                <strong className="text-rose-500">*</strong> Obrigatório
              </span>
            </div>

            {/* 1. Nome Completo (Obrigatório) */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-perfil-nome"
                className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
              >
                <User className="w-4 h-4 text-[#00C975] stroke-[2]" />
                <span>Nome Completo</span>
                <span className="text-rose-500 font-extrabold" aria-hidden="true">
                  *
                </span>
              </label>

              <div className="relative flex items-center">
                <input
                  id="input-perfil-nome"
                  type="text"
                  inputMode="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  required
                  value={nome}
                  onChange={(e) => {
                    setMensagemErro(null);
                    setNome(e.target.value);
                  }}
                  placeholder="Digite seu nome e sobrenome"
                  className="w-full min-h-[48px] pl-4 pr-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15 text-sm font-semibold text-[#0B2246] dark:text-white placeholder:text-slate-400 outline-hidden transition-all"
                />
                {nome.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNome('')}
                    aria-label="Limpar nome"
                    className="absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. CPF (Pessoa Física - Opcional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-perfil-cpf"
                  className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4 text-slate-400 stroke-[2]" />
                  <span>CPF</span>
                </label>

                {cpfDigitosCount === 0 ? (
                  <span className="text-[11px] font-semibold text-slate-400">
                    Opcional
                  </span>
                ) : cpfDigitosCount === 11 && statusCpf.valido ? (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.2]" />
                    CPF válido
                  </span>
                ) : cpfDigitosCount === 11 && !statusCpf.valido ? (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                    CPF inválido
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    {cpfDigitosCount}/11 dígitos
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  id="input-perfil-cpf"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="off"
                  enterKeyHint="next"
                  maxLength={14}
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className={`w-full min-h-[48px] pl-4 pr-11 rounded-2xl border bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-sm font-mono font-semibold text-[#0B2246] dark:text-white placeholder:text-slate-400 outline-hidden transition-all ${
                    cpfDigitosCount === 11 && !statusCpf.valido
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15'
                  }`}
                />
                {cpf.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCpf('')}
                    aria-label="Limpar CPF"
                    className="absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Data de Nascimento (Opcional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-perfil-nascimento"
                  className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-slate-400 stroke-[2]" />
                  <span>Data de Nascimento</span>
                </label>

                {nascimentoDigitosCount === 0 ? (
                  <span className="text-[11px] font-semibold text-slate-400">
                    {perfilAtual.anoNascimento
                      ? `Ano base: ${perfilAtual.anoNascimento}`
                      : 'Opcional'}
                  </span>
                ) : nascimentoDigitosCount === 8 && statusNascimento.valido && statusNascimento.idade ? (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.2]" />
                    {statusNascimento.idade} anos
                  </span>
                ) : nascimentoDigitosCount === 8 && !statusNascimento.valido ? (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                    Data inválida
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">
                    DD/MM/AAAA
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  id="input-perfil-nascimento"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="bday"
                  enterKeyHint="next"
                  maxLength={10}
                  value={dataNascimento}
                  onChange={handleDataNascimentoChange}
                  placeholder="DD/MM/AAAA"
                  className={`w-full min-h-[48px] pl-4 pr-11 rounded-2xl border bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-sm font-mono font-semibold text-[#0B2246] dark:text-white placeholder:text-slate-400 outline-hidden transition-all ${
                    nascimentoDigitosCount === 8 && !statusNascimento.valido
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15'
                  }`}
                />
                {dataNascimento.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDataNascimento('')}
                    aria-label="Limpar data de nascimento"
                    className="absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ==================== BLOCO 2: CANAIS DE CONTATO ==================== */}
          <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-700/70 shadow-2xs space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
              Canais de Contato
            </span>

            {/* 4. Telefone / WhatsApp (Opcional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-perfil-telefone"
                  className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Phone className="w-4 h-4 text-slate-400 stroke-[2]" />
                  <span>Telefone / WhatsApp</span>
                </label>

                {telefoneDigitosCount === 0 ? (
                  <span className="text-[11px] font-semibold text-slate-400">
                    Opcional
                  </span>
                ) : statusTelefone.valido ? (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.2]" />
                    Formato válido
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    DDD + Número
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  id="input-perfil-telefone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  maxLength={15}
                  value={telefone}
                  onChange={handleTelefoneChange}
                  placeholder="(00) 00000-0000"
                  className="w-full min-h-[48px] pl-4 pr-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15 text-sm font-mono font-semibold text-[#0B2246] dark:text-white placeholder:text-slate-400 outline-hidden transition-all"
                />
                {telefone.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTelefone('')}
                    aria-label="Limpar telefone"
                    className="absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                )}
              </div>
            </div>

            {/* 5. E-mail Cadastrado (Bloqueado / Somente Leitura) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-perfil-email"
                  className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4 text-slate-400 stroke-[2]" />
                  <span>E-mail Cadastrado</span>
                </label>

                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 stroke-[2.2]" />
                  Somente leitura
                </span>
              </div>

              <input
                id="input-perfil-email"
                type="email"
                inputMode="email"
                disabled
                readOnly
                value={perfilAtual.email || ''}
                className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800/80 cursor-not-allowed select-all"
              />

              <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed flex items-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[2]" />
                <span>O e-mail é o identificador único de segurança da sua conta no Jejuar.</span>
              </p>
            </div>
          </section>

          {/* ==================== BLOCO 3: BIOMETRIA & METAS CORPORAIS (ONBOARDING) ==================== */}
          <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-700/70 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                  Biometria & Metas Corporais
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400">
                  Dados iniciais configurados no seu Onboarding
                </span>
              </div>

              {/* Badge de IMC calculado em tempo real */}
              {dadosImcAoVivo && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${dadosImcAoVivo.corClasse}`}
                >
                  <Activity className="w-3 h-3 stroke-[2.2]" />
                  IMC {dadosImcAoVivo.imc}
                </span>
              )}
            </div>

            {/* 6. Sexo Biológico (Exclusivamente Feminino ou Masculino para cálculos biológicos) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B2246] dark:text-slate-200 block">
                Sexo Biológico (Cálculo Metabólico)
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGenero('feminino')}
                  className={`min-h-[48px] px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                    genero === 'feminino'
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-[#00C975] text-[#0B2246] dark:text-white ring-2 ring-[#00C975]/20'
                      : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                  <span>Feminino</span>
                  {genero === 'feminino' && (
                    <Check className="w-4 h-4 text-[#00C975] stroke-[2.5] ml-auto" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setGenero('masculino')}
                  className={`min-h-[48px] px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                    genero === 'masculino'
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-[#00C975] text-[#0B2246] dark:text-white ring-2 ring-[#00C975]/20'
                      : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                  <span>Masculino</span>
                  {genero === 'masculino' && (
                    <Check className="w-4 h-4 text-[#00C975] stroke-[2.5] ml-auto" />
                  )}
                </button>
              </div>
            </div>

            {/* 7. Altura (cm) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-perfil-altura"
                  className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Ruler className="w-4 h-4 text-slate-400 stroke-[2]" />
                  <span>Altura</span>
                </label>
                <span className="text-[11px] font-medium text-slate-400">
                  Em centímetros (cm)
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  id="input-perfil-altura"
                  type="tel"
                  inputMode="numeric"
                  maxLength={3}
                  value={alturaTexto}
                  onChange={(e) => {
                    setMensagemErro(null);
                    setAlturaTexto(e.target.value.replace(/\D/g, '').slice(0, 3));
                  }}
                  placeholder="165"
                  className="w-full min-h-[48px] pl-4 pr-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 focus:border-[#00C975] focus:ring-3 focus:ring-[#00C975]/15 text-sm font-mono font-bold text-[#0B2246] dark:text-white outline-hidden transition-all"
                />
                <span className="absolute right-4 text-xs font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            {/* 8. Pesos (Peso Inicial no Dia 1, Peso Atual e Meta de Peso Desejado) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {/* Peso Inicial */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-perfil-peso-inicial"
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-300 block truncate"
                >
                  Peso Inicial
                </label>
                <div className="relative flex items-center">
                  <input
                    id="input-perfil-peso-inicial"
                    type="text"
                    inputMode="decimal"
                    value={pesoInicialTexto}
                    onChange={(e) => {
                      setMensagemErro(null);
                      setPesoInicialTexto(limparEntradaPesoDecimal(e.target.value));
                    }}
                    placeholder="70.0"
                    className="w-full min-h-[48px] pl-3 pr-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/15 text-sm font-mono font-bold text-[#0B2246] dark:text-white outline-hidden transition-all"
                  />
                  <span className="absolute right-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* Peso Atual */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-perfil-peso-atual"
                  className="text-[11px] font-bold text-[#0B2246] dark:text-white block truncate"
                >
                  Peso Atual
                </label>
                <div className="relative flex items-center">
                  <input
                    id="input-perfil-peso-atual"
                    type="text"
                    inputMode="decimal"
                    value={pesoAtualTexto}
                    onChange={(e) => {
                      setMensagemErro(null);
                      setPesoAtualTexto(limparEntradaPesoDecimal(e.target.value));
                    }}
                    placeholder="68.0"
                    className="w-full min-h-[48px] pl-3 pr-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/15 text-sm font-mono font-bold text-[#0B2246] dark:text-white outline-hidden transition-all"
                  />
                  <span className="absolute right-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* Meta de Peso Desejado */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-perfil-peso-meta"
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block truncate"
                >
                  Meta Peso
                </label>
                <div className="relative flex items-center">
                  <input
                    id="input-perfil-peso-meta"
                    type="text"
                    inputMode="decimal"
                    value={pesoDesejadoTexto}
                    onChange={(e) => {
                      setMensagemErro(null);
                      setPesoDesejadoTexto(limparEntradaPesoDecimal(e.target.value));
                    }}
                    placeholder="63.0"
                    className="w-full min-h-[48px] pl-3 pr-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/40 dark:bg-emerald-950/30 focus:bg-white dark:focus:bg-slate-900 focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300 outline-hidden transition-all"
                  />
                  <span className="absolute right-2.5 text-[11px] font-bold text-emerald-500 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== BLOCO 4: PERFIL METABÓLICO & OBJETIVOS (ONBOARDING) ==================== */}
          <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-700/70 shadow-2xs space-y-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                Objetivos & Experiência no Jejum
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-400">
                Usado para calibrar seu protocolo recomendado
              </span>
            </div>

            {/* 9. Objetivo Principal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#00C975] stroke-[2]" />
                <span>Qual é o seu principal objetivo?</span>
              </label>

              <div className="grid grid-cols-1 gap-2">
                {OPCOES_OBJETIVO.map((item) => {
                  const Icone = item.icone;
                  const ativo = objetivoPrincipal === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setObjetivoPrincipal(item.id)}
                      className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${
                        ativo
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-[#00C975] ring-2 ring-[#00C975]/15'
                          : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/70 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.corFundo} ${item.corIcone}`}
                        >
                          <Icone className="w-4 h-4 stroke-[2]" />
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            ativo
                              ? 'text-[#0B2246] dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.titulo}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                          ativo
                            ? 'bg-[#00C975] text-white'
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {ativo && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 10. Experiência com Jejum Intermitente */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <label className="text-xs font-bold text-[#0B2246] dark:text-slate-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 stroke-[2]" />
                <span>Sua experiência com o jejum intermitente</span>
              </label>

              <div className="grid grid-cols-1 gap-2">
                {OPCOES_EXPERIENCIA.map((exp) => {
                  const ativo = experienciaJejum === exp.id;
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setExperienciaJejum(exp.id)}
                      className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${
                        ativo
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-[#00C975] ring-2 ring-[#00C975]/15'
                          : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/70 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="pr-2">
                        <span
                          className={`text-xs font-bold block ${
                            ativo
                              ? 'text-[#0B2246] dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {exp.titulo}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 block mt-0.5">
                          {exp.subtitulo}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-colors ${
                          ativo
                            ? 'bg-[#00C975] text-white'
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {ativo && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </form>

        {/* ==================== RODAPÉ FIXO NA ZONA DO POLEGAR (SAFE AREA) ==================== */}
        <footer
          className="shrink-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-4 pt-3 space-y-2.5"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        >
          {/* Alerta de Erro Ancorado Logo Acima do Botão Salvar Alterações */}
          {mensagemErro && (
            <div
              role="alert"
              className="pl-3.5 pr-1 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-start gap-2.5 py-0.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400 stroke-[2.2]" />
                <span className="leading-relaxed">{mensagemErro}</span>
              </div>

              <button
                type="button"
                onClick={() => setMensagemErro(null)}
                aria-label="Fechar aviso"
                className="min-w-[44px] min-h-[44px] shrink-0 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          )}

          <button
            type="submit"
            form="form-editar-perfil"
            disabled={estadoBotao === 'salvando' || estadoBotao === 'sucesso'}
            className={`w-full min-h-[52px] rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 cursor-pointer ${
              estadoBotao === 'salvando'
                ? 'bg-[#00C975] text-white opacity-90 cursor-wait'
                : estadoBotao === 'sucesso'
                ? 'bg-emerald-600 text-white scale-[1.01] shadow-emerald-500/25'
                : 'bg-[#00C975] hover:bg-[#00B368] text-white shadow-[#00C975]/25 active:scale-[0.98]'
            }`}
          >
            {estadoBotao === 'salvando' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin stroke-[2.2]" />
                <span>Salvando alterações...</span>
              </>
            )}

            {estadoBotao === 'sucesso' && (
              <>
                <Check className="w-5 h-5 stroke-[2.8]" />
                <span>Salvo com sucesso!</span>
              </>
            )}

            {estadoBotao === 'normal' && (
              <>
                <Check className="w-5 h-5 stroke-[2.4]" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
