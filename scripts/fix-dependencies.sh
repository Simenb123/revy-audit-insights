#!/bin/bash
# Dependency fix script for Tiptap v2 + Vite 5

set -e

echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules
rm -f package-lock.json

echo "📝 Adding overrides to package.json..."
jq '. + {"overrides":{"@tiptap/core":"^2.24.2","@tiptap/extension-text-style":"^2.0.0"}}' \
   package.json > package.tmp && mv package.tmp package.json

echo "📦 Installing stable dependencies..."
npm add -D vite@^5 @vitejs/plugin-react-swc@latest
npm add -D lovable-tagger@1.1.8
npm uninstall @tiptap/extension-font-size || true

echo "🔧 Fresh install..."
npm install

echo "✅ Verifying installation..."
echo "Tiptap core version:"
npm ls @tiptap/core | grep "@tiptap/core@"

echo "Vite version:"
npm ls vite | grep "vite@"

echo "🏗️ Testing build..."
npm run build

echo "🚀 Testing dev server..."
echo "Dev server will start on port 4000..."
echo "Press Ctrl+C to stop and continue with commit"
npm run dev -- --port 4000

echo "📝 Ready to commit package.json + package-lock.json"
echo "Create PR with title: 'Fix deps: lock Tiptap v2 + Vite 5'"