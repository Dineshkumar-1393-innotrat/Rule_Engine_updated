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
import Vehicle360Viewer from './Vehicle360Viewer';
import { RotateCcw, LayoutDashboard, Wifi, WifiOff, ArrowLeft, Search, Monitor, Eye, Thermometer, Zap, Fuel, Activity, Car, Map, Calendar, Bell, AlertTriangle } from 'lucide-react';
import { TraxoApi } from '../../utils/TraxoApi';
import { motion, AnimatePresence } from 'framer-motion';

// Visual Components for Dashboard
const CircularGauge = ({ value, label, unit, color = "#00E5FF", size = 110, icon: Icon, isError = false }) => {
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
                    borderColor={isError ? "red.100" : "rgba(0, 0, 0, 0.05)"}
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
                        stroke={isError ? "red.50" : "rgba(0, 0, 0, 0.03)"}
                        strokeWidth={strokeWidth}
                    />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="transparent"
                        stroke={isError ? "#E53E3E" : color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: isError ? 0 : circumference - (progress * circumference) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        filter={!isError ? `url(#glow-${label.replace(/\s+/g, '-')})` : "none"}
                    />
                </svg>
                <VStack
                    position="absolute"
                    top="50%" left="50%"
                    transform="translate(-50%, -50%)"
                    spacing={0}
                >
                    {isError ? (
                        <VStack spacing={0}>
                            <AlertTriangle size={24} color="#E53E3E" />
                            <Text fontSize="10px" fontWeight="black" color="red.500">ERR</Text>
                        </VStack>
                    ) : (
                        <>
                            <Text fontSize="lg" fontWeight="900" color="gray.800" letterSpacing="-1px">
                                {value}{unit}
                            </Text>
                            {Icon && <Icon size={14} color={color} opacity={0.8} />}
                        </>
                    )}
                </VStack>
            </Box>
            <Text fontSize="10px" fontWeight="black" color={isError ? "red.400" : "gray.400"} letterSpacing="1px" textTransform="uppercase">
                {label}
            </Text>
        </VStack>
    );
};

