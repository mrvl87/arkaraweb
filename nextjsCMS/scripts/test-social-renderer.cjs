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
const { createStoredZip, sanitizeZipEntryName } = require('../src/lib/social/zip.ts')
const { calculateTitleSimilarity, findClosestTitleMatch } = require('../src/lib/social/content-map.ts')
const { SOCIAL_STRATEGY_PRESETS, CONTENT_DERIVATIVE_POST_TYPES } = require('../src/lib/social/strategy-presets.ts')
const { getVariantReadabilityStats, normalizeHeuristicScores, getVariantScoreAverage } = require('../src/lib/social/variants.ts')
const { parseSocialMetricsCsv, buildCsvMetricImportPreview, normalizeMetricNumber } = require('../src/lib/social/metric-ingestion.ts')
const {
  GenerateFacebookVariantsOutputSchema,
  GenerateSocialPerformanceReviewOutputSchema,
  GenerateFacebookPostInputSchema,
  GenerateFacebookWeeklyPlanInputSchema,
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
test('campaign creation AI input schema preserves approved learning bounds', () => {
  const parsed = GenerateFacebookWeeklyPlanInputSchema.parse({
    campaign_title: 'Rumah Siaga Juli',
    theme: 'Persiapan rumah tangga Indonesia menghadapi listrik padam.',
    start_date: '2026-07-13',
    primary_goal: 'traffic',
    approved_learnings: Array.from({ length: 8 }, (_, index) => ({
      scope_type: 'global',
      title: `Learning ${index + 1}`,
      observation: 'Berdasarkan sampel saat ini terlihat format checklist perlu diuji kembali.',
      recommendation: 'Gunakan sebagai hipotesis editorial terbatas.',
      evidence_count: 3,
      confidence: 'medium',
    })),
  })

  assert.equal(parsed.campaign_title, 'Rumah Siaga Juli')
  assert.equal(parsed.approved_learnings.length, 8)
  assert.throws(() => GenerateFacebookWeeklyPlanInputSchema.parse({
    campaign_title: 'Rumah Siaga Juli',
    theme: 'Persiapan rumah tangga Indonesia menghadapi listrik padam.',
    start_date: '2026-07-13',
    approved_learnings: Array.from({ length: 9 }, (_, index) => ({
      scope_type: 'global',
      title: `Learning ${index + 1}`,
      observation: 'Berdasarkan sampel saat ini terlihat format checklist perlu diuji kembali.',
      recommendation: 'Gunakan sebagai hipotesis editorial terbatas.',
      evidence_count: 3,
      confidence: 'medium',
    })),
  }))
})

test('post creation AI input schema defaults aspect ratio and post type', () => {
  const parsed = GenerateFacebookPostInputSchema.parse({
    title: 'Checklist air darurat keluarga',
    post_type: 'checklist',
    source_summary: 'Ringkasan artikel sumber.',
  })

  assert.equal(parsed.post_type, 'checklist')
  assert.equal(parsed.aspect_ratio, '1:1')
})

test('zip entry names remove traversal segments', () => {
  assert.equal(sanitizeZipEntryName('../01-cover.png'), '01-cover.png')
  assert.equal(sanitizeZipEntryName('carousel\\..\\02-slide.png'), 'carousel/02-slide.png')
  assert.equal(sanitizeZipEntryName('/'), 'asset')
})
const path = require('node:path')
const {
  getSupabaseSocialAssetRemotePatterns,
} = require('../src/lib/social/supabase-image-pattern.ts')

const SOCIAL_MIGRATION_BASELINE = '20260510120000_create_social_tracker.sql'
const SOCIAL_TABLES = [
  'social_campaigns',
  'social_posts',
  'social_carousel_slides',
  'social_post_metrics',
  'social_assets',
  'social_publications',
  'social_post_variants',
  'social_learnings',
  'social_metric_imports',
]

function normalizeSql(sql) {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function extractCreatePolicyStatements(sql) {
  return (sql.match(/create\s+policy[\s\S]*?;/gi) ?? []).map(normalizeSql)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')
}

function getPoliciesForTable(policies, table) {
  const tablePattern = new RegExp(`\\bon\\s+${escapeRegExp(table)}\\b`)
  return policies.filter((policy) => tablePattern.test(policy))
}

function getPolicyOperation(policy) {
  return policy.match(/\bfor\s+(all|select|insert|update|delete)\b/)?.[1] ?? 'all'
}

function getPolicyClause(policy, clause) {
  const marker = ` ${clause} `
  const start = policy.indexOf(marker)
  if (start < 0) return ''

  const value = policy.slice(start + marker.length)
  if (clause === 'using') {
    const withCheck = value.indexOf(' with check ')
    return withCheck < 0 ? value : value.slice(0, withCheck)
  }

  return value
}

function hasPolicyRole(policy, role) {
  return new RegExp(`\\bto\\s+${role}\\b`).test(policy)
}

function hasUserOwnershipCondition(clause) {
  const authOwnsRow = /(?:\(\s*select\s+)?auth\.uid\(\)\s*\)?\s*=\s*(?:[a-z0-9_]+\.)?user_id/.test(clause)
  const rowOwnedByAuth = /(?:[a-z0-9_]+\.)?user_id\s*=\s*(?:\(\s*select\s+)?auth\.uid\(\)\s*\)?/.test(clause)
  return authOwnsRow || rowOwnedByAuth
}

function validateOwnedTablePolicies(sql, tables = SOCIAL_TABLES) {
  const normalizedSql = normalizeSql(sql)
  const policies = extractCreatePolicyStatements(sql)
  const errors = []

  for (const table of tables) {
    if (!normalizedSql.includes(`alter table public.${table} enable row level security;`)) {
      errors.push(`${table}: RLS is not enabled`)
    }

    const tablePolicies = getPoliciesForTable(policies, `public.${table}`)
    if (tablePolicies.length === 0) {
      errors.push(`${table}: no policy found`)
      continue
    }

    for (const policy of tablePolicies) {
      const operation = getPolicyOperation(policy)
      const usingClause = getPolicyClause(policy, 'using')
      const withCheckClause = getPolicyClause(policy, 'with check')

      if (!hasPolicyRole(policy, 'authenticated')) {
        errors.push(`${table}: ${operation} policy is not limited to authenticated`)
      }

      if (operation === 'all' || operation === 'select' || operation === 'delete' || operation === 'update') {
        if (!usingClause || !hasUserOwnershipCondition(usingClause)) {
          errors.push(`${table}: ${operation} policy lacks owned USING`)
        }
      }

      if (operation === 'all' || operation === 'insert' || operation === 'update') {
        if (!withCheckClause || !hasUserOwnershipCondition(withCheckClause)) {
          errors.push(`${table}: ${operation} policy lacks owned WITH CHECK`)
        }
      }
    }
  }

  return errors
}

function hasSocialAssetsBucketCondition(clause) {
  return /\bbucket_id\s*=\s*'social-assets'/.test(clause)
}

function hasOwnedSocialAssetsFolderCondition(clause) {
  return hasSocialAssetsBucketCondition(clause)
    && /\(storage\.foldername\(name\)\)\s*\[\s*1\s*\]\s*=\s*\((?:select\s+)?auth\.uid\(\)\)\s*::\s*text/.test(clause)
}

function validateSocialStoragePolicies(sql) {
  const policies = getPoliciesForTable(
    extractCreatePolicyStatements(sql),
    'storage.objects'
  )
  const errors = []

  const publicRead = policies.find((policy) =>
    getPolicyOperation(policy) === 'select'
    && hasPolicyRole(policy, 'public')
    && hasSocialAssetsBucketCondition(getPolicyClause(policy, 'using'))
  )
  if (!publicRead) errors.push('storage select policy lacks public social-assets USING')

  const insert = policies.find((policy) =>
    getPolicyOperation(policy) === 'insert'
    && hasPolicyRole(policy, 'authenticated')
    && hasOwnedSocialAssetsFolderCondition(getPolicyClause(policy, 'with check'))
  )
  if (!insert) errors.push('storage insert policy lacks owned WITH CHECK')

  const update = policies.find((policy) =>
    getPolicyOperation(policy) === 'update'
    && hasPolicyRole(policy, 'authenticated')
    && hasOwnedSocialAssetsFolderCondition(getPolicyClause(policy, 'using'))
    && hasOwnedSocialAssetsFolderCondition(getPolicyClause(policy, 'with check'))
  )
  if (!update) errors.push('storage update policy lacks owned USING or WITH CHECK')

  const remove = policies.find((policy) =>
    getPolicyOperation(policy) === 'delete'
    && hasPolicyRole(policy, 'authenticated')
    && hasOwnedSocialAssetsFolderCondition(getPolicyClause(policy, 'using'))
  )
  if (!remove) errors.push('storage delete policy lacks owned USING')

  return errors
}

function validateSocialMigrationEntries(entries) {
  const errors = []
  const parsed = entries.map((entry) => {
    const match = entry.file.match(/^(\d{14})_.+\.sql$/)
    if (!match) errors.push(`Invalid migration filename: ${entry.file}`)
    return { ...entry, timestamp: match?.[1] ?? null }
  })

  if (!entries.some((entry) => entry.file === SOCIAL_MIGRATION_BASELINE)) {
    errors.push(`Missing baseline migration: ${SOCIAL_MIGRATION_BASELINE}`)
  }

  const timestamps = parsed.flatMap((entry) => entry.timestamp ? [entry.timestamp] : [])
  if (timestamps.join('|') !== [...timestamps].sort().join('|')) {
    errors.push('Migration timestamps are not ordered ascending')
  }
  if (new Set(timestamps).size !== timestamps.length) {
    errors.push('Migration timestamps must be unique')
  }

  const destructivePatterns = [
    ['DROP TABLE', /\bdrop\s+table\b/],
    ['DROP COLUMN', /\bdrop\s+column\b/],
    ['TRUNCATE', /\btruncate\b/],
    ['DROP SCHEMA', /\bdrop\s+schema\b/],
  ]

  for (const entry of parsed) {
    if (entry.file === SOCIAL_MIGRATION_BASELINE) continue
    const sql = normalizeSql(entry.sql)
    for (const [label, pattern] of destructivePatterns) {
      if (pattern.test(sql)) errors.push(`${entry.file}: destructive ${label}`)
    }
  }

  return errors
}

function readSocialMigrationEntries() {
  const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations')
  return fs.readdirSync(migrationDir)
    .filter((file) => file.includes('social') && file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      file,
      sql: fs.readFileSync(path.join(migrationDir, file), 'utf8'),
    }))
}

