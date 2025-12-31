import { v4 as uuidv4 } from 'uuid';

/**
 * Helper to get identity based on device state
 */
const getIdentity = (deviceData) => {
    // Section 3.4 Table 3.1 & 8.3.4.1.1
    const state = deviceData.tboxApplicationState;
    const rules = deviceData.lifecycleRules;

    // Use configurable rules if available
    if (rules && rules[state]) {
        const idType = rules[state].identity;
        if (idType === 'VIN') return deviceData.vehicleId;
        if (idType === 'MSISDN') return deviceData.msisdn || deviceData.vehicleId;
        if (idType === 'IMEI') return deviceData.imeiNo;
        if (idType === 'VehicleId') return deviceData.vehicleId;
    }

    // Default Fallback (Spec Compliance)
    if (state === 'CUSTOMER') return deviceData.msisdn || deviceData.vehicleId;
    if (state === 'AUTHORIZED' || state === 'PROVISIONED') return deviceData.vehicleId;
    // FACTORY or PRE-SALES or any other initial state uses IMEI
    return deviceData.imeiNo;
};

/**
 * Generates the 'deviceJoined' payload
 */
export const generateDeviceJoinedPayload = (deviceData) => {
    return {
        message_id: uuidv4(),
        e_Tbox_application_state: deviceData.tboxApplicationState?.toLowerCase() || 'factory',
        Tbox_esim_state: deviceData.tboxeSimState || 'normal_sim',
        version: "2.0.0",
        time_stamp: {
            seconds: Math.floor(Date.now() / 1000),
            nanos: (Date.now() % 1000) * 1000000
        },
        deviceJoinedData: {
            vehicleId: deviceData.vehicleId,
            TboxSerialNum: deviceData.tboxSerialNum,
            imeiNo: deviceData.imeiNo,
            protocolVersion: deviceData.protocolVersion,
            TboxOperatingState: deviceData.tboxOperatingState || 'NORMAL',
            TboxApplicationState: deviceData.tboxApplicationState || 'FACTORY',
            TboxeSimState: deviceData.tboxeSimState || 'NORMAL_SIM',
            CCPUVersion: deviceData.ccpuVersion,
            VMCUVersion: deviceData.vmcuVersion,
            FOTAID: deviceData.fotaId || null,
            status: deviceData.fotaStatus === 'SUCCESS' ? 'TBOXInstallationSuccess' :
                deviceData.fotaStatus === 'FAILED' ? 'TBOXInstallationFailure' : null,
            releaseVersion: deviceData.releaseVersion || '1.0'
        }
    };
};

/**
 * Generates the 'telemetry' payload
 */
export const generateTelemetryPayload = (deviceData, sensorData) => {
    return {
        header: {
            messageID: uuidv4(),
            timestamp: new Date().toISOString(),
            vin: deviceData.vehicleId,
            imei: deviceData.imeiNo,
            identity: getIdentity(deviceData)
        },
        payload: {
            vehicleSpeed: sensorData.speed,
            engineSpeed: sensorData.rpm,
            odometer: deviceData.currentTripDistance + deviceData.tripStartOdo, // Total Odo
            ignitionStatus: deviceData.ignition ? 'ON' : 'OFF',
            batteryVoltage: sensorData.batteryVoltage,
            engineTemp: sensorData.engineTemp,
            fuelLevel: sensorData.fuelLevel,
            gps: {
                latitude: 12.9716, // Simulating Bangalore
                longitude: 77.5946,
                altitude: 920,
                heading: 0,
                speed: sensorData.speed
            },
            tripId: deviceData.journeyId
        }
    };
};

/**
 * Generates the 'trip' payload (Start/Progress/End)
 * Compliance: TE-01 Spec Section 16.2
 */
