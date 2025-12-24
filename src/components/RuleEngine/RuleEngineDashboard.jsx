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
} from '@chakra-ui/react';
import { RuleEngine, defaultRules, DeviceStates, ConfigurableParameters, DeviceVariables, JeepM6DefaultRules } from '../../utils/RuleEngine';
import RuleBuilder from './RuleBuilder';
import DataVisualizer from './DataVisualizer';
import RuleTemplateLibrary from './RuleTemplateLibrary';
import CreateRuleTemplate from './CreateRuleTemplate';
import { useAutoPersist } from '../../hooks/useAutoPersist';

// Default initial state for the Rule Engine screen
const DEFAULT_RULE_ENGINE_STATE = {
    rules: defaultRules,

    savedRules: defaultRules,
    savedTemplates: [], // New state for templates
    parameters: {
        MIN_TRIP_DISTANCE: ConfigurableParameters.find(p => p.name === 'MIN_TRIP_DISTANCE')?.defaultValue || 2,
        MIN_IGN_OFF_TIME: ConfigurableParameters.find(p => p.name === 'MIN_IGN_OFF_TIME')?.defaultValue || 120,
        MAX_IGN_OFF_TIME: ConfigurableParameters.find(p => p.name === 'MAX_IGN_OFF_TIME')?.defaultValue || 120
    },
    simRoadCondition: 'good',
    activeDriverName: null,
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
    const simRoadCondition = persistedState.simRoadCondition || 'good';
    const persistedActiveDriverName = persistedState.activeDriverName;

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
    const setSimRoadCondition = (condition) => updatePersistedState({ simRoadCondition: condition });

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
        elapsedIgnitionOffTime: 0
    });

    // Simulation State (transient)
    const [simSpeed, setSimSpeed] = useState(0);
    const [ignition, setIgnition] = useState(false);

    // Jeep M6 Simulation State
    const [batteryVoltage, setBatteryVoltage] = useState(12.6);
    const [crashDetected, setCrashDetected] = useState(false);
    const [fotaStatus, setFotaStatus] = useState('IDLE'); // IDLE, DOWNLOADING, INSTALLING, SUCCESS, FAILED
    const [geoFenceStatus, setGeoFenceStatus] = useState('INSIDE'); // INSIDE, OUTSIDE
    const [lastCommand, setLastCommand] = useState('NONE');

    // View State for Rule Templates
    const [templateView, setTemplateView] = useState('library'); // 'library' or 'create'

    // Trip Stats (Required for simulation)
    const tripStats = useRef({
        runTime: 0,      // seconds
        distance: 0,     // km
        offTime: 0       // seconds
    });

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
        setActiveTabIndex(1); // Switch to Rule Builder tab
        toast({ title: 'Template Loaded', description: 'Rule Builder prefilled with template data.', status: 'info', duration: 2000 });
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
        // Lifecycle Check: Only allow ignition in Trip states (Customer Mode)
        const isTripMode = [DeviceStates.TRIP_IDLE, DeviceStates.TRIP_PENDING, DeviceStates.TRIP_ACTIVE, DeviceStates.TRIP_PAUSED].includes(deviceState);

        if (!ignition && !isTripMode) {
            toast({
                title: 'Ignition Blocked',
                description: `Ignition is disabled in ${deviceState} state. Complete lifecycle handover first.`,
                status: 'warning',
                duration: 3000
            });
            return;
        }

        const newIgnitionState = !ignition;
        setIgnition(newIgnitionState);

        if (newIgnitionState) {
            // Turning ON (OFF → ON)
            tripStats.current.offTime = 0;
            tripStats.current.runTime = 0;
            tripStats.current.distance = 0;

            // Update device variables
            deviceVariables.current.tripStartTime = new Date().toISOString();
            deviceVariables.current.tripStartOdo = 0;
            deviceVariables.current.currentTripDistance = 0;
            deviceVariables.current.elapsedIgnitionOffTime = 0;

            // State transition: TRIP_IDLE → TRIP_PENDING
            if (deviceState === DeviceStates.TRIP_IDLE) {
                setDeviceState(DeviceStates.TRIP_PENDING);
                toast({
                    title: 'State: TRIP_PENDING',
                    description: 'Ignition ON - Waiting to confirm trip',
                    status: 'info',
                    duration: 2000
                });
                // Log State Change
                setEvents(prev => [...prev, {
                    ruleId: 'state-change', ruleName: 'State Change', type: 'state',
                    message: 'State changed to TRIP_PENDING (Ignition ON)', severity: 'info',
                    timestamp: new Date().toISOString(), dataSnapshot: { ...deviceVariables.current, deviceState: DeviceStates.TRIP_PENDING }
                }].slice(-100));
            } else if (deviceState === DeviceStates.TRIP_PAUSED) {
                // TRIP_PAUSED → TRIP_ACTIVE (Resume)
                setDeviceState(DeviceStates.TRIP_ACTIVE);
                toast({
                    title: 'State: TRIP_ACTIVE',
                    description: 'Trip Resumed from Pause',
                    status: 'success',
                    duration: 2000
                });
                // Log State Change
                setEvents(prev => [...prev, {
                    ruleId: 'state-change', ruleName: 'State Change', type: 'state',
                    message: 'State changed to TRIP_ACTIVE (Resumed)', severity: 'success',
                    timestamp: new Date().toISOString(), dataSnapshot: { ...deviceVariables.current, deviceState: DeviceStates.TRIP_ACTIVE }
                }].slice(-100));
            }
        } else {
            // Turning OFF (ON → OFF)
            setSimSpeed(0);
            deviceVariables.current.lastIgnitionOffTime = new Date().toISOString();
            toast({ title: 'Ignition OFF', status: 'info', duration: 2000 });
        }

        prevIgnitionRef.current = newIgnitionState;
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

        // Clear any running demo timeouts
        demoTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        demoTimeoutsRef.current = [];
    };

    const handleLifecycleCommand = (command) => {
        setLastCommand(command);
        let validTransition = false;

        if (deviceState === DeviceStates.FACTORY && command === 'PROVISION') {
            setDeviceState(DeviceStates.PROVISIONED);
            validTransition = true;
        } else if (deviceState === DeviceStates.PROVISIONED && command === 'AUTHORIZE') {
            setDeviceState(DeviceStates.AUTHORIZED);
            validTransition = true;
        } else if (deviceState === DeviceStates.AUTHORIZED && command === 'HANDOVER') {
            setDeviceState(DeviceStates.TRIP_IDLE); // Equivalent to CUSTOMER ready state
            validTransition = true;
        }

        const message = validTransition
            ? `Command ${command} accepted. State changed to ${validTransition ? (command === 'HANDOVER' ? DeviceStates.TRIP_IDLE : (command === 'PROVISION' ? DeviceStates.PROVISIONED : DeviceStates.AUTHORIZED)) : ''}`
            : `Command ${command} rejected in state ${deviceState}`;

        toast({
            title: validTransition ? 'Lifecycle Update' : 'Command Rejected',
            description: message,
            status: validTransition ? 'success' : 'warning',
            duration: 2000
        });

        // Log Event
        setEvents(prev => [...prev, {
            ruleId: 'lifecycle-command', ruleName: 'Remote Command', type: 'command',
            message: message, severity: validTransition ? 'info' : 'warning',
            timestamp: new Date().toISOString(), dataSnapshot: { ...deviceVariables.current, deviceState, lastCommand: command }
        }].slice(-100));
    };

    const handleLoadM6Rules = () => {
        setRules([...rules, ...JeepM6DefaultRules]);
        toast({ title: 'Jeep M6 Rules Loaded', status: 'success', duration: 2000 });
    };

    const runLifecycleDemo = () => {
        // Clear any existing demo
        demoTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        demoTimeoutsRef.current = [];

        // Reset to Factory
        setDeviceState(DeviceStates.FACTORY);
        toast({
            title: 'Lifecycle Demo Started',
            description: 'Starting from FACTORY state...',
            status: 'info',
            duration: 2000
        });

        // Step 1: PROVISION (after 2s)
        demoTimeoutsRef.current.push(setTimeout(() => {
            handleLifecycleCommand('PROVISION');
        }, 2000));

        // Step 2: AUTHORIZE (after 4s)
        demoTimeoutsRef.current.push(setTimeout(() => {
            handleLifecycleCommand('AUTHORIZE');
        }, 4000));

        // Step 3: HANDOVER (after 6s)
        demoTimeoutsRef.current.push(setTimeout(() => {
            handleLifecycleCommand('HANDOVER');
        }, 6000));

        // Step 4: Complete (after 8s)
        demoTimeoutsRef.current.push(setTimeout(() => {
            toast({
                title: 'Lifecycle Demo Complete',
                description: 'Device is now in CUSTOMER mode (TRIP_IDLE). Ready for trips!',
                status: 'success',
                duration: 4000,
                position: 'top'
            });
        }, 8000));
    };

    const runDemoScenario = () => {
        // 1. Reset
        clearData();
        setDeviceState(DeviceStates.CUSTOMER); // Ensure we are in customer mode for demo (or TRIP_IDLE)
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

                if (ignition) {
                    // Engine is ON
                    tripStats.current.runTime += 1;
                    tripStats.current.offTime = 0;
                    deviceVariables.current.elapsedIgnitionOffTime = 0;

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

                    // Update distance (speed is km/h, time is 1s)
                    // Distance in km = speed * (1/3600)
                    tripStats.current.distance += (currentSpeed / 3600);
                    deviceVariables.current.currentTripDistance = tripStats.current.distance;

                    // State Machine: TRIP_PENDING → TRIP_ACTIVE transition
                    if (deviceState === DeviceStates.TRIP_PENDING &&
                        deviceVariables.current.currentTripDistance >= parameters.MIN_TRIP_DISTANCE) {
                        setDeviceState(DeviceStates.TRIP_ACTIVE);
                        toast({
                            title: 'State: TRIP_ACTIVE',
                            description: `Trip confirmed! Distance: ${deviceVariables.current.currentTripDistance.toFixed(2)} km`,
                            status: 'success',
                            duration: 2000
                        });
                        // Log State Change
                        setEvents(prev => [...prev, {
                            ruleId: 'state-change', ruleName: 'State Change', type: 'state',
                            message: `State changed to TRIP_ACTIVE (Distance > ${parameters.MIN_TRIP_DISTANCE}km)`, severity: 'success',
                            timestamp: new Date().toISOString(), dataSnapshot: { ...deviceVariables.current, deviceState: DeviceStates.TRIP_ACTIVE }
                        }].slice(-100));
                    }

                } else {
                    // Engine is OFF
                    currentSpeed = 0;
                    currentRpm = 0;
                    tripStats.current.offTime += 1;
                    deviceVariables.current.elapsedIgnitionOffTime = tripStats.current.offTime;

                    // State Machine: TRIP_PENDING or TRIP_ACTIVE → TRIP_IDLE transition
                    // State Machine: TRIP_PENDING/ACTIVE → TRIP_PAUSED
                    // Ensure parameters are numbers
                    const minIgnOff = Number(parameters.MIN_IGN_OFF_TIME) || 120;
                    const maxIgnOff = Number(parameters.MAX_IGN_OFF_TIME) || 120;

                    if ((deviceState === DeviceStates.TRIP_PENDING || deviceState === DeviceStates.TRIP_ACTIVE) &&
                        deviceVariables.current.elapsedIgnitionOffTime >= minIgnOff &&
                        deviceVariables.current.elapsedIgnitionOffTime < maxIgnOff) {

                        // If we are PENDING and hit minIgnOff, it's a False Trip -> Go straight to IDLE and STOP
                        if (deviceState === DeviceStates.TRIP_PENDING) {
                            setDeviceState(DeviceStates.TRIP_IDLE);
                            setIsRunning(false); // STOP SIMULATION
                            toast({ title: 'False Trip Ended', description: 'Distance too short. Simulation Stopped.', status: 'info', duration: 2000 });
                        } else {
                            // Normal Pause
                            setDeviceState(DeviceStates.TRIP_PAUSED);
                            toast({ title: 'State: TRIP_PAUSED', description: `Trip Paused (Ign Off > ${minIgnOff}s)`, status: 'warning', duration: 2000 });
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

                    // State Machine: TRIP_PAUSED → TRIP_IDLE
                    if ((deviceState === DeviceStates.TRIP_PAUSED || deviceState === DeviceStates.TRIP_ACTIVE || deviceState === DeviceStates.TRIP_PENDING) &&
                        deviceVariables.current.elapsedIgnitionOffTime >= maxIgnOff) {
                        setDeviceState(DeviceStates.TRIP_IDLE);
                        setIsRunning(false); // STOP SIMULATION
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
                }

                const currentData = {
                    // Sensor Data
                    speed: currentSpeed,
                    rpm: currentRpm,
                    roadCondition: simRoadCondition,
                    engineTemp: 80 + Math.random() * 10,
                    fuelLevel: 75,
                    timestamp: new Date().toISOString(),

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
                    // Parameters (for rule evaluation)
                    MIN_TRIP_DISTANCE: parameters.MIN_TRIP_DISTANCE,
                    MIN_IGN_OFF_TIME: parameters.MIN_IGN_OFF_TIME,
                    MAX_IGN_OFF_TIME: parameters.MAX_IGN_OFF_TIME,

                    // Jeep M6 Data
                    batteryVoltage: batteryVoltage,
                    crashDetected: crashDetected,
                    fotaStatus: fotaStatus,
                    geoFenceStatus: geoFenceStatus,
                    lastCommand: lastCommand
                };

                // Evaluate Rules
                const newEvents = engine.evaluate(currentData);

                // DATA LOGGING (Telemetry - Every Second)
                const telemetryEvent = {
                    ruleId: 'system-telemetry',
                    ruleName: 'System Monitor',
                    type: 'telemetry',
                    message: `Speed: ${currentSpeed.toFixed(1)} km/h | State: ${deviceState}`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    dataSnapshot: { ...currentData } // Snapshot
                };

                // Combine Rule Events + Telemetry
                const allNewEvents = [...newEvents, telemetryEvent];

                // Update State (Cap history to 100 items to prevent lag)
                setDataHistory(prev => [...prev.slice(-50), currentData]);
                setEvents(prev => [...prev, ...allNewEvents].slice(-100)); // Keep last 100 events

                if (newEvents.length > 0) {
                    newEvents.forEach(event => {
                        if (event.severity === 'critical') {
                            toast({
                                title: event.message,
                                status: 'error',
                                duration: 3000,
                                isClosable: true,
                                position: 'top-right'
                            });
                        }
                    });
                }

            }, 1000);
        }

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, engine, simSpeed, simRoadCondition, toast, ignition, deviceState, parameters]);

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

    return (
        <Container maxW="container.xl" py={5}>
            <VStack spacing={5} align="stretch">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Heading>Rule Engine Dashboard</Heading>
                    <HStack>
                        <Button
                            colorScheme={isRunning ? "red" : "green"}
                            onClick={toggleSimulation}
                        >
                            {isRunning ? "Stop Simulation" : "Start Simulation"}
                        </Button>
                        <Button variant="outline" onClick={clearData}>
                            Clear Data
                        </Button>
                        {/* <Button colorScheme="purple" variant="outline" onClick={handleLoadM6Rules}>
                            Load Jeep M6 Rules
                        </Button> */}
                        <Button colorScheme="teal" onClick={runLifecycleDemo}>
                            ▶ Lifecycle Demo
                        </Button>
                        <Button colorScheme="pink" onClick={runDemoScenario}>
                            ▶ Run M6 Demo
                        </Button>
                    </HStack>
                </Box>

                {/* Device State Machine Display */}
                <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>
                    <HStack justify="space-between" mb={3}>
                        <Text fontWeight="bold">Device State Machine</Text>
                        <HStack spacing={2}>
                            {Object.values(DeviceStates).map((state) => (
                                <Badge
                                    key={state}
                                    colorScheme={deviceState === state ? 'green' : 'gray'}
                                    variant={deviceState === state ? 'solid' : 'outline'}
                                    fontSize="sm"
                                    px={3}

                                    py={1}
                                >
                                    {state}
                                </Badge>
                            ))}
                        </HStack>
                        <Badge
                            colorScheme={
                                deviceState === DeviceStates.TRIP_ACTIVE ? 'green' :
                                    deviceState === DeviceStates.TRIP_PAUSED ? 'orange' :
                                        deviceState === DeviceStates.TRIP_PENDING ? 'yellow' : 'gray'
                            }
                            variant="solid"
                            fontSize="lg"
                            px={4}
                            py={2}
                            borderRadius="full"
                        >
                            {deviceState}
                        </Badge>
                    </HStack>

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
                </Box>

                {/* Configurable Parameters */}
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
                                        size="xs"
                                        colorScheme={ignition ? "green" : "gray"}
                                        onClick={toggleIgnition}
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
                                        width="full"
                                        colorScheme={crashDetected ? "red" : "gray"}
                                        onClick={() => setCrashDetected(!crashDetected)}
                                    >
                                        {crashDetected ? "CRASH DETECTED!" : "No Crash"}
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
                        <Tab>Dashboard</Tab>
                        <Tab>Rule Builder</Tab>
                        <Tab fontSize="sm">Rule Template</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <VStack align="stretch" spacing={4}>
                                <Heading size="sm">Active Rules ({rules.length})</Heading>
                                {rules.map(rule => (
                                    <Box key={rule.id} p={3} borderWidth="1px" borderRadius="md">
                                        <HStack justify="space-between">
                                            <Text fontWeight="bold">{rule.name}</Text>
                                            <Badge colorScheme={rule.event.severity === 'critical' ? 'red' : 'blue'}>
                                                {rule.event.severity}
                                            </Badge>
                                        </HStack>
                                    </Box>
                                ))}
                                {rules.length === 0 && <Text color="gray.500">No active rules.</Text>}
                                <DataVisualizer dataHistory={dataHistory} events={events} />
                            </VStack>
                        </TabPanel>
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
                        <TabPanel p={0} h="100%">
                            {templateView === 'library' ? (
                                <RuleTemplateLibrary
                                    onCreateNew={() => setTemplateView('create')}
                                    templates={allTemplates}
                                    onUseTemplate={handleUseTemplate}
                                />
                            ) : (
                                <CreateRuleTemplate
                                    onCancel={() => setTemplateView('library')}
                                    onSave={handleSaveTemplate}
                                />
                            )}
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
                                                        event.severity === 'warning' ? 'orange' : 'blue'
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
        </Container >
    );
};

export default RuleEngineDashboard;