test('Supabase image pattern accepts only the social-assets public path', () => {
  const patterns = getSupabaseSocialAssetRemotePatterns('https://project-ref.supabase.co')

  assert.deepEqual(patterns, [{
    protocol: 'https',
    hostname: 'project-ref.supabase.co',
    port: '',
    pathname: '/storage/v1/object/public/social-assets/**',
    search: '',
  }])
  assert.notEqual(patterns[0].pathname, '/storage/v1/object/public/**')
})

test('Supabase image pattern supports local HTTP URLs', () => {
  const patterns = getSupabaseSocialAssetRemotePatterns('http://127.0.0.1:54321/')

  assert.equal(patterns[0].protocol, 'http')
  assert.equal(patterns[0].hostname, '127.0.0.1')
  assert.equal(patterns[0].port, '54321')
})

test('Supabase image pattern returns no patterns for an empty URL', () => {
  assert.deepEqual(getSupabaseSocialAssetRemotePatterns(''), [])
  assert.deepEqual(getSupabaseSocialAssetRemotePatterns('   '), [])
})

test('Supabase image pattern ignores invalid or unsupported URLs', () => {
  assert.doesNotThrow(() => getSupabaseSocialAssetRemotePatterns('not a url'))
  assert.deepEqual(getSupabaseSocialAssetRemotePatterns('not a url'), [])
  assert.deepEqual(getSupabaseSocialAssetRemotePatterns('ftp://project-ref.supabase.co'), [])
})

