import axios from 'axios';

const BASE_URL = '/api/traxo';
console.warn("TraxoApi Loaded - MultiAccount Version - If you do not see this, restart the server");
const JEEP_BASE_URL = '/api/jeep';

const ACCOUNTS = {
    PRIMARY: {
        userName: "admin",
        password: "admin",
        accountId: "primary",
        clientId: "doFBMiLMdcqaSYxbo_68NmmHgkYa",
        clientSecret: "JmMwN6yEZb3jbtSWMq2hwEOCjP8a"
    },
    FACTORY: {
        userName: "admin",
        password: "V6PS0EWwF5V&",
        accountId: "Factorytenant",
        clientId: "0gf3yAv29550GxrNVN4hDEUGYmEa",
        clientSecret: "0K1S1VQ9u1Cc0z2Pptr6ZtzRviAa"
    },
    JEEP: {
        countryCode: "+91",
        mobileNum: "9894638059",
        password: "Password@123"
    }
};

const authTokens = {
    PRIMARY: null,
    FACTORY: null,
    JEEP: null
};

const withRetry = async (apiCall, accountType = 'PRIMARY', isRetry = false) => {
    try {
        return await apiCall();
    } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // If we already tried re-authenticating and still got 401/403, don't loop
            if (isRetry) {
                console.warn(`[${accountType}] Persistent authentication failure for ${error.config?.url}. Breaking loop.`);
                throw error;
            }

            console.log(`[${accountType}] Session expired or unauthorized, re-authenticating...`);
            authTokens[accountType] = null;
            try {
                await TraxoApi.login(accountType);
                return await withRetry(apiCall, accountType, true); // Mark as retry
            } catch (retryError) {
                console.error(`[${accountType}] Re-authentication failed:`, retryError.message);
                throw retryError;
            }
        }
        console.error(`[${accountType}] API Call Failed:`, error.config?.url, error.response?.status);
        throw error;
    }
};

/**
 * Utility to convert an array of signal objects into a single flat object
 * @param {Array|Object} data 
 */
const flattenStates = (data) => {
    if (!data) return null;
    if (!Array.isArray(data)) return data;
    const flat = {};
    data.forEach(item => {
        if (item.signalName) {
            flat[item.signalName] = item.signalValue;
        }
    });
    return Object.keys(flat).length > 0 ? flat : data;
};

