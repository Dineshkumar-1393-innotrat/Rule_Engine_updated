import React, { useState, useRef, useEffect } from 'react';
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
    Button,
    useToast,
    Icon,
    Flex,
    Spacer,
    Spinner,
    Progress,
    Badge,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    IconButton,
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
    Code,
    Tooltip,
} from '@chakra-ui/react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, ShieldCheck, Clock, Terminal, Activity, FileJson } from 'lucide-react';
import axios from 'axios';
import { TraxoApi } from '../../utils/TraxoApi';

const BulkProvisionPage = () => {
    const toast = useToast();
    const [imeiFile, setImeiFile] = useState(null);
    const [supplierFile, setSupplierFile] = useState(null);
    const [isImeiUploading, setIsImeiUploading] = useState(false);
    const [isSupplierUploading, setIsSupplierUploading] = useState(false);
    const [imeiResult, setImeiResult] = useState(null);
    const [supplierResult, setSupplierResult] = useState(null);
    const [apiTraces, setApiTraces] = useState({});

    const imeiInputRef = useRef();
    const supplierInputRef = useRef();

    // Axios Interceptor for Bulk Requests
    useEffect(() => {
        const reqInterceptor = axios.interceptors.request.use((config) => {
            if (config.url.includes('bulkprovision')) {
                const endpointKey = config.url.includes('imei') ? 'imei' : 'dongle';
                config.metadata = { startTime: new Date(), endpointKey };
            }
            return config;
        });

        const resInterceptor = axios.interceptors.response.use(
            (response) => {
                if (response.config.metadata) {
                    const { startTime, endpointKey } = response.config.metadata;
                    const duration = new Date() - startTime;
                    setApiTraces(prev => ({
                        ...prev,
                        [endpointKey]: {
                            request: {
                                url: response.config.url,
                                method: response.config.method.toUpperCase(),
                                headers: response.config.headers,
                                data: response.config.data,
                            },
                            response: {
                                status: response.status,
                                statusText: response.statusText,
                                data: response.data,
                                headers: response.headers,
                            },
                            duration,
                            timestamp: new Date().toISOString()
                        }
                    }));
                }
                return response;
            },
            (error) => {
                if (error.config && error.config.metadata) {
                    const { startTime, endpointKey } = error.config.metadata;
                    const duration = new Date() - startTime;
                    setApiTraces(prev => ({
                        ...prev,
                        [endpointKey]: {
                            request: {
                                url: error.config.url,
                                method: error.config.method.toUpperCase(),
                                headers: error.config.headers,
                                data: error.config.data,
                            },
                            response: error.response ? {
                                status: error.response.status,
                                statusText: error.response.statusText,
                                data: error.response.data,
                                headers: error.response.headers,
                            } : null,
                            error: error.message,
                            duration,
                            timestamp: new Date().toISOString()
                        }
                    }));
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(reqInterceptor);
            axios.interceptors.response.eject(resInterceptor);
        };
    }, []);

    const handleFileChange = (event, setFile) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                toast({
                    title: 'Invalid File Type',
                    description: 'Please upload a CSV file.',
                    status: 'error',
                    duration: 3000,
                });
                return;
            }
            setFile(file);
        }
    };

    const handleImeiUpload = async () => {
        if (!imeiFile) return;
        setIsImeiUploading(true);
        setImeiResult(null);
        try {
            const response = await TraxoApi.bulkImeiUpload(imeiFile);
            setImeiResult({ status: 'success', data: response });
            toast({
                title: 'IMEI Upload Successful',
                description: 'Bulk IMEI data has been provisioned.',
                status: 'success',
                duration: 5000,
            });
            setImeiFile(null);
        } catch (error) {
            setImeiResult({ status: 'error', message: error.message });
            toast({
                title: 'IMEI Upload Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsImeiUploading(false);
        }
    };

    const handleSupplierUpload = async () => {
        if (!supplierFile) return;
        setIsSupplierUploading(true);
        setSupplierResult(null);
        try {
            const response = await TraxoApi.bulkSupplierFeed(supplierFile);
            setSupplierResult({ status: 'success', data: response });
            toast({
                title: 'Supplier Feed Successful',
                description: 'Bulk dongle data has been provisioned.',
                status: 'success',
                duration: 5000,
            });
            setSupplierFile(null);
        } catch (error) {
            setSupplierResult({ status: 'error', message: error.message });
            toast({
                title: 'Supplier Feed Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsSupplierUploading(false);
        }
    };

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <HStack mb={2}>
                        <Icon as={ShieldCheck} boxSize={8} color="blue.500" />
                        <Heading size="lg">Bulk Provisioning</Heading>
                    </HStack>
                    <Text color="gray.500">Securely provision large batches of vehicles and hardware components</Text>
                </Box>

                <Alert status="info" variant="subtle" borderRadius="xl" borderLeftWidth="4px" borderLeftColor="blue.400">
                    <AlertIcon />
                    <Box flex="1">
                        <AlertTitle fontSize="sm">System Authentication</AlertTitle>
                        <AlertDescription fontSize="xs">
                            This module uses specialized **BULK Provisioning Credentials**. Requests are automatically routed through the secure gateway.
                        </AlertDescription>
                    </Box>
                </Alert>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                    {/* IMEI UPLOAD CARD */}
                    <Card variant="outline" borderRadius="2xl" shadow="sm" overflow="hidden" transition="0.2s" _hover={{ shadow: 'md' }}>
                        <CardHeader bg="gray.50" borderBottomWidth="1px">
                            <HStack>
                                <Icon as={FileText} color="blue.500" />
                                <Heading size="md">IMEI Provisioning</Heading>
                                <Spacer />
                                <Badge colorScheme="blue">CSV Batch</Badge>
                            </HStack>
                        </CardHeader>
                        <CardBody py={10}>
                            <VStack spacing={6}>
                                {!imeiFile ? (
                                    <Box
                                        w="full"
                                        h="200px"
                                        border="2px dashed"
                                        borderColor="gray.200"
                                        borderRadius="xl"
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                        justifyContent="center"
                                        cursor="pointer"
                                        transition="0.2s"
                                        _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                                        onClick={() => imeiInputRef.current.click()}
                                    >
                                        <Icon as={UploadCloud} boxSize={12} color="gray.400" mb={4} />
                                        <Text fontWeight="bold" color="gray.600">Click to upload IMEI CSV</Text>
                                        <Text fontSize="xs" color="gray.400">Standard IMEI list format</Text>
                                        <input
                                            type="file"
                                            ref={imeiInputRef}
                                            style={{ display: 'none' }}
                                            accept=".csv"
                                            onChange={(e) => handleFileChange(e, setImeiFile)}
                                        />
                                    </Box>
                                ) : (
                                    <Box w="full" p={6} bg="blue.50" borderRadius="xl" border="1px" borderColor="blue.100">
                                        <HStack spacing={4}>
                                            <Icon as={FileText} boxSize={10} color="blue.500" />
                                            <VStack align="flex-start" spacing={0} flex={1}>
                                                <Text fontWeight="bold" fontSize="sm" isTruncated maxW="200px">{imeiFile.name}</Text>
                                                <Text fontSize="xs" color="gray.500">{(imeiFile.size / 1024).toFixed(2)} KB</Text>
                                            </VStack>
                                            <IconButton
                                                icon={<Trash2 size={18} />}
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() => setImeiFile(null)}
                                            />
                                        </HStack>
                                        <Button
                                            mt={6}
                                            w="full"
                                            colorScheme="blue"
                                            onClick={handleImeiUpload}
                                            isLoading={isImeiUploading}
                                            loadingText="Uploading to Gateway..."
                                        >
                                            Start Batch Upload
                                        </Button>
                                    </Box>
                                )}

                                {isImeiUploading && <Progress w="full" size="xs" isIndeterminate colorScheme="blue" borderRadius="full" />}

                                {imeiResult && (
                                    <BulkResultExplorer 
                                        trace={apiTraces['imei']} 
                                        onClear={() => {
                                            setImeiResult(null);
                                            const newTraces = {...apiTraces};
                                            delete newTraces['imei'];
                                            setApiTraces(newTraces);
                                        }} 
                                    />
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* SUPPLIER FEED CARD */}
                    <Card variant="outline" borderRadius="2xl" shadow="sm" overflow="hidden" transition="0.2s" _hover={{ shadow: 'md' }}>
                        <CardHeader bg="gray.50" borderBottomWidth="1px">
                            <HStack>
                                <Icon as={FileText} color="purple.500" />
                                <Heading size="md">Supplier/Dongle Feed</Heading>
                                <Spacer />
                                <Badge colorScheme="purple">Dongle Batch</Badge>
                            </HStack>
                        </CardHeader>
                        <CardBody py={10}>
                            <VStack spacing={6}>
                                {!supplierFile ? (
                                    <Box
                                        w="full"
                                        h="200px"
                                        border="2px dashed"
                                        borderColor="gray.200"
                                        borderRadius="xl"
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                        justifyContent="center"
                                        cursor="pointer"
                                        transition="0.2s"
                                        _hover={{ borderColor: 'purple.400', bg: 'purple.50' }}
                                        onClick={() => supplierInputRef.current.click()}
                                    >
                                        <Icon as={UploadCloud} boxSize={12} color="gray.400" mb={4} />
                                        <Text fontWeight="bold" color="gray.600">Click to upload Supplier CSV</Text>
                                        <Text fontSize="xs" color="gray.400">Supplier/Dongle mapping format</Text>
                                        <input
                                            type="file"
                                            ref={supplierInputRef}
                                            style={{ display: 'none' }}
                                            accept=".csv"
                                            onChange={(e) => handleFileChange(e, setSupplierFile)}
                                        />
                                    </Box>
                                ) : (
                                    <Box w="full" p={6} bg="purple.50" borderRadius="xl" border="1px" borderColor="purple.100">
                                        <HStack spacing={4}>
                                            <Icon as={FileText} boxSize={10} color="purple.500" />
                                            <VStack align="flex-start" spacing={0} flex={1}>
                                                <Text fontWeight="bold" fontSize="sm" isTruncated maxW="200px">{supplierFile.name}</Text>
                                                <Text fontSize="xs" color="gray.500">{(supplierFile.size / 1024).toFixed(2)} KB</Text>
                                            </VStack>
                                            <IconButton
                                                icon={<Trash2 size={18} />}
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() => setSupplierFile(null)}
                                            />
                                        </HStack>
                                        <Button
                                            mt={6}
                                            w="full"
                                            colorScheme="purple"
                                            onClick={handleSupplierUpload}
                                            isLoading={isSupplierUploading}
                                            loadingText="Processing Feed..."
                                        >
                                            Start Batch Upload
                                        </Button>
                                    </Box>
                                )}

                                {isSupplierUploading && <Progress w="full" size="xs" isIndeterminate colorScheme="purple" borderRadius="full" />}

                                {supplierResult && (
                                    <BulkResultExplorer 
                                        trace={apiTraces['dongle']} 
                                        onClear={() => {
                                            setSupplierResult(null);
                                            const newTraces = {...apiTraces};
                                            delete newTraces['dongle'];
                                            setApiTraces(newTraces);
                                        }} 
                                    />
                                )}
                            </VStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                <Card variant="unstyled" bg="blue.900" color="white" borderRadius="2xl">
                    <CardBody p={8}>
                        <HStack spacing={6}>
                            <Box p={4} bg="whiteAlpha.200" borderRadius="2xl">
                                <Icon as={CheckCircle2} boxSize={10} color="blue.300" />
                            </Box>
                            <VStack align="flex-start" spacing={1}>
                                <Text fontSize="lg" fontWeight="bold">Provisioning Guidelines</Text>
                                <Text fontSize="sm" color="blue.100">Ensure CSV columns match the specific STLA M6 Connectivity Interface Specification for your region. Incorrect formats may lead to partial provisioning.</Text>
                            </VStack>
                        </HStack>
                    </CardBody>
                </Card>
            </VStack>
        </Container>
    );
};

const BulkResultExplorer = ({ trace, onClear }) => {
    if (!trace) return null;

    const { request, response, error, duration } = trace;
    const isSuccess = !error && response && response.status < 400;

    return (
        <Box w="full" mt={4} borderTopWidth="1px" pt={4}>
            <VStack align="stretch" spacing={3}>
                {/* Status Bar */}
                <Flex bg="gray.800" p={2} borderRadius="md" align="center" justify="space-between">
                    <HStack spacing={4}>
                        <HStack spacing={1}>
                            <Text fontSize="10px" color="gray.500" fontWeight="bold">STATUS:</Text>
                            <Badge colorScheme={isSuccess ? "green" : "red"} fontSize="10px">
                                {response?.status || "ERROR"} {response?.statusText}
                            </Badge>
                        </HStack>
                        <HStack spacing={1}>
                            <Text fontSize="10px" color="gray.500" fontWeight="bold">TIME:</Text>
                            <Text fontSize="10px" color="blue.300" fontWeight="bold">{duration}ms</Text>
                        </HStack>
                        <HStack spacing={1}>
                            <Text fontSize="10px" color="gray.500" fontWeight="bold">SIZE:</Text>
                            <Text fontSize="10px" color="orange.300" fontWeight="bold">
                                {response?.headers?.['content-length'] ? `${(response.headers['content-length'] / 1024).toFixed(2)} KB` : "N/A"}
                            </Text>
                        </HStack>
                    </HStack>
                    <IconButton 
                        icon={<Trash2 size={12} />} 
                        size="xs" 
                        colorScheme="red" 
                        variant="ghost" 
                        onClick={onClear}
                        aria-label="Clear Result"
                    />
                </Flex>

                <Tabs size="sm" variant="enclosed-colored" colorScheme="blue">
                    <TabList borderBottom="none">
                        <Tab fontSize="xs" fontWeight="bold" _selected={{ bg: 'blue.500', color: 'white' }}>RESPONSE BODY</Tab>
                        <Tab fontSize="xs" fontWeight="bold" _selected={{ bg: 'blue.500', color: 'white' }}>REQUEST DETAILS</Tab>
                        <Tab fontSize="xs" fontWeight="bold" _selected={{ bg: 'blue.500', color: 'white' }}>HEADERS</Tab>
                    </TabList>
                    <TabPanels bg="gray.900" borderRadius="0 0 8px 8px" border="1px" borderColor="gray.700">
                        <TabPanel p={0} maxH="300px" overflowY="auto">
                            <Box p={4} position="relative">
                                <Code 
                                    display="block" 
                                    whiteSpace="pre-wrap" 
                                    bg="transparent" 
                                    color={isSuccess ? "green.300" : "red.300"} 
                                    fontSize="xs"
                                    fontFamily="monospace"
                                >
                                    {response?.data ? JSON.stringify(response.data, null, 2) : error || "No Response Content"}
                                </Code>
                            </Box>
                        </TabPanel>
                        <TabPanel p={4}>
                            <VStack align="stretch" spacing={4}>
                                <Box>
                                    <Text fontSize="10px" color="gray.500" fontWeight="bold" mb={1}>ENDPOINT</Text>
                                    <Flex align="center" gap={2} bg="whiteAlpha.100" p={2} borderRadius="md">
                                        <Badge colorScheme="purple">{request.method}</Badge>
                                        <Text fontSize="xs" color="blue.200" fontFamily="monospace">{request.url}</Text>
                                    </Flex>
                                </Box>
                                <Box>
                                    <Text fontSize="10px" color="gray.500" fontWeight="bold" mb={1}>PAYLOAD TYPE</Text>
                                    <Text fontSize="xs" color="gray.300">Multipart/Form-Data (Binary File)</Text>
                                </Box>
                            </VStack>
                        </TabPanel>
                        <TabPanel p={0}>
                            <Table size="sm" variant="simple">
                                <Thead bg="whiteAlpha.50">
                                    <Tr>
                                        <Th color="gray.500" fontSize="9px">HEADER</Th>
                                        <Th color="gray.500" fontSize="9px">VALUE</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {response?.headers && Object.entries(response.headers).map(([k, v]) => (
                                        <Tr key={k} borderBottomWidth="1px" borderColor="whiteAlpha.100">
                                            <Td py={2} fontSize="10px" color="gray.400" fontWeight="bold" border="none">{k}</Td>
                                            <Td py={2} fontSize="10px" color="blue.200" border="none">{v}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </Box>
    );
};

export default BulkProvisionPage;
