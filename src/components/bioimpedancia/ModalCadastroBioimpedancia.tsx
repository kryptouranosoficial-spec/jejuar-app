/**
 * @file bioimpedancia/ModalCadastroBioimpedancia.tsx
 * @description Tela cheia (Fullscreen Page) de cadastro e edição de exames de bioimpedância.
 * Cobre 100% da viewport mobile com Safe Area superior e inferior.
 * Inclui:
 * - Abertura de Modal Seletor de Hora tátil estilo roleta (horas e minutos) ao tocar no horário
 * - Máscara reativa e chips rápidos ("Hoje", "Ontem") para data
 * - Tratamento inteligente de altura (converte automaticamente 163 para 1,63 m e calcula IMC em tempo real)
 * - Teclados numéricos nativos garantidos no celular (inputMode="decimal" e inputMode="numeric")
 * - Ações completas de Salvar, Editar e Excluir com confirmação
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  X, 
  Save, 
  Trash2, 
  Calendar, 
  MapPin, 
  Activity, 
  Flame, 
  Heart, 
  Check, 
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';
import type { RegistroBioimpedancia } from '../../types/bioimpedancia';
import { calcularImc, formatarDataBR } from '../../utils/bioimpedanciaUtils';
import { ModalSelecionarHorario } from './ModalSelecionarHorario';
import { ModalSelecionarData } from './ModalSelecionarData';

interface ModalCadastroBioimpedanciaProps {
  aberto: boolean;
  exameParaEditar?: RegistroBioimpedancia | null;
  alturaPadraoUsuario?: number;
  onSalvar: (dados: Omit<RegistroBioimpedancia, 'id' | 'criadoEm'>) => Promise<void>;
  onExcluir?: (id: string) => void;
  onFechar: () => void;
}

export const ModalCadastroBioimpedancia: React.FC<ModalCadastroBioimpedanciaProps> = ({
  aberto,
  exameParaEditar,
  alturaPadraoUsuario = 1.63,
  onSalvar,
  onExcluir,
  onFechar,
}) => {
  // Estados do formulário
  const [dataExame, setDataExame] = useState<string>('');
  const [horaExame, setHoraExame] = useState<string>('');
  const [local, setLocal] = useState<string>('Drogasil');
  const [pesoKg, setPesoKg] = useState<string>('');
  const [alturaMetros, setAlturaMetros] = useState<string>('');
  const [gorduraCorporal, setGorduraCorporal] = useState<string>('');
  const [musculoEsqueletico, setMusculoEsqueletico] = useState<string>('');
  const [gorduraVisceral, setGorduraVisceral] = useState<string>('');
  const [taxaMetabolica, setTaxaMetabolica] = useState<string>('');
  const [idadeCorporal, setIdadeCorporal] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');

  // Controle dos Modais Seletores de Data e Hora
  const [modalDataAberto, setModalDataAberto] = useState<boolean>(false);
  const [modalHoraAberto, setModalHoraAberto] = useState<boolean>(false);

  // Estados de submissão e feedback humanizado
  const [salvando, setSalvando] = useState<boolean>(false);
  const [sucesso, setSucesso] = useState<boolean>(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // Inicializa ou reseta formulário quando abre ou muda o exame em edição
  useEffect(() => {
    if (!aberto) {
      setErroValidacao(null);
      setSucesso(false);
      setModalHoraAberto(false);
      setModalDataAberto(false);
      return;
    }

    if (exameParaEditar) {
      setDataExame(formatarDataBR(exameParaEditar.dataExame));
      setHoraExame(exameParaEditar.horaExame || '');
      setLocal(exameParaEditar.local || 'Drogasil');
      setPesoKg(String(exameParaEditar.pesoKg).replace('.', ','));
      setAlturaMetros(String(exameParaEditar.alturaMetros).replace('.', ','));
      setGorduraCorporal(String(exameParaEditar.gorduraCorporalPercentual).replace('.', ','));
      setMusculoEsqueletico(String(exameParaEditar.musculoEsqueleticoPercentual).replace('.', ','));
      setGorduraVisceral(String(exameParaEditar.gorduraVisceralNivel));
      setTaxaMetabolica(String(exameParaEditar.taxaMetabolicaBasalKcal));
      setIdadeCorporal(exameParaEditar.idadeCorporalAnos ? String(exameParaEditar.idadeCorporalAnos) : '');
      setObservacoes(exameParaEditar.observacoes || '');
    } else {
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      setDataExame(`${dia}/${mes}/${ano}`);

      const hora = String(hoje.getHours()).padStart(2, '0');
      const min = String(hoje.getMinutes()).padStart(2, '0');
      setHoraExame(`${hora}:${min}`);

      setLocal('Drogasil');
      setPesoKg('');
      setAlturaMetros(String(alturaPadraoUsuario || 1.63).replace('.', ','));
      setGorduraCorporal('');
      setMusculoEsqueletico('');
      setGorduraVisceral('');
      setTaxaMetabolica('');
      setIdadeCorporal('');
      setObservacoes('');
    }
  }, [aberto, exameParaEditar, alturaPadraoUsuario]);

  if (!aberto) return null;

  /**
   * Converte o texto de altura em número decimal em metros.
   * Se o usuário digitar '163' (centímetros), interpreta inteligentemente como 1.63m.
   */
  const obterAlturaEmMetros = (valorStr: string): number => {
    const limpo = valorStr.replace(',', '.').trim();
    const num = Number(limpo);
    if (!num || isNaN(num)) return 0;
    // Se digitou mais de 50 (ex: 163 ou 170 cm), divide por 100
    if (num > 50) {
      return Math.round((num / 100) * 100) / 100;
    }
    return num;
  };

  /**
   * Manipula a digitação de altura com formatação inteligente para o usuário.
   */
  const handleAlterarAltura = (valor: string) => {
    // Remove caracteres inválidos mantendo dígitos e vírgula/ponto
    let limpo = valor.replace(/[^\d.,]/g, '');
    
    // Se o usuário digitou 3 dígitos inteiros seguidos (ex: 163), formata para 1,63
    if (/^\d{3}$/.test(limpo)) {
      limpo = `${limpo[0]},${limpo.slice(1)}`;
    }
    setAlturaMetros(limpo);
    setErroValidacao(null);
  };

  // Cálculo reativo do IMC baseado nos campos preenchidos
  const pesoNum = Number(pesoKg.replace(',', '.'));
  const alturaNum = obterAlturaEmMetros(alturaMetros);
  const imcCalculado = calcularImc(pesoNum, alturaNum);

  /**
   * Aplica máscara de data DD/MM/AAAA enquanto o usuário digita.
   */
  const handleMascaraData = (valor: string) => {
    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 8);
    let formatado = apenasDigitos;
    if (apenasDigitos.length > 2) {
      formatado = `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2)}`;
    }
    if (apenasDigitos.length > 4) {
      formatado = `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2, 4)}/${apenasDigitos.slice(4)}`;
    }
    setDataExame(formatado);
    setErroValidacao(null);
  };

  /**
   * Atalhos de data rápida para Hoje ou Ontem.
   */
  const preencherDataAtalho = (diasAtras: number) => {
    const d = new Date();
    d.setDate(d.getDate() - diasAtras);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    setDataExame(`${dia}/${mes}/${ano}`);
    setErroValidacao(null);
  };

  /**
   * Converte data brasileira DD/MM/AAAA para ISO YYYY-MM-DD.
   */
  const converterParaIso = (dataBr: string): string => {
    const partes = dataBr.split('/');
    if (partes.length === 3 && partes[2].length === 4) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return new Date().toISOString().slice(0, 10);
  };

  /**
   * Valida e submete o formulário com tratamento humanizado de erros.
   */
  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);

    // Validações essenciais
    if (!dataExame || dataExame.length < 10) {
      setErroValidacao('Por favor, informe uma data válida no formato DD/MM/AAAA.');
      return;
    }
    if (!pesoNum || pesoNum <= 20 || pesoNum >= 350) {
      setErroValidacao('Por favor, informe um peso válido entre 20 e 350 kg.');
      return;
    }
    if (!alturaNum || alturaNum < 1.0 || alturaNum > 2.5) {
      setErroValidacao('Por favor, informe uma altura válida entre 1,00m e 2,50m (ex: 1,63).');
      return;
    }

    const gorduraNum = Number(gorduraCorporal.replace(',', '.'));
    if (!gorduraNum || gorduraNum <= 2 || gorduraNum >= 70) {
      setErroValidacao('Por favor, informe o percentual de gordura corporal (ex: 31,7%).');
      return;
    }

    const musculoNum = Number(musculoEsqueletico.replace(',', '.'));
    if (!musculoNum || musculoNum <= 5 || musculoNum >= 70) {
      setErroValidacao('Por favor, informe o percentual de músculo esquelético (ex: 29,9%).');
      return;
    }

    const visceralNum = Number(gorduraVisceral);
    if (!visceralNum || visceralNum < 1 || visceralNum > 35) {
      setErroValidacao('Por favor, informe o nível de gordura visceral (número inteiro de 1 a 30).');
      return;
    }

    const taxaNum = Number(taxaMetabolica);
    if (!taxaNum || taxaNum < 500 || taxaNum > 6000) {
      setErroValidacao('Por favor, informe a taxa metabólica basal em Kcal (ex: 1581).');
      return;
    }

    try {
      setSalvando(true);

      const dadosParaSalvar: Omit<RegistroBioimpedancia, 'id' | 'criadoEm'> = {
        usuarioId: exameParaEditar?.usuarioId || '',
        dataExame: converterParaIso(dataExame),
        horaExame: horaExame || undefined,
        local: local.trim() || 'Drogasil',
        pesoKg: pesoNum,
        alturaMetros: alturaNum,
        imc: imcCalculado,
        gorduraCorporalPercentual: gorduraNum,
        musculoEsqueleticoPercentual: musculoNum,
        gorduraVisceralNivel: visceralNum,
        taxaMetabolicaBasalKcal: taxaNum,
        idadeCorporalAnos: idadeCorporal ? Number(idadeCorporal) : undefined,
        observacoes: observacoes.trim(),
      };

      await onSalvar(dadosParaSalvar);

      setSucesso(true);
      setTimeout(() => {
        onFechar();
      }, 700);
    } catch {
      setErroValidacao('Não foi possível salvar o exame neste instante. Verifique as informações e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F5F9FC] flex flex-col justify-start items-center overflow-y-auto animate-in slide-in-from-bottom duration-300"
      data-purpose="cadastro-bioimpedancia-fullscreen-page"
      role="dialog"
      aria-modal="true"
    >
      {/* Container mobile padrão cobrindo 100% da tela */}
      <div className="w-full max-w-[440px] min-h-screen flex flex-col bg-[#F5F9FC] relative pb-44">
        
        {/* ==================== Cabeçalho Superior Fixo ==================== */}
        <header className="sticky top-0 z-40 bg-[#F5F9FC]/95 backdrop-blur-md px-4 py-3.5 flex items-center justify-between border-b border-slate-100">
          <button
            type="button"
            onClick={onFechar}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#0B1C30] hover:bg-slate-200/60 active:scale-90 transition-all cursor-pointer"
            aria-label="Voltar para a lista de exames"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          <div className="text-center">
            <h2 className="text-base font-extrabold text-[#0B1C30] tracking-tight">
              {exameParaEditar ? 'Editar Bioimpedância' : 'Cadastrar Bioimpedância'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 active:scale-90 transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* ==================== Formulário com Rolagem Completa ==================== */}
        <form onSubmit={handleSubmeter} noValidate className="px-4 py-4 space-y-4 pb-36">
          
          {/* Mensagem de Erro Humanizada */}
          {erroValidacao && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed animate-in fade-in">
              {erroValidacao}
            </div>
          )}

          {/* Seção 1: Dados do Atendimento (Data, Hora e Local) */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00C975]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dados do Atendimento
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Data do Exame (Ao tocar abre o Modal Seletor de Data profissional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap">
                    Data <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Toque p/ ajustar</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalDataAberto(true)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-left flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className="text-sm font-bold tabular-nums text-slate-900">
                    {dataExame || 'Selecionar data'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </div>
                </button>
              </div>

              {/* Horário (Ao tocar abre o Modal Seletor de Hora) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap">
                    Horário
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Toque p/ ajustar</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalHoraAberto(true)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-left flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className={`text-sm font-bold tabular-nums ${horaExame ? 'text-slate-900' : 'text-slate-400'}`}>
                    {horaExame || '07:35'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Clock className="w-4 h-4 stroke-[2.2]" />
                  </div>
                </button>
              </div>
            </div>

            {/* Local / Farmácia */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Local / Farmácia / Clínica *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Drogasil Lauro de Freitas..."
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 pl-9 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all"
                />
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Sugestões Rápidas de Local */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {['Drogasil', 'Pague Menos', 'Academia', 'Nutricionista'].map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => setLocal(sugestao)}
                    className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seção 2: Peso, Altura e IMC */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00C975]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Antropometria Básica
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Peso (kg) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                  Peso (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    placeholder="Ex: 72,40"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value.replace(/[^\d.,]/g, ''))}
                    className="w-full min-h-[48px] px-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all tabular-nums"
                  />
                  <span className="text-xs font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* Altura (m) com tratamento inteligente (163 -> 1,63) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                  Altura (m) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    placeholder="Ex: 1,63"
                    value={alturaMetros}
                    onChange={(e) => handleAlterarAltura(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all tabular-nums"
                  />
                  <span className="text-xs font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    m
                  </span>
                </div>
              </div>
            </div>

            {/* Card com cálculo em tempo real de IMC */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-900 block">
                  IMC Calculado em Tempo Real
                </span>
                <span className="text-[11px] text-emerald-700">
                  {alturaNum > 0 ? `Com base em ${pesoNum || 0}kg e ${alturaNum.toFixed(2)}m` : 'Informe peso e altura'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-900 tabular-nums">
                  {imcCalculado > 0 ? imcCalculado.toFixed(2) : '--'}
                </span>
                {imcCalculado > 0 && (
                  <span className="block text-[10px] font-bold text-emerald-700">
                    {imcCalculado < 18.5 ? 'Abaixo' : imcCalculado <= 24.9 ? 'Normal' : imcCalculado <= 29.9 ? 'Sobrepeso' : 'Obesidade'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seção 3: Composição Corporal Laboratorial (Bioimpedância) */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#00C975]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Composição Corporal da Bioimpedância
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Gordura Corporal (%) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate" title="Gordura Corporal (%)">
                  Gordura Corporal (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    placeholder="Ex: 31,7"
                    value={gorduraCorporal}
                    onChange={(e) => setGorduraCorporal(e.target.value.replace(/[^\d.,]/g, ''))}
                    className="w-full min-h-[48px] px-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all tabular-nums"
                  />
                  <span className="text-xs font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Músculo Esquelético (%) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate" title="Músculo Esquelético (%)">
                  Músculo Esquelético (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    placeholder="Ex: 29,9"
                    value={musculoEsqueletico}
                    onChange={(e) => setMusculoEsqueletico(e.target.value.replace(/[^\d.,]/g, ''))}
                    className="w-full min-h-[48px] px-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all tabular-nums"
                  />
                  <span className="text-xs font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Gordura Visceral (Nível) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate" title="Gordura Visceral (Nível)">
                  Gordura Visceral <span className="text-slate-400 font-normal">(Nív)</span> <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ex: 13"
                    value={gorduraVisceral}
                    onChange={(e) => setGorduraVisceral(e.target.value.replace(/\D/g, ''))}
                    className="w-full min-h-[48px] px-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all tabular-nums"
                  />
                  <span className="text-[11px] font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    nív
                  </span>
                </div>
              </div>

              {/* Taxa Metabólica Basal (Kcal) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate" title="Taxa Metabólica Basal (Kcal)">
                  Taxa Basal <span className="text-slate-400 font-normal">(Kcal)</span> <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ex: 1581"
                    value={taxaMetabolica}
                    onChange={(e) => setTaxaMetabolica(e.target.value.replace(/\D/g, ''))}
                    className="w-full min-h-[48px] px-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all tabular-nums"
                  />
                  <span className="text-[11px] font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    Kcal
                  </span>
                </div>
              </div>
            </div>

            {/* Idade Corporal (opcional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                Idade Corporal Estimada <span className="text-slate-400 font-normal">(anos, opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ex: 52"
                  value={idadeCorporal}
                  onChange={(e) => setIdadeCorporal(e.target.value.replace(/\D/g, ''))}
                  className="w-full min-h-[48px] px-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all tabular-nums"
                />
                <span className="text-xs font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  anos
                </span>
              </div>
            </div>

            {/* Observações Clínicas */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                Observações Clínicas <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Anotações do farmacêutico, nutricionista ou orientações médicas..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#00C975] focus:ring-2 focus:ring-[#00C975]/20 outline-hidden transition-all resize-none"
              />
            </div>
          </div>

          {/* ==================== Rodapé Fixo Seguro (Floating Bottom Bar) ==================== */}
          <div 
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 max-w-[440px] mx-auto space-y-2"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 12px)' }}
          >
            <button
              type="submit"
              disabled={salvando || sucesso}
              className={`w-full min-h-[50px] rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
                sucesso
                  ? 'bg-emerald-600'
                  : 'bg-[#00C975] hover:bg-[#00B066] active:bg-[#009B58] shadow-[#00C975]/25'
              }`}
            >
              {salvando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando Exame...</span>
                </>
              ) : sucesso ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Exame Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 stroke-[2]" />
                  <span>{exameParaEditar ? 'Atualizar Alterações' : 'Salvar Exame de Bioimpedância'}</span>
                </>
              )}
            </button>

            {/* Botão de Excluir (Disponível apenas no modo de edição) */}
            {exameParaEditar && onExcluir && (
              <button
                type="button"
                onClick={() => onExcluir(exameParaEditar.id)}
                className="w-full min-h-[44px] rounded-2xl font-semibold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir este Registro de Exame</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modal Bottom Sheet Seletor de Horário */}
      <ModalSelecionarHorario
        aberto={modalHoraAberto}
        horarioAtual={horaExame}
        onSalvar={(novo) => {
          setHoraExame(novo);
          setModalHoraAberto(false);
        }}
        onLimpar={() => {
          setHoraExame('');
          setModalHoraAberto(false);
        }}
        onFechar={() => setModalHoraAberto(false)}
      />

      {/* Modal Bottom Sheet Seletor de Data Profissional */}
      <ModalSelecionarData
        aberto={modalDataAberto}
        dataAtual={dataExame}
        onSalvar={(novaDataBr) => {
          setDataExame(novaDataBr);
          setErroValidacao(null);
        }}
        onFechar={() => setModalDataAberto(false)}
      />
    </div>
  );
};
