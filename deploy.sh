#!/bin/bash
# ============================================================
# 🚀 Arkara One-Click Deploy Script
# ============================================================
# Jalankan script ini SEKALI setelah fresh deploy ke Railway
# untuk menginisialisasi database dan mengecek kesiapan sistem.
#
# Cara pakai:
#   bash deploy.sh https://arkaraweb-production.up.railway.app
#
# ============================================================

set -e

BASE_URL="${1:-https://arkaraweb-production.up.railway.app}"

echo ""
echo "============================================"
echo "🚀 Arkara Deploy Script"
echo "============================================"
echo "Target: $BASE_URL"
echo ""

# Step 1: Check if site is alive
echo "📡 [1/4] Checking if site is alive..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$HTTP_CODE" -eq "200" ] || [ "$HTTP_CODE" -eq "301" ] || [ "$HTTP_CODE" -eq "302" ]; then
  echo "  ✅ Site is alive (HTTP $HTTP_CODE)"
else
  echo "  ❌ Site returned HTTP $HTTP_CODE"
  echo "  ⚠️  Make sure Railway deployment is successful before running this script."
  exit 1
fi

# Step 2: Run database migration
echo ""
echo "🗄️  [2/4] Running database migration..."
MIGRATE_RESULT=$(curl -s "$BASE_URL/api/cms/force-migrate")
echo "  Response: $MIGRATE_RESULT"

if echo "$MIGRATE_RESULT" | grep -q '"success":true'; then
  echo "  ✅ Migration completed successfully!"
elif echo "$MIGRATE_RESULT" | grep -q 'Migration completed'; then
  echo "  ✅ Migration completed successfully!"
else
  echo "  ⚠️  Migration may have issues. Check the response above."
  echo "  If you see 'already exists' errors, that's OK - tables are already created."
fi

# Step 3: Check dashboard accessibility
echo ""
echo "🎨 [3/4] Checking dashboard..."
DASH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
if [ "$DASH_CODE" -eq "200" ] || [ "$DASH_CODE" -eq "302" ]; then
  echo "  ✅ Dashboard is accessible (HTTP $DASH_CODE)"
else
  echo "  ⚠️  Dashboard returned HTTP $DASH_CODE"
  echo "  Make sure dbStartPage: false is set in studiocms.config.mjs"
fi

# Step 4: Check API endpoints
echo ""
echo "🔌 [4/4] Checking API endpoints..."
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/cms/posts")
if [ "$API_CODE" -eq "200" ]; then
  echo "  ✅ CMS API is working (HTTP $API_CODE)"
else
  echo "  ⚠️  CMS API returned HTTP $API_CODE"
fi

echo ""
echo "============================================"
echo "🎉 Deploy verification complete!"
echo "============================================"
echo ""
echo "📋 Next steps:"
echo "  1. Visit $BASE_URL/dashboard to manage content"
echo "  2. Create your first blog post!"
echo "  3. Check $BASE_URL to see your website"
echo ""
