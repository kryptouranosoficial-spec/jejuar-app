/**
 * @file CardClassificacaoImc.tsx
 * @description Card científico de classificação do Índice de Massa Corporal (IMC) com as 5 silhuetas
 * corporais e régua gradiente segmentada com ponteiro dinâmico.
 * Baseado estritamente na imagem de referência fornecida pelo usuário:
 * - Título: "IMC atual=27.2" com ícone de ajuda "?".
 * - Subtítulo: "Excesso de peso" destacado na cor correspondente.
 * - 5 Silhuetas corporais vetoriais representando cada biotipo de composição corporal.
 * - Barra gradiente de cores com indicador posicionado no IMC e marcas numéricas 15, 18.5, 25, 30, 35, 40.
 */

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface CardClassificacaoImcProps {
  imc?: number;
  alturaCm?: number;
  pesoKg?: number;
  onAbrirExplicacao?: () => void;
}

export const CardClassificacaoImc: React.FC<CardClassificacaoImcProps> = ({
  imc = 27.2,
  onAbrirExplicacao,
}) => {
  const [modalExplicacaoAberto, setModalExplicacaoAberto] = useState(false);

  // Determina a classificação e a cor semântica baseada no IMC
  const dadosClassificacao = React.useMemo(() => {
    if (imc < 18.5) {
      return {
        rotulo: 'Abaixo do peso',
        corTexto: 'text-sky-500',
        corAnel: 'border-sky-400',
        faixaAtiva: 0,
        descricao: 'Seu IMC indica peso abaixo do recomendado. Foque em nutrição densa e ganho de massa magra.',
      };
    }
    if (imc < 25.0) {
      return {
        rotulo: 'Peso normal',
        corTexto: 'text-emerald-500',
        corAnel: 'border-emerald-400',
        faixaAtiva: 1,
        descricao: 'Parabéns! Sua faixa de peso está dentro dos padrões ideais de saúde e longevidade.',
      };
    }
    if (imc < 30.0) {
      return {
        rotulo: 'Excesso de peso',
        corTexto: 'text-amber-500',
        corAnel: 'border-amber-400',
        faixaAtiva: 2,
        descricao: 'Você está na faixa de sobrepeso. O jejum intermitente ajudará na queima sustentável de gordura.',
      };
    }
    if (imc < 35.0) {
      return {
        rotulo: 'Obesidade Grau I',
        corTexto: 'text-orange-500',
        corAnel: 'border-orange-400',
        faixaAtiva: 3,
        descricao: 'Atenção aos marcadores de saúde. A autofagia e a disciplina alimentar trarão grandes benefícios.',
      };
    }
    return {
      rotulo: 'Obesidade Severa',
      corTexto: 'text-rose-500',
      corAnel: 'border-rose-400',
      faixaAtiva: 4,
      descricao: 'Recomenda-se acompanhamento médico aliado ao jejum para reversão metabólica.',
    };
  }, [imc]);

  // Calcula a posição percentual do ponteiro na barra de 15 a 40
  const porcentagemPonteiro = React.useMemo(() => {
    const min = 15;
    const max = 40;
    const valorLimitado = Math.max(min, Math.min(max, imc));
    return ((valorLimitado - min) / (max - min)) * 100;
  }, [imc]);

  // Ícone SVG padronizado de silhueta corporal com proporções anatômicas
  const renderSilhuetaCorporal = (indice: number) => {
    const estaAtivo = dadosClassificacao.faixaAtiva === indice;
    
    // Cores de cada biotipo
    const cores = [
      { fill: estaAtivo ? '#38BDF8' : '#BAE6FD', stroke: estaAtivo ? '#0284C7' : '#7DD3FC' }, // Abaixo
      { fill: estaAtivo ? '#10B981' : '#A7F3D0', stroke: estaAtivo ? '#059669' : '#6EE7B7' }, // Normal
      { fill: estaAtivo ? '#F59E0B' : '#FDE68A', stroke: estaAtivo ? '#D97706' : '#FCD34D' }, // Excesso (Ativo na ref)
      { fill: estaAtivo ? '#F97316' : '#FED7AA', stroke: estaAtivo ? '#EA580C' : '#FDBA74' }, // Obesidade I
      { fill: estaAtivo ? '#EF4444' : '#FECACA', stroke: estaAtivo ? '#DC2626' : '#FCA5A5' }, // Obesidade Severa
    ];

    const escalaLargura = [0.85, 0.95, 1.1, 1.25, 1.45][indice] || 1;
    const cor = cores[indice];

    return (
      <div 
        key={indice} 
        className={`flex flex-col items-center justify-end h-20 transition-all duration-300 ${
          estaAtivo ? 'scale-110 -translate-y-1' : 'opacity-70 hover:opacity-100'
        }`}
      >
        <svg 
          viewBox="0 0 40 70" 
          className="h-16 w-auto overflow-visible"
        >
          {/* Cabeça */}
          <circle cx="20" cy="10" r="6" fill={cor.fill} />
          {/* Tronco e Braços */}
          <ellipse 
            cx="20" 
            cy="27" 
            rx={6 * escalaLargura} 
            ry="11" 
            fill={cor.fill} 
          />
          {/* Quadril */}
          <ellipse 
            cx="20" 
            cy="40" 
            rx={7 * escalaLargura} 
            ry="7" 
            fill={cor.fill} 
          />
          {/* Pernas */}
          <rect 
            x={15 - (escalaLargura - 1) * 2} 
            y="43" 
            width={3 * escalaLargura} 
            height="22" 
            rx="1.5" 
            fill={cor.fill} 
          />
          <rect 
            x={22 + (escalaLargura - 1) * 2} 
            y="43" 
            width={3 * escalaLargura} 
            height="22" 
            rx="1.5" 
            fill={cor.fill} 
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4 select-none">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-[#0B2246] tracking-tight">
          IMC atual={imc.toFixed(1)}
        </h3>
        <button
          type="button"
          onClick={() => {
            if (onAbrirExplicacao) onAbrirExplicacao();
            else setModalExplicacaoAberto(true);
          }}
          aria-label="O que é o IMC?"
          className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Subtítulo Semântico Colorido */}
      <div className="-mt-1">
        <span className={`text-base font-extrabold ${dadosClassificacao.corTexto}`}>
          {dadosClassificacao.rotulo}
        </span>
      </div>

      {/* As 5 Silhuetas Corporais */}
      <div className="flex items-end justify-between px-2 pt-1 pb-2">
        {[0, 1, 2, 3, 4].map((i) => renderSilhuetaCorporal(i))}
      </div>

      {/* Régua Gradiente Segmentada de IMC com Ponteiro Indicador */}
      <div className="relative pt-1 pb-1">
        {/* Barra Gradiente com Cantos Arredondados */}
        <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 shadow-2xs">
          <div className="h-full bg-sky-400" style={{ width: '14%' }} />       {/* < 18.5 */}
          <div className="h-full bg-emerald-400" style={{ width: '26%' }} />   {/* 18.5 - 25 */}
          <div className="h-full bg-amber-400" style={{ width: '20%' }} />     {/* 25 - 30 */}
          <div className="h-full bg-orange-400" style={{ width: '20%' }} />    {/* 30 - 35 */}
          <div className="h-full bg-rose-400" style={{ width: '20%' }} />      {/* 35 - 40 */}
        </div>

        {/* Ponteiro Circular Branco com Anel na Cor da Categoria */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out pointer-events-none"
          style={{ left: `${porcentagemPonteiro}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-md border-2 border-amber-400 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        </div>

        {/* Marcas Numéricas Abaixo da Barra (15, 18.5, 25, 30, 35, 40) */}
        <div className="flex justify-between text-[11px] font-medium text-slate-400 pt-2 px-0.5">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>35</span>
          <span>40</span>
        </div>
      </div>

      {/* Modal Educativo Simples do IMC se acionado */}
      {modalExplicacaoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl space-y-3">
            <h4 className="text-base font-bold text-[#0B2246]">Entenda o seu IMC</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              O Índice de Massa Corporal (IMC) é uma métrica da Organização Mundial da Saúde baseada no peso e altura:
            </p>
            <ul className="text-xs space-y-1 text-slate-500">
              <li>• <strong className="text-sky-600">Abaixo de 18.5:</strong> Abaixo do peso</li>
              <li>• <strong className="text-emerald-600">18.5 a 24.9:</strong> Peso ideal / normal</li>
              <li>• <strong className="text-amber-600">25.0 a 29.9:</strong> Excesso de peso</li>
              <li>• <strong className="text-orange-600">30.0 a 34.9:</strong> Obesidade Grau I</li>
              <li>• <strong className="text-rose-600">35.0+:</strong> Obesidade Severa</li>
            </ul>
            <button
              type="button"
              onClick={() => setModalExplicacaoAberto(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#00C975] text-white font-bold text-xs shadow-sm active:scale-95 cursor-pointer mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
