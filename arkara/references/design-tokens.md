# Design Tokens — Retro Survival Manual 2.0

Complete token reference for the Arkara frontend design system.

---

## Color System

```css
:root {
  /* ── BACKGROUNDS ── */
  --cream:          #E8E0CC;   /* Page base — warm parchment */
  --cream-dark:     #D4C9A8;   /* Borders, dividers, section bg */
  --paper:          #F0E8D0;   /* Card surface — slightly lighter */
  --paper-dark:     #DDD0B0;   /* Card hover, indented areas */

  /* ── BRAND GREENS ── */
  --green-muted:    #6B8C6B;   /* Primary brand color, main headings */
  --green-terminal: #8FAF8F;   /* UI accents, active states, links */
  --green-dark:     #3D5C3D;   /* Dark card backgrounds, featured */

  /* ── MANUAL ACCENTS ── */
  --yellow-manual:  #D8C58A;   /* Tips, highlights, warning band bg */
  --yellow-dark:    #B8A060;   /* Yellow borders and outlines */
  --red-warning:    #B85C5C;   /* Danger alerts, error states */
  --red-dark:       #8C3A3A;   /* Danger borders, dark red */

  /* ── NEUTRALS ── */
  --warm-grey:      #9B9080;   /* Secondary text, muted labels */
  --warm-grey-dark: #6B6055;   /* Captions, fine print */
  --ink:            #2A2218;   /* Primary text, strong borders */
  --ink-light:      #3D3628;   /* Secondary dark text */
}
```

### Usage guide

| Token | Use for |
|---|---|
| `--cream` | Page background |
| `--paper` | Card, panel surfaces |
| `--ink` | All borders that should feel "drawn" |
| `--green-terminal` | Links, active nav, cursor blink, status indicators |
| `--yellow-manual` | Warning band, TIP labels, highlight backgrounds |
| `--red-warning` | DANGER badges, alert panels |
| `--warm-grey` | Supporting text, module descriptions |

---

## Typography

### Font stack

```css
/* Load via Google Fonts in BaseLayout.astro */
@import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Share+Tech+Mono&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

/* Assignments */
.font-display  { font-family: 'Special Elite', cursive; }         /* Hero subtitles, pull quotes */
.font-heading  { font-family: 'Barlow Condensed', sans-serif; }   /* H1, H2, module names */
.font-mono     { font-family: 'Share Tech Mono', monospace; }     /* Nav, labels, badges, code */
.font-body     { font-family: 'Barlow', sans-serif; }             /* All body copy */
```

### Scale

```css
/* Headings — always uppercase, Barlow Condensed */
h1 { font-size: clamp(3rem, 7vw, 6rem); font-weight: 800; line-height: 0.9; }
h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; line-height: 1.0; }
h3 { font-size: 1.5rem; font-weight: 700; line-height: 1.1; }

/* Labels — always Share Tech Mono */
.label      { font-size: 0.62rem; letter-spacing: 0.25em; text-transform: uppercase; }
.label-sm   { font-size: 0.58rem; letter-spacing: 0.2em;  text-transform: uppercase; }

/* Body */
.body-lg    { font-size: 1rem;   line-height: 1.7; }
.body-md    { font-size: 0.875rem; line-height: 1.65; }
.body-sm    { font-size: 0.8rem;   line-height: 1.6; }
```

---

## Visual FX

### 1 — Grain overlay (always on `body::before`)

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1000;
  opacity: 0.6;
  mix-blend-mode: multiply;
}
```

### 2 — Background grid (`.bg-grid` fixed element)

```css
.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(107,140,107,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(107,140,107,0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
```

### 3 — Muted gradient background (`.bg-gradient` fixed element)

```css
.bg-gradient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 10% 20%, rgba(143,175,143,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 80%, rgba(216,197,138,0.12) 0%, transparent 50%),
    linear-gradient(160deg, #E8E0CC 0%, #D4CDB8 40%, #C8D0BC 70%, #D0C8B0 100%);
  pointer-events: none;
  z-index: -1;
}
```

### 4 — Ink border + shadow (card interactive feel)

```css
/* Standard card border */
.card-border {
  border: 3px solid var(--ink);
  box-shadow: 6px 6px 0 var(--ink);
}

/* Hover lift effect — NO blur, NO glow */
.card-hover:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--ink);
}
```

---

## Spacing

Uses 8px base grid:

```
4px   = 0.25rem  — micro gaps (badge padding)
8px   = 0.5rem   — tight (inline elements)
12px  = 0.75rem  — compact (nav items)
16px  = 1rem     — standard
24px  = 1.5rem   — card padding
32px  = 2rem     — section elements
48px  = 3rem     — section spacing
64px  = 4rem     — page padding (desktop)
80px  = 5rem     — hero padding
```

---

## Animations

Only non-glossy, functional animations:

```css
/* Terminal cursor blink */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* Ticker scroll (warning band) */
@keyframes scroll-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* Mascot float */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}

/* Status dot pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

**Rules:**
- No CSS transitions faster than 150ms
- No `scale` transforms on text
- No `blur()` anywhere — kills the flat manual aesthetic
- Card hover: always `translate(-2px, -2px)` + bigger box-shadow, never scale

---

## Component Visual Patterns

### Section label

```
SECTION A — KURIKULUM UTAMA
──────────────────
```
```css
.section-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.25em;
  color: var(--warm-grey);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--cream-dark);
  max-width: 80px;
}
```

### Stamp (physical seal feel)

```css
.stamp {
  display: inline-flex;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.3rem 0.7rem;
  border: 2px solid;
  transform: rotate(-2deg);
}
.stamp--green  { color: var(--green-dark);   border-color: var(--green-dark); }
.stamp--red    { color: var(--red-warning);  border-color: var(--red-warning); }
.stamp--yellow { color: var(--yellow-dark);  border-color: var(--yellow-dark); }
```

### Badge / module tag

```css
.module-tag {
  margin-top: auto;
  padding-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.15em;
  color: var(--green-muted);
  text-transform: uppercase;
}
.module-tag::before {
  content: '';
  width: 16px;
  height: 1px;
  background: currentColor;
}
```

---

## Dark Surface Pattern

Used for nav, footer, featured cards, sidebar panels:

```css
.surface-dark {
  background: var(--ink);
  color: var(--cream);
  border: 2px solid var(--green-terminal); /* optional accent border */
}

/* Text overrides on dark */
.surface-dark .section-label { color: var(--green-terminal); }
.surface-dark .body-text      { color: var(--warm-grey); }
.surface-dark h2, h3          { color: var(--green-terminal); }
```

---

## Responsive Breakpoints

```
Mobile:  < 640px   — single column, hide mascot hero card
Tablet:  640–900px — 2 column modules grid
Desktop: > 900px   — 3 column modules, full hero layout
Wide:    > 1280px  — max-width 1400px, centered
```
