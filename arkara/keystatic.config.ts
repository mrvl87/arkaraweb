import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },

  collections: {
    blog: collection({
      label: 'Artikel Blog',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Judul' },
        }),
        description: fields.text({
          label: 'Deskripsi',
          multiline: true,
        }),
        publishDate: fields.date({
          label: 'Tanggal Terbit',
        }),
        category: fields.select({
          label: 'Kategori',
          options: [
            { label: 'Air', value: 'air' },
            { label: 'Energi', value: 'energi' },
            { label: 'Pangan', value: 'pangan' },
            { label: 'Medis', value: 'medis' },
            { label: 'Keamanan', value: 'keamanan' },
            { label: 'Komunitas', value: 'komunitas' },
          ],
          defaultValue: 'pangan',
        }),
        coverImage: fields.image({
          label: 'Gambar Cover',
          directory: 'public/images/blog',
          publicPath: '/images/blog',
        }),
        aiGenerated: fields.checkbox({
          label: 'Dibuat dengan AI',
          defaultValue: false,
        }),
        content: fields.mdx({
          label: 'Konten',
        }),
      },
    }),

    panduan: collection({
      label: 'Panduan Teknis',
      slugField: 'title',
      path: 'src/content/panduan/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Judul Panduan' },
        }),
        babRef: fields.text({
          label: 'Referensi Bab Buku (e.g. bab-3)',
        }),
        qrSlug: fields.text({
          label: 'QR Slug (e.g. pompa-air)',
        }),
        content: fields.mdx({
          label: 'Konten Teknis',
        }),
      },
    }),
  },
});
