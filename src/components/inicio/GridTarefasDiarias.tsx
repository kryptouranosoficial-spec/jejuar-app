/**
 * @file GridTarefasDiarias.tsx
 * @description Cards das tarefas diárias essenciais do aplicativo Jejuar:
 * 1. Água: Contador interativo com atalho rápido de +250ml e abertura do rastreador.
 * 2. Peso: Sincronizado dinamicamente com as respostas de peso do onboarding e atalho para os Dados Corporais.
 */

import React from 'react';
import { Plus, Droplet, Scale } from 'lucide-react';

interface GridTarefasDiariasProps {
  aguaConsumida: number;
  metaAgua?: number;
  onAdicionarAgua: () => void;
  onAbrirRastreadorAgua?: () => void;
  pesoAtual: number;
  pesoDesejado: number;
  onAbrirDadosCorporais: () => void;
}

export const GridTarefasDiarias: React.FC<GridTarefasDiariasProps> = ({
  aguaConsumida,
  metaAgua = 2500,
  onAdicionarAgua,
  onAbrirRastreadorAgua,
  pesoAtual,
  pesoDesejado,
  onAbrirDadosCorporais,
}) => {
  return (
    <section 
      className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3 select-none" 
      data-purpose="daily-tasks-card"
    >
      <h3 className="text-[19px] sm:text-[20px] font-extrabold text-[#092244]">
        Tarefa diária
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Água Interativa (Clique abre tela cheia, botão + adiciona 250ml) */}
        <div 
          onClick={onAbrirRastreadorAgua}
          className="bg-[#F0F6FF] hover:bg-[#E5F1FC] active:scale-95 transition-all rounded-2xl p-3.5 flex flex-col justify-between h-[152px] border border-blue-50/50 hover:border-blue-200 shadow-xs cursor-pointer select-none" 
          data-purpose="water-tracker"
          role="button"
          tabIndex={0}
          title="Abrir Rastreador de Água"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAbrirRastreadorAgua?.();
            }
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[15px] text-[#092244]">Água</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Evita abrir a tela ao tocar no botão rápido de mais
                onAdicionarAgua();
              }}
              title="Adicionar 250ml"
              aria-label="Adicionar 250ml de água"
              className="w-6 h-6 rounded-full bg-blue-200/70 hover:bg-blue-300 flex items-center justify-center text-[#2F80ED] active:scale-90 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          <div className="flex justify-center">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shadow-xs">
              <Droplet className="w-5 h-5 text-[#2F80ED] fill-[#2F80ED]" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-black text-[#092244] leading-tight">{aguaConsumida}</p>
            <p className="text-[11px] font-semibold text-gray-500">/ {metaAgua} ml</p>
          </div>
        </div>

        {/* Card 2: Peso Dinâmico */}
        <div 
          onClick={onAbrirDadosCorporais}
          className="bg-[#EEFAF7] hover:bg-[#E3F8F2] active:scale-95 transition-all rounded-2xl p-3.5 flex flex-col justify-between h-[152px] border border-emerald-50/50 hover:border-emerald-200 shadow-xs cursor-pointer select-none" 
          data-purpose="weight-tracker"
          title="Abrir Dados Corporais e Registrar Peso"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAbrirDadosCorporais();
            }
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[15px] text-[#092244]">Peso</span>
            <span className="text-[10px] font-bold text-[#00C975] bg-white px-1.5 py-0.5 rounded-full shadow-2xs">Ver</span>
          </div>

          <div className="flex justify-center">
            <div className="w-11 h-11 rounded-full bg-[#DAF4ED] flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5 text-[#00C975]" strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-black text-[#092244] leading-tight">{pesoAtual.toFixed(1)} kg</p>
            <p className="text-[11px] font-semibold text-gray-500">/ {pesoDesejado.toFixed(1)} kg</p>
          </div>
        </div>
      </div>
    </section>
  );
};
