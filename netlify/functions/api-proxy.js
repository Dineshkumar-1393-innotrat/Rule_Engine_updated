const axios = require('axios');
const https = require('https');

const routeMap = {
    '/api/traxo': 'https://cvipiot-preprod.fca-india.com:40543',
    '/api/jeep': 'https://cvipapi-preprod.fca-india.com/jeep',
    '/api/platform': 'https://lb2.cvip-preprod.citroen.in:40543',
    '/api/fota-fca': 'https://cvipiot-preprod.fca-india.com:40543',
    '/api/fota-lb1-fca': 'https://lb1.cvip-preprod.citroen.in:40543',
    '/api/aws': 'https://1jp9u7p9pl.execute-api.ap-south-1.amazonaws.com'
};

exports.handler = async (event, context) => {
    let targetBase = null;
    let targetPath = event.path;

    for (const [prefix, base] of Object.entries(routeMap)) {
        if (event.path.startsWith(prefix)) {
            targetBase = base;
            targetPath = event.path.replace(prefix, '');
            break;
        }
    }

    if (!targetBase) {
        return { statusCode: 404, body: 'Not Found in Proxy Map' };
    }

    // Ensure we don't end up with double slashes like https://url.com//path
    if (targetPath && !targetPath.startsWith('/')) {
        targetPath = '/' + targetPath;
    }
    const url = `${targetBase}${targetPath}`;

    const agent = new https.Agent({
        rejectUnauthorized: false
    });

    try {
        const response = await axios({
            method: event.httpMethod,
            url: url,
            params: event.queryStringParameters,
            data: event.body,
            headers: {
                'Content-Type': event.headers['content-type'] || 'application/json',
                'Authorization': event.headers['authorization'] || '',
                'Accept': 'application/json'
            },
            httpsAgent: agent,
            validateStatus: () => true
        });

        return {
            statusCode: response.status,
            body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        console.error('Proxy error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Proxy Error',
                message: error.message,
                details: error.response?.data || null
            })
        };
    }
};
