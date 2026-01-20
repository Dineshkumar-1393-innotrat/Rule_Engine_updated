import React from 'react';
import {
    Box,
    Button,
    Container,
    Flex,
    Heading,
    Input,
    InputGroup,
    InputLeftElement,
    Tag,
    TagLabel,
    TagLeftIcon,
    Text,
    Grid,
    GridItem,
    VStack,
    HStack,
    useColorModeValue,
    Icon,
    Spacer
} from '@chakra-ui/react';
import { SearchIcon, AddIcon } from '@chakra-ui/icons';
import { FaThermometerHalf, FaRunning, FaBatteryThreeQuarters, FaTags } from 'react-icons/fa';

const TemplateCard = ({ title, description, tags, onUse }) => {
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Box
            bg={bgColor}
            p={6}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
            display="flex"
            flexDirection="column"
            height="100%"
        >
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="md" fontWeight="bold">{title}</Heading>
                <HStack fontSize="xs" color="gray.500">
                    <Icon as={FaTags} />
                    <HStack spacing={1}>
                        {tags && tags.map((tag, i) => (
                            <Tag key={i} size="sm" variant="subtle" colorScheme="blue">
                                {tag}
                            </Tag>
                        ))}
                    </HStack>
                </HStack>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb={6} flex="1">
                {description}
            </Text>
            <Button colorScheme="blue" width="100%" borderRadius="full" onClick={() => onUse(title)}>
                Use Template
            </Button>
        </Box>
    );
};

const RuleTemplateLibrary = ({ onCreateNew, templates, onUseTemplate }) => {
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const [searchQuery, setSearchQuery] = React.useState('');

    // Display templates passed from parent, or empty array if none.
    const allTemplates = Array.isArray(templates) ? templates : [];

    const displayTemplates = allTemplates.filter(t => {
        const query = searchQuery.toLowerCase();
        return (
            (t.title && t.title.toLowerCase().includes(query)) ||
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.tags && Array.isArray(t.tags) && t.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    });

    return (
        <Box bg={bgColor} minH="100%" p={8} borderRadius="xl">
            <Flex justify="space-between" align="center" mb={2} wrap="wrap" gap={4}>
                <Box>
                    <Heading size="lg" mb={1}>Rule Templates</Heading>
                    <Text color="gray.500" fontSize="sm">Choose A Template Quickly To Create A Rule</Text>
                </Box>
                <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    borderRadius="full"
                    size="sm"
                    onClick={onCreateNew}
                >
                    Create Template
                </Button>
            </Flex>

            <Box mb={6} mt={6}>
                <InputGroup mb={4} maxW="400px">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search Template By Name, Category"
                        borderRadius="full"
                        bg="white"
                        color="black"
                        _dark={{ bg: 'gray.700', color: 'white' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </InputGroup>

                <Flex wrap="wrap" gap={2} align="center">
                    <Text fontSize="sm" fontWeight="medium" mr={2}>Quick Tags :</Text>
                    <Tag size="md" borderRadius="full" variant="subtle" colorScheme="red" cursor="pointer" onClick={() => setSearchQuery('Temperature')}>
                        <TagLeftIcon boxSize="12px" as={FaThermometerHalf} />
                        <TagLabel>Temperature</TagLabel>
                    </Tag>
                    <Tag size="md" borderRadius="full" variant="subtle" colorScheme="cyan" cursor="pointer" onClick={() => setSearchQuery('Motion')}>
                        <TagLeftIcon boxSize="12px" as={FaRunning} />
                        <TagLabel>Motion</TagLabel>
                    </Tag>
                    <Tag size="md" borderRadius="full" variant="subtle" colorScheme="green" cursor="pointer" onClick={() => setSearchQuery('Battery')}>
                        <TagLeftIcon boxSize="12px" as={FaBatteryThreeQuarters} />
                        <TagLabel>Battery</TagLabel>
                    </Tag>
                </Flex>
            </Box>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
                {displayTemplates.length > 0 ? (
                    displayTemplates.map((t, i) => (
                        <GridItem key={i}>
                            <TemplateCard
                                title={t.title}
                                description={t.description}
                                onUse={() => onUseTemplate && onUseTemplate(t)}
                            />
                        </GridItem>
                    ))
                ) : (
                    <Box gridColumn="1 / -1" textAlign="center" py={10} color="gray.500">
                        <Text>No templates found.</Text>
                    </Box>
                )}
            </Grid>
        </Box>
    );
};

export default RuleTemplateLibrary;
