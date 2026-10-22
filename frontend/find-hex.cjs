const fs = require('fs');
const path = require('path');

const hexRegex = /#([a-fA-F0-9]{6})/g;
const counts = {};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(jsx?|tsx?|css)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let match;
      while ((match = hexRegex.exec(content)) !== null) {
        const hex = '#' + match[1].toUpperCase();
        counts[hex] = (counts[hex] || 0) + 1;
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));

const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
console.log(sorted.map(e => `${e[0]}: ${e[1]}`).join('\n'));
