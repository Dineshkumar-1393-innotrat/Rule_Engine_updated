const fs = require('fs');
const path = require('path');

const projectDir = 'd:\\Rule_Engine_updated';

function getEndpoints(item, parentName = '') {
    let endpoints = [];
    if (item.request) {
        let url = '';
        if (typeof item.request.url === 'string') {
            url = item.request.url;
        } else if (item.request.url && item.request.url.raw) {
            url = item.request.url.raw;
        } else if (item.request.url && item.request.url.path) {
            url = '/' + item.request.url.path.join('/');
        }
        
        endpoints.push({
            name: (parentName ? parentName + ' > ' : '') + item.name,
            method: item.request.method,
            url: url
        });
    }

    if (item.item) {
        item.item.forEach(subItem => {
            endpoints = endpoints.concat(getEndpoints(subItem, (parentName ? parentName + ' > ' : '') + item.name));
        });
    }

    return endpoints;
}

const collections = fs.readdirSync(projectDir).filter(f => f.endsWith('.postman_collection.json'));

const allEndpoints = {};

collections.forEach(file => {
    try {
        const content = JSON.parse(fs.readFileSync(path.join(projectDir, file), 'utf8'));
        const endpoints = getEndpoints(content);
        allEndpoints[file] = endpoints;
    } catch (e) {
        console.error(`Error parsing ${file}: ${e.message}`);
    }
});

fs.writeFileSync(path.join(projectDir, 'all_postman_endpoints.json'), JSON.stringify(allEndpoints, null, 2));
console.log('Endpoints extracted to all_postman_endpoints.json');
