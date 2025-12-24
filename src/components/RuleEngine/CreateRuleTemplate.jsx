import React from 'react';
import {
    Box,
    Button,
    Heading,
    Text,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    RadioGroup,
    Radio,
    Stack,
    HStack,
    Grid,
    GridItem,
    useColorModeValue,
    Alert,
    AlertIcon,
    Flex,
    Tag,
    TagLabel,
    TagLeftIcon,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { FaThermometerHalf, FaRunning, FaBatteryThreeQuarters } from 'react-icons/fa';

const CreateRuleTemplate = ({ onCancel, onSave }) => {
    const bgColor = useColorModeValue('white', 'gray.800');

    // Form State
    const [name, setName] = React.useState('');
    const [tags, setTags] = React.useState('');
    const [pattern, setPattern] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [severity, setSeverity] = React.useState('info');
    const [minValue, setMinValue] = React.useState('');
    const [maxValue, setMaxValue] = React.useState('');
    const [unit, setUnit] = React.useState('');

    const handleSave = () => {
        const newTemplate = {
            title: name || "Untitled Rule",
            description: message || "No description provided",
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            pattern,
            severity,
            constraints: { min: minValue, max: maxValue, unit }
        };
        onSave(newTemplate);
    };

    return (
        <Box p={8} bg={bgColor} borderRadius="xl" maxW="800px" mx="auto">
            <Box textAlign="center" mb={10}>
                <Heading size="lg" mb={2}>Create Rule Template</Heading>
                <Text color="gray.500" fontSize="sm">
                    Fill-In-The-Blanks Form That Lets You Create Custom Rule Template
                </Text>
            </Box>

            <VStackSpacing4>
                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">Rule Name</FormLabel>
                    <Input
                        placeholder="Enter Rule Name"
                        borderRadius="md"
                        color="black"
                        _dark={{ color: "white" }}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </FormControl>

                <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium">Add Quick Tags</FormLabel>
                    <Input
                        placeholder="Eg: Malloc, Float, Memory"
                        borderRadius="md"
                        color="black"
                        _dark={{ color: "white" }}
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                    <HStack spacing={2} mt={2}>
                        <Tag size="md" borderRadius="full" variant="subtle" colorScheme="red" cursor="pointer" onClick={() => setTags(prev => prev ? `${prev}, Temperature` : 'Temperature')}>
                            <TagLeftIcon boxSize="12px" as={FaThermometerHalf} />
                            <TagLabel>Temperature</TagLabel>
                        </Tag>
                        <Tag size="md" borderRadius="full" variant="subtle" colorScheme="cyan" cursor="pointer" onClick={() => setTags(prev => prev ? `${prev}, Motion` : 'Motion')}>
                            <TagLeftIcon boxSize="12px" as={FaRunning} />
                            <TagLabel>Motion</TagLabel>
                        </Tag>
                        <Tag size="md" borderRadius="full" variant="subtle" colorScheme="green" cursor="pointer" onClick={() => setTags(prev => prev ? `${prev}, Battery` : 'Battery')}>
                            <TagLeftIcon boxSize="12px" as={FaBatteryThreeQuarters} />
                            <TagLabel>Battery</TagLabel>
                        </Tag>
                    </HStack>
                </FormControl>

                <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium">Find Pattern</FormLabel>
                    <Input
                        placeholder="Eg: Malloc('Float"
                        borderRadius="md"
                        color="black"
                        _dark={{ color: "white" }}
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                    />
                    <HStack mt={2} spacing={2} alignItems="center">
                        <InfoIcon color="orange.400" boxSize={3} />
                        <Text fontSize="xs" color="gray.600">Use Regular Expressions Or Exact String Matches</Text>
                    </HStack>
                </FormControl>

                <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium">Show This Message</FormLabel>
                    <Textarea
                        placeholder="Eg: Avoid Malloc In Embedded System"
                        borderRadius="md"
                        rows={3}
                        color="black"
                        _dark={{ color: "white" }}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </FormControl>

                <FormControl mt={6}>
                    <FormLabel fontSize="sm" fontWeight="medium">Severity</FormLabel>
                    <RadioGroup value={severity} onChange={setSeverity}>
                        <Stack direction="row" spacing={8}>
                            <Radio value="error" colorScheme="red">
                                <HStack spacing={1}><Box w={2} h={2} borderRadius="full" bg="red.500" /> <Text fontSize="sm">Error</Text></HStack>
                            </Radio>
                            <Radio value="warning" colorScheme="orange">
                                <HStack spacing={1}><Box w={2} h={2} borderRadius="full" bg="orange.400" /> <Text fontSize="sm">Warning</Text></HStack>
                            </Radio>
                            <Radio value="info" colorScheme="purple">
                                <HStack spacing={1}><Box w={2} h={2} borderRadius="full" bg="purple.500" /> <Text fontSize="sm">Info</Text></HStack>
                            </Radio>
                        </Stack>
                    </RadioGroup>
                </FormControl>

                <Box mt={6} width="100%">
                    <FormLabel fontSize="md" fontWeight="bold" mb={4}>Value Constraints</FormLabel>
                    <Text fontSize="sm" color="gray.500" mb={4}>Define Acceptable Ranges For Numeric Values In Your Code</Text>

                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="xs">Min Value</FormLabel>
                                <Input
                                    placeHolder="Enter Min Value"
                                    size="sm"
                                    borderRadius="md"
                                    color="black"
                                    _dark={{ color: "white" }}
                                    value={minValue}
                                    onChange={(e) => setMinValue(e.target.value)}
                                />
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="xs">Max Value</FormLabel>
                                <Input
                                    placeHolder="Enter Max Value"
                                    size="sm"
                                    borderRadius="md"
                                    color="black"
                                    _dark={{ color: "white" }}
                                    value={maxValue}
                                    onChange={(e) => setMaxValue(e.target.value)}
                                />
                            </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="xs">Unit</FormLabel>
                                <Input
                                    placeHolder="Eg: Bytes"
                                    size="sm"
                                    borderRadius="md"
                                    color="black"
                                    _dark={{ color: "white" }}
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                />
                            </FormControl>
                        </GridItem>
                    </Grid>

                    <Alert status="info" variant="subtle" mt={4} borderRadius="md" bg="purple.50" color="purple.800" fontSize="xs">
                        <AlertIcon color="purple.500" boxSize={4} />
                        Example: Set Min:0, Max:1024, Unit: Bytes To Flag Buffer Allocations Exceeding 1kb
                    </Alert>
                </Box>

                <FormControl mt={6}>
                    <FormLabel fontSize="sm" fontWeight="bold">👁 Rule Preview</FormLabel>
                    <Box
                        borderWidth="1px"
                        borderRadius="md"
                        p={4}
                        h="auto"
                        minH="100px"
                        color={name ? "inherit" : "gray.400"}
                        bg="gray.50"
                        _dark={{ bg: 'gray.900' }}
                    >
                        {name ? (
                            <Box>
                                <Text fontWeight="bold">{name}</Text>
                                <Text fontSize="sm">{message}</Text>
                                <HStack mt={2}>
                                    <Box w={2} h={2} borderRadius="full" bg={severity === 'error' ? 'red.500' : severity === 'warning' ? 'orange.400' : 'purple.500'} />
                                    <Text fontSize="xs" textTransform="capitalize">{severity}</Text>
                                </HStack>
                            </Box>
                        ) : (
                            <Text fontSize="sm">Rule Preview</Text>
                        )}
                    </Box>
                </FormControl>

                <Flex mt={8} justifyContent="center" gap={4}>
                    <Button variant="outline" borderColor="blue.500" color="blue.500" px={8} onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" bg="blue.800" px={8} _hover={{ bg: 'blue.700' }} onClick={handleSave}>
                        Save
                    </Button>
                </Flex>
            </VStackSpacing4>
        </Box>
    );
};

// Helper for consistency since I didn't import VStack properly in the initial thinking
const VStackSpacing4 = ({ children }) => (
    <Box width="100%">
        {children}
    </Box>
);

export default CreateRuleTemplate;
