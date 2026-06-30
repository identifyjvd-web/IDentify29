const fs = require('fs');
const html = fs.readFileSync('Admin_Panel.html', 'utf8');
const lines = html.split('\n');
const scriptIdx = lines.findIndex(l => l.includes('<script type="module">'));
console.log(lines.slice(scriptIdx - 10, scriptIdx + 5).join('\n'));
