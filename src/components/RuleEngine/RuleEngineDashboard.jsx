import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box,
    Container,
    Grid,
    GridItem,
    Heading,
    Text,
    Button,
    HStack,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    VStack,
    FormControl,
    FormLabel,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Select,
    Badge,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    useColorModeValue,
    SimpleGrid,
    Progress,
    Flex,
    IconButton,
    Tooltip,
    Spacer,
    Menu,
    MenuButton,
    MenuList,
    MenuItem
} from '@chakra-ui/react';
import { Play, Square, Trash2, Zap, Activity, Car } from 'lucide-react';
import {
    RuleEngine,
    defaultRules, // Keep defaultRules as it's used in DEFAULT_RULE_ENGINE_STATE
    DeviceStates,
    ConfigurableParameters,
    DeviceVariables,
    StateTransitions, // Added
    JeepM6DefaultRules,
    DefaultLifecycleRules // Added
} from '../../utils/RuleEngine';
import LifecycleConfig from './LifecycleConfig'; // Added
import RuleBuilder from './RuleBuilder';
import DataVisualizer from './DataVisualizer';

import CreateRuleTemplate from './CreateRuleTemplate';
import RuleTemplateLibrary from './RuleTemplateLibrary';
import CANSignalBuilder from './CANSignalBuilder'; // Added
import DongleAlertPopup from './DongleAlertPopup'; // Added

import { useAutoPersist } from '../../hooks/useAutoPersist';
import {
    generateDeviceJoinedPayload,
    generateTelemetryPayload,
    generateAlertPayload,
    generateTripPayload,
    generateCommandResponsePayload,
    generateDrivingScorePayload,
    generateWakeupResponsePayload,
    generateFetchLogsResponsePayload,
    generateStateUpdateResponsePayload,
    generateThresholdUpdateResponsePayload
} from '../../utils/SouthBoundPayloads';

