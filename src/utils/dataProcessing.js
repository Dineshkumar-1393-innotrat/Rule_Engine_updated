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
        let details = {};
        
        // 1. Unpack eventdetails if present
        if (record.eventdetails) {
            try {
                details = typeof record.eventdetails === 'string' ? JSON.parse(record.eventdetails) : record.eventdetails;
            } catch (e) { /* ignore */ }
        } else {
            details = { ...record };
        }

        // 2. GENERIC JSON UNPACKER
        // If the signalValue itself is a JSON string (common in Jeep aggregate signals), unpack it into details
        const sigVal = record.signalvalue || record.signalValue || record.eventValue || record.signal_value;
        if (typeof sigVal === 'string' && sigVal.trim().startsWith('{')) {
            try {
                const unpacked = JSON.parse(sigVal);
                details = { ...details, ...unpacked };
            } catch (e) { /* ignore */ }
        }

        const findVal = (searchKeys, signalName) => {
            const lowSearch = searchKeys.map(k => k.toLowerCase());
            
            // A. Check details/unpacked keys (case-insensitive)
            const dKeys = Object.keys(details);
            for (const k of dKeys) {
                if (lowSearch.includes(k.toLowerCase())) {
                    const val = details[k];
                    if (val !== undefined && val !== null && val !== '') return val;
                }
            }

            // B. Check specific signalName match (from Jeep states)
            const currentSigName = (record.signalname || record.signalName || record.signal_name || '').toLowerCase();
            if (signalName && currentSigName === signalName.toLowerCase()) {
                const val = record.signalvalue !== undefined ? record.signalvalue : 
                            (record.signalValue !== undefined ? record.signalValue : record.signal_value);
                if (val !== undefined && val !== null && val !== '') return val;
            }
            
            // C. Fallback to outer record keys
            const rKeys = Object.keys(record);
            for (const k of rKeys) {
                if (lowSearch.includes(k.toLowerCase())) {
                    const val = record[k];
                    if (val !== undefined && val !== null && val !== '') return val;
                }
            }
            return undefined;
        };

        const updates = {};
        
        // Extract basic metrics
        const s = findVal(['speed', 'VehicleSpeed', 'vehicleSpeed', 'veh_speed', 'gpsSpeed', 'vehicle_speed', 'velocity', 'gps_speed'], 'Vehicle Speed');
        if (s !== undefined) updates.speed = Number(s);

        const r = findVal(['rpm', 'EngineRPM', 'engineRpm', 'engine_rpm', 'engineSpeed', 'engine_speed', 'EngineSpeed', 'engine_rpm'], 'Engine Speed');
        if (r !== undefined) updates.rpm = Number(r);

        const b = findVal(['batteryVoltage', 'BatteryVoltage', 'voltage', 'batt_volt', 'battery', 'vbat', 'battery_voltage'], 'Battery Voltage Level');
        if (b !== undefined) updates.battery = Number(b);

        const f = findVal(['fuelLevel', 'FuelLevel', 'fuel_level', 'fuelPercentage', 'fuelLevelPct', 'fuel', 'fuel_level_pct'], 'Fuel Level');
        if (f !== undefined) updates.fuel = Number(f);

        const o = findVal(['odometer', 'totalOdometer', 'odm', 'odo', 'total_odometer'], 'Total Odometer');
        if (o !== undefined) updates.odometer = Number(o);

        const c = findVal(['coolantTemp', 'engineWaterTemp', 'coolant_temp', 'coolant', 'engineCoolantTemp', 'engine_water_temp'], 'Engine Water Temp');
        if (c !== undefined) updates.coolant = Number(c);

        const i = findVal(['ignitionStatus', 'ignition_status', 'ign_stat', 'engineState', 'engine_state', 'CmdIgnSts'], 'Ignition Status');
        if (i !== undefined) {
            const val = String(i).toUpperCase();
            if (['RUN', 'START', 'ACC', 'ON'].includes(val)) updates.ignition = 'ON';
            else if (['IGN_LK', 'OFF', 'LOCKED'].includes(val)) updates.ignition = 'OFF';
            else updates.ignition = val;
        }

        // Location discovery
        let lat = findVal(['gpsLat', 'latitude', 'lat', 'gps_lat'], 'Latitude');
        let lon = findVal(['gpsLong', 'longitude', 'lon', 'lng', 'gps_long', 'gps_lng'], 'Longitude');
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

    // 1. Group records by exact timestamp
    const groups = {};
    rawRecords.forEach(record => {
        // Broad timestamp discovery to prevent fallback to Date.now()
        const ts = record.timestamp || 
                   record.sourcetimestamp || 
                   record.updatetimestamp || 
                   record.updatedtimestamp || 
                   record.updatedTimeStamp || 
                   record.eventtime || 
                   record.eventTime || 
                   record.currentTime || 
                   record.lastUpdateTime ||
                   record.created_at;
                   
        const dateObj = parseSafeDate(ts || new Date().toISOString());
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
    if (!ts) return new Date();
    if (ts instanceof Date) return ts;
    
    let val = ts;
    // Handle numeric strings like "1712750000000" or Unix seconds "1775818953"
    if (typeof ts === 'string' && /^\d+$/.test(ts)) {
        val = Number(ts);
    }

    if (typeof val === 'number') {
        // If it looks like seconds (e.g., 1.7 billion vs 1.7 trillion for ms)
        if (val < 10000000000) val *= 1000;
        return new Date(val);
    }
    
    if (typeof ts === 'string') {
        // Handle "YYYY-MM-DD HH:mm:ss" by replacing space with 'T' for ISO compatibility
        const normalized = ts.includes(' ') && !ts.includes('T') ? ts.replace(' ', 'T') : ts;
        const d = new Date(normalized);
        if (!isNaN(d.getTime())) return d;
    }
    
    const date = new Date(ts);
    return isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Format timestamp for readable display
 */
const formatDisplayTime = (ts) => {
    const date = parseSafeDate(ts);
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
