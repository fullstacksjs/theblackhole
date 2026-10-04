#!/usr/bin/env sh
# Builds src/ui as a library for design-sync: dist/ui/{index.js,index.css} + dist/types/*.d.ts
set -e
cd "$(dirname "$0")/../.."
rm -rf dist/ui dist/types
pnpm exec vp build --config .design-sync/ui-build/vite.config.ts
pnpm exec tsc -p .design-sync/ui-build/tsconfig.json
# The converter reads <pkg>/index.d.ts as the types entry (gitignored).
echo 'export * from "./dist/types/ui/index";' > index.d.ts
