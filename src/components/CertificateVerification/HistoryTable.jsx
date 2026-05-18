import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Badge,
  Text,
  IconButton,
  Tooltip,
  HStack,
  Heading,
  Button
} from '@chakra-ui/react';
import { FiTrash2, FiExternalLink, FiClock } from 'react-icons/fi';

const HistoryTable = ({ history, onClear }) => {
  if (!history || history.length === 0) {
    return (
      <Box p={8} textAlign="center" bg="gray.50" borderRadius="xl" border="1px dashed" borderColor="gray.200">
        <Text color="gray.500">No verification history found.</Text>
      </Box>
    );
  }

  return (
    <Box w="full">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" fontWeight="800" color="gray.700">Verification History</Heading>
        <Button 
          size="sm" 
          variant="ghost" 
          colorScheme="red" 
          leftIcon={<FiTrash2 />}
          onClick={onClear}
        >
          Clear History
        </Button>
      </Flex>
      
      <TableContainer bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th py={4}>Timestamp</Th>
              <Th>VIN</Th>
              <Th>Status</Th>
              <Th>Details</Th>
            </Tr>
          </Thead>
          <Tbody>
            {history.map((entry) => (
              <Tr key={entry.id} _hover={{ bg: 'gray.50' }}>
                <Td>
                  <HStack spacing={2}>
                    <FiClock color="gray.400" />
                    <Text fontSize="xs">{new Date(entry.timestamp).toLocaleString()}</Text>
                  </HStack>
                </Td>
                <Td fontWeight="600" fontSize="xs">{entry.vin}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Badge 
                      colorScheme={entry.status === 'SUCCESS' ? 'green' : 'red'}
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                    >
                      {entry.status}
                    </Badge>
                    {entry.result?.isMock && (
                      <Badge colorScheme="orange" size="xs" variant="outline">MOCK</Badge>
                    )}
                  </HStack>
                </Td>
                <Td>
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    {entry.status === 'SUCCESS' ? 'All checks passed' : entry.error?.message || 'Verification failed'}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Added Flex to import since it's used
import { Flex } from '@chakra-ui/react';

export default HistoryTable;
