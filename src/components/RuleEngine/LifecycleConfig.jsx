import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Select,
    Switch,
    FormControl,
    FormLabel,
    SimpleGrid,
    Heading,
    Card,
    CardHeader,
    CardBody,
    Divider,
    Badge,
    Flex,
    useColorModeValue
} from '@chakra-ui/react';
import { DeviceStates } from '../../utils/RuleEngine';

const LifecycleConfig = ({ rules, onUpdateRule }) => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderCol = useColorModeValue('gray.200', 'gray.700');

    const handleSubsystemToggle = (state, subsystem) => {
        const updatedRule = {
            ...rules[state],
            subsystems: {
                ...rules[state].subsystems,
                [subsystem]: !rules[state].subsystems[subsystem]
            }
        };
        onUpdateRule(state, updatedRule);
    };

    const handleIdentityChange = (state, identity) => {
        const updatedRule = {
            ...rules[state],
            identity
        };
        onUpdateRule(state, updatedRule);
    };

    const handleActionToggle = (state, action) => {
        const updatedRule = {
            ...rules[state],
            allowedActions: {
                ...rules[state].allowedActions,
                [action]: !rules[state].allowedActions[action]
            }
        };
        onUpdateRule(state, updatedRule);
    };

    return (
        <VStack spacing={6} align="stretch" w="full">
            <Box>
                <Heading size="md" mb={2}>Lifecycle Rule Configuration</Heading>
                <Text color="gray.500">Define subsystem behavior and identity usage for each lifecycle state.</Text>
            </Box>

            {Object.keys(DeviceStates).map((stateKey) => {
                const state = DeviceStates[stateKey];
                const rule = rules[state];
                if (!rule) return null;

                return (
                    <Card key={state} variant="outline" bg={cardBg} borderColor={borderCol}>
                        <CardHeader pb={2}>
                            <HStack justify="space-between">
                                <Badge colorScheme="blue" fontSize="md">{state}</Badge>
                                <Text fontSize="sm" color="gray.500">State ID: {stateKey}</Text>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                                {/* Identity Section */}
                                <VStack align="stretch" spacing={3}>
                                    <Text fontWeight="bold" fontSize="sm">Identity Mapping</Text>
                                    <FormControl>
                                        <FormLabel fontSize="xs">Allowed Identity</FormLabel>
                                        <Select
                                            size="sm"
                                            value={rule.identity}
                                            onChange={(e) => handleIdentityChange(state, e.target.value)}
                                        >
                                            <option value="IMEI">IMEI</option>
                                            <option value="VIN">VIN</option>
                                            <option value="MSISDN">MSISDN</option>
                                            <option value="VehicleId">VehicleId</option>
                                        </Select>
                                    </FormControl>
                                </VStack>

                                {/* Subsystems Section */}
                                <VStack align="stretch" spacing={3}>
                                    <Text fontWeight="bold" fontSize="sm">Subsystem Enablement</Text>
                                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                                        {Object.keys(rule.subsystems).map((sub) => (
                                            <Flex key={sub} justify="space-between" align="center" gap={2}>
                                                <Text fontSize="xs">{sub}</Text>
                                                <Switch
                                                    size="sm"
                                                    isChecked={rule.subsystems[sub]}
                                                    onChange={() => handleSubsystemToggle(state, sub)}
                                                />
                                            </Flex>
                                        ))}
                                    </SimpleGrid>
                                </VStack>

                                {/* Actions Section */}
                                <VStack align="stretch" spacing={3}>
                                    <Text fontWeight="bold" fontSize="sm">Allowed Actions</Text>
                                    <VStack spacing={2} align="stretch">
                                        {Object.keys(rule.allowedActions).map((action) => (
                                            <Flex key={action} justify="space-between" align="center" gap={2}>
                                                <Text fontSize="xs">{action.replace(/([A-Z])/g, ' $1').trim()}</Text>
                                                <Switch
                                                    size="sm"
                                                    isChecked={rule.allowedActions[action]}
                                                    colorScheme="green"
                                                    onChange={() => handleActionToggle(state, action)}
                                                />
                                            </Flex>
                                        ))}
                                    </VStack>
                                </VStack>
                            </SimpleGrid>
                        </CardBody>
                    </Card>
                );
            })}
        </VStack>
    );
};

export default LifecycleConfig;
