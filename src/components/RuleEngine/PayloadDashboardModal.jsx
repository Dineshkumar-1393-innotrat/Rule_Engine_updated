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
    Badge
} from '@chakra-ui/react';
import { RotateCcw, LayoutDashboard, Wifi, WifiOff } from 'lucide-react';
import { TraxoApi } from '../../utils/TraxoApi';

const PayloadDashboardModal = ({ isOpen, onClose, vinValue = "T123ZTZT396798869" }) => {
    const [vin, setVin] = useState(vinValue);
    const [signals, setSignals] = useState([
        { name: "Fuel Level", apiName: "FuelLevel", id: "0x356", isChecked: false, data: null, loading: false, error: null },
        { name: "Total Odometer", apiName: "TotalOdometer", id: "0x760", isChecked: false, data: null, loading: false, error: null },
        { name: "Engine Water Temp", apiName: "EngineWaterTemp", id: "0x3E2", isChecked: false, data: null, loading: false, error: null },
        { name: "Engine Speed", apiName: "EngineSpeed", id: "0x3E6", isChecked: false, data: null, loading: false, error: null },
        { name: "Battery Voltage Level", apiName: "BatteryVoltageLevel", id: "0x46C", isChecked: false, data: null, loading: false, error: null },
        { name: "Ignition Status", apiName: "CmdIgnSts", id: "0x46C", isChecked: false, data: null, loading: false, error: null, fetchType: 'events' },
        { name: "External Temperature (F)", apiName: "ExternalTemperatureF", id: "0x46C", isChecked: false, data: null, loading: false, error: null },
    ]);
    const [isLive, setIsLive] = useState(false);
    const [deviceEvents, setDeviceEvents] = useState(null);
    const [isEventsLoading, setIsEventsLoading] = useState(false);
    const pollingInterval = useRef(null);

    useEffect(() => {
        if (isOpen && isLive) {
            startPolling();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [isOpen, isLive, signals]);

    const startPolling = () => {
        if (pollingInterval.current) return;
        pollingInterval.current = setInterval(() => {
            fetchCheckedSignals();
            fetchDeviceEvents();
        }, 5000); // Poll every 5 seconds
    };

    const stopPolling = () => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    };

    const fetchDeviceEvents = async () => {
        const today = new Date().toISOString().split('T')[0];
        try {
            setIsEventsLoading(true);
            const data = await TraxoApi.getEvents(vin, 500, `${today} 00:00:00`, `${today} 23:59:59`);
            setDeviceEvents({
                data,
                lastUpdated: new Date().toLocaleTimeString()
            });
            setIsEventsLoading(false);
        } catch (error) {
            console.error('Failed to fetch device events', error);
            setIsEventsLoading(false);
        }
    };

    const fetchCheckedSignals = async () => {
        const updatedSignals = [...signals];
        let hasChanges = false;
        const today = new Date().toISOString().split('T')[0];

        for (let i = 0; i < updatedSignals.length; i++) {
            if (updatedSignals[i].isChecked) {
                try {
                    updatedSignals[i].loading = true;
                    updatedSignals[i].error = null;

                    let data;
                    if (updatedSignals[i].fetchType === 'events') {
                        data = await TraxoApi.getEvents(vin, 500, `${today} 00:00:00`, `${today} 23:59:59`);
                    } else {
                        data = await TraxoApi.getVehicleTelemetry(vin, updatedSignals[i].apiName);
                    }

                    updatedSignals[i].data = data;
                    updatedSignals[i].lastUpdated = new Date().toLocaleTimeString();
                    updatedSignals[i].loading = false;
                    hasChanges = true;
                } catch (error) {
                    console.error(`Failed to fetch ${updatedSignals[i].name}`, error);
                    updatedSignals[i].error = error.message || "Fetch failed";
                    updatedSignals[i].loading = false;
                    hasChanges = true;
                }
            }
        }

        if (hasChanges) {
            setSignals([...updatedSignals]);
        }
    };

    const handleCheckboxChange = (index) => {
        const newSignals = [...signals];
        newSignals[index].isChecked = !newSignals[index].isChecked;
        if (newSignals[index].isChecked) {
            // Fetch immediately on check
            fetchSingleSignal(index);
        } else {
            newSignals[index].data = null;
            newSignals[index].error = null;
        }
        setSignals(newSignals);
    };

    const fetchSingleSignal = async (index) => {
        const newSignals = [...signals];
        const today = new Date().toISOString().split('T')[0];
        try {
            newSignals[index].loading = true;
            newSignals[index].error = null;
            setSignals([...newSignals]);

            let data;
            if (newSignals[index].fetchType === 'events') {
                data = await TraxoApi.getEvents(vin, 500, `${today} 00:00:00`, `${today} 23:59:59`);
            } else {
                data = await TraxoApi.getVehicleTelemetry(vin, newSignals[index].apiName);
            }

            newSignals[index].data = data;
            newSignals[index].lastUpdated = new Date().toLocaleTimeString();
            newSignals[index].loading = false;
            setSignals([...newSignals]);
        } catch (error) {
            newSignals[index].error = error.message || "Fetch failed";
            newSignals[index].loading = false;
            setSignals([...newSignals]);
        }
    };

    const handleRefresh = () => {
        const clearedSignals = signals.map(s => ({ ...s, isChecked: false, data: null, error: null }));
        setSignals(clearedSignals);
        setIsLive(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bg="#e6efff" borderRadius="none">
                <ModalCloseButton />
                <ModalBody p={8}>
                    {/* Header */}
                    <Flex mb={8} align="center">
                        <VStack align="flex-start" spacing={1}>
                            <Heading size="lg" color="black">Rule Engine Dashboard</Heading>
                            <HStack spacing={4} mt={4}>
                                <Text fontWeight="bold">VIN</Text>
                                <Input
                                    value={vin}
                                    onChange={(e) => setVin(e.target.value)}
                                    bg="white"
                                    color="black"
                                    size="sm"
                                    width="250px"
                                    placeholder="Enter VIN"
                                />
                                <Button
                                    size="sm"
                                    colorScheme={isLive ? "green" : "gray"}
                                    leftIcon={isLive ? <Wifi size={16} /> : <WifiOff size={16} />}
                                    onClick={() => setIsLive(!isLive)}
                                >
                                    {isLive ? "Live Sync ON" : "Live Sync OFF"}
                                </Button>
                            </HStack>
                        </VStack>
                        <Spacer />
                        <Button
                            leftIcon={<RotateCcw size={16} />}
                            variant="link"
                            color="blue.500"
                            onClick={handleRefresh}
                        >
                            Reset All
                        </Button>
                    </Flex>

                    {/* Grid of Cards */}
                    <Grid
                        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                        gap={6}
                    >
                        {signals.map((signal, index) => (
                            <VStack key={index} align="stretch" spacing={3} w="full">
                                <HStack justify="space-between" h="40px">
                                    <HStack spacing={3}>
                                        <Checkbox
                                            isChecked={signal.isChecked}
                                            onChange={() => handleCheckboxChange(index)}
                                            colorScheme="blue"
                                            size="lg"
                                            borderColor="gray.400"
                                            _checked={{ borderColor: 'blue.500' }}
                                        />
                                        <VStack align="flex-start" spacing={0}>
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800" isTruncated maxW="150px">
                                                {signal.name}
                                            </Text>
                                            <Text fontSize="xs" fontWeight="bold" color="gray.600">
                                                {signal.id}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                    <VStack align="flex-end" spacing={1}>
                                        {signal.loading ? (
                                            <Spinner size="xs" color="blue.500" />
                                        ) : (
                                            signal.lastUpdated && (
                                                <VStack align="flex-end" spacing={0}>
                                                    <Text fontSize="9px" color="gray.500" lineHeight="1">Last update:</Text>
                                                    <Text fontSize="9px" color="gray.500" lineHeight="1">{signal.lastUpdated}</Text>
                                                </VStack>
                                            )
                                        )}
                                        {signal.data && !signal.loading && (
                                            <Badge colorScheme="green" variant="subtle" fontSize="9px" borderRadius="full" px={2}>
                                                UPDATED
                                            </Badge>
                                        )}
                                    </VStack>
                                </HStack>

                                <Box
                                    bg="black"
                                    borderRadius="lg"
                                    p={0}
                                    height="280px"
                                    width="100%"
                                    position="relative"
                                    overflow="hidden"
                                    border="2px solid"
                                    borderColor={signal.isChecked ? (signal.loading ? "blue.400" : "gray.800") : "gray.200"}
                                    transition="all 0.2s"
                                    boxShadow={signal.isChecked ? "md" : "none"}
                                >
                                    {signal.isChecked ? (
                                        <Box
                                            p={4}
                                            height="100%"
                                            overflow="auto"
                                            sx={{
                                                '&::-webkit-scrollbar': { width: '4px' },
                                                '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '4px' }
                                            }}
                                        >
                                            <pre style={{
                                                color: signal.error ? '#ff4d4d' : '#00ff00',
                                                fontSize: '11px',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all',
                                                fontFamily: 'monospace'
                                            }}>
                                                {signal.error
                                                    ? `// Error: ${signal.error}`
                                                    : signal.data
                                                        ? JSON.stringify(signal.data, null, 2)
                                                        : "// Awaiting live data..."
                                                }
                                            </pre>
                                        </Box>
                                    ) : (
                                        <Flex
                                            height="100%"
                                            align="center"
                                            justify="center"
                                            bg="gray.50"
                                            backgroundSize="20px 20px"
                                            backgroundImage="radial-gradient(circle, #E2E8F0 1px, transparent 1px)"
                                        >
                                            <VStack spacing={2} opacity={0.4}>
                                                <LayoutDashboard size={24} color="#718096" />
                                                <Text color="gray.600" fontSize="xs" textAlign="center" fontWeight="medium">
                                                    Select to sync live data
                                                </Text>
                                            </VStack>
                                        </Flex>
                                    )}
                                </Box>
                            </VStack>
                        ))}
                    </Grid>
                    {/* Device Events Section */}
                    <Box mt={12} borderTop="1px solid" borderColor="gray.300" pt={8}>
                        <Flex align="center" mb={4}>
                            <HStack>
                                <LayoutDashboard size={20} />
                                <VStack align="flex-start" spacing={0}>
                                    <Heading size="md" color="black">Device Events (DEVICE)</Heading>
                                    {deviceEvents?.lastUpdated && <Text fontSize="xs" color="gray.600">Last sync: {deviceEvents.lastUpdated}</Text>}
                                </VStack>
                            </HStack>
                            <Spacer />
                            <HStack>
                                {isEventsLoading && <Spinner size="sm" color="blue.500" />}
                                <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={fetchDeviceEvents}
                                    isDisabled={isEventsLoading}
                                >
                                    Force Fetch Events
                                </Button>
                            </HStack>
                        </Flex>
                        <Box
                            bg="black"
                            borderRadius="md"
                            p={4}
                            height="400px"
                            overflow="auto"
                            border="1px solid"
                            borderColor="gray.700"
                            sx={{
                                '&::-webkit-scrollbar': { width: '4px' },
                                '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '4px' }
                            }}
                        >
                            <pre style={{ color: '#00ccff', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                                {deviceEvents?.data
                                    ? JSON.stringify(deviceEvents.data, null, 2)
                                    : "// Click toggle 'Live Sync ON' or 'Force Fetch' to see events for today..."
                                }
                            </pre>
                        </Box>
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PayloadDashboardModal;
