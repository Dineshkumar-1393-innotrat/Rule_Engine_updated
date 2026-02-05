import React, { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
    HStack,
    Stack,
    SimpleGrid,
    Flex,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    Heading,
    Text,
    useColorModeValue,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Badge,
    Grid,
    GridItem,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Code,
    useClipboard,
    useToast
} from '@chakra-ui/react';
import { FaTrash, FaPlus, FaEdit, FaCode, FaCopy } from 'react-icons/fa';
import {
    generateCanConfigH,
    generateCanConfigC,
    generateCanDecodeH,
    generateCanDecodeC
} from '../../utils/canCodeGenerator';

const CANSignalBuilder = ({ signals = [], onUpdateSignals, busData = [] }) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const toast = useToast();

    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState({
        configH: '',
        configC: '',
        decodeH: '',
        decodeC: ''
    });

    // Converter Modal State
    const [isConverterModalOpen, setIsConverterModalOpen] = useState(false);
    const [converterInput, setConverterInput] = useState({
        header: '',
        data: ''
    });
    const [converterOutput, setConverterOutput] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        identifier: '0x000',
        startBit: 0,
        length: 8,
        endianness: 'little', // or 'big'
        sign: 'unsigned', // or 'signed'
        factor: 1,
        offset: 0,
        min: 0,
        max: 100,
        unit: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.name || !formData.identifier) return;

        const newSignal = {
            id: editingId || `can-${Date.now()}`,
            ...formData,
            identifier: formData.identifier.startsWith('0x') ? formData.identifier : `0x${formData.identifier}`
        };

        if (editingId) {
            onUpdateSignals(signals.map(s => s.id === editingId ? newSignal : s));
            setEditingId(null);
        } else {
            onUpdateSignals([...signals, newSignal]);
        }

        resetForm();
    };

    const handleEdit = (signal) => {
        setEditingId(signal.id);
        setFormData({ ...signal });
    };

    const handleDelete = (id) => {
        onUpdateSignals(signals.filter(s => s.id !== id));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            identifier: '0x000',
            startBit: 0,
            length: 8,
            endianness: 'little',
            sign: 'unsigned',
            factor: 1,
            offset: 0,
            min: 0,
            max: 100,
            unit: ''
        });
        setEditingId(null);
    };

    const handleGenerateCode = () => {
        if (signals.length === 0) {
            toast({
                title: 'No Signals Defined',
                description: 'Please add at least one signal to generate code.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const configH = generateCanConfigH();
        const configC = generateCanConfigC(signals);
        const decodeH = generateCanDecodeH();
        const decodeC = generateCanDecodeC();

        setGeneratedCode({ configH, configC, decodeH, decodeC });
        setIsCodeModalOpen(true);
    };

    const handleConverterCode = () => {
        setIsConverterModalOpen(true);
    };

    const runConverter = () => {
        // Parse Header
        const headerStr = converterInput.header.trim();
        const headerVal = headerStr.startsWith('0x') ? headerStr : `0x${parseInt(headerStr || '0').toString(16).toUpperCase()}`;

        // Parse Data (assume space separated hex or just hex string)
        const dataStr = converterInput.data.replace(/\s+/g, '');
        const dataBytes = [];
        for (let i = 0; i < dataStr.length; i += 2) {
            const byte = dataStr.substring(i, i + 2);
            if (byte.length === 2) {
                dataBytes.push(`0x${byte.toUpperCase()}`);
            }
        }

        // Format Output (MISRA-C compliant array)
        // Example: { 0x123U, { 0x11U, 0x22U, ... } }
        const output = `{ ${headerVal}, { ${dataBytes.join(', ')} } }`;
        setConverterOutput(output);
    };

    const CodeBlock = ({ code, filename }) => {
        const { hasCopied, onCopy } = useClipboard(code);
        return (
            <Box position="relative" my={2}>
                <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" fontSize="sm">{filename}</Text>
                    <Button size="xs" leftIcon={<FaCopy />} onClick={onCopy} colorScheme={hasCopied ? "green" : "gray"}>
                        {hasCopied ? "Copied" : "Copy"}
                    </Button>
                </HStack>
                <Box
                    as="pre"
                    p={4}
                    bg="gray.900"
                    color="green.300"
                    borderRadius="md"
                    overflowX="auto"
                    fontSize="xs"
                    maxH="400px"
                >
                    {code}
                </Box>
            </Box>
        );
    };

    return (
        <Box>
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
                {/* Form Section */}
                <GridItem>
                    <Box p={5} bg={bgColor} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                        <VStack align="flex-start" mb={4} spacing={3}>
                            <Heading size="md">{editingId ? 'Edit Signal' : 'Add New Signal'}</Heading>
                            <VStack spacing={3} align="flex-start">
                                <Button
                                    leftIcon={<FaCode />}
                                    bgGradient="linear(to-br, #13428E, #2458AC)"
                                    color="white"
                                    _hover={{
                                        bgGradient: "linear(to-br, #0D2C5E, #13428E)",
                                        transform: "translateY(-2px)",
                                        boxShadow: "lg"
                                    }}
                                    transition="all 0.2s"
                                    boxShadow="md"
                                    size="sm"
                                    onClick={handleGenerateCode}
                                >
                                    Generate Code
                                </Button>
                                <Button
                                    leftIcon={<FaCode />}
                                    bgGradient="linear(to-br, #13428E, #2458AC)"
                                    color="white"
                                    _hover={{
                                        bgGradient: "linear(to-br, #0D2C5E, #13428E)",
                                        transform: "translateY(-2px)",
                                        boxShadow: "lg"
                                    }}
                                    transition="all 0.2s"
                                    boxShadow="md"
                                    size="sm"
                                    onClick={handleConverterCode}
                                >
                                    Converter
                                </Button>
                            </VStack>
                        </VStack>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Signal Name</FormLabel>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="e.g. Engine Speed"
                                    color="black"
                                />
                            </FormControl>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="full">
                                <FormControl isRequired>
                                    <FormLabel>Identifier (Hex)</FormLabel>
                                    <Input
                                        value={formData.identifier}
                                        onChange={(e) => handleInputChange('identifier', e.target.value)}
                                        placeholder="0x123"
                                        color="black"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Endianness</FormLabel>
                                    <Select
                                        value={formData.endianness}
                                        onChange={(e) => handleInputChange('endianness', e.target.value)}
                                        color="black"
                                    >
                                        <option value="little">Little Endian</option>
                                        <option value="big">Big Endian</option>
                                    </Select>
                                </FormControl>
                            </SimpleGrid>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="full">
                                <FormControl>
                                    <FormLabel>Start Bit</FormLabel>
                                    <NumberInput min={0} max={63} value={formData.startBit} onChange={(v) => handleInputChange('startBit', Number(v))}>
                                        <NumberInputField color="black" />
                                        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Length (bits)</FormLabel>
                                    <NumberInput min={1} max={64} value={formData.length} onChange={(v) => handleInputChange('length', Number(v))}>
                                        <NumberInputField color="black" />
                                        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                            </SimpleGrid>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="full">
                                <FormControl>
                                    <FormLabel>Factor</FormLabel>
                                    <NumberInput value={formData.factor} onChange={(v) => handleInputChange('factor', Number(v))}>
                                        <NumberInputField color="black" />
                                    </NumberInput>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Offset</FormLabel>
                                    <NumberInput value={formData.offset} onChange={(v) => handleInputChange('offset', Number(v))}>
                                        <NumberInputField color="black" />
                                    </NumberInput>
                                </FormControl>
                            </SimpleGrid>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="full">
                                <FormControl>
                                    <FormLabel>Min</FormLabel>
                                    <NumberInput value={formData.min} onChange={(v) => handleInputChange('min', Number(v))}>
                                        <NumberInputField color="black" />
                                    </NumberInput>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Max</FormLabel>
                                    <NumberInput value={formData.max} onChange={(v) => handleInputChange('max', Number(v))}>
                                        <NumberInputField color="black" />
                                    </NumberInput>
                                </FormControl>
                            </SimpleGrid>
                            <FormControl>
                                <FormLabel>Unit</FormLabel>
                                <Input value={formData.unit} onChange={(e) => handleInputChange('unit', e.target.value)} placeholder="e.g. km/h, rpm" color="black" />
                            </FormControl>

                            <Stack direction={{ base: "column", md: "row" }} width="full" spacing={4} mt={4}>
                                <Button colorScheme="blue" leftIcon={editingId ? <FaEdit /> : <FaPlus />} onClick={handleSave} flex={1} width="full">
                                    {editingId ? 'Update Signal' : 'Add Signal'}
                                </Button>
                                {editingId && (
                                    <Button variant="ghost" onClick={resetForm} flex={1} width="full">Cancel</Button>
                                )}
                            </Stack>
                        </VStack>
                    </Box>
                </GridItem>

                {/* List Section */}
                <GridItem>
                    <Box p={5} bg={bgColor} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                        <Heading size="md" mb={4}>Defined Signals ({signals.length})</Heading>
                        <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr>
                                        <Th>Name</Th>
                                        <Th>ID</Th>
                                        <Th>Start/Len</Th>
                                        <Th>Formula</Th>
                                        <Th>Unit</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {signals.map((signal) => (
                                        <Tr key={signal.id}>
                                            <Td fontWeight="bold">{signal.name}</Td>
                                            <Td><Badge>{signal.identifier}</Badge></Td>
                                            <Td>{signal.startBit} / {signal.length}</Td>
                                            <Td fontSize="xs">x{signal.factor} + {signal.offset}</Td>
                                            <Td>{signal.unit}</Td>
                                            <Td>
                                                <IconButton
                                                    icon={<FaEdit />}
                                                    size="xs"
                                                    mr={2}
                                                    aria-label="Edit"
                                                    onClick={() => handleEdit(signal)}
                                                />
                                                <IconButton
                                                    icon={<FaTrash />}
                                                    size="xs"
                                                    colorScheme="red"
                                                    aria-label="Delete"
                                                    onClick={() => handleDelete(signal.id)}
                                                />
                                            </Td>
                                        </Tr>
                                    ))}
                                    {signals.length === 0 && (
                                        <Tr>
                                            <Td colSpan={6} textAlign="center" py={4} color="gray.500">
                                                No signals defined. Add one to get started.
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </Box>
                    </Box>
                </GridItem>
            </Grid>

            {/* Live Monitor Section */}
            {
                busData.length > 0 && (
                    <Box mt={6} p={5} bg={bgColor} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                        <Heading size="md" mb={4}>Live CAN Bus Monitor (Simulation)</Heading>
                        <Box overflowX="auto" maxHeight="300px">
                            <Table variant="striped" size="sm">
                                <Thead position="sticky" top={0} bg={bgColor} zIndex={1}>
                                    <Tr>
                                        <Th>Time</Th>
                                        <Th>ID (Hex)</Th>
                                        <Th>Decoded Signals</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {busData.map((frame, idx) => (
                                        <Tr key={idx}>
                                            <Td>{frame.timestamp}</Td>
                                            <Td><Badge colorScheme="green">{frame.id}</Badge></Td>
                                            <Td>
                                                <VStack align="start" spacing={1}>
                                                    {frame.signals.map((sig, sIdx) => (
                                                        <HStack key={sIdx} fontSize="xs">
                                                            <Text fontWeight="bold">{sig.name}:</Text>
                                                            <Text>{sig.value}</Text>
                                                            <Text color="gray.500">({sig.raw})</Text>
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    </Box>
                )
            }


            {/* Generated Code Modal */}
            <Modal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} size="xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent maxW="800px">
                    <ModalHeader>Generated MISRA-C Code</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Tabs variant="enclosed">
                            <TabList>
                                <Tab>can_config.h</Tab>
                                <Tab>can_config.c</Tab>
                                <Tab>can_decode.h</Tab>
                                <Tab>can_decode.c</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel>
                                    <CodeBlock code={generatedCode.configH} filename="can_config.h" />
                                </TabPanel>
                                <TabPanel>
                                    <CodeBlock code={generatedCode.configC} filename="can_config.c" />
                                </TabPanel>
                                <TabPanel>
                                    <CodeBlock code={generatedCode.decodeH} filename="can_decode.h" />
                                </TabPanel>
                                <TabPanel>
                                    <CodeBlock code={generatedCode.decodeC} filename="can_decode.c" />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Converter Modal */}
            <Modal isOpen={isConverterModalOpen} onClose={() => setIsConverterModalOpen(false)} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Hex Converter</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>CAN Header</FormLabel>
                                <Input
                                    placeholder="e.g. 0x123"
                                    value={converterInput.header}
                                    onChange={(e) => setConverterInput(prev => ({ ...prev, header: e.target.value }))}
                                    color="black"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>CAN DATA</FormLabel>
                                <Input
                                    placeholder="e.g. 11 22 33 44 55 66 77 88"
                                    value={converterInput.data}
                                    onChange={(e) => setConverterInput(prev => ({ ...prev, data: e.target.value }))}
                                    color="black"
                                />
                            </FormControl>
                            <Button
                                bgGradient="linear(to-br, #13428E, #2458AC)"
                                color="white"
                                _hover={{
                                    bgGradient: "linear(to-br, #0D2C5E, #13428E)",
                                    transform: "translateY(-2px)",
                                    boxShadow: "lg"
                                }}
                                transition="all 0.2s"
                                boxShadow="md"
                                width="full"
                                onClick={runConverter}
                            >
                                Convert
                            </Button>
                            <FormControl>
                                <FormLabel>Hex Code</FormLabel>
                                <Box
                                    p={3}
                                    bg="gray.100"
                                    _dark={{ bg: 'gray.700' }}
                                    borderRadius="md"
                                    fontFamily="monospace"
                                >
                                    {converterOutput || 'Output will appear here...'}
                                </Box>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default CANSignalBuilder;
