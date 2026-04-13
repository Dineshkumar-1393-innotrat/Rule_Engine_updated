

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
    Textarea,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    InputGroup,
    InputLeftElement,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    StatGroup,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Wrap,
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
    ShieldCheck,
    Clock,
    HelpCircle,
    Info,
    CheckCircle2,
    Search,
    FileJson,
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
            { 
                name: 'Create Common Certificate', 
                method: 'POST', 
                handler: (vin, p) => TraxoApi.createCommonCertificate(p.commonName, p.csr),
                params: ['commonName', 'csr']
            },
            { 
                name: 'Create Tbox Certificate', 
                method: 'POST', 
                handler: (vin, p) => TraxoApi.createTboxCertificate(p.commonName, p.csr),
                params: ['commonName', 'csr']
            },
        ]
    },
    {
        id: 'mobility',
        name: 'Mobility & Trip Analysis',
        icon: Activity,
        color: 'cyan.500',
        endpoints: [
            { name: 'Ongoing Trip', method: 'GET', handler: (vin) => TraxoApi.getOngoingTrip(vin) },
            { 
                name: 'Trip Summary', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getTripSummary(vin, p.startTime, p.endTime),
                params: ['startTime', 'endTime']
            },
            { 
                name: 'Trip Details (Paginated)', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getTripDetailsPaginated(vin, p.pageNo),
                params: ['pageNo']
            },
            { 
                name: 'Trip by ID', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getTripById(vin, p.tripId),
                params: ['tripId']
            },
            { 
                name: 'Trip Audit (States)', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getTripAudit(vin), 
            },
        ]
    },
    {
        id: 'bulk',
        name: 'Bulk Provisioning',
        icon: UploadCloud,
        color: 'pink.500',
        endpoints: [
            { name: 'Login (BULK)', method: 'POST', handler: () => TraxoApi.login('BULK') },
            { 
                name: 'Bulk IMEI Upload', 
                method: 'POST', 
                handler: (vin, p) => TraxoApi.bulkImeiUpload(p.file),
                params: ['file'],
                isFile: true
            },
            { 
                name: 'Bulk Supplier Feed', 
                method: 'POST', 
                handler: (vin, p) => TraxoApi.bulkSupplierFeed(p.file),
                params: ['file'],
                isFile: true
            },
            { 
                name: 'Bulk IMEI Upload (Editor)', 
                method: 'POST', 
                handler: (vin, p) => {
                    const blob = new Blob([p.imeiCsvContent], { type: 'text/csv' });
                    const file = new File([blob], 'imei.csv', { type: 'text/csv' });
                    return TraxoApi.bulkImeiUpload(file);
                },
                params: ['imeiCsvContent'],
                isJSON: true
            },
            { 
                name: 'Bulk Supplier Feed (Editor)', 
                method: 'POST', 
                handler: (vin, p) => {
                    const blob = new Blob([p.tboxCsvContent], { type: 'text/csv' });
                    const file = new File([blob], 'Tbox.csv', { type: 'text/csv' });
                    return TraxoApi.bulkSupplierFeed(file);
                },
                params: ['tboxCsvContent'],
                isJSON: true
            },
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
            { name: 'Honk', method: 'POST', handler: (vin) => TraxoApi.remoteHonk(vin) },
            { name: 'Blinker ON', method: 'POST', handler: (vin) => TraxoApi.remoteBlinkerControl(vin, 'ON') },
            { name: 'Blinker OFF', method: 'POST', handler: (vin) => TraxoApi.remoteBlinkerControl(vin, 'OFF') },
        ]
    },
    {
        id: 'trips',
        name: 'Trip Management',
        icon: Map,
        color: 'green.500',
        endpoints: [
            { name: 'Ongoing Trip', method: 'GET', handler: (vin) => TraxoApi.getOngoingTrip(vin) },
            { 
                name: 'Trip History (Paginated)', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getTripDetailsWithPagination(vin, p.pageIndex),
                params: ['pageIndex']
            },
        ]
    },
    {
        id: 'fota_repo',
        name: 'FOTA Repository',
        icon: Database,
        color: 'purple.600',
        endpoints: [
            { name: 'Login (FOTA_UPLOAD)', method: 'POST', handler: () => TraxoApi.login('FOTA_UPLOAD') },
            { 
                name: 'Check Project Inventory', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.checkUploadedFirmware(p.version),
                params: ['version']
            },
            { 
                name: 'Upload Firmware (ZIP)', 
                method: 'POST', 
                handler: (vin, p) => {
                    try {
                        const details = typeof p.fileDetails === 'string' ? JSON.parse(p.fileDetails) : p.fileDetails;
                        return TraxoApi.uploadFirmware(details, p.files);
                    } catch (e) {
                        throw new Error("Invalid fileDetails JSON. Please check the format.");
                    }
                },
                params: ['fileDetails', 'files'],
                isJSON: true,
                isMultiFile: true
            },
            { 
                name: 'Download to Laptop', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.downloadFirmwareFile(p.category, p.version), 
                isBlob: true,
                params: ['category', 'version']
            },
            { 
                name: 'Delete Firmware', 
                method: 'DELETE', 
                handler: (vin, p) => TraxoApi.deleteFirmware(p.category, p.releaseVersion),
                params: ['category', 'releaseVersion']
            },
            { 
                name: 'Download from DEVICE', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.downloadFirmwareFile(p.filename, p.releaseVersion, p.fileType, p.category, p.fotaId),
                params: ['filename', 'releaseVersion', 'fileType', 'category', 'fotaId']
            },
        ]
    },
    {
        id: 'fota_ops',
        name: 'FOTA Operations (VIN)',
        icon: Cloud,
        color: 'purple.400',
        endpoints: [
            { 
                name: 'FOTA Trigger (Download)', 
                method: 'POST', 
                handler: (vin, p) => TraxoApi.triggerFirmwareDownload(vin, p.version),
                params: ['version']
            },
            { 
                name: 'FOTA Update (Execute)', 
                method: 'POST', 
                handler: (vin, p) => TraxoApi.triggerFotaUpdate(vin, p.version),
                params: ['version']
            },
            { 
                name: 'Check Command Status', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getFotaCommandStatus(p.commandId),
                params: ['commandId']
            },
            { 
                name: 'Reset FOTA State', 
                method: 'PUT', 
                handler: (vin, p) => TraxoApi.resetFotaState(vin, p.commandName || 'firmwaredownloadcommand'),
                params: ['commandName']
            },
        ]
    },
    {
        id: 'lifecycle',
        name: 'Device Lifecycle',
        icon: Settings,
        color: 'red.500',
        endpoints: [
            { 
                name: 'Initiation Command', 
                method: 'POST', 
                handler: (vin, p) => TraxoApi.updateTboxState(vin, p.tboxState),
                params: ['tboxState']
            },
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
            { 
                name: 'Portal Search (Advanced)', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.portalSearch(p.searchPattern || vin, p.searchKey),
                params: ['searchPattern', 'searchKey']
            },
        ]
    },
    {
        id: 'telematics',
        name: 'Telematics & Performance',
        icon: Activity,
        color: 'yellow.500',
        endpoints: [
            { 
                name: 'Vehicle Telemetry (Step 1)', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getCanMessages(p.deviceType),
                params: ['deviceType']
            },
            { 
                name: 'Vehicle Telemetry (Step 2)', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getCanSignals(p.messageId),
                params: ['messageId']
            },
            { 
                name: 'Get Telemetry Data', 
                method: 'GET', 
                handler: (vin, p) => TraxoApi.getVehicleTelemetryData(vin, p.telemetrySignal),
                params: ['telemetrySignal']
            },
            { name: 'Location Telemetry (RAW)', method: 'GET', handler: (vin) => TraxoApi.getLocationTelemetryArray(vin) },
            { 
                name: 'Set Speed Alert', 
                method: 'POST', 
                handler: (vin, p) => TraxoApi.setSpeedAlert(vin, p.speedLimit),
                params: ['speedLimit']
            },
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
            { 
                name: 'Delete Log File', 
                method: 'DELETE', 
                handler: (vin, p) => TraxoApi.deleteLogFile(vin, p.filename),
                params: ['filename']
            },
            { 
                name: 'Available Logs (Portal)', 
                method: 'GET', 
                handler: (vin) => TraxoApi.listAvailableLogs(vin) 
            },
        ]
    },
    {
        id: 'notifications',
        name: 'Notifications & Connectivity',
        icon: Bell,
        color: 'pink.400',
        endpoints: [
            { name: 'Device Join Status', method: 'GET', handler: (vin) => TraxoApi.getDeviceJoinStatus(vin) },
            { 
                name: 'Mark as Read', 
                method: 'PUT', 
                handler: (vin, p) => TraxoApi.updateNotificationStatus(p.notificationId),
                params: ['notificationId']
            },
            { 
                name: 'Delete Notification', 
                method: 'DELETE', 
                handler: (vin, p) => TraxoApi.deleteNotification(p.notificationId),
                params: ['notificationId']
            },
        ]
    }
];
 
