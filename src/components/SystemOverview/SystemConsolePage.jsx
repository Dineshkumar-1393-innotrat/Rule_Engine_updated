

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
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
    Spinner,
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
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverArrow,
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
import { isValidVin, formatVin } from '../../utils/validation';

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
            { name: 'Login (JEEP)', method: 'POST', handler: () => TraxoApi.login('JEEP') },
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
                handler: (vin, p) => TraxoApi.getTripAudit(vin, p.subcategory || 'tripCurrent'),
                params: ['subcategory']
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
            {
                name: 'Command Status (JEEP)',
                method: 'GET',
                handler: (vin, p) => TraxoApi.getCommandStatus(vin, p.commandId),
                params: ['commandId']
            },
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
                name: 'Check Inventory (4.0)',
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
                        const files = [];
                        if (p.mcuFile) files.push(p.mcuFile);
                        if (p.nadFile) files.push(p.nadFile);
                        return TraxoApi.uploadFirmware(details, files);
                    } catch (e) {
                        throw new Error("Invalid fileDetails JSON. Please check the format.");
                    }
                },
                params: ['fileDetails'],
                isJSON: true,
                isMultiFile: true
            },
            {
                name: 'Download to Laptop',
                method: 'GET',
                // fotaId is OPTIONAL â€” leave blank to auto-detect from versions API,
                // or paste it manually from the Postman collection / Check Inventory response
                handler: (vin, p) => TraxoApi.downloadFirmwareFromRepo(p.category, p.version, p.fotaId || null),
                isBlob: false,
                params: ['category', 'version', 'fotaId']
            },
            {
                name: 'Delete Firmware (4.0)',
                method: 'DELETE',
                handler: (vin, p) => TraxoApi.deleteFirmware(p.category || 'BATCH', p.releaseVersion),
                params: ['category', 'releaseVersion']
            },
            {
                name: 'Download from DEVICE (4.0)',
                method: 'GET',
                handler: (vin, p) => TraxoApi.downloadFirmwareFile(p.filename, p.releaseVersion, p.fileType, p.category || 'BATCH', p.fotaId),
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
                handler: (vin, p) => TraxoApi.triggerFotaDownload(vin, p.version),
                params: ['version']
            },
            {
                name: 'FOTA Update (Execute)',
                method: 'POST',
                handler: (vin, p) => TraxoApi.triggerFotaExecution(vin, p.version),
                params: ['version']
            },
            {
                name: 'Check Command Status (VALIDITY)',
                method: 'GET',
                handler: (vin, p) => TraxoApi.getFotaCommandStatus(vin, p.commandId),
                params: ['commandId']
            },
            {
                name: 'Reset FOTA State (4.0)',
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
            { name: 'Login (RUN)', method: 'POST', handler: () => TraxoApi.login('RUN') },
            { name: 'List All Devices', method: 'GET', handler: () => TraxoApi.getDevices() },
            { name: 'Retrieve Specific VIN Details', method: 'GET', handler: (vin) => TraxoApi.getPortalDeviceState(vin) },
            { name: 'Vehicle Status (JEEP)', method: 'GET', handler: (vin) => TraxoApi.getVehicleStatus(vin) },
            {
                name: 'Portal Search (Advanced)',
                method: 'GET',
                handler: (vin, p) => TraxoApi.portalSearch(p.searchPattern || vin, p.searchKey || 'vin'),
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
            { name: 'Login (RUN)', method: 'POST', handler: () => TraxoApi.login('RUN') },
            {
                name: 'Vehicle Telemetry (Step 1)',
                method: 'GET',
                handler: (vin, p) => TraxoApi.getCanMessages(p.deviceType || 'jeep'),
                params: ['deviceType']
            },
            {
                name: 'Vehicle Telemetry (Step 2)',
                method: 'GET',
                handler: (vin, p) => TraxoApi.getCanSignals(p.messageId || '356'),
                params: ['messageId']
            },
            {
                name: 'Get Telemetry Data',
                method: 'GET',
                handler: (vin, p) => TraxoApi.getVehicleTelemetryData(vin, p.telemetrySignal || 'FuelLevel'),
                params: ['telemetrySignal']
            },
            {
                name: 'Location Telemetry (RAW)',
                method: 'GET',
                handler: (vin) => TraxoApi.getLocationTelemetryArray(vin)
            },
            {
                name: 'Location Telemetry (Time Range)',
                method: 'GET',
                handler: (vin, p) => TraxoApi.getHistoricalTelemetry(vin, p.startTime, p.endTime, p.count || 1000, 'LocationTelemetry'),
                params: ['startTime', 'endTime', 'count']
            },
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
            {
                name: 'Concurrent Command Status',
                method: 'GET',
                handler: (vin, p) => TraxoApi.getConcurrentCommandStatus(vin, p.commandId),
                params: ['commandId']
            },
            {
                name: 'Simulate Log Upload (TBOX)',
                method: 'POST',
                handler: (vin, p) => TraxoApi.simulateLogUpload(vin, p.file),
                params: ['file'],
                isFile: true
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
            "Login via 'Login (JEEP)' first using mobile user credentials.",
            "Use 'Ongoing Trip' to monitor real-time telemetry for an active session.",
            "Configure startTime and endTime to query 'Trip Summary' for historical analysis.",
            "Use 'Trip Details (Paginated)' with pageNo=0 to fetch granular past trip data.",
            "Use 'Trip by ID' with a specific tripId to retrieve a single trip's full data.",
            "Use 'Trip Audit (States)' with subcategory=tripCurrent or tripStart to audit raw trip state records."
        ],
        tips: "Ensure the vehicle has a clear GPS sky-view for accurate 'Ongoing Trip' data. Use subcategory 'tripCurrent' for active trip state and 'tripStart' for completed trips."
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
            "Login via 'Login (RUN)' for portal VIN lookup permissions.",
            "Use 'List All Devices' for a raw dump of the environment's fleet.",
            "Use 'Retrieve Specific VIN Details' to get portal state for the current VIN.",
            "Use 'Vehicle Status (JEEP)' to get live connectivity and telemetry status.",
            "Execute 'Portal Search (Advanced)' with a searchPattern and searchKey (e.g., 'vin') to locate devices."
        ],
        tips: "Vehicle Status uses the JEEP mobile API. Factory/Run tokens give access to platform-level device registry queries."
    },

    telematics: {
        title: "Telematics & Performance",
        steps: [
            "Login via 'Login (RUN)' for management-level telemetry access.",
            "Fetch CAN message descriptors using 'Vehicle Telemetry (Step 1)' (default: jeep/vehicleTelemetry).",
            "Identify signal IDs by running 'Vehicle Telemetry (Step 2)' with a messageId (e.g., 356).",
            "Use 'Get Telemetry Data' with a signalName (e.g., FuelLevel) to query live values.",
            "Use 'Location Telemetry (RAW)' for the latest location fix.",
            "Use 'Location Telemetry (Time Range)' with startTime, endTime (format: YYYY-MM-DD HH:mm:ss) and count to query history.",
            "Use 'Set Speed Alert' with speedLimit (numeric) to configure speed threshold commands."
        ],
        tips: "Signal names (e.g., FuelLevel, VehicleSpeed, ODO) must exactly match the DBC decoder specifications. Time range queries may return up to 'count' records."
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
        tips: "Device Join status is derived from the latest system-level MQTT connectivity heartbeat. NOTE: 403 Forbidden means the VIN is not linked to your current JEEP mobile account."
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
        const isForbidden = error.includes('403') || response?.status === 403;
        return (
            <Alert status="error" borderRadius="md" variant="subtle" py={4}>
                <AlertIcon />
                <Box>
                    <AlertTitle fontSize="sm">
                        {isForbidden ? 'Authorization Required' : 'Execution Failed'}
                    </AlertTitle>
                    <AlertDescription fontSize="xs">
                        {isForbidden 
                            ? "This VIN is not authorized for the current account. Please ensure you are logged into the correct JEEP account for this vehicle, or use an Admin/Factory endpoint for general status."
                            : error}
                    </AlertDescription>
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

    // Specialized Renderer: FOTA File Details (Check Inventory)
    const fotaData = Array.isArray(data) ? data[0] : data;
    if (fotaData && fotaData.fileDetails && Array.isArray(fotaData.fileDetails)) {
        const fileDetails = fotaData.fileDetails;
        const headers = ['fileName', 'fileType', 'releaseVersion', 'mcuVersion', 'nadVersion', 'filesize', 'rawChecksum'];
        return (
            <VStack align="stretch" spacing={4} p={2}>
                <HStack justify="space-between">
                    <Badge colorScheme="purple" p={2} borderRadius="md" variant="subtle" fontWeight="bold">
                        FOTA REPOSITORY INVENTORY
                    </Badge>
                    <Text fontSize="10px" color="gray.500" fontWeight="bold">TOTAL FILES: {fileDetails.length}</Text>
                </HStack>
                <Box overflowX="auto" border="1px solid" borderColor="gray.100" borderRadius="xl" shadow="sm">
                    <Table size="sm" variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                {headers.map(h => (
                                    <Th key={h} fontSize="10px" color="gray.500" py={3}>{h.toUpperCase()}</Th>
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {fileDetails.map((file, i) => (
                                <Tr key={i} _hover={{ bg: "purple.50" }}>
                                    {headers.map(h => (
                                        <Td key={h} fontSize="11px" color="gray.700" py={3}>
                                            {h === 'filesize' ? `${(file[h] / 1024).toFixed(2)} KB` :
                                                h === 'rawChecksum' ? (
                                                    <Tooltip label={file[h]} hasArrow>
                                                        <Text isTruncated maxW="100px" fontFamily="mono" fontSize="10px" cursor="help">
                                                            {file[h]}
                                                        </Text>
                                                    </Tooltip>
                                                ) :
                                                    h === 'fileType' ? (
                                                        <Badge size="xs" colorScheme={file[h] === 'mcu' ? 'orange' : 'teal'}>
                                                            {String(file[h]).toUpperCase()}
                                                        </Badge>
                                                    ) :
                                                        String(file[h] || 'N/A')}
                                        </Td>
                                    ))}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </VStack>
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

const FotaParameterManager = ({ params, setParams, ep, handleFirmwareSelection }) => {
    const [tabIndex, setTabIndex] = useState(0);

    const renderDropzone = (type, title, accept) => {
        const currentFile = type === 'mcu' ? params.mcuFile : params.nadFile;
        return (
            <VStack align="stretch" spacing={2} flex={1}>
                <Text fontSize="10px" fontWeight="black" color="gray.500" letterSpacing="1px">{title.toUpperCase()}</Text>
                <Box
                    h="120px"
                    border="2px dashed"
                    borderColor={currentFile ? "purple.400" : "gray.200"}
                    borderRadius="2xl"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    transition="0.2s"
                    position="relative"
                    bg={currentFile ? "purple.50" : "white"}
                    _hover={{ borderColor: 'purple.500', bg: 'purple.50' }}
                >
                    <Input
                        type="file"
                        accept={accept}
                        opacity={0}
                        position="absolute"
                        top={0} left={0} width="100%" height="100%" zIndex={2} cursor="pointer"
                        onChange={(e) => handleFirmwareSelection(e.target.files[0], type)}
                    />
                    <Icon as={UploadCloud} boxSize={6} color={currentFile ? "purple.500" : "gray.300"} mb={2} />
                    <Text fontWeight="bold" color="gray.600" fontSize="10px" textAlign="center" px={4}>
                        {currentFile ? currentFile.name : `Select ${title}`}
                    </Text>
                    {currentFile && <Badge size="xs" colorScheme="purple">{(currentFile.size / 1024 / 1024).toFixed(2)} MB</Badge>}
                </Box>
            </VStack>
        );
    };

    return (
        <Box width="full" maxW="1000px" my={2}>
            <Tabs variant="soft-rounded" colorScheme="purple" size="sm" index={tabIndex} onChange={setTabIndex}>
                <TabList bg="gray.50" p={2} borderRadius="xl" border="1px solid" borderColor="gray.100">
                    <Tab borderRadius="lg" fontWeight="black" px={8} fontSize="11px">
                        <HStack spacing={2}><UploadCloud size={14} /><Text>FIRMWARE BINARIES</Text></HStack>
                    </Tab>
                    <Tab borderRadius="lg" fontWeight="black" px={8} fontSize="11px">
                        <HStack spacing={2}><FileJson size={14} /><Text>METADATA JSON</Text></HStack>
                    </Tab>
                </TabList>

                <TabPanels mt={4}>
                    <TabPanel p={0}>
                        <VStack align="stretch" spacing={4}>
                            <Flex gap={4} direction={{ base: "column", md: "row" }}>
                                {renderDropzone('mcu', 'MCU File (.ulp, .zip)', '.ulp,.zip')}
                                {renderDropzone('nad', 'NAD File (.zip)', '.zip')}
                            </Flex>

                            {(params.mcuFile || params.nadFile) && (
                                <Alert status="success" size="sm" borderRadius="xl" variant="subtle" border="1px solid" borderColor="green.100">
                                    <AlertIcon />
                                    <Box>
                                        <AlertTitle fontSize="xs" fontWeight="black">Postman Sync Active</AlertTitle>
                                        <AlertDescription fontSize="10px">Checksums and versions are automatically populated in the Inline Editor tab.</AlertDescription>
                                    </Box>
                                </Alert>
                            )}
                        </VStack>
                    </TabPanel>

                    <TabPanel p={0}>
                        <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between" px={1}>
                                <Text fontSize="10px" color="gray.400" fontWeight="bold">GENERATED FILEDETAILS (JEEP 4.0 SCHEMA)</Text>
                                <Badge colorScheme="green" variant="solid" fontSize="9px">AUTO-SYNC ENABLED</Badge>
                            </HStack>
                            <Box borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.700" bg="gray.900" p={1}>
                                <Textarea
                                    value={params.fileDetails || ''}
                                    onChange={(e) => setParams(prev => ({ ...prev, fileDetails: e.target.value }))}
                                    size="xs" width="full" minH="380px" bg="transparent" color="green.300" border="none" fontSize="12px" fontFamily="monospace" p={4} className="custom-scrollbar"
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
        <Box bg="#0d1117" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden" my={4} shadow="2xl">
            <Flex bg="#161b22" p={3} align="center" justify="space-between" borderBottom="1px solid" borderColor="gray.800">
                <Flex wrap="wrap" gap={6} align="center">
                    <HStack>
                        <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">STATUS:</Text>
                        <Badge colorScheme={isSuccess ? 'green' : (response?.status === 204 ? 'blue' : 'red')} variant="solid" px={3} py={0.5} borderRadius="full" fontSize="10px">
                            {response?.status || (error ? 'FAILURE' : 'ERROR')} {response?.statusText || (error ? 'NETWORK_ERR' : '')}
                        </Badge>
                    </HStack>
                    <HStack spacing={1}>
                        <Clock size={12} color="#8b949e" />
                        <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">TIME:</Text>
                        <Text fontSize="10px" color="cyan.400" fontWeight="bold">{duration ? `${duration}ms` : '--'}</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Database size={12} color="#8b949e" />
                        <Text fontSize="10px" color="gray.500" fontWeight="black" letterSpacing="1px">SIZE:</Text>
                        <Text fontSize="10px" color="blue.400" fontWeight="bold">
                            {response?.data ? `${(JSON.stringify(response.data).length / 1024).toFixed(2)} KB` : '0 KB'}
                        </Text>
                    </HStack>
                </Flex>
                <HStack>
                    <Tooltip label="Copy Response" placement="top">
                        <IconButton
                            icon={<FileJson size={14} />}
                            size="xs"
                            variant="ghost"
                            color="gray.500"
                            _hover={{ color: "white", bg: "gray.700" }}
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(response?.data, null, 2));
                                // Could add a small "Copied" toast here if needed
                            }}
                        />
                    </Tooltip>
                    <Divider orientation="vertical" h="15px" borderColor="gray.700" />
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

            <Tabs variant="enclosed" size="sm" colorScheme="blue">
                <TabList px={4} borderBottom="1px solid" borderColor="gray.800" bg="#0d1117">
                    <Tab color="gray.500" _selected={{ color: 'white', bg: '#161b22', borderBottomColor: '#161b22' }} fontSize="10px" fontWeight="black" letterSpacing="1px">RESPONSE BODY</Tab>
                    <Tab color="gray.500" _selected={{ color: 'white', bg: '#161b22', borderBottomColor: '#161b22' }} fontSize="10px" fontWeight="black" letterSpacing="1px">HEADERS</Tab>
                    <Tab color="gray.500" _selected={{ color: 'white', bg: '#161b22', borderBottomColor: '#161b22' }} fontSize="10px" fontWeight="black" letterSpacing="1px">REQUEST</Tab>
                </TabList>

                <TabPanels bg="#0d1117">
                    {/* Response Body */}
                    <TabPanel p={0}>
                        <Box p={4} maxH="500px" overflowY="auto" className="custom-scrollbar" bg="#0d1117">
                            {response?.data ? (
                                <Code display="block" whiteSpace="pre" bg="#161b22" p={4} borderRadius="md" color="green.300" fontSize="xs" fontFamily="monospace" border="1px solid" borderColor="gray.800">
                                    {JSON.stringify(response.data, null, 2)}
                                </Code>
                            ) : error ? (
                                <Box p={4} borderRadius="md" bg="rgba(248, 81, 73, 0.1)" border="1px solid" borderColor="red.900">
                                    <HStack mb={2}><Icon as={Info} color="red.400" size={14} /><Text color="red.400" fontSize="xs" fontWeight="bold">EXECUTION ERROR</Text></HStack>
                                    <Text color="red.100" fontSize="xs" fontFamily="monospace" whiteSpace="pre-wrap">{error}</Text>
                                </Box>
                            ) : (
                                <Text color="gray.500" fontSize="xs" fontStyle="italic" p={4}>No response data available</Text>
                            )}
                        </Box>
                    </TabPanel>

                    {/* Headers */}
                    <TabPanel p={0}>
                        <VStack align="stretch" spacing={0} divider={<Divider borderColor="gray.800" />}>
                            {/* Request Headers Section */}
                            <Box>
                                <Box bg="#161b22" px={4} py={2} borderBottom="1px solid" borderColor="gray.800">
                                    <HStack spacing={2}>
                                        <Icon as={UploadCloud} size={12} color="blue.400" />
                                        <Text fontSize="10px" fontWeight="black" color="blue.300" letterSpacing="widest">REQUEST HEADERS</Text>
                                    </HStack>
                                </Box>
                                <Box overflowX="auto">
                                    <Table size="sm" variant="simple">
                                        <Tbody fontSize="xs">
                                            {request?.headers ? Object.entries(request.headers).map(([key, value]) => (
                                                <Tr key={key} borderColor="gray.800">
                                                    <Td color="gray.400" fontWeight="bold" borderBottom="1px solid" borderColor="#161b22" py={2} width="200px">{key}</Td>
                                                    <Td color="gray.300" borderBottom="1px solid" borderColor="#161b22" py={2} wordBreak="break-all" fontFamily="monospace">{String(value)}</Td>
                                                </Tr>
                                            )) : (
                                                <Tr><Td colSpan={2} color="gray.600" fontStyle="italic" py={4} textAlign="center">No request headers captured</Td></Tr>
                                            )}
                                        </Tbody>
                                    </Table>
                                </Box>
                            </Box>

                            {/* Response Headers Section */}
                            <Box>
                                <Box bg="#161b22" px={4} py={2} borderBottom="1px solid" borderColor="gray.800">
                                    <HStack spacing={2}>
                                        <Icon as={Download} size={12} color="green.400" />
                                        <Text fontSize="10px" fontWeight="black" color="green.300" letterSpacing="widest">RESPONSE HEADERS</Text>
                                    </HStack>
                                </Box>
                                <Box overflowX="auto">
                                    <Table size="sm" variant="simple">
                                        <Tbody fontSize="xs">
                                            {response?.headers ? Object.entries(response.headers).map(([key, value]) => (
                                                <Tr key={key} borderColor="gray.800">
                                                    <Td color="gray.400" fontWeight="bold" borderBottom="1px solid" borderColor="#161b22" py={2} width="200px">{key}</Td>
                                                    <Td color="gray.300" borderBottom="1px solid" borderColor="#161b22" py={2} wordBreak="break-all" fontFamily="monospace">{String(value)}</Td>
                                                </Tr>
                                            )) : (
                                                <Tr><Td colSpan={2} color="gray.600" fontStyle="italic" py={4} textAlign="center">No response headers available (Network Error or Filtered)</Td></Tr>
                                            )}
                                        </Tbody>
                                    </Table>
                                </Box>
                            </Box>
                        </VStack>
                    </TabPanel>

                    {/* Request Details */}
                    <TabPanel p={0} pt={4}>
                        <VStack align="stretch" spacing={4}>
                            <Box>
                                <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1} letterSpacing="1px">FULL REQUEST URL</Text>
                                <Box p={3} borderRadius="md" bg="rgba(0,0,0,0.3)" border="1px solid" borderColor="whiteAlpha.100">
                                    <Text color="blue.300" fontSize="xs" fontFamily="monospace" wordBreak="break-all">
                                        {request?.url}
                                        {request?.params && Object.keys(request.params).length > 0 && (
                                            <Text as="span" color="gray.400">
                                                ?{Object.entries(request.params).map(([k, v]) => `${k}=${v}`).join('&')}
                                            </Text>
                                        )}
                                    </Text>
                                </Box>
                            </Box>

                            {request?.params && Object.keys(request.params).length > 0 && (
                                <Box>
                                    <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1} letterSpacing="1px">QUERY PARAMETERS</Text>
                                    <Code p={3} borderRadius="md" bg="rgba(0,0,0,0.3)" color="green.300" width="100%" fontSize="xs">
                                        {JSON.stringify(request.params, null, 2)}
                                    </Code>
                                </Box>
                            )}

                            {request?.data && (
                                <Box>
                                    <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1} letterSpacing="1px">REQUEST BODY</Text>
                                    <Code p={3} borderRadius="md" bg="rgba(0,0,0,0.3)" color="purple.300" width="100%" fontSize="xs">
                                        {typeof request.data === 'string' ? request.data : JSON.stringify(request.data, null, 2)}
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
    const [globalVin, setGlobalVin] = useState(urlVin || '');
    const [params, setParams] = useState({
        version: '2314.0',
        category: 'BATCH',
        commandId: '',
        notificationId: '',
        imeiCsvContent: '356769705035673',
        tboxCsvContent: 'Dongle_SN,IMEI,MSISDN,ICCID,eUICCID,HW_part_number,NAD_SW_version,MCU_SW_version,encryptionKeyVersion,signingKeyVersion,plantManufacturingCountryCode,Plant_Manufactured_Date,countrycode,regioncode\nTraxo111,356741360421832,123456421893,12345678622181378993,12245246792131121892328278947923,68532321AA,ND0.00.51,MD0.00.03,1,1,1,123412218823,1,4',
        commandName: 'firmwaredownloadcommand',
        pattern: '',
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
    const [globalLoading, setGlobalLoading] = useState(false);

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

    const handleFileParamChange = (e, ep, paramKey) => {
        const selectedFiles = ep.isMultiFile ? Array.from(e.target.files) : e.target.files[0];
        setParams(prev => ({ ...prev, [paramKey]: selectedFiles }));
    };

    const handleFirmwareSelection = async (file, fileType) => {
        if (!file) return;

        // 1. Calculate Checksum
        const checksum = await TraxoApi.calculateSHA256(file);

        // 2. Extract Version (Pattern: ND0.01.07 or ND0_66_00)
        // Supports both underscore and dot notation
        const versionMatch = file.name.match(/(M|N)D[\d._]+/i);
        const version = versionMatch ? versionMatch[0].toUpperCase().replace(/[._]$/, '') : '';

        // 3. Update JSON Metadata
        setParams(prev => {
            let details = {};
            try {
                details = typeof prev.fileDetails === 'string' ? JSON.parse(prev.fileDetails) : prev.fileDetails;
            } catch (e) {
                details = { category: "BATCH", batches: { fileDetails: [] } };
            }

            // Ensure structure exists
            if (!details.batches) details.batches = {};
            if (!details.batches.fileDetails) details.batches.fileDetails = [];

            // Update version at top level
            if (fileType === 'mcu') {
                details.batches.mcuVersion = version;
                details.batches.compatibleMcuVersion = "176.0"; // Default per collection
            } else {
                details.batches.nadVersion = version;
                details.batches.compatibleNadVersion = "176.0"; // Default per collection
            }

            // Upsert file detail record
            const fileEntry = {
                fileType,
                fileName: file.name,
                rawChecksum: checksum,
                installType: "full",
                softwareSize: String(file.size),
                isGolden: true
            };

            const existingIdx = details.batches.fileDetails.findIndex(f => f.fileType === fileType);
            if (existingIdx >= 0) {
                details.batches.fileDetails[existingIdx] = fileEntry;
            } else {
                details.batches.fileDetails.push(fileEntry);
            }

            // Sync release version
            // Priority: 1. Four-digit number in filename (e.g. 8324) 2. Existing version variable 3. Derived from filename
            const releaseMatch = file.name.match(/\b\d{4}\b/);
            if (releaseMatch) {
                details.batches.releaseVersion = releaseMatch[0] + ".0";
            } else if (prev.version) {
                details.batches.releaseVersion = prev.version;
            } else if (fileType === 'nad' && version && version.includes('_')) {
                // Legacy fallback for ND0_66_00 pattern
                details.batches.releaseVersion = String(parseInt(version.split('_')[1]) * 10).split('.')[0] + ".0";
            }

            return {
                ...prev,
                [fileType === 'mcu' ? 'mcuFile' : 'nadFile']: file,
                fileDetails: JSON.stringify(details, null, 2)
            };
        });
    };

    const lastRequestRef = useRef(null);
    const lastResponseRef = useRef(null);
    const toast = useToast();

    // Setup axios interceptor to capture the the exact request/response made by TraxoApi
    useEffect(() => {
        const reqInterceptor = axios.interceptors.request.use((config) => {
            config.metadata = { startTime: new Date() };
            // Capture a plain object version of headers to ensure reliable rendering
            const capturedHeaders = {};
            if (config.headers) {
                Object.entries(config.headers).forEach(([k, v]) => {
                    if (k !== 'common' && k !== 'post' && k !== 'get' && k !== 'put' && k !== 'delete' && k !== 'patch') {
                        capturedHeaders[k] = v;
                    }
                });
            }

            lastRequestRef.current = {
                method: config.method.toUpperCase(),
                url: config.url,
                data: config.data,
                headers: capturedHeaders
            };
            return config;
        });

        const resInterceptor = axios.interceptors.response.use(
            (response) => {
                const duration = new Date() - response.config.metadata.startTime;
                response.duration = duration;

                // Ensure headers are handled as a plain object
                const resHeaders = response.headers instanceof Object ? { ...response.headers } : {};

                lastResponseRef.current = {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data,
                    headers: resHeaders
                };
                return response;
            },
            (error) => {
                if (error.config?.metadata) {
                    error.duration = new Date() - error.config.metadata.startTime;
                }

                // Capture headers even on error responses
                const errRes = error.response;
                lastResponseRef.current = errRes ? {
                    status: errRes.status,
                    statusText: errRes.statusText,
                    data: errRes.data,
                    headers: errRes.headers instanceof Object ? { ...errRes.headers } : {}
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
            setGlobalLoading(true);
            const timer = setTimeout(() => {
                setGlobalLoading(false);
                toast({
                    title: 'Diagnostics Initialized',
                    description: `Targeting VIN: ${globalVin}`,
                    status: 'success',
                    duration: 2000,
                    position: 'top'
                });
            }, 1200);

            localStorage.setItem('last_vin', globalVin);
            const patterns = globalVin.substring(0, 12);
            setParams(prev => ({ ...prev, pattern: patterns }));
            return () => clearTimeout(timer);
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

    const handleExecute = async (category, endpoint) => {
        const key = `${category.id}-${endpoint.name}`;

        // Safety guard: Don't execute if already loading for this endpoint
        if (loadingMap[key]) {
            console.warn(`[SystemConsole] Execution of ${endpoint.name} already in progress. Ignoring duplicate trigger.`);
            return;
        }

        console.group(`🚀 MANUAL EXECUTION: ${endpoint.name}`);
        console.log(`[${new Date().toLocaleTimeString()}] Triggered from System Console UI`);
        console.trace("Manual Trigger Trace"); // Verifies exactly where the call came from

        setLoadingMap(prev => ({ ...prev, [key]: true }));

        // Detailed timing and capture
        const startTime = Date.now();

        try {
            console.log(`🚀 Executing ${endpoint.name}... (Params:`, params, ')');

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
            console.groupEnd();
        }
    };
    const handleManualHelp = (e, categoryId) => {
        e.stopPropagation();
        setActiveHelpCategory(categoryId);
        onHelpOpen();
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
            <AnimatePresence>
                {globalLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            zIndex: 9999
                        }}
                    >
                        <VStack spacing={6}>
                            <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
                            <motion.div
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                            >
                                <VStack spacing={1}>
                                    <Text fontSize="xs" color="gray.700" textAlign="center" fontWeight="light">
                                        Good things are taking shape — thanks for your patience
                                    </Text>
                                    <Text fontSize="xs" fontWeight="bold" color="blue.500" fontFamily="monospace">TARGET: {globalVin}</Text>
                                </VStack>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <HStack spacing={2} bg="green.500" px={4} py={1} borderRadius="full">
                                    <Box w={2} h={2} borderRadius="full" bg="white" />
                                    <Text color="white" fontWeight="black" fontSize="10px" letterSpacing="1px">DETAILS FETCHED SUCCESSFULLY</Text>
                                </HStack>
                            </motion.div>
                            <Box w="240px" h="3px" bg="gray.100" borderRadius="full" overflow="hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.2, ease: "easeInOut" }}
                                    style={{ height: '100%', backgroundColor: '#48BB78' }}
                                />
                            </Box>
                        </VStack>
                    </motion.div>
                )}
            </AnimatePresence>
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
                                <Popover trigger="hover" placement="bottom-end" openDelay={200}>
                                    <PopoverTrigger>
                                        <Box cursor="help">
                                            <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="lg" fontSize="10px">
                                                READY FOR DIAGNOSTICS
                                            </Badge>
                                        </Box>
                                    </PopoverTrigger>
                                    <PopoverContent bg="white" borderColor="blue.100" shadow="xl" borderRadius="xl" p={0}>
                                        <PopoverArrow bg="white" />
                                        <PopoverHeader border="none" bg="blue.50" borderTopRadius="xl" py={2} px={4}>
                                            <HStack><Icon as={Info} color="blue.500" size={14} /><Text fontSize="xs" fontWeight="black" color="blue.700">FAQ: Status Logic</Text></HStack>
                                        </PopoverHeader>
                                        <PopoverBody py={3} px={4}>
                                            <VStack align="flex-start" spacing={2}>
                                                <Text fontSize="xs" color="gray.600"><b>What is this?</b> This status confirms that a valid VIN has been entered and the system is ready to route API requests.</Text>
                                                <Text fontSize="xs" color="gray.600"><b>Origin:</b> Derived from the successful validation of the 17-digit VIN against the STLA/Jeep platform registry.</Text>
                                            </VStack>
                                        </PopoverBody>
                                    </PopoverContent>
                                </Popover>

                                <Popover trigger="hover" placement="bottom-end" openDelay={200}>
                                    <PopoverTrigger>
                                        <Box cursor="help">
                                            <Tag size="md" colorScheme="purple" variant="subtle" borderRadius="full">
                                                <Icon as={Shield} mr={2} /> Preprod Environment
                                            </Tag>
                                        </Box>
                                    </PopoverTrigger>
                                    <PopoverContent bg="white" borderColor="purple.100" shadow="xl" borderRadius="xl" p={0}>
                                        <PopoverArrow bg="white" />
                                        <PopoverHeader border="none" bg="purple.50" borderTopRadius="xl" py={2} px={4}>
                                            <HStack><Icon as={Shield} color="purple.500" size={14} /><Text fontSize="xs" fontWeight="black" color="purple.700">FAQ: Environment</Text></HStack>
                                        </PopoverHeader>
                                        <PopoverBody py={3} px={4}>
                                            <VStack align="flex-start" spacing={2}>
                                                <Text fontSize="xs" color="gray.600"><b>What is this?</b> The current target environment for all diagnostic and remote command APIs.</Text>
                                                <Text fontSize="xs" color="gray.600"><b>Origin:</b> Pointing to <code>cvip-preprod</code> infrastructure for testing against Jeep 4.1/5.0 platform specifications.</Text>
                                            </VStack>
                                        </PopoverBody>
                                    </PopoverContent>
                                </Popover>
                            </HStack>
                        </Flex>

                        {/* Input Group */}
                        <VStack align="flex-start" w="full" spacing={2}>
                            <Flex w="full" direction={{ base: "column", lg: "row" }} gap={4} align={{ base: "stretch", lg: "center" }}>
                                <Input
                                    placeholder="Enter Target VIN (17 Alphanumeric)"
                                    value={globalVin}
                                    onChange={(e) => setGlobalVin(formatVin(e.target.value))}
                                    size="lg"
                                    bg="gray.50"
                                    maxW={{ base: "full", lg: "500px" }}
                                    fontWeight="bold"
                                    variant="filled"
                                    borderColor={globalVin.length > 0 && !isValidVin(globalVin) ? "red.400" : "blue.100"}
                                    borderWidth={globalVin.length > 0 && !isValidVin(globalVin) ? "2px" : "1px"}
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
                                    isDisabled={!isValidVin(globalVin)}
                                    boxShadow="0 4px 12px rgba(49, 130, 206, 0.3)"
                                    _hover={{ transform: "translateY(-1px)", boxShadow: "0 6px 16px rgba(49, 130, 206, 0.4)" }}
                                    _active={{ transform: "translateY(0)" }}
                                >
                                    Submit
                                </Button>
                            </Flex>
                            {globalVin.length > 0 && !isValidVin(globalVin) && (
                                <Text fontSize="xs" color="red.500" fontWeight="bold">
                                    VIN must be exactly 17 alphanumeric characters ({globalVin.length}/17)
                                </Text>
                            )}
                        </VStack>
                    </VStack>
                </CardBody>
            </Card>

            {/* Environment Variables Dashboard (Postman Style) */}
            <Collapse in={isEnvPanelOpen}>
                <Card mb={8} shadow="lg" borderRadius="2xl" border="1px solid" borderColor="purple.100" bg="#0d1117">
                    <CardHeader py={4} px={6} borderBottom="1px solid" borderColor="gray.700">
                        <HStack justify="space-between">
                            <HStack><Icon as={Settings} color="purple.400" /></HStack>
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

            <IconButton
                position="fixed"
                bottom={{ base: "20px", md: "30px" }}
                right={{ base: "10px", md: "18px" }}
                colorScheme="purple"
                borderRadius="full"
                size="lg"
                icon={<Settings size={24} />}
                shadow="2xl"
                onClick={() => setIsEnvPanelOpen(!isEnvPanelOpen)}
                zIndex={100}
                boxShadow="0 8px 32px rgba(128, 90, 213, 0.4)"
                aria-label="Toggle Variables"
                _hover={{ transform: "rotate(30deg) scale(1.1)" }}
                transition="all 0.2s ease"
            />

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
                                                <Popover trigger="hover" placement="right" openDelay={200}>
                                                    <PopoverTrigger>
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
                                                    </PopoverTrigger>
                                                    <PopoverContent bg="white" borderColor="blue.100" shadow="2xl" borderRadius="xl" p={0} w="300px" zIndex={1000}>
                                                        <PopoverArrow bg="white" />
                                                        <PopoverHeader border="none" bg="blue.50" borderTopRadius="xl" py={2} px={4}>
                                                            <HStack><Icon as={HelpCircle} color="blue.500" size={14} /><Text fontSize="xs" fontWeight="black" color="blue.700">{PROCEDURAL_DOCS[cat.id].title}</Text></HStack>
                                                        </PopoverHeader>
                                                        <PopoverBody py={3} px={4}>
                                                            <VStack align="flex-start" spacing={2}>
                                                                {PROCEDURAL_DOCS[cat.id].steps.slice(0, 3).map((step, i) => (
                                                                    <HStack key={i} align="flex-start" spacing={2}>
                                                                        <Badge colorScheme="blue" variant="solid" fontSize="8px" borderRadius="full" boxSize="14px" display="flex" alignItems="center" justifyContent="center">{i + 1}</Badge>
                                                                        <Text fontSize="10px" color="gray.600" fontWeight="medium">{step}</Text>
                                                                    </HStack>
                                                                ))}
                                                                {PROCEDURAL_DOCS[cat.id].steps.length > 3 && (
                                                                    <Text 
                                                                        fontSize="9px" 
                                                                        color="blue.500" 
                                                                        fontWeight="bold" 
                                                                        pl={6} 
                                                                        cursor="pointer" 
                                                                        _hover={{ textDecoration: 'underline', color: 'blue.600' }}
                                                                        onClick={(e) => handleManualHelp(e, cat.id)}
                                                                    >
                                                                        + Click here for full guide
                                                                    </Text>
                                                                )}
                                                            </VStack>
                                                        </PopoverBody>
                                                    </PopoverContent>
                                                </Popover>
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
                                    <Table variant="simple" size="sm" width="full" style={{ tableLayout: 'fixed' }}>
                                        <Tbody>
                                            {cat.endpoints.map((ep, idx) => {
                                                const epKey = `${cat.id}-${ep.name}`;
                                                const hasResult = apiResults[epKey];
                                                const isLoading = loadingMap[epKey];

                                                return (
                                                    <React.Fragment key={idx}>
                                                        <Tr _hover={{ bg: "gray.50" }} transition="all 0.2s">
                                                            <Td width="250px" minW="250px">
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
                                                                <Flex align="center" gap={4} w="full">
                                                                    {ep.name === 'Upload Firmware (ZIP)' ? (
                                                                        <FotaParameterManager
                                                                            params={params}
                                                                            setParams={setParams}
                                                                            ep={ep}
                                                                            handleFirmwareSelection={handleFirmwareSelection}
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
                                                                        </Wrap>
                                                                    )}

                                                                    <VStack spacing={2} ml="auto">
                                                                        <Button
                                                                            onClick={() => handleExecute(cat, ep)}
                                                                            isLoading={isLoading}
                                                                            loadingText="Executing"
                                                                            leftIcon={<Play size={10} />}
                                                                            size="xs"
                                                                            colorScheme="blue"
                                                                            variant="solid"
                                                                            minW="100px"
                                                                            borderRadius="md"
                                                                            transition="all 0.2s"
                                                                            _hover={{ transform: "scale(1.05)", shadow: "md" }}
                                                                        >
                                                                            Execute
                                                                        </Button>
                                                                        {hasResult && (
                                                                            <Badge
                                                                                colorScheme={hasResult.error ? 'red' : 'green'}
                                                                                variant="outline"
                                                                                fontSize="9px"
                                                                                w="full"
                                                                                textAlign="center"
                                                                            >
                                                                                {hasResult.error ? 'FAILED' : 'SUCCESS'}
                                                                            </Badge>
                                                                        )}
                                                                    </VStack>
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
                                                                            const newResults = { ...apiResults };
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
