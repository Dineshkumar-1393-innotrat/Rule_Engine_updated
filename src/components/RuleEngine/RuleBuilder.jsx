import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Select,
    Button,
    Heading,
    useColorModeValue,
    IconButton,
    List,
    ListItem,
    Text,
    Badge,
    Divider,
    Collapse,
    Tooltip,
    Grid,
    GridItem,
    Stack
} from '@chakra-ui/react';
import { FaTrash, FaPlus, FaChevronDown, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import { AvailableFacts, DeviceStates, DeviceVariables, ConfigurableParameters } from '../../utils/RuleEngine';

const RuleBuilder = ({ rules, savedRules = [], onAddRule, onDeleteRule, onSaveToLibrary, prefillRule, availableFacts }) => {
    const factsToUse = availableFacts || AvailableFacts;
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const sectionBg = useColorModeValue('gray.50', 'gray.700');

    const [newRuleName, setNewRuleName] = useState('');
    const [conditions, setConditions] = useState([
        { fact: 'speed', operator: '>', value: '' }
    ]);
    const [severity, setSeverity] = useState('info');
    const [message, setMessage] = useState('');

    // Collapsible sections state
    const [showVariables, setShowVariables] = useState(true);
    const [showParameters, setShowParameters] = useState(true);
    const [showStates, setShowStates] = useState(true);

    // Group facts by category for display
    const factsByCategory = factsToUse.reduce((acc, fact) => {
        if (!acc[fact.category]) acc[fact.category] = [];
        acc[fact.category].push(fact);
        return acc;
    }, {});

    const handleAddCondition = () => {
        setConditions([...conditions, { fact: 'speed', operator: '>', value: '' }]);
    };

    const handleConditionChange = (index, field, value) => {
        const newConditions = [...conditions];
        newConditions[index][field] = value;
        setConditions(newConditions);
    };

    const handleRemoveCondition = (index) => {
        const newConditions = conditions.filter((_, i) => i !== index);
        setConditions(newConditions);
    };

    const handleLoadRule = (ruleId) => {
        const ruleToLoad = savedRules.find(r => r.id === ruleId);
        if (ruleToLoad) {
            setNewRuleName(ruleToLoad.name);
            setConditions(ruleToLoad.conditions?.all || []);
            setMessage(ruleToLoad.event?.message || '');
            setSeverity(ruleToLoad.event?.severity || 'info');
        }
    };

    // Effect to handle prefilled rule from Template Library
    React.useEffect(() => {
        if (prefillRule) {
            setNewRuleName(prefillRule.title || '');
            setMessage(prefillRule.message || '');
            setSeverity(prefillRule.severity || 'info');

            // Attempt to map template constraints to conditions if possible
            // This is a basic mapping; templates might need more structured data for complex conditions
            if (prefillRule.minValue || prefillRule.maxValue) {
                const newConds = [];
                if (prefillRule.minValue) {
                    newConds.push({ fact: 'speed', operator: '>', value: prefillRule.minValue });
                }
                if (prefillRule.maxValue) {
                    newConds.push({ fact: 'speed', operator: '<', value: prefillRule.maxValue });
                }
                if (newConds.length > 0) setConditions(newConds);
            }
        }
    }, [prefillRule]);

    const createRuleObject = () => {
        if (!newRuleName || !message) return null;
        return {
            id: `rule-${Date.now()}`,
            name: newRuleName,
            conditions: {
                all: conditions.map(c => ({
                    ...c,
                    value: isNaN(c.value) ? c.value : Number(c.value)
                }))
            },
            event: {
                type: 'custom_event',
                message: message,
                severity: severity
            }
        };
    };

    const handleSubmit = () => {
        const newRule = createRuleObject();
        if (newRule) {
            onAddRule(newRule);
            resetForm();
        }
    };

    const handleSaveLibrary = () => {
        const newRule = createRuleObject();
        if (newRule) {
            if (onSaveToLibrary) {
                onSaveToLibrary(newRule);
            }
        }
    };

    const resetForm = () => {
        setNewRuleName('');
        setConditions([{ fact: 'speed', operator: '>', value: '' }]);
        setMessage('');
        setSeverity('info');
    };

    return (
        <VStack spacing={6} align="stretch">
            {/* Device States Section */}
            <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <HStack
                    justify="space-between"
                    cursor="pointer"
                    onClick={() => setShowStates(!showStates)}
                    mb={showStates ? 4 : 0}
                >
                    <HStack>
                        {showStates ? <FaChevronDown /> : <FaChevronRight />}
                        <Heading size="sm">Device States</Heading>
                    </HStack>
                    <Badge colorScheme="purple">{Object.keys(DeviceStates).length} states</Badge>
                </HStack>
                <Collapse in={showStates}>
                    <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={3}>
                        {Object.entries(DeviceStates).map(([key, value]) => (
                            <Box
                                key={key}
                                p={3}
                                bg={sectionBg}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={borderColor}
                            >
                                <Text fontWeight="bold" fontSize="sm" color="purple.500">{value}</Text>
                                <Text fontSize="xs" color="gray.500">
                                    {key === 'TRIP_IDLE' && 'No active trip'}
                                    {key === 'TRIP_PENDING' && 'Waiting to confirm'}
                                    {key === 'TRIP_ACTIVE' && 'Trip in progress'}
                                </Text>
                            </Box>
                        ))}
                    </Grid>
                </Collapse>
            </Box>

            {/* Device Variables Section */}
            <Box p={1} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <HStack
                    justify="space-between"
                    cursor="pointer"
                    onClick={() => setShowVariables(!showVariables)}
                    mb={showVariables ? 4 : 0}
                >
                    <HStack>
                        {showVariables ? <FaChevronDown /> : <FaChevronRight />}
                        <Heading size="sm">Device Internal Variables</Heading>
                    </HStack>
                    <Badge colorScheme="blue">{DeviceVariables.length} variables</Badge>
                </HStack>
                <Collapse in={showVariables}>
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
                        {DeviceVariables.map((variable) => (
                            <Box
                                key={variable.name}
                                p={3}
                                bg={sectionBg}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={borderColor}
                            >
                                <HStack justify="space-between" mb={1}>
                                    <Text fontWeight="bold" fontSize="sm" color="blue.500">{variable.name}</Text>
                                    <Badge size="sm" colorScheme={variable.category === 'trip' ? 'green' : 'orange'}>
                                        {variable.category}
                                    </Badge>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">{variable.description}</Text>
                                <Text fontSize="xs" color="gray.400">Type: {variable.type}</Text>
                            </Box>
                        ))}
                    </Grid>
                </Collapse>
            </Box>

            {/* Configurable Parameters Section */}
            <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <HStack
                    justify="space-between"
                    cursor="pointer"
                    onClick={() => setShowParameters(!showParameters)}
                    mb={showParameters ? 4 : 0}
                >
                    <HStack>
                        {showParameters ? <FaChevronDown /> : <FaChevronRight />}
                        <Heading size="sm">Configurable Parameters</Heading>
                    </HStack>
                    <Badge colorScheme="teal">{ConfigurableParameters.length} parameters</Badge>
                </HStack>
                <Collapse in={showParameters}>
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
                        {ConfigurableParameters.map((param) => (
                            <Box
                                key={param.name}
                                p={3}
                                bg={sectionBg}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={borderColor}
                            >
                                <Text fontWeight="bold" fontSize="sm" color="teal.500">{param.name}</Text>
                                <Text fontSize="xs" color="gray.500">{param.description}</Text>
                                <HStack mt={2} fontSize="xs">
                                    <Text>Default: <strong>{param.defaultValue} {param.unit}</strong></Text>
                                    <Text color="gray.400">Range: {param.min}-{param.max}</Text>
                                </HStack>
                            </Box>
                        ))}
                    </Grid>
                </Collapse>
            </Box>

            {/* Create New Rule Form */}
            <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <Heading size="md" mb={4}>Create New Rule</Heading>

                {/* Load from Library */}
                <FormControl mb={4}>
                    <FormLabel>Load from Library</FormLabel>
                    <Select placeholder="Select a saved rule..." onChange={(e) => handleLoadRule(e.target.value)} color="black">
                        {savedRules.map(rule => (
                            <option key={rule.id} value={rule.id}>{rule.name}</option>
                        ))}
                    </Select>
                </FormControl>
                <Divider mb={4} />

                <VStack spacing={4}>
                    <FormControl isRequired>
                        <FormLabel>Rule Name</FormLabel>
                        <Input
                            placeholder="e.g., Harsh Braking"
                            value={newRuleName}
                            onChange={(e) => setNewRuleName(e.target.value)}
                            color="black"
                        />
                    </FormControl>

                    <Text fontWeight="bold" alignSelf="start">Conditions (AND)</Text>
                    {conditions.map((condition, index) => (
                        <Box key={index} width="100%">
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={2} align="center">
                                <Select
                                    value={condition.fact}
                                    onChange={(e) => handleConditionChange(index, 'fact', e.target.value)}
                                    width={{ base: "full", md: "200px" }}
                                    color="black"
                                >
                                    {/* Group facts by category */}
                                    {Object.entries(factsByCategory).map(([category, facts]) => (
                                        <optgroup key={category} label={category.toUpperCase()}>
                                            {facts.map(fact => (
                                                <option key={fact.name} value={fact.name}>{fact.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </Select>
                                <Select
                                    value={condition.operator}
                                    onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                                    width={{ base: "full", md: "120px" }}
                                    color="black"
                                >
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value="==">==</option>
                                    <option value="!=">!=</option>
                                    <option value=">=">&gt;=</option>
                                    <option value="<=">&lt;=</option>
                                </Select>
                                <Input
                                    placeholder="Value"
                                    value={condition.value}
                                    onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                                    color="black"
                                    flex={1}
                                />
                                <IconButton
                                    icon={<FaTrash />}
                                    colorScheme="red"
                                    size="sm"
                                    onClick={() => handleRemoveCondition(index)}
                                    isDisabled={conditions.length === 1}
                                    width={{ base: "full", md: "auto" }}
                                />
                            </Stack>
                        </Box>
                    ))}
                    <Button leftIcon={<FaPlus />} size="xs" onClick={handleAddCondition} alignSelf="start">
                        Add Condition
                    </Button>

                    <Divider />

                    <FormControl isRequired>
                        <FormLabel>Event Message</FormLabel>
                        <Input
                            placeholder="e.g., Driver is braking too hard!"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            color="black"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Severity</FormLabel>
                        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} color="black">
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </Select>
                    </FormControl>

                    <HStack width="100%" spacing={4}>
                        <Button colorScheme="blue" flex={1} onClick={handleSubmit}>
                            Add to Engine
                        </Button>
                        <Button variant="outline" flex={1} onClick={handleSaveLibrary}>
                            Save to Library
                        </Button>
                    </HStack>
                </VStack>
            </Box>

            {/* Existing Rules List */}
            <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <Heading size="md" mb={4}>Active Rules</Heading>
                <List spacing={3}>
                    {rules.map((rule) => (
                        <ListItem key={rule.id} p={3} borderWidth="1px" borderRadius="md" display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <HStack mb={1}>
                                    <Text fontWeight="bold">{rule.name}</Text>
                                    <Badge colorScheme={rule.event.severity === 'critical' ? 'red' : rule.event.severity === 'warning' ? 'orange' : 'blue'}>
                                        {rule.event.severity}
                                    </Badge>
                                </HStack>
                                <Text fontSize="sm" color="gray.500">
                                    {rule.conditions?.all
                                        ? rule.conditions.all.map(c => `${c.fact} ${c.operator} ${c.value}`).join(' AND ')
                                        : rule.condition || 'No conditions defined'}
                                </Text>
                            </Box>
                            <IconButton
                                icon={<FaTrash />}
                                colorScheme="red"
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteRule(rule.id)}
                            />
                        </ListItem>
                    ))}
                    {rules.length === 0 && <Text>No rules defined.</Text>}
                </List>
            </Box>
        </VStack>
    );
};

export default RuleBuilder;
