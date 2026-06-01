import React, { useState, useEffect } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Input, Select, Flex, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DeviceListPage = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch devices (Mock implementation)
        setTimeout(() => {
            setDevices([
                { vin: 'MCANJREB1MFA76734', serialNo: 'TIA08052026S000004', imei: '868531065616778', state: 'FACTORY' },
                { vin: 'MCANJREB1MFA76735', serialNo: 'TIA08052026S000005', imei: '868531065616779', state: 'CUSTOMER' }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const filtered = devices.filter(d => 
        (filter === 'ALL' || d.state === filter) &&
        (d.vin.includes(search) || d.imei.includes(search) || d.serialNo.includes(search))
    );

    return (
        <Box>
            <Heading size="lg" mb={6}>Registered Devices</Heading>
            <Flex gap={4} mb={6}>
                <Select w="200px" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="ALL">All States</option>
                    <option value="FACTORY">FACTORY</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                </Select>
                <Input placeholder="Search VIN / IMEI / Serial No." value={search} onChange={(e) => setSearch(e.target.value)} />
            </Flex>
            <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                <Table>
                    <Thead>
                        <Tr><Th>VIN</Th><Th>Serial No.</Th><Th>IMEI</Th><Th>State</Th><Th>Action</Th></Tr>
                    </Thead>
                    <Tbody>
                        {filtered.map(d => (
                            <Tr key={d.vin}>
                                <Td color="blue.500" cursor="pointer" onClick={() => navigate(`/manufacturing/devices/${d.vin}`)}>{d.vin}</Td>
                                <Td>{d.serialNo}</Td>
                                <Td>{d.imei}</Td>
                                <Td><Badge colorScheme={d.state === 'FACTORY' ? 'orange' : 'green'}>{d.state}</Badge></Td>
                                <Td><Button size="xs" onClick={() => navigate(`/manufacturing/devices/${d.vin}`)}>View</Button></Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        </Box>
    );
};

export default DeviceListPage;
