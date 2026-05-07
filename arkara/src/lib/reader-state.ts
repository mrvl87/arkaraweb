type ReaderType = 'blog' | 'panduan';

type ReaderItem = {
  id: string;
  type: ReaderType;
  slug: string;
  title: string;
  href: string;
  image?: string;
  category?: string;
  percent?: number;
  readingTime?: number;
  lastReadAt?: number;
  savedAt?: number;
};

const PROGRESS_KEY = 'arkara:reading-progress:v1';
const BOOKMARK_KEY = 'arkara:bookmarks:v1';
const MAX_ITEMS = 24;

function canUseStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function readStore(key: string): Record<string, ReaderItem> {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(key: string, value: Record<string, ReaderItem>) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage quota should not break reading.
  }
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getSortedItems(store: Record<string, ReaderItem>) {
  return Object.values(store)
    .filter((item) => item && item.id && item.href && item.title)
    .sort((a, b) => (b.lastReadAt || b.savedAt || 0) - (a.lastReadAt || a.savedAt || 0));
}

function trimStore(store: Record<string, ReaderItem>) {
  return Object.fromEntries(
    getSortedItems(store)
      .slice(0, MAX_ITEMS)
      .map((item) => [item.id, item])
  );
}

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] || char;
  });
}

function getItemFromElement(element: HTMLElement): ReaderItem | null {
  const id = element.dataset.readerId;
  const slug = element.dataset.readerSlug;
  const title = element.dataset.readerTitle;
  const href = element.dataset.readerHref;

  if (!id || !slug || !title || !href) return null;

  return {
    id,
    slug,
    title,
    href,
    type: element.dataset.readerType === 'panduan' ? 'panduan' : 'blog',
    image: element.dataset.readerImage || undefined,
    category: element.dataset.readerCategory || undefined,
  };
}

function getItemFromSaveButton(button: HTMLElement): ReaderItem | null {
  const host = button.closest<HTMLElement>('[data-reader-card]');
  return host ? getItemFromElement(host) : null;
}

function isSaved(itemId: string) {
  return Boolean(readStore(BOOKMARK_KEY)[itemId]);
}

function setSaveButtonState(button: HTMLElement, saved: boolean) {
  button.classList.toggle('is-saved', saved);
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', saved ? 'Hapus dari simpanan' : 'Simpan artikel');
}

function bindSaveButtons(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-reader-save]').forEach((button) => {
    const item = getItemFromSaveButton(button);
    if (!item) return;

    setSaveButtonState(button, isSaved(item.id));
    if (button.dataset.readerSaveBound === 'true') return;
    button.dataset.readerSaveBound = 'true';

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const currentItem = getItemFromSaveButton(button);
      if (!currentItem) return;

      const store = readStore(BOOKMARK_KEY);
      const nextSaved = !store[currentItem.id];

      if (nextSaved) {
        store[currentItem.id] = {
          ...currentItem,
          savedAt: Date.now(),
        };
      } else {
        delete store[currentItem.id];
      }

      writeStore(BOOKMARK_KEY, trimStore(store));
      setSaveButtonState(button, nextSaved);
    });

    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      button.click();
    });
  });
}

function renderBookmarkIcon() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
      <path d="M7 4h10v16l-5-3.2L7 20V4Z"></path>
    </svg>
  `;
}

function renderProgressItem(item: ReaderItem) {
  const percent = clampPercent(item.percent || 0);
  const label = percent > 0 ? `${percent}% selesai` : 'Mulai baca';
  const image = item.image
    ? `<div class="mobile-continue-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async"></div>`
    : `<div class="mobile-continue-image mobile-continue-image--empty" aria-hidden="true"></div>`;

  return `
    <article
      class="mobile-continue-item"
      data-reader-card
      data-reader-id="${escapeHtml(item.id)}"
      data-reader-type="${escapeHtml(item.type)}"
      data-reader-slug="${escapeHtml(item.slug)}"
      data-reader-title="${escapeHtml(item.title)}"
      data-reader-href="${escapeHtml(item.href)}"
      data-reader-image="${escapeHtml(item.image || '')}"
      data-reader-category="${escapeHtml(item.category || '')}"
    >
      <a href="${escapeHtml(item.href)}" class="mobile-continue-link">
        ${image}
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <span data-reader-progress-label>${label}</span>
          <div class="mobile-progress"><i data-reader-progress-bar style="width:${percent}%"></i></div>
        </div>
      </a>
      <button type="button" class="mobile-small-bookmark reader-save-button" data-reader-save aria-pressed="false">
        ${renderBookmarkIcon()}
      </button>
    </article>
  `;
}

export function trackCurrentReaderContent(meta: ReaderItem) {
  if (!canUseStorage() || !meta?.id || !meta.href || !meta.title) return;

  let lastSavedPercent = 0;
  let pending = false;

  function calculateProgress() {
    const scrolling = document.scrollingElement || document.documentElement;
    const total = Math.max(1, scrolling.scrollHeight - window.innerHeight);
    return clampPercent((window.scrollY / total) * 100);
  }

  function persist(force = false) {
    const percent = calculateProgress();
    if (!force && Math.abs(percent - lastSavedPercent) < 5 && percent < 96) return;

    lastSavedPercent = percent;
    const store = readStore(PROGRESS_KEY);
    const existing = store[meta.id];

    store[meta.id] = {
      ...existing,
      ...meta,
      percent: Math.max(percent, existing?.percent || 0),
      lastReadAt: Date.now(),
    };

    writeStore(PROGRESS_KEY, trimStore(store));
  }

  function schedulePersist() {
    if (pending) return;
    pending = true;

    window.setTimeout(() => {
      pending = false;
      persist();
    }, 450);
  }

  persist(true);
  window.addEventListener('scroll', schedulePersist, { passive: true });
  window.addEventListener('pagehide', () => persist(true));
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist(true);
  });
}

export function enhanceMobileReadingList() {
  if (!canUseStorage()) return;

  const list = document.querySelector<HTMLElement>('[data-mobile-continue-list]');
  if (!list) return;

  document.querySelectorAll<HTMLElement>('.mobile-feature-card .mobile-bookmark').forEach((button) => {
    button.setAttribute('data-reader-save', '');
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
  });

  const progressItems = getSortedItems(readStore(PROGRESS_KEY))
    .filter((item) => {
      const percent = clampPercent(item.percent || 0);
      return percent > 0 && percent < 100;
    })
    .slice(0, 2);

  if (progressItems.length > 0) {
    list.innerHTML = progressItems.map(renderProgressItem).join('');
  } else {
    list.querySelectorAll<HTMLElement>('[data-reader-card]').forEach((card) => {
      const label = card.querySelector<HTMLElement>('[data-reader-progress-label]');
      const bar = card.querySelector<HTMLElement>('[data-reader-progress-bar]');
      if (label) label.textContent = 'Mulai baca';
      if (bar) bar.style.width = '0%';
    });
  }

  bindSaveButtons(list);
  bindSaveButtons(document);
}
