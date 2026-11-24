const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
const issues = [];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (/href\s*=\s*['"]#['"]/i.test(l)) {
      issues.push({ file: f, line: idx + 1, type: 'href=#', text: l.trim() });
    }
    if (/onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/i.test(l)) {
      issues.push({ file: f, line: idx + 1, type: 'empty-onClick', text: l.trim() });
    }
    if (/TODO|FIXME/i.test(l)) {
      issues.push({ file: f, line: idx + 1, type: 'TODO', text: l.trim() });
    }
  });
});
console.log(JSON.stringify(issues, null, 2));
