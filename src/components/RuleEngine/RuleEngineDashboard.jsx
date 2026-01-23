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
    MenuItem,
    Card,
    CardHeader,
    CardBody,
    Icon,
    Divider
} from '@chakra-ui/react';
import { Play, Square, Trash2, Zap, Activity, Car, Shield, Cpu, AlertTriangle, Circle } from 'lucide-react';
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
import TripConfiguration from './TripConfiguration';
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
        MAX_IGN_ON_TIME: 3600, // Added default 1 hour
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
        updatePersistedState((currentState) => {
            const currentParams = currentState.parameters || DEFAULT_RULE_ENGINE_STATE.parameters;
            const updatedParams = typeof newParams === 'function' ? newParams(currentParams) : newParams;
            return { parameters: updatedParams };
        });
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
    const tboxApplicationStateRef = useRef(tboxApplicationState);

    useEffect(() => {
        tboxApplicationStateRef.current = tboxApplicationState;
    }, [tboxApplicationState]);

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
        const currentState = tboxApplicationStateRef.current;
        const isPreSales = currentState === DeviceStates.PRE_SALES;

        if (!ignition && isPreSales) {
            toast({
                title: 'Ignition Blocked',
                description: `Ignition is disabled in ${currentState} state. Device must reach FACTORY state first.`,
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

        // Reset device variables - preserving IDs but clearing counters/state
        deviceVariables.current = {
            ...deviceVariables.current,
            tripStartTime: null,
            tripStartOdo: 0,
            currentTripDistance: 0,
            lastIgnitionOffTime: null,
            elapsedIgnitionOffTime: 0,
            journeyId: null,
            harshAccCnt: 0,
            hardBrakeCnt: 0,
            harshTurnCnt: 0,
            idlingCnt: 0,
            idleDuration: 0,
            tripType: 'Idle',
            highSpeedCnt: 0,
            currentTripTime: 0,
            gnssInfoStart: null,
            tripStartTimeEpoch: null,
            topSpeed: 0,
            vinFragments: {},
            vinProgress: 0,
            drivingScore: 100
        };

        // Reset device state to IDLE
        setDeviceState(DeviceStates.TRIP_IDLE);
        setTboxApplicationState(DeviceStates.PRE_SALES);
        setTboxOperatingState('NORMAL');
        setTboxeSimState('NORMAL_SIM');
        prevIgnitionRef.current = false;

        // Reset pedal and alert states
        setGasPedal(0);
        setBrakeActive(false);
        setMilActive(false);
        setIsDeviceRemoved(false);
        setIsSpeedAlertLive(false);

        // Clear active alerts tracking
        activeAlertInstances.current = {};

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
        }, 1500);
    };

    const handleDongleInsertion = () => {
        const currentState = tboxApplicationStateRef.current;
        if (currentState !== DeviceStates.PRE_SALES) {
            toast({
                title: 'Invalid Operation',
                description: 'Dongle insertion only valid in PRE-SALES state',
                status: 'warning',
                duration: 2000
            });
            return;
        }

        setTboxApplicationState(DeviceStates.FACTORY);

        setEvents(prev => [...prev, {
            ruleId: 'dongle-inserted',
            ruleName: 'Dongle Insertion',
            type: 'state',
            message: 'Dongle physically inserted. Subsystems (CAN, GPS, GSM) initialized. State: FACTORY',
            severity: 'success',
            timestamp: new Date().toISOString()
        }].slice(-100));

        toast({
            title: 'Dongle Inserted',
            description: 'Device transitioned to FACTORY state. Monitoring CAN for VIN discovery...',
            status: 'success',
            duration: 3000
        });
    };

    const handleLifecycleCommand = (command) => {
        setLastCommand(typeof command === 'string' ? command : command.type);
        let validTransition = false;
        const currentState = tboxApplicationStateRef.current; // Use Ref for fresh state
        let nextState = currentState;
        let targetState = null;

        // Handle TBOXStateUpdateCommand with targetState parameter (CVIP spec-compliant)
        if (typeof command === 'object' && command.type === 'TBOXStateUpdate' && command.targetState) {
            targetState = command.targetState;

            // Validate transition based on current state
            if (currentState === DeviceStates.FACTORY && targetState === DeviceStates.PROVISIONED) {
                validTransition = true;
                nextState = DeviceStates.PROVISIONED;
            } else if (currentState === DeviceStates.PROVISIONED && targetState === DeviceStates.AUTHORIZED) {
                validTransition = true;
                nextState = DeviceStates.AUTHORIZED;
            } else if (currentState === DeviceStates.AUTHORIZED && targetState === DeviceStates.CUSTOMER) {
                validTransition = true;
                nextState = DeviceStates.CUSTOMER;
            }
        }
        // Legacy support for old command format (backward compatibility)
        else if (typeof command === 'string') {
            if (currentState === DeviceStates.FACTORY && command === 'PROVISION') {
                nextState = DeviceStates.PROVISIONED;
                validTransition = true;
            } else if (currentState === DeviceStates.PROVISIONED && command === 'AUTHORIZE') {
                nextState = DeviceStates.AUTHORIZED;
                validTransition = true;
            } else if (currentState === DeviceStates.AUTHORIZED && command === 'HANDOVER') {
                nextState = DeviceStates.CUSTOMER;
                validTransition = true;
            }
        }

        if (validTransition) {
            setTboxApplicationState(nextState);
            setDeviceState(nextState === DeviceStates.CUSTOMER ? DeviceStates.TRIP_IDLE : nextState);

            // Generate DeviceJoined Payload
            const payload = generateDeviceJoinedPayload({
                ...deviceVariables.current,
                tboxApplicationState: nextState,
                tboxOperatingState,
                lifecycleRules
            });
            setLastPayload({ type: 'deviceJoined', content: payload });

            toast({
                title: 'CVIP Lifecycle Command',
                description: `State transitioned to ${nextState}`,
                status: 'success',
                duration: 2000
            });

            setEvents(prev => [...prev, {
                ruleId: 'lifecycle-transition',
                ruleName: 'Lifecycle State Change',
                type: 'state',
                message: `CVIP Command: ${currentState} → ${nextState}`,
                severity: 'success',
                timestamp: new Date().toISOString()
            }].slice(-100));
        } else {
            const attemptedTarget = targetState || (typeof command === 'string' ? command : 'unknown');
            toast({
                title: 'Command Rejected',
                description: `Invalid transition from ${currentState} to ${attemptedTarget}`,
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
            geoFenceStatus,
            ...parameters
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

        // Reset Parameters to Defaults
        const defaultParams = {
            MIN_TRIP_DISTANCE: 2,
            MIN_IGN_OFF_TIME: 10,
            MAX_IGN_OFF_TIME: 15,
            MAX_IGN_ON_TIME: 3600,
            OVERSPEED_THR: 100,
            HARSH_ACCEL_THR: 10,
            HARD_BRAKE_THR: 15
        };
        setParameters(defaultParams);

        toast({
            title: 'Full Automated Demo Started',
            description: 'Step 1: Device in PRE-SALES (Initial Factory State)',
            status: 'info',
            duration: 3000,
            position: 'top'
        });

        // 2. Insert Dongle → FACTORY State
        demoTimeoutsRef.current.push(setTimeout(() => {
            handleDongleInsertion();
            toast({ title: 'Step 2: Dongle Inserted', description: 'Device transitioned to FACTORY. Starting simulation...', status: 'info' });
        }, 3000));

        // 3. Start Simulation
        demoTimeoutsRef.current.push(setTimeout(() => {
            setIsRunning(true);
            toast({ title: 'Step 3: Simulation Active', description: 'Monitoring for VIN discovery...', status: 'info' });
        }, 6000));

        // 4. Toggle Ignition → Starts VIN Discovery
        demoTimeoutsRef.current.push(setTimeout(() => {
            toggleIgnition();
            toast({ title: 'Ignition ON', description: 'Starting VIN reconstruction (CAN 0x3E0)...', status: 'success' });
        }, 9000));

        // 5. Force PROVISIONED State (VIN discovery takes time, so we simulate it)
        demoTimeoutsRef.current.push(setTimeout(() => {
            handleLifecycleCommand('PROVISION');
            toast({ title: 'Step 4: PROVISIONED State', description: 'VIN Discovered! CVIP provisioning complete. Identity switched to VIN.', status: 'info' });
        }, 22000));

        // 6. Force AUTHORIZED State
        demoTimeoutsRef.current.push(setTimeout(() => {
            handleLifecycleCommand('AUTHORIZE');
            toast({ title: 'Step 5: AUTHORIZED State', description: 'CVIP authorization complete. Ready for service activation.', status: 'info' });
        }, 26000));

        // 7. Force CUSTOMER State (Handover)
        demoTimeoutsRef.current.push(setTimeout(() => {
            handleLifecycleCommand('HANDOVER');
            toast({ title: 'Step 6: CUSTOMER State', description: 'Handover complete. Identity switched to MSISDN. All features enabled.', status: 'success' });
        }, 30000));

        // 8. Start Driving & Trips
        demoTimeoutsRef.current.push(setTimeout(() => {
            setGasPedal(80); // High acceleration for demo
            // Set thresholds low for demo purposes so we hit states quickly
            setParameters(prev => ({
                ...prev,
                MIN_TRIP_DISTANCE: 0.02, // 20 meters
                MIN_IGN_OFF_TIME: 10,    // 10 seconds for TRIP_PAUSED
                MAX_IGN_OFF_TIME: 15     // 15 seconds for TRIP_IDLE
            }));
            setRules([...rules, ...JeepM6DefaultRules]);
            toast({ title: 'Step 7: Trip Started', description: 'Applying Gas Pedal (80%). thresholds lowered for demo.', status: 'info' });
        }, 34000));

        // 9. Trigger Overspeed
        demoTimeoutsRef.current.push(setTimeout(() => {
            setGasPedal(100); // Max acceleration
            toast({ title: 'Step 8: Simulating Alert', description: 'Full Gas (100%) to trigger Overspeed Alert (> 100 km/h)...', status: 'warning' });
        }, 40000));

        // 10. End Driving
        demoTimeoutsRef.current.push(setTimeout(() => {
            setGasPedal(0);
            setSimSpeed(0);
            setIgnition(false);
            deviceVariables.current.lastIgnitionOffTime = Date.now();
            toast({ title: 'Step 9: Ignition OFF', description: 'Monitoring for Pause/End thresholds... (Waiting 10s)', status: 'info' });
        }, 48000));

        // 11. Observe TRIP_PAUSED (after MIN_IGN_OFF_TIME = 10s)
        demoTimeoutsRef.current.push(setTimeout(() => {
            toast({ title: 'Step 10: State TRIP_PAUSED', description: 'Threshold met! Trip moved to Paused state.', status: 'warning' });
        }, 60000));

        // 12. Observe TRIP_IDLE (after MAX_IGN_OFF_TIME = 15s)
        demoTimeoutsRef.current.push(setTimeout(() => {
            toast({ title: 'Step 11: State TRIP_IDLE', description: 'Max Off Time met! Trip finalized and joined with IDLE records.', status: 'info' });
        }, 66000));

        // 13. Final Demo Completion
        demoTimeoutsRef.current.push(setTimeout(() => {
            // Full Reset
            clearData();

            // Reset parameters to defaults (clearData resets variables but we want to ensure params are back to standard too)
            setParameters({
                MIN_TRIP_DISTANCE: 2,
                MIN_IGN_OFF_TIME: 120,
                MAX_IGN_OFF_TIME: 300,
                MAX_IGN_ON_TIME: 3600,
                OVERSPEED_THR: 100,
                HARSH_ACCEL_THR: 10,
                HARD_BRAKE_THR: 15
            });
            toast({ title: 'Demo Completed', description: 'Full lifecycle and trip scenario finished. Dashboard fully reset.', status: 'success', duration: 10000 });
        }, 72000));
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

                // PRE-SALES → FACTORY transition now requires manual dongle insertion
                // (See handleDongleInsertion function)

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

                    // Advanced Simulation: Calculate speed and RPM based on Gas Pedal, Brake, and Ignition
                    const targetSpeed = (gasPedal / 100) * 200; // Max speed 200 km/h
                    const acceleration = (gasPedal / 100) * 5;  // Max acceleration 5 km/h per second
                    const braking = brakeActive ? 15 : 1.5;   // Braking is much stronger than natural deceleration

                    let nextSpeed = simSpeed;
                    if (nextSpeed < targetSpeed) {
                        nextSpeed = Math.min(targetSpeed, nextSpeed + acceleration);
                    } else if (nextSpeed > targetSpeed) {
                        nextSpeed = Math.max(targetSpeed, nextSpeed - braking);
                    }

                    // Add small fluctuation for realism
                    const fluctuation = (Math.random() * 0.4) - 0.2;
                    currentSpeed = Math.max(0, Math.min(200, nextSpeed + fluctuation));

                    // Update the state so the slider and UI reflect the simulated speed
                    setSimSpeed(currentSpeed);

                    // Dynamic RPM calculation: Base idle (800) + gas influence + speed influence
                    if (currentSpeed < 1) {
                        currentRpm = 800 + (gasPedal * 10) + (Math.random() * 50);
                    } else {
                        // Simple gear simulation logic (simulating 6 gears)
                        const gear = Math.min(6, Math.floor(currentSpeed / 35) + 1);
                        const gearRatio = 1.0 - ((gear - 1) * 0.1);
                        currentRpm = 1000 + ((currentSpeed % 35) * 100 * gearRatio) + (gasPedal * 15);
                    }
                    currentRpm = Math.floor(Math.min(8000, currentRpm));

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

                                    // VIN Discovery Complete - Ready for CVIP provisioning command
                                    setEvents(prev => [...prev, {
                                        ruleId: 'vin-complete',
                                        ruleName: 'VIN Discovery Complete',
                                        type: 'state',
                                        message: `VIN fully discovered: ${deviceVariables.current.vehicleId}. Device ready for provisioning. Awaiting CVIP command.`,
                                        severity: 'success',
                                        timestamp: new Date().toISOString()
                                    }].slice(-100));
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
                const overspeedLimit = parameters.OVERSPEED_THR || 100;
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
                    MAX_IGN_ON_TIME: parameters.MAX_IGN_ON_TIME,
                    OVERSPEED_THR: parameters.OVERSPEED_THR,
                    HARSH_ACCEL_THR: parameters.HARSH_ACCEL_THR,
                    HARD_BRAKE_THR: parameters.HARD_BRAKE_THR,

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
                {/* <Box display="flex" justifyContent="space-between" alignItems="center"> */}
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexDirection={{ base: "column", md: "row" }}
                    gap={{ base: 2, md: 0 }}
                >
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

                {/* System Status - Consolidated Header */}
                <Card variant="outline" borderColor="gray.200" boxShadow="sm" borderRadius="xl">
                    <CardBody p={{ base: 3, md: 4 }}>
                        <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
                            <HStack justify="space-between" align="center" wrap="wrap" gap={{ base: 2, md: 4 }} flexDirection={{ base: "column", md: "row" }}>
                                <VStack align="flex-start" spacing={1}>
                                    <HStack>
                                        <Icon as={Activity} color="blue.500" />
                                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>System Status</Text>
                                    </HStack>
                                    <Flex flexWrap="wrap" gap={2}>
                                        {Object.values(DeviceStates).filter(state => {
                                            const isTripState = state.startsWith('TRIP_');
                                            if (isTripState && tboxApplicationState !== DeviceStates.CUSTOMER) return false;
                                            return true;
                                        }).map((state) => {
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
                                                else if (state === 'PRE-SALES') activeColor = 'red';
                                                else if (state === 'FACTORY') activeColor = 'purple';
                                                else if (state === 'PROVISIONED') activeColor = 'cyan';
                                                else if (state === 'AUTHORIZED') activeColor = 'blue';
                                                else if (state === 'CUSTOMER') activeColor = 'pink';
                                            }

                                            return (
                                                <Badge
                                                    key={state}
                                                    colorScheme={isActive ? activeColor : 'gray'}
                                                    variant={isActive ? "solid" : "outline"}
                                                    fontSize="2xs"
                                                    px={2}
                                                    py={0.5}
                                                    borderRadius="full"
                                                    opacity={isActive ? 1 : 0.3}
                                                >
                                                    {state}
                                                </Badge>
                                            );
                                        })}
                                    </Flex>
                                </VStack>
                                <HStack spacing={{ base: 3, md: 6 }} wrap="wrap" justify={{ base: "flex-start", md: "flex-end" }} w={{ base: "full", md: "auto" }}>
                                    <VStack align="flex-end" spacing={0}>
                                        <Text fontSize="xs" color="gray.500">Trip Distance</Text>
                                        <Text fontWeight="bold" fontSize="lg">{deviceVariables.current.currentTripDistance.toFixed(2)} km</Text>
                                    </VStack>
                                    <VStack align="flex-end" spacing={0}>
                                        <Text fontSize="xs" color="gray.500">Ign Off Time</Text>
                                        <Text fontWeight="bold" fontSize="lg">{deviceVariables.current.elapsedIgnitionOffTime}s</Text>
                                    </VStack>
                                    <FormControl display="flex" flexDirection="column" alignItems="flex-end">
                                        <FormLabel fontSize="xs" color="gray.500" mb={0} mr={0}>Override State</FormLabel>
                                        <Select
                                            size="xs"
                                            width="140px"
                                            value={deviceState}
                                            onChange={(e) => setDeviceState(e.target.value)}
                                            borderRadius="md"
                                        >
                                            {tboxApplicationState === DeviceStates.CUSTOMER && (
                                                <optgroup label="Trip States">
                                                    <option value={DeviceStates.TRIP_IDLE}>TRIP_IDLE</option>
                                                    <option value={DeviceStates.TRIP_PENDING}>TRIP_PENDING</option>
                                                    <option value={DeviceStates.TRIP_ACTIVE}>TRIP_ACTIVE</option>
                                                    <option value={DeviceStates.TRIP_PAUSED}>TRIP_PAUSED</option>
                                                </optgroup>
                                            )}
                                            <optgroup label="Lifecycle States">
                                                <option value={DeviceStates.FACTORY}>FACTORY</option>
                                                <option value={DeviceStates.PROVISIONED}>PROVISIONED</option>
                                                <option value={DeviceStates.AUTHORIZED}>AUTHORIZED</option>
                                                <option value={DeviceStates.CUSTOMER}>CUSTOMER</option>
                                            </optgroup>
                                        </Select>
                                    </FormControl>
                                </HStack>
                            </HStack>

                            {/* <Flex borderTopWidth="1px" pt={3} borderColor="gray.100" gap={6} alignItems="center"> */}
                            <Flex
                                borderTopWidth="1px"
                                pt={3}
                                borderColor="gray.100"
                                gap={6}
                                alignItems="center"
                                direction={{ base: "column", md: "row" }}
                            >

                                <HStack spacing={2}>
                                    <Text fontSize="xs" color="gray.500" fontWeight="bold">OP STATE:</Text>
                                    <Badge colorScheme={tboxOperatingState === 'NORMAL' ? 'green' : 'red'} variant="subtle" px={2}>
                                        {tboxOperatingState}
                                    </Badge>
                                </HStack>
                                <HStack spacing={2}>
                                    <Text fontSize="xs" color="gray.500" fontWeight="bold">SIM:</Text>
                                    <Badge colorScheme={tboxeSimState === 'NORMAL_SIM' ? 'blue' : 'orange'} variant="subtle" px={2}>
                                        {tboxeSimState}
                                    </Badge>
                                </HStack>
                                <HStack spacing={2}>
                                    <Text fontSize="xs" color="gray.500" fontWeight="bold">BATTERY:</Text>
                                    <Badge colorScheme={batteryVoltage < 11.5 ? 'red' : 'green'} variant="subtle" px={2}>
                                        {batteryVoltage}V
                                    </Badge>
                                </HStack>
                                {isDeviceRemoved && (
                                    <Badge colorScheme="purple" variant="solid" fontSize="10px" px={2}>REMOVED</Badge>
                                )}
                                <Box flex={1} />
                                <HStack spacing={4} fontSize="xs" color="gray.500">
                                    <Text>Time: <b>{Math.floor(tripStats.current.runTime / 60)}m {tripStats.current.runTime % 60}s</b></Text>
                                    <Text>Off: <b>{Math.floor(tripStats.current.offTime / 60)}m {tripStats.current.offTime % 60}s</b></Text>
                                </HStack>
                            </Flex>
                        </VStack>
                    </CardBody>
                </Card>


                {/* Statistics Overview */}
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={{ base: 3, md: 4 }} mb={{ base: 4, md: 6 }}>
                    <Card variant="outline" bg="white" shadow="sm">
                        <CardBody p={4}>
                            <VStack align="flex-start" spacing={0}>
                                <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Current State</Text>
                                <Text fontWeight="bold" color={
                                    deviceState === DeviceStates.TRIP_ACTIVE ? 'green.500' :
                                        deviceState === DeviceStates.TRIP_PAUSED ? 'orange.500' : 'gray.600'
                                } fontSize="xl">{deviceState}</Text>
                            </VStack>
                        </CardBody>
                    </Card>
                    <Card variant="outline" bg="white" shadow="sm">
                        <CardBody p={4}>
                            <VStack align="flex-start" spacing={0}>
                                <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Trip Distance</Text>
                                <Text fontWeight="bold" fontSize="xl">{deviceVariables.current.currentTripDistance.toFixed(2)} km</Text>
                            </VStack>
                        </CardBody>
                    </Card>
                    <Card variant="outline" bg="white" shadow="sm">
                        <CardBody p={4}>
                            <VStack align="flex-start" spacing={0}>
                                <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Avg Speed</Text>
                                <Text fontWeight="bold" fontSize="xl">{Math.round(simSpeed)} km/h</Text>
                            </VStack>
                        </CardBody>
                    </Card>
                    <Card variant="outline" bg="white" shadow="sm">
                        <CardBody p={4}>
                            <VStack align="flex-start" spacing={0}>
                                <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">VIN / Identity</Text>
                                <Text fontWeight="bold" fontSize="sm" isTruncated w="full">{deviceVariables.current.vehicleId}</Text>
                            </VStack>
                        </CardBody>
                    </Card>
                    <Card variant="outline" bg="white" shadow="sm">
                        <CardBody p={4}>
                            <VStack align="flex-start" spacing={0}>
                                <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">IMEI Number</Text>
                                <Text fontWeight="bold" fontSize="sm" isTruncated w="full">{deviceVariables.current.imeiNo}</Text>
                            </VStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>


                {/* Main Layout */}
                <Grid
                    templateColumns={{ base: "1fr", lg: "400px 1fr", xl: "450px 1fr" }}
                    gap={{ base: 4, md: 6, lg: 8 }}
                    alignItems="start"
                >
                    {/* Sidebar - Control Panel */}
                    <GridItem>
                        <VStack spacing={{ base: 4, md: 5, lg: 6 }} align="stretch" position={{ lg: "sticky" }} top="20px" width={{ base: "85vw", md: "93vw", lg: "auto" }}>

                            {/* 1. Vehicle Simulation Control */}
                            <Card variant="outline" shadow="md" borderRadius="xl" borderColor="gray.200">
                                <CardHeader borderBottomWidth="1px" py={3} bg="gray.50" borderTopLeftRadius="xl" borderTopRightRadius="xl">
                                    <HStack>
                                        <Icon as={Car} color="blue.500" />
                                        <Heading size="xs" textTransform="uppercase">Vehicle Controls</Heading>
                                    </HStack>
                                </CardHeader>
                                <CardBody p={{ base: 3, md: 4 }}>
                                    <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                                        <FormControl>
                                            <Flex justify="space-between" align="center" mb={2}>
                                                <FormLabel mb={0} fontWeight="bold">Ignition System</FormLabel>
                                                <Button
                                                    size={{ base: "sm", md: "md" }}
                                                    colorScheme={ignition ? "green" : "gray"}
                                                    onClick={toggleIgnition}
                                                    boxShadow="sm"
                                                    width={{ base: "100px", md: "120px" }}
                                                    minH="44px"
                                                    leftIcon={<Zap size={16} />}
                                                >
                                                    {ignition ? "IGN ON" : "IGN OFF"}
                                                </Button>
                                            </Flex>
                                            <Text fontSize="xs" color="gray.500" mb={4}>Controls the primary engine state and enables speed manipulation.</Text>
                                        </FormControl>

                                        <FormControl>
                                            <HStack justify="space-between" mb={2}>
                                                <FormLabel mb={0} fontWeight="bold">Vehicle Speed</FormLabel>
                                                <Badge colorScheme="blue" fontSize="md" px={2} py={0.5} borderRadius="md">
                                                    {Math.round(simSpeed)} km/h
                                                </Badge>
                                            </HStack>
                                            <Slider
                                                value={simSpeed}
                                                onChange={setSimSpeed}
                                                min={0}
                                                max={200}
                                                isDisabled={!ignition}
                                                focusThumbOnChange={false}
                                            >
                                                <SliderTrack h={{ base: 3, md: 2 }} borderRadius="full">
                                                    <SliderFilledTrack bg="blue.500" />
                                                </SliderTrack>
                                                <SliderThumb boxSize={6} border="2px solid white" shadow="md" />
                                            </Slider>
                                            {!ignition && <Text fontSize="2xs" color="red.500" mt={1}>Required: Ignition ON to adjust speed</Text>}
                                        </FormControl>

                                        <SimpleGrid columns={2} spacing={4}>
                                            <Button
                                                size={{ base: "sm", md: "md" }}
                                                colorScheme={brakeActive ? "orange" : "gray"}
                                                variant={brakeActive ? "solid" : "outline"}
                                                onClick={() => setBrakeActive(!brakeActive)}
                                                leftIcon={<Circle size={12} />}
                                                minH="44px"
                                            >
                                                Brake {brakeActive ? "ON" : "OFF"}
                                            </Button>
                                            <Button
                                                size={{ base: "sm", md: "md" }}
                                                colorScheme={milActive ? "red" : "gray"}
                                                variant={milActive ? "solid" : "outline"}
                                                onClick={() => setMilActive(!milActive)}
                                                leftIcon={<AlertTriangle size={16} />}
                                                minH="44px"
                                            >
                                                MIL {milActive ? "ACTIVE" : "OFF"}
                                            </Button>
                                        </SimpleGrid>

                                        <FormControl>
                                            <HStack justify="space-between" mb={2}>
                                                <FormLabel mb={0} fontSize="sm">Gas Pedal Position: {gasPedal}%</FormLabel>
                                            </HStack>
                                            <Slider
                                                value={gasPedal}
                                                onChange={setGasPedal}
                                                min={0}
                                                max={100}
                                                isDisabled={!ignition}
                                            >
                                                <SliderTrack h={1.5}>
                                                    <SliderFilledTrack bg="orange.500" />
                                                </SliderTrack>
                                                <SliderThumb boxSize={4} />
                                            </Slider>
                                        </FormControl>
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* 2. Cloud & Environment Simulation */}
                            <Card variant="outline" shadow="md" borderRadius="xl" borderColor="gray.200">
                                <CardHeader borderBottomWidth="1px" py={3} bg="gray.50" borderTopLeftRadius="xl" borderTopRightRadius="xl">
                                    <HStack>
                                        <Icon as={Shield} color="purple.500" />
                                        <Heading size="xs" textTransform="uppercase">Cloud Simulation</Heading>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <SimpleGrid columns={2} spacing={4}>
                                            <FormControl>
                                                <FormLabel fontSize="xs" fontWeight="bold">Battery Voltage</FormLabel>
                                                <HStack spacing={2}>
                                                    <Slider
                                                        value={batteryVoltage}
                                                        onChange={setBatteryVoltage}
                                                        min={9}
                                                        max={15}
                                                        step={0.1}
                                                        flex={1}
                                                    >
                                                        <SliderTrack><SliderFilledTrack bg={batteryVoltage < 11.5 ? "red.500" : "green.500"} /></SliderTrack>
                                                        <SliderThumb boxSize={3} />
                                                    </Slider>
                                                    <Text fontSize="xs" fontWeight="bold" w="40px">{batteryVoltage}V</Text>
                                                </HStack>
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel fontSize="xs" fontWeight="bold">Road Surface</FormLabel>
                                                <Select size="sm" value={simRoadCondition} onChange={(e) => setSimRoadCondition(e.target.value)}>
                                                    <option value="good">Good / Dry</option>
                                                    <option value="bad">Damaged Path</option>
                                                    <option value="wet">Wet Surface</option>
                                                    <option value="icy">Icy / Slippery</option>
                                                </Select>
                                            </FormControl>
                                        </SimpleGrid>

                                        <SimpleGrid columns={2} spacing={3}>
                                            <FormControl>
                                                <FormLabel fontSize="xs" fontWeight="bold">eSIM Connectivity</FormLabel>
                                                <Select size="xs" value={tboxeSimState} onChange={(e) => setTboxeSimState(e.target.value)}>
                                                    <option value="NORMAL_SIM">NORMAL_SIM</option>
                                                    <option value="NO_SIM">NO_SIM</option>
                                                    <option value="SIM_ERROR">SIM_ERROR</option>
                                                </Select>
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel fontSize="xs" fontWeight="bold">Operation State</FormLabel>
                                                <Select size="xs" value={tboxOperatingState} onChange={(e) => setTboxOperatingState(e.target.value)}>
                                                    <option value="NORMAL">NORMAL</option>
                                                    <option value="DISCONNECTED">DISCONNECTED</option>
                                                    <option value="FAIL">FAIL</option>
                                                </Select>
                                            </FormControl>
                                        </SimpleGrid>

                                        <Divider />

                                        <HStack spacing={2} wrap="wrap">
                                            <Button size="xs" colorScheme="red" variant="outline" onClick={() => triggerManualAlert('HARD_ACCELERATION')}>Crash Log</Button>
                                            <Button size="xs" colorScheme="orange" variant="outline" onClick={() => triggerManualAlert('TOWING')}>Tow Log</Button>
                                            <Button size="sm" colorScheme={isDeviceRemoved ? "purple" : "gray"} variant="solid" onClick={() => setIsDeviceRemoved(!isDeviceRemoved)} w="full">
                                                {isDeviceRemoved ? "Dismantle Detected" : "Dismantle Check"}
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* 3. Device Lifecycle & Remote Ops - HIDDEN BY USER REQUEST */}
                            {/* <Card variant="outline" shadow="md" borderRadius="xl" borderColor="gray.200">
                                <CardHeader borderBottomWidth="1px" py={3} bg="gray.50" borderTopLeftRadius="xl" borderTopRightRadius="xl">
                                    <HStack>
                                        <Icon as={Cpu} color="orange.500" />
                                        <Heading size="xs" textTransform="uppercase">Device Lifecycle</Heading>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box p={3} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                                            <Text fontSize="2xs" color="blue.700" fontWeight="bold" mb={1}>CURRENT LIFECYCLE STATE</Text>
                                            <Text fontWeight="bold" color="blue.800">{tboxApplicationState}</Text>
                                        </Box>

                                        <SimpleGrid columns={2} spacing={2}>
                                            <Button size="sm" colorScheme="green" onClick={handleDongleInsertion} isDisabled={tboxApplicationState !== 'PRE-SALES'}>Insert Dongle</Button>
                                            <Button size="sm" colorScheme="blue" onClick={() => handleLifecycleCommand('PROVISION')} isDisabled={tboxApplicationState !== 'FACTORY'}>Provision</Button>
                                            <Button size="sm" colorScheme="purple" onClick={() => handleLifecycleCommand('AUTHORIZE')} isDisabled={tboxApplicationState !== 'PROVISIONED'}>Authorize</Button>
                                            <Button size="sm" colorScheme="orange" onClick={() => handleLifecycleCommand('HANDOVER')} isDisabled={tboxApplicationState !== 'AUTHORIZED'}>Handover</Button>
                                        </SimpleGrid>
                                        <Button size="xs" variant="ghost" onClick={() => setTboxApplicationState('PRE-SALES')}>Reset to PRE-SALES</Button>

                                        <Divider />

                                        <Text fontWeight="bold" fontSize="xs" color="gray.600">REMOTE COMMANDS</Text>
                                        <SimpleGrid columns={2} spacing={2}>
                                            <Button size="xs" variant="outline" leftIcon={<Icon as={Zap} size={10} />} onClick={() => handleRemoteCommand('Blinker')}>Blinker</Button>
                                            <Button size="xs" variant="outline" leftIcon={<Icon as={Shield} size={10} />} onClick={() => handleRemoteCommand('DoorLock')}>Lock</Button>
                                            <Button size="xs" variant="outline" leftIcon={<Icon as={Shield} size={10} />} onClick={() => handleRemoteCommand('DoorUnlock')}>Unlock</Button>
                                            <Button size="xs" variant="outline" leftIcon={<Icon as={Activity} size={10} />} onClick={() => handleRemoteCommand('Honk')}>Honk</Button>
                                        </SimpleGrid>
                                    </VStack>
                                </CardBody>
                            </Card> */}

                            {/* 4. FOTA Update Center */}
                            <Card variant="outline" shadow="md" borderRadius="xl" borderColor="blue.100" bg="blue.50">
                                <CardBody p={4}>
                                    <VStack align="stretch" spacing={3}>
                                        <HStack justify="space-between">
                                            <HStack>
                                                <Icon as={Activity} color="blue.600" />
                                                <Text fontWeight="bold" fontSize="sm" color="blue.800">FOTA Status</Text>
                                            </HStack>
                                            <Badge colorScheme={fotaStatus === 'SUCCESS' ? 'green' : 'blue'}>{fotaStatus}</Badge>
                                        </HStack>

                                        {fotaStatus === 'DOWNLOADING' && (
                                            <VStack align="stretch" spacing={1}>
                                                <Progress value={fotaProgress} size="xs" borderRadius="full" colorScheme="blue" />
                                                <Text fontSize="10px" textAlign="right">{fotaProgress}%</Text>
                                            </VStack>
                                        )}

                                        <Flex gap={2}>
                                            <Button size="xs" colorScheme="blue" onClick={runFotaSequence} isDisabled={fotaStatus !== 'IDLE'} flex={1}>Check Updates</Button>
                                            <Button size="xs" colorScheme="green" onClick={handleInstallFota} isDisabled={fotaStatus !== 'READY_FOR_INSTALL'} flex={1}>Install</Button>
                                        </Flex>
                                    </VStack>
                                </CardBody>
                            </Card>

                            {lastPayload && (
                                <Box p={3} bg="gray.800" borderRadius="lg" shadow="inner">
                                    <HStack justify="space-between" mb={2}>
                                        <Text color="gray.400" fontSize="2xs" fontWeight="bold">LAST SOUTHBOUND PAYLOAD</Text>
                                        <Badge variant="outline" colorScheme="green" fontSize="10px">{lastPayload.type}</Badge>
                                    </HStack>
                                    <Box maxH="150px" overflowY="auto" css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '4px' } }}>
                                        <Text color="green.300" fontFamily="monospace" fontSize="xs" whiteSpace="pre-wrap">
                                            {JSON.stringify(lastPayload.content, null, 2)}
                                        </Text>
                                    </Box>
                                </Box>
                            )}
                        </VStack>
                    </GridItem>


                    {/* Main Content Area */}
                    <GridItem>
                        <Tabs variant="enclosed" colorScheme="blue" index={activeTabIndex} onChange={setActiveTabIndex} isLazy width={{ base: "93vw", md: "93vw", lg: "60vw" }}>
                            <TabList
                                mb="1em"
                                overflowX="auto"
                                overflowY="hidden"
                                whiteSpace="nowrap"
                                pb={2}
                                maxWidth="100%"
                                sx={{
                                    '&::-webkit-scrollbar': { height: '4px', display: { base: 'none', md: 'block' } },
                                    '&::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: '4px' }
                                }}
                            >
                                <Tab flexShrink={0}>Alert Rules</Tab>
                                <Tab flexShrink={0}>Rule Templates</Tab>
                                <Tab flexShrink={0}>Trip Configuration</Tab>
                                <Tab flexShrink={0}>CAN Configuration</Tab>
                                <Tab>Lifecycle Configuration</Tab>
                                <Tab>SouthBound Payloads</Tab>
                            </TabList>

                            <Card variant="outline" borderColor="gray.200" borderRadius="xl" boxShadow="sm" overflow="hidden">
                                <TabPanels bg="white">
                                    <TabPanel>
                                        <Box mb={6}>
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
                                            {rules.length === 0 && <Text color="gray.500" mb={4}>No active rules.</Text>}
                                            <DataVisualizer dataHistory={dataHistory} events={events} />
                                        </Box>

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
                                        <TripConfiguration parameters={parameters} setParameters={setParameters} />
                                    </TabPanel>
                                    <TabPanel>
                                        <CANSignalBuilder
                                            signals={canSignalRules}
                                            onUpdateSignals={setCanSignalRules}
                                            busData={canBusData}
                                        />
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
                            </Card>
                        </Tabs>
                        {/* Always Visible Event Log */}
                        <Card variant="outline" borderColor="gray.200" borderRadius="xl" boxShadow="sm" mt={6}>
                            <CardHeader borderBottomWidth="1px" py={{ base: 2, md: 3 }} px={{ base: 3, md: 4 }} bg="gray.50" borderTopLeftRadius="xl" borderTopRightRadius="xl">
                                <HStack justify="space-between">
                                    <HStack>
                                        <Icon as={Activity} color="orange.500" />
                                        <Heading size={{ base: "2xs", md: "xs" }} textTransform="uppercase">Live Event Log</Heading>
                                    </HStack>
                                    <Badge colorScheme="blue" variant="solid" borderRadius="full" px={2}>{events.length}</Badge>
                                </HStack>
                            </CardHeader>
                            <CardBody p={0}>
                                <Box overflowX="auto" maxHeight="400px" overflowY="auto" css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: '4px' } }}>
                                    <Box as="table" width="100%">
                                        <Box as="thead" bg="gray.50">
                                            <Box as="tr">
                                                <Box as="th" p={{ base: 2, md: 3 }} textAlign="left" fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Time</Box>
                                                <Box as="th" p={{ base: 2, md: 3 }} textAlign="left" fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Rule</Box>
                                                <Box as="th" p={{ base: 2, md: 3 }} textAlign="left" fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" display={{ base: "none", md: "table-cell" }}>Message</Box>
                                                <Box as="th" p={{ base: 2, md: 3 }} textAlign="left" fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Status</Box>
                                            </Box>
                                        </Box>
                                        <Box as="tbody">
                                            {events.slice().reverse().map((event, index) => (
                                                <Box as="tr" key={index} borderBottomWidth="1px" borderColor="gray.100" _hover={{ bg: 'gray.50' }}>
                                                    <Box as="td" p={{ base: 2, md: 3 }} fontSize="xs" color="gray.600">{new Date(event.timestamp).toLocaleTimeString()}</Box>
                                                    <Box as="td" p={{ base: 2, md: 3 }} fontSize="xs" fontWeight="bold">{event.ruleName}</Box>
                                                    <Box as="td" p={{ base: 2, md: 3 }} fontSize="xs" display={{ base: "none", md: "table-cell" }}>{event.message}</Box>
                                                    <Box as="td" p={{ base: 2, md: 3 }}>
                                                        <Badge
                                                            size="xs"
                                                            variant="subtle"
                                                            colorScheme={
                                                                event.severity === 'critical' ? 'red' :
                                                                    event.severity === 'warning' ? 'orange' :
                                                                        event.severity === 'success' ? 'green' : 'blue'
                                                            }
                                                            borderRadius="md"
                                                        >
                                                            {event.severity}
                                                        </Badge>
                                                    </Box>
                                                </Box>
                                            ))}
                                            {events.length === 0 && (
                                                <Box as="tr">
                                                    <Box as="td" colSpan={4} p={8} textAlign="center" color="gray.400">
                                                        <VStack spacing={2}>
                                                            <Icon as={Activity} size={24} opacity={0.3} />
                                                            <Text fontSize="sm">No events triggered yet</Text>
                                                        </VStack>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </CardBody>
                        </Card>
                    </GridItem>
                </Grid >
            </VStack >

            {/* Dongle Alert Popup */}
            < DongleAlertPopup
                isOpen={isAlertPopupOpen}
                onClose={() => setIsAlertPopupOpen(false)}
                alert={activePopupAlert}
            />
        </Flex >
    );
};

export default RuleEngineDashboard;
