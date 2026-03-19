import { v4 as uuidv4 } from 'uuid';

/**
 * Generates User Registration Payload
 * NB API Interface ID: NB-REGISTRATION_LOGIN-001
 */
export const generateUserRegistrationPayload = (userData) => {
    return {
        mobileNum: userData.mobileNum || "9385698874",
        countryCode: userData.countryCode || "+91",
        password: userData.password || "Password@123"
    };
};

/**
 * Generates User Login Payload
 * NB API Interface ID: NB-REGISTRATION_LOGIN-002
 */
export const generateUserLoginPayload = (userData) => {
    return {
        mobileNum: userData.mobileNum || "9385698874",
        countryCode: userData.countryCode || "+91",
        password: userData.password || "Password@123"
    };
};

/**
 * Generates Location Stream Request body
 */
export const generateLocationStreamPayload = (deviceData) => {
    return {
        vin: deviceData.vehicleId || "JEEP1234567890VIN",
        startTime: Math.floor(Date.now() / 1000) - 3600,
        endTime: Math.floor(Date.now() / 1000)
    };
};

/**
 * Generates Trip Details Request body
 */
export const generateTripDetailsPayload = (deviceData, tripId) => {
    return {
        vin: deviceData.vehicleId || "JEEP1234567890VIN",
        tripId: tripId || "TRIP_12345"
    };
};

/**
 * Generates Remote Command Payload (Honk, Blinkers, Lock/Unlock)
 */
export const generateRemoteCommandPayload = (deviceData, commandType, params = {}) => {
    return {
        vin: deviceData.vehicleId || "JEEP1234567890VIN",
        command: commandType, // e.g., 'HONK', 'BLINKERS', 'LOCK', 'UNLOCK'
        requestTime: new Date().toISOString(),
        commandId: uuidv4(),
        parameters: params
    };
};

/**
 * Generates Geo Fence Creation Payload
 */
export const generateGeoFencePayload = (deviceData, fenceData) => {
    return {
        vin: deviceData.vehicleId || "JEEP1234567890VIN",
        fenceId: uuidv4(),
        fenceName: fenceData.name || "Home GeoFence",
        fenceType: "CIRCLE",
        center: {
            latitude: fenceData.lat || 12.9716,
            longitude: fenceData.lng || 77.5946
        },
        radius: fenceData.radius || 500, // in meters
        alertType: ["ENTRY", "EXIT"],
        status: "ACTIVE"
    };
};

/**
 * Generates Notification Settings Payload
 */
export const generateNotificationSettingsPayload = (deviceData, settings) => {
    return {
        vin: deviceData.vehicleId || "JEEP1234567890VIN",
        settings: {
            speedAlerts: settings.speedAlerts !== undefined ? settings.speedAlerts : true,
            geofenceAlerts: settings.geofenceAlerts !== undefined ? settings.geofenceAlerts : true,
            engineIdleAlerts: settings.engineIdleAlerts !== undefined ? settings.engineIdleAlerts : false,
            snoozePeriod: settings.snoozePeriod || 0 // 0 means not snoozed
        }
    };
};

/**
 * Generates Customer Onboarding Payload (DMS)
 */
export const generateCustomerOnboardingPayload = (customerData) => {
    return {
        customerId: uuidv4(),
        firstName: customerData.firstName || "John",
        lastName: customerData.lastName || "Doe",
        mobileNum: customerData.mobileNum || "9385698874",
        email: customerData.email || "john.doe@example.com",
        vin: customerData.vehicleId || "JEEP1234567890VIN",
        onboardingDate: new Date().toISOString()
    };
};

/**
 * Generates Emergency Alerts / Crash Notification Payload
 */
export const generateEmergencyAlertPayload = (deviceData, crashData) => {
    return {
        vin: deviceData.vehicleId || "JEEP1234567890VIN",
        alertId: uuidv4(),
        alertType: "CRASH_DETECTED",
        timestamp: new Date().toISOString(),
        location: {
            latitude: crashData.lat || 12.9716,
            longitude: crashData.lng || 77.5946
        },
        severity: crashData.severity || "HIGH",
        impactSpeed: crashData.impactSpeed || 60
    };
};
