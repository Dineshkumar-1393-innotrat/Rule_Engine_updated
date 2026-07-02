const FormData = require('form-data');
const https = require('https');

async function uploadFile(url, token) {

    try {

        console.log('\nUploading file to server...');
        console.log('Upload URL:', url);

        // Create multipart form
        const form = new FormData();

        // IMPORTANT:
        // key name should match Postman
        form.append(
            'files',
            fs.createReadStream('./Tboxlogs.zip')
        );

        // HTTPS Agent
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });

        // API CALL
        const response = await axios.post(
            url,
            form,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...form.getHeaders()
                },

                httpsAgent,
                timeout: 30000,
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        console.log('\nUPLOAD SUCCESS');
        console.log('Status:', response.status);
        console.log('Response:', response.data);

        return true;

    } catch (err) {

        console.error('\nUPLOAD FAILED');

        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error(err.message);
        }

        return false;
    }
}