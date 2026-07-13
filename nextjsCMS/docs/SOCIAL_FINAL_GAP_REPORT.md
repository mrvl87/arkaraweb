# Social Content OS Final Gap Report

Date: 2026-07-13

## Final Status

Social Content OS is suitable for the manual-publishing workflow delivered through Phase 11 after the target Supabase migrations are applied and authenticated visual QA is completed.

## Validated

- npm run lint passes with no warnings.
- npx tsc --noEmit --pretty false passes independently from the production build.
- npm run test:social-renderer passes with 40 tests.
- npm run build passes outside the Windows sandbox after the sandbox-only spawn EPERM.
- Production smoke check: /login returns 200 and unauthenticated /cms/social redirects to /login with 307.
- Supabase image allowlisting is derived from NEXT_PUBLIC_SUPABASE_URL, accepts HTTP/HTTPS, and only allows /storage/v1/object/public/social-assets/**.
- Migration, table RLS, and Storage policy tests evaluate isolated statements and operations.

## Closed Risks

- Next Image external host handling for public social-assets previews.
- Repository migration tests no longer depend on an exact migration filename list.
- RLS ownership tests no longer borrow auth.uid() from another policy.
- Storage policy tests validate SELECT, INSERT, UPDATE, and DELETE independently.

## Known Technical Limitations

These are non-blocking known limitations.

### Renderer text measurement

- Renderer uses deterministic templates and validation, but text overflow estimation remains heuristic.
- Regression fixtures for long Indonesian copy must be maintained.
- Font, line-height, or template changes require a visual regression check.

### Carousel ZIP transport

- Carousel ZIP is currently returned through a Server Action as a base64 payload.
- This is sufficient for normal publish packs.
- Large packs can increase memory use and response size.
- A streaming Route Handler can be considered if pack sizes increase.

### Vision provider

- Screenshot metric extraction is active only when a vision provider is configured.
- Extraction results remain candidate values.
- User confirmation is required before metrics are saved.

### TypeScript build setting

- typescript.ignoreBuildErrors remains enabled as project-wide technical debt.
- Production build alone is not proof of type safety; the separate tsc --noEmit check remains mandatory.

## Remaining External Prerequisites

### Live Supabase validation

- Apply or reset all Social migrations in the target Supabase project.
- Verify Data API grants, RLS behavior, Storage ownership, and schema cache against the live project.

### Authenticated browser and mobile QA

Browser automation and E2E_TEST_EMAIL / E2E_TEST_PASSWORD were unavailable, so authenticated asset rendering is not claimed as complete.

Manual QA checklist:

1. Login.
2. Open /cms/social.
3. Open a post with a generated asset.
4. Open the Visual tab.
5. Verify all asset thumbnails load.
6. Select an asset.
7. Open the Publish tab.
8. Verify the poster preview loads.
9. Verify desktop and mobile viewports.
10. Verify the browser console has no Next Image host, unconfigured host, or hydration error.

### Intentional exclusion

- Meta API and autopost remain intentionally out of scope.

## Backward Compatibility

- Existing posts and campaigns remain readable.
- visual_prompt remains available for legacy posts.
- Existing checklist fields remain present.
- Old asset versions are not overwritten.
- No migration was modified or added by this hardening fix.

## Release Recommendation

Release as a manual publishing product after live migrations are applied and the authenticated desktop/mobile checklist passes.
