import { 
    Car, Activity, Sun, Factory, Building, Wind, Droplets, Map, Home, 
    Watch, Zap, Radio, Shield, Thermometer, Box, Lightbulb, Heart, Wifi
} from 'lucide-react';

/**
 * DomainConfig.js — Multi-Domain IoT Rule Engine
 * Defines signal facts, default rules, simulation data, and UI metadata
 * for each supported IoT domain.
 *
 * To add a new domain: copy a domain block, update the keys,
 * and import it in RuleEngineDashboard.jsx.
 */

// ─── OPERATORS (shared across all domains) ────────────────────────────────────
export const OPERATORS = [
    { value: '>', label: 'Greater than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<', label: 'Less than' },
    { value: '<=', label: 'Less than or equal' },
    { value: '==', label: 'Equal to' },
    { value: '!=', label: 'Not equal to' },
    { value: 'contains', label: 'Contains' },
    { value: 'between', label: 'Between (use format: min,max)' },
];

// ─── DOMAIN REGISTRY ──────────────────────────────────────────────────────────
// Each domain has: id, label, icon, color, description,
//   facts[], defaultRules[], simulationSeed(), streamPayloadFn()

export const DOMAINS = {

    // ════════════════════════════════════════════════════════════════
    // 1. JEEP PROTO 5.0 (Advanced Off-Road & 4xe Hybrid)
    // ════════════════════════════════════════════════════════════════
    jeep_proto_5: {
        id: 'jeep_proto_5',
        label: 'Jeep Proto 5.0',
        icon: Car,
        color: { scheme: 'blue', hex: '#0047AB', light: '#E6F0FF' },
        description: 'Advanced off-road telematics, 4xe Hybrid heuristics, and trail monitoring',
        deviceLabel: 'VIN',
        devicePlaceholder: '1J4GR48356P77XXXX',

        facts: [
            { name: 'pitch', label: 'Vehicle Pitch (deg)', type: 'number', category: 'offroad', unit: '°', min: -45, max: 45 },
            { name: 'roll', label: 'Vehicle Roll (deg)', type: 'number', category: 'offroad', unit: '°', min: -45, max: 45 },
            { name: 'wadingDepth', label: 'Wading Depth (mm)', type: 'number', category: 'offroad', unit: 'mm', min: 0, max: 1000 },
            { name: 'hybridBattery', label: '4xe Battery SOC (%)', type: 'number', category: 'hybrid', unit: '%', min: 0, max: 100 },
            { name: 'fuelRange', label: 'Fuel Range (km)', type: 'number', category: 'hybrid', unit: 'km', min: 0, max: 800 },
            { name: 'tCaseStatus', label: 'Transfer Case', type: 'string', category: 'drivetrain', unit: '' },
            { name: 'diffLockFront', label: 'Front Locker', type: 'boolean', category: 'drivetrain', unit: '' },
            { name: 'diffLockRear', label: 'Rear Locker', type: 'boolean', category: 'drivetrain', unit: '' },
            { name: 'swayBarDisconnected', label: 'Sway Bar Disc.', type: 'boolean', category: 'drivetrain', unit: '' },
            { name: 'coolantTemp', label: 'Engine Coolant (°C)', type: 'number', category: 'thermal', unit: '°C', min: 0, max: 130 },
            { name: 'transmissionTemp', label: 'Trans. Oil Temp (°C)', type: 'number', category: 'thermal', unit: '°C', min: 0, max: 150 },
            { name: 'tirePressure', label: 'Avg Tire Pressure (psi)', type: 'number', category: 'sensor', unit: 'psi', min: 10, max: 50 },
            { name: 'altitude', label: 'Altitude (m)', type: 'number', category: 'gps', unit: 'm', min: -100, max: 5000 },
            { name: 'trailGuidance', label: 'Trail Guidance Active', type: 'boolean', category: 'gps', unit: '' },
        ],

        simulateSeed: () => ({
            pitch: parseFloat((-15 + Math.random() * 30).toFixed(1)),
            roll: parseFloat((-15 + Math.random() * 30).toFixed(1)),
            wadingDepth: Math.round(Math.random() * 400),
            hybridBattery: Math.round(10 + Math.random() * 90),
            fuelRange: Math.round(50 + Math.random() * 450),
            tCaseStatus: Math.random() > 0.5 ? '4LO' : '4HI',
            diffLockFront: Math.random() > 0.8,
            diffLockRear: Math.random() > 0.7,
            swayBarDisconnected: Math.random() > 0.8,
            coolantTemp: Math.round(85 + Math.random() * 25),
            transmissionTemp: Math.round(75 + Math.random() * 40),
            tirePressure: Math.round(18 + Math.random() * 15),
            altitude: Math.round(200 + Math.random() * 1200),
            trailGuidance: true,
        }),

        defaultRules: [
            {
                id: 'jeep-roll-limit', name: 'Roll Threshold Warning',
                conditions: { all: [{ fact: 'roll', operator: '>', value: 25 }] },
                event: { type: 'safety', message: 'Vehicle Roll angle exceeds safety limit (>25°)', severity: 'critical' }
            },
            {
                id: 'jeep-pitch-limit', name: 'Pitch Threshold Warning',
                conditions: { all: [{ fact: 'pitch', operator: '>', value: 30 }] },
                event: { type: 'safety', message: 'Vehicle Pitch angle exceeds safety limit (>30°)', severity: 'warning' }
            },
            {
                id: 'jeep-deep-water', name: 'Deep Wading Alert',
                conditions: { all: [{ fact: 'wadingDepth', operator: '>', value: 760 }] },
                event: { type: 'safety', message: 'Water depth exceeds 760mm — critical wading hazard', severity: 'critical' }
            },
            {
                id: 'jeep-low-hybrid', name: '4xe Low Battery',
                conditions: { all: [{ fact: 'hybridBattery', operator: '<', value: 15 }] },
                event: { type: 'hybrid', message: '4xe Battery below 15% — switching to ICE focus', severity: 'warning' }
            },
            {
                id: 'jeep-diff-locker', name: 'Locker Misalignment',
                conditions: { all: [{ fact: 'diffLockFront', operator: '==', value: true }] },
                event: { type: 'drivetrain', message: 'Front locker engaged — ensure low speed operation', severity: 'info' }
            },
            {
                id: 'jeep-transmission-heat', name: 'Transmission Overheat',
                conditions: { all: [{ fact: 'transmissionTemp', operator: '>', value: 115 }] },
                event: { type: 'thermal_alert', message: 'Transmission temperature critical (>115°C)', severity: 'critical' }
            },
        ],

        gauges: [
            { fact: 'hybridBattery', label: 'Battery', unit: '%', max: 100, color: '#10B981', warningAt: 20, invertAlert: true },
            { fact: 'pitch', label: 'Pitch', unit: '°', max: 45, color: '#F59E0B', warningAt: 25 },
            { fact: 'roll', label: 'Roll', unit: '°', max: 45, color: '#EF4444', warningAt: 20 },
            { fact: 'wadingDepth', label: 'Water Depth', unit: 'mm', max: 1000, color: '#3B6FE8', warningAt: 700 },
            { fact: 'tirePressure', label: 'PSI', unit: 'psi', max: 50, color: '#6366F1', warningAt: 18, invertAlert: true },
        ],
    },



    // ════════════════════════════════════════════════════════════════
    // 2. MEDICAL DEVICE
    // ════════════════════════════════════════════════════════════════
    medical: {
        id: 'medical',
        label: 'Medical Device',
        icon: Activity,
        color: { scheme: 'red', hex: '#E53E3E', light: '#FFF5F5' },
        description: 'Patient vitals monitoring, ICU alerts, infusion pumps, wearable health sensors',
        deviceLabel: 'Device ID',
        devicePlaceholder: 'MED-ICU-BED-42',

        facts: [
            { name: 'heartRate', label: 'Heart Rate (bpm)', type: 'number', category: 'vitals', unit: 'bpm', min: 30, max: 220 },
            { name: 'bloodPressureSys', label: 'Systolic BP (mmHg)', type: 'number', category: 'vitals', unit: 'mmHg', min: 60, max: 200 },
            { name: 'bloodPressureDia', label: 'Diastolic BP (mmHg)', type: 'number', category: 'vitals', unit: 'mmHg', min: 40, max: 130 },
            { name: 'spO2', label: 'SpO2 / Oxygen Sat (%)', type: 'number', category: 'vitals', unit: '%', min: 85, max: 100 },
            { name: 'temperature', label: 'Body Temperature (°C)', type: 'number', category: 'vitals', unit: '°C', min: 35, max: 42 },
            { name: 'respirationRate', label: 'Respiration Rate (/min)', type: 'number', category: 'vitals', unit: '/min', min: 8, max: 40 },
            { name: 'glucoseLevel', label: 'Blood Glucose (mg/dL)', type: 'number', category: 'vitals', unit: 'mg/dL', min: 60, max: 400 },
            { name: 'ecgAmplitude', label: 'ECG Amplitude (mV)', type: 'number', category: 'sensor', unit: 'mV', min: -2, max: 2 },
            { name: 'patientMotion', label: 'Patient Motion Detected', type: 'boolean', category: 'state', unit: '' },
            { name: 'batteryLevel', label: 'Device Battery (%)', type: 'number', category: 'device', unit: '%', min: 0, max: 100 },
            { name: 'alarmSilenced', label: 'Alarm Silenced', type: 'boolean', category: 'state', unit: '' },
            { name: 'leadDisconnected', label: 'Lead Disconnected', type: 'boolean', category: 'safety', unit: '' },
            { name: 'infusionRate', label: 'Infusion Rate (mL/hr)', type: 'number', category: 'therapy', unit: 'mL/hr', min: 0, max: 500 },
            { name: 'painScore', label: 'Pain Score (0–10)', type: 'number', category: 'vitals', unit: '', min: 0, max: 10 },
        ],

        simulateSeed: () => ({
            heartRate: Math.round(55 + Math.random() * 90),
            bloodPressureSys: Math.round(100 + Math.random() * 70),
            bloodPressureDia: Math.round(60 + Math.random() * 50),
            spO2: parseFloat((94 + Math.random() * 6).toFixed(1)),
            temperature: parseFloat((36.0 + Math.random() * 2.5).toFixed(1)),
            respirationRate: Math.round(12 + Math.random() * 16),
            glucoseLevel: Math.round(80 + Math.random() * 180),
            ecgAmplitude: parseFloat((-0.5 + Math.random()).toFixed(3)),
            patientMotion: Math.random() > 0.7,
            batteryLevel: Math.round(20 + Math.random() * 80),
            alarmSilenced: false,
            leadDisconnected: Math.random() > 0.95,
            infusionRate: Math.round(Math.random() * 120),
            painScore: Math.round(Math.random() * 8),
        }),

        defaultRules: [
            {
                id: 'med-tachycardia', name: 'Tachycardia Alert',
                conditions: { all: [{ fact: 'heartRate', operator: '>', value: 100 }] },
                event: { type: 'vitals_alert', message: 'Tachycardia: Heart rate >100 bpm', severity: 'warning' }
            },
            {
                id: 'med-bradycardia', name: 'Bradycardia Alert',
                conditions: { all: [{ fact: 'heartRate', operator: '<', value: 50 }] },
                event: { type: 'vitals_alert', message: 'Bradycardia: Heart rate <50 bpm', severity: 'critical' }
            },
            {
                id: 'med-low-spo2', name: 'Low Oxygen Saturation',
                conditions: { all: [{ fact: 'spO2', operator: '<', value: 94 }] },
                event: { type: 'vitals_alert', message: '🚨 SpO2 below 94% — check patient airway', severity: 'critical' }
            },
            {
                id: 'med-high-bp', name: 'Hypertension Crisis',
                conditions: { all: [{ fact: 'bloodPressureSys', operator: '>', value: 160 }] },
                event: { type: 'vitals_alert', message: 'Systolic BP >160 mmHg — hypertension crisis', severity: 'critical' }
            },
            {
                id: 'med-fever', name: 'High Fever',
                conditions: { all: [{ fact: 'temperature', operator: '>', value: 38.5 }] },
                event: { type: 'vitals_alert', message: 'Fever detected: Temperature >38.5°C', severity: 'warning' }
            },
            {
                id: 'med-hypoglycemia', name: 'Hypoglycemia Alert',
                conditions: { all: [{ fact: 'glucoseLevel', operator: '<', value: 70 }] },
                event: { type: 'therapy', message: 'Blood glucose critically low (<70 mg/dL)', severity: 'critical' }
            },
            {
                id: 'med-lead-off', name: 'Lead Disconnected',
                conditions: { all: [{ fact: 'leadDisconnected', operator: '==', value: true }] },
                event: { type: 'device_alert', message: 'ECG lead disconnected — check patient connections', severity: 'warning' }
            },
            {
                id: 'med-battery', name: 'Device Low Battery',
                conditions: { all: [{ fact: 'batteryLevel', operator: '<', value: 20 }] },
                event: { type: 'device_alert', message: 'Medical device battery below 20%', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'heartRate', label: 'Heart Rate', unit: 'bpm', max: 200, color: '#E53E3E', warningAt: 100 },
            { fact: 'spO2', label: 'SpO2', unit: '%', max: 100, color: '#3B6FE8', warningAt: 94, invertAlert: true },
            { fact: 'bloodPressureSys', label: 'Sys BP', unit: 'mmHg', max: 200, color: '#9F7AEA', warningAt: 140 },
            { fact: 'temperature', label: 'Body Temp', unit: '°C', max: 42, color: '#F59E0B', warningAt: 38 },
            { fact: 'glucoseLevel', label: 'Glucose', unit: 'mg/dL', max: 400, color: '#10B981', warningAt: 200 },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 3. SOLAR PANEL AUTOMATION
    // ════════════════════════════════════════════════════════════════
    solar: {
        id: 'solar',
        label: 'Solar Panel Automation',
        icon: Sun,
        color: { scheme: 'yellow', hex: '#D69E2E', light: '#FFFFF0' },
        description: 'Solar array monitoring, inverter health, grid export, battery storage, energy analytics',
        deviceLabel: 'Array ID',
        devicePlaceholder: 'SOLAR-ARRAY-01',

        facts: [
            { name: 'pvVoltage', label: 'PV Panel Voltage (V)', type: 'number', category: 'electrical', unit: 'V', min: 0, max: 600 },
            { name: 'pvCurrent', label: 'PV Panel Current (A)', type: 'number', category: 'electrical', unit: 'A', min: 0, max: 50 },
            { name: 'pvPower', label: 'Solar Power Output (kW)', type: 'number', category: 'electrical', unit: 'kW', min: 0, max: 100 },
            { name: 'inverterTemp', label: 'Inverter Temperature (°C)', type: 'number', category: 'thermal', unit: '°C', min: 0, max: 90 },
            { name: 'batteryChargeLevel', label: 'Battery State of Charge (%)', type: 'number', category: 'storage', unit: '%', min: 0, max: 100 },
            { name: 'batteryVoltage', label: 'Battery Voltage (V)', type: 'number', category: 'storage', unit: 'V', min: 40, max: 60 },
            { name: 'gridPower', label: 'Grid Export Power (kW)', type: 'number', category: 'grid', unit: 'kW', min: -50, max: 50 },
            { name: 'irradiance', label: 'Solar Irradiance (W/m²)', type: 'number', category: 'environmental', unit: 'W/m²', min: 0, max: 1200 },
            { name: 'panelTemp', label: 'Panel Temperature (°C)', type: 'number', category: 'thermal', unit: '°C', min: -10, max: 85 },
            { name: 'gridConnected', label: 'Grid Connected', type: 'boolean', category: 'state', unit: '' },
            { name: 'inverterFault', label: 'Inverter Fault Code', type: 'number', category: 'fault', unit: '', min: 0, max: 99 },
            { name: 'dailyEnergy', label: 'Daily Energy (kWh)', type: 'number', category: 'energy', unit: 'kWh', min: 0, max: 500 },
            { name: 'efficiency', label: 'System Efficiency (%)', type: 'number', category: 'performance', unit: '%', min: 0, max: 100 },
            { name: 'dustIndex', label: 'Panel Dust Index (0–10)', type: 'number', category: 'maintenance', unit: '', min: 0, max: 10 },
        ],

        simulateSeed: () => ({
            pvVoltage: parseFloat((300 + Math.random() * 200).toFixed(1)),
            pvCurrent: parseFloat((Math.random() * 30).toFixed(2)),
            pvPower: parseFloat((Math.random() * 50).toFixed(2)),
            inverterTemp: Math.round(30 + Math.random() * 45),
            batteryChargeLevel: Math.round(20 + Math.random() * 80),
            batteryVoltage: parseFloat((46 + Math.random() * 8).toFixed(1)),
            gridPower: parseFloat((-5 + Math.random() * 40).toFixed(2)),
            irradiance: Math.round(Math.random() * 1000),
            panelTemp: Math.round(25 + Math.random() * 40),
            gridConnected: Math.random() > 0.1,
            inverterFault: Math.random() > 0.95 ? Math.round(Math.random() * 20) : 0,
            dailyEnergy: parseFloat((Math.random() * 200).toFixed(1)),
            efficiency: Math.round(75 + Math.random() * 20),
            dustIndex: parseFloat((Math.random() * 10).toFixed(1)),
        }),

        defaultRules: [
            {
                id: 'solar-inverter-overheat', name: 'Inverter Overheat',
                conditions: { all: [{ fact: 'inverterTemp', operator: '>', value: 75 }] },
                event: { type: 'thermal_alert', message: 'Inverter temperature critical (>75°C) — check cooling', severity: 'critical' }
            },
            {
                id: 'solar-low-battery', name: 'Battery Storage Low',
                conditions: { all: [{ fact: 'batteryChargeLevel', operator: '<', value: 20 }] },
                event: { type: 'storage_alert', message: 'Battery SOC below 20% — grid import may start', severity: 'warning' }
            },
            {
                id: 'solar-grid-disconnect', name: 'Grid Disconnected',
                conditions: { all: [{ fact: 'gridConnected', operator: '==', value: false }] },
                event: { type: 'grid_alert', message: 'Grid disconnected — running on solar + battery only', severity: 'warning' }
            },
            {
                id: 'solar-inverter-fault', name: 'Inverter Fault',
                conditions: { all: [{ fact: 'inverterFault', operator: '>', value: 0 }] },
                event: { type: 'fault', message: 'Inverter fault code detected — service required', severity: 'critical' }
            },
            {
                id: 'solar-low-efficiency', name: 'Low System Efficiency',
                conditions: { all: [{ fact: 'efficiency', operator: '<', value: 70 }] },
                event: { type: 'performance', message: 'System efficiency below 70% — check panels for shading/dust', severity: 'warning' }
            },
            {
                id: 'solar-dirty-panels', name: 'Panels Need Cleaning',
                conditions: { all: [{ fact: 'dustIndex', operator: '>', value: 7 }] },
                event: { type: 'maintenance', message: 'Panel dust index >7 — cleaning recommended', severity: 'info' }
            },
            {
                id: 'solar-panel-overheat', name: 'Panel Overheating',
                conditions: { all: [{ fact: 'panelTemp', operator: '>', value: 75 }] },
                event: { type: 'thermal_alert', message: 'Solar panel temperature >75°C — reduced output expected', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'pvPower', label: 'Solar Output', unit: 'kW', max: 100, color: '#D69E2E' },
            { fact: 'batteryChargeLevel', label: 'Battery SOC', unit: '%', max: 100, color: '#10B981', warningAt: 20, invertAlert: true },
            { fact: 'inverterTemp', label: 'Inverter Temp', unit: '°C', max: 90, color: '#E53E3E', warningAt: 70 },
            { fact: 'irradiance', label: 'Irradiance', unit: 'W/m²', max: 1200, color: '#F59E0B' },
            { fact: 'efficiency', label: 'Efficiency', unit: '%', max: 100, color: '#6366F1', warningAt: 70, invertAlert: true },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 4. INDUSTRIAL IoT
    // ════════════════════════════════════════════════════════════════
    industrial: {
        id: 'industrial',
        label: 'Industrial IoT',
        icon: Factory,
        color: { scheme: 'orange', hex: '#DD6B20', light: '#FFFAF0' },
        description: 'Factory floor sensors, machine health, predictive maintenance, conveyor & CNC monitoring',
        deviceLabel: 'Machine ID',
        devicePlaceholder: 'CNC-PRESS-07',

        facts: [
            { name: 'motorTemp', label: 'Motor Temperature (°C)', type: 'number', category: 'thermal', unit: '°C', min: 0, max: 200 },
            { name: 'vibration', label: 'Vibration (mm/s RMS)', type: 'number', category: 'mechanical', unit: 'mm/s', min: 0, max: 50 },
            { name: 'rpm', label: 'Machine RPM', type: 'number', category: 'mechanical', unit: 'rpm', min: 0, max: 10000 },
            { name: 'pressurePSI', label: 'Hydraulic Pressure (PSI)', type: 'number', category: 'hydraulic', unit: 'PSI', min: 0, max: 5000 },
            { name: 'flowRate', label: 'Coolant Flow Rate (L/min)', type: 'number', category: 'fluid', unit: 'L/min', min: 0, max: 100 },
            { name: 'powerDraw', label: 'Power Draw (kW)', type: 'number', category: 'electrical', unit: 'kW', min: 0, max: 500 },
            { name: 'oilLevel', label: 'Oil Level (%)', type: 'number', category: 'fluid', unit: '%', min: 0, max: 100 },
            { name: 'cycleCount', label: 'Production Cycle Count', type: 'number', category: 'production', unit: 'cycles', min: 0, max: 9999999 },
            { name: 'errorCode', label: 'Error Code', type: 'number', category: 'fault', unit: '', min: 0, max: 999 },
            { name: 'doorOpen', label: 'Safety Door Open', type: 'boolean', category: 'safety', unit: '' },
            { name: 'emergencyStop', label: 'Emergency Stop Pressed', type: 'boolean', category: 'safety', unit: '' },
            { name: 'torque', label: 'Torque (Nm)', type: 'number', category: 'mechanical', unit: 'Nm', min: 0, max: 10000 },
            { name: 'toolWear', label: 'Tool Wear Index (0–100)', type: 'number', category: 'maintenance', unit: '', min: 0, max: 100 },
            { name: 'ambientTemp', label: 'Ambient Temperature (°C)', type: 'number', category: 'environmental', unit: '°C', min: 0, max: 60 },
        ],

        simulateSeed: () => ({
            motorTemp: Math.round(40 + Math.random() * 120),
            vibration: parseFloat((Math.random() * 20).toFixed(2)),
            rpm: Math.round(500 + Math.random() * 4000),
            pressurePSI: Math.round(500 + Math.random() * 3000),
            flowRate: parseFloat((5 + Math.random() * 60).toFixed(1)),
            powerDraw: parseFloat((10 + Math.random() * 200).toFixed(1)),
            oilLevel: Math.round(30 + Math.random() * 70),
            cycleCount: Math.round(Math.random() * 500),
            errorCode: Math.random() > 0.9 ? Math.round(Math.random() * 50) : 0,
            doorOpen: Math.random() > 0.9,
            emergencyStop: false,
            torque: Math.round(100 + Math.random() * 2000),
            toolWear: Math.round(Math.random() * 100),
            ambientTemp: Math.round(20 + Math.random() * 25),
        }),

        defaultRules: [
            {
                id: 'ind-motor-overheat', name: 'Motor Overheat',
                conditions: { all: [{ fact: 'motorTemp', operator: '>', value: 120 }] },
                event: { type: 'thermal_alert', message: 'Motor temperature critical (>120°C) — shutdown risk', severity: 'critical' }
            },
            {
                id: 'ind-high-vibration', name: 'Excess Vibration',
                conditions: { all: [{ fact: 'vibration', operator: '>', value: 15 }] },
                event: { type: 'mechanical_alert', message: 'High vibration detected (>15 mm/s) — bearing failure risk', severity: 'critical' }
            },
            {
                id: 'ind-low-oil', name: 'Low Oil Level',
                conditions: { all: [{ fact: 'oilLevel', operator: '<', value: 20 }] },
                event: { type: 'maintenance', message: 'Oil level critically low (<20%) — lubrication failure risk', severity: 'critical' }
            },
            {
                id: 'ind-safety-door', name: 'Safety Door Open',
                conditions: { all: [{ fact: 'doorOpen', operator: '==', value: true }] },
                event: { type: 'safety', message: '⚠️ Safety door open — machine must stop', severity: 'critical' }
            },
            {
                id: 'ind-error-code', name: 'Machine Fault',
                conditions: { all: [{ fact: 'errorCode', operator: '>', value: 0 }] },
                event: { type: 'fault', message: 'Machine error code detected — inspect and clear', severity: 'warning' }
            },
            {
                id: 'ind-tool-wear', name: 'Tool Replacement Due',
                conditions: { all: [{ fact: 'toolWear', operator: '>', value: 80 }] },
                event: { type: 'maintenance', message: 'Tool wear index >80 — replace tool before next cycle', severity: 'warning' }
            },
            {
                id: 'ind-overpressure', name: 'Hydraulic Overpressure',
                conditions: { all: [{ fact: 'pressurePSI', operator: '>', value: 4200 }] },
                event: { type: 'hydraulic_alert', message: 'Hydraulic pressure exceeds 4200 PSI — check relief valve', severity: 'critical' }
            },
        ],

        gauges: [
            { fact: 'motorTemp', label: 'Motor Temp', unit: '°C', max: 200, color: '#DD6B20', warningAt: 100 },
            { fact: 'vibration', label: 'Vibration', unit: 'mm/s', max: 50, color: '#9F7AEA', warningAt: 12 },
            { fact: 'pressurePSI', label: 'Pressure', unit: 'PSI', max: 5000, color: '#3B6FE8', warningAt: 4000 },
            { fact: 'powerDraw', label: 'Power Draw', unit: 'kW', max: 500, color: '#10B981' },
            { fact: 'toolWear', label: 'Tool Wear', unit: '%', max: 100, color: '#E53E3E', warningAt: 80 },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 5. SMART BUILDING / HVAC
    // ════════════════════════════════════════════════════════════════
    building: {
        id: 'building',
        label: 'Smart Building / HVAC',
        icon: Building,
        color: { scheme: 'teal', hex: '#319795', light: '#E6FFFA' },
        description: 'Building automation, HVAC control, occupancy, energy management, fire safety',
        deviceLabel: 'Zone ID',
        devicePlaceholder: 'ZONE-FLOOR3-EAST',

        facts: [
            { name: 'roomTemp', label: 'Room Temperature (°C)', type: 'number', category: 'comfort', unit: '°C', min: 0, max: 50 },
            { name: 'humidity', label: 'Humidity (%)', type: 'number', category: 'comfort', unit: '%', min: 0, max: 100 },
            { name: 'co2Level', label: 'CO2 Level (ppm)', type: 'number', category: 'air_quality', unit: 'ppm', min: 300, max: 5000 },
            { name: 'occupancy', label: 'Occupancy Count', type: 'number', category: 'occupancy', unit: 'persons', min: 0, max: 500 },
            { name: 'lightLevel', label: 'Light Level (lux)', type: 'number', category: 'lighting', unit: 'lux', min: 0, max: 2000 },
            { name: 'energyConsumption', label: 'Energy Consumption (kW)', type: 'number', category: 'energy', unit: 'kW', min: 0, max: 1000 },
            { name: 'waterLeakDetected', label: 'Water Leak Detected', type: 'boolean', category: 'safety', unit: '' },
            { name: 'smokeDetected', label: 'Smoke Detected', type: 'boolean', category: 'safety', unit: '' },
            { name: 'hvacMode', label: 'HVAC Mode (0=Off,1=Cool,2=Heat)', type: 'number', category: 'hvac', unit: '', min: 0, max: 2 },
            { name: 'filterPressureDrop', label: 'Filter Pressure Drop (Pa)', type: 'number', category: 'hvac', unit: 'Pa', min: 0, max: 500 },
            { name: 'accessControlTriggered', label: 'Unauthorized Access', type: 'boolean', category: 'security', unit: '' },
            { name: 'elevatorFault', label: 'Elevator Fault', type: 'boolean', category: 'safety', unit: '' },
            { name: 'outdoorTemp', label: 'Outdoor Temperature (°C)', type: 'number', category: 'environmental', unit: '°C', min: -20, max: 50 },
            { name: 'pvoc', label: 'VOC Level (ppb)', type: 'number', category: 'air_quality', unit: 'ppb', min: 0, max: 2000 },
        ],

        simulateSeed: () => ({
            roomTemp: parseFloat((18 + Math.random() * 12).toFixed(1)),
            humidity: Math.round(30 + Math.random() * 50),
            co2Level: Math.round(400 + Math.random() * 1500),
            occupancy: Math.round(Math.random() * 80),
            lightLevel: Math.round(Math.random() * 800),
            energyConsumption: parseFloat((10 + Math.random() * 200).toFixed(1)),
            waterLeakDetected: Math.random() > 0.97,
            smokeDetected: Math.random() > 0.99,
            hvacMode: Math.round(Math.random() * 2),
            filterPressureDrop: Math.round(Math.random() * 400),
            accessControlTriggered: Math.random() > 0.97,
            elevatorFault: Math.random() > 0.98,
            outdoorTemp: parseFloat((-5 + Math.random() * 40).toFixed(1)),
            pvoc: Math.round(Math.random() * 600),
        }),

        defaultRules: [
            {
                id: 'bld-high-co2', name: 'High CO2 Alert',
                conditions: { all: [{ fact: 'co2Level', operator: '>', value: 1000 }] },
                event: { type: 'air_quality', message: 'CO2 level above 1000 ppm — increase ventilation', severity: 'warning' }
            },
            {
                id: 'bld-smoke', name: 'Smoke Detection',
                conditions: { all: [{ fact: 'smokeDetected', operator: '==', value: true }] },
                event: { type: 'fire_safety', message: '🔥 SMOKE DETECTED — trigger fire alarm protocol', severity: 'critical' }
            },
            {
                id: 'bld-water-leak', name: 'Water Leak Alert',
                conditions: { all: [{ fact: 'waterLeakDetected', operator: '==', value: true }] },
                event: { type: 'safety', message: 'Water leak detected — shut off supply valve', severity: 'critical' }
            },
            {
                id: 'bld-overtemp', name: 'Room Overheating',
                conditions: { all: [{ fact: 'roomTemp', operator: '>', value: 28 }] },
                event: { type: 'comfort', message: 'Room temperature above 28°C — activate cooling', severity: 'warning' }
            },
            {
                id: 'bld-filter-clogged', name: 'Filter Clogged',
                conditions: { all: [{ fact: 'filterPressureDrop', operator: '>', value: 350 }] },
                event: { type: 'maintenance', message: 'HVAC filter pressure drop high — replace filter', severity: 'warning' }
            },
            {
                id: 'bld-unauthorized', name: 'Unauthorized Access',
                conditions: { all: [{ fact: 'accessControlTriggered', operator: '==', value: true }] },
                event: { type: 'security', message: '🔐 Unauthorized access attempt detected', severity: 'critical' }
            },
        ],

        gauges: [
            { fact: 'roomTemp', label: 'Room Temp', unit: '°C', max: 50, color: '#319795', warningAt: 27 },
            { fact: 'humidity', label: 'Humidity', unit: '%', max: 100, color: '#3B6FE8' },
            { fact: 'co2Level', label: 'CO2', unit: 'ppm', max: 2000, color: '#E53E3E', warningAt: 1000 },
            { fact: 'energyConsumption', label: 'Energy', unit: 'kW', max: 500, color: '#D69E2E' },
            { fact: 'occupancy', label: 'Occupancy', unit: 'ppl', max: 200, color: '#9F7AEA' },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 6. AGRICULTURE / SMART FARM
    // ════════════════════════════════════════════════════════════════
    agriculture: {
        id: 'agriculture',
        label: 'Agriculture / Smart Farm',
        icon: '🌾',
        color: { scheme: 'green', hex: '#276749', light: '#F0FFF4' },
        description: 'Soil sensors, irrigation control, greenhouse automation, crop yield monitoring',
        deviceLabel: 'Field ID',
        devicePlaceholder: 'FIELD-BLOCK-A3',

        facts: [
            { name: 'soilMoisture', label: 'Soil Moisture (%)', type: 'number', category: 'soil', unit: '%', min: 0, max: 100 },
            { name: 'soilTemp', label: 'Soil Temperature (°C)', type: 'number', category: 'soil', unit: '°C', min: -5, max: 60 },
            { name: 'soilPH', label: 'Soil pH', type: 'number', category: 'soil', unit: 'pH', min: 3, max: 10 },
            { name: 'airTemp', label: 'Air Temperature (°C)', type: 'number', category: 'weather', unit: '°C', min: -10, max: 50 },
            { name: 'airHumidity', label: 'Air Humidity (%)', type: 'number', category: 'weather', unit: '%', min: 0, max: 100 },
            { name: 'rainfall', label: 'Rainfall (mm/hr)', type: 'number', category: 'weather', unit: 'mm/hr', min: 0, max: 100 },
            { name: 'windSpeed', label: 'Wind Speed (km/h)', type: 'number', category: 'weather', unit: 'km/h', min: 0, max: 150 },
            { name: 'lightIntensity', label: 'Light Intensity (klux)', type: 'number', category: 'light', unit: 'klux', min: 0, max: 120 },
            { name: 'co2Concentration', label: 'Greenhouse CO2 (ppm)', type: 'number', category: 'greenhouse', unit: 'ppm', min: 300, max: 2000 },
            { name: 'nitrogenLevel', label: 'Nitrogen Level (mg/L)', type: 'number', category: 'nutrients', unit: 'mg/L', min: 0, max: 500 },
            { name: 'irrigationActive', label: 'Irrigation Active', type: 'boolean', category: 'control', unit: '' },
            { name: 'pestTrapCount', label: 'Pest Trap Count', type: 'number', category: 'pest', unit: 'insects', min: 0, max: 200 },
            { name: 'waterTankLevel', label: 'Water Tank Level (%)', type: 'number', category: 'water', unit: '%', min: 0, max: 100 },
            { name: 'leafWetness', label: 'Leaf Wetness Index (0–10)', type: 'number', category: 'crop', unit: '', min: 0, max: 10 },
        ],

        simulateSeed: () => ({
            soilMoisture: Math.round(20 + Math.random() * 60),
            soilTemp: parseFloat((10 + Math.random() * 30).toFixed(1)),
            soilPH: parseFloat((5.5 + Math.random() * 2.5).toFixed(1)),
            airTemp: parseFloat((15 + Math.random() * 20).toFixed(1)),
            airHumidity: Math.round(40 + Math.random() * 50),
            rainfall: parseFloat((Math.random() * 20).toFixed(1)),
            windSpeed: parseFloat((Math.random() * 40).toFixed(1)),
            lightIntensity: parseFloat((Math.random() * 80).toFixed(1)),
            co2Concentration: Math.round(400 + Math.random() * 800),
            nitrogenLevel: Math.round(50 + Math.random() * 300),
            irrigationActive: Math.random() > 0.6,
            pestTrapCount: Math.round(Math.random() * 30),
            waterTankLevel: Math.round(20 + Math.random() * 80),
            leafWetness: parseFloat((Math.random() * 10).toFixed(1)),
        }),

        defaultRules: [
            {
                id: 'agri-dry-soil', name: 'Dry Soil Alert',
                conditions: { all: [{ fact: 'soilMoisture', operator: '<', value: 25 }] },
                event: { type: 'irrigation', message: 'Soil moisture below 25% — start irrigation', severity: 'warning' }
            },
            {
                id: 'agri-frost-risk', name: 'Frost Risk',
                conditions: { all: [{ fact: 'airTemp', operator: '<', value: 4 }] },
                event: { type: 'weather', message: 'Air temperature below 4°C — frost risk for crops', severity: 'critical' }
            },
            {
                id: 'agri-high-wind', name: 'High Wind Speed',
                conditions: { all: [{ fact: 'windSpeed', operator: '>', value: 60 }] },
                event: { type: 'weather', message: 'Wind speed >60 km/h — secure greenhouse structures', severity: 'warning' }
            },
            {
                id: 'agri-pest-alert', name: 'Pest Infestation Alert',
                conditions: { all: [{ fact: 'pestTrapCount', operator: '>', value: 20 }] },
                event: { type: 'pest', message: 'High pest count (>20) — schedule pesticide application', severity: 'warning' }
            },
            {
                id: 'agri-low-water', name: 'Low Water Tank',
                conditions: { all: [{ fact: 'waterTankLevel', operator: '<', value: 15 }] },
                event: { type: 'water', message: 'Water tank below 15% — refill required', severity: 'critical' }
            },
            {
                id: 'agri-ph-acidic', name: 'Acidic Soil Alert',
                conditions: { all: [{ fact: 'soilPH', operator: '<', value: 5.5 }] },
                event: { type: 'soil', message: 'Soil pH below 5.5 — lime application recommended', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'soilMoisture', label: 'Soil Moisture', unit: '%', max: 100, color: '#276749', warningAt: 25, invertAlert: true },
            { fact: 'airTemp', label: 'Air Temp', unit: '°C', max: 50, color: '#F59E0B' },
            { fact: 'waterTankLevel', label: 'Water Tank', unit: '%', max: 100, color: '#3B6FE8', warningAt: 20, invertAlert: true },
            { fact: 'co2Concentration', label: 'CO2', unit: 'ppm', max: 2000, color: '#9F7AEA' },
            { fact: 'lightIntensity', label: 'Light', unit: 'klux', max: 120, color: '#D69E2E' },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 7. WATER / UTILITIES
    // ════════════════════════════════════════════════════════════════
    water: {
        id: 'water',
        label: 'Water / Utility Monitoring',
        icon: Droplets,
        color: { scheme: 'cyan', hex: '#0BC5EA', light: '#EDFDFD' },
        description: 'Water treatment plants, pipeline monitoring, pump stations, reservoir management',
        deviceLabel: 'Station ID',
        devicePlaceholder: 'PUMP-STATION-12',

        facts: [
            { name: 'flowRate', label: 'Flow Rate (m³/hr)', type: 'number', category: 'flow', unit: 'm³/hr', min: 0, max: 1000 },
            { name: 'pressure', label: 'Pipeline Pressure (bar)', type: 'number', category: 'pressure', unit: 'bar', min: 0, max: 20 },
            { name: 'turbidity', label: 'Water Turbidity (NTU)', type: 'number', category: 'quality', unit: 'NTU', min: 0, max: 200 },
            { name: 'chlorineLevel', label: 'Chlorine Level (mg/L)', type: 'number', category: 'quality', unit: 'mg/L', min: 0, max: 5 },
            { name: 'pH', label: 'Water pH', type: 'number', category: 'quality', unit: 'pH', min: 4, max: 10 },
            { name: 'pumpStatus', label: 'Pump Running', type: 'boolean', category: 'control', unit: '' },
            { name: 'tankLevel', label: 'Reservoir Level (%)', type: 'number', category: 'storage', unit: '%', min: 0, max: 100 },
            { name: 'leakDetected', label: 'Leak Detected', type: 'boolean', category: 'safety', unit: '' },
            { name: 'motorTemp', label: 'Pump Motor Temp (°C)', type: 'number', category: 'thermal', unit: '°C', min: 0, max: 120 },
            { name: 'conductivity', label: 'Conductivity (µS/cm)', type: 'number', category: 'quality', unit: 'µS/cm', min: 0, max: 3000 },
            { name: 'dissolvedOxygen', label: 'Dissolved Oxygen (mg/L)', type: 'number', category: 'quality', unit: 'mg/L', min: 0, max: 15 },
            { name: 'energyUsed', label: 'Pump Energy (kWh)', type: 'number', category: 'energy', unit: 'kWh', min: 0, max: 10000 },
        ],

        simulateSeed: () => ({
            flowRate: parseFloat((100 + Math.random() * 600).toFixed(1)),
            pressure: parseFloat((3 + Math.random() * 12).toFixed(2)),
            turbidity: parseFloat((Math.random() * 50).toFixed(1)),
            chlorineLevel: parseFloat((0.2 + Math.random() * 3).toFixed(2)),
            pH: parseFloat((6.5 + Math.random() * 2).toFixed(1)),
            pumpStatus: Math.random() > 0.2,
            tankLevel: Math.round(30 + Math.random() * 70),
            leakDetected: Math.random() > 0.97,
            motorTemp: Math.round(30 + Math.random() * 60),
            conductivity: Math.round(200 + Math.random() * 1500),
            dissolvedOxygen: parseFloat((4 + Math.random() * 8).toFixed(1)),
            energyUsed: Math.round(Math.random() * 5000),
        }),

        defaultRules: [
            {
                id: 'water-high-turbidity', name: 'High Turbidity',
                conditions: { all: [{ fact: 'turbidity', operator: '>', value: 25 }] },
                event: { type: 'quality_alert', message: 'Water turbidity >25 NTU — treatment required', severity: 'warning' }
            },
            {
                id: 'water-low-chlorine', name: 'Low Chlorine Level',
                conditions: { all: [{ fact: 'chlorineLevel', operator: '<', value: 0.5 }] },
                event: { type: 'quality_alert', message: 'Chlorine below 0.5 mg/L — dosing pump check required', severity: 'critical' }
            },
            {
                id: 'water-leak', name: 'Pipeline Leak',
                conditions: { all: [{ fact: 'leakDetected', operator: '==', value: true }] },
                event: { type: 'safety', message: '🚨 Pipeline leak detected — isolate section immediately', severity: 'critical' }
            },
            {
                id: 'water-overpressure', name: 'High Pipeline Pressure',
                conditions: { all: [{ fact: 'pressure', operator: '>', value: 16 }] },
                event: { type: 'pressure_alert', message: 'Pipeline pressure >16 bar — check pressure relief valve', severity: 'critical' }
            },
            {
                id: 'water-low-tank', name: 'Low Reservoir Level',
                conditions: { all: [{ fact: 'tankLevel', operator: '<', value: 20 }] },
                event: { type: 'storage', message: 'Reservoir below 20% — activate backup supply', severity: 'warning' }
            },
            {
                id: 'water-ph-off', name: 'pH Out of Range',
                conditions: { all: [{ fact: 'pH', operator: '<', value: 6.5 }] },
                event: { type: 'quality_alert', message: 'Water pH below 6.5 — adjust dosing', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'flowRate', label: 'Flow Rate', unit: 'm³/hr', max: 1000, color: '#0BC5EA' },
            { fact: 'pressure', label: 'Pressure', unit: 'bar', max: 20, color: '#3B6FE8', warningAt: 15 },
            { fact: 'turbidity', label: 'Turbidity', unit: 'NTU', max: 100, color: '#D69E2E', warningAt: 25 },
            { fact: 'chlorineLevel', label: 'Chlorine', unit: 'mg/L', max: 5, color: '#10B981' },
            { fact: 'tankLevel', label: 'Tank Level', unit: '%', max: 100, color: '#6366F1', warningAt: 20, invertAlert: true },
        ],
    },
    // ════════════════════════════════════════════════════════════════
    // 8. FLEET MANAGEMENT
    // ════════════════════════════════════════════════════════════════
    fleet: {
        id: 'fleet',
        label: 'Fleet Management',
        icon: Box,
        color: { scheme: 'blue', hex: '#2B6CB0', light: '#EBF8FF' },
        description: 'Commercial fleet tracking, fuel analytics, driver behavior, load monitoring',
        deviceLabel: 'Truck ID',
        devicePlaceholder: 'TRK-IND-9912',

        facts: [
            { name: 'fuelEfficiency', label: 'Fuel Efficiency (km/L)', type: 'number', category: 'performance', unit: 'km/L', min: 2, max: 20 },
            { name: 'coolantTemp', label: 'Coolant Temp (°C)', type: 'number', category: 'thermal', unit: '°C', min: 0, max: 120 },
            { name: 'driverFatigue', label: 'Fatigue Score (0-10)', type: 'number', category: 'behavior', unit: '', min: 0, max: 10 },
            { name: 'loadWeight', label: 'Load Weight (kg)', type: 'number', category: 'logistics', unit: 'kg', min: 0, max: 40000 },
            { name: 'harshBraking', label: 'Harsh Braking Event', type: 'boolean', category: 'behavior', unit: '' },
            { name: 'idleTime', label: 'Idle time (min)', type: 'number', category: 'efficiency', unit: 'min', min: 0, max: 600 },
            { name: 'engineLoad', label: 'Engine Load (%)', type: 'number', category: 'sensor', unit: '%', min: 0, max: 100 },
        ],

        simulateSeed: () => ({
            fuelEfficiency: parseFloat((4 + Math.random() * 8).toFixed(1)),
            coolantTemp: Math.round(75 + Math.random() * 35),
            driverFatigue: parseFloat((Math.random() * 9).toFixed(1)),
            loadWeight: Math.round(5000 + Math.random() * 30000),
            harshBraking: Math.random() > 0.92,
            idleTime: Math.round(Math.random() * 120),
            engineLoad: Math.round(20 + Math.random() * 70),
        }),

        defaultRules: [
            {
                id: 'fleet-overheat', name: 'Critical Coolant Temp',
                conditions: { all: [{ fact: 'coolantTemp', operator: '>', value: 105 }] },
                event: { type: 'safety', message: 'Engine coolant temperature critical (>105°C)', severity: 'critical' }
            },
            {
                id: 'fleet-fatigue', name: 'Driver Fatigue Alert',
                conditions: { all: [{ fact: 'driverFatigue', operator: '>', value: 8 }] },
                event: { type: 'safety', message: 'High driver fatigue score detected — mandatory break suggested', severity: 'critical' }
            },
            {
                id: 'fleet-overload', name: 'Truck Overload',
                conditions: { all: [{ fact: 'loadWeight', operator: '>', value: 35000 }] },
                event: { type: 'logistics', message: 'Vehicle load exceeds 35,000kg safety limit', severity: 'warning' }
            },
            {
                id: 'fleet-harsh-brake', name: 'Harsh Braking Detected',
                conditions: { all: [{ fact: 'harshBraking', operator: '==', value: true }] },
                event: { type: 'behavior', message: 'Harsh braking event recorded — affecting driver score', severity: 'info' }
            },
        ],

        gauges: [
            { fact: 'fuelEfficiency', label: 'Fuel Eff', unit: 'km/L', max: 20, color: '#3182CE' },
            { fact: 'loadWeight', label: 'Load', unit: 'kg', max: 40000, color: '#805AD5' },
            { fact: 'driverFatigue', label: 'Fatigue', unit: '', max: 10, color: '#E53E3E', warningAt: 7 },
            { fact: 'coolantTemp', label: 'Coolant', unit: '°C', max: 120, color: '#DD6B20', warningAt: 100 },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 9. RETAIL & INVENTORY
    // ════════════════════════════════════════════════════════════════
    retail: {
        id: 'retail',
        label: 'Retail & Inventory',
        icon: Home,
        color: { scheme: 'pink', hex: '#D53F8C', light: '#FFF5F7' },
        description: 'Smart shelves, cold chain monitoring, store traffic, inventory alerts',
        deviceLabel: 'Store/Shelf ID',
        devicePlaceholder: 'ST-NYC-05-A1',

        facts: [
            { name: 'shelfStock', label: 'Shelf Stock Level (%)', type: 'number', category: 'inventory', unit: '%', min: 0, max: 100 },
            { name: 'storageTemp', label: 'Storage Temp (°C)', type: 'number', category: 'cold_chain', unit: '°C', min: -30, max: 30 },
            { name: 'footTraffic', label: 'Hourly Foot Traffic', type: 'number', category: 'analytics', unit: 'count', min: 0, max: 500 },
            { name: 'transactionRate', label: 'Transactions / min', type: 'number', category: 'sales', unit: 'pm', min: 0, max: 20 },
            { name: 'humidity', label: 'Storage Humidity (%)', type: 'number', category: 'cold_chain', unit: '%', min: 0, max: 100 },
        ],

        simulateSeed: () => ({
            shelfStock: Math.round(10 + Math.random() * 90),
            storageTemp: parseFloat((-22 + Math.random() * 30).toFixed(1)),
            footTraffic: Math.round(Math.random() * 200),
            transactionRate: parseFloat((Math.random() * 12).toFixed(1)),
            humidity: Math.round(30 + Math.random() * 40),
        }),

        defaultRules: [
            {
                id: 'retail-low-stock', name: 'Low Stock Alert',
                conditions: { all: [{ fact: 'shelfStock', operator: '<', value: 20 }] },
                event: { type: 'inventory', message: 'Shelf stock below 20% — replenishment order triggered', severity: 'warning' }
            },
            {
                id: 'retail-temp-breach', name: 'Cold Chain Breach',
                conditions: { all: [{ fact: 'storageTemp', operator: '>', value: -5 }] },
                event: { type: 'safety', message: 'Freezer temperature > -5°C — risk of spoilage!', severity: 'critical' }
            },
            {
                id: 'retail-high-traffic', name: 'High Foot Traffic',
                conditions: { all: [{ fact: 'footTraffic', operator: '>', value: 150 }] },
                event: { type: 'analytics', message: 'Peak foot traffic detected — suggest opening more checkouts', severity: 'info' }
            },
        ],

        gauges: [
            { fact: 'shelfStock', label: 'Stock Level', unit: '%', max: 100, color: '#D53F8C', warningAt: 25, invertAlert: true },
            { fact: 'storageTemp', label: 'Freezer', unit: '°C', max: 30, color: '#3182CE', warningAt: -10 },
            { fact: 'footTraffic', label: 'Traffic', unit: 'cnt', max: 500, color: '#805AD5' },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 10. TELECOM INFRASTRUCTURE
    // ════════════════════════════════════════════════════════════════
    telecom: {
        id: 'telecom',
        label: 'Telecom Infrastructure',
        icon: Wifi,
        color: { scheme: 'purple', hex: '#805AD5', light: '#FAF5FF' },
        description: 'Base station health, signal metrics, backup power, thermal management',
        deviceLabel: 'Tower ID',
        devicePlaceholder: 'SITE-BLR-SOUTH-04',

        facts: [
            { name: 'signalQuality', label: 'Signal Quality (dBm)', type: 'number', category: 'rf', unit: 'dBm', min: -140, max: -40 },
            { name: 'inputVoltage', label: 'Mains Voltage (V)', type: 'number', category: 'power', unit: 'V', min: 0, max: 480 },
            { name: 'batteryBackup', label: 'Battery Backup (%)', type: 'number', category: 'power', unit: '%', min: 0, max: 100 },
            { name: 'fanSpeed', label: 'Cooling Fan RPM', type: 'number', category: 'thermal', unit: 'RPM', min: 0, max: 5000 },
            { name: 'throughput', label: 'Data Throughput (Mbps)', type: 'number', category: 'traffic', unit: 'Mbps', min: 0, max: 1000 },
            { name: 'towerTilt', label: 'Structural Tilt (deg)', type: 'number', category: 'safety', unit: '°', min: 0, max: 10 },
        ],

        simulateSeed: () => ({
            signalQuality: Math.round(-110 + Math.random() * 60),
            inputVoltage: Math.round(220 + Math.random() * 30),
            batteryBackup: Math.round(60 + Math.random() * 40),
            fanSpeed: Math.round(1500 + Math.random() * 2000),
            throughput: Math.round(100 + Math.random() * 700),
            towerTilt: parseFloat((Math.random() * 2).toFixed(2)),
        }),

        defaultRules: [
            {
                id: 'tel-low-signal', name: 'Low Signal Quality',
                conditions: { all: [{ fact: 'signalQuality', operator: '<', value: -105 }] },
                event: { type: 'rf_alert', message: 'Signal quality critical (< -105 dBm) — handovers failing', severity: 'critical' }
            },
            {
                id: 'tel-power-loss', name: 'Mains Power Loss',
                conditions: { all: [{ fact: 'inputVoltage', operator: '<', value: 180 }] },
                event: { type: 'power', message: 'Main power failed/low — running on battery backup', severity: 'critical' }
            },
            {
                id: 'tel-structural', name: 'Tower Tilt Detected',
                conditions: { all: [{ fact: 'towerTilt', operator: '>', value: 1.5 }] },
                event: { type: 'safety', message: 'Significant tower tilt detected (>1.5°) — structural inspection required', severity: 'warning' }
            },
            {
                id: 'tel-high-load', name: 'Network Congestion',
                conditions: { all: [{ fact: 'throughput', operator: '>', value: 850 }] },
                event: { type: 'traffic', message: 'Throughput exceeding 850 Mbps — peak load alert', severity: 'info' }
            },
        ],

        gauges: [
            { fact: 'signalQuality', label: 'Signal', unit: 'dBm', max: -40, color: '#805AD5', warningAt: -100, invertAlert: true },
            { fact: 'batteryBackup', label: 'Battery', unit: '%', max: 100, color: '#38A169', warningAt: 40, invertAlert: true },
            { fact: 'throughput', label: 'Throughput', unit: 'Mbps', max: 1000, color: '#3182CE' },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 11. SMART GRID / ENERGY MANAGEMENT
    // ════════════════════════════════════════════════════════════════
    grid: {
        id: 'grid',
        label: 'Smart Grid / Energy',
        icon: Zap,
        color: { scheme: 'yellow', hex: '#ECC94B', light: '#FFFFF0' },
        description: 'Power distribution, grid stability, transformer health, real-time demand monitoring',
        deviceLabel: 'Substation ID',
        devicePlaceholder: 'SUB-STATION-NORTH-10',

        facts: [
            { name: 'gridVoltage', label: 'Grid Voltage (kV)', type: 'number', category: 'electrical', unit: 'kV', min: 0, max: 800 },
            { name: 'frequency', label: 'Frequency (Hz)', type: 'number', category: 'stability', unit: 'Hz', min: 45, max: 65 },
            { name: 'powerFactor', label: 'Power Factor', type: 'number', category: 'efficiency', unit: 'pf', min: 0, max: 1 },
            { name: 'harmonicDistortion', label: 'THD (%)', type: 'number', category: 'quality', unit: '%', min: 0, max: 20 },
            { name: 'transformerTemp', label: 'Transformer Temp (°C)', type: 'number', category: 'thermal', unit: '°C', min: 0, max: 150 },
            { name: 'loadBalance', label: 'Phase Load Balance (%)', type: 'number', category: 'electrical', unit: '%', min: 0, max: 100 },
        ],

        simulateSeed: () => ({
            gridVoltage: parseFloat((210 + Math.random() * 20).toFixed(1)),
            frequency: parseFloat((49.5 + Math.random() * 1).toFixed(2)),
            powerFactor: parseFloat((0.85 + Math.random() * 0.15).toFixed(2)),
            harmonicDistortion: parseFloat((Math.random() * 5).toFixed(1)),
            transformerTemp: Math.round(45 + Math.random() * 60),
            loadBalance: Math.round(85 + Math.random() * 15),
        }),

        defaultRules: [
            {
                id: 'grid-freq-low', name: 'Low Frequency Alert',
                conditions: { all: [{ fact: 'frequency', operator: '<', value: 49.8 }] },
                event: { type: 'stability', message: 'Grid frequency below 49.8Hz — stability risk!', severity: 'critical' }
            },
            {
                id: 'grid-freq-high', name: 'High Frequency Alert',
                conditions: { all: [{ fact: 'frequency', operator: '>', value: 50.2 }] },
                event: { type: 'stability', message: 'Grid frequency above 50.2Hz — check load shedding', severity: 'warning' }
            },
            {
                id: 'grid-temp', name: 'Transformer Overheat',
                conditions: { all: [{ fact: 'transformerTemp', operator: '>', value: 95 }] },
                event: { type: 'thermal', message: 'Transformer temperature exceeding 95°C — urgent inspection', severity: 'critical' }
            },
            {
                id: 'grid-pf', name: 'Low Power Factor',
                conditions: { all: [{ fact: 'powerFactor', operator: '<', value: 0.9 }] },
                event: { type: 'efficiency', message: 'Power factor below 0.9 — capacitor bank check needed', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'gridVoltage', label: 'Voltage', unit: 'kV', max: 800, color: '#D69E2E' },
            { fact: 'frequency', label: 'Frequency', unit: 'Hz', max: 65, color: '#38A169', warningAt: 51 },
            { fact: 'transformerTemp', label: 'Transf Temp', unit: '°C', max: 150, color: '#E53E3E', warningAt: 90 },
            { fact: 'powerFactor', label: 'P. Factor', unit: '', max: 1, color: '#3182CE', warningAt: 0.9, invertAlert: true },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 12. WAREHOUSE AUTOMATION / ROBOTICS
    // ════════════════════════════════════════════════════════════════
    warehouse: {
        id: 'warehouse',
        label: 'Warehouse Robotics',
        icon: Box,
        color: { scheme: 'orange', hex: '#DD6B20', light: '#FFFFAF' },
        description: 'AGV/AMR fleet, conveyor systems, automated sorting, picking accuracy',
        deviceLabel: 'Robot ID',
        devicePlaceholder: 'AMR-FLEET-24',

        facts: [
            { name: 'conveyorSpeed', label: 'Conveyor Speed (m/s)', type: 'number', category: 'mechanical', unit: 'm/s', min: 0, max: 10 },
            { name: 'robotBatteryState', label: 'AMR Battery (%)', type: 'number', category: 'energy', unit: '%', min: 0, max: 100 },
            { name: 'sortingAccuracy', label: 'Sorting Accuracy (%)', type: 'number', category: 'performance', unit: '%', min: 0, max: 100 },
            { name: 'ambientNoise', label: 'Noise Level (dB)', type: 'number', category: 'environmental', unit: 'dB', min: 30, max: 120 },
            { name: 'palletWeight', label: 'Avg Pallet Weight (kg)', type: 'number', category: 'logistics', unit: 'kg', min: 0, max: 2000 },
            { name: 'activeRobots', label: 'Active AMR Count', type: 'number', category: 'fleet', unit: 'cnt', min: 0, max: 50 },
        ],

        simulateSeed: () => ({
            conveyorSpeed: parseFloat((1 + Math.random() * 4).toFixed(1)),
            robotBatteryState: Math.round(15 + Math.random() * 85),
            sortingAccuracy: parseFloat((98 + Math.random() * 2).toFixed(2)),
            ambientNoise: Math.round(60 + Math.random() * 40),
            palletWeight: Math.round(200 + Math.random() * 800),
            activeRobots: Math.round(10 + Math.random() * 30),
        }),

        defaultRules: [
            {
                id: 'wh-low-battery', name: 'AMR Battery Alert',
                conditions: { all: [{ fact: 'robotBatteryState', operator: '<', value: 20 }] },
                event: { type: 'energy', message: 'Robot battery below 20% — auto-charging initiated', severity: 'warning' }
            },
            {
                id: 'wh-accuracy-drop', name: 'Sorting Accuracy Drop',
                conditions: { all: [{ fact: 'sortingAccuracy', operator: '<', value: 99 }] },
                event: { type: 'performance', message: 'Sorting accuracy fell below 99.0% — check scanner calibration', severity: 'warning' }
            },
            {
                id: 'wh-conveyor-fast', name: 'Conveyor Overspeed',
                conditions: { all: [{ fact: 'conveyorSpeed', operator: '>', value: 4.5 }] },
                event: { type: 'mechanical', message: 'Conveyor exceeding 4.5 m/s — hazard risk for workers', severity: 'critical' }
            },
        ],

        gauges: [
            { fact: 'sortingAccuracy', label: 'Accuracy', unit: '%', max: 100, color: '#38A169', warningAt: 99, invertAlert: true },
            { fact: 'robotBatteryState', label: 'Battery', unit: '%', max: 100, color: '#D69E2E', warningAt: 20, invertAlert: true },
            { fact: 'conveyorSpeed', label: 'Speed', unit: 'm/s', max: 10, color: '#3182CE' },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 13. ENVIRONMENTAL MONITORING
    // ════════════════════════════════════════════════════════════════
    environmental: {
        id: 'environmental',
        label: 'Env Monitoring',
        icon: Map,
        color: { scheme: 'green', hex: '#2F855A', light: '#F0FFF4' },
        description: 'Air quality (AQI), industrial noise, emission tracking, urban climate',
        deviceLabel: 'Sensor Station',
        devicePlaceholder: 'ENV-STATION-CBD-02',

        facts: [
            { name: 'pm25', label: 'PM2.5 (µg/m³)', type: 'number', category: 'air_quality', unit: 'µg/m³', min: 0, max: 1000 },
            { name: 'pm10', label: 'PM10 (µg/m³)', type: 'number', category: 'air_quality', unit: 'µg/m³', min: 0, max: 1000 },
            { name: 'aqi', label: 'Overall AQI', type: 'number', category: 'air_quality', unit: 'AQI', min: 0, max: 500 },
            { name: 'no2Level', label: 'NO2 Level (ppb)', type: 'number', category: 'emission', unit: 'ppb', min: 0, max: 1000 },
            { name: 'noiseLevelDb', label: 'Ambient Noise (dB)', type: 'number', category: 'pollution', unit: 'dB', min: 30, max: 140 },
            { name: 'uvIndex', label: 'UV Index (0-11+)', type: 'number', category: 'radiation', unit: 'uvi', min: 0, max: 15 },
        ],

        simulateSeed: () => ({
            pm25: Math.round(10 + Math.random() * 150),
            pm10: Math.round(20 + Math.random() * 200),
            aqi: Math.round(40 + Math.random() * 200),
            no2Level: Math.round(5 + Math.random() * 60),
            noiseLevelDb: Math.round(45 + Math.random() * 50),
            uvIndex: parseFloat((Math.random() * 10).toFixed(1)),
        }),

        defaultRules: [
            {
                id: 'env-aqi-hazardous', name: 'Hazardous AQI',
                conditions: { all: [{ fact: 'aqi', operator: '>', value: 300 }] },
                event: { type: 'safety', message: 'AQI is HAZARDOUS (>300) — outdoor activity warning!', severity: 'critical' }
            },
            {
                id: 'env-pm25-high', name: 'High PM2.5 Alert',
                conditions: { all: [{ fact: 'pm25', operator: '>', value: 75 }] },
                event: { type: 'safety', message: 'PM2.5 levels exceeding 75 µg/m³ — poor air quality', severity: 'warning' }
            },
            {
                id: 'env-noise-pollution', name: 'High Noise Pollution',
                conditions: { all: [{ fact: 'noiseLevelDb', operator: '>', value: 85 }] },
                event: { type: 'pollution', message: 'Sustained noise level >85dB — hearing protection recommended', severity: 'info' }
            },
        ],

        gauges: [
            { fact: 'aqi', label: 'AQI', unit: '', max: 500, color: '#E53E3E', warningAt: 200 },
            { fact: 'pm25', label: 'PM2.5', unit: 'µg', max: 500, color: '#DD6B20', warningAt: 100 },
            { fact: 'uvIndex', label: 'UV Index', unit: '', max: 15, color: '#D69E2E', warningAt: 8 },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 14. SMART CITY / TRAFFIC MANAGEMENT
    // ════════════════════════════════════════════════════════════════
    traffic: {
        id: 'traffic',
        label: 'Smart City Traffic',
        icon: Activity,
        color: { scheme: 'cyan', hex: '#00B5D8', light: '#E0F7FA' },
        description: 'Urban mobility, congestion analytics, emergency vehicle priority, smart parking',
        deviceLabel: 'Intersection ID',
        devicePlaceholder: 'INT-MAIN-ST-05',

        facts: [
            { name: 'congestionIndex', label: 'Congestion (0-10)', type: 'number', category: 'mobility', unit: '', min: 0, max: 10 },
            { name: 'avgSpeed', label: 'Avg Speed (km/h)', type: 'number', category: 'mobility', unit: 'km/h', min: 0, max: 120 },
            { name: 'waitingTime', label: 'Avg Wait (sec)', type: 'number', category: 'efficiency', unit: 's', min: 0, max: 300 },
            { name: 'activeAccidents', label: 'Live Incidents', type: 'number', category: 'safety', unit: 'cnt', min: 0, max: 10 },
            { name: 'ambulanceMode', label: 'Emergency Priority', type: 'boolean', category: 'safety', unit: '' },
            { name: 'parkingAvailability', label: 'Parking Slots (%)', type: 'number', category: 'logistics', unit: '%', min: 0, max: 100 },
        ],

        simulateSeed: () => ({
            congestionIndex: parseFloat((2 + Math.random() * 8).toFixed(1)),
            avgSpeed: Math.round(15 + Math.random() * 45),
            waitingTime: Math.round(30 + Math.random() * 150),
            activeAccidents: Math.random() > 0.95 ? 1 : 0,
            ambulanceMode: Math.random() > 0.98,
            parkingAvailability: Math.round(10 + Math.random() * 80),
        }),

        defaultRules: [
            {
                id: 'trf-gridlock', name: 'Gridlock Detected',
                conditions: { all: [{ fact: 'congestionIndex', operator: '>', value: 8.5 }] },
                event: { type: 'mobility', message: 'Severe traffic congestion (>8.5) — consider re-routing urban flow', severity: 'critical' }
            },
            {
                id: 'trf-emergency', name: 'Emergency Vehicle Priority',
                conditions: { all: [{ fact: 'ambulanceMode', operator: '==', value: true }] },
                event: { type: 'safety', message: 'Ambulance pulse detected — triggering green wave priority', severity: 'critical' }
            },
            {
                id: 'trf-low-speed', name: 'Slow Traffic Alert',
                conditions: { all: [{ fact: 'avgSpeed', operator: '<', value: 10 }] },
                event: { type: 'mobility', message: 'Average speed below 10 km/h — investigating local blockage', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'congestionIndex', label: 'Traffic', unit: '', max: 10, color: '#E53E3E', warningAt: 7.5 },
            { fact: 'avgSpeed', label: 'Avg Speed', unit: 'km/h', max: 120, color: '#3182CE' },
            { fact: 'parkingAvailability', label: 'Parking', unit: '%', max: 100, color: '#38A169', invertAlert: true },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 15. OIL & GAS UPSTREAM
    // ════════════════════════════════════════════════════════════════
    oilgas: {
        id: 'oilgas',
        label: 'Oil & Gas Ops',
        icon: Droplets,
        color: { scheme: 'gray', hex: '#4A5568', light: '#F7FAFC' },
        description: 'Wellhead monitoring, leak detection, HSE compliance, flow optimization',
        deviceLabel: 'Rig/Well ID',
        devicePlaceholder: 'RIG-OFFSHORE-B12',

        facts: [
            { name: 'wellheadPressure', label: 'Well Pressure (psi)', type: 'number', category: 'operational', unit: 'psi', min: 0, max: 15000 },
            { name: 'flowRate', label: 'Flow Rate (bbl/d)', type: 'number', category: 'production', unit: 'bbl/d', min: 0, max: 5000 },
            { name: 'h2sConcentration', label: 'H2S Gas (ppm)', type: 'number', category: 'safety', unit: 'ppm', min: 0, max: 100 },
            { name: 'gasLeakDetected', label: 'Methane Leak', type: 'boolean', category: 'environmental', unit: '' },
            { name: 'pumpStatus', label: 'Pump Load (%)', type: 'number', category: 'mechanical', unit: '%', min: 0, max: 120 },
            { name: 'temp', label: 'Operating Temp (°C)', type: 'number', category: 'thermal', unit: '°C', min: 0, max: 250 },
        ],

        simulateSeed: () => ({
            wellheadPressure: Math.round(2000 + Math.random() * 8000),
            flowRate: Math.round(500 + Math.random() * 2500),
            h2sConcentration: parseFloat((Math.random() * 5).toFixed(2)),
            gasLeakDetected: Math.random() > 0.99,
            pumpStatus: Math.round(60 + Math.random() * 30),
            temp: Math.round(80 + Math.random() * 70),
        }),

        defaultRules: [
            {
                id: 'og-high-press', name: 'Critical Pressure',
                conditions: { all: [{ fact: 'wellheadPressure', operator: '>', value: 12000 }] },
                event: { type: 'safety', message: 'Wellhead pressure critical (>12,000 psi) — emergency shutdown suggested', severity: 'critical' }
            },
            {
                id: 'og-h2s-alert', name: 'Toxic Gas Detection',
                conditions: { all: [{ fact: 'h2sConcentration', operator: '>', value: 10 }] },
                event: { type: 'safety', message: 'H2S concentration > 10 ppm — IMMEDIATE EVACUATION required', severity: 'critical' }
            },
            {
                id: 'og-leak', name: 'Methane Leak Alert',
                conditions: { all: [{ fact: 'gasLeakDetected', operator: '==', value: true }] },
                event: { type: 'environmental', message: 'Methane leak detected — investigating clamp integrity', severity: 'critical' }
            },
        ],

        gauges: [
            { fact: 'wellheadPressure', label: 'Pressure', unit: 'psi', max: 15000, color: '#E53E3E', warningAt: 10000 },
            { fact: 'flowRate', label: 'Flow', unit: 'bbl/d', max: 5000, color: '#3182CE' },
            { fact: 'h2sConcentration', label: 'H2S Gas', unit: 'ppm', max: 100, color: '#DD6B20', warningAt: 8 },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 16. SMART HOME / RESIDENTIAL
    // ════════════════════════════════════════════════════════════════
    home: {
        id: 'home',
        label: 'Smart Home',
        icon: Home,
        color: { scheme: 'teal', hex: '#319795', light: '#E6FFFA' },
        description: 'Home automation, energy saving, security, safety alerts',
        deviceLabel: 'Home Hub ID',
        devicePlaceholder: 'HUB-RES-402',

        facts: [
            { name: 'energyUsage', label: 'Power Draw (kW)', type: 'number', category: 'energy', unit: 'kW', min: 0, max: 20 },
            { name: 'thermostatTemp', label: 'Inside Temp (°C)', type: 'number', category: 'climate', unit: '°C', min: 10, max: 40 },
            { name: 'doorLockStatus', label: 'Security Armed', type: 'boolean', category: 'security', unit: '' },
            { name: 'smokeDetector', label: 'Smoke Sensing', type: 'boolean', category: 'safety', unit: '' },
            { name: 'waterLeak', label: 'Moisture Detection', type: 'boolean', category: 'safety', unit: '' },
            { name: 'motionDetected', label: 'Intrusion Alert', type: 'boolean', category: 'security', unit: '' },
        ],

        simulateSeed: () => ({
            energyUsage: parseFloat((0.5 + Math.random() * 5).toFixed(2)),
            thermostatTemp: parseFloat((21 + Math.random() * 4).toFixed(1)),
            doorLockStatus: true,
            smokeDetector: Math.random() > 0.995,
            waterLeak: Math.random() > 0.99,
            motionDetected: Math.random() > 0.98,
        }),

        defaultRules: [
            {
                id: 'hm-smoke', name: 'Smoke Emergency',
                conditions: { all: [{ fact: 'smokeDetector', operator: '==', value: true }] },
                event: { type: 'safety', message: 'SMOKE DETECTED — triggering fire alarm and dispatching help', severity: 'critical' }
            },
            {
                id: 'hm-leak', name: 'Water Pipe Leak',
                conditions: { all: [{ fact: 'waterLeak', operator: '==', value: true }] },
                event: { type: 'safety', message: 'Water leak detected in basement — main valve shutoff suggested', severity: 'warning' }
            },
            {
                id: 'hm-high-energy', name: 'High Energy Load',
                conditions: { all: [{ fact: 'energyUsage', operator: '>', value: 12 }] },
                event: { type: 'energy', message: 'High energy consumption (>12kW) — check heavy appliances', severity: 'info' }
            },
        ],

        gauges: [
            { fact: 'energyUsage', label: 'Energy', unit: 'kW', max: 20, color: '#DD6B20', warningAt: 15 },
            { fact: 'thermostatTemp', label: 'Temp', unit: '°C', max: 40, color: '#38A169' },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 10. MINING & EXCAVATION
    // ════════════════════════════════════════════════════════════════
    mining: {
        id: 'mining',
        label: 'Mining & Excavation',
        icon: Shield,
        color: { scheme: 'orange', hex: '#DD6B20', light: '#FFFAF0' },
        description: 'Heavy machinery health, underground gas safety, structural stability, payload optimization',
        deviceLabel: 'Machine/Pit ID',
        devicePlaceholder: 'EXC-PIT-NORTH-22',

        facts: [
            { name: 'hydraulicPressure', label: 'Hydraulic (bar)', type: 'number', category: 'mechanical', unit: 'bar', min: 0, max: 500 },
            { name: 'vibrationLevel', label: 'Vibration (mm/s)', type: 'number', category: 'safety', unit: 'mm/s', min: 0, max: 50 },
            { name: 'engineTorque', label: 'Engine Torque (Nm)', type: 'number', category: 'performance', unit: 'Nm', min: 0, max: 5000 },
            { name: 'payloadEfficiency', label: 'Payload Fill (%)', type: 'number', category: 'logistics', unit: '%', min: 0, max: 120 },
            { name: 'gasDetection', label: 'CH4/CO Level (ppm)', type: 'number', category: 'safety', unit: 'ppm', min: 0, max: 1000 },
            { name: 'inclination', label: 'Pit Slope Tilt (°)', type: 'number', category: 'safety', unit: '°', min: 0, max: 45 },
        ],

        simulateSeed: () => ({
            hydraulicPressure: Math.round(150 + Math.random() * 250),
            vibrationLevel: parseFloat((2 + Math.random() * 15).toFixed(1)),
            engineTorque: Math.round(2000 + Math.random() * 2500),
            payloadEfficiency: Math.round(70 + Math.random() * 45),
            gasDetection: Math.round(Math.random() * 150),
            inclination: parseFloat((0.5 + Math.random() * 5).toFixed(1)),
        }),

        defaultRules: [
            {
                id: 'min-vibe', name: 'Excessive Vibration',
                conditions: { all: [{ fact: 'vibrationLevel', operator: '>', value: 35 }] },
                event: { type: 'safety', message: 'Machine vibration critical (>35mm/s) — possible powertrain failure', severity: 'critical' }
            },
            {
                id: 'min-gas', name: 'Gas Danger Alert',
                conditions: { all: [{ fact: 'gasDetection', operator: '>', value: 500 }] },
                event: { type: 'safety', message: 'Hazardous gas level detected — initiate ventilation and evacuation', severity: 'critical' }
            },
            {
                id: 'min-tilt', name: 'Slope Instability',
                conditions: { all: [{ fact: 'inclination', operator: '>', value: 12 }] },
                event: { type: 'safety', message: 'Pit slope tilt > 12° — structural integrity warning', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'vibrationLevel', label: 'Vibration', unit: 'mm/s', max: 50, color: '#E53E3E', warningAt: 25 },
            { fact: 'gasDetection', label: 'Gas Level', unit: 'ppm', max: 1000, color: '#DD6B20', warningAt: 400 },
            { fact: 'payloadEfficiency', label: 'Payload', unit: '%', max: 120, color: '#38A169' },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 11. COLD CHAIN LOGISTICS
    // ════════════════════════════════════════════════════════════════
    coldchain: {
        id: 'coldchain',
        label: 'Cold Chain',
        icon: Box,
        color: { scheme: 'blue', hex: '#3182CE', light: '#EBF8FF' },
        description: 'Vaccine & perishables tracking, temperature trip monitoring, seal integrity',
        deviceLabel: 'Container/Box ID',
        devicePlaceholder: 'V-BOX-MED-091',

        facts: [
            { name: 'vaccineTemp', label: 'Cargo Temp (°C)', type: 'number', category: 'cold_chain', unit: '°C', min: -80, max: 25 },
            { name: 'humidity', label: 'Box Humidity (%)', type: 'number', category: 'environment', unit: '%', min: 0, max: 100 },
            { name: 'lightExposure', label: 'Light (Lux)', type: 'number', category: 'security', unit: 'lux', min: 0, max: 500 },
            { name: 'vibrationG', label: 'Shock (G force)', type: 'number', category: 'safety', unit: 'G', min: 0, max: 10 },
            { name: 'batteryLevel', label: 'Tracker Battery (%)', type: 'number', category: 'device', unit: '%', min: 0, max: 100 },
            { name: 'gpsSignal', label: 'GPS Strength (dB)', type: 'number', category: 'connectivity', unit: 'dB', min: -150, max: -50 },
        ],

        simulateSeed: () => ({
            vaccineTemp: parseFloat((-2 + Math.random() * 10).toFixed(1)),
            humidity: Math.round(30 + Math.random() * 20),
            lightExposure: Math.random() > 0.98 ? 150 : 0,
            vibrationG: parseFloat((0.1 + Math.random() * 2).toFixed(2)),
            batteryLevel: Math.round(40 + Math.random() * 60),
            gpsSignal: Math.round(-110 + Math.random() * 40),
        }),

        defaultRules: [
            {
                id: 'cc-temp-trip', name: 'Temperature Trip',
                conditions: { all: [{ fact: 'vaccineTemp', operator: '>', value: 8 }] },
                event: { type: 'safety', message: 'Cargo temperature exceeded 8°C — cold chain breach!', severity: 'critical' }
            },
            {
                id: 'cc-light', name: 'Tamper Alert',
                conditions: { all: [{ fact: 'lightExposure', operator: '>', value: 50 }] },
                event: { type: 'security', message: 'Light detected in sealed container — potential tamper event', severity: 'critical' }
            },
            {
                id: 'cc-shock', name: 'High Impact Shock',
                conditions: { all: [{ fact: 'vibrationG', operator: '>', value: 4.5 }] },
                event: { type: 'safety', message: 'Package experienced mechanical shock > 4.5G', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'vaccineTemp', label: 'Temp', unit: '°C', max: 20, color: '#3182CE', warningAt: 6 },
            { fact: 'batteryLevel', label: 'Battery', unit: '%', max: 100, color: '#38A169', invertAlert: true },
            { fact: 'lightExposure', label: 'Light', unit: 'lux', max: 500, color: '#ECC94B', warningAt: 20 },
        ],
    },

    // ════════════════════════════════════════════════════════════════
    // 12. AIRPORT OPERATIONS
    // ════════════════════════════════════════════════════════════════
    airport: {
        id: 'airport',
        label: 'Airport Ops',
        icon: Wifi,
        color: { scheme: 'gray', hex: '#718096', light: '#EDF2F7' },
        description: 'Runway visibility, baggage flow, gate management, ground power monitoring',
        deviceLabel: 'Gate/Asset ID',
        devicePlaceholder: 'GATE-T3-A12',

        facts: [
            { name: 'runwayVis', label: 'Runway Vis (m)', type: 'number', category: 'safety', unit: 'm', min: 0, max: 5000 },
            { name: 'windSpeed', label: 'Wind Speed (kt)', type: 'number', category: 'weather', unit: 'kt', min: 0, max: 100 },
            { name: 'gateOccupancy', label: 'Gate Count', type: 'number', category: 'logistics', unit: 'cnt', min: 0, max: 50 },
            { name: 'baggageThroughput', label: 'Baggage/min', type: 'number', category: 'efficiency', unit: 'pm', min: 0, max: 100 },
            { name: 'groundPowerStatus', label: 'GPU Volt (V)', type: 'number', category: 'mechanical', unit: 'V', min: 0, max: 240 },
            { name: 'fuelLevel', label: 'Hydrant Fuel (kL)', type: 'number', category: 'production', unit: 'kL', min: 0, max: 1000 },
        ],

        simulateSeed: () => ({
            runwayVis: Math.round(400 + Math.random() * 3000),
            windSpeed: Math.round(5 + Math.random() * 35),
            gateOccupancy: Math.round(5 + Math.random() * 40),
            baggageThroughput: Math.round(20 + Math.random() * 60),
            groundPowerStatus: Math.round(200 + Math.random() * 30),
            fuelLevel: Math.round(200 + Math.random() * 600),
        }),

        defaultRules: [
            {
                id: 'air-low-vis', name: 'Low Visibility Mode',
                conditions: { all: [{ fact: 'runwayVis', operator: '<', value: 550 }] },
                event: { type: 'safety', message: 'Runway visibility < 550m — activating CAT III procedure', severity: 'critical' }
            },
            {
                id: 'air-high-wind', name: 'High Wind Warning',
                conditions: { all: [{ fact: 'windSpeed', operator: '>', value: 25 }] },
                event: { type: 'weather', message: 'Wind speed > 25 knots — secure ground equipment', severity: 'warning' }
            },
            {
                id: 'air-baggage-jam', name: 'Baggage Low Flow',
                conditions: { all: [{ fact: 'baggageThroughput', operator: '<', value: 5 }] },
                event: { type: 'efficiency', message: 'Baggage flow critical — possible belt blockage or jam', severity: 'warning' }
            },
        ],

        gauges: [
            { fact: 'runwayVis', label: 'Visibility', unit: 'm', max: 5000, color: '#3182CE', warningAt: 800, invertAlert: true },
            { fact: 'windSpeed', label: 'Wind', unit: 'kt', max: 100, color: '#DD6B20', warningAt: 30 },
            { fact: 'baggageThroughput', label: 'Baggage', unit: 'pm', max: 100, color: '#805AD5' },
        ],
    },
};

// ─── DOMAIN LIST (for pickers) ────────────────────────────────────────────────
export const DOMAIN_LIST = Object.values(DOMAINS);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const getDomain = (id) => DOMAINS[id] || DOMAINS.jeep_proto_5;

export const getDomainFacts = (domainId) => getDomain(domainId).facts;

export const getDomainRules = (domainId) => getDomain(domainId).defaultRules;

export const simulateDomain = (domainId) => getDomain(domainId).simulateSeed();

/**
 * Evaluate rules against data for a given domain.
 * Uses the same operator set as the core RuleEngine.
 */
export const evaluateDomainRules = (domainId, data, customRules = []) => {
    const domain = getDomain(domainId);
    const rules = customRules.length > 0 ? customRules : domain.defaultRules;
    const triggered = [];

    for (const rule of rules) {
        if (!rule.conditions?.all) continue;
        const allPass = rule.conditions.all.every(cond => {
            const val = data[cond.fact];
            const v = cond.value;
            switch (cond.operator) {
                case '>': return Number(val) > Number(v);
                case '>=': return Number(val) >= Number(v);
                case '<': return Number(val) < Number(v);
                case '<=': return Number(val) <= Number(v);
                case '==': case '===': return String(val) === String(v) || val == v;
                case '!=': case '!==': return String(val) !== String(v) && val != v;
                case 'contains': return String(val).includes(String(v));
                case 'between': {
                    const [min, max] = String(v).split(',').map(Number);
                    return Number(val) >= min && Number(val) <= max;
                }
                default: return false;
            }
        });
        if (allPass) {
            triggered.push({ ruleId: rule.id, ruleName: rule.name, ...rule.event, timestamp: new Date().toISOString(), dataSnapshot: { ...data } });
        }
    }
    return triggered;
};
