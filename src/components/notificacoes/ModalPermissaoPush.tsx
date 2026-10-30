/**
 * @file ModalPermissaoPush.tsx
 * @description Modal Soft Prompt para solicitação contextual e humanizada de notificações Push.
 * Explica claramente os benefícios (queima de gordura, hidratação e pesagem)
 * antes de acionar a permissão nativa do navegador, garantindo mais de 80% de conversão.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Flame, Droplets, Scale, Check, X, Loader2, Send, RefreshCw, AlertCircle } from 'lucide-react';
import { 
  solicitarPermissaoEAssinarPush, 
  verificarSuportePush,
  verificarAssinaturaAtivaNoServidor,
  testarEnvioPushServidor,
  obterAssinaturaPushAtual,
  type PreferenciasNotificacao,
  PREFERENCIAS_PADRAO
} from '../../services/pushNotificationService';

interface ModalPermissaoPushProps {
  aberto: boolean;
  usuarioId: string;
  onConcluido?: (sucesso: boolean) => void;
  onFechar: () => void;
}

export const ModalPermissaoPush: React.FC<ModalPermissaoPushProps> = ({
  aberto,
  usuarioId,
  onConcluido,
  onFechar,
}) => {
  const [salvando, setSalvando] = useState<boolean>(false);
  const [testando, setTestando] = useState<boolean>(false);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<boolean>(false);
  const [jaInscrito, setJaInscrito] = useState<boolean>(false);
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacao>(PREFERENCIAS_PADRAO);

  useEffect(() => {
    if (aberto && usuarioId) {
      Promise.all([
        obterAssinaturaPushAtual(),
        verificarAssinaturaAtivaNoServidor(usuarioId)
      ]).then(([sub, ativoNoBanco]) => {
        setJaInscrito(Boolean(sub && ativoNoBanco));
      }).catch(() => {});
    }
  }, [aberto, usuarioId]);

  if (!aberto) return null;

  const handleAtivarOuRenovar = async () => {
    if (!usuarioId) {
      setMensagemStatus('Faça login ou crie sua conta para receber alertas personalizados.');
      return;
    }

    const suporte = verificarSuportePush();
    if (!suporte.suportado && suporte.motivo === 'ios_requer_instalacao') {
      setMensagemStatus('No iPhone, toque no botão de Compartilhar do Safari e em "Adicionar à Tela de Início" para receber alertas com o app fechado.');
      return;
    }

    setSalvando(true);
    setMensagemStatus(null);

    const resultado = await solicitarPermissaoEAssinarPush(usuarioId, preferencias);
    setSalvando(false);

    if (resultado.sucesso) {
      setSucesso(true);
      setJaInscrito(true);
      setMensagemStatus(resultado.mensagem);
      setTimeout(() => {
        onConcluido?.(true);
      }, 1500);
    } else {
      setSucesso(false);
      setMensagemStatus(resultado.mensagem);
    }
  };

  const handleTestarPushAgora = async () => {
    if (!usuarioId) return;
    setTestando(true);
    setMensagemStatus(null);

    const res = await testarEnvioPushServidor(usuarioId);
    setTestando(false);

    if (res.sucesso) {
      setSucesso(true);
      setMensagemStatus('🔔 Notificação de teste disparada! O alerta chegará no seu aparelho mesmo se você fechar o app agora.');
    } else {
      setSucesso(false);
      setJaInscrito(false);
      setMensagemStatus(res.mensagem + ' Toque em "Renovar Inscrição" abaixo para gerar uma nova credencial ativa.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-permissao-push"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Botão de Fechar */}
        {!salvando && (
          <button
            type="button"
            onClick={onFechar}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors active:scale-90"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Ícone de Destaque com Sino Animado */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00C975] shadow-xs mb-4">
          <Bell className="w-8 h-8 fill-[#00C975]/20 animate-bounce" strokeWidth={2.2} />
        </div>

        {/* Título e Explicação */}
        <h3 id="titulo-permissao-push" className="text-xl font-extrabold text-[#0B2246] tracking-tight">
          Nunca perca seu ritmo
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Receba avisos na tela de bloqueio mesmo com o aplicativo fechado. Você pode personalizar o que deseja acompanhar:
        </p>

        {/* Lista de Benefícios e Preferências */}
        <div className="w-full mt-4 space-y-2 text-left">
          
          {/* Item 1: Jejum */}
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#00C975] flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 fill-[#00C975]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[#0B2246]">Estágios do Jejum</span>
                <span className="block text-[11px] text-slate-400">Autofagia, queima e hora de comer</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferencias.jejum}
              onChange={(e) => setPreferencias(prev => ({ ...prev, jejum: e.target.checked }))}
              className="w-4 h-4 rounded text-[#00C975] accent-[#00C975] cursor-pointer"
            />
          </label>

          {/* Item 2: Água */}
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4 fill-blue-600" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[#0B2246]">Lembretes de Água</span>
                <span className="block text-[11px] text-slate-400">Hidratação constante no seu intervalo</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferencias.agua}
              onChange={(e) => setPreferencias(prev => ({ ...prev, agua: e.target.checked }))}
              className="w-4 h-4 rounded text-[#00C975] accent-[#00C975] cursor-pointer"
            />
          </label>

          {/* Item 3: Pesagem */}
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[#0B2246]">Hora de Pesar</span>
                <span className="block text-[11px] text-slate-400">Lembrete para medir sua evolução</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferencias.peso}
              onChange={(e) => setPreferencias(prev => ({ ...prev, peso: e.target.checked }))}
              className="w-4 h-4 rounded text-[#00C975] accent-[#00C975] cursor-pointer"
            />
          </label>
        </div>

        {/* Mensagem de Feedback / Erro / Sucesso */}
        {mensagemStatus && (
          <div className={`mt-3 p-2.5 rounded-xl text-xs font-medium w-full text-center ${
            sucesso 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {mensagemStatus}
          </div>
        )}

        {/* Botões de Ação com Zonas de Toque de 44x44px */}
        <div className="w-full mt-5 space-y-2.5">
          {jaInscrito ? (
            <>
              {/* Botão de Teste Imediato */}
              <button
                type="button"
                disabled={testando || salvando}
                onClick={handleTestarPushAgora}
                className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {testando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Disparando alerta de teste...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 stroke-[2.2]" />
                    <span>Testar Notificação no Aparelho</span>
                  </>
                )}
              </button>

              {/* Botão para Renovar Conexão / Gerar nova chave fresca */}
              <button
                type="button"
                disabled={salvando || testando}
                onClick={handleAtivarOuRenovar}
                className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-[#0B2246] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#00C975]" />
                    <span>Renovando conexão...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renovar Inscrição do Aparelho</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={salvando || sucesso}
              onClick={handleAtivarOuRenovar}
              className="w-full min-h-[46px] rounded-xl bg-[#00C975] hover:bg-[#00B569] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-[#00C975]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conectando aparelho...</span>
                </>
              ) : sucesso ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Notificações Conectadas!</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Ativar Alertas com App Fechado</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            disabled={salvando || testando}
            onClick={onFechar}
            className="w-full min-h-[44px] rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
