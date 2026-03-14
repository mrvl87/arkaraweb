# Railway + Tigris Deployment Checklist

## Pre-deployment

- [ ] `astro.config.mjs` uses `output: 'hybrid'` and `adapter: node`
- [ ] `railway.toml` exists at project root
- [ ] All env vars documented in `.env.example`
- [ ] `npm run build` succeeds locally
- [ ] `.gitignore` includes `.env` and `dist/`

## Railway Setup (First Deploy)

1. **Create Railway project**
   - railway.app → New Project → Deploy from GitHub Repo
   - Select your `arkara` repository
   - Railway auto-detects Node.js via Nixpacks

2. **Add Tigris storage (S3-compatible bucket)**
   - Railway Dashboard → your project → + New → Database → Tigris
   - Railway auto-injects these env vars:
     ```
     AWS_ACCESS_KEY_ID
     AWS_SECRET_ACCESS_KEY
     AWS_ENDPOINT_URL_S3
     AWS_REGION
     BUCKET_NAME
     ```
   - Map these to your `lib/storage.ts` variable names in Railway env settings

3. **Set environment variables in Railway**
   ```
   OPENROUTER_API_KEY=sk-or-...
   WAVESPEED_API_KEY=...
   KEYSTATIC_GITHUB_CLIENT_ID=...
   KEYSTATIC_GITHUB_CLIENT_SECRET=...
   KEYSTATIC_SECRET=<random 32 chars>
   PUBLIC_SITE_URL=https://arkara.id
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   ```

4. **Configure custom domain**
   - Railway Dashboard → Settings → Domains → Add Domain
   - Enter `arkara.id`
   - Railway provides DNS records (CNAME or A record)
   - Update DNS at your domain registrar
   - SSL is automatic via Let's Encrypt

5. **Set up GitHub OAuth for Keystatic CMS**
   - GitHub → Settings → Developer Settings → OAuth Apps → New
   - Homepage URL: `https://arkara.id`
   - Callback URL: `https://arkara.id/api/keystatic/github/oauth/callback`
   - Copy Client ID + Secret to Railway env vars

## Tigris Bucket Configuration

```bash
# Install Tigris CLI (optional, for bucket management)
brew install tigrisdata/tigris/tigris

# Create bucket (Railway does this automatically, but manual option)
tigris create bucket arkara-media

# Set CORS policy for bucket (required for direct browser uploads)
tigris update bucket arkara-media --cors '{
  "cors_rules": [{
    "allowed_origins": ["https://arkara.id", "http://localhost:4321"],
    "allowed_methods": ["GET", "PUT", "POST", "DELETE"],
    "allowed_headers": ["*"],
    "max_age_seconds": 3600
  }]
}'

# Make bucket public-read (for serving images)
tigris update bucket arkara-media --public-read
```

## Post-deploy Verification

- [ ] Site loads at `https://arkara.id`
- [ ] CMS accessible at `https://arkara.id/keystatic`
- [ ] API routes respond: `POST /api/generate-content`
- [ ] API routes respond: `POST /api/generate-image`
- [ ] Generated images upload to Tigris bucket
- [ ] Images serve from `https://arkara-media.fly.storage.tigris.dev/...`

## Continuous Deployment

Railway auto-deploys on every push to `main` branch.

For manual deploy:
```bash
npm install -g @railway/cli
railway login
railway up
```

For rollback:
- Railway Dashboard → Deployments → click any previous deployment → Rollback

## Monitoring

- Railway Dashboard shows: CPU, memory, request count, response times
- Check logs: `railway logs --tail`
- Set up Railway alerts for: deploy failures, high memory usage

## Estimated Railway Costs

| Plan | Price | Included |
|---|---|---|
| Hobby | $5/month | 512MB RAM, 1 vCPU, 100GB bandwidth |
| Pro | $20/month | 8GB RAM, 8 vCPU, 100GB bandwidth |
| Tigris storage | $0.02/GB/month | First 5GB free |

For Arkara MVP: **Hobby plan ($5/mo)** is sufficient.