---
description: Prompt de Nível Absoluto — Guia Mestre de Produto, Arquitectura e Implementação da Puculuxa
---

# PUCULUXA — PROMPT DE NÍVEL ABSOLUTO
## Product Strategist · Principal Engineer · Systems Architect · Growth Designer

> "Se removeres todas as animações e a app continuar a parecer premium — então és premium."
> Premium não é estética. Premium é previsibilidade + confiança + controlo.

---

## PARTE 0 — ESTRATÉGIA DE PRODUTO

### 0.1 — ICP (Ideal Customer Profile)

**Perfil A — "A Maria" (B2C, PRIORITÁRIO)**
- Mulher, 28-45 anos, Luanda, rendimento médio-alto
- 1-3 eventos/ano: aniversários, casamentos, baptizados
- Decide por confiança, não por preço
- Canal: WhatsApp + Instagram + boca-a-boca
- Dor: incerteza ("não sei quanto vai custar", "não sei se vai ficar bem")
- Métrica: confiança + clareza + speed-to-response

**Perfil B — "O Gestor" (B2B, SECUNDÁRIO)**
- Empresas, hotéis, escritórios em Luanda
- 4-12 eventos/ano corporativos
- Dor: imprevisibilidade e falta de documentação
- Métrica: consistência + fatura + pontualidade

**A app serve a Maria primeiro. O Gestor é fase 2.**

### 0.2 — North Star Metric

> **Orçamentos submetidos por semana que se convertem em pedido confirmado nas 48h seguintes**

Tudo — cada ecrã, cada copy, cada animação, cada endpoint — serve esta métrica ou é ruído.

### 0.3 — Funil de Conversão

```
Instalação → Registo (máx 3 campos) → Descoberta (Home→Detail)
→ Intenção ("Pedir Orçamento") → ← PONTO DE MAIOR ABANDONO
→ Wizard completo + submetido ← FOCO MÁXIMO
→ Confirmação WhatsApp (< 2h) → Pedido + depósito
→ Produção + acompanhamento → Entrega + avaliação → Recompra (60 dias)
```

### 0.4 — Hipóteses de Crescimento

| Hipótese | Mecanismo | KPI |
|---|---|---|
| Preço estimado em tempo real no wizard | Reduz incerteza | Taxa de conclusão do wizard |
| Sugerir extras por tipo de evento | Upsell automático | Ticket médio |
| Notificação "bolo em preparação" 48h antes | Confiança → NPS | NPS / reviews |
| "X orçamentos esta semana" na Home | Prova social | Taxa abertura wizard |
| Programa lealdade 3 níveis | Recorrência | Pedidos 2ª compra / 60d |

### 0.5 — Métricas de Saúde

```
Conversão:     orçamentos submetidos / sessões wizard  → meta: > 60%
Activação:     registo / instalação                     → meta: > 70%
Retenção D30:  activos 30d após registo                 → meta: > 35%
Ticket médio:  valor médio orçamento                    → meta: +5%/mês
Response time: orçamento → 1ª resposta admin             → meta: < 2h
```

---

## PARTE 1 — BUGS CRÍTICOS (resolver ANTES de tudo)

### BUG 1 — guestCount fica branco ao escrever
Estado local isolado do formData para input numérico:
```js
const [guestInput, setGuestInput] = React.useState(
  formData.guestCount ? String(formData.guestCount) : ''
);
<TextInput value={guestInput} onChangeText={(text) => {
  const digits = text.replace(/[^0-9]/g, '');
  setGuestInput(digits);
  setFormData(prev => ({ ...prev, guestCount: digits }));
}} keyboardType="number-pad" placeholder="Ex: 50" maxLength={4} />
```

### BUG 2 — Seletor de data abre lista em vez de calendário
Usar `@react-native-community/datetimepicker` com `Platform.OS` para iOS/Android:
```bash
npx expo install @react-native-community/datetimepicker
```
Botão → DateTimePicker nativo, minimumDate = amanhã, locale="pt-PT"

### BUG 3 — `atob()` não existe no Hermes
Substituir por decoder manual de base64 em `authStore.js` — função `decodeJwtPayload(token)` sem dependências externas.

---

## PARTE 2 — BACKEND: ARQUITECTURA LIMPA

### Estrutura de Domínio (NestJS Clean Architecture)
```
backend/src/
├── modules/
│   ├── auth/        # JWT, refresh tokens, reset password
│   ├── users/       # Perfis, endereços, nível de lealdade
│   ├── products/    # Catálogo, categorias, upload imagens
│   ├── quotations/  # Orçamentos, cálculo, PDF, status
│   ├── orders/      # Pedidos, estados, timeline, itens
│   ├── feedback/    # Avaliações 1-5, respostas admin
│   ├── notifications/ # Push (Expo), WhatsApp (futuro)
│   └── analytics/   # Dashboard, métricas, endpoint público
├── common/
│   ├── decorators/  # @CurrentUser(), @Public(), @Roles()
│   ├── guards/      # JwtAuthGuard, RolesGuard
│   ├── interceptors/ # Logging, Transform
│   ├── filters/     # AllExceptionsFilter (global)
│   └── utils/       # pagination, formatters
└── prisma/
```

