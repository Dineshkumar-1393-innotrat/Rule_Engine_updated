/**
 * Simple Rule Engine
 * 
 * Evaluates data against a set of rules.
 * 
 * Rule Structure:
 * {
 *   id: string,
 *   name: string,
 *   conditions: {
 *     all: [ // AND logic
 *       { fact: string, operator: string, value: any }
 *     ],
 *     any: [ // OR logic (optional implementation)
 *       { fact: string, operator: string, value: any }
 *     ]
 *   },
 *   event: {
 *     type: string,
 *     message: string,
 *     severity: 'info' | 'warning' | 'critical'
 *   }
 * }
 */

// ============================================
// DEVICE STATES
// ============================================
export const DeviceStates = {
    TRIP_IDLE: 'TRIP_IDLE',
    TRIP_PENDING: 'TRIP_PENDING',
    TRIP_ACTIVE: 'TRIP_ACTIVE',
    TRIP_PAUSED: 'TRIP_PAUSED',
    // Jeep M6 States
    FACTORY: 'FACTORY',
    PROVISIONED: 'PROVISIONED',
    AUTHORIZED: 'AUTHORIZED',
    CUSTOMER: 'CUSTOMER'
};

// ============================================
// DEVICE INTERNAL VARIABLES
// ============================================
export const DeviceVariables = [
    {
        name: 'tripStartTime',
        description: 'Timestamp when trip started',
        type: 'timestamp',
        defaultValue: null,
        category: 'trip'
    },
    {
        name: 'tripStartOdo',
        description: 'Odometer reading at trip start (km)',
        type: 'number',
        defaultValue: 0,
        category: 'trip'
    },
    {
        name: 'currentTripDistance',
        description: 'Current trip distance (km)',
        type: 'number',
        defaultValue: 0,
        category: 'trip'
    },
    {
        name: 'lastIgnitionOffTime',
        description: 'Last time ignition was turned off',
        type: 'timestamp',
        defaultValue: null,
        category: 'ignition'
    },
    {
        name: 'elapsedIgnitionOffTime',
        description: 'Time elapsed since ignition off (seconds)',
        type: 'number',
        defaultValue: 0,
        category: 'ignition'
    }
];

// ============================================
// CONFIGURABLE PARAMETERS
// ============================================
export const ConfigurableParameters = [
    {
        name: 'MIN_TRIP_DISTANCE',
        description: 'Minimum distance to confirm a trip (km)',
        type: 'number',
        defaultValue: 2,
        min: 0.1,
        max: 50,
        unit: 'km'
    },
    {
        name: 'MIN_IGN_OFF_TIME',
        description: 'Minimum ignition off time to end a trip (seconds)',
        type: 'number',
        defaultValue: 120,
        min: 10,
        max: 3600,
        unit: 'seconds'
    },
    {
        name: 'MAX_IGN_OFF_TIME',
        description: 'Maximum ignition off time before trip ends (seconds)',
        type: 'number',
        defaultValue: 120,
        min: 10,
        max: 3600,
        unit: 'seconds'
    }
];

// ============================================
// STATE TRANSITION DEFINITIONS
// ============================================
export const StateTransitions = {
    [DeviceStates.TRIP_IDLE]: {
        description: 'No active trip',
        transitions: [
            {
                to: DeviceStates.TRIP_PENDING,
                condition: 'Ignition OFF → ON',
                description: 'When ignition turns on'
            }
        ]
    },
    [DeviceStates.TRIP_PENDING]: {
        description: 'Waiting to confirm trip',
        transitions: [
            {
                to: DeviceStates.TRIP_ACTIVE,
                condition: 'currentTripDistance >= MIN_TRIP_DISTANCE',
                description: 'Distance threshold met'
            },
            {
                to: DeviceStates.TRIP_IDLE,
                condition: 'Ignition ON → OFF && elapsedIgnitionOffTime >= MIN_IGN_OFF_TIME',
                description: 'Short trip ended'
            }
        ]
    },
    [DeviceStates.TRIP_ACTIVE]: {
        description: 'Active trip in progress',
        transitions: [
            {
                to: DeviceStates.TRIP_IDLE,
                condition: 'Ignition ON → OFF && elapsedIgnitionOffTime >= MAX_IGN_OFF_TIME',
                description: 'Trip ended'
            }
        ]
    }
};

