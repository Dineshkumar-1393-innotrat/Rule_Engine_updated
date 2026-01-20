import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    SimpleGrid,
    Card,
    CardBody,
    CardHeader,
    Heading,
    Divider,
    Icon,
    Badge
} from '@chakra-ui/react';
import { Settings, Activity, Gauge, Timer, MapPin } from 'lucide-react';

const TripConfiguration = ({ parameters, setParameters }) => {
    const handleParameterChange = (key, value) => {
        setParameters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const ParameterItem = ({ label, description, value, onChange, min, max, step, icon, unit }) => (
        <FormControl>
            <HStack
                justify="space-between"
                align={{ base: "flex-start", md: "center" }}
                py={{ base: 2, md: 3 }}
                px={{ base: 1, md: 2 }}
                borderRadius="lg"
                _hover={{ bg: 'gray.50' }}
                transition="all 0.2s"
                flexDirection={{ base: "column", md: "row" }}
                spacing={{ base: 2, md: 0 }}
            >
                <HStack spacing={{ base: 3, md: 4 }} align="flex-start" flex={1} w={{ base: "full", md: "auto" }}>
                    <Box mt={1} p={2} bg="blue.50" borderRadius="lg" color="blue.600">
                        <Icon as={icon} boxSize={5} />
                    </Box>
                    <Box>
                        <FormLabel mb={0} fontWeight="bold" fontSize="md" color="gray.800">{label}</FormLabel>
                        <Text fontSize="xs" color="gray.500" maxW="350px">{description}</Text>
                    </Box>
                </HStack>
                <HStack align="center" spacing={3} w={{ base: "full", md: "auto" }} justify={{ base: "space-between", md: "flex-end" }}>
                    <NumberInput
                        value={value}
                        onChange={(_, val) => onChange(isNaN(val) ? min : val)}
                        min={min}
                        max={max}
                        step={step}
                        w={{ base: "140px", md: "120px" }}
                        size="md"
                        variant="outline"
                        h="44px"
                    >
                        <NumberInputField
                            color="black"
                            borderColor="gray.300"
                            bg="white"
                            fontWeight="bold"
                            borderRadius="lg"
                            h="44px"
                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                        />
                        <NumberInputStepper>
                            <NumberIncrementStepper
                                borderLeft="1px solid"
                                borderColor="gray.200"
                                color="gray.600"
                            />
                            <NumberDecrementStepper
                                borderLeft="1px solid"
                                borderTop="1px solid"
                                borderColor="gray.200"
                                color="gray.600"
                            />
                        </NumberInputStepper>
                    </NumberInput>
                    {unit && (
                        <Box minW="100px">
                            <Text
                                fontSize="10px"
                                fontWeight="black"
                                color="blue.500"
                                textTransform="uppercase"
                                lineHeight="shorter"
                                letterSpacing="wider"
                            >
                                {unit}
                            </Text>
                        </Box>
                    )}
                </HStack>
            </HStack>
        </FormControl>
    );

    return (
        <Box p={{ base: 2, md: 3, lg: 4 }}>
            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={{ base: 6, lg: 8 }}>
                <Card variant="outline" borderColor="gray.200" boxShadow="sm" borderRadius="xl">
                    <CardHeader py={4} borderBottomWidth="1px">
                        <HStack spacing={3}>
                            <Box p={2} bg="blue.50" borderRadius="lg" color="blue.500">
                                <Icon as={MapPin} boxSize={6} />
                            </Box>
                            <Box>
                                <Heading size="sm">Core Trip Parameters</Heading>
                                <Text fontSize="xs" color="gray.500">Thresholds for trip start and end detection.</Text>
                            </Box>
                        </HStack>
                    </CardHeader>
                    <CardBody p={2}>
                        <VStack spacing={0} align="stretch" divider={<Divider borderColor="gray.100" />}>
                            <ParameterItem
                                label="Minimum Trip Distance"
                                description="The minimum distance a vehicle must travel to be recorded as a valid journey."
                                value={parameters.MIN_TRIP_DISTANCE}
                                onChange={(val) => handleParameterChange('MIN_TRIP_DISTANCE', val)}
                                min={0.1}
                                max={50}
                                step={0.5}
                                icon={MapPin}
                                unit="Kilometers (km)"
                            />
                            <ParameterItem
                                label="Min Ignition Off Time"
                                description="Wait time before a temporary stop counts as a potential trip pause."
                                value={parameters.MIN_IGN_OFF_TIME}
                                onChange={(val) => handleParameterChange('MIN_IGN_OFF_TIME', val)}
                                min={5}
                                max={3600}
                                step={10}
                                icon={Timer}
                                unit="Seconds (s)"
                            />
                            <ParameterItem
                                label="Max Ignition Off Time"
                                description="The maximum allowed time for ignition to be off before the trip is automatically finalized."
                                value={parameters.MAX_IGN_OFF_TIME}
                                onChange={(val) => handleParameterChange('MAX_IGN_OFF_TIME', val)}
                                min={10}
                                max={3600}
                                step={10}
                                icon={Timer}
                                unit="Seconds (s)"
                            />
                            <ParameterItem
                                label="Max Ignition On Time"
                                description="The maximum allowed duration for a single trip while ignition remains ON."
                                value={parameters.MAX_IGN_ON_TIME}
                                onChange={(val) => handleParameterChange('MAX_IGN_ON_TIME', val)}
                                min={60}
                                max={86400}
                                step={60}
                                icon={Timer}
                                unit="Seconds (s)"
                            />
                        </VStack>
                    </CardBody>
                </Card>

                <Card variant="outline" borderColor="gray.200" boxShadow="sm" borderRadius="xl">
                    <CardHeader py={4} borderBottomWidth="1px">
                        <HStack spacing={3}>
                            <Box p={2} bg="orange.50" borderRadius="lg" color="orange.500">
                                <Icon as={Activity} boxSize={6} />
                            </Box>
                            <Box>
                                <Heading size="sm">Behavioral Thresholds</Heading>
                                <Text fontSize="xs" color="gray.500">Driving performance and efficiency limits.</Text>
                            </Box>
                        </HStack>
                    </CardHeader>
                    <CardBody p={2}>
                        <VStack spacing={0} align="stretch" divider={<Divider borderColor="gray.100" />}>
                            <ParameterItem
                                label="Overspeed Threshold"
                                description="Speed limit above which an overspeed alert is triggered and recorded."
                                value={parameters.OVERSPEED_THR}
                                onChange={(val) => handleParameterChange('OVERSPEED_THR', val)}
                                min={20}
                                max={200}
                                step={5}
                                icon={Gauge}
                                unit="km/h"
                            />
                            <ParameterItem
                                label="Harsh Acceleration"
                                description="Significant increase in speed within a short duration."
                                value={parameters.HARSH_ACCEL_THR}
                                onChange={(val) => handleParameterChange('HARSH_ACCEL_THR', val)}
                                min={1}
                                max={50}
                                step={1}
                                icon={Activity}
                                unit="km/h/s"
                            />
                            <ParameterItem
                                label="Harsh Braking"
                                description="Sudden decrease in speed indicating emergency or unsafe braking."
                                value={parameters.HARD_BRAKE_THR}
                                onChange={(val) => handleParameterChange('HARD_BRAKE_THR', val)}
                                min={1}
                                max={50}
                                step={1}
                                icon={Settings}
                                unit="km/h/s"
                            />
                        </VStack>
                    </CardBody>
                </Card>
            </SimpleGrid>
        </Box>
    );
};

export default TripConfiguration;
