# Components Reference

Full component code for the Arkara Retro Survival Manual 2.0 design system.

---

## BaseLayout.astro

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}
const { title, description = 'Survive with Knowledge', ogImage } = Astro.props;
const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'https://arkara.id';
---
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — ARKARA</title>
  <meta name="description" content={description} />
  {ogImage && <meta property="og:image" content={ogImage} />}
  <meta property="og:site_name" content="ARKARA" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Share+Tech+Mono&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet" />
</head>
<body>
  <!-- Visual FX layers -->
  <div class="bg-gradient" aria-hidden="true"></div>
  <div class="bg-grid" aria-hidden="true"></div>

  <slot />
</body>
</html>
```

---

## Nav.astro

```astro
---
// src/components/layout/Nav.astro
interface Props {
  status?: string;
}
const { status = 'SISTEM AKTIF — SIAGA 2' } = Astro.props;

const navLinks = [
  { label: 'MODUL', href: '/modul' },
  { label: 'ARTIKEL', href: '/blog' },
  { label: 'PANDUAN', href: '/panduan' },
  { label: 'TENTANG', href: '/tentang' },
];
---
<nav class="nav">
  <div class="nav-brand">
    <span class="nav-cursor" aria-hidden="true"></span>
    ARKARA_OS v2.0 — SURVIVAL MANUAL
  </div>
  <ul class="nav-links" role="list">
    {navLinks.map(link => (
      <li>
        <a href={link.href} class="nav-link">
          {link.label}
        </a>
      </li>
    ))}
  </ul>
  <div class="nav-status" aria-label="Status sistem">◉ {status}</div>
</nav>

<style>
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: var(--ink);
    border-bottom: 3px solid var(--green-terminal);
    padding: 0 2rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 52px;
  }
  .nav-brand {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.75rem; color: var(--green-terminal); letter-spacing: 0.15em;
    display: flex; align-items: center; gap: 0.75rem;
  }
  .nav-cursor {
    display: inline-block; width: 8px; height: 14px;
    background: var(--green-terminal);
    animation: blink 1.2s steps(1) infinite;
  }
  .nav-links { display: flex; gap: 0; list-style: none; }
  .nav-link {
    font-family: 'Share Tech Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.12em; color: var(--cream-dark);
    text-decoration: none; padding: 0.5rem 1rem;
    border-left: 1px solid rgba(143,175,143,0.2);
    transition: all 0.15s; text-transform: uppercase; display: block;
  }
  .nav-link:hover { background: var(--green-dark); color: var(--green-terminal); }
  .nav-status {
    font-family: 'Share Tech Mono', monospace; font-size: 0.62rem;
    color: var(--yellow-manual); letter-spacing: 0.1em;
  }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @media (max-width: 768px) { .nav-links { display: none; } .nav { padding: 0 1rem; } }
</style>
```

---

## ModuleCard.astro

```astro
---
// src/components/content/ModuleCard.astro
interface Props {
  number: string;       // "MODULE 01"
  icon: string;         // emoji
  name: string;
  description: string;
  tag: string;          // "12 PELAJARAN • DASAR"
  featured?: boolean;
  href: string;
}
const { number, icon, name, description, tag, featured = false, href } = Astro.props;
---
<a href={href} class:list={['module-card', featured && 'module-card--featured']}>
  <span class="module-number">{number}</span>
  <span class="module-icon" aria-hidden="true">{icon}</span>
  <h3 class="module-name" set:html={name.replace(' &<br>', '<br>')} />
  <p class="module-desc">{description}</p>
  <span class="module-tag">{tag}</span>
</a>