// ============================================
// ALL AVAILABLE FACTS FOR RULE BUILDER
// ============================================
export const AvailableFacts = [
    // Sensor Data
    { name: 'speed', label: 'Speed (km/h)', type: 'number', category: 'sensor' },
    { name: 'rpm', label: 'RPM', type: 'number', category: 'sensor' },
    { name: 'engineTemp', label: 'Engine Temp (°C)', type: 'number', category: 'sensor' },
    { name: 'fuelLevel', label: 'Fuel Level (%)', type: 'number', category: 'sensor' },
    { name: 'roadCondition', label: 'Road Condition', type: 'string', category: 'sensor' },
    // Jeep M6 Sensors
    { name: 'batteryVoltage', label: 'Battery Voltage (V)', type: 'number', category: 'sensor' },
    { name: 'geoFenceStatus', label: 'Geo Fence (INSIDE/OUTSIDE)', type: 'string', category: 'sensor' },

    // Device State
    { name: 'deviceState', label: 'Device State', type: 'state', category: 'state' },
    { name: 'ignition', label: 'Ignition (ON/OFF)', type: 'boolean', category: 'state' },
    // Jeep M6 States
    { name: 'crashDetected', label: 'Crash Detected', type: 'boolean', category: 'state' },
    { name: 'fotaStatus', label: 'FOTA Status', type: 'string', category: 'state' },
    { name: 'lastCommand', label: 'Last Command', type: 'string', category: 'state' },

    // Internal Variables
    { name: 'tripStartTime', label: 'Trip Start Time', type: 'timestamp', category: 'variable' },
    { name: 'tripStartOdo', label: 'Trip Start Odo (km)', type: 'number', category: 'variable' },
    { name: 'currentTripDistance', label: 'Current Trip Distance (km)', type: 'number', category: 'variable' },
    { name: 'lastIgnitionOffTime', label: 'Last Ignition Off Time', type: 'timestamp', category: 'variable' },
    { name: 'elapsedIgnitionOffTime', label: 'Elapsed Ign Off Time (s)', type: 'number', category: 'variable' },

    // Trip Statistics
    { name: 'runTime', label: 'Run Time (s)', type: 'number', category: 'trip' },
    { name: 'distance', label: 'Distance (km)', type: 'number', category: 'trip' },
    { name: 'offTime', label: 'Off Time (s)', type: 'number', category: 'trip' },

    // Parameters (for reference in conditions)
    { name: 'MIN_TRIP_DISTANCE', label: 'Min Trip Distance (km)', type: 'parameter', category: 'parameter' },
    { name: 'MIN_IGN_OFF_TIME', label: 'Min Ign Off Time (s)', type: 'parameter', category: 'parameter' },
    { name: 'MAX_IGN_OFF_TIME', label: 'Max Ign Off Time (s)', type: 'parameter', category: 'parameter' }
];

export class RuleEngine {
    constructor(rules = []) {
        this.rules = rules;
    }

    addRule(rule) {
        this.rules.push(rule);
    }

    removeRule(ruleId) {
        this.rules = this.rules.filter(r => r.id !== ruleId);
    }

    updateRules(newRules) {
        this.rules = newRules;
    }

    evaluate(data) {
        const triggeredEvents = [];

        for (const rule of this.rules) {
            if (this.checkConditions(rule.conditions, data)) {
                triggeredEvents.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    ...rule.event,
                    timestamp: new Date().toISOString(),
                    dataSnapshot: { ...data }
                });
            }
        }

        return triggeredEvents;
    }

    checkConditions(conditions, data) {
        if (!conditions) return true; // No conditions = always true? Or always false. Let's say true.

        // Check 'all' (AND) conditions
        if (conditions.all && Array.isArray(conditions.all)) {
            for (const condition of conditions.all) {
                if (!this.evaluateCondition(condition, data)) {
                    return false;
                }
            }
        }

        // Check 'any' (OR) conditions - if present, at least one must be true
        if (conditions.any && Array.isArray(conditions.any) && conditions.any.length > 0) {
            let anyTrue = false;
            for (const condition of conditions.any) {
                if (this.evaluateCondition(condition, data)) {
                    anyTrue = true;
                    break;
                }
            }
            if (!anyTrue) return false;
        }

        return true;
    }

    evaluateCondition(condition, data) {
        const { fact, operator, value } = condition;
        const factValue = data[fact];

        // Handle nested facts (e.g. "engine.temperature")
        // For simplicity, assuming flat data structure for now, but could be extended.

        switch (operator) {
            case 'equal':
            case '==':
            case '===':
                return factValue == value;
            case 'notEqual':
            case '!=':
            case '!==':
                return factValue != value;
            case 'greaterThan':
            case '>':
                return Number(factValue) > Number(value);
            case 'greaterThanInclusive':
            case '>=':
                return Number(factValue) >= Number(value);
            case 'lessThan':
            case '<':
                return Number(factValue) < Number(value);
            case 'lessThanInclusive':
            case '<=':
                return Number(factValue) <= Number(value);
            case 'contains':
                return String(factValue).includes(String(value));
            default:
                console.warn(`Unknown operator: ${operator}`);
                return false;
        }
    }
}

