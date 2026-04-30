/**
 * Utility functions for processing vehicle event and telemetry data
 */

export const processHistoricalData = (data, initialState = {}) => {
    if (!data) return [];
    
    const rawRecords = Array.isArray(data) ? data : (data.events || data.data || []);
    
    /**
     * Helper to extract ANY found metrics from a record with case-insensitive lookup
     */
    const extractUpdates = (record) => {
        // Deep search helper to find fields in nested structures
        const deepUnwrap = (obj, depth = 0) => {
            if (!obj || depth > 3 || typeof obj !== 'object' || Array.isArray(obj)) return {};
            let merged = { ...obj };
            
            // Check common wrappers and merge them up
            const wrappers = ['eventdetails', 'payload', 'data', 'vehicleStatus', 'result', 'tripInProgressdata', 'signalValue'];
            for (const w of wrappers) {
                if (obj[w] && typeof obj[w] === 'object') {
                    merged = { ...merged, ...deepUnwrap(obj[w], depth + 1) };
                } else if (obj[w] && typeof obj[w] === 'string' && obj[w].startsWith('{')) {
                    try {
                        const parsed = JSON.parse(obj[w]);
                        merged = { ...merged, ...deepUnwrap(parsed, depth + 1) };
                    } catch (e) {}
                }
            }
            return merged;
        };

        const details = deepUnwrap(record);

        const findVal = (searchKeys, signalName) => {
            const lowSearch = searchKeys.map(k => k.toLowerCase().replace(/[\s_]/g, ''));
            const normSignalName = (signalName || '').toLowerCase().replace(/[\s_]/g, '');
            
            const extractNumeric = (v) => {
                if (v === undefined || v === null || v === '') return undefined;
                if (typeof v === 'number') return v;
                if (typeof v === 'string') {
                    const parsed = parseFloat(v);
                    return isNaN(parsed) ? undefined : parsed;
                }
                if (typeof v === 'object') {
                    const inner = v.value ?? v.val ?? v.signalValue ?? v.signal_value ?? v.eventValue;
                    return extractNumeric(inner);
                }
                return undefined;
            };

            // A. Check details (fully unpacked)
            const dKeys = Object.keys(details);
            for (const k of dKeys) {
                const normK = k.toLowerCase().replace(/[\s_]/g, '');
                if (lowSearch.includes(normK) || (normSignalName && normK === normSignalName)) {
                    const val = extractNumeric(details[k]);
                    if (val !== undefined) return val;
                }
            }

            // B. Check specific signalName match (normalized)
            const currentSigName = (record.signalname || record.signalName || record.signal_name || '').toLowerCase().replace(/[\s_]/g, '');
            if (normSignalName && currentSigName === normSignalName) {
                const rawVal = record.signalvalue !== undefined ? record.signalvalue : 
                             (record.signalValue !== undefined ? record.signalValue : record.signal_value);
                const val = extractNumeric(rawVal);
                if (val !== undefined) return val;
            }
            return undefined;
        };

        const updates = {};
        
        // Extract metrics with highly expanded search keys for Jeep 5.0 alignment
        updates.speed = findVal(['speed', 'VehicleSpeed', 'vehicle_speed', 'gpsSpeed', 'velocity', 'gps_speed', 'speedAvg', 'avgSpeed', 'topSpeed', 'Vehicle_Speed_Value'], 'Vehicle Speed');
        updates.rpm = findVal(['rpm', 'EngineRPM', 'engineRpm', 'engine_rpm', 'engineSpeed', 'EngineSpeed', 'Engine_Speed_Value', 'RPM_Value'], 'Engine Speed');
        updates.battery = findVal(['batteryVoltage', 'BatteryVoltage', 'voltage', 'batt_volt', 'battery', 'vbat', 'BatteryVoltageLevel', 'battery_voltage', 'Battery_Voltage_Value'], 'Battery Voltage Level');
        updates.fuel = findVal(['fuelLevel', 'FuelLevel', 'fuel_level', 'fuelPercentage', 'fuelLevelPct', 'fuel', 'fuel_level_pct', 'fuel_consumed', 'fuelConsumed', 'Fuel_Level_Value'], 'Fuel Level');
        updates.odometer = findVal(['odometer', 'totalOdometer', 'TotalOdometer', 'total_odometer', 'odm', 'odo', 'tripDistance', 'km_total', 'distance', 'Odometer_Value', 'Total_Distance'], 'Total Odometer');
        updates.coolant = findVal(['coolantTemp', 'engineWaterTemp', 'coolant_temp', 'coolant', 'engineCoolantTemp', 'EngineWaterTemp', 'Coolant_Temp_Value'], 'Engine Water Temp');

        // Remove undefined fields
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        const i = findVal(['ignitionStatus', 'ignition_status', 'ign_stat', 'engineState', 'engine_state', 'CmdIgnSts', 'Ignition_Status_Value'], 'Ignition Status');
        if (i !== undefined) {
            if (typeof i === 'string') {
                const val = i.toUpperCase();
                if (['RUN', 'START', 'ACC', 'ON', 'IGNITION_ON'].includes(val)) updates.ignition = 'ON';
                else if (['IGN_LK', 'OFF', 'LOCKED', 'IGNITION_OFF'].includes(val)) updates.ignition = 'OFF';
                else updates.ignition = val;
            } else if (typeof i === 'number') {
                updates.ignition = i > 0 ? 'ON' : 'OFF'; // 5.0 often uses bit flags
            }
        }

        // Location
        let lat = findVal(['gpsLat', 'latitude', 'lat', 'gps_lat', 'Latitude_Value'], 'Latitude');
        let lon = findVal(['gpsLong', 'longitude', 'lon', 'lng', 'gps_long', 'gps_lng', 'Longitude_Value'], 'Longitude');
        if (lat !== undefined && lon !== undefined) {
            updates.location = `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
        }



        // Logic for specialized aggregate signals or event types
        const type = (record.eventtype || record.signalName || record.signalname || record.signal_name || '').toUpperCase();
        
        // Inference from event types
        if (type.includes('IGNITIONON') || type.includes('IGNITION_ON') || type.includes('ENGINESTART') || type.includes('RUN')) updates.ignition = 'ON';
        if (type.includes('IGNITIONOFF') || type.includes('IGNITION_OFF') || type.includes('ENGINESTOP') || type.includes('IGN_LK')) updates.ignition = 'OFF';

        return updates;
    };

    const findTimestamp = (record) => record.timestamp || 
        record.sourcetimestamp || 
        record.sourceTimestamp ||
        record.source_timestamp ||
        record.updatetimestamp || 
        record.updatedtimestamp || 
        record.updatedTimeStamp || 
        record.updated_at ||
        record.updatedAt ||
        record.eventtime || 
        record.eventTime || 
        record.eventTimeStamp ||
        record.eventtimestamp ||
        record.currentTime || 
        record.lastUpdateTime ||
        record.lastUpdatedTime ||
        record.created_at ||
        record.createdAt ||
        record.time ||
        record.ts;

    // 1. Group records by exact timestamp
    const groups = {};
    rawRecords.forEach(record => {
        const dateObj = parseSafeDate(findTimestamp(record));
        if (!dateObj) return;

        const key = dateObj.toISOString();
        
        if (!groups[key]) groups[key] = { dateObj, updates: {}, raws: [] };
        Object.assign(groups[key].updates, extractUpdates(record));
        groups[key].raws.push(record);
    });

    // 2. Sort and Merge with persistence (Last Known Value)
    const sortedKeys = Object.keys(groups).sort();
    let lastState = {
        speed: 0, rpm: 0, battery: 0, fuel: 0, odometer: 0, coolant: 0, ignition: 'N/A', location: 'N/A',
        ...initialState // Apply seed baseline
    };

    return sortedKeys.map(key => {
        const group = groups[key];
        
        // Zero-Value Guard for cumulative metrics (Odometer/Fuel)
        // If the new packet says 0, but we have a non-zero previous value, ignore the 0.
        // This handles "heartbeat" packets that don't report all sensors.
        const currentUpdates = group.updates;
        
        if (currentUpdates.odometer === 0 && lastState.odometer > 0) {
            delete currentUpdates.odometer;
        }
        if (currentUpdates.fuel === 0 && lastState.fuel > 0) {
            delete currentUpdates.fuel;
        }
        if (currentUpdates.rpm === 0 && lastState.rpm > 0) {
            delete currentUpdates.rpm;
        }
        if (currentUpdates.coolant === 0 && lastState.coolant > 0) {
            delete currentUpdates.coolant;
        }

        const newState = {
            ...lastState,
            ...currentUpdates,
            timestamp: key,
            displayTime: formatDisplayTime(group.dateObj),
            chartTime: group.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            eventType: group.raws[0].eventtype || group.raws[0].signalName || 'TELEMETRY',
            raw: group.raws[0]
        };
        lastState = newState;
        return newState;
    });
};

/**
 * Safely parse a date from various potential backend formats
 */
const parseSafeDate = (ts) => {
    if (!ts) return null;
    if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts;
    
    let val = ts;
    // Handle numeric strings like "1712750000000" or Unix seconds "1775818953"
    if (typeof ts === 'string' && /^\d+$/.test(ts)) {
        val = Number(ts);
    }

    if (typeof val === 'number') {
        // If it looks like seconds (e.g., 1.7 billion vs 1.7 trillion for ms)
        if (val < 10000000000) val *= 1000;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
    }
    
    if (typeof ts === 'string') {
        // Handle "YYYY-MM-DD HH:mm:ss" by replacing space with 'T' for ISO compatibility
        const normalized = ts.includes(' ') && !ts.includes('T') ? ts.replace(' ', 'T') : ts;
        const d = new Date(normalized);
        if (!isNaN(d.getTime())) return d;
    }
    
    const date = new Date(ts);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Format timestamp for readable display
 */
const formatDisplayTime = (ts) => {
    const date = parseSafeDate(ts);
    if (!date) return 'N/A';
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

/**
 * Prepares data for XLSX export
 * @param {Array} processedData 
 */
export const prepareExcelData = (processedData) => {
    return processedData.map(item => ({
        'Timestamp': item.timestamp,
        'Event Type': item.eventType,
        'Speed (km/h)': item.speed,
        'Engine RPM': item.rpm,
        'Battery (V)': item.battery,
        'Fuel Level (%)': item.fuel,
        'Source ID': item.sourceId
    }));
};
