#!/bin/bash

# Script to rename PF2e references to Avant
# Usage: ./build/avant/rename.sh

# Directories to exclude
EXCLUDE_DIRS="node_modules|dist|.git|packs"

# Function to replace in files
replace_in_files() {
    local pattern=$1
    local replacement=$2
    local file_pattern=$3
    
    echo "Replacing '$pattern' with '$replacement' in $file_pattern files..."
    
    find . -type f -name "$file_pattern" -not -path "*/node_modules/*" -not -path "*/dist/*" \
        -not -path "*/.git/*" -not -path "*/packs/*" -exec grep -l "$pattern" {} \; | 
        xargs -I {} sed -i '' "s/$pattern/$replacement/g" {}
}

# Create a new system.js file
echo "Creating avant.ts from pf2e.ts..."
cp -f src/pf2e.ts src/avant.ts
sed -i '' 's/HooksPF2e/HooksAvant/g' src/avant.ts

# Rename in TypeScript and JavaScript files
replace_in_files "PF2e" "Avant" "*.ts"
replace_in_files "PF2e" "Avant" "*.js"
replace_in_files "PF2E" "AVANT" "*.ts"
replace_in_files "PF2E" "AVANT" "*.js"
replace_in_files "pf2e" "avant" "*.ts"
replace_in_files "pf2e" "avant" "*.js"

# Rename in JSON files
replace_in_files "pf2e" "avant" "*.json"
replace_in_files "PF2e" "Avant" "*.json"
replace_in_files "PF2E" "AVANT" "*.json"

# Rename in SCSS files
replace_in_files "pf2e" "avant" "*.scss"
replace_in_files "PF2e" "Avant" "*.scss"

# Rename in HTML and handlebars templates
replace_in_files "pf2e" "avant" "*.html"
replace_in_files "PF2e" "Avant" "*.html"
replace_in_files "pf2e" "avant" "*.hbs"
replace_in_files "PF2e" "Avant" "*.hbs"

echo "Renaming complete!" 