const axios = require('axios');
const https = require('https');

exports.handler = async (event, context) => {
    // Extract the path after /api/jeep/
    const path = event.path.replace('/api/jeep/', '');
    const url = `https://cvipapi-preprod.fca-india.com/jeep/${path}`;

    console.log(`Proxying request to: ${url}`);
    console.log(`Method: ${event.httpMethod}`);

    const agent = new https.Agent({
        rejectUnauthorized: false
    });

    try {
        const response = await axios({
            method: event.httpMethod,
            url: url,
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
