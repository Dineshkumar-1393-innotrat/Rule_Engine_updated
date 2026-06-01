import React from 'react';
import { Box, SimpleGrid, Stat, StatLabel, StatNumber, Card, CardBody, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Flex, Button, Icon } from '@chakra-ui/react';
import { Upload, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const navigate = useNavigate();

    return (
        <Box>
            <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading size="lg">Dashboard</Heading>
                <Badge colorScheme="blue" p={2} borderRadius="md">Today: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Badge>
            </Flex>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                <Card><CardBody><Stat><StatLabel>Total Devices</StatLabel><StatNumber>1,248</StatNumber></Stat></CardBody></Card>
                <Card><CardBody><Stat><StatLabel>Uploaded Today</StatLabel><StatNumber>32</StatNumber></Stat></CardBody></Card>
                <Card><CardBody><Stat><StatLabel>IMEI Uploads (7d)</StatLabel><StatNumber>15</StatNumber></Stat></CardBody></Card>
                <Card><CardBody><Stat><StatLabel>Supplier Feed Uploads (7d)</StatLabel><StatNumber>17</StatNumber></Stat></CardBody></Card>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                <Card gridColumn={{ lg: 'span 2' }}>
                    <CardBody>
                        <Heading size="md" mb={4}>Recent Upload Activity</Heading>
                        <Table size="sm">
                            <Thead>
                                <Tr>
                                    <Th>Time</Th><Th>Type</Th><Th>File</Th><Th>Status</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                <Tr>
                                    <Td>10:34 AM</Td><Td>IMEI Upload</Td><Td>IMEI.csv</Td><Td><Badge colorScheme="green">✓ 50 Records</Badge></Td>
                                </Tr>
                                <Tr>
                                    <Td>10:12 AM</Td><Td>Supplier Feed</Td><Td>Tbox.csv</Td><Td><Badge colorScheme="green">✓ 50 Records</Badge></Td>
                                </Tr>
                                <Tr>
                                    <Td>09:55 AM</Td><Td>IMEI Upload</Td><Td>IMEI_2.csv</Td><Td><Badge colorScheme="red">✗ 2 Errors</Badge></Td>
                                </Tr>
                            </Tbody>
                        </Table>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <Heading size="md" mb={4}>Quick Actions</Heading>
                        <Button leftIcon={<Icon as={Upload} />} w="full" mb={4} colorScheme="blue" variant="outline" onClick={() => navigate('/manufacturing/upload/imei')}>
                            Upload IMEI CSV
                        </Button>
                        <Button leftIcon={<Icon as={FileText} />} w="full" colorScheme="blue" variant="outline" onClick={() => navigate('/manufacturing/upload/supplier-feed')}>
                            Upload Supplier Feed
                        </Button>
                    </CardBody>
                </Card>
            </SimpleGrid>
        </Box>
    );
};

export default DashboardPage;
