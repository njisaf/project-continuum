#!/bin/bash

# Script to clean up packs, keeping only essential templates and structure

# Define essential packs to keep
KEEP_PACKS=(
  "conditions"
  "equipment-effects"
  "equipment"
  "spell-effects"
  "actions"
)

echo "Cleaning up packs directory..."

# Create backup of system.json
cp static/system.json static/system.json.bak

# Backup packs directory
if [ ! -d "packs.bak" ]; then
  echo "Creating backup of packs directory..."
  cp -r packs packs.bak
fi

# Clean up packs directory
for dir in packs/*; do
  if [ -d "$dir" ]; then
    pack_name=$(basename "$dir")
    keep=false
    
    for keep_pack in "${KEEP_PACKS[@]}"; do
      if [ "$pack_name" == "$keep_pack" ]; then
        keep=true
        break
      fi
    done
    
    if [ "$keep" = false ]; then
      echo "Removing pack: $pack_name"
      rm -rf "$dir"
    else
      echo "Keeping pack: $pack_name"
    fi
  fi
done

# Update system.json to remove references to deleted packs
echo "Updating system.json to remove references to deleted packs..."
jq '.packs = .packs | map(select(.name as $name | ["conditions", "equipment-effects", "equipment", "spell-effects", "actions"] | index($name) != null))' static/system.json > static/system.json.new
mv static/system.json.new static/system.json

echo "Pack cleanup complete!" 