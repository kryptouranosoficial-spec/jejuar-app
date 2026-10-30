/**
 * @file ModalRegistrarPeso.tsx
 * @description Modal bottom sheet polivalente para registro/edição de peso (atual, início e meta)
 * com régua interativa de precisão (passo 0.1 kg), suporte a foto com compressão automática
 * em Base64 para persistência leve no Firestore, e seletor nativo entre Câmera e Galeria.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { comprimirImagemBase64 } from '../utils/imagemUtils';
import { dispararFeedbackHaptico } from '../utils/haptics';

export type ModoRegistroPeso = 'atual' | 'inicio' | 'meta';

interface ModalRegistrarPesoProps {
  /** Indica se a modal está visível */
  visivel: boolean;
  /** Peso inicial para posicionar a régua */
  pesoInicial: number;
  /** Modo de edição: 'atual', 'inicio' ou 'meta' */
  modo?: ModoRegistroPeso;
  /** Título customizado opcional */
  titulo?: string;
  /** Texto do botão de confirmação */
  textoBotao?: string;
  /** Se deve exibir o atalho para foto de progresso */
  exibirFoto?: boolean;
  /** Callback acionado ao fechar a modal */
  onFechar: () => void;
  /** Callback acionado ao salvar o novo peso e a foto opcional em Base64 */
  onSalvar: (novoPeso: number, modo: ModoRegistroPeso, fotoBase64?: string | null) => void;
}

const PESO_MIN = 30.0;
const PESO_MAX = 200.0;
const PASSO_PESO = 0.1; // Resolução a cada 100g (0.1 kg)
const LARGURA_POR_PASSO = 10; // Pixels por cada tick de 0.1kg para excelente leitura e toque

