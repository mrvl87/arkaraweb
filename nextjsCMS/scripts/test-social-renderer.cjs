const assert = require('node:assert/strict')
const fs = require('node:fs')
const test = require('node:test')
const ts = require('typescript')

function registerTsExtension(extension) {
  require.extensions[extension] = function loadTs(module, filename) {
    const source = fs.readFileSync(filename, 'utf8')
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
      },
      fileName: filename,
    })
    module._compile(output.outputText, filename)
  }
}

registerTsExtension('.ts')
registerTsExtension('.tsx')

const { SOCIAL_RENDER_DIMENSIONS, getSocialRenderDimensions } = require('../src/lib/social/render/dimensions.ts')
const { calculateSocialMetricRates, calculateSocialMetricTotals, formatSocialRate } = require('../src/lib/social/analytics.ts')
const { getSocialRenderTemplate, resolveSocialRenderTemplateId } = require('../src/lib/social/render/template-registry.ts')
const {
  buildSocialAssetStoragePath,
  getNextSocialAssetVersion,
  renderSocialAsset,
} = require('../src/lib/social/render/render-social-asset.ts')
const {
  normalVisualSpec,
  longHeadlineVisualSpec,
  tooManyBlocksVisualSpec,
} = require('../src/lib/social/render/__fixtures__/visual-spec.ts')

test('dimensions match supported aspect ratios', () => {
  assert.deepEqual(SOCIAL_RENDER_DIMENSIONS['1:1'], { width: 1080, height: 1080 })
  assert.deepEqual(SOCIAL_RENDER_DIMENSIONS['4:5'], { width: 1080, height: 1350 })
  assert.deepEqual(SOCIAL_RENDER_DIMENSIONS['9:16'], { width: 1080, height: 1920 })
  assert.equal(getSocialRenderDimensions('4:5').height, 1350)
})

test('template registry resolves initial and legacy template ids', () => {
  assert.equal(resolveSocialRenderTemplateId('editorial-opinion-v1'), 'editorial-opinion-v1')
  assert.equal(resolveSocialRenderTemplateId('ar_carousel_series'), 'editorial-carousel-v1')
  assert.equal(resolveSocialRenderTemplateId('unknown', 'checklist'), 'editorial-checklist-v1')
  assert.equal(getSocialRenderTemplate('editorial-carousel-v1').id, 'editorial-carousel-v1')
})

test('renderer rejects missing visual spec', async () => {
  await assert.rejects(
    () => renderSocialAsset({ spec: null, templateId: 'editorial-opinion-v1', aspectRatio: '1:1' }),
    /Visual spec is required/
  )
})

test('renderer rejects long headline hard limit', async () => {
  await assert.rejects(
    () => renderSocialAsset({ spec: longHeadlineVisualSpec, templateId: 'editorial-checklist-v1' }),
    /Headline exceeds hard limit/
  )
})

test('renderer rejects too many information blocks hard limit', async () => {
  await assert.rejects(
    () => renderSocialAsset({ spec: tooManyBlocksVisualSpec, templateId: 'editorial-checklist-v1' }),
    /Information blocks exceed hard limit/
  )
})

test('renderer produces PNG for each aspect ratio without normal fixture overflow warnings', async () => {
  for (const aspectRatio of ['1:1', '4:5', '9:16']) {
    const spec = { ...normalVisualSpec, aspect_ratio: aspectRatio }
    const result = await renderSocialAsset({ spec, templateId: 'editorial-checklist-v1' })
    const expected = getSocialRenderDimensions(aspectRatio)

    assert.equal(result.width, expected.width)
    assert.equal(result.height, expected.height)
    assert.equal(result.png[0], 0x89)
    assert.equal(result.png[1], 0x50)
    assert.deepEqual(result.warnings, [])
  }
})

test('version increments from existing versions', () => {
  assert.equal(getNextSocialAssetVersion([]), 1)
  assert.equal(getNextSocialAssetVersion([1, 2, null, 4]), 5)
})

