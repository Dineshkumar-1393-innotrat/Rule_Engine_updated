const fs = require('fs');

const allPostman = JSON.parse(fs.readFileSync('all_postman_endpoints.json', 'utf8'));
const integrated = JSON.parse(fs.readFileSync('integrated_api_names.json', 'utf8')).names;

const latestCollection = "Jeep APIs Collection 4.0_SB_Preprod.postman_collection.json";
const postmanEndpoints = allPostman[latestCollection];

const missing = [];
postmanEndpoints.forEach(ep => {
    // Check if the endpoint name (or sub-name) exists in integrated names
    const epName = ep.name.split(' > ').pop();
    const isIntegrated = integrated.some(name => 
        name.toLowerCase() === epName.toLowerCase() || 
        epName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(epName.toLowerCase())
    );
    
    if (!isIntegrated && !epName.includes('GetToken') && !epName.includes('Login')) {
        missing.push({
            postmanName: ep.name,
            epName,
            method: ep.method,
            url: ep.url
        });
    }
});

fs.writeFileSync('missing_endpoints.json', JSON.stringify({ missing, total_missing: missing.length }, null, 2));
console.log(`Found ${missing.length} potentially missing endpoints from ${latestCollection}`);
