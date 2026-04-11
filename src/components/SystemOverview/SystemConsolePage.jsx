import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Box,
    Flex,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Card,
    CardHeader,
    CardBody,
    Icon,
    SimpleGrid,
    Input,
    Badge,
    Collapse,
    IconButton,
    useToast,
    Divider,
    Code,
    Tag,
    Select,
    Table,
    Tbody,
    Thead,
    Tr,
    Th,
    Td,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Tooltip,
} from '@chakra-ui/react';
import { 
    Terminal, 
    Play, 
    ChevronDown, 
    ChevronUp, 
    Database, 
    Wifi, 
    Shield, 
    Activity, 
    Cloud, 
    Map, 
    Bell,
    Settings,
    User,
    LogOut,
    Trash2,
    Download,
    UploadCloud,
    ShieldCheck
} from 'lucide-react';
import { TraxoApi } from '../../utils/TraxoApi';

const API_CATEGORIES = [
    {
        id: 'auth',
        name: 'Authentication',
        icon: User,
        color: 'blue.500',
        endpoints: [
            { name: 'Login (PRIMARY)', method: 'POST', handler: () => TraxoApi.login('PRIMARY') },
            { name: 'Login (JEEP)', method: 'POST', handler: () => TraxoApi.login('JEEP') },
            { name: 'Logout', method: 'POST', handler: () => TraxoApi.logout() },
        ]
    },
    {
        id: 'security',
        name: 'Security & Certification',
        icon: ShieldCheck,
        color: 'cyan.500',
        endpoints: [
            { name: 'Login (PKI)', method: 'POST', handler: () => TraxoApi.login('PKI') },
            { name: 'Create Common Certificate', method: 'POST', handler: (vin, params) => TraxoApi.createCommonCertificate(params.commonName || 'CVIP-STLA-JEEP-PingVerification', params.csr || 'MII...') },
            { name: 'Create Tbox Certificate', method: 'POST', handler: (vin, params) => TraxoApi.createTboxCertificate(params.commonName || `${vin}-Tbox`, params.csr || 'MII...') },
        ]
    },
    {
        id: 'remote',
        name: 'Remote Commands',
        icon: Wifi,
        color: 'orange.500',
        endpoints: [
            { name: 'Lock', method: 'POST', handler: (vin) => TraxoApi.lockDoor(vin) },
            { name: 'Unlock', method: 'POST', handler: (vin) => TraxoApi.unlockDoor(vin) },
            { name: 'Honk', method: 'POST', handler: (vin) => TraxoApi.honk(vin) },
            { name: 'Blinker ON', method: 'POST', handler: (vin) => TraxoApi.blinkerOn(vin) },
            { name: 'Blinker OFF', method: 'POST', handler: (vin) => TraxoApi.blinkerOff(vin) },
        ]
    },
    {
        id: 'trips',
        name: 'Trip Management',
        icon: Map,
        color: 'green.500',
        endpoints: [
            { name: 'Ongoing Trip', method: 'GET', handler: (vin) => TraxoApi.getOngoingTrip(vin) },
            { name: 'Trip History (Paginated)', method: 'GET', handler: (vin) => TraxoApi.getTripDetailsWithPagination(vin, 0) },
        ]
    },
    {
        id: 'fota',
        name: 'FOTA Management',
        icon: Cloud,
        color: 'purple.500',
        endpoints: [
            { name: 'Check Uploaded Version', method: 'GET', handler: (vin, params) => TraxoApi.checkUploadedFirmware(params.version || '2314.0') },
            { name: 'Trigger FOTA Trigger (VIN)', method: 'POST', handler: (vin, params) => TraxoApi.triggerFirmwareDownload(vin, params.version || '2314.0') },
            { name: 'Trigger FOTA Execute', method: 'POST', handler: (vin, params) => TraxoApi.triggerFotaUpdate(vin, params.version || '2314.0') },
            { name: 'Check Command Validity', method: 'GET', handler: (vin, params) => TraxoApi.getCommandValidity(params.commandId || '') },
            { name: 'Reset FOTA State', method: 'PUT', handler: (vin) => TraxoApi.resetFotaState(vin) },
            { name: 'Download Firmware File', method: 'GET', handler: (vin, params) => TraxoApi.downloadFirmwareFile(params.category || 'Tbox', params.version || '2314.0'), isBlob: true },
            { name: 'Delete Firmware', method: 'DELETE', handler: (vin, params) => TraxoApi.deleteFirmware(params.category || 'Tbox', params.version || '2314.0') },
        ]
    },
    {
        id: 'lifecycle',
        name: 'Device Lifecycle',
        icon: Settings,
        color: 'red.500',
        endpoints: [
            { name: 'Inittion Command', method: 'POST', handler: (vin) => TraxoApi.updateTboxState(vin, 'AUTHORIZED') },
            { name: 'Portal Device State', method: 'GET', handler: (vin) => TraxoApi.getPortalDeviceState(vin) },
            { name: 'AWS Global Reset', method: 'POST', handler: (vin) => TraxoApi.resetDeviceStateAWS(vin) },
        ]
    },
    {
        id: 'discovery',
        name: 'Inventory & Discovery',
        icon: Database,
        color: 'teal.500',
        endpoints: [
            { name: 'Login (FACTORY)', method: 'POST', handler: () => TraxoApi.login('FACTORY') },
            { name: 'List All Devices', method: 'GET', handler: () => TraxoApi.getDevices() },
            { name: 'Search Portal (Pattern)', method: 'GET', handler: (vin, params) => TraxoApi.portalSearch(params.pattern || vin, 'vin') },
        ]
    },
    {
        id: 'telematics',
        name: 'Telematics & Performance',
        icon: Activity,
        color: 'yellow.500',
        endpoints: [
            { name: 'Vehicle Telemetry (Step 1)', method: 'GET', handler: (vin, params) => TraxoApi.getCanMessages(params.deviceType || 'cc-21') },
            { name: 'Vehicle Telemetry (Step 2)', method: 'GET', handler: (vin, params) => TraxoApi.getCanSignals(params.messageId || 'B6') },
            { name: 'Get Telemetry Data', method: 'GET', handler: (vin, params) => TraxoApi.getVehicleTelemetryData(vin, params.signalName || 'VITV') },
            { name: 'Location Telemetry (RAW)', method: 'GET', handler: (vin) => TraxoApi.getLocationTelemetryArray(vin) },
            { name: 'Set Speed Alert', method: 'POST', handler: (vin, params) => TraxoApi.setSpeedAlert(vin, params.speed || 80) },
        ]
    },
    {
        id: 'audit',
        name: 'Audit & Diagnostic',
        icon: Activity,
        color: 'gray.500',
        endpoints: [
            { name: 'Login (RUN)', method: 'POST', handler: () => TraxoApi.login('RUN') },
            { name: 'Jeep Events Audit', method: 'GET', handler: (vin) => TraxoApi.getJeepEventsAudit(vin) },
            { name: 'Device State Audit', method: 'GET', handler: (vin) => TraxoApi.getDeviceState(vin) },
            { name: 'Command History (JEEP)', method: 'GET', handler: (vin) => TraxoApi.getCommandHistory(vin) },
            { name: 'Alert Ingestion Audit', method: 'GET', handler: (vin) => TraxoApi.getAlertIngestion(vin) },
            { name: 'List Log Files', method: 'GET', handler: (vin) => TraxoApi.listLogFiles(vin) },
            { name: 'Trigger Log Fetch', method: 'POST', handler: (vin) => TraxoApi.fetchDeviceLogs(vin) },
        ]
    }
];