test('storage path starts with user id and preserves ownership folder', () => {
  const path = buildSocialAssetStoragePath({
    userId: 'user-123',
    postId: 'post-456',
    assetKind: 'carousel-slide',
    slideId: 'Slide ID 789',
    version: 3,
  })

  assert.equal(path.startsWith('user-123/post-456/'), true)
  assert.equal(path, 'user-123/post-456/carousel/slide-id-789-v3.png')
})
const { buildSocialTargetUrl, buildSocialCaptionWithUtm } = require('../src/lib/social/publish-pack.ts')
const { createStoredZip } = require('../src/lib/social/zip.ts')
const { calculateTitleSimilarity, findClosestTitleMatch } = require('../src/lib/social/content-map.ts')
const { SOCIAL_STRATEGY_PRESETS, CONTENT_DERIVATIVE_POST_TYPES } = require('../src/lib/social/strategy-presets.ts')
const { getVariantReadabilityStats, normalizeHeuristicScores, getVariantScoreAverage } = require('../src/lib/social/variants.ts')
const { parseSocialMetricsCsv, buildCsvMetricImportPreview, normalizeMetricNumber } = require('../src/lib/social/metric-ingestion.ts')
const {
  GenerateFacebookVariantsOutputSchema,
  GenerateSocialPerformanceReviewOutputSchema,
  GenerateFacebookPostInputSchema,
} = require('../src/lib/ai/schemas.ts')

test('publish pack target URL preserves query and adds UTM parameters', () => {
  const url = buildSocialTargetUrl({
    targetUrl: 'https://arkaraweb.com/panduan?existing=1#read',
    utmSource: 'facebook',
    utmMedium: 'social',
    utmCampaign: 'rumah siaga',
  })

  assert.equal(url, 'https://arkaraweb.com/panduan?existing=1&utm_source=facebook&utm_medium=social&utm_campaign=rumah+siaga#read')
})

test('publish pack caption uses UTM URL', () => {
  const caption = buildSocialCaptionWithUtm({
    hook: 'Hook',
    body: 'Body',
    cta: 'CTA',
    target_url: 'https://arkaraweb.com/a?x=1',
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: 'campaign',
  })

  assert.match(caption, /utm_source=facebook/)
  assert.match(caption, /utm_campaign=campaign/)
})

test('stored zip contains local and central directory signatures', () => {
  const zip = createStoredZip([
    { name: '01-cover.png', data: Buffer.from('cover') },
    { name: 'publish-notes.txt', data: Buffer.from('notes') },
  ])

  assert.equal(zip.readUInt32LE(0), 0x04034b50)
  assert.equal(zip.includes(Buffer.from('01-cover.png')), true)
  assert.equal(zip.includes(Buffer.from('publish-notes.txt')), true)
  assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054b50)
})

test('strategy presets expose classic weekly and differentiated mixes', () => {
  assert.equal(SOCIAL_STRATEGY_PRESETS.classic_weekly.label, 'Classic Weekly Plan')
  assert.equal(SOCIAL_STRATEGY_PRESETS.classic_weekly.recommendedPostTypeMix[0], 'narrative')
  assert.equal(SOCIAL_STRATEGY_PRESETS.traffic_sprint.primaryGoal.includes('klik'), true)
  assert.notDeepEqual(
    SOCIAL_STRATEGY_PRESETS.traffic_sprint.recommendedPostTypeMix,
    SOCIAL_STRATEGY_PRESETS.engagement_week.recommendedPostTypeMix
  )
  assert.equal(CONTENT_DERIVATIVE_POST_TYPES.includes('myth_vs_fact'), true)
  assert.equal(CONTENT_DERIVATIVE_POST_TYPES.includes('quote_statement'), true)
})

