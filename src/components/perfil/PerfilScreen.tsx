/**
 * @file PerfilScreen.tsx
 * @description Componente principal da Tela de Perfil ("Eu") do aplicativo Jejuar.
 * Implementa Gamificação completa com suporte ao catálogo expandido de conquistas:
 * - Alternância suave entre a visão geral e a subtela de edição (EditProfileSection).
 * - Cabeçalho heroico com avatar, status de nível e XP.
 * - Painel 4x1 de métricas gamificadas (Streak, Horas jejuadas, Água bebida e Conquistas).
 * - Vitrine com as principais medalhas e atalhos para os Modais de Detalhe Individual e Galeria Completa.
 * - Grouped Inset List clássico com todas as ações de dados pessoais, hábitos, segurança e LGPD.
 */

import React, { useState, useEffect } from 'react';
import type { UsuarioEmCadastro, DadosPerfilUsuario, ConquistaUsuario } from '../../types';
import { buscarDadosPerfil, salvarDadosPerfil, exportarBackupDadosLGPD } from '../../services/perfilService';
import { useGamificacaoUsuario } from '../../hooks/useGamificacaoUsuario';
import { HeaderPerfilHero } from './HeaderPerfilHero';
import { CardMetricasGamificadas } from './CardMetricasGamificadas';
import { VitrineConquistasPerfil } from './VitrineConquistasPerfil';
import { MenuGroupedInsetList } from './MenuGroupedInsetList';
import { EditProfileSection } from './EditProfileSection';
import { ModalEscolherAvatar } from './ModalEscolherAvatar';
import { ModalAlterarSenha } from './ModalAlterarSenha';
import { ModalConfirmarLogout } from './ModalConfirmarLogout';
import { ModalExcluirConta } from './ModalExcluirConta';
import { ModalGaleriaConquistas } from '../inicio/ModalGaleriaConquistas';
import { ModalDetalheConquista } from './ModalDetalheConquista';
import { ToastSucesso } from '../ToastSucesso';
import type { AbaNavegacao } from '../MenuInferior';

interface PerfilScreenProps {
  usuario?: UsuarioEmCadastro;
  onMudarAba: (aba: AbaNavegacao) => void;
  onAbrirDadosCorporais: () => void;
  onAbrirRastreadorAgua: () => void;
  onAbrirNotificacoes: () => void;
  onAtualizarBiometria?: (dados: { peso?: number; pesoDesejado?: number; pesoInicial?: number }) => void;
}