### Regras de Backend Obrigatórias
- **Filtro de Excepções Global**: nunca expor erros técnicos ao cliente. Log erros 500+ em Sentry.
- **Rate Limiting**: global 100/min, auth 10/min, upload 5/min, quotation 20/min.
- **Rotação de Refresh Tokens**: token usado = invalidado + novo par emitido. Token inválido = invalidar TODOS.
- **Health Check**: `GET /health` sem auth — status, DB, timestamp, uptime.
- **Analytics Público**: `GET /analytics/public` sem auth — contadores não sensíveis (prova social).
- **DTOs com Validação Estrita**: class-validator obrigatório em TODOS os endpoints. Sem excepções.
- **Índices Prisma**: `@@index` em todas as FK usadas em filtros e ordenação.

---

## PARTE 3 — SISTEMA DE DESIGN

### Princípio Central
> **Luxo é espaço, ritmo e contenção — não movimento constante.**

Cada animação justifica-se por: guiar atenção, confirmar acção, ou manter contexto. Se nenhuma → remover.

### Design Tokens (`shared/tokens.ts`)
```
Primary: #FF8C42 (laranja), Secondary: #8BAE3E (verde), Gold: #FFD700
Background: #FFFEF7, Surface: #FFF8E1, Border: #F0EDE3
Text: Hero #1A1209, Primary #3D3020, Secondary #8D8174
Semânticas: Success #4CAF50, Warning #FF9800, Error #F44336, Info #2196F3
```

### Tipografia (`mobile/src/theme/typography.js`)
```
brand:     Pacifico 32px      h1: Merriweather Bold 28px
h2:        Merriweather 22px   h3: Poppins SemiBold 18px
body:      Poppins 15px        bodySmall: Poppins 13px
label:     Poppins SemiBold 11px UPPERCASE
price:     Merriweather Bold 20px laranja
priceLarge: Merriweather Bold 34px laranja
```

---

## PARTE 4 — COMPONENTES BASE

- **PremiumButton**: variantes primary|secondary|ghost|danger|gold, tamanhos sm|md|lg, press scale 0.97 spring, haptic expo-haptics, loading ActivityIndicator
- **PremiumInput**: label flutuante animada, borda anima ao focar, erro slide-down, validação ícone check verde
- **Toast Global**: success|error|warning|info|brand, entrada spring, saída timing, 3500ms, máx 2 simultâneos, haptic por tipo
- **Skeleton com Shimmer**: LinearGradient animado horizontal loop 1400ms, cores #F5EFE0→#EDE5D0→#F5EFE0
- **ErrorBoundary**: class component, UI fallback amigável, botão "Tentar novamente", Sentry em prod

---

## PARTE 5 — FIABILIDADE

- **Mensagens de Erro Humanizadas**: `errorMessages.js` com mapa de traduções user-facing
- **Offline Queue para Orçamentos**: guardar em AsyncStorage → reenviar via NetInfo listener
- **Retry Automático**: 3 tentativas com backoff exponencial, só para 5xx e erros de rede (nunca 4xx)

---

## PARTE 6 — NAVEGAÇÃO

### Tab Navigator Autêntico
```
AuthStack (Splash→Login→Register) quando !isAuthenticated
AppTabs quando isAuthenticated:
  Tab Início (Home→ProductDetail)
  Tab Catálogo (Catalog→ProductDetail)
  Tab Orçamento ← CTA central elevado 12px, círculo gradiente laranja
  Tab Pedidos (OrderHistory)
  Tab Perfil (Profile→EditProfile→Favorites)
```

### CustomTabBar
Botão central sobressaído 12px, ícone activo preenchido + bolinha 4px, inactivo outline + cinza.

---

## PARTE 7 — ECRÃS

### SplashScreen
Gradiente estático, "Puculuxa" spring scale, subtítulo fade 300ms, tagline fade 600ms, barra progresso 2200ms. Navegar 2800ms. Sem partículas.

### HomeScreen
Header gradiente 210px com saudação por hora. Pesquisa pill. Banner prova social (dados reais). Categorias pills horizontais. Grid FlatList 2 colunas optimizado. CTA flutuante "Pedir Orçamento".

### ProductDetailScreen
Hero 45% com expo-image. Rating só com dados reais (nunca inventar). Grid detalhes 2×2. "Outros nesta categoria" horizontal. Footer CTA gradiente.

### QuotationWizard (CORAÇÃO DO NEGÓCIO)
- Uma decisão por passo
- Barra de progresso contínua
- **Totalizador persistente no rodapé** em passos 2, 3 e 4: "Estimativa: Kz X.XXX"
- Passo 1: Cards visuais 2×2 tipo de evento
- Passo 2: Convidados −/+, DateTimePicker nativo, contacto pré-preenchido
- Passo 3: Extras com sugestões automáticas por tipo evento
- Passo 4: Resumo "recibo", total priceLarge, botão WhatsApp verde
- Contacto SEM login: campos inline, não redirecionar

### OrderHistoryScreen
Filtros pills scrolláveis. Cards expansíveis com LayoutAnimation. Empty state com CTA "Explorar Produtos".

