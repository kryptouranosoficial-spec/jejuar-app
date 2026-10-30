# Módulo de Registro e Acompanhamento de Bioimpedância (Aba Exames)

Implementação do módulo clínico de bioimpedância no aplicativo **Jejuar**, substituindo a antiga aba "Aprender" no menu inferior por uma central completa de saúde corporal ("Exames") com dashboard de métricas, gráficos de evolução temporal (gordura, músculo e peso), histórico cronológico, cadastro/edição de laudos e meta de reteste periódico configurável.

---

### Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> As seguintes escolhas de arquitetura e interface foram definidas com base nas respostas do usuário e no laudo farmacêutico anexado:

- **Nomenclatura e Ícone na Barra Inferior**: A aba será intitulada **"Exames"**, utilizando o ícone de prancheta clínica (`ClipboardCheck` da biblioteca Lucide com strokeWidth de 1.75–2.0), substituindo a aba temporária "Aprender".
- **Ponto de Partida do Histórico**: A tela iniciará com **lista vazia** para cadastro manual personalizado pelo usuário, contando com um botão de ação rápida "Preencher com exemplo do meu laudo Drogasil (21/10/2026)" caso o usuário queira testar a visualização imediatamente com 1 clique.
- **Visualização de Evolução Comparativa**: Incorporação de **gráficos de linha de evolução temporal** para as três principais métricas corporais (Percentual de Gordura Corporal %, Massa Muscular Esquelética % e Peso em kg), acompanhados de cards de status com deltas de melhora/atenção entre os exames.
- **Periodicidade e Lembrete de Reteste**: Meta configurável de reteste (ex: a cada 30, 45, 60 ou 90 dias) com badge de contagem regressiva para a próxima bioimpedância no topo do dashboard.

---

## 1. Visão Geral & Proposta de Valor

- **O que faz**: Permite que o praticante de jejum intermitente cadastre os resultados completos de suas avaliações de bioimpedância (realizadas em farmácias como Drogasil, consultórios de nutricionistas, médicos ou academias), armazenando parâmetros vitais e acompanhando visualmente a queima de gordura visceral, ganho de massa magra e redução do percentual de gordura corporal.
- **Público-Alvo**: Praticantes de jejum intermitente e adeptos de hábitos saudáveis que buscam dados objetivos de recomposição corporal além da balança comum.
- **Diferencial Clínico**: Classificação automática dos resultados (Baixo, Normal, Alto, Muito Alto) calculada em tempo real com base na idade e no sexo biológico do usuário cadastrado, replicando as faixas oficiais da Sociedade Brasileira de Imunologia (SBIM) e Anvisa presentes no laudo de referência.

---

## 2. Experiência do Usuário & Design Visual

### 2.1 Fluxos Principais do Usuário

1. **Dashboard de Exames (Visão Principal da Aba)**:
   - **Cabeçalho com Alerta de Periodicidade**: Card compacto informando o status do próximo exame (ex: *"Próxima bioimpedância sugerida em 23 dias · Ciclo de 30 dias"*) com botão de atalho para registrar novo exame ou alterar a frequência.
   - **Métricas Atuais de Destaque**: Cards da medição mais recente exibindo Gordura Corporal (%), Músculo Esquelético (%), Gordura Visceral e Taxa Metabólica Basal com chips semânticos de referência (Normal, Alto, etc.).
   - **Gráficos de Evolução Interativa**: Seletor de visualização em abas segmentadas (`Gordura Corporal %` | `Músculo Esquelético %` | `Peso kg`) renderizando curvas temporais elegantes em SVG nativo responsivo, com pontos clicáveis para ver a data e o valor exato.
   - **Feed Cronológico de Histórico**: Lista de cartões de exames anteriores ordenados do mais recente para o mais antigo, com data formatada, local (ex: Drogasil), métricas-resumo, indicador de variação (delta $\pm$) e botões de ação (Ver Detalhes, Editar, Excluir).
   - **Estado Vazio Convidativo**: Caso nenhum exame tenha sido cadastrado ainda, exibe uma ilustração acolhedora, explicação do benefício de acompanhar a bioimpedância e dois botões primários: *"Cadastrar Primeiro Exame"* e *"Testar com Laudo Drogasil"*.

