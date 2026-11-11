// Contract checks for CMS selection → persisted JSON → static hero presentation.
// Uses no private credentials and never writes to a live database or bucket.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cmsRequire = createRequire(path.join(repo, 'nextjsCMS/package.json'));
const { z } = cmsRequire('zod');
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS '+name); }

async function moduleGraph(file, replacements = {}) {
  const context = vm.createContext({ console: {warn(){},error(){}}, process:{env:{}}, URL, Date, Map, Set });
  const cache = new Map();
  async function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const source = await readFile(filename,'utf8');
    const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    const mod = new vm.SourceTextModule(compiled,{context,identifier:pathToFileURL(filename).href});
    cache.set(filename,mod);
    await mod.link(async (specifier,referencer) => {
      const replacement = replacements[specifier] || (specifier==='zod' ? {z} : null);
      if (replacement) return new vm.SyntheticModule(Object.keys(replacement),function(){for(const [name,value] of Object.entries(replacement))this.setExport(name,value);},{context});
      const resolved = specifier.startsWith('@/')
        ? path.join(repo,'nextjsCMS/src',specifier.slice(2)+'.ts')
        : path.resolve(path.dirname(fileURLToPath(referencer.identifier)),specifier+'.ts');
      return load(resolved);
    });
    return mod;
  }
  const mod = await load(path.join(repo,file));
  await mod.evaluate();
  return mod.namespace;
}

const hero = await moduleGraph('arkara/src/lib/hero-media.ts');
const cms = await moduleGraph('nextjsCMS/src/lib/hero-settings.ts');
const id='b1f2a87a-5456-43c6-8d55-f95365cbab2d';
const original='https://media.arkaraweb.com/uploads/maskot-old.webp';
const changed='https://media.arkaraweb.com/uploads/maskot-new.webp';
const selected={file_path:changed,file_type:'image/webp',alt_text:'Maskot keluarga siap',aspect_ratio:'370:526',formats:{has_alpha:'true',original:changed},blurhash:'data:image/webp;base64,fixture'};
const input={id,headline:'Judul hero',mascot_image:selected,body_text:null,mascot_speech_text:'Siap bersama.',mascot_tagline:'Teman keluarga',created_at:'ignored'};
const parsed=cms.heroUpdateSchema.parse(input);

check('CMS selection preserves transparent original, metadata and alt text',()=>{
  assert.equal(parsed.mascot_image.url,changed);
  assert.equal(parsed.mascot_image.formats.has_alpha,'true');
  assert.equal(parsed.mascot_image.blurhash,selected.blurhash);
  assert.equal(parsed.body_text,'');
  assert.equal(parsed.created_at,undefined);
});
check('frontend uses the image selected in CMS, with its dimensions and alt',()=>{
  const view=hero.getHeroMascot(parsed.mascot_image);
  assert.equal(view.src,changed); assert.equal(view.alt,selected.alt_text);
  assert.equal(view.width,370); assert.equal(view.height,526);
});
check('legacy Supabase URL resolves through the existing public media mapping',()=>{
  const value='https://zythkkmygravwelxbwtf.supabase.co/storage/v1/object/public/media/uploads/mascot%20one.webp';
  assert.equal(hero.getHeroMascot(value).src,'https://media.arkaraweb.com/uploads/mascot%20one.webp');
  assert.equal(cms.heroUpdateSchema.parse({...input,mascot_image:value}).mascot_image,'https://media.arkaraweb.com/uploads/mascot%20one.webp');
});
check('legacy file_path and formats.original payloads remain supported',()=>{
  assert.equal(hero.getHeroMascot({file_path:'uploads/mascot.webp'}).src,'https://media.arkaraweb.com/uploads/mascot.webp');
  assert.equal(hero.getHeroMascot({formats:{original:changed}}).src,changed);
});
check('empty, unsafe or malformed images use the bundled fallback',()=>{
  for(const media of [null,undefined,{},[],{url:'javascript:alert(1)'},{url:'//bad.example/image.png'},{url:'https://user:pass@example.com/a.png'},'not a url']) {
    assert.equal(hero.getHeroMascot(media).src,hero.DEFAULT_MASCOT.src);
  }
  assert.equal(cms.heroUpdateSchema.parse({...input,mascot_image:null}).mascot_image,null);
});
check('invalid image dimensions do not corrupt the hero layout',()=>{
  for(const ratio of ['0:0','wrong','-10:500','Infinity:100','9999999:1']) {
    const view=hero.getHeroMascot({url:changed,aspect_ratio:ratio});
    assert.equal(view.width,638); assert.equal(view.height,850);
  }
});
check('CMS rejects bad row identity, empty headlines, invalid media and non-images',()=>{
  for(const value of [{...input,id:undefined},{...input,headline:' '},{...input,mascot_image:{file_path:'javascript:bad'}},{...input,mascot_image:{file_path:changed,file_type:'application/pdf'}}]) {
    assert.equal(cms.heroUpdateSchema.safeParse(value).success,false);
  }
});

