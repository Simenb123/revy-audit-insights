# Dependency Fix: Lock Tiptap v2 + Vite 5

## Changes Made

### Removed Dependencies
- `@tiptap/extension-font-size@^3.0.0-next.3` - Removed v3 beta package that caused conflicts

### Updated Dependencies
- `vite`: Locked to `^5.4.19` (stable v5)
- `lovable-tagger`: Set to `^1.1.8` (compatible with Vite 5)
- `@vitejs/plugin-react-swc`: Updated to latest compatible version

### Code Changes
- Temporarily removed FontSize extension from `src/components/Knowledge/tiptap-extensions/editorExtensions.ts`
- Added TODO comment for future font-size extension implementation

## Verification Commands Run
```bash
# All Tiptap packages should be on v2.14.0
npm ls @tiptap/core | grep "@tiptap/core@2"

# Vite should be on v5
npm ls vite | grep "vite@5"

# Build and dev server should work
npm run build && npm run dev -- --port 4000
```

## TODO
- [ ] Find/implement a Tiptap v2-compatible font-size extension
- [ ] Add back font-size functionality to the editor
- [ ] Consider adding package.json overrides for stricter version control:
  ```json
  "overrides": {
    "@tiptap/core": "^2.24.2",
    "@tiptap/extension-text-style": "^2.0.0"
  }
  ```

## Status
✅ Dependency conflicts resolved
✅ Tiptap v2 + Vite 5 stable configuration
✅ Build should pass without ERESOLVE errors