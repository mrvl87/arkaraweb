# Arkara CMS Component Map

Daftar komponen foundation baru dan cara pakainya.

## `src/components/ui/button.tsx`

`Button` untuk aksi utama, sekunder, ghost, danger, dan accent.

```tsx
<Button type="submit">Simpan</Button>
<Button variant="accent">Masuk</Button>
<Button variant="secondary" size="sm">Batal</Button>
```

## `src/components/ui/card.tsx`

`Card`, `CardHeader`, `CardContent`, dan `CardTitle` untuk panel surface.

```tsx
<Card interactive>
  <CardContent>
    Konten panel
  </CardContent>
</Card>
```

## `src/components/ui/input.tsx`

`Input` untuk field satu baris. Gunakan `hasError` untuk state validasi.

```tsx
<Input {...register('title')} hasError={Boolean(errors.title)} />
```

## `src/components/ui/textarea.tsx`

`Textarea` untuk field multi-baris.

```tsx
<Textarea rows={4} hasError={Boolean(errors.description)} />
```

## `src/components/ui/select.tsx`

`Select` untuk dropdown form.

```tsx
<Select {...register('status')}>
  <option value="draft">Draft</option>
  <option value="published">Published</option>
</Select>
```

## `src/components/ui/badge.tsx`

`Badge` untuk status kecil.

```tsx
<Badge variant="success">Published</Badge>
<Badge variant="warning">Draft</Badge>
```

## `src/components/ui/page-header.tsx`

`PageHeader` untuk judul halaman CMS.

```tsx
<PageHeader
  title="Ringkasan"
  accent="Sistem"
  description="Panel kendali utama pengetahuan Arkara."
  action={<Button>Tambah</Button>}
/>
```

## `src/components/ui/form-section.tsx`

`FormSection` untuk mengelompokkan field form.

```tsx
<FormSection title="SEO" description="Metadata untuk Google.">
  <Input name="meta_title" />
</FormSection>
```

## `src/components/ui/empty-state.tsx`

`EmptyState` untuk kondisi kosong.

```tsx
<EmptyState
  title="Belum ada data"
  description="Mulai dengan membuat artikel baru."
  action={<Button>Tambah Artikel</Button>}
/>
```

## Refactor Target

- Login: sudah memakai `Card`, `Input`, dan `Button`.
- Dashboard: sudah memakai `PageHeader`, `Card`, `CardContent`, dan `EmptyState`.
- SEO Cockpit: `page.tsx` sudah dipecah ke `src/app/cms/seo/_components`.
- Berikutnya: posts list dapat dipindahkan ke table UI baru berbasis `Badge`.
- Berikutnya: post form dapat dipotong menjadi `FormSection`, `Input`, `Textarea`, `Select`, dan `Button`.
## SEO Cockpit Components

Lokasi: `src/app/cms/seo/_components`.

- `seo-page-header.tsx`: header halaman SEO Cockpit dan shortcut ke AI Workspace / draft baru.
- `seo-metric-card.tsx`: kartu metrik ringkas. Label utama readiness sekarang memakai `SEO Readiness`, yaitu content readiness internal, bukan ranking Google aktual.
- `keyword-gap-section.tsx`: wrapper section keyword gap otomatis, status Serper, dan daftar opportunity.
- `keyword-opportunity-row.tsx`: baris opportunity per query, termasuk rank/gap badge, kompetitor, PAA/related, dan tombol draft.
- `content-fix-section.tsx`: panel prioritas konten yang perlu dibenahi dan visibility prompt mingguan.
- `content-fix-row.tsx`: baris audit konten dengan issue, word count, FAQ, internal link, score readiness, dan link edit.
- `cluster-panel.tsx`: kartu status cluster Arkara dan seed keyword.
- `seo-pipeline.tsx`: visual urutan kerja SEO berikutnya.
- `todays-seo-actions.tsx`: panel prioritas kerja harian dari repair critical, keyword gap, indexing queue, dan high priority keyword signal.
- `seo-style-utils.ts`: helper class visual untuk score/readiness agar badge readiness konsisten di SEO Cockpit.

Pemakaian utama:

```tsx
<SeoPageHeader />
<SeoMetricCard label="SEO Readiness" value={averageScore} icon={Gauge} />
<TodaysSeoActions data={data} indexingQueue={indexingQueue} />
<KeywordGapSection opportunities={keywordOpportunities} serper={serper} />
<ContentFixSection items={topFixes} visibilityPrompts={visibilityPrompts} publishedContent={published} draftContent={draft} />
<SeoPipeline />
```
