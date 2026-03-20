#!/usr/bin/env bash
#
# copy-marketing.sh — Copy marketing pages from old-clinic-management-system
#                      into apps/web using the (marketing) route group.
#
# Idempotent: safe to re-run. Overwrites existing files.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OLD="$ROOT/old-clinic-management-system"
WEB="$ROOT/apps/web"

# ── Helpers ──────────────────────────────────────────────────────────────────

copy_file() {
  local src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  echo "  ✓ $(realpath --relative-to="$ROOT" "$src") → $(realpath --relative-to="$ROOT" "$dst")"
}

# ── Verify source exists ────────────────────────────────────────────────────

if [ ! -d "$OLD" ]; then
  echo "ERROR: old-clinic-management-system not found at $OLD"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Copying marketing pages into apps/web/(marketing)/"
echo "═══════════════════════════════════════════════════════"
echo ""

# ── 1. Page files ────────────────────────────────────────────────────────────

echo "▸ Pages"
copy_file "$OLD/app/page.tsx"            "$WEB/app/(marketing)/page.tsx"
copy_file "$OLD/app/pricing/page.tsx"    "$WEB/app/(marketing)/pricing/page.tsx"
copy_file "$OLD/app/contact/page.tsx"    "$WEB/app/(marketing)/contact/page.tsx"
copy_file "$OLD/app/contact/DemoForm.tsx" "$WEB/app/(marketing)/contact/DemoForm.tsx"
copy_file "$OLD/app/contact/actions.ts"  "$WEB/app/(marketing)/contact/actions.ts"
echo ""

# ── 2. Home components ──────────────────────────────────────────────────────

echo "▸ Home components → components/marketing/"
copy_file "$OLD/components/home/Hero.tsx"         "$WEB/components/marketing/hero.tsx"
copy_file "$OLD/components/home/Features.tsx"     "$WEB/components/marketing/features.tsx"
copy_file "$OLD/components/home/HowItWorks.tsx"   "$WEB/components/marketing/how-it-works.tsx"
copy_file "$OLD/components/home/Specialties.tsx"  "$WEB/components/marketing/specialties.tsx"
copy_file "$OLD/components/home/Stats.tsx"        "$WEB/components/marketing/stats.tsx"
copy_file "$OLD/components/home/ClinicCTA.tsx"    "$WEB/components/marketing/clinic-cta.tsx"
copy_file "$OLD/components/home/Navbar.tsx"       "$WEB/components/marketing/navbar.tsx"
copy_file "$OLD/components/home/Footer.tsx"       "$WEB/components/marketing/footer.tsx"
echo ""

# ── 3. Marketing CSS (animations, mesh gradients, etc.) ─────────────────────

echo "▸ Marketing CSS (old globals.css → reference copy)"
copy_file "$OLD/app/globals.css"  "$WEB/styles/marketing-reference.css"
echo ""

# ── Done ─────────────────────────────────────────────────────────────────────

echo "═══════════════════════════════════════════════════════"
echo "  Done. Files copied. Next steps:"
echo ""
echo "  1. Fix imports in copied files:"
echo "     @/components/home/* → @/components/marketing/*"
echo ""
echo "  2. Create (marketing)/layout.tsx with Navbar + Footer"
echo ""
echo "  3. Extract marketing-specific CSS from"
echo "     styles/marketing-reference.css into"
echo "     styles/marketing.css (only animations/custom styles)"
echo ""
echo "  4. Update root page.tsx redirect logic"
echo "═══════════════════════════════════════════════════════"
echo ""
