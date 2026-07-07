const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(__dirname);
files.forEach(file => {
  if (file === __filename) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace hardcoded T123ZTZT867677788_Modified path with dynamic loading
  // Replace ca
  content = content.replace(
    /fs\.readFileSync\(['"]\.\/T123ZTZT867677788_Modified\/T123ZTZT867677788_Modified\/cacert\.pem['"]\)/g,
    `fs.existsSync('./certs/cacert.pem') ? fs.readFileSync('./certs/cacert.pem') : (fs.existsSync('./certs/ca.crt') ? fs.readFileSync('./certs/ca.crt') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/cacert.pem'))`
  );

  // Replace cert
  content = content.replace(
    /fs\.readFileSync\(['"]\.\/T123ZTZT867677788_Modified\/T123ZTZT867677788_Modified\/client\.pem['"]\)/g,
    `fs.existsSync('./certs/client.pem') ? fs.readFileSync('./certs/client.pem') : (fs.existsSync('./certs/client.crt') ? fs.readFileSync('./certs/client.crt') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/client.pem'))`
  );

  // Replace key
  content = content.replace(
    /fs\.readFileSync\(['"]\.\/T123ZTZT867677788_Modified\/T123ZTZT867677788_Modified\/device-key\.key['"]\)/g,
    `fs.existsSync('./certs/device-key.key') ? fs.readFileSync('./certs/device-key.key') : (fs.existsSync('./certs/client.key') ? fs.readFileSync('./certs/client.key') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/device-key.key'))`
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Patched cert paths in: ${path.relative(__dirname, file)}`);
  }
});
console.log('Cert patching complete!');
