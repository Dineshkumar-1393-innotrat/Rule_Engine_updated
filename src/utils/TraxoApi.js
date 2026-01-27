import axios from 'axios';

const BASE_URL = '/api/traxo';

let authToken = null;

export const TraxoApi = {
    login: async (credentials = {
        userName: "admin",
        password: "admin",
        accountId: "primary",
        clientId: "doFBMiLMdcqaSYxbo_68NmmHgkYa",
        clientSecret: "JmMwN6yEZb3jbtSWMq2hwEOCjP8a"
    }) => {
        try {
            const response = await axios.post(`${BASE_URL}/authentication/login`, credentials, {
                headers: { 'Content-Type': 'application/json' }
            });
            authToken = response.data.access_token;
            console.log('Traxo Login Success');
            return authToken;
        } catch (error) {
            console.error('Traxo Login Error:', error);
            throw error;
        }
    },

    getVehicleTelemetry: async (vin, signalName) => {
        if (!authToken) {
            console.log('No token found, attempting login...');
            await TraxoApi.login();
        }
        try {
            console.log(`Fetching telemetry for ${signalName} (VIN: ${vin})...`);
            const response = await axios.get(`${BASE_URL}/can/decoder/${vin}/VehicleTelemetry/signalname/${signalName}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            console.log(`Success: Received data for ${signalName}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching telemetry for ${signalName}:`, error.message);
            if (error.response) {
                console.error('Response Status:', error.response.status);
                console.error('Response Data:', error.response.data);
            }
            throw error;
        }
    },

    getLocationTelemetry: async (vin) => {
        // Note: Factorytenant might be needed for location, but we'll try with primary first
        if (!authToken) await TraxoApi.login();
        try {
            const response = await axios.get(`${BASE_URL}/devices/vin/${vin}/states?subcategory=LocationTelemetry`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching location:', error);
            throw error;
        }
    },

    getAlerts: async (vin) => {
        if (!authToken) await TraxoApi.login();
        try {
            const response = await axios.get(`${BASE_URL}/alerts/${vin}/`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching alerts:', error);
            throw error;
        }
    },

    getEvents: async (vin, limit = 50, starttime = null, endtime = null) => {
        if (!authToken) await TraxoApi.login();

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

        const finalStartTime = starttime || formatDate(yesterday);
        const finalEndTime = endtime || formatDate(now);

        try {
            const response = await axios.get(`${BASE_URL}/events/${vin}/DEVICE`, {
                params: { limit, starttime: finalStartTime, endtime: finalEndTime },
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }
};
