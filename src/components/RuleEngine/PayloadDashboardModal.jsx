import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Box,
    Grid,
    Heading,
    Text,
    Button,
    HStack,
    VStack,
    Input,
    Checkbox,
    Flex,
    Spacer,
    Spinner,
    Badge,
    IconButton,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    InputGroup,
    InputLeftElement,
    Wrap,
    WrapItem,
    Tooltip,
    useToast
} from '@chakra-ui/react';
import { RotateCcw, LayoutDashboard, Wifi, WifiOff, ArrowLeft, Search, Monitor, Eye, Thermometer, Zap, Fuel, Activity, Car, Map, Calendar, Bell } from 'lucide-react';
import { TraxoApi } from '../../utils/TraxoApi';
import { motion, AnimatePresence } from 'framer-motion';

// Visual Components for Dashboard
const CircularGauge = ({ value, label, unit, color = "#00E5FF", size = 110, icon: Icon }) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (parseFloat(value) || 0) / 100;

    return (
        <VStack spacing={3} align="center">
            <Box position="relative" width={size} height={size}>
                {/* Outer decorative ring */}
                <Box
                    position="absolute"
                    top="-4px" left="-4px" right="-4px" bottom="-4px"
                    border="1px solid"
                    borderColor="rgba(0, 0, 0, 0.05)"
                    borderRadius="full"
                />
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        <filter id={`glow-${label.replace(/\s+/g, '-')}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="transparent"
                        stroke="rgba(0, 0, 0, 0.03)"
                        strokeWidth={strokeWidth}
                    />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - (progress * circumference) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        filter={`url(#glow-${label.replace(/\s+/g, '-')})`}
                    />
                </svg>
                <VStack
                    position="absolute"
                    top="50%" left="50%"
                    transform="translate(-50%, -50%)"
                    spacing={0}
                >
                    <Text fontSize="lg" fontWeight="900" color="gray.800" letterSpacing="-1px">
                        {value}{unit}
                    </Text>
                    {Icon && <Icon size={14} color={color} opacity={0.8} />}
                </VStack>
            </Box>
            <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="1px" textTransform="uppercase">
                {label}
            </Text>
        </VStack>
    );
};

const SpeedometerGauge = ({ value, label, secondaryValue }) => {
    const size = 260;
    const strokeWidth = 12;
    const radius = 90;
    const center = size / 2;
    const speed = parseFloat(value) || 0;
    const odo = parseFloat(secondaryValue) || 0;
    const maxVal = 240;
    const progress = Math.min(speed / maxVal, 1);
    const totalAngle = 270;
    const startAngle = -135;
    const currentAngle = startAngle + progress * totalAngle;

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const drawArc = (start, end) => {
        const startPoint = polarToCartesian(center, center, radius, end);
        const endPoint = polarToCartesian(center, center, radius, start);
        const largeArcFlag = end - start <= 180 ? "0" : "1";
        return [
            "M", startPoint.x, startPoint.y,
            "A", radius, radius, 0, largeArcFlag, 0, endPoint.x, endPoint.y
        ].join(" ");
    };

    return (
        <VStack spacing={0} position="relative" mt={-4}>
            <Box position="relative" width={size} height={size}>
                <svg width={size} height={size} style={{ overflow: 'visible' }}>
                    <defs>
                        <filter id="speed-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="speed-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00B8D4" />
                            <stop offset="100%" stopColor="#00E5FF" />
                        </linearGradient>
                    </defs>

                    <path
                        d={drawArc(startAngle, startAngle + totalAngle)}
                        fill="none"
                        stroke="rgba(0, 0, 0, 0.03)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    <motion.path
                        d={drawArc(startAngle, currentAngle)}
                        fill="none"
                        stroke="url(#speed-gradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        filter="url(#speed-glow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />

                    {[...Array(9)].map((_, i) => {
                        const angle = startAngle + (i * (totalAngle / 8));
                        const p1 = polarToCartesian(center, center, radius + 8, angle);
                        const p2 = polarToCartesian(center, center, radius + 18, angle);
                        const tickVal = i * (maxVal / 8);
                        const isActive = speed >= tickVal;
                        return (
                            <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isActive ? "#00B8D4" : "rgba(0,0,0,0.1)"} strokeWidth="2" />
                        );
                    })}
                </svg>

                <VStack position="absolute" top="55%" left="50%" transform="translate(-50%, -50%)" spacing={-1}>
                    <Text fontSize="6xl" fontWeight="900" color="gray.800" lineHeight="1">
                        {Math.floor(speed)}
                    </Text>
                    <Text fontSize="xs" fontWeight="black" color="blue.500" letterSpacing="2px">KM/H</Text>

                    <Box mt={4} textAlign="center">
                        <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="1px">ODO</Text>
                        <Text fontSize="md" fontWeight="bold" color="gray.700">
                            {odo.toLocaleString()} <Text as="span" fontSize="10px" color="gray.500">KM</Text>
                        </Text>
                    </Box>
                </VStack>
            </Box>
        </VStack>
    );
};

const StatusToggle = ({ label, description, isOn, icon: Icon, isError = false }) => {
    const color = isError ? "red" : (isOn ? "blue" : "gray");
    return (
        <Box
            bg="white" p={5} borderRadius="2xl" border="1px solid"
            borderColor={isError ? "red.200" : "gray.100"}
            boxShadow="sm" _hover={{ border: '1px solid', borderColor: `${color}.200`, boxShadow: 'lg' }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" position="relative" overflow="hidden"
        >
            {/* Subtle glow background */}
            {isOn && !isError && <Box position="absolute" top="-20%" right="-10%" w="100px" h="100px" bg={`${color}.50`} filter="blur(40px)" opacity={0.6} zIndex={0} />}

            <Flex align="center" justify="space-between" position="relative" zIndex={1}>
                <HStack spacing={4}>
                    <Box p={3} borderRadius="xl" bg={isError ? "red.500" : (isOn ? "blue.500" : "gray.100")} transition="all 0.3s">
                        <Icon size={22} color={(isOn && !isError) || isError ? "white" : "gray.500"} />
                    </Box>
                    <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="800" color="gray.800" fontSize="md" letterSpacing="-0.2px">{label}</Text>
                        <Text fontSize="10px" color={isError ? "red.500" : "gray.500"} fontWeight="bold" textTransform="uppercase" letterSpacing="0.5px">
                            {isError ? "STREAMS ERR" : description}
                        </Text>
                    </VStack>
                </HStack>

                <VStack align="flex-end" spacing={1}>
                    <Box w="12px" h="12px" borderRadius="full" bg={isError ? "red.500" : (isOn ? "blue.500" : "gray.300")} boxShadow={isOn && !isError ? "0 0 10px rgba(49, 130, 206, 0.5)" : "none"} transition="all 0.3s" />
                    <Text fontSize="9px" fontWeight="900" color={isError ? "red.600" : (isOn ? "blue.600" : "gray.400")} letterSpacing="1px">
                        {isError ? "FAILURE" : (isOn ? "ENGAGED" : "OFF")}
                    </Text>
                </VStack>
            </Flex>
        </Box>
    );
};

const VisualDashboardView = ({ signals, deviceState }) => {
    // ... [Values logic kept same] ...
    const getVal = (name, defaultValue = 0) => {
        const signal = signals.find(s => s.name === name);
        if (signal && signal.data && signal.data.length > 0) {
            const latest = signal.data[0];
            const result = latest.signalValue ?? latest.Event ?? latest.value ?? defaultValue;
            if (name === "Battery Voltage Level") return parseFloat(result) || 0;
            return result;
        }
        return defaultValue;
    };

    const cmdSignal = signals.find(s => s.name === "Remote Commands");
    const lastCmds = cmdSignal?.data?.slice(0, 3) || [];

    const getComplexVal = (name) => {
        const signal = signals.find(s => s.name === name);
        return (signal && signal.data && signal.data.length > 0) ? signal.data[0] : null;
    };

    const isSigError = (name) => {
        const signal = signals.find(s => s.name === name);
        return !!(signal && signal.error);
    };

    const vehicleSpeed = getVal("Vehicle Speed", 0);
    const engineSpeed = getVal("Engine Speed", 0);
    const fuel = getVal("Fuel Level", 0);
    const batteryRaw = getVal("Battery Voltage Level", 0);
    const batteryPercent = Math.min(Math.round((batteryRaw / 15) * 100), 100);
    const engineTemp = getVal("Engine Water Temp", 0);
    const extTemp = getVal("External Temperature (C)", 0);
    const ignition = deviceState?.ignition ?? getVal("Ignition Status", "OFF");
    const odometer = getVal("Total Odometer", 0);

    const locationData = getComplexVal("Location");
    const alertsData = getComplexVal("Alerts");
    const hasEmergency = Array.isArray(alertsData) ? alertsData.length > 0 : !!alertsData;

    const lat = locationData?.gpsLat || locationData?.latitude || locationData?.Latitude || locationData?.gps_lat;
    const long = locationData?.gpsLong || locationData?.longitude || locationData?.Longitude || locationData?.gps_lng || locationData?.gpsLong;
    const coords = (lat && long)
        ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`
        : "12.9529, 80.2331";

    const getMostRecentTimestamp = () => {
        let mostRecent = null;
        signals.forEach(signal => {
            if (signal.data && signal.data.length > 0) {
                const latest = signal.data[0];
                const timestamp = latest.updatedTimeStamp || latest.timestamp || latest.time;
                if (timestamp) {
                    const date = new Date(timestamp);
                    if (!mostRecent || date > mostRecent) mostRecent = date;
                }
            }
        });
        return mostRecent || new Date();
    };

    const lastUpdate = getMostRecentTimestamp();
    const formattedDate = lastUpdate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTime = lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <Box w="full" bg="#f8faff" p={8} borderRadius="none" minH="100vh" position="relative" overflow="hidden">
            {/* HUD Grid Background */}
            <Box
                position="absolute" top={0} left={0} right={0} bottom={0}
                backgroundImage="radial-gradient(circle, #e2e8f0 1px, transparent 1px)"
                backgroundSize="32px 32px"
                pointerEvents="none"
                opacity={0.4}
                zIndex={0}
            />

            <Box position="relative" zIndex={1}>
                {/* Top Row: Status Toggles */}
                <Grid templateColumns="repeat(2, 1fr)" gap={6} mb={8}>
                    <StatusToggle
                        label="Ignition Status"
                        description="Real-time engine status"
                        isOn={String(ignition).toUpperCase() === 'ON' || String(ignition).toUpperCase() === 'TRUE' || ignition === 1}
                        icon={Zap}
                        isError={isSigError("Ignition Status")}
                    />
                    <StatusToggle
                        label="Emergency Alert"
                        description={hasEmergency ? "Critical Alerts Detected!" : "No active alerts"}
                        isOn={hasEmergency}
                        icon={Bell}
                        isError={isSigError("Alerts")}
                    />
                </Grid>

                {/* Middle Grid Layout */}
                <Grid templateColumns="1.2fr 0.8fr 1.5fr" gap={6} mb={8} h="380px">
                    {/* Left: Map Card */}
                    <Box bg="white" borderRadius="2xl" overflow="hidden" position="relative" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm">
                        {lat && long ? (
                            <iframe
                                width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                                src={`https://maps.google.com/maps?q=${lat},${long}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            />
                        ) : (
                            <Flex bg="gray.50" h="full" align="center" justify="center" direction="column">
                                <Map size={40} color="#CBD5E0" />
                                <Text mt={3} color="gray.400" fontWeight="bold" fontSize="xs">AWAITING GPS SIGNAL...</Text>
                            </Flex>
                        )}
                        {/* Map Overlay */}
                        <Box position="absolute" top={4} left={4} bg="whiteAlpha.900" backdropFilter="blur(8px)" p={4} borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="whiteAlpha.500">
                            <Flex align="center" gap={3}>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                    <Activity size={18} color="#3182CE" />
                                </motion.div>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="md" fontWeight="900" color="gray.800" letterSpacing="-0.5px">{coords}</Text>
                                    <Text fontSize="9px" color="gray.500" fontWeight="black" letterSpacing="1px">LIVE COORDINATES</Text>
                                </VStack>
                            </Flex>
                        </Box>

                        {/* Remote Command Status Overlay */}
                        <AnimatePresence>
                            {lastCmds.length > 0 && (
                                <Box position="absolute" bottom={4} right={4} maxW="200px" zIndex={5}>
                                    <VStack spacing={2} align="stretch">
                                        {lastCmds.map((cmd, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ x: 50, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                            >
                                                <Box
                                                    bg={cmd.status === 'SUCCESS' ? "green.500" : "red.500"}
                                                    color="white" p={2} borderRadius="lg" boxShadow="md"
                                                    border="1px solid" borderColor="whiteAlpha.400"
                                                >
                                                    <HStack justify="space-between">
                                                        <Text fontSize="9px" fontWeight="black">{(cmd.command || 'Unknown').toUpperCase()}</Text>
                                                        <Activity size={10} color="white" />
                                                    </HStack>
                                                    <Text fontSize="8px" fontWeight="bold" opacity={0.9}>{cmd.time}</Text>
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                        </AnimatePresence>
                    </Box>

                    {/* Center Column: Temp & Time */}
                    <VStack spacing={6} h="full">
                        <Box flex={1.2} w="full">
                            <TempCard temp={engineTemp} label="Engine Temp" interiorTemp={extTemp} />
                        </Box>
                        <Box flex={1} w="full" bg="white" p={5} borderRadius="2xl" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm" display="flex" flexDirection="column" justifyContent="space-between">
                            <Flex justify="space-between" align="center">
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontWeight="800" color="blue.500" fontSize="xs" letterSpacing="0.5px">SYSTEM TIME</Text>
                                    <Text color="gray.400" fontSize="10px" fontWeight="bold">{formattedDate}</Text>
                                </VStack>
                                <LayoutDashboard size={18} color="#CBD5E0" />
                            </Flex>
                            <Box textAlign="center" py={2}>
                                <Text fontSize="4xl" fontWeight="900" color="gray.800" letterSpacing="-1px">{formattedTime}</Text>
                            </Box>
                            <Text fontSize="9px" color="gray.400" textAlign="center" fontWeight="black" letterSpacing="1px">LAST UPDATED</Text>
                        </Box>
                    </VStack>

                    {/* Right: Car Visualization */}
                    <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm" overflow="hidden">
                        <iframe
                            src="https://stimg.cardekho.com/images/feelthecar360view/Exterior/Jeep/Jeep-Compass/Exterior.html"
                            width="100%" height="100%" style={{ border: 'none' }} title="Jeep Compass 360 View"
                        />
                    </Box>
                </Grid>

                {/* Bottom Row: HUD Gauges */}
                <Flex
                    align="center" justify="space-around" px={10} py={8}
                    bg="white" borderRadius="3xl" boxShadow="lg"
                    border="1px solid" borderColor="rgba(0,0,0,0.04)"
                    position="relative" overflow="hidden"
                >
                    <CircularGauge value={fuel} label="Fuel Level" unit="%" color="#00B8D4" icon={Fuel} />

                    <CircularGauge
                        value={Math.min(Math.round((engineSpeed / 8000) * 100), 100)}
                        label={`RPM (${engineSpeed})`} unit="" color="#FF9100" icon={Activity}
                    />

                    <SpeedometerGauge
                        value={vehicleSpeed}
                        secondaryValue={odometer}
                    />

                    <CircularGauge
                        value={batteryPercent}
                        label={`Battery (${batteryRaw}V)`} unit="%" color="#00C853" icon={Zap}
                    />
                </Flex>

                {/* Footer Icon Bar */}
                <HStack justify="center" spacing={6} mt={10}>
                    {[
                        { icon: Activity, label: 'Diagnostics', color: 'blue.500' },
                        { icon: Wifi, label: 'Connectivity', color: 'green.500' },
                        { icon: Zap, label: 'Performance', color: 'yellow.500' },
                        { icon: Thermometer, label: 'Health Monitor', color: 'red.500' },
                        { icon: Car, label: 'Vehicle Info', color: 'purple.500' }
                    ].map(({ icon: Icon, color, label }, idx) => (
                        <Tooltip key={idx} label={label} hasArrow>
                            <motion.div whileHover={{ y: -3, scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Flex
                                    w={12} h={12} align="center" justify="center" bg="white" borderRadius="xl" color={color} cursor="pointer"
                                    boxShadow="md" border="1px solid" borderColor="gray.50"
                                    _hover={{ bg: color, color: 'white' }} transition="all 0.2s"
                                >
                                    <Icon size={20} />
                                </Flex>
                            </motion.div>
                        </Tooltip>
                    ))}
                </HStack>
            </Box>
        </Box>
    );
};

// Sub-components kept simple
const TempCard = ({ temp, label, interiorTemp = "45" }) => (
    <Box bg="white" p={5} borderRadius="2xl" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm" height="full" position="relative" overflow="hidden">
        <Flex justify="space-between" align="start" mb={4}>
            <VStack align="flex-start" spacing={0}>
                <HStack spacing={2}>
                    <Text fontWeight="800" color="blue.500" fontSize="xs" letterSpacing="0.5px" textTransform="uppercase">{label}</Text>
                    <Thermometer size={14} color="#3182CE" />
                </HStack>
                <Text color="gray.400" fontSize="10px" fontWeight="bold">Interior: {interiorTemp}°C</Text>
            </VStack>
            <Box w={2} h={2} borderRadius="full" bg="blue.500" />
        </Flex>

        <Flex align="center" justify="center" py={2} mb={4}>
            <Text fontSize="6xl" fontWeight="900" color="gray.800" lineHeight="1">{temp}°</Text>
        </Flex>

        <VStack width="full" align="flex-start" spacing={3}>
            <Flex justify="space-between" width="full">
                <Text fontSize="9px" fontWeight="black" color="blue.600" letterSpacing="0.5px">COOLING SYSTEM</Text>
                <Badge variant="subtle" colorScheme="blue" fontSize="8px" px={2} borderRadius="full">NORMAL</Badge>
            </Flex>
            <Box width="full" h="4px" bg="gray.50" borderRadius="full" position="relative" border="1px solid" borderColor="gray.100">
                <Box
                    position="absolute" left={`${Math.min((temp / 100) * 100, 100)}%`} top="-5px"
                    w="14px" h="14px" bg="white" border="3px solid" borderColor="blue.500"
                    borderRadius="full" boxShadow="md" transform="translateX(-50%)"
                />
            </Box>
        </VStack>
    </Box>
);

const PayloadDashboardModal = ({ isOpen, onClose, vinValue = "T434ZTZT155550104" }) => {
    // ... [State init kept same] ...
    const [vin, setVin] = useState(() => localStorage.getItem('last_vin') || vinValue);
    const [signals, setSignals] = useState([
        { name: "Fuel Level", apiName: "FuelLevel", id: "0x356", isChecked: true, data: [], loading: false, error: null },
        { name: "Total Odometer", apiName: "TotalOdometer", id: "0x760", isChecked: true, data: [], loading: false, error: null },
        { name: "Engine Water Temp", apiName: "EngineWaterTemp", id: "0x3E2", isChecked: true, data: [], loading: false, error: null },
        { name: "Engine Speed", apiName: "EngineSpeed", id: "0x3E6", isChecked: true, data: [], loading: false, error: null },
        { name: "Vehicle Speed", apiName: "VehicleSpeed", id: "0x3E8", isChecked: true, data: [], loading: false, error: null },
        { name: "Battery Voltage Level", apiName: "BatteryVoltageLevel", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
        { name: "Ignition Status", apiName: "CmdIgnSts", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
        { name: "External Temperature (F)", apiName: "ExternalTemperatureF", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
        { name: "External Temperature (C)", apiName: "ExternalTemperatureC", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
        { name: "Location", apiName: "Location", id: "location", isChecked: true, data: [], loading: false, error: null, fetchType: 'location' },
        { name: "Alerts", apiName: "Alerts", id: "alerts", isChecked: true, data: [], loading: false, error: null, fetchType: 'alerts' },
        { name: "Remote Commands", apiName: "CommandLog", id: "action", isChecked: true, data: [], loading: false, error: null, fetchType: 'manual' },
    ]);
    const [viewMode, setViewMode] = useState('visual');
    const [isLive, setIsLive] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deviceEvents, setDeviceEvents] = useState(null);
    const [isEventsLoading, setIsEventsLoading] = useState(false);

    // ... [Traxo State & Effects kept same] ...
    const [deviceState, setDeviceState] = useState(null);
    const [ongoingTrip, setOngoingTrip] = useState(null);
    const [tripSummary, setTripSummary] = useState(null);
    const [commandLoading, setCommandLoading] = useState(null);
    const [speedAlert, setSpeedAlert] = useState("");
    const toast = useToast();
    const pollingTimeout = useRef(null);

    // Initial load and VIN change handler
    useEffect(() => {
        if (isOpen) {
            // Save VIN to localStorage whenever it changes
            localStorage.setItem('last_vin', vin);

            // Reset signal data for new VIN to prevent data leakage
            setSignals(prev => prev.map(s => ({ ...s, data: [], loading: false, error: null, hasFetched: false })));
            setDeviceEvents(null);
            setDeviceState(null);
            setOngoingTrip(null);

            // Fetch data for the new VIN
            (async () => {
                await Promise.all([
                    fetchCheckedSignals(),
                    fetchDeviceEvents(),
                    fetchOtherData()
                ]);
                if (isLive) startPolling();
            })();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [isOpen, vin]); // React to VIN changes

    // Handle isLive toggling separately
    useEffect(() => {
        if (isLive && isOpen) {
            startPolling();
        } else {
            stopPolling();
        }
    }, [isLive]);

    const startPolling = () => {
        // Clear any existing timeout to avoid duplicates
        if (pollingTimeout.current) clearTimeout(pollingTimeout.current);

        // Recursive polling function
        const poll = async () => {
            // If stopped or modal closed, don't schedule next
            if (!isLive || !isOpen) return;

            try {
                // Ensure we use the latest VIN from the parent scope's state
                // Note: fetch routines below already use the 'vin' state variable
                await Promise.all([
                    fetchCheckedSignals(),
                    fetchDeviceEvents(),
                    fetchOtherData()
                ]);
            } catch (err) {
                console.warn("Polling error", err);
            }

            // Schedule next poll ONLY after current one finishes
            if (isLive && isOpen) {
                pollingTimeout.current = setTimeout(poll, 5000);
            }
        };

        // Start the cycle
        pollingTimeout.current = setTimeout(poll, 5000);
    };

    const stopPolling = () => {
        if (pollingTimeout.current) {
            clearTimeout(pollingTimeout.current);
            pollingTimeout.current = null;
        }
    };

    const fetchDeviceEvents = async () => {
        const today = new Date().toISOString().split('T')[0];
        try {
            setIsEventsLoading(true);
            const data = await TraxoApi.getEvents(vin, 500, `${today} 00:00:00`, `${today} 23:59:59`);
            setDeviceEvents({ data, lastUpdated: new Date().toLocaleTimeString() });
            setIsEventsLoading(false);
        } catch (error) {
            console.error('Failed to fetch device events', error);
            setIsEventsLoading(false);
        }
    };

    const fetchOtherData = async () => {
        try {
            const stateData = await TraxoApi.getDeviceState(vin);
            if (stateData) setDeviceState(stateData);

            try {
                const tripData = await TraxoApi.getOngoingTrip(vin);
                if (tripData) setOngoingTrip(tripData);
            } catch (tripError) {
                console.warn("Failed to fetch ongoing trip", tripError);
            }
        } catch (error) {
            console.error("Failed to fetch additional data:", error);
        }
    };

    const handleCommand = async (commandName, apiCall, params = []) => {
        setCommandLoading(commandName);
        const timestamp = new Date().toLocaleTimeString();
        try {
            const result = await apiCall(vin, ...params);
            toast({ title: `${commandName} Command Sent`, status: "success", duration: 3000, isClosable: true });

            // Update commands log for console view
            setSignals(prev => prev.map(s => {
                if (s.name === "Remote Commands") {
                    return {
                        ...s,
                        data: [{ command: commandName, status: 'SUCCESS', time: timestamp, ...result }, ...s.data].slice(0, 50)
                    };
                }
                return s;
            }));
        } catch (error) {
            toast({ title: `Failed to send ${commandName}`, description: error.message, status: "error", duration: 3000, isClosable: true });

            setSignals(prev => prev.map(s => {
                if (s.name === "Remote Commands") {
                    return {
                        ...s,
                        data: [{ command: commandName, status: 'FAILED', time: timestamp, error: error.message }, ...s.data].slice(0, 50)
                    };
                }
                return s;
            }));
        } finally {
            setCommandLoading(null);
        }
    };

    const fetchCheckedSignals = async () => {
        const today = new Date().toISOString().split('T')[0];

        // Fetch all in parallel
        const fetchPromises = signals.map(async (signal) => {
            if (!signal.isChecked) return null;

            try {
                let newData;
                if (signal.fetchType === 'events') {
                    newData = await TraxoApi.getEvents(vin, 50, `${today} 00:00:00`, `${today} 23:59:59`);
                } else if (signal.fetchType === 'location') {
                    newData = await TraxoApi.getLocationTelemetry(vin);
                } else if (signal.fetchType === 'alerts') {
                    newData = await TraxoApi.getAlerts(vin);
                } else {
                    newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
                }

                return { name: signal.name, newData };
            } catch (error) {
                console.error(`Failed to fetch ${signal.name}`, error);
                return { name: signal.name, error: error.message || "Fetch failed" };
            }
        });

        const results = await Promise.all(fetchPromises);

        setSignals(prevSignals => {
            return prevSignals.map(signal => {
                const result = results.find(r => r && r.name === signal.name);
                if (!result) return signal;

                const { newData, error } = result;
                if (error) return { ...signal, error, loading: false, hasFetched: true };

                if (newData !== null && newData !== undefined) {
                    const existingData = signal.data || [];
                    const isArray = Array.isArray(newData);
                    const hasData = isArray ? newData.length > 0 : !!newData;

                    let updatedData = existingData;
                    if (hasData) {
                        const lastEntry = existingData[0];
                        const newEntryStr = JSON.stringify(isArray ? newData[0] : newData);
                        const lastEntryStr = JSON.stringify(lastEntry);

                        if (newEntryStr !== lastEntryStr) {
                            if (isArray) {
                                const newItems = newData.filter(newItem =>
                                    !existingData.some(oldItem => JSON.stringify(oldItem) === JSON.stringify(newItem))
                                );
                                updatedData = [...newItems, ...existingData].slice(0, 100);
                            } else {
                                updatedData = [newData, ...existingData].slice(0, 100);
                            }
                        }
                    }

                    return {
                        ...signal,
                        data: updatedData,
                        loading: false,
                        lastUpdated: new Date().toLocaleTimeString(),
                        hasFetched: true,
                        error: null
                    };
                }
                return { ...signal, loading: false };
            });
        });
    };

    const handleRefresh = async () => {
        try {
            await Promise.all([
                fetchCheckedSignals(),
                fetchDeviceEvents(),
                fetchOtherData()
            ]);
            toast({
                title: "Dashboard Refreshed",
                status: "info",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Refresh failed:", error);
            toast({
                title: "Refresh Failed",
                description: "Could not update dashboard data.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // ... [Table and Filter Logic kept same] ...
    const filteredSignals = signals.filter(signal => {
        const term = searchTerm.toLowerCase();
        return (
            signal.name.toLowerCase().includes(term) ||
            (signal.apiName && signal.apiName.toLowerCase().includes(term)) ||
            (signal.id && signal.id.toLowerCase().includes(term))
        );
    });

    const renderDataAsTable = (data, name) => {
        if (!data || data.length === 0) return null;
        const term = searchTerm.toLowerCase();
        const signalMatchesName = name.toLowerCase().includes(term);
        let allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
        const priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp', 'packetStatus', 'messageName'];
        const keys = allKeys.sort((a, b) => {
            const indexA = priorityKeys.indexOf(a);
            const indexB = priorityKeys.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        }).slice(0, 5);
        const filteredRows = signalMatchesName
            ? data.slice(0, 20)
            : data.filter(item => keys.some(key => String(item[key] ?? '').toLowerCase().includes(term))).slice(0, 20);

        if (filteredRows.length === 0) return <Text fontSize="xs" color="gray.500" p={4} textAlign="center">No matching records.</Text>;

        return (
            <TableContainer overflowY="auto" maxH="100%">
                <Table size="sm" variant="simple">
                    <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                        <Tr>{keys.map(key => (
                            <Th key={key} fontSize="8px" color="gray.600" textTransform="uppercase" px={2} py={2} borderBottom="1px solid" borderColor="gray.100" letterSpacing="0.5px">{key}</Th>
                        ))}</Tr>
                    </Thead>
                    <Tbody>
                        {filteredRows.map((item, idx) => (
                            <Tr key={idx} _hover={{ bg: "gray.50" }}>
                                {keys.map(key => (
                                    <Td key={key} fontSize="9px" py={1.5} px={2} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="bold">
                                        {typeof item[key] === 'object' ? JSON.stringify(item[key]) : String(item[key] ?? '')}
                                    </Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bg="#f8faff" borderRadius="none">
                <ModalCloseButton zIndex={10} />
                <ModalBody
                    p={0}
                    bg="gray.50"
                    overflowX="hidden"
                    overflowY="auto"
                    sx={{
                        '&::-webkit-scrollbar': {
                            display: 'none',
                        },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                    }}
                > {/* Removed padding here, handled in inner Box */}

                    {/* Header Strip */}
                    <Box bg="white" borderBottom="1px solid" borderColor="gray.100" px={8} py={3} position="sticky" top={0} zIndex={20} boxShadow="sm">
                        <Flex justify="space-between" align="center">
                            <HStack spacing={6}>
                                <HStack spacing={3}>
                                    <IconButton
                                        icon={<ArrowLeft size={18} />}
                                        aria-label="Back"
                                        variant="ghost"
                                        onClick={onClose}
                                        size="sm"
                                    />
                                    <Heading size="md" color="gray.800" fontWeight="900" letterSpacing="-0.5px">Payload Dashboard</Heading>
                                </HStack>
                                <HStack spacing={1} bg="gray.100" p={1} borderRadius="xl">
                                    <Button size="xs" variant={viewMode === 'visual' ? "solid" : "ghost"} colorScheme={viewMode === 'visual' ? "blue" : "gray"} borderRadius="lg" onClick={() => setViewMode('visual')}>Visual</Button>
                                    <Button size="xs" variant={viewMode === 'table' ? "solid" : "ghost"} colorScheme={viewMode === 'table' ? "blue" : "gray"} borderRadius="lg" onClick={() => setViewMode('table')}>Console</Button>
                                </HStack>
                            </HStack>

                            <HStack spacing={4}>
                                <InputGroup size="sm" w="240px">
                                    <InputLeftElement pointerEvents="none"><Search size={14} color="#A0AEC0" /></InputLeftElement>
                                    <Input placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} borderRadius="lg" color="black" bg="gray.50" border="none" _focus={{ bg: 'white', boxShadow: 'outline' }} />
                                </InputGroup>
                                <HStack spacing={2} align="center">
                                    <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="0.5px">VIN:</Text>
                                    <Input value={vin} onChange={(e) => setVin(e.target.value)} size="sm" w="160px" borderRadius="lg" color="black" fontWeight="bold" fontSize="xs" bg="gray.50" border="none" />
                                </HStack>
                                <HStack spacing={3} bg={isLive ? "green.50" : "gray.100"} px={4} py={1.5} borderRadius="full" border="1px solid" borderColor={isLive ? "green.100" : "gray.200"} cursor="pointer" onClick={() => setIsLive(!isLive)} transition="all 0.2s">
                                    {isLive && (
                                        <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                            <Box w={2} h={2} borderRadius="full" bg="green.500" />
                                        </motion.div>
                                    )}
                                    <Text fontSize="9px" fontWeight="900" color={isLive ? "green.600" : "gray.600"} letterSpacing="1px">
                                        {isLive ? "LIVE SYNC" : "PAUSED"}
                                    </Text>
                                </HStack>
                                <IconButton icon={<RotateCcw size={16} />} aria-label="Refresh" size="sm" variant="ghost" onClick={handleRefresh} borderRadius="full" />
                            </HStack>
                        </Flex>
                    </Box>

                    {/* Main Content Area */}
                    {viewMode === 'visual' ? (
                        <VisualDashboardView signals={signals} deviceState={deviceState} />
                    ) : (
                        <Grid
                            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }}
                            gap={6} p={8} bg="#f8faff" position="relative"
                        >
                            {/* Terminal Grid Background for Console View */}
                            <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundImage="linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)" backgroundSize="40px 40px" pointerEvents="none" />

                            {filteredSignals.map((signal, index) => (
                                <VStack key={index} align="stretch" spacing={2} w="full" position="relative" zIndex={1}>
                                    <HStack justify="space-between" h="30px" px={1}>
                                        <HStack spacing={3}>
                                            <Text fontWeight="800" fontSize="xs" color="gray.700" letterSpacing="0.5px">
                                                {signal.name}
                                            </Text>
                                            <Badge variant="outline" colorScheme="gray" fontSize="8px" fontFamily="monospace" borderRadius="sm">
                                                {signal.id}
                                            </Badge>
                                        </HStack>
                                        {signal.loading && <Spinner size="xs" color="blue.500" />}
                                    </HStack>

                                    <Box
                                        bg="white"
                                        borderRadius="xl"
                                        height="280px"
                                        width="100%"
                                        position="relative"
                                        overflow="hidden"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        boxShadow="sm"
                                    >
                                        <Box p={0} height="100%" overflow="auto">
                                            {signal.error ? (
                                                <Flex align="center" justify="center" h="100%" p={4}>
                                                    <Text color="red.500" fontSize="xs" fontWeight="bold" fontFamily="monospace">
                                                        {`> ERROR: ${signal.error}`}
                                                    </Text>
                                                </Flex>
                                            ) : signal.data && signal.data.length > 0 ? (
                                                renderDataAsTable(signal.data, signal.name)
                                            ) : signal.loading ? (
                                                <Flex align="center" justify="center" h="100%">
                                                    <VStack spacing={2}>
                                                        <Spinner size="sm" color="blue.400" thickness="2px" />
                                                        <Text color="gray.500" fontSize="xs" fontWeight="bold" fontFamily="monospace">
                                                            {`> ESTABLISHING LINK...`}
                                                        </Text>
                                                    </VStack>
                                                </Flex>
                                            ) : (
                                                <Flex align="center" justify="center" h="100%">
                                                    <Text color="gray.400" fontSize="xs" fontWeight="bold" fontFamily="monospace">
                                                        {`> NO DATA PACKETS`}
                                                    </Text>
                                                </Flex>
                                            )}
                                        </Box>
                                        {/* Subtle Grid Effect for Light Mode instead of Scanlines */}
                                        <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundImage="linear-gradient(rgba(0,0,0,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.01) 1px, transparent 1px)" backgroundSize="20px 20px" pointerEvents="none" />
                                    </Box>
                                </VStack>
                            ))}
                        </Grid>
                    )}

                    {/* Device Events Section (Commented out) */}
                    {/* Device Details Card */}
                    {deviceState && (
                        <Box bg="white" p={4} borderRadius="xl" mt={6} border="1px solid" borderColor="gray.100" boxShadow="sm">
                            <Heading size="sm" mb={3} color="gray.700">Device Details</Heading>
                            <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="xs" color="gray.500">VIN</Text>
                                    <Text fontWeight="bold">{deviceState.vinNo || vin}</Text>
                                </VStack>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="xs" color="gray.500">ICCID</Text>
                                    <Text fontWeight="bold">{deviceState.iccid || "N/A"}</Text>
                                </VStack>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="xs" color="gray.500">Model</Text>
                                    <Text fontWeight="bold">{deviceState.car_model || "N/A"}</Text>
                                </VStack>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="xs" color="gray.500">Status</Text>
                                    <Badge colorScheme={deviceState.deviceConnectedState === 'CONNECTED' ? 'green' : 'red'}>
                                        {deviceState.deviceConnectedState || "UNKNOWN"}
                                    </Badge>
                                </VStack>
                            </Grid>
                        </Box>
                    )}

                    {/* Remote Commands & Controls */}
                    <Box mt={6}>
                        {/* Remote Commands */}
                        <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
                            <Heading size="sm" mb={4} color="gray.700">Remote Commands</Heading>
                            <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={3}>
                                <Button
                                    size="sm" colorScheme="blue" variant="outline"
                                    isLoading={commandLoading === "Lock Door"}
                                    onClick={() => handleCommand("Lock Door", TraxoApi.lockDoor)}
                                >
                                    Lock Door
                                </Button>
                                <Button
                                    size="sm" colorScheme="blue" variant="outline"
                                    isLoading={commandLoading === "Unlock Door"}
                                    onClick={() => handleCommand("Unlock Door", TraxoApi.unlockDoor)}
                                >
                                    Unlock Door
                                </Button>
                                <Button
                                    size="sm" colorScheme="orange" variant="outline"
                                    isLoading={commandLoading === "Blinker ON"}
                                    onClick={() => handleCommand("Blinker ON", TraxoApi.blinkerOn)}
                                >
                                    Blinker ON
                                </Button>
                                <Button
                                    size="sm" colorScheme="orange" variant="outline"
                                    isLoading={commandLoading === "Blinker OFF"}
                                    onClick={() => handleCommand("Blinker OFF", TraxoApi.blinkerOff)}
                                >
                                    Blinker OFF
                                </Button>
                                <Button
                                    size="sm" colorScheme="red" variant="outline"
                                    isLoading={commandLoading === "Honk"}
                                    onClick={() => handleCommand("Honk", TraxoApi.honk)}
                                >
                                    Honk
                                </Button>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Trip Information */}
                    {ongoingTrip && (
                        <Box bg="blue.50" p={5} borderRadius="xl" mt={6} border="1px dashed" borderColor="blue.200">
                            <Flex justify="space-between" align="center" mb={3}>
                                <Heading size="sm" color="blue.700">Ongoing Trip</Heading>
                                <Badge colorScheme="blue" variant="solid">LIVE</Badge>
                            </Flex>
                            <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="xs" color="blue.500">Trip ID</Text>
                                    <Text fontWeight="bold" fontSize="sm">{ongoingTrip.tripId || "N/A"}</Text>
                                </VStack>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="xs" color="blue.500">Start Time</Text>
                                    <Text fontWeight="bold" fontSize="sm">{ongoingTrip.startTime || "N/A"}</Text>
                                </VStack>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="xs" color="blue.500">Distance</Text>
                                    <Text fontWeight="bold" fontSize="sm">{ongoingTrip.distance ? `${ongoingTrip.distance} km` : "0 km"}</Text>
                                </VStack>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="xs" color="blue.500">Duration</Text>
                                    <Text fontWeight="bold" fontSize="sm">{ongoingTrip.duration || "0 min"}</Text>
                                </VStack>
                            </Grid>
                        </Box>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal >
    );
};

export default PayloadDashboardModal;