let queryCalls=0;
let current={data:{id,headline:'Title',mascot_image:{url:original}},error:null};
const publicClient = {
  from(table) {
    assert.equal(table, 'hero_section');
    queryCalls++;
    return { select() { return { async single() { return current; } }; } };
  },
};
const content=await moduleGraph('arkara/src/lib/content.ts',{'./supabase':{supabase:publicClient}});
const first=await content.getHeroSection();
current={data:{id,headline:'Title',mascot_image:parsed.mascot_image},error:null};
const second=await content.getHeroSection();
check('a second request reads the saved replacement, bypassing the old five-minute hero cache',()=>{
  assert.equal(queryCalls,2); assert.equal(first.mascot_image.url,original); assert.equal(second.mascot_image.url,changed);
});
current={data:null,error:{code:'NETWORK'}};
assert.equal(await content.getHeroSection(),null);
checks++; console.log('PASS unavailable hero data falls back without crashing the page');

// Test the actual settings action boundary without touching Supabase.
let auth=true, saved=null, rowError=null, notified=0, invalidated=0;
const updateQuery = {
  eq(key,value) { assert.equal(key,'id'); assert.equal(value,id); return this; },
  select(columns) { assert.equal(columns,'id'); return this; },
  async single() { return {data:rowError?null:{id},error:rowError}; },
};
const settingsClient = {
  from(table) {
    assert.equal(table,'hero_section');
    return { update(payload) { saved=payload; return updateQuery; } };
  },
};
const actions=await moduleGraph('nextjsCMS/src/app/cms/settings/actions.ts',{
  '@/lib/supabase/server':{async createClient(){return settingsClient;}},
  '@/lib/auth/require-authenticated-user.server':{async requireAuthenticatedUser(){if(!auth)throw new Error('Unauthorized');return {id:'verified-editor'};}},
  'next/cache':{revalidatePath(){invalidated++;}},
  '@/lib/revalidate':{async triggerFrontendRevalidate(){notified++;}},
});
await actions.updateHeroSection(input);
check('saving a verified row persists CMS media and triggers frontend notification',()=>{
  assert.equal(saved.mascot_image.url,changed); assert.equal(notified,1); assert.equal(invalidated,1); assert.ok(saved.updated_at);
});
rowError={message:'No row visible after update'};
await assert.rejects(()=>actions.updateHeroSection(input),/No row visible/);
assert.equal(notified,1);
checks++; console.log('PASS zero-row/RLS failures are reported instead of a false save success');
auth=false; saved=null;
await assert.rejects(()=>actions.updateHeroSection(input),/Unauthorized/);
assert.equal(saved,null);
checks++; console.log('PASS unauthenticated saves stop before any database mutation');
const component=await readFile(path.join(repo,'arkara/src/components/home/StaticHeroMascot.astro'),'utf8');
const fallbackCode=ts.transpileModule(component.split('<script>')[1].split('</script>')[0],{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
function imageFixture(complete,naturalWidth) {
  const handlers=new Set();
  return {
    src:changed,alt:'Custom CMS alt',width:370,height:526,complete,naturalWidth,
    dataset:{mascotFallback:hero.DEFAULT_MASCOT.src,mascotFallbackAlt:hero.DEFAULT_MASCOT.alt},
    addEventListener(_event,fn){handlers.add(fn);},
    removeEventListener(_event,fn){handlers.delete(fn);},
    removeAttribute(){},
    fail(){for(const fn of [...handlers])fn();},
    get handlerCount(){return handlers.size;},
  };
}
const failed=imageFixture(true,0), pending=imageFixture(false,0), healthy=imageFixture(true,370);
let pageLoad;
vm.runInNewContext(fallbackCode,{document:{querySelectorAll(){return [failed,pending,healthy];},addEventListener(_name,fn){pageLoad=fn;}}});
check('an image that failed before scripts loaded recovers to the static default',()=>{
  assert.equal(failed.src,hero.DEFAULT_MASCOT.src); assert.equal(failed.width,638); assert.equal(failed.height,850); assert.equal(failed.handlerCount,0);
});
pageLoad();
check('successful CMS images remain intact and fallback listeners are not duplicated',()=>{
  assert.equal(healthy.src,changed); assert.equal(healthy.handlerCount,1); assert.equal(pending.handlerCount,1);
});
pending.fail(); pending.fail();
check('a later image failure recovers once without an error loop',()=>{
  assert.equal(pending.src,hero.DEFAULT_MASCOT.src); assert.equal(pending.alt,hero.DEFAULT_MASCOT.alt); assert.equal(pending.handlerCount,0);
});
console.log(`${checks} hero/CMS contract checks passed.`);
