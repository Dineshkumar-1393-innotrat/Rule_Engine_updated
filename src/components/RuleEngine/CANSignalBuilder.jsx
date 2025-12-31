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
} from '@chakra-ui/react';
import { FaTrash, FaPlus, FaEdit } from 'react-icons/fa';

const CANSignalBuilder = ({ signals = [], onUpdateSignals, busData = [] }) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

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

    return (
        <Box>
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
                {/* Form Section */}
                <GridItem>
                    <Box p={5} bg={bgColor} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                        <Heading size="md" mb={4}>{editingId ? 'Edit Signal' : 'Add New Signal'}</Heading>
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

                            <HStack width="full">
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
                            </HStack>

                            <HStack width="full">
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
                            </HStack>

                            <HStack width="full">
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
                            </HStack>

                            <HStack width="full">
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
                            </HStack>
                            <FormControl>
                                <FormLabel>Unit</FormLabel>
                                <Input value={formData.unit} onChange={(e) => handleInputChange('unit', e.target.value)} placeholder="e.g. km/h, rpm" color="black" />
                            </FormControl>

                            <HStack width="full" spacing={4} mt={4}>
                                <Button colorScheme="blue" leftIcon={editingId ? <FaEdit /> : <FaPlus />} onClick={handleSave} flex={1}>
                                    {editingId ? 'Update Signal' : 'Add Signal'}
                                </Button>
                                {editingId && (
                                    <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                                )}
                            </HStack>
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
            {busData.length > 0 && (
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
            )}
        </Box>
    );
};

export default CANSignalBuilder;
