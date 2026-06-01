import React, { useState, useEffect } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, Flex, Select } from '@chakra-ui/react';

const UploadHistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('upload_history') || '[]');
        // Sort by time descending
        data.sort((a, b) => new Date(b.time) - new Date(a.time));
        setHistory(data);
    }, []);

    const filteredHistory = history.filter(h => filter === 'All' || h.type.includes(filter));

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Upload History</Heading>
                <Button size="sm" variant="outline">Export CSV</Button>
            </Flex>

            <Flex mb={4} align="center" gap={4}>
                <Box fontWeight="bold">Type:</Box>
                <Select w="200px" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="All">All</option>
                    <option value="IMEI">IMEI Upload</option>
                    <option value="Supplier">Supplier Feed</option>
                </Select>
            </Flex>

            <Box borderWidth="1px" borderRadius="md" overflow="hidden" bg="white" _dark={{ bg: 'gray.800' }}>
                <Table size="sm">
                    <Thead>
                        <Tr><Th>Date/Time</Th><Th>Type</Th><Th>File</Th><Th>Result</Th><Th>Action</Th></Tr>
                    </Thead>
                    <Tbody>
                        {filteredHistory.length > 0 ? filteredHistory.map((item, i) => (
                            <Tr key={i}>
                                <Td>{new Date(item.time).toLocaleString()}</Td>
                                <Td>{item.type}</Td>
                                <Td>{item.file}</Td>
                                <Td>
                                    <Badge colorScheme={item.success ? 'green' : 'red'}>
                                        {item.success ? `✓ ${item.total} Processed` : '✗ Failed'}
                                    </Badge>
                                </Td>
                                <Td><Button size="xs" variant="ghost">View Details</Button></Td>
                            </Tr>
                        )) : (
                            <Tr><Td colSpan={5} textAlign="center" py={4}>No uploads recorded in this date range.</Td></Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>
        </Box>
    );
};

export default UploadHistoryPage;
