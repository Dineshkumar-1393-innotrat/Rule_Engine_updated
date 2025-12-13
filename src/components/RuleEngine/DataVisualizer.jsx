import React from 'react';
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
} from '@chakra-ui/react';

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

    const latestData = dataHistory[dataHistory.length - 1] || {};

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

            {/* Event Log removed - displayed globally in Dashboard */}
        </VStack>
    );
};

export default DataVisualizer;