export const defaultRules = [
    {
        id: 'rule-harsh-driving',
        name: 'Harsh Driving',
        conditions: {
            all: [
                { fact: 'speed', operator: '>', value: 30 },
                { fact: 'roadCondition', operator: '==', value: 'bad' }
            ]
        },
        event: {
            type: 'harsh_driving',
            message: 'Harsh driving detected: Speeding on bad road',
            severity: 'critical'
        }
    },
    {
        id: 'rule-speeding',
        name: 'Speeding',
        conditions: {
            all: [
                { fact: 'speed', operator: '>', value: 80 }
            ]
        },
        event: {
            type: 'speeding',
            message: 'Vehicle is speeding (> 80)',
            severity: 'warning'
        }
    },
    {
        id: 'rule-overheating',
        name: 'Engine Overheating',
        conditions: {
            all: [
                { fact: 'engineTemp', operator: '>', value: 100 }
            ]
        },
        event: {
            type: 'vehicle_health',
            message: 'Engine is overheating! (> 100°C)',
            severity: 'critical'
        }
    },
    {
        id: 'rule-low-fuel',
        name: 'Low Fuel',
        conditions: {
            all: [
                { fact: 'fuelLevel', operator: '<', value: 15 }
            ]
        },
        event: {
            type: 'vehicle_health',
            message: 'Fuel level is low (< 15%)',
            severity: 'warning'
        }
    },
    {
        id: 'rule-icy-road',
        name: 'High Speed on Icy Road',
        conditions: {
            all: [
                { fact: 'speed', operator: '>', value: 40 },
                { fact: 'roadCondition', operator: '==', value: 'icy' }
            ]
        },
        event: {
            type: 'safety_hazard',
            message: 'Dangerous speed on icy road!',
            severity: 'critical'
        }
    },
    {
        id: 'rule-high-rpm',
        name: 'High RPM',
        conditions: {
            all: [
                { fact: 'rpm', operator: '>', value: 6000 }
            ]
        },
        event: {
            type: 'vehicle_health',
            message: 'High RPM detected (> 6000)',
            severity: 'critical'
        }
    },
    {
        id: 'rule-trip-start',
        name: 'Vehicle Trip Start',
        conditions: {
            all: [
                { fact: 'runTime', operator: '>=', value: 300 }, // 5 minutes
                { fact: 'distance', operator: '>=', value: 2 },  // 2 km
                { fact: 'ignition', operator: '==', value: true }
            ]
        },
        event: {
            type: 'trip_status',
            message: 'Trip Started (5 mins & 2km)',
            severity: 'info'
        }
    },
    {
        id: 'rule-trip-stop',
        name: 'Vehicle Trip Stop',
        conditions: {
            all: [
                { fact: 'offTime', operator: '>=', value: 120 }, // 2 minutes
                { fact: 'ignition', operator: '==', value: false }
            ]
        },
        event: {
            type: 'trip_status',
            message: 'Trip Stopped (Engine off > 2 mins)',
            severity: 'info'
        }
    }
];

export const JeepM6DefaultRules = [
    {
        id: 'm6-overspeed',
        name: 'M6 Overspeed Alert',
        conditions: {
            all: [
                { fact: 'speed', operator: '>', value: 100 }
            ]
        },
        event: {
            type: 'alert',
            message: 'Overspeed detected (> 100 km/h)',
            severity: 'critical'
        }
    },
    {
        id: 'm6-crash',
        name: 'M6 Crash Detection',
        conditions: {
            all: [
                { fact: 'crashDetected', operator: '==', value: true }
            ]
        },
        event: {
            type: 'emergency_alert',
            message: 'CRASH DETECTED! Sending Emergency Alert.',
            severity: 'critical'
        }
    },
    {
        id: 'm6-low-battery',
        name: 'M6 Low Battery Protect',
        conditions: {
            all: [
                { fact: 'batteryVoltage', operator: '<', value: 11.0 }
            ]
        },
        event: {
            type: 'command_rejection',
            message: 'Low Battery (< 11V). Remote commands disabled.',
            severity: 'warning'
        }
    },
    {
        id: 'm6-fota-safety',
        name: 'M6 FOTA Safety Check',
        conditions: {
            all: [
                { fact: 'ignition', operator: '==', value: true },
                { fact: 'fotaStatus', operator: '==', value: 'DOWNLOADING' }
            ]
        },
        event: {
            type: 'fota_error',
            message: 'FOTA Rejected: Ignition is ON.',
            severity: 'critical'
        }
    }
];