test('content map title similarity produces similarity warning data', () => {
  const similarity = calculateTitleSimilarity(
    'Audit Air Rumah Saat Listrik Padam',
    'Audit Air Rumah Ketika Listrik Padam'
  )
  assert.equal(similarity > 0.42, true)

  const warning = findClosestTitleMatch('Audit Air Rumah Saat Listrik Padam', [
    { id: 'post-1', title: 'Audit Air Rumah Ketika Listrik Padam' },
    { id: 'post-2', title: 'Cara Menyusun Rak Dapur Kecil' },
  ])

  assert.equal(warning.matchedPostId, 'post-1')
})
test('variant helpers calculate readability and clamp heuristic scores', () => {
  const stats = getVariantReadabilityStats('Kalau listrik padam malam ini, air habis lebih cepat dari yang Anda kira.', 'headline')
  assert.equal(stats.characters > 0, true)
  assert.equal(stats.hardLimit, 90)
  assert.equal(stats.overLimit, false)

  const scores = normalizeHeuristicScores({ clarity: 11, curiosity: -1, relevance: 8.44, brand_fit: 7, clickbait_risk: 3 })
  assert.equal(scores.clarity, 10)
  assert.equal(scores.curiosity, 0)
  assert.equal(scores.relevance, 8.4)
  assert.equal(getVariantScoreAverage(scores), 6.3)
})

test('facebook variants schema accepts heuristic editorial scores', () => {
  const parsed = GenerateFacebookVariantsOutputSchema.parse({
    variants: [
      {
        label: 'Direct consequence',
        content: 'Kalau air berhenti malam ini, stok kecil di dapur langsung jadi keputusan besar.',
        direction: 'direct_consequence',
        heuristic_scores: {
          clarity: 8,
          curiosity: 7,
          relevance: 9,
          brand_fit: 8,
          clickbait_risk: 2,
        },
        rationale: 'Konsekuensi jelas tanpa panik.',
      },
    ],
  })

  assert.equal(parsed.variants[0].direction, 'direct_consequence')
  assert.equal(parsed.variants[0].heuristic_scores.clickbait_risk, 2)
})
test('manual analytics rates protect zero denominator and calculate totals', () => {
  const zeroRates = calculateSocialMetricRates({ reach: 0, reactions: 1, comments: 1, shares: 1, link_clicks: 1 })
  assert.equal(zeroRates.share_rate, null)
  assert.equal(formatSocialRate(zeroRates.interaction_rate), 'N/A')

  const rates = calculateSocialMetricRates({ reach: 100, reactions: 10, comments: 5, shares: 3, link_clicks: 2 })
  assert.equal(rates.share_rate, 0.03)
  assert.equal(rates.comment_rate, 0.05)
  assert.equal(rates.click_rate, 0.02)
  assert.equal(rates.interaction_rate, 0.2)

  const totals = calculateSocialMetricTotals([
    { reach: 100, reactions: 10, comments: 5, shares: 3, link_clicks: 2 },
    { reach: 50, reactions: 4, comments: 1, shares: 0, link_clicks: 5 },
  ])
  assert.equal(totals.total_reach, 150)
  assert.equal(totals.total_reactions, 14)
  assert.equal(totals.total_comments, 6)
  assert.equal(totals.total_shares, 3)
  assert.equal(totals.total_link_clicks, 7)
  assert.equal(totals.average_reach, 75)
  assert.equal(totals.interaction_rate, 0.2)
})
test('performance review schema accepts evidence-based proposed learnings', () => {
  const parsed = GenerateSocialPerformanceReviewOutputSchema.parse({
    campaign_summary: 'Berdasarkan sampel saat ini, konten checklist terlihat lebih mudah dievaluasi.',
    strongest_observations: [
      {
        title: 'Checklist memiliki interaksi lebih stabil',
        observation: 'Berdasarkan sampel saat ini terlihat checklist mendapat share lebih konsisten dan perlu diuji kembali.',
        evidence_count: 3,
        confidence: 'medium',
        evidence_post_ids: ['11111111-1111-1111-1111-111111111111'],
      },
    ],
    weak_observations: [
      {
        title: 'Poster opini anecdotal',
        observation: 'Berdasarkan satu post, ini anecdotal dan perlu diuji kembali.',
        evidence_count: 1,
        confidence: 'low',
        evidence_post_ids: ['22222222-2222-2222-2222-222222222222'],
      },
    ],
    patterns_worth_testing: ['Uji checklist pada jam malam dengan CTA save.'],
    content_to_repeat: ['Checklist rumah tangga dengan langkah kecil.'],
    content_to_stop: ['Klaim kuat dari sampel tunggal.'],
    next_experiment: 'Bandingkan checklist dan scenario pada jam publikasi yang sama.',
    proposed_learnings: [
      {
        scope_type: 'post_type',
        scope_id: null,
        title: 'Checklist layak diuji ulang',
        observation: 'Berdasarkan sampel saat ini terlihat checklist punya share rate lebih stabil.',
        evidence: { post_ids: ['11111111-1111-1111-1111-111111111111'], metric: 'share_rate' },
        evidence_count: 3,
        confidence: 'medium',
        recommendation: 'Gunakan sebagai hipotesis editorial dan perlu diuji kembali.',
      },
    ],
  })

  assert.equal(parsed.proposed_learnings[0].confidence, 'medium')
  assert.equal(parsed.proposed_learnings[0].evidence_count, 3)
})

