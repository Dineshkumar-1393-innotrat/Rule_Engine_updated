import axios from 'axios';

const BASE_URL = '/api/traxo';
const JEEP_BASE_URL = '/api/jeep'; // For trip and JEEP-specific APIs
console.warn("TraxoApi Loaded - MultiAccount Version - If you do not see this, restart the server");

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
    },
    FOTA: {
        userName: "admin",
        password: "V6PS0EWwF5V&",
        accountId: "fotatenant",
        clientId: "K4dcMP30mQbE9POIwqfFSHccfAIa",
        clientSecret: "94ZhjPBKffxaODNfwFKdliRoO4Aa"
    },
    FOTA_UPLOAD: {
        userName: "admin",
        password: "V6PS0EWwF5V&",
        accountId: "fotatenant",
        clientId: "HLzVgxYxPbzLOD3rzoWh6Gsv7Twa",
        clientSecret: "8OoOUy5Ny7spvefvSfXssvddeLEa"
    }
};

const authTokens = {
    PRIMARY: null,
    FACTORY: null,
    JEEP: null,
    FOTA: null,
    FOTA_UPLOAD: null
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
            // Default to last 24 hours if not provided, to keep it snappy but cover recent activity
            // Use user-provided window if available
            const finalStartTime = starttime || formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
            const finalEndTime = endtime || formatDate(new Date());

            console.log(`🔥 Fetching Ignition Events for ${vin} | Limit: 500 | Start: ${finalStartTime} | End: ${finalEndTime}`);

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

            const events = response.data.events || [];
            console.log(`🔥 Ignition Events Found (Raw): ${events.length}`);
            if (events.length > 0) {
                console.log("🔥 Raw Event Types:", events.map(e => e.eventtype));
            }

            // Filter ignition and device events
            const ignitionEvents = events
                .filter(event => {
                    const type = (event.eventtype || "").toUpperCase();
                    return type.includes("IGNITION") || type.includes("DEVICEJOIN");
                })
                .map(event => {
                    let details = {};
                    try {
                        details = typeof event.eventdetails === 'string'
                            ? JSON.parse(event.eventdetails)
                            : event.eventdetails || {};
                    } catch (e) {
                        // ignore parse error
                    }

                    let signalValue = details.eventValue || details.value || 'OFF';
                    const typeUpper = (event.eventtype || "").toUpperCase();

                    // If it's a device join event, mark as connected/online
                    if (typeUpper.includes("DEVICEJOIN")) {
                        signalValue = 'CONNECTED';
                    }

                    return {
                        sourceid: event.sourceid,
                        eventtype: event.eventtype,
                        sourcetimestamp: event.sourcetimestamp,
                        signalValue: signalValue,
                        eventValue: details.eventValue || '',
                        message: details.message || '',
                        details: details,
                        updatedTimeStamp: event.sourcetimestamp
                    };
                });

            console.log(`🔥 Ignition Events Filtered: ${ignitionEvents.length}`);
            return ignitionEvents;

        }, 'PRIMARY');
    },

    // Generic getEvents method with pagination
    getEvents: async (vin, limit = 50, starttime, endtime, nextKey = null) => {
        return withRetry(async () => {
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');

            const params = { limit };
            if (starttime) params.starttime = starttime;
            if (endtime) params.endtime = endtime;
            if (nextKey) params.nextPageKey = nextKey;

            const response = await axios.get(`${BASE_URL}/events/${vin}/DEVICE`, {
                params,
                headers: {
                    'Authorization': `Bearer ${authTokens.PRIMARY}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
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
                console.log(`📡 Realtime Telemetry [${signalName}]:`, response.data);
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
                console.log("📍 Location API Raw Response:", response.data);
                console.log("📍 Location API Type:", typeof response.data, "Is Array?", Array.isArray(response.data));

                // Return raw array for console view
                if (Array.isArray(response.data)) return response.data;
                if (response.data && Array.isArray(response.data.events)) return response.data.events;

                // If object but not events array, maybe wrap it?
                if (typeof response.data === 'object') return [response.data];

                return [];
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
                    // Silently suppress expected fallback errors (don't log to console)
                    throw e;
                }
            };

            // Try multiple endpoint variations (expected to fail until correct one is found)
            // These failures are EXPECTED - don't alarm the user
            let lastError = null;
            try {
                return await tryGet(`${BASE_URL}/alerts/${cleanVin}/`);
            } catch (e) {
                lastError = e;
                try {
                    return await tryGet(`${BASE_URL}/alerts/${cleanVin}`);
                } catch (e2) {
                    lastError = e2;
                    try {
                        return await tryGet(`${BASE_URL}/alerts/${cleanVin}/DEVICE`);
                    } catch (e3) {
                        lastError = e3;
                        try {
                            return await tryGet(`${BASE_URL}/alerts`, { vin: cleanVin, status: 'OPEN' });
                        } catch (e4) {
                            lastError = e4;
                            try {
                                return await tryGet(`${BASE_URL}/alerts`, { vin: cleanVin });
                            } catch (e5) {
                                lastError = e5;
                                // All attempts failed - throw the last error to trigger UI error state
                                throw lastError;
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
    }, 'JEEP'),

    triggerFotaUpdate: async (vin, version) => withRetry(async () => {
        if (!authTokens.FOTA) await TraxoApi.login('FOTA');
        // Note: FOTA APIs use the same base URL structure as PRIMARY/FACTORY (via /api/traxo proxy)
        // but with specific jeep/ota paths.
        // Postman URL: https://lb2.cvip-preprod.citroen.in:40543/jeep/ota/downloadfirmware
        // Proxy /api/traxo -> https://lb2...
        return (await axios.post(`${BASE_URL}/jeep/ota/downloadfirmware`,
            {
                category: "VIN",
                devices: [
                    {
                        vin: vin,
                        releaseVersion: version
                    }
                ]
            },
            { headers: { 'Authorization': `Bearer ${authTokens.FOTA}` }, timeout: 30000 }
        )).data;
    }, 'FOTA'),

    getFotaVersions: async () => withRetry(async () => {
        if (!authTokens.FOTA_UPLOAD) await TraxoApi.login('FOTA_UPLOAD');
        // Postman URL: https://lb1.cvip-preprod.citroen.in:40543/jeep/fota/firmware/versions
        // Trying via lb2 base url proxy
        const response = await axios.get(`${BASE_URL}/jeep/fota/firmware/versions`, {
            headers: { 'Authorization': `Bearer ${authTokens.FOTA_UPLOAD}` },
            timeout: 30000
        });
        return response.data;
    }, 'FOTA_UPLOAD'),

    resetFotaState: async (vin, commandName = "firmwaredownloadcommand") => withRetry(async () => {
        if (!authTokens.FOTA) await TraxoApi.login('FOTA');
        // Postman URL: https://lb1.cvip-preprod.citroen.in:40543/jeep/ota/resetfotastate?vinNo=...&commandName=...
        // Method: PUT
        return (await axios.put(`${BASE_URL}/jeep/ota/resetfotastate`, null, {
            params: { vinNo: vin, commandName: commandName },
            headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
            timeout: 30000
        })).data;
    }, 'FOTA'),

    // ========== TRIP AND LOGS APIs ==========
    getTripSummary: async (vin, starttime, endtime) => {
        return withRetry(async () => {
            // Ensure PRIMARY token is available
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');

            try {
                // Try with PRIMARY token first
                const response = await axios.get(`${JEEP_BASE_URL}/trip/${vin}/summary`, {
                    params: { starttime, endtime },
                    headers: {
                        'Authorization': `Bearer ${authTokens.PRIMARY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                console.log('📊 Trip Summary Response (PRIMARY):', response.data);
                return response.data;
            } catch (error) {
                // Fallback to JEEP token if PRIMARY fails with 403/401
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.log('⚠️ Trip API failed with PRIMARY token, trying JEEP token...');
                    if (!authTokens.JEEP) await TraxoApi.login('JEEP');

                    const retryResponse = await axios.get(`${JEEP_BASE_URL}/trip/${vin}/summary`, {
                        params: { starttime, endtime },
                        headers: {
                            'Authorization': `Bearer ${authTokens.JEEP}`,
                            'Accept': 'application/json'
                        },
                        timeout: 30000
                    });
                    console.log('📊 Trip Summary Response (JEEP):', retryResponse.data);
                    return retryResponse.data;
                }
                throw error;
            }
        }, 'PRIMARY');
    },

    fetchDeviceLogs: async (vin) => {
        return withRetry(async () => {
            console.log('📋 Triggering Device Log Fetch for VIN:', vin);
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');

            const response = await axios.post(`${BASE_URL}/jeep/concurrentcommands/vinno`, {
                vin: vin,
                commandName: "DEVICE_LOGS",
                commandType: "Get"
            }, {
                headers: { 'Authorization': `Bearer ${authTokens.PRIMARY}` },
                timeout: 30000
            });
            console.log('📋 Device Logs Command Response:', response.data);
            return response.data;
        }, 'PRIMARY');
    },


    downloadLogFile: async (vin, filename) => {
        return withRetry(async () => {
            console.log('📥 Downloading Log File:', filename, 'for VIN:', vin);
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');

            const response = await axios.get(`${BASE_URL}/fileupload/download`, {
                params: { vin, filename },
                headers: {
                    'Authorization': `Bearer ${authTokens.PRIMARY}`,
                    'Accept': '*/*'
                },
                timeout: 60000,
                responseType: 'blob' // For file downloads
            });
            console.log('📥 Download File Response:', response.headers);
            return response.data;
        }, 'PRIMARY');
    },

    getVehicleStatus: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/vehicleStatus/${vin}`, {
                headers: {
                    'Authorization': `Bearer ${authTokens.JEEP}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }, 'JEEP');
    }
};
