import React from 'react';
import { 
  VStack, 
  Heading, 
  Text, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  Link, 
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';

const LoginPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    // For now, just navigate to dashboard
    toast({
      title: "Login Successful",
      description: "Welcome back!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    navigate('/payload-dashboard');
  };

  return (
    <AuthLayout reverse={false}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={2} align="center">
          <Heading size="xl" fontWeight="700">Login</Heading>
          <Text fontSize="md" fontWeight="600" color="gray.600">Welcome Back!</Text>
          <Text fontSize="sm" color="gray.500">Signin To Your Account To Continue</Text>
        </VStack>

        <form onSubmit={handleLogin}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">Email <Text as="span" color="red.500">*</Text></FormLabel>
              <Input 
                type="email" 
                placeholder="Enter your email" 
                borderRadius="xl"
                size="lg"
                focusBorderColor="blue.500"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">Password <Text as="span" color="red.500">*</Text></FormLabel>
              <Input 
                type="password" 
                placeholder="Enter your password" 
                borderRadius="xl"
                size="lg"
                focusBorderColor="blue.500"
              />
            </FormControl>

            <Button 
              type="submit"
              bg="#0A1172" 
              color="white" 
              size="lg" 
              w="full" 
              borderRadius="xl"
              _hover={{ bg: "#000080" }}
              mt={4}
            >
              Login
            </Button>
          </VStack>
        </form>

        <Text textAlign="center" fontSize="sm" color="gray.600">
          Don't Have An Account?{' '}
          <Link color="blue.500" fontWeight="600" onClick={() => navigate('/signup')}>
            Signup
          </Link>
        </Text>
      </VStack>
    </AuthLayout>
  );
};

export default LoginPage;