test('facebook post input accepts bounded approved learnings context', () => {
  const parsed = GenerateFacebookPostInputSchema.parse({
    title: 'Audit air rumah saat listrik padam',
    post_type: 'checklist',
    approved_learnings: [
      {
        scope_type: 'post_type',
        title: 'Checklist terlihat stabil',
        observation: 'Berdasarkan sampel saat ini terlihat checklist lebih sering disimpan.',
        recommendation: 'Uji kembali checklist dengan CTA save.',
        evidence_count: 4,
        confidence: 'medium',
      },
    ],
  })

  assert.equal(parsed.approved_learnings.length, 1)
  assert.equal(parsed.approved_learnings[0].scope_type, 'post_type')
})
test('social metric CSV parser handles quoted cells and numeric normalization', () => {
  const parsed = parseSocialMetricsCsv('Title,Reach,Comments\n"Audit, Air",1.234,5\nChecklist,"2,345",7')

  assert.deepEqual(parsed.columns, ['Title', 'Reach', 'Comments'])
  assert.equal(parsed.rows[0].Title, 'Audit, Air')
  assert.equal(normalizeMetricNumber(parsed.rows[0].Reach), 1234)
  assert.equal(normalizeMetricNumber(parsed.rows[1].Reach), 2345)
})

test('social metric CSV matching flags ambiguous normalized title and date', () => {
  const rows = [{ Title: 'Audit Air Rumah', Date: '2026-07-13', Reach: '100' }]
  const preview = buildCsvMetricImportPreview({
    rows,
    mapping: { title: 'Title', published_date: 'Date', reach: 'Reach' },
    publications: [],
    posts: [
      { id: 'post-1', title: 'Audit Air Rumah', scheduled_date: '2026-07-13' },
      { id: 'post-2', title: 'Audit Air Rumah!', scheduled_date: '2026-07-13' },
    ],
  })

  assert.equal(preview[0].match_status, 'ambiguous')
  assert.deepEqual(preview[0].candidate_post_ids, ['post-1', 'post-2'])
})

test('social metric CSV matching prefers exact Facebook URL', () => {
  const preview = buildCsvMetricImportPreview({
    rows: [{ Url: 'https://www.facebook.com/arkara/posts/123?utm=1', Reach: '50' }],
    mapping: { post_url: 'Url', reach: 'Reach' },
    publications: [
      { id: 'pub-1', post_id: 'post-1', facebook_url: 'https://facebook.com/arkara/posts/123?utm=1', published_at: '2026-07-13T10:00:00Z' },
    ],
    posts: [{ id: 'post-1', title: 'Different title', scheduled_date: '2026-07-13' }],
  })

  assert.equal(preview[0].match_status, 'matched')
  assert.equal(preview[0].matched_post_id, 'post-1')
  assert.equal(preview[0].match_reason, 'exact_facebook_url')
})