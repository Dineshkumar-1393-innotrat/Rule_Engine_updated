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
import { RuleEngine, defaultRules, DeviceStates, ConfigurableParameters, DeviceVariables } from '../../utils/RuleEngine';
import RuleBuilder from './RuleBuilder';
import DataVisualizer from './DataVisualizer';
import DriverProfileBuilder from './DriverProfileBuilder';
import { useAutoPersist } from '../../hooks/useAutoPersist';

// Default initial state for the Rule Engine screen
const DEFAULT_RULE_ENGINE_STATE = {
    rules: defaultRules,
    savedRules: defaultRules,
    savedProfiles: [],
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
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    // AutoPersist hook for global state persistence
    const { state: persistedState, updateState: updatePersistedState, isLoading } = useAutoPersist({
        screenKey: '/rule-engine',
        initialState: DEFAULT_RULE_ENGINE_STATE,
    });

    // Extract persisted values with defaults
    const rules = persistedState.rules || defaultRules;
    const savedRules = persistedState.savedRules || defaultRules;
    const savedProfiles = persistedState.savedProfiles || [];
    const parameters = persistedState.parameters || DEFAULT_RULE_ENGINE_STATE.parameters;
    const simRoadCondition = persistedState.simRoadCondition || 'good';
    const persistedActiveDriverName = persistedState.activeDriverName;

    // Setters that auto-save
    const setRules = (newRules) => updatePersistedState({ rules: newRules });
    const setSavedRules = (newSavedRules) => updatePersistedState({ savedRules: newSavedRules });
    const setSavedProfiles = (newProfiles) => updatePersistedState({ savedProfiles: newProfiles });
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

    // Active driver - restore from persisted name
    const [activeDriver, setActiveDriver] = useState(() => {
        if (persistedActiveDriverName && savedProfiles.length > 0) {
            return savedProfiles.find(p => p.name === persistedActiveDriverName) || null;
        }
        return null;
    });

    // Trip Stats
    const tripStats = useRef({
        runTime: 0,      // seconds
        distance: 0,     // km
        offTime: 0       // seconds
    });

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

    const handleSaveProfile = (profile) => {
        const exists = savedProfiles.some(p => p.name === profile.name);
        let newProfiles;
        if (exists) {
            newProfiles = savedProfiles.map(p => p.name === profile.name ? profile : p);
            toast({ title: 'Profile Updated', status: 'success', duration: 2000 });
        } else {
            newProfiles = [...savedProfiles, profile];
            toast({ title: 'Profile Saved', status: 'success', duration: 2000 });
        }
        setSavedProfiles(newProfiles);
        // Auto-persisted by useAutoPersist
    };

    const handleActivateProfile = (profile) => {
        setActiveDriver(profile);
        updatePersistedState({ activeDriverName: profile.name }); // Persist active driver
        setSimSpeed(profile.baseSpeed);
        toast({ title: `Driver Profile "${profile.name}" Activated`, status: 'info', duration: 2000 });
    };

    const handleAddRule = (newRule) => {
        setRules([...rules, newRule]);
        toast({ title: 'Rule Added', status: 'success', duration: 2000 });
    };

    const handleDeleteRule = (ruleId) => {
        setRules(rules.filter(r => r.id !== ruleId));
    };

    const toggleSimulation = () => setIsRunning(!isRunning);
    const toggleIgnition = () => {
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
        setActiveDriver(null);

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

                    if (activeDriver) {
                        // Aggressiveness affects speed fluctuation and RPM
                        const fluctuation = (Math.random() - 0.5) * (activeDriver.aggressiveness / 5);
                        currentSpeed = Math.max(0, Math.min(200, activeDriver.baseSpeed + fluctuation));

                        // RPM calculation based on speed and aggressiveness
                        const baseRpm = (currentSpeed / 200) * 6000;
                        const aggressionRpm = (activeDriver.aggressiveness / 100) * 2000 * Math.random();
                        currentRpm = Math.floor(1000 + baseRpm + aggressionRpm);
                    } else {
                        // Default behavior
                        const fluctuation = Math.floor(Math.random() * 5) - 2;
                        currentSpeed = Math.max(0, Math.min(200, simSpeed + fluctuation));
                        currentRpm = Math.floor(1000 + Math.random() * 7000);
                    }

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
                    if ((deviceState === DeviceStates.TRIP_PENDING || deviceState === DeviceStates.TRIP_ACTIVE) &&
                        deviceVariables.current.elapsedIgnitionOffTime >= parameters.MIN_IGN_OFF_TIME &&
                        deviceVariables.current.elapsedIgnitionOffTime < parameters.MAX_IGN_OFF_TIME) {
                        setDeviceState(DeviceStates.TRIP_PAUSED);
                        toast({
                            title: 'State: TRIP_PAUSED',
                            description: `Trip Paused (Ign Off > ${parameters.MIN_IGN_OFF_TIME}s)`,
                            status: 'warning',
                            duration: 2000
                        });
                        // Log State Change
                        setEvents(prev => [...prev, {
                            ruleId: 'state-change', ruleName: 'State Change', type: 'state',
                            message: 'State changed to TRIP_PAUSED (Ignition Off)', severity: 'warning',
                            timestamp: new Date().toISOString(), dataSnapshot: { ...deviceVariables.current, deviceState: DeviceStates.TRIP_PAUSED }
                        }].slice(-100));
                    }

                    // State Machine: TRIP_PAUSED → TRIP_IDLE
                    if ((deviceState === DeviceStates.TRIP_PAUSED || deviceState === DeviceStates.TRIP_ACTIVE || deviceState === DeviceStates.TRIP_PENDING) &&
                        deviceVariables.current.elapsedIgnitionOffTime >= parameters.MAX_IGN_OFF_TIME) {
                        setDeviceState(DeviceStates.TRIP_IDLE);
                        toast({
                            title: 'State: TRIP_IDLE',
                            description: `Trip ended. Ignition off for ${parameters.MAX_IGN_OFF_TIME}s`,
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
                    MIN_TRIP_DISTANCE: parameters.MIN_TRIP_DISTANCE,
                    MIN_IGN_OFF_TIME: parameters.MIN_IGN_OFF_TIME,
                    MAX_IGN_OFF_TIME: parameters.MAX_IGN_OFF_TIME
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
    }, [isRunning, engine, simSpeed, simRoadCondition, toast, activeDriver, ignition, deviceState, parameters]);

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
                                    onChange={(_, val) => setParameters(prev => ({ ...prev, MIN_IGN_OFF_TIME: val }))}
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
                                <Text fontSize="xs" color="gray.500">Time to end trip</Text>
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm">MAX_IGN_OFF_TIME (seconds)</FormLabel>
                                <NumberInput
                                    value={parameters.MAX_IGN_OFF_TIME}
                                    onChange={(_, val) => setParameters(prev => ({ ...prev, MAX_IGN_OFF_TIME: val }))}
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
                                    isDisabled={!!activeDriver || !ignition}
                                >
                                    <SliderTrack>
                                        <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                </Slider>
                                {activeDriver && <Text fontSize="xs" color="blue.500">Controlled by Driver Profile: {activeDriver.name}</Text>}
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
                    <HStack mt={4} spacing={4} fontSize="sm" color="gray.600">
                        <Text>Trip Time: {Math.floor(tripStats.current.runTime / 60)}m {tripStats.current.runTime % 60}s</Text>
                        <Text>Distance: {tripStats.current.distance.toFixed(2)} km</Text>
                        <Text>Off Time: {Math.floor(tripStats.current.offTime / 60)}m {tripStats.current.offTime % 60}s</Text>
                    </HStack>
                </Box>

                <Tabs variant="enclosed" colorScheme="blue">
                    <TabList mb="1em">
                        <Tab>Dashboard</Tab>
                        <Tab>Rule Builder</Tab>
                        <Tab>Driver Profiles</Tab>
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
                            />
                        </TabPanel>
                        <TabPanel>
                            <DriverProfileBuilder
                                savedProfiles={savedProfiles}
                                onSaveProfile={handleSaveProfile}
                                onActivateProfile={handleActivateProfile}
                            />
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
        </Container>
    );
};

export default RuleEngineDashboard;
