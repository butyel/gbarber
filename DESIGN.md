---
name: GBarber
description: Sistema de gestão para barbearias
colors:
  background: "#F8F9FA"
  foreground: "#1A2E21"
  card: "#FFFFFF"
  card-foreground: "#1A2E21"
  primary: "#1A2E21"
  primary-foreground: "#FFFFFF"
  secondary: "#F1F3F2"
  secondary-foreground: "#1A2E21"
  muted: "#F1F3F2"
  muted-foreground: "#5A6B5C"
  accent: "#C9A84C"
  accent-foreground: "#1A2E21"
  destructive: "#DC2626"
  destructive-foreground: "#FFFFFF"
  border: "#E5E7E6"
  input: "#F1F3F2"
  ring: "#1A2E21"
  success: "#059669"
typography:
  body:
    fontFamily: "Outfit, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  md: "0.85rem"
  lg: "0.5rem"
  xl: "1.5rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    opacity: 0.9
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
    borderColor: "{colors.border}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
---

# Design System: GBarber

## 1. Overview

**Creative North Star: "The Dark Green Lounge"**

Uma interface profissional e serena que inspira confiança sem chamar atenção para si mesma. O design serve ao fluxo de trabalho do barbeiro — cada elemento existe para tornar o próximo agendamento, o próximo atendimento, o próximo relatório mais rápido de acessar. A paleta é enxuta: verde floresta (#1A2E21) como a âncora sóbria, ouro (#C9A84C) como o acento quente e pontual. O espaçamento é generoso, os cantos são suavemente arredondados (0.85rem), e o vidro fosco aparece em momentos de sobreposição (modais, painéis).

**O que este sistema rejeita explicitamente:** gradientes roxos de SaaS genérico, cards dentro de cards, fonte Inter como padrão, easing bounce/elástico, texto cinza sobre fundo colorido.

### Key Characteristics:
- **Verde como âncora, ouro como acento**: uma paleta de duas cores mais neutros, sem profusão
- **Vidro fosco estratégico**: transparente apenas em camadas de sobreposição (modais, navegação mobile)
- **Cantos suaves**: 0.85rem como padrão, consistente em cards, inputs e diálogos
- **Sombra sutil**: elevação discreta (sm/shadow-sm) que não compete com o conteúdo
- **Gradiente como detalhe**: mesh background e gold gradient aparecem em momentos específicos (hero, badges)

## 2. Colors

Paleta de duas cores âncoras mais neutros. O verde floresta domina como identidade; o ouro aparece como acento de valor, destaque e badges.

### Primary
- **Floresta Escuro** (#1A2E21): Cor da marca. Usado em backgrounds de botões primários, headers, navbar, links, elementos de identidade forte. Transmite solidez e profissionalismo.

### Neutral
- **Off-white** (#F8F9FA): Background da página. Levemente quente, nunca branco puro.
- **Gelo** (#FFFFFF): Background de cards, modais, popovers.
- **Gelo Sujo** (#F1F3F2): Background de inputs, áreas muted, secondary buttons.
- **Cinza Folha** (#5A6B5C): Texto muted/descritivo.
- **Borda** (#E5E7E6): Linhas divisórias, strokes de inputs.

### Accent
- **Ouro Barbeiro** (#C9A84C): Acento quente. Aparece em badges de "hoje", destaques de valor, info icons, glow sutil. Usado com moderação para manter o impacto.

### Feedback
- **Sucesso** (#059669): Verde esmeralda para confirmações, checkmarks.
- **Erro** (#DC2626): Vermelho para ações destrutivas e validação.

### Named Rules
**The Two-Tone Rule.** O verde floresta é a identidade; o ouro é o acento. Nenhum terceiro nome de cor rouba a cena. Usar uma segunda cor de acento sempre que sentir que "falta algo" é a falácia do design genérico.

**The Rarity Rule.** O ouro aparece em ≤15% de qualquer tela. Sua raridade é o que o faz parecer valioso.

## 3. Typography

**Display & Body Font:** Outfit (com fallback Inter, system-ui)

**Caráter:** Geométrica e limpa. Outfit é uma font sans-serif moderna com terminais ligeiramente arredondados que combinam com a estética de cantos suaves. A versão Regular (400) carrega a maior parte do texto; as versões SemiBold (600) e Bold (700) criam hierarquia sem precisar de uma segunda fonte.

### Hierarchy
- **Display** (Bold 700, clamp(1.5rem, 4vw, 2.5rem), line-height 1.1): Headers de página e títulos de seção. Uso esparso.
- **Title** (SemiBold 600, 1.125rem / 1.25rem, line-height 1.2): Títulos de cards, cabeçalhos de diálogo.
- **Body** (Regular 400, 0.875rem, line-height 1.5): Texto corrente, células de tabela, descrições. Largura máxima de 65–75ch.
- **Label** (SemiBold 600, 0.75rem, letter-spacing 0.05em, uppercase): Labels de formulário, badges de status, tabs. Caixa alta + tracking para clareza.

### Named Rules
**The One-Font Rule.** Outfit para tudo — display, body, label, botão. Sem segunda fonte decorativa. A hierarquia vem do peso, tamanho e tracking, não da troca de família tipográfica. Uma só fonte = coesão visual imediata.

## 4. Elevation

O sistema é majoritariamente plano (flat), com camadas criadas por variação tonal (background → card → secondary) em vez de sombras profundas. Sombras aparecem apenas como resposta a estado: hover de card, dropdown abertos, modais.

### Shadow Vocabulary
- **Card elevado** (0 1px 3px rgba(0,0,0,0.05), hover: 0 8px 32px rgba(31,38,135,0.07)): cards em repouso; a sombra intensifica no hover.
- **Dropdown/Modal** (shadow-lg do Tailwind): sobreposições que precisam se destacar do fluxo.
- **Glass glow** (0 8px 32px 0 rgba(31,38,135,0.07)): painéis glassmorphism — a sombra é difusa e azulada, compatível com o backdrop-blur.

### Named Rules
**The Flat-By-Default Rule.** Superfícies são planas em repouso. Sombras aparecem apenas como resposta de estado (hover, foco, modal aberto). Se você forçou uma sombra drástica num elemento estático, ela não deveria estar ali.

## 5. Components

### Buttons
- **Shape:** Cantos arredondados (0.5rem / rounded-lg). Altura fixa de 2.5rem (10).
- **Primary:** Background verde floresta, texto branco. Hover: 90% da opacidade (sutil).
- **Accent:** Background ouro, texto verde floresta. Para CTAs secundários de destaque (ex.: "Agendar").
- **Ghost / Outline:** Sem background ou apenas borda, para ações terciárias. Texto verde floresta.
- **Destructive:** Background vermelho, texto branco. Uso exclusivo para ações de exclusão.
- **Transição:** `transition-colors` — sem escala, sem bounce. Cor muda, forma não.

### Cards
- **Shape:** Cantos arredondados (0.85rem). Background branco.
- **Background:** Branco puro (#FFFFFF) com gradient suave de fundo (via white → #FFF8E7, opcional).
- **Shadow Strategy:** shadow-sm em repouso, shadow-lg + leve translateY(-0.5) no hover.
- **Border:** Nenhum (a sombra define o limite). Se precisar de borda, usar `#E5E7E6` a 1px.
- **Internal Padding:** 1.5rem (p-6).

### Inputs / Fields
- **Style:** Background gelo sujo (#F1F3F2), borda sutil (#E5E7E6).
- **Shape:** Cantos arredondados (0.5rem). Padding interno 0.5rem 0.75rem.
- **Focus:** Anel (ring) verde floresta a 2px + offset 2px. Nenhuma mudança de borda.
- **Placeholder:** Cinza folha (#5A6B5C).
- **Disabled:** Opacidade 50%, cursor not-allowed.

### Navigation (Sidebar)
- **Style:** Background gelo sujo (#F1F3F2), texto verde floresta ou muted. Item ativo com background verde floresta + texto branco (ou ouro se for badge).
- **Typography:** Label (0.75rem uppercase tracking-wide) para seção / Body (0.875rem) para links.
- **Hover:** background muted secundário.

### Dialog / Modal
- **Shape:** Cantos arredondados (0.85rem). Background branco, padding 1.5rem.
- **Overlay:** Black a 80% de opacidade (bg-black/80).
- **Animation:** Fade-in + zoom-in suave (0.2s ease-out). 

### Chips / Badges
- **Shape:** Cantos totalmente arredondados (9999px / pill). Padding horizontal 0.5rem, vertical 0.125rem.
- **Gold Badge:** Background ouro, texto verde floresta. Para "hoje", "novo", "destaque".
- **Green Badge:** Background verde floresta (ou muted), texto branco (ou muted-foreground). Para status.

## 6. Do's and Don'ts

### Do:
- **Do** usar verde floresta (#1A2E21) como cor dominante de identidade.
- **Do** usar ouro (#C9A84C) com moderação — quanto menos, mais impacto.
- **Do** manter cantos consistentes em 0.85rem para cards, modais, diálogos.
- **Do** usar Outfit como fonte única para todo o sistema.
- **Do** preferir hierarquia por peso e tracking em vez de múltiplas fontes.
- **Do** usar glassmorphism apenas em camadas de sobreposição (modais, navegação mobile).
- **Do** usar sombras apenas como resposta de estado (hover, foco).
- **Do** manter espaçamento consistente (p-6 em cards, p-1.5 em diálogos).
- **Do** garantir contraste 4.5:1 para texto normal (WCAG AA).

### Don't:
- **Don't** usar gradientes roxos ou azuis purpúreos — é clichê de SaaS genérico.
- **Don't** aninhar cards dentro de cards — profundidade visual desnecessária.
- **Don't** usar Inter como fonte padrão — prefira Outfit.
- **Don't** usar easing bounce ou elástico em transições — parece datado.
- **Don't** usar texto cinza sobre fundo colorido — é ilegível e quebra contraste.
- **Don't** usar `#000` (preto puro) ou `#FFF` (branco puro) em nenhum lugar.
- **Don't** adicionar uma segunda cor de acento — duas cores bastam.
- **Don't** criar cards com sombra drástica em repouso — a superfície deve ser plana.
- **Don't** usar animações decorativas que não servem ao fluxo de trabalho.
- **Don't** usar border-left como faixa colorida em vez de um tratamento de componente adequado.