2. **Modal / Tela de Cadastro e Edição de Bioimpedância**:
   - **Campos Obrigatórios com Máscaras e Teclados Nativos**:
     - **Data do Exame**: Input formatado `DD/MM/AAAA` com atalho para "Hoje".
     - **Local / Estabelecimento**: Campo de texto com sugestões rápidas (`Drogasil`, `Academia`, `Nutricionista`, `Clínica`).
     - **Peso (kg)**: Teclado numérico, formato `XX,XX kg`.
     - **Altura (m)**: Auto-preenchida do perfil do usuário (`1,63 m`), editável.
     - **IMC**: Calculado automaticamente a partir do peso e altura, permitindo ajuste manual.
     - **Gordura Corporal (% PGC)**: Teclado numérico com 1 casa decimal (ex: `31,7%`).
     - **Músculo Esquelético (% Massa Magra)**: Teclado numérico (ex: `29,9%`).
     - **Gordura Visceral**: Nível numérico inteiro (1 a 30, ex: `13`).
     - **Taxa Metabólica Basal (Kcal)**: Teclado numérico inteiro (ex: `1581 Kcal`).
     - **Idade Corporal (anos)**: Campo numérico opcional (ex: `52 anos`).
     - **Observações / Recomendações Clínicas**: Área de texto para anotações do profissional.
   - **Zonas de Toque & Acessibilidade**: Botões e inputs com altura mínima de 48px, rótulos claros e mensagens de validação humanizadas em português do Brasil.
   - **Ações no Rodapé Seguro**: Botão *"Salvar Exame"* com estados visuais completos (Normal $\to$ Salvando com spinner $\to$ Sucesso esmeralda). Na edição, inclui botão secundário *"Excluir Exame"*.

3. **Modal de Confirmação Profissional de Exclusão**:
   - Alerta visual com variante perigo (`rose-600`), mensagem transparente de confirmação e ações: *"Cancelar"* ou *"Sim, Excluir"*.

4. **Modal de Detalhes do Exame (Visualizador do Laudo)**:
   - Exibição organizada em seções idênticas ao laudo original:
     - Bloco de Resultados Primários.
     - Régua de Classificação Clínica (indicando visualmente onde o paciente está posicionado entre Baixo, Normal, Alto e Muito Alto).
     - Comparação com o exame imediatamente anterior (delta verde para melhora e âmbar para atenção).

---

## 3. Decisões de Produto & Arquitetura Técnica

### 3.1 Diagrama do Sistema e Fluxo de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MenuInferior (Barra Global)                     │
│    [Jejum]      [Plano]      [Exames (Novo)]      [Receitas]    [Eu]   │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │ abaAtiva === 'exames'
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BioimpedanciaDashboardScreen                       │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Card Lembrete de Ciclo (Ex: Reteste a cada 30 dias / Falta X dias) │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ Card Último Resultado + Classificação SBIM/Anvisa                  │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ GraficoEvolucaoBioimpedancia (SVG Interativo: % Gordura / Músculo) │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ ListaHistoricoExames (Cards com Ações: Detalhes, Editar, Excluir)  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│      │                                                    │            │
│      ▼ [Abrir Cadastro/Edição]                            ▼ [Excluir]  │
│ ┌───────────────────────────────┐           ┌────────────────────────┐ │
│ │ ModalCadastroBioimpedancia    │           │ ModalConfirmacao       │ │
│ │ - Formatação de Data DD/MM    │           │ - Confirmação dupla    │ │
│ │ - Teclados numéricos nativos  │           │ - Feedback humanizado  │ │
│ │ - Cálculo de IMC automático   │           └────────────────────────┘ │
│ └───────────────┬───────────────┘                                      │
└─────────────────┼──────────────────────────────────────────────────────┘
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Camada de Persistência Híbrida & Resiliente               │
│  - Firestore: Coleção 'usuarios/{userId}/bioimpedancias'               │
│  - LocalStorage Fallback: 'jejuar_bioimpedancias_{userId}'             │
│  - Sincronização automática com estado de peso do perfil               │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Estrutura da Tipagem (`src/types/bioimpedancia.ts`)

