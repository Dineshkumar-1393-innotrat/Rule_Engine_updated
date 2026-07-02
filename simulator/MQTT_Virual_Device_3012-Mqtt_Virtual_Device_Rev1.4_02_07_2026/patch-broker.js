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

  // Replace standard BROKER definitions
  content = content.replace(/(BROKER\s*:\s*)(['"])(mqtts?:\/\/[^'"]+)\2/g, (match, prefix, quote, brokerUrl) => {
    // Avoid double patching
    if (match.includes('process.env.BROKER')) return match;
    return `${prefix}process.env.BROKER || ${quote}${brokerUrl}${quote}`;
  });

  // Special cases for deviceJoinLatest.js
  if (file.endsWith('deviceJoinLatest.js')) {
    content = content.replace(/(BROKER_CSR\s*:\s*)(['"])(mqtts?:\/\/[^'"]+)\2/g, (match, prefix, quote, brokerUrl) => {
      if (match.includes('process.env.BROKER')) return match;
      return `${prefix}process.env.BROKER ? process.env.BROKER.replace(':18883', ':28883') : ${quote}${brokerUrl}${quote}`;
    });
    content = content.replace(/(BROKER_DEVICE\s*:\s*)(['"])(mqtts?:\/\/[^'"]+)\2/g, (match, prefix, quote, brokerUrl) => {
      if (match.includes('process.env.BROKER')) return match;
      return `${prefix}process.env.BROKER || ${quote}${brokerUrl}${quote}`;
    });
    content = content.replace(/['"]https:\/\/cvipiot-preprod\.fca-india\.com:40543\/csr\/createCertificate['"]/g, (match) => {
      return "`https://${(process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883').replace('mqtts://', '').split(':')[0]}:40543/csr/createCertificate`";
    });
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Patched: ${path.relative(__dirname, file)}`);
  }
});
console.log('Patching complete!');
