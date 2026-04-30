import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Flex, 
  VStack, 
  Heading, 
  Text, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  Link, 
  useBreakpointValue,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Image
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

import iotIllustration from '../../assets/iot_illustration.png';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAuth = () => {
    setIsLogin(!isLogin);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    navigate(!isLogin ? '/login' : '/signup');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
        duration: 3000,
      });
      return;
    }

    const storageKey = isLogin ? 'rule_engine_user' : 'rule_engine_registered_user';
    localStorage.setItem(storageKey, JSON.stringify({
      email: formData.email,
      name: formData.name,
      lastLogin: new Date().toISOString()
    }));

    toast({
      title: isLogin ? "Login Successful" : "Account Created",
      description: isLogin ? "Welcome back!" : "Welcome to Rule-Engine!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    navigate('/payload-dashboard');
  };

  return (
    <Flex minH="100vh" bg="gray.50" overflow="hidden" position="relative" align="center" justify="center" p={4}>
      <MotionFlex
        w="full"
        maxW="900px"
        h={{ base: "auto", md: "550px" }}
        bg="white"
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.15)"
        direction={isLogin ? 'row' : 'row-reverse'}
        position="relative"
      >
        {/* Visual Side */}
        {!isMobile && (
          <Box 
            flex="1.2" 
            position="relative" 
            bg="white" 
            p={12} 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            style={{ perspective: "1000px" }}
          >
            <MotionBox
              initial={{ opacity: 0, scale: 0.8, rotateY: -30, rotateX: 10 }}
              animate={{ 
                opacity: 1, 
                scale: [1, 1.05, 1],
                y: [0, -20, 0],
                rotateY: [-5, 5, -5],
                rotateX: [5, -5, 5]
              }}
              transition={{ 
                opacity: { duration: 0.8 },
                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                rotateX: { duration: 7, repeat: Infinity, ease: "easeInOut" }
              }}
              whileHover={{ 
                scale: 1.1,
                rotateY: 0,
                rotateX: 0,
                transition: { duration: 0.3 }
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Image 
                src={iotIllustration} 
                alt="IoT Rule Engine Illustration" 
                maxW="100%" 
                h="auto" 
                fallbackSrc="https://via.placeholder.com/400x400?text=IoT+Rule+Engine"
              />
            </MotionBox>
          </Box>
        )}

        <Flex 
          flex="1" 
          bg="white" 
          m={{ base: 0, md: 4 }} 
          borderRadius={{ base: "none", md: "xl" }} 
          align="center" 
          justify="center" 
          p={{ base: 5, md: 8 }}
          position="relative"
          zIndex={2}
          overflow="hidden"
        >
          <AnimatePresence mode="wait">
            <MotionBox
              key={isLogin ? 'login' : 'signup'}
              w="full"
              initial={{ x: isLogin ? 20 : -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isLogin ? -20 : 20, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <VStack spacing={isLogin ? 6 : 4} align="stretch">
                <VStack spacing={1} align="center">
                  <Heading size="lg" fontWeight="700" color="gray.800">
                    {isLogin ? 'Login' : 'Signup'}
                  </Heading>
                  <Text fontSize="md" fontWeight="700" color="gray.800">
                    Welcome Back!
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontWeight="600">
                    {isLogin ? 'Signin To Your Account To Continue' : 'Thrilled To Have You Here !!'}
                  </Text>
                </VStack>

                <form onSubmit={handleSubmit}>
                  <VStack spacing={isLogin ? 4 : 3}>
                    {!isLogin && (
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700" mb={1}>Name</FormLabel>
                        <Input 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          type="text" 
                          placeholder="Enter your name" 
                          borderRadius="md"
                          h="38px"
                          fontSize="sm"
                          focusBorderColor="blue.500"
                        />
                      </FormControl>
                    )}

                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="700" mb={1}>
                        {isLogin ? 'Email' : 'Email ID'}
                      </FormLabel>
                      <Input 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        type="email" 
                        placeholder="Enter your email" 
                        borderRadius="md"
                        h="38px"
                        fontSize="sm"
                        focusBorderColor="blue.500"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="700" mb={1}>Password</FormLabel>
                      <InputGroup>
                        <Input 
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          borderRadius="md"
                          h="38px"
                          fontSize="sm"
                          focusBorderColor="blue.500"
                        />
                        <InputRightElement h="38px">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            _hover={{ bg: "transparent" }}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    {!isLogin && (
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700" mb={1}>Confirm Password</FormLabel>
                        <InputGroup>
                          <Input 
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            type={showPassword ? "text" : "password"} 
                            placeholder="Confirm your password" 
                            borderRadius="md"
                            h="38px"
                            fontSize="sm"
                            focusBorderColor="blue.500"
                          />
                          <InputRightElement h="38px">
                            <IconButton
                              variant="ghost"
                              size="sm"
                              icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              _hover={{ bg: "transparent" }}
                            />
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>
                    )}

                    <Button 
                      type="submit"
                      bg="#1a1aab" 
                      color="white" 
                      h="42px"
                      w="full" 
                      borderRadius="md"
                      _hover={{ bg: "#13138a", transform: "scale(1.02)" }}
                      _active={{ transform: "scale(0.98)" }}
                      mt={2}
                      fontSize="sm"
                      fontWeight="600"
                    >
                      {isLogin ? 'Login' : 'Signup'}
                    </Button>
                  </VStack>
                </form>

                <Text textAlign="center" fontSize="xs" color="gray.600" fontWeight="600">
                  {isLogin ? "Don't Have An Account?" : "Already Have An Account?"} {' '}
                  <Link 
                    color="#1a1aab" 
                    fontWeight="700" 
                    onClick={toggleAuth}
                  >
                    {isLogin ? 'Signup' : 'Login'}
                  </Link>
                </Text>
              </VStack>
            </MotionBox>
          </AnimatePresence>
        </Flex>
      </MotionFlex>
    </Flex>
  );
};

export default AuthPage;
