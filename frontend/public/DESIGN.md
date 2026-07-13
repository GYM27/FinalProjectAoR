---
name: VitalSim Cyber-Clinical
colors:
  surface: '#081325'
  surface-dim: '#081325'
  surface-bright: '#2f394c'
  surface-container-lowest: '#040e1f'
  surface-container-low: '#111c2d'
  surface-container: '#152032'
  surface-container-high: '#1f2a3d'
  surface-container-highest: '#2a3548'
  on-surface: '#d8e3fb'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#d8e3fb'
  inverse-on-surface: '#263143'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#4de082'
  on-secondary: '#003919'
  secondary-container: '#00b55d'
  on-secondary-container: '#003e1c'
  tertiary: '#ffe8e4'
  on-tertiary: '#690003'
  tertiary-container: '#ffc2ba'
  on-tertiary-container: '#b60009'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#6dfe9c'
  secondary-fixed-dim: '#4de082'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930005'
  background: '#081325'
  on-background: '#d8e3fb'
  surface-variant: '#2a3548'
  surface-deep: '#0b0f10'
  glass-border: rgba(255, 255, 255, 0.1)
  tech-cyan-glow: rgba(0, 229, 255, 0.5)
  status-active: '#4ade80'
  status-inactive: '#ff3b30'
typography:
  display-metric:
    fontFamily: JetBrains Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-micro:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  nav-label:
    fontFamily: Geist
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  margin-desktop: 48px
  header-height: 64px
  sidebar-width: 80px
---

## Brand & Style

The brand identity is rooted in high-stakes clinical precision merged with a futuristic, developer-centric aesthetic. It evokes a sense of "Mission Control" for healthcare, where reliability meets cutting-edge technology. 

The design style is a refined **Glassmorphism** mixed with **Cyberpunk** influences. It utilizes deep "midnight" surfaces, semi-transparent overlays, and "tech-glow" accents to create a multi-layered, high-contrast environment. The UI feels technical, authoritative, and fast, prioritizing data density and status visibility through glowing indicators and monospaced accents.

## Colors

The palette is optimized for low-light clinical environments, reducing eye strain while maintaining critical legibility.

- **Primary (Tech Cyan):** Used for branding, primary actions, and active navigation states. It frequently carries a soft outer glow.
- **Secondary (Clinical Green):** Reserved exclusively for "Active" or "Online" status indicators and successful states.
- **Tertiary (Alert Red):** Used for "Inactive" states, destructive actions, and notifications.
- **Neutral (Deep Space):** A range of navy-blacks and charcoal-grays forming the base architecture.

The interface relies heavily on **Alpha Transparency**. Surfaces are rarely solid; they are layers of `rgba(25, 36, 54, 0.4)` with backdrop blurs to maintain depth.

## Typography

The typographic system uses a tri-font strategy to separate information types:
1. **Geist:** Used for structural UI, headers, and navigation. Its clean, technical feel anchors the interface.
2. **Inter:** Used for all standard body copy and data entries to ensure maximum readability.
3. **JetBrains Mono:** Reserved for metrics, status labels, and secondary metadata. The monospaced nature emphasizes the "system/code" aspect of the clinical data.

On mobile devices, `display-metric` should scale down to `32px` and `headline-lg` to `24px`.

## Layout & Spacing

The system follows a **Fixed-Fluid Hybrid** model. The Global Header and Side Navigation are fixed-position elements that create a "frame" for the application. 

- **Desktop:** The main content area uses a centered container with a maximum width of `1200px` to maintain readability on wide monitors.
- **Grid:** A 12-column grid is implied for complex layouts, while standard cards use a flexible `grid-cols-4` for summary stats.
- **Rhythm:** Spacing is strictly derivative of a 4px base unit. Component interiors typically use `p-6` (24px) or `p-8` (32px) to provide a spacious, premium feel amidst the high-contrast colors.

## Elevation & Depth

Depth is not communicated through shadows alone, but through a combination of **translucency** and **luminosity**.

1. **The Void (Background):** The deepest layer (`#192436`).
2. **The Glass (Panels):** Raised surfaces use `rgba(25, 36, 54, 0.4)` with a `12px` backdrop blur. They are defined by a `1px` white border at `0.05` to `0.1` opacity.
3. **Tech-Glow:** Interactive elements or critical status points use `box-shadow` or `text-shadow` with the Primary Cyan color to "lift" them off the glass surface.
4. **Active Overlays:** Modals use a `backdrop-blur-sm` and a darker `surface-container-lowest` at `0.8` opacity to isolate the user from the background system.

## Shapes

The shape language is "Squircular" and modern. 
- **Standard Cards/Panels:** Use `rounded-xl` (1.5rem / 24px) to soften the technical edge of the UI.
- **Interactive Elements (Inputs/Buttons):** Use `rounded-lg` (1rem / 16px).
- **Status Pills:** Utilize "Full" rounding (9999px) to distinguish them from structural elements.
- **Avatar/Icons:** Use square-off rounding (`rounded-lg`) rather than circles to maintain the "technical block" aesthetic.

## Components

- **Buttons:** Primary buttons use a ghost-cyan border with a `20%` cyan fill. On hover, they transition to a solid cyan background with dark text and a strong glow.
- **Glass Inputs:** Inputs must be semi-transparent (`rgba(11, 15, 16, 0.4)`). On focus, the border color shifts to Tech-Cyan with a subtle glow.
- **Data Tables:** Tables use transparent backgrounds. Header rows are slightly darkened (`bg-black/20`). Row hover states use a very subtle cyan tint (`primary/5`) to help track data without overwhelming the eye.
- **Stat Cards:** Feature a background icon with `10%` opacity of the accent color and a large `display-metric` value.
- **Side Nav:** Vertical orientation. Icons use `text-on-surface-variant`. The active state uses the primary cyan with a `drop-shadow` glow.
- **Corner Decorations:** Use "L-bracket" borders in corners to reinforce the "scanning/HUD" clinical aesthetic.