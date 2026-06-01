import React, { useState } from 'react';
import { Box, Heading, Input, Button, VStack, Radio, RadioGroup, Stack, Flex, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const DeviceSearchPage = () => {
    const [searchType, setSearchType] = useState('VIN');
    const [searchValue, setSearchValue] = useState('');
    const navigate = useNavigate();

    const handleSearch = () => {
        if (!searchValue) return;
        // In a real app, we might call the search API here and display results, or navigate directly if it's VIN
        if (searchType === 'VIN') {
            navigate(`/manufacturing/devices/${searchValue}`);
        } else {
            // Mock pattern search navigate
            navigate(`/manufacturing/devices/mock-${searchValue}`);
        }
    };

    return (
        <Box maxW="600px">
            <Heading size="lg" mb={6}>Device Search</Heading>
            <Box borderWidth="1px" borderRadius="md" p={6} bg="white" _dark={{ bg: 'gray.800' }}>
                <VStack align="stretch" spacing={4}>
                    <Flex align="center">
                        <Text w="100px" fontWeight="bold">Search by:</Text>
                        <RadioGroup value={searchType} onChange={setSearchType}>
                            <Stack direction="row" spacing={4}>
                                <Radio value="VIN">VIN</Radio>
                                <Radio value="IMEI">IMEI</Radio>
                                <Radio value="Serial Number">Serial Number</Radio>
                            </Stack>
                        </RadioGroup>
                    </Flex>
                    <Flex>
                        <Input 
                            placeholder={`Enter ${searchType} number...`} 
                            value={searchValue} 
                            onChange={(e) => setSearchValue(e.target.value)} 
                            mr={2}
                        />
                        <Button colorScheme="blue" onClick={handleSearch}>Search</Button>
                    </Flex>
                </VStack>
            </Box>
        </Box>
    );
};

export default DeviceSearchPage;
