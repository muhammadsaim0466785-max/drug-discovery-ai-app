---
name: Deep Biotech Visual System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#47eded'
  on-secondary: '#003737'
  secondary-container: '#00d0d0'
  on-secondary-container: '#005454'
  tertiary: '#fcf5ff'
  on-tertiary: '#3c0090'
  tertiary-container: '#e3d4ff'
  on-tertiary-container: '#7318ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#57f9f8'
  secondary-fixed-dim: '#28dcdc'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f4f'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.08em
  code-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
This design system is engineered for the high-stakes, high-precision world of AI-driven pharmacology. The aesthetic is "Dark-Mode First," prioritizing visual comfort during extended research sessions while maintaining a sophisticated, authoritative tone.

The brand persona is that of a "Silent Scientific Partner"—reliable, clinical, and technologically superior. We utilize a **Modern Glassmorphic** style layered over a **Minimalist** foundation. The interface should feel like a high-end laboratory instrument: precise, expensive, and powerful. Key visual drivers include:
- **Atmospheric Depth:** Using pure black surfaces to create infinite depth, contrasted by translucent glass panels.
- **Scientific Clarity:** High-contrast data visualization against dark backgrounds to ensure no critical insight is lost.
- **Agentic Presence:** Subtle "electric" glows signify the activity of autonomous AI agents within the platform.

## Colors
The palette is anchored in **Pure Black (#000000)** to maximize OLED contrast and minimize eye strain. 

- **Primary (Electric Cyan):** Reserved for primary calls to action, active AI states, and successful molecular matches. It represents the "spark" of discovery.
- **Secondary (Laboratory Teal):** Used for data visualization, secondary navigation elements, and technical metadata.
- **Tertiary (Deep Violet):** Used sparingly as a signal for "Machine Learning" or "Neural Processing" status indicators.
- **Neutrals:** A range of deep charcoals and slates provide the structural framework. Pure white text is avoided; instead, use a high-contrast off-white (Silver #E0E0E0) for body text to prevent "haloing" effects on black backgrounds.

## Typography
The typography system balances futuristic geometric flair with utilitarian readability.

- **Headlines (Sora):** Used for page titles and major section headers. Sora's geometric structure conveys a high-tech, modern feel.
- **Body & UI (Inter):** The workhorse for the system. Inter provides exceptional legibility for complex scientific descriptions and dense UI labels.
- **Technical Data (JetBrains Mono):** Used for molecular formulas, SMILES strings, and agent logs. This monospaced font ensures that scientific nomenclature is easy to parse and align.

**Scale Strategy:** We utilize a tight typographic scale to support high data density. On mobile, headlines shrink significantly to ensure scientific nomenclature doesn't wrap awkwardly.

## Layout & Spacing
The layout uses a **12-column fixed grid** centered on the desktop, switching to a fluid single-column layout on mobile. 

A **4px base unit** governs all spacing, ensuring mathematical precision across the UI. Because the platform deals with massive datasets, the design favors a **High-Density** model:
- **Margins:** Generous outer margins (40px) provide breathing room for the "glass" containers.
- **Gutters:** Standard 24px gutters keep data columns distinct.
- **Information Density:** Components should minimize internal padding to allow for more content on screen, specifically in the "Discovery Workspace" where multiple AI agent outputs are viewed simultaneously.

## Elevation & Depth
In a "Black Theme" environment, traditional shadows are often invisible. We communicate hierarchy through **Tonal Layering** and **Luminescence**:

1.  **Base Level (0dp):** Pure Black (#000000). The "void" where the application lives.
2.  **Surface Level (1dp):** Deep Charcoal (#0b0b0b). Used for primary container areas.
3.  **Glass Level (Floating):** Semi-transparent surfaces with a `backdrop-filter: blur(20px)`. These panels feature a **1px subtle border** using a white-to-transparent linear gradient at 10% opacity.
4.  **Active Focus:** Elements currently being processed by the AI feature a subtle outer glow (0px 0px 15px) using the Primary Cyan at 20% opacity.

## Shapes
The shape language is "Technical-Sharp." We use a very small radius (4px) to avoid the interface feeling "aggressive" while maintaining a professional, structured appearance.

- **Standard Components:** 4px (rounded-sm) for buttons, inputs, and cards.
- **AI Agent Avatars:** 4px (consistent with components, rather than circles, to feel more like "modules").
- **Data Visualizations:** Strict 0px corners for bars and charts to emphasize scientific accuracy and precision.

## Components
Consistent component behavior is vital for a scientific tool.

- **Buttons:** Primary buttons are solid Electric Cyan with black text. Secondary buttons are "Ghost" style with a 1px Cyan border and no fill.
- **Data Cards:** These are the primary vessel for molecular data. They should use the "Glass Level" styling with a slightly more prominent top-border to indicate categorization.
- **Status Chips:** Use a "dot" indicator (Cyan for active, Amber for calculating, Red for error) paired with monospaced text.
- **Input Fields:** Darker than the surface level (#050505) with a 1px border that glows Primary Cyan only on focus.
- **Agent Feed:** A specialized list component using monospaced logs and microscopic "heartbeat" animations to show agent activity.
- **Molecular Viewer:** A dedicated dark-canvas component that expands to fill the viewport, utilizing the secondary teal for wireframe structures.