import axios from 'axios';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const testApi = async () => {
    const vin = 'MCAAJPBH2PFA86222';
    
    try {
        console.log('Logging in to PRIMARY...');
        const loginRes = await axios.post('https://cvipiot-preprod.fca-india.com:40543/users/login', {
            userName: "admin",
            password: "admin",
            accountId: "primary",
            clientId: "doFBMiLMdcqaSYxbo_68NmmHgkYa",
            clientSecret: "JmMwN6yEZb3jbtSWMq2hwEOCjP8a"
        });
        
        const token = loginRes.data.access_token || loginRes.data.token?.accessToken;
        const primaryToken = `Bearer ${token}`;
        console.log('PRIMARY Login successful.');
        
        try {
            console.log('Testing JEEP /vehicleStatus with PRIMARY token...');
            const vsRaw = await axios.get(`https://cvipiot-preprod.fca-india.com:40543/jeep/vehicleStatus/${vin}`, {
                headers: { 'Authorization': primaryToken, 'Accept': 'application/json' }
            });
            console.log('SUCCESS', Object.keys(vsRaw.data));
        } catch (e) {
            console.error('FAILED:', e.response?.status, e.response?.data);
        }
        
    } catch (e) {
        console.error('Login failed:', e.message);
    }
};

testApi();