const PROCEDURAL_DOCS = {
    auth: {
        title: "Authentication Guide",
        steps: [
            "Select the target environment (PRIMARY/JEEP/RUN).",
            "Ensure the Global VIN is set correctly if using JEEP/RUN endpoints.",
            "Click Execute to retrieve the access token.",
            "Tokens are automatically managed for subsequent calls."
        ],
        tips: "If you receive a 401 Unauthorized, re-run the PRIMARY login first."
    },
    fota_repo: {
        title: "FOTA Repository Management",
        steps: [
            "Execute 'Login (FOTA_UPLOAD)' first to get repository permissions.",
            "Configure VERSION and CATEGORY (usually BATCH) in the Variables dashboard.",
            "Paste the firmware metadata JSON in the FILEDETAILS field.",
            "Select the .ZIP package and click Execute."
        ],
        tips: "FOTA upload tokens expire independently of main session tokens."
    },
    fota_ops: {
        title: "Vehicle FOTA Execution",
        steps: [
            "Perform 'FOTA Trigger (Download)' to push firmware to the vehicle.",
            "Copy the commandId from the response and paste it into Variables.",
            "Poll 'Check Command Status' until it reaches READY_TO_INSTALL.",
            "Execute 'FOTA Update' and monitor until SUCCESSFUL."
        ],
        tips: "Use 'Reset FOTA State' if the job becomes stuck or inconsistent."
    },
    mobility: {
        title: "Mobility & Trip Analysis Guide",
        steps: [
            "Set the target VIN in the global variables dashboard.",
            "Use 'Ongoing Trip' to monitor real-time telemetry for an active session.",
            "Configure startTime and endTime to query 'Trip Summary' for historical analysis.",
            "Use 'Trip Details (Paginated)' to fetch granular location and event data for past trips."
        ],
        tips: "Ensure the vehicle has a clear GPS sky-view for accurate 'Ongoing Trip' location data. Historical summaries may take longer to process for large time windows."
    },
    remote: {
        title: "Remote Commands Control",
        steps: [
            "Verify the device join status in the 'Notifications & Connectivity' category first.",
            "Click 'Execute' for commands like Lock, Unlock, or Honk.",
            "The response will contain a commandId. Monitor its progress via 'Command History (JEEP)' in the Audit section."
        ],
        tips: "Remote commands rely on the MQTT bridge. If the vehicle is in deep-sleep mode, the command may queue until the next heartbeat."
    },
    trips: {
        title: "Trip Management Guide",
        steps: [
            "Set the pageIndex variable (starting at 0) for trip history pagination.",
            "Execute 'Trip History (Paginated)' to retrieve lists of completed trips.",
            "Ongoing Trip provides immediate status updates for the current session."
        ],
        tips: "Trip records are archived based on the ignition-off event. Short trips (under 100m) may be filtered out by the backend."
    },
    bulk: {
        title: "Bulk Provisioning SOP",
        steps: [
            "Login via 'Login (BULK)' before uploading files.",
            "Select the .csv or .xlsx file for IMEI or Supplier feeds.",
            "Monitor the status bar for batch acceptance confirmation."
        ]
    },
    security: {
        title: "Security & Certification Workflow",
        steps: [
            "Certificate creation requires a valid CSR string in the CSR variable.",
            "Ensure the CommonName matches your project naming convention.",
            "Execute creation endpoints to download the generated file."
        ]
    },
    lifecycle: {
        title: "Device Lifecycle Management",
        steps: [
            "Use 'Portal Device State' to check the current factory status.",
            "Trigger 'Initiation Command' to transition the TBOX state (e.g., AUTHORIZED).",
            "Use 'AWS Global Reset' only if the device is stuck in an unrecoverable state."
        ],
        tips: "State transitions are strictly gated by the STLA Southbound state machine."
    },
    discovery: {
        title: "Inventory & Discovery",
        steps: [
            "Login via 'Login (FACTORY)' to gain system-wide traversal rights.",
            "Use 'List All Devices' for a raw dump of the environment's fleet.",
            "Execute 'Search Portal' with a VIN pattern to locate specific hardware clusters."
        ]
    },
    telematics: {
        title: "Telematics & Performance",
        steps: [
            "Fetch CAN descriptors using 'Vehicle Telemetry (Step 1)'.",
            "Identify signal IDs in Step 2 to map raw hex to meaningful units.",
            "Use 'Set Speed Alert' to verify the end-to-end alert ingestion pipeline."
        ],
        tips: "Signal names (e.g., VITV, ODO) must exactly match the DBC specifications."
    },
    audit: {
        title: "Audit & Diagnostic Center",
        steps: [
            "Use 'Jeep Events Audit' to see the chronological stream of MQTT messages.",
            "Check 'Alert Ingestion' to verify if the rule engine correctly flagged a violation.",
            "Trigger 'Log Fetch' and wait for the TBOX to upload its internal trace files.",
            "Use 'List Log Files' to retrieve the S3/Cloud storage URLs for downloaded logs."
        ]
    },
    notifications: {
        title: "Notifications & Connectivity",
        steps: [
            "Use 'Device Join Status' to check if the TBOX is physically connected and secure.",
            "Connection Status labels: CONNECTED, DISCONNECTED, REMOVED.",
            "Tamper Status labels: SECURE, TAMPERED.",
            "To manage specific notifications, enter the notificationId in the variables panel."
        ],
        tips: "Device Join status is derived from the latest system-level MQTT connectivity heartbeat."
    }
};

