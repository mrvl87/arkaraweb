\# Arkara Brand Tokens — Complete Design System



\## Identity



| Item | Value |

|---|---|

| Brand name | Arkara |

| Tagline | Survive with Knowledge |

| Domain | arkara.id |

| Language | Bahasa Indonesia |

| Niche | Survival / Prepper / Pengetahuan darurat |

| Book title | Buku Pegangan Krisis |



\---



\## Color System — Earthy Nature × Modern Tech



\### Primary Palette



| Token | Hex | Usage |

|---|---|---|

| `--forest` | `#1F3D2B` | Brand utama, heading, dark background, navbar |

| `--brown`  | `#6B4F3A` | Subheading, secondary elements, hover states |

| `--stone`  | `#5C5F61` | Body text, UI neutral, metadata, captions |



\### Accent Colors



| Token | Hex | Usage |

|---|---|---|

| `--amber`     | `#D98C2B` | CTA buttons, highlights, active states, fire/energy |

| `--moss`      | `#6E8B3D` | Success states, nature tags, TIPS LAPANGAN boxes |

| `--sand`      | `#E6D8B5` | Card backgrounds, borders, dividers |

| `--parchment` | `#F5F0E8` | Page background, book-feel surfaces |

| `--ink`       | `#1A1208` | Dark mode background, footer |



\### Semantic Colors



| Token | Hex | Usage |

|---|---|---|

| `--danger`  | `#C0392B` | PERINGATAN boxes, error states, critical alerts |

| `--info`    | `#5C7A8A` | Info boxes, KONTEKS INDONESIA tags |

| `--warning` | `#D98C2B` | (same as amber) Caution states |



\### Combinations (Proven)

\- \*\*Primary combo\*\*: Forest Green bg + Sand text + Amber CTA

\- \*\*Card combo\*\*: Parchment bg + Brown heading + Stone body

\- \*\*Dark section\*\*: Ink bg + Sand heading + Amber accent

\- \*\*Success/tip\*\*: Moss left-border + Parchment bg + Forest text



\---



\## Typography System



\### Font Stack



```css

/\* Display — judul, nama brand, bab \*/

font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;

font-weight: 700 | 900;



/\* Body — konten artikel, panduan \*/

font-family: 'Source Sans 3', 'Helvetica Neue', system-ui, sans-serif;

font-weight: 300 | 400 | 600;



/\* UI — label, badge, navigasi, tombol \*/

font-family: 'Source Sans 3', system-ui, sans-serif;

font-weight: 600;

text-transform: uppercase;

letter-spacing: 0.08em;



/\* Mono — kode, URL, QR label, data teknis \*/

font-family: 'JetBrains Mono', 'Fira Mono', monospace;

font-weight: 400;

```



\### Google Fonts Import



```html

<link rel="preconnect" href="https://fonts.googleapis.com">

<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900\&family=Source+Sans+3:wght@300;400;600\&family=JetBrains+Mono\&display=swap" rel="stylesheet">

```



\### Type Scale



| Element | Font | Size | Weight | Color |

|---|---|---|---|---|

| Brand name / H1 | Playfair Display | 52–72px | 900 | Forest |

| Chapter title / H2 | Playfair Display | 36–48px | 700 | Forest |

| Section title / H3 | Playfair Display | 24–30px | 700 | Brown |

| Sub-section / H4 | Source Sans 3 | 18–20px | 600 | Brown |

| Body paragraph | Source Sans 3 | 16–18px | 400 | Stone |

| Caption / meta | Source Sans 3 | 12–14px | 400 | Stone 70% |

| UI label / badge | Source Sans 3 | 10–12px | 600 + uppercase | varies |

| Code / URL | JetBrains Mono | 13–14px | 400 | Forest |



\---



\## Spacing \& Layout



```css

/\* Spacing scale \*/

\--space-xs:  4px

\--space-sm:  8px

\--space-md:  16px

\--space-lg:  24px

\--space-xl:  40px

\--space-2xl: 64px

\--space-3xl: 96px



/\* Border radius \*/

\--radius-sm: 4px

\--radius-md: 8px

\--radius-lg: 12px

\--radius-xl: 16px

\--radius-pill: 999px



/\* Max content width \*/

\--content-width: 720px

\--wide-width: 1080px

```



\---



\## Component Patterns



\### Info Box Types (for book \& blog)



```

PERINGATAN   → red left border (#C0392B) + parchment bg

TIPS LAPANGAN → moss left border (#6E8B3D) + parchment bg

KONTEKS INDONESIA → info left border (#5C7A8A) + parchment bg

YANG PERLU DISIAPKAN → amber left border (#D98C2B) + parchment bg

LANGKAH      → numbered + forest bg + sand text

```



\### CTA Button



```css

background: #D98C2B;    /\* amber \*/

color: #1F3D2B;         /\* forest \*/

font-family: 'Source Sans 3';

font-weight: 600;

text-transform: uppercase;

letter-spacing: 0.06em;

border-radius: 6px;

padding: 10px 24px;

```



\### Card



```css

background: #F5F0E8;    /\* parchment \*/

border: 1px solid #E6D8B5;  /\* sand \*/

border-radius: 12px;

padding: 20px 24px;

```



\### Tag / Badge



```css

/\* Category tag \*/

background: #1F3D2B;    /\* forest \*/

color: #E6D8B5;         /\* sand \*/

font-size: 11px;

font-weight: 600;

letter-spacing: 0.1em;

text-transform: uppercase;

border-radius: 999px;

padding: 3px 12px;

```



\---



\## Logo Variants



| Variant | Background | Use case |

|---|---|---|

| Logo Light | Parchment / White | Website header, print, book cover |

| Logo Dark | Forest (#1F3D2B) | YouTube thumbnail, dark sections, app icon |

| Logo Earth | Brown (#6B4F3A) | Merchandise, poster, social media |



Logo concept: stylized tree with roots (akar) growing downward, symbolizing knowledge that runs deep. The "A" lettermark with roots is the icon mark.



\---



\## Illustration Style Guide (for Nano Banana 2 prompts)



\### Line Art (Technical diagrams, schematics)

```

Prefix: "clean black and white line art technical diagram, 

minimalist blueprint style, precise engineering drawing aesthetic,

thin consistent stroke weight, white background, survival manual style, "

```



\### Semi-Illustrative (Scene illustrations, chapter openers)

```

Prefix: "semi-realistic illustration, warm earthy color palette #1F3D2B #D98C2B #E6D8B5,

slightly stylized, Indonesian tropical setting, kampung background,

volcanic mountains, tropical vegetation, survival guide aesthetic, "

```



\### Negative prompt (always append)

```

"photorealistic, photograph, 3D render, CGI, watermark, text, logo, 

signature, blurry, low quality, nsfw"

```