const SpeedometerGauge = ({ value, label, secondaryValue, isError = false }) => {
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
    const currentAngle = startAngle + (isError ? 0 : progress * totalAngle);

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
                            <stop offset="0%" stopColor={isError ? "#FEB2B2" : "#00B8D4"} />
                            <stop offset="100%" stopColor={isError ? "#E53E3E" : "#00E5FF"} />
                        </linearGradient>
                    </defs>

                    <path
                        d={drawArc(startAngle, startAngle + totalAngle)}
                        fill="none"
                        stroke={isError ? "rgba(255, 0, 0, 0.05)" : "rgba(0, 0, 0, 0.03)"}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    <motion.path
                        d={drawArc(startAngle, currentAngle)}
                        fill="none"
                        stroke="url(#speed-gradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        filter={!isError ? "url(#speed-glow)" : "none"}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />

                    {[...Array(9)].map((_, i) => {
                        const angle = startAngle + (i * (totalAngle / 8));
                        const p1 = polarToCartesian(center, center, radius + 8, angle);
                        const p2 = polarToCartesian(center, center, radius + 18, angle);
                        const tickVal = i * (maxVal / 8);
                        const isActive = isError ? false : speed >= tickVal;
                        return (
                            <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isActive ? "#00B8D4" : isError ? "rgba(255,0,0,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth="2" />
                        );
                    })}
                </svg>

                <VStack position="absolute" top="55%" left="50%" transform="translate(-50%, -50%)" spacing={-1}>
                    {isError ? (
                        <VStack spacing={1}>
                            <AlertTriangle size={48} color="#E53E3E" />
                            <Text fontSize="xs" fontWeight="black" color="red.500" letterSpacing="1px">SIG ERROR</Text>
                        </VStack>
                    ) : (
                        <>
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
                        </>
                    )}
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



const DeviceEventsList = ({ events }) => {
    // Filter events to only show those from the last 15 seconds
    const recentEvents = (events || []).filter(evt => {
        if (!evt.sourcetimestamp) return false;
        const evtTime = new Date(evt.sourcetimestamp).getTime();
        const now = Date.now();
        return (now - evtTime) < 15000; // 15 seconds window
    }).slice(0, 3); // Then take top 3

    if (recentEvents.length === 0) return null;

    return (
        <Box position="absolute" top={20} right={8} maxW="280px" zIndex={9} pointerEvents="none">
            <VStack spacing={2} align="stretch">
                {recentEvents.map((evt, i) => {
                    let details = {};
                    try { details = JSON.parse(evt.eventdetails || '{}'); } catch (e) { }
                    const type = evt.eventtype || 'Event';
                    const time = evt.sourcetimestamp ? new Date(evt.sourcetimestamp).toLocaleTimeString() : '';

                    return (
                        <motion.div
                            key={evt.eventid || i}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Box bg="whiteAlpha.900" backdropFilter="blur(8px)" p={3} borderRadius="lg" boxShadow="sm" borderLeft="3px solid" borderColor="purple.400" pointerEvents="auto">
                                <HStack justify="space-between" mb={1}>
                                    <Text fontSize="10px" fontWeight="bold" color="purple.600" textTransform="uppercase">{type}</Text>
                                    <Text fontSize="9px" color="gray.400">{time}</Text>
                                </HStack>
                                <Text fontSize="9px" color="gray.600" noOfLines={2} lineHeight="1.2">
                                    {details.status || details.message || "Event Received"}
                                </Text>
                            </Box>
                        </motion.div>
                    );
                })}
            </VStack>
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

    // Prioritize Ignition Status from events if available, otherwise fallback to deviceState
    const ignitionSignal = signals.find(s => s.name === "Ignition Status");
    const hasIgnitionEvent = ignitionSignal && ignitionSignal.data && ignitionSignal.data.length > 0;
    const ignition = hasIgnitionEvent ? getVal("Ignition Status") : (deviceState?.ignition ?? "OFF");

    const odometer = getVal("Total Odometer", 0);

    const locationData = getComplexVal("Location");
    const alertsData = getComplexVal("Alerts");
    const hasEmergency = Array.isArray(alertsData) ? alertsData.length > 0 : !!alertsData;

    const eventsSignal = signals.find(s => s.name === "Device Events");
    const deviceEvents = eventsSignal?.data || [];

    const lat = locationData?.gpsLat || locationData?.latitude || locationData?.Latitude || locationData?.gps_lat;
    const long = locationData?.gpsLong || locationData?.longitude || locationData?.Longitude || locationData?.gps_lng || locationData?.gpsLong;
    const coords = (lat && long)
        ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`
        : "12.9529, 80.2331";

    const getMostRecentTimestamp = () => {
        let mostRecent = null;
        signals.forEach(signal => {
            // Exclude Remote Commands as they use local system time for their 'time' field
            if (signal.name === "Remote Commands") return;

            if (signal.data && signal.data.length > 0) {
                // Check all items in the data array, not just the first one, to be safe (though usually 0 is latest)
                // But typically signal.data is sorted new -> old.
                const latest = signal.data[0];

                // User screenshot shows UPDATEDTIMESTAMP (all caps). Checking all variants.
                const timestamp = latest.updatedTimeStamp ||
                    latest.UPDATEDTIMESTAMP ||
                    latest.updatedtimestamp ||
                    latest.sourcetimestamp ||
                    latest.timestamp ||
                    latest.time;

                if (timestamp) {
                    const date = new Date(timestamp);
                    if (!isNaN(date.getTime())) {
                        if (!mostRecent || date > mostRecent) mostRecent = date;
                    }
                }
            }
        });
        return mostRecent;
    };

    const lastUpdate = getMostRecentTimestamp();
    const formattedDate = lastUpdate
        ? lastUpdate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '--';
    const formattedTime = lastUpdate
        ? lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '--:--';

    const hasAnyError = signals.some(s => s.error);
    const errorSignals = signals.filter(s => s.error).map(s => s.name);

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

            <DeviceEventsList events={deviceEvents} />

            <Box position="relative" zIndex={1}>
                {hasAnyError && (
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} borderRadius="xl" mb={6} boxShadow="sm">
                            <Flex align="center" gap={3}>
                                <AlertTriangle color="#E53E3E" size={18} />
                                <VStack align="flex-start" spacing={0}>
                                    <Text color="red.700" fontWeight="bold" fontSize="xs">DATA SYNC ALERT</Text>
                                    <Text color="red.600" fontSize="10px">
                                        The following signals are currently reporting errors: {errorSignals.join(", ")}
                                    </Text>
                                </VStack>
                            </Flex>
                        </Box>
                    </motion.div>
                )}

                {/* Top Row: Status Toggles */}
                <Grid templateColumns="repeat(2, 1fr)" gap={6} mb={8}>
                    <StatusToggle
                        label="Ignition Status"
                        description="Real-time engine status"
                        isOn={String(ignition).toUpperCase() === 'ON' || String(ignition).toUpperCase() === 'TRUE' || String(ignition).toUpperCase() === 'CONNECTED' || ignition === 1}
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
                                    <Text fontSize="md" fontWeight="900" color="gray.800" letterSpacing="-1px">{coords}</Text>
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
                                                    {/* API Response Snippet */}
                                                    {cmd.apiResponse && (
                                                        <Box mt={1} pt={1} borderTop="1px solid" borderColor="whiteAlpha.300">
                                                            <Text fontSize="7px" fontFamily="monospace" noOfLines={3}>
                                                                {JSON.stringify(cmd.apiResponse).substring(0, 100)}
                                                            </Text>
                                                        </Box>
                                                    )}
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
                            <TempCard temp={engineTemp} label="Engine Temp" interiorTemp={extTemp} isError={isSigError("Engine Water Temp") || isSigError("External Temperature (C)")} />
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
                    <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm" overflow="hidden" position="relative">
                        <Vehicle360Viewer
                            baseUrl="https://imgd.aeplcdn.com/1280x720/cw/360/jeep/1048/5364/closed-door/c2c7cb/"
                            imageCount={60}
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
                    <CircularGauge value={fuel} label="Fuel Level" unit="%" color="#00B8D4" icon={Fuel} isError={isSigError("Fuel Level")} />

                    <CircularGauge
                        value={Math.min(Math.round((engineSpeed / 8000) * 100), 100)}
                        label={`RPM (${engineSpeed})`} unit="" color="#FF9100" icon={Activity}
                        isError={isSigError("Engine Speed")}
                    />

                    <SpeedometerGauge
                        value={vehicleSpeed}
                        secondaryValue={odometer}
                        isError={isSigError("Vehicle Speed") || isSigError("Total Odometer")}
                    />

                    <CircularGauge
                        value={batteryPercent}
                        label={`Battery (${batteryRaw}V)`} unit="%" color="#00C853" icon={Zap}
                        isError={isSigError("Battery Voltage Level")}
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







const TempCard = ({ temp, label, interiorTemp = "45", isError = false }) => (
    <Box bg="white" p={5} borderRadius="2xl" border="1px solid" borderColor={isError ? "red.200" : "rgba(0,0,0,0.06)"} boxShadow="sm" height="full" position="relative" overflow="hidden">
        <Flex justify="space-between" align="start" mb={4}>
            <VStack align="flex-start" spacing={0}>
                <HStack spacing={2}>
                    <Text fontWeight="800" color={isError ? "red.500" : "blue.500"} fontSize="xs" letterSpacing="0.5px" textTransform="uppercase">{label}</Text>
                    <Thermometer size={14} color={isError ? "#E53E3E" : "#3182CE"} />
                </HStack>
                <Text color="gray.400" fontSize="10px" fontWeight="bold">Interior: {interiorTemp}°C</Text>
            </VStack>
            <Box w={2} h={2} borderRadius="full" bg={isError ? "red.500" : "blue.500"} />
        </Flex>

        <Flex align="center" justify="center" py={2} mb={4}>
            {isError ? (
                <VStack spacing={1}>
                    <AlertTriangle size={32} color="#E53E3E" />
                    <Text fontSize="xs" fontWeight="black" color="red.500">DATA ERROR</Text>
                </VStack>
            ) : (
                <Text fontSize="6xl" fontWeight="900" color="gray.800" lineHeight="1">{temp}°</Text>
            )}
        </Flex>

        {!isError && (
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
        )}
        {isError && (
            <VStack width="full" align="flex-start" spacing={1}>
                <Text fontSize="9px" fontWeight="black" color="red.600" letterSpacing="0.5px">SYSTEM FAULT</Text>
                <Badge variant="solid" colorScheme="red" fontSize="8px" px={2} borderRadius="full">OFFLINE</Badge>
            </VStack>
        )}
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
        { name: "Vehicle Speed", apiName: "VehicleSpeed", id: "0x3E8", isChecked: true, data: [], loading: false, error: null, hideInConsole: true },
        { name: "Battery Voltage Level", apiName: "BatteryVoltageLevel", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
        { name: "IGNITION STATUS", apiName: "CmdIgnSts", id: "0x46C", isChecked: true, data: [], loading: false, error: null, fetchType: 'ignition' },
        { name: "External Temperature (F)", apiName: "ExternalTemperatureF", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
        { name: "External Temperature (C)", apiName: "ExternalTemperatureC", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
        { name: "Location", apiName: "Location", id: "location", isChecked: true, data: [], loading: false, error: null, fetchType: 'location' },
        { name: "Alerts", apiName: "Alerts", id: "alerts", isChecked: true, data: [], loading: false, error: null, fetchType: 'alerts' },
        { name: "Device Events", apiName: "DeviceEvents", id: "events", isChecked: true, data: [], loading: false, error: null, fetchType: 'events' },
        { name: "Remote Commands", apiName: "CommandLog", id: "action", isChecked: true, data: [], loading: false, error: null, fetchType: 'manual' },
        { name: "Trip History", apiName: "TripSummary", id: "trips", isChecked: true, data: [], loading: false, error: null, fetchType: 'trips' },
        { name: "Device Logs", apiName: "DeviceLogs", id: "logs", isChecked: true, data: [], loading: false, error: null, fetchType: 'logs' },
        { name: "Jeep Vehicle Status", apiName: "VehicleStatus", id: "vehicleStatus", isChecked: true, data: [], loading: false, error: null, fetchType: 'vehicleStatus' },
    ]);
    const [viewMode, setViewMode] = useState('visual');
    const [isLive, setIsLive] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Authentication state
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [tokenExpiry, setTokenExpiry] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // ... [Traxo State & Effects kept same] ...
    const [deviceState, setDeviceState] = useState(null);
    const [ongoingTrip, setOngoingTrip] = useState(null);
    const [tripSummary, setTripSummary] = useState(null);
    const [commandLoading, setCommandLoading] = useState(null);
    const [speedAlert, setSpeedAlert] = useState("");
    const [fotaVersion, setFotaVersion] = useState("2314.0");
    const [availableVersions, setAvailableVersions] = useState([]);
    const [isFotaUpdating, setIsFotaUpdating] = useState(false);
    const toast = useToast();
    const pollingTimeout = useRef(null);

    // Initial load and VIN change handler
    useEffect(() => {
        if (isOpen) {
            // Save VIN to localStorage whenever it changes
            localStorage.setItem('last_vin', vin);

            // Reset signal data for new VIN to prevent data leakage
            setSignals(prev => prev.map(s => ({ ...s, data: [], loading: false, error: null, hasFetched: false })));

            setDeviceState(null);
            setOngoingTrip(null);

            // Fetch data for the new VIN
            (async () => {
                await Promise.all([
                    fetchCheckedSignals(),
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

            // If no VIN, stop polling (useEffect will restart when VIN changes)
            if (!vin) return;

            try {
                // Ensure we use the latest VIN from the parent scope's state
                // Note: fetch routines below already use the 'vin' state variable
                await Promise.all([
                    fetchCheckedSignals(),
                    fetchOtherData()
                ]);
            } catch (err) {
                console.warn("Polling error", err);
            }

            // Schedule next poll ONLY after current one finishes
            if (isLive && isOpen) {
                pollingTimeout.current = setTimeout(poll, 10000); // Changed from 5000 to 10000 (10 seconds)
            }
        };

        // Start the cycle
        pollingTimeout.current = setTimeout(poll, 10000); // Match the interval
    };

    const stopPolling = () => {
        if (pollingTimeout.current) {
            clearTimeout(pollingTimeout.current);
            pollingTimeout.current = null;
        }
    };

    // Authentication function
    const loginToAPI = async () => {
        setIsAuthenticating(true);
        try {
            const response = await fetch('/api/traxo/authentication/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: "admin",
                    password: "VdP5REwF5VA",
                    accountId: "factorytenant",
                    clientId: "getAv29550cxRVHcHOEUGVEs",
                    clientSecret: "0KiS1VyOuIc0B2qFcTqZTsRv1As"
                })
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status}`);
            }

            const data = await response.json();

            setAccessToken(data.access_token);
            setRefreshToken(data.refresh_token);

            // Calculate token expiry time
            const expiryTime = Date.now() + (data.expires_in * 1000);
            setTokenExpiry(expiryTime);
            setIsAuthenticated(true);

            toast({
                title: 'Authentication Successful',
                description: 'Connected to API',
                status: 'success',
                duration: 3000,
            });

            return data.access_token;
        } catch (error) {
            console.error('Authentication error:', error);
            toast({
                title: 'Authentication Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
            });
            setIsAuthenticated(false);
            return null;
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Check if token needs refresh
    const ensureValidToken = async () => {
        // If no token or token expired, login
        if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry - 60000) {
            return await loginToAPI();
        }
        return accessToken;
    };

    // Fetch location telemetry data with authentication
    const fetchLocationTelemetry = async () => {
        try {
            const token = await ensureValidToken();
            if (!token) {
                throw new Error('No valid authentication token');
            }

            const response = await fetch(
                `/api/traxo/devices/vin/${vin}/states?subcategory=Location:Telemetry`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.status === 401) {
                // Token expired, try to re-authenticate
                setIsAuthenticated(false);
                const newToken = await loginToAPI();
                if (newToken) {
                    // Retry with new token
                    return await fetchLocationTelemetry();
                }
                throw new Error('Authentication failed');
            }

            if (!response.ok) {
                throw new Error(`Location fetch failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Location telemetry error:', error);
            return null;
        }
    };


    const fetchOtherData = async () => {
        if (!vin) {
            console.warn("Skipping fetchOtherData: No VIN available");
            return;
        }

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

    const pollCommandStatus = async (commandName, commandId, isFota = false) => {
        const maxRetries = 20; // 20 * 3s = 60s max polling
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;
            if (attempts > maxRetries) {
                clearInterval(interval);
                return;
            }

            try {
                let statusData;
                let status;

                if (isFota) {
                    statusData = await TraxoApi.getFotaCommandStatus(commandId);
                    // FOTA status logic based on API response structure
                    status = statusData.commandstatus || statusData.status || "Unknown";
                } else {
                    statusData = await TraxoApi.getCommandStatus(vin, commandId);
                    status = statusData.commandStatus || "Unknown";
                }

                // Update specific command in log
                setSignals(prev => prev.map(s => {
                    if (s.name === "Remote Commands") {
                        const newData = s.data.map(cmd =>
                            cmd.commandId === commandId ? { ...cmd, status: status, ...statusData } : cmd
                        );
                        return { ...s, data: newData };
                    }
                    return s;
                }));

                // Stop polling if terminal state
                const terminalStates = isFota
                    ? ["Success", "Timed Out", "Failed", "Cancelled", "Completed", "Error"]
                    : ["Success", "Timed Out", "Failed", "Cancelled"];

                if (terminalStates.includes(status)) {
                    clearInterval(interval);
                    if (status === "Success" || status === "Completed") {
                        toast({ title: `${commandName} Success`, status: "success", duration: 3000 });
                    } else if (status === "Timed Out") {
                        toast({ title: `${commandName} Timed Out`, status: "warning", duration: 3000 });
                    }
                }
            } catch (error) {
                console.warn("Polling status failed", error);
            }
        }, 3000);
    };

    const handleCommand = async (commandName, apiCall, params = []) => {
        setCommandLoading(commandName);
        const timestamp = new Date().toLocaleTimeString();
        try {
            const result = await apiCall(vin, ...params);
            const commandId = result.commandId || result.data?.commandId;

            toast({ title: `${commandName} Sent`, description: "Waiting for device response...", status: "info", duration: 2000, isClosable: true });

            // Update commands log
            setSignals(prev => prev.map(s => {
                if (s.name === "Remote Commands") {
                    const fullResponse = {
                        command: commandName,
                        status: 'PENDING',
                        time: timestamp,
                        commandId: commandId,
                        apiResponse: result // Store full API response
                    };
                    return {
                        ...s,
                        data: [fullResponse, ...s.data].slice(0, 50)
                    };
                }
                return s;
            }));

            if (commandId) {
                pollCommandStatus(commandName, commandId);
            }
        } catch (error) {
            toast({ title: `Failed to send ${commandName}`, description: error.message, status: "error", duration: 3000, isClosable: true });

            setSignals(prev => prev.map(s => {
                if (s.name === "Remote Commands") {
                    return {
                        ...s,
                        data: [{
                            command: commandName,
                            status: 'FAILED',
                            time: timestamp,
                            error: error.message,
                            apiResponse: error.response?.data || { message: error.message } // Store error response
                        }, ...s.data].slice(0, 50)
                    };
                }
                return s;
            }));
        } finally {
            setCommandLoading(null);
        }
    };

    //original code feb16
    // const fetchCheckedSignals = async () => {
    //     const today = new Date().toISOString().split('T')[0];

    //     // Fetch all in parallel
    //     const fetchPromises = signals.map(async (signal) => {
    //         if (!signal.isChecked) return null;

    //         try {
    //             let newData;
    //             if (signal.fetchType === 'events') {
    //                 newData = await TraxoApi.getEvents(vin, 50, `${today} 00:00:00`, `${today} 23:59:59`);
    //             } else if (signal.fetchType === 'ignition') {
    //                 // Fetch last 7 days to ensure we get a status even if car hasn't moved recently
    //                 const sevenDaysAgo = new Date();
    //                 sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    //                 const formattedStart = sevenDaysAgo.toISOString().split('T')[0] + ' 00:00:00';

    //                 const events = await TraxoApi.getEvents(vin, 500, formattedStart);
    //                 console.log("Raw Ignition Events Fetched:", events?.events?.length || 0, events);

    //                 // Filter ignition events correctly
    //                 newData = (events?.events || [])
    //                     .filter(e => {
    //                         // Check various possible event type formats
    //                         const eventType = (e.eventtype || '').toUpperCase();
    //                         return eventType === 'IGNITIONSTATUS' ||
    //                             eventType === 'IGNITION_STATUS' ||
    //                             eventType === 'IGNITION';
    //                     })
    //                     .map(e => {
    //                         let status = 'OFF';
    //                         let rawValue = '';

    //                         try {
    //                             // Parse event details
    //                             const details = typeof e.eventdetails === 'string'
    //                                 ? JSON.parse(e.eventdetails)
    //                                 : e.eventdetails || {};

    //                             // Get the event value from various possible fields
    //                             rawValue = details.eventValue || details.value || details.status || '';

    //                             // Convert to ON/OFF based on common ignition values
    //                             const upperValue = String(rawValue).toUpperCase();
    //                             if (upperValue === 'RUN' ||
    //                                 upperValue === 'START' ||
    //                                 upperValue === 'ON' ||
    //                                 upperValue === 'TRUE' ||
    //                                 upperValue === '1' ||
    //                                 upperValue.includes('RUN') ||
    //                                 upperValue.includes('START')) {
    //                                 status = 'ON';
    //                             }
    //                         } catch (err) {
    //                             console.warn("Failed to parse ignition details", err, e.eventdetails);
    //                         }

    //                         return {
    //                             ...e,
    //                             value: status,
    //                             signalValue: status,
    //                             rawValue: rawValue,
    //                             updatedTimeStamp: e.sourcetimestamp,
    //                             timestamp: e.sourcetimestamp
    //                         };
    //                     });
    //                 console.log("Filtered Ignition Events:", newData);
    //             } else if (signal.fetchType === 'location') {
    //                 // Use location telemetry array for console view
    //                 newData = await TraxoApi.getLocationTelemetryArray(vin);
    //                 console.log("Location Telemetry Data (raw):", newData);
    //                 console.log("Location Telemetry Data type:", typeof newData, "isArray:", Array.isArray(newData));
    //             } else if (signal.fetchType === 'alerts') {
    //                 newData = await TraxoApi.getAlerts(vin);
    //             } else {
    //                 newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
    //             }

    //             const returnData = (newData && newData.events) ? newData.events : newData;
    //             if (signal.fetchType === 'location') {
    //                 console.log("Location return data:", returnData, "length:", returnData?.length);
    //             }
    //             return { name: signal.name, newData: returnData };
    //         } catch (error) {
    //             console.error(`Failed to fetch ${signal.name}`, error);
    //             return { name: signal.name, error: error.message || "Fetch failed" };
    //         }
    //     });

    //     const results = await Promise.all(fetchPromises);

    //     setSignals(prevSignals => {
    //         return prevSignals.map(signal => {
    //             const result = results.find(r => r && r.name === signal.name);
    //             if (!result) return signal;

    //             const { newData, error } = result;
    //             if (error) return { ...signal, error, loading: false, hasFetched: true };

    //             if (newData !== null && newData !== undefined) {
    //                 const existingData = signal.data || [];
    //                 const isArray = Array.isArray(newData);
    //                 const hasData = isArray ? newData.length > 0 : !!newData;

    //                 let updatedData = existingData;
    //                 if (hasData) {
    //                     const lastEntry = existingData[0];
    //                     const newEntryStr = JSON.stringify(isArray ? newData[0] : newData);
    //                     const lastEntryStr = JSON.stringify(lastEntry);

    //                     if (newEntryStr !== lastEntryStr) {
    //                         if (isArray) {
    //                             const newItems = newData.filter(newItem =>
    //                                 !existingData.some(oldItem => JSON.stringify(oldItem) === JSON.stringify(newItem))
    //                             );
    //                             updatedData = [...newItems, ...existingData].slice(0, 100);
    //                         } else {
    //                             updatedData = [newData, ...existingData].slice(0, 100);
    //                         }
    //                     }
    //                 }

    //                 return {
    //                     ...signal,
    //                     data: updatedData,
    //                     loading: false,
    //                     lastUpdated: new Date().toLocaleTimeString(),
    //                     hasFetched: true,
    //                     error: null
    //                 };
    //             }
    //             return { ...signal, loading: false };
    //         });

    //         // Log location signal data after update
    //         const locationSignal = updatedSignals.find(s => s.name === 'Location');
    //         if (locationSignal) {
    //             console.log("Location signal after update:", {
    //                 name: locationSignal.name,
    //                 dataLength: locationSignal.data?.length,
    //                 data: locationSignal.data
    //             });
    //         }
    //         return updatedSignals;
    //     });
    // };


    const fetchCheckedSignals = async () => {
        if (!vin) {
            console.warn("Skipping fetchCheckedSignals: No VIN available");
            return;
        }
        const checkedSignals = signals.filter(s => s.isChecked);
        console.log('🔍 fetchCheckedSignals called. Checked signals:', checkedSignals.map(s => s.name));

        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const formattedStart = sevenDaysAgo.toISOString().split('T')[0] + ' 00:00:00';
        const formattedEnd = today + ' 23:59:59';

        // Fetch all in parallel
        const fetchPromises = signals.map(async (signal) => {
            if (!signal.isChecked) return null;

            // Log when Trip or Logs are about to be fetched
            if (signal.fetchType === 'trips') {
                console.log('🎯 Trip History is CHECKED - Starting fetch...', signal.name);
            }
            if (signal.apiName === 'DeviceLogs') {
                console.log('🎯 Device Logs is CHECKED - Starting fetch...', signal.name);
            }

            try {
                let newData;
                if (signal.fetchType === 'events') {
                    newData = await TraxoApi.getEvents(vin, 50, `${today} 00:00:00`, `${today} 23:59:59`);
                } else if (signal.fetchType === 'ignition') {
                    // Use the new dedicated ignition events function
                    newData = await TraxoApi.getIgnitionEvents(vin, formattedStart, formattedEnd);
                    console.log("Formatted Ignition Events:", newData);
                } else if (signal.fetchType === 'location') {
                    newData = await TraxoApi.getLocationTelemetryArray(vin);
                } else if (signal.fetchType === 'alerts') {
                    newData = await TraxoApi.getAlerts(vin);
                } else if (signal.fetchType === 'trips') {
                    // Fetch last 30 days of trip history
                    console.log('⏳ About to call getTripSummary API...');
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 30);
                    const formatDateTime = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
                    console.log('⏳ Date range:', formatDateTime(startDate), 'to', formatDateTime(endDate));
                    newData = await TraxoApi.getTripSummary(vin, formatDateTime(startDate), formatDateTime(endDate));
                    console.log('✅ getTripSummary returned:', newData);
                } else if (signal.fetchType === 'logs') {
                    // Trigger device log fetch command
                    console.log('📋 Fetching Device Logs...');
                    newData = await TraxoApi.fetchDeviceLogs(vin);
                } else if (signal.fetchType === 'vehicleStatus') {
                    console.log('🚗 Fetching Jeep Vehicle Status...');
                    newData = await TraxoApi.getVehicleStatus(vin);
                } else {
                    newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
                }

                const returnData = (() => {
                    if (!newData) return null;

                    // Special handling for vehicleStatus
                    if (signal.fetchType === 'vehicleStatus') {
                        if (typeof newData === 'object' && !Array.isArray(newData)) {
                            return [newData];
                        }
                        return Array.isArray(newData) ? newData : null;
                    }

                    // Special handling for trips - API might return { trips: [...] } or direct array
                    if (signal.fetchType === 'trips') {
                        // ... same logic for trips ...
                        if (Array.isArray(newData)) return newData;
                        if (newData && newData.trips && Array.isArray(newData.trips)) return newData.trips;
                        if (newData && newData.data && Array.isArray(newData.data)) return newData.data;
                        if (newData && newData.tripSummary && Array.isArray(newData.tripSummary)) return newData.tripSummary;
                        if (typeof newData === 'object' && newData !== null) return [newData];
                        return null;
                    }

                    // Special handling for logs
                    if (signal.fetchType === 'logs') {
                        if (typeof newData === 'object' && !Array.isArray(newData)) {
                            return [{ ...newData, timestamp: new Date().toISOString(), action: 'Fetch Logs Command' }];
                        }
                        return Array.isArray(newData) ? newData : null;
                    }

                    // For other types, keep existing logic
                    let processed = (newData && newData.events) ? newData.events : newData;

                    // Validate telemetry signals - if it's an object but missing signalValue/Value, check if it's "improper"
                    if (signal.fetchType === 'literal' && processed) {
                        const checkBody = Array.isArray(processed) ? processed[0] : processed;
                        if (checkBody && typeof checkBody === 'object' && !checkBody.signalValue && !checkBody.Value && !checkBody.signalUnit) {
                            console.warn(`⚠️ Improper data structure for ${signal.name}:`, checkBody);
                            // We don't throw error here to allow renderDataAsTable to show "IMPROPER FORMAT"
                        }
                    }

                    return processed;
                })();

                if (returnData === null) {
                    return { name: signal.name, error: "Empty response from server" };
                }

                return { name: signal.name, newData: returnData };
            } catch (error) {
                // ... log ...
                console.error(`Failed to fetch ${signal.name}`, error);
                return { name: signal.name, error: error.message || "Network or API Error" };
            }
        });

        const results = await Promise.all(fetchPromises);

        setSignals(prevSignals => {
            const updatedSignals = prevSignals.map(signal => {
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
                        if (isArray) {
                            // For trips and events, handle differently
                            if (signal.fetchType === 'trips') {
                                // For trips, replace entirely on each fetch (don't merge)
                                updatedData = newData.slice(0, 100);
                            } else {
                                // For ignition/events, merge and deduplicate
                                const existingStrings = new Set(existingData.map(d => JSON.stringify(d)));
                                const newUniqueItems = newData.filter(d => !existingStrings.has(JSON.stringify(d)));

                                if (newUniqueItems.length > 0) {
                                    updatedData = [...newUniqueItems, ...existingData].slice(0, 500);
                                }
                            }
                        } else {
                            if (JSON.stringify(newData) !== JSON.stringify(existingData[0])) {
                                updatedData = [newData, ...existingData].slice(0, 100);
                            }
                        }
                    } else if (isArray && (signal.fetchType === 'ignition' || signal.fetchType === 'trips')) {
                        // If ignition or trips got [] back, DO NOT CLEAR existing data.
                        // Just keep what we have to prevent "coming and going" issue
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

            return updatedSignals;
        });
    };

    // const fetchCheckedSignals = async () => {
    //     const today = new Date().toISOString().split('T')[0];

    //     // Fetch all in parallel
    //     const fetchPromises = signals.map(async (signal) => {
    //         if (!signal.isChecked) return null;

    //         try {
    //             let newData;
    //             if (signal.fetchType === 'events') {
    //                 newData = await TraxoApi.getEvents(vin, 50, `${today} 00:00:00`, `${today} 23:59:59`);
    //             } else if (signal.fetchType === 'ignition') {
    //                 // Fetch last 7 days to ensure we get a status even if car hasn't moved recently
    //                 const sevenDaysAgo = new Date();
    //                 sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    //                 const formattedStart = sevenDaysAgo.toISOString().split('T')[0] + ' 00:00:00';

    //                 const events = await TraxoApi.getEvents(vin, 500, formattedStart);

    //                 // FIXED: Filter ignition events correctly
    //                 newData = (events?.events || [])
    //                     .filter(e => {
    //                         // Check various possible event type formats
    //                         const eventType = (e.eventtype || '').toUpperCase();
    //                         return eventType === 'IGNITIONSTATUS' ||
    //                             eventType === 'IGNITION_STATUS' ||
    //                             eventType === 'IGNITION';
    //                     })
    //                     .map(e => {
    //                         let status = 'OFF';
    //                         let rawValue = '';

    //                         try {
    //                             // Parse event details
    //                             const details = typeof e.eventdetails === 'string'
    //                                 ? JSON.parse(e.eventdetails)
    //                                 : e.eventdetails || {};

    //                             // Get the event value from various possible fields
    //                             rawValue = details.eventValue || details.value || details.status || '';

    //                             // Convert to ON/OFF based on common ignition values
    //                             const upperValue = String(rawValue).toUpperCase();
    //                             if (upperValue === 'RUN' ||
    //                                 upperValue === 'START' ||
    //                                 upperValue === 'ON' ||
    //                                 upperValue === 'TRUE' ||
    //                                 upperValue === '1' ||
    //                                 upperValue.includes('RUN') ||
    //                                 upperValue.includes('START')) {
    //                                 status = 'ON';
    //                             }
    //                         } catch (err) {
    //                             console.warn("Failed to parse ignition details", err, e.eventdetails);
    //                         }

    //                         return {
    //                             ...e,
    //                             value: status,
    //                             signalValue: status,
    //                             rawValue: rawValue,
    //                             updatedTimeStamp: e.sourcetimestamp,
    //                             timestamp: e.sourcetimestamp
    //                         };
    //                     });

    //                 console.log("Filtered Ignition Events:", newData);
    //             } else if (signal.fetchType === 'location') {
    //                 newData = await TraxoApi.getLocationTelemetryArray(vin);
    //             } else if (signal.fetchType === 'alerts') {
    //                 newData = await TraxoApi.getAlerts(vin);
    //             } else {
    //                 newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
    //             }

    //             const returnData = (newData && newData.events) ? newData.events : newData;
    //             return { name: signal.name, newData: returnData };
    //         } catch (error) {
    //             console.error(`Failed to fetch ${signal.name}`, error);
    //             return { name: signal.name, error: error.message || "Fetch failed" };
    //         }
    //     });

    //     const results = await Promise.all(fetchPromises);

    //     setSignals(prevSignals => {
    //         const updatedSignals = prevSignals.map(signal => {
    //             const result = results.find(r => r && r.name === signal.name);
    //             if (!result) return signal;

    //             const { newData, error } = result;
    //             if (error) return { ...signal, error, loading: false, hasFetched: true };

    //             if (newData !== null && newData !== undefined) {
    //                 const existingData = signal.data || [];
    //                 const isArray = Array.isArray(newData);
    //                 const hasData = isArray ? newData.length > 0 : !!newData;

    //                 let updatedData = existingData;
    //                 if (hasData) {
    //                     if (isArray) {
    //                         // For ignition, we want to keep all events but ensure latest is first
    //                         const allEvents = [...newData];
    //                         updatedData = allEvents.slice(0, 50); // Keep last 50 events
    //                     } else {
    //                         updatedData = [newData, ...existingData].slice(0, 100);
    //                     }
    //                 }

    //                 return {
    //                     ...signal,
    //                     data: updatedData,
    //                     loading: false,
    //                     lastUpdated: new Date().toLocaleTimeString(),
    //                     hasFetched: true,
    //                     error: null
    //                 };
    //             }
    //             return { ...signal, loading: false };
    //         });

    //         return updatedSignals;
    //     });
    // };

    const handleRefresh = async () => {
        if (!vin) {
            toast({
                title: "Cannot Refresh",
                description: "No Valid VIN selected",
                status: "warning",
                duration: 3000
            });
            return;
        }

        try {
            await Promise.all([
                fetchCheckedSignals(),
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

    // const renderDataAsTable = (data, name) => {
    //     if (!data || data.length === 0) return null;
    //     const term = searchTerm.toLowerCase();
    //     console.log("term----", term);

    //     const signalMatchesName = name.toLowerCase().includes(term);
    //     let allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
    //     const priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp', 'packetStatus', 'messageName'];
    //     const keys = allKeys.sort((a, b) => {
    //         const indexA = priorityKeys.indexOf(a);
    //         const indexB = priorityKeys.indexOf(b);
    //         if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    //         if (indexA !== -1) return -1;
    //         if (indexB !== -1) return 1;
    //         return 0;
    //     }).slice(0, 5);
    //     const filteredRows = signalMatchesName
    //         ? data.slice(0, 20)
    //         : data.filter(item => keys.some(key => String(item[key] ?? '').toLowerCase().includes(term))).slice(0, 20);

    //     if (filteredRows.length === 0) return <Text fontSize="xs" color="gray.500" p={4} textAlign="center">No matching records.</Text>;

    //     return (
    //         <TableContainer overflowY="auto" maxH="100%">
    //             <Table size="sm" variant="simple">
    //                 <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
    //                     <Tr>{keys.map(key => (
    //                         <Th key={key} fontSize="8px" color="gray.600" textTransform="uppercase" px={2} py={2} borderBottom="1px solid" borderColor="gray.100" letterSpacing="0.5px">{key}</Th>
    //                     ))}</Tr>
    //                 </Thead>
    //                 <Tbody>
    //                     {filteredRows.map((item, idx) => (
    //                         <Tr key={idx} _hover={{ bg: "gray.50" }}>
    //                             {keys.map(key => (
    //                                 <Td key={key} fontSize="9px" py={1.5} px={2} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="bold">
    //                                     {typeof item[key] === 'object' ? JSON.stringify(item[key]) : String(item[key] ?? '')}
    //                                 </Td>
    //                             ))}
    //                         </Tr>
    //                     ))}
    //                 </Tbody>
    //             </Table>
    //         </TableContainer>
    //     );
    // };

    // const renderDataAsTable = (data, name, isOdometer = false) => {
    //     if (!data || data.length === 0) return null;
    //     const term = searchTerm.toLowerCase();
    //     const signalMatchesName = name.toLowerCase().includes(term);

    //     let allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));

    //     // Priority keys based on signal type
    //     let priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp', 'packetStatus', 'messageName'];

    //     // Special handling for Ignition Status
    //     if (name === "Ignition Status") {
    //         priorityKeys = ['signalValue', 'sourcetimestamp', 'eventtype', 'eventValue', 'details'];
    //     }
    //     // For Odometer, show only essential columns
    //     else if (isOdometer) {
    //         priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp'];
    //     }

    //     const keys = allKeys.sort((a, b) => {
    //         const indexA = priorityKeys.indexOf(a);
    //         const indexB = priorityKeys.indexOf(b);
    //         if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    //         if (indexA !== -1) return -1;
    //         if (indexB !== -1) return 1;
    //         return 0;
    //     }).slice(0, name === "Ignition Status" ? 5 : (isOdometer ? 4 : 6));

    //     const filteredRows = signalMatchesName
    //         ? data.slice(0, 25)
    //         : data.filter(item => keys.some(key => String(item[key] ?? '').toLowerCase().includes(term))).slice(0, 25);

    //     if (filteredRows.length === 0) {
    //         return (
    //             <Flex align="center" justify="center" h="100%" p={4}>
    //                 <Text fontSize="14px" color="gray.500" textAlign="center">No matching records.</Text>
    //             </Flex>
    //         );
    //     }

    //     // Format the cell value based on the key
    //     const formatCellValue = (item, key) => {
    //         const value = item[key];

    //         // Handle undefined/null
    //         if (value === undefined || value === null) return '';

    //         // Handle objects (like details)
    //         if (typeof value === 'object') {
    //             // For details object, show a summary
    //             if (key === 'details') {
    //                 const details = value;
    //                 return `${details.eventValue || ''} ${details.message || ''}`.trim() || JSON.stringify(value).substring(0, 30);
    //             }
    //             return JSON.stringify(value).substring(0, 30);
    //         }

    //         // Handle timestamps - format nicely
    //         if (key === 'sourcetimestamp' || key === 'updatedTimeStamp' || key === 'timestamp') {
    //             try {
    //                 const date = new Date(value);
    //                 if (!isNaN(date.getTime())) {
    //                     return date.toLocaleString('en-US', {
    //                         month: '2-digit',
    //                         day: '2-digit',
    //                         hour: '2-digit',
    //                         minute: '2-digit',
    //                         second: '2-digit'
    //                     });
    //                 }
    //             } catch (e) {
    //                 return String(value);
    //             }
    //         }

    //         return String(value);
    //     };

    //     return (
    //         <Box width="100%" overflowX="auto">
    //             <Table size="sm" variant="simple" width="100%">
    //                 <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
    //                     <Tr>
    //                         {keys.map(key => (
    //                             <Th
    //                                 key={key}
    //                                 fontSize="14px"
    //                                 color="gray.700"
    //                                 textTransform="uppercase"
    //                                 px={4}
    //                                 py={3}
    //                                 borderBottom="2px solid"
    //                                 borderColor="gray.300"
    //                                 letterSpacing="0.5px"
    //                                 whiteSpace="nowrap"
    //                                 fontWeight="800"
    //                             >
    //                                 {key}
    //                             </Th>
    //                         ))}
    //                     </Tr>
    //                 </Thead>
    //                 <Tbody>
    //                     {filteredRows.map((item, idx) => (
    //                         <Tr key={idx} _hover={{ bg: "gray.50" }}>
    //                             {keys.map(key => {
    //                                 // Add color coding for signalValue in Ignition Status
    //                                 const isIgnitionStatus = name === "Ignition Status" && key === "signalValue";
    //                                 const value = formatCellValue(item, key);

    //                                 return (
    //                                     <Td
    //                                         key={key}
    //                                         fontSize="12px"
    //                                         py={3}
    //                                         px={4}
    //                                         borderBottom="1px solid"
    //                                         borderColor="gray.100"
    //                                         color={isIgnitionStatus && value === 'ON' ? 'green.600' :
    //                                             isIgnitionStatus && value === 'OFF' ? 'gray.600' : 'gray.800'}
    //                                         fontFamily="monospace"
    //                                         fontWeight={isIgnitionStatus ? "700" : "500"}
    //                                         whiteSpace="nowrap"
    //                                         bg={isIgnitionStatus && value === 'ON' ? 'green.50' :
    //                                             isIgnitionStatus && value === 'OFF' ? 'gray.50' : 'transparent'}
    //                                     >
    //                                         {value}
    //                                     </Td>
    //                                 );
    //                             })}
    //                         </Tr>
    //                     ))}
    //                 </Tbody>
    //             </Table>
    //         </Box>
    //     );
    // };



    const handleFotaUpdate = async () => {
        if (!fotaVersion) {
            toast({ title: "Error", description: "Please enter a firmware version", status: "error" });
            return;
        }

        setIsFotaUpdating(true);
        try {
            toast({
                title: "Initiating FOTA Update",
                description: `Version: ${fotaVersion}`,
                status: "info",
                duration: 3000,
                isClosable: true,
            });

            // Optimistic UI update
            const signalIndex = signals.findIndex(s => s.name === "Remote Commands");
            if (signalIndex !== -1) {
                const newCommand = {
                    command: "FOTA Update",
                    status: "PENDING",
                    time: new Date().toLocaleTimeString(),
                    apiResponse: { actionType: "FOTA_DOWNLOAD", version: fotaVersion, status: "PENDING" }
                };

                setSignals(prev => {
                    const newSignals = [...prev];
                    const currentData = newSignals[signalIndex].data || [];
                    newSignals[signalIndex].data = [newCommand, ...currentData];
                    return newSignals;
                });
            }

            const response = await TraxoApi.triggerFotaUpdate(vin, fotaVersion);
            console.log("FOTA Response:", response);

            const commandId = response.commandId || response.fotaId || (response.data && (response.data.commandId || response.data.fotaId));

            // Update with success/pending and start polling
            setSignals(prev => {
                const newSignals = [...prev];
                const signalIdx = newSignals.findIndex(s => s.name === "Remote Commands");
                if (signalIdx !== -1) {
                    const currentData = [...newSignals[signalIdx].data];
                    if (currentData.length > 0) {
                        currentData[0] = {
                            ...currentData[0],
                            status: commandId ? "PENDING" : "SUCCESS",
                            commandId: commandId,
                            apiResponse: response,
                            time: new Date().toLocaleTimeString()
                        };
                        newSignals[signalIdx].data = currentData;
                    }
                }
                return newSignals;
            });

            if (commandId) {
                pollCommandStatus("FOTA Update", commandId, true);
            }

            toast({ title: commandId ? "FOTA Update Initiated" : "FOTA Update Triggered", status: "success", duration: 3000 });

        } catch (error) {
            console.error("FOTA Failed:", error);
            setSignals(prev => {
                const newSignals = [...prev];
                const signalIdx = newSignals.findIndex(s => s.name === "Remote Commands");
                if (signalIdx !== -1) {
                    const currentData = [...newSignals[signalIdx].data];
                    if (currentData.length > 0) {
                        currentData[0] = {
                            ...currentData[0],
                            status: "FAILED",
                            apiResponse: { error: error.message || "Request failed" }
                        };
                        newSignals[signalIdx].data = currentData;
                    }
                }
                return newSignals;
            });
            toast({ title: "FOTA Update Failed", description: error.message, status: "error", duration: 5000 });
        } finally {
            setIsFotaUpdating(false);
        }
    };

    const handleFotaReset = async () => {
        if (!confirm("Are you sure you want to reset the FOTA state for this vehicle? This is usually done to fix 'Request is invalid' errors.")) return;

        try {
            toast({ title: "Resetting FOTA State...", status: "info", duration: 2000 });
            const response = await TraxoApi.resetFotaState(vin);
            console.log("FOTA Reset Response:", response);
            toast({ title: "FOTA State Reset Successful", status: "success", duration: 3000 });

            // Log in table
            const signalIndex = signals.findIndex(s => s.name === "Remote Commands");
            if (signalIndex !== -1) {
                const newCommand = {
                    command: "FOTA Reset",
                    status: "SUCCESS",
                    time: new Date().toLocaleTimeString(),
                    apiResponse: response
                };
                setSignals(prev => {
                    const newSignals = [...prev];
                    const currentData = newSignals[signalIndex].data || [];
                    newSignals[signalIndex].data = [newCommand, ...currentData];
                    return newSignals;
                });
            }

        } catch (error) {
            console.error("FOTA Reset Failed:", error);
            toast({ title: "FOTA Reset Failed", description: error.message, status: "error", duration: 5000 });
        }
    };

    const renderDataAsTable = (data, name, isOdometer = false) => {
        // Validation check for data structure
        if (!data) return (
            <Flex align="center" justify="center" h="100%" p={4}>
                <Text fontSize="12px" color="orange.500" fontWeight="bold">NO DATA RECEIVED</Text>
            </Flex>
        );

        const dataArray = Array.isArray(data) ? data : [data];

        if (dataArray.length === 0) return (
            <Flex align="center" justify="center" h="100%" p={4}>
                <Text fontSize="12px" color="gray.500">NO RECORDS FOUND</Text>
            </Flex>
        );

        const term = searchTerm.toLowerCase();
        const signalMatchesName = name.toLowerCase().includes(term);

        // Special handling for Remote Commands
        if (name === "Remote Commands") {
            const headerKeys = ['Command ID', 'Version', 'Action', 'Status', 'Time', 'Comments'];

            return (
                <Box width="100%" overflowX="auto">
                    <Table size="sm" variant="simple" width="100%">
                        <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                            <Tr>
                                {headerKeys.map(key => (
                                    <Th
                                        key={key}
                                        fontSize="14px"
                                        color="gray.700"
                                        textTransform="uppercase"
                                        px={4}
                                        py={3}
                                        borderBottom="2px solid"
                                        borderColor="gray.300"
                                        letterSpacing="0.5px"
                                        whiteSpace="nowrap"
                                        fontWeight="800"
                                    >
                                        {key}
                                    </Th>
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {dataArray.map((cmd, idx) => {
                                const response = cmd.apiResponse || {};
                                const commandId = response.commandId || cmd.commandId || '-';
                                const actionType = response.actionType || cmd.command || '-';
                                const status = response.commandStatus || cmd.status || '-';
                                const createdTime = response.createdTime
                                    ? new Date(response.createdTime * 1000).toLocaleString()
                                    : (cmd.time || '-');
                                const comments = response.comments || '-';
                                const version = response.version || '1.0';

                                return (
                                    <Tr key={idx} _hover={{ bg: "gray.50" }}>
                                        <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="bold">{commandId}</Td>
                                        <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="500">{version}</Td>
                                        <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="bold">{actionType}</Td>
                                        <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" fontFamily="monospace" fontWeight="700">
                                            <Badge colorScheme={status === 'success' || status === 'accepted' ? 'green' : status === 'pending' || status === 'in progress' ? 'yellow' : 'red'}>
                                                {status.toUpperCase()}
                                            </Badge>
                                        </Td>
                                        <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.600" fontFamily="monospace">{createdTime}</Td>
                                        <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.600" maxW="300px" isTruncated title={comments}>
                                            {comments}
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </Box>
            );
        }

        if (name === "Ignition Status") {
            const ignitionEvents = dataArray || [];

            console.log("🔥 Ignition Events to display:", ignitionEvents);

            if (ignitionEvents.length === 0) {
                return (
                    <Flex align="center" justify="center" h="100%" p={4}>
                        <Text fontSize="14px" color="gray.500" textAlign="center">No ignition events found</Text>
                    </Flex>
                );
            }

            // Get all unique keys from all ignition events
            const allKeys = Array.from(new Set(
                ignitionEvents.flatMap(item => {
                    // Parse eventdetails to get nested keys
                    let details = {};
                    try {
                        details = typeof item.eventdetails === 'string'
                            ? JSON.parse(item.eventdetails)
                            : item.eventdetails || {};
                    } catch (e) { }

                    // Combine top-level keys with details keys (prefixed with 'details.')
                    const topLevelKeys = Object.keys(item).filter(k => k !== 'eventdetails');
                    const detailsKeys = Object.keys(details).map(k => `details.${k}`);

                    return [...topLevelKeys, ...detailsKeys];
                })
            ));

            // Priority keys to show first
            const priorityKeys = [
                'eventtype',
                'sourcetimestamp',
                'details.eventValue',
                'details.ecuCommunicationEventValue',
                'details.eventName',
                'details.timestamp',
                'sourceid',
                'eventid',
                'eventsubcategory',
                'accountId'
            ];

            // Sort keys with priority keys first
            const keys = allKeys.sort((a, b) => {
                const indexA = priorityKeys.indexOf(a);
                const indexB = priorityKeys.indexOf(b);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.localeCompare(b);
            }).slice(0, 10); // Show top 10 columns to avoid overcrowding

            return (
                <Box width="100%" overflowX="auto">
                    <Table size="sm" variant="simple" width="100%">
                        <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                            <Tr>
                                {keys.map(key => (
                                    <Th
                                        key={key}
                                        fontSize="14px"
                                        color="gray.700"
                                        textTransform="uppercase"
                                        px={3}
                                        py={3}
                                        borderBottom="2px solid"
                                        borderColor="gray.300"
                                        letterSpacing="0.5px"
                                        whiteSpace="nowrap"
                                        fontWeight="800"
                                    >
                                        {key.replace('details.', '')}
                                    </Th>
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {ignitionEvents.slice(0, 20).map((item, idx) => {
                                // Parse eventdetails
                                let details = {};
                                try {
                                    details = typeof item.eventdetails === 'string'
                                        ? JSON.parse(item.eventdetails)
                                        : item.eventdetails || {};
                                } catch (e) {
                                    details = {};
                                }

                                return (
                                    <Tr key={item.eventid || idx} _hover={{ bg: "gray.50" }}>
                                        {keys.map(key => {
                                            // Get value based on key path
                                            let value;
                                            if (key.startsWith('details.')) {
                                                const detailKey = key.replace('details.', '');
                                                value = details[detailKey];
                                            } else {
                                                value = item[key];
                                            }

                                            // Format the value for display
                                            let displayValue = value;

                                            // Handle objects
                                            if (typeof displayValue === 'object' && displayValue !== null) {
                                                displayValue = JSON.stringify(displayValue);
                                            }

                                            // Handle timestamps
                                            if (key.includes('timestamp') || key.includes('TimeStamp')) {
                                                try {
                                                    const date = new Date(displayValue);
                                                    if (!isNaN(date.getTime())) {
                                                        displayValue = date.toLocaleString('en-US', {
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        });
                                                    }
                                                } catch (e) { }
                                            }

                                            // Handle eventValue with color coding
                                            const isEventValue = key === 'details.eventValue' || key === 'eventValue';
                                            const isOn = displayValue === 'RUN' || displayValue === 'START';
                                            const isAcc = displayValue === 'ACC';

                                            return (
                                                <Td
                                                    key={key}
                                                    fontSize="12px"
                                                    py={2.5}
                                                    px={3}
                                                    borderBottom="1px solid"
                                                    borderColor="gray.100"
                                                    color={isEventValue && isOn ? 'green.600' :
                                                        isEventValue && isAcc ? 'orange.600' : 'gray.800'}
                                                    fontFamily="monospace"
                                                    fontWeight={isEventValue ? "700" : "500"}
                                                    bg={isEventValue && isOn ? 'green.50' :
                                                        isEventValue && isAcc ? 'orange.50' : 'transparent'}
                                                    whiteSpace="nowrap"
                                                >
                                                    {displayValue !== null && displayValue !== undefined
                                                        ? String(displayValue)
                                                        : '-'}
                                                </Td>
                                            );
                                        })}
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </Box>
            );
        }

        // For other signals, show all data
        // Get all unique keys from all items
        const allKeys = Array.from(new Set(dataArray.flatMap(item => typeof item === 'object' && item !== null ? Object.keys(item) : [])));

        if (allKeys.length === 0 && dataArray.length > 0) {
            return (
                <Flex align="center" justify="center" h="100%" p={4} direction="column">
                    <AlertTriangle size={24} color="#DD6B20" />
                    <Text fontSize="12px" color="orange.600" fontWeight="bold" mt={2}>IMPROPER DATA FORMAT</Text>
                    <Text fontSize="10px" color="gray.500" textAlign="center">Raw: {JSON.stringify(dataArray[0]).substring(0, 50)}...</Text>
                </Flex>
            )
        }

        // Priority keys based on signal type
        let priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp', 'packetStatus', 'messageName'];

        if (isOdometer) {
            priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp'];
        }

        const keys = allKeys.sort((a, b) => {
            const indexA = priorityKeys.indexOf(a);
            const indexB = priorityKeys.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        }).slice(0, 8); // Show up to 8 columns

        const filteredRows = signalMatchesName
            ? dataArray.slice(0, 25)
            : dataArray.filter(item => keys.some(key => String(item[key] ?? '').toLowerCase().includes(term))).slice(0, 25);

        if (filteredRows.length === 0) {
            return (
                <Flex align="center" justify="center" h="100%" p={4}>
                    <Text fontSize="14px" color="gray.500" textAlign="center">No matching records.</Text>
                </Flex>
            );
        }

        return (
            <Box width="100%" overflowX="auto">
                <Table size="sm" variant="simple" width="100%">
                    <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                        <Tr>
                            {keys.map(key => (
                                <Th
                                    key={key}
                                    fontSize="14px"
                                    color="gray.700"
                                    textTransform="uppercase"
                                    px={4}
                                    py={3}
                                    borderBottom="2px solid"
                                    borderColor="gray.300"
                                    letterSpacing="0.5px"
                                    whiteSpace="nowrap"
                                    fontWeight="800"
                                >
                                    {key}
                                </Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredRows.map((item, idx) => (
                            <Tr key={idx} _hover={{ bg: "gray.50" }}>
                                {keys.map(key => {
                                    let value = item[key];

                                    // Format objects
                                    if (typeof value === 'object' && value !== null) {
                                        value = JSON.stringify(value);
                                    }

                                    // Format timestamps
                                    if (key.includes('timestamp') || key.includes('TimeStamp')) {
                                        try {
                                            const date = new Date(value);
                                            if (!isNaN(date.getTime())) {
                                                value = date.toLocaleString('en-US', {
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                });
                                            }
                                        } catch (e) { }
                                    }

                                    return (
                                        <Td
                                            key={key}
                                            fontSize="12px"
                                            py={3}
                                            px={4}
                                            borderBottom="1px solid"
                                            borderColor="gray.100"
                                            color="gray.800"
                                            fontFamily="monospace"
                                            fontWeight="500"
                                            whiteSpace="nowrap"
                                        >
                                            {value !== null && value !== undefined ? String(value) : '-'}
                                        </Td>
                                    );
                                })}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
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



                    {/* duplicate version  */}
                    {viewMode === 'visual' ? (
                        <VisualDashboardView signals={signals} deviceState={deviceState} />
                    ) : (
                        <Box p={8} bg="#f8faff" position="relative" width="100%">
                            <Box position="absolute" top={0} left={0} right={0} bottom={0}
                                backgroundImage="linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)"
                                backgroundSize="40px 40px"
                                pointerEvents="none" />

                            <Grid
                                templateColumns={{
                                    base: "1fr",
                                    md: "repeat(2, 1fr)",
                                    xl: "repeat(2, 1fr)"
                                }}
                                gap={6}
                                width="100%"
                                position="relative"
                                zIndex={1}
                            >
                                {(() => {
                                    const consoleSignals = filteredSignals.filter(s => !s.hideInConsole);
                                    return consoleSignals.map((signal, index) => {
                                        const isOdometer = signal.name === "Total Odometer";

                                        return (
                                            <VStack
                                                key={index}
                                                align="stretch"
                                                spacing={2}
                                                w="full"
                                                maxW={isOdometer ? "450px" : "600px"} // Increased by 50% (300px -> 450px, 400px -> 600px)
                                                justifySelf="center"
                                            >
                                                <HStack justify="space-between" h="35px" px={2}>
                                                    <HStack spacing={3}>
                                                        <Text fontWeight="800" fontSize="14px" color="gray.700" letterSpacing="0.5px">
                                                            {signal.name}
                                                        </Text>
                                                        <Badge variant="outline" colorScheme="gray" fontSize="10px" fontFamily="monospace" borderRadius="sm" px={2} py={0.5}>
                                                            {signal.id}
                                                        </Badge>
                                                    </HStack>
                                                    {signal.loading && <Spinner size="sm" color="blue.500" />}
                                                </HStack>

                                                <Box
                                                    bg="white"
                                                    borderRadius="xl"
                                                    height="350px" // Increased height proportionally
                                                    width="100%"
                                                    position="relative"
                                                    overflow="hidden"
                                                    border="1px solid"
                                                    borderColor={signal.error ? "red.200" : "gray.200"}
                                                    boxShadow="sm"
                                                >
                                                    <Box p={0} height="100%" overflow="auto" width="100%">
                                                        {signal.error ? (
                                                            <Flex align="center" justify="center" h="100%" p={8} width="100%" direction="column" bg="red.50">
                                                                <AlertTriangle size={40} color="#E53E3E" />
                                                                <VStack spacing={2} mt={4}>
                                                                    <Text color="red.700" fontSize="14px" fontWeight="900" fontFamily="monospace" textAlign="center">
                                                                        {`> SIGNAL ERROR DETECTED`}
                                                                    </Text>
                                                                    <Text color="red.600" fontSize="11px" fontWeight="bold" fontFamily="monospace" textAlign="center" maxW="80%">
                                                                        {signal.error}
                                                                    </Text>
                                                                    <Button
                                                                        size="xs"
                                                                        mt={2}
                                                                        colorScheme="red"
                                                                        variant="outline"
                                                                        leftIcon={<RotateCcw size={12} />}
                                                                        onClick={handleRefresh}
                                                                    >
                                                                        RETRY SYNC
                                                                    </Button>
                                                                </VStack>
                                                            </Flex>
                                                        ) : signal.data && signal.data.length > 0 ? (
                                                            <Box width="100%" overflow="auto">
                                                                {renderDataAsTable(signal.data, signal.name, isOdometer)}
                                                            </Box>
                                                        ) : signal.loading ? (
                                                            <Flex align="center" justify="center" h="100%" width="100%">
                                                                <VStack spacing={2}>
                                                                    <Spinner size="md" color="blue.400" thickness="3px" />
                                                                    <Text color="gray.500" fontSize="14px" fontWeight="bold" fontFamily="monospace">
                                                                        {`> ESTABLISHING LINK...`}
                                                                    </Text>
                                                                </VStack>
                                                            </Flex>
                                                        ) : (
                                                            <Flex align="center" justify="center" h="100%" width="100%" direction="column" bg="gray.50">
                                                                <Box opacity={0.3} mb={3}>
                                                                    <Activity size={32} />
                                                                </Box>
                                                                <Text color="gray.400" fontSize="14px" fontWeight="bold" fontFamily="monospace">
                                                                    {`> NO DATA PACKETS`}
                                                                </Text>
                                                                <Text color="gray.400" fontSize="10px" mt={1}>Waiting for next telemetry update...</Text>
                                                            </Flex>
                                                        )}
                                                    </Box>
                                                    <Box position="absolute" top={0} left={0} right={0} bottom={0}
                                                        backgroundImage="linear-gradient(rgba(0,0,0,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.01) 1px, transparent 1px)"
                                                        backgroundSize="20px 20px"
                                                        pointerEvents="none" />
                                                </Box>
                                            </VStack>
                                        );
                                    })
                                })()}
                            </Grid>
                        </Box>
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

                            {/* FOTA Section */}
                            <Box mt={4} pt={4} borderTop="1px dashed" borderColor="gray.200">
                                <Heading size="xs" mb={3} color="gray.600" textTransform="uppercase" letterSpacing="0.5px">Firmware Over-The-Air (FOTA)</Heading>
                                <HStack spacing={3}>
                                    <Input
                                        placeholder="Version (e.g. 2314.0)"
                                        value={fotaVersion}
                                        onChange={(e) => setFotaVersion(e.target.value)}
                                        size="sm"
                                        width="180px"
                                        bg="gray.50"
                                        borderRadius="md"
                                        color="black"
                                    />
                                    <Button
                                        size="sm" colorScheme="purple"
                                        isLoading={isFotaUpdating}
                                        loadingText="Updating..."
                                        onClick={handleFotaUpdate}
                                        leftIcon={<RotateCcw size={14} />}
                                    >
                                        Trigger FOTA Update
                                    </Button>
                                </HStack>
                            </Box>
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
