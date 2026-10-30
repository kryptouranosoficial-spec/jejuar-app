/**
 * @file HeaderPerfilHero.tsx
 * @description Cabeçalho heroico do Perfil com Avatar de 104px, botão lápis flutuante (Edit3),
 * edição inline do nome, badge de papel/plano (Vitalício/PRO) e o status heróico de Gamificação
 * (Nível de Maestria Metabólica e barra progressiva de XP).
 */

import React, { useState } from 'react';
import { Edit3, Check, Sparkles, Crown, Zap } from 'lucide-react';
import { AVATARES_PREDEFINIDOS } from '../../utils/perfilUtils';
import type { DadosPerfilUsuario, MetricasGamificacaoUsuario } from '../../types';

interface HeaderPerfilHeroProps {
  perfil: DadosPerfilUsuario;
  metricasGamificacao: MetricasGamificacaoUsuario;
  onAbrirModalAvatar: () => void;
  onSalvarNomeInline: (novoNome: string) => void;
  onAbrirSubtelaEdicao: () => void;
}

export const HeaderPerfilHero: React.FC<HeaderPerfilHeroProps> = ({
  perfil,
  metricasGamificacao,
  onAbrirModalAvatar,
  onSalvarNomeInline,
  onAbrirSubtelaEdicao,
}) => {
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeTemp, setNomeTemp] = useState(perfil.nome);

  const inicialNome = perfil.nome ? perfil.nome.trim().charAt(0).toUpperCase() : 'J';

  const avatarPredefinido = AVATARES_PREDEFINIDOS.find(a => a.id === perfil.avatarPredefinidoId);

  const handleConfirmarNome = (e: React.FormEvent) => {
    e.preventDefault();
    if (nomeTemp.trim()) {
      onSalvarNomeInline(nomeTemp.trim());
    }
    setEditandoNome(false);
  };

  // Badge de plano formatado
  const rotuloPlano = perfil.plano === 'vitalicio' ? 'Acesso Vitalício' : (perfil.plano === 'pro' ? 'Membro PRO' : 'Gratuito');
  const corPlano = perfil.plano === 'vitalicio' 
    ? 'bg-amber-100 text-amber-900 border-amber-300' 
    : 'bg-emerald-100 text-emerald-900 border-emerald-300';

  return (
    <div className="w-full bg-gradient-to-b from-white via-white to-slate-50/50 rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
      {/* Brilho decorativo sutil de fundo */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#00C975]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Círculo do Avatar com 104px (entre 96px e 112px) e Botão Lápis Flutuante */}
      <div className="relative mb-3">
        <div 
          onClick={onAbrirModalAvatar}
          role="button"
          tabIndex={0}
          aria-label="Alterar foto de perfil"
          className="w-[104px] h-[104px] rounded-full p-1 bg-gradient-to-tr from-[#00C975] via-emerald-400 to-teal-300 shadow-md cursor-pointer transition-transform duration-200 active:scale-95"
        >
          <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
            {perfil.fotoUrl ? (
              <img 
                src={perfil.fotoUrl} 
                alt={`Foto de ${perfil.nome}`}
                className="w-full h-full object-cover" 
              />
            ) : perfil.avatarPredefinidoId && avatarPredefinido ? (
              <div className={`w-full h-full bg-gradient-to-br ${avatarPredefinido.corFundo} flex items-center justify-center text-4xl`}>
                {avatarPredefinido.emoji}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#00C975] to-[#009e5b] flex items-center justify-center text-white text-3xl font-black">
                {inicialNome}
              </div>
            )}
          </div>
        </div>

        {/* Botão de Edição em Lápis Flutuante (Edit3) - Touch target mínimo de 44x44px */}
        <button
          type="button"
          onClick={onAbrirModalAvatar}
          aria-label="Editar foto de perfil"
          className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-white text-[#0B2246] hover:text-[#00C975] shadow-lg border border-slate-100 flex items-center justify-center active:scale-90 transition-all cursor-pointer ring-2 ring-emerald-50"
        >
          <Edit3 className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* Nome com Edição Inline Rápida */}
      <div className="w-full max-w-[320px] mb-1">
        {editandoNome ? (
          <form onSubmit={handleConfirmarNome} className="flex items-center justify-center gap-2">
            <input
              type="text"
              autoFocus
              value={nomeTemp}
              onChange={(e) => setNomeTemp(e.target.value)}
              className="text-lg font-black text-[#0B2246] text-center border-b-2 border-[#00C975] bg-transparent outline-hidden px-2 py-0.5"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#00C975] text-white flex items-center justify-center shadow-xs active:scale-90"
              aria-label="Confirmar alteração de nome"
            >
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-1.5 group">
            <h2 
              onClick={() => { setNomeTemp(perfil.nome); setEditandoNome(true); }}
              className="text-xl font-extrabold text-[#0B2246] tracking-tight hover:text-[#00C975] cursor-pointer transition-colors"
            >
              {perfil.nome || 'Usuário Jejuar'}
            </h2>
            <button
              type="button"
              onClick={() => { setNomeTemp(perfil.nome); setEditandoNome(true); }}
              className="p-1 text-slate-400 group-hover:text-[#00C975] transition-colors"
              aria-label="Editar nome"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* E-mail e Badge Semântico de Papel / Plano */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
          {perfil.email || 'usuario@jejuar.app'}
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase tracking-wider flex items-center gap-1 shadow-2xs ${corPlano}`}>
          <Crown className="w-3 h-3 stroke-[2.5]" />
          {rotuloPlano}
        </span>
      </div>

      {/* Bloco de Gamificação: Nível, Título e Barra de Progresso de XP (Modo Claro Harmonizado) */}
      <div className="w-full bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 rounded-2xl p-4 border border-emerald-100/90 shadow-2xs relative overflow-hidden text-left">
        {/* Detalhe luminoso sutil em tom esmeralda */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-[#00C975]/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#00C975] flex items-center justify-center shadow-2xs">
              <Zap className="w-4 h-4 fill-[#00C975]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#009E5B] block">
                Nível {metricasGamificacao.nivelAtual}
              </span>
              <h3 className="text-sm font-black text-[#0B2246] leading-tight">
                {metricasGamificacao.tituloNivel}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-[#0B2246]">
              {metricasGamificacao.pontosXpTotal.toLocaleString('pt-BR')} XP
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Próximo: {metricasGamificacao.xpProximoNivel.toLocaleString('pt-BR')} XP
            </span>
          </div>
        </div>

        {/* Barra de Progresso de XP */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 mb-1.5">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 via-[#00C975] to-teal-400 rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${Math.max(5, metricasGamificacao.porcentagemProgressoNivel)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <span>{metricasGamificacao.porcentagemProgressoNivel}% concluído</span>
          <span className="text-[#008A4E] font-bold flex items-center gap-0.5">
            <Sparkles className="w-3 h-3" /> Faltam {Math.max(0, metricasGamificacao.xpProximoNivel - metricasGamificacao.pontosXpTotal)} XP para subir
          </span>
        </div>
      </div>
    </div>
  );
};
