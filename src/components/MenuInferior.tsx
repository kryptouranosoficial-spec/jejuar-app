/**
 * @file MenuInferior.tsx
 * @description Barra de navegação inferior global (Bottom Navigation Bar) do aplicativo Jejuar.
 * Contém 5 abas padronizadas: Jejum, Plano, Aprender, Receitas e Eu (Perfil).
 * Respeita a identidade visual, zonas de toque mínimas de 48px e suporte à Safe Area inferior.
 */

import React from 'react';
import { 
  Flame, 
  ClipboardList, 
  ClipboardCheck, 
  Compass, 
  User as UserIcon 
} from 'lucide-react';

/** Tipagem de abas disponíveis no aplicativo */
export type AbaNavegacao = 'jejum' | 'plano' | 'exames' | 'jornada' | 'receitas' | 'eu' | 'aprender';

interface ItemAbaConfig {
  id: AbaNavegacao;
  rotulo: string;
  Icone: React.ComponentType<{ className?: string }>;
}

/** Configuração padronizada dos itens de menu */
const ITENS_MENU: ItemAbaConfig[] = [
  { id: 'jejum', rotulo: 'Jejum', Icone: Flame },
  { id: 'plano', rotulo: 'Plano', Icone: ClipboardList },
  { id: 'exames', rotulo: 'Exames', Icone: ClipboardCheck },
  { id: 'jornada', rotulo: 'Jornada', Icone: Compass },
  { id: 'eu', rotulo: 'Eu', Icone: UserIcon },
];

interface MenuInferiorProps {
  /** Aba atualmente selecionada */
  abaAtiva: AbaNavegacao;
  /** Callback acionado ao tocar em uma aba */
  onMudarAba: (aba: AbaNavegacao) => void;
}

export const MenuInferior: React.FC<MenuInferiorProps> = ({
  abaAtiva,
  onMudarAba,
}) => {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-white border-t border-slate-100 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      data-purpose="bottom-navigation-bar"
    >
      <nav 
        className="flex items-center justify-around h-16 px-2"
        role="navigation"
        aria-label="Navegação inferior principal"
      >
        {ITENS_MENU.map(({ id, rotulo, Icone }) => {
          const estaAtivo = abaAtiva === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onMudarAba(id)}
              aria-label={`Ir para a seção ${rotulo}`}
              aria-current={estaAtivo ? 'page' : undefined}
              className={`flex flex-col items-center flex-1 gap-1 min-h-[48px] justify-center transition-colors select-none active:scale-95 ${
                estaAtivo 
                  ? 'text-[#00C975]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icone className={`w-5 h-5 transition-transform duration-200 ${estaAtivo ? 'scale-110' : ''}`} />
              <span className={`text-[11px] ${estaAtivo ? 'font-extrabold' : 'font-medium'}`}>
                {rotulo}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
