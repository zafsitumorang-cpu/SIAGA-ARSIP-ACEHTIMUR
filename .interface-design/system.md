# Design System — SIAGA ARSIP

## Direction

**Personality:** Ketelitian administratif yang tenang
**Human:** Admin, pencatat, pengunggah, pimpinan, dan pegawai Bawaslu yang sedang mendaftarkan, menemukan, atau menindaklanjuti surat.
**Foundation:** Warm neutral paper with deep institutional green
**Depth:** Borders-only; elevation comes from surface contrast and restrained modal shadow.
**Density:** Compact for tables and filters, open around task headings and primary actions.

## Domain and signature

The product world is a register book, archive box, disposition sheet, audit trail, restricted file room, and public aggregate board. The signature is a **register-led workspace**: the current task is always anchored by a clear archive list, access scope, and visible disposition status instead of decorative dashboard widgets.

## Tokens

### Spacing

Base: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 48

### Colors

```css
--paper: #f4f3ee;       /* archive paper / application canvas */
--surface: #fffefa;     /* clean document surface */
--ink: #17201f;         /* primary record text */
--muted: #66716d;       /* supporting metadata */
--line: #dcded8;        /* quiet table and panel structure */
--navy: #172a27;        /* restricted internal workspace */
--navy-soft: #213b36;   /* selected navigation state */
--green: #286a57;       /* completed / trusted state */
--red: #a5222b;         /* identity and primary action */
--blue: #2e6072;        /* outgoing record state */
--amber: #a46a12;       /* pending work */
```

Color communicates identity or state. Decorative gradients and saturated surface changes are excluded.

### Typography

Font: system UI sans stack for a native, reliable administrative tool.
Scale: 10, 11, 12, 13, 15, 18, 28, 38.
Weights: 400, 500, 650, 750, 820.
Large headings use negative tracking; metadata uses tracked uppercase only when it helps scanning.

### Radius and depth

Radius: 3px for controls and badges, 4px for panels/cards, 5–6px for dialogs and login surfaces.
Depth: quiet borders and surface contrast. Shadows are reserved for overlays and toasts.

## Patterns

### Internal shell

- 252px desktop sidebar; collapses into a horizontal scrollable navigation strip below 900px.
- Dark green workspace rail, warm document canvas, single active border state.
- Keep the current user and access scope visible in the top bar.

### Archive register

- Search and filters precede the table.
- Metadata is primary; status has a text label and semantic color.
- Actions use native buttons/links with consistent compact sizing.

### Status vocabulary

Use the exact Indonesian labels `Belum ditindaklanjuti`, `Sedang diproses`, and `Selesai`. Never communicate status by color alone.

### Public aggregate board

- No internal record details.
- Year selector sits beside its label.
- Three aggregate values use the same surface pattern and let the number lead.

## Rejected defaults

- No purple/blue gradients, glass panels, or decorative blur.
- No icon-tile-above-every-heading pattern.
- No thick colored side-tab on cards.
- No Unicode glyphs as the application icon system; use consistent inline SVG icons.
- No fluid display typography in task screens.

## Accessibility and states

Visible keyboard focus, semantic form labels, text plus color for status, responsive table overflow, reduced-motion support, and clear empty/error feedback are part of the baseline. Every interactive control keeps native keyboard behavior and a minimum comfortable hit area.

## Current internal workspace (supersedes earlier warm/green tokens)

User selected Able Pro dashboard as visual reference. Use light #f7f8fa canvas/sidebar, white panels, #263238 ink, #657180 secondary text, #e5e9ef borders, Bawaslu #bd241f accent and #ffc107 identity detail. Manrope local font, 13px body, 23–26px page headings/numbers, 10–11px supporting metadata; 4px spacing base, 20–24px panel rhythm, 12px panel radius, 7–8px controls. Border-only panels. Sidebar 272px, collapsible desktop / drawer below 900px. Reuse .workspace and public/workspace.css. Dashboard leads with relevant actions and factual archival data; no decorative fake sparklines or commercial demo numbers. Landing and login retain their scoped design.

Navigation update: charcoal #17181B sidebar; gold #FFC107 selected item with charcoal text; red #BD241F topbar with white text and dark red #A51F1B search input. White content panels remain. Gold keyboard focus on dark/red chrome. Applies equally to mobile drawer and profile footer.

Default Able Pro fidelity correction: Inter font locally served (regular/semibold/bold); desktop 280px side / 48px content inset / 260px welcome banner / 194px metric cards / ~3.15:1 chart band. Mini-charts must use real monthly data. Banner illustration is an original generated archive box, not the demo rocket. Scope changes to workspace, retain dark sidebar/red header/gold selection from user.