test('social migrations remain ordered and additive without an exact filename list', () => {
  assert.deepEqual(validateSocialMigrationEntries(readSocialMigrationEntries()), [])
})

test('social migration validation accepts a new additive migration filename', () => {
  const entries = [
    { file: SOCIAL_MIGRATION_BASELINE, sql: 'create table public.social_posts ();' },
    { file: '20260714090000_add_social_review_index.sql', sql: 'create index social_review_idx on public.social_posts(id);' },
  ]

  assert.deepEqual(validateSocialMigrationEntries(entries), [])
})

test('social migration validation rejects duplicate timestamps', () => {
  const errors = validateSocialMigrationEntries([
    { file: SOCIAL_MIGRATION_BASELINE, sql: '' },
    { file: '20260510120000_add_social_duplicate.sql', sql: '' },
  ])

  assert.match(errors.join('\n'), /timestamps must be unique/)
})

test('social migration validation rejects DROP TABLE', () => {
  const errors = validateSocialMigrationEntries([
    { file: SOCIAL_MIGRATION_BASELINE, sql: '' },
    { file: '20260714090000_drop_social_cache.sql', sql: 'DROP TABLE public.social_cache;' },
  ])

  assert.match(errors.join('\n'), /destructive DROP TABLE/)
})

test('social migration validation rejects DROP COLUMN', () => {
  const errors = validateSocialMigrationEntries([
    { file: SOCIAL_MIGRATION_BASELINE, sql: '' },
    { file: '20260714090000_drop_social_column.sql', sql: 'ALTER TABLE public.social_posts DROP COLUMN notes;' },
  ])

  assert.match(errors.join('\n'), /destructive DROP COLUMN/)
})