```typescript
export interface RegistroBioimpedancia {
  id: string;
  usuarioId: string;
  dataExame: string; // Formato YYYY-MM-DD
  horaExame?: string; // Formato HH:mm
  local: string; // Ex: "Drogasil Lauro de Freitas" ou "Clínica Vida"
  pesoKg: number;
  alturaMetros: number;
  imc: number;
  gorduraCorporalPercentual: number; // % PGC
  musculoEsqueleticoPercentual: number; // % Músculo
  gorduraVisceralNivel: number; // 1 a 30
  taxaMetabolicaBasalKcal: number;
  idadeCorporalAnos?: number;
  observacoes?: string;
  criadoEm: string; // ISO Timestamp
  atualizadoEm?: string; // ISO Timestamp
}

export interface ConfiguracaoRetesteBioimpedancia {
  frequenciaDias: number; // 30, 45, 60, 90
  lembretesAtivos: boolean;
}
```

### 3.3 Regras de Classificação Clínica (SBIM / Anvisa / Omron)

Implementação pura e testada de função utilitária `classificarBioimpedancia()`:
- **IMC**: Baixo (< 18.5), Normal (18.5 - 24.9), Alto (25.0 - 29.9), Muito Alto ($\ge$ 30.0).
- **Gordura Visceral**: Normal ($\le$ 9), Alto (10 a 14), Muito Alto ($\ge$ 15).
- **Gordura Corporal & Músculo Esquelético**: Classificadas por faixas etárias (20-39, 40-59, 60-79) e sexo biológico (Masculino / Feminino), exatamente como na tabela de referência da página 1 do PDF.

---

## 4. Plano de Implementação Passo a Passo

1. **Passo 1: Tipagem & Funções Utilitárias de Bioimpedância**
   - Criar `src/types/bioimpedancia.ts` com as interfaces de dados.
   - Criar `src/utils/bioimpedanciaUtils.ts` contendo:
     - Funções de classificação clínica (IMC, gordura corporal, gordura visceral, músculo esquelético).
     - Formatação de datas em português (ex: "21 de outubro de 2026").
     - Cálculo de delta comparativo entre exames (ex: $\Delta -1.2\%$ gordura, $\Delta +0.8\%$ músculo).
     - Validação e máscaras para inputs numéricos e de data.
     - Dados do exame padrão de demonstração baseado no PDF da Drogasil (para uso opcional do usuário).

2. **Passo 2: Serviços de Persistência no Firestore & LocalStorage**
   - Em `src/services/firebase.ts` (ou `src/services/bioimpedanciaService.ts`), adicionar métodos seguros:
     - `salvarBioimpedancia(usuarioId, dados)`
     - `atualizarBioimpedancia(usuarioId, id, dados)`
     - `excluirBioimpedancia(usuarioId, id)`
     - `listarBioimpedancias(usuarioId)`
     - `salvarConfiguracaoReteste(usuarioId, config)`
   - Garantir fallback offline transparente em `localStorage` para navegação sem perda de dados.

3. **Passo 3: Componentes de Interface**
   - `GraficoEvolucaoBioimpedancia.tsx`: Visualizador de linha de evolução em SVG puro com gradiente suave, eixos temporais legíveis e tooltips ao tocar.
   - `ModalCadastroBioimpedancia.tsx`: Formulário completo com layout responsivo, máscaras, teclados numéricos e suporte aos modos de criação e edição.
   - `ModalDetalhesBioimpedancia.tsx`: Tela de leitura aprofundada com cards de status e régua de referência clínica.
   - `CardExameItem.tsx`: Item da lista de histórico com resumo das variações, menu de opções e toque seguro.
   - `BioimpedanciaScreen.tsx`: Tela principal do módulo (Dashboard, estatísticas consolidadas, seletor de gráficos, histórico e gatilho de novo exame).

4. **Passo 4: Atualização da Navegação Global**
   - Atualizar `src/components/MenuInferior.tsx` trocando o item `'aprender'` por `'exames'` com rótulo "Exames" e ícone `ClipboardCheck`.
   - Atualizar `src/components/InicioScreen.tsx` e `src/App.tsx` para renderizar `BioimpedanciaScreen` quando a aba ativa for `'exames'`, preservando 100% de integridade em todas as telas existentes (Timer, Plano, Água, Conquistas, etc.).

5. **Passo 5: Verificação & Compilação**
   - Executar compilação com `compile_applet` para validação rigorosa de sintaxe TypeScript e integridade visual.
