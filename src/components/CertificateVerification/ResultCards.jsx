import React from 'react';
import {
  SimpleGrid,
  Box,
  Text,
  Icon,
  Badge,
  HStack,
  VStack,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  ScaleFade
} from '@chakra-ui/react';
import { FiCheck, FiX, FiShield, FiUserCheck, FiAward, FiClock, FiCheckSquare } from 'react-icons/fi';

const CheckCard = ({ label, status, icon }) => {
  const isSuccess = status === true;
  
  return (
    <Box 
      bg="white" 
      p={4} 
      borderRadius="xl" 
      border="1px solid" 
      borderColor={isSuccess ? "green.100" : "red.100"}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
    >
      <HStack spacing={4} align="center">
        <Box 
          p={3} 
          borderRadius="lg" 
          bg={isSuccess ? "green.50" : "red.50"} 
          color={isSuccess ? "green.500" : "red.500"}
        >
          <Icon as={icon} w={6} h={6} />
        </Box>
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px">
            {label}
          </Text>
          <HStack spacing={1}>
            <Icon as={isSuccess ? FiCheck : FiX} color={isSuccess ? "green.500" : "red.500"} />
            <Text fontWeight="800" color={isSuccess ? "green.700" : "red.700"}>
              {isSuccess ? "Passed" : "Failed"}
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

const ResultCards = ({ result }) => {
  if (!result) return null;

  const isOverallSuccess = result.status === "SUCCESS";
  const { checks } = result;

  return (
    <VStack spacing={6} w="full" align="stretch">
      <ScaleFade initialScale={0.9} in={true}>
        <Alert
          status={isOverallSuccess ? "success" : "error"}
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          py={6}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={isOverallSuccess ? "green.200" : "red.200"}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="xl" fontWeight="800">
            {isOverallSuccess ? "Certificate Verified" : "Verification Failed"}
          </AlertTitle>
          <AlertDescription maxWidth="sm" color="gray.600">
            {isOverallSuccess 
              ? "All cryptographic checks passed successfully. The device is authentic." 
              : result.message || "One or more verification checks failed. Please review the details below."}
          </AlertDescription>
        </Alert>
      </ScaleFade>

      <Heading size="md" fontWeight="800" color="gray.700">Verification Details</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        <CheckCard label="CA Chain Verified" status={checks?.caVerified} icon={FiShield} />
        <CheckCard label="CN/Identity Match" status={checks?.cnMatch} icon={FiUserCheck} />
        <CheckCard label="Issuer Valid" status={checks?.issuerValid} icon={FiAward} />
        <CheckCard label="Signature Valid" status={checks?.signatureValid} icon={FiCheckSquare} />
        <CheckCard label="Timestamp Valid" status={checks?.timestampValid} icon={FiClock} />
      </SimpleGrid>
    </VStack>
  );
};

export default ResultCards;