<style>
  .module-card {
    background: var(--paper); padding: 2rem; position: relative;
    cursor: pointer; display: flex; flex-direction: column;
    min-height: 240px; text-decoration: none; color: inherit;
    transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .module-card:hover {
    background: var(--paper-dark); z-index: 10;
    transform: scale(1.02);
    box-shadow: 0 0 0 3px var(--ink), 6px 6px 0 var(--ink);
  }
  .module-card--featured { background: var(--ink); color: var(--cream); }
  .module-card--featured:hover { background: var(--ink-light); }

  .module-number {
    font-family: 'Share Tech Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.2em; color: var(--warm-grey); margin-bottom: 1rem;
    text-transform: uppercase;
  }
  .module-card--featured .module-number { color: var(--green-terminal); }

  .module-icon { font-size: 2.5rem; margin-bottom: 1rem; display: block; }

  .module-name {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 1.5rem; text-transform: uppercase; line-height: 1.1;
    margin-bottom: 0.5rem; color: var(--ink);
  }
  .module-card--featured .module-name { color: var(--green-terminal); }

  .module-desc { font-size: 0.8rem; color: var(--warm-grey-dark); line-height: 1.6; flex: 1; }
  .module-card--featured .module-desc { color: var(--warm-grey); }

  .module-tag {
    margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.4rem;
    font-family: 'Share Tech Mono', monospace; font-size: 0.58rem;
    letter-spacing: 0.15em; color: var(--green-muted); text-transform: uppercase;
  }
  .module-tag::before { content: ''; width: 16px; height: 1px; background: currentColor; }
  .module-card--featured .module-tag { color: var(--yellow-manual); }
</style>
```

---

## FieldNote.astro

```astro
---
// src/components/content/FieldNote.astro
interface Props {
  number: string;
  title: string;
  badge?: 'warning' | 'safe' | 'note' | 'critical';
  badgeLabel?: string;
}
const { number, title, badge, badgeLabel } = Astro.props;

const badgeDefaults = { warning: 'PERINGATAN', safe: 'AMAN', note: 'CATATAN', critical: 'KRITIS' };
---
<div class="tip-card">
  <div class="tip-num">{number}</div>
  <div class="tip-content">
    <h4 class="tip-title">{title}</h4>
    <p class="tip-text"><slot /></p>
    {badge && (
      <span class:list={['tip-badge', `tip-badge--${badge}`]}>
        {badgeLabel ?? badgeDefaults[badge]}
      </span>
    )}
  </div>
</div>

<style>
  .tip-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(143,175,143,0.2);
    padding: 1.5rem; display: flex; gap: 1.2rem; align-items: flex-start;
    transition: all 0.2s;
  }
  .tip-card:hover { background: rgba(143,175,143,0.08); border-color: var(--green-terminal); }

  .tip-num {
    font-family: 'Share Tech Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.1em; color: var(--green-terminal);
    background: rgba(143,175,143,0.1); border: 1px solid var(--green-terminal);
    padding: 0.3rem 0.5rem; min-width: 52px; text-align: center;
    margin-top: 0.1rem; flex-shrink: 0;
  }

  .tip-title {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 1.1rem; text-transform: uppercase; color: var(--cream);
    margin-bottom: 0.4rem; letter-spacing: 0.02em;
  }
  .tip-text { font-size: 0.8rem; color: var(--warm-grey); line-height: 1.65; }

  .tip-badge {
    display: inline-flex; margin-top: 0.6rem;
    font-family: 'Share Tech Mono', monospace; font-size: 0.58rem;
    letter-spacing: 0.12em; padding: 0.2rem 0.5rem; border: 1px solid;
    text-transform: uppercase;
  }
  .tip-badge--warning  { color: var(--red-warning);    border-color: var(--red-warning); }
  .tip-badge--safe     { color: var(--green-terminal); border-color: var(--green-terminal); }
  .tip-badge--note     { color: var(--yellow-manual);  border-color: var(--yellow-manual); }
  .tip-badge--critical { color: var(--red-dark);       border-color: var(--red-dark); background: rgba(184,92,92,0.1); }
