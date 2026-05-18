import axios from 'axios';

const BASE_URL = '/api/traxo';
const PLATFORM_BASE_URL = '/api/platform'; // For lb2 endpoints
const JEEP_BASE_URL = '/api/jeep'; // For trip and JEEP-specific APIs
const FOTA_FCA_BASE_URL = '/api/fota-fca'; // For new FOTA download & lb1 endpoints
const FOTA_LB1_BASE_URL = '/api/fota-lb1-fca'; // For LB1 endpoints
const AWS_BASE_URL = '/api/aws/jeep';
console.warn("TraxoApi Loaded - MultiAccount Version - If you do not see this, restart the server");

const ACCOUNTS = {
    PRIMARY: {
        userName: "admin",
        password: "admin",
        accountId: "primary",
        clientId: "doFBMiLMdcqaSYxbo_68NmmHgkYa",
        clientSecret: "JmMwN6yEZb3jbtSWMq2hwEOCjP8a"
    },
    JEEP_PRIMARY: {
        userName: "admin",
        password: "admin",
        accountId: "primary",
        clientId: "9iUsFkqpnxgu_AIrNG2dcgN4MoAa",
        clientSecret: "ytRzDFAWFMfvnhJwVIv6NacfLmAa"
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
        mobileNum: "9629457592",
        password: "Password@123"
    },
    FOTA: {
        userName: "admin",
        password: "V6PS0EWwF5V&",
        accountId: "fotatenant",
        clientId: "AhCJBKe9xP94qT22KYsHHy5yYqka",
        clientSecret: "b3cnLRonvsEMYQQKzFdTXNywYQUa"
    },
    FOTA_UPLOAD: {
        userName: "admin",
        password: "V6PS0EWwF5V&",
        accountId: "fotatenant",
        clientId: "1cwEgOCf1By1V8Qs_MjKVxcRCfka",
        clientSecret: "xrl3FGuoyfrq8_j8E0HL2GKHL8Aa"
    },
    BULK: {
        userName: "admin",
        password: "admin",
        accountId: "primary",
        clientId: "9iUsFkqpnxgu_AIrNG2dcgN4MoAa",
        clientSecret: "ytRzDFAWFMfvnhJwVIv6NacfLmAa"
    },
    PKI: {
        userName: "admin",
        password: "0[%62&Db$Z:J",
        accountId: "pkijeeptenant",
        clientId: "UGTtoib0yvQ8vnfv3CoXLahqfAMa",
        clientSecret: "NqxJBwd236LrlXuVPb4afQBIRfka"
    },
    RUN: {
        userName: "admin",
        password: "V6PS0EWwF5V&",
        accountId: "runmanagementtenant",
        clientId: "Y1sfx4ViAPPre1JX0J1VMQPiX8Ua",
        clientSecret: "YFTYLtflmEPEuJvtLJfeU9kftDsa"
    }
};

const authTokens = {
    PRIMARY: null,
    JEEP_PRIMARY: null,
    FACTORY: null,
    JEEP: null,
    FOTA: null,
    FOTA_UPLOAD: null,
    BULK: null,
    PKI: null,
    RUN: null
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
 * Utility to extract and flatten states from various API response formats
 * Handles { states: [...] }, { data: { states: [...] } }, and { events: [...] }
 * Also normalizes field names like signalName/signalname
 */
const flattenStates = (data) => {
    if (!data) return [];
    let records = [];
    
    // 1. Unwrap nested arrays
    if (Array.isArray(data)) records = data;
    else if (data.states && Array.isArray(data.states)) records = data.states;
    else if (data.events && Array.isArray(data.events)) records = data.events;
    else if (data.data && data.data.states && Array.isArray(data.data.states)) records = data.data.states;
    else if (data.data && Array.isArray(data.data)) records = data.data;

    // 2. Flatten and Normalize
    return records.map(record => {
        let flat = { ...record };
        
        // Handle individual record nesting (common in some 5.0 states)
        if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
            flat = { ...flat, ...record.data };
        }
        if (record.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)) {
            flat = { ...flat, ...record.payload };
        }

        // Handle Signal Name/Value (Jeep /states endpoint)
        if ((record.signalname || record.signalName) && (record.signalvalue !== undefined || record.signalValue !== undefined)) {
            const name = record.signalname || record.signalName;
            const val = record.signalvalue !== undefined ? record.signalvalue : record.signalValue;
            flat[name] = val;
        }

        // Normalize timestamp discovery (expanded for 5.0)
        const ts = record.timestamp || 
                   record.sourcetimestamp || 
                   record.updatetimestamp || 
                   record.updatedtimestamp || 
                   record.updatedTimeStamp ||
                   record.eventtime || 
                   record.eventTime ||
                   record.eventTimeStamp ||
                   record.currentTime ||
                   record.sourcetimestamp_val;
        if (ts) flat.timestamp = ts;
        
        return flat;
    });
};

