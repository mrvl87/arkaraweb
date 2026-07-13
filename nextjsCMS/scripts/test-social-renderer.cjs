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