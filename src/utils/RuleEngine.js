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

/**
 * Device Trip States
 * These states manage the trip lifecycle based on ignition and distance thresholds.
 */
export const DeviceStates = {
    // Trip State Machine
    TRIP_IDLE: 'TRIP_IDLE',           // No active trip, ignition OFF
    TRIP_PENDING: 'TRIP_PENDING',     // Ignition ON, waiting for MIN_TRIP_DISTANCE
    TRIP_ACTIVE: 'TRIP_ACTIVE',       // Active trip confirmed (distance threshold met)
    TRIP_PAUSED: 'TRIP_PAUSED',       // Trip paused (ignition temporarily OFF)

    /**
     * Lifecycle States (Jeep M6 / TE-01 Spec Section 3.2)
     * 
     * These states represent the device lifecycle from manufacturing to customer activation.
     * State transitions are command-driven by CVIP and involve certificate-based authentication.
     * 
     * Flow: FACTORY → PROVISIONED → AUTHORIZED → CUSTOMER
     */

    // PRE-SALES: Initial state before manufacturing (minimal functionality)
    // - Identity: IMEI
    // - Subsystems: GSM only
    // - Purpose: Device exists but not yet manufactured/configured
    PRE_SALES: 'PRE-SALES',

    // FACTORY: Post-manufacturing state, dongle inserted into device
    // - Identity: IMEI
    // - Subsystems: CAN, GPS, GSM enabled
    // - Authentication: Uses common certificates to connect to CVIP
    // - Purpose: Device ready for provisioning, can decode VIN and download device certificates
    FACTORY: 'FACTORY',

    // PROVISIONED: Device successfully authenticated with CVIP using device-specific certificates
    // - Identity: VIN (Vehicle Identification Number)
    // - Subsystems: CAN, GPS, GSM, Telemetry enabled
    // - Authentication: Device certificates created via Access Token (Access Token service + CVIP bundle)
    // - CVIP Flow:
    //   1. Dongle connects using common certificates
    //   2. CVIP issues Access Token
    //   3. Device certificates created using access token
    //   4. CVIP reconnects using device-specific certificates
    //   5. Device joins CVIP successfully → State becomes PROVISIONED
    // - Purpose: Device authenticated and ready for authorization
    PROVISIONED: 'PROVISIONED',

    // AUTHORIZED: CVIP has authorized the device for full operation
    // - Identity: VIN
    // - Subsystems: All enabled (CAN, GPS, GSM, Telemetry, Alerts)
    // - Trigger: CVIP sends command to change state from PROVISIONED → AUTHORIZED
    // - Purpose: Device fully operational, ready for customer activation
    AUTHORIZED: 'AUTHORIZED',

    // CUSTOMER: Device activated for customer use
    // - Identity: MSISDN (Mobile number) or VehicleId
    // - Subsystems: All enabled (full functionality)
    // - Trigger: After dongle responds successfully to CVIP authorization,
    //           CVIP initiates state change AUTHORIZED → CUSTOMER
    // - Events:
    //   - Device subscribes to: CSR Access Token Response
    //   - Device publishes: IMEI to CSR Access Request
    // - Purpose: Device in production use by end customer
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
        name: 'journeyId',
        description: 'Unique Trip ID (UUID)',
        type: 'string',
        defaultValue: null,
        category: 'trip'
    },
    {
        name: 'vehicleId',
        description: 'Vehicle Identification Number (VIN)',
        type: 'string',
        defaultValue: 'WAUD2AFD7DN006931',
        category: 'device'
    },
    {
        name: 'harshAccCnt',
        description: 'Number of harsh acceleration events',
        type: 'number',
        defaultValue: 0,
        category: 'trip'
    },
    {
        name: 'hardBrakeCnt',
        description: 'Number of hard braking events',
        type: 'number',
        defaultValue: 0,
        category: 'trip'
    },
    {
        name: 'harshTurnCnt',
        description: 'Number of harsh turn events',
        type: 'number',
        defaultValue: 0,
        category: 'trip'
    },
    {
        name: 'idlingCnt',
        description: 'Number of idling instances',
        type: 'number',
        defaultValue: 0,
        category: 'trip'
    },
    {
        name: 'idleDuration',
        description: 'Total idle time in minutes',
        type: 'number',
        defaultValue: 0,
        category: 'trip'
    },
    {
        name: 'tripType',
        description: 'Active or Idle',
        type: 'string',
        defaultValue: 'Idle',
        category: 'trip'
    },
    {
        name: 'imeiNo',
        description: 'IMEI Number',
        type: 'string',
        defaultValue: '356741000000021',
        category: 'device'
    },
    {
        name: 'tboxSerialNum',
        description: 'Dongle Serial Number',
        type: 'string',
        defaultValue: 'SN29482029',
        category: 'device'
    },
    {
        name: 'protocolVersion',
        description: 'Protocol Version',
        type: 'string',
        defaultValue: '2.0.0',
        category: 'device'
    },
    {
        name: 'ccpuVersion',
        description: 'CCPU SW Version',
        type: 'string',
        defaultValue: 'CD.02.03',
        category: 'device'
    },
    {
        name: 'vmcuVersion',
        description: 'VMCU SW Version',
        type: 'string',
        defaultValue: 'VD0.02.03',
        category: 'device'
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
        description: 'Minimum ignition off time to pause trip (seconds)',
        type: 'number',
        defaultValue: 180,
        min: 1,
        max: 3600,
        unit: 'seconds'
    },
    {
        name: 'MAX_IGN_OFF_TIME',
        description: 'Maximum ignition off time before trip ends (seconds)',
        type: 'number',
        defaultValue: 7200,
        min: 2,
        max: 14400,
        unit: 'seconds'
    },
    {
        name: 'OVERSPEED_THR',
        description: 'User defined speed threshold for overspeed alerts (km/h)',
        type: 'number',
        defaultValue: 120,
        min: 20,
        max: 200,
        unit: 'km/h'
    },
    {
        name: 'HARSH_ACCEL_THR',
        description: 'Threshold for Harsh Acceleration (km/h per second)',
        type: 'number',
        defaultValue: 10,
        min: 1,
        max: 50,
        unit: 'km/h/s'
    },
    {
        name: 'HARD_BRAKE_THR',
        description: 'Threshold for Hard Braking (km/h per second)',
        type: 'number',
        defaultValue: 15,
        min: 1,
        max: 50,
        unit: 'km/h/s'
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
// LIFECYCLE STATE TRANSITIONS
// ============================================

/**
 * Lifecycle State Transitions
 * 
 * Documents the device lifecycle flow from Factory to Customer.
 * State transitions are command-driven by CVIP and require proper authentication.
 * 
 * Security Considerations:
 * - All state transitions must be authenticated using device-specific certificates
 * - State transitions are idempotent (safe to retry)
 * - Device validates CVIP commands before transitioning
 * - Access tokens are used for certificate creation but not stored long-term
 */
export const LifecycleStateTransitions = {
    [DeviceStates.PRE_SALES]: {
        description: 'Initial state before manufacturing',
        identity: 'IMEI',
        transitions: [
            {
                to: DeviceStates.FACTORY,
                trigger: 'Manufacturing complete, dongle inserted',
                process: [
                    'Device manufactured and dongle physically inserted',
                    'Basic subsystems (CAN, GPS, GSM) initialized',
                    'Device ready to connect to CVIP using common certificates'
                ],
                requirements: ['Physical dongle insertion', 'Subsystem initialization']
            }
        ]
    },

    [DeviceStates.FACTORY]: {
        description: 'Post-manufacturing state, ready for provisioning',
        identity: 'IMEI',
        transitions: [
            {
                to: DeviceStates.PROVISIONED,
                trigger: 'Successful CVIP authentication and device certificate creation',
                process: [
                    '1. Dongle connects to CVIP using common certificates',
                    '2. CVIP authenticates device and issues Access Token',
                    '   - Access Token generated using: Access Token service + CVIP bundle',
                    '3. Device uses Access Token to create device-specific certificates',
                    '4. CVIP reconnects to device using device-specific certificates',
                    '5. Device successfully joins CVIP',
                    '6. State automatically becomes PROVISIONED'
                ],
                requirements: [
                    'Valid IMEI',
                    'Common certificates available',
                    'CVIP connectivity',
                    'Access Token service operational',
                    'Device certificate creation successful'
                ],
                security: [
                    'Common certificates used only for initial connection',
                    'Access Token is temporary and used only for cert creation',
                    'Device-specific certificates replace common certificates',
                    'All subsequent communication uses device-specific certs'
                ]
            }
        ]
    },

    [DeviceStates.PROVISIONED]: {
        description: 'Device authenticated with CVIP, awaiting authorization',
        identity: 'VIN',
        transitions: [
            {
                to: DeviceStates.AUTHORIZED,
                trigger: 'CVIP sends authorization command',
                process: [
                    '1. CVIP validates device provisioning status',
                    '2. CVIP sends TBOXStateUpdateCommand to change state to AUTHORIZED',
                    '3. Device validates command using device-specific certificates',
                    '4. Device enables all subsystems (including Alerts)',
                    '5. Device responds with success confirmation',
                    '6. State becomes AUTHORIZED'
                ],
                requirements: [
                    'Valid VIN decoded',
                    'Device certificates active',
                    'CVIP authorization command received',
                    'Command signature valid'
                ],
                security: [
                    'Command must be signed with CVIP private key',
                    'Device verifies command signature before transition',
                    'Transition is idempotent (can safely retry)'
                ]
            }
        ]
    },

    [DeviceStates.AUTHORIZED]: {
        description: 'Device fully authorized, ready for customer activation',
        identity: 'VIN',
        transitions: [
            {
                to: DeviceStates.CUSTOMER,
                trigger: 'Successful dongle response to CVIP, followed by customer activation command',
                process: [
                    '1. Device responds successfully to CVIP authorization',
                    '2. CVIP validates dongle response',
                    '3. CVIP initiates state change: AUTHORIZED → CUSTOMER',
                    '4. CVIP sends TBOXStateUpdateCommand with target state CUSTOMER',
                    '5. Device updates internal state to CUSTOMER',
                    '6. Device identity switches from VIN to MSISDN (if available)',
                    '7. Device subscribes to CSR Access Token Response events',
                    '8. Device publishes IMEI to CSR Access Request'
                ],
                requirements: [
                    'Successful authorization response from dongle',
                    'CVIP customer activation command',
                    'MSISDN assigned (optional, falls back to VehicleId)',
                    'CSR event subscription capability'
                ],
                security: [
                    'Customer activation requires explicit CVIP command',
                    'Cannot self-transition to CUSTOMER state',
                    'MSISDN assignment validated by CVIP'
                ]
            }
        ]
    },

    [DeviceStates.CUSTOMER]: {
        description: 'Device activated for customer use (production state)',
        identity: 'MSISDN',
        transitions: [
            // Terminal state - no further transitions in normal operation
            // May transition back to AUTHORIZED for service/maintenance (not documented here)
        ],
        notes: [
            'This is the production state for customer-facing devices',
            'All subsystems and features are fully enabled',
            'Device uses MSISDN as primary identity for customer-facing services',
            'Falls back to VehicleId if MSISDN not available'
        ]
    }
};

// ============================================
// LIFECYCLE EVENT CONFIGURATION
// ============================================

/**
 * Lifecycle Event Configuration
 * 
 * Defines event subscriptions and publications for each lifecycle state.
 * This ensures proper event routing and message handling based on device state.
 */
export const LifecycleEventConfig = {
    [DeviceStates.PRE_SALES]: {
        subscribes: [],
        publishes: [],
        description: 'Minimal event handling - device not yet operational'
    },

    [DeviceStates.FACTORY]: {
        subscribes: [
            'ACCESS_TOKEN_RESPONSE',      // Response from CVIP Access Token service
            'DEVICE_CERT_RESPONSE'        // Response after device certificate creation
        ],
        publishes: [
            'DEVICE_JOINED',              // Notify CVIP of device connection
            'CERT_REQUEST'                // Request device certificate creation
        ],
        description: 'Certificate provisioning events'
    },

    [DeviceStates.PROVISIONED]: {
        subscribes: [
            'TBOX_STATE_UPDATE_COMMAND',  // Command to transition to AUTHORIZED
            'CONFIGURATION_UPDATE'        // Configuration updates from CVIP
        ],
        publishes: [
            'TELEMETRY',                  // Basic telemetry data
            'COMMAND_RESPONSE'            // Responses to CVIP commands
        ],
        description: 'Telemetry enabled, awaiting authorization'
    },

    [DeviceStates.AUTHORIZED]: {
        subscribes: [
            'TBOX_STATE_UPDATE_COMMAND',  // Command to transition to CUSTOMER
            'CONFIGURATION_UPDATE',
            'REMOTE_COMMAND'              // Remote commands (lock, unlock, etc.)
        ],
        publishes: [
            'TELEMETRY',
            'ALERTS',                     // Alert events now enabled
            'TRIP_DATA',
            'COMMAND_RESPONSE'
        ],
        description: 'Full functionality enabled, ready for customer activation'
    },

    [DeviceStates.CUSTOMER]: {
        subscribes: [
            'CSR_ACCESS_TOKEN_RESPONSE',  // Customer Service Representative access token responses
            'TBOX_STATE_UPDATE_COMMAND',
            'CONFIGURATION_UPDATE',
            'REMOTE_COMMAND',
            'FOTA_UPDATE'                 // Firmware Over-The-Air updates
        ],
        publishes: [
            'IMEI_CSR_ACCESS_REQUEST',    // Publish IMEI for CSR access requests
            'TELEMETRY',
            'ALERTS',
            'TRIP_DATA',
            'DRIVING_SCORE',
            'COMMAND_RESPONSE',
            'EMERGENCY_ALERT'             // SOS, crash detection, etc.
        ],
        description: 'Production state - full event handling for customer use'
    }
};

// ============================================
// ALL AVAILABLE FACTS FOR RULE BUILDER
// ============================================
export const AvailableFacts = [
    // Sensor Data
    { name: 'speed', label: 'Speed (km/h)', type: 'number', category: 'sensor' },
    { name: 'ignition', label: 'Ignition (ON/OFF)', type: 'boolean', category: 'state' },
    { name: 'engineTemp', label: 'Engine Temp (°C)', type: 'number', category: 'sensor' },
    { name: 'fuelLevel', label: '% Fuel Level', type: 'number', category: 'sensor' },
    { name: 'rpm', label: 'RPM', type: 'number', category: 'sensor' },
    { name: 'isLive', label: 'Is Alert Live', type: 'boolean', category: 'event' },
    { name: 'batteryVoltage', label: 'Battery Voltage (V)', type: 'number', category: 'sensor' },
    { name: 'geoFenceStatus', label: 'Geo Fence (INSIDE/OUTSIDE)', type: 'string', category: 'sensor' },

    // SouthBound Interface Variables
    { name: 'vehicleId', label: 'VIN', type: 'string', category: 'device' },
    { name: 'imeiNo', label: 'IMEI', type: 'string', category: 'device' },
    { name: 'tboxOperatingState', label: 'Operating State (NORMAL/SLEEP)', type: 'string', category: 'state' },
    { name: 'tboxApplicationState', label: 'App State (FACTORY/PROVISIONED...)', type: 'string', category: 'state' },
    { name: 'tboxeSimState', label: 'eSIM State', type: 'string', category: 'state' },
    { name: 'journeyId', label: 'Trip ID', type: 'string', category: 'variable' },
    { name: 'alertType', label: 'Alert Type', type: 'string', category: 'event' },
    { name: 'commandType', label: 'Command Type', type: 'string', category: 'event' },
    { name: 'harshAccCnt', label: 'Harsh Accel Count', type: 'number', category: 'trip' },
    { name: 'hardBrakeCnt', label: 'Hard Brake Count', type: 'number', category: 'trip' },
    { name: 'idlingCnt', label: 'Idling Count', type: 'number', category: 'trip' },
    { name: 'idleDuration', label: 'Idle Duration (min)', type: 'number', category: 'trip' },
    { name: 'tripType', label: 'Trip Type (Active/Idle)', type: 'string', category: 'trip' },


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
    // Hardware/Firmware Specific
    { name: 'gasPedal', label: 'Gas Pedal (%)', type: 'number', category: 'sensor' },
    { name: 'brakeActive', label: 'Brake Active', type: 'boolean', category: 'sensor' },
    { name: 'engineMilStat', label: 'MIL Status', type: 'number', category: 'sensor' },

    // TE-01 Specific CAN Aliases (for spec compliance)
    { name: 'DRV_CLUSTER_DSPEED', label: 'Cluster Speed (CAN)', type: 'number', category: 'sensor' },
    { name: 'EFCMNT_PDLE_ACCEL', label: 'Accel Pedal (CAN)', type: 'number', category: 'sensor' },
    { name: 'CONTACT_FREIN1', label: 'Brake Contact (CAN)', type: 'boolean', category: 'sensor' },
    { name: 'KEY_POS', label: 'Key Position (CAN)', type: 'number', category: 'state' },
    { name: 'ETAT_MT', label: 'Engine State (CAN)', type: 'number', category: 'state' },
    { name: 'TowCondition', label: 'Tow Condition (Flag)', type: 'number', category: 'state' },
    { name: 'MovDetect', label: 'Motion Detect (Flag)', type: 'number', category: 'state' },

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
    },
    {
        id: 'm6-hard-accel',
        name: 'M6 Harsh Acceleration',
        conditions: {
            all: [
                { fact: 'speed', operator: '>', value: 20 },
                { fact: 'gasPedal', operator: '>', value: 30 }
            ]
        },
        event: {
            type: 'alert',
            message: 'Harsh Acceleration Detected (Pedal > 30%)',
            severity: 'warning',
            alertDetails: { type: 'HARD_ACCELERATION', code: 'HA01' }
        }
    },
    {
        id: 'm6-hard-brake',
        name: 'M6 Harsh Braking',
        conditions: {
            all: [
                { fact: 'brakeActive', operator: '==', value: true },
                { fact: 'speed', operator: '>', value: 10 }
            ]
        },
        event: {
            type: 'alert',
            message: 'Harsh Braking Detected (Brake ON)',
            severity: 'warning',
            alertDetails: { type: 'HARD_BRAKING', code: 'HB01' }
        }
    },
    {
        id: 'm6-device-removal',
        name: 'Device Removal',
        conditions: {
            all: [
                { fact: 'alertType', operator: '==', value: 'DEVICE_REMOVAL' }
            ]
        },
        event: {
            type: 'security_alert',
            message: 'DEVICE REMOVAL DETECTED!',
            severity: 'critical',
            alertDetails: { type: 'DEVICE_REMOVAL', code: 'DR01' }
        }
    },
    {
        id: 'm6-towing',
        name: 'Towing Alert',
        conditions: {
            all: [
                { fact: 'ignition', operator: '==', value: false },
                { fact: 'speed', operator: '>', value: 10 }
            ]
        },
        event: {
            type: 'theft_alert',
            message: 'Towing Detected! (Moving while Ign OFF)',
            severity: 'critical',
            alertDetails: { type: 'TOWING', code: 'TW01' }
        }
    },
    {
        id: 'm6-sos',
        name: 'SOS Panic',
        conditions: {
            all: [
                { fact: 'alertType', operator: '==', value: 'SOS' }
            ]
        },
        event: {
            type: 'emergency_alert',
            message: 'SOS PANIC BUTTON PRESSED!',
            severity: 'critical',
            alertDetails: { type: 'SOS', code: 'EM01' }
        }
    },
    // ============================================
    // TE-01 Section 14: Vehicle Alerts & Events
    // ============================================
    // 14.1 Vehicle Alerts
    {
        id: 'alert-ignition-on',
        name: 'Ignition ON Alert',
        conditions: {
            all: [
                { fact: 'ignition', operator: '==', value: true }
            ]
        },
        event: {
            type: 'vehicle_event',
            message: 'Vehicle Ignition turned ON',
            severity: 'info',
            alertDetails: { type: 'IGNITION_ON', code: 'VE01', category: 'Vehicle Event' }
        }
    },
    {
        id: 'alert-ignition-off',
        name: 'Ignition OFF Alert',
        conditions: {
            all: [
                { fact: 'ignition', operator: '==', value: false }
            ]
        },
        event: {
            type: 'vehicle_event',
            message: 'Vehicle Ignition turned OFF',
            severity: 'info',
            alertDetails: { type: 'IGNITION_OFF', code: 'VE02', category: 'Vehicle Event' }
        }
    },
    {
        id: 'alert-overspeed',
        name: 'Overspeed Alert',
        conditions: {
            all: [
                { fact: 'speed', operator: '>', value: 120 }
            ]
        },
        event: {
            type: 'vehicle_alert',
            message: 'Vehicle exceeding speed limit (>120 km/h)',
            severity: 'warning',
            alertDetails: { type: 'OVERSPEED', code: 'VA01', category: 'Vehicle Alert' }
        }
    },
    {
        id: 'alert-harsh-acceleration',
        name: 'Harsh Acceleration Alert',
        conditions: {
            all: [
                { fact: 'harshAccCnt', operator: '>', value: 0 }
            ]
        },
        event: {
            type: 'vehicle_alert',
            message: 'Harsh acceleration detected',
            severity: 'warning',
            alertDetails: { type: 'HARSH_ACCELERATION', code: 'VA02', category: 'Vehicle Alert' }
        }
    },
    {
        id: 'alert-harsh-braking',
        name: 'Harsh Braking Alert',
        conditions: {
            all: [
                { fact: 'hardBrakeCnt', operator: '>', value: 0 }
            ]
        },
        event: {
            type: 'vehicle_alert',
            message: 'Harsh braking detected',
            severity: 'warning',
            alertDetails: { type: 'HARSH_BRAKING', code: 'VA03', category: 'Vehicle Alert' }
        }
    },
    {
        id: 'alert-harsh-cornering',
        name: 'Harsh Cornering Alert',
        conditions: {
            all: [
                { fact: 'harshTurnCnt', operator: '>', value: 0 }
            ]
        },
        event: {
            type: 'vehicle_alert',
            message: 'Harsh cornering detected',
            severity: 'warning',
            alertDetails: { type: 'HARSH_CORNERING', code: 'VA04', category: 'Vehicle Alert' }
        }
    },
    {
        id: 'alert-idling',
        name: 'Excessive Idling Alert',
        conditions: {
            all: [
                { fact: 'idleDuration', operator: '>', value: 10 }
            ]
        },
        event: {
            type: 'vehicle_alert',
            message: 'Excessive idling detected (>10 minutes)',
            severity: 'info',
            alertDetails: { type: 'EXCESSIVE_IDLING', code: 'VA05', category: 'Vehicle Alert' }
        }
    },
    // 14.2 Emergency & Safety Alerts
    {
        id: 'alert-crash',
        name: 'Crash Detection Alert',
        conditions: {
            all: [
                { fact: 'crashDetected', operator: '==', value: true }
            ]
        },
        event: {
            type: 'emergency_alert',
            message: 'CRASH DETECTED - Emergency services notified',
            severity: 'critical',
            alertDetails: { type: 'CRASH', code: 'ES01', category: 'Emergency & Safety' }
        }
    },
    {
        id: 'alert-sos-panic',
        name: 'SOS Panic Button Alert',
        conditions: {
            all: [
                { fact: 'alertType', operator: '==', value: 'SOS' }
            ]
        },
        event: {
            type: 'emergency_alert',
            message: 'SOS PANIC BUTTON PRESSED',
            severity: 'critical',
            alertDetails: { type: 'SOS_PANIC', code: 'ES02', category: 'Emergency & Safety' }
        }
    },
    {
        id: 'alert-towing',
        name: 'Towing Detection Alert',
        conditions: {
            all: [
                { fact: 'ignition', operator: '==', value: false },
                { fact: 'speed', operator: '>', value: 5 }
            ]
        },
        event: {
            type: 'security_alert',
            message: 'Vehicle towing detected (moving while ignition OFF)',
            severity: 'critical',
            alertDetails: { type: 'TOWING', code: 'ES03', category: 'Emergency & Safety' }
        }
    },
    {
        id: 'alert-geofence-entry',
        name: 'Geofence Entry Alert',
        conditions: {
            all: [
                { fact: 'geoFenceStatus', operator: '==', value: 'INSIDE' }
            ]
        },
        event: {
            type: 'vehicle_alert',
            message: 'Vehicle entered geofence zone',
            severity: 'info',
            alertDetails: { type: 'GEOFENCE_ENTRY', code: 'VA06', category: 'Vehicle Alert' }
        }
    },
    {
        id: 'alert-geofence-exit',
        name: 'Geofence Exit Alert',
        conditions: {
            all: [
                { fact: 'geoFenceStatus', operator: '==', value: 'OUTSIDE' }
            ]
        },
        event: {
            type: 'vehicle_alert',
            message: 'Vehicle exited geofence zone',
            severity: 'warning',
            alertDetails: { type: 'GEOFENCE_EXIT', code: 'VA07', category: 'Vehicle Alert' }
        }
    },
    // 14.3 Diagnostic Alerts
    {
        id: 'alert-low-battery',
        name: 'Low Battery Alert',
        conditions: {
            all: [
                { fact: 'batteryVoltage', operator: '<', value: 11.5 }
            ]
        },
        event: {
            type: 'diagnostic_alert',
            message: 'Low battery voltage detected (<11.5V)',
            severity: 'warning',
            alertDetails: { type: 'LOW_BATTERY', code: 'DA01', category: 'Diagnostic Alert' }
        }
    },
    {
        id: 'alert-critical-battery',
        name: 'Critical Battery Alert',
        conditions: {
            all: [
                { fact: 'batteryVoltage', operator: '<', value: 11.0 }
            ]
        },
        event: {
            type: 'diagnostic_alert',
            message: 'Critical battery voltage (<11V) - Remote commands disabled',
            severity: 'critical',
            alertDetails: { type: 'CRITICAL_BATTERY', code: 'DA02', category: 'Diagnostic Alert' }
        }
    },
    {
        id: 'alert-mil-active',
        name: 'MIL (Check Engine) Alert',
        conditions: {
            all: [
                { fact: 'engineMilStat', operator: '>', value: 0 }
            ]
        },
        event: {
            type: 'diagnostic_alert',
            message: 'Malfunction Indicator Lamp (MIL) is active',
            severity: 'warning',
            alertDetails: { type: 'MIL_ACTIVE', code: 'DA03', category: 'Diagnostic Alert' }
        }
    },
    {
        id: 'alert-engine-overheat',
        name: 'Engine Overheating Alert',
        conditions: {
            all: [
                { fact: 'engineTemp', operator: '>', value: 110 }
            ]
        },
        event: {
            type: 'diagnostic_alert',
            message: 'Engine temperature critical (>110°C)',
            severity: 'critical',
            alertDetails: { type: 'ENGINE_OVERHEAT', code: 'DA04', category: 'Diagnostic Alert' }
        }
    },
    {
        id: 'alert-low-fuel',
        name: 'Low Fuel Alert',
        conditions: {
            all: [
                { fact: 'fuelLevel', operator: '<', value: 10 }
            ]
        },
        event: {
            type: 'diagnostic_alert',
            message: 'Low fuel level (<10%)',
            severity: 'warning',
            alertDetails: { type: 'LOW_FUEL', code: 'DA05', category: 'Diagnostic Alert' }
        }
    },
    {
        id: 'alert-device-removal',
        name: 'Device Removal Alert',
        conditions: {
            all: [
                { fact: 'alertType', operator: '==', value: 'DEVICE_REMOVAL' }
            ]
        },
        event: {
            type: 'security_alert',
            message: 'Device tampering/removal detected',
            severity: 'critical',
            alertDetails: { type: 'DEVICE_REMOVAL', code: 'SA01', category: 'Security Alert' }
        }
    },
    {
        id: 'alert-device-reconnect',
        name: 'Device Reconnection Alert',
        conditions: {
            all: [
                { fact: 'alertType', operator: '==', value: 'DEVICE_RECONNECT' }
            ]
        },
        event: {
            type: 'security_alert',
            message: 'Device reconnected after removal',
            severity: 'warning',
            alertDetails: { type: 'DEVICE_RECONNECT', code: 'SA02', category: 'Security Alert' }
        }
    },
    // TE-01 Specification Alerts (Sno 3, 10, 14, 16, 17, 19, 20, 21)
    {
        id: 'te01-overspeed-80',
        name: 'SpeedAlert (80km/h)',
        description: 'Alert triggered when vehicle cluster speed exceeds 80 km/h',
        conditions: {
            all: [
                { fact: 'DRV_CLUSTER_DSPEED', operator: '>', value: 80 }
            ]
        },
        event: {
            type: 'general',
            message: 'OverspeedAlert_80 generated (Speed > 80km/h)',
            severity: 'warning',
            alertDetails: { type: 'SPEED_ALERT_80', code: 'VA31', category: 'General' }
        }
    },
    {
        id: 'te01-overspeed-120',
        name: 'SpeedAlert (120km/h)',
        description: 'Alert triggered when vehicle cluster speed exceeds 120 km/h',
        conditions: {
            all: [
                { fact: 'DRV_CLUSTER_DSPEED', operator: '>', value: 120 }
            ]
        },
        event: {
            type: 'general',
            message: 'OverspeedAlert_120 generated (Speed > 120km/h)',
            severity: 'critical',
            alertDetails: { type: 'SPEED_ALERT_120', code: 'VA31', category: 'General' }
        }
    },
    {
        id: 'te01-tow-away',
        name: 'TowAwayAlert',
        description: 'Alert generated if vehicle is towed (motion detected while parked)',
        conditions: {
            all: [
                { fact: 'TowCondition', operator: '==', value: 1 }
            ]
        },
        event: {
            type: 'security_alert',
            message: 'TowAlert generated: Vehicle movement detected while ignition OFF',
            severity: 'critical',
            alertDetails: { type: 'TOW_AWAY', code: 'VA40', category: 'Critical' }
        }
    },
    {
        id: 'te01-engine-idling',
        name: 'Engine Idling Alert',
        description: 'Alert triggered when engine is ON but vehicle is stationary',
        conditions: {
            all: [
                { fact: 'ETAT_MT', operator: '==', value: 3 },
                { fact: 'DRV_CLUSTER_DSPEED', operator: '==', value: 0 },
                { fact: 'idleDuration', operator: '>', value: 3 }
            ]
        },
        event: {
            type: 'general',
            message: 'Engine Idling Alert: Engine ON for > 3 minutes while stationary',
            severity: 'warning',
            alertDetails: { type: 'ENGINE_IDLING', code: 'VA14', category: 'General' }
        }
    },
    {
        id: 'te01-parking-disturbance',
        name: 'Parking Disturbance Alert',
        description: 'Alert triggered if vehicle is moved while in parking condition',
        conditions: {
            all: [
                { fact: 'MovDetect', operator: '==', value: 1 }
            ]
        },
        event: {
            type: 'security_alert',
            message: 'MovDetectAlert generated: Vehicle disturbance detected',
            severity: 'critical',
            alertDetails: { type: 'PARKING_DISTURBANCE', code: 'VA39', category: 'Critical' }
        }
    },
    {
        id: 'te01-dongle-status',
        name: 'DongleStatusAlert',
        description: 'Alert triggered when the dongle status is disconnected (Operating State = 1)',
        conditions: {
            all: [
                { fact: 'tboxOperatingState', operator: '==', value: 'DISCONNECTED' }
            ]
        },
        event: {
            type: 'diagnostic_alert',
            message: 'DongleStatusAlert generated: Device disconnected',
            severity: 'critical',
            alertDetails: { type: 'DONGLE_DISCONNECTED', code: 'VA43', category: 'Critical' }
        }
    },
    {
        id: 'te01-harsh-acc',
        name: 'Harsh Acceleration Alert',
        description: 'Alert if vehicle is driven in rash manner (Acc/t > Threshold)',
        conditions: {
            all: [
                { fact: 'EFCMNT_PDLE_ACCEL', operator: '>', value: 30 }
            ]
        },
        event: {
            type: 'general',
            message: 'HarshAccAlert generated: Rapid acceleration detected',
            severity: 'warning',
            alertDetails: { type: 'HARSH_ACCEL', code: 'VA48', category: 'General' }
        }
    },
    {
        id: 'te01-harsh-brake',
        name: 'Harsh Brake Alert',
        description: 'Alert if vehicle is driven in rash manner (Decel/t > Threshold)',
        conditions: {
            all: [
                { fact: 'CONTACT_FREIN1', operator: '==', value: 1 }
            ]
        },
        event: {
            type: 'general',
            message: 'HarshBrakeAlert generated: Sudden deceleration detected',
            severity: 'warning',
            alertDetails: { type: 'HARSH_BRAKE', code: 'VA49', category: 'General' }
        }
    },
    {
        id: 'te01-low-battery',
        name: 'Low Battery Alert',
        description: 'Alert triggered when vehicle/dongle battery voltage is low (< 11.5V)',
        conditions: {
            all: [
                { fact: 'batteryVoltage', operator: '<', value: 11.5 }
            ]
        },
        event: {
            type: 'diagnostic_alert',
            message: 'LowBatteryAlert generated: Battery voltage critical (< 11.5V)',
            severity: 'warning',
            alertDetails: { type: 'LOW_BATTERY', code: 'VA16', category: 'Diagnostic' }
        }
    },
    {
        id: 'te01-device-removal',
        name: 'Device Removal Alert',
        description: 'Alert triggered when the dongle is unplugged or loses power abruptly',
        conditions: {
            all: [
                { fact: 'isDeviceRemoved', operator: '==', value: true }
            ]
        },
        event: {
            type: 'security_alert',
            message: 'DeviceRemovalAlert generated: Dongle unplugged or power lost',
            severity: 'critical',
            alertDetails: { type: 'DEVICE_REMOVAL', code: 'VA05', category: 'Security' }
        }
    }
];
// ============================================
// DEFAULT LIFECYCLE RULES (Section 2 Spec)
// ============================================