export const TraxoApi = {
    login: async (accountType = 'PRIMARY') => {
        const credentials = ACCOUNTS[accountType];
        try {
            const url = accountType === 'JEEP'
                ? `${JEEP_BASE_URL}/users/login`
                : `${BASE_URL}/authentication/login`;

            const response = await axios.post(url, credentials, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            if (accountType === 'JEEP') {
                // Postman shows Jeep login response as { StatusCode, token: { accessToken, ... } }
                authTokens[accountType] = response.data.token?.accessToken;
                if (!authTokens[accountType]) {
                    console.error("JEEP Login response missing token.accessToken:", response.data);
                }
            } else {
                authTokens[accountType] = response.data.access_token;
            }

            console.log(`Traxo Login Success [${accountType}]`);
            return authTokens[accountType];
        } catch (error) {
            console.error(`Traxo Login Error [${accountType}]:`, error.response?.data || error.message);
            throw error;
        }
    },

    // In your TraxoApi.js or wherever your API calls are defined
    async getIgnitionEvents(vin, starttime, endtime) {
        return withRetry(async () => {
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');

            const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
            const finalStartTime = starttime || formatDate(new Date(Date.now() - 7 * 86400000)); // 7 days ago
            const finalEndTime = endtime || formatDate(new Date());

            const response = await axios.get(`${BASE_URL}/events/${vin}/DEVICE`, {
                params: {
                    limit: 500,
                    starttime: finalStartTime,
                    endtime: finalEndTime
                },
                headers: {
                    'Authorization': `Bearer ${authTokens.PRIMARY}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            console.log("📡 API Response Status:", response.data);

            // Filter and format ignition events
            const ignitionEvents = (response.data.events || [])
                .filter(event => event.eventtype === "IGNITIONSTATUS")
                .map(event => {
                    let details = {};
                    try {
                        details = typeof event.eventdetails === 'string'
                            ? JSON.parse(event.eventdetails)
                            : event.eventdetails || {};
                    } catch (e) {
                        console.warn("Failed to parse ignition details", e);
                    }

                    return {
                        sourceid: event.sourceid,
                        eventtype: event.eventtype,
                        sourcetimestamp: event.sourcetimestamp,
                        signalValue: details.eventValue || details.value || 'OFF',
                        eventValue: details.eventValue || '',
                        message: details.message || '',
                        details: details,
                        updatedTimeStamp: event.sourcetimestamp
                    };
                });

            return ignitionEvents;
        }, 'PRIMARY');
    },



    getVehicleTelemetry: async (vin, signalName) => {
        return withRetry(async () => {
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');
            try {
                const response = await axios.get(`${BASE_URL}/can/decoder/${vin}/VehicleTelemetry/signalname/${signalName}`, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.PRIMARY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                return response.data;
            } catch (error) {
                console.warn(`Failed to fetch signal ${signalName} for ${vin}:`, error.message);
                return null;
            }
        }, 'PRIMARY');
    },

    getLocationTelemetry: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');

            // Try factory list first
            try {
                const devicesData = await TraxoApi.getDevices();
                const list = Array.isArray(devicesData) ? devicesData : (devicesData.data || []);
                const device = list.find(d =>
                    String(d.vin || d.vinNo).toLowerCase() === String(vin).toLowerCase() ||
                    String(d.serialNumber || d.id).toLowerCase() === String(vin).toLowerCase()
                );
                if (device && (device.lastLocation || device.lastKnownLocation)) {
                    return device.lastLocation || device.lastKnownLocation;
                }
            } catch (e) {
                console.warn("[Traxo] Location check in devices list failed:", e.message);
            }

            // Fallback to specific states endpoint
            try {
                const response = await axios.get(`${BASE_URL}/devices/vin/${vin}/states`, {
                    params: { subcategory: 'LocationTelemetry' },
                    headers: {
                        'Authorization': `Bearer ${authTokens.FACTORY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                return flattenStates(response.data);
            } catch (error) {
                console.warn(`Failed to fetch location states for ${vin}:`, error.message);
                return null;
            }
        }, 'FACTORY');
    },

    // Get raw location telemetry array for console view
    getLocationTelemetryArray: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');

            try {
                const response = await axios.get(`${BASE_URL}/devices/vin/${vin}/states`, {
                    params: { subcategory: 'LocationTelemetry' },
                    headers: {
                        'Authorization': `Bearer ${authTokens.FACTORY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                console.log("Location API raw response:", response.data);
                console.log("Location API response type:", typeof response.data, "isArray:", Array.isArray(response.data));
                // Return raw array for console view
                return Array.isArray(response.data) ? response.data : (response.data.events || response.data);
            } catch (error) {
                console.warn(`Failed to fetch location telemetry array for ${vin}:`, error.message);
                return [];
            }
        }, 'FACTORY');
    },

    getAlerts: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');
            const cleanVin = String(vin).trim();

            const tryGet = async (url, params = {}) => {
                try {
                    const response = await axios.get(url, {
                        params,
                        headers: {
                            'Authorization': `Bearer ${authTokens.PRIMARY}`,
                            'Accept': '*/*'
                        },
                        timeout: 30000
                    });
                    return response.data;
                } catch (e) {
                    if (e.response?.status === 400) {
                        console.warn(`[Alerts] 400 error for ${url}:`, e.response.data?.message || e.message);
                    }
                    throw e;
                }
            };

            // Variation 1: Standard path (matching Postman)
            try {
                return await tryGet(`${BASE_URL}/alerts/${cleanVin}/`);
            } catch (e) {
                // Variation 2: No trailing slash
                try {
                    return await tryGet(`${BASE_URL}/alerts/${cleanVin}`);
                } catch (e2) {
                    // Variation 3: DEVICE suffix (matching events pattern)
                    try {
                        return await tryGet(`${BASE_URL}/alerts/${cleanVin}/DEVICE`);
                    } catch (e3) {
                        // Variation 4: Query params
                        try {
                            return await tryGet(`${BASE_URL}/alerts`, { vin: cleanVin, status: 'OPEN' });
                        } catch (e4) {
                            // Variation 5: VIN query param only
                            try {
                                return await tryGet(`${BASE_URL}/alerts`, { vin: cleanVin });
                            } catch (e5) {
                                return [];
                            }
                        }
                    }
                }
            }
        }, 'PRIMARY');
    },

    getEvents: async (vin, limit = 50, starttime = null, endtime = null) => {
        return withRetry(async () => {
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');

            const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
            const finalStartTime = starttime || formatDate(new Date(Date.now() - 86400000));
            const finalEndTime = endtime || formatDate(new Date());

            const response = await axios.get(`${BASE_URL}/events/${vin}/DEVICE`, {
                params: { limit, starttime: finalStartTime, endtime: finalEndTime },
                headers: {
                    'Authorization': `Bearer ${authTokens.PRIMARY}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }, 'PRIMARY');
    },

    getDevices: async () => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');
            const response = await axios.get(`${BASE_URL}/devices`, {
                headers: {
                    'Authorization': `Bearer ${authTokens.FACTORY}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }, 'FACTORY');
    },

    getDeviceState: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');

            // 1. Direct portal endpoint
            try {
                const response = await axios.get(`${BASE_URL}/portal/vin/${vin}`, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.FACTORY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                if (response.data && response.data.vinNo) return response.data;
            } catch (e) { }

            // 2. Search endpoint
            try {
                const searchResp = await axios.get(`${BASE_URL}/portal/search`, {
                    params: { searchPattern: vin, searchKey: 'vin' },
                    headers: {
                        'Authorization': `Bearer ${authTokens.FACTORY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                const result = Array.isArray(searchResp.data) ? searchResp.data[0] : searchResp.data;
                if (result && (result.vinNo === vin || result.vin === vin)) return result;
            } catch (e) { }

            // 3. Local filtering
            try {
                const devices = await TraxoApi.getDevices();
                const list = Array.isArray(devices) ? devices : (devices.data || []);
                const match = list.find(d => d.vin === vin || d.serialNumber === vin || d.id === vin || d.vinNo === vin);
                if (match) return match;
            } catch (e) { }

            return {};
        }, 'FACTORY');
    },

    getOngoingTrip: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/trip/${vin}/ongoing`, {
                headers: {
                    'Authorization': `Bearer ${authTokens.JEEP}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }, 'JEEP');
    },



    // Remote Commands map to JEEP
    lockDoor: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/concurrentcommands/vinno`,
            { deviceVinno: vin, actionType: "remotedoorlockcommand" },
            { headers: { 'Authorization': `Bearer ${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    unlockDoor: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/concurrentcommands/vinno`,
            { deviceVinno: vin, actionType: "remotedoorunlockcommand" },
            { headers: { 'Authorization': `Bearer ${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    blinkerOn: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/concurrentcommands/vinno`,
            { deviceVinno: vin, actionType: "remoteblinkeroncommand" },
            { headers: { 'Authorization': `Bearer ${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    blinkerOff: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/concurrentcommands/vinno`,
            { deviceVinno: vin, actionType: "remoteblinkeroffcommand" },
            { headers: { 'Authorization': `Bearer ${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    honk: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/concurrentcommands/vinno`,
            { deviceVinno: vin, actionType: "remotehonkcommand" },
            { headers: { 'Authorization': `Bearer ${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    setSpeedAlert: async (vin, speed) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/concurrentcommands/vinno`,
            { deviceVinno: vin, actionType: "speedalertcommand", command: { speed: String(speed) } },
            { headers: { 'Authorization': `Bearer ${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    getCommandStatus: async (vin, commandId) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.get(`${JEEP_BASE_URL}/commands/device/vin/${vin}/command/${commandId}`,
            { headers: { 'Authorization': `Bearer ${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP')
};
