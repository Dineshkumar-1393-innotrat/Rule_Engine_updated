import React, { useState, useMemo } from 'react';
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Card,
    CardHeader,
    CardBody,
    SimpleGrid,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Icon,
    Flex,
    Spacer,
    Stat,
    StatLabel,
    StatNumber,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Code,
    IconButton,
    Tag,
    TagLabel,
    TagRightIcon
} from '@chakra-ui/react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, LineChart, Line, BarChart, Bar 
} from 'recharts';
import { History, Download, Activity, Filter, AlertCircle, FileText, Eye, Info, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { TraxoApi } from '../../utils/TraxoApi';
import { processHistoricalData, prepareExcelData } from '../../utils/dataProcessing';
import { isValidVin, formatVin } from '../../utils/validation';

const toDateTimeLocalValue = (date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};

const parseDateTimeLocal = (value) => {
    if (!value) return null;
    const date = new Date(value.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatForApi = (value) => {
    const date = parseDateTimeLocal(value);
    if (!date) return '';

    const pad = (num) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const isWithinRange = (record, startMs, endMs) => {
    // If timestamp is a numeric string, parse it as a number first
    let tsRaw = record.timestamp;
    if (typeof tsRaw === 'string' && /^\d+$/.test(tsRaw)) {
        tsRaw = Number(tsRaw);
    }
    const timestamp = new Date(tsRaw).getTime();
    const isIn = Number.isFinite(timestamp) && timestamp >= startMs && timestamp <= endMs;
    return isIn;
};

const HistoricalDataPage = () => {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [vin, setVin] = useState('');
    const [startTime, setStartTime] = useState(() => {
        const d = new Date();
        d.setHours(d.getHours() - 24);
        return toDateTimeLocalValue(d);
    });
    const [endTime, setEndTime] = useState(() => toDateTimeLocalValue(new Date()));
    const [isLoading, setIsLoading] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const handleFetchHistory = async () => {
        if (!vin) {
            toast({ title: 'VIN Required', status: 'warning', duration: 2000 });
            return;
        }

        const startDate = parseDateTimeLocal(startTime);
        const endDate = parseDateTimeLocal(endTime);
        if (!startDate || !endDate) {
            toast({ title: 'Invalid Range', description: 'Select both start and end date-times.', status: 'warning', duration: 2500 });
            return;
        }

        if (startDate > endDate) {
            toast({ title: 'Invalid Range', description: 'Start Range must be before End Range.', status: 'warning', duration: 2500 });
            return;
        }

        setIsLoading(true);
        setHistoryData([]); // Clear previous data to show loading state
        try {
            const start = formatForApi(startTime);
            const end = formatForApi(endTime);

            // Fetch from multiple sources + BASELINE STATE to seed starting values
            console.log(`🔍 Fetching baseline snapshot and historical telemetry for ${vin}`);
            
            const [
                baselineResp, 
                eventsResp, 
                locResp, 
                vehResp, 
                vehRespCaps, 
                statResp, 
                engResp, 
                genResp,
                stdResp,
                tripResp,
                diagResp,
                tripStartResp,
                tripCurrentResp,
                tripEndResp
            ] = await Promise.allSettled([
                TraxoApi.getDeviceState(vin), // Seed Baseline
                TraxoApi.getJeepEventsAudit(vin, start, end, 500),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'LocationTelemetry'),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'vehicleTelemetry'),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'VehicleTelemetry'),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'StatusTelemetry'),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'EngineTelemetry'),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'GenericTelemetry'),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'StandardTelemetry'),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'TripTelemetry'),
                TraxoApi.getHistoricalTelemetry(vin, start, end, 500, 'DiagnosticTelemetry'),
                TraxoApi.getTripStates(vin, start, end, 500, 'tripStart'),
                TraxoApi.getTripStates(vin, start, end, 500, 'tripCurrent'),
                TraxoApi.getTripStates(vin, start, end, 500, 'tripEnd')

            ]);

            // 1. Extract Seed Values (Deep search in payload/data wrappers)
            const getSeed = (obj, keys, fallback = 0) => {
                const extractValue = (v) => {
                    if (v === undefined || v === null || v === '') return undefined;
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') {
                        const parsed = parseFloat(v);
                        return isNaN(parsed) ? v : parsed;
                    }
                    if (typeof v === 'object') {
                        const inner = v.value ?? v.val ?? v.signalValue ?? v.signal_value ?? v.eventValue;
                        return extractValue(inner);
                    }
                    return v;
                };

                const search = (target) => {
                    if (!target || typeof target !== 'object') return undefined;
                    const targetKeys = Object.keys(target);
                    const lowKeys = keys.map(k => k.toLowerCase().replace(/[\s_]/g, ''));
                    for (const tk of targetKeys) {
                        if (lowKeys.includes(tk.toLowerCase().replace(/[\s_]/g, ''))) {
                            const val = extractValue(target[tk]);
                            if (val !== undefined && val !== null && val !== '') return val;
                        }
                    }
                    return undefined;
                };
                const raw = baselineResp.status === 'fulfilled' ? baselineResp.value : {};
                // Search in common wrappers
                const found = search(raw) || 
                       search(raw.payload) || 
                       search(raw.data) || 
                       search(raw.vehicleStatus) || 
                       search(raw.result);
                
                return found !== undefined ? found : fallback;
            };

            const initialState = {
                fuel: Number(getSeed({}, ['fuelPercentage', 'fuelLevel', 'FuelLevel', 'fuel', 'fuel_level', 'fuel_level_pct', 'fuel_consumed', 'fuelConsumed'])),
                odometer: Number(getSeed({}, ['odometer', 'totalOdometer', 'TotalOdometer', 'total_odometer', 'odo', 'odm', 'tripDistance', 'km_total', 'distance'])),
                rpm: Number(getSeed({}, ['engineSpeed', 'EngineSpeed', 'rpm', 'EngineRPM', 'engineRpm', 'engine_rpm', 'engine_speed'])),
                battery: Number(getSeed({}, ['batteryVoltage', 'BatteryVoltage', 'voltage', 'batt_volt', 'battery', 'vbat', 'BatteryVoltageLevel', 'battery_voltage'])),
                coolant: Number(getSeed({}, ['coolant', 'engineTemp', 'coolant_temp', 'engineWaterTemp', 'EngineWaterTemp', 'coolant_temp'])),
                ignition: getSeed({}, ['ignitionStatus', 'ignition_status', 'ign_stat', 'engineState', 'engine_state', 'CmdIgnSts'], 'N/A')
            };


            console.log('Seeding Historical Data with Baseline:', initialState);

            // 2. Aggregate Results
            const events = eventsResp.status === 'fulfilled' ? (eventsResp.value.events || []) : [];
            const locData = locResp.status === 'fulfilled' ? (locResp.value || []) : [];
            const vehData = vehResp.status === 'fulfilled' ? (vehResp.value || []) : [];
            const vehDataCaps = vehRespCaps.status === 'fulfilled' ? (vehRespCaps.value || []) : [];
            const statData = statResp.status === 'fulfilled' ? (statResp.value || []) : [];
            const engData = engResp.status === 'fulfilled' ? (engResp.value || []) : [];
            const genData = genResp.status === 'fulfilled' ? (genResp.value || []) : [];
            const stdData = stdResp.status === 'fulfilled' ? (stdResp.value || []) : [];
            const tripData = tripResp.status === 'fulfilled' ? (tripResp.value || []) : [];
            const diagData = diagResp.status === 'fulfilled' ? (diagResp.value || []) : [];
            const tripStartData = tripStartResp.status === 'fulfilled' ? (tripStartResp.value || []) : [];
            const tripCurrentData = tripCurrentResp.status === 'fulfilled' ? (tripCurrentResp.value || []) : [];
            const tripEndData = tripEndResp.status === 'fulfilled' ? (tripEndResp.value || []) : [];

            // Merge all data streams
            const combined = [
                ...events, ...locData, ...vehData, ...vehDataCaps, 
                ...statData, ...engData, ...genData, ...stdData, 
                ...tripData, ...diagData, ...tripStartData, ...tripCurrentData, ...tripEndData
            ];
            
            if (combined.length === 0) {
                toast({ title: 'No Data Found', description: 'No records found for this VIN and range.', status: 'info' });
                return;
            }

            const startMs = startDate.getTime();
            const endMs = endDate.getTime();
            
            console.log(`⏱️ Filtering Range: ${startDate.toISOString()} (${startMs}) to ${endDate.toISOString()} (${endMs})`);
            
            const processed = processHistoricalData(combined, initialState)
                .filter((record) => {
                    const inRange = isWithinRange(record, startMs, endMs);
                    if (!inRange) {
                        // Log a few out-of-range records for debugging
                        // console.log(`🚫 Record out of range: ${record.displayTime} (${record.timestamp})`);
                    }
                    return inRange;
                });

            console.log(`✅ Filter complete. ${processed.length} records in range.`);

            if (processed.length === 0) {
                toast({
                    title: 'No Data In Selected Range',
                    description: `Fetched ${combined.length} records, but none were between ${startDate.toLocaleString()} and ${endDate.toLocaleString()}.`,
                    status: 'info',
                    duration: 5000
                });
                setHistoryData([]);
                return;
            }

            setHistoryData(processed);
            
            toast({ 
                title: 'Data Loaded', 
                description: `Showing ${processed.length} in-range records from ${combined.length} fetched records.`, 
                status: 'success' 
            });
        } catch (error) {
            console.error("History Fetch Error:", error);
            toast({ title: 'Fetch Failed', description: error.message, status: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewRaw = (record) => {
        setSelectedRecord(record);
        onOpen();
    };

    const handleExportExcel = () => {
        if (historyData.length === 0) return;
        const excelData = prepareExcelData(historyData);
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle History");
        XLSX.writeFile(workbook, `Vehicle_History_${vin}_${new Date().toLocaleDateString()}.xlsx`);
    };

    const stats = useMemo(() => {
        if (historyData.length === 0) return null;
        const speeds = historyData.map(d => d.speed);
        return {
            avgSpeed: (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1),
            maxSpeed: Math.max(...speeds),
            totalEvents: historyData.length,
            alerts: historyData.filter(d => d.eventType.includes('ALERT') || d.eventType.includes('FAULT')).length
        };
    }, [historyData]);

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Flex align="center">
                    <Box>
                        <Heading size="lg" mb={2}>Historical Analysis</Heading>
                        <Text color="gray.500">Analyze exact API responses and telemetry details</Text>
                    </Box>
                    <Spacer />
                    <Button 
                        leftIcon={<Download size={18} />} 
                        colorScheme="blue" 
                        variant="ghost"
                        onClick={handleExportExcel}
                        isDisabled={historyData.length === 0}
                    >
                        Export XLSX
                    </Button>
                </Flex>

                <Card variant="outline" borderRadius="xl" shadow="sm">
                    <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} align="flex-end">
                            <FormControl isInvalid={vin.length > 0 && !isValidVin(vin)}>
                                <FormLabel fontSize="xs" fontWeight="800">Vehicle VIN</FormLabel>
                                <Input 
                                    value={vin} 
                                    onChange={(e) => setVin(formatVin(e.target.value))} 
                                    bg="gray.50" 
                                    maxLength={17}
                                    borderColor={vin.length > 0 && !isValidVin(vin) ? "red.400" : "gray.200"}
                                />
                                {vin.length > 0 && !isValidVin(vin) && (
                                    <Text fontSize="10px" color="red.500" mt={1}>Must be 17 characters ({vin.length}/17)</Text>
                                )}
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="800">Start Range</FormLabel>
                                <Input type="datetime-local" value={startTime} max={endTime} onChange={(e) => setStartTime(e.target.value)} bg="gray.50" />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="800">End Range</FormLabel>
                                <Input type="datetime-local" value={endTime} min={startTime} onChange={(e) => setEndTime(e.target.value)} bg="gray.50" />
                            </FormControl>
                            <Button 
                                leftIcon={isLoading ? <Spinner size="sm" /> : <Search size={18} />} 
                                colorScheme="blue" 
                                onClick={handleFetchHistory}
                                isLoading={isLoading}
                                isDisabled={!isValidVin(vin)}
                            >
                                Analyze Exacts
                            </Button>
                        </SimpleGrid>
                    </CardBody>
                </Card>

                {historyData.length > 0 && stats && (
                    <>
                        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                            <StatCard label="Avg Speed" value={`${stats.avgSpeed} km/h`} icon={Activity} color="blue.500" />
                            <StatCard label="Peak Speed" value={`${stats.maxSpeed} km/h`} icon={Activity} color="orange.500" />
                            <StatCard label="Audit Records" value={stats.totalEvents} icon={FileText} color="purple.500" />
                            <StatCard label="Alerts Found" value={stats.alerts} icon={AlertCircle} color="red.500" />
                        </SimpleGrid>

                        <Tabs isFitted variant="unstyled">
                            <TabList bg="gray.100" p={1} borderRadius="xl">
                                <Tab _selected={{ bg: 'white', shadow: 'sm', borderRadius: 'lg' }} fontSize="sm" fontWeight="bold">Charts View</Tab>
                                <Tab _selected={{ bg: 'white', shadow: 'sm', borderRadius: 'lg' }} fontSize="sm" fontWeight="bold">Exact Responses (Table)</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel px={0} py={6}>
                                    <VStack spacing={6} align="stretch">
                                        <Card variant="outline" borderRadius="xl">
                                            <CardBody>
                                                <Box height="400px" width="100%">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={historyData}>
                                                            <defs>
                                                                <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#3182ce" stopOpacity={0.1}/>
                                                                    <stop offset="95%" stopColor="#3182ce" stopOpacity={0}/>
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                            <XAxis dataKey="chartTime" fontSize={10} axisLine={false} tickLine={false} />
                                                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                            <RechartsTooltip 
                                                                labelFormatter={(label, payload) => payload?.[0]?.payload?.displayTime || label}
                                                                formatter={(value, name) => [value, name === 'Speed' ? 'Speed (km/h)' : 'RPM']}
                                                            />
                                                            <Area type="monotone" dataKey="speed" stroke="#3182ce" strokeWidth={3} fillOpacity={1} fill="url(#colorSpeed)" name="Speed" />
                                                            <Area type="monotone" dataKey="rpm" stroke="#805ad5" strokeWidth={2} fillOpacity={0} name="RPM" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </Box>
                                            </CardBody>
                                        </Card>
                                    </VStack>
                                </TabPanel>

                                <TabPanel px={0} py={6}>
                                    <Box overflowX="auto" overflowY="auto" maxH="600px" borderRadius="xl" shadow="sm">
                                        <Table variant="simple" size="sm" bg="white">
                                            <Thead bg="gray.50" position="sticky" top={0} zIndex={1} shadow="sm">
                                                <Tr>
                                                    <Th>Timestamp</Th>
                                                    <Th>Type</Th>
                                                    <Th>Ignition</Th>
                                                    <Th>Speed</Th>
                                                    <Th>RPM</Th>
                                                    <Th>Fuel</Th>
                                                    <Th>Odometer</Th>
                                                    <Th>Temp</Th>
                                                    <Th>Location</Th>
                                                    <Th>Raw Response</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {[...historyData].reverse().map((row, i) => (
                                                    <Tr key={i} _hover={{ bg: 'gray.50' }}>
                                                        <Td fontSize="xs" whiteSpace="nowrap">{row.displayTime}</Td>
                                                        <Td>
                                                            <Badge colorScheme={row.eventType.includes('ALERT') ? 'red' : 'blue'} fontSize="10px">{row.eventType}</Badge>
                                                        </Td>
                                                        <Td>
                                                            <Badge fontSize="10px" colorScheme={['RUN', 'ON', 'START', 'TRUE', '1'].includes(row.ignition) ? 'green' : 'gray'}>
                                                                {row.ignition}
                                                            </Badge>
                                                        </Td>
                                                        <Td fontSize="xs" fontWeight="bold">{row.speed} km/h</Td>
                                                        <Td fontSize="xs">{row.rpm}</Td>
                                                        <Td fontSize="xs">{row.fuel}%</Td>
                                                        <Td fontSize="xs" whiteSpace="nowrap">{(row.odometer ?? 0).toLocaleString()} km</Td>
                                                        <Td fontSize="xs">{row.coolant}°C</Td>
                                                        <Td fontSize="xs" whiteSpace="nowrap" color="blue.500" cursor="pointer" onClick={() => window.open(`https://maps.google.com/?q=${row.location}`, '_blank')}>
                                                            {row.location}
                                                        </Td>
                                                        <Td>
                                                            <Button size="xs" leftIcon={<Eye size={12} />} onClick={() => handleViewRaw(row.raw)}>
                                                                Inspect
                                                            </Button>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </>
                )}
            </VStack>

            {/* RAW RESPONSE MODAL */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent borderRadius="xl">
                    <ModalHeader borderBottomWidth="1px">
                        <HStack>
                            <History size={18} />
                            <Text>Exact API Response Payload</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={6}>
                        <VStack align="stretch" spacing={4}>
                            <Tag size="lg" colorScheme="blue" borderRadius="full">
                                <TagLabel>Raw Backend Record</TagLabel>
                                <TagRightIcon as={Info} />
                            </Tag>
                            <Box bg="gray.900" p={4} borderRadius="lg" overflow="auto" maxH="500px">
                                <Code colorScheme="white" variant="unstyled" whiteSpace="pre" fontSize="xs" color="green.300">
                                    {selectedRecord ? JSON.stringify(selectedRecord, null, 4) : 'No record selected'}
                                </Code>
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter borderTopWidth="1px">
                        <Button colorScheme="blue" onClick={onClose}>Close Insight</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

const StatCard = ({ label, value, icon, color }) => (
    <Card variant="outline" borderRadius="xl" shadow="sm" borderLeftWidth="4px" borderLeftColor={color}>
        <CardBody>
            <Flex align="center">
                <Box>
                    <Text fontSize="xs" fontWeight="800" color="gray.400" textTransform="uppercase" mb={1}>{label}</Text>
                    <Heading size="md">{value}</Heading>
                </Box>
                <Spacer />
                <Box p={2} bg="gray.50" borderRadius="lg">
                    <Icon as={icon} color={color} size={24} />
                </Box>
            </Flex>
        </CardBody>
    </Card>
);

export default HistoricalDataPage;
