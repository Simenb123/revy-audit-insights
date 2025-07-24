# Security: esbuild CVE fix + XLSX mitigations + npmrc

## 🔒 Security Fixes Implemented

### 1. esbuild CVE-2024-XXXXX Fix
- **Issue**: `esbuild ≤ 0.24.2` vulnerable to dev-server request forgery (GHSA-67mh-4wv8-2f99)
- **Solution**: Upgraded to Vite 7 which includes esbuild 0.25.8+
- **Alternative**: If Vite 7 incompatible, package.json override forces esbuild ^0.25.8

### 2. XLSX Vulnerability Mitigation  
- **Issue**: `xlsx` package has prototype pollution & RegExp DoS vulnerabilities with no upstream fix
- **Solution**: Created secure wrapper `src/utils/secureXlsx.ts` with:
  - File size validation (5MB limit)
  - Extension validation (only .xlsx/.xls)
  - Restricted parsing options to reduce attack surface
  - Error handling and sanitization
- **Migration**: Updated `src/utils/excelProcessor.ts` to use secure wrapper
- **TODO**: Migrate all XLSX usage to secure wrapper when time permits

### 3. Dev Server Security
- **Issue**: Dev server exposed on all interfaces
- **Solution**: Updated dev script to use `--host localhost` for local-only access

### 4. Dependency Management
- **Issue**: Manual `--legacy-peer-deps` flags required in CI/dev
- **Solution**: Added `.npmrc` with `legacy-peer-deps=true` for consistent installs

## 🔧 Code Changes

### New Files
- `src/utils/secureXlsx.ts` - Secure XLSX parsing wrapper
- `.npmrc` - Dependency resolution configuration  
- `scripts/security-fix.sh` - Automated fix verification script

### Modified Files
- `src/utils/excelProcessor.ts` - Migrated to secure XLSX wrapper
- `src/components/Knowledge/EditorToolbar.tsx` - Removed FontSizeGroup (Tiptap v3 incompatible)
- Removed: `src/components/Knowledge/Toolbar/FontSizeGroup.tsx`

### Package Updates
- `vite`: `^5.4.19` → `^7.x` (includes esbuild security fix)
- `@vitejs/plugin-react-swc`: Updated to latest compatible version

## 🧪 Verification Steps

```bash
# Check esbuild version (should be 0.25.x+)
npm ls esbuild | grep "esbuild@"

# Check Vite version (should be 7.x)  
npm ls vite | grep "vite@"

# Verify build works
npm run build

# Verify dev server starts securely
npm run dev -- --port 4000

# Check remaining audit issues
npm audit
```

## 📊 Audit Results

Before:
- ❌ esbuild CVE in dev dependencies
- ❌ xlsx prototype pollution (no fix available)

After:
- ✅ esbuild CVE resolved via Vite 7 upgrade
- ⚠️ xlsx CVE remains (mitigated with secure wrapper)

## 🚨 Next Steps

1. **Test Excel import functionality** thoroughly with new secure wrapper
2. **Migrate remaining XLSX usage** to secure wrapper:
   - `src/components/Accounting/ChartOfAccountsUploader.tsx`
   - `src/components/Accounting/GeneralLedgerUploader.tsx` 
   - `src/components/Accounting/TrialBalanceUploader.tsx`
   - `src/components/ClientDocuments/AdvancedFilePreview.tsx`
   - `src/hooks/useClientTextExtraction.ts`
   - And 9 other files (see git diff for full list)
3. **Monitor for XLSX patches** and remove wrapper when upstream fix available
4. **Consider server-side XLSX processing** for additional security

## ⚡ Performance Impact

- Minimal: Secure wrapper adds basic validation overhead
- File size limits prevent processing of oversized files
- Error handling provides better user feedback

---

**CI Status**: ✅ Build passes, dev server secure, dependencies resolved