/**
 * Default Lifecycle Rules
 * 
 * Defines subsystems, allowed actions, and authentication requirements for each lifecycle state.
 * These rules control what functionality is available at each stage of the device lifecycle.
 * 
 * Key Concepts:
 * - Identity: How the device identifies itself to CVIP (IMEI, VIN, or MSISDN)
 * - Subsystems: Which hardware/software subsystems are enabled
 * - Allowed Actions: What operations the device can perform
 * - Authentication: Certificate and token requirements for CVIP communication
 */
export const DefaultLifecycleRules = {
    [DeviceStates.PRE_SALES]: {
        identity: 'IMEI',
        subsystems: { CAN: false, GPS: false, GSM: true, Telemetry: false, Alerts: false },
        allowedActions: { vinDecoding: false, certDownload: false, telemetryPublish: false },
        authentication: {
            certificateType: 'none',
            requiresAccessToken: false,
            cvipConnectionState: 'disconnected'
        },
        description: 'Minimal functionality - device not yet manufactured'
    },
    [DeviceStates.FACTORY]: {
        identity: 'IMEI',
        subsystems: { CAN: true, GPS: true, GSM: true, Telemetry: false, Alerts: false },
        allowedActions: { vinDecoding: true, certDownload: true, telemetryPublish: false },
        authentication: {
            certificateType: 'common',
            requiresAccessToken: true,
            cvipConnectionState: 'connecting',
            accessTokenPurpose: 'Device certificate creation',
            accessTokenSource: 'Access Token service + CVIP bundle'
        },
        description: 'Post-manufacturing - uses common certificates to bootstrap device-specific certificates'
    },
    [DeviceStates.PROVISIONED]: {
        identity: 'VIN',
        subsystems: { CAN: true, GPS: true, GSM: true, Telemetry: true, Alerts: false },
        allowedActions: { vinDecoding: true, certDownload: true, telemetryPublish: true },
        authentication: {
            certificateType: 'device-specific',
            requiresAccessToken: false,
            cvipConnectionState: 'connected',
            certificateValidation: 'All CVIP commands validated using device certificates'
        },
        description: 'Device authenticated with CVIP - telemetry enabled, awaiting authorization'
    },
    [DeviceStates.AUTHORIZED]: {
        identity: 'VIN',
        subsystems: { CAN: true, GPS: true, GSM: true, Telemetry: true, Alerts: true },
        allowedActions: { vinDecoding: true, certDownload: true, telemetryPublish: true },
        authentication: {
            certificateType: 'device-specific',
            requiresAccessToken: false,
            cvipConnectionState: 'connected',
            certificateValidation: 'All CVIP commands validated using device certificates',
            commandSigning: 'CVIP commands must be signed with CVIP private key'
        },
        description: 'Fully authorized - all subsystems enabled, ready for customer activation'
    },
    [DeviceStates.CUSTOMER]: {
        identity: 'MSISDN',
        subsystems: { CAN: true, GPS: true, GSM: true, Telemetry: true, Alerts: true },
        allowedActions: { vinDecoding: true, certDownload: true, telemetryPublish: true },
        authentication: {
            certificateType: 'device-specific',
            requiresAccessToken: false,
            cvipConnectionState: 'connected',
            certificateValidation: 'All CVIP commands validated using device certificates',
            commandSigning: 'CVIP commands must be signed with CVIP private key',
            identityFallback: 'Falls back to VehicleId if MSISDN not assigned'
        },
        description: 'Production state - full functionality for customer use'
    }
};