const HelpModal = ({ isOpen, onClose, categoryId }) => {
    const doc = PROCEDURAL_DOCS[categoryId];
    if (!doc) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered motionPreset="slideInBottom">
            <ModalOverlay bg="none" backdropFilter="blur(10px)" />
            <ModalContent borderRadius="2xl" border="1px solid" borderColor="blue.100" shadow="2xl" maxW={{ base: "95vw", md: "600px" }} mx={4}>
                <ModalHeader bg="gray.50" borderTopRadius="2xl" p={6}>
                    <HStack spacing={3}>
                        <Icon as={HelpCircle} color="blue.500" />
                        <Text fontSize="lg" fontWeight="black">{doc.title}</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton mt={2} />
                <ModalBody p={6}>
                    <VStack align="flex-start" spacing={4}>
                        <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="widest">STANDARD OPERATING PROCEDURE</Text>
                        <VStack align="flex-start" spacing={3} w="full">
                            {doc.steps.map((step, idx) => (
                                <HStack key={idx} align="flex-start" spacing={3}>
                                    <Badge borderRadius="full" px={2} colorScheme="blue" variant="solid">{idx + 1}</Badge>
                                    <Text fontSize="sm" color="gray.700" fontWeight="medium">{step}</Text>
                                </HStack>
                            ))}
                        </VStack>
                        
                        {doc.tips && (
                            <Box w="full" p={4} borderRadius="xl" bg="blue.50" border="1px solid" borderColor="blue.200" mt={2}>
                                <HStack spacing={2} mb={1}>
                                    <Icon as={Info} size={14} color="blue.600" />
                                    <Text fontSize="xs" fontWeight="bold" color="blue.700">EXPERT TIP</Text>
                                </HStack>
                                <Text fontSize="xs" color="blue.600">{doc.tips}</Text>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter bg="gray.50" borderBottomRadius="2xl" py={4}>
                    <Button colorScheme="blue" onClick={onClose} borderRadius="xl" px={8} leftIcon={<CheckCircle2 size={16} />}>
                        Got it, Proceed
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


const ApiPreview = ({ epKey, result }) => {
    if (!result || (!result.response && !result.error)) return null;
    
    const { response, error } = result;
    const data = response?.data;
    const status = response?.status;

    // Handle 204 No Content precisely
    if (status === 204 || (status === 200 && (!data || (Array.isArray(data) && data.length === 0)))) {
        return (
            <Box p={8} textAlign="center">
                <VStack spacing={4}>
                    <Icon as={Info} boxSize={10} color="blue.300" />
                    <Heading size="sm" color="gray.600">No Data Available</Heading>
                    <Text fontSize="xs" color="gray.500" maxW="300px">
                        The request was successful, but no records were found matching your criteria for {epKey.split('-').pop()}.
                    </Text>
                    <Badge variant="subtle" colorScheme="blue">HTTP 204 SUCCESS</Badge>
                </VStack>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error" borderRadius="md" variant="subtle">
                <AlertIcon />
                <Box>
                    <AlertTitle fontSize="sm">Execution Failed</AlertTitle>
                    <AlertDescription fontSize="xs">{error}</AlertDescription>
                </Box>
            </Alert>
        );
    }

    // Specialized Renderer: Trip Summary
    if (epKey.toLowerCase().includes('trip summary') && typeof data === 'object') {
        const items = Object.entries(data).filter(([k]) => typeof data[k] !== 'object');
        return (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} p={2}>
                {items.map(([key, value]) => (
                    <Card key={key} variant="outline" size="sm" border="1px solid" borderColor="gray.100">
                        <CardBody>
                            <Stat>
                                <StatLabel fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                </StatLabel>
                                <StatNumber fontSize="xl" color="blue.600">
                                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                </StatNumber>
                                <StatHelpText fontSize="9px">Diagnostic Metric</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                ))}
            </SimpleGrid>
        );
    }

    // Specialized Renderer: Arrays (Devices, Trips, Logs)
    if (Array.isArray(data)) {
        if (data.length === 0) return null;
        const headers = Object.keys(data[0]).slice(0, 6); // Top 6 columns
        return (
            <Box overflowX="auto" border="1px solid" borderColor="gray.100" borderRadius="md">
                <Table size="sm" variant="simple">
                    <Thead bg="gray.50">
                        <Tr>
                            {headers.map(h => (
                                <Th key={h} fontSize="10px" color="gray.500">{h.toUpperCase()}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data.slice(0, 50).map((row, i) => (
                            <Tr key={i} _hover={{ bg: "blue.50" }}>
                                {headers.map(h => (
                                    <Td key={h} fontSize="11px" color="gray.700">
                                        {typeof row[h] === 'object' ? '[Object]' : String(row[h])}
                                    </Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    }

    // Regular Object Rendering (Property Table)
    if (typeof data === 'object' && data !== null) {
        return (
            <Box overflowX="auto" border="1px solid" borderColor="gray.100" borderRadius="md">
                <Table size="sm" variant="simple">
                    <Tbody fontSize="11px">
                        {Object.entries(data).map(([key, value]) => (
                            <Tr key={key}>
                                <Td fontWeight="bold" color="blue.500" width="200px" bg="gray.50">{key}</Td>
                                <Td color="gray.700">
                                    {typeof value === 'object' ? (
                                        <Code fontSize="10px">{JSON.stringify(value)}</Code>
                                    ) : String(value)}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    }

    return <Text fontSize="xs" color="gray.500">Preview not available for this data type.</Text>;
};

const FotaParameterManager = ({ params, setParams, ep, handleFileParamChange }) => {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <Box width="full" maxW="850px" my={2}>
            <Tabs 
                variant="soft-rounded" 
                colorScheme="purple" 
                size="sm" 
                index={tabIndex} 
                onChange={setTabIndex}
            >
                <TabList bg="gray.50" p={2} borderRadius="xl" border="1px solid" borderColor="gray.100">
                    <Tab borderRadius="lg" fontWeight="bold" px={8}>
                        <HStack spacing={2}>
                            <Icon as={UploadCloud} size={14} />
                            <Text>FILE UPLOAD</Text>
                        </HStack>
                    </Tab>
                    <Tab borderRadius="lg" fontWeight="bold" px={8}>
                        <HStack spacing={2}>
                            <Icon as={FileJson} size={14} />
                            <Text>INLINE EDITOR</Text>
                        </HStack>
                    </Tab>
                </TabList>
                
                <TabPanels mt={4}>
                    {/* Tab 1: File Manager */}
                    <TabPanel p={0}>
                        <VStack align="stretch" spacing={4}>
                            <Box
                                w="full"
                                h="160px"
                                border="2px dashed"
                                borderColor={params.files?.length > 0 ? "purple.400" : "gray.200"}
                                borderRadius="2xl"
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                cursor="pointer"
                                transition="0.2s"
                                position="relative"
                                bg={params.files?.length > 0 ? "purple.50" : "white"}
                                _hover={{ borderColor: 'purple.500', bg: 'purple.50' }}
                            >
                                <Input 
                                    type="file" 
                                    multiple 
                                    opacity={0} 
                                    position="absolute" 
                                    top={0} left={0} width="100%" height="100%" zIndex={2} cursor="pointer"
                                    onChange={(e) => handleFileParamChange(e, ep, 'files')}
                                />
                                <Icon as={UploadCloud} boxSize={10} color={params.files?.length > 0 ? "purple.500" : "gray.300"} mb={3} />
                                <Text fontWeight="bold" color="gray.600" fontSize="sm">
                                    {params.files?.length > 0 ? `${params.files.length} Firmware Files Selected` : "Click or Drag Firmware (.ulp, .zip) here"}
                                </Text>
                                <Text fontSize="xs" color="gray.400">Standard FOTA packages only</Text>
                            </Box>
                            
                            {params.files?.length > 0 && (
                                <Box bg="gray.50" p={4} borderRadius="xl" border="1px solid" borderColor="gray.100">
                                    <Text fontSize="10px" fontWeight="bold" color="gray.500" mb={3} letterSpacing="1px">READY FOR DEPLOYMENT</Text>
                                    <VStack align="stretch" spacing={2}>
                                        {Array.from(params.files).map((f, i) => (
                                            <HStack key={i} justify="space-between" bg="white" p={2} borderRadius="md" border="1px solid" borderColor="gray.100">
                                                <HStack>
                                                    <Icon as={Terminal} size={14} color="purple.500" />
                                                    <Text fontSize="11px" fontWeight="bold" color="gray.700">{f.name}</Text>
                                                </HStack>
                                                <Badge size="xs" colorScheme="purple" variant="subtle">{(f.size / 1024 / 1024).toFixed(2)} MB</Badge>
                                            </HStack>
                                        ))}
                                    </VStack>
                                    <Alert status="success" size="sm" mt={4} borderRadius="lg" variant="subtle">
                                            <AlertIcon />
                                            <Box>
                                                <AlertTitle fontSize="xs" fontWeight="bold">Checksm & Size Validated</AlertTitle>
                                                <AlertDescription fontSize="10px">Metadata has been automatically synchronized in the Inline Editor.</AlertDescription>
                                            </Box>
                                    </Alert>
                                </Box>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* Tab 2: Metadata Logic */}
                    <TabPanel p={0} position="relative">
                        <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between" px={1}>
                                <Text fontSize="10px" color="gray.400" fontWeight="bold" letterSpacing="1px">FILEDETAILS JSON</Text>
                                <Badge colorScheme="green" variant="solid" fontSize="9px" px={2} borderRadius="full">ACTIVE SYNC ON</Badge>
                            </HStack>
                            <Box borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.700" bg="gray.900" p={1}>
                                <Textarea 
                                    placeholder="Metadata JSON"
                                    value={params.fileDetails || ''}
                                    onChange={(e) => setParams(prev => ({ ...prev, fileDetails: e.target.value }))}
                                    size="xs"
                                    width="full"
                                    minH="350px"
                                    bg="transparent"
                                    color="green.300"
                                    border="none"
                                    _focus={{ border: "none", ring: 0 }}
                                    fontSize="12px"
                                    fontFamily="monospace"
                                    p={4}
                                    className="custom-scrollbar"
                                />
                            </Box>
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};


const ResultExplorer = ({ result, epKey, onClear }) => {
    if (!result) return null;

    const { request, response, error, duration } = result;
    const isSuccess = !error && response && response.status < 400;

    return (
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden" my={4} shadow="xl">
            <Flex bg="gray.50" p={2} align={{ base: "flex-start", md: "center" }} justify="space-between" direction={{ base: "column", md: "row" }} gap={3} borderBottom="1px solid" borderColor="gray.200">
                <Flex wrap="wrap" gap={{ base: 2, md: 6 }} align="center">
                    <Badge colorScheme={isSuccess ? 'green' : (response?.status === 204 ? 'blue' : 'red')} variant="solid" px={3} py={1} borderRadius="full" fontSize="10px">
                        {response?.status || 'ERROR'} {response?.statusText || (error ? 'FAILED' : '')}
                    </Badge>
                    <HStack spacing={1}>
                        <Clock size={12} color="#8b949e" />
                        <Text fontSize="10px" color="gray.400" fontWeight="bold">Time:</Text>
                        <Text fontSize="10px" color="cyan.400" fontWeight="bold">{duration ? `${duration}ms` : '--'}</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Database size={12} color="#8b949e" />
                        <Text fontSize="10px" color="gray.400" fontWeight="bold">Size:</Text>
                        <Text fontSize="10px" color="blue.400" fontWeight="bold">
                            {response?.data ? `${(JSON.stringify(response.data).length / 1024).toFixed(2)} KB` : '0 KB'}
                        </Text>
                    </HStack>
                </Flex>
                <HStack>
                    <Tooltip label="Copy Response">
                        <IconButton icon={<Icon as={Map} size={14} />} size="xs" variant="ghost" color="gray.400" onClick={() => navigator.clipboard.writeText(JSON.stringify(response?.data, null, 2))} />
                    </Tooltip>
                    <IconButton 
                        icon={<Trash2 size={14} />} 
                        size="xs" 
                        colorScheme="red" 
                        variant="ghost" 
                        onClick={onClear}
                        title="Clear Result"
                    />
                </HStack>
            </Flex>

            <Tabs variant="line" size="sm" colorScheme="blue">
                <TabList px={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
                    <Tab color="gray.500" _selected={{ color: 'blue.600', borderColor: 'blue.600' }} fontSize="11px" fontWeight="bold" py={3}>Body</Tab>
                    <Tab color="gray.500" _selected={{ color: 'blue.600', borderColor: 'blue.600' }} fontSize="11px" fontWeight="bold" py={3}>Headers</Tab>
                    <Tab color="gray.500" _selected={{ color: 'blue.600', borderColor: 'blue.600' }} fontSize="11px" fontWeight="bold" py={3}>Request</Tab>
                    <Tab color="gray.500" _selected={{ color: 'blue.600', borderColor: 'blue.600' }} fontSize="11px" fontWeight="bold" py={3}>Preview</Tab>
                </TabList>

                <TabPanels>
                    {/* Response Body */}
                    <TabPanel p={0}>
                        <Box p={4} maxH="500px" overflowY="auto" bg="white" className="custom-scrollbar">
                            {response?.data ? (
                                <Code display="block" whiteSpace="pre" bg="gray.50" p={4} borderRadius="md" color="black" fontSize="xs" fontFamily="monospace" border="1px solid" borderColor="gray.100">
                                    {JSON.stringify(response.data, null, 2)}
                                </Code>
                            ) : error ? (
                                <Box p={4} borderRadius="md" bg="rgba(248, 81, 73, 0.1)" border="1px solid" borderColor="red.500">
                                    <Text color="red.400" fontSize="xs" fontWeight="bold">Error:</Text>
                                    <Text color="red.200" fontSize="xs" mt={1}>{error}</Text>
                                </Box>
                            ) : (
                                <Text color="gray.600" fontSize="xs" fontStyle="italic" p={4}>No response data available</Text>
                            )}
                        </Box>
                    </TabPanel>

                    {/* Headers */}
                    <TabPanel p={0}>
                        <Box overflowX="auto">
                            <Table size="sm" variant="simple">
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th color="gray.500" fontSize="10px" borderBottom="1px solid" borderColor="gray.200">HEADER</Th>
                                        <Th color="gray.500" fontSize="10px" borderBottom="1px solid" borderColor="gray.200">VALUE</Th>
                                    </Tr>
                                </Thead>
                                <Tbody fontSize="xs">
                                    {response?.headers && Object.entries(response.headers).map(([key, value]) => (
                                        <Tr key={key} borderColor="gray.100">
                                            <Td color="blue.600" fontWeight="bold" borderBottom="1px solid" borderColor="gray.100">{key}</Td>
                                            <Td color="gray.700" borderBottom="1px solid" borderColor="gray.100" wordBreak="break-all">{String(value)}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    </TabPanel>

                    {/* Request Details */}
                    <TabPanel p={4}>
                        <VStack align="stretch" spacing={4}>
                            <Box>
                                <Text fontSize="10px" color="gray.500" fontWeight="bold" mb={2} letterSpacing="1px">URL</Text>
                                <Box bg="gray.50" p={2} borderRadius="md" border="1px solid" borderColor="gray.200">
                                    <HStack mb={2}>
                                        <Badge colorScheme="blue">{request?.method || 'GET'}</Badge>
                                    </HStack>
                                    <Text color="gray.700" fontSize="xs" wordBreak="break-all" fontWeight="bold" fontFamily="monospace">
                                        {request?.url || 'URL Not Captured'}
                                    </Text>
                                </Box>
                            </Box>
                            {request?.data && (
                                <Box>
                                    <Text fontSize="10px" color="gray.500" fontWeight="bold" mb={2} letterSpacing="1px">PAYLOAD</Text>
                                    <Code display="block" p={3} borderRadius="md" bg="gray.800" color="orange.200" fontSize="xs" whiteSpace="pre">
                                        {JSON.stringify(request.data, null, 2)}
                                    </Code>
                                </Box>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* Preview */}
                    <TabPanel p={4}>
                        <ApiPreview epKey={epKey} result={result} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

const SystemConsolePage = () => {
    const { vin: urlVin } = useParams();
    const [globalVin, setGlobalVin] = useState(urlVin || localStorage.getItem('last_vin') || 'MCANJREB1MFA65412');
    const [params, setParams] = useState({ 
        version: '2314.0', 
        category: 'BATCH', 
        commandId: '',
        notificationId: '',
        imeiCsvContent: '356769705035673',
        tboxCsvContent: 'Dongle_SN,IMEI,MSISDN,ICCID,eUICCID,HW_part_number,NAD_SW_version,MCU_SW_version,encryptionKeyVersion,signingKeyVersion,plantManufacturingCountryCode,Plant_Manufactured_Date,countrycode,regioncode\nTraxo111,356741360421832,123456421893,12345678622181378993,12245246792131121892328278947923,68532321AA,ND0.00.51,MD0.00.03,1,1,1,123412218823,1,4',
        commandName: 'firmwaredownloadcommand',
        pattern: 'MCANJREB1MFA',
        deviceType: 'cc-21',
        messageId: 'B6',
        signalName: 'VITV',
        telemetrySignal: 'VITV',
        speedLimit: '80',
        commonName: 'CVIP-STLA-JEEP-PingVerification',
        csr: 'MII...',
        pageIndex: '0',
        tboxState: 'AUTHORIZED',
        searchPattern: '',
        limit: '500',
        startTime: '2026-03-13 00:00:00',
        endTime: '2026-03-14 23:59:59',
        tripId: '',
        pageNo: '0',
        releaseVersion: '5317.0',
        fotaId: '',
        filename: '',
        searchKey: 'vin',
        fileType: 'mcu',
        file: null, // For single uploads
        files: [],   // For multi-uploads
        fileDetails: JSON.stringify({
            category: "BATCH",
            batches: {
                compatibleNadVersion: "176.0",
                compatibleMcuVersion: "176.0",
                nadVersion: "ND0_66_00",
                mcuVersion: "MD0_66_00",
                releaseVersion: "5317.0",
                fileDetails: [
                    {
                        fileType: "mcu",
                        fileName: "MD0_66_00.ulp",
                        rawChecksum: "AUTOMATICALLY_GENERATED_ON_FILE_SELECT",
                        installType: "full",
                        softwareSize: "0",
                        isGolden: true
                    },
                    {
                        fileType: "nad",
                        fileName: "ND0_66_00.zip",
                        rawChecksum: "AUTOMATICALLY_GENERATED_ON_FILE_SELECT",
                        installType: "full",
                        softwareSize: "0",
                        isGolden: true
                    }
                ]
            }
        }, null, 2)
    });
    const [isEnvPanelOpen, setIsEnvPanelOpen] = useState(false);
    const [expandedCards, setExpandedCards] = useState([]);
    const [apiResults, setApiResults] = useState({});
    const [loadingMap, setLoadingMap] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    
    // Help Modal Management
    const { isOpen: isHelpOpen, onOpen: onHelpOpen, onClose: onHelpClose } = useDisclosure();
    const [activeHelpCategory, setActiveHelpCategory] = useState(null);
    const [seenCategories, setSeenCategories] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('seen_console_docs') || '[]');
        } catch {
            return [];
        }
    });

    const handleFileParamChange = async (e, ep, paramKey) => {
        const selectedFiles = ep.isMultiFile ? Array.from(e.target.files) : e.target.files[0];
        setParams(prev => ({ ...prev, [paramKey]: selectedFiles }));

        // Specialized Logic: Auto-calculate rawChecksum for Firmware Uploads
        if (ep.name === 'Upload Firmware (ZIP)' && ep.isMultiFile && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            
            const fileDetailsList = await Promise.all(filesArray.map(async (file) => {
                const checksum = await TraxoApi.calculateSHA256(file);
                const fileType = file.name.toLowerCase().endsWith('.ulp') ? 'mcu' : 'nad';
                return {
                    fileType,
                    fileName: file.name,
                    rawChecksum: checksum,
                    installType: "full",
                    softwareSize: String(file.size),
                    isGolden: true
                };
            }));

            setParams(prev => {
                let currentDetails = {};
                try {
                    currentDetails = typeof prev.fileDetails === 'string' ? JSON.parse(prev.fileDetails) : prev.fileDetails;
                } catch (err) {
                    currentDetails = { category: "BATCH", batches: { 
                        compatibleNadVersion: "176.0", 
                        compatibleMcuVersion: "176.0",
                        nadVersion: "ND0_61_00",
                        mcuVersion: "MD0_61_00",
                        releaseVersion: "5314.0"
                    } };
                }

                const updatedDetails = {
                    ...currentDetails,
                    batches: {
                        ...(currentDetails.batches || {}),
                        fileDetails: fileDetailsList
                    }
                };

                return {
                    ...prev,
                    fileDetails: JSON.stringify(updatedDetails, null, 2)
                };
            });
        }
    };

    const lastRequestRef = useRef(null);
    const lastResponseRef = useRef(null);
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
                lastResponseRef.current = {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data,
                    headers: response.headers
                };
                return response;
            },
            (error) => {
                if (error.config?.metadata) {
                    error.duration = new Date() - error.config.metadata.startTime;
                }
                lastResponseRef.current = error.response ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                } : null;
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(reqInterceptor);
            axios.interceptors.response.eject(resInterceptor);
        };
    }, []);

    useEffect(() => {
        if (globalVin) {
            localStorage.setItem('last_vin', globalVin);
            const patterns = globalVin.substring(0, 12);
            setParams(prev => ({ ...prev, pattern: patterns }));
        }
    }, [globalVin]);

    const toggleCard = (id) => {
        const isOpening = !expandedCards.includes(id);
        
        setExpandedCards(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );

        // Auto-popup logic for first-time use
        if (isOpening && PROCEDURAL_DOCS[id] && !seenCategories.includes(id)) {
            setActiveHelpCategory(id);
            onHelpOpen();
            // Mark as seen
            const newSeen = [...seenCategories, id];
            setSeenCategories(newSeen);
            localStorage.setItem('seen_console_docs', JSON.stringify(newSeen));
        }
    };

    const handleManualHelp = (e, id) => {
        e.stopPropagation(); // Prevents card toggle
        setActiveHelpCategory(id);
        onHelpOpen();
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
            
            // The interceptor captured the real response details
            const lastRes = lastResponseRef.current;
            
            setApiResults(prev => ({ 
                ...prev, 
                [key]: { 
                    request: lastRequestRef.current,
                    response: lastRes ? {
                        status: lastRes.status,
                        statusText: lastRes.statusText,
                        data: lastRes.data, // Show raw data from server in console
                        headers: lastRes.headers
                    } : {
                        status: 200,
                        statusText: 'OK',
                        data: result,
                        headers: {}
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

    const handleFetchAll = async () => {
        if (!globalVin) {
            toast({ title: 'Please enter a VIN', status: 'warning' });
            return;
        }
        
        // Just save and confirm, don't execute everything automatically
        localStorage.setItem('last_vin', globalVin);
        toast({ 
            title: 'VIN Updated', 
            description: `Ready to run diagnostics for ${globalVin}`, 
            status: 'success', 
            duration: 2000,
            position: 'top'
        });
    };

    const filteredCategories = API_CATEGORIES.map(cat => ({
        ...cat,
        endpoints: cat.endpoints.filter(ep => 
            ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.endpoints.length > 0);

    // Automatically expand categories when searching
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            const matchingCatIds = filteredCategories.map(cat => cat.id);
            setExpandedCards(prev => {
                const newIds = [...new Set([...prev, ...matchingCatIds])];
                return newIds;
            });
        }
    }, [searchTerm]);

    return (
        <Box p={{ base: 4, md: 8, lg: 10 }} bg="gray.50" minH="100vh">
            {/* Variables Header */}
            <Card mb={8} shadow="lg" borderRadius="2xl" border="1px solid" borderColor="blue.100" bg="white">
                <CardBody p={{ base: 4, md: 6 }}>
                    <VStack align="flex-start" spacing={6} w="full">
                        {/* Status Bar */}
                        <Flex w="full" justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} gap={4}>
                            <HStack spacing={3}>
                                <Icon as={Terminal} color="blue.500" />
                                <Text fontWeight="black" fontSize="xs" color="gray.500" letterSpacing="widest">DIAGNOSTIC DASHBOARD</Text>
                            </HStack>
                            <HStack spacing={3} wrap="wrap">
                                <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="lg" fontSize="10px">
                                    READY FOR DIAGNOSTICS
                                </Badge>
                                <Tag size="md" colorScheme="purple" variant="subtle" borderRadius="full">
                                    <Icon as={Shield} mr={2} /> Preprod Environment
                                </Tag>
                            </HStack>
                        </Flex>

                        {/* Input Group */}
                        <Flex w="full" direction={{ base: "column", lg: "row" }} gap={4} align={{ base: "stretch", lg: "center" }}>
                            <Input 
                                placeholder="Enter Target VIN" 
                                value={globalVin} 
                                onChange={(e) => setGlobalVin(e.target.value)}
                                size="lg"
                                bg="gray.50"
                                maxW={{ base: "full", lg: "500px" }}
                                fontWeight="bold"
                                variant="filled"
                                _focus={{ borderColor: "blue.500", bg: "white", boxShadow: "0 0 0 1px #3182ce" }}
                                borderRadius="xl"
                            />
                            <Button 
                                colorScheme="blue" 
                                size="lg" 
                                px={10} 
                                w={{ base: "full", lg: "auto" }}
                                borderRadius="xl" 
                                leftIcon={<Play size={16} />}
                                onClick={handleFetchAll}
                                boxShadow="0 4px 12px rgba(49, 130, 206, 0.3)"
                                _hover={{ transform: "translateY(-1px)", boxShadow: "0 6px 16px rgba(49, 130, 206, 0.4)" }}
                                _active={{ transform: "translateY(0)" }}
                            >
                                Submit
                            </Button>
                        </Flex>
                    </VStack>
                </CardBody>
            </Card>

            {/* Environment Variables Dashboard (Postman Style) */}
            <Collapse in={isEnvPanelOpen}>
                <Card mb={8} shadow="lg" borderRadius="2xl" border="1px solid" borderColor="purple.100" bg="#0d1117">
                    <CardHeader py={4} px={6} borderBottom="1px solid" borderColor="gray.700">
                        <HStack justify="space-between">
                            <HStack><Icon as={Settings} color="purple.400" /><Text fontWeight="black" fontSize="xs" color="gray.400" letterSpacing="widest">ENVIRONMENT VARIABLES</Text></HStack>
                            <Badge colorScheme="purple" variant="subtle">STAGING_PREPROD</Badge>
                        </HStack>
                    </CardHeader>
                    <CardBody p={6}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                            {Object.entries(params).filter(([k]) => k !== 'file').map(([key, value]) => (
                                <VStack key={key} align="flex-start" spacing={1}>
                                    <Text fontSize="10px" color="gray.500" fontWeight="bold" letterSpacing="1px">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</Text>
                                    <Input 
                                        value={value}
                                        onChange={(e) => setParams(prev => ({ ...prev, [key]: e.target.value }))}
                                        size="sm"
                                        bg="#161b22"
                                        color="gray.200"
                                        borderColor="gray.700"
                                        _focus={{ borderColor: "purple.500", bg: "#1c2128" }}
                                        fontSize="11px"
                                        fontFamily="monospace"
                                    />
                                </VStack>
                            ))}
                        </SimpleGrid>
                    </CardBody>
                </Card>
            </Collapse>

            <Button 
                position="fixed" 
                bottom={{ base: "20px", md: "30px" }} 
                right={{ base: "20px", md: "30px" }} 
                colorScheme="purple" 
                borderRadius="full" 
                size={{ base: "md", md: "lg" }} 
                shadow="2xl"
                leftIcon={<Icon as={Settings} />}
                onClick={() => setIsEnvPanelOpen(!isEnvPanelOpen)}
                zIndex={100}
                boxShadow="0 8px 32px rgba(128, 90, 213, 0.4)"
            >
                {isEnvPanelOpen ? 'Close' : 'Variables'}
            </Button>

            <InputGroup mb={6} size="lg">
                <InputLeftElement pointerEvents="none">
                    <Icon as={Search} color="gray.400" />
                </InputLeftElement>
                <Input 
                    placeholder="Search APIs by name or category..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="white"
                    shadow="sm"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="blue.100"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
            </InputGroup>
            
            <VStack spacing={6} align="stretch">
                {filteredCategories.map((cat) => (
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
                            <Flex justify="space-between" align="center" direction={{ base: "column", sm: "row" }} gap={4} w="full">
                                <Flex align="center" gap={3} w={{ base: "full", sm: "auto" }}>
                                    <Box p={2} bg={`${cat.color.split('.')[0]}.50`} borderRadius="lg">
                                        <Icon as={cat.icon} color={cat.color} boxSize={5} />
                                    </Box>
                                    <VStack align="flex-start" spacing={0}>
                                        <HStack spacing={2}>
                                            <Heading size="sm" fontSize={{ base: "sm", md: "md" }}>{cat.name}</Heading>
                                            {PROCEDURAL_DOCS[cat.id] && (
                                                <Tooltip label="How to use this category" placement="right">
                                                    <IconButton 
                                                        icon={<HelpCircle size={14} />} 
                                                        size="xs" 
                                                        variant="ghost" 
                                                        color="gray.400" 
                                                        _hover={{ color: "blue.500", bg: "blue.50" }} 
                                                        onClick={(e) => handleManualHelp(e, cat.id)}
                                                        aria-label="Help"
                                                        borderRadius="full"
                                                    />
                                                </Tooltip>
                                            )}
                                        </HStack>
                                        <Text fontSize="2xs" color="gray.400" fontWeight="bold">{cat.endpoints.length} Endpoints Integrated</Text>
                                    </VStack>
                                </Flex>
                                <IconButton 
                                    icon={expandedCards.includes(cat.id) ? <ChevronUp /> : <ChevronDown />} 
                                    size="sm" 
                                    variant="ghost"
                                    aria-label="Toggle"
                                    display={{ base: "none", sm: "flex" }}
                                />
                            </Flex>
                        </CardHeader>
                        <Collapse in={expandedCards.includes(cat.id)}>
                            <CardBody p={0} bg="white">
                                <Box overflowX="auto">
                                    <Table variant="simple" size="sm">
                                    <Tbody>
                                        {cat.endpoints.map((ep, idx) => {
                                            const epKey = `${cat.id}-${ep.name}`;
                                            const hasResult = apiResults[epKey];
                                            const isLoading = loadingMap[epKey];
                                            
                                            return (
                                                <React.Fragment key={idx}>
                                                    <Tr _hover={{ bg: "gray.50" }} transition="all 0.2s">
                                                        <Td minW="200px">
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
                                                                {ep.name === 'Upload Firmware (ZIP)' ? (
                                                                    <FotaParameterManager 
                                                                        params={params} 
                                                                        setParams={setParams} 
                                                                        ep={ep} 
                                                                        handleFileParamChange={handleFileParamChange} 
                                                                    />
                                                                ) : (
                                                                    <Wrap spacing={3} flex={1} py={2}>
                                                                    {ep.params?.map(paramKey => (
                                                                        <Tooltip key={paramKey} label={`Edit ${paramKey}`} placement="top">
                                                                            <VStack align="flex-start" spacing={0}>
                                                                                <Text fontSize="9px" color="gray.400" fontWeight="bold" ml={1} mb={1}>{paramKey.toUpperCase()}</Text>
                                                                                {((ep.isJSON && (paramKey === 'fileDetails' || paramKey === 'payload' || paramKey === 'data')) || paramKey.toLowerCase().includes('json')) ? (
                                                                                    <Textarea 
                                                                                        placeholder={paramKey}
                                                                                        value={params[paramKey] || ''}
                                                                                        onChange={(e) => setParams(prev => ({ ...prev, [paramKey]: e.target.value }))}
                                                                                        size="xs"
                                                                                        width={{ base: "full", md: "400px" }}
                                                                                        minW={{ base: "250px", md: "400px" }}
                                                                                        minH="150px"
                                                                                        bg="white"
                                                                                        borderColor="gray.200"
                                                                                        _focus={{ borderColor: "purple.400" }}
                                                                                        fontSize="10px"
                                                                                        fontFamily="monospace"
                                                                                    />
                                                                                ) : (ep.isFile || ep.isMultiFile || paramKey === 'files' || paramKey === 'file') ? (
                                                                                    <VStack align="flex-start" spacing={1}>
                                                                                        <Box position="relative" width="200px">
                                                                                            <Input 
                                                                                                type="file"
                                                                                                multiple={ep.isMultiFile}
                                                                                                opacity={0}
                                                                                                position="absolute"
                                                                                                top={0}
                                                                                                left={0}
                                                                                                width="100%"
                                                                                                height="100%"
                                                                                                zIndex={2}
                                                                                                cursor="pointer"
                                                                                                onChange={(e) => handleFileParamChange(e, ep, paramKey)}
                                                                                            />
                                                                                            <Button 
                                                                                                size="xs" 
                                                                                                width="full" 
                                                                                                variant="outline" 
                                                                                                leftIcon={<UploadCloud size={14} />}
                                                                                                borderColor="gray.300"
                                                                                                color="gray.600"
                                                                                                _hover={{ bg: "gray.50" }}
                                                                                            >
                                                                                                {params[paramKey] 
                                                                                                    ? (ep.isMultiFile 
                                                                                                        ? `${params[paramKey].length} files selected` 
                                                                                                        : params[paramKey].name.substring(0, 15) + '...') 
                                                                                                    : 'Choose File(s)'}
                                                                                            </Button>
                                                                                        </Box>
                                                                                        {params[paramKey] && !ep.isMultiFile && (
                                                                                            <Text fontSize="10px" color="blue.500" fontWeight="bold">
                                                                                                {params[paramKey].name}
                                                                                            </Text>
                                                                                        )}
                                                                                    </VStack>
                                                                                ) : (
                                                                                    <Input 
                                                                                        placeholder={paramKey}
                                                                                        value={params[paramKey] || ''}
                                                                                        onChange={(e) => setParams(prev => ({ ...prev, [paramKey]: e.target.value }))}
                                                                                        size="xs"
                                                                                        width={paramKey === 'commandName' || paramKey === 'csr' ? "250px" : "120px"}
                                                                                        bg="white"
                                                                                        borderRadius="md"
                                                                                        borderColor="gray.200"
                                                                                        _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                                                                                        fontSize="10px"
                                                                                    />
                                                                                )}
                                                                            </VStack>
                                                                        </Tooltip>
                                                                    ))}
                                                                    <Button 
                                                                        onClick={() => handleExecute(cat, ep)}
                                                                        isLoading={isLoading}
                                                                        loadingText="Executing"
                                                                        leftIcon={<Play size={10} />}
                                                                        size="xs"
                                                                        colorScheme="blue"
                                                                        variant="solid"
                                                                        minW="80px"
                                                                        borderRadius="md"
                                                                        ml="auto"
                                                                        transition="all 0.2s"
                                                                        _hover={{ transform: "scale(1.05)", shadow: "md" }}
                                                                    >
                                                                        Execute
                                                                    </Button>
                                                                    </Wrap>
                                                                )}
                                                                {hasResult && (
                                                                    <Badge 
                                                                        colorScheme={hasResult.error ? 'red' : 'green'} 
                                                                        variant="outline"
                                                                        fontSize="9px"
                                                                        ml={2}
                                                                    >
                                                                        {hasResult.error ? 'FAILED' : 'SUCCESS'}
                                                                    </Badge>
                                                                )}
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
                            </Box>
                        </CardBody>
                        </Collapse>
                    </Card>
                ))}
            </VStack>
            
            <Box h="100px" />

            {/* Contextual Help Modal */}
            <HelpModal 
                isOpen={isHelpOpen} 
                onClose={onHelpClose} 
                categoryId={activeHelpCategory} 
            />
        </Box>
    );
};

export default SystemConsolePage;



// import React, { useState, useEffect, useRef } from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios';
// import {
//     Box,
//     Flex,
//     VStack,
//     HStack,
//     Heading,
//     Text,
//     Button,
//     Card,
//     CardHeader,
//     CardBody,
//     Icon,
//     SimpleGrid,
//     Input,
//     Badge,
//     Collapse,
//     IconButton,
//     useToast,
//     Divider,
//     Code,
//     Tag,
//     Select,
//     Table,
//     Tbody,
//     Thead,
//     Tr,
//     Th,
//     Td,
//     Tabs,
//     TabList,
//     TabPanels,
//     Tab,
//     TabPanel,
//     Tooltip,
// } from '@chakra-ui/react';
// import { 
//     Terminal, 
//     Play, 
//     ChevronDown, 
//     ChevronUp, 
//     Database, 
//     Wifi, 
//     Shield, 
//     Activity, 
//     Cloud, 
//     Map, 
//     Bell,
//     Settings,
//     User,
//     LogOut,
//     Trash2,
//     Download,
//     UploadCloud,
//     ShieldCheck
// } from 'lucide-react';
// import { TraxoApi } from '../../utils/TraxoApi';

// const API_CATEGORIES = [
//     {
//         id: 'auth',
//         name: 'Authentication',
//         icon: User,
//         color: 'blue.500',
//         endpoints: [
//             { name: 'Login (PRIMARY)', method: 'POST', handler: () => TraxoApi.login('PRIMARY') },
//             { name: 'Login (JEEP)', method: 'POST', handler: () => TraxoApi.login('JEEP') },
//             { name: 'Logout', method: 'POST', handler: () => TraxoApi.logout() },
//         ]
//     },
//     {
//         id: 'security',
//         name: 'Security & Certification',
//         icon: ShieldCheck,
//         color: 'cyan.500',
//         endpoints: [
//             { name: 'Login (PKI)', method: 'POST', handler: () => TraxoApi.login('PKI') },
//             { name: 'Create Common Certificate', method: 'POST', handler: (vin, params) => TraxoApi.createCommonCertificate(params.commonName || 'CVIP-STLA-JEEP-PingVerification', params.csr || 'MII...') },
//             { name: 'Create Tbox Certificate', method: 'POST', handler: (vin, params) => TraxoApi.createTboxCertificate(params.commonName || `${vin}-Tbox`, params.csr || 'MII...') },
//         ]
//     },
//     {
//         id: 'remote',
//         name: 'Remote Commands',
//         icon: Wifi,
//         color: 'orange.500',
//         endpoints: [
//             { name: 'Lock', method: 'POST', handler: (vin) => TraxoApi.lockDoor(vin) },
//             { name: 'Unlock', method: 'POST', handler: (vin) => TraxoApi.unlockDoor(vin) },
//             { name: 'Honk', method: 'POST', handler: (vin) => TraxoApi.honk(vin) },
//             { name: 'Blinker ON', method: 'POST', handler: (vin) => TraxoApi.blinkerOn(vin) },
//             { name: 'Blinker OFF', method: 'POST', handler: (vin) => TraxoApi.blinkerOff(vin) },
//         ]
//     },
//     {
//         id: 'trips',
//         name: 'Trip Management',
//         icon: Map,
//         color: 'green.500',
//         endpoints: [
//             { name: 'Ongoing Trip', method: 'GET', handler: (vin) => TraxoApi.getOngoingTrip(vin) },
//             { name: 'Trip History (Paginated)', method: 'GET', handler: (vin) => TraxoApi.getTripDetailsWithPagination(vin, 0) },
//         ]
//     },
//     {
//         id: 'fota',
//         name: 'FOTA Management',
//         icon: Cloud,
//         color: 'purple.500',
//         endpoints: [
//             { name: 'Check Uploaded Version', method: 'GET', handler: (vin, params) => TraxoApi.checkUploadedFirmware(params.version || '2314.0') },
//             { name: 'Trigger FOTA Trigger (VIN)', method: 'POST', handler: (vin, params) => TraxoApi.triggerFirmwareDownload(vin, params.version || '2314.0') },
//             { name: 'Trigger FOTA Execute', method: 'POST', handler: (vin, params) => TraxoApi.triggerFotaUpdate(vin, params.version || '2314.0') },
//             { name: 'Check Command Validity', method: 'GET', handler: (vin, params) => TraxoApi.getCommandValidity(params.commandId || '') },
//             { name: 'Reset FOTA State', method: 'PUT', handler: (vin) => TraxoApi.resetFotaState(vin) },
//             { name: 'Download Firmware File', method: 'GET', handler: (vin, params) => TraxoApi.downloadFirmwareFile(params.category || 'Tbox', params.version || '2314.0'), isBlob: true },
//             { name: 'Delete Firmware', method: 'DELETE', handler: (vin, params) => TraxoApi.deleteFirmware(params.category || 'Tbox', params.version || '2314.0') },
//         ]
//     },
//     {
//         id: 'lifecycle',
//         name: 'Device Lifecycle',
//         icon: Settings,
//         color: 'red.500',
//         endpoints: [
//             { name: 'Inittion Command', method: 'POST', handler: (vin) => TraxoApi.updateTboxState(vin, 'AUTHORIZED') },
//             { name: 'Portal Device State', method: 'GET', handler: (vin) => TraxoApi.getPortalDeviceState(vin) },
//             { name: 'AWS Global Reset', method: 'POST', handler: (vin) => TraxoApi.resetDeviceStateAWS(vin) },
//         ]
//     },
//     {
//         id: 'discovery',
//         name: 'Inventory & Discovery',
//         icon: Database,
//         color: 'teal.500',
//         endpoints: [
//             { name: 'Login (FACTORY)', method: 'POST', handler: () => TraxoApi.login('FACTORY') },
//             { name: 'List All Devices', method: 'GET', handler: () => TraxoApi.getDevices() },
//             { name: 'Search Portal (Pattern)', method: 'GET', handler: (vin, params) => TraxoApi.portalSearch(params.pattern || vin, 'vin') },
//         ]
//     },
//     {
//         id: 'telematics',
//         name: 'Telematics & Performance',
//         icon: Activity,
//         color: 'yellow.500',
//         endpoints: [
//             { name: 'Vehicle Telemetry (Step 1)', method: 'GET', handler: (vin, params) => TraxoApi.getCanMessages(params.deviceType || 'cc-21') },
//             { name: 'Vehicle Telemetry (Step 2)', method: 'GET', handler: (vin, params) => TraxoApi.getCanSignals(params.messageId || 'B6') },
//             { name: 'Get Telemetry Data', method: 'GET', handler: (vin, params) => TraxoApi.getVehicleTelemetryData(vin, params.signalName || 'VITV') },
//             { name: 'Location Telemetry (RAW)', method: 'GET', handler: (vin) => TraxoApi.getLocationTelemetryArray(vin) },
//             { name: 'Set Speed Alert', method: 'POST', handler: (vin, params) => TraxoApi.setSpeedAlert(vin, params.speed || 80) },
//         ]
//     },
//     {
//         id: 'audit',
//         name: 'Audit & Diagnostic',
//         icon: Activity,
//         color: 'gray.500',
//         endpoints: [
//             { name: 'Login (RUN)', method: 'POST', handler: () => TraxoApi.login('RUN') },
//             { name: 'Jeep Events Audit', method: 'GET', handler: (vin) => TraxoApi.getJeepEventsAudit(vin) },
//             { name: 'Device State Audit', method: 'GET', handler: (vin) => TraxoApi.getDeviceState(vin) },
//             { name: 'Command History (JEEP)', method: 'GET', handler: (vin) => TraxoApi.getCommandHistory(vin) },
//             { name: 'Alert Ingestion Audit', method: 'GET', handler: (vin) => TraxoApi.getAlertIngestion(vin) },
//             { name: 'List Log Files', method: 'GET', handler: (vin) => TraxoApi.listLogFiles(vin) },
//             { name: 'Trigger Log Fetch', method: 'POST', handler: (vin) => TraxoApi.fetchDeviceLogs(vin) },
//         ]
//     }
// ];

// const ResultExplorer = ({ result, epKey, onClear }) => {
//     if (!result) return null;

//     const { request, response, error, duration } = result;
//     const isSuccess = !error && response && response.status < 400;

//     return (
//         <Box bg="#0f1115" borderRadius="xl" border="1px solid" borderColor="gray.800" overflow="hidden" my={2} shadow="2xl">
//             {/* Status Bar */}
//             <Flex bg="#1a1d23" p={3} align="center" justify="space-between" borderBottom="1px solid" borderColor="gray.800">
//                 <HStack spacing={4}>
//                     <HStack>
//                         <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">STATUS:</Text>
//                         <Badge colorScheme={isSuccess ? 'green' : 'red'} variant="solid" fontSize="10px">
//                             {response?.status || 'ERROR'} {response?.statusText || (error ? 'FAILED' : '')}
//                         </Badge>
//                     </HStack>
//                     <HStack>
//                         <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">TIME:</Text>
//                         <Text fontSize="10px" color="green.300" fontWeight="bold">{duration ? `${duration}ms` : '--'}</Text>
//                     </HStack>
//                     <HStack>
//                         <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">SIZE:</Text>
//                         <Text fontSize="10px" color="blue.300" fontWeight="bold">
//                             {response?.data ? `${(JSON.stringify(response.data).length / 1024).toFixed(2)} KB` : '0 KB'}
//                         </Text>
//                     </HStack>
//                 </HStack>
//                 <IconButton 
//                     icon={<Trash2 size={14} />} 
//                     size="xs" 
//                     colorScheme="red" 
//                     variant="ghost" 
//                     onClick={onClear}
//                     title="Clear Result"
//                 />
//             </Flex>

//             <Tabs variant="enclosed" size="sm" colorScheme="blue">
//                 <TabList px={4} borderBottom="1px solid" borderColor="gray.800" bg="#14171c">
//                     <Tab color="gray.400" _selected={{ color: 'white', bg: '#0f1115', borderBottomColor: '#0f1115' }} fontSize="10px" fontWeight="bold">RESPONSE BODY</Tab>
//                     <Tab color="gray.400" _selected={{ color: 'white', bg: '#0f1115', borderBottomColor: '#0f1115' }} fontSize="10px" fontWeight="bold">REQUEST DETAILS</Tab>
//                     <Tab color="gray.400" _selected={{ color: 'white', bg: '#0f1115', borderBottomColor: '#0f1115' }} fontSize="10px" fontWeight="bold">HEADERS</Tab>
//                 </TabList>

//                 <TabPanels>
//                     {/* Response Body */}
//                     <TabPanel p={0}>
//                         <Box p={4} maxH="500px" overflowY="auto" bg="#0f1115">
//                             {response?.data ? (
//                                 <Code display="block" whiteSpace="pre" bg="transparent" color="green.300" fontSize="xs">
//                                     {JSON.stringify(response.data, null, 2)}
//                                 </Code>
//                             ) : error ? (
//                                 <Box p={4} borderRadius="md" bg="red.900" border="1px solid" borderColor="red.500">
//                                     <Text color="red.200" fontSize="xs" fontWeight="bold">Execution Error:</Text>
//                                     <Text color="red.100" fontSize="xs" mt={1}>{error}</Text>
//                                 </Box>
//                             ) : (
//                                 <Text color="gray.500" fontSize="xs" fontStyle="italic">No response data available</Text>
//                             )}
//                         </Box>
//                     </TabPanel>

//                     {/* Request Details */}
//                     <TabPanel p={4}>
//                         <VStack align="stretch" spacing={4}>
//                             <Box>
//                                 <Text fontSize="10px" color="gray.500" fontWeight="black" mb={2} letterSpacing="1px">ENDPOINT</Text>
//                                 <HStack bg="gray.800" p={2} borderRadius="md">
//                                     <Badge colorScheme="purple">{request?.method || 'UNKNOWN'}</Badge>
//                                     <Text color="white" fontSize="xs" wordBreak="break-all">{request?.url || 'URL Not Captured'}</Text>
//                                 </HStack>
//                             </Box>
//                             {request?.data && (
//                                 <Box>
//                                     <Text fontSize="10px" color="gray.500" fontWeight="black" mb={2} letterSpacing="1px">PAYLOAD</Text>
//                                     <Code display="block" p={3} borderRadius="md" bg="gray.800" color="orange.200" fontSize="xs" whiteSpace="pre">
//                                         {JSON.stringify(request.data, null, 2)}
//                                     </Code>
//                                 </Box>
//                             )}
//                         </VStack>
//                     </TabPanel>

//                     {/* Headers */}
//                     <TabPanel p={0}>
//                         <Table size="sm" variant="simple">
//                             <Thead bg="gray.800">
//                                 <Tr>
//                                     <Th color="gray.500" fontSize="9px">TYPE</Th>
//                                     <Th color="gray.500" fontSize="9px">HEADER</Th>
//                                     <Th color="gray.500" fontSize="9px">VALUE</Th>
//                                 </Tr>
//                             </Thead>
//                             <Tbody fontSize="xs">
//                                 {response?.headers && Object.entries(response.headers).map(([key, value]) => (
//                                     <Tr key={key} borderColor="gray.800">
//                                         <Td><Badge size="xs" colorScheme="blue">RES</Badge></Td>
//                                         <Td color="gray.400" fontWeight="bold">{key}</Td>
//                                         <Td color="gray.300" wordBreak="break-all">{String(value)}</Td>
//                                     </Tr>
//                                 ))}
//                             </Tbody>
//                         </Table>
//                     </TabPanel>
//                 </TabPanels>
//             </Tabs>
//         </Box>
//     );
// };

// const SystemConsolePage = () => {
//     const { vin: urlVin } = useParams();
//     const [globalVin, setGlobalVin] = useState(urlVin || localStorage.getItem('last_vin') || 'MCANJREB1MFA65412');
//     const [params, setParams] = useState({ 
//         version: '2314.0', 
//         category: 'Tbox', 
//         commandId: '',
//         pattern: 'MCANJREB1MFA',
//         deviceType: 'cc-21',
//         messageId: 'B6',
//         signalName: 'VITV',
//         speed: '80'
//     });
//     const [expandedCards, setExpandedCards] = useState(['auth', 'remote', 'fota']);
//     const [apiResults, setApiResults] = useState({});
//     const [loadingMap, setLoadingMap] = useState({});
//     const lastRequestRef = useRef(null);
//     const lastResponseRef = useRef(null);
//     const toast = useToast();

//     // Setup axios interceptor to capture the the exact request/response made by TraxoApi
//     useEffect(() => {
//         const reqInterceptor = axios.interceptors.request.use((config) => {
//             config.metadata = { startTime: new Date() };
//             lastRequestRef.current = {
//                 method: config.method.toUpperCase(),
//                 url: config.url,
//                 data: config.data,
//                 headers: config.headers
//             };
//             return config;
//         });

//         const resInterceptor = axios.interceptors.response.use(
//             (response) => {
//                 const duration = new Date() - response.config.metadata.startTime;
//                 response.duration = duration;
//                 lastResponseRef.current = {
//                     status: response.status,
//                     statusText: response.statusText,
//                     data: response.data,
//                     headers: response.headers
//                 };
//                 return response;
//             },
//             (error) => {
//                 if (error.config?.metadata) {
//                     error.duration = new Date() - error.config.metadata.startTime;
//                 }
//                 lastResponseRef.current = error.response ? {
//                     status: error.response.status,
//                     statusText: error.response.statusText,
//                     data: error.response.data,
//                     headers: error.response.headers
//                 } : null;
//                 return Promise.reject(error);
//             }
//         );

//         return () => {
//             axios.interceptors.request.eject(reqInterceptor);
//             axios.interceptors.response.eject(resInterceptor);
//         };
//     }, []);

//     useEffect(() => {
//         if (globalVin) {
//             localStorage.setItem('last_vin', globalVin);
//             const patterns = globalVin.substring(0, 12);
//             setParams(prev => ({ ...prev, pattern: patterns }));
//         }
//     }, [globalVin]);

//     const toggleCard = (id) => {
//         setExpandedCards(prev => 
//             prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
//         );
//     };

//     const handleExecute = async (category, endpoint) => {
//         const key = `${category.id}-${endpoint.name}`;
//         setLoadingMap(prev => ({ ...prev, [key]: true }));
        
//         // Detailed timing and capture
//         const startTime = Date.now();
        
//         try {
//             console.log(`🚀 Executing ${endpoint.name}...`);
            
//             // We need to trigger the login or API call
//             // The interceptor will capture the details in lastRequestRef
//             const result = await endpoint.handler(globalVin, params);
//             const endTime = Date.now();
            
//             // The interceptor captured the real response details
//             const lastRes = lastResponseRef.current;
            
//             setApiResults(prev => ({ 
//                 ...prev, 
//                 [key]: { 
//                     request: lastRequestRef.current,
//                     response: lastRes ? {
//                         status: lastRes.status,
//                         statusText: lastRes.statusText,
//                         data: lastRes.data, // Show raw data from server in console
//                         headers: lastRes.headers
//                     } : {
//                         status: 200,
//                         statusText: 'OK',
//                         data: result,
//                         headers: {}
//                     },
//                     duration: endTime - startTime
//                 } 
//             }));

//             if (endpoint.isBlob) {
//                 const blob = new Blob([result]);
//                 const url = window.URL.createObjectURL(blob);
//                 const a = document.createElement('a');
//                 a.href = url;
//                 a.download = `firmware_${params.version || 'latest'}.bin`;
//                 document.body.appendChild(a);
//                 a.click();
//                 window.URL.revokeObjectURL(url);
//             }
            
//             toast({
//                 title: 'Execution Success',
//                 description: endpoint.name,
//                 status: 'success',
//                 duration: 2000,
//                 position: 'bottom-right'
//             });
//         } catch (error) {
//             console.error(`❌ ${endpoint.name} Failed:`, error);
//             const endTime = Date.now();
            
//             setApiResults(prev => ({ 
//                 ...prev, 
//                 [key]: { 
//                     request: lastRequestRef.current || { method: endpoint.method, url: 'Unknown' },
//                     response: error.response ? {
//                         status: error.response.status,
//                         statusText: error.response.statusText,
//                         data: error.response.data,
//                         headers: error.response.headers
//                     } : null,
//                     error: error.message,
//                     duration: endTime - startTime
//                 } 
//             }));
            
//             toast({
//                 title: 'Execution Failed',
//                 description: error.message,
//                 status: 'error',
//                 duration: 4000,
//                 position: 'bottom-right'
//             });
//         } finally {
//             setLoadingMap(prev => ({ ...prev, [key]: false }));
//         }
//     };

//     const handleFetchAll = async () => {
//         if (!globalVin) {
//             toast({ title: 'Please enter a VIN', status: 'warning' });
//             return;
//         }
        
//         // Just save and confirm, don't execute everything automatically
//         localStorage.setItem('last_vin', globalVin);
//         toast({ 
//             title: 'VIN Updated', 
//             description: `Ready to run diagnostics for ${globalVin}`, 
//             status: 'success', 
//             duration: 2000,
//             position: 'top'
//         });
//     };

//     return (
//         <Box p={6} bg="gray.50" minH="100vh">
//             {/* Variables Header */}
//             <Card mb={8} shadow="lg" borderRadius="2xl" border="1px solid" borderColor="blue.100" bg="white">
//                 <CardBody p={6}>
//                     <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
//                         <VStack align="flex-start" spacing={3} flex={1}>
//                             <HStack><Icon as={Terminal} color="blue.500" /><Text fontWeight="black" fontSize="xs" color="gray.500" letterSpacing="widest">DIAGNOSTIC DASHBOARD</Text></HStack>
//                             <HStack w="full" spacing={4}>
//                                 <Input 
//                                     placeholder="Enter Target VIN" 
//                                     value={globalVin} 
//                                     onChange={(e) => setGlobalVin(e.target.value)}
//                                     size="lg"
//                                     bg="gray.50"
//                                     width="450px"
//                                     fontWeight="bold"
//                                     variant="filled"
//                                     _focus={{ borderColor: "blue.500", bg: "white", boxShadow: "0 0 0 1px #3182ce" }}
//                                     borderRadius="xl"
//                                 />
//                                 <Button 
//                                     colorScheme="blue" 
//                                     size="lg" 
//                                     px={10} 
//                                     borderRadius="xl" 
//                                     leftIcon={<Play size={16} />}
//                                     onClick={handleFetchAll}
//                                     boxShadow="0 4px 12px rgba(49, 130, 206, 0.3)"
//                                     _hover={{ transform: "translateY(-1px)", boxShadow: "0 6px 16px rgba(49, 130, 206, 0.4)" }}
//                                     _active={{ transform: "translateY(0)" }}
//                                 >
//                                     Submit
//                                 </Button>
//                             </HStack>
//                         </VStack>

//                         <HStack spacing={4}>
//                             <Badge colorScheme="blue" p={2} borderRadius="lg" fontSize="10px">READY FOR DIAGNOSTICS</Badge>
//                             <Tag size="lg" colorScheme="purple" variant="subtle" borderRadius="full">
//                                 <Icon as={Shield} mr={2} /> Preprod Environment
//                             </Tag>
//                         </HStack>
//                     </Flex>
//                 </CardBody>
//             </Card>

//             <VStack spacing={6} align="stretch">
//                 {API_CATEGORIES.map((cat) => (
//                     <Card key={cat.id} variant="outline" shadow="sm" borderRadius="xl" overflow="hidden">
//                         <CardHeader 
//                             bg="white" 
//                             py={3} 
//                             px={5} 
//                             cursor="pointer"
//                             onClick={() => toggleCard(cat.id)}
//                             borderBottom="1px solid"
//                             borderColor="gray.100"
//                         >
//                             <HStack justify="space-between">
//                                 <HStack spacing={3}>
//                                     <Box p={2} bg={`${cat.color.split('.')[0]}.50`} borderRadius="lg">
//                                         <Icon as={cat.icon} color={cat.color} boxSize={5} />
//                                     </Box>
//                                     <VStack align="flex-start" spacing={0}>
//                                         <Heading size="sm">{cat.name}</Heading>
//                                         <Text fontSize="2xs" color="gray.400" fontWeight="bold">{cat.endpoints.length} Endpoints Integrated</Text>
//                                     </VStack>
//                                 </HStack>
//                                 <IconButton 
//                                     icon={expandedCards.includes(cat.id) ? <ChevronUp /> : <ChevronDown />} 
//                                     size="sm" 
//                                     variant="ghost"
//                                     aria-label="Toggle"
//                                 />
//                             </HStack>
//                         </CardHeader>
//                         <Collapse in={expandedCards.includes(cat.id)}>
//                             <CardBody p={0} bg="white">
//                                 <Table variant="simple">
//                                     <Tbody>
//                                         {cat.endpoints.map((ep, idx) => {
//                                             const epKey = `${cat.id}-${ep.name}`;
//                                             const hasResult = apiResults[epKey];
//                                             const isLoading = loadingMap[epKey];
                                            
//                                             return (
//                                                 <React.Fragment key={idx}>
//                                                     <Tr _hover={{ bg: "gray.50" }} transition="all 0.2s">
//                                                         <Td width="250px">
//                                                             <HStack>
//                                                                 <Badge 
//                                                                     colorScheme={
//                                                                         ep.method === 'POST' ? 'orange' : 
//                                                                         ep.method === 'GET' ? 'blue' : 'red'
//                                                                     } 
//                                                                     fontSize="9px"
//                                                                 >
//                                                                     {ep.method}
//                                                                 </Badge>
//                                                                 <Text fontSize="sm" fontWeight="600">{ep.name}</Text>
//                                                             </HStack>
//                                                         </Td>
//                                                         <Td>
//                                                             <Flex align="center" gap={4}>
//                                                                 <Button 
//                                                                     onClick={() => handleExecute(cat, ep)}
//                                                                     isLoading={isLoading}
//                                                                     loadingText="Executing"
//                                                                     leftIcon={<Play size={12} />}
//                                                                     size="xs"
//                                                                     colorScheme="blue"
//                                                                     variant="solid"
//                                                                     minW="100px"
//                                                                     borderRadius="md"
//                                                                 >
//                                                                     Execute
//                                                                 </Button>
//                                                                 {hasResult && (
//                                                                     <Badge 
//                                                                         colorScheme={hasResult.error ? 'red' : 'green'} 
//                                                                         variant="outline"
//                                                                         fontSize="9px"
//                                                                     >
//                                                                         {hasResult.error ? 'FAILED' : 'SUCCESS'}
//                                                                     </Badge>
//                                                                 )}
//                                                             </Flex>
//                                                         </Td>
//                                                     </Tr>
//                                                     {hasResult && (
//                                                         <Tr bg="gray.900">
//                                                             <Td colSpan={2} p={0}>
//                                                                 <ResultExplorer 
//                                                                     result={hasResult} 
//                                                                     epKey={epKey} 
//                                                                     onClear={() => {
//                                                                         const newResults = {...apiResults};
//                                                                         delete newResults[epKey];
//                                                                         setApiResults(newResults);
//                                                                     }} 
//                                                                 />
//                                                             </Td>
//                                                         </Tr>
//                                                     )}
//                                                 </React.Fragment>
//                                             );
//                                         })}
//                                     </Tbody>
//                                 </Table>
//                             </CardBody>
//                         </Collapse>
//                     </Card>
//                 ))}
//             </VStack>
            
//             <Box h="100px" />
//         </Box>
//     );
// };

// export default SystemConsolePage;