export const TraxoApi = {
    login: async (accountType = 'PRIMARY') => {
        const credentials = ACCOUNTS[accountType];
        try {
            let url;
            if (accountType === 'JEEP') {
                url = `${JEEP_BASE_URL}/users/login`;
            } else if (['PRIMARY', 'RUN', 'FACTORY'].includes(accountType)) {
                url = `${PLATFORM_BASE_URL}/authentication/login`;
            } else {
                // BULK, PKI, FOTA_UPLOAD, JEEP_PRIMARY
                url = `${BASE_URL}/authentication/login`;
            }

            const response = await axios.post(url, credentials, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            // Some servers return HTTP 200 but include an error in the body (e.g. "Password attempts exceeded").
            // Detect this and treat it as a login failure so we don't loop with an undefined token.
            if (response.data && response.data.statusCode && response.data.statusCode >= 400) {
                const msg = response.data.message || `Login rejected by server (statusCode: ${response.data.statusCode})`;
                console.error(`Traxo Login Body Error [${accountType}]:`, response.data);
                throw new Error(msg);
            }

            if (accountType === 'JEEP') {
                // JEEP server may return token as a plain string or nested object
                authTokens[accountType] = response.data.token?.accessToken
                    || response.data.access_token
                    || response.data.accessToken
                    || (typeof response.data.token === 'string' ? response.data.token : null);
                if (!authTokens[accountType]) {
                    console.error("JEEP Login response missing token:", response.data);
                    throw new Error('JEEP login succeeded but no token found in response');
                }
            } else {
                authTokens[accountType] = response.data.access_token || response.data.token?.accessToken || response.data.accessToken;
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

            const response = await axios.get(`${BASE_URL}/jeep/events/${vin}/DEVICE`, {
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

    // Specific audit endpoint for Jeep Events
    getJeepEventsAudit: async (vin, starttime, endtime, limit = 500) => {
        return withRetry(async () => {
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');
            const response = await axios.get(`${BASE_URL}/jeep/events/${vin}/DEVICE/`, {
                params: { limit, starttime, endtime },
                headers: {
                    'Authorization': `Bearer ${authTokens.PRIMARY}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            const events = flattenStates(response.data);
            return {
                events: events,
                raw: response.data
            };
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

            const response = await axios.get(`${BASE_URL}/jeep/events/${vin}/DEVICE`, {
                params,
                headers: {
                    'Authorization': `Bearer ${authTokens.PRIMARY}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return flattenStates(response.data);
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
                const response = await axios.get(`${PLATFORM_BASE_URL}/jeep/devices/vin/${vin}/states`, {
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

    /**
     * Fetch structured location/telemetry history over a time range
     * Default subcategory: LocationTelemetry
     */
    getHistoricalTelemetry: async (vin, starttime, endtime, limit = 1000, subcategory = 'LocationTelemetry') => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');
            const response = await axios.get(`${PLATFORM_BASE_URL}/jeep/devices/vin/${vin}/states`, {
                params: {
                    subcategory,
                    starttime,
                    endtime,
                    startTime: starttime,
                    endTime: endtime,
                    limit
                },
                headers: {
                    'Authorization': `Bearer ${authTokens.FACTORY}`,
                    'Accept': 'application/json'
                },
                timeout: 60000
            });
            return flattenStates(response.data);
        }, 'FACTORY');
    },

    /**
     * Fetch trip-specific states from the v2 trip endpoint (Uses JEEP auth)
     * Commonly used for tripCurrent, tripStart, tripEnd
     */
    getTripStates: async (vin, starttime, endtime, limit = 500, subcategory = 'tripCurrent') => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/trip/v2/vin/${vin}/states`, {
                params: {
                    subcategory,
                    starttime,
                    endtime,
                    startTime: starttime,
                    endTime: endtime,
                    limit
                },
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json'
                },
                timeout: 60000
            });
            return flattenStates(response.data);
        }, 'JEEP');
    },

    // Get raw location telemetry array for console view
    getLocationTelemetryArray: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');

            try {
                const response = await axios.get(`${PLATFORM_BASE_URL}/jeep/devices/vin/${vin}/states`, {
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
            try {
                const response = await axios.get(`${PLATFORM_BASE_URL}/jeep/alerts/${vin}/`, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.PRIMARY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                console.log('🚨 Alerts Response:', response.data);
                return response.data;
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    console.warn(`🚨 No alerts found for VIN ${vin} (400 Bad Request)`);
                    return [];
                }
                throw error;
            }
        }, 'PRIMARY');
    },

    markNotificationAsRead: async (notificationId) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.put(`${JEEP_BASE_URL}/notification/${notificationId}`, {}, {
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            console.log('✅ Notification Marked Read:', notificationId);
            return response.data;
        }, 'JEEP');
    },

    deleteNotification: async (notificationId) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.delete(`${JEEP_BASE_URL}/notification/${notificationId}`, {
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            console.log('🗑️ Notification Deleted:', notificationId);
            return response.data;
        }, 'JEEP');
    },

    getCommandHistory: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/commands/audit/${vin}`, {
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            console.log('🔍 Command Audit History:', response.data);
            return response.data;
        }, 'JEEP');
    },

    getAlertIngestion: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');
            try {
                const response = await axios.get(`${PLATFORM_BASE_URL}/jeep/alerts/${vin}/`, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.PRIMARY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                console.log('🚨 Alert Ingestion Audit:', response.data);
                return response.data;
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    console.warn(`🚨 No ingestion alerts found for VIN ${vin} (400 Bad Request)`);
                    return [];
                }
                throw error;
            }
        }, 'PRIMARY');
    },



    getDevices: async () => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');
            const response = await axios.get(`${PLATFORM_BASE_URL}/devices`, {
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
                const response = await axios.get(`${PLATFORM_BASE_URL}/portal/vin/${vin}`, {
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
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }, 'JEEP');
    },



    // Remote Commands - POST to /jeep/commands/vinno (JEEP auth)
    lockDoor: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/commands/vinno`,
            { deviceVinno: vin, actionType: "remotedoorlockcommand" },
            { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    unlockDoor: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/commands/vinno`,
            { deviceVinno: vin, actionType: "remotedoorunlockcommand" },
            { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    blinkerOn: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/commands/vinno`,
            { deviceVinno: vin, actionType: "remoteblinkeroncommand" },
            { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    blinkerOff: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/commands/vinno`,
            { deviceVinno: vin, actionType: "remoteblinkeroffcommand" },
            { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    honk: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/commands/vinno`,
            { deviceVinno: vin, actionType: "remotehonkcommand" },
            { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    setSpeedAlert: async (vin, speed) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/commands/vinno`,
            { deviceVinno: vin, actionType: "speedalertcommand", command: { speed: String(speed) } },
            { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    getCommandStatus: async (vin, commandId) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.get(`${JEEP_BASE_URL}/commands/device/vin/${vin}/command/${commandId}`,
            { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 }
        )).data;
    }, 'JEEP'),

    getConcurrentCommandStatus: async (vin, commandId) => withRetry(async () => {
        if (!authTokens.RUN) await TraxoApi.login('RUN');
        return (await axios.get(`${BASE_URL}/jeep/concurrentcommands/device/vin/${vin}/command/${commandId}`,
            { headers: { 'Authorization': `Bearer ${authTokens.RUN}` }, timeout: 30000 }
        )).data;
    }, 'RUN'),

    getCommandAudit: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        // Collection URL: https://cvipapi-preprod.fca-india.com/jeep/commands/audit/{vin}
        const response = await axios.get(`${JEEP_BASE_URL}/commands/audit/${vin}`, {
            headers: { 'Authorization': `${authTokens.JEEP}` },
            timeout: 30000
        });
        return response.data;
    }, 'JEEP'),

    resetFotaState: async (vin, commandName = "firmwaredownloadcommand") => withRetry(async () => {
        if (!authTokens.FOTA) await TraxoApi.login('FOTA');
        return (await axios.put(`${FOTA_FCA_BASE_URL}/jeep/ota/resetfotastate`, null, {
            params: { vinNo: vin, commandName: commandName },
            headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
            timeout: 30000
        })).data;
    }, 'FOTA'),

    downloadFirmwareFile: async (filename, releaseVersion, fileType, category, fotaId) => withRetry(async () => {
        if (!authTokens.FOTA) await TraxoApi.login('FOTA');
        try {
            const response = await axios.get(`${FOTA_FCA_BASE_URL}/jeep/files/device/downloadfirmware`, {
                params: { 
                    filename, 
                    fileName: filename,
                    releaseversion: releaseVersion, 
                    releaseVersion: releaseVersion,
                    filetype: fileType, 
                    fileType: fileType,
                    category, 
                    fotaid: fotaId,
                    fotaId: fotaId
                },
                headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
                responseType: 'blob',
                timeout: 120000
            });
            return response.data;
        } catch (err) {
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.message || json.error || text);
                } catch (e) {
                    throw new Error(text || err.message);
                }
            }
            throw err;
        }
    }, 'FOTA'),

    downloadFirmwareFromRepo: async (category, releaseVersion, fotaIdOverride = null) => {
        return withRetry(async () => {
            if (!authTokens.FOTA_UPLOAD) await TraxoApi.login('FOTA_UPLOAD');

            let inventory = null;
            let resolvedVersion = releaseVersion;

            // --- Step 1: Always fetch file metadata from versions API ---
            // We need file details (filenames, filetypes) even if fotaId is provided externally
            let versionsToTry = [releaseVersion];
            // If version has .0, also try the bare integer (e.g., 8317.0 → 8317)
            if (String(releaseVersion).endsWith('.0')) {
                versionsToTry.push(String(releaseVersion).split('.')[0]);
            }
            // If bare integer, also try the .0 variant
            if (!String(releaseVersion).includes('.')) {
                versionsToTry.push(`${releaseVersion}.0`);
            }

            for (const v of versionsToTry) {
                console.log(`🔍 Checking firmware repository for version: ${v}...`);
                try {
                    const tempInventory = await TraxoApi.checkUploadedFirmware(v);

                    // Unwrap all known response envelope formats
                    let rawData = Array.isArray(tempInventory) ? tempInventory[0] : tempInventory;
                    if (rawData?.data) rawData = rawData.data;

                    console.log(`📋 Raw versions API response for ${v}:`, JSON.stringify(rawData, null, 2));

                    const details = rawData?.batches?.fileDetails
                        || rawData?.fileDetails
                        || rawData?.batches?.files
                        || rawData?.files
                        || [];

                    if (details.length > 0) {
                        inventory = rawData;
                        resolvedVersion = v;
                        break;
                    }
                } catch (e) {
                    console.warn(`⚠️ Version ${v} query failed:`, e.message);
                }
            }

            if (!inventory) {
                throw new Error(
                    `No firmware files found in repository for version ${releaseVersion}. ` +
                    `Tried variants: ${versionsToTry.join(', ')}. ` +
                    `Please verify the firmware was uploaded successfully.`
                );
            }

            // --- Step 2: Resolve fotaId ---
            // Priority: (1) UI-provided override → (2) auto-extracted from API response
            let fotaId = fotaIdOverride || null;

            if (!fotaId) {
                // Exhaustively check every possible field name and nesting
                fotaId = inventory?.fotaid
                    || inventory?.fotaId
                    || inventory?.fotaRequestId
                    || inventory?.requestId
                    || inventory?.id
                    || inventory?.fotaID
                    || inventory?.fota_id
                    || inventory?.fota_request_id
                    || inventory?.batches?.fotaid
                    || inventory?.batches?.fotaId
                    || inventory?.batches?.id
                    || inventory?.data?.fotaid
                    || inventory?.data?.fotaId
                    || inventory?.data?.id
                    || '';
            }

            if (!fotaId) {
                // Log the FULL raw response so the dev can find the real field name
                console.error(
                    '❌ fotaId NOT found in versions API response.\n' +
                    'Full inventory object (copy from console to find the correct field):',
                    JSON.stringify(inventory, null, 2)
                );
                throw new Error(
                    `fotaid not found automatically for version ${resolvedVersion}.\n` +
                    `Please copy the fotaid from the FOTA Repository API response (check browser console for full JSON) ` +
                    `and paste it into the 'fotaId' field, then use 'Download to Laptop' again.`
                );
            }

            const targetCategory = (category || inventory?.category || 'BATCH').toUpperCase();
            const details = inventory?.batches?.fileDetails
                || inventory?.fileDetails
                || inventory?.batches?.files
                || inventory?.files
                || [];

            console.log(`📦 Download metadata → version: ${resolvedVersion}, fotaId: ${fotaId}, category: ${targetCategory}, files: ${details.length}`);

            // --- Step 3: Download all files using the FOTA download account ---
            if (!authTokens.FOTA) await TraxoApi.login('FOTA');

            for (const fileItem of details) {
                const normalizedFileType = (fileItem.fileType || fileItem.filetype || '').toLowerCase();
                const fileName = fileItem.fileName || fileItem.filename || fileItem.name;

                console.log(`📥 Downloading: ${fileName} (type: ${normalizedFileType})`);

                try {
                    const response = await axios.get(`${FOTA_FCA_BASE_URL}/jeep/files/device/downloadfirmware`, {
                        params: {
                            filename: fileName,
                            fileName: fileName,
                            releaseversion: resolvedVersion,
                            releaseVersion: resolvedVersion,
                            filetype: normalizedFileType,
                            fileType: normalizedFileType,
                            category: targetCategory,
                            fotaid: fotaId,
                            fotaId: fotaId
                        },
                        headers: {
                            'Authorization': `Bearer ${authTokens.FOTA}`,
                            'Accept': 'application/octet-stream, application/zip, */*'
                        },
                        responseType: 'blob',
                        timeout: 120000
                    });

                    const blob = response.data;
                    const url = window.URL.createObjectURL(new Blob([blob]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    console.log(`✅ Downloaded: ${fileName}`);
                } catch (err) {
                    let errMsg = err.message;
                    if (err.response?.data instanceof Blob) {
                        const text = await err.response.data.text();
                        try {
                            const json = JSON.parse(text);
                            errMsg = json.message || json.error || text;
                        } catch (e) {
                            errMsg = text || err.message;
                        }
                    } else if (err.response?.data?.message) {
                        errMsg = err.response.data.message;
                    }
                    
                    console.error(`❌ Failed to download ${fileName}:`, err.response?.status, errMsg);
                    throw new Error(`Download failed for ${fileName} (${normalizedFileType}): ${errMsg}`);
                }
            }

            return { success: true, message: `Successfully downloaded ${details.length} file(s) for version ${resolvedVersion}`, fotaId };
        }, 'FOTA_UPLOAD');
    },


    // ========== TRIP AND LOGS APIs ==========
    getTripSummary: async (vin, starttime, endtime) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/trip/${vin}/summary`, {
                params: { starttime, endtime },
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('📊 Trip Summary Response (JEEP):', response.data);
            return response.data;
        }, 'JEEP');
    },

    getTripDetailsPaginated: async (vin, pageNo = 0) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/trip/${vin}/details`, {
                params: { pageNo },
                headers: { 'Authorization': `${authTokens.JEEP}` },
                timeout: 30000
            });
            return response.data;
        }, 'JEEP');
    },

    getTripById: async (vin, tripId) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/trip/${vin}/tripId/${tripId}`, {
                headers: { 'Authorization': `${authTokens.JEEP}` },
                timeout: 30000
            });
            return response.data;
        }, 'JEEP');
    },

    getTripAudit: async (vin, subcategory = 'tripCurrent') => {
        return withRetry(async () => {
            // Trip Audit endpoint uses JEEP_PRIMARY token (BQESzZvwPTCY5v7uekXU_h8EEXka)
            // Postman: POST /authentication/login accountId=primary → GET /jeep/trip/v2/vin/{vin}/states
            if (!authTokens.JEEP_PRIMARY) await TraxoApi.login('JEEP_PRIMARY');
            const response = await axios.get(`${BASE_URL}/jeep/trip/v2/vin/${vin}/states`, {
                params: { subcategory },
                headers: { 'Authorization': `Bearer ${authTokens.JEEP_PRIMARY}` },
                timeout: 30000
            });
            return flattenStates(response.data);
        }, 'JEEP_PRIMARY');
    },

    // ========== BULK PROVISIONING APIs ==========
    bulkImeiUpload: async (file) => {
        return withRetry(async () => {
            if (!authTokens.BULK) await TraxoApi.login('BULK');
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post(`${BASE_URL}/jeep/bulkprovision/imei`, formData, {
                headers: {
                    'Authorization': `Bearer ${authTokens.BULK}`,
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000
            });
            console.log('📦 Bulk IMEI Upload Response:', response.data);
            return response.data;
        }, 'BULK');
    },

    bulkSupplierFeed: async (file) => {
        return withRetry(async () => {
            if (!authTokens.BULK) await TraxoApi.login('BULK');
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post(`${BASE_URL}/jeep/bulkprovision/dongle`, formData, {
                headers: {
                    'Authorization': `Bearer ${authTokens.BULK}`,
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000
            });
            console.log('📦 Bulk Supplier Feed Response:', response.data);
            return response.data;
        }, 'BULK');
    },

    // ========== PKI CERTIFICATE APIs ==========
    createCommonCertificate: async (commonName, csr) => {
        return withRetry(async () => {
            if (!authTokens.PKI) await TraxoApi.login('PKI');
            const payload = {
                commonName,
                timeStamp: Math.floor(Date.now() / 1000),
                csr
            };
            console.log('🔐 [PKI_DEBUG] Creating Common Certificate:', { ...payload, csr: payload.csr?.substring(0, 32) + '...' });
            
            try {
                const response = await axios.post(`${BASE_URL}/csr/createCertificate`, payload, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.PKI}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });
                console.log('🔐 [PKI_DEBUG] Success:', response.data);
                return response.data;
            } catch (error) {
                console.error('🔐 [PKI_DEBUG] API Error:', error.response?.data || error.message);
                throw error;
            }
        }, 'PKI');
    },

    createTboxCertificate: async (commonName, csr) => {
        return withRetry(async () => {
            if (!authTokens.PKI) await TraxoApi.login('PKI');
            const payload = {
                commonName,
                timeStamp: Math.floor(Date.now() / 1000),
                csr
            };
            console.log('🔐 [PKI_DEBUG] Creating TBOX Certificate:', { ...payload, csr: payload.csr?.substring(0, 32) + '...' });
            
            try {
                // Using BASE_URL (cvipiot-preprod) as per Jeep 5.0 Collection
                const response = await axios.post(`${BASE_URL}/csr/createCertificate`, payload, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.PKI}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });
                console.log('🔐 [PKI_DEBUG] Success:', response.data);
                return response.data;
            } catch (error) {
                const errorData = error.response?.data;
                console.error('🔐 [PKI_DEBUG] API Error:', errorData || error.message);
                // If the error data contains a specific message, wrap it in the error
                if (errorData) {
                    const msg = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
                    throw new Error(`${error.message}: ${msg}`);
                }
                throw error;
            }
        }, 'PKI');
    },

    // ========== DEVICE STATE UPDATE API ==========
    updateTboxState: async (vin, status = 'CUSTOMER') => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const payload = {
                deviceVinno: vin,
                actionType: 'tboxstateupdate',
                command: { status }
            };
            console.log('🔄 [RUN_DEBUG] Updating TBOX State:', payload);
            
            try {
                const response = await axios.post(`${BASE_URL}/concurrentcommands/vinno`, payload, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.RUN}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });
                console.log('🔄 [RUN_DEBUG] Success:', response.data);
                return response.data;
            } catch (error) {
                const errorData = error.response?.data;
                console.error('🔄 [RUN_DEBUG] API Error:', errorData || error.message);
                if (errorData) {
                    const msg = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
                    throw new Error(`${error.message}: ${msg}`);
                }
                throw error;
            }
        }, 'RUN');
    },

    // Portal device state (alias for getDeviceState with RUN token context)
    getDeviceStateByVin: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            console.log('🔍 [RUN_DEBUG] Fetching Device State:', vin);
            try {
                const response = await axios.get(`${BASE_URL}/portal/vin/${vin}`, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.RUN}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });
                return response.data;
            } catch (error) {
                console.error('🔍 [RUN_DEBUG] Fetch Error:', error.response?.data || error.message);
                throw error;
            }
        }, 'RUN');
    },

    getPortalDeviceState: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${PLATFORM_BASE_URL}/portal/vin/${vin}`, {
                headers: {
                    'Authorization': `Bearer ${authTokens.RUN}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }, 'RUN');
    },

    // Trip pagination alias (pageIndex maps to pageNo)
    getTripDetailsWithPagination: async (vin, pageIndex = 0) => {
        return TraxoApi.getTripDetailsPaginated(vin, pageIndex);
    },

    fetchDeviceLogs: async (vin) => {
        return withRetry(async () => {
            console.log('📥 Triggering Device Log Fetch for VIN:', vin);
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            try {
                const response = await axios.post(`${BASE_URL}/jeep/concurrentcommands/vinno`, {
                    deviceVinno: vin,
                    actionType: "fetchlogs"
                }, {
                    headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                    timeout: 30000,
                    maxRedirects: 0,
                    validateStatus: function (status) {
                        return (status >= 200 && status < 300) || status === 303;
                    }
                });
                console.log('📥 Device Logs Command Response:', response.data);
                return response.data || { success: true, message: "Logs triggered successfully" };
            } catch (error) {
                console.error("Device Logs trigger error:", error);
                throw error;
            }
        }, 'RUN');
    },


    downloadLogFile: async (vin, filename) => {
        return withRetry(async () => {
            console.log('📥 Downloading Log File:', filename, 'for VIN:', vin);
            if (!authTokens.RUN) await TraxoApi.login('RUN');

            const response = await axios.get(`${BASE_URL}/fileupload/download`, {
                params: { vin, filename },
                headers: {
                    'Authorization': `Bearer ${authTokens.RUN}`,
                    'Accept': '*/*'
                },
                timeout: 60000,
                responseType: 'blob' // For file downloads
            });
            console.log('📥 Download File Response:', response.headers);
            return response.data;
        }, 'RUN');
    },

    listLogFiles: async (vin) => {
        return withRetry(async () => {
            console.log('📥 Listing Log Files for VIN:', vin);
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${BASE_URL}/fileupload`, {
                params: { vin },
                headers: {
                    'Authorization': `Bearer ${authTokens.RUN}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('📥 Log Files List Response:', response.data);
            return response.data;
        }, 'RUN');
    },

    deleteLogFile: async (vin, filename) => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.delete(`${BASE_URL}/fileupload`, {
                params: { vin, filename },
                headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                timeout: 30000
            });
            return response.data;
        }, 'RUN');
    },

    listAvailableLogs: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${BASE_URL}/fileupload`, {
                params: { vin },
                headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                timeout: 30000
            });
            return response.data;
        }, 'RUN');
    },

    getVehicleStatus: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            console.log(`🚗 [VehicleStatus] Fetching for VIN: ${vin}`);
            const response = await axios.get(`${JEEP_BASE_URL}/vehicleStatus/${vin}`, {
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            const data = response.data;
            // Log ALL keys so we can see exact field names from the API
            console.log(`🚗 [VehicleStatus] RAW RESPONSE KEYS:`, Object.keys(data || {}));
            console.log(`🚗 [VehicleStatus] FULL DATA:`, JSON.stringify(data, null, 2));
            return data;
        }, 'JEEP');
    },

    resetDeviceStateAWS: async (vin) => {
        // This is a direct AWS call, no Traxo proxy
        try {
            const response = await axios.post(`${AWS_BASE_URL}/reset-device-state`, { vin }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            return response.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            console.error("AWS Reset State Error:", errorMsg);
            if (error.response?.data) {
                const msg = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
                throw new Error(`${error.message}: ${msg}`);
            }
            throw error;
        }
    },

    portalSearch: async (pattern, key = 'vin') => withRetry(async () => {
        if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');
        return (await axios.get(`${PLATFORM_BASE_URL}/portal/search`, {
            params: { searchPattern: pattern, searchKey: key },
            headers: { 'Authorization': `Bearer ${authTokens.FACTORY}` },
            timeout: 30000
        })).data;
    }, 'FACTORY'),

    // ========== TELEMETRY DECODING APIs ==========
    getCanMessages: async (deviceType = 'jeep') => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${PLATFORM_BASE_URL}/jeep/can/decoder/messagelist/${deviceType}/vehicleTelemetry`, {
                headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                timeout: 30000
            });
            return response.data;
        }, 'RUN');
    },

    getCanSignals: async (messageId = '356') => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${PLATFORM_BASE_URL}/jeep/can/decoder/signallist/${messageId}`, {
                headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                timeout: 30000
            });
            return response.data;
        }, 'RUN');
    },

    getVehicleTelemetryData: async (vin, signalName = 'FuelLevel') => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            try {
                // Collection 4.0: /jeep/can/decoder/{vin}/vehicleTelemetry/signalname/{signalName}
                const response = await axios.get(`${PLATFORM_BASE_URL}/jeep/can/decoder/${vin}/vehicleTelemetry/signalname/${signalName}`, {
                    headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                    timeout: 30000
                });
                return response.data;
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    console.warn(`🚗 [getVehicleTelemetryData] 400 Bad Request for signal ${signalName} on VIN ${vin}`);
                    return [];
                }
                throw error;
            }
        }, 'RUN');
    },

    // ========== FOTA COMMAND STATUS (4.0) ==========
    getFotaCommandValidity: async (vin, commandId) => {
        return withRetry(async () => {
            if (!authTokens.FOTA) await TraxoApi.login('FOTA');
            const response = await axios.get(`${FOTA_FCA_BASE_URL}/jeep/ota/commandvalidity`, {
                params: { commandid: commandId, username: ACCOUNTS.FOTA.userName },
                headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA');
    },

    // ========== FOTA UPLOAD & FIRMWARE MANAGEMENT APIs ==========
    uploadFirmware: async (fileDetails, files) => {
        return withRetry(async () => {
            if (!authTokens.FOTA_UPLOAD) await TraxoApi.login('FOTA_UPLOAD');
            const formData = new FormData();
            formData.append('fileDetails', JSON.stringify(fileDetails));
            if (Array.isArray(files)) {
                files.forEach(f => formData.append('files', f));
            } else {
                formData.append('files', files);
            }
            const response = await axios.post(`${FOTA_FCA_BASE_URL}/jeep/fota/firmware`, formData, {
                headers: {
                    'Authorization': `Bearer ${authTokens.FOTA_UPLOAD}`,
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000
            });
            return response.data;
        }, 'FOTA_UPLOAD');
    },

    checkUploadedFirmware: async (firmwareVersion) => {
        return withRetry(async () => {
            if (!authTokens.FOTA_UPLOAD) await TraxoApi.login('FOTA_UPLOAD');
            const response = await axios.get(`${FOTA_FCA_BASE_URL}/jeep/fota/firmware/versions`, {
                params: { firmwareVersion },
                headers: { 'Authorization': `Bearer ${authTokens.FOTA_UPLOAD}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA_UPLOAD');
    },

    deleteFirmware: async (category, releaseVersion) => {
        return withRetry(async () => {
            if (!authTokens.FOTA_UPLOAD) await TraxoApi.login('FOTA_UPLOAD');
            const response = await axios.delete(`${FOTA_FCA_BASE_URL}/jeep/fota/firmware`, {
                params: { category, releaseVersion },
                headers: { 'Authorization': `Bearer ${authTokens.FOTA_UPLOAD}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA_UPLOAD');
    },

    // ========== DEVICE JOIN / NOTIFICATION STATUS API ==========
    getDeviceJoinStatus: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/notification/vin/${vin}`, {
                headers: { 'Authorization': `${authTokens.JEEP}` },
                timeout: 30000
            });
            const raw = response.data;
            const connectionStatus = (raw?.deviceJoinStatus || raw?.connectionStatus || raw?.deviceStatus || '').toString().toUpperCase();
            const tamperStatus = (raw?.tamperStatus || raw?.dismantleStatus || '').toString().toUpperCase();
            const isDeviceRemoved = connectionStatus === 'DISCONNECTED' || connectionStatus === 'REMOVED' || tamperStatus === 'TAMPERED';
            return { isDeviceRemoved, connectionStatus, tamperStatus, raw };
        }, 'JEEP');
    },

    getFotaState: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.FOTA) await TraxoApi.login('FOTA');
            const response = await axios.get(`${FOTA_FCA_BASE_URL}/jeep/ota/fotastate`, {
                params: { vinNo: vin },
                headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA');
    },

    // ========== FOTA VIN OPERATIONS (JEEP 4.0) ==========

    triggerFotaDownload: async (vin, releaseVersion) => {
        return withRetry(async () => {
            if (!authTokens.FOTA) await TraxoApi.login('FOTA');
            const response = await axios.post(`${FOTA_FCA_BASE_URL}/jeep/ota/downloadfirmware`, {
                category: "VIN",
                devices: [{ vin, releaseVersion }]
            }, {
                headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA');
    },

    triggerFotaExecution: async (vin, releaseVersion) => {
        return withRetry(async () => {
            if (!authTokens.FOTA) await TraxoApi.login('FOTA');
            const response = await axios.post(`${FOTA_FCA_BASE_URL}/jeep/ota/executefirmware`, {
                category: "VIN",
                devices: [{ vin, releaseVersion }]
            }, {
                headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA');
    },

    getFotaCommandStatus: async (vin, commandId) => {
        return withRetry(async () => {
            if (!authTokens.JEEP_PRIMARY) await TraxoApi.login('JEEP_PRIMARY');
            const response = await axios.get(`${JEEP_BASE_URL}/commands/device/vin/${vin}/command/${commandId}`, {
                headers: { 'Authorization': `Bearer ${authTokens.JEEP_PRIMARY}` },
                timeout: 30000
            });
            return response.data;
        }, 'JEEP_PRIMARY');
    },

    getFotaCommandValidity: async (commandId, username) => {
        return withRetry(async () => {
            if (!authTokens.FOTA) await TraxoApi.login('FOTA');
            const response = await axios.get(`${FOTA_FCA_BASE_URL}/jeep/ota/commandvalidity`, {
                params: { commandid: commandId, username },
                headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA');
    },

    resetFotaState: async (vin, commandName = 'firmwaredownloadcommand') => {
        return withRetry(async () => {
            if (!authTokens.FOTA) await TraxoApi.login('FOTA');
            const response = await axios.put(`${FOTA_FCA_BASE_URL}/jeep/ota/resetfotastate`, null, {
                params: { vinNo: vin, commandName },
                headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA');
    },

    updateNotificationStatus: async (notificationId) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.put(`${JEEP_BASE_URL}/notification/${notificationId}`, {}, {
            headers: { 'Authorization': `${authTokens.JEEP}` },
            timeout: 30000
        })).data;
    }, 'JEEP'),

    logout: async () => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        const response = await axios.post(`${JEEP_BASE_URL}/users/logout`, {}, {
            headers: { 'Authorization': `${authTokens.JEEP}` },
            timeout: 30000
        });
        authTokens.JEEP = null;
        return response.data;
    }, 'JEEP'),

    simulateLogUpload: async (vin, file) => withRetry(async () => {
        if (!authTokens.RUN) await TraxoApi.login('RUN');
        const formData = new FormData();
        formData.append('vin', vin);
        formData.append('file', file);
        return (await axios.post(`${BASE_URL}/tboxfileupload`, formData, {
            headers: { 'Authorization': `Bearer ${authTokens.RUN}`, 'Content-Type': 'multipart/form-data' },
            timeout: 60000
        })).data;
    }, 'RUN'),

    remoteBlinkerControl: async (vin, action = 'ON') => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        const actionType = action === 'ON' ? 'remoteblinkeroncommand' : 'remoteblinkeroffcommand';
        return (await axios.post(`${JEEP_BASE_URL}/commands/vinno`, {
            deviceVinno: vin,
            actionType: actionType
        }, { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 })).data;
    }, 'JEEP'),

    remoteHonk: async (vin) => withRetry(async () => {
        if (!authTokens.JEEP) await TraxoApi.login('JEEP');
        return (await axios.post(`${JEEP_BASE_URL}/commands/vinno`, {
            deviceVinno: vin,
            actionType: 'remotehonkcommand'
        }, { headers: { 'Authorization': `${authTokens.JEEP}` }, timeout: 30000 })).data;
    }, 'JEEP'),

    calculateSHA256: async (file) => {
        if (!file) return null;
        try {
            const arrayBuffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Checksum calculation failed:', error);
            throw error;
        }
    },

    resetDeviceStateAWS: async (vin) => {
        try {
            const response = await axios.post(`${AWS_BASE_URL}/jeep/reset-device-state`, { vin }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            return response.data;
        } catch (error) {
            console.error('AWS Reset Error:', error.response?.data || error.message);
            throw error;
        }
    }
};
