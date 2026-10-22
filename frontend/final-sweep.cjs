const fs = require('fs');
const path = require('path');

const replacements = [
  // Straggler teals
  { old: /#008f86/gi, new: '#4F5D75' },
  { old: /\[#008f86\]/gi, new: '[#4F5D75]' },
  { old: /#009e94/gi, new: '#4F5D75' },
  { old: /\[#009e94\]/gi, new: '[#4F5D75]' },
  { old: /#00ddd0/gi, new: '#EF8354' },
  { old: /\[#00ddd0\]/gi, new: '[#EF8354]' },
  { old: /#008c83/gi, new: '#4F5D75' },
  { old: /\[#008c83\]/gi, new: '[#4F5D75]' },
  { old: /#00a79d/gi, new: '#EF8354' },
  { old: /\[#00a79d\]/gi, new: '[#EF8354]' },
  { old: /#007a72/gi, new: '#4F5D75' },
  { old: /\[#007a72\]/gi, new: '[#4F5D75]' },

  // Dark backgrounds to Gunmetal
  { old: /#1a1a1a/gi, new: '#2D3142' },
  { old: /\[#1a1a1a\]/gi, new: '[#2D3142]' },
  { old: /#242424/gi, new: '#2D3142' },
  { old: /\[#242424\]/gi, new: '[#2D3142]' },
  { old: /#0f172a/gi, new: '#2D3142' },
  { old: /\[#0f172a\]/gi, new: '[#2D3142]' }
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

processDirectory(path.join(__dirname, 'src'));
console.log("✅ Final sweep completed.");
