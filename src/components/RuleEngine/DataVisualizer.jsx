import React, { useState } from 'react';
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    VStack,
    HStack,
    Badge,
    useColorModeValue,
    Heading,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    SimpleGrid,
    Collapse,
    IconButton,
    Code
} from '@chakra-ui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const SimpleLineChart = ({ data, dataKey, color, height = 200 }) => {
    if (!data || data.length < 2) return <Box height={height} display="flex" alignItems="center" justifyContent="center"><Text>Not enough data</Text></Box>;

    const maxVal = Math.max(...data.map(d => Number(d[dataKey]) || 0), 100); // Default max 100 if data is low
    const minVal = 0;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((Number(d[dataKey]) || 0) / maxVal) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <Box height={height} width="100%" position="relative" borderLeft="1px solid" borderBottom="1px solid" borderColor="gray.200">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={points}
                />
            </svg>
            {/* Simple Axis Labels */}
            <Text position="absolute" top="0" left="-30px" fontSize="xs">{maxVal}</Text>
            <Text position="absolute" bottom="0" left="-30px" fontSize="xs">{minVal}</Text>
        </Box>
    );
};

const DataVisualizer = ({ dataHistory, events }) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const [expandedRows, setExpandedRows] = useState(new Set());

    const latestData = dataHistory[dataHistory.length - 1] || {};

    const toggleRow = (eventId) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    };

    return (
        <VStack spacing={6} align="stretch">
            {/* Real-time Stats */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Stat>
                        <StatLabel>Current Speed</StatLabel>
                        <StatNumber>{latestData.speed || 0} km/h</StatNumber>
                        <StatHelpText>
                            <StatArrow type={latestData.speed > 50 ? 'increase' : 'decrease'} />
                            Real-time
                        </StatHelpText>
                    </Stat>
                </Box>
                <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Stat>
                        <StatLabel>Road Condition</StatLabel>
                        <StatNumber fontSize="2xl">{latestData.roadCondition || 'Unknown'}</StatNumber>
                        <StatHelpText>Detected Sensor Data</StatHelpText>
                    </Stat>
                </Box>
                <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Stat>
                        <StatLabel>Events Triggered</StatLabel>
                        <StatNumber>{events.length}</StatNumber>
                        <StatHelpText>Total Session Events</StatHelpText>
                    </Stat>
                </Box>
            </SimpleGrid>

            {/* Charts */}
            <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <Heading size="md" mb={4}>Speed History</Heading>
                <SimpleLineChart data={dataHistory} dataKey="speed" color="blue" />
            </Box>

            {/* Event Log Table */}
            <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <Heading size="md" mb={4}>Event Log ({events.length})</Heading>
                {events.length > 0 ? (
                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr>
                                    <Th w="40px"></Th>
                                    <Th>Source ID</Th>
                                    <Th>Event ID</Th>
                                    <Th>Event Type</Th>
                                    <Th>Source Type</Th>
                                    <Th>Category</Th>
                                    <Th>Timestamp</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {events.slice(-10).reverse().map((event, idx) => {
                                    const isExpanded = expandedRows.has(event.eventid || event.eventId);
                                    return (
                                        <React.Fragment key={event.eventid || event.eventId || idx}>
                                            <Tr _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                                                <Td>
                                                    <IconButton
                                                        size="xs"
                                                        variant="ghost"
                                                        icon={isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        onClick={() => toggleRow(event.eventid || event.eventId)}
                                                        aria-label="Expand row"
                                                    />
                                                </Td>
                                                <Td fontFamily="monospace" fontSize="xs">{event.sourceid || event.sourceId || 'N/A'}</Td>
                                                <Td fontFamily="monospace" fontSize="xs" maxW="120px" overflow="hidden" textOverflow="ellipsis">
                                                    {event.eventid ? event.eventid.substring(0, 8) + '...' :
                                                        event.eventId ? event.eventId.substring(0, 8) + '...' : 'N/A'}
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme="purple" fontSize="xs">{event.eventtype || event.type || 'N/A'}</Badge>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme="blue" fontSize="xs">{event.sourcetype || 'DEVICE'}</Badge>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme="green" fontSize="xs">{event.eventsubcategory || 'jeep'}</Badge>
                                                </Td>
                                                <Td fontSize="xs">
                                                    {event.sourcetimestamp || new Date(event.timestamp).toLocaleString()}
                                                </Td>
                                            </Tr>
                                            <Tr>
                                                <Td colSpan={7} p={0} borderBottom={isExpanded ? '1px' : '0'}>
                                                    <Collapse in={isExpanded} animateOpacity>
                                                        <Box p={4} bg={useColorModeValue('gray.50', 'gray.900')}>
                                                            <VStack align="stretch" spacing={3}>
                                                                <Box>
                                                                    <Text fontWeight="bold" mb={2} fontSize="sm">Event Metadata:</Text>
                                                                    <SimpleGrid columns={2} spacing={2} fontSize="xs">
                                                                        <Text><strong>Account ID:</strong> {event.accountId || 'N/A'}</Text>
                                                                        <Text><strong>Message ID:</strong> {event.messageId || 'N/A'}</Text>
                                                                        <Text><strong>Correlation ID:</strong> {event.correlationId || 'N/A'}</Text>
                                                                        <Text><strong>User ID:</strong> {event.userId || 'N/A'}</Text>
                                                                        <Text><strong>Version:</strong> {event.version || 'N/A'}</Text>
                                                                        <Text><strong>To:</strong> {event.to || 'N/A'}</Text>
                                                                    </SimpleGrid>
                                                                </Box>
                                                                <Box>
                                                                    <Text fontWeight="bold" mb={2} fontSize="sm">Event Details (JSON):</Text>
                                                                    <Code
                                                                        display="block"
                                                                        whiteSpace="pre"
                                                                        p={3}
                                                                        borderRadius="md"
                                                                        fontSize="xs"
                                                                        overflowX="auto"
                                                                    >
                                                                        {event.eventdetails ?
                                                                            JSON.stringify(JSON.parse(event.eventdetails), null, 2) :
                                                                            'No eventdetails available'
                                                                        }
                                                                    </Code>
                                                                </Box>
                                                            </VStack>
                                                        </Box>
                                                    </Collapse>
                                                </Td>
                                            </Tr>
                                        </React.Fragment>
                                    );
                                })}
                            </Tbody>
                        </Table>
                    </Box>
                ) : (
                    <Text color="gray.500">No events recorded yet.</Text>
                )}
            </Box>
        </VStack>
    );
};

export default DataVisualizer;