</style>
```

---

## WarningBand.astro

```astro
---
// src/components/ui/WarningBand.astro
interface Props {
  items: string[];
}
const { items } = Astro.props;
// Duplicate items for seamless loop
const doubled = [...items, ...items];
---
<div class="warning-band" role="marquee" aria-label="Pesan penting">
  <div class="warning-scroll">
    {doubled.map(item => (
      <span class="warning-item">{item}</span>
    ))}
  </div>
</div>

<style>
  .warning-band {
    background: var(--yellow-manual);
    border-top: 3px solid var(--ink); border-bottom: 3px solid var(--ink);
    padding: 0.6rem 0; overflow: hidden;
  }
  .warning-scroll {
    display: flex; gap: 3rem;
    animation: scroll-left 20s linear infinite; white-space: nowrap;
  }
  .warning-item {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 0.8rem; letter-spacing: 0.2em; color: var(--ink);
    text-transform: uppercase; display: inline-flex; align-items: center; gap: 1rem;
  }
  .warning-item::before { content: '◆'; font-size: 0.5rem; color: var(--red-warning); }
  @keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
</style>
```

---

## ChecklistPanel.astro

```astro
---
// src/components/content/ChecklistPanel.astro
interface Props {
  title?: string;
  items: { label: string; status: 'done' | 'warn' | 'danger' }[];
}
const { title = 'CHECKLIST KESIAPAN', items } = Astro.props;

const statusMap = { done: '✓', warn: '!', danger: '✗' };
---
<div class="checklist-panel">
  <div class="panel-title">
    <span class="status-dot" aria-hidden="true"></span>
    {title}
  </div>
  <ul class="checklist" role="list">
    {items.map(item => (
      <li class="checklist-item">
        <span class:list={['check-box', `check-box--${item.status}`]} aria-label={item.status}>
          {statusMap[item.status]}
        </span>
        {item.label}
      </li>
    ))}
  </ul>
</div>