// Default initial state for the Rule Engine screen
const DEFAULT_RULE_ENGINE_STATE = {
    rules: defaultRules,

    savedRules: defaultRules,
    parameters: {
        MIN_TRIP_DISTANCE: ConfigurableParameters.find(p => p.name === 'MIN_TRIP_DISTANCE')?.defaultValue || 2,
        MIN_IGN_OFF_TIME: ConfigurableParameters.find(p => p.name === 'MIN_IGN_OFF_TIME')?.defaultValue || 120,
        MAX_IGN_OFF_TIME: ConfigurableParameters.find(p => p.name === 'MAX_IGN_OFF_TIME')?.defaultValue || 300,
        OVERSPEED_THR: ConfigurableParameters.find(p => p.name === 'OVERSPEED_THR')?.defaultValue || 120,
        HARSH_ACCEL_THR: ConfigurableParameters.find(p => p.name === 'HARSH_ACCEL_THR')?.defaultValue || 10,
        HARD_BRAKE_THR: ConfigurableParameters.find(p => p.name === 'HARD_BRAKE_THR')?.defaultValue || 15
    },
    simRoadCondition: 'good',
    activeDriverName: null,
    tripCounter: 1,
    tripCounterDate: new Date().toLocaleDateString('en-GB').replace(/\//g, ''),
    lifecycleRules: DefaultLifecycleRules,
    canSignalRules: [] // Added for Phase 3
};

const RuleEngineDashboard = () => {
    const toast = useToast();
    const intervalRef = useRef(null);
    const demoTimeoutsRef = useRef([]); // Track demo timeouts to clear them on stop
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    // AutoPersist hook for global state persistence
    const { state: persistedState, updateState: updatePersistedState, isLoading } = useAutoPersist({
        screenKey: '/rule-engine',
        initialState: DEFAULT_RULE_ENGINE_STATE,
    });

    // Extract persisted values with defaults
    // Extract persisted values with defaults
    const rules = persistedState.rules || defaultRules;
    const savedRules = persistedState.savedRules || defaultRules;
    const items = persistedState.customRuleTemplates || []; // Renamed key to force fresh state
    const parameters = persistedState.parameters || DEFAULT_RULE_ENGINE_STATE.parameters;
    const lifecycleRules = persistedState.lifecycleRules || DefaultLifecycleRules;
    const simRoadCondition = persistedState.simRoadCondition || 'good';
    const persistedActiveDriverName = persistedState.activeDriverName;
    const canSignalRules = persistedState.canSignalRules || []; // Added

    // Setters that auto-save
    const setRules = (newRules) => updatePersistedState({ rules: newRules });
    const setSavedRules = (newSavedRules) => updatePersistedState({ savedRules: newSavedRules });

    const setCustomRuleTemplates = (newTemplates) => updatePersistedState({ customRuleTemplates: newTemplates });
    const setParameters = (newParams) => {
        if (typeof newParams === 'function') {
            updatePersistedState({ parameters: newParams(parameters) });
        } else {
            updatePersistedState({ parameters: newParams });
        }
    };
    const setLifecycleRules = (newRules) => updatePersistedState({ lifecycleRules: newRules });
    const setSimRoadCondition = (condition) => updatePersistedState({ simRoadCondition: condition });
    const setCanSignalRules = (newRules) => updatePersistedState({ canSignalRules: newRules }); // Added

    // Create engine from persisted rules
    const engine = useMemo(() => new RuleEngine(rules), [rules]);

    // Transient state (not persisted - reset on refresh is OK)
    const [isRunning, setIsRunning] = useState(false);
    const [dataHistory, setDataHistory] = useState([]);
    const [events, setEvents] = useState([]);

    // Device State Machine
    const [deviceState, setDeviceState] = useState(DeviceStates.TRIP_IDLE);
    const prevIgnitionRef = useRef(false);

    // Device Internal Variables
    const deviceVariables = useRef({
        tripStartTime: null,
        tripStartOdo: 0,
        currentTripDistance: 0,
        lastIgnitionOffTime: null,
        elapsedIgnitionOffTime: 0,
        // SouthBound Variables
        vehicleId: 'WAUD2AFD7DN006931',
        imeiNo: '356741000000021',
        tboxSerialNum: 'SN29482029',
        protocolVersion: '2.0.0',
        ccpuVersion: 'CD.02.03',
        vmcuVersion: 'VD0.02.03',
        journeyId: null,
        // Detailed Trip Stats
        harshAccCnt: 0,
        hardBrakeCnt: 0,
        harshTurnCnt: 0,
        idlingCnt: 0,
        idleDuration: 0,
        tripType: 'Idle',
        highSpeedCnt: 0,
        currentTripTime: 0,
        gnssInfoStart: null,
        lastIgnitionOffTime: null,
        tripStartTimeEpoch: null, // Section 16 epoch
        topSpeed: 0,
        vinFragments: {}, // Track fragments for 0x3E0
        vinProgress: 0,
        msisdn: '9123456789',
        drivingScore: 100,
        batteryVoltage: 12.8,
        isDeviceRemoved: false
    });

    const [tboxApplicationState, setTboxApplicationState] = useState(DeviceStates.PRE_SALES);
    const [tboxOperatingState, setTboxOperatingState] = useState('NORMAL');
    const [tboxeSimState, setTboxeSimState] = useState('NORMAL_SIM');
    const [lastPayload, setLastPayload] = useState(null);
    const [lastTripPayload, setLastTripPayload] = useState(null);

    // Simulation Loop Helpers
    const prevSpeedRef = useRef(0);
    const lastHarshAccTime = useRef(0);
    const lastHardBrakeTime = useRef(0);
    const velocitySamplesRef = useRef([]); // To keep last 200ms
    const lastProgressTime = useRef(0);
    const shutdownSamplesSent = useRef(0);
    const ignOnTime = useRef(0);
    const milCheckTimer = useRef(null); // Timer for 5s MIL delay

    const [simSpeed, setSimSpeed] = useState(0);
    const [ignition, setIgnition] = useState(false);
    const idleStartTimeRef = useRef(null);
    const idleCountedRef = useRef(false);
    const activeAlertInstances = useRef({}); // { ruleId: { alertId, type, message } }
    const [isSpeedAlertLive, setIsSpeedAlertLive] = useState(false);

    // FOTA State
    const [fotaStatus, setFotaStatus] = useState('IDLE');
    const [fotaProgress, setFotaProgress] = useState(0);

    // Jeep M6 Simulation State
    const [batteryVoltage, setBatteryVoltage] = useState(12.6);
    const [crashDetected, setCrashDetected] = useState(false);
    const [geoFenceStatus, setGeoFenceStatus] = useState('INSIDE'); // INSIDE, OUTSIDE
    const [lastCommand, setLastCommand] = useState('NONE');
    const [isDeviceRemoved, setIsDeviceRemoved] = useState(false);

    // M6 Pedal State
    const [gasPedal, setGasPedal] = useState(0);
    const [brakeActive, setBrakeActive] = useState(false);
    const [milActive, setMilActive] = useState(false);

    // CAN Bus State
    const [canBusData, setCanBusData] = useState([]);

    // View State for Rule Templates
    const [templateView, setTemplateView] = useState('library'); // 'library' or 'create'

    // Alert Popup State
    const [activePopupAlert, setActivePopupAlert] = useState(null);
    const [isAlertPopupOpen, setIsAlertPopupOpen] = useState(false);

    // Trip Stats (Required for simulation)
    const tripStats = useRef({
        runTime: 0,      // seconds
        distance: 0,     // km
        offTime: 0       // seconds
    });

    const activeCriticalAlerts = useRef({}); // Track rule IDs that have already shown a toast

    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [prefillRule, setPrefillRule] = useState(null);


    // Handlers
    const handleSaveToLibrary = (rule) => {
        const exists = savedRules.some(r => r.name === rule.name);
        let newSavedRules;
        if (exists) {
            newSavedRules = savedRules.map(r => r.name === rule.name ? rule : r);
            toast({ title: 'Rule Updated', status: 'success', duration: 2000 });
        } else {
            newSavedRules = [...savedRules, rule];
            toast({ title: 'Rule Saved', status: 'success', duration: 2000 });
        }
        setSavedRules(newSavedRules);
        // Auto-persisted by useAutoPersist

    };

    const handleSaveTemplate = (template) => {
        const newTemplates = [...items, template];
        setCustomRuleTemplates(newTemplates);
        toast({ title: 'Template Created', status: 'success', duration: 2000 });
        setTemplateView('library');
    };

    const handleUseTemplate = (template) => {
        setPrefillRule(template);
        setActiveTabIndex(0); // Switch to Rule Builder tab (Index 0)
        toast({ title: 'Template Loaded', description: 'Rule Builder prefilled with template data.', status: 'info', duration: 2000 });
    };

    const handleCreateTemplate = (newTemplate) => {
        setCustomRuleTemplates([...items, newTemplate]);
        toast({ title: 'Template Created', status: 'success' });
        setTemplateView('library');
    };

    const handleAddRule = (newRule) => {
        setRules([...rules, newRule]);
        toast({ title: 'Rule Added', status: 'success', duration: 2000 });
    };

    const handleDeleteRule = (ruleId) => {
        setRules(rules.filter(r => r.id !== ruleId));
    };

    const toggleSimulation = () => {
        const willRun = !isRunning;
        setIsRunning(willRun);

        if (willRun) {
            // Auto-start for better UX
            if (!ignition) {
                toggleIgnition();
            }
            if (simSpeed === 0) {
                setSimSpeed(40); // Default cruising speed
            }
            toast({ title: 'Simulation Started', description: 'Ignition ON, Speed 40 km/h', status: 'success', duration: 2000 });
        } else {
            toast({ title: 'Simulation Stopped', status: 'info', duration: 2000 });
        }
    };
    const toggleIgnition = () => {
        // Lifecycle Check: Allow ignition in all states except PRE-SALES
        // (Section 3 requires monitoring CAN in FACTORY for VIN discovery)
        const isPreSales = tboxApplicationState === DeviceStates.PRE_SALES;

        if (!ignition && isPreSales) {
            toast({
                title: 'Ignition Blocked',
                description: `Ignition is disabled in ${tboxApplicationState} state. Device must reach FACTORY state first.`,
                status: 'warning',
                duration: 3000
            });
            return;
        }

        const nextIgnition = !ignition;
        setIgnition(nextIgnition);

        if (nextIgnition) {
            // Ignition OFF → ON

            // Check if we're resuming from TRIP_PAUSED
            if (deviceState === DeviceStates.TRIP_PAUSED) {
                // Resume the trip - go back to TRIP_ACTIVE
                setDeviceState(DeviceStates.TRIP_ACTIVE);
                toast({ title: 'Trip Resumed', description: 'Continuing paused trip', status: 'success', duration: 2000 });
                setEvents(prev => [...prev, {
                    ruleId: 'trip-resume', ruleName: 'Trip Resume', type: 'state',
                    message: 'Trip resumed from TRIP_PAUSED state', severity: 'info',
                    timestamp: new Date().toISOString()
                }].slice(-100));
                // Reset ignition timer but keep trip stats
                ignOnTime.current = Date.now();
                return;
            }

            // 120min Trip Continuity Logic
            const now = Date.now();
            const lastOff = deviceVariables.current.lastIgnitionOffTime;
            const diffMins = lastOff ? (now - lastOff) / (1000 * 60) : 999;

            if (diffMins < 120 && deviceVariables.current.journeyId && deviceState !== DeviceStates.TRIP_IDLE) {
                // Continue Previous Trip
                setDeviceState(DeviceStates.TRIP_ACTIVE);
                toast({ title: 'Trip Continued', description: `Ignition back ON within ${Math.round(diffMins)} mins.`, status: 'info' });
                // Note: Section 16 metadata like startTime remains the same for continued trips
            } else {
                // Before starting a new trip, send Trip End for the previous one (if any)
                if (deviceVariables.current.journeyId) {
                    const endPayload = generateTripPayload('tripEnd', {
                        ...deviceVariables.current,
                        lifecycleRules
                    });
                    setLastTripPayload(endPayload);
                    setEvents(prev => [...prev, {
                        ruleId: 'trip-end-previous', ruleName: 'Trip End (Previous)', type: 'info',
                        message: `Sent End Payload for previous trip: ${deviceVariables.current.journeyId}`, severity: 'info',
                        timestamp: new Date().toISOString()
                    }].slice(-100));
                }

                // Start New Trip - Begin in TRIP_PENDING
                const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '');

                // Get or initialize persistent counter
                let currentCounter = persistedState.tripCounter || 1;
                const counterDate = persistedState.tripCounterDate;

                if (counterDate !== dateStr) {
                    currentCounter = 1; // Reset on new day
                }

                // Format: DDMMYYYYNo (e.g., 3012202501)
                const tripNum = currentCounter.toString().padStart(2, '0');
                const newTripId = `${dateStr}${tripNum}`;

                // Increment and save counter for next trip
                updatePersistedState({
                    tripCounter: currentCounter + 1,
                    tripCounterDate: dateStr
                });

                deviceVariables.current = {
                    ...deviceVariables.current,
                    journeyId: newTripId,
                    tripStartTime: new Date().toISOString(),
                    tripStartTimeEpoch: Math.floor(Date.now() / 1000),
                    tripStartOdo: deviceVariables.current.tripStartOdo + deviceVariables.current.currentTripDistance,
                    currentTripDistance: 0,
                    currentTripTime: 0,
                    harshAccCnt: 0,
                    hardBrakeCnt: 0,
                    harshTurnCnt: 0,
                    idlingCnt: 0,
                    idleDuration: 0,
                    topSpeed: 0,
                    tripType: 'Idle',
                    gnssInfoStart: { lat: 12.9716, long: 77.5946 },
                    drivingScore: 100
                };

                setDeviceState(DeviceStates.TRIP_PENDING);

                // Section 16.2: Trip Start Payload
                const startPayload = generateTripPayload('tripStart', {
                    ...deviceVariables.current,
                    lifecycleRules
                });
                setLastTripPayload(startPayload);
                toast({ title: 'New Trip Registered', description: `Trip ID: ${newTripId}`, status: 'success', duration: 2000 });

                // Reset timers for new trip
                ignOnTime.current = Date.now();
                lastProgressTime.current = Date.now();
                shutdownSamplesSent.current = 0;
                tripStats.current = { runTime: 0, distance: 0, offTime: 0 };
            }
        } else {
            // Ignition ON → OFF
            // Don't immediately set TRIP_IDLE - let the simulation loop handle state transitions
            setSimSpeed(0);
            deviceVariables.current.lastIgnitionOffTime = Date.now();
            toast({ title: 'Ignition OFF', description: 'Engine stopped', status: 'info' });
        }
    };

    const clearData = () => {
        // Stop simulation
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Reset data history and events
        setDataHistory([]);
        setEvents([]);

        // Reset simulation controls
        setIgnition(false);
        setSimSpeed(0);
        // Active driver logic removed

        // Reset Jeep M6 Controls
        setBatteryVoltage(12.6);
        setCrashDetected(false);
        setFotaStatus('IDLE');
        setGeoFenceStatus('INSIDE');
        setLastCommand('NONE');

        // Reset trip stats
        tripStats.current = { runTime: 0, distance: 0, offTime: 0 };

        // Reset device variables
        deviceVariables.current = {
            tripStartTime: null,
            tripStartOdo: 0,
            currentTripDistance: 0,
            lastIgnitionOffTime: null,
            elapsedIgnitionOffTime: 0
        };

        // Reset device state to IDLE
        setDeviceState(DeviceStates.TRIP_IDLE);
        prevIgnitionRef.current = false;

        // Clear active alerts tracking
        activeCriticalAlerts.current = {};

        // Clear any running demo timeouts
        demoTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        demoTimeoutsRef.current = [];
    };

    const handleRemoteCommand = (commandType, payload = {}) => {
        const commandId = Math.random().toString(36).substring(7);
        const timestamp = Date.now();
        const commandReceivedAt = payload.timestamp || timestamp;

        // Section 10.8: Command Expiry (60s)
        if (timestamp - commandReceivedAt > 60000) {
            toast({ title: 'Command Expired', description: 'Command received after 60s timeout. Ignoring.', status: 'warning' });
            return;
        }

        toast({ title: `Remote Command: ${commandType}`, description: `ID: ${commandId}`, status: 'info' });

        // Simulate device processing delay
        setTimeout(() => {
            let status = 'Success';
            let responsePayload = null;
            let extraMsg = '';

            // Section 10.13: Failure Code Logic (Simplified Simulation)
            if (crashDetected && (commandType === 'DoorLock' || commandType === 'DoorUnlock')) {
                status = 'Failure';
                extraMsg = ' (Failure Code: Crashed_Detected)';
            }

            switch (commandType) {
                case 'Blinker':
                case 'DoorLock':
                case 'DoorUnlock':
                case 'Honk':
                    responsePayload = generateCommandResponsePayload(commandId, commandType, status, {
                        ...deviceVariables.current,
                        tboxApplicationState
                    });
                    break;

                case 'Wakeup':
                    responsePayload = generateWakeupResponsePayload(commandId, {
                        ...deviceVariables.current,
                        tboxApplicationState
                    });
                    // Section 10.2: Refresh triggers automated telemetry
                    const telPayload = generateTelemetryPayload({
                        ...deviceVariables.current,
                        tboxApplicationState
                    }, {
                        speed: simSpeed,
                        rpm: 800,
                        batteryVoltage
                    });
                    setLastPayload({ type: 'telemetry', content: telPayload });
                    break;

                case 'FetchLogs':
                    responsePayload = generateFetchLogsResponsePayload(commandId, 'Success', 'invalidErrorCode(00)', {
                        ...deviceVariables.current,
                        tboxApplicationState
                    });
                    break;

                case 'TBOXStateUpdate':
                    const nextState = payload.targetState || 'CUSTOMER';
                    setTboxApplicationState(nextState);
                    responsePayload = generateStateUpdateResponsePayload(commandId, 'Success', nextState, {
                        ...deviceVariables.current,
                        tboxApplicationState: nextState
                    });
                    break;

                case 'UserDefinedSpeed':
                    const newSpeed = payload.speed || 95;
                    setParameters(prev => ({ ...prev, OVERSPEED_THR: newSpeed }));
                    responsePayload = generateThresholdUpdateResponsePayload(commandId, 'UserDefinedSpeed', 'Success', { speed: newSpeed }, {
                        ...deviceVariables.current,
                        tboxApplicationState
                    });
                    toast({ title: 'Overspeed Updated', description: `New threshold: ${newSpeed} km/h` });
                    break;

                case 'UserDefinedMinimumTripDistance':
                    const newDist = payload.distance || 5;
                    const newOff = payload.engineOffTime || 15;
                    setParameters(prev => ({ ...prev, MIN_TRIP_DISTANCE: newDist, MIN_IGN_OFF_TIME: newOff }));
                    responsePayload = generateThresholdUpdateResponsePayload(commandId, 'UserDefinedMinimumTripDistance', 'Success', { distance: newDist, engineOffTime: newOff }, {
                        ...deviceVariables.current,
                        tboxApplicationState
                    });
                    break;

                default:
                    responsePayload = generateCommandResponsePayload(commandId, commandType, status, {
                        ...deviceVariables.current,
                        tboxApplicationState
                    });
            }

            setLastPayload({ type: 'commandResponse', content: responsePayload });

            setEvents(prev => [...prev, {
                ruleId: 'remote-cmd',
                ruleName: 'Remote Command',
                type: 'event',
                message: `Remote ${commandType} ${status}${extraMsg}`,
                severity: status === 'Success' ? 'success' : 'error',
                timestamp: new Date().toISOString(),
                dataSnapshot: { commandId, commandType, status }
            }].slice(-100));

            toast({
                title: `Command ${status}`,
                description: `${commandType} processed${extraMsg}.`,
                status: status === 'Success' ? 'success' : 'error'
            });
        }, 1500);
    };

    const runFotaSequence = () => {
        setFotaStatus('DOWNLOADING');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setFotaProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setFotaStatus('READY_FOR_INSTALL');
                toast({ title: 'FOTA Downloaded', description: 'Version CD.02.04 ready.', status: 'success' });
            }
        }, 500);
    };

    const handleInstallFota = () => {
        if (ignition) {
            toast({ title: 'Installation Failed', description: 'Engine must be OFF to install FOTA.', status: 'error' });
            return;
        }
        setFotaStatus('INSTALLING');
        setTimeout(() => {
            setFotaStatus('SUCCESS');
            deviceVariables.current.ccpuVersion = 'CD.02.04';
            toast({ title: 'FOTA Success', description: 'System updated to CD.02.04.', status: 'success' });
        }, 3000);
    };

    const handleLifecycleCommand = (command) => {
        setLastCommand(command);
        let validTransition = false;
        let nextState = tboxApplicationState;

        if (tboxApplicationState === DeviceStates.FACTORY && command === 'PROVISION') {
            nextState = DeviceStates.PROVISIONED;
            validTransition = true;
        } else if (tboxApplicationState === DeviceStates.PROVISIONED && command === 'AUTHORIZE') {
            nextState = DeviceStates.AUTHORIZED;
            validTransition = true;
        } else if (tboxApplicationState === DeviceStates.AUTHORIZED && command === 'HANDOVER') {
            nextState = DeviceStates.CUSTOMER; // Explicitly CUSTOMER
            validTransition = true;
        }

        if (validTransition) {
            setTboxApplicationState(nextState);
            setDeviceState(nextState === DeviceStates.CUSTOMER ? DeviceStates.TRIP_IDLE : nextState);

            // Generate DeviceJoined Payload
            const payload = generateDeviceJoinedPayload({
                ...deviceVariables.current,
                tboxApplicationState: nextState,
                tboxOperatingState,
                lifecycleRules // Added
            });
            setLastPayload({ type: 'deviceJoined', content: payload });

            toast({
                title: 'Lifecycle Update',
                description: `State changed to ${nextState}`,
                status: 'success',
                duration: 2000
            });
        } else {
            toast({
                title: 'Command Rejected',
                description: `Cannot ${command} from ${tboxApplicationState}`,
                status: 'warning',
                duration: 2000
            });
        }
    };

    const triggerManualAlert = (alertType) => {
        // This injects a one-time alert trigger into the simulation loop
        // OR we can explicitly evaluate it here.
        // Let's rely on the loop to catch it if we set a transient flag?
        // Better: evaluate immediately for immediate feedback.

        const currentData = {
            ...deviceVariables.current,
            speed: simSpeed,
            ignition: ignition,
            alertType: alertType, // THE TRIGGER
            batteryVoltage,
            crashDetected,
            geoFenceStatus
        };

        const triggeredEvents = engine.evaluate(currentData);
        const alertEvent = triggeredEvents.find(e => e.type.includes('alert'));

        if (alertEvent) {
            const payload = generateAlertPayload({
                ...currentData,
                lifecycleRules // Added 
            }, alertEvent.alertDetails || { type: alertType, message: alertEvent.message });
            setLastPayload({ type: 'alert', content: payload });
            setEvents(prev => [...prev, alertEvent].slice(-100));
            toast({ title: alertEvent.message, status: 'warning' });
        } else {
            toast({ title: 'No Rule Triggered', description: `Check if rule for ${alertType} checks 'alertType'`, status: 'info' });
        }
    };

    const handleLoadM6Rules = () => {
        setRules([...rules, ...JeepM6DefaultRules]);
        toast({ title: 'Jeep M6 Rules Loaded', status: 'success', duration: 2000 });
    };

    const runFullAutomatedDemo = () => {
        // Clear any existing demo
        demoTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        demoTimeoutsRef.current = [];

        // 1. Reset to Start (PRE-SALES)
        clearData();
        setTboxApplicationState(DeviceStates.PRE_SALES);
        setDeviceState(DeviceStates.TRIP_IDLE);
        setIsRunning(false);
        setIgnition(false);
        setSimSpeed(0);

        toast({
            title: 'Full Automated Demo Started',
            description: 'Step 1: Device in PRE-SALES (Initial Factory State)',
            status: 'info',
            duration: 3000,
            position: 'top'
        });

        // 2. Start Simulation -> Automatically moves to FACTORY (Installation Detected)
        demoTimeoutsRef.current.push(setTimeout(() => {
            setIsRunning(true);
            toast({ title: 'Step 2: FACTORY State', description: 'Active signals detected. Monitoring CAN for VIN discovery...', status: 'info' });
        }, 3000));

        // 3. Toggle Ignition -> Starts VIN Discovery
        demoTimeoutsRef.current.push(setTimeout(() => {
            toggleIgnition();
            toast({ title: 'Ignition ON', description: 'Starting VIN reconstruction (CAN 0x3E0)...', status: 'success' });
        }, 6000));

        // 4. Force PROVISIONED State (Determinism)
        demoTimeoutsRef.current.push(setTimeout(() => {
            setTboxApplicationState(DeviceStates.PROVISIONED);
            toast({ title: 'Step 3: PROVISIONED State', description: 'VIN Discovered! Identity switched to VIN. Provisioning certificates...', status: 'info' });
        }, 22000));

        // 5. Force AUTHORIZED State (Determinism)
        demoTimeoutsRef.current.push(setTimeout(() => {
            setTboxApplicationState(DeviceStates.AUTHORIZED);
            toast({ title: 'Step 4: AUTHORIZED State', description: 'Certificates provisioned. Ready for service activation.', status: 'info' });
        }, 26000));

        // 6. Force CUSTOMER State (Handover)
        demoTimeoutsRef.current.push(setTimeout(() => {
            setTboxApplicationState(DeviceStates.CUSTOMER);
            setDeviceState(DeviceStates.TRIP_IDLE); // Ensure clean state
            toast({ title: 'Step 5: CUSTOMER State', description: 'Handover complete. Identity switched to MSISDN. All features enabled.', status: 'success' });
        }, 30000));

        // 7. Start Driving & Trips
        demoTimeoutsRef.current.push(setTimeout(() => {
            setSimSpeed(45);
            setRules([...rules, ...JeepM6DefaultRules]);
            toast({ title: 'Trip Started', description: 'Cruising at 45 km/h. Monitoring for events...', status: 'info' });
        }, 34000));

        // 8. Trigger Overspeed
        demoTimeoutsRef.current.push(setTimeout(() => {
            setSimSpeed(115);
            toast({ title: 'Simulating Alert', description: 'Exceeding speed threshold...', status: 'warning' });
        }, 40000));

        // 9. End Trip
        demoTimeoutsRef.current.push(setTimeout(() => {
            setSimSpeed(0);
            toggleIgnition();
            toast({ title: 'Demo Completed', description: 'Full lifecycle and trip scenario finished.', status: 'success', duration: 10000 });
        }, 50000));
    };

    const runCANDemo = () => {
        // Clear any existing demo
        demoTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        demoTimeoutsRef.current = [];

        // 1. Reset
        clearData();
        setTboxApplicationState(DeviceStates.CUSTOMER);
        setIsRunning(false);
        setIgnition(true); // Ignition ON to see data
        setSimSpeed(0);

        toast({
            title: 'CAN Configuration Demo Started',
            description: 'Initializing environment for CAN signal processing...',
            status: 'info',
            duration: 3000
        });

        // 2. Define CAN Signal
        demoTimeoutsRef.current.push(setTimeout(() => {
            const newSignal = {
                id: Date.now(),
                name: 'Engine_Temp',
                identifier: '0x123',
                endianness: 'Little Endian',
                startBit: 0,
                length: 8,
                factor: 1,
                offset: 0,
                min: 0,
                max: 150,
                unit: '°C'
            };
            setCanSignalRules([newSignal]);
            toast({
                title: 'Step 1: Signal Defined',
                description: 'Defined CAN ID 0x123 (Engine_Temp) with 1:1 scaling.',
                status: 'success'
            });
        }, 3000));

        // 3. Define Alert Rule using the Signal
        demoTimeoutsRef.current.push(setTimeout(() => {
            const overheatRule = {
                id: 'engine-overheat-' + Date.now(),
                name: 'Engine Overheat Alert',
                condition: 'Engine_Temp > 102',
                event: {
                    name: 'ALERT_ENGINE_OVERHEAT',
                    severity: 'critical',
                    category: 'Diagnostic'
                }
            };
            setRules([...rules, overheatRule]);
            toast({
                title: 'Step 2: Rule Assigned',
                description: 'Monitoring Engine_Temp fact from CAN configuration...',
                status: 'info'
            });
        }, 8000));

        // 4. Start Simulation and watch data
        demoTimeoutsRef.current.push(setTimeout(() => {
            setIsRunning(true);
            setActiveTabIndex(2); // Switch to CAN Configuration tab to see the bus
            toast({
                title: 'Step 3: Simulation Active',
                description: 'Watch the CAN Bus table. Decoded value will fluctuate toward 105°C.',
                status: 'info',
                duration: 5000
            });
        }, 12000));

        // 5. Success
        demoTimeoutsRef.current.push(setTimeout(() => {
            toast({
                title: 'Alert Triggered!',
                description: 'Engine_Temp exceeded 102°C. Check Event Log below.',
                status: 'warning',
                duration: 5000
            });
        }, 22000));
    };

    const runDemoScenario = () => {
        // 1. Reset
        // 1. Reset
        clearData();
        setTboxApplicationState(DeviceStates.CUSTOMER); // Ensure we are in customer mode for demo
        setDeviceState(DeviceStates.TRIP_IDLE);
        // ... (rest of demo logic needs to ensure it works, assume TRIP_IDLE is fine)


        // 2. Load Rules
        setRules([...rules, ...JeepM6DefaultRules]);
        toast({ title: 'Demo Started: Rules Loaded', status: 'info', duration: 2000 });

        // 3. Start Simulation
        demoTimeoutsRef.current.push(setTimeout(() => {
            setIsRunning(true);
            toggleIgnition();
            toast({ title: 'Ignition ON', status: 'success', duration: 2000 });
        }, 1000));

        // 4. Normal Drive
        demoTimeoutsRef.current.push(setTimeout(() => {
            setSimSpeed(60);
            toast({ title: 'Cruising at 60 km/h', status: 'info' });
        }, 3000));

        // 5. Overspeed
        demoTimeoutsRef.current.push(setTimeout(() => {
            setSimSpeed(110); // Trigger Overspeed Rule
            toast({ title: 'Simulating Overspeed...', status: 'warning' });
        }, 6000));

        // 6. Slow Down & Low Battery
        demoTimeoutsRef.current.push(setTimeout(() => {
            setSimSpeed(40);
            setBatteryVoltage(10.5); // Trigger Low Battery Rule
            toast({ title: 'Simulating Low Battery...', status: 'warning' });
        }, 12000));

        // 7. Crash
        demoTimeoutsRef.current.push(setTimeout(() => {
            setCrashDetected(true); // Trigger Crash Rule
            toast({ title: 'Simulating CRASH!', status: 'error' });
        }, 16000));

        // 8. End
        demoTimeoutsRef.current.push(setTimeout(() => {
            setIsRunning(false);
            toggleIgnition();
            toast({ title: 'Demo Completed', position: 'top', duration: 5000 });
        }, 20000));
    };

    // Simulation Loop
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                let currentSpeed = simSpeed;
                let currentRpm = 0;

                const rulesForState = lifecycleRules[tboxApplicationState] || DefaultLifecycleRules[tboxApplicationState];
                const alertsEnabled = rulesForState?.subsystems?.Alerts !== false;
                const telemetryEnabled = rulesForState?.subsystems?.Telemetry !== false;
                const gpsEnabled = rulesForState?.subsystems?.GPS !== false;
                const canEnabled = rulesForState?.subsystems.CAN !== false;

                // Section 3.2.1: PRE-SALES → FACTORY transition
                // Detects vehicle installation (active CAN, GPS, GSM) - Simulated when simulation starts
                if (tboxApplicationState === DeviceStates.PRE_SALES) {
                    setTboxApplicationState(DeviceStates.FACTORY);
                    setEvents(prev => [...prev, {
                        ruleId: 'system-startup', ruleName: 'Lifecycle Transition', type: 'state',
                        message: 'Active signals detected. Transitioning PRE-SALES → FACTORY', severity: 'info',
                        timestamp: new Date().toISOString()
                    }].slice(-100));
                }

                if (ignition) {
                    // Engine is ON
                    tripStats.current.runTime += 1;
                    // Only reset offTime if we're starting a new trip or resuming from pause
                    // Don't reset it every tick - this breaks the pause/resume logic
                    if (deviceState === DeviceStates.TRIP_PENDING || deviceState === DeviceStates.TRIP_ACTIVE) {
                        tripStats.current.offTime = 0;
                        deviceVariables.current.elapsedIgnitionOffTime = 0;
                    }

                    // Section 4.1.3: MIL Delayed Evaluation (5s after Engine ON)
                    // Only check if subsystems allow GPS/CAN (MIL usually comes from CAN)
                    if (canEnabled && ignOnTime.current && (Date.now() - ignOnTime.current >= 5000) && !milCheckTimer.current) {
                        milCheckTimer.current = true; // Mark that we passed the 5s check
                        setEvents(prev => [...prev, {
                            ruleId: 'mil-check', ruleName: 'MIL Check', type: 'state',
                            message: 'Evaluating MIL status (5s delay met)', severity: 'info',
                            timestamp: new Date().toISOString()
                        }].slice(-100));
                    }

                    // Default behavior
                    const fluctuation = Math.floor(Math.random() * 5) - 2;
                    currentSpeed = Math.max(0, Math.min(200, simSpeed + fluctuation));
                    currentRpm = Math.floor(1000 + Math.random() * 7000);

                    // Unified Simulation: Add noise to battery voltage if engine is ON
                    // Simulate alternator fluctuating between 13.5V and 14.5V
                    setBatteryVoltage(prev => {
                        // If it was forced low (e.g. 10.5) during demo, let's slowly recover it or fluctuate it?
                        // If it's very low, maybe don't auto-recover instantly to keep the 'problem' visible.
                        // But for normal simulation, we want 13.5-14.5.
                        if (prev > 12) {
                            return parseFloat((13.5 + Math.random()).toFixed(1));
                        }
                        return prev; // Keep it low if it was set low, until manual reset
                    });

                    // VIN Discovery Simulation (Section 4.1.1)
                    // Check if lifecycle rules allow VIN decoding
                    if (rulesForState?.allowedActions?.vinDecoding && tboxApplicationState === DeviceStates.FACTORY) {
                        const currentFragments = { ...deviceVariables.current.vinFragments };
                        const fragmentCount = Object.keys(currentFragments).length;

                        if (fragmentCount < 3) { // Simplified 3 fragments for 17 chars
                            const nextFragmentIndex = fragmentCount;
                            // Simulate reception from 0x3E0
                            if (Math.random() > 0.7) {
                                const fragmentData = deviceVariables.current.vehicleId.substring(nextFragmentIndex * 7, (nextFragmentIndex + 1) * 7);
                                currentFragments[nextFragmentIndex] = fragmentData;
                                deviceVariables.current.vinFragments = currentFragments;
                                deviceVariables.current.vinProgress = Math.round(((fragmentCount + 1) / 3) * 100);

                                setEvents(prev => [...prev, {
                                    ruleId: 'vin-discovery', ruleName: 'VIN Fragment', type: 'state',
                                    message: `Received VIN fragment ${nextFragmentIndex} from CAN ID 0x3E0`, severity: 'info',
                                    timestamp: new Date().toISOString()
                                }].slice(-100));

                                if (fragmentCount + 1 === 3) {
                                    toast({ title: 'VIN Discovered', description: `Full VIN: ${deviceVariables.current.vehicleId}`, status: 'success' });
                                    // Auto-move to Provisioned as per Exit Condition Section 3.2.2
                                    setTimeout(() => handleLifecycleCommand('PROVISION'), 1000);
                                }
                            }
                        }
                    }

                    // Update timers
                    const now = Date.now();

                    // Update distance (speed is km/h, time is 1s)
                    // Distance increment (km) = (speed / 3600) * 1s
                    const distInc = currentSpeed / 3600;
                    tripStats.current.distance += distInc;
                    deviceVariables.current.currentTripDistance = tripStats.current.distance;

                    if (currentSpeed > deviceVariables.current.topSpeed) {
                        deviceVariables.current.topSpeed = currentSpeed;
                    }

                    // --- CAN Bus Simulation ---
                    // Generate CAN frames based on defined signals and current physical values
                    const newCanFrames = [];
                    const signalsByMessage = {}; // Group signals by ID

                    canSignalRules.forEach(signal => {
                        let physicalValue = 0;
                        // Map known signal names to simulation variables
                        const name = signal.name.toLowerCase();
                        if (name.includes('speed') && !name.includes('engine')) physicalValue = currentSpeed;
                        else if (name.includes('rpm') || name.includes('engine speed')) physicalValue = currentRpm;
                        else if (name.includes('temp')) physicalValue = 90 + (Math.sin(now / 10000) * 5); // Mock temp
                        else if (name.includes('battery') || name.includes('voltage')) physicalValue = batteryVoltage;
                        else if (name.includes('mil')) physicalValue = milActive ? 1 : 0;
                        else if (name.includes('fuel')) physicalValue = 75;

                        // Reverse Engineering: Calculate Raw Value
                        // phys = raw * factor + offset  =>  raw = (phys - offset) / factor
                        const rawValue = Math.round((physicalValue - signal.offset) / signal.factor);

                        // Group by ID
                        if (!signalsByMessage[signal.identifier]) {
                            signalsByMessage[signal.identifier] = [];
                        }
                        signalsByMessage[signal.identifier].push({ ...signal, rawValue, physicalValue });
                    });

                    // Create Frames
                    Object.keys(signalsByMessage).forEach(id => {
                        const signals = signalsByMessage[id];
                        // Construct "Data Bytes" (Simplified: just listing signals)
                        // In a real CAN sim, we would pack bits. Here we just show the decoded signals.
                        newCanFrames.push({
                            id,
                            timestamp: new Date().toISOString().split('T')[1].slice(0, -1),
                            signals: signals.map(s => ({
                                name: s.name,
                                value: s.physicalValue.toFixed(2) + (s.unit || ''),
                                raw: '0x' + s.rawValue.toString(16).toUpperCase()
                            }))
                        });
                    });

                    if (newCanFrames.length > 0) {
                        setCanBusData(prev => [...newCanFrames, ...prev].slice(0, 50)); // Keep last 50 frames
                    }
                    // --------------------------

                    // State Machine: TRIP_PENDING → TRIP_ACTIVE transition
                    const minTripDist = Number(parameters.MIN_TRIP_DISTANCE) || 2;
                    if (deviceState === DeviceStates.TRIP_PENDING &&
                        deviceVariables.current.currentTripDistance >= minTripDist) {
                        setDeviceState(DeviceStates.TRIP_ACTIVE);
                        toast({
                            title: 'State: TRIP_ACTIVE',
                            description: `Trip confirmed! Distance: ${deviceVariables.current.currentTripDistance.toFixed(2)} km (threshold: ${minTripDist} km)`,
                            status: 'success',
                            duration: 2000
                        });
                        // Log State Change
                        setEvents(prev => [...prev, {
                            ruleId: 'state-change', ruleName: 'State Change', type: 'state',
                            message: `State changed to TRIP_ACTIVE (Distance ${deviceVariables.current.currentTripDistance.toFixed(2)}km >= ${minTripDist}km)`,
                            severity: 'success',
                            timestamp: new Date().toISOString(),
                            dataSnapshot: { ...deviceVariables.current, deviceState: DeviceStates.TRIP_ACTIVE }
                        }].slice(-100));
                    }

                } else {
                    // Engine is OFF
                    currentSpeed = 0;
                    currentRpm = 0;
                    tripStats.current.offTime += 1;
                    deviceVariables.current.elapsedIgnitionOffTime = tripStats.current.offTime;

                    // State Machine: TRIP_PENDING/ACTIVE → TRIP_PAUSED → TRIP_IDLE
                    // Ensure parameters are numbers with sensible defaults (prevents aggressive cutoffs)
                    const minIgnOff = Number(parameters.MIN_IGN_OFF_TIME) || 120; // Default 2 mins
                    const maxIgnOff = Number(parameters.MAX_IGN_OFF_TIME) || 300; // Default 5 mins

                    // First check: TRIP_PAUSED or any state → TRIP_IDLE when MAX_IGN_OFF_TIME is reached
                    if ((deviceState === DeviceStates.TRIP_PAUSED || deviceState === DeviceStates.TRIP_ACTIVE || deviceState === DeviceStates.TRIP_PENDING) &&
                        deviceVariables.current.elapsedIgnitionOffTime >= maxIgnOff) {
                        setDeviceState(DeviceStates.TRIP_IDLE);
                        setIsRunning(false); // STOP SIMULATION

                        // Generate tripEnd payload
                        const endPayload = generateTripPayload('tripEnd', {
                            ...deviceVariables.current,
                            lifecycleRules
                        });
                        setLastTripPayload(endPayload);

                        toast({
                            title: 'State: TRIP_IDLE',
                            description: `Trip ended. Ignition off for ${maxIgnOff}s. Simulation Stopped.`,
                            status: 'info',
                            duration: 2000
                        });
                        // Log State Change
                        setEvents(prev => [...prev, {
                            ruleId: 'state-change', ruleName: 'State Change', type: 'state',
                            message: 'State changed to TRIP_IDLE (Trip Ended)', severity: 'info',
                            timestamp: new Date().toISOString(), dataSnapshot: { ...deviceVariables.current, deviceState: DeviceStates.TRIP_IDLE }
                        }].slice(-100));
                    }
                    // Second check: TRIP_PENDING/ACTIVE → TRIP_PAUSED when MIN_IGN_OFF_TIME is reached (but before MAX)
                    else if ((deviceState === DeviceStates.TRIP_PENDING || deviceState === DeviceStates.TRIP_ACTIVE) &&
                        deviceVariables.current.elapsedIgnitionOffTime >= minIgnOff) {
                        // ... existing pause logic ...

                        // If we are PENDING and hit minIgnOff, it's a False Trip -> Go straight to IDLE and STOP
                        if (deviceState === DeviceStates.TRIP_PENDING) {
                            setDeviceState(DeviceStates.TRIP_IDLE);
                            setIsRunning(false); // STOP SIMULATION
                            toast({ title: 'False Trip Ended', description: 'Distance too short. Simulation Stopped.', status: 'info', duration: 2000 });
                        } else {
                            // TRIP_ACTIVE -> TRIP_PAUSED
                            setDeviceState(DeviceStates.TRIP_PAUSED);
                            toast({ title: 'State: TRIP_PAUSED', description: `Trip Paused (Ign Off >= ${minIgnOff}s)`, status: 'warning', duration: 2000 });
                        }

                        // Log State Change
                        setEvents(prev => [...prev, {
                            ruleId: 'state-change', ruleName: 'State Change', type: 'state',
                            message: deviceState === DeviceStates.TRIP_PENDING ? 'State changed to TRIP_IDLE (False Trip)' : 'State changed to TRIP_PAUSED',
                            severity: 'warning',
                            timestamp: new Date().toISOString(),
                            dataSnapshot: { ...deviceVariables.current, deviceState: deviceState === DeviceStates.TRIP_PENDING ? DeviceStates.TRIP_IDLE : DeviceStates.TRIP_PAUSED }
                        }].slice(-100));
                    }
                }

                // Self-Healing: If Ignition is ON but we are in TRIP_IDLE, force transition to TRIP_PENDING
                // This handles cases where manual overrides or state glitches left us in IDLE while driving
                if (ignition && deviceState === DeviceStates.TRIP_IDLE) {
                    setDeviceState(DeviceStates.TRIP_PENDING);
                    // We don't reset distance here to allow "catching up", but normally toggleIgnition handles resets.
                    setEvents(prev => [...prev, {
                        ruleId: 'state-correction', ruleName: 'State Correction', type: 'state',
                        message: 'Auto-corrected state: TRIP_IDLE → TRIP_PENDING (Ignition is ON)',
                        severity: 'warning',
                        timestamp: new Date().toISOString()
                    }].slice(-100));
                }


                // Shutdown Samples Logic (D5/D6)
                if (!ignition && shutdownSamplesSent.current < 2 && deviceState === DeviceStates.TRIP_IDLE) {
                    const sampleType = shutdownSamplesSent.current === 0 ? 'D5' : 'D6';
                    shutdownSamplesSent.current += 1;

                    const payload = generateTelemetryPayload({
                        ...deviceVariables.current,
                        tboxApplicationState,
                        tboxOperatingState,
                        ignition: false,
                        lifecycleRules // Added
                    }, {
                        speed: 0,
                        rpm: 0,
                        batteryVoltage,
                        engineTemp: 85,
                        fuelLevel: 75
                    });

                    setLastPayload({ type: 'telemetry', subtype: sampleType, content: payload });
                    setEvents(prev => [...prev, {
                        ruleId: 'shutdown-sample', ruleName: 'Shutdown Sample', type: 'telemetry',
                        message: `Shutdown Sample ${sampleType} sent`, severity: 'info',
                        timestamp: new Date().toISOString()
                    }].slice(-100));
                }

                // Gradident Logic (200ms)
                const now = Date.now();
                velocitySamplesRef.current.push({ v: currentSpeed, t: now });
                if (velocitySamplesRef.current.length > 5) velocitySamplesRef.current.shift(); // Approx 5s of 1s samples, wait, simulation is 1s.
                // Spec says "speed logged before 200ms". In 1s simulation, we use delta from previous step.

                const deltaV = currentSpeed - prevSpeedRef.current;

                // Harsh Accel (> 3 sec gap)
                if (deltaV > parameters.HARSH_ACCEL_THR && (now - lastHarshAccTime.current) > 3000) {
                    deviceVariables.current.harshAccCnt++;
                    deviceVariables.current.drivingScore = Math.max(0, deviceVariables.current.drivingScore - 5);
                    lastHarshAccTime.current = now;
                    triggerManualAlert('HARD_ACCELERATION');
                }

                // Hard Brake (> 1 sec gap)
                if (deltaV < -parameters.HARD_BRAKE_THR && (now - lastHardBrakeTime.current) > 1000) {
                    deviceVariables.current.hardBrakeCnt++;
                    deviceVariables.current.drivingScore = Math.max(0, deviceVariables.current.drivingScore - 5);
                    lastHardBrakeTime.current = now;
                    triggerManualAlert('HARD_BRAKING');
                }

                // tripType Logic
                if (currentSpeed >= 5 && deviceVariables.current.tripType === 'Idle') {
                    deviceVariables.current.tripType = 'Active';
                }

                // Idling Logic (Section 16.2: 3 min debounce)
                if (ignition && currentSpeed < 5) {
                    deviceVariables.current.idleDuration += 1 / 60; // Adds 1 sec worth of mins
                    if (!idleStartTimeRef.current) idleStartTimeRef.current = now;

                    if (now - idleStartTimeRef.current >= 180000 && !idleCountedRef.current) { // 3 mins
                        deviceVariables.current.idlingCnt++;
                        idleCountedRef.current = true;
                        setEvents(prev => [...prev, {
                            ruleId: 'idling-debounce', ruleName: 'Idling Counted', type: 'event',
                            message: 'Idling counted (3 min debounce met)', severity: 'info',
                            timestamp: new Date().toISOString()
                        }].slice(-100));
                    }
                } else {
                    idleStartTimeRef.current = null;
                    idleCountedRef.current = false;
                }

                // Speed Alert Hysteresis (10 kmph)
                const overspeedLimit = 100; // Calibratable
                const hysteresis = 10;

                if (!isSpeedAlertLive && currentSpeed > overspeedLimit) {
                    setIsSpeedAlertLive(true);
                    triggerManualAlert('OVERSPEED');
                    deviceVariables.current.drivingScore = Math.max(0, deviceVariables.current.drivingScore - 2);
                } else if (isSpeedAlertLive && currentSpeed < (overspeedLimit - hysteresis)) {
                    setIsSpeedAlertLive(false);
                    // Clear alert logic (isLive = false)
                    const payload = generateAlertPayload({ ...deviceVariables.current, speed: currentSpeed, isLive: false }, { type: 'SpeedAlert', message: 'Speed Normal' });
                    setLastPayload({ type: 'alert', content: payload });
                }

                prevSpeedRef.current = currentSpeed;
                deviceVariables.current.currentTripTime += 1 / 60; // 1 second in minutes
                deviceVariables.current.currentTripDistance += (currentSpeed / 3600);
                if (currentSpeed > deviceVariables.current.topSpeed) {
                    deviceVariables.current.topSpeed = currentSpeed;
                }

                // Driving Score & Trip Progress Payload (Every 60s)
                if (tripStats.current.runTime > 0 && tripStats.current.runTime % 60 === 0) {
                    // 1. Update Score
                    if (deviceVariables.current.idleDuration > 10) {
                        deviceVariables.current.drivingScore = Math.max(0, deviceVariables.current.drivingScore - 1);
                    }

                    const scorePayload = generateDrivingScorePayload({
                        ...deviceVariables.current,
                        lifecycleRules
                    });
                    setLastPayload({ type: 'drivingScore', content: scorePayload });

                    // 2. Section 16.2: Trip Progress (tripCurrent)
                    const progressPayload = generateTripPayload('tripProgress', {
                        ...deviceVariables.current,
                        fuelLevel: currentData.fuelLevel,
                        tboxApplicationState,
                        lifecycleRules
                    });
                    setLastTripPayload(progressPayload);

                    setEvents(prev => [...prev, {
                        ruleId: 'trip-progress', ruleName: 'Trip Progress', type: 'info',
                        message: `Trip Progress sent at ${Math.round(tripStats.current.runTime / 60)}m`, severity: 'info',
                        timestamp: new Date().toISOString()
                    }].slice(-100));
                }

                const currentData = {
                    // Sensor Data
                    speed: currentSpeed,
                    rpm: currentRpm,
                    roadCondition: simRoadCondition,
                    engineTemp: 80 + Math.random() * 10,
                    fuelLevel: 75,
                    timestamp: new Date().toISOString(),

                    // M6 Sensors
                    gasPedal: gasPedal,
                    brakeActive: brakeActive,
                    engineMilStat: (Date.now() - ignOnTime.current > 5000) ? (milActive ? 1 : 0) : 0,

                    // TE-01 CAN Aliases
                    DRV_CLUSTER_DSPEED: currentSpeed,
                    VITV: currentSpeed,
                    EFCMNT_PDLE_ACCEL: gasPedal,
                    CONTACT_FREIN1: brakeActive ? 1 : 0,
                    KEY_POS: ignition ? 1 : 0,
                    ETAT_MT: ignition ? 3 : 1, // 3 = Started, 1 = Stop/Off (approx)
                    TowCondition: (!ignition && currentSpeed > 5) ? 1 : 0,
                    MovDetect: (!ignition && currentSpeed > 0.5) ? 1 : 0,
                    idleDuration: deviceVariables.current.idleDuration,

                    // Device State
                    deviceState: deviceState,
                    ignition: ignition,

                    // Device Variables
                    tripStartTime: deviceVariables.current.tripStartTime,
                    tripStartOdo: deviceVariables.current.tripStartOdo,
                    currentTripDistance: deviceVariables.current.currentTripDistance,
                    lastIgnitionOffTime: deviceVariables.current.lastIgnitionOffTime,
                    elapsedIgnitionOffTime: deviceVariables.current.elapsedIgnitionOffTime,

                    // Trip Stats
                    runTime: tripStats.current.runTime,
                    distance: tripStats.current.distance,
                    offTime: tripStats.current.offTime,

                    // Parameters (for rule evaluation)
                    MIN_TRIP_DISTANCE: parameters.MIN_TRIP_DISTANCE,
                    MIN_IGN_OFF_TIME: parameters.MIN_IGN_OFF_TIME,
                    MAX_IGN_OFF_TIME: parameters.MAX_IGN_OFF_TIME,

                    // Jeep M6 Data
                    batteryVoltage: batteryVoltage,
                    isDeviceRemoved: isDeviceRemoved,
                    crashDetected: crashDetected,
                    fotaStatus: fotaStatus,
                    geoFenceStatus: geoFenceStatus,
                    lastCommand: lastCommand,

                    // Combined States
                    tboxApplicationState: tboxApplicationState,
                    tboxOperatingState: tboxOperatingState,

                    // Dynamic CAN Signals - Mapping decoded CAN values into engine facts
                    ...(() => {
                        const canFacts = {};
                        canSignalRules.forEach(sig => {
                            // Find the physical value we simulated for this signal in the CAN loop
                            // For simplicity, we just recalculate it here to be sure it's fresh
                            const name = sig.name.toLowerCase();
                            let val = 0;
                            if (name.includes('speed') && !name.includes('engine')) val = currentSpeed;
                            else if (name.includes('rpm') || name.includes('engine speed')) val = currentRpm;
                            else if (name.includes('temp')) val = 95 + (Math.sin(Date.now() / 10000) * 10); // Simulated Temp fluctuation
                            else if (name.includes('battery') || name.includes('voltage')) val = batteryVoltage;
                            else if (name.includes('mil')) val = milActive ? 1 : 0;
                            else if (name.includes('fuel')) val = 75;
                            else val = sig.defaultValue || 0;

                            canFacts[sig.name] = val; // Use exact signal name as variable
                        });
                        return canFacts;
                    })()
                };

                // Evaluate Rules (Only if Alerts/Events enabled for this state)
                const newEvents = alertsEnabled ? engine.evaluate(currentData) : [];

                // DATA LOGGING (Telemetry - Every Second)
                let telPayload = null;
                if (telemetryEnabled) {
                    telPayload = generateTelemetryPayload({
                        ...deviceVariables.current,
                        tboxApplicationState,
                        tboxOperatingState,
                        ignition,
                        lifecycleRules,
                        gpsFix: gpsEnabled // Pass GPS status
                    }, {
                        speed: currentSpeed,
                        rpm: currentRpm,
                        batteryVoltage,
                        engineTemp: 85,
                        fuelLevel: 75
                    });
                }

                // Only update payload view every 5 seconds to reduce flicker? Or just always?
                // For demo, let's update always or maybe only if user selects "Telemetry" tab.
                // We'll just set it.
                // setLastPayload({ type: 'telemetry', content: telPayload });
                // NOTE: Updating generic state every second might cause re-renders.
                // Let's only update if it's the *only* payload or if we are in telemetry mode.
                // For now, let's NOT overwrite 'deviceJoined' or 'alert' payloads automatically
                // unless we want to show a stream.
                // Let's simply Log it to console or a separate stream?
                // Or maybe just update it.

                // Combine Rule Events + Telemetry
                const allNewEvents = [...newEvents];
                if (telemetryEnabled) {
                    const telemetryEvent = {
                        ruleId: 'system-telemetry',
                        ruleName: 'System Monitor',
                        type: 'telemetry',
                        message: `Speed: ${currentSpeed.toFixed(1)} km/h | State: ${tboxApplicationState} | GPS: ${gpsEnabled ? 'FIX' : 'NO FIX'}`,
                        severity: 'info',
                        timestamp: new Date().toISOString(),
                        dataSnapshot: { ...currentData }, // Snapshot
                        payload: telPayload // Attach payload
                    };
                    allNewEvents.push(telemetryEvent);
                }

                // Update State (Cap history to 100 items to prevent lag)
                setDataHistory(prev => [...prev.slice(-50), currentData]);
                setEvents(prev => [...prev, ...allNewEvents].slice(-100)); // Keep last 100 events

                if (newEvents.length > 0) {
                    const currentTriggeredIds = new Set(newEvents.map(e => e.ruleId));

                    newEvents.forEach(event => {
                        // Section 14.1: Alert Lifecycle
                        // Trigger for any condition that results in an 'alert', 'security_alert', or 'diagnostic_alert'
                        if (['alert', 'emergency_alert', 'security_alert', 'diagnostic_alert'].includes(event.type)) {
                            if (!activeAlertInstances.current[event.ruleId]) {
                                // New Alert Instance
                                const alertId = crypto.randomUUID();
                                activeAlertInstances.current[event.ruleId] = {
                                    alertId,
                                    type: event.ruleName,
                                    message: event.message
                                };

                                // Generate Payload with isLive: true
                                const alertPayload = generateAlertPayload({
                                    ...deviceVariables.current,
                                    tboxApplicationState,
                                    isLive: true,
                                    alertID: alertId
                                }, {
                                    type: event.ruleName,
                                    message: event.message
                                });
                                setLastPayload({ type: 'alert', content: alertPayload });

                                toast({
                                    title: event.message,
                                    status: event.severity === 'critical' ? 'error' : 'warning',
                                    duration: 2000,
                                    isClosable: true,
                                    position: 'top-right'
                                });

                                // TRIGGER PROMINENT POPUP
                                setActivePopupAlert(event);
                                setIsAlertPopupOpen(true);
                            }
                        }
                    });

                    // Check for alerts that are no longer triggering (to send isLive: false)
                    Object.keys(activeAlertInstances.current).forEach(ruleId => {
                        if (!currentTriggeredIds.has(ruleId)) {
                            const instance = activeAlertInstances.current[ruleId];

                            // Generate Payload with isLive: false
                            const clearPayload = generateAlertPayload({
                                ...deviceVariables.current,
                                tboxApplicationState,
                                isLive: false,
                                alertID: instance.alertId
                            }, {
                                type: instance.type,
                                message: `Cleared: ${instance.message}`
                            });
                            setLastPayload({ type: 'alert', content: clearPayload });

                            delete activeAlertInstances.current[ruleId];
                        }
                    });
                } else {
                    // No rules triggered, clear all active alerts
                    Object.keys(activeAlertInstances.current).forEach(ruleId => {
                        const instance = activeAlertInstances.current[ruleId];
                        const clearPayload = generateAlertPayload({
                            ...deviceVariables.current,
                            tboxApplicationState,
                            isLive: false,
                            alertID: instance.alertId
                        }, {
                            type: instance.type,
                            message: `Cleared: ${instance.message}`
                        });
                        setLastPayload({ type: 'alert', content: clearPayload });
                    });
                    activeAlertInstances.current = {};
                }

            }, 1000);
        }

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, engine, simSpeed, simRoadCondition, toast, ignition, deviceState, parameters, tboxApplicationState]);

    // Map savedRules to template format to show in library
    const standardTemplates = useMemo(() => {
        return savedRules.map(rule => ({
            title: rule.name,
            description: rule.event.message,
            tags: ['Saved Rule', rule.event.severity],
            message: rule.event.message,
            severity: rule.event.severity,
        }));
    }, [savedRules]);

    const allTemplates = [...standardTemplates, ...items];

    // Combine default and custom templates for the library
    const libraryTemplates = useMemo(() => {
        // Map default rules to template format
        const defaultTemplates = [
            ...defaultRules,
            ...JeepM6DefaultRules
        ].map(rule => ({
            title: rule.name,
            description: rule.description || rule.event.message,
            tags: [rule.event.type, rule.event.severity], // Derive tags
            ...rule
        }));

        return [...defaultTemplates, ...(persistedState.customRuleTemplates || [])];
    }, [persistedState.customRuleTemplates]);

    return (
        <Flex direction="column" minH="100vh" bg="gray.50" p={5}>
            <VStack spacing={5} align="stretch" w="full">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Heading size="lg">Rule Engine Dashboard</Heading>
                    <HStack>
                        <Tooltip label={isRunning ? "Stop Simulation" : "Start Simulation"}>
                            <IconButton
                                icon={isRunning ? <Square size={18} /> : <Play size={18} />}
                                colorScheme={isRunning ? "red" : "green"}
                                onClick={toggleSimulation}
                                aria-label={isRunning ? "Stop Simulation" : "Start Simulation"}
                                size="sm"
                            />
                        </Tooltip>
                        <Tooltip label="Clear Data">
                            <IconButton
                                icon={<Trash2 size={18} />}
                                variant="outline"
                                onClick={clearData}
                                aria-label="Clear Data"
                                size="sm"
                            />
                        </Tooltip>
                        <Tooltip label="Full Automated Demo">
                            <IconButton
                                icon={<Zap size={18} />}
                                colorScheme="teal"
                                onClick={runFullAutomatedDemo}
                                aria-label="Full Automated Demo"
                                size="sm"
                            />
                        </Tooltip>
                        <Tooltip label="Run CAN Demo">
                            <IconButton
                                icon={<Activity size={18} />}
                                colorScheme="blue"
                                onClick={runCANDemo}
                                aria-label="Run CAN Demo"
                                size="sm"
                            />
                        </Tooltip>
                        <Tooltip label="Run M6 Demo">
                            <IconButton
                                icon={<Car size={18} />}
                                colorScheme="pink"
                                onClick={runDemoScenario}
                                aria-label="Run M6 Demo"
                                size="sm"
                            />
                        </Tooltip>
                    </HStack>
                </Box>

                {/* Device State Machine Display */}
                <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>
                    <VStack align="stretch" spacing={4}>
                        <HStack justify="space-between">
                            <Text fontWeight="bold">Device State Machine</Text>
                            <HStack spacing={2}>
                                {Object.values(DeviceStates).map((state) => {
                                    const isTripState = state.startsWith('TRIP_');
                                    const isLifecycleState = !isTripState;
                                    const isActive = (isTripState && deviceState === state) ||
                                        (isLifecycleState && tboxApplicationState === state);

                                    let activeColor = 'blue';
                                    if (isActive) {
                                        if (state === 'TRIP_ACTIVE') activeColor = 'green';
                                        else if (state === 'TRIP_PAUSED') activeColor = 'orange';
                                        else if (state === 'TRIP_PENDING') activeColor = 'yellow';
                                        else if (state === 'TRIP_IDLE') activeColor = 'teal';
                                        else if (state === 'PRE-SALES') activeColor = 'gray';
                                        else if (state === 'FACTORY') activeColor = 'purple';
                                        else if (state === 'PROVISIONED') activeColor = 'cyan';
                                        else if (state === 'AUTHORIZED') activeColor = 'blue';
                                        else if (state === 'CUSTOMER') activeColor = 'pink';
                                    }

                                    return (
                                        <Badge
                                            key={state}
                                            colorScheme={isActive ? activeColor : 'gray'}
                                            variant="solid"
                                            fontSize={isActive ? 'xs' : '2xs'}
                                            px={2}
                                            py={1}
                                            fontWeight="bold"
                                            borderRadius="md"
                                            opacity={isActive ? 1 : 0.4}
                                        >
                                            {state}
                                        </Badge>
                                    );
                                })}
                            </HStack>
                        </HStack>

                        <HStack spacing={4} mt={1} borderTopWidth="1px" pt={2} borderColor={borderColor}>
                            <HStack spacing={2}>
                                <Text fontSize="xs" color="gray.500" fontWeight="bold">OPERATING:</Text>
                                <Badge colorScheme={tboxOperatingState === 'NORMAL' ? 'green' : 'red'}>
                                    {tboxOperatingState}
                                </Badge>
                            </HStack>
                            <HStack spacing={2}>
                                <Text fontSize="xs" color="gray.500" fontWeight="bold">eSIM:</Text>
                                <Badge colorScheme={tboxeSimState === 'NORMAL_SIM' ? 'blue' : 'orange'}>
                                    {tboxeSimState}
                                </Badge>
                            </HStack>
                            <HStack spacing={2}>
                                <Text fontSize="xs" color="gray.500" fontWeight="bold">BATTERY:</Text>
                                <Badge colorScheme={batteryVoltage < 11.5 ? 'red' : 'green'}>
                                    {batteryVoltage}V
                                </Badge>
                            </HStack>
                            {isDeviceRemoved && (
                                <Badge colorScheme="purple" variant="solid">DEVICE REMOVED</Badge>
                            )}
                            <Spacer />
                            <Badge colorScheme={deviceState === DeviceStates.TRIP_ACTIVE ? 'green' : 'gray'} variant="outline">
                                {deviceState}
                            </Badge>
                        </HStack>
                    </VStack>
                </Box>

                {/* Device Lifecycle Control */}
                <Box mt={2} mb={4}>
                    <FormControl display="flex" alignItems="center">
                        <FormLabel fontSize="sm" mb={0} mr={2}>Override Device State:</FormLabel>
                        <Select
                            size="sm"
                            width="auto"
                            value={deviceState}
                            onChange={(e) => setDeviceState(e.target.value)}
                            bg={Object.values(DeviceStates).filter(s => !s.startsWith('TRIP')).includes(deviceState) ? "yellow.100" : "white"}
                        >
                            <optgroup label="Trip States">
                                <option value={DeviceStates.TRIP_IDLE}>TRIP_IDLE</option>
                                <option value={DeviceStates.TRIP_PENDING}>TRIP_PENDING</option>
                                <option value={DeviceStates.TRIP_ACTIVE}>TRIP_ACTIVE</option>
                                <option value={DeviceStates.TRIP_PAUSED}>TRIP_PAUSED</option>
                            </optgroup>
                            <optgroup label="Lifecycle States">
                                <option value={DeviceStates.FACTORY}>FACTORY</option>
                                <option value={DeviceStates.PROVISIONED}>PROVISIONED</option>
                                <option value={DeviceStates.AUTHORIZED}>AUTHORIZED</option>
                                <option value={DeviceStates.CUSTOMER}>CUSTOMER</option>
                            </optgroup>
                        </Select>
                    </FormControl>
                </Box>

                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    <GridItem>
                        <Box p={3} bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md">
                            <Text fontSize="xs" color="gray.500">Current State</Text>
                            <Text fontWeight="bold" color={
                                deviceState === DeviceStates.TRIP_ACTIVE ? 'green.500' :
                                    deviceState === DeviceStates.TRIP_PAUSED ? 'orange.500' : 'gray.500'
                            } fontSize="lg">{deviceState}</Text>
                        </Box>
                    </GridItem>
                    <GridItem>
                        <Box p={3} bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md">
                            <Text fontSize="xs" color="gray.500">Trip Distance</Text>
                            <Text fontWeight="bold" fontSize="lg">
                                {deviceVariables.current.currentTripDistance.toFixed(2)} km
                            </Text>
                        </Box>
                    </GridItem>
                    <GridItem>
                        <Box p={3} bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md">
                            <Text fontSize="xs" color="gray.500">Elapsed Ign Off</Text>
                            <Text fontWeight="bold" fontSize="lg">
                                {deviceVariables.current.elapsedIgnitionOffTime}s
                            </Text>
                        </Box>
                    </GridItem>
                </Grid>

                {/* SouthBound Lifecycle & Config */}
                <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>
                    <Text fontWeight="bold" mb={3}>SouthBound Interface Control</Text>
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                        <GridItem colSpan={1}>
                            <VStack align="stretch" spacing={3}>
                                <Text fontWeight="semibold" fontSize="sm">Device Lifecycle</Text>
                                <HStack>
                                    <Badge colorScheme={tboxApplicationState === 'FACTORY' ? 'green' : 'gray'}>FACTORY</Badge>
                                    <Text>→</Text>
                                    <Badge colorScheme={tboxApplicationState === 'PROVISIONED' ? 'green' : 'gray'}>PROVISIONED</Badge>
                                    <Text>→</Text>
                                    <Badge colorScheme={tboxApplicationState === 'AUTHORIZED' ? 'green' : 'gray'}>AUTHORIZED</Badge>
                                    <Text>→</Text>
                                    <Badge colorScheme={tboxApplicationState === 'CUSTOMER' ? 'green' : 'gray'}>CUSTOMER</Badge>
                                </HStack>
                                <HStack>
                                    <Button size="sm" colorScheme="blue" onClick={() => handleLifecycleCommand('PROVISION')} isDisabled={tboxApplicationState !== 'FACTORY'}>Provision</Button>
                                    <Button size="sm" colorScheme="purple" onClick={() => handleLifecycleCommand('AUTHORIZE')} isDisabled={tboxApplicationState !== 'PROVISIONED'}>Authorize</Button>
                                    <Button size="sm" colorScheme="orange" onClick={() => handleLifecycleCommand('HANDOVER')} isDisabled={tboxApplicationState !== 'AUTHORIZED'}>Handover</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setTboxApplicationState('FACTORY')}>Reset</Button>
                                </HStack>
                            </VStack>
                        </GridItem>
                        <GridItem colSpan={1}>
                            <VStack align="stretch" spacing={2}>
                                <Text fontWeight="semibold" fontSize="sm">Device Identity</Text>
                                <HStack>
                                    <Text fontSize="xs">VIN:</Text>
                                    <Input size="xs" defaultValue={deviceVariables.current.vehicleId} readOnly color="black" />
                                </HStack>
                                <HStack>
                                    <Text fontSize="xs">IMEI:</Text>
                                    <Input size="xs" defaultValue={deviceVariables.current.imeiNo} readOnly color="black" />
                                </HStack>
                            </VStack>
                        </GridItem>
                    </Grid>
                    <Box mt={6} p={4} borderTopWidth="1px">
                        <Text fontWeight="bold" mb={3}>Remote Operations (Section 10)</Text>
                        <VStack align="stretch" spacing={4}>
                            <SimpleGrid columns={4} gap={3}>
                                <Button size="sm" colorScheme="teal" leftIcon={<Text>🔦</Text>} onClick={() => handleRemoteCommand('Blinker')}>Blinker</Button>
                                <Button size="sm" colorScheme="cyan" leftIcon={<Text>🔒</Text>} onClick={() => handleRemoteCommand('DoorLock')}>Lock</Button>
                                <Button size="sm" colorScheme="cyan" variant="outline" leftIcon={<Text>🔓</Text>} onClick={() => handleRemoteCommand('DoorUnlock')}>Unlock</Button>
                                <Button size="sm" colorScheme="red" leftIcon={<Text>📢</Text>} onClick={() => handleRemoteCommand('Honk')}>Honk</Button>
                            </SimpleGrid>

                            <SimpleGrid columns={3} gap={3}>
                                <Button size="sm" colorScheme="blue" variant="solid" onClick={() => handleRemoteCommand('Wakeup')}>Refresh (Wakeup)</Button>
                                <Button size="sm" colorScheme="gray" onClick={() => handleRemoteCommand('FetchLogs')}>Fetch Logs</Button>
                                <Menu>
                                    <MenuButton as={Button} size="sm" rightIcon={<Text>▼</Text>}>
                                        Remote State Update
                                    </MenuButton>
                                    <MenuList>
                                        <MenuItem onClick={() => handleRemoteCommand('TBOXStateUpdate', { targetState: 'PROVISIONED' })}>PROVISIONED</MenuItem>
                                        <MenuItem onClick={() => handleRemoteCommand('TBOXStateUpdate', { targetState: 'AUTHORIZED' })}>AUTHORIZED</MenuItem>
                                        <MenuItem onClick={() => handleRemoteCommand('TBOXStateUpdate', { targetState: 'CUSTOMER' })}>CUSTOMER</MenuItem>
                                    </MenuList>
                                </Menu>
                            </SimpleGrid>

                            <HStack spacing={3}>
                                <Button size="xs" variant="outline" onClick={() => handleRemoteCommand('UserDefinedSpeed', { speed: 110 })}>Set Speed Thr (110)</Button>
                                <Button size="xs" variant="outline" onClick={() => handleRemoteCommand('UserDefinedMinimumTripDistance', { distance: 5, engineOffTime: 30 })}>Set Trip Thr (5km/30s)</Button>
                            </HStack>
                        </VStack>
                    </Box>
                </Box>

                {/* FOTA Update Center */}
                <Box mt={6} p={4} borderTopWidth="1px" bg="blue.50" _dark={{ bg: "blue.900" }} borderRadius="md">
                    <Text fontWeight="bold" mb={2} color="blue.700" _dark={{ color: "blue.200" }}>FOTA Update Center (Section 11)</Text>
                    <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                            <Text fontSize="sm">Current Version: <b>{deviceVariables.current.ccpuVersion}</b></Text>
                            <Badge colorScheme={
                                fotaStatus === 'SUCCESS' ? 'green' :
                                    fotaStatus === 'IDLE' ? 'gray' : 'orange'
                            }>{fotaStatus}</Badge>
                        </HStack>

                        {fotaStatus === 'DOWNLOADING' && (
                            <Progress value={fotaProgress} size="xs" colorScheme="blue" />
                        )}

                        <HStack>
                            <Button size="xs" colorScheme="blue" onClick={runFotaSequence} isDisabled={fotaStatus !== 'IDLE'}>Check for Update</Button>
                            <Button size="xs" colorScheme="green" onClick={handleInstallFota} isDisabled={fotaStatus !== 'READY_FOR_INSTALL'}>Install Update (CD.02.04)</Button>
                            <Button size="xs" variant="ghost" onClick={() => { setFotaStatus('IDLE'); setFotaProgress(0); }}>Reset</Button>
                        </HStack>

                        <Text fontSize="xs" color="gray.500 italic">Note: Ignition must be OFF to install.</Text>
                    </VStack>
                </Box>

                <Box mt={4}>
                    <Text fontWeight="semibold" fontSize="sm" mb={2}>Trigger Alerts (M6)</Text>
                    <HStack wrap="wrap">
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => triggerManualAlert('HARD_ACCELERATION')}>Hard Accel</Button>
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => triggerManualAlert('HARD_BRAKING')}>Hard Brake</Button>
                        <Button size="sm" colorScheme="orange" variant="outline" onClick={() => triggerManualAlert('TOWING')}>Towing</Button>
                        <Button size="sm" colorScheme="red" onClick={() => triggerManualAlert('SOS')}>SOS / Panic</Button>
                        <Button size="sm" colorScheme="gray" variant="outline" onClick={() => triggerManualAlert('DEVICE_REMOVAL')}>Device Removal</Button>
                    </HStack>
                </Box>

                {
                    lastPayload && (
                        <Box mt={4} p={2} bg="gray.900" borderRadius="md">
                            <Text color="gray.400" fontSize="xs" mb={1}>Last Payload: {lastPayload.type}</Text>
                            <Text color="green.300" fontFamily="monospace" fontSize="xs" whiteSpace="pre-wrap">
                                {JSON.stringify(lastPayload.content, null, 2)}
                            </Text>
                        </Box>
                    )
                }

                <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>

                    <Text fontWeight="bold" mb={3}>Configurable Parameters</Text>
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm">MIN_TRIP_DISTANCE (km)</FormLabel>
                                <NumberInput
                                    value={parameters.MIN_TRIP_DISTANCE}
                                    onChange={(_, val) => setParameters(prev => ({ ...prev, MIN_TRIP_DISTANCE: val }))}
                                    min={0.1}
                                    max={50}
                                    step={0.5}
                                    size="sm"
                                >
                                    <NumberInputField color="black" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="xs" color="gray.500">Distance to confirm trip</Text>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm">MIN_IGN_OFF_TIME (seconds)</FormLabel>
                                <NumberInput
                                    value={parameters.MIN_IGN_OFF_TIME}
                                    onChange={(_, val) => setParameters(prev => ({ ...prev, MIN_IGN_OFF_TIME: isNaN(val) ? 0 : val }))}
                                    min={5}
                                    max={3600}
                                    step={10}
                                    size="sm"
                                >
                                    <NumberInputField color="black" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="xs" color="gray.500">Time to pause trip</Text>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm">MAX_IGN_OFF_TIME (seconds)</FormLabel>
                                <NumberInput
                                    value={parameters.MAX_IGN_OFF_TIME}
                                    onChange={(_, val) => setParameters(prev => ({ ...prev, MAX_IGN_OFF_TIME: isNaN(val) ? 0 : val }))}
                                    min={10}
                                    max={3600}
                                    step={10}
                                    size="sm"
                                >
                                    <NumberInputField color="black" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="xs" color="gray.500">Max Ignition Off Time</Text>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm">OVERSPEED_THR (km/h)</FormLabel>
                                <NumberInput
                                    value={parameters.OVERSPEED_THR}
                                    onChange={(_, val) => setParameters(prev => ({ ...prev, OVERSPEED_THR: isNaN(val) ? 0 : val }))}
                                    min={20}
                                    max={200}
                                    step={5}
                                    size="sm"
                                >
                                    <NumberInputField color="black" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="xs" color="gray.500">Threshold for overspeed alerts</Text>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm">HARSH_ACCEL_THR (km/h/s)</FormLabel>
                                <NumberInput
                                    value={parameters.HARSH_ACCEL_THR}
                                    onChange={(_, val) => setParameters(prev => ({ ...prev, HARSH_ACCEL_THR: val }))}
                                    size="sm"
                                    min={1}
                                    max={50}
                                >
                                    <NumberInputField color="black" />
                                </NumberInput>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm">HARD_BRAKE_THR (km/h/s)</FormLabel>
                                <NumberInput
                                    value={parameters.HARD_BRAKE_THR}
                                    onChange={(_, val) => setParameters(prev => ({ ...prev, HARD_BRAKE_THR: val }))}
                                    size="sm"
                                    min={1}
                                    max={50}
                                >
                                    <NumberInputField color="black" />
                                </NumberInput>
                            </FormControl>
                        </GridItem>
                    </Grid>
                </Box>

                {/* Simulation Controls */}
                <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50" _dark={{ bg: "gray.700" }}>
                    <Text fontWeight="bold" mb={3}>Simulation Controls</Text>
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                        <GridItem>
                            <FormControl>
                                <HStack justify="space-between" mb={2}>
                                    <FormLabel mb={0}>Ignition</FormLabel>
                                    <Button
                                        size="lg"
                                        w="100px"
                                        colorScheme={ignition ? "green" : "gray"}
                                        onClick={toggleIgnition}
                                        boxShadow="md"
                                        _hover={{ transform: 'scale(1.05)' }}
                                        transition="all 0.2s"
                                    >
                                        {ignition ? "ON" : "OFF"}
                                    </Button>
                                </HStack>
                                <FormLabel>Vehicle Speed: {Math.round(simSpeed)} km/h</FormLabel>
                                <Slider
                                    value={simSpeed}
                                    onChange={setSimSpeed}
                                    min={0}
                                    max={200}
                                    isDisabled={!ignition}
                                >
                                    <SliderTrack>
                                        <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                </Slider>
                                {!ignition && <Text fontSize="xs" color="red.500">Ignition is OFF</Text>}
                                <HStack spacing={4} mt={4}>
                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel mb="0" fontSize="sm">Brake (CONTACT_FREIN1)</FormLabel>
                                        <Button
                                            size="sm"
                                            colorScheme={brakeActive ? "orange" : "gray"}
                                            onClick={() => setBrakeActive(!brakeActive)}
                                        >
                                            {brakeActive ? "ACTIVE" : "OFF"}
                                        </Button>
                                    </FormControl>
                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel mb="0" fontSize="sm">MIL Status</FormLabel>
                                        <Button
                                            size="sm"
                                            colorScheme={milActive ? "red" : "gray"}
                                            onClick={() => setMilActive(!milActive)}
                                        >
                                            {milActive ? "ON" : "OFF"}
                                        </Button>
                                    </FormControl>
                                </HStack>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel>Road Condition</FormLabel>
                                <Select
                                    value={simRoadCondition}
                                    onChange={(e) => setSimRoadCondition(e.target.value)}
                                    color="black"
                                >
                                    <option value="good">Good</option>
                                    <option value="bad">Bad</option>
                                    <option value="wet">Wet</option>
                                    <option value="icy">Icy</option>
                                </Select>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm">Gas Pedal: {gasPedal}%</FormLabel>
                                <Slider
                                    value={gasPedal}
                                    onChange={setGasPedal}
                                    min={0}
                                    max={100}
                                    size="sm"
                                    isDisabled={!ignition}
                                >
                                    <SliderTrack>
                                        <SliderFilledTrack bg="orange.500" />
                                    </SliderTrack>
                                    <SliderThumb />
                                </Slider>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl display="flex" flexDirection="column" height="100%" justify="center">
                                <FormLabel fontSize="sm" mb={1}>Brake & MIL</FormLabel>
                                <HStack spacing={4}>
                                    <Button
                                        size="sm"
                                        colorScheme={brakeActive ? "red" : "gray"}
                                        variant={brakeActive ? "solid" : "outline"}
                                        onClick={() => setBrakeActive(!brakeActive)}
                                        flex={1}
                                        isDisabled={!ignition}
                                    >
                                        Brake {brakeActive ? "ON" : "OFF"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        colorScheme={milActive ? "yellow" : "gray"}
                                        variant={milActive ? "solid" : "outline"}
                                        onClick={() => setMilActive(!milActive)}
                                        flex={1}
                                        isDisabled={!ignition}
                                    >
                                        MIL {milActive ? "ERR" : "OK"}
                                    </Button>
                                </HStack>
                            </FormControl>
                        </GridItem>
                    </Grid>

                    {/* Jeep M6 Specific Controls */}
                    <Box mt={4} pt={4} borderTopWidth="1px" borderColor={borderColor}>
                        <Text fontWeight="bold" fontSize="sm" mb={3} color="purple.600">Jeep M6 Cloud Simulation</Text>
                        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="xs">Battery Voltage: {batteryVoltage}V</FormLabel>
                                    <Slider
                                        value={batteryVoltage}
                                        onChange={setBatteryVoltage}
                                        min={9}
                                        max={15}
                                        step={0.1}
                                        size="sm"
                                    >
                                        <SliderTrack>
                                            <SliderFilledTrack bg={batteryVoltage < 11 ? 'red.500' : 'green.500'} />
                                        </SliderTrack>
                                        <SliderThumb boxSize={3} />
                                    </Slider>
                                </FormControl>
                            </GridItem>
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="xs">Crash Detection</FormLabel>
                                    <Button
                                        size="sm"
                                        colorScheme={crashDetected ? "red" : "gray"}
                                        variant={crashDetected ? "solid" : "outline"}
                                        onClick={() => setCrashDetected(!crashDetected)}
                                        w="full"
                                    >
                                        Crash {crashDetected ? "YES" : "NO"}
                                    </Button>
                                </FormControl>
                            </GridItem>
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="xs">Device Removal</FormLabel>
                                    <Button
                                        size="sm"
                                        colorScheme={isDeviceRemoved ? "red" : "gray"}
                                        variant={isDeviceRemoved ? "solid" : "outline"}
                                        onClick={() => setIsDeviceRemoved(!isDeviceRemoved)}
                                        w="full"
                                    >
                                        Removal {isDeviceRemoved ? "TRIP" : "OFF"}
                                    </Button>
                                </FormControl>
                            </GridItem>
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="xs">FOTA Status</FormLabel>
                                    <Select
                                        size="sm"
                                        value={fotaStatus}
                                        onChange={(e) => setFotaStatus(e.target.value)}
                                        bg={bgColor}
                                    >
                                        <option value="IDLE">IDLE</option>
                                        <option value="DOWNLOADING">DOWNLOADING</option>
                                        <option value="INSTALLING">INSTALLING</option>
                                        <option value="SUCCESS">SUCCESS</option>
                                        <option value="FAILED">FAILED</option>
                                    </Select>
                                </FormControl>
                            </GridItem>
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="xs">Operating State</FormLabel>
                                    <Select
                                        size="sm"
                                        value={tboxOperatingState}
                                        onChange={(e) => setTboxOperatingState(e.target.value)}
                                        bg={bgColor}
                                    >
                                        <option value="NORMAL">NORMAL</option>
                                        <option value="DISCONNECTED">DISCONNECTED</option>
                                        <option value="FAIL">FAIL</option>
                                    </Select>
                                </FormControl>
                            </GridItem>
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="xs">eSIM State</FormLabel>
                                    <Select
                                        size="sm"
                                        value={tboxeSimState}
                                        onChange={(e) => setTboxeSimState(e.target.value)}
                                        bg={bgColor}
                                    >
                                        <option value="NORMAL_SIM">NORMAL_SIM</option>
                                        <option value="NO_SIM">NO_SIM</option>
                                        <option value="SIM_ERROR">SIM_ERROR</option>
                                    </Select>
                                </FormControl>
                            </GridItem>
                        </Grid>

                        <Text fontWeight="bold" fontSize="xs" mt={3} mb={2}>Lifecycle Commands</Text>
                        <HStack spacing={2}>
                            <Button size="xs" colorScheme="orange" onClick={() => handleLifecycleCommand('PROVISION')} isDisabled={deviceState !== DeviceStates.FACTORY}>
                                Provision
                            </Button>
                            <Button size="xs" colorScheme="cyan" onClick={() => handleLifecycleCommand('AUTHORIZE')} isDisabled={deviceState !== DeviceStates.PROVISIONED}>
                                Authorize
                            </Button>
                            <Button size="xs" colorScheme="purple" onClick={() => handleLifecycleCommand('HANDOVER')} isDisabled={deviceState !== DeviceStates.AUTHORIZED}>
                                Handover
                            </Button>
                            <Button size="xs" variant="outline" onClick={() => setDeviceState(DeviceStates.FACTORY)}>
                                Reset to Factory
                            </Button>
                        </HStack>
                    </Box>
                    <HStack mt={4} spacing={4} fontSize="sm" color="gray.600">
                        <Text>Trip Time: {Math.floor(tripStats.current.runTime / 60)}m {tripStats.current.runTime % 60}s</Text>
                        <Text>Distance: {tripStats.current.distance.toFixed(2)} km</Text>
                        <Text>Off Time: {Math.floor(tripStats.current.offTime / 60)}m {tripStats.current.offTime % 60}s</Text>
                    </HStack>
                </Box>

                <Tabs variant="enclosed" colorScheme="blue" index={activeTabIndex} onChange={setActiveTabIndex}>
                    <TabList mb="1em">
                        <Tab>Alert Rules</Tab>
                        <Tab>Rule Templates</Tab>
                        <Tab>CAN Configuration</Tab>
                        <Tab>Trip Configuration</Tab>
                        <Tab>Lifecycle Configuration</Tab>
                        <Tab>SouthBound Payloads</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <RuleBuilder
                                rules={rules}
                                savedRules={savedRules}
                                onAddRule={handleAddRule}
                                onDeleteRule={handleDeleteRule}
                                onSaveToLibrary={handleSaveToLibrary}
                                prefillRule={prefillRule}
                            />
                        </TabPanel>
                        <TabPanel h="full" p={0}>
                            {templateView === 'library' ? (
                                <RuleTemplateLibrary
                                    templates={libraryTemplates}
                                    onCreateNew={() => setTemplateView('create')}
                                    onUseTemplate={handleUseTemplate}
                                />
                            ) : (
                                <CreateRuleTemplate
                                    onSave={handleSaveTemplate}
                                    onCancel={() => setTemplateView('library')}
                                />
                            )}
                        </TabPanel>
                        <TabPanel>
                            <CANSignalBuilder
                                signals={canSignalRules}
                                onUpdateSignals={setCanSignalRules}
                                busData={canBusData}
                            />
                        </TabPanel>
                        <TabPanel>
                            <VStack align="stretch" spacing={6}>
                                <Box p={4} borderWidth="1px" borderRadius="lg" bg={useColorModeValue('white', 'gray.800')}>
                                    <Heading size="sm" mb={4}>Trip Lifecycle Parameters</Heading>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                                        <FormControl>
                                            <FormLabel fontWeight="bold">Min Trip Distance (km)</FormLabel>
                                            <HStack spacing={4}>
                                                <Slider
                                                    flex="1"
                                                    value={parameters.MIN_TRIP_DISTANCE || 2}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, MIN_TRIP_DISTANCE: val }))}
                                                    min={0.1}
                                                    max={20}
                                                    step={0.1}
                                                >
                                                    <SliderTrack>
                                                        <SliderFilledTrack />
                                                    </SliderTrack>
                                                    <SliderThumb />
                                                </Slider>
                                                <NumberInput
                                                    maxW="100px"
                                                    value={parameters.MIN_TRIP_DISTANCE || 2}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, MIN_TRIP_DISTANCE: Number(val) }))}
                                                    min={0.1}
                                                    max={20}
                                                    step={0.1}
                                                >
                                                    <NumberInputField color="black" />
                                                </NumberInput>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500" mt={1}>Distance needed to transition from PENDING to ACTIVE.</Text>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel fontWeight="bold">Min Ignition Off Time (seconds)</FormLabel>
                                            <HStack spacing={4}>
                                                <Slider
                                                    flex="1"
                                                    value={parameters.MIN_IGN_OFF_TIME || 120}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, MIN_IGN_OFF_TIME: val }))}
                                                    min={1}
                                                    max={1200}
                                                    step={1}
                                                >
                                                    <SliderTrack>
                                                        <SliderFilledTrack bg="orange.400" />
                                                    </SliderTrack>
                                                    <SliderThumb />
                                                </Slider>
                                                <NumberInput
                                                    maxW="100px"
                                                    value={parameters.MIN_IGN_OFF_TIME || 120}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, MIN_IGN_OFF_TIME: Number(val) }))}
                                                    min={1}
                                                    max={1200}
                                                >
                                                    <NumberInputField color="black" />
                                                </NumberInput>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500" mt={1}>Time after Ignition OFF before Trip enters PAUSED state.</Text>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel fontWeight="bold">Max Ignition Off Time (seconds)</FormLabel>
                                            <HStack spacing={4}>
                                                <Slider
                                                    flex="1"
                                                    value={parameters.MAX_IGN_OFF_TIME || 300}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, MAX_IGN_OFF_TIME: val }))}
                                                    min={2}
                                                    max={15}
                                                    step={1}
                                                >
                                                    <SliderTrack>
                                                        <SliderFilledTrack bg="red.400" />
                                                    </SliderTrack>
                                                    <SliderThumb />
                                                </Slider>
                                                <NumberInput
                                                    maxW="110px"
                                                    value={parameters.MAX_IGN_OFF_TIME || 300}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, MAX_IGN_OFF_TIME: Number(val) }))}
                                                    min={2}
                                                    max={20}
                                                >
                                                    <NumberInputField color="black" />
                                                </NumberInput>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500" mt={1}>Time after Ignition OFF before Trip is terminated (IDLE).</Text>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel fontWeight="bold">Harsh Accel Threshold (km/h/s)</FormLabel>
                                            <HStack spacing={4}>
                                                <Slider
                                                    flex="1"
                                                    value={parameters.HARSH_ACCEL_THR || 10}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, HARSH_ACCEL_THR: val }))}
                                                    min={1}
                                                    max={50}
                                                    step={1}
                                                >
                                                    <SliderTrack>
                                                        <SliderFilledTrack bg="red.400" />
                                                    </SliderTrack>
                                                    <SliderThumb />
                                                </Slider>
                                                <NumberInput
                                                    maxW="110px"
                                                    value={parameters.HARSH_ACCEL_THR || 10}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, HARSH_ACCEL_THR: Number(val) }))}
                                                    min={1}
                                                    max={50}
                                                >
                                                    <NumberInputField color="black" />
                                                </NumberInput>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500" mt={1}>Speed increase per second to trigger Harsh Acceleration.</Text>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel fontWeight="bold">Hard Brake Threshold (km/h/s)</FormLabel>
                                            <HStack spacing={4}>
                                                <Slider
                                                    flex="1"
                                                    value={parameters.HARD_BRAKE_THR || 15}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, HARD_BRAKE_THR: val }))}
                                                    min={1}
                                                    max={50}
                                                    step={1}
                                                >
                                                    <SliderTrack>
                                                        <SliderFilledTrack bg="red.600" />
                                                    </SliderTrack>
                                                    <SliderThumb />
                                                </Slider>
                                                <NumberInput
                                                    maxW="110px"
                                                    value={parameters.HARD_BRAKE_THR || 15}
                                                    onChange={(val) => setParameters(prev => ({ ...prev, HARD_BRAKE_THR: Number(val) }))}
                                                    min={1}
                                                    max={50}
                                                >
                                                    <NumberInputField color="black" />
                                                </NumberInput>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500" mt={1}>Speed decrease per second to trigger Hard Braking.</Text>
                                        </FormControl>
                                    </SimpleGrid>
                                </Box>

                                <Box>
                                    <Heading size="sm" mb={4}>Active Rules ({rules.length})</Heading>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={6}>
                                        {rules.map(rule => (
                                            <Box key={rule.id} p={3} borderWidth="1px" borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                                                <HStack justify="space-between">
                                                    <Text fontWeight="bold" fontSize="sm">{rule.name}</Text>
                                                    <Badge colorScheme={rule.event.severity === 'critical' ? 'red' : rule.event.severity === 'warning' ? 'orange' : 'blue'}>
                                                        {rule.event.severity}
                                                    </Badge>
                                                </HStack>
                                            </Box>
                                        ))}
                                    </SimpleGrid>
                                    {rules.length === 0 && <Text color="gray.500">No active rules.</Text>}
                                    <DataVisualizer dataHistory={dataHistory} events={events} />
                                </Box>
                            </VStack>
                        </TabPanel>
                        <TabPanel>
                            <LifecycleConfig
                                rules={lifecycleRules}
                                onUpdateRule={(state, updatedRule) => {
                                    setLifecycleRules({ ...lifecycleRules, [state]: updatedRule });
                                }}
                            />
                        </TabPanel>
                        <TabPanel>
                            <VStack align="stretch" spacing={4}>
                                <Heading size="sm">SouthBound Payload Explorer</Heading>
                                <Text fontSize="sm" color="gray.500">View generated payloads based on current state and rules.</Text>
                                <Box overflowX="auto">
                                    {lastPayload && (
                                        <Box mt={4} p={4} bg="gray.900" borderRadius="md">
                                            <Text color="gray.400" fontSize="xs" mb={1}>Last Generated {lastPayload.type} Payload:</Text>
                                            <Text color="green.300" fontFamily="monospace" fontSize="sm" whiteSpace="pre-wrap">
                                                {JSON.stringify(lastPayload.content, null, 2)}
                                            </Text>
                                        </Box>
                                    )}
                                    {lastTripPayload && (
                                        <Box mt={4} p={4} bg="gray.900" borderRadius="md">
                                            <Text color="gray.400" fontSize="xs" mb={1}>Last Trip Payload:</Text>
                                            <Text color="blue.300" fontFamily="monospace" fontSize="sm" whiteSpace="pre-wrap">
                                                {JSON.stringify(lastTripPayload, null, 2)}
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                {/* Always Visible Event Log */}
                <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>
                    <HStack justify="space-between" mb={4}>
                        <Heading size="md">Event Log</Heading>
                        <Badge colorScheme="blue" variant="subtle">{events.length} Events</Badge>
                    </HStack>
                    <Box overflowX="auto" maxHeight="300px" overflowY="auto">
                        <Box as="table" width="100%" sx={{ borderCollapse: 'collapse' }}>
                            <Box as="thead" bg={useColorModeValue('gray.50', 'gray.700')}>
                                <Box as="tr">
                                    <Box as="th" p={2} textAlign="left" fontSize="xs" color="gray.500" textTransform="uppercase">Time</Box>
                                    <Box as="th" p={2} textAlign="left" fontSize="xs" color="gray.500" textTransform="uppercase">Rule</Box>
                                    <Box as="th" p={2} textAlign="left" fontSize="xs" color="gray.500" textTransform="uppercase">Message</Box>
                                    <Box as="th" p={2} textAlign="left" fontSize="xs" color="gray.500" textTransform="uppercase">Severity</Box>
                                </Box>
                            </Box>
                            <Box as="tbody">
                                {events.slice().reverse().map((event, index) => (
                                    <Box as="tr" key={index} borderBottomWidth="1px" borderColor={borderColor}>
                                        <Box as="td" p={2} fontSize="sm">{new Date(event.timestamp).toLocaleTimeString()}</Box>
                                        <Box as="td" p={2} fontSize="sm" fontWeight="bold">{event.ruleName}</Box>
                                        <Box as="td" p={2} fontSize="sm">{event.message}</Box>
                                        <Box as="td" p={2}>
                                            <Badge
                                                colorScheme={
                                                    event.severity === 'critical' ? 'red' :
                                                        event.severity === 'warning' ? 'orange' :
                                                            event.severity === 'success' ? 'green' : 'blue'
                                                }
                                            >
                                                {event.severity}
                                            </Badge>
                                        </Box>
                                    </Box>
                                ))}
                                {events.length === 0 && (
                                    <Box as="tr">
                                        <Box as="td" colSpan={4} p={4} textAlign="center" color="gray.500">No events triggered yet</Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </VStack>

            {/* Dongle Alert Popup */}
            <DongleAlertPopup
                isOpen={isAlertPopupOpen}
                onClose={() => setIsAlertPopupOpen(false)}
                alert={activePopupAlert}
            />
        </Flex>
    );
};

export default RuleEngineDashboard;