test('social RLS migrations protect each owned table policy independently', () => {
  const sql = readSocialMigrationEntries().map((entry) => entry.sql).join('\n')

  assert.deepEqual(validateOwnedTablePolicies(sql), [])
  assert.equal(normalizeSql(sql).includes('auth.role()'), false)
  assert.equal(normalizeSql(sql).includes('service_role'), false)
})

test('RLS helper does not borrow auth.uid from another table', () => {
  const fakeSql = `
    alter table public.table_a enable row level security;
    create policy "broken a"
      on public.table_a for all to authenticated
      using (true) with check (true);

    create policy "valid b"
      on public.table_b for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  `

  const errors = validateOwnedTablePolicies(fakeSql, ['table_a'])
  assert.match(errors.join('\n'), /table_a: all policy lacks owned USING/)
  assert.match(errors.join('\n'), /table_a: all policy lacks owned WITH CHECK/)
})

test('RLS helper rejects an owned update policy without WITH CHECK', () => {
  const fakeSql = `
    alter table public.table_a enable row level security;
    create policy "broken update"
      on public.table_a for update to authenticated
      using (auth.uid() = user_id);
  `

  assert.match(
    validateOwnedTablePolicies(fakeSql, ['table_a']).join('\n'),
    /update policy lacks owned WITH CHECK/
  )
})

test('social storage policies validate each operation independently', () => {
  const migration = readSocialMigrationEntries()
    .find((entry) => entry.file === '20260713090000_add_social_assets_and_publications.sql')

  assert.ok(migration)
  assert.match(normalizeSql(migration.sql), /values \('social-assets', 'social-assets', true\)/)
  assert.deepEqual(validateSocialStoragePolicies(migration.sql), [])
})

test('storage insert policy rejects a bucket-only check', () => {
  const sql = `
    create policy "insert" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'social-assets');
  `

  assert.match(validateSocialStoragePolicies(sql).join('\n'), /insert policy lacks owned WITH CHECK/)
})

test('storage update policy requires owned USING and WITH CHECK', () => {
  const sql = `
    create policy "update" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'social-assets'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  `

  assert.match(validateSocialStoragePolicies(sql).join('\n'), /update policy lacks owned USING or WITH CHECK/)
})

test('storage delete policy rejects a bucket-only USING clause', () => {
  const sql = `
    create policy "delete" on storage.objects
      for delete to authenticated
      using (bucket_id = 'social-assets');
  `

  assert.match(validateSocialStoragePolicies(sql).join('\n'), /delete policy lacks owned USING/)
})
