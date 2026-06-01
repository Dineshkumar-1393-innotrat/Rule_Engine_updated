import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Flex, Button, Card, CardBody, SimpleGrid, Badge, Table, Thead, Tbody, Tr, Th, Td, VStack } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DeviceDetailPage = () => {
    const { vin } = useParams();
    const navigate = useNavigate();
    const [device, setDevice] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data fetch
        setTimeout(() => {
            setDevice({
                vin: vin,
                imei: '868531065616778',
                serialNo: 'TIA08052026S000004',
                iccid: '89915309040286762080',
                msisdn: '5754151331024',
                hwPart: '68532321AA',
                nadSw: 'ND0.01.16',
                mcuSw: 'MD0.00.05',
                mfgDate: '08 May 2026',
                country: 'IN (1)',
                region: '4',
                state: 'FACTORY',
                registeredDate: '08 May 2026',
                updatedDate: '08 May 2026'
            });
            setEvents([
                { time: '2026-05-08 10:34', type: 'REGISTERED', desc: 'Device created' },
                { time: '2026-05-08 10:35', type: 'STATE_UPDATE', desc: 'State: FACTORY' }
            ]);
            setLoading(false);
        }, 500);
    }, [vin]);

    if (loading) return <Box p={6}><Text>Loading...</Text></Box>;
    if (!device) return <Box p={6}><Text>Device not found</Text></Box>;

    return (
        <Box>
            <Button variant="link" mb={4} onClick={() => navigate('/manufacturing/devices')}>← Back to Devices</Button>
            <Heading size="lg" mb={6}>Device: {device.vin}</Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                <Card>
                    <CardBody>
                        <Heading size="md" mb={4}>Registration</Heading>
                        <Table size="sm" variant="unstyled">
                            <Tbody>
                                <Tr><Td fontWeight="bold" w="30%">VIN:</Td><Td>{device.vin}</Td></Tr>
                                <Tr><Td fontWeight="bold">IMEI:</Td><Td>{device.imei}</Td></Tr>
                                <Tr><Td fontWeight="bold">Serial No:</Td><Td>{device.serialNo}</Td></Tr>
                                <Tr><Td fontWeight="bold">ICCID:</Td><Td>{device.iccid}</Td></Tr>
                                <Tr><Td fontWeight="bold">MSISDN:</Td><Td>{device.msisdn}</Td></Tr>
                                <Tr><Td fontWeight="bold">HW Part:</Td><Td>{device.hwPart}</Td></Tr>
                                <Tr><Td fontWeight="bold">NAD SW:</Td><Td>{device.nadSw}</Td></Tr>
                                <Tr><Td fontWeight="bold">MCU SW:</Td><Td>{device.mcuSw}</Td></Tr>
                                <Tr><Td fontWeight="bold">Mfg Date:</Td><Td>{device.mfgDate}</Td></Tr>
                                <Tr><Td fontWeight="bold">Country:</Td><Td>{device.country}</Td></Tr>
                                <Tr><Td fontWeight="bold">Region:</Td><Td>{device.region}</Td></Tr>
                            </Tbody>
                        </Table>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <Heading size="md" mb={4}>Current State</Heading>
                        <VStack align="stretch" spacing={4}>
                            <Flex align="center">
                                <Badge colorScheme={device.state === 'FACTORY' ? 'orange' : 'green'} p={2} fontSize="md" borderRadius="md">
                                    {device.state}
                                </Badge>
                            </Flex>
                            <Box>
                                <Text fontSize="sm" color="gray.500">Registered: {device.registeredDate}</Text>
                                <Text fontSize="sm" color="gray.500">Last Updated: {device.updatedDate}</Text>
                            </Box>
                        </VStack>
                    </CardBody>
                </Card>
            </SimpleGrid>

            <Card>
                <CardBody>
                    <Heading size="md" mb={4}>Event History</Heading>
                    <Table size="sm">
                        <Thead><Tr><Th>Timestamp</Th><Th>Event Type</Th><Th>Description</Th></Tr></Thead>
                        <Tbody>
                            {events.map((ev, i) => (
                                <Tr key={i}>
                                    <Td>{ev.time}</Td>
                                    <Td><Badge>{ev.type}</Badge></Td>
                                    <Td>{ev.desc}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </CardBody>
            </Card>
        </Box>
    );
};

export default DeviceDetailPage;