<style>
  .checklist-panel {
    background: var(--paper); border: 3px solid var(--ink);
    box-shadow: 6px 6px 0 var(--ink); padding: 2rem;
  }
  .panel-title {
    font-family: 'Share Tech Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.2em; color: var(--warm-grey); text-transform: uppercase;
    margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.8rem;
  }
  .status-dot {
    width: 8px; height: 8px; background: var(--green-terminal);
    border-radius: 50%; box-shadow: 0 0 8px var(--green-terminal);
    animation: pulse 2s infinite; flex-shrink: 0;
  }
  .checklist { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
  .checklist-item {
    display: flex; align-items: center; gap: 1rem;
    font-family: 'Share Tech Mono', monospace; font-size: 0.72rem;
    letter-spacing: 0.05em; color: var(--ink-light);
    padding: 0.6rem 0; border-bottom: 1px dashed var(--cream-dark);
  }
  .check-box {
    width: 18px; height: 18px; border: 2px solid var(--ink);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 0.65rem; font-weight: bold;
  }
  .check-box--done   { background: var(--green-terminal); border-color: var(--green-dark); color: white; }
  .check-box--warn   { background: var(--yellow-manual);  border-color: var(--yellow-dark); color: var(--ink); }
  .check-box--danger { background: var(--red-warning);    border-color: var(--red-dark); color: white; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
```

---

## GuideBuddy.astro

```astro
---
// src/components/content/GuideBuddy.astro
// Guide Buddy mascot — three poses
interface Props {
  pose?: 'thumbsup' | 'thinking' | 'alert';
  message?: string;
  size?: number;
}
const { pose = 'thumbsup', message, size = 120 } = Astro.props;
---
<div class="buddy-wrap">
  {pose === 'thumbsup' && (
    <svg width={size} height={Math.round(size * 1.27)} viewBox="0 0 120 152" aria-label="Guide Buddy memberi thumbs up" role="img">
      <!-- Body -->
      <rect x="36" y="62" width="48" height="55" rx="6" fill="#3D5C3D" stroke="#2A2218" stroke-width="2.5"/>
      <!-- Head -->
      <ellipse cx="60" cy="38" rx="28" ry="30" fill="#D8C58A" stroke="#2A2218" stroke-width="2.5"/>
      <!-- Hair -->
      <path d="M32 30 Q36 10 60 8 Q84 10 88 30" fill="#2A2218"/>
      <!-- Eyes -->
      <circle cx="50" cy="35" r="4" fill="#2A2218"/>
      <circle cx="70" cy="35" r="4" fill="#2A2218"/>
      <circle cx="51.5" cy="33.5" r="1.5" fill="white"/>
      <circle cx="71.5" cy="33.5" r="1.5" fill="white"/>
      <!-- Smile -->
      <path d="M50 48 Q60 56 70 48" stroke="#2A2218" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Blush -->
      <ellipse cx="42" cy="45" rx="6" ry="4" fill="#B85C5C" opacity="0.3"/>
      <ellipse cx="78" cy="45" rx="6" ry="4" fill="#B85C5C" opacity="0.3"/>
      <!-- Left arm thumbs up -->
      <rect x="10" y="62" width="14" height="32" rx="7" fill="#D8C58A" stroke="#2A2218" stroke-width="2" transform="rotate(-15 17 78)"/>
      <ellipse cx="8" cy="56" rx="8" ry="10" fill="#D8C58A" stroke="#2A2218" stroke-width="2" transform="rotate(-20 8 56)"/>
      <!-- Right arm -->
      <rect x="96" y="62" width="14" height="32" rx="7" fill="#D8C58A" stroke="#2A2218" stroke-width="2" transform="rotate(10 103 78)"/>
      <!-- Headset -->
      <path d="M32 28 Q32 4 60 2 Q88 4 88 28" stroke="#2A2218" stroke-width="3.5" fill="none"/>
      <rect x="24" y="24" width="12" height="16" rx="4" fill="#8FAF8F" stroke="#2A2218" stroke-width="2"/>
      <rect x="84" y="24" width="12" height="16" rx="4" fill="#8FAF8F" stroke="#2A2218" stroke-width="2"/>
      <!-- Legs -->
      <rect x="40" y="114" width="14" height="26" rx="5" fill="#2A2218" stroke="#2A2218" stroke-width="1.5"/>
      <rect x="66" y="114" width="14" height="26" rx="5" fill="#2A2218" stroke="#2A2218" stroke-width="1.5"/>
      <!-- Boots -->
      <rect x="34" y="130" width="24" height="12" rx="4" fill="#3D5C3D" stroke="#2A2218" stroke-width="1.5"/>
      <rect x="62" y="130" width="24" height="12" rx="4" fill="#3D5C3D" stroke="#2A2218" stroke-width="1.5"/>
    </svg>
  )}

  {pose === 'thinking' && (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 120 144" aria-label="Guide Buddy sedang berpikir" role="img">
      <rect x="36" y="72" width="48" height="55" rx="6" fill="#3D5C3D" stroke="#8FAF8F" stroke-width="2"/>
      <ellipse cx="60" cy="45" rx="28" ry="30" fill="#D8C58A" stroke="#8FAF8F" stroke-width="2.5"/>
      <path d="M32 38 Q36 18 60 16 Q84 18 88 38" fill="#2A2218"/>
      <circle cx="50" cy="42" r="4" fill="#2A2218"/>
      <circle cx="70" cy="42" r="4" fill="#2A2218"/>
      <!-- Thinking brows -->
      <line x1="47" y1="35" x2="54" y2="37" stroke="#2A2218" stroke-width="2" stroke-linecap="round"/>
      <line x1="73" y1="35" x2="67" y2="37" stroke="#2A2218" stroke-width="2" stroke-linecap="round"/>
      <path d="M50 55 Q60 60 70 55" stroke="#2A2218" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Thought bubble -->
      <circle cx="92" cy="22" r="3" fill="rgba(143,175,143,0.4)" stroke="#8FAF8F" stroke-width="1"/>
      <circle cx="100" cy="14" r="5" fill="rgba(143,175,143,0.4)" stroke="#8FAF8F" stroke-width="1"/>
      <circle cx="110" cy="6" r="7" fill="rgba(143,175,143,0.3)" stroke="#8FAF8F" stroke-width="1"/>
      <!-- Hand on chin -->
      <rect x="16" y="74" width="22" height="12" rx="6" fill="#D8C58A" stroke="#8FAF8F" stroke-width="2"/>
      <ellipse cx="24" cy="68" rx="8" ry="7" fill="#D8C58A" stroke="#8FAF8F" stroke-width="2"/>
      <rect x="82" y="74" width="22" height="12" rx="6" fill="#D8C58A" stroke="#8FAF8F" stroke-width="2"/>
      <rect x="40" y="124" width="16" height="14" rx="4" fill="#2A2218" stroke="#8FAF8F" stroke-width="1.5"/>
      <rect x="64" y="124" width="16" height="14" rx="4" fill="#2A2218" stroke="#8FAF8F" stroke-width="1.5"/>
    </svg>
  )}

  {pose === 'alert' && (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 120 144" aria-label="Guide Buddy memberikan peringatan" role="img">
      <rect x="36" y="72" width="48" height="55" rx="6" fill="#B85C5C" stroke="#2A2218" stroke-width="2.5"/>
      <ellipse cx="60" cy="45" rx="28" ry="30" fill="#D8C58A" stroke="#2A2218" stroke-width="2.5"/>
      <path d="M32 38 Q36 18 60 16 Q84 18 88 38" fill="#2A2218"/>
      <!-- Alert eyes - wide -->
      <circle cx="50" cy="40" r="6" fill="#2A2218"/>
      <circle cx="70" cy="40" r="6" fill="#2A2218"/>
      <circle cx="52" cy="38" r="2" fill="white"/>
      <circle cx="72" cy="38" r="2" fill="white"/>
      <!-- Alert mouth - open O -->
      <ellipse cx="60" cy="54" rx="6" ry="5" fill="#2A2218"/>
      <!-- Raised arms -->
      <rect x="8" y="58" width="14" height="32" rx="7" fill="#D8C58A" stroke="#2A2218" stroke-width="2" transform="rotate(-40 15 74)"/>
      <rect x="98" y="58" width="14" height="32" rx="7" fill="#D8C58A" stroke="#2A2218" stroke-width="2" transform="rotate(40 105 74)"/>
      <!-- Warning badge on chest -->
      <rect x="46" y="82" width="28" height="20" rx="3" fill="#D8C58A" stroke="#2A2218" stroke-width="2"/>
      <text x="60" y="97" font-family="monospace" font-size="11" fill="#2A2218" text-anchor="middle" font-weight="bold">!</text>
      <rect x="40" y="124" width="14" height="14" rx="4" fill="#2A2218" stroke="#2A2218" stroke-width="1.5"/>
      <rect x="66" y="124" width="14" height="14" rx="4" fill="#2A2218" stroke="#2A2218" stroke-width="1.5"/>
    </svg>
  )}

  {message && (
    <div class="buddy-message">
      <span class="quote-mark" aria-hidden="true">"</span>
      {message}
    </div>
  )}
</div>

<style>
  .buddy-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }
  .buddy-message {
    background: rgba(143,175,143,0.08); border: 1px solid rgba(143,175,143,0.25);
    padding: 1rem 1rem 1rem 1.5rem;
    font-family: 'Share Tech Mono', monospace; font-size: 0.7rem;
    line-height: 1.7; color: var(--cream-dark); letter-spacing: 0.03em;
    position: relative; width: 100%;
  }
  .quote-mark {
    font-family: 'Special Elite', cursive; font-size: 2.5rem;
    color: var(--green-terminal); position: absolute;
    top: -0.3rem; left: 0.5rem; line-height: 1; opacity: 0.4;
  }
</style>
```

---

## Button.astro

```astro
---
// src/components/ui/Button.astro
interface Props {
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit';
  class?: string;
}
const { href, variant = 'primary', type = 'button', class: className } = Astro.props;
const Tag = href ? 'a' : 'button';
---
<Tag href={href} type={!href ? type : undefined}
  class:list={['btn', `btn--${variant}`, className]}>
  <slot />
</Tag>

<style>
  .btn {
    font-family: 'Share Tech Mono', monospace; font-size: 0.75rem;
    letter-spacing: 0.15em; text-transform: uppercase;
    padding: 0.85rem 1.8rem; cursor: pointer; text-decoration: none;
    display: inline-flex; align-items: center; gap: 0.5rem;
    transition: all 0.2s; border: 2px solid;
  }
  .btn--primary {
    background: var(--ink); color: var(--green-terminal);
    border-color: var(--green-terminal);
  }
  .btn--primary:hover {
    background: var(--green-dark);
    transform: translate(-2px, -2px); box-shadow: 4px 4px 0 var(--green-terminal);
  }
  .btn--secondary {
    background: transparent; color: var(--ink); border-color: var(--ink);
  }
  .btn--secondary:hover {
    background: var(--ink); color: var(--cream);
    transform: translate(-2px, -2px); box-shadow: 4px 4px 0 var(--ink);
  }
  .btn--ghost {
    background: transparent; color: var(--green-terminal);
    border-color: rgba(143,175,143,0.3);
  }
  .btn--ghost:hover { border-color: var(--green-terminal); background: rgba(143,175,143,0.08); }
</style>
```

---

## PostCard.astro

```astro
---
// src/components/content/PostCard.astro
interface Props {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  coverImage?: string | null;
  readingTime?: number;
}
const { slug, title, description, category, publishedAt, coverImage, readingTime } = Astro.props;

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
const dateStr = format(new Date(publishedAt), 'd MMM yyyy', { locale: localeId });
---
<a href={`/blog/${slug}`} class="post-card">
  {coverImage && (
    <div class="post-card-image">
      <img src={coverImage} alt={title} loading="lazy" />
    </div>
  )}
  <div class="post-card-body">
    <div class="post-meta">
      <span class="post-category">{category.toUpperCase()}</span>
      <span class="post-date">{dateStr}</span>
      {readingTime && <span class="post-read">{readingTime} MIN READ</span>}
    </div>
    <h3 class="post-title">{title}</h3>
    <p class="post-desc">{description}</p>
    <span class="post-link">BACA ARTIKEL →</span>
  </div>
</a>

<style>
  .post-card {
    background: var(--paper); border: 3px solid var(--ink);
    text-decoration: none; color: inherit; display: flex; flex-direction: column;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .post-card:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 var(--ink); }
  .post-card-image { aspect-ratio: 16/9; overflow: hidden; }
  .post-card-image img { width: 100%; height: 100%; object-fit: cover; filter: saturate(0.7) contrast(1.05); }
  .post-card-body { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; gap: 0.6rem; }
  .post-meta { display: flex; gap: 1rem; flex-wrap: wrap; }
  .post-category, .post-date, .post-read {
    font-family: 'Share Tech Mono', monospace; font-size: 0.58rem;
    letter-spacing: 0.15em; text-transform: uppercase;
  }
  .post-category { color: var(--green-terminal); }
  .post-date, .post-read { color: var(--warm-grey); }
  .post-title {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 1.35rem; text-transform: uppercase; line-height: 1.15;
    color: var(--ink);
  }
  .post-desc { font-size: 0.8rem; color: var(--warm-grey-dark); line-height: 1.6; flex: 1; }
  .post-link {
    font-family: 'Share Tech Mono', monospace; font-size: 0.62rem;
    letter-spacing: 0.12em; color: var(--green-terminal); margin-top: auto;
  }
</style>
```
