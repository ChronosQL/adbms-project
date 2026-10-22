#!/bin/bash

# Ceylon Best Tours — Brand Color Update Script
# Replaces all teal (#00b0a5 and variants) with brand orange (#F5820D)
# Run this from your frontend/ folder:
#   bash update-brand-colors.sh

echo "🎨 Updating brand colors..."

# All JSX/JS/CSS files in src/
find src -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.css" -o -name "*.ts" -o -name "*.tsx" \) | while read file; do
  sed -i 's/#00b0a5/#F5820D/g' "$file"
  sed -i 's/#009b91/#C85A00/g' "$file"
  sed -i 's/#007b73/#C85A00/g' "$file"
  sed -i 's/#009a90/#C85A00/g' "$file"
  sed -i 's/#188c85/#C85A00/g' "$file"
  sed -i 's/#1fcfc4/#F5820D/g' "$file"
  sed -i 's/\[#00b0a5\]/[#F5820D]/g' "$file"
  sed -i 's/\[#009b91\]/[#C85A00]/g' "$file"
  sed -i 's/\[#007b73\]/[#C85A00]/g' "$file"
  sed -i 's/\[#009a90\]/[#C85A00]/g' "$file"
  sed -i 's/\[#1fcfc4\]/[#F5820D]/g' "$file"
  sed -i 's/\[#188c85\]/[#C85A00]/g' "$file"
  echo "  ✓ $file"
done

echo "✅ Brand colors updated successfully!"
echo "   Primary:  #00b0a5 → #F5820D (Sunset Orange)"
echo "   Hover:    #009b91 → #C85A00 (Deep Amber)"
