/**
 * @file ModalEscolherAvatar.tsx
 * @description Modal para upload de foto de perfil nativa (máx. 10MB),
 * escolha de avatares estilizados de saúde/metabolismo, ou restauração da inicial do nome.
 */

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, X, Check, Upload, AlertCircle } from 'lucide-react';
import { AVATARES_PREDEFINIDOS } from '../../utils/perfilUtils';
import type { AvatarPredefinido } from '../../types';

interface ModalEscolherAvatarProps {
  aberto: boolean;
  fotoUrlAtual?: string | null;
  avatarPredefinidoIdAtual?: string | null;
  nomeUsuario: string;
  onSalvarFoto: (novaFotoUrl: string | null, novoAvatarId: string | null) => void;
  onFechar: () => void;
}

export const ModalEscolherAvatar: React.FC<ModalEscolherAvatarProps> = ({
  aberto,
  fotoUrlAtual,
  avatarPredefinidoIdAtual,
  nomeUsuario,
  onSalvarFoto,
  onFechar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoTemp, setFotoTemp] = useState<string | null>(fotoUrlAtual || null);
  const [avatarTempId, setAvatarTempId] = useState<string | null>(avatarPredefinidoIdAtual || null);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [modalConfirmarRemocao, setModalConfirmarRemocao] = useState<boolean>(false);

  if (!aberto) return null;

  // Processa o arquivo selecionado pelo usuário no dispositivo
  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    setErroUpload(null);

    if (!arquivo) return;

    // Validação de limite de 10MB
    const maxBytes = 10 * 1024 * 1024;
    if (arquivo.size > maxBytes) {
      setErroUpload('A imagem selecionada ultrapassa o tamanho máximo de 10MB. Por favor, escolha uma imagem menor.');
      return;
    }

    // Leitura nativa em Base64 para visualização e salvamento
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultadoBase64 = event.target?.result as string;
      setFotoTemp(resultadoBase64);
      setAvatarTempId(null); // Desmarca avatar pré-definido se subir foto
    };
    reader.onerror = () => {
      setErroUpload('Não conseguimos carregar sua foto. Tente novamente com outro arquivo de imagem.');
    };
    reader.readAsDataURL(arquivo);
  };

  // Confirmação final da escolha
  const handleConfirmar = () => {
    onSalvarFoto(fotoTemp, avatarTempId);
    onFechar();
  };

  // Remove foto e restaura inicial do nome
  const handleRemoverFotoERestaurarInicial = () => {
    setFotoTemp(null);
    setAvatarTempId(null);
    setModalConfirmarRemocao(false);
  };

  const inicialNome = nomeUsuario ? nomeUsuario.trim().charAt(0).toUpperCase() : 'J';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-avatar"
    >
      <div 
        className="w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00C975]/15 text-[#00C975] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h3 id="titulo-modal-avatar" className="text-base font-bold text-[#0B2246]">
              Foto do Perfil
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Mensagem de Erro Humanizada */}
          {erroUpload && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erroUpload}</span>
            </div>
          )}

          {/* Pré-visualização Atual */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#00C975] via-emerald-400 to-teal-300 shadow-md">
              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                {fotoTemp ? (
                  <img 
                    src={fotoTemp} 
                    alt="Foto do perfil escolhida" 
                    className="w-full h-full object-cover"
                  />
                ) : avatarTempId ? (
                  (() => {
                    const avatarSel = AVATARES_PREDEFINIDOS.find(a => a.id === avatarTempId);
                    return (
                      <div className={`w-full h-full bg-gradient-to-br ${avatarSel?.corFundo || 'from-emerald-400 to-teal-600'} flex items-center justify-center text-4xl`}>
                        {avatarSel?.emoji || '🌿'}
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-full h-full bg-[#00C975] flex items-center justify-center text-white text-3xl font-black">
                    {inicialNome}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 mt-2">
              {fotoTemp ? 'Foto personalizada' : avatarTempId ? 'Avatar ilustrado ativo' : 'Inicial padrão do nome'}
            </span>
          </div>

          {/* Ações de Upload Nativo */}
          <div className="space-y-2">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
              onChange={handleArquivoSelecionado}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0B2246] font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#00C975]" />
              Escolher foto da galeria ou câmera (Máx. 10MB)
            </button>

            {(fotoTemp || avatarTempId) && (
              <button
                type="button"
                onClick={() => setModalConfirmarRemocao(true)}
                className="w-full min-h-[44px] px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                Remover foto e restaurar inicial
              </button>
            )}
          </div>

          {/* Galeria de Avatares Ilustrados Estilizados */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B2246] uppercase tracking-wider">
                Ou escolha um avatar ilustrado
              </span>
              <span className="text-[11px] text-slate-400">
                6 opções exclusivas
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {AVATARES_PREDEFINIDOS.map((avatar) => {
                const estaSelecionado = avatarTempId === avatar.id && !fotoTemp;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setAvatarTempId(avatar.id);
                      setFotoTemp(null);
                    }}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer min-h-[76px] active:scale-95 ${
                      estaSelecionado 
                        ? 'border-[#00C975] bg-emerald-50/50 shadow-sm ring-2 ring-[#00C975]/30' 
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.corFundo} flex items-center justify-center text-xl shadow-xs`}>
                      {avatar.emoji}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 text-center line-clamp-1">
                      {avatar.nome}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé com Botão Salvar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 min-h-[48px] px-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            className="flex-1 min-h-[48px] px-4 rounded-2xl bg-[#00C975] hover:bg-[#00B067] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Salvar Foto
          </button>
        </div>
      </div>

      {/* Modal de Confirmação para Remover Foto */}
      {modalConfirmarRemocao && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#0B2246]">Remover foto do perfil?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sua foto será substituída pela inicial do seu nome. Você poderá adicionar uma nova a qualquer momento.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarRemocao(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleRemoverFotoERestaurarInicial}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm active:scale-95 cursor-pointer"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
