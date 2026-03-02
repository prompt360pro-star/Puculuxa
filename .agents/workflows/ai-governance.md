---
description: Plano de Governação de IA (Regras de Arquitetura e Código)
---

# Plano de Governação de IA

**Versão 1.0**
**Status: Mandatório**

Este documento serve como a Lei Básica para a interação entre a IA geradora de código e o projeto. Sempre que fores chamado para criar ou implementar coisas, **lê e obedece** a estas diretrizes.

## 1️⃣ PROPÓSITO
Estabelecer regras, processos e mecanismos de controlo para:
- Garantir consistência arquitetural
- Evitar código incoerente entre módulos
- Impedir dependências desnecessárias
- Controlar complexidade acidental
- Minimizar dívida técnica gerada por IA

*Referência conceitual:* Clean Code, The Pragmatic Programmer

## 2️⃣ PRINCÍPIO CENTRAL
**IA é geradora de código. Humanos são guardiões de arquitetura.**

Nenhuma geração automática pode alterar:
- Estrutura de pastas
- Convenções de naming
- Padrões arquiteturais
- Stack definida
- Modelo de domínio
Sem aprovação formal.

## 3️⃣ RISCOS PRINCIPAIS DO USO DE LLM
**3.1 Inconsistência Arquitetural**
Exemplo clássico: Um módulo segue Clean Architecture, outro usa lógica diretamente no controller.
*Resultado:* fragmentação estrutural.

**3.2 Dependências Desnecessárias**
LLMs tendem a adicionar bibliotecas para resolver problemas simples.
*Impacto:* Aumento de bundle size, Vulnerabilidades, Complexidade desnecessária.
*Referência:* OWASP

**3.3 Código Não Determinístico**
Mesma solicitação → respostas ligeiramente diferentes. Isso quebra padronização.

**3.4 Testes Superficiais**
IA gera testes que apenas cobrem caminho feliz.
*Não cobre:* Edge cases, Falhas de infraestrutura, Estados inválidos.

## 4️⃣ ESTRUTURA DE GOVERNAÇÃO (PAPÉIS)
- **AI Operator (Humano):** Criar prompts, Solicitar geração, Validar coerência básica.
- **Architecture Guardian (Humano):** Validar alinhamento com arquitetura, Rejeitar código fora do padrão, Aprovar merges estruturais.
- **Quality Auditor (Humano/IA):** Revisar testes, Avaliar cobertura, Garantir ausência de lógica indevida na UI.

## 5️⃣ PADRÃO DE GERAÇÃO OBRIGATÓRIO
Nenhum código pode ser pedido de forma vaga.
**Formato obrigatório de prompt:**
1. Contexto do módulo
2. Regras arquiteturais
3. Estrutura esperada
4. Tipagens obrigatórias
5. Requisitos de testes
6. Proibição explícita de dependências externas

## 6️⃣ CONTRATOS PRIMEIRO (Contract-First)
Antes de qualquer geração de implementação, deves primeiro definir:
- DTOs
- Interfaces
- Entidades
E validar o modelo de domínio.
*Referência metodológica:* Domain-Driven Design

## 7️⃣ CHECKLIST DE APROVAÇÃO DE CÓDIGO GERADO (PR)
Todo código gerado deve passar pelas seguintes validações:
- **Estrutura:** Pastas corretas? Naming consistente? Separação de camadas respeitada?
- **Complexidade:** Alguma função > 40 linhas? Código repetido? Lógica em camada errada?
- **Segurança:** Validação de entrada? Sanitização? Erros tratados corretamente? (Ref: OWASP)
- **Performance:** Operações síncronas bloqueantes? Queries N+1? Loops desnecessários?

## 8️⃣ POLÍTICA DE DEPENDÊNCIAS
**Regra absoluta:** Se pode ser resolvido com código nativo → *não adicionar biblioteca.*
Qualquer nova dependência deve incluir: Justificativa técnica, Comparação de alternativas, Avaliação de manutenção, Risco de segurança.

## 9️⃣ POLÍTICA DE TESTES
- Cobertura mínima: 85%
- Obrigatório: Unit tests, Edge cases, Testes de erro, Testes de validação.
- Não aceitar: Testes redundantes, Testes que apenas mockam tudo.
*Referência:* Test Driven Development

## 🔟 PADRÃO DE VERSIONAMENTO DE PROMPTS
Prompts são ativos estratégicos e devem ser versionados (/ai-prompts/module-name/v1.md).
Cada versão deve conter: Objetivo, Contexto, Output esperado, Problemas conhecidos, Melhorias futuras.

## 1️⃣1️⃣ LIMITES DA IA
A IA **não pode**:
- Tomar decisões de arquitetura macro
- Alterar modelo de dados
- Refatorar múltiplos módulos simultaneamente
- Introduzir padrões novos sem aprovação

## 1️⃣2️⃣ POLÍTICA DE REFACTORING
Refactoring com IA deve seguir:
- Snapshot do código atual
- Definição clara do objetivo
- Refatoração isolada
- Comparação lado a lado
- Execução de testes completos
*Nunca permitir:* "Refatora todo o projeto" (gera caos estrutural).

## 1️⃣3️⃣ MÉTRICAS DE SAÚDE DA BASE DE CÓDIGO
Monitorar continuamente:
- Complexidade ciclomática média
- Número de dependências
- Tamanho médio de arquivos
- Cobertura real de testes
- Tempo médio de build
*Referência:* Accelerate

## 1️⃣4️⃣ REGRAS PARA EVITAR DÍVIDA TÉCNICA INVISÍVEL
Nunca aceitar código que:
- "Funciona mas depois ajustamos"
- Contém TODOs não rastreados
- Duplica lógica já existente
- Introduz abstrações prematuras
*Referência conceitual:* Refactoring

## 1️⃣5️⃣ POLÍTICA DE SEGURANÇA
- Segredos nunca no código
- Variáveis de ambiente obrigatórias
- Rate limiting configurado
- Logs não devem conter dados sensíveis
*Referência:* OWASP

## 1️⃣6️⃣ GOVERNANÇA DE CONHECIMENTO
Todo aprendizado com IA deve gerar um Documento de padrão, Atualização de guideline, ou Ajuste no template de prompt.
Se a IA erra duas vezes no mesmo padrão, a culpa é do processo, não do modelo.

## 1️⃣7️⃣ DEFINIÇÃO FINAL
Sem governação: IA acelera entropia.
Com governação governança rigorosa: Garantia de qualidade escalável e previsível.
