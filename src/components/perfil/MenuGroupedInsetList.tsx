/**
 * @file MenuGroupedInsetList.tsx
 * @description Estrutura em lista agrupada embutida (Grouped Inset List) do Perfil,
 * seguindo os padrões ergonômicos do iOS e design semântico com zonas de toque >= 48px.
 */

import React from 'react';
import { 
  User, 
  Scale, 
  Flame, 
  Droplets, 
  Bell, 
  Lock, 
  Download, 
  LogOut, 
  Trash2, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import type { DadosPerfilUsuario } from '../../types';

interface MenuGroupedInsetListProps {
  perfil: DadosPerfilUsuario;
  onAbrirEdicaoPerfil: () => void;
  onAbrirDadosCorporais: () => void;
  onNavegarParaPlanos: () => void;
  onAbrirRastreadorAgua: () => void;
  onAbrirNotificacoes: () => void;
  onAbrirAlterarSenha: () => void;
  onExportarBackupLGPD: () => void;
  onAbrirModalLogout: () => void;
  onAbrirModalExcluir: () => void;
}

export const MenuGroupedInsetList: React.FC<MenuGroupedInsetListProps> = ({
  perfil,
  onAbrirEdicaoPerfil,
  onAbrirDadosCorporais,
  onNavegarParaPlanos,
  onAbrirRastreadorAgua,
  onAbrirNotificacoes,
  onAbrirAlterarSenha,
  onExportarBackupLGPD,
  onAbrirModalLogout,
  onAbrirModalExcluir,
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Grupo 1: Identidade & Biometria */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
          Identidade & Saúde
        </span>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {/* Dados Pessoais e Documentos */}
          <button
            type="button"
            onClick={onAbrirEdicaoPerfil}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00C975] flex items-center justify-center">
                <User className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[#0B2246] block group-hover:text-[#00C975] transition-colors">
                  Dados Pessoais & Documentos
                </span>
                <span className="text-[11px] text-slate-400">
                  CPF/CNPJ, WhatsApp, Nascimento e Renda
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {perfil.cpfCnpj ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Completo
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Pendente
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Medidas Corporais e Bioimpedância */}
          <button
            type="button"
            onClick={onAbrirDadosCorporais}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Scale className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[#0B2246] block group-hover:text-blue-600 transition-colors">
                  Medidas & Peso Atual
                </span>
                <span className="text-[11px] text-slate-400">
                  {perfil.peso ? `${perfil.peso} kg` : '68 kg'} • {perfil.altura ? `${perfil.altura} cm` : '165 cm'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Grupo 2: Metas & Preferências */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
          Metas & Hábitos
        </span>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {/* Plano de Jejum Ativo */}
          <button
            type="button"
            onClick={onNavegarParaPlanos}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <Flame className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[#0B2246] block group-hover:text-orange-500 transition-colors">
                  Protocolo de Jejum Ativo
                </span>
                <span className="text-[11px] text-slate-400">
                  Plano recomendado e horários
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Hidratação Diária */}
          <button
            type="button"
            onClick={onAbrirRastreadorAgua}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <Droplets className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[#0B2246] block group-hover:text-sky-500 transition-colors">
                  Monitor de Água
                </span>
                <span className="text-[11px] text-slate-400">
                  Meta diária de copos e histórico
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Notificações e Lembretes */}
          <button
            type="button"
            onClick={onAbrirNotificacoes}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Bell className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[#0B2246] block group-hover:text-purple-600 transition-colors">
                  Lembretes & Notificações
                </span>
                <span className="text-[11px] text-slate-400">
                  Alertas sonoros de jejum e hidratação
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Grupo 3: Segurança & LGPD */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
          Segurança & Privacidade
        </span>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {/* Alterar Senha */}
          <button
            type="button"
            onClick={onAbrirAlterarSenha}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[#0B2246] block group-hover:text-amber-600 transition-colors">
                  Alterar Senha de Acesso
                </span>
                <span className="text-[11px] text-slate-400">
                  Atualize sua credencial com segurança
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Backup LGPD */}
          <button
            type="button"
            onClick={onExportarBackupLGPD}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Download className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[#0B2246] block group-hover:text-[#00C975] transition-colors">
                  Baixar Meus Dados (LGPD)
                </span>
                <span className="text-[11px] text-slate-400">
                  Exportar arquivo com todos os seus registros
                </span>
              </div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </button>

          {/* Sair da Conta (Logout) */}
          <button
            type="button"
            onClick={onAbrirModalLogout}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <LogOut className="w-4 h-4 stroke-[2] ml-0.5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-slate-700 block group-hover:text-slate-900 transition-colors">
                  Encerrar Sessão
                </span>
                <span className="text-[11px] text-slate-400">
                  Sair do aplicativo neste dispositivo
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Grupo 4: Zona de Risco (Exclusão) */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 px-3">
          Zona Crítica
        </span>
        <div className="bg-white rounded-3xl border border-rose-100 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={onAbrirModalExcluir}
            className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between hover:bg-rose-50/60 active:bg-rose-100/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-rose-600 block group-hover:text-rose-700 transition-colors">
                  Excluir Conta Definitivamente
                </span>
                <span className="text-[11px] text-rose-400">
                  Destruição irrevogável de todos os dados
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