export const generateTripPayload = (type, deviceData) => {
    const now = Math.floor(Date.now() / 1000);
    const state = deviceData.tboxApplicationState || 'factory';

    // GNSS Template ( Bangalore default )
    const gnssTemplate = (lat = 12.9716, lng = 77.5946) => ({
        gpsLat: lat.toString(),
        gpsLong: lng.toString(),
        gpsAlt: "920.0",
        gpsAccLat: "0.001",
        gpsAccLong: "0.001",
        gpsAccAlt: "0.1",
        gpsCourseAngle: "25",
        gpsSignalQuality: "1.1",
        gpsFixedstatus: 1
    });

    const payload = {
        message_id: uuidv4(),
        e_Tbox_application_state: state.toLowerCase(),
        Tbox_esim_state: deviceData.tboxeSimState || "normal_sim",
        version: "2.0.0",
        tripPayload: {
            tripId: parseInt(deviceData.journeyId) || 0,
            startTime: deviceData.tripStartTimeEpoch || now,
            currentTime: now,
            endTime: type === 'tripEnd' ? now : 0,

            // GNSS Information
            gnssInfoStart: gnssTemplate(deviceData.gnssInfoStart?.lat, deviceData.gnssInfoStart?.long),
            gnssInfoCurrent: gnssTemplate(12.9716 + (Math.random() * 0.01), 77.5946 + (Math.random() * 0.01)),
            gnssInfoEnd: type === 'tripEnd' ? gnssTemplate(12.9716 + 0.05, 77.5946 + 0.05) : null,

            // Trip Metrics
            avgFuelEconomy: 8.5, // Simulated km/L
            tripDistance: parseFloat(deviceData.currentTripDistance?.toFixed(2)) || 0.0,
            tripTime: parseInt(deviceData.currentTripTime) || 0,
            idleDuration: parseInt(deviceData.idleDuration) || 0,
            idleFuelCons: 0.2, // Simulated L/h
            tripType: deviceData.tripType || "Active",

            // Counters
            idlingCnt: deviceData.idlingCnt || 0,
            hardBrakeCnt: deviceData.hardBrakeCnt || 0,
            harshAccCnt: deviceData.harshAccCnt || 0,
            highSpeedCnt: deviceData.highSpeedCnt || 0,
            harshTurnCnt: deviceData.harshTurnCnt || 0,

            // Totals
            fuelConsumption: (deviceData.currentTripDistance * 0.08).toFixed(2), // 8L/100km sim
            fuelPercent: deviceData.fuelLevel || 75.0,
            speedAvg: (deviceData.currentTripDistance / (deviceData.currentTripTime / 60 + 0.001)).toFixed(2),
            topSpeed: deviceData.topSpeed || 0
        }
    };

    // Remove null keys
    if (!payload.tripPayload.gnssInfoEnd) delete payload.tripPayload.gnssInfoEnd;
    if (type !== 'tripEnd') delete payload.tripPayload.endTime;

    return payload;
};

/**
 * Generates the 'commandResponse' payload
 */
export const generateCommandResponsePayload = (commandId, commandType, status, deviceData) => {
    return {
        header: {
            messageID: uuidv4(),
            correlation_id: commandId,
            timestamp: new Date().toISOString(),
            vin: deviceData.vehicleId,
            identity: getIdentity(deviceData)
        },
        subtype: `${commandType}Response`,
        return_code: status === 'Success' ? 'succeeded' : 'failed',
        commandResponsePayload: {
            status: status,
            currentTboxState: deviceData.tboxApplicationState
        }
    };
};

/**
 * Generates the 'alert' payload
 */
export const generateAlertPayload = (deviceData, alertDetails) => {
    return {
        header: {
            messageID: uuidv4(),
            timestamp: new Date().toISOString(),
            vin: deviceData.vehicleId,
            imei: deviceData.imeiNo,
            identity: getIdentity(deviceData)
        },
        alert: {
            type: alertDetails.type,
            code: alertDetails.code,
            category: alertDetails.category || 'General',
            severity: alertDetails.severity || 'WARNING',
            description: alertDetails.message,
            isLive: alertDetails.isLive !== undefined ? alertDetails.isLive : true,

            // Contextual Data
            speed: deviceData.speed,
            location: {
                lat: 12.9716,
                long: 77.5946
            }
        }
    };
};

/**
 * Generates the 'drivingScore' payload
 */
export const generateDrivingScorePayload = (deviceData) => {
    return {
        header: {
            messageID: uuidv4(),
            timestamp: new Date().toISOString(),
            vin: deviceData.vehicleId,
            identity: getIdentity(deviceData)
        },
        subtype: 'drivingScore',
        payload: {
            tripId: deviceData.journeyId,
            currentScore: Math.max(0, Math.min(100, deviceData.drivingScore || 100)),
            factors: {
                harshAcceleration: deviceData.harshAccCnt,
                harshBraking: deviceData.hardBrakeCnt,
                harshCornering: deviceData.harshTurnCnt,
                speedingCount: deviceData.highSpeedCnt,
                idlingDuration: deviceData.idleDuration
            }
        }
    };
};
