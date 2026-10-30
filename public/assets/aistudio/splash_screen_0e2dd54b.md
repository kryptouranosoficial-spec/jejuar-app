---
name: Vitality Fasting & Wellness
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4a3f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7b6e'
  outline-variant: '#bbcbbc'
  surface-tint: '#006d3d'
  primary: '#006d3d'
  on-primary: '#ffffff'
  primary-container: '#00c975'
  on-primary-container: '#004d2a'
  inverse-primary: '#3ae18a'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#855300'
  on-tertiary: '#ffffff'
  tertiary-container: '#f39d08'
  on-tertiary-container: '#603b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#5ffea4'
  primary-fixed-dim: '#3ae18a'
  on-primary-fixed: '#00210f'
  on-primary-fixed-variant: '#00522c'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses vitality, encouragement, scientific clarity, and serene confidence. Designed for individuals seeking metabolic wellness, intermittent fasting guidance, and nutrition habits, the user experience prioritizes positivity over clinical rigidity. It removes the friction and intimidation typically associated with dieting apps, replacing guilt with achievable momentum and clear progress cues.

The design movement combines **Modern Tactile Minimalism** with **Soft Organic Warmth**:
- Generous, airy negative space grounded by pristine white canvases (`#FFFFFF`) and delicate slate surfaces (`#F8FAFC`).
- High-contrast, deeply human typography rendered in commanding navy slate (`#0F172A`) to establish immediate authority, clarity, and trust.
- Motivating accents centered around a vivid mint-emerald green (`#00C975`), providing instant clarity for primary actions, success states, and key milestones.
- Harmonious, friendly protocol identifiers (warm tangerine for 16:8, balanced leaf green for 18:6, and calming cornflower blue for 20:4) that organize complex routines into digestible, cheerful visual badges.

## Colors

The palette is tuned specifically for light mode, emphasizing freshness, optimism, and medical-grade legibility.

### Hierarchy & Role Allocation
- **Primary (`#00C975`):** The engine of positive progression. Used for prominent CTA buttons (e.g., "Próximo"), active step pagination indicators, toggles in their checked state, and fasting progress rings.
- **Secondary (`#0F172A` & `#1E293B`):** Deep navy slate providing uncompromising contrast for primary titles, display headings, and core interactive text, steering clear of stark, fatiguing pure black.
- **Tertiary & Protocol Tints:**
  - *Sunlit Orange (`#F59E0B` / `#FEF3C7`):* Dedicated to starter protocols like 16:8, warm meal-window cues, and energetic streak badges.
  - *Herbal Green (`#10B981` / `#D1FAE5`):* Dedicated to 18:6 routines, balance metrics, and active fasting tracking.
  - *Calm Horizon Blue (`#3B82F6` / `#DBEAFE`):* Dedicated to advanced 20:4 intervals, hydration tracking, and sleep alignment.
- **Neutrals & Surfaces:**
  - *Base Canvas:* `#FFFFFF` (pure white for main cards and foreground sheets).
  - *Surface Muted:* `#F8FAFC` (app canvas and subtle segment backgrounds).
  - *Border Subtle:* `#E2E8F0` (thin structural borders).
  - *Body Copy:* `#334155` and `#64748B` (refined body clarity without overwhelming prominence).

## Typography

**Plus Jakarta Sans** governs the system across all tiers. Its geometry features softly sculpted counters, wide apertures, and humanist warmth, making long-form health guidance accessible while providing bold impact for onboarding statements and protocol counters.

### Application Rules
- **Display & Headings:** Set in deep navy slate (`#0F172A`). Headlines adopt tight letter-spacing to appear unified and punchy on mobile cards.
- **Body:** Rendered in `#334155` to ensure comfortable reading without harsh black-on-white vibration. Line heights maintain ample breathing room (`1.5x` minimum) for nutritional education and onboarding passages.
- **Numbers & Protocol Badges (e.g., "16:8", "18:6"):** Rendered with `font-weight: 800` or `700` and tabular figures (`font-variant-numeric: tabular-nums`) to ensure clocks and time intervals stay centered and balanced inside pill badges or circular indicators.

## Layout & Spacing

The layout model is built around a **4px/8px incremental grid**, pairing structured alignment with mobile-first fluid flexibility.

### Grid & Form Factors
- **Mobile (< 768px):** Single-column layout. Fixed horizontal margins of `1.25rem` (20px). Content is structured into stacked bottom-sheet containers or centered floating cards over soft neutral backdrops.
- **Tablet & Desktop (≥ 768px):** 12-column grid with a maximum content constraint of `1140px` and gutters of `1.5rem` (24px). Hero photography and visual onboarding steps split into a balanced 6-column / 6-column bilateral layout.

