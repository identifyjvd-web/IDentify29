const fs = require('fs');
const html = fs.readFileSync('Admin_Panel.html', 'utf8');
const lines = html.split('\n');
const firstScriptEnd = lines.findIndex(l => l.includes('</script>'));
console.log(lines.slice(firstScriptEnd - 2, firstScriptEnd + 25).join('\n'));
