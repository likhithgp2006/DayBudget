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
const buttons = [];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Match buttons
  const btnMatches = content.match(/<button[^>]*>/g) || [];
  btnMatches.forEach(b => {
    if (!b.includes('onClick') && !b.includes('type="submit"') && !b.includes("type='submit'") && !b.includes('type={') && !b.includes('form=')) {
      buttons.push({ file: f, button: b });
    }
  });
});
console.log('Buttons without onClick or submit:', JSON.stringify(buttons, null, 2));
