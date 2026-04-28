import axios from 'axios';

const testApi = async () => {
    const vin = 'MCAAJPBH2PFA86222';
    const baseUrl = 'https://cvipiot-preprod.fca-india.com:40543/jeep';
    
    try {
        console.log('Logging in to JEEP...');
        const loginRes = await axios.post(`${baseUrl}/cpi/users/login`, {
            userName: "admin",
            password: "Password@123",
            mobileNum: "9988998800"
        });
        
        const rawToken = loginRes.data.token?.accessToken 
            || loginRes.data.access_token 
            || loginRes.data.accessToken 
            || (typeof loginRes.data.token === 'string' ? loginRes.data.token : null);
            
        console.log('Login successful. Testing with RAW token...');
        
        try {
            const vsRaw = await axios.get(`${baseUrl}/commands/audit/${vin}`, {
                headers: { 'Authorization': rawToken, 'Accept': 'application/json' }
            });
            console.log('RAW Token - Vehicle Status SUCCESS', Object.keys(vsRaw.data));
        } catch (e) {
            console.error('RAW Token - Vehicle Status FAILED:', e.response?.status, e.response?.data);
        }
        
        console.log('\nTesting with BEARER token...');
        const bearerToken = `Bearer ${rawToken}`;
        
        try {
            const vsBearer = await axios.get(`${baseUrl}/commands/audit/${vin}`, {
                headers: { 'Authorization': bearerToken, 'Accept': 'application/json' }
            });
            console.log('BEARER Token - Vehicle Status SUCCESS', Object.keys(vsBearer.data));
        } catch (e) {
            console.error('BEARER Token - Vehicle Status FAILED:', e.response?.status, e.response?.data);
        }
        
    } catch (e) {
        console.error('Login failed:', e.message);
    }
};

testApi();
