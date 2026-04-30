import React from 'react';
import { Box, Flex, Image, useBreakpointValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import authBg from '../../assets/auth_bg_ribbon.png';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const AuthLayout = ({ children, reverse = false }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex minH="100vh" bg="black" overflow="hidden" direction={reverse ? 'row-reverse' : 'row'}>
      {/* Visual Side */}
      {!isMobile && (
        <MotionBox 
          flex="1" 
          position="relative" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          initial={{ opacity: 0, x: reverse ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Image 
            src={authBg} 
            alt="Auth Background" 
            objectFit="cover" 
            w="100%" 
            h="100%" 
          />
          <Box 
            position="absolute" 
            top="0" 
            left="0" 
            right="0" 
            bottom="0" 
            bgGradient={reverse ? "linear(to-l, blackAlpha.400, transparent)" : "linear(to-r, blackAlpha.400, transparent)"}
          />
        </MotionBox>
      )}

      {/* Form Side */}
      <MotionFlex 
        flex="1" 
        bg="black" 
        align="center" 
        justify="center" 
        p={8}
        position="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <MotionBox 
          bg="white" 
          w="full" 
          maxW="500px" 
          borderRadius="3xl" 
          p={{ base: 8, md: 12 }}
          boxShadow="2xl"
          position="relative"
          zIndex={1}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {children}
        </MotionBox>
      </MotionFlex>
    </Flex>
  );
};

export default AuthLayout;
