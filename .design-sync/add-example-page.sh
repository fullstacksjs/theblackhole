#!/usr/bin/env sh
# Run after every package-build/resync: ships docs/index.html (a full page designed
# in this visual language) as guidelines/examples/isometric-map.html. The converter
# only copies .md guidelines, so this step adds the page by hand.
set -e
cd "$(dirname "$0")/.."
mkdir -p ds-bundle/guidelines/examples
cp docs/index.html ds-bundle/guidelines/examples/isometric-map.html
grep -q isometric-map ds-bundle/guidelines/index.md 2>/dev/null ||
  printf -- '- [Example page: isometric sector map](./examples/isometric-map.html)\n' >> ds-bundle/guidelines/index.md
