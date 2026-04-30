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

const SignupPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignup = (e) => {
    e.preventDefault();
    toast({
      title: "Account Created",
      description: "Welcome to Rule-Engine!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    navigate('/payload-dashboard');
  };

  return (
    <AuthLayout reverse={true}>
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} align="center">
          <Heading size="xl" fontWeight="700">Signup</Heading>
          <Text fontSize="md" fontWeight="600" color="gray.600">Welcome Back!</Text>
          <Text fontSize="sm" color="gray.500">Thrilled To Have You Here !!</Text>
        </VStack>

        <form onSubmit={handleSignup}>
          <VStack spacing={3}>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">Name <Text as="span" color="red.500">*</Text></FormLabel>
              <Input 
                type="text" 
                placeholder="Enter your name" 
                borderRadius="xl"
                size="md"
                focusBorderColor="blue.500"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">Email ID <Text as="span" color="red.500">*</Text></FormLabel>
              <Input 
                type="email" 
                placeholder="Enter your email" 
                borderRadius="xl"
                size="md"
                focusBorderColor="blue.500"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">Password <Text as="span" color="red.500">*</Text></FormLabel>
              <Input 
                type="password" 
                placeholder="Enter your password" 
                borderRadius="xl"
                size="md"
                focusBorderColor="blue.500"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">Confirm Password <Text as="span" color="red.500">*</Text></FormLabel>
              <Input 
                type="password" 
                placeholder="Confirm your password" 
                borderRadius="xl"
                size="md"
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
              Signup
            </Button>
          </VStack>
        </form>

        <Text textAlign="center" fontSize="sm" color="gray.600">
          Already Have An Account ?{' '}
          <Link color="blue.500" fontWeight="600" onClick={() => navigate('/login')}>
            Login
          </Link>
        </Text>
      </VStack>
    </AuthLayout>
  );
};

export default SignupPage;