export const PerfilScreen: React.FC<PerfilScreenProps> = ({
  usuario,
  onMudarAba,
  onAbrirDadosCorporais,
  onAbrirRastreadorAgua,
  onAbrirNotificacoes,
  onAtualizarBiometria,
}) => {
  // Controle de tela atual (Visão Geral vs Subtela de Edição)
  const [subtelaAtiva, setSubtelaAtiva] = useState<'geral' | 'editar'>('geral');

  // Estado dos dados cadastrais e biométricos do perfil (incluindo dados do Onboarding)
  const [dadosPerfil, setDadosPerfil] = useState<DadosPerfilUsuario>(() => {
    const info = usuario?.informacoesBasicas || {};
    const generoSalvo = String(info.genero || 'feminino').toLowerCase() === 'masculino' ? 'masculino' : 'feminino';
    const pesoAtualSalvo =
      info.peso ||
      (typeof window !== 'undefined' ? Number(localStorage.getItem('jejuar_peso_atual') || 0) : 0) ||
      68;
    const pesoInicialSalvo =
      info.pesoInicial ||
      (typeof window !== 'undefined' ? Number(localStorage.getItem('jejuar_peso_inicio') || 0) : 0) ||
      pesoAtualSalvo;
    const pesoDesejadoSalvo =
      info.pesoDesejado ||
      (typeof window !== 'undefined' ? Number(localStorage.getItem('jejuar_peso_meta') || 0) : 0) ||
      Math.max(45, Math.round((pesoAtualSalvo - 5) * 10) / 10);

    return {
      nome: usuario?.nome || 'Usuário Jejuar',
      email: usuario?.email || 'usuario@jejuar.app',
      plano: usuario?.nivel === 'vitalicio' ? 'vitalicio' : (usuario?.nivel === 'pro' ? 'pro' : 'pro'),
      genero: generoSalvo,
      altura: info.altura || 165,
      peso: pesoAtualSalvo,
      pesoInicial: pesoInicialSalvo,
      pesoDesejado: pesoDesejadoSalvo,
      objetivoPrincipal: info.objetivoPrincipal || 'perder_peso',
      experienciaJejum: info.experienciaJejum || 'primeira_vez',
      anoNascimento: info.anoNascimento,
      avatarPredefinidoId: 'avatar_longevidade',
    };
  });

  // Modais de suporte
  const [modalAvatarAberto, setModalAvatarAberto] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [modalLogoutAberto, setModalLogoutAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [modalConquistasAberto, setModalConquistasAberto] = useState(false);
  const [conquistaDetalheModal, setConquistaDetalheModal] = useState<ConquistaUsuario | null>(null);

  // Toast de feedback
  const [toastConfig, setToastConfig] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
  });

  // Carrega os dados persistidos do Perfil no Firestore / LocalStorage
  useEffect(() => {
    if (usuario?.id) {
      buscarDadosPerfil(usuario.id).then((perfilSalvo) => {
        if (perfilSalvo) {
          setDadosPerfil(prev => ({ ...prev, ...perfilSalvo }));
        }
      }).catch((err) => {
        console.warn('Aviso ao carregar dados do perfil:', err);
      });
    }
  }, [usuario?.id]);

  // Hook unificado de Gamificação (Conquistas, Nível e XP sincronizados com todas as ações do app)
  const { conquistas, metricasGamificadas } = useGamificacaoUsuario({
    usuario,
    dadosPerfilOverride: dadosPerfil,
  });

  // Salva alterações completas do perfil e sincroniza com o estado pai (InicioScreen)
  const handleSalvarDadosPerfil = async (novosDados: Partial<DadosPerfilUsuario>) => {
    const usuarioId = usuario?.id || '';
    await salvarDadosPerfil(usuarioId, novosDados);

    setDadosPerfil(prev => ({
      ...prev,
      ...novosDados,
    }));

    if (onAtualizarBiometria) {
      onAtualizarBiometria({
        peso: novosDados.peso,
        pesoDesejado: novosDados.pesoDesejado,
        pesoInicial: novosDados.pesoInicial,
      });
    }

    setToastConfig({
      visivel: true,
      titulo: '✨ Perfil atualizado!',
      mensagem: 'Suas informações cadastrais e metas foram salvas com sucesso.',
    });
  };

  // Salva alteração rápida inline do nome
  const handleSalvarNomeInline = async (novoNome: string) => {
    try {
      await handleSalvarDadosPerfil({ nome: novoNome });
    } catch {
      // Ignora erro inline
    }
  };

  // Salva alteração de foto ou avatar predefinido
  const handleSalvarFotoEAvatar = async (novaFotoUrl: string | null, novoAvatarId: string | null) => {
    try {
      await handleSalvarDadosPerfil({
        fotoUrl: novaFotoUrl,
        avatarPredefinidoId: novoAvatarId,
      });
      setModalAvatarAberto(false);
    } catch (err: any) {
      setToastConfig({
        visivel: true,
        titulo: 'Ops!',
        mensagem: err.message || 'Não conseguimos atualizar sua foto no momento.',
      });
    }
  };

  // Confirmação de encerramento de sessão (Logout)
  const handleConfirmarLogout = () => {
    setModalLogoutAberto(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jejuar_sessao_ativa');
      localStorage.removeItem('jejuar_usuario_id');
      window.location.reload();
    }
  };

  // Exportação LGPD
  const handleExportarBackup = () => {
    exportarBackupDadosLGPD(usuario, dadosPerfil);
    setToastConfig({
      visivel: true,
      titulo: '📥 Backup exportado!',
      mensagem: 'O arquivo com seus dados foi baixado para o seu dispositivo.',
    });
  };

  // Se a subtela de edição estiver ativa, renderiza o formulário completo
  if (subtelaAtiva === 'editar') {
    return (
      <EditProfileSection
        perfilAtual={dadosPerfil}
        onSalvar={handleSalvarDadosPerfil}
        onVoltar={() => setSubtelaAtiva('geral')}
      />
    );
  }

  return (
    <div className="w-full flex-1 px-4 pt-3 pb-24 overflow-y-auto space-y-4 select-none relative">
      {/* Toast de Confirmação */}
      <ToastSucesso
        visivel={toastConfig.visivel}
        titulo={toastConfig.titulo}
        mensagem={toastConfig.mensagem}
        onFechar={() => setToastConfig(prev => ({ ...prev, visivel: false }))}
      />

      {/* 1. Cabeçalho Heroico */}
      <HeaderPerfilHero
        perfil={dadosPerfil}
        metricasGamificacao={metricasGamificadas}
        onAbrirModalAvatar={() => setModalAvatarAberto(true)}
        onSalvarNomeInline={handleSalvarNomeInline}
        onAbrirSubtelaEdicao={() => setSubtelaAtiva('editar')}
      />

      {/* 2. Grid 4x1 de Métricas Gamificadas */}
      <CardMetricasGamificadas
        metricas={metricasGamificadas}
        onVerConquistas={() => setModalConquistasAberto(true)}
      />

      {/* 3. Vitrine das Principais Conquistas */}
      <VitrineConquistasPerfil
        conquistas={conquistas}
        onAbrirGaleriaCompleta={() => setModalConquistasAberto(true)}
        onSelecionarConquista={(conquista) => setConquistaDetalheModal(conquista)}
      />

      {/* 4. Menu em Lista Agrupada */}
      <MenuGroupedInsetList
        perfil={dadosPerfil}
        onAbrirEdicaoPerfil={() => setSubtelaAtiva('editar')}
        onAbrirDadosCorporais={onAbrirDadosCorporais}
        onNavegarParaPlanos={() => onMudarAba('plano')}
        onAbrirRastreadorAgua={onAbrirRastreadorAgua}
        onAbrirNotificacoes={onAbrirNotificacoes}
        onAbrirAlterarSenha={() => setModalSenhaAberto(true)}
        onExportarBackupLGPD={handleExportarBackup}
        onAbrirModalLogout={() => setModalLogoutAberto(true)}
        onAbrirModalExcluir={() => setModalExcluirAberto(true)}
      />

      {/* Modais de Gerenciamento do Perfil */}
      <ModalEscolherAvatar
        aberto={modalAvatarAberto}
        fotoUrlAtual={dadosPerfil.fotoUrl}
        avatarPredefinidoIdAtual={dadosPerfil.avatarPredefinidoId}
        nomeUsuario={dadosPerfil.nome}
        onSalvarFoto={handleSalvarFotoEAvatar}
        onFechar={() => setModalAvatarAberto(false)}
      />

      <ModalAlterarSenha
        aberto={modalSenhaAberto}
        usuarioId={usuario?.id || ''}
        onSucesso={() => {
          setToastConfig({
            visivel: true,
            titulo: '🔒 Senha atualizada!',
            mensagem: 'Sua nova senha de acesso foi salva com sucesso.',
          });
        }}
        onFechar={() => setModalSenhaAberto(false)}
      />

      <ModalConfirmarLogout
        aberto={modalLogoutAberto}
        onConfirmar={handleConfirmarLogout}
        onCancelar={() => setModalLogoutAberto(false)}
      />

      <ModalExcluirConta
        aberto={modalExcluirAberto}
        usuario={usuario}
        perfil={dadosPerfil}
        onFechar={() => setModalExcluirAberto(false)}
      />

      {/* Modal Galeria Completa por Missões */}
      <ModalGaleriaConquistas
        aberto={modalConquistasAberto}
        conquistas={conquistas}
        onFechar={() => setModalConquistasAberto(false)}
        onSelecionarConquista={(conquista) => setConquistaDetalheModal(conquista)}
      />

      {/* Modal de Detalhe Exclusivo de uma Única Conquista */}
      <ModalDetalheConquista
        conquista={conquistaDetalheModal}
        onFechar={() => setConquistaDetalheModal(null)}
      />
    </div>
  );
};