const ResultExplorer = ({ result, epKey, onClear }) => {
    if (!result) return null;

    const { request, response, error, duration } = result;
    const isSuccess = !error && response && response.status < 400;

    return (
        <Box bg="#0f1115" borderRadius="xl" border="1px solid" borderColor="gray.800" overflow="hidden" my={2} shadow="2xl">
            {/* Status Bar */}
            <Flex bg="#1a1d23" p={3} align="center" justify="space-between" borderBottom="1px solid" borderColor="gray.800">
                <HStack spacing={4}>
                    <HStack>
                        <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">STATUS:</Text>
                        <Badge colorScheme={isSuccess ? 'green' : 'red'} variant="solid" fontSize="10px">
                            {response?.status || 'ERROR'} {response?.statusText || (error ? 'FAILED' : '')}
                        </Badge>
                    </HStack>
                    <HStack>
                        <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">TIME:</Text>
                        <Text fontSize="10px" color="green.300" fontWeight="bold">{duration ? `${duration}ms` : '--'}</Text>
                    </HStack>
                    <HStack>
                        <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">SIZE:</Text>
                        <Text fontSize="10px" color="blue.300" fontWeight="bold">
                            {response?.data ? `${(JSON.stringify(response.data).length / 1024).toFixed(2)} KB` : '0 KB'}
                        </Text>
                    </HStack>
                </HStack>
                <IconButton 
                    icon={<Trash2 size={14} />} 
                    size="xs" 
                    colorScheme="red" 
                    variant="ghost" 
                    onClick={onClear}
                    title="Clear Result"
                />
            </Flex>

            <Tabs variant="enclosed" size="sm" colorScheme="blue">
                <TabList px={4} borderBottom="1px solid" borderColor="gray.800" bg="#14171c">
                    <Tab color="gray.400" _selected={{ color: 'white', bg: '#0f1115', borderBottomColor: '#0f1115' }} fontSize="10px" fontWeight="bold">RESPONSE BODY</Tab>
                    <Tab color="gray.400" _selected={{ color: 'white', bg: '#0f1115', borderBottomColor: '#0f1115' }} fontSize="10px" fontWeight="bold">REQUEST DETAILS</Tab>
                    <Tab color="gray.400" _selected={{ color: 'white', bg: '#0f1115', borderBottomColor: '#0f1115' }} fontSize="10px" fontWeight="bold">HEADERS</Tab>
                </TabList>

                <TabPanels>
                    {/* Response Body */}
                    <TabPanel p={0}>
                        <Box p={4} maxH="500px" overflowY="auto" bg="#0f1115">
                            {response?.data ? (
                                <Code display="block" whiteSpace="pre" bg="transparent" color="green.300" fontSize="xs">
                                    {JSON.stringify(response.data, null, 2)}
                                </Code>
                            ) : error ? (
                                <Box p={4} borderRadius="md" bg="red.900" border="1px solid" borderColor="red.500">
                                    <Text color="red.200" fontSize="xs" fontWeight="bold">Execution Error:</Text>
                                    <Text color="red.100" fontSize="xs" mt={1}>{error}</Text>
                                </Box>
                            ) : (
                                <Text color="gray.500" fontSize="xs" fontStyle="italic">No response data available</Text>
                            )}
                        </Box>
                    </TabPanel>

                    {/* Request Details */}
                    <TabPanel p={4}>
                        <VStack align="stretch" spacing={4}>
                            <Box>
                                <Text fontSize="10px" color="gray.500" fontWeight="black" mb={2} letterSpacing="1px">ENDPOINT</Text>
                                <HStack bg="gray.800" p={2} borderRadius="md">
                                    <Badge colorScheme="purple">{request?.method || 'UNKNOWN'}</Badge>
                                    <Text color="white" fontSize="xs" wordBreak="break-all">{request?.url || 'URL Not Captured'}</Text>
                                </HStack>
                            </Box>
                            {request?.data && (
                                <Box>
                                    <Text fontSize="10px" color="gray.500" fontWeight="black" mb={2} letterSpacing="1px">PAYLOAD</Text>
                                    <Code display="block" p={3} borderRadius="md" bg="gray.800" color="orange.200" fontSize="xs" whiteSpace="pre">
                                        {JSON.stringify(request.data, null, 2)}
                                    </Code>
                                </Box>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* Headers */}
                    <TabPanel p={0}>
                        <Table size="sm" variant="simple">
                            <Thead bg="gray.800">
                                <Tr>
                                    <Th color="gray.500" fontSize="9px">TYPE</Th>
                                    <Th color="gray.500" fontSize="9px">HEADER</Th>
                                    <Th color="gray.500" fontSize="9px">VALUE</Th>
                                </Tr>
                            </Thead>
                            <Tbody fontSize="xs">
                                {response?.headers && Object.entries(response.headers).map(([key, value]) => (
                                    <Tr key={key} borderColor="gray.800">
                                        <Td><Badge size="xs" colorScheme="blue">RES</Badge></Td>
                                        <Td color="gray.400" fontWeight="bold">{key}</Td>
                                        <Td color="gray.300" wordBreak="break-all">{String(value)}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

const SystemConsolePage = () => {
    const [globalVin, setGlobalVin] = useState('MCANJREB1MFA65412');
    const [params, setParams] = useState({ 
        version: '2314.0', 
        category: 'Tbox', 
        commandId: '',
        pattern: 'MCANJREB1MFA',
        deviceType: 'cc-21',
        messageId: 'B6',
        signalName: 'VITV',
        speed: '80'
    });
    const [expandedCards, setExpandedCards] = useState(['auth', 'remote', 'fota']);
    const [apiResults, setApiResults] = useState({});
    const [loadingMap, setLoadingMap] = useState({});
    const lastRequestRef = useRef(null);
    const toast = useToast();

    // Setup axios interceptor to capture the the exact request/response made by TraxoApi
    useEffect(() => {
        const reqInterceptor = axios.interceptors.request.use((config) => {
            config.metadata = { startTime: new Date() };
            lastRequestRef.current = {
                method: config.method.toUpperCase(),
                url: config.url,
                data: config.data,
                headers: config.headers
            };
            return config;
        });

        const resInterceptor = axios.interceptors.response.use(
            (response) => {
                const duration = new Date() - response.config.metadata.startTime;
                response.duration = duration;
                return response;
            },
            (error) => {
                if (error.config?.metadata) {
                    error.duration = new Date() - error.config.metadata.startTime;
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(reqInterceptor);
            axios.interceptors.response.eject(resInterceptor);
        };
    }, []);

    const toggleCard = (id) => {
        setExpandedCards(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleExecute = async (category, endpoint) => {
        const key = `${category.id}-${endpoint.name}`;
        setLoadingMap(prev => ({ ...prev, [key]: true }));
        
        // Detailed timing and capture
        const startTime = Date.now();
        
        try {
            console.log(`🚀 Executing ${endpoint.name}...`);
            
            // We need to trigger the login or API call
            // The interceptor will capture the details in lastRequestRef
            const result = await endpoint.handler(globalVin, params);
            const endTime = Date.now();
            
            // If it's a blob, the interceptor caught it but TraxoApi returns the blob data
            // We'll store a mock response for the UI if needed, but usually TraxoApi returns what we need
            
            setApiResults(prev => ({ 
                ...prev, 
                [key]: { 
                    request: lastRequestRef.current,
                    response: {
                        status: 200, // Handle execute usually hits 200 if it doesn't throw
                        statusText: 'OK',
                        data: result,
                        headers: {} // Interceptor might have headers in a real axios object but we'll try to refine
                    },
                    duration: endTime - startTime
                } 
            }));

            if (endpoint.isBlob) {
                const blob = new Blob([result]);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `firmware_${params.version || 'latest'}.bin`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
            
            toast({
                title: 'Execution Success',
                description: endpoint.name,
                status: 'success',
                duration: 2000,
                position: 'bottom-right'
            });
        } catch (error) {
            console.error(`❌ ${endpoint.name} Failed:`, error);
            const endTime = Date.now();
            
            setApiResults(prev => ({ 
                ...prev, 
                [key]: { 
                    request: lastRequestRef.current || { method: endpoint.method, url: 'Unknown' },
                    response: error.response ? {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                        headers: error.response.headers
                    } : null,
                    error: error.message,
                    duration: endTime - startTime
                } 
            }));
            
            toast({
                title: 'Execution Failed',
                description: error.message,
                status: 'error',
                duration: 4000,
                position: 'bottom-right'
            });
        } finally {
            setLoadingMap(prev => ({ ...prev, [key]: false }));
        }
    };

    return (
        <Box p={6} bg="gray.50" minH="100vh">
            {/* Variables Header */}
            <Card mb={8} shadow="lg" borderRadius="2xl" border="1px solid" borderColor="blue.100">
                <CardBody p={5}>
                    <HStack spacing={8} wrap="wrap">
                        <VStack align="flex-start" spacing={1}>
                            <HStack><Icon as={Settings} color="blue.500" /><Text fontWeight="black" fontSize="xs" color="gray.500" letterSpacing="widest">TEST VARIABLES</Text></HStack>
                            <HStack>
                                <Input 
                                    placeholder="Target VIN" 
                                    value={globalVin} 
                                    onChange={(e) => setGlobalVin(e.target.value)}
                                    size="md"
                                    bg="white"
                                    width="240px"
                                    fontWeight="bold"
                                    variant="filled"
                                    _focus={{ borderColor: "blue.500", bg: "white" }}
                                />
                                <Badge colorScheme="blue" variant="subtle">VIN</Badge>
                            </HStack>
                        </VStack>

                        <Divider orientation="vertical" h="40px" />

                        <VStack align="flex-start" spacing={1}>
                            <Text fontWeight="black" fontSize="xs" color="gray.500" letterSpacing="widest">TELEMETRY & SEARCH</Text>
                            <HStack spacing={2} wrap="wrap">
                                <Tooltip label="Search Pattern">
                                    <Input 
                                        placeholder="Pattern" 
                                        value={params.pattern} 
                                        onChange={(e) => setParams({...params, pattern: e.target.value})}
                                        size="xs" bg="white" width="100px"
                                    />
                                </Tooltip>
                                <Tooltip label="Device Type">
                                    <Input 
                                        placeholder="cc-21" 
                                        value={params.deviceType} 
                                        onChange={(e) => setParams({...params, deviceType: e.target.value})}
                                        size="xs" bg="white" width="60px"
                                    />
                                </Tooltip>
                                <Tooltip label="Message ID">
                                    <Input 
                                        placeholder="B6" 
                                        value={params.messageId} 
                                        onChange={(e) => setParams({...params, messageId: e.target.value})}
                                        size="xs" bg="white" width="50px"
                                    />
                                </Tooltip>
                                <Tooltip label="Signal Name">
                                    <Input 
                                        placeholder="VITV" 
                                        value={params.signalName} 
                                        onChange={(e) => setParams({...params, signalName: e.target.value})}
                                        size="xs" bg="white" width="80px"
                                    />
                                </Tooltip>
                                <Tooltip label="Limit/Speed">
                                    <Input 
                                        placeholder="80" 
                                        value={params.speed} 
                                        onChange={(e) => setParams({...params, speed: e.target.value})}
                                        size="xs" bg="white" width="50px"
                                    />
                                </Tooltip>
                            </HStack>
                        </VStack>
                        
                        <Flex flex={1} justify="flex-end">
                            <Tag size="lg" colorScheme="purple" variant="subtle" borderRadius="full">
                                <Icon as={Terminal} mr={2} /> Preprod Environment
                            </Tag>
                        </Flex>
                    </HStack>
                </CardBody>
            </Card>

            <VStack spacing={6} align="stretch">
                {API_CATEGORIES.map((cat) => (
                    <Card key={cat.id} variant="outline" shadow="sm" borderRadius="xl" overflow="hidden">
                        <CardHeader 
                            bg="white" 
                            py={3} 
                            px={5} 
                            cursor="pointer"
                            onClick={() => toggleCard(cat.id)}
                            borderBottom="1px solid"
                            borderColor="gray.100"
                        >
                            <HStack justify="space-between">
                                <HStack spacing={3}>
                                    <Box p={2} bg={`${cat.color.split('.')[0]}.50`} borderRadius="lg">
                                        <Icon as={cat.icon} color={cat.color} boxSize={5} />
                                    </Box>
                                    <VStack align="flex-start" spacing={0}>
                                        <Heading size="sm">{cat.name}</Heading>
                                        <Text fontSize="2xs" color="gray.400" fontWeight="bold">{cat.endpoints.length} Endpoints Integrated</Text>
                                    </VStack>
                                </HStack>
                                <IconButton 
                                    icon={expandedCards.includes(cat.id) ? <ChevronUp /> : <ChevronDown />} 
                                    size="sm" 
                                    variant="ghost"
                                    aria-label="Toggle"
                                />
                            </HStack>
                        </CardHeader>
                        <Collapse in={expandedCards.includes(cat.id)}>
                            <CardBody p={0} bg="white">
                                <Table variant="simple">
                                    <Tbody>
                                        {cat.endpoints.map((ep, idx) => {
                                            const epKey = `${cat.id}-${ep.name}`;
                                            const hasResult = apiResults[epKey];
                                            const isLoading = loadingMap[epKey];
                                            
                                            return (
                                                <React.Fragment key={idx}>
                                                    <Tr _hover={{ bg: "gray.50" }} transition="all 0.2s">
                                                        <Td width="250px">
                                                            <HStack>
                                                                <Badge 
                                                                    colorScheme={
                                                                        ep.method === 'POST' ? 'orange' : 
                                                                        ep.method === 'GET' ? 'blue' : 'red'
                                                                    } 
                                                                    fontSize="9px"
                                                                >
                                                                    {ep.method}
                                                                </Badge>
                                                                <Text fontSize="sm" fontWeight="600">{ep.name}</Text>
                                                            </HStack>
                                                        </Td>
                                                        <Td>
                                                            <Flex align="center" gap={4}>
                                                                <Button 
                                                                    onClick={() => handleExecute(cat, ep)}
                                                                    isLoading={isLoading}
                                                                    loadingText="Executing"
                                                                    leftIcon={<Play size={12} />}
                                                                    size="xs"
                                                                    colorScheme="blue"
                                                                    variant="solid"
                                                                    minW="100px"
                                                                    borderRadius="md"
                                                                >
                                                                    Execute
                                                                </Button>
                                                                {hasResult && (
                                                                    <Badge 
                                                                        colorScheme={hasResult.error ? 'red' : 'green'} 
                                                                        variant="outline"
                                                                        fontSize="9px"
                                                                    >
                                                                        {hasResult.error ? 'FAILED' : 'SUCCESS'}
                                                                    </Badge>
                                                                )}
                                                            </Flex>
                                                        </Td>
                                                    </Tr>
                                                    {hasResult && (
                                                        <Tr bg="gray.900">
                                                            <Td colSpan={2} p={0}>
                                                                <ResultExplorer 
                                                                    result={hasResult} 
                                                                    epKey={epKey} 
                                                                    onClear={() => {
                                                                        const newResults = {...apiResults};
                                                                        delete newResults[epKey];
                                                                        setApiResults(newResults);
                                                                    }} 
                                                                />
                                                            </Td>
                                                        </Tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Collapse>
                    </Card>
                ))}
            </VStack>
            
            <Box h="100px" />
        </Box>
    );
};

export default SystemConsolePage;
