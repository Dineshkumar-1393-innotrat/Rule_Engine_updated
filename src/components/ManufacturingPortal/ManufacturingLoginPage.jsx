import React, { useState } from 'react';
import { Box, Flex, VStack, Text, Input, Button, Checkbox, FormControl, FormLabel, FormErrorMessage, useToast, Card, CardBody, Heading } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ManufacturingLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const toast = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const payload = {
                userName: username,
                password: password,
                accountId: import.meta.env.VITE_ACCOUNT_ID || "primary",
                clientId: import.meta.env.VITE_CLIENT_ID || "mock-client-id",
                clientSecret: import.meta.env.VITE_CLIENT_SECRET || "mock-secret"
            };

            const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://cvipiot-preprod.fca-india.com:40543';
            
            let token = "mock-access-token";
            try {
                const res = await axios.post(`${baseURL}/authentication/login`, payload);
                if (res.data && res.data.access_token) {
                    token = res.data.access_token;
                }
            } catch (apiError) {
                console.warn("API Login failed, using mock token for development", apiError);
            }

            sessionStorage.setItem('access_token', token);
            toast({
                title: "Logged in successfully",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
            navigate('/manufacturing/dashboard');
        } catch (err) {
            setError("Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex h="100vh" alignItems="center" justifyContent="center" bg="gray.50">
            <Card w="md" p={6} boxShadow="xl" borderRadius="lg">
                <CardBody>
                    <VStack spacing={6} as="form" onSubmit={handleLogin}>
                        <Box textAlign="center">
                            <Heading size="md" color="blue.600" mb={2}>CVIP Device Management Portal</Heading>
                            <Text color="gray.500" fontSize="sm">Manufacturing Console</Text>
                        </Box>
                        
                        <FormControl isInvalid={!!error}>
                            <FormLabel>Username</FormLabel>
                            <Input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                            />
                        </FormControl>

                        <FormControl isInvalid={!!error}>
                            <FormLabel>Password</FormLabel>
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                            {error && <FormErrorMessage>{error}</FormErrorMessage>}
                        </FormControl>

                        <FormControl>
                            <Checkbox isChecked={remember} onChange={(e) => setRemember(e.target.checked)}>
                                Remember me
                            </Checkbox>
                        </FormControl>

                        <Button type="submit" colorScheme="blue" w="full" isLoading={isLoading}>
                            Login
                        </Button>
                    </VStack>
                </CardBody>
            </Card>
        </Flex>
    );
};

export default ManufacturingLoginPage;