### ProfileScreen
Avatar inicial sobre gradiente, badge lealdade (🌱/⭐/💎 por pedidos reais), mini-dashboard 3 métricas.

### LoginScreen
Copy "O sabor que cria memórias", PremiumInput, shake animation se erro.

### RegisterScreen (2 passos)
Passo 1: Nome+Email+Continuar. Passo 2: Tel+244, password com barra força, confirmar. Transição slide horizontal.

---

## PARTE 8 — INTELIGÊNCIA NO PRODUTO

### Sugestões Automáticas
```
casamento → SWEETS + DRINKS
aniversario → CUPCAKES
corporativo → SALTY + DRINKS
```
Badge "✨ Popular para este evento" — não pré-seleccionar.

### Totalizador Tempo Real
`calculateQuotation()` com `useMemo` — actualiza a cada mudança de convidados/extras.

### Diferenciação Cultural Angolana
```
Preços:    "Kz 12.500" (ponto milhar)
Datas:     "12 de Janeiro de 2026"
Telefone:  "+244 9XX XXX XXX"
Copy:      "pedido" não "solicitação", "orçamento" não "cotação"
WhatsApp:  canal principal (não email)
Status:    "Em Preparação" não "Processing"
```

---

## PARTE 9 — ACESSIBILIDADE (NÃO OPCIONAL)

- `accessibilityRole` + `accessibilityLabel` em TODOS os TouchableOpacity
- Toque mínimo 44×44px (hitSlop quando menor)
- Contraste mínimo 4.5:1 texto normal, 3:1 texto grande
- `accessibilityState={{ selected, disabled, busy }}`
- Não bloquear fontScale

---

## PARTE 10 — PERFORMANCE

```
expo-image              → substitui Image (cache + progressive)
React.memo              → ProductCard, OrderCard, CategoryPill, StatusBadge
useCallback             → handlers passados como props
useMemo                 → filteredProducts, categories, estimate
FlatList                → maxToRenderPerBatch:6, windowSize:5, removeClippedSubviews:true
SplashScreen.prevent    → preventAutoHideAsync → hideAsync após useFonts
staleTime produtos      → 5min, staleTime pedidos → 0
```

---

## PARTE 11 — VISÃO ESTRATÉGICA DOMINANTE

### Moat (Vantagem Defensável)
Para ser "infraestrutura digital dominante de catering em Luanda" (não apenas "app boa"):
- **Dados proprietários**: tipos de evento, ticket médio por bairro, datas pico, combos populares
- **Lock-in via recorrência**: lembrete automático 30d antes do aniversário do próximo ano
- **Efeito de rede**: avaliações reais → confiança → mais clientes → mais dados
- **Integração operacional**: sistema interno para cozinha, dashboard carga, CRM clientes

### Confiança Estrutural (não cosmética)
- Fotos reais de trabalhos anteriores
- Timeline de produção visível (Orçamento→Pagamento→Preparação→Decoração→Entrega)
- Política de reembolso transparente
- SLA interno: resposta < 2h

### Motor de Recompra
- Guardar data do evento
- Push 30d antes: "O aniversário da Sofia está a chegar. Repetir o bolo favorito?"
- Programa de fidelização agressivo (pontos + benefícios desbloqueáveis + oferta aniversário)

### Engine de Pricing Inteligente (futuro)
- Ajuste por proximidade da data, carga da cozinha, volume, sazonalidade
- Upsell personalizado por histórico

---

## ORDEM DE EXECUÇÃO

```
1.  BUG 1 + BUG 2 + BUG 3              → app funcional primeiro
2.  shared/tokens.ts + typography.js    → base visual
3.  PremiumButton + PremiumInput        → usados em todos os ecrãs
4.  Toast + Skeleton + ErrorBoundary    → infraestrutura UX
5.  authStore.js + api.js              → fiabilidade chamadas
6.  Tab Navigator + CustomTabBar       → navegação real
7.  SplashScreen                        → primeira impressão
8.  HomeScreen                          → descoberta + prova social
9.  QuotationWizard                     → coração do negócio
10. ProductDetailScreen                 → conversão individual
11. OrderHistoryScreen                  → retenção + confiança
12. ProfileScreen                       → identidade + lealdade
13. LoginScreen + RegisterScreen        → entrada fluida
14. Backend: DTOs + rate limiting + health + índices
15. Offline queue + retry strategy      → fiabilidade em campo
```

---

## CRITÉRIO DE ACEITAÇÃO FINAL

**Teste técnico:** Remove animações. Continua premium? Se não → volta à tipografia e espaçamento.

**Teste de produto:** A Maria submete orçamento em < 3 min, sem ajuda, com confiança no valor?

**Teste de negócio:** Ticket médio subiu com sugestões? Conclusão do wizard subiu com totalizador?

**Pergunta definitiva:** Qual é o plano para que, daqui a 3 anos, seja impossível abrir um evento relevante em Luanda sem passar pela Puculuxa?

---

*"Um produto premium não é o que tem mais. É o que não precisa de ter mais."*
*"Optimiza para a métrica norte. Todo o resto é vaidade."*
