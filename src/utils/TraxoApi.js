import axios from 'axios';

const BASE_URL = '/api/traxo';
const JEEP_BASE_URL = '/api/jeep'; // For trip and JEEP-specific APIs
const AWS_BASE_URL = 'https://gp98o9kt3c.execute-api.ap-south-1.amazonaws.com/jeep';
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
        clientId: "BQESzZvwPTCY5v7uekXU_h8EEXka",
        clientSecret: "XhwlaKfa4dk9zCFjpGZuHzmYluka"
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
    },
    BULK: {
        userName: "admin",
        password: "admin",
        accountId: "primary",
        clientId: "BQESzZvwPTCY5v7uekXU_h8EEXka",
        clientSecret: "XhwlaKfa4dk9zCFjpGZuHzmYluka"
    },
    PKI: {
        userName: "admin",
        password: "0[%62&Db$Z:J",
        accountId: "pkijeeptenant",
        clientId: "oWXMoTG9yKyaTjZjuFin8kJmPXUa",
        clientSecret: "XF3Cdm5NlkJr0NVRQ0vOZWkqmxEa"
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
                authTokens[accountType] = response.data.token?.accessToken || response.data.access_token || response.data.accessToken;
                if (!authTokens[accountType]) {
                    console.error("JEEP Login response missing token.accessToken:", response.data);
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

            const response = await axios.get(`${BASE_URL}/jeep/events/${vin}/DEVICE/`, {
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

            const response = await axios.get(`${BASE_URL}/jeep/events/${vin}/DEVICE/`, {
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
                const response = await axios.get(`${BASE_URL}/jeep/devices/vin/${vin}/states`, {
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
                const response = await axios.get(`${BASE_URL}/jeep/devices/vin/${vin}/states`, {
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
                const response = await axios.get(`${BASE_URL}/alerts/${vin}/`, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.PRIMARY}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
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
                const response = await axios.get(`${BASE_URL}/alerts/${vin}/`, {
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

    getFotaCommandStatus: async (commandId) => withRetry(async () => {
        if (!authTokens.FOTA) await TraxoApi.login('FOTA');
        // Postman URL: https://lb1.cvip-preprod.citroen.in:40543/jeep/ota/commandvalidity?commandid=...&username=admin
        const response = await axios.get(`${BASE_URL}/jeep/ota/commandvalidity`, {
            params: { commandid: commandId, username: "admin" },
            headers: { 'Authorization': `Bearer ${authTokens.FOTA}` },
            timeout: 30000
        });
        return response.data;
    }, 'FOTA'),

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

    getVehicleStatus: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');
            console.log(`🚗 [VehicleStatus] Fetching device state for VIN: ${vin}`);
            const response = await axios.get(`${BASE_URL}/portal/vin/${vin}`, {
                headers: {
                    'Authorization': `Bearer ${authTokens.FACTORY}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }, 'FACTORY');
    },




    // ========== MISSING APIs ADDED FROM 2.0 COLLECTION ==========

    // Trip: GET /jeep/trip/{vin}/details?pageNo={pageNo}
    getTripDetailsWithPagination: async (vin, pageNo = 0) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/trip/${vin}/details`, {
                params: { pageNo },
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('📊 Trip Details (paginated):', response.data);
            return response.data;
        }, 'JEEP');
    },

    // Trip: GET /jeep/trip/{vin}/tripId/{tripId}
    getTripDetailsByTripId: async (vin, tripId) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/trip/${vin}/tripId/${tripId}`, {
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('📊 Trip Details by TripId:', response.data);
            return response.data;
        }, 'JEEP');
    },

    // Telemetry: GET /jeep/can/decoder/messagelist/jeep/vehicleTelemetry
    getVehicleTelemetryMessageList: async () => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${BASE_URL}/jeep/can/decoder/messagelist/jeep/vehicleTelemetry`, {
                headers: {
                    'Authorization': `Bearer ${authTokens.RUN}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('📡 Vehicle Telemetry Message List:', response.data);
            return response.data;
        }, 'RUN');
    },

    // Telemetry: GET /jeep/can/decoder/{vin}/vehicleTelemetry/signalname/{signalName}
    getVehicleTelemetry: async (vin, signalName = 'VehicleSpeed') => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${BASE_URL}/jeep/can/decoder/${vin}/vehicleTelemetry/signalname/${signalName}`, {
                headers: {
                    'Authorization': `Bearer ${authTokens.RUN}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log(`📡 Vehicle Telemetry for VIN ${vin}, Signal ${signalName}:`, response.data);
            return response.data;
        }, 'RUN');
    },

    // Telemetry: GET /jeep/can/decoder/signallist/{deviceTypeId}
    getSignalList: async (deviceTypeId = '356') => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${BASE_URL}/jeep/can/decoder/signallist/${deviceTypeId}`, {
                headers: {
                    'Authorization': `Bearer ${authTokens.RUN}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('📡 Signal List:', response.data);
            return response.data;
        }, 'PRIMARY');
    },

    // Logs: GET /fileupload?vin={vin} - list available log files for a VIN
    listLogFiles: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${BASE_URL}/fileupload`, {
                params: { vin },
                headers: {
                    'Authorization': `Bearer ${authTokens.RUN}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('📋 Log Files List:', response.data);
            return response.data;
        }, 'RUN');
    },

    // Logs: DELETE /fileupload?vin={vin}&filename={filename}
    deleteLogFile: async (vin, filename) => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.delete(`${BASE_URL}/fileupload`, {
                params: { vin, filename },
                headers: {
                    'Authorization': `Bearer ${authTokens.RUN}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('🗑️ Log File Deleted:', filename);
            return response.data;
        }, 'RUN');
    },

    // Portal: GET /portal/search?searchPattern={pattern}&searchKey={key}
    portalSearch: async (searchPattern, searchKey = 'vin') => {
        return withRetry(async () => {
            if (!authTokens.FACTORY) await TraxoApi.login('FACTORY');
            const response = await axios.get(`${BASE_URL}/portal/search`, {
                params: { searchPattern, searchKey },
                headers: {
                    'Authorization': `Bearer ${authTokens.FACTORY}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('🔍 Portal Search Result:', response.data);
            return response.data;
        }, 'FACTORY');
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
            return response.data;
        }, 'BULK');
    },

    // ========== PKI APIs ==========
    createCommonCertificate: async (commonName, csr, timeStamp = Math.floor(Date.now() / 1000)) => {
        return withRetry(async () => {
            if (!authTokens.PKI) await TraxoApi.login('PKI');
            const response = await axios.post(`${BASE_URL}/csr/createCertificate`, {
                commonName,
                csr,
                timeStamp
            }, {
                headers: { 'Authorization': `Bearer ${authTokens.PKI}` },
                timeout: 30000
            });
            return response.data;
        }, 'PKI');
    },

    createTboxCertificate: async (commonName, csr, timeStamp = Math.floor(Date.now() / 1000)) => {
        return withRetry(async () => {
            if (!authTokens.PKI) await TraxoApi.login('PKI');
            const response = await axios.post(`${BASE_URL}/csr/createCertificate`, {
                commonName,
                csr,
                timeStamp
            }, {
                headers: { 'Authorization': `Bearer ${authTokens.PKI}` },
                timeout: 30000
            });
            return response.data;
        }, 'PKI');
    },

    // ========== DEVICE STATE UPDATE APIs ==========
    updateTboxState: async (vin, status = 'CUSTOMER') => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.post(`${BASE_URL}/jeep/concurrentcommands/vinno`, {
                deviceVinno: vin,
                actionType: "tboxstateupdate",
                command: { status }
            }, {
                headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                timeout: 30000
            });
            return response.data;
        }, 'RUN');
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
            console.error("AWS Reset State Error:", error.message);
            throw error;
        }
    },

    // ========== EVENTS & AUDIT APIs ==========
    getJeepEventsAudit: async (vin, startTime, endTime, limit = 500) => {
        return withRetry(async () => {
            if (!authTokens.PRIMARY) await TraxoApi.login('PRIMARY');
            const response = await axios.get(`${BASE_URL}/jeep/events/${vin}/DEVICE/`, {
                params: { starttime: startTime, endtime: endTime, limit },
                headers: { 'Authorization': `Bearer ${authTokens.PRIMARY}` },
                timeout: 30000
            });
            return response.data;
        }, 'PRIMARY');
    },

    getTripAudit: async (vin, subcategory = 'tripStart') => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            const response = await axios.get(`${JEEP_BASE_URL}/trip/v2/vin/${vin}/states`, {
                params: { subcategory },
                headers: { 'Authorization': `${authTokens.JEEP}` },
                timeout: 30000
            });
            return response.data;
        }, 'JEEP');
    },

    // ========== TELEMETRY METADATA APIs ==========
    getTelemetryMessageList: async () => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${BASE_URL}/jeep/can/decoder/messagelist/jeep/vehicleTelemetry`, {
                headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                timeout: 30000
            });
            return response.data;
        }, 'RUN');
    },

    getTelemetrySignalList: async (deviceTypeId = '356') => {
        return withRetry(async () => {
            if (!authTokens.RUN) await TraxoApi.login('RUN');
            const response = await axios.get(`${BASE_URL}/jeep/can/decoder/signallist/${deviceTypeId}`, {
                headers: { 'Authorization': `Bearer ${authTokens.RUN}` },
                timeout: 30000
            });
            return response.data;
        }, 'RUN');
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
            const response = await axios.post(`${BASE_URL}/jeep/fota/firmware`, formData, {
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
            const response = await axios.get(`${BASE_URL}/jeep/fota/firmware/versions`, {
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
            const response = await axios.delete(`${BASE_URL}/jeep/fota/firmware`, {
                params: { category, releaseVersion },
                headers: { 'Authorization': `Bearer ${authTokens.FOTA_UPLOAD}` },
                timeout: 30000
            });
            return response.data;
        }, 'FOTA_UPLOAD');
    },

    // ========== DEVICE JOIN / NOTIFICATION STATUS API ==========
    /**
     * Get real-time device join/notification status for a VIN.
     * Endpoint: GET /jeep/notification/vin/{vin}
     * Base URL: https://cvipapi-preprod.fca-india.com  (via /api/jeep proxy)
     * Auth: JEEP (mobile login token)
     *
     * Response fields of interest:
     *   - deviceJoinStatus / connectionStatus / deviceStatus: CONNECTED | DISCONNECTED | REMOVED
     *   - tamperStatus / dismantleStatus: SECURE | TAMPERED
     *
     * @returns {{ isDeviceRemoved: boolean, raw: object }}
     */
    getDeviceJoinStatus: async (vin) => {
        return withRetry(async () => {
            if (!authTokens.JEEP) await TraxoApi.login('JEEP');
            console.log(`📡 [DeviceJoinStatus] Fetching notification status for VIN: ${vin}`);
            const response = await axios.get(`${JEEP_BASE_URL}/notification/vin/${vin}`, {
                headers: {
                    'Authorization': `${authTokens.JEEP}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            console.log(`📡 [DeviceJoinStatus] Raw response for ${vin}:`, response.data);

            const raw = response.data;

            // Infer device-removed state from common response fields
            const connectionStatus = (
                raw?.deviceJoinStatus ||
                raw?.connectionStatus ||
                raw?.deviceStatus ||
                raw?.status ||
                ''
            ).toString().toUpperCase();

            const tamperStatus = (
                raw?.tamperStatus ||
                raw?.dismantleStatus ||
                ''
            ).toString().toUpperCase();

            const isDeviceRemoved =
                connectionStatus === 'DISCONNECTED' ||
                connectionStatus === 'REMOVED' ||
                tamperStatus === 'TAMPERED';

            console.log(`📡 [DeviceJoinStatus] VIN: ${vin} | connectionStatus: "${connectionStatus}" | tamperStatus: "${tamperStatus}" | isDeviceRemoved: ${isDeviceRemoved}`);

            return { isDeviceRemoved, connectionStatus, tamperStatus, raw };
        }, 'JEEP');
    },
};
