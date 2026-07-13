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