export const ModalRegistrarPeso: React.FC<ModalRegistrarPesoProps> = ({
  visivel,
  pesoInicial,
  modo = 'atual',
  titulo,
  textoBotao,
  exibirFoto,
  onFechar,
  onSalvar,
}) => {
  const [peso, setPeso] = useState<number>(pesoInicial);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [carregandoFoto, setCarregandoFoto] = useState<boolean>(false);
  const [sheetOrigemAberta, setSheetOrigemAberta] = useState<boolean>(false);

  const containerReguaRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galeriaInputRef = useRef<HTMLInputElement>(null);

  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const programaticScrollRef = useRef<boolean>(false);

  // Título e botão dinâmicos conforme o modo
  const tituloModal = titulo || (
    modo === 'inicio' 
      ? 'Editar peso de início' 
      : modo === 'meta' 
        ? 'Editar meta de peso' 
        : 'Registre seu peso atual'
  );

  const textoBotaoConfirmar = textoBotao || (
    modo === 'inicio' 
      ? 'Atualizar peso de início' 
      : modo === 'meta' 
        ? 'Definir nova meta' 
        : 'Salvar'
  );

  const mostrarFoto = exibirFoto !== undefined ? exibirFoto : modo === 'atual';

  // Converte peso em posição exata de scroll (independente de largura da tela)
  const calcularScrollParaPeso = useCallback((kg: number) => {
    const pesoValido = Math.max(PESO_MIN, Math.min(PESO_MAX, kg));
    const indice = Math.round((pesoValido - PESO_MIN) / PASSO_PESO);
    return indice * LARGURA_POR_PASSO;
  }, []);

  // Sincroniza a posição da régua e reseta a foto quando a modal se torna visível
  useEffect(() => {
    if (visivel) {
      setPeso(pesoInicial);
      setFotoBase64(null);
      setSheetOrigemAberta(false);

      const target = calcularScrollParaPeso(pesoInicial);
      programaticScrollRef.current = true;

      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          if (containerReguaRef.current) {
            containerReguaRef.current.scrollLeft = target;
          }
          setTimeout(() => {
            programaticScrollRef.current = false;
          }, 80);
        });
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [visivel, pesoInicial, calcularScrollParaPeso]);

  // Atualiza o valor do peso conforme a rolagem do usuário com precisão absoluta
  const handleScroll = () => {
    if (programaticScrollRef.current || !containerReguaRef.current) return;
    const scrollPos = containerReguaRef.current.scrollLeft;

    const indiceCalculado = Math.round(scrollPos / LARGURA_POR_PASSO);
    const kgCalculado = PESO_MIN + indiceCalculado * PASSO_PESO;
    const kgFinal = Math.max(PESO_MIN, Math.min(PESO_MAX, Number(kgCalculado.toFixed(1))));

    if (kgFinal !== peso) {
      setPeso(kgFinal);
      dispararFeedbackHaptico('suave');
    }
  };

  // Arraste com ponteiro/touch na régua
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerReguaRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - containerReguaRef.current.offsetLeft;
    scrollLeftStartRef.current = containerReguaRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerReguaRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerReguaRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    containerReguaRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Processa o arquivo selecionado, comprime em Base64 e atualiza o estado
  const handleProcessarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    try {
      setCarregandoFoto(true);
      const comprimido = await comprimirImagemBase64(arquivo, 800, 0.75);
      setFotoBase64(comprimido);
    } catch (erro) {
      console.error("Erro ao processar imagem:", erro);
    } finally {
      setCarregandoFoto(false);
      setSheetOrigemAberta(false);
      e.target.value = '';
    }
  };

  if (!visivel) return null;

  // Gera marcações da régua em passos de 0.1 kg
  const totalPassos = Math.round((PESO_MAX - PESO_MIN) / PASSO_PESO) + 1;

  return (
    <div 
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center transition-opacity animate-in fade-in duration-200"
      onClick={() => {
        if (!sheetOrigemAberta) onFechar();
      }}
    >
      {/* Inputs Nativos Ocultos para Câmera e Galeria */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleProcessarArquivo}
        aria-label="Capturar foto da câmera"
      />
      <input
        ref={galeriaInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProcessarArquivo}
        aria-label="Escolher foto da galeria"
      />

      <div 
        className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl relative flex flex-col items-center animate-in slide-in-from-bottom duration-300 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho da Modal */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="w-8" />
          <h3 className="text-[20px] font-extrabold text-[#092244] text-center flex-1">
            {tituloModal}
          </h3>
          <button
            type="button"
            onClick={onFechar}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Slot de Adicionar / Pré-visualizar Foto */}
        {mostrarFoto && (
          <div className="flex flex-col items-center my-3 relative">
            {carregandoFoto ? (
              <div className="w-20 h-20 rounded-2xl bg-[#F0FAF5] border border-[#DCF3E7] flex flex-col items-center justify-center shadow-inner">
                <Loader2 className="w-7 h-7 text-[#00C975] animate-spin" />
                <span className="text-[10px] text-slate-400 font-bold mt-1">Otimizando...</span>
              </div>
            ) : fotoBase64 ? (
              <div className="relative group">
                <img 
                  src={fotoBase64} 
                  alt="Pré-visualização do registro" 
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#00C975] shadow-md cursor-pointer group-hover:opacity-90"
                  onClick={() => setSheetOrigemAberta(true)}
                  title="Toque para trocar a foto"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFotoBase64(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                  title="Remover foto"
                  aria-label="Remover foto selecionada"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="block text-[11px] font-semibold text-[#00C975] text-center mt-1 cursor-pointer">
                  Trocar foto
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSheetOrigemAberta(true)}
                className="flex flex-col items-center group cursor-pointer"
                aria-label="Adicionar foto ao registro de peso"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#F0FAF5] border border-[#DCF3E7] flex items-center justify-center group-hover:bg-[#E3F8ED] group-active:scale-95 transition-all shadow-inner">
                  <Camera className="w-8 h-8 text-[#00C975] stroke-[2.2]" />
                </div>
                <span className="text-xs font-semibold text-slate-400 mt-1.5 group-hover:text-slate-600 transition-colors">
                  Adicionar foto
                </span>
              </button>
            )}
          </div>
        )}

        {/* Display do Peso Atual em Verde Gigante */}
        <div className="flex items-baseline justify-center gap-1 mt-2 mb-1">
          <span className="text-[44px] font-black text-[#00C975] tracking-tight leading-none">
            {peso.toFixed(1)}
          </span>
          <span className="text-[20px] font-bold text-[#00C975]">
            kg
          </span>
        </div>

        {/* Indicador Central (Triângulo Verde Invertido) */}
        <div className="flex justify-center -mb-1 relative z-20">
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#00C975]" />
        </div>

        {/* Régua Interativa com Ticks de 0.1 kg */}
        <div className="w-full relative h-[86px] overflow-hidden my-2 flex items-center justify-center">
          {/* Linha vertical central verde */}
          <div className="absolute top-0 bottom-6 left-1/2 -translate-x-1/2 w-[2px] bg-[#00C975] z-10 pointer-events-none" />

          {/* Efeito de fade nas bordas da régua */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

          {/* Container rolável com alinhamento perfeito por espaçadores flex */}
          <div
            ref={containerReguaRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="w-full h-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing scrollbar-none flex items-start pt-2 select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Espaçador esquerdo de 50% para centralizar perfeitamente a posição zero */}
            <div className="flex-shrink-0" style={{ width: `calc(50% - ${LARGURA_POR_PASSO / 2}px)` }} />

            {/* Trilha de ticks */}
            <div className="flex items-start">
              {Array.from({ length: totalPassos }).map((_, i) => {
                const valor = Number((PESO_MIN + i * PASSO_PESO).toFixed(1));
                const isInteiro = Number.isInteger(valor);
                const isMeio = Math.round((valor % 1) * 10) === 5;

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                    style={{ width: `${LARGURA_POR_PASSO}px` }}
                    onClick={() => {
                      setPeso(valor);
                      if (containerReguaRef.current) {
                        programaticScrollRef.current = true;
                        containerReguaRef.current.scrollLeft = calcularScrollParaPeso(valor);
                        setTimeout(() => {
                          programaticScrollRef.current = false;
                        }, 50);
                      }
                    }}
                  >
                    {/* Linha do tick */}
                    <div
                      className={`rounded-full transition-all ${
                        isInteiro
                          ? 'w-[2px] h-[30px] bg-slate-300'
                          : isMeio
                            ? 'w-[1.5px] h-[20px] bg-slate-200'
                            : 'w-[1px] h-[14px] bg-slate-200'
                      }`}
                    />

                    {/* Rótulo numérico para inteiros */}
                    {isInteiro && (
                      <span className="text-[12px] font-bold text-slate-400 mt-1 select-none pointer-events-none">
                        {Math.round(valor)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Espaçador direito de 50% */}
            <div className="flex-shrink-0" style={{ width: `calc(50% - ${LARGURA_POR_PASSO / 2}px)` }} />
          </div>
        </div>

        {/* Botão de Ação Salvar */}
        <button
          type="button"
          onClick={() => {
            onSalvar(peso, modo, fotoBase64);
            onFechar();
          }}
          className="w-full py-3.5 rounded-full bg-[#00C975] hover:bg-[#00B568] active:scale-98 text-white font-extrabold text-[16px] shadow-lg shadow-emerald-500/25 transition-all cursor-pointer min-h-[48px] flex items-center justify-center mt-2"
        >
          {textoBotaoConfirmar}
        </button>
      </div>

      {/* Action Sheet: Escolher entre Câmera e Galeria */}
      {sheetOrigemAberta && (
        <div 
          className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex flex-col justify-end items-center animate-in fade-in duration-200"
          onClick={() => setSheetOrigemAberta(false)}
        >
          <div 
            className="w-full max-w-[430px] bg-white rounded-t-[28px] p-5 pb-6 shadow-2xl flex flex-col space-y-3 animate-in slide-in-from-bottom duration-250 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1" />

            <h4 className="text-[17px] font-extrabold text-[#092244] text-center mb-1">
              Adicionar foto de progresso
            </h4>
            <p className="text-xs text-slate-500 text-center mb-2">
              Escolha de onde deseja carregar a sua foto
            </p>

            {/* Opção 1: Câmera */}
            <button
              type="button"
              onClick={() => {
                cameraInputRef.current?.click();
              }}
              className="w-full py-3.5 px-4 bg-[#F5F9FC] hover:bg-emerald-50 active:scale-98 rounded-2xl flex items-center gap-3.5 text-[#092244] font-bold text-sm transition-all border border-slate-100 min-h-[50px] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00C975] flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left flex-1">
                <span className="block text-[15px] font-extrabold">Tirar foto agora</span>
                <span className="block text-xs text-slate-400 font-normal">Usar a câmera do seu celular</span>
              </div>
            </button>

            {/* Opção 2: Galeria de Arquivos */}
            <button
              type="button"
              onClick={() => {
                galeriaInputRef.current?.click();
              }}
              className="w-full py-3.5 px-4 bg-[#F5F9FC] hover:bg-blue-50 active:scale-98 rounded-2xl flex items-center gap-3.5 text-[#092244] font-bold text-sm transition-all border border-slate-100 min-h-[50px] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2F80ED] flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left flex-1">
                <span className="block text-[15px] font-extrabold">Escolher da galeria</span>
                <span className="block text-xs text-slate-400 font-normal">Selecionar arquivo de imagem</span>
              </div>
            </button>

            {/* Botão Cancelar */}
            <button
              type="button"
              onClick={() => setSheetOrigemAberta(false)}
              className="w-full py-3 rounded-full text-slate-500 hover:text-slate-700 font-bold text-sm min-h-[44px] cursor-pointer mt-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
