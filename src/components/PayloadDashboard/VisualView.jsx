import React from 'react';
import { Box, Grid, Flex, VStack, HStack, Text, Badge, Tooltip, SimpleGrid, Spacer, Center } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Bell, Activity, Map, Fuel, Thermometer, Wifi, Car, LayoutDashboard, AlertTriangle, Navigation } from 'lucide-react';
import { CircularGauge, SpeedometerGauge, TempCard } from './GaugeComponents';
import { StatusToggle } from './StatusToggle';
import { DeviceEventsList } from './DeviceEventsList';
import { Sparkline } from './SignalCard';
import Vehicle360Viewer from '../RuleEngine/Vehicle360Viewer';

export const VisualView = ({ signals, deviceState, highestSpeed }) => {
    // Jeep Vehicle Status data (exact field names from API response)
    const vsData = signals.find(s => s.name === 'Jeep Vehicle Status')?.data?.[0];

    const getVal = (name, defaultValue = 0) => {
        const signal = signals.find(s => s.name === name);
        if (signal && signal.data && signal.data.length > 0) {
            const latest = signal.data[0];
            const result = latest.signalValue ?? latest.Event ?? latest.value ?? latest.signalData ?? latest.data;
            if (result !== undefined && result !== null && result !== '') {
                if (name === "Battery Voltage Level") return parseFloat(result) || 0;
                return result;
            }
        }
        
        // Fallback: Jeep Vehicle Status API
        if (vsData) {
            if (name === 'Fuel Level') {
                const v = parseFloat(vsData.fuelPercentage ?? vsData.fuelLevelPct ?? vsData.fuelLevel);
                if (!isNaN(v) && v > 0) return v;
            }
            if (name === 'Vehicle Speed') {
                const v = parseFloat(vsData.speed ?? vsData.vehicleSpeed);
                if (!isNaN(v)) return v;
            }
            if (name === 'Engine Water Temp') {
                const v = parseFloat(vsData.coolant ?? vsData.engineWaterTemp ?? vsData.engineCoolantTemp);
                if (!isNaN(v) && v > 0) return v;
            }
            if (name === 'Battery Voltage Level') {
                const v = parseFloat(vsData.battery ?? vsData.batteryVoltage);
                if (!isNaN(v) && v > 0) return v;
            }
            if (name === 'Total Odometer') {
                const v = parseFloat(vsData.odometer ?? vsData.totalOdometer);
                if (!isNaN(v) && v > 0) return v;
            }
            if (name === 'Engine Speed') {
                const v = parseFloat(vsData.engineRpm ?? vsData.engineSpeed);
                if (!isNaN(v) && v >= 0) return v;
            }
            if (name === 'External Temperature (C)') {
                const v = parseFloat(vsData.ambientTemp ?? vsData.externalTemp ?? vsData.outsideTemp);
                if (!isNaN(v)) return v;
            }
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
    const odometer = getVal("Total Odometer", 0);

    const ignitionSignal = signals.find(s => s.name === "Ignition Status");
    // Prioritize Ignition Status from events if available, otherwise fallback to vehicleStatus API or deviceState
    const ignition = (ignitionSignal && ignitionSignal.data && ignitionSignal.data.length > 0) 
        ? getVal("Ignition Status") 
        : (vsData?.ignitionStatus ?? deviceState?.ignition ?? "OFF");

    const locationData = getComplexVal("Location");
    const alertsData = getComplexVal("Alerts");
    const hasEmergency = Array.isArray(alertsData) ? alertsData.length > 0 : !!alertsData;

    const eventsSignal = signals.find(s => s.name === "Device Events");
    const deviceEvents = eventsSignal?.data || [];
    const speedHistory = signals.find(s => s.name === 'Vehicle Speed')?.data || [];

    const lat = locationData?.gpsLat || locationData?.latitude || locationData?.Latitude || vsData?.gpsLat;
    const long = locationData?.gpsLong || locationData?.longitude || locationData?.Longitude || vsData?.gpsLong;
    const coords = (lat && long)
        ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`
        : "12.9529, 80.2331";

    const getMostRecentTimestamp = () => {
        let mostRecent = null;
        signals.forEach(signal => {
            if (signal.name === "Remote Commands") return;
            if (signal.data && signal.data.length > 0) {
                const latest = signal.data[0];
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

    const ignOn = ['ON', 'TRUE', 'CONNECTED', '1', 'RUN', 'START'].includes(String(ignition).toUpperCase());

    const ignitionDisplay = (() => {
        const val = String(ignition || '').toUpperCase();
        if (val === 'IGN_LK') return 'PARKED';
        if (val === 'RUN') return 'DRIVING';
        if (val === 'START') return 'START';
        return val || 'OFF';
    })();

    const isSimulated = signals.some(s => s.data?.[0]?.isSimulated) || deviceState?.isSimulated;

    return (
        <Box w="full" bg="#f8faff" p={{ base: 4, md: 8 }} borderRadius="none" position="relative" overflow="hidden">
            {isSimulated && (
                <Box position="absolute" top={2} left={0} right={0} textAlign="center" zIndex={10}>
                    <Badge colorScheme="purple" variant="solid" fontSize="10px" px={4} py={1} borderRadius="full" boxShadow="lg">
                        SIMULATED DEVICE DATA
                    </Badge>
                </Box>
            )}
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
                <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={6} mb={8}>
                    <StatusToggle
                        label="Ignition Status"
                        description="Engine power state"
                        isOn={ignOn}
                        icon={Zap}
                        isError={isSigError("Ignition Status")}
                        color="blue"
                    />
                    <StatusToggle
                        label="Device Connection"
                        description={deviceState?.deviceConnectedState || 'OFFLINE'}
                        isOn={deviceState?.deviceConnectedState === 'CONNECTED'}
                        icon={Wifi}
                        color="green"
                        isSimulated={deviceState?.isSimulated}
                    />
                    <StatusToggle
                        label="Trip Active"
                        description="Ongoing trip status"
                        isOn={ignOn}
                        icon={Navigation}
                        color="purple"
                        statusText={ignitionDisplay}
                    />
                </Grid>

                {/* Middle Grid Layout */}
                <Grid 
                    templateColumns={{ base: "1fr", lg: "1.2fr 0.8fr 1.5fr" }} 
                    gap={6} 
                    mb={8} 
                    h={{ base: "auto", lg: "420px" }}
                >
                    {/* Left: Map Card */}
                    <Box 
                        h={{ base: "300px", lg: "full" }}
                        bg="white" 
                        borderRadius="2xl" 
                        overflow="hidden" 
                        position="relative" 
                        border="1px solid" 
                        borderColor="rgba(0,0,0,0.06)" 
                        boxShadow="sm"
                    >
                        {lat && long ? (
                            <iframe
                                width="100%" height="100%" style={{ border: 0 }} title="Location Map"
                                src={`https://maps.google.com/maps?q=${lat},${long}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            />
                        ) : (
                            <Flex bg="gray.50" h="full" align="center" justify="center" direction="column">
                                <Map size={40} color="#CBD5E0" />
                                <Text mt={3} color="gray.400" fontWeight="bold" fontSize="xs">AWAITING GPS SIGNAL...</Text>
                            </Flex>
                        )}
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
                                                    bg={cmd.status === 'SUCCESS' ? "green.500" : cmd.status === 'PENDING' ? "orange.400" : "red.500"}
                                                    color="white" p={2} borderRadius="lg" boxShadow="md"
                                                    border="1px solid" borderColor="whiteAlpha.400"
                                                >
                                                    <HStack justify="space-between">
                                                        <Text fontSize="9px" fontWeight="black">{(cmd.command || 'Unknown').toUpperCase()}</Text>
                                                        <Activity size={10} color="white" />
                                                    </HStack>
                                                    <Text fontSize="8px" fontWeight="bold" opacity={0.9}>{cmd.time}</Text>
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

                    {/* Center Column */}
                    <VStack spacing={6} h="full">
                        {/* Jeep Status Info Card */}
                        {vsData && (
                            <Box w="full" bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor="blue.100" boxShadow="sm">
                                <HStack spacing={2} mb={3}>
                                    <Car size={14} color="#3B6FE8" />
                                    <Text fontWeight="800" color="gray.700" fontSize="xs">JEEP V-STATUS</Text>
                                    <Spacer />
                                    <Badge colorScheme={ignOn ? 'green' : 'orange'} variant="solid" fontSize="8px">
                                        {vsData.ignitionStatus || 'OFF'}
                                    </Badge>
                                </HStack>
                                <SimpleGrid columns={2} spacing={2}>
                                    <Box p={2} bg="blue.50" borderRadius="lg">
                                        <Text fontSize="8px" color="gray.400" fontWeight="black">FUEL</Text>
                                        <Text fontSize="14px" fontWeight="900" color="blue.700">{vsData.fuelPercentage ?? vsData.fuelLevelPct ?? '--'}%</Text>
                                    </Box>
                                    <Box p={2} bg="green.50" borderRadius="lg">
                                        <Text fontSize="8px" color="gray.400" fontWeight="black">BATTERY</Text>
                                        <Text fontSize="14px" fontWeight="900" color="green.700">{vsData.battery ?? vsData.batteryVoltage ?? '--'}V</Text>
                                    </Box>
                                    <Box p={2} bg="orange.50" borderRadius="lg">
                                        <Text fontSize="8px" color="gray.400" fontWeight="black">COOLANT</Text>
                                        <Text fontSize="14px" fontWeight="900" color="orange.700">{vsData.coolant ?? vsData.engineWaterTemp ?? '--'}°C</Text>
                                    </Box>
                                    <Box p={2} bg="purple.50" borderRadius="lg">
                                        <Text fontSize="8px" color="gray.400" fontWeight="black">ODOMETER</Text>
                                        <Text fontSize="14px" fontWeight="900" color="purple.700">{(vsData.odometer ?? vsData.totalOdometer ?? 0).toLocaleString()} km</Text>
                                    </Box>
                                </SimpleGrid>
                            </Box>
                        )}

                        <Box flex={1} w="full" minH={{ base: "180px", lg: "auto" }} bg="white" p={5} borderRadius="2xl" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm" display="flex" flexDirection="column" justifyContent="center">
                            <Box textAlign="center" py={2}>
                                <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="900" color="gray.800" letterSpacing="-1px">{formattedTime}</Text>
                                {speedHistory.length > 1 && (
                                    <Box mt={2}>
                                        <Text fontSize="8px" color="gray.400" fontWeight="black" letterSpacing="1px" mb={1}>SPEED TREND</Text>
                                        <Center>
                                            <Sparkline data={speedHistory} color="#3182CE" width={120} height={30} />
                                        </Center>
                                    </Box>
                                )}
                            </Box>
                            <Text fontSize="9px" color="gray.400" textAlign="center" fontWeight="black" letterSpacing="1px">LAST UPDATED</Text>
                        </Box>
                    </VStack>

                    {/* Right: Car Visualization */}
                    <Box 
                        h={{ base: "300px", lg: "full" }}
                        bg="#ebebeb" 
                        borderRadius="2xl" 
                        border="1px solid" 
                        borderColor="rgba(0,0,0,0.06)" 
                        boxShadow="sm" 
                        overflow="hidden" 
                        position="relative"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Vehicle360Viewer
                            baseUrl="https://imgd.aeplcdn.com/1280x720/cw/360/jeep/1048/5364/closed-door/c2c7cb/"
                            imageCount={60}
                        />
                    </Box>
                </Grid>

            </Box>
        </Box>
    );
};