### Rhythm Principles
- Interactive elements (such as full-width primary buttons) maintain a minimum vertical clearance of `space-xl` (32px) from secondary links or navigation bars.
- Descriptive subtitles must sit `space-sm` (8px) to `space-md` (16px) beneath headline groupings to establish cohesive narrative units.

## Elevation & Depth

Depth in this design system is achieved through soft, clean layers rather than stark drops or complex gradients:

- **Surface Layering:** The primary canvas sits at `#F8FAFC`, while cards, floating sheets, and interaction surfaces rise on clean `#FFFFFF` planes.
- **Ambient Wellness Shadows:** Shadows are extra-diffused and subtly tinted with Slate-Cyan to preserve an airy, medical-clean aesthetic:
  - *Level 1 (Subtle Cards / Protocol Badges):* `0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03)`.
  - *Level 2 (Floating Onboarding Card / Bottom Sheet):* `0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)`.
  - *Level 3 (Primary Glow / Active Actions):* Primary buttons carry a colored, low-opacity ambient drop: `0 8px 20px -4px rgba(0, 201, 117, 0.35)`.
- **Low-Contrast Structural Borders:** Outlines are kept gossamer-thin (`1px solid #F1F5F9` or `#E2E8F0`), creating tactile boundaries that feel featherweight.

## Shapes

The shape system adopts a **pill-shaped and generous radius aesthetic (Level 3)**, reinforcing approachability, body friendliness, and modern health styling.

- **Buttons & Chips:** Full pill radius (`9999px` / `rounded-full`). They feel pressable, ergonomic, and thumb-friendly.
- **Cards & Floating Modals:** Prominent rounded corners (`2rem` / 32px) at the top of bottom sheets (as visible in the onboarding card) and `1.5rem` (24px) for standalone content cards.
- **Protocol Time Discs:** Symmetrical circles (`50%` radius) with interior pastel fills and colored accent rims to symbolize the natural circadian cycle of 24-hour fasting.

## Components

### Buttons
- **Primary Action (e.g., "Próximo"):**
  - Height: `56px` for effortless thumb reach on mobile.
  - Background: Solid Emerald Mint (`#00C975`).
  - Text: `#FFFFFF`, `label-lg`, centered, paired with an optional chevron icon right-aligned or inline.
  - Shape: Full pill (`rounded-full`).
  - Shadow: Green ambient glow (`0 8px 20px -4px rgba(0, 201, 117, 0.35)`).
  - States: Active pressed state scales to `0.98` with background darkening slightly to `#00B368`.
- **Secondary / Ghost:** Transparent background, `1.5px` border in `#E2E8F0`, navy slate text (`#1E293B`).

### Pagination Indicators (Dots)
- Centered horizontally with `8px` spacing.
- **Active Dot:** Pill-stretched (`16px × 6px`), colored `#00C975`.
- **Inactive Dots:** Circular (`6px × 6px`), soft neutral mint or light slate (`#E2E8F0` / `#D1FAE5`).

### Protocol Badges & Time Rings
- Floating circular or rounded capsule containers displaying fasting formulas:
  - *16:8 (Beginner):* Tangerine border (`#F59E0B`), warm cream fill (`#FFFBEB`), bold dark orange text (`#B45309`).
  - *18:6 (Intermediate):* Herbal green border (`#10B981`), pale mint fill (`#ECFDF5`), forest text (`#047857`).
  - *20:4 (Advanced):* Royal blue border (`#3B82F6`), soft sky fill (`#EFF6FF`), cobalt text (`#1D4ED8`).

### Content Cards & Onboarding Sheets
- Background: Pure White (`#FFFFFF`).
- Padding: `2rem` (32px) top and horizontal, `1.5rem` (24px) bottom.
- Header text aligned center: Navy slate (`#0F172A`), `headline-lg-mobile`.
- Subtitle text aligned center: Muted slate (`#475569`), `body-md`, `max-width: 320px` centered for optimal line scanning.

### Input Fields & Toggles
- Inputs: `52px` height, soft gray surface (`#F8FAFC`), border `1px solid #E2E8F0`, pill or `rounded-xl` corners. Focused state shifts border to `#00C975` with a subtle `3px` focus ring of `rgba(0, 201, 117, 0.15)`.
- Toggles: Smooth `28px` track with emerald fill when enabled and pristine white thumb knob.