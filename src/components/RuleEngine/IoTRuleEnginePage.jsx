import React from 'react';
import { Box, Flex, IconButton, Text, Spacer, useColorModeValue, Container } from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MultiDomainRuleEngine from './MultiDomainRuleEngine';

const IoTRuleEnginePage = () => {
    const navigate = useNavigate();

    return (
        <Box minH="100vh" bg="gray.50">
            {/* Premium Light Header */}
            <Flex
                px={6}
                py={3}
                bg="white"
                borderBottom="1px solid"
                borderColor="gray.200"
                align="center"
                position="sticky"
                top={0}
                zIndex={100}
                boxShadow="sm"
            >
                <IconButton
                    icon={<ArrowLeft size={20} />}
                    variant="ghost"
                    color="gray.600"
                    _hover={{ color: "blue.500", bg: "blue.50" }}
                    onClick={() => navigate('/')}
                    aria-label="Back to Dashboard"
                    mr={4}
                    borderRadius="lg"
                />
                <Box>
                    <Text fontSize="md" fontWeight="800" color="gray.800" letterSpacing="0.5px">
                        IOT CONTROL CENTER
                    </Text>
                    <Text fontSize="10px" color="gray.500" fontWeight="bold" letterSpacing="0.5px">
                        MULTI-DOMAIN SIMULATION & POLICY MANAGEMENT
                    </Text>
                </Box>
                <Spacer />
            </Flex>

            {/* Main Content Area */}
            <Box maxW="1800px" mx="auto">
                <MultiDomainRuleEngine />
            </Box>
        </Box>
    );
};

export default IoTRuleEnginePage;
