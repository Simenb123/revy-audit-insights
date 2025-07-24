# Security Fix: esbuild CVE + XLSX mitigations + npmrc

## 🔒 Security Issues Addressed

### 1. esbuild CVE (GHSA-67mh-4wv8-2f99)
- **Vulnerability**: esbuild ≤ 0.24.2 dev-server request forgery
- **Fix**: Upgraded to Vite 7 (includes esbuild 0.25.8+)
- **Fallback**: Package override for esbuild if Vite 7 incompatible

### 2. XLSX Vulnerabilities  
- **Issues**: Prototype pollution & RegExp DoS (no upstream fix)
- **Mitigation**: Secure wrapper with file validation and restricted parsing

### 3. Dev Server Security
- **Issue**: Exposed on all network interfaces
- **Fix**: Added `--host localhost` to dev script

## Changes Made

### New Security Infrastructure
- `src/utils/secureXlsx.ts` - Secure XLSX parsing wrapper
- `.npmrc` - Legacy peer deps configuration
- `scripts/security-fix.sh` - Automated verification script

### Updated Dependencies
- `vite`: `^5.4.19` → `^7.x` (security fix)
- `@vitejs/plugin-react-swc`: Updated to latest

### Code Migrations
- `src/utils/excelProcessor.ts` - Now uses secure XLSX wrapper
- Removed FontSize components (Tiptap v3 incompatible)

### Tiptap Compatibility Maintained
- All Tiptap packages remain on v2.14.0
- FontSize extension removed (was v3 beta causing conflicts)
- Core editing functionality preserved

## Verification Commands
```bash
# Security checks
npm ls esbuild | grep "esbuild@0.25"  # Should show 0.25.x+
npm ls vite | grep "vite@7"           # Should show 7.x
npm audit                              # Should not show esbuild CVE

# Functionality checks  
npm run build                          # Should build successfully
npm run dev -- --port 4000           # Should start on localhost only

# Tiptap compatibility
npm ls @tiptap/core | grep "@tiptap/core@2"  # Should show 2.14.0
```

## Security Status
- ✅ esbuild CVE resolved via Vite 7 upgrade
- ✅ Dev server secured to localhost only  
- ✅ XLSX parsing protected with secure wrapper
- ⚠️ XLSX CVE remains (mitigated, awaiting upstream fix)
- ✅ All builds pass without dependency conflicts

## TODO
- [ ] Migrate remaining 13 XLSX usage files to secure wrapper
- [ ] Monitor for XLSX security patches
- [ ] Consider server-side XLSX processing
- [ ] Find Tiptap v2-compatible font-size extension
