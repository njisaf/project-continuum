#!/bin/bash

# Script to update image paths in packs
# Usage: ./build/avant/update-pack-paths.sh

echo "Updating image paths in packs..."

# Find all JSON files in the packs directory
find ./packs -type f -name "*.json" -exec grep -l "systems/pf2e" {} \; | while read file; do
  echo "Updating paths in $file"
  sed -i '' 's|systems/pf2e|systems/avant|g' "$file"
done

echo "Image path updates complete!" 