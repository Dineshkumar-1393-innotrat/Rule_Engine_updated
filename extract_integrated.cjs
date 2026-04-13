const fs = require('fs');
const path = require('path');

const filePath = 'd:\\Rule_Engine_updated\\src\\components\\SystemOverview\\SystemConsolePage.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// Rough extraction of API_CATEGORIES
const startToken = 'const API_CATEGORIES = [';
const startIndex = content.indexOf(startToken);
if (startIndex === -1) {
    console.error('API_CATEGORIES not found');
    process.exit(1);
}

// Find the matching closing bracket for API_CATEGORIES
let depth = 0;
let endIndex = -1;
for (let i = startIndex + startToken.length - 1; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') depth--;
    if (depth === 0) {
        endIndex = i;
        break;
    }
}

if (endIndex === -1) {
    console.error('API_CATEGORIES closing bracket not found');
    process.exit(1);
}

const categoriesStr = content.substring(startIndex, endIndex + 1);
// We'll just extract names using regex since it's not pure JSON
const nameRegex = /name:\s*'([^']+)'/g;
const names = [];
let match;
while ((match = nameRegex.exec(categoriesStr)) !== null) {
    names.push(match[1]);
}

fs.writeFileSync('integrated_api_names.json', JSON.stringify({ names }, null, 2));
console.log('Integrated API names extracted to integrated_api_names.json');
