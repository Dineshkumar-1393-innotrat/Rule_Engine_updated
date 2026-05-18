import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Grid,
  GridItem,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { FiShield } from 'react-icons/fi';
import { Badge, Flex } from '@chakra-ui/react';
import VerificationForm from '../components/CertificateVerification/VerificationForm';
import ResultCards from '../components/CertificateVerification/ResultCards';
import HistoryTable from '../components/CertificateVerification/HistoryTable';
import { useVerifyCertificate } from '../hooks/useVerifyCertificate';

const CertificateVerificationPage = () => {
  const location = useLocation();
  const autoFillData = location.state?.autoFill;
  
  const { verify, isLoading, result, error, history, clearHistory } = useVerifyCertificate();
  
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const handleVerify = async (formData) => {
    try {
      await verify(formData);
    } catch (err) {
      console.error("Verification error:", err);
    }
  };

  return (
    <Box bg={bg} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Box>
            <Breadcrumb fontSize="sm" color="gray.500" mb={2}>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink href="#">Certificate Verification</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
            <Flex align="center" gap={3}>
              <Heading size="lg" fontWeight="900" color="blue.600" letterSpacing="tight">
                Certificate Verification
              </Heading>
              {result?.isMock && (
                <Badge colorScheme="orange" variant="solid" borderRadius="full" px={3} py={1} fontSize="xs">
                  DEMO MODE
                </Badge>
              )}
            </Flex>
            <Text color="gray.600" mt={1}>
              Securely verify TBOX device certificates against the platform root CA and identity registry.
            </Text>
          </Box>

          <Grid templateColumns={{ base: "1fr", lg: "400px 1fr" }} gap={8}>
            {/* Left Column: Form */}
            <GridItem>
              <Box 
                bg={cardBg} 
                p={6} 
                borderRadius="2xl" 
                boxShadow="xl" 
                border="1px solid" 
                borderColor="gray.100"
              >
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={1} fontWeight="800">Verify Identity</Heading>
                    <Text fontSize="xs" color="gray.500">Provide device identifiers and the certificate to verify.</Text>
                  </Box>
                  <Divider />
                  <VerificationForm 
                    onSubmit={handleVerify} 
                    isLoading={isLoading} 
                    initialData={autoFillData}
                  />
                </VStack>
              </Box>
            </GridItem>

            {/* Right Column: Results & History */}
            <GridItem>
              <VStack spacing={8} align="stretch">
                {/* Results Section */}
                {(result || error) && (
                  <Box 
                    bg={cardBg} 
                    p={6} 
                    borderRadius="2xl" 
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <ResultCards result={result} />
                  </Box>
                )}

                {/* History Section */}
                <Box 
                  bg={cardBg} 
                  p={6} 
                  borderRadius="2xl" 
                  boxShadow="md"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <HistoryTable history={history} onClear={clearHistory} />
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default CertificateVerificationPage;
