const fs = require('fs');

const allPostman = JSON.parse(fs.readFileSync('all_postman_endpoints.json', 'utf8'));
const integrated = JSON.parse(fs.readFileSync('integrated_api_names.json', 'utf8')).names;

const allUniquePostmanEndpoints = new Map();

Object.keys(allPostman).forEach(collectionName => {
    allPostman[collectionName].forEach(ep => {
        const epName = ep.name.split(' > ').pop();
        // Skip tokens/logins as they are handled internally or not needed as standalone UI buttons
        if (epName.toLowerCase().includes('token') || epName.toLowerCase().includes('login')) return;
        
        const key = `${ep.method}:${epName.toLowerCase()}`;
        if (!allUniquePostmanEndpoints.has(key)) {
            allUniquePostmanEndpoints.set(key, { ...ep, collection: collectionName });
        }
    });
});

const missing = [];
allUniquePostmanEndpoints.forEach((ep) => {
    const epName = ep.name.split(' > ').pop();
    const isIntegrated = integrated.some(name => 
        name.toLowerCase() === epName.toLowerCase() || 
        epName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(epName.toLowerCase())
    );
    
    if (!isIntegrated) {
        missing.push(ep);
    }
});

fs.writeFileSync('all_missing_unique_endpoints.json', JSON.stringify({ missing, total_missing: missing.length }, null, 2));
console.log(`Found ${missing.length} unique missing endpoints across ALL collections`);
