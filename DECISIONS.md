# Registos de Decisões de Arquitetura (ADR)

## Decisão 1: Migrar para Monorepo com NPM Workspaces

**Data:** 2026-01-07

**Decisão:**
Reestruturar o projeto para usar **NPM Workspaces**, tratando `backend`, `web` e `shared` como pacotes interligados no mesmo repositório.

**Motivo:**
O projeto depende de lógica compartilhada (`quotationLogic.ts`) crítica para o negócio (dinheiro).
Atualmente, usamos imports relativos (`../../shared`) que funcionam na máquina local mas frequentemente falham em ambientes de produção (Vercel/Docker) porque o contexto de build se perde.
Além disso, precisamos garantir que o Frontend e o Backend usem *exatamente* a mesma fórmula de preço.

**Alternativas consideradas:**
1.  **Status Quo (Pastas soltas):** Manter como está.
    *   *Problema:* Risco alto de falha de build no deploy e dificuldade de gerenciar dependências.
2.  **Duplicação de Código (Copy-Paste):** Copiar a lógica de cotação para ambos os projetos.
    *   *Problema:* Risco gravíssimo de divergência de negócio. Se alterarmos o preço no Back e esquecermos no Front, o cliente vê um valor errado.
3.  **Packages Publicados:** Publicar `@puculuxa/shared` no NPM privado.
    *   *Problema:* Overengineering/custo desnecessário para este estágio.

**Risco aceito:**
Introduzimos uma estrutura de `root` que exige rodar comandos de instalação na raiz (`npm install` no topo). Aceitamos o risco de uma leve complexidade adicional na configuração do CI/CD em troca de integridade de dados e builds confiáveis.

**Quando revisar:**
Se o tempo de build do projeto se tornar um gargalo ou se sentirmos necessidade de cacheamento remoto de builds (neste caso, avaliar migração para **Turborepo**).

## Decisão 2: Unificação de Design System (UX/UI)

**Data:** 2026-01-07

**Decisão:**
Criar e adotar um **Design System Mínimo** (Tokens de Cores, Tipografia, Espaçamento) compartilhado via `@puculuxa/shared`, e forçar seu uso tanto no React (Web) quanto no React Native (Mobile).

**Motivo:**
O problema de negócio é a **Desconexão de Marca**. Se o cliente vê um botão "Laranja" no site e "Vermelho" no app, a percepção de qualidade cai.
Tecnicamente, duplicar estilos (CSS vs StyleSheet) gerou débito técnico.
Centralizar os "Tokens" garante que uma mudança de branding se propague instantaneamente.

**Alternativas consideradas:**
1.  **Estilos Hardcoded:** Rápido para protótipo, insustentável para produto. (Descartado).
2.  **Bibliotecas UI Distintas:** Usar ShadcnUI (Web) e Paper (Mobile) sem, padronização. (Risco de inconsistência alto).

**Risco aceito:**
Investir tempo agora organizando "Tokens" em vez de entregar telas prontas. O "Product Owner" pode achar que o desenvolvimento visual está lento no início.

**Quando revisar:**
Se a complexidade de converter estilos Web (CSS) para Mobile (StyleSheet) se tornar maior que o benefício da consistência.

## Decisão 4: Estratégia de Performance (Preloading & Server Actions)

**Data:** 2026-01-07

**Decisão:**
Priorizar **Server Components** para fetch de dados (reduzindo JS no cliente) e implementar **Otimização de Imagens** agressiva (WebP/AVIF via Cloudinary ou Next/Image).

**Motivo:**
Conectividade instável em alguns mercados (Angola). Carregar megabytes de JSON destrói a conversão.

**Alternativas consideradas:** SPA Tradicional, GraphQL.

**Risco aceito:** Maior complexidade de tipagem.

**Quando revisar:** Se a interatividade do dashboard for prejudicada.

## Decisão 5: Correção de Expo/Metro no Windows (`node:sea`)

**Data:** 2026-01-07

**Decisão:**
Desativar os shims de "externals" do Expo via variável de ambiente `EXPO_METRO_EXTERNALS=0` diretamente no `package.json`.

**Motivo:**
O CLI do Expo 50+ tenta criar uma pasta chamada `node:sea` dentro de `.expo`. No Windows, o caractere `:` é reservado para identificadores de drive e fluxos, tornando impossível criar tal pasta. Isso causa o erro `ENOENT` e bloqueia o desenvolvimento. Configurações no `metro.config.js` não resolvem porque o erro ocorre antes do Metro ser carregado.

**Alternativas consideradas:**
1.  **Patchear o node_modules:** Frágil e difícil de manter.
2.  **Migrar para WSL2:** Exige configuração complexa do ambiente.

**Risco aceito:**
Pollyfills de Node.js (como `crypto` ou `fs` nativo do Node) não funcionarão no mobile se importados via prefixo `node:`. Como o projeto usa bibliotecas específicas de React Native (`AsyncStorage`, `expo-font`), não há impacto.

**Quando revisar:**
Quando o Expo CLI for atualizado para escapar caracteres especiais em nomes de pastas no Windows.


