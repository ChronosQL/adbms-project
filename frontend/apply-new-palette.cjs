const fs = require('fs');
const path = require('path');

const replacements = [
  // Old Orange to new colors
  { old: /#F5820D/gi, new: '#EF8354' },
  { old: /#C85A00/gi, new: '#4F5D75' },
  { old: /#2C2F3A/gi, new: '#2D3142' },
  { old: /#FEF0E0/gi, new: '#BFC0C0' },
  { old: /#FFF8F0/gi, new: '#BFC0C0' },
  { old: /#F0A500/gi, new: '#EF8354' },
  { old: /\[#F5820D\]/gi, new: '[#EF8354]' },
  { old: /\[#C85A00\]/gi, new: '[#4F5D75]' },
  { old: /\[#2C2F3A\]/gi, new: '[#2D3142]' },
  { old: /\[#FEF0E0\]/gi, new: '[#BFC0C0]' },
  { old: /\[#FFF8F0\]/gi, new: '[#BFC0C0]' },
  { old: /\[#F0A500\]/gi, new: '[#EF8354]' },
  
  // Old Teal to new colors
  { old: /#00b0a5/gi, new: '#EF8354' },
  { old: /#1fcfc4/gi, new: '#EF8354' },
  { old: /#009b91/gi, new: '#4F5D75' },
  { old: /#007b73/gi, new: '#4F5D75' },
  { old: /#009a90/gi, new: '#4F5D75' },
  { old: /#188c85/gi, new: '#4F5D75' },
  { old: /\[#00b0a5\]/gi, new: '[#EF8354]' },
  { old: /\[#1fcfc4\]/gi, new: '[#EF8354]' },
  { old: /\[#009b91\]/gi, new: '[#4F5D75]' },
  { old: /\[#007b73\]/gi, new: '[#4F5D75]' },
  { old: /\[#009a90\]/gi, new: '[#4F5D75]' },
  { old: /\[#188c85\]/gi, new: '[#4F5D75]' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(jsx?|tsx?|css)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const { old, new: replacement } of replacements) {
        if (old.test(content)) {
          content = content.replace(old, replacement);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

console.log("🎨 Applying teal replacements as well...");
processDirectory(path.join(__dirname, 'src'));
console.log("✅ Teal colors updated successfully!");